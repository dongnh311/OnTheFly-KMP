package com.onthefly.engine.model

data class UIComponent(
    val type: String,
    val props: Map<String, Any> = emptyMap(),
    val children: List<UIComponent> = emptyList()
)
