package com.onthefly.app.data.source

import com.onthefly.app.util.JsonParser
import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.isSuccess

expect fun getDevServerBaseUrl(): String

object DevServerSource {

    var enabled: Boolean = true
    private val client by lazy { createHttpClient() }
    private var lastGlobalVersion: String? = null

    private val baseUrl: String get() = getDevServerBaseUrl()

    suspend fun fetchFile(bundleName: String, fileName: String): String? {
        if (!enabled) return null
        return try {
            val response = client.get("$baseUrl/scripts/$bundleName/$fileName")
            if (response.status.isSuccess()) response.bodyAsText() else null
        } catch (_: Exception) { null }
    }

    suspend fun fetchVersionManifest(): Map<String, Any?>? {
        if (!enabled) return null
        return try {
            val response = client.get("$baseUrl/version")
            if (response.status.isSuccess()) JsonParser.parseObject(response.bodyAsText()) else null
        } catch (e: Exception) {
            println("DEVSERVER ERROR: ${e.message}")
            null
        }
    }

    suspend fun hasChanges(): Boolean {
        if (!enabled) return false
        return try {
            val manifest = fetchVersionManifest() ?: return false
            val newVersion = manifest["globalVersion"] as? String ?: return false
            val changed = lastGlobalVersion != null && lastGlobalVersion != newVersion
            lastGlobalVersion = newVersion
            changed
        } catch (_: Exception) { false }
    }
}
