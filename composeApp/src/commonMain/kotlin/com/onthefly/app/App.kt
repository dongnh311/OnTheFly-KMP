package com.onthefly.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.platform.PlatformActions
import com.onthefly.app.presentation.navigation.AppNavigation

@Composable
fun App(localStorage: ScriptStorage, platformActions: PlatformActions? = null) {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            val navController = rememberNavController()
            Scaffold(modifier = Modifier.fillMaxSize()) {
                AppNavigation(
                    navController = navController,
                    localStorage = localStorage,
                    platformActions = platformActions
                )
            }
        }
    }
}
