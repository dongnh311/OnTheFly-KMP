package com.onthefly.app.data.source

import io.ktor.client.HttpClient
import io.ktor.client.plugins.websocket.webSocketSession
import io.ktor.client.request.header
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.WebSocketSession
import io.ktor.websocket.close
import io.ktor.websocket.readText
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class WebSocketOptions(
    val headers: Map<String, String> = emptyMap(),
    val autoReconnect: Boolean = true,
    val maxReconnectAttempts: Int = 5,
    val reconnectDelayMs: Long = 1000,
    val pingIntervalMs: Long = 30000
)

interface WebSocketCallback {
    fun onConnected(id: String)
    fun onMessage(id: String, message: String)
    fun onDisconnected(id: String, code: Int, reason: String)
    fun onError(id: String, error: String)
}

class WebSocketSource(
    private val client: HttpClient,
    private val callback: WebSocketCallback,
    private val scope: CoroutineScope
) {
    private val connections = mutableMapOf<String, Job>()
    private val sessions = mutableMapOf<String, WebSocketSession>()
    private val states = mutableMapOf<String, String>()

    fun getState(id: String): String = states[id] ?: "disconnected"

    fun connect(id: String, url: String, options: WebSocketOptions) {
        // Close existing connection with same id
        close(id)

        states[id] = "connecting"
        connections[id] = scope.launch {
            var attempt = 0
            var shouldReconnect = true

            while (shouldReconnect && isActive) {
                try {
                    val session = client.webSocketSession(url) {
                        options.headers.forEach { (key, value) ->
                            header(key, value)
                        }
                    }
                    sessions[id] = session
                    states[id] = "connected"
                    attempt = 0
                    callback.onConnected(id)

                    // Receive loop
                    for (frame in session.incoming) {
                        when (frame) {
                            is Frame.Text -> callback.onMessage(id, frame.readText())
                            is Frame.Binary -> { /* binary not supported in v1 */ }
                            else -> { }
                        }
                    }

                    // Connection closed normally
                    val reason = session.closeReason.await()
                    val code = reason?.code?.toInt() ?: 1000
                    val reasonText = reason?.message ?: ""
                    sessions.remove(id)
                    states[id] = "disconnected"
                    callback.onDisconnected(id, code, reasonText)

                    // Don't reconnect on normal close (code 1000)
                    if (code == CloseReason.Codes.NORMAL.code.toInt()) {
                        shouldReconnect = false
                    }
                } catch (e: CancellationException) {
                    sessions.remove(id)
                    states[id] = "disconnected"
                    shouldReconnect = false
                } catch (e: Exception) {
                    sessions.remove(id)
                    states[id] = "disconnected"
                    callback.onError(id, e.message ?: "WebSocket error")
                }

                // Auto-reconnect with exponential backoff
                if (shouldReconnect && options.autoReconnect && attempt < options.maxReconnectAttempts) {
                    attempt++
                    val backoffDelay = options.reconnectDelayMs * (1L shl (attempt - 1).coerceAtMost(5))
                    println("WebSocketSource: Reconnecting $id in ${backoffDelay}ms (attempt $attempt/${options.maxReconnectAttempts})")
                    states[id] = "connecting"
                    delay(backoffDelay)
                } else if (shouldReconnect) {
                    shouldReconnect = false
                    callback.onDisconnected(id, 1006, "Max reconnect attempts reached")
                }
            }
        }
    }

    fun send(id: String, message: String) {
        val session = sessions[id]
        if (session == null) {
            callback.onError(id, "No active connection for id: $id")
            return
        }
        scope.launch {
            try {
                session.send(Frame.Text(message))
            } catch (e: Exception) {
                callback.onError(id, "Send failed: ${e.message}")
            }
        }
    }

    fun close(id: String, code: Int = 1000, reason: String = "") {
        states[id] = "disconnecting"
        val session = sessions.remove(id)
        val job = connections.remove(id)
        scope.launch {
            try {
                session?.close(CloseReason(code.toShort(), reason))
            } catch (_: Exception) { }
            job?.cancel()
            states[id] = "disconnected"
        }
    }

    fun closeAll() {
        val ids = connections.keys.toList()
        for (id in ids) {
            close(id)
        }
    }
}
