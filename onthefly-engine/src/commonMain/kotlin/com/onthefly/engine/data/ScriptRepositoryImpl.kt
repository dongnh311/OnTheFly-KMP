package com.onthefly.engine.data

import com.onthefly.engine.data.ScriptStorage
import com.onthefly.engine.model.ScriptBundle
import com.onthefly.engine.data.ScriptRepository
import com.onthefly.engine.util.JsonParser

class ScriptRepositoryImpl(
    private val localStorage: ScriptStorage
) : ScriptRepository {

    companion object {
        const val LIBS_DIR = "_libs"
        const val BASE_DIR = "_base"
        const val LANGUAGES_DIR = "languages"
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

    override fun loadLanguages(): List<Pair<String, String>> {
        return try {
            val files = localStorage.listFiles(LANGUAGES_DIR)
            files.filter { it.endsWith(".json") }.mapNotNull { fileName ->
                try {
                    val locale = fileName.removeSuffix(".json")
                    locale to localStorage.readFile(LANGUAGES_DIR, fileName)
                } catch (_: Exception) { null }
            }
        } catch (_: Exception) { emptyList() }
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
