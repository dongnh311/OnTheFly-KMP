package com.onthefly.engine.renderer

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
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
import coil3.compose.AsyncImage
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.model.UIComponent
import com.onthefly.engine.style.parseFontWeight
import com.onthefly.engine.style.parseTextAlign
import com.onthefly.engine.style.parseTextDecoration
import com.onthefly.engine.style.toComposeColor

@Composable
fun RenderText(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val text = c.propString("text") ?: ""
    val style = c.resolveStyle()
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val fontSize = (c.props["fontSize"] as? Number)?.toInt() ?: style?.fontSize
    val fontWeight = c.propString("fontWeight") ?: style?.fontWeight
    val fontStyle = c.propString("fontStyle") ?: style?.fontStyle
    val color = c.propColor("color") ?: style?.color?.toComposeColor()
    val textAlign = c.propString("textAlign") ?: style?.textAlign
    val maxLines = (c.props["maxLines"] as? Number)?.toInt()
    val overflow = c.propString("overflow")
    val lineHeight = (c.props["lineHeight"] as? Number)?.toFloat() ?: style?.lineHeight
    val letterSpacing = (c.props["letterSpacing"] as? Number)?.toFloat() ?: style?.letterSpacing
    val textDecoration = c.propString("textDecoration") ?: style?.textDecoration

    val textStyle = TextStyle(
        fontSize = fontSize?.sp ?: TextStyle.Default.fontSize,
        fontWeight = parseFontWeight(fontWeight),
        fontStyle = if (fontStyle == "italic") FontStyle.Italic else FontStyle.Normal,
        color = color ?: Color.Unspecified,
        textAlign = parseTextAlign(textAlign),
        textDecoration = parseTextDecoration(textDecoration),
        lineHeight = lineHeight?.sp ?: TextStyle.Default.lineHeight,
        letterSpacing = letterSpacing?.sp ?: TextStyle.Default.letterSpacing
    )

    val textOverflow = when (overflow) {
        "clip" -> TextOverflow.Clip
        "visible" -> TextOverflow.Visible
        else -> TextOverflow.Ellipsis
    }

    var mod = modifier
        .applyPadding(c, style)
        .applyOpacity(c.props["opacity"])
    if (onClick != null || componentId != null) {
        mod = mod.clickable {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    val selectable = c.propBool("selectable")
    val htmlText = c.propBool("html")

    val content: @Composable () -> Unit = {
        if (htmlText) {
            Text(
                text = parseSimpleHtml(text),
                style = textStyle,
                modifier = mod,
                maxLines = maxLines ?: Int.MAX_VALUE,
                overflow = textOverflow
            )
        } else {
            Text(
                text = text,
                style = textStyle,
                modifier = mod,
                maxLines = maxLines ?: Int.MAX_VALUE,
                overflow = textOverflow
            )
        }
    }

    if (selectable) {
        SelectionContainer { content() }
    } else {
        content()
    }
}

/**
 * Parse simple HTML tags: <b>, <i>, <u>, <s>, <br>, <font color="...">.
 * Lightweight parser — not a full HTML engine.
 */
private fun parseSimpleHtml(html: String): AnnotatedString {
    return buildAnnotatedString {
        var i = 0
        val styleStack = mutableListOf<SpanStyle>()

        while (i < html.length) {
            if (html[i] == '<') {
                val end = html.indexOf('>', i)
                if (end == -1) { append(html[i]); i++; continue }
                val tag = html.substring(i + 1, end).trim().lowercase()
                i = end + 1

                when {
                    tag == "b" || tag == "strong" -> {
                        val s = SpanStyle(fontWeight = FontWeight.Bold)
                        styleStack.add(s)
                        pushStyle(s)
                    }
                    tag == "i" || tag == "em" -> {
                        val s = SpanStyle(fontStyle = FontStyle.Italic)
                        styleStack.add(s)
                        pushStyle(s)
                    }
                    tag == "u" -> {
                        val s = SpanStyle(textDecoration = TextDecoration.Underline)
                        styleStack.add(s)
                        pushStyle(s)
                    }
                    tag == "s" || tag == "strike" || tag == "del" -> {
                        val s = SpanStyle(textDecoration = TextDecoration.LineThrough)
                        styleStack.add(s)
                        pushStyle(s)
                    }
                    tag == "br" || tag == "br/" || tag == "br /" -> {
                        append("\n")
                    }
                    tag.startsWith("font") -> {
                        val colorMatch = Regex("""color\s*=\s*["']([^"']+)["']""").find(tag)
                        val sizeMatch = Regex("""size\s*=\s*["']([^"']+)["']""").find(tag)
                        val color = colorMatch?.groupValues?.get(1)?.toComposeColor()
                        val size = sizeMatch?.groupValues?.get(1)?.toIntOrNull()
                        val s = SpanStyle(
                            color = color ?: Color.Unspecified,
                            fontSize = size?.sp ?: androidx.compose.ui.unit.TextUnit.Unspecified
                        )
                        styleStack.add(s)
                        pushStyle(s)
                    }
                    tag.startsWith("/") -> {
                        if (styleStack.isNotEmpty()) {
                            styleStack.removeAt(styleStack.lastIndex)
                            pop()
                        }
                    }
                }
            } else {
                append(html[i])
                i++
            }
        }
    }
}

@Composable
fun RenderImage(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val url = c.propString("url")
    val borderRadius = c.propInt("borderRadius")
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val contentScale = when (c.propString("contentScale")) {
        "fill" -> ContentScale.FillBounds
        "crop" -> ContentScale.Crop
        "inside" -> ContentScale.Inside
        "none" -> ContentScale.None
        else -> ContentScale.Fit
    }

    var mod = modifier
        .applyWidth(c.props["width"] ?: "fill")
        .applyHeight(c.props["height"])
        .applyOpacity(c.props["opacity"])

    if (borderRadius > 0) mod = mod.clip(RoundedCornerShape(borderRadius.dp))
    if (onClick != null || componentId != null) {
        mod = mod.clickable {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    val tintColor = c.propColor("tintColor")

    if (url != null) {
        AsyncImage(
            model = url,
            contentDescription = c.propString("contentDescription"),
            modifier = mod,
            contentScale = contentScale,
            colorFilter = tintColor?.let { ColorFilter.tint(it) }
        )
    } else {
        androidx.compose.foundation.layout.Box(
            modifier = mod.then(
                if (c.props["height"] == null) Modifier.size(200.dp) else Modifier
            ),
            contentAlignment = androidx.compose.ui.Alignment.Center
        ) {
            Text(text = "No URL", style = TextStyle(color = Color.Gray, fontSize = 12.sp))
        }
    }
}

@Composable
fun RenderIcon(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val name = c.propString("name") ?: "help"
    val size = c.propInt("size", 24)
    val color = c.propColor("color") ?: Color.Unspecified
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val icon = resolveIcon(name)

    var mod = modifier.size(size.dp)
    if (onClick != null || componentId != null) {
        mod = mod.clickable {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    Icon(
        imageVector = icon,
        contentDescription = c.propString("contentDescription"),
        modifier = mod,
        tint = color
    )
}

@Composable
fun RenderIconButton(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val iconName = c.propString("icon") ?: "help"
    val iconSize = c.propInt("iconSize", 24)
    val color = c.propColor("color") ?: Color.Unspecified
    val enabled = c.propBool("enabled", true)
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val icon = resolveIcon(iconName)

    IconButton(
        onClick = {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        },
        enabled = enabled,
        modifier = modifier
    ) {
        Icon(
            imageVector = icon,
            contentDescription = c.propString("contentDescription"),
            modifier = Modifier.size(iconSize.dp),
            tint = color
        )
    }
}

fun resolveIcon(name: String): ImageVector = when (name) {
    "home" -> Icons.Default.Home
    "settings" -> Icons.Default.Settings
    "search" -> Icons.Default.Search
    "add" -> Icons.Default.Add
    "close" -> Icons.Default.Close
    "delete" -> Icons.Default.Delete
    "edit" -> Icons.Default.Edit
    "favorite" -> Icons.Default.Favorite
    "favorite_border" -> Icons.Default.FavoriteBorder
    "star" -> Icons.Default.Star
    "person" -> Icons.Default.Person
    "email" -> Icons.Default.Email
    "phone" -> Icons.Default.Phone
    "lock" -> Icons.Default.Lock
    "visibility" -> Icons.Default.Visibility
    "visibility_off" -> Icons.Default.VisibilityOff
    "check" -> Icons.Default.Check
    "check_circle" -> Icons.Default.CheckCircle
    "error" -> Icons.Default.Error
    "warning" -> Icons.Default.Warning
    "info" -> Icons.Default.Info
    "arrow_back" -> Icons.AutoMirrored.Filled.ArrowBack
    "arrow_forward" -> Icons.AutoMirrored.Filled.ArrowForward
    "arrow_drop_down" -> Icons.Default.ArrowDropDown
    "menu" -> Icons.Default.Menu
    "more_vert" -> Icons.Default.MoreVert
    "refresh" -> Icons.Default.Refresh
    "share" -> Icons.Default.Share
    "notifications" -> Icons.Default.Notifications
    "shopping_cart" -> Icons.Default.ShoppingCart
    "location_on" -> Icons.Default.LocationOn
    "calendar_today" -> Icons.Default.DateRange
    "access_time" -> Icons.Default.DateRange
    "camera" -> Icons.Default.CameraAlt
    "photo" -> Icons.Default.Photo
    "send" -> Icons.AutoMirrored.Filled.Send
    "done" -> Icons.Default.Done
    "clear" -> Icons.Default.Clear
    "account_circle" -> Icons.Default.AccountCircle
    "thumb_up" -> Icons.Default.ThumbUp
    "chat" -> Icons.Default.Email
    "help" -> Icons.Default.Info
    "play_arrow" -> Icons.Default.PlayArrow
    "pause" -> Icons.Default.Pause
    "stop" -> Icons.Default.Stop
    "download" -> Icons.Default.Download
    "upload" -> Icons.Default.Upload
    "copy" -> Icons.Default.ContentCopy
    "save" -> Icons.Default.Save
    "archive" -> Icons.Default.Archive
    else -> Icons.Default.HelpOutline
}
