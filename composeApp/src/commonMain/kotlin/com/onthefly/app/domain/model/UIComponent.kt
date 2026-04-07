package com.onthefly.app.domain.model

data class UIComponent(
    val type: String,
    val props: Map<String, Any> = emptyMap(),
    val children: List<UIComponent> = emptyList()
)
