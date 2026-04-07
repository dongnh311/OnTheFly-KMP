package com.onthefly.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.presentation.screen.ScriptScreen
import com.onthefly.app.presentation.screen.SplashScreen

@Composable
fun AppNavigation(navController: NavHostController, localStorage: ScriptStorage) {
    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            SplashScreen {
                navController.navigate("script/home") {
                    popUpTo("splash") { inclusive = true }
                }
            }
        }
        composable(
            route = "script/{bundleName}",
            arguments = listOf(navArgument("bundleName") { type = NavType.StringType; defaultValue = "home" })
        ) { backStackEntry ->
            val bundleName = backStackEntry.arguments?.getString("bundleName") ?: "home"
            ScriptScreen(bundleName = bundleName, navController = navController, localStorage = localStorage)
        }
    }
}
