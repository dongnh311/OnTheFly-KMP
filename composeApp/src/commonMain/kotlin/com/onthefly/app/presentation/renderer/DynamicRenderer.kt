package com.onthefly.app.presentation.renderer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.onthefly.app.domain.model.EngineEvent
import com.onthefly.app.domain.model.UIComponent
import com.onthefly.app.engine.style.ComponentStyle
import com.onthefly.app.engine.style.StyleRegistry
import com.onthefly.app.engine.style.toComposeColor

data class ComponentEvent(
    val eventName: String,
    val componentId: String,
    val data: String? = null
)

@Composable
fun DynamicRenderer(
    component: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val id = component.props["id"] as? String
    key(id ?: component.hashCode()) {
        when (component.type) {
            "Column" -> RenderColumn(component, onEvent, onComponentEvent, modifier)
            "Row" -> RenderRow(component, onEvent, onComponentEvent, modifier)
            "Text" -> RenderText(component, modifier)
            "Button" -> RenderButton(component, onEvent, onComponentEvent, modifier)
            "Spacer" -> RenderSpacer(component, modifier)
            "Toggle" -> RenderToggle(component, onComponentEvent, modifier)
            "FullScreenPopup" -> RenderFullScreenPopup(component, onEvent, onComponentEvent)
            "ConfirmDialog" -> RenderConfirmDialog(component, onEvent)
        }
    }
}

private fun UIComponent.resolveStyle(): ComponentStyle? {
    val styleName = props["style"] as? String ?: return null
    return StyleRegistry.get(styleName)
}

@Composable
private fun RenderColumn(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val style = c.resolveStyle()
    val padding = style?.padding ?: (c.props["padding"] as? Number)?.toInt() ?: 0
    val spacing = style?.spacing ?: (c.props["spacing"] as? Number)?.toInt() ?: 0
    val alignment = when (style?.alignment ?: c.props["alignment"] as? String) {
        "center" -> Alignment.CenterHorizontally
        "end" -> Alignment.End
        else -> Alignment.Start
    }
    var mod = modifier.fillMaxWidth().padding(padding.dp)
    style?.let { s ->
        if (s.backgroundComposeColor() != Color.Unspecified)
            mod = mod.background(s.backgroundComposeColor(), RoundedCornerShape(s.cornerRadiusDp()))
    }
    Column(modifier = mod, horizontalAlignment = alignment, verticalArrangement = if (spacing > 0) Arrangement.spacedBy(spacing.dp) else Arrangement.Top) {
        c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
    }
}

@Composable
private fun RenderRow(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val style = c.resolveStyle()
    val spacing = style?.spacing ?: (c.props["spacing"] as? Number)?.toInt() ?: 0
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = if (spacing > 0) Arrangement.spacedBy(spacing.dp) else Arrangement.Start) {
        c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
    }
}

@Composable
private fun RenderText(c: UIComponent, modifier: Modifier) {
    val text = c.props["text"] as? String ?: ""
    val style = c.resolveStyle()
    Text(text = text, style = style?.toTextStyle() ?: MaterialTheme.typography.bodyMedium, modifier = modifier)
}

@Composable
private fun RenderButton(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val text = c.props["text"] as? String ?: "Button"
    val onClick = c.props["onClick"] as? String
    val componentId = c.props["id"] as? String
    val style = c.resolveStyle()
    val colors = if (style?.backgroundColor != null) ButtonDefaults.buttonColors(containerColor = style.backgroundComposeColor()) else ButtonDefaults.buttonColors()
    val shape = if (style?.cornerRadius != null) RoundedCornerShape(style.cornerRadiusDp()) else ButtonDefaults.shape

    Button(
        onClick = {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        },
        modifier = modifier, colors = colors, shape = shape
    ) {
        val btnStyle = style?.let { it.toTextStyle().copy(color = it.color?.toComposeColor() ?: Color.Unspecified) }
        Text(text = text, style = btnStyle ?: MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun RenderToggle(c: UIComponent, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val label = c.props["label"] as? String ?: ""
    val checked = c.props["checked"] as? Boolean ?: false
    val componentId = c.props["id"] as? String ?: ""
    Row(modifier = modifier.fillMaxWidth().padding(horizontal = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
        Text(text = label, style = MaterialTheme.typography.bodyLarge)
        Switch(checked = checked, onCheckedChange = { newValue ->
            onComponentEvent(ComponentEvent(EngineEvent.ON_TOGGLE, componentId, "{\"checked\": $newValue}"))
        })
    }
}

@Composable
private fun RenderSpacer(c: UIComponent, modifier: Modifier) {
    val style = c.resolveStyle()
    val height = style?.height ?: (c.props["height"] as? Number)?.toInt() ?: 8
    Spacer(modifier = modifier.height(height.dp))
}

@Composable
private fun RenderFullScreenPopup(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit) {
    val visible = c.props["visible"] as? Boolean ?: false
    val onDismiss = c.props["onDismiss"] as? String
    val style = c.resolveStyle()
    val bgColor = style?.backgroundComposeColor() ?: Color.White

    AnimatedVisibility(visible = visible, enter = fadeIn() + slideInVertically { it }, exit = fadeOut() + slideOutVertically { it }) {
        Box(modifier = Modifier.fillMaxSize().background(bgColor).clickable(indication = null, interactionSource = remember { MutableInteractionSource() }) { }) {
            if (onDismiss != null) {
                TextButton(onClick = { onEvent(onDismiss) }, modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)) {
                    Text("Close", style = MaterialTheme.typography.labelLarge)
                }
            }
            Column(modifier = Modifier.fillMaxSize().padding(top = 56.dp, start = 16.dp, end = 16.dp, bottom = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
            }
        }
    }
}

@Composable
private fun RenderConfirmDialog(c: UIComponent, onEvent: (String) -> Unit) {
    val visible = c.props["visible"] as? Boolean ?: false
    if (!visible) return
    val title = c.props["title"] as? String ?: "Confirm"
    val message = c.props["message"] as? String ?: ""
    val confirmText = c.props["confirmText"] as? String ?: "OK"
    val cancelText = c.props["cancelText"] as? String ?: "Cancel"
    val onConfirm = c.props["onConfirm"] as? String
    val onCancel = c.props["onCancel"] as? String
    val style = c.resolveStyle()

    AlertDialog(
        onDismissRequest = { onCancel?.let { onEvent(it) } },
        title = { Text(text = title, style = MaterialTheme.typography.headlineSmall) },
        text = { Text(text = message, style = MaterialTheme.typography.bodyMedium) },
        confirmButton = {
            Button(
                onClick = { onConfirm?.let { onEvent(it) } },
                colors = if (style?.backgroundColor != null) ButtonDefaults.buttonColors(containerColor = style.backgroundComposeColor()) else ButtonDefaults.buttonColors()
            ) { Text(confirmText) }
        },
        dismissButton = { TextButton(onClick = { onCancel?.let { onEvent(it) } }) { Text(cancelText) } }
    )
}
