package com.onthefly.engine.security

import com.onthefly.engine.data.ScriptStorage
import com.onthefly.engine.util.JsonParser

/**
 * Verifies script bundle integrity using SHA-256 hashes from manifest.json.
 *
 * Manifest "signature" format:
 * {
 *   "algorithm": "SHA-256",
 *   "files": { "main.js": "hash...", "theme.js": "hash..." },
 *   "bundleHash": "hash_of_all_file_hashes..."
 * }
 */
object ScriptVerifier {

    /** Whether signature verification is enabled. Disabled in dev mode. */
    var enabled: Boolean = false

    data class VerificationResult(
        val success: Boolean,
        val errors: List<String> = emptyList()
    )

    /**
     * Verify bundle integrity. Returns success if:
     * 1. No signature in manifest (verification not required)
     * 2. Verification disabled
     * 3. All file hashes match + bundleHash matches
     */
    fun verify(bundleName: String, storage: ScriptStorage): VerificationResult {
        if (!enabled) return VerificationResult(success = true)

        val manifest: Map<String, Any?>
        try {
            val manifestJson = storage.readFile(bundleName, "manifest.json")
            manifest = JsonParser.parseObject(manifestJson)
        } catch (e: Exception) {
            return VerificationResult(false, listOf("Cannot read manifest.json: ${e.message}"))
        }

        @Suppress("UNCHECKED_CAST")
        val signature = manifest["signature"] as? Map<String, Any?> ?: return VerificationResult(success = true)

        @Suppress("UNCHECKED_CAST")
        val fileHashes = signature["files"] as? Map<String, Any?> ?: return VerificationResult(success = true)
        val expectedBundleHash = signature["bundleHash"] as? String

        val errors = mutableListOf<String>()
        val computedHashes = mutableListOf<String>()

        for ((fileName, expectedHash) in fileHashes) {
            val expected = expectedHash as? String ?: continue
            try {
                val content = storage.readFile(bundleName, fileName)
                val computed = sha256Hex(content)
                computedHashes.add(computed)
                if (computed != expected) {
                    errors.add("$fileName: hash mismatch (expected ${expected.take(8)}..., got ${computed.take(8)}...)")
                }
            } catch (e: Exception) {
                errors.add("$fileName: cannot read file: ${e.message}")
            }
        }

        // Verify bundleHash (hash of all file hashes concatenated)
        if (errors.isEmpty() && expectedBundleHash != null && computedHashes.isNotEmpty()) {
            val allHashes = computedHashes.joinToString("")
            val computedBundleHash = sha256Hex(allHashes)
            if (computedBundleHash != expectedBundleHash) {
                errors.add("bundleHash mismatch")
            }
        }

        return VerificationResult(
            success = errors.isEmpty(),
            errors = errors
        )
    }
}

/**
 * Compute SHA-256 hash of a string, returning lowercase hex.
 * Uses platform-specific implementation.
 */
expect fun sha256Hex(input: String): String
