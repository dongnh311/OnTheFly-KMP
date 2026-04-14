package com.onthefly.engine.data

import kotlin.test.*

class RollbackTest {

    private lateinit var storage: FakeScriptStorage

    @BeforeTest
    fun setup() {
        storage = FakeScriptStorage()
        // Set up initial scripts
        storage.putFile("home", "manifest.json", """{"name": "Home", "version": "1.0.0"}""")
        storage.putFile("home", "main.js", "function onCreateView() { render(); }")
        storage.setLocalVersionValue("1.0.0")
    }

    @Test
    fun backup_createsBackup() {
        assertTrue(storage.backupCurrentScripts())
        assertTrue(storage.hasBackup())
    }

    @Test
    fun backup_emptyStorage_returnsFalse() {
        val empty = FakeScriptStorage()
        assertFalse(empty.backupCurrentScripts())
        assertFalse(empty.hasBackup())
    }

    @Test
    fun rollback_restoresFromBackup() {
        // Backup original
        storage.backupCurrentScripts()

        // Simulate OTA: overwrite with new content
        storage.putFile("home", "main.js", "BROKEN SCRIPT")
        storage.setLocalVersionValue("2.0.0")

        // Verify new content is active
        assertEquals("BROKEN SCRIPT", storage.readFile("home", "main.js"))

        // Rollback
        assertTrue(storage.rollbackToBackup())

        // Verify original content restored
        assertEquals("function onCreateView() { render(); }", storage.readFile("home", "main.js"))
        assertFalse(storage.hasBackup()) // backup consumed
    }

    @Test
    fun rollback_noBackup_returnsFalse() {
        assertFalse(storage.rollbackToBackup())
    }

    @Test
    fun clearBackup_removesBackup() {
        storage.backupCurrentScripts()
        assertTrue(storage.hasBackup())

        storage.clearBackup()
        assertFalse(storage.hasBackup())
    }

    @Test
    fun clearBackup_noBackup_noError() {
        assertFalse(storage.hasBackup())
        storage.clearBackup() // should not throw
        assertFalse(storage.hasBackup())
    }

    @Test
    fun backupAndRollback_cycle() {
        // Backup v1
        storage.backupCurrentScripts()

        // Install v2
        storage.putFile("home", "main.js", "v2 content")
        storage.setLocalVersionValue("2.0.0")
        assertEquals("v2 content", storage.readFile("home", "main.js"))

        // Rollback to v1
        assertTrue(storage.rollbackToBackup())
        assertEquals("function onCreateView() { render(); }", storage.readFile("home", "main.js"))

        // No more backup after rollback
        assertFalse(storage.hasBackup())
        assertFalse(storage.rollbackToBackup())
    }
}
