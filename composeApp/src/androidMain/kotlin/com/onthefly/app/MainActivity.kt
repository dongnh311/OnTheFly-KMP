package com.onthefly.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.platform.PlatformActions

class MainActivity : ComponentActivity() {

    private lateinit var localStorage: ScriptStorage
    private lateinit var platformActions: PlatformActions

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        localStorage = ScriptStorage(applicationContext)
        localStorage.ensureInitialized()
        platformActions = PlatformActions(applicationContext)

        setContent {
            App(localStorage, platformActions)
        }
    }
}
