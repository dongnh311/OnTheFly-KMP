package com.onthefly.engine.version

/**
 * Manages version compatibility checks between engine and bundles.
 */
object VersionManager {

    const val ENGINE_VERSION = "1.0.0"

    data class VersionCheck(
        val compatible: Boolean,
        val reason: String? = null
    )

    /**
     * Check if a bundle is compatible with the current engine version.
     */
    fun checkCompatibility(
        minEngineVersion: String?,
        maxEngineVersion: String?
    ): VersionCheck {
        if (minEngineVersion != null && compareVersions(ENGINE_VERSION, minEngineVersion) < 0) {
            return VersionCheck(false, "Engine $ENGINE_VERSION < required min $minEngineVersion")
        }
        if (maxEngineVersion != null && compareVersions(ENGINE_VERSION, maxEngineVersion) > 0) {
            return VersionCheck(false, "Engine $ENGINE_VERSION > max supported $maxEngineVersion")
        }
        return VersionCheck(true)
    }

    /**
     * Compare two semver strings. Returns negative if a < b, 0 if equal, positive if a > b.
     */
    fun compareVersions(a: String, b: String): Int {
        val aParts = a.split(".").map { it.toIntOrNull() ?: 0 }
        val bParts = b.split(".").map { it.toIntOrNull() ?: 0 }
        val maxLen = maxOf(aParts.size, bParts.size)
        for (i in 0 until maxLen) {
            val av = aParts.getOrElse(i) { 0 }
            val bv = bParts.getOrElse(i) { 0 }
            if (av != bv) return av - bv
        }
        return 0
    }
}
