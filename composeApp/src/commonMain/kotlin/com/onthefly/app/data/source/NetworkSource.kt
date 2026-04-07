package com.onthefly.app.data.source

import com.onthefly.app.util.JsonParser
import io.ktor.client.HttpClient
import io.ktor.client.request.headers
import io.ktor.client.request.request
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpMethod
import io.ktor.http.contentType

data class NetworkRequest(
    val requestId: String,
    val url: String,
    val method: String = "GET",
    val headers: Map<String, String> = emptyMap(),
    val body: String? = null
)

data class NetworkResponse(
    val requestId: String,
    val status: Int,
    val body: String,
    val error: String? = null
) {
    fun toJson(): String {
        val map = mutableMapOf<String, Any?>(
            "requestId" to requestId,
            "status" to status,
            "error" to error
        )
        // Try to parse body as object, fallback to string
        try {
            map["body"] = JsonParser.parseObject(body)
        } catch (_: Exception) {
            map["body"] = body
        }
        return JsonParser.toJsonString(map)
    }
}

expect fun createHttpClient(): HttpClient

object NetworkSource {

    private val client by lazy { createHttpClient() }

    suspend fun execute(request: NetworkRequest): NetworkResponse {
        return try {
            val response = client.request(request.url) {
                method = when (request.method.uppercase()) {
                    "POST" -> HttpMethod.Post
                    "PUT" -> HttpMethod.Put
                    "PATCH" -> HttpMethod.Patch
                    "DELETE" -> HttpMethod.Delete
                    else -> HttpMethod.Get
                }
                headers {
                    request.headers.forEach { (key, value) -> append(key, value) }
                }
                if (request.body != null && request.method.uppercase() in listOf("POST", "PUT", "PATCH")) {
                    contentType(ContentType.Application.Json)
                    setBody(request.body)
                }
            }
            NetworkResponse(
                requestId = request.requestId,
                status = response.status.value,
                body = response.bodyAsText()
            )
        } catch (e: Exception) {
            NetworkResponse(
                requestId = request.requestId,
                status = -1,
                body = "",
                error = e.message ?: "Unknown error"
            )
        }
    }
}
