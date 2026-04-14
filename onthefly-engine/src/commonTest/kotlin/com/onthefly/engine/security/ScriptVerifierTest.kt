package com.onthefly.engine.security

import com.onthefly.engine.data.FakeScriptStorage
import kotlin.test.*

class ScriptVerifierTest {

    private lateinit var storage: FakeScriptStorage

    @BeforeTest
    fun setup() {
        storage = FakeScriptStorage()
        ScriptVerifier.enabled = true
    }

    @AfterTest
    fun teardown() {
        ScriptVerifier.enabled = false
    }

    @Test
    fun verify_disabled_returnsSuccess() {
        ScriptVerifier.enabled = false
        // No manifest at all — would fail if enabled
        val result = ScriptVerifier.verify("test-bundle", storage)
        assertTrue(result.success)
        assertTrue(result.errors.isEmpty())
    }

    @Test
    fun verify_noSignatureInManifest_returnsSuccess() {
        storage.putFile("test-bundle", "manifest.json", """{"name": "test", "version": "1.0.0"}""")
        storage.putFile("test-bundle", "main.js", "console.log('hello');")

        val result = ScriptVerifier.verify("test-bundle", storage)
        assertTrue(result.success)
    }

    @Test
    fun verify_validSignature_returnsSuccess() {
        val jsContent = "console.log('hello');"
        val jsHash = sha256Hex(jsContent)
        val bundleHash = sha256Hex(jsHash)

        val manifest = """{
            "name": "test",
            "version": "1.0.0",
            "signature": {
                "algorithm": "SHA-256",
                "files": { "main.js": "$jsHash" },
                "bundleHash": "$bundleHash"
            }
        }"""

        storage.putFile("test-bundle", "manifest.json", manifest)
        storage.putFile("test-bundle", "main.js", jsContent)

        val result = ScriptVerifier.verify("test-bundle", storage)
        assertTrue(result.success, "Expected success but got errors: ${result.errors}")
    }

    @Test
    fun verify_tamperedFile_returnsFailure() {
        val originalContent = "console.log('hello');"
        val originalHash = sha256Hex(originalContent)
        val bundleHash = sha256Hex(originalHash)

        val manifest = """{
            "name": "test",
            "version": "1.0.0",
            "signature": {
                "algorithm": "SHA-256",
                "files": { "main.js": "$originalHash" },
                "bundleHash": "$bundleHash"
            }
        }"""

        storage.putFile("test-bundle", "manifest.json", manifest)
        storage.putFile("test-bundle", "main.js", "TAMPERED CONTENT")

        val result = ScriptVerifier.verify("test-bundle", storage)
        assertFalse(result.success)
        assertTrue(result.errors.any { it.contains("main.js") && it.contains("hash mismatch") })
    }

    @Test
    fun verify_missingFile_returnsFailure() {
        val manifest = """{
            "name": "test",
            "version": "1.0.0",
            "signature": {
                "algorithm": "SHA-256",
                "files": { "main.js": "abc123" },
                "bundleHash": "xyz"
            }
        }"""

        storage.putFile("test-bundle", "manifest.json", manifest)
        // main.js not added — should fail

        val result = ScriptVerifier.verify("test-bundle", storage)
        assertFalse(result.success)
        assertTrue(result.errors.any { it.contains("main.js") && it.contains("cannot read") })
    }

    @Test
    fun verify_wrongBundleHash_returnsFailure() {
        val jsContent = "console.log('hello');"
        val jsHash = sha256Hex(jsContent)

        val manifest = """{
            "name": "test",
            "version": "1.0.0",
            "signature": {
                "algorithm": "SHA-256",
                "files": { "main.js": "$jsHash" },
                "bundleHash": "wrong_bundle_hash"
            }
        }"""

        storage.putFile("test-bundle", "manifest.json", manifest)
        storage.putFile("test-bundle", "main.js", jsContent)

        val result = ScriptVerifier.verify("test-bundle", storage)
        assertFalse(result.success)
        assertTrue(result.errors.any { it.contains("bundleHash mismatch") })
    }

    @Test
    fun verify_multipleFiles_allValid() {
        val js1 = "function a() {}"
        val js2 = "function b() {}"
        val hash1 = sha256Hex(js1)
        val hash2 = sha256Hex(js2)
        val bundleHash = sha256Hex(hash1 + hash2)

        val manifest = """{
            "name": "test",
            "version": "1.0.0",
            "signature": {
                "algorithm": "SHA-256",
                "files": { "main.js": "$hash1", "theme.js": "$hash2" },
                "bundleHash": "$bundleHash"
            }
        }"""

        storage.putFile("test-bundle", "manifest.json", manifest)
        storage.putFile("test-bundle", "main.js", js1)
        storage.putFile("test-bundle", "theme.js", js2)

        val result = ScriptVerifier.verify("test-bundle", storage)
        assertTrue(result.success, "Expected success but got errors: ${result.errors}")
    }

    @Test
    fun verify_noBundleHash_onlyFileHashes() {
        val jsContent = "console.log('hello');"
        val jsHash = sha256Hex(jsContent)

        val manifest = """{
            "name": "test",
            "version": "1.0.0",
            "signature": {
                "algorithm": "SHA-256",
                "files": { "main.js": "$jsHash" }
            }
        }"""

        storage.putFile("test-bundle", "manifest.json", manifest)
        storage.putFile("test-bundle", "main.js", jsContent)

        val result = ScriptVerifier.verify("test-bundle", storage)
        assertTrue(result.success)
    }

    @Test
    fun verify_missingManifest_returnsFailure() {
        // No manifest.json at all
        val result = ScriptVerifier.verify("test-bundle", storage)
        assertFalse(result.success)
        assertTrue(result.errors.any { it.contains("Cannot read manifest") })
    }
}
