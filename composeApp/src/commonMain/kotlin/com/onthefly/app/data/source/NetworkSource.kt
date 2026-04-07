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
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeout

data class NetworkRequest(
    val requestId: String,
    val url: String,
    val method: String = "GET",
    val headers: Map<String, String> = emptyMap(),
    val body: String? = null,
    val timeout: Long = 30000L,
    val retry: Int = 0,
    val retryDelay: Long = 1000L
)

data class NetworkResponse(
    val requestId: String,
    val status: Int,
    val body: String,
    val error: String? = null,
    val url: String? = null
) {
    val isError: Boolean get() = status < 0 || error != null

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

    fun toErrorJson(): String {
        val map = mutableMapOf<String, Any?>(
            "type" to "network_error",
            "message" to (error ?: "HTTP $status"),
            "status" to status,
            "url" to url,
            "requestId" to requestId
        )
        return JsonParser.toJsonString(map)
    }
}

expect fun createHttpClient(): HttpClient

object NetworkSource {

    private val client by lazy { createHttpClient() }
    private val pendingRequests = mutableMapOf<String, Job>()

    suspend fun execute(request: NetworkRequest): NetworkResponse {
        var lastError: Exception? = null
        val maxAttempts = request.retry + 1

        for (attempt in 1..maxAttempts) {
            try {
                val response = withTimeout(request.timeout) {
                    client.request(request.url) {
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
                }
                return NetworkResponse(
                    requestId = request.requestId,
                    status = response.status.value,
                    body = response.bodyAsText(),
                    url = request.url
                )
            } catch (e: CancellationException) {
                return NetworkResponse(
                    requestId = request.requestId,
                    status = -2,
                    body = "",
                    error = "Request cancelled",
                    url = request.url
                )
            } catch (e: Exception) {
                lastError = e
                if (attempt < maxAttempts) {
                    println("NetworkSource: Retry $attempt/$maxAttempts for ${request.url}: ${e.message}")
                    delay(request.retryDelay * attempt)
                }
            }
        }

        val isTimeout = lastError?.message?.contains("timed out", ignoreCase = true) == true ||
                lastError?.message?.contains("timeout", ignoreCase = true) == true
        return NetworkResponse(
            requestId = request.requestId,
            status = if (isTimeout) -3 else -1,
            body = "",
            error = lastError?.message ?: "Unknown error",
            url = request.url
        )
    }

    fun trackRequest(requestId: String, job: Job) {
        pendingRequests[requestId] = job
    }

    fun cancelRequest(requestId: String): Boolean {
        val job = pendingRequests.remove(requestId)
        if (job != null) {
            job.cancel()
            return true
        }
        return false
    }

    fun completeRequest(requestId: String) {
        pendingRequests.remove(requestId)
    }
}
