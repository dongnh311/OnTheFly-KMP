package com.onthefly.app.data.source

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
            val bundleInfo = bundles[bundleName] as? Map<*, *> ?: return false

            val files = bundleInfo["files"] as? List<*> ?: return false
            for (file in files) {
                val fileName = file as? String ?: continue
                val content = DevServerSource.fetchFile(bundleName, fileName)
                if (content != null) {
                    localStorage.writeFile(bundleName, fileName, content)
                }
            }

            val remoteVersion = bundleInfo["version"] as? String ?: ""
            localStorage.setVersion(bundleName, remoteVersion)
            localStorage.setVersion(KEY_GLOBAL, globalVersion)
            println("ScriptUpdateManager: Updated $bundleName from dev server (v$remoteVersion)")
            true
        } catch (e: Exception) {
            println("ScriptUpdateManager: Failed to update $bundleName: ${e.message}")
            false
        }
    }

    suspend fun devServerHasChanges(): Boolean = DevServerSource.hasChanges()
}
