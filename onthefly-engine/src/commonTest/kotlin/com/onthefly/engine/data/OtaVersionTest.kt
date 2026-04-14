package com.onthefly.engine.data

import com.onthefly.engine.version.VersionManager
import kotlin.test.Test
import kotlin.test.assertTrue
import kotlin.test.assertFalse
import kotlin.test.assertEquals

/**
 * Tests for OTA version comparison logic.
 * Ensures semantic version comparison is used (not string comparison).
 */
class OtaVersionTest {

    /** Simulates the OTA check: returns true if remote is newer than local */
    private fun needsUpdate(localVersion: String?, remoteVersion: String): Boolean {
        if (localVersion == null) return true
        return VersionManager.compareVersions(localVersion, remoteVersion) < 0
    }

    @Test
    fun sameVersion_noUpdateNeeded() {
        assertFalse(needsUpdate("1.0.0", "1.0.0"))
    }

    @Test
    fun remoteNewer_updateNeeded() {
        assertTrue(needsUpdate("1.0.0", "1.1.0"))
        assertTrue(needsUpdate("1.0.0", "2.0.0"))
        assertTrue(needsUpdate("1.2.3", "1.2.4"))
    }

    @Test
    fun remoteOlder_noUpdateNeeded() {
        assertFalse(needsUpdate("2.0.0", "1.0.0"))
        assertFalse(needsUpdate("1.1.0", "1.0.0"))
    }

    @Test
    fun nullLocalVersion_alwaysUpdate() {
        assertTrue(needsUpdate(null, "1.0.0"))
        assertTrue(needsUpdate(null, "0.0.1"))
    }

    @Test
    fun semanticVersioning_notStringComparison() {
        // String comparison would say "9.0.0" > "10.0.0" — this must be false
        assertTrue(needsUpdate("9.0.0", "10.0.0"))
        assertFalse(needsUpdate("10.0.0", "9.0.0"))
    }

    @Test
    fun patchVersionBump() {
        assertTrue(needsUpdate("1.0.0", "1.0.1"))
        assertFalse(needsUpdate("1.0.1", "1.0.0"))
    }

    @Test
    fun majorVersionJump() {
        assertTrue(needsUpdate("1.9.9", "2.0.0"))
    }

    @Test
    fun compareVersions_returnsCorrectSign() {
        assertEquals(0, VersionManager.compareVersions("1.0.0", "1.0.0"))
        assertTrue(VersionManager.compareVersions("1.0.0", "1.0.1") < 0)
        assertTrue(VersionManager.compareVersions("1.0.1", "1.0.0") > 0)
    }
}
