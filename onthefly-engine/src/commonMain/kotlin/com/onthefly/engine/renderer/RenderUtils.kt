package com.onthefly.engine.renderer

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.onthefly.engine.model.UIComponent
import com.onthefly.engine.style.ComponentStyle
import com.onthefly.engine.style.StyleRegistry
import com.onthefly.engine.style.toComposeColor

fun UIComponent.resolveStyle(): ComponentStyle? {
    val styleName = props["style"] as? String ?: return null
    return StyleRegistry.get(styleName)
}

fun UIComponent.propInt(key: String, default: Int = 0): Int =
    (props[key] as? Number)?.toInt() ?: default

fun UIComponent.propFloat(key: String, default: Float = 0f): Float =
    (props[key] as? Number)?.toFloat() ?: default

fun UIComponent.propString(key: String, default: String? = null): String? =
    props[key] as? String ?: default

fun UIComponent.propBool(key: String, default: Boolean = false): Boolean =
    props[key] as? Boolean ?: default

fun UIComponent.propColor(key: String): Color? =
    (props[key] as? String)?.toComposeColor()?.takeIf { it != Color.Unspecified }

fun UIComponent.resolveBackground(style: ComponentStyle?): Color? {
    val propBg = propColor("background")
    if (propBg != null) return propBg
    val styleBg = style?.backgroundComposeColor()
    if (styleBg != null && styleBg != Color.Unspecified) return styleBg
    return null
}

fun UIComponent.resolveBorderRadius(style: ComponentStyle?): Int {
    return (props["borderRadius"] as? Number)?.toInt()
        ?: style?.borderRadius
        ?: style?.cornerRadius
        ?: 0
}

fun UIComponent.resolveShape(): RoundedCornerShape {
    val tl = (props["borderRadiusTopLeft"] as? Number)?.toInt()
    val tr = (props["borderRadiusTopRight"] as? Number)?.toInt()
    val bl = (props["borderRadiusBottomLeft"] as? Number)?.toInt()
    val br = (props["borderRadiusBottomRight"] as? Number)?.toInt()
    return if (tl != null || tr != null || bl != null || br != null) {
        val uniform = resolveBorderRadius(resolveStyle())
        RoundedCornerShape(
            topStart = (tl ?: uniform).dp,
            topEnd = (tr ?: uniform).dp,
            bottomStart = (bl ?: uniform).dp,
            bottomEnd = (br ?: uniform).dp
        )
    } else {
        RoundedCornerShape(resolveBorderRadius(resolveStyle()).dp)
    }
}

fun Modifier.applyWidth(width: Any?): Modifier = when {
    width == null || width == "fill" -> this.fillMaxWidth()
    width == "wrap" -> this.wrapContentWidth()
    width is Number -> this.width(width.toInt().dp)
    width is String -> width.toIntOrNull()?.let { this.width(it.dp) } ?: this.fillMaxWidth()
    else -> this.fillMaxWidth()
}

fun Modifier.applyHeight(height: Any?): Modifier = when {
    height == null || height == "wrap" -> this.wrapContentHeight()
    height == "fill" -> this.fillMaxHeight()
    height is Number -> this.height(height.toInt().dp)
    height is String -> height.toIntOrNull()?.let { this.height(it.dp) } ?: this.wrapContentHeight()
    else -> this.wrapContentHeight()
}

fun Modifier.applyOpacity(opacity: Any?): Modifier {
    val alpha = (opacity as? Number)?.toFloat() ?: return this
    return if (alpha < 1f) this.alpha(alpha) else this
}

fun Modifier.applyBorder(c: UIComponent, style: ComponentStyle?, borderRadius: Int): Modifier {
    val borderObj = c.props["border"] as? Map<*, *>
    val bWidth = (borderObj?.get("width") as? Number)?.toInt()
        ?: style?.borderWidth
        ?: (c.props["borderWidth"] as? Number)?.toInt()
    val bColor = (borderObj?.get("color") as? String)?.toComposeColor()
        ?: style?.borderColor?.toComposeColor()
        ?: (c.props["borderColor"] as? String)?.toComposeColor()

    if (bWidth != null && bWidth > 0 && bColor != null && bColor != Color.Unspecified) {
        return this.border(bWidth.dp, bColor, c.resolveShape())
    }
    return this
}

