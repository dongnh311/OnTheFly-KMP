package com.onthefly.engine.renderer

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.ClickableText
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.model.UIComponent
import com.onthefly.engine.style.parseFontWeight
import com.onthefly.engine.style.parseTextAlign
import com.onthefly.engine.style.toComposeColor

// ═══════════════════════════════════════════════════════════
//  RichText
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderRichText(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val textAlign = c.propString("textAlign")
    val maxLines = (c.props["maxLines"] as? Number)?.toInt()
    val visible = c.propBool("visible", true)
    if (!visible) return

    @Suppress("UNCHECKED_CAST")
    val spans = c.props["spans"] as? List<Map<String, Any>> ?: emptyList()

    val clickHandlers = mutableMapOf<String, String>()

    val annotated = buildAnnotatedString {
        for (span in spans) {
            val text = span["text"] as? String ?: ""
            val fontSize = (span["fontSize"] as? Number)?.toInt()
            val fontWeight = span["fontWeight"] as? String
            val fontStyle = span["fontStyle"] as? String
            val color = (span["color"] as? String)?.toComposeColor()
            val decoration = span["textDecoration"] as? String
            val onClick = span["onClick"] as? String

            val style = SpanStyle(
                fontSize = fontSize?.sp ?: TextStyle.Default.fontSize,
                fontWeight = parseFontWeight(fontWeight),
                fontStyle = if (fontStyle == "italic") FontStyle.Italic else FontStyle.Normal,
                color = color ?: Color.Unspecified,
                textDecoration = when (decoration) {
                    "underline" -> TextDecoration.Underline
                    "lineThrough" -> TextDecoration.LineThrough
                    else -> null
                }
            )

            if (onClick != null) {
                val tag = "click_${clickHandlers.size}"
                clickHandlers[tag] = onClick
                pushStringAnnotation(tag = tag, annotation = onClick)
                withStyle(style) { append(text) }
                pop()
            } else {
                withStyle(style) { append(text) }
            }
        }
    }

    ClickableText(
        text = annotated,
        modifier = modifier,
        maxLines = maxLines ?: Int.MAX_VALUE,
        overflow = TextOverflow.Ellipsis,
        style = TextStyle(textAlign = parseTextAlign(textAlign)),
        onClick = { offset ->
            for ((tag, handler) in clickHandlers) {
                annotated.getStringAnnotations(tag = tag, start = offset, end = offset)
                    .firstOrNull()?.let {
                        onEvent(handler)
                    }
            }
        }
    )
}

