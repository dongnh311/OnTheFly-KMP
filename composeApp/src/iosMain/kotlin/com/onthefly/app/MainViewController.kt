package com.onthefly.app

import androidx.compose.ui.window.ComposeUIViewController
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.platform.PlatformActions

fun MainViewController() = ComposeUIViewController {
    val localStorage = ScriptStorage()
    localStorage.ensureInitialized()
    val platformActions = PlatformActions()
    App(localStorage, platformActions)
}
