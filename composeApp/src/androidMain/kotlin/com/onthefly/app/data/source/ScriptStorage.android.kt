package com.onthefly.app.data.source

import android.content.Context
import com.onthefly.app.util.JsonParser
import java.io.File

actual class ScriptStorage(private val context: Context) {

    private val scriptsDir: File get() = File(context.filesDir, "scripts")
    private val prefs by lazy { context.getSharedPreferences("onthefly_scripts", Context.MODE_PRIVATE) }

    actual fun ensureInitialized() {
        // Always re-copy from assets to ensure latest bundled scripts are used.
        // Dev server updates (if running) will override these in loadAndRun().
        copyAssetsToLocal()
    }

    private fun copyAssetsToLocal() {
        val assetManager = context.assets
        try {
            val entries = assetManager.list("scripts") ?: return
            for (entry in entries) {
                if (entry == "screens") {
                    // Flatten: screens/home → home
                    val screens = assetManager.list("scripts/screens") ?: continue
                    for (screen in screens) {
                        copyAssetBundle(assetManager, "scripts/screens/$screen", screen)
                    }
                } else {
                    copyAssetBundle(assetManager, "scripts/$entry", entry)
                }
            }
        } catch (_: Exception) { }
    }

    private fun copyAssetBundle(assetManager: android.content.res.AssetManager, assetPath: String, bundleName: String) {
        val bundleDir = File(scriptsDir, bundleName)
        bundleDir.mkdirs()
        val files = assetManager.list(assetPath) ?: return
        for (fileName in files) {
            val subItems = assetManager.list("$assetPath/$fileName")
            if (subItems != null && subItems.isNotEmpty()) continue
            try {
                assetManager.open("$assetPath/$fileName").use { input ->
                    File(bundleDir, fileName).outputStream().use { output -> input.copyTo(output) }
                }
            } catch (_: Exception) { }
        }
        try {
            val manifest = JsonParser.parseObject(readFile(bundleName, "manifest.json"))
            val version = manifest["version"] as? String ?: ""
            if (version.isNotEmpty()) setVersion(bundleName, version)
        } catch (_: Exception) { }
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

    actual fun listFiles(dirName: String): List<String> {
        val dir = File(scriptsDir, dirName)
        if (!dir.exists() || !dir.isDirectory) return emptyList()
        return dir.listFiles()?.filter { it.isFile && (it.name.endsWith(".js") || it.name.endsWith(".json")) }
            ?.map { it.name }?.sorted() ?: emptyList()
    }

    actual fun getVersion(bundleName: String): String? =
        prefs.getString("version_$bundleName", null)

    actual fun setVersion(bundleName: String, version: String) {
        prefs.edit().putString("version_$bundleName", version).apply()
    }

    actual fun reset() {
        scriptsDir.deleteRecursively()
        prefs.edit().clear().apply()
        ensureInitialized()
    }

    actual fun getKV(key: String): String? = prefs.getString("kv_$key", null)
    actual fun setKV(key: String, value: String) { prefs.edit().putString("kv_$key", value).apply() }
    actual fun removeKV(key: String) { prefs.edit().remove("kv_$key").apply() }
}
