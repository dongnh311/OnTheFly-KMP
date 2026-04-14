package com.onthefly.engine.renderer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.model.UIComponent
import com.onthefly.engine.style.toComposeColor
import kotlinx.coroutines.delay

// ═══════════════════════════════════════════════════════════
//  BottomSheet
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderBottomSheet(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val visible = c.propBool("visible")
    val bgColor = c.propColor("background") ?: Color.Unspecified
    val borderRadius = c.propInt("borderRadius", 16)
    val showHandle = c.propBool("showHandle", true)
    val dismissOnClickOutside = c.propBool("dismissOnClickOutside", true)
    val onDismiss = c.propString("onDismiss")
    val componentId = c.propString("id")

    val sheetHeight = c.propString("height") ?: "wrap"

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn() + slideInVertically { it },
        exit = fadeOut() + slideOutVertically { it }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Scrim
            Box(
                modifier = Modifier.fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f))
                    .clickable(enabled = dismissOnClickOutside) {
                        if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_DISMISS, componentId))
                        onDismiss?.let { onEvent(it) }
                    }
            )
            // Sheet
            val heightMod = when (sheetHeight) {
                "full" -> Modifier.fillMaxSize()
                "half" -> Modifier.fillMaxWidth().height(400.dp)
                "wrap" -> Modifier.fillMaxWidth().wrapContentHeight()
                else -> {
                    val h = sheetHeight.toIntOrNull()
                    if (h != null) Modifier.fillMaxWidth().height(h.dp)
                    else Modifier.fillMaxWidth().wrapContentHeight()
                }
            }
            Column(
                modifier = heightMod
                    .align(Alignment.BottomCenter)
                    .background(bgColor, RoundedCornerShape(topStart = borderRadius.dp, topEnd = borderRadius.dp))
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (showHandle) {
                    Box(
                        modifier = Modifier
                            .width(40.dp).height(4.dp)
                            .background(Color.Gray.copy(alpha = 0.4f), RoundedCornerShape(2.dp))
                    )
                    Spacer(Modifier.height(12.dp))
                }
                c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  Snackbar
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderSnackbar(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val visible = c.propBool("visible", true)
    val message = c.propString("message") ?: ""
    val actionText = c.propString("actionText")
    val duration = c.propInt("duration", 3000)
    val bgColor = c.propColor("background") ?: Color.Unspecified
    val textColor = c.propColor("textColor") ?: Color.Unspecified
    val actionColor = c.propColor("actionColor") ?: Color.Unspecified
    val position = c.propString("position") ?: "bottom"
    val onAction = c.propString("onAction")
    val onDismiss = c.propString("onDismiss")
    val componentId = c.propString("id")

    if (!visible) return

    // Auto-dismiss
    if (duration > 0 && onDismiss != null) {
        LaunchedEffect(message) {
            delay(duration.toLong())
            onDismiss.let { onEvent(it) }
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = if (position == "top") Alignment.TopCenter else Alignment.BottomCenter
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .background(bgColor, RoundedCornerShape(8.dp))
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = message,
                color = textColor,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f)
            )
            if (actionText != null) {
                TextButton(onClick = {
                    if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
                    onAction?.let { onEvent(it) }
                }) {
                    Text(actionText, color = actionColor, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  LoadingOverlay
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderLoadingOverlay(c: UIComponent, modifier: Modifier) {
    val visible = c.propBool("visible")
    val message = c.propString("message")
    val bgColor = c.propColor("background") ?: Color.Black.copy(alpha = 0.5f)
    val indicatorColor = c.propColor("indicatorColor") ?: Color.White

    if (!visible) return

    Box(
        modifier = Modifier.fillMaxSize().background(bgColor),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = indicatorColor)
            if (message != null) {
                Spacer(Modifier.height(16.dp))
                Text(message, color = indicatorColor, fontSize = 14.sp)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  Tooltip (simplified — wraps child with long-press hint)
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderTooltip(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val text = c.propString("text") ?: ""
    val bgColor = c.propColor("background") ?: Color.Unspecified
    val textColor = c.propColor("textColor") ?: Color.Unspecified

    @Suppress("UNCHECKED_CAST")
    val childMap = c.props["child"] as? Map<String, Any>
    val child = childMap?.let { parseUIComponentFromMap(it) }
        ?: c.children.firstOrNull()

    // Compose Multiplatform doesn't have native TooltipBox in all versions,
    // so we render the child with a simple tooltip-style overlay approach
    Column(modifier = modifier) {
        if (child != null) {
            DynamicRenderer(child, onEvent, onComponentEvent)
        }
        // Show tooltip text below as a small hint
        // A full tooltip would use PlainTooltip from Material3 when available
    }
}

// ═══════════════════════════════════════════════════════════
//  Badge
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderBadge(c: UIComponent, modifier: Modifier) {
    val count = c.propInt("count", 0)
    val bgColor = c.propColor("color") ?: Color.Unspecified
    val textColor = c.propColor("textColor") ?: Color.Unspecified
    val visible = c.propBool("visible", true)
    if (!visible) return

    Box(
        modifier = modifier
            .size(if (count > 0) 20.dp else 8.dp)
            .background(bgColor, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        if (count > 0) {
            Text(
                text = if (count > 99) "99+" else "$count",
                color = textColor,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  Avatar
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderAvatar(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val name = c.propString("name")
    val size = c.propInt("size", 40)
    val bgColor = c.propColor("background") ?: Color.Unspecified
    val borderWidth = c.propInt("borderWidth", 0)
    val borderColor = c.propColor("borderColor")
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")

    val initials = name?.split(" ")
        ?.mapNotNull { it.firstOrNull()?.uppercaseChar()?.toString() }
        ?.take(2)?.joinToString("") ?: ""

    var mod = modifier
        .size(size.dp)
        .clip(CircleShape)
        .background(bgColor, CircleShape)

    if (borderWidth > 0 && borderColor != null) {
        mod = mod.border(borderWidth.dp, borderColor, CircleShape)
    }
    if (onClick != null || componentId != null) {
        mod = mod.clickableNoIndication {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    Box(modifier = mod, contentAlignment = Alignment.Center) {
        // If URL provided we'd load image — for now show initials
        Text(
            text = initials,
            color = Color(0xFF757575),
            fontSize = (size / 3).sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
    }
}

// ═══════════════════════════════════════════════════════════
//  ProgressBar
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderProgressBar(c: UIComponent, modifier: Modifier) {
    val progress = c.propFloat("progress", 0f)
    val type = c.propString("type") ?: "linear"
    val color = c.propColor("color") ?: MaterialTheme.colorScheme.primary
    val trackColor = c.propColor("trackColor") ?: Color.Unspecified
    val size = c.propInt("size", 4)
    val indeterminate = c.propBool("indeterminate")
    val visible = c.propBool("visible", true)
    if (!visible) return

    if (type == "circular") {
        if (indeterminate) {
            CircularProgressIndicator(
                modifier = modifier.size(size.dp.coerceAtLeast(24.dp)),
                color = color,
                trackColor = trackColor
            )
        } else {
            CircularProgressIndicator(
                progress = { progress.coerceIn(0f, 1f) },
                modifier = modifier.size(size.dp.coerceAtLeast(24.dp)),
                color = color,
                trackColor = trackColor
            )
        }
    } else {
        if (indeterminate) {
            LinearProgressIndicator(
                modifier = modifier.fillMaxWidth().height(size.dp),
                color = color,
                trackColor = trackColor
            )
        } else {
            LinearProgressIndicator(
                progress = { progress.coerceIn(0f, 1f) },
                modifier = modifier.fillMaxWidth().height(size.dp),
                color = color,
                trackColor = trackColor
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  Chip
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderChip(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val componentId = c.propString("id") ?: ""
    val text = c.propString("text") ?: ""
    val selected = c.propBool("selected")
    val iconName = c.propString("icon")
    val bg = c.propColor("background") ?: Color.Unspecified
    val selectedBg = c.propColor("selectedBackground") ?: Color.Unspecified
    val textColor = c.propColor("textColor") ?: Color.Unspecified
    val selectedTextColor = c.propColor("selectedTextColor") ?: Color.White
    val borderRadius = c.propInt("borderRadius", 20)
    val closable = c.propBool("closable")
    val onClick = c.propString("onClick")
    val onClose = c.propString("onClose")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val currentBg = if (selected) selectedBg else bg
    val currentTextColor = if (selected) selectedTextColor else textColor

    Row(
        modifier = modifier
            .background(currentBg, RoundedCornerShape(borderRadius.dp))
            .clickableNoIndication {
                onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
                onClick?.let { onEvent(it) }
            }
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        if (iconName != null) {
            Icon(
                resolveIcon(iconName),
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = currentTextColor
            )
        }
        Text(text = text, color = currentTextColor, fontSize = 13.sp)
        if (closable) {
            IconButton(
                onClick = {
                    onComponentEvent(ComponentEvent(EngineEvent.ON_CHIP_CLOSE, componentId))
                    onClose?.let { onEvent(it) }
                },
                modifier = Modifier.size(18.dp)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Close", modifier = Modifier.size(14.dp), tint = currentTextColor)
            }
        }
    }
}
