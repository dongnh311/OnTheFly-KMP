package com.onthefly.engine.data

import com.onthefly.engine.util.JsonParser
import java.io.File
import java.util.prefs.Preferences

class DesktopScriptStorage : ScriptStorage {

    private val prefs = Preferences.userNodeForPackage(ScriptStorage::class.java)
    private val scriptsDir: File get() {
        val home = System.getProperty("user.home")
        return File(home, ".onthefly/scripts")
    }

    override fun ensureInitialized() {
        // Always re-copy from source to ensure latest scripts are used.
        // Dev server updates (if running) will override these in loadAndRun().
        copyResourcesToLocal()
    }

    private fun copyResourcesToLocal() {
        // Search multiple possible locations for devserver/scripts
        val candidates = listOf(
            File("devserver/scripts"),
            File(System.getProperty("user.dir"), "devserver/scripts"),
            File(System.getProperty("user.dir"), "../devserver/scripts"),
        )

        val devScriptsDir = candidates.firstOrNull { it.exists() && it.isDirectory }
        if (devScriptsDir != null) {
            println("ScriptStorage: Copying scripts from ${devScriptsDir.absolutePath}")
            // Copy special dirs (_base, _libs) from root
            devScriptsDir.listFiles()?.filter { it.isDirectory && it.name.startsWith("_") }?.forEach { bundleDir ->
                copyBundleDir(bundleDir)
            }
            // Copy screen bundles from screens/ subdirectory (flattened)
            val screensDir = File(devScriptsDir, "screens")
            if (screensDir.exists() && screensDir.isDirectory) {
                screensDir.listFiles()?.filter { it.isDirectory }?.forEach { bundleDir ->
                    copyBundleDir(bundleDir)
                }
            }
            // Also copy version.json
            val versionFile = File(devScriptsDir, "version.json")
            if (versionFile.exists()) {
                scriptsDir.mkdirs()
                versionFile.copyTo(File(scriptsDir, "version.json"), overwrite = true)
            }
            println("ScriptStorage: Copied ${scriptsDir.listFiles()?.size ?: 0} bundles")
        } else {
            println("ScriptStorage: WARNING - devserver/scripts not found in any search path")
            candidates.forEach { println("  Tried: ${it.absolutePath} (exists=${it.exists()})") }
        }
    }

    private fun copyBundleDir(bundleDir: File) {
        val dstDir = File(scriptsDir, bundleDir.name)
        dstDir.mkdirs()
        bundleDir.listFiles()?.filter { it.isFile }?.forEach { file ->
            file.copyTo(File(dstDir, file.name), overwrite = true)
        }
        try {
            val manifest = JsonParser.parseObject(readFile(bundleDir.name, "manifest.json"))
            val version = manifest["version"] as? String ?: ""
            if (version.isNotEmpty()) setVersion(bundleDir.name, version)
        } catch (_: Exception) { }
    }

    override fun readFile(bundleName: String, fileName: String): String {
        val file = File(scriptsDir, "$bundleName/$fileName")
        if (!file.exists()) throw IllegalStateException("Script not found: ${file.absolutePath}")
        return file.readText()
    }

    override fun writeFile(bundleName: String, fileName: String, content: String) {
        val bundleDir = File(scriptsDir, bundleName)
        bundleDir.mkdirs()
        File(bundleDir, fileName).writeText(content)
    }

    override fun bundleExists(bundleName: String): Boolean =
        File(scriptsDir, "$bundleName/manifest.json").exists()

    override fun listFiles(dirName: String): List<String> {
        val dir = File(scriptsDir, dirName)
        if (!dir.exists() || !dir.isDirectory) return emptyList()
        return dir.listFiles()?.filter { it.isFile && (it.name.endsWith(".js") || it.name.endsWith(".json")) }
            ?.map { it.name }?.sorted() ?: emptyList()
    }

    override fun getVersion(bundleName: String): String? =
        prefs.get("version_$bundleName", null)

    override fun setVersion(bundleName: String, version: String) {
        prefs.put("version_$bundleName", version)
    }

    override fun reset() {
        scriptsDir.deleteRecursively()
        prefs.clear()
        ensureInitialized()
    }

    override fun getKV(key: String): String? = prefs.get("kv_$key", null)
    override fun setKV(key: String, value: String) { prefs.put("kv_$key", value) }
    override fun removeKV(key: String) { prefs.remove("kv_$key") }
}
