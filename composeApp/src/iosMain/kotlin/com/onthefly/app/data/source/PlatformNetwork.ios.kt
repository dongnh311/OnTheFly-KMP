package com.onthefly.app.data.source

import io.ktor.client.HttpClient
import io.ktor.client.engine.darwin.Darwin
import io.ktor.client.plugins.websocket.WebSockets

actual fun createHttpClient(): HttpClient = HttpClient(Darwin) {
    engine {
        configureRequest {
            setTimeoutInterval(15.0)
        }
    }
    install(WebSockets)
}

actual fun getDevServerBaseUrl(): String = "http://localhost:8080"
