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
        if (prefs.getBoolean("scripts_initialized", false)) return
        copyResourcesToLocal()
        prefs.putBoolean("scripts_initialized", true)
    }

    private fun copyResourcesToLocal() {
        // On desktop, scripts are loaded from compose resources or a local directory
        // For dev, copy from the project's devserver/scripts directory if available
        val devScriptsDir = File("devserver/scripts")
        if (devScriptsDir.exists()) {
            devScriptsDir.listFiles()?.filter { it.isDirectory }?.forEach { bundleDir ->
                val dstDir = File(scriptsDir, bundleDir.name)
                dstDir.mkdirs()
                bundleDir.listFiles()?.forEach { file ->
                    file.copyTo(File(dstDir, file.name), overwrite = true)
                }
                try {
                    val manifest = JsonParser.parseObject(readFile(bundleDir.name, "manifest.json"))
                    val version = manifest["version"] as? String ?: ""
                    if (version.isNotEmpty()) setVersion(bundleDir.name, version)
                } catch (_: Exception) { }
            }
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
