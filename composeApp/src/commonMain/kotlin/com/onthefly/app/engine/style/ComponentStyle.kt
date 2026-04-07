package com.onthefly.app.engine.style

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class ComponentStyle(
    val fontSize: Int? = null,
    val fontWeight: String? = null,
    val color: String? = null,
    val backgroundColor: String? = null,
    val padding: Int? = null,
    val cornerRadius: Int? = null,
    val textAlign: String? = null,
    val width: String? = null,
    val height: Int? = null,
    val spacing: Int? = null,
    val alignment: String? = null
) {
    fun toTextStyle(): TextStyle {
        return TextStyle(
            fontSize = fontSize?.sp ?: TextStyle.Default.fontSize,
            fontWeight = when (fontWeight) {
                "bold" -> FontWeight.Bold
                "semibold" -> FontWeight.SemiBold
                "medium" -> FontWeight.Medium
                "light" -> FontWeight.Light
                else -> FontWeight.Normal
            },
            color = color?.toComposeColor() ?: Color.Unspecified
        )
    }

    fun paddingDp(): Dp = (padding ?: 0).dp
    fun cornerRadiusDp(): Dp = (cornerRadius ?: 0).dp
    fun spacingDp(): Dp = (spacing ?: 0).dp
    fun heightDp(): Dp = (height ?: 0).dp

    fun backgroundComposeColor(): Color =
        backgroundColor?.toComposeColor() ?: Color.Unspecified
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
