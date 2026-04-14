package com.onthefly.engine.data

/**
 * In-memory implementation of ScriptStorage for unit testing.
 */
class FakeScriptStorage : ScriptStorage {

    private val files = mutableMapOf<String, MutableMap<String, String>>()
    private val versions = mutableMapOf<String, String>()
    private val kv = mutableMapOf<String, String>()
    private var localVersion: String? = null
    private var initialized = false

    // Backup state for rollback testing
    private var backupFiles: Map<String, Map<String, String>>? = null
    private var backupVersion: String? = null

    fun putFile(bundle: String, name: String, content: String) {
        files.getOrPut(bundle) { mutableMapOf() }[name] = content
    }

    fun setLocalVersionValue(version: String?) {
        localVersion = version
    }

    override fun ensureInitialized() {
        initialized = true
    }

    override fun readFile(bundleName: String, fileName: String): String {
        return files[bundleName]?.get(fileName)
            ?: throw IllegalStateException("File not found: $bundleName/$fileName")
    }

    override fun writeFile(bundleName: String, fileName: String, content: String) {
        files.getOrPut(bundleName) { mutableMapOf() }[fileName] = content
    }

    override fun bundleExists(bundleName: String): Boolean {
        return files.containsKey(bundleName)
    }

    override fun listFiles(dirName: String): List<String> {
        return files[dirName]?.keys?.toList() ?: emptyList()
    }

    override fun getVersion(bundleName: String): String? = versions[bundleName]

    override fun setVersion(bundleName: String, version: String) {
        versions[bundleName] = version
    }

    override fun reset() {
        files.clear()
        versions.clear()
        kv.clear()
        localVersion = null
        initialized = false
    }

    override fun getKV(key: String): String? = kv[key]
    override fun setKV(key: String, value: String) { kv[key] = value }
    override fun removeKV(key: String) { kv.remove(key) }

    override fun getLocalVersion(): String? = localVersion

    override fun backupCurrentScripts(): Boolean {
        if (files.isEmpty()) return false
        backupFiles = files.mapValues { it.value.toMap() }
        backupVersion = localVersion
        return true
    }

    override fun rollbackToBackup(): Boolean {
        val backup = backupFiles ?: return false
        files.clear()
        for ((bundle, fileMap) in backup) {
            files[bundle] = fileMap.toMutableMap()
        }
        localVersion = backupVersion
        backupFiles = null
        backupVersion = null
        return true
    }

    override fun hasBackup(): Boolean = backupFiles != null

    override fun clearBackup() {
        backupFiles = null
        backupVersion = null
    }
}
