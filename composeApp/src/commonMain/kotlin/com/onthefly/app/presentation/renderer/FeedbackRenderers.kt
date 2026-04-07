package com.onthefly.app.presentation.renderer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.onthefly.app.domain.model.UIComponent
import com.onthefly.app.engine.style.toComposeColor

@Composable
fun RenderFullScreenPopup(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit
) {
    val visible = c.propBool("visible")
    val onDismiss = c.propString("onDismiss")
    val animation = c.propString("animation") ?: "fade"
    val style = c.resolveStyle()
    val bgColor = c.propColor("background") ?: style?.backgroundComposeColor() ?: Color.White

    val enterAnim = when (animation) {
        "slide", "slideUp" -> fadeIn() + slideInVertically { it }
        "scale" -> fadeIn() + scaleIn()
        "none" -> fadeIn()
        else -> fadeIn() + slideInVertically { it }
    }
    val exitAnim = when (animation) {
        "slide", "slideUp" -> fadeOut() + slideOutVertically { it }
        "scale" -> fadeOut() + scaleOut()
        "none" -> fadeOut()
        else -> fadeOut() + slideOutVertically { it }
    }

    AnimatedVisibility(visible = visible, enter = enterAnim, exit = exitAnim) {
        Box(
            modifier = Modifier.fillMaxSize()
                .background(bgColor)
                .clickable(indication = null, interactionSource = remember { MutableInteractionSource() }) { }
        ) {
            if (onDismiss != null) {
                TextButton(
                    onClick = { onEvent(onDismiss) },
                    modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
                ) {
                    Text("Close", style = MaterialTheme.typography.labelLarge)
                }
            }
            Column(
                modifier = Modifier.fillMaxSize()
                    .padding(top = 56.dp, start = 16.dp, end = 16.dp, bottom = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
            }
        }
    }
}

@Composable
fun RenderConfirmDialog(c: UIComponent, onEvent: (String) -> Unit) {
    val visible = c.propBool("visible")
    if (!visible) return

    val title = c.propString("title") ?: "Confirm"
    val message = c.propString("message") ?: ""
    val confirmText = c.propString("confirmText") ?: "OK"
    val cancelText = c.propString("cancelText") ?: "Cancel"
    val confirmColor = c.propColor("confirmColor")
    val onConfirm = c.propString("onConfirm")
    val onCancel = c.propString("onCancel")
    val style = c.resolveStyle()

    AlertDialog(
        onDismissRequest = { onCancel?.let { onEvent(it) } },
        title = { Text(text = title, style = MaterialTheme.typography.headlineSmall) },
        text = { Text(text = message, style = MaterialTheme.typography.bodyMedium) },
        confirmButton = {
            Button(
                onClick = { onConfirm?.let { onEvent(it) } },
                colors = if (confirmColor != null) {
                    ButtonDefaults.buttonColors(containerColor = confirmColor)
                } else if (style?.backgroundComposeColor() != null && style.backgroundComposeColor() != Color.Unspecified) {
                    ButtonDefaults.buttonColors(containerColor = style.backgroundComposeColor())
                } else {
                    ButtonDefaults.buttonColors()
                }
            ) { Text(confirmText) }
        },
        dismissButton = {
            TextButton(onClick = { onCancel?.let { onEvent(it) } }) { Text(cancelText) }
        }
    )
}
