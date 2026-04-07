package com.onthefly.app.data.repository

import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.domain.model.ScriptBundle
import com.onthefly.app.domain.repository.ScriptRepository
import com.onthefly.app.util.JsonParser

class ScriptRepositoryImpl(
    private val localStorage: ScriptStorage
) : ScriptRepository {

    companion object {
        const val LIBS_DIR = "_libs"
        const val BASE_DIR = "_base"
    }

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

    override fun loadGlobalLibs(): List<Pair<String, String>> {
        return loadJsFilesFromDir(LIBS_DIR)
    }

    override fun loadGlobalBase(): List<Pair<String, String>> {
        return loadJsFilesFromDir(BASE_DIR)
    }

    override fun loadBundleBase(bundleName: String): String? {
        return try {
            localStorage.readFile(bundleName, "base.js")
        } catch (_: Exception) { null }
    }

    private fun loadJsFilesFromDir(dirName: String): List<Pair<String, String>> {
        val files = localStorage.listFiles(dirName)
        return files.mapNotNull { fileName ->
            try {
                fileName to localStorage.readFile(dirName, fileName)
            } catch (_: Exception) { null }
        }
    }
}
