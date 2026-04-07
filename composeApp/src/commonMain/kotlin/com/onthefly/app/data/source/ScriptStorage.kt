package com.onthefly.app.data.source

expect class ScriptStorage {
    fun ensureInitialized()
    fun readFile(bundleName: String, fileName: String): String
    fun writeFile(bundleName: String, fileName: String, content: String)
    fun bundleExists(bundleName: String): Boolean
    fun listFiles(dirName: String): List<String>
    fun getVersion(bundleName: String): String?
    fun setVersion(bundleName: String, version: String)
    fun reset()

    // Key-value storage for persistent data
    fun getKV(key: String): String?
    fun setKV(key: String, value: String)
    fun removeKV(key: String)
}
