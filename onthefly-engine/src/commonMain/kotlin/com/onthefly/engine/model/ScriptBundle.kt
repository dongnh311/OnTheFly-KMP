package com.onthefly.engine.model

data class ScriptBundle(
    val name: String,
    val version: String,
    val entry: String,
    val scriptContent: String
)
