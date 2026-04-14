package com.onthefly.engine.data

interface ScriptStorage {
    fun ensureInitialized()
    fun readFile(bundleName: String, fileName: String): String
    fun writeFile(bundleName: String, fileName: String, content: String)
    fun bundleExists(bundleName: String): Boolean
    fun listFiles(dirName: String): List<String>
    fun getVersion(bundleName: String): String?
    fun setVersion(bundleName: String, version: String)
    fun reset()
    fun getKV(key: String): String?
    fun setKV(key: String, value: String)
    fun removeKV(key: String)

    // Zip-based update flow
    /** Read globalVersion from local scripts/version.json */
    fun getLocalVersion(): String? = null
    /** Read globalVersion from bundled zip (assets/scripts.zip) */
    fun getBundledVersion(): String? = null
    /** Extract bundled zip to local scripts directory with progress callback */
    fun extractBundledScripts(onProgress: (Float) -> Unit = {}) { ensureInitialized() }
    /** Install scripts from a downloaded zip file path */
    fun installFromZip(zipFilePath: String, onProgress: (Float) -> Unit = {}) {}
    /** Get the local scripts directory path */
    fun getScriptsDirectory(): String = ""
    /** Check remote server for updates, download and install if newer. Returns true if updated. */
    fun checkAndDownloadRemoteUpdate(serverUrl: String, onProgress: (Float) -> Unit = {}): Boolean = false

    // Rollback support
    /** Backup current scripts directory before OTA install */
    fun backupCurrentScripts(): Boolean = false
    /** Restore scripts from backup (rollback) */
    fun rollbackToBackup(): Boolean = false
    /** Check if a backup exists */
    fun hasBackup(): Boolean = false
    /** Delete backup (call after confirming new scripts work) */
    fun clearBackup() {}
}
