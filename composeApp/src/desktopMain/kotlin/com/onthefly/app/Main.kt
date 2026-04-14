package com.onthefly.app

import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowPosition
import androidx.compose.ui.window.WindowState
import androidx.compose.ui.window.application
import com.onthefly.engine.data.DesktopScriptStorage
import com.onthefly.engine.platform.DesktopPlatformActions

fun main() = application {
    val localStorage = DesktopScriptStorage()
    val platformActions = DesktopPlatformActions()

    // Production server URL for OTA script updates (null = no remote check)
    // For testing with release server: "http://localhost:8082"
    // For production: "https://your-server.com"
    val productionServerUrl: String? = null

    Window(
        onCloseRequest = ::exitApplication,
        title = "OnTheFly",
        state = WindowState(
            position = WindowPosition(500.dp, 100.dp),
            size = DpSize(420.dp, 800.dp)
        )
    ) {
        App(
            localStorage = localStorage,
            platformActions = platformActions,
            productionServerUrl = productionServerUrl,
            appVersion = "1.0.0"
        )
    }
}
