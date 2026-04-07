package com.onthefly.app.data.source

import com.onthefly.app.data.repository.ScriptRepositoryImpl

class ScriptUpdateManager(
    private val localStorage: ScriptStorage
) {
    companion object {
        private const val KEY_GLOBAL = "__global_version__"
    }

    suspend fun updateFromDevServer(bundleName: String): Boolean {
        if (!DevServerSource.enabled) return false
        return try {
            val manifest = DevServerSource.fetchVersionManifest() ?: return false
            val globalVersion = manifest["globalVersion"] as? String ?: return false

            val lastGlobal = localStorage.getVersion(KEY_GLOBAL)
            if (lastGlobal == globalVersion) return false

            val bundles = manifest["bundles"] as? Map<*, *> ?: return false

            // Sync the requested bundle
            syncBundle(bundles, bundleName)

            // Also sync _libs, _base, and languages if present
            syncBundle(bundles, ScriptRepositoryImpl.LIBS_DIR)
            syncBundle(bundles, ScriptRepositoryImpl.BASE_DIR)
            syncBundle(bundles, ScriptRepositoryImpl.LANGUAGES_DIR)

            localStorage.setVersion(KEY_GLOBAL, globalVersion)
            true
        } catch (e: Exception) {
            println("ScriptUpdateManager: Failed to update $bundleName: ${e.message}")
            false
        }
    }

    private suspend fun syncBundle(bundles: Map<*, *>, name: String) {
        val bundleInfo = bundles[name] as? Map<*, *> ?: return
        val files = bundleInfo["files"] as? List<*> ?: return
        for (file in files) {
            val fileName = file as? String ?: continue
            val content = DevServerSource.fetchFile(name, fileName)
            if (content != null) {
                localStorage.writeFile(name, fileName, content)
            }
        }
        val remoteVersion = bundleInfo["version"] as? String ?: ""
        if (remoteVersion.isNotEmpty()) {
            localStorage.setVersion(name, remoteVersion)
            println("ScriptUpdateManager: Updated $name from dev server (v$remoteVersion)")
        }
    }

    suspend fun devServerHasChanges(): Boolean = DevServerSource.hasChanges()
}
