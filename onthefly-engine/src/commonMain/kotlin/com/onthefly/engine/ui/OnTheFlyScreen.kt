package com.onthefly.engine.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.onthefly.engine.data.ScriptStorage
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.navigation.ViewDataStore
import com.onthefly.engine.platform.PlatformActions
import com.onthefly.engine.renderer.DynamicRenderer
import com.onthefly.engine.viewmodel.NavigationEvent
import com.onthefly.engine.viewmodel.ScriptViewModel
import com.onthefly.engine.viewmodel.ScriptViewModelFactory
import com.onthefly.engine.viewmodel.UIControlEvent

@Composable
fun OnTheFlyScreen(
    bundleName: String,
    localStorage: ScriptStorage,
    platformActions: PlatformActions? = null,
    onNavigate: (NavigationEvent) -> Unit = {},
    onGoBack: () -> Unit = {},
    onToast: (String) -> Unit = {},
    viewData: String? = null,
    modifier: Modifier = Modifier
) {
    val viewModel: ScriptViewModel = viewModel(
        key = bundleName,
        factory = ScriptViewModelFactory(localStorage, platformActions)
    )

    val uiTree = viewModel.uiTree.value
    val error = viewModel.error.value
    val isDevServer = viewModel.isDevServer.value
    val popupEvent = viewModel.popupState.value
    val snackbarHostState = remember { SnackbarHostState() }
    val keyboardController = LocalSoftwareKeyboardController.current
    val focusManager = LocalFocusManager.current

    LaunchedEffect(bundleName) {
        ViewDataStore.pushRoute("script/$bundleName")
        viewModel.loadAndRun(bundleName)
        viewModel.startAutoReload()
        val data = viewData ?: ViewDataStore.take()
        data?.let { viewModel.sendDataToScript(EngineEvent.ON_VIEW_DATA, it) }
    }

    LaunchedEffect(Unit) {
        viewModel.navFlow.collect { event ->
            if (event.data.isNotEmpty()) ViewDataStore.put(event.data)
            onNavigate(event)
        }
    }

    LaunchedEffect(Unit) {
        viewModel.toastFlow.collect { message -> onToast(message) }
    }

    LaunchedEffect(Unit) {
        viewModel.snackbarFlow.collect { event ->
            snackbarHostState.showSnackbar(
                message = event.message,
                actionLabel = event.actionText,
                duration = if (event.duration > 5000) SnackbarDuration.Long
                           else SnackbarDuration.Short
            )
        }
    }

    LaunchedEffect(Unit) {
        viewModel.uiControlFlow.collect { event ->
            when (event) {
                is UIControlEvent.HideKeyboard -> {
                    keyboardController?.hide()
                    focusManager.clearFocus()
                }
                else -> { }
            }
        }
    }

    DisposableEffect(Unit) {
        viewModel.dispatchLifecycleEvent(EngineEvent.ON_VISIBLE)
        onDispose { viewModel.dispatchLifecycleEvent(EngineEvent.ON_INVISIBLE) }
    }

    if (popupEvent != null) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissPopup(false) },
            title = { Text(popupEvent.title) },
            text = { Text(popupEvent.message) },
            confirmButton = {
                TextButton(onClick = { viewModel.dismissPopup(true) }) {
                    Text(popupEvent.confirmText)
                }
            },
            dismissButton = if (popupEvent.cancelText != null) {
                { TextButton(onClick = { viewModel.dismissPopup(false) }) { Text(popupEvent.cancelText) } }
            } else null
        )
    }

    Box(modifier = modifier.fillMaxSize()) {
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
                        onGoBack()
                    }
                    DynamicRenderer(
                        component = uiTree,
                        onEvent = {
                            viewModel.onEvent(it)
                            if (viewModel.consumeGoBack()) goBack()
                        },
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

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter)
        )
    }
}
