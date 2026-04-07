package com.onthefly.app.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.domain.model.EngineEvent
import com.onthefly.app.presentation.navigation.ViewDataStore
import com.onthefly.app.presentation.renderer.DynamicRenderer
import com.onthefly.app.presentation.viewmodel.ScriptViewModel

@Composable
fun ScriptScreen(
    bundleName: String,
    navController: NavController,
    localStorage: ScriptStorage
) {
    val viewModel: ScriptViewModel = viewModel(
        key = bundleName,
        factory = ScriptViewModelFactory(localStorage)
    )

    val uiTree = viewModel.uiTree.value
    val error = viewModel.error.value
    val isDevServer = viewModel.isDevServer.value

    LaunchedEffect(bundleName) {
        ViewDataStore.pushRoute("script/$bundleName")
        viewModel.loadAndRun(bundleName)
        viewModel.startAutoReload()
        ViewDataStore.take()?.let { data ->
            viewModel.sendDataToScript(EngineEvent.ON_VIEW_DATA, data)
        }
    }

    LaunchedEffect(Unit) {
        viewModel.navFlow.collect { event ->
            if (event.data.isNotEmpty()) ViewDataStore.put(event.data)
            navController.navigate("script/${event.screen}")
        }
    }

    DisposableEffect(Unit) {
        viewModel.dispatchLifecycleEvent(EngineEvent.ON_VISIBLE)
        onDispose { viewModel.dispatchLifecycleEvent(EngineEvent.ON_INVISIBLE) }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            when {
                error != null -> Text(
                    text = "Error: $error",
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.align(Alignment.Center)
                )
                uiTree != null -> {
                    val goBack = {
                        ViewDataStore.popRoute()
                        navController.popBackStack()
                    }
                    DynamicRenderer(
                        component = uiTree,
                        onEvent = { viewModel.onEvent(it); if (viewModel.consumeGoBack()) goBack() },
                        onComponentEvent = { event ->
                            viewModel.onComponentEvent(event.eventName, event.componentId, event.data)
                            if (viewModel.consumeGoBack()) goBack()
                        }
                    )
                }
                else -> Text("Loading $bundleName...", modifier = Modifier.align(Alignment.Center))
            }
        }

        if (isDevServer) {
            Row(
                modifier = Modifier.align(Alignment.TopEnd).padding(top = 48.dp, end = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(text = "DEV", fontSize = 10.sp, color = Color(0xFF27AE60), fontWeight = FontWeight.Bold)
                Box(modifier = Modifier.size(8.dp).background(Color(0xFF27AE60), CircleShape))
            }
        }
    }
}