@Suppress("UNCHECKED_CAST")
fun Modifier.applyPadding(c: UIComponent, style: ComponentStyle?): Modifier {
    // Support object form: padding: { top: 8, bottom: 16, left: 4, right: 4, horizontal: 12, vertical: 8 }
    val paddingObj = c.props["padding"] as? Map<String, Any>
    if (paddingObj != null) {
        val h = (paddingObj["horizontal"] as? Number)?.toInt()
        val v = (paddingObj["vertical"] as? Number)?.toInt()
        val top = (paddingObj["top"] as? Number)?.toInt() ?: v ?: 0
        val bottom = (paddingObj["bottom"] as? Number)?.toInt() ?: v ?: 0
        val left = (paddingObj["left"] as? Number)?.toInt()
        val right = (paddingObj["right"] as? Number)?.toInt()
        val start = (paddingObj["start"] as? Number)?.toInt() ?: left ?: h ?: 0
        val end = (paddingObj["end"] as? Number)?.toInt() ?: right ?: h ?: 0
        return this.padding(start = start.dp, top = top.dp, end = end.dp, bottom = bottom.dp)
    }

    // Individual props: paddingTop, paddingBottom, paddingLeft, paddingRight, paddingStart, paddingEnd
    val pTop = (c.props["paddingTop"] as? Number)?.toInt()
    val pBottom = (c.props["paddingBottom"] as? Number)?.toInt()
    val pLeft = (c.props["paddingLeft"] as? Number)?.toInt()
    val pRight = (c.props["paddingRight"] as? Number)?.toInt()
    val pStart = (c.props["paddingStart"] as? Number)?.toInt()
    val pEnd = (c.props["paddingEnd"] as? Number)?.toInt()

    if (pTop != null || pBottom != null || pLeft != null || pRight != null || pStart != null || pEnd != null) {
        val padding = (c.props["padding"] as? Number)?.toInt() ?: style?.padding ?: 0
        return this.padding(
            start = (pStart ?: pLeft ?: padding).dp,
            top = (pTop ?: padding).dp,
            end = (pEnd ?: pRight ?: padding).dp,
            bottom = (pBottom ?: padding).dp
        )
    }

    // paddingHorizontal / paddingVertical
    val paddingH = (c.props["paddingHorizontal"] as? Number)?.toInt() ?: style?.paddingHorizontal
    val paddingV = (c.props["paddingVertical"] as? Number)?.toInt() ?: style?.paddingVertical

    if (paddingH != null || paddingV != null) {
        return this.padding(horizontal = (paddingH ?: 0).dp, vertical = (paddingV ?: 0).dp)
    }

    // Simple number: padding: 16
    val padding = (c.props["padding"] as? Number)?.toInt() ?: style?.padding ?: 0
    return if (padding > 0) {
        this.padding(padding.dp)
    } else {
        this
    }
}

fun resolveAlignment(value: String?): Alignment.Horizontal = when (value) {
    "center" -> Alignment.CenterHorizontally
    "end" -> Alignment.End
    else -> Alignment.Start
}

fun resolveVerticalAlignment(value: String?): Alignment.Vertical = when (value) {
    "center" -> Alignment.CenterVertically
    "end", "bottom" -> Alignment.Bottom
    else -> Alignment.Top
}

/**
 * Apply accessibility semantics from component props.
 */
