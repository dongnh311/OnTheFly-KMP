package com.onthefly.app.engine

import androidx.compose.runtime.mutableStateOf

/**
 * Debug configuration state — observable from Compose UI.
 */
object DebugConfig {
    val enabled = mutableStateOf(false)
    val showConsole = mutableStateOf(false)
    val showInspector = mutableStateOf(false)
    val showNetworkLog = mutableStateOf(false)
    val showPerformanceOverlay = mutableStateOf(false)
    val showStateInspector = mutableStateOf(false)
    val verboseLogging = mutableStateOf(false)
}
