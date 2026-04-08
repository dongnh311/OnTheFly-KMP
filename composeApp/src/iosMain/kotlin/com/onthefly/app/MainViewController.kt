package com.onthefly.app

import androidx.compose.ui.window.ComposeUIViewController
import com.onthefly.engine.data.IosScriptStorage
import com.onthefly.engine.platform.IosPlatformActions

fun MainViewController() = ComposeUIViewController {
    val localStorage = IosScriptStorage()
    localStorage.ensureInitialized()
    val platformActions = IosPlatformActions()
    App(localStorage, platformActions)
}
