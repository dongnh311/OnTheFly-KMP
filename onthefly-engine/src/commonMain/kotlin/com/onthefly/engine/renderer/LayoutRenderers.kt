package com.onthefly.engine.renderer

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.key
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.model.UIComponent
import com.onthefly.engine.style.toComposeColor

@Composable
fun RenderColumn(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val style = c.resolveStyle()
    val spacing = (c.props["spacing"] as? Number)?.toInt() ?: style?.spacing ?: 0
    val alignment = resolveAlignment(c.propString("alignment") ?: style?.alignment)
    val scrollable = c.propBool("scrollable")
    val visible = c.propBool("visible", true)
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val borderRadius = c.resolveBorderRadius(style)
    val bg = c.resolveBackground(style)

    if (!visible) return

    val shape = c.resolveShape()
    var mod = modifier
        .applyWidth(c.props["width"] ?: style?.width ?: "fill")
        .applyHeight(c.props["height"] ?: style?.height)
        .applyOpacity(c.props["opacity"] ?: style?.opacity)

    if (borderRadius > 0) mod = mod.clip(shape)
    if (bg != null) mod = mod.background(bg, shape)
    mod = mod.applyBorder(c, style, borderRadius)
    mod = mod.applyPadding(c, style)

    if (scrollable) mod = mod.verticalScroll(rememberScrollState())
    if (onClick != null || componentId != null) {
        mod = mod.clickable {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    Column(
        modifier = mod,
        horizontalAlignment = alignment,
        verticalArrangement = if (spacing > 0) Arrangement.spacedBy(spacing.dp) else Arrangement.Top
    ) {
        c.children.forEach { child ->
            val childId = child.propString("id")
            val w = (child.props["weight"] as? Number)?.toFloat()
            if (childId != null) {
                key(childId) {
                    if (w != null && w > 0f) {
                        Box(modifier = Modifier.weight(w)) {
                            DynamicRenderer(child, onEvent, onComponentEvent)
                        }
                    } else {
                        DynamicRenderer(child, onEvent, onComponentEvent)
                    }
                }
            } else if (w != null && w > 0f) {
                Box(modifier = Modifier.weight(w)) {
                    DynamicRenderer(child, onEvent, onComponentEvent)
                }
            } else {
                DynamicRenderer(child, onEvent, onComponentEvent)
            }
        }
    }
}

@Composable
fun RenderRow(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val style = c.resolveStyle()
    val spacing = (c.props["spacing"] as? Number)?.toInt() ?: style?.spacing ?: 0
    val scrollable = c.propBool("scrollable")
    val visible = c.propBool("visible", true)
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val borderRadius = c.resolveBorderRadius(style)
    val bg = c.resolveBackground(style)

    if (!visible) return

    val alignment = c.propString("alignment") ?: style?.alignment
    val crossAlignment = c.propString("crossAlignment") ?: style?.crossAlignment
    val horizontalArrangement: Arrangement.Horizontal = when (alignment) {
        "center" -> Arrangement.Center
        "end" -> Arrangement.End
        "spaceBetween" -> Arrangement.SpaceBetween
        "spaceAround" -> Arrangement.SpaceAround
        "spaceEvenly" -> Arrangement.SpaceEvenly
        else -> if (spacing > 0) Arrangement.spacedBy(spacing.dp) else Arrangement.Start
    }
    val verticalAlignment = resolveVerticalAlignment(crossAlignment)

    val shape = c.resolveShape()
    var mod = modifier
        .applyWidth(c.props["width"] ?: style?.width ?: "fill")
        .applyHeight(c.props["height"] ?: style?.height)
        .applyOpacity(c.props["opacity"] ?: style?.opacity)

    if (borderRadius > 0) mod = mod.clip(shape)
    if (bg != null) mod = mod.background(bg, shape)
    mod = mod.applyBorder(c, style, borderRadius)
    mod = mod.applyPadding(c, style)

    if (scrollable) mod = mod.horizontalScroll(rememberScrollState())
    if (onClick != null || componentId != null) {
        mod = mod.clickable {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    Row(
        modifier = mod,
        verticalAlignment = verticalAlignment,
        horizontalArrangement = horizontalArrangement
    ) {
        c.children.forEach { child ->
            val childId = child.propString("id")
            val w = (child.props["weight"] as? Number)?.toFloat()
            if (childId != null) {
                key(childId) {
                    if (w != null && w > 0f) {
                        Box(modifier = Modifier.weight(w)) {
                            DynamicRenderer(child, onEvent, onComponentEvent)
                        }
                    } else {
                        DynamicRenderer(child, onEvent, onComponentEvent)
                    }
                }
            } else if (w != null && w > 0f) {
                Box(modifier = Modifier.weight(w)) {
                    DynamicRenderer(child, onEvent, onComponentEvent)
                }
            } else {
                DynamicRenderer(child, onEvent, onComponentEvent)
            }
        }
    }
}

@Composable
fun RenderBox(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val style = c.resolveStyle()
    val visible = c.propBool("visible", true)
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val borderRadius = c.resolveBorderRadius(style)
    val bg = c.resolveBackground(style)
    val contentAlignment = resolveContentAlignment(c.propString("contentAlignment"))

    if (!visible) return

    val shape = c.resolveShape()
    var mod = modifier
        .applyWidth(c.props["width"] ?: "fill")
        .applyHeight(c.props["height"])
        .applyOpacity(c.props["opacity"])

    if (borderRadius > 0) mod = mod.clip(shape)
    if (bg != null) mod = mod.background(bg, shape)
    mod = mod.applyBorder(c, style, borderRadius)
    mod = mod.applyPadding(c, style)

    if (onClick != null || componentId != null) {
        mod = mod.clickable {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    Box(modifier = mod, contentAlignment = contentAlignment) {
        c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
    }
}

@Composable
fun RenderSpacer(c: UIComponent, modifier: Modifier) {
    val style = c.resolveStyle()
    val height = (c.props["height"] as? Number)?.toInt() ?: style?.height ?: 0
    val width = (c.props["width"] as? Number)?.toInt() ?: 0

    var mod = modifier
    if (height > 0) mod = mod.height(height.dp)
    if (width > 0) mod = mod.width(width.dp)
    // flex support: if used inside Row/Column with weight
    Spacer(modifier = mod)
}

@Composable
fun RenderDivider(c: UIComponent, modifier: Modifier) {
    val color = c.propColor("color") ?: Color(0xFFE0E0E0)
    val thickness = c.propInt("thickness", 1)
    val marginH = c.propInt("marginHorizontal")
    val marginV = c.propInt("marginVertical")

    val mod = modifier.fillMaxWidth().let { m ->
        if (marginH > 0 || marginV > 0) {
            m.padding(horizontal = marginH.dp, vertical = marginV.dp)
        } else m
    }

    HorizontalDivider(
        modifier = mod,
        thickness = thickness.dp,
        color = color
    )
}

@Composable
fun RenderCard(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val style = c.resolveStyle()
    val padding = (c.props["padding"] as? Number)?.toInt() ?: style?.padding ?: 16
    val bg = c.resolveBackground(style) ?: Color.White
    val borderRadius = c.resolveBorderRadius(style).let { if (it == 0) 12 else it }
    val elevation = (c.props["elevation"] as? Number)?.toInt() ?: style?.elevation ?: 4
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val visible = c.propBool("visible", true)

    if (!visible) return

    val shape = RoundedCornerShape(borderRadius.dp)

    val cardModifier = modifier
        .applyWidth(c.props["width"] ?: style?.width ?: "fill")
        .applyHeight(c.props["height"] ?: style?.height)

    val isClickable = onClick != null || componentId != null

    if (isClickable) {
        Card(
            onClick = {
                if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
                onClick?.let { onEvent(it) }
            },
            modifier = cardModifier,
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = bg),
            elevation = CardDefaults.cardElevation(defaultElevation = elevation.dp)
        ) {
            Column(modifier = Modifier.applyPadding(c, style)) {
                c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
            }
        }
    } else {
        Card(
            modifier = cardModifier,
            shape = shape,
            colors = CardDefaults.cardColors(containerColor = bg),
            elevation = CardDefaults.cardElevation(defaultElevation = elevation.dp)
        ) {
            Column(modifier = Modifier.applyPadding(c, style)) {
                c.children.forEach { DynamicRenderer(it, onEvent, onComponentEvent) }
            }
        }
    }
}
