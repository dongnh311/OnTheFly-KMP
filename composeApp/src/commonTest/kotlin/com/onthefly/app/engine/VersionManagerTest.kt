package com.onthefly.app.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertFalse

class VersionManagerTest {

    @Test
    fun compareVersions_equal() {
        assertEquals(0, VersionManager.compareVersions("1.0.0", "1.0.0"))
    }

    @Test
    fun compareVersions_lessThan() {
        assertTrue(VersionManager.compareVersions("1.0.0", "2.0.0") < 0)
    }

    @Test
    fun compareVersions_greaterThan() {
        assertTrue(VersionManager.compareVersions("1.2.3", "1.2.2") > 0)
    }

    @Test
    fun compareVersions_shortVersion() {
        assertEquals(0, VersionManager.compareVersions("1.0", "1.0.0"))
    }

    @Test
    fun compareVersions_majorDifference() {
        assertTrue(VersionManager.compareVersions("2.0.0", "1.9.9") > 0)
    }

    @Test
    fun compareVersions_minorDifference() {
        assertTrue(VersionManager.compareVersions("1.1.0", "1.0.9") > 0)
    }

    @Test
    fun checkCompatibility_noConstraints() {
        val result = VersionManager.checkCompatibility(null, null)
        assertTrue(result.compatible)
    }

    @Test
    fun checkCompatibility_withinRange() {
        val result = VersionManager.checkCompatibility("0.5.0", "1.5.0")
        assertTrue(result.compatible)
    }

    @Test
    fun checkCompatibility_exactMin() {
        val result = VersionManager.checkCompatibility("1.0.0", null)
        assertTrue(result.compatible)
    }

    @Test
    fun checkCompatibility_exactMax() {
        val result = VersionManager.checkCompatibility(null, "1.0.0")
        assertTrue(result.compatible)
    }

    @Test
    fun checkCompatibility_tooOld() {
        val result = VersionManager.checkCompatibility("2.0.0", null)
        assertFalse(result.compatible)
        assertTrue(result.reason?.contains("min") == true)
    }

    @Test
    fun checkCompatibility_tooNew() {
        val result = VersionManager.checkCompatibility(null, "0.5.0")
        assertFalse(result.compatible)
        assertTrue(result.reason?.contains("max") == true)
    }
}
