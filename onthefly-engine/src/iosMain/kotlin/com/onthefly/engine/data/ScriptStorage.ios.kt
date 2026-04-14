package com.onthefly.engine.data

import com.onthefly.engine.util.JsonParser
import com.onthefly.engine.version.VersionManager
import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.*
import platform.darwin.DISPATCH_TIME_FOREVER
import platform.darwin.dispatch_semaphore_create
import platform.darwin.dispatch_semaphore_signal
import platform.darwin.dispatch_semaphore_wait

@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
class IosScriptStorage : ScriptStorage {

    private val fileManager = NSFileManager.defaultManager
    private val scriptsDir: String get() {
        val docs = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, true).first() as String
        return "$docs/scripts"
    }
    private val backupDir: String get() {
        val docs = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, true).first() as String
        return "$docs/scripts_backup"
    }
    private val defaults = NSUserDefaults.standardUserDefaults

    // ─── Core ScriptStorage ───────────────────────────────

    override fun ensureInitialized() {
        if (fileManager.fileExistsAtPath("$scriptsDir/version.json")) return
        copyBundleToLocal()
    }

    private fun copyBundleToLocal() {
        val bundle = NSBundle.mainBundle
        val resourcePath = bundle.resourcePath ?: return
        val scriptsPath = "$resourcePath/scripts"
        if (!fileManager.fileExistsAtPath(scriptsPath)) return

        val tempDir = "${scriptsDir}_tmp"
        fileManager.removeItemAtPath(tempDir, null)
        fileManager.createDirectoryAtPath(tempDir, true, null, null)

        val entries = fileManager.contentsOfDirectoryAtPath(scriptsPath, null) as? List<String> ?: return
        for (entryName in entries) {
            val srcDir = "$scriptsPath/$entryName"
            if (entryName == "screens") {
                val screenEntries = fileManager.contentsOfDirectoryAtPath(srcDir, null) as? List<String> ?: continue
                for (screenName in screenEntries) {
                    copyDirContents("$srcDir/$screenName", "$tempDir/$screenName")
                }
            } else {
                copyDirContents(srcDir, "$tempDir/$entryName")
            }
        }

        // Atomic swap
        fileManager.removeItemAtPath(scriptsDir, null)
        fileManager.moveItemAtPath(tempDir, scriptsDir, null)

        updateVersionsFromManifests()
    }

    private fun copyDirContents(srcDir: String, dstDir: String) {
        fileManager.createDirectoryAtPath(dstDir, true, null, null)
        val files = fileManager.contentsOfDirectoryAtPath(srcDir, null) as? List<String> ?: return
        for (fileName in files) {
            fileManager.copyItemAtPath("$srcDir/$fileName", "$dstDir/$fileName", null)
        }
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

    // ─── Zip-based OTA ────────────────────────────────────

    override fun getLocalVersion(): String? {
        val versionPath = "$scriptsDir/version.json"
        if (!fileManager.fileExistsAtPath(versionPath)) return null
        return try {
            val content = NSString.stringWithContentsOfFile(versionPath, NSUTF8StringEncoding, null) ?: return null
            val json = JsonParser.parseObject(content)
            json["globalVersion"] as? String
        } catch (_: Exception) { null }
    }

    override fun getBundledVersion(): String? {
        val bundle = NSBundle.mainBundle
        val resourcePath = bundle.resourcePath ?: return null

        // Check for scripts.zip first
        val zipPath = "$resourcePath/scripts.zip"
        if (fileManager.fileExistsAtPath(zipPath)) {
            return try {
                val content = ZipExtractor.readFileFromZip(zipPath, "version.json") ?: return null
                val json = JsonParser.parseObject(content)
                json["globalVersion"] as? String
            } catch (_: Exception) { null }
        }

        // Fall back to individual files
        val versionPath = "$resourcePath/scripts/version.json"
        if (!fileManager.fileExistsAtPath(versionPath)) return null
        return try {
            val content = NSString.stringWithContentsOfFile(versionPath, NSUTF8StringEncoding, null) ?: return null
            val json = JsonParser.parseObject(content)
            json["globalVersion"] as? String
        } catch (_: Exception) { null }
    }

    override fun extractBundledScripts(onProgress: (Float) -> Unit) {
        val bundle = NSBundle.mainBundle
        val resourcePath = bundle.resourcePath ?: return

        val zipPath = "$resourcePath/scripts.zip"
        if (fileManager.fileExistsAtPath(zipPath)) {
            val tempDir = "${scriptsDir}_tmp"
            try {
                fileManager.removeItemAtPath(tempDir, null)
                ZipExtractor.extract(zipPath, tempDir, onProgress)
                // Atomic swap
                fileManager.removeItemAtPath(scriptsDir, null)
                fileManager.moveItemAtPath(tempDir, scriptsDir, null)
                updateVersionsFromManifests()
            } catch (e: Exception) {
                fileManager.removeItemAtPath(tempDir, null)
                println("IosScriptStorage: extractBundledScripts failed: ${e.message}")
            }
        } else {
            copyBundleToLocal()
            onProgress(1f)
        }
    }

    override fun installFromZip(zipFilePath: String, onProgress: (Float) -> Unit) {
        if (!fileManager.fileExistsAtPath(zipFilePath)) return

        backupCurrentScripts()

        val tempDir = "${scriptsDir}_tmp"
        try {
            fileManager.removeItemAtPath(tempDir, null)
            ZipExtractor.extract(zipFilePath, tempDir, onProgress)
            // Atomic swap
            fileManager.removeItemAtPath(scriptsDir, null)
            fileManager.moveItemAtPath(tempDir, scriptsDir, null)
            updateVersionsFromManifests()
        } catch (e: Exception) {
            fileManager.removeItemAtPath(tempDir, null)
            println("IosScriptStorage: installFromZip failed: ${e.message}")
        }
    }

    override fun getScriptsDirectory(): String = scriptsDir

    override fun checkAndDownloadRemoteUpdate(serverUrl: String, onProgress: (Float) -> Unit): Boolean {
        return try {
            // Step 1: Check version
            val versionUrl = NSURL.URLWithString("$serverUrl/api/version") ?: return false
            val versionRequest = NSMutableURLRequest.requestWithURL(versionUrl)
            versionRequest.setTimeoutInterval(5.0)

            val versionData = sendSyncRequest(versionRequest) ?: return false
            val versionBody = NSString.create(data = versionData, encoding = NSUTF8StringEncoding) as? String ?: return false
            val remoteVersion = JsonParser.parseObject(versionBody)["version"] as? String ?: return false
            val localVersion = getLocalVersion()

            if (localVersion != null && VersionManager.compareVersions(localVersion, remoteVersion) >= 0) {
                onProgress(1f)
                return false
            }

            // Step 2: Download zip
            val downloadUrl = NSURL.URLWithString("$serverUrl/api/download") ?: return false
            val downloadRequest = NSMutableURLRequest.requestWithURL(downloadUrl)
            downloadRequest.setTimeoutInterval(60.0)

            val zipData = sendSyncRequest(downloadRequest) ?: return false
            onProgress(0.5f)

            // Step 3: Save to temp file and install
            val docs = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, true).first() as String
            val tempZipPath = "$docs/update_download.zip"
            zipData.writeToFile(tempZipPath, true)

            installFromZip(tempZipPath) { extractProgress ->
                onProgress(0.5f + extractProgress * 0.5f)
            }

            fileManager.removeItemAtPath(tempZipPath, null)
            true
        } catch (e: Exception) {
            println("IosScriptStorage: checkAndDownloadRemoteUpdate failed: ${e.message}")
            false
        }
    }

    // ─── Rollback ─────────────────────────────────────────

    override fun backupCurrentScripts(): Boolean {
        if (!fileManager.fileExistsAtPath("$scriptsDir/version.json")) return false
        return try {
            fileManager.removeItemAtPath(backupDir, null)
            fileManager.copyItemAtPath(scriptsDir, backupDir, null)
            true
        } catch (_: Exception) { false }
    }

    override fun rollbackToBackup(): Boolean {
        if (!hasBackup()) return false
        return try {
            fileManager.removeItemAtPath(scriptsDir, null)
            fileManager.moveItemAtPath(backupDir, scriptsDir, null)
            updateVersionsFromManifests()
            true
        } catch (_: Exception) { false }
    }

    override fun hasBackup(): Boolean =
        fileManager.fileExistsAtPath("$backupDir/version.json")

    override fun clearBackup() {
        fileManager.removeItemAtPath(backupDir, null)
    }

    // ─── Helpers ──────────────────────────────────────────

    @Suppress("UNCHECKED_CAST")
    private fun sendSyncRequest(request: NSURLRequest): NSData? {
        var resultData: NSData? = null
        val semaphore = dispatch_semaphore_create(0)

        NSURLSession.sharedSession.dataTaskWithRequest(request) { data, _, _ ->
            resultData = data
            dispatch_semaphore_signal(semaphore)
        }.resume()

        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER)
        return resultData
    }

    private fun updateVersionsFromManifests() {
        val entries = fileManager.contentsOfDirectoryAtPath(scriptsDir, null) as? List<String> ?: return
        for (entry in entries) {
            val manifestPath = "$scriptsDir/$entry/manifest.json"
            if (fileManager.fileExistsAtPath(manifestPath)) {
                try {
                    val content = NSString.stringWithContentsOfFile(manifestPath, NSUTF8StringEncoding, null) ?: continue
                    val manifest = JsonParser.parseObject(content)
                    val version = manifest["version"] as? String ?: continue
                    setVersion(entry, version)
                } catch (_: Exception) { }
            }
        }
    }
}