fun Modifier.applyAccessibility(c: UIComponent): Modifier {
    val desc = c.propString("contentDescription")
    val hint = c.propString("accessibilityHint")
    val roleStr = c.propString("accessibilityRole")
    val important = c.propBool("importantForAccessibility", true)

    if (desc == null && roleStr == null && hint == null) return this
    if (!important) return this

    return this.semantics {
        if (desc != null) contentDescription = desc
        if (roleStr != null) {
            role = when (roleStr) {
                "button" -> Role.Button
                "checkbox" -> Role.Checkbox
                "switch" -> Role.Switch
                "image" -> Role.Image
                "tab" -> Role.Tab
                else -> Role.Button
            }
        }
    }
}

/**
 * Enforce minimum 48x48dp touch target for clickable components.
 */
fun Modifier.applyMinTouchTarget(isClickable: Boolean): Modifier {
    return if (isClickable) {
        this.then(Modifier.defaultMinSize(minWidth = 48.dp, minHeight = 48.dp))
    } else this
}

// ── Size constraints ──────────────────────────────────────────

fun Modifier.applySizeConstraints(c: UIComponent): Modifier {
    var mod = this
    val minW = (c.props["minWidth"] as? Number)?.toInt()
    val maxW = (c.props["maxWidth"] as? Number)?.toInt()
    if (minW != null || maxW != null) {
        mod = mod.widthIn(
            min = minW?.dp ?: 0.dp,
            max = maxW?.dp ?: androidx.compose.ui.unit.Dp.Unspecified
        )
    }
    val minH = (c.props["minHeight"] as? Number)?.toInt()
    val maxH = (c.props["maxHeight"] as? Number)?.toInt()
    if (minH != null || maxH != null) {
        mod = mod.heightIn(
            min = minH?.dp ?: 0.dp,
            max = maxH?.dp ?: androidx.compose.ui.unit.Dp.Unspecified
        )
    }
    return mod
}

// ── Transform (rotation, scale, translate) ────────────────────

fun Modifier.applyTransform(c: UIComponent): Modifier {
    val rotation = (c.props["rotation"] as? Number)?.toFloat()
    val scaleX = (c.props["scaleX"] as? Number)?.toFloat()
    val scaleY = (c.props["scaleY"] as? Number)?.toFloat()
    val translateX = (c.props["translateX"] as? Number)?.toFloat()
    val translateY = (c.props["translateY"] as? Number)?.toFloat()

    if (rotation == null && scaleX == null && scaleY == null && translateX == null && translateY == null) {
        return this
    }

    return this.graphicsLayer {
        if (rotation != null) rotationZ = rotation
        if (scaleX != null) this.scaleX = scaleX
        if (scaleY != null) this.scaleY = scaleY
        if (translateX != null) this.translationX = translateX * density
        if (translateY != null) this.translationY = translateY * density
    }
}

// ── Background gradient ───────────────────────────────────────

@Suppress("UNCHECKED_CAST")
fun UIComponent.resolveBackgroundBrush(): Brush? {
    val colors = props["backgroundGradient"] as? List<*> ?: return null
    val composeColors = colors.mapNotNull { (it as? String)?.toComposeColor() }
    if (composeColors.size < 2) return null

    return when (props["gradientDirection"] as? String) {
        "horizontal" -> Brush.horizontalGradient(composeColors)
        "diagonal" -> Brush.linearGradient(composeColors)
        else -> Brush.verticalGradient(composeColors) // default vertical
    }
}

// ── Clip to bounds ────────────────────────────────────────────

fun Modifier.applyClipToBounds(c: UIComponent): Modifier {
    val clipToBounds = c.props["clipToBounds"] as? Boolean ?: return this
    return if (clipToBounds) this.clip(c.resolveShape()) else this
}

fun resolveContentAlignment(value: String?): Alignment = when (value) {
    "topStart" -> Alignment.TopStart
    "topCenter" -> Alignment.TopCenter
    "topEnd" -> Alignment.TopEnd
    "centerStart" -> Alignment.CenterStart
    "center" -> Alignment.Center
    "centerEnd" -> Alignment.CenterEnd
    "bottomStart" -> Alignment.BottomStart
    "bottomCenter" -> Alignment.BottomCenter
    "bottomEnd" -> Alignment.BottomEnd
    else -> Alignment.TopStart
}
