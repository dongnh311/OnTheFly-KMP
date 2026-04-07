package com.onthefly.app.data.source

import com.onthefly.app.util.JsonParser

/**
 * In-memory shared store that persists across screen navigations.
 * Used by _libs/ JS files to share data between screens.
 *
 * JS access: OnTheFly.shared.get(key), OnTheFly.shared.set(key, value)
 */
object SharedDataStore {

    private val data = mutableMapOf<String, Any?>()

    fun get(key: String): Any? = data[key]

    fun set(key: String, value: Any?) {
        if (value == null) data.remove(key) else data[key] = value
    }

    fun getAll(): Map<String, Any?> = data.toMap()

    fun clear() { data.clear() }

    fun toJson(): String = JsonParser.toJsonString(data)
}
