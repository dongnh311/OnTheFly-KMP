package com.onthefly.app

import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import com.onthefly.app.data.source.ScriptStorage

fun main() = application {
    val localStorage = ScriptStorage()
    localStorage.ensureInitialized()

    Window(onCloseRequest = ::exitApplication, title = "OnTheFly") {
        App(localStorage)
    }
}
