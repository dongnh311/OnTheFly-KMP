package com.onthefly.engine.style

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class ComponentStyle(
    // Text
    val fontSize: Int? = null,
    val fontWeight: String? = null,
    val fontStyle: String? = null,
    val color: String? = null,
    val textColor: String? = null,
    val textAlign: String? = null,
    val textDecoration: String? = null,
    val lineHeight: Float? = null,
    val letterSpacing: Float? = null,
    // Background & Border
    val background: String? = null,
    val backgroundColor: String? = null, // legacy alias for background
    val borderRadius: Int? = null,
    val cornerRadius: Int? = null, // legacy alias for borderRadius
    val borderWidth: Int? = null,
    val borderColor: String? = null,
    val elevation: Int? = null,
    // Layout
    val padding: Int? = null,
    val paddingHorizontal: Int? = null,
    val paddingVertical: Int? = null,
    val spacing: Int? = null,
    val alignment: String? = null,
    val crossAlignment: String? = null,
    // Size
    val width: String? = null,
    val height: Int? = null,
    val opacity: Float? = null
) {
    fun toTextStyle(): TextStyle {
        return TextStyle(
            fontSize = fontSize?.sp ?: TextStyle.Default.fontSize,
            fontWeight = parseFontWeight(fontWeight),
            color = color?.toComposeColor() ?: Color.Unspecified,
            textAlign = parseTextAlign(textAlign),
            textDecoration = parseTextDecoration(textDecoration),
            lineHeight = lineHeight?.sp ?: TextStyle.Default.lineHeight,
            letterSpacing = letterSpacing?.sp ?: TextStyle.Default.letterSpacing
        )
    }

    fun paddingDp(): Dp = (padding ?: 0).dp
    fun paddingHorizontalDp(): Dp = (paddingHorizontal ?: 0).dp
    fun paddingVerticalDp(): Dp = (paddingVertical ?: 0).dp
    fun borderRadiusDp(): Dp = (borderRadius ?: cornerRadius ?: 0).dp
    fun cornerRadiusDp(): Dp = borderRadiusDp() // legacy
    fun spacingDp(): Dp = (spacing ?: 0).dp
    fun heightDp(): Dp = (height ?: 0).dp
    fun elevationDp(): Dp = (elevation ?: 0).dp
    fun borderWidthDp(): Dp = (borderWidth ?: 0).dp

    fun resolvedBackground(): String? = background ?: backgroundColor

    fun backgroundComposeColor(): Color =
        resolvedBackground()?.toComposeColor() ?: Color.Unspecified

    fun borderComposeColor(): Color =
        borderColor?.toComposeColor() ?: Color.Unspecified

    fun textComposeColor(): Color =
        (textColor ?: color)?.toComposeColor() ?: Color.Unspecified
}

fun parseFontWeight(weight: String?): FontWeight = when (weight) {
    "bold" -> FontWeight.Bold
    "semibold", "600" -> FontWeight.SemiBold
    "medium", "500" -> FontWeight.Medium
    "light", "300" -> FontWeight.Light
    "100" -> FontWeight.Thin
    "200" -> FontWeight.ExtraLight
    "400", "normal" -> FontWeight.Normal
    "700" -> FontWeight.Bold
    "800" -> FontWeight.ExtraBold
    "900" -> FontWeight.Black
    else -> FontWeight.Normal
}

fun parseTextAlign(align: String?): TextAlign = when (align) {
    "center" -> TextAlign.Center
    "end", "right" -> TextAlign.End
    "start", "left" -> TextAlign.Start
    "justify" -> TextAlign.Justify
    else -> TextAlign.Unspecified
}

fun parseTextDecoration(decoration: String?): TextDecoration? = when (decoration) {
    "underline" -> TextDecoration.Underline
    "lineThrough" -> TextDecoration.LineThrough
    "none" -> TextDecoration.None
    else -> null
}

fun String.toComposeColor(): Color {
    val hex = removePrefix("#")
    return try {
        when (hex.length) {
            6 -> Color(("FF$hex").toLong(16))
            8 -> Color(hex.toLong(16))
            else -> Color.Unspecified
        }
    } catch (_: Exception) {
        Color.Unspecified
    }
}
