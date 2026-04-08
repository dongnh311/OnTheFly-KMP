package com.onthefly.engine.core


import com.onthefly.engine.security.SecurityConfig
import com.onthefly.engine.security.NetworkSecurity
import kotlin.test.Test
import kotlin.test.assertTrue
import kotlin.test.assertFalse
import kotlin.test.assertEquals

class SecurityConfigTest {

    @Test
    fun validate_allowsAll_byDefault() {
        val config = SecurityConfig()
        val result = NetworkSecurity.validate("http://example.com/api", config)
        assertTrue(result.allowed)
    }

    @Test
    fun validate_httpsRequired_blocksHttp() {
        val config = SecurityConfig(requireHttps = true)
        val result = NetworkSecurity.validate("http://example.com", config)
        assertFalse(result.allowed)
        assertTrue(result.reason?.contains("HTTPS") == true)
    }

    @Test
    fun validate_httpsRequired_allowsHttps() {
        val config = SecurityConfig(requireHttps = true)
        val result = NetworkSecurity.validate("https://example.com", config)
        assertTrue(result.allowed)
    }

    @Test
    fun validate_allowedDomains_matchesExact() {
        val config = SecurityConfig(allowedDomains = listOf("example.com"))
        val result = NetworkSecurity.validate("https://example.com/api", config)
        assertTrue(result.allowed)
    }

    @Test
    fun validate_allowedDomains_matchesSubdomain() {
        val config = SecurityConfig(allowedDomains = listOf("example.com"))
        val result = NetworkSecurity.validate("https://api.example.com/v1", config)
        assertTrue(result.allowed)
    }

    @Test
    fun validate_allowedDomains_blocksDifferentDomain() {
        val config = SecurityConfig(allowedDomains = listOf("example.com"))
        val result = NetworkSecurity.validate("https://evil.com/api", config)
        assertFalse(result.allowed)
        assertTrue(result.reason?.contains("not allowed") == true)
    }

    @Test
    fun validate_emptyAllowedDomains_allowsAll() {
        val config = SecurityConfig(allowedDomains = emptyList())
        val result = NetworkSecurity.validate("https://anything.com", config)
        assertTrue(result.allowed)
    }

    @Test
    fun fromMap_null_returnsDefaults() {
        val config = SecurityConfig.fromMap(null)
        assertEquals(emptyList(), config.allowedDomains)
        assertFalse(config.requireHttps)
        assertEquals(0, config.maxRequestsPerMinute)
    }

    @Test
    fun fromMap_withSecurityBlock() {
        val map = mapOf(
            "security" to mapOf(
                "allowedDomains" to listOf("api.com", "cdn.com"),
                "requireHttps" to true,
                "maxRequestsPerMinute" to 60
            )
        )
        val config = SecurityConfig.fromMap(map)
        assertEquals(listOf("api.com", "cdn.com"), config.allowedDomains)
        assertTrue(config.requireHttps)
        assertEquals(60, config.maxRequestsPerMinute)
    }

    @Test
    fun fromMap_withCspBlock() {
        val map = mapOf(
            "csp" to mapOf(
                "maxScriptSize" to 1024000,
                "maxBundleSize" to 4096000
            )
        )
        val config = SecurityConfig.fromMap(map)
        assertEquals(1024000L, config.maxScriptSize)
        assertEquals(4096000L, config.maxBundleSize)
    }
}
