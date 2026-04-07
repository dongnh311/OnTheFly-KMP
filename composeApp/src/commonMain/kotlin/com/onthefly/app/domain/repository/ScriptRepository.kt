package com.onthefly.app.domain.repository

import com.onthefly.app.domain.model.ScriptBundle

interface ScriptRepository {
    fun loadBundle(bundleName: String): ScriptBundle
    fun loadTheme(bundleName: String): String?
}
