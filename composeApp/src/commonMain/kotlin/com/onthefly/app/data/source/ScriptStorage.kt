package com.onthefly.app.data.source

expect class ScriptStorage {
    fun ensureInitialized()
    fun readFile(bundleName: String, fileName: String): String
    fun writeFile(bundleName: String, fileName: String, content: String)
    fun bundleExists(bundleName: String): Boolean
    fun getVersion(bundleName: String): String?
    fun setVersion(bundleName: String, version: String)
    fun reset()
}
