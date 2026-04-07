package com.onthefly.app.data.repository

import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.domain.model.ScriptBundle
import com.onthefly.app.domain.repository.ScriptRepository
import com.onthefly.app.util.JsonParser

class ScriptRepositoryImpl(
    private val localStorage: ScriptStorage
) : ScriptRepository {

    override fun loadBundle(bundleName: String): ScriptBundle {
        val manifestJson = localStorage.readFile(bundleName, "manifest.json")
        val manifest = JsonParser.parseObject(manifestJson)
        val entry = manifest["entry"] as? String ?: "main.js"
        val scriptContent = localStorage.readFile(bundleName, entry)

        return ScriptBundle(
            name = manifest["name"] as? String ?: bundleName,
            version = manifest["version"] as? String ?: "0.0.0",
            entry = entry,
            scriptContent = scriptContent
        )
    }

    override fun loadTheme(bundleName: String): String? {
        return try {
            localStorage.readFile(bundleName, "theme.js")
        } catch (_: Exception) { null }
    }
}
