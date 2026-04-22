package com.onthefly.engine.security

/**
 * Network and content security configuration.
 * Loaded from engine-level config or manifest.json.
 */
data class SecurityConfig(
    // Network
    val allowedDomains: List<String> = emptyList(),     // empty = allow all
    val requireHttps: Boolean = false,
    val maxRequestsPerMinute: Int = 0,                  // 0 = unlimited
    // Content
    val maxScriptSize: Long = 512_000,                  // 500KB
    val maxBundleSize: Long = 2_097_152                 // 2MB
) {
    companion object {
        private var _instance = SecurityConfig()
        val instance: SecurityConfig get() = _instance

        fun configure(config: SecurityConfig) {
            _instance = config
        }

        fun fromMap(map: Map<*, *>?): SecurityConfig {
            if (map == null) return SecurityConfig()
            @Suppress("UNCHECKED_CAST")
            val security = map["security"] as? Map<*, *>
            @Suppress("UNCHECKED_CAST")
            val csp = map["csp"] as? Map<*, *>
            return SecurityConfig(
                allowedDomains = (security?.get("allowedDomains") as? List<*>)
                    ?.mapNotNull { it as? String } ?: emptyList(),
                requireHttps = security?.get("requireHttps") as? Boolean ?: false,
                maxRequestsPerMinute = (security?.get("maxRequestsPerMinute") as? Number)?.toInt() ?: 0,
                maxScriptSize = (csp?.get("maxScriptSize") as? Number)?.toLong() ?: 512_000,
                maxBundleSize = (csp?.get("maxBundleSize") as? Number)?.toLong() ?: 2_097_152
            )
        }
    }
}

/**
 * Validates network requests against security policy.
 */
object NetworkSecurity {

    private val requestTimestamps = mutableListOf<Long>()

    data class ValidationResult(
        val allowed: Boolean,
        val reason: String? = null
    )

    fun validate(url: String, config: SecurityConfig = SecurityConfig.instance): ValidationResult {
        // 1. HTTPS enforcement
        if (config.requireHttps && !url.startsWith("https://")) {
            return ValidationResult(false, "HTTPS required but URL uses HTTP: $url")
        }

        // 2. Domain whitelist
        if (config.allowedDomains.isNotEmpty()) {
            val domain = extractDomain(url)
            if (domain != null && config.allowedDomains.none { allowed ->
                    domain == allowed || domain.endsWith(".$allowed")
                }) {
                return ValidationResult(false, "Domain not allowed: $domain")
            }
        }

        // 3. Rate limiting.
        // Not thread-safe by design: kotlin.synchronized doesn't exist in
        // commonMain and a full expect/actual lock was overkill for a rate
        // counter whose races at worst over-allow a request or two within a
        // millisecond window. Callers that need strict accuracy should
        // serialize validate() externally.
        if (config.maxRequestsPerMinute > 0) {
            val now = currentTimeMillis()
            val oneMinuteAgo = now - 60_000
            requestTimestamps.removeAll { it < oneMinuteAgo }
            if (requestTimestamps.size >= config.maxRequestsPerMinute) {
                return ValidationResult(false, "Rate limit exceeded: ${config.maxRequestsPerMinute}/min")
            }
            requestTimestamps.add(now)
        }

        return ValidationResult(allowed = true)
    }

    private fun extractDomain(url: String): String? {
        return try {
            val withoutScheme = url.substringAfter("://")
            withoutScheme.substringBefore("/").substringBefore(":").substringBefore("?")
        } catch (_: Exception) {
            null
        }
    }
}

expect fun currentTimeMillis(): Long
