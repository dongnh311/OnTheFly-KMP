package com.onthefly.engine.data

import android.content.Context
import com.onthefly.engine.util.JsonParser
import java.io.File
import java.util.zip.ZipFile
import java.util.zip.ZipInputStream

class AndroidScriptStorage(private val context: Context) : ScriptStorage {

    private val scriptsDir: File get() = File(context.filesDir, "scripts")
    private val prefs by lazy { context.getSharedPreferences("onthefly_scripts", Context.MODE_PRIVATE) }

    override fun ensureInitialized() {
        // If local scripts already exist with a valid version, skip extraction.
        // The SplashScreen handles version-aware extraction before this is called.
        if (scriptsDir.exists() && File(scriptsDir, "version.json").exists()) return
        // Fallback: extract from bundled zip
        extractBundledScripts()
    }

    // ── Zip-based update flow ─────────────────────────────────

    override fun getLocalVersion(): String? {
        val versionFile = File(scriptsDir, "version.json")
        if (!versionFile.exists()) return null
        return try {
            val json = JsonParser.parseObject(versionFile.readText())
            json["globalVersion"] as? String
        } catch (_: Exception) { null }
    }

    override fun getBundledVersion(): String? {
        return try {
            context.assets.open("scripts.zip").use { inputStream ->
                ZipInputStream(inputStream).use { zip ->
                    var entry = zip.nextEntry
                    while (entry != null) {
                        if (entry.name == "version.json") {
                            val content = zip.bufferedReader().readText()
                            val json = JsonParser.parseObject(content)
                            return json["globalVersion"] as? String
                        }
                        zip.closeEntry()
                        entry = zip.nextEntry
                    }
                }
            }
            null
        } catch (_: Exception) { null }
    }

    override fun extractBundledScripts(onProgress: (Float) -> Unit) {
        val tempZip = File(context.cacheDir, "scripts_bundle.zip")
        val tempDir = File(context.filesDir, "scripts_tmp")

        try {
            // Copy zip from assets to temp file (needed for random-access ZipFile)
            context.assets.open("scripts.zip").use { input ->
                tempZip.outputStream().use { output -> input.copyTo(output) }
            }

            // Extract with progress
            extractZipToDir(tempZip, tempDir, onProgress)

            // Atomic swap: delete old → rename temp to scripts
            scriptsDir.deleteRecursively()
            tempDir.renameTo(scriptsDir)

            // Update bundle versions from manifests
            updateVersionsFromManifests()

        } catch (e: Exception) {
            // Extraction failed — clean up temp, keep old scripts if they exist
            tempDir.deleteRecursively()
            println("AndroidScriptStorage: extractBundledScripts failed: ${e.message}")
        } finally {
            tempZip.delete()
        }
    }

    override fun installFromZip(zipFilePath: String, onProgress: (Float) -> Unit) {
        val zipFile = File(zipFilePath)
        if (!zipFile.exists()) return

        val tempDir = File(context.filesDir, "scripts_tmp")

        try {
            extractZipToDir(zipFile, tempDir, onProgress)

            // Atomic swap
            scriptsDir.deleteRecursively()
            tempDir.renameTo(scriptsDir)

            updateVersionsFromManifests()
        } catch (e: Exception) {
            tempDir.deleteRecursively()
            println("AndroidScriptStorage: installFromZip failed: ${e.message}")
        }
    }

    override fun getScriptsDirectory(): String = scriptsDir.absolutePath

    override fun checkAndDownloadRemoteUpdate(serverUrl: String, onProgress: (Float) -> Unit): Boolean {
        return try {
            // Step 1: Check remote version
            val versionConn = java.net.URL("$serverUrl/api/version").openConnection() as java.net.HttpURLConnection
            versionConn.connectTimeout = 5000
            versionConn.readTimeout = 5000
            val versionBody = versionConn.inputStream.bufferedReader().readText()
            versionConn.disconnect()

            val remoteVersion = JsonParser.parseObject(versionBody)["version"] as? String ?: return false
            val localVersion = getLocalVersion()

            if (localVersion != null && localVersion >= remoteVersion) {
                onProgress(1f)
                return false // Already up to date
            }

            // Step 2: Download zip
            val downloadConn = java.net.URL("$serverUrl/api/download").openConnection() as java.net.HttpURLConnection
            downloadConn.connectTimeout = 10000
            downloadConn.readTimeout = 60000
            val totalBytes = downloadConn.contentLength.toLong()

            val tempZip = File(context.cacheDir, "scripts_remote.zip")
            downloadConn.inputStream.use { input ->
                tempZip.outputStream().use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead = 0L
                    var len: Int
                    while (input.read(buffer).also { len = it } != -1) {
                        output.write(buffer, 0, len)
                        bytesRead += len
                        if (totalBytes > 0) onProgress(bytesRead.toFloat() / totalBytes * 0.5f)
                    }
                }
            }
            downloadConn.disconnect()

            // Step 3: Extract and install
            installFromZip(tempZip.absolutePath) { p -> onProgress(0.5f + p * 0.5f) }
            tempZip.delete()
            true
        } catch (e: Exception) {
            println("AndroidScriptStorage: Remote update failed: ${e.message}")
            false
        }
    }

    private fun extractZipToDir(zipFile: File, targetDir: File, onProgress: (Float) -> Unit) {
        targetDir.deleteRecursively()
        targetDir.mkdirs()

        ZipFile(zipFile).use { zip ->
            val entries = zip.entries().toList()
            val total = entries.size.coerceAtLeast(1)
            entries.forEachIndexed { index, entry ->
                val file = File(targetDir, entry.name)
                if (entry.isDirectory) {
                    file.mkdirs()
                } else {
                    file.parentFile?.mkdirs()
                    zip.getInputStream(entry).use { input ->
                        file.outputStream().use { output -> input.copyTo(output) }
                    }
                }
                onProgress((index + 1).toFloat() / total)
            }
        }
    }

    private fun updateVersionsFromManifests() {
        scriptsDir.listFiles()?.filter { it.isDirectory }?.forEach { bundleDir ->
            try {
                val manifest = JsonParser.parseObject(readFile(bundleDir.name, "manifest.json"))
                val version = manifest["version"] as? String ?: ""
                if (version.isNotEmpty()) setVersion(bundleDir.name, version)
            } catch (_: Exception) { }
        }
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
        prefs.getString("version_$bundleName", null)

    override fun setVersion(bundleName: String, version: String) {
        prefs.edit().putString("version_$bundleName", version).apply()
    }

    override fun reset() {
        scriptsDir.deleteRecursively()
        prefs.edit().clear().apply()
        ensureInitialized()
    }

    override fun getKV(key: String): String? = prefs.getString("kv_$key", null)
    override fun setKV(key: String, value: String) { prefs.edit().putString("kv_$key", value).apply() }
    override fun removeKV(key: String) { prefs.edit().remove("kv_$key").apply() }
}
