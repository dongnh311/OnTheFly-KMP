package com.onthefly.app.data.source

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.websocket.WebSockets
import java.util.concurrent.TimeUnit

actual fun createHttpClient(): HttpClient = HttpClient(OkHttp) {
    engine {
        config {
            connectTimeout(15, TimeUnit.SECONDS)
            readTimeout(15, TimeUnit.SECONDS)
        }
    }
    install(WebSockets)
}

actual fun getDevServerBaseUrl(): String = "http://localhost:8080"
