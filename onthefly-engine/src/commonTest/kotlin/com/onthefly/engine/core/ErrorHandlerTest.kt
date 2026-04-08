package com.onthefly.engine.core


import com.onthefly.engine.error.EngineError
import com.onthefly.engine.error.ErrorConfig
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertNull

class ErrorHandlerTest {

    @Test
    fun errorConfig_fromMap_null_returnsDefaults() {
        val config = ErrorConfig.fromMap(null)
        assertTrue(config.showFallbackUI)
        assertNull(config.fallbackScreen)
        assertTrue(config.reportErrors)
        assertEquals(2, config.maxRetries)
    }

    @Test
    fun errorConfig_fromMap_withAllFields() {
        val map = mapOf(
            "showFallbackUI" to false,
            "fallbackScreen" to "error-page",
            "reportErrors" to false,
            "maxRetries" to 5
        )
        val config = ErrorConfig.fromMap(map)
        assertEquals(false, config.showFallbackUI)
        assertEquals("error-page", config.fallbackScreen)
        assertEquals(false, config.reportErrors)
        assertEquals(5, config.maxRetries)
    }

    @Test
    fun errorConfig_fromMap_partial() {
        val map = mapOf("maxRetries" to 10)
        val config = ErrorConfig.fromMap(map)
        assertTrue(config.showFallbackUI) // default
        assertEquals(10, config.maxRetries)
    }

    @Test
    fun engineError_toJson_basic() {
        val error = EngineError(type = "js_error", message = "test error")
        val json = error.toJson()
        assertTrue(json.contains("\"type\":\"js_error\""))
        assertTrue(json.contains("\"message\":\"test error\""))
    }

    @Test
    fun engineError_toJson_withCode() {
        val error = EngineError(type = "network_error", message = "timeout", code = 408)
        val json = error.toJson()
        assertTrue(json.contains("\"code\":408"))
    }

    @Test
    fun engineError_toJson_withDetails() {
        val error = EngineError(
            type = "js_error",
            message = "fail",
            details = mapOf("url" to "https://api.com", "status" to 500, "retry" to true, "extra" to null)
        )
        val json = error.toJson()
        assertTrue(json.contains("\"url\":\"https://api.com\""))
        assertTrue(json.contains("\"status\":500"))
        assertTrue(json.contains("\"retry\":true"))
        assertTrue(json.contains("\"extra\":null"))
    }

    @Test
    fun engineError_toJson_escapesSpecialChars() {
        val error = EngineError(type = "js_error", message = "line1\nline2\t\"quoted\"")
        val json = error.toJson()
        assertTrue(json.contains("\\n"))
        assertTrue(json.contains("\\t"))
        assertTrue(json.contains("\\\"quoted\\\""))
    }
}
