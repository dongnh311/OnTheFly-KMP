package com.onthefly.app

import androidx.compose.ui.window.ComposeUIViewController
import com.onthefly.engine.data.IosScriptStorage
import com.onthefly.engine.platform.IosPlatformActions

fun MainViewController() = ComposeUIViewController {
    val localStorage = IosScriptStorage()
    val platformActions = IosPlatformActions()

    // Production server URL for OTA script updates (null = no remote check)
    // For testing with release server: "http://localhost:8082"
    // For production: "https://your-server.com"
    val productionServerUrl: String? = null

    App(
        localStorage = localStorage,
        platformActions = platformActions,
        productionServerUrl = productionServerUrl,
        appVersion = "1.0.0"
    )
}
