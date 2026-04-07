package com.onthefly.app.presentation.renderer

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.onthefly.app.domain.model.UIComponent
import com.onthefly.app.engine.style.ComponentStyle
import com.onthefly.app.engine.style.StyleRegistry
import com.onthefly.app.engine.style.toComposeColor

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
        return this.border(bWidth.dp, bColor, RoundedCornerShape(borderRadius.dp))
    }
    return this
}

fun Modifier.applyPadding(c: UIComponent, style: ComponentStyle?): Modifier {
    val padding = (c.props["padding"] as? Number)?.toInt() ?: style?.padding ?: 0
    val paddingH = (c.props["paddingHorizontal"] as? Number)?.toInt() ?: style?.paddingHorizontal
    val paddingV = (c.props["paddingVertical"] as? Number)?.toInt() ?: style?.paddingVertical

    return if (paddingH != null || paddingV != null) {
        this.padding(horizontal = (paddingH ?: 0).dp, vertical = (paddingV ?: 0).dp)
    } else if (padding > 0) {
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
