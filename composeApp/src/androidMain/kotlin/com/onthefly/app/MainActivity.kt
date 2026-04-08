package com.onthefly.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.onthefly.engine.data.AndroidScriptStorage
import com.onthefly.engine.platform.AndroidPlatformActions

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val localStorage = AndroidScriptStorage(applicationContext)
        localStorage.ensureInitialized()
        val platformActions = AndroidPlatformActions(applicationContext)

        setContent {
            App(localStorage, platformActions)
        }
    }
}
