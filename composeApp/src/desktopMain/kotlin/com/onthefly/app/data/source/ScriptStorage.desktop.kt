package com.onthefly.app.data.source

import com.onthefly.app.util.JsonParser
import java.io.File
import java.util.prefs.Preferences

actual class ScriptStorage {

    private val prefs = Preferences.userNodeForPackage(ScriptStorage::class.java)
    private val scriptsDir: File get() {
        val home = System.getProperty("user.home")
        return File(home, ".onthefly/scripts")
    }

    actual fun ensureInitialized() {
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
            devScriptsDir.listFiles()?.filter { it.isDirectory }?.forEach { bundleDir ->
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

    actual fun readFile(bundleName: String, fileName: String): String {
        val file = File(scriptsDir, "$bundleName/$fileName")
        if (!file.exists()) throw IllegalStateException("Script not found: ${file.absolutePath}")
        return file.readText()
    }

    actual fun writeFile(bundleName: String, fileName: String, content: String) {
        val bundleDir = File(scriptsDir, bundleName)
        bundleDir.mkdirs()
        File(bundleDir, fileName).writeText(content)
    }

    actual fun bundleExists(bundleName: String): Boolean =
        File(scriptsDir, "$bundleName/manifest.json").exists()

    actual fun getVersion(bundleName: String): String? =
        prefs.get("version_$bundleName", null)

    actual fun setVersion(bundleName: String, version: String) {
        prefs.put("version_$bundleName", version)
    }

    actual fun reset() {
        scriptsDir.deleteRecursively()
        prefs.clear()
        ensureInitialized()
    }
}
