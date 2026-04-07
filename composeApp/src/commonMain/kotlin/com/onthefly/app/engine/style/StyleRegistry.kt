package com.onthefly.app.engine.style

import com.onthefly.app.util.JsonParser

object StyleRegistry {

    // theme → styles map
    private val themeStyles = mutableMapOf<String, MutableMap<String, ComponentStyle>>()
    private var currentTheme: String = "light"

    private val activeStyles: MutableMap<String, ComponentStyle>
        get() = themeStyles.getOrPut(currentTheme) { mutableMapOf() }

    fun register(stylesJson: String, theme: String = currentTheme) {
        try {
            val map = JsonParser.parseObject(stylesJson)
            val target = themeStyles.getOrPut(theme) { mutableMapOf() }
            for ((key, value) in map) {
                val styleMap = value as? Map<*, *> ?: continue
                target[key] = parseStyle(styleMap)
            }
            println("StyleRegistry: Registered ${target.size} styles for theme '$theme': ${target.keys}")
        } catch (e: Exception) {
            println("StyleRegistry: Failed to parse styles: ${e.message}")
        }
    }

    fun get(name: String): ComponentStyle? {
        // Try current theme first, fallback to "light"
        return activeStyles[name]
            ?: themeStyles["light"]?.get(name)
    }

    fun setTheme(theme: String) {
        currentTheme = theme
        println("StyleRegistry: Theme set to '$theme'")
    }

    fun getTheme(): String = currentTheme

    fun clear() {
        themeStyles.clear()
        currentTheme = "light"
    }

    private fun parseStyle(styleMap: Map<*, *>): ComponentStyle {
        return ComponentStyle(
            fontSize = (styleMap["fontSize"] as? Number)?.toInt(),
            fontWeight = styleMap["fontWeight"] as? String,
            fontStyle = styleMap["fontStyle"] as? String,
            color = styleMap["color"] as? String,
            textColor = styleMap["textColor"] as? String,
            textAlign = styleMap["textAlign"] as? String,
            textDecoration = styleMap["textDecoration"] as? String,
            lineHeight = (styleMap["lineHeight"] as? Number)?.toFloat(),
            letterSpacing = (styleMap["letterSpacing"] as? Number)?.toFloat(),
            background = styleMap["background"] as? String,
            backgroundColor = styleMap["backgroundColor"] as? String,
            borderRadius = (styleMap["borderRadius"] as? Number)?.toInt(),
            cornerRadius = (styleMap["cornerRadius"] as? Number)?.toInt(),
            borderWidth = (styleMap["borderWidth"] as? Number)?.toInt(),
            borderColor = styleMap["borderColor"] as? String,
            elevation = (styleMap["elevation"] as? Number)?.toInt(),
            padding = (styleMap["padding"] as? Number)?.toInt(),
            paddingHorizontal = (styleMap["paddingHorizontal"] as? Number)?.toInt(),
            paddingVertical = (styleMap["paddingVertical"] as? Number)?.toInt(),
            spacing = (styleMap["spacing"] as? Number)?.toInt(),
            alignment = styleMap["alignment"] as? String,
            crossAlignment = styleMap["crossAlignment"] as? String,
            width = styleMap["width"]?.toString(),
            height = (styleMap["height"] as? Number)?.toInt(),
            opacity = (styleMap["opacity"] as? Number)?.toFloat()
        )
    }
}
