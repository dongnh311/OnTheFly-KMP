package com.onthefly.app

import androidx.compose.ui.window.ComposeUIViewController
import com.onthefly.app.data.source.ScriptStorage

fun MainViewController() = ComposeUIViewController {
    val localStorage = ScriptStorage()
    localStorage.ensureInitialized()
    App(localStorage)
}