// ═══════════════════════════════════════════════════════════
//  Slider
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderSlider(
    c: UIComponent,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val componentId = c.propString("id") ?: ""
    val value = c.propFloat("value", 0f)
    val min = c.propFloat("min", 0f)
    val max = c.propFloat("max", 1f)
    val steps = c.propInt("steps", 0)
    val label = c.propString("label")
    val showValue = c.propBool("showValue", true)
    val color = c.propColor("color") ?: MaterialTheme.colorScheme.primary
    val visible = c.propBool("visible", true)
    if (!visible) return

    Column(modifier = modifier.fillMaxWidth()) {
        if (label != null || showValue) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (label != null) {
                    Text(label, style = MaterialTheme.typography.bodyMedium)
                }
                if (showValue) {
                    Text(
                        text = "${(value * 10).toInt() / 10.0}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
        }
        Slider(
            value = value.coerceIn(min, max),
            onValueChange = { newValue ->
                onComponentEvent(
                    ComponentEvent(
                        EngineEvent.ON_SLIDER_CHANGED,
                        componentId,
                        "{\"value\":$newValue}"
                    )
                )
            },
            valueRange = min..max,
            steps = if (steps > 0) steps - 1 else 0,
            colors = SliderDefaults.colors(
                thumbColor = color,
                activeTrackColor = color
            )
        )
    }
}

// ═══════════════════════════════════════════════════════════
//  SwipeToAction (simplified — shows action buttons inline)
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderSwipeToAction(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val componentId = c.propString("id") ?: ""
    val onAction = c.propString("onAction")
    val visible = c.propBool("visible", true)
    if (!visible) return

    @Suppress("UNCHECKED_CAST")
    val rightActions = c.props["rightActions"] as? List<Map<String, Any>> ?: emptyList()
    @Suppress("UNCHECKED_CAST")
    val leftActions = c.props["leftActions"] as? List<Map<String, Any>> ?: emptyList()
    @Suppress("UNCHECKED_CAST")
    val childMap = c.props["child"] as? Map<String, Any>
    val child = childMap?.let { parseUIComponentFromMap(it) }
        ?: c.children.firstOrNull()

    // Simplified: render child with action buttons at the end
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        // Left actions
        for (action in leftActions) {
            val actionId = action["id"] as? String ?: ""
            val actionIcon = action["icon"] as? String ?: "star"
            val actionColor = (action["color"] as? String)?.toComposeColor() ?: Color.Gray
            IconButton(onClick = {
                onComponentEvent(
                    ComponentEvent(EngineEvent.ON_CLICK, componentId, "{\"actionId\":\"$actionId\"}")
                )
                onAction?.let { onEvent(it) }
            }) {
                Icon(resolveIcon(actionIcon), contentDescription = actionId, tint = actionColor)
            }
        }

        // Child content
        Box(modifier = Modifier.weight(1f)) {
            if (child != null) {
                DynamicRenderer(child, onEvent, onComponentEvent)
            }
        }

        // Right actions
        for (action in rightActions) {
            val actionId = action["id"] as? String ?: ""
            val actionIcon = action["icon"] as? String ?: "delete"
            val actionColor = (action["color"] as? String)?.toComposeColor() ?: Color.Red
            IconButton(onClick = {
                onComponentEvent(
                    ComponentEvent(EngineEvent.ON_CLICK, componentId, "{\"actionId\":\"$actionId\"}")
                )
                onAction?.let { onEvent(it) }
            }) {
                Icon(resolveIcon(actionIcon), contentDescription = actionId, tint = actionColor)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  WebView (placeholder — needs platform webview)
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderWebView(c: UIComponent, modifier: Modifier) {
    val url = c.propString("url")
    val height = c.propInt("height", 300)
    val visible = c.propBool("visible", true)
    if (!visible) return

    Box(
        modifier = modifier.fillMaxWidth().height(height.dp)
            .background(Color(0xFFF5F5F5), RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(resolveIcon("info"), contentDescription = null, tint = Color.Gray, modifier = Modifier.size(32.dp))
            Text("WebView", color = Color.Gray, fontSize = 12.sp)
            if (url != null) Text(url, color = Color.Gray, fontSize = 10.sp, maxLines = 1)
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  MapView (placeholder — needs platform map SDK)
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderMapView(c: UIComponent, modifier: Modifier) {
    val lat = c.propFloat("latitude", 0f)
    val lng = c.propFloat("longitude", 0f)
    val height = c.propInt("height", 300)
    val visible = c.propBool("visible", true)
    if (!visible) return

    Box(
        modifier = modifier.fillMaxWidth().height(height.dp)
            .background(Color(0xFFE8F5E9), RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(resolveIcon("location_on"), contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(32.dp))
            Text("MapView", color = Color.Gray, fontSize = 12.sp)
            Text("${lat}, ${lng}", color = Color.Gray, fontSize = 10.sp)
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  VideoPlayer (placeholder)
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderVideoPlayer(c: UIComponent, modifier: Modifier) {
    val url = c.propString("url")
    val height = c.propInt("height", 200)
    val visible = c.propBool("visible", true)
    if (!visible) return

    Box(
        modifier = modifier.fillMaxWidth().height(height.dp)
            .background(Color(0xFF212121), RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(resolveIcon("play_arrow"), contentDescription = null, tint = Color.White, modifier = Modifier.size(48.dp))
            Text("VideoPlayer", color = Color.White, fontSize = 12.sp)
        }
    }
}
