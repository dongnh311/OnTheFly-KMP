package com.onthefly.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.onthefly.engine.data.AndroidScriptStorage
import com.onthefly.engine.platform.AndroidPlatformActions

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        window.decorView.setBackgroundColor(android.graphics.Color.parseColor("#0A0E17"))

        val localStorage = AndroidScriptStorage(applicationContext)
        val platformActions = AndroidPlatformActions(applicationContext)

        // Production server URL for OTA script updates (null = no remote check)
        // For testing with release server: "http://10.0.2.2:8082"
        // For production: "https://your-server.com"
        val productionServerUrl: String? = null

        setContent {
            App(
                localStorage = localStorage,
                platformActions = platformActions,
                productionServerUrl = productionServerUrl,
                appVersion = "1.0.0"
            )
        }
    }
}
