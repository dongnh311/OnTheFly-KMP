package com.onthefly.app

import androidx.compose.ui.window.ComposeUIViewController
import com.onthefly.engine.data.IosScriptStorage
import com.onthefly.engine.platform.IosPlatformActions

fun MainViewController() = ComposeUIViewController {
    val localStorage = IosScriptStorage()
    val platformActions = IosPlatformActions()
    App(
        localStorage = localStorage,
        platformActions = platformActions,
        appVersion = "1.0.0"
    )
}
