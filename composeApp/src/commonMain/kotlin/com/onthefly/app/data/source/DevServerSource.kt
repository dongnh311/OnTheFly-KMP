package com.onthefly.app.data.source

import com.onthefly.app.util.JsonParser
import io.ktor.client.plugins.websocket.webSocketSession
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.isSuccess
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

expect fun getDevServerBaseUrl(): String

object DevServerSource {

    var enabled: Boolean = true
    var useWebSocket: Boolean = true
    private val client by lazy { createHttpClient() }
    private var lastGlobalVersion: String? = null
    private var wsJob: Job? = null

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

    /**
     * Connect to dev server via WebSocket for push-based reload.
     * Falls back to polling if WS is unavailable.
     */
    fun startWsListener(scope: CoroutineScope, onReload: () -> Unit) {
        if (!useWebSocket || !enabled) return

        wsJob?.cancel()
        wsJob = scope.launch {
            try {
                val wsUrl = baseUrl.replace("http://", "ws://").replace("https://", "wss://")
                    .replace(":8080", ":8081")
                val session = client.webSocketSession(wsUrl)
                println("DevServer: WS connected to $wsUrl")

                while (isActive) {
                    val frame = session.incoming.receiveCatching().getOrNull() ?: break
                    if (frame is Frame.Text) {
                        val text = frame.readText()
                        try {
                            val data = JsonParser.parseObject(text)
                            if (data["type"] == "reload") {
                                println("DevServer: WS push reload")
                                onReload()
                            }
                        } catch (_: Exception) { }
                    }
                }
                println("DevServer: WS disconnected, falling back to polling")
                useWebSocket = false
            } catch (e: Exception) {
                println("DevServer: WS connection failed (${e.message}), using polling")
                useWebSocket = false
            }
        }
    }
}
