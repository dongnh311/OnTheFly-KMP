package com.onthefly.engine.data

import com.onthefly.engine.util.JsonParser
import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.*

@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
class IosScriptStorage : ScriptStorage {

    private val fileManager = NSFileManager.defaultManager
    private val scriptsDir: String get() {
        val docs = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, true).first() as String
        return "$docs/scripts"
    }
    private val defaults = NSUserDefaults.standardUserDefaults

    override fun ensureInitialized() {
        // Always re-copy from bundle to ensure latest bundled scripts are used.
        // Dev server updates (if running) will override these in loadAndRun().
        copyBundleToLocal()
    }

    private fun copyBundleToLocal() {
        val bundle = NSBundle.mainBundle
        val resourcePath = bundle.resourcePath ?: return
        val scriptsPath = "$resourcePath/scripts"
        if (!fileManager.fileExistsAtPath(scriptsPath)) return

        val entries = fileManager.contentsOfDirectoryAtPath(scriptsPath, null) as? List<String> ?: return
        for (entryName in entries) {
            val srcDir = "$scriptsPath/$entryName"
            if (entryName == "screens") {
                // Flatten: screens/home → home
                val screenEntries = fileManager.contentsOfDirectoryAtPath(srcDir, null) as? List<String> ?: continue
                for (screenName in screenEntries) {
                    copyBundleFiles("$srcDir/$screenName", screenName)
                }
            } else {
                copyBundleFiles(srcDir, entryName)
            }
        }
    }

    private fun copyBundleFiles(srcDir: String, bundleName: String) {
        val dstDir = "$scriptsDir/$bundleName"
        fileManager.createDirectoryAtPath(dstDir, true, null, null)

        val files = fileManager.contentsOfDirectoryAtPath(srcDir, null) as? List<String> ?: return
        for (fileName in files) {
            val src = "$srcDir/$fileName"
            val dst = "$dstDir/$fileName"
            fileManager.copyItemAtPath(src, dst, null)
        }
        try {
            val manifest = JsonParser.parseObject(readFile(bundleName, "manifest.json"))
            val version = manifest["version"] as? String ?: ""
            if (version.isNotEmpty()) setVersion(bundleName, version)
        } catch (_: Exception) { }
    }

    override fun readFile(bundleName: String, fileName: String): String {
        val path = "$scriptsDir/$bundleName/$fileName"
        return NSString.stringWithContentsOfFile(path, NSUTF8StringEncoding, null)
            ?: throw IllegalStateException("Script not found: $path")
    }

    override fun writeFile(bundleName: String, fileName: String, content: String) {
        val dir = "$scriptsDir/$bundleName"
        fileManager.createDirectoryAtPath(dir, true, null, null)
        (content as NSString).writeToFile("$dir/$fileName", true, NSUTF8StringEncoding, null)
    }

    override fun bundleExists(bundleName: String): Boolean =
        fileManager.fileExistsAtPath("$scriptsDir/$bundleName/manifest.json")

    override fun listFiles(dirName: String): List<String> {
        val path = "$scriptsDir/$dirName"
        val contents = fileManager.contentsOfDirectoryAtPath(path, null) as? List<String>
            ?: return emptyList()
        return contents.filter { it.endsWith(".js") || it.endsWith(".json") }.sorted()
    }

    override fun getVersion(bundleName: String): String? =
        defaults.stringForKey("version_$bundleName")

    override fun setVersion(bundleName: String, version: String) {
        defaults.setObject(version, "version_$bundleName")
    }

    override fun reset() {
        fileManager.removeItemAtPath(scriptsDir, null)
        defaults.removeObjectForKey("scripts_initialized")
        ensureInitialized()
    }

    override fun getKV(key: String): String? = defaults.stringForKey("kv_$key")
    override fun setKV(key: String, value: String) { defaults.setObject(value, "kv_$key") }
    override fun removeKV(key: String) { defaults.removeObjectForKey("kv_$key") }
}
