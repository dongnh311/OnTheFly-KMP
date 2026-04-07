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
                    color = styleMap["color"] as? String,
                    backgroundColor = styleMap["backgroundColor"] as? String,
                    padding = (styleMap["padding"] as? Number)?.toInt(),
                    cornerRadius = (styleMap["cornerRadius"] as? Number)?.toInt(),
                    textAlign = styleMap["textAlign"] as? String,
                    width = styleMap["width"] as? String,
                    height = (styleMap["height"] as? Number)?.toInt(),
                    spacing = (styleMap["spacing"] as? Number)?.toInt(),
                    alignment = styleMap["alignment"] as? String
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
