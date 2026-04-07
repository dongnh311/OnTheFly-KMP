package com.onthefly.app.engine.style

import com.onthefly.app.util.JsonParser

object StyleRegistry {

    private val styles = mutableMapOf<String, ComponentStyle>()

    fun register(stylesJson: String) {
        try {
            val map = JsonParser.parseObject(stylesJson)
            for ((key, value) in map) {
                val styleMap = value as? Map<*, *> ?: continue
                styles[key] = ComponentStyle(
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
            println("StyleRegistry: Registered ${styles.size} styles: ${styles.keys}")
        } catch (e: Exception) {
            println("StyleRegistry: Failed to parse styles: ${e.message}")
        }
    }

    fun get(name: String): ComponentStyle? = styles[name]

    fun clear() {
        styles.clear()
    }
}
