package com.onthefly.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.onthefly.engine.data.ScriptStorage
import com.onthefly.engine.platform.PlatformActions
import com.onthefly.engine.ui.OnTheFlyScreen

@Composable
fun App(localStorage: ScriptStorage, platformActions: PlatformActions? = null) {
    val navController = rememberNavController()

    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            NavHost(navController = navController, startDestination = "script/home") {
                composable(
                    route = "script/{bundleName}",
                    arguments = listOf(navArgument("bundleName") { type = NavType.StringType; defaultValue = "home" })
                ) { entry ->
                    val bundleName = entry.arguments?.getString("bundleName") ?: "home"

                    OnTheFlyScreen(
                        bundleName = bundleName,
                        localStorage = localStorage,
                        platformActions = platformActions,
                        onNavigate = { event ->
                            when {
                                event.clearStack -> navController.navigate("script/${event.screen}") {
                                    popUpTo(0) { inclusive = true }
                                }
                                event.replace -> navController.navigate("script/${event.screen}") {
                                    popUpTo(navController.currentBackStackEntry?.destination?.route ?: "") {
                                        inclusive = true
                                    }
                                }
                                else -> navController.navigate("script/${event.screen}")
                            }
                        },
                        onGoBack = { navController.popBackStack() },
                        onToast = { message -> platformActions?.showToast(message) }
                    )
                }
            }
        }
    }
}
