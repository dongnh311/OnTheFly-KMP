package com.onthefly.engine.error

import com.onthefly.engine.util.escapeJson

/**
 * Configuration for error handling, loaded from manifest.json "errorConfig".
 */
data class ErrorConfig(
    val showFallbackUI: Boolean = true,
    val fallbackScreen: String? = null,
    val reportErrors: Boolean = true,
    val maxRetries: Int = 2
) {
    companion object {
        fun fromMap(map: Map<*, *>?): ErrorConfig {
            if (map == null) return ErrorConfig()
            return ErrorConfig(
                showFallbackUI = map["showFallbackUI"] as? Boolean ?: true,
                fallbackScreen = map["fallbackScreen"] as? String,
                reportErrors = map["reportErrors"] as? Boolean ?: true,
                maxRetries = (map["maxRetries"] as? Number)?.toInt() ?: 2
            )
        }
    }
}

/**
 * Represents a JS engine error to be dispatched to onError().
 */
data class EngineError(
    val type: String,         // "js_error", "network_error", "script_error", "bridge_error", "timeout_error"
    val message: String,
    val code: Int? = null,
    val details: Map<String, Any?> = emptyMap()
) {
    fun toJson(): String {
        val sb = StringBuilder("{")
        sb.append("\"type\":\"${type.escapeJson()}\",")
        sb.append("\"message\":\"${message.escapeJson()}\"")
        if (code != null) sb.append(",\"code\":$code")
        for ((k, v) in details) {
            sb.append(",\"${k.escapeJson()}\":")
            when (v) {
                is String -> sb.append("\"${v.escapeJson()}\"")
                is Number -> sb.append(v)
                is Boolean -> sb.append(v)
                null -> sb.append("null")
                else -> sb.append("\"${v.toString().escapeJson()}\"")
            }
        }
        sb.append("}")
        return sb.toString()
    }
}
