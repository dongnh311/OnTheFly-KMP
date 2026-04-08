package com.onthefly.engine.data

import com.onthefly.engine.model.ScriptBundle

interface ScriptRepository {
    fun loadBundle(bundleName: String): ScriptBundle
    fun loadTheme(bundleName: String): String?

    /** Load all JS files from _libs/ directory (singleton libraries). */
    fun loadGlobalLibs(): List<Pair<String, String>>

    /** Load all JS files from _base/ directory (shared utility functions). */
    fun loadGlobalBase(): List<Pair<String, String>>

    /** Load bundle-specific base.js if it exists. */
    fun loadBundleBase(bundleName: String): String?

    /** Load all language JSON files from languages/ directory. Returns [(locale, jsonContent)]. */
    fun loadLanguages(): List<Pair<String, String>>
}
