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
    localStorage.ensureInitialized()
    val platformActions = DesktopPlatformActions()

    Window(
        onCloseRequest = ::exitApplication,
        title = "OnTheFly",
        state = WindowState(
            position = WindowPosition(500.dp, 100.dp),
            size = DpSize(420.dp, 800.dp)
        )
    ) {
        App(localStorage, platformActions)
    }
}
