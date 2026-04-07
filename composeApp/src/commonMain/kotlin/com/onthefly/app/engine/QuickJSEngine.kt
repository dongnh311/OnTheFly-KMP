package com.onthefly.app.engine

import com.onthefly.app.domain.model.NativeAction
import com.onthefly.app.domain.model.UIComponent
import com.onthefly.app.domain.model.UIUpdate
import com.onthefly.app.engine.style.StyleRegistry
import com.onthefly.app.util.JsonParser

expect class QuickJSBridge() {
    fun createRuntime(): Long
    fun createContext(runtimePtr: Long): Long
    fun eval(contextPtr: Long, script: String, fileName: String): String
    fun getUI(contextPtr: Long): String
    fun getStyles(contextPtr: Long): String
    fun getPendingUpdates(contextPtr: Long): String
    fun getPendingActions(contextPtr: Long): String
    fun getPendingLogs(contextPtr: Long): String
    fun destroyContext(contextPtr: Long)
    fun destroyRuntime(runtimePtr: Long)
}

class QuickJSEngine : AutoCloseable {

    private val bridge = QuickJSBridge()
    private var runtimePtr: Long = 0L
    private var contextPtr: Long = 0L

    fun init(): Boolean {
        runtimePtr = bridge.createRuntime()
        if (runtimePtr == 0L) {
            println("QuickJSEngine: Failed to create runtime")
            return false
        }
        contextPtr = bridge.createContext(runtimePtr)
        if (contextPtr == 0L) {
            println("QuickJSEngine: Failed to create context")
            bridge.destroyRuntime(runtimePtr)
            runtimePtr = 0L
            return false
        }
        println("QuickJSEngine: Initialized")
        return true
    }

    fun eval(script: String, fileName: String = "<eval>"): String {
        check(contextPtr != 0L) { "Engine not initialized" }
        return bridge.eval(contextPtr, script, fileName)
    }

    /**
     * Inject the OnTheFly.shared API backed by a Kotlin-side store.
     * Must be called after init() and before loading any user scripts.
     */
    fun injectSharedAPI(storeJson: String) {
        val script = """
(function() {
    var _data = $storeJson;
    OnTheFly.shared = {
        get: function(key) { return _data[key]; },
        set: function(key, value) {
            _data[key] = value;
            OnTheFly.sendToNative("sharedStore", { key: key, value: JSON.stringify(value) });
        },
        remove: function(key) {
            delete _data[key];
            OnTheFly.sendToNative("sharedStore", { key: key, value: null });
        },
        getAll: function() { return _data; },
        keys: function() { return Object.keys(_data); }
    };
})();
"""
        eval(script, "<shared-api>")
    }

    fun callFunction(name: String): String {
        return eval("typeof $name === 'function' && $name()")
    }

    fun dispatchEvent(eventName: String, data: String? = null): String {
        val script = if (data != null) {
            "typeof $eventName === 'function' && $eventName($data)"
        } else {
            "typeof $eventName === 'function' && $eventName()"
        }
        return eval(script, "<event:$eventName>")
    }

    fun dispatchComponentEvent(eventName: String, componentId: String, data: String? = null): String {
        val script = if (data != null) {
            "typeof $eventName === 'function' && $eventName('$componentId', $data)"
        } else {
            "typeof $eventName === 'function' && $eventName('$componentId')"
        }
        return eval(script, "<event:$eventName>")
    }

    fun loadStyles() {
        check(contextPtr != 0L) { "Engine not initialized" }
        val stylesJson = bridge.getStyles(contextPtr)
        if (stylesJson.isNotEmpty()) {
            StyleRegistry.register(stylesJson)
        }
    }

    fun getUITree(): UIComponent? {
        check(contextPtr != 0L) { "Engine not initialized" }
        val json = bridge.getUI(contextPtr)
        if (json.isEmpty()) return null
        return try {
            parseComponent(JsonParser.parseObject(json))
        } catch (e: Exception) {
            println("QuickJSEngine: Failed to parse UI JSON: ${e.message}")
            null
        }
    }

    fun getPendingUpdates(): List<UIUpdate> {
        check(contextPtr != 0L) { "Engine not initialized" }
        val json = bridge.getPendingUpdates(contextPtr)
        if (json == "[]") return emptyList()
        return try {
            val arr = JsonParser.parseArray(json)
            arr.mapNotNull { item ->
                val obj = item as? Map<*, *> ?: return@mapNotNull null
                val id = obj["id"] as? String ?: return@mapNotNull null
                val props = (obj["props"] as? Map<*, *>)
                    ?.entries?.associate { (k, v) -> k.toString() to (v as Any) }
                    ?: emptyMap()
                UIUpdate(id = id, props = props)
            }
        } catch (e: Exception) {
            println("QuickJSEngine: Failed to parse updates: ${e.message}")
            emptyList()
        }
    }

    fun getPendingActions(): List<NativeAction> {
        check(contextPtr != 0L) { "Engine not initialized" }
        val json = bridge.getPendingActions(contextPtr)
        if (json == "[]") return emptyList()
        return try {
            val arr = JsonParser.parseArray(json)
            arr.mapNotNull { item ->
                val obj = item as? Map<*, *> ?: return@mapNotNull null
                val action = obj["action"] as? String ?: return@mapNotNull null
                val data = (obj["data"] as? Map<*, *>)
                    ?.entries?.associate { (k, v) -> k.toString() to (v as Any) }
                    ?: emptyMap()
                NativeAction(action = action, data = data)
            }
        } catch (e: Exception) {
            println("QuickJSEngine: Failed to parse actions: ${e.message}")
            emptyList()
        }
    }

    fun drainLogs() {
        check(contextPtr != 0L) { "Engine not initialized" }
        val json = bridge.getPendingLogs(contextPtr)
        if (json == "[]") return
        try {
            val arr = JsonParser.parseArray(json)
            for (item in arr) {
                val obj = item as? Map<*, *> ?: continue
                val level = obj["level"] as? String ?: "d"
                val message = obj["message"] as? String ?: ""
                println("[$level] JS: $message")
            }
        } catch (e: Exception) {
            println("QuickJSEngine: Failed to drain logs: ${e.message}")
        }
    }

    private fun parseComponent(map: Map<String, Any?>): UIComponent {
        val type = map["type"] as? String ?: ""
        val propsMap = (map["props"] as? Map<*, *>)
            ?.entries?.associate { (k, v) -> k.toString() to (v as Any) }
            ?: emptyMap()
        val childrenList = (map["children"] as? List<*>)?.mapNotNull { child ->
            val childMap = child as? Map<*, *> ?: return@mapNotNull null
            @Suppress("UNCHECKED_CAST")
            parseComponent(childMap as Map<String, Any?>)
        } ?: emptyList()

        return UIComponent(type = type, props = propsMap, children = childrenList)
    }

    override fun close() {
        if (contextPtr != 0L) {
            bridge.destroyContext(contextPtr)
            contextPtr = 0L
        }
        if (runtimePtr != 0L) {
            bridge.destroyRuntime(runtimePtr)
            runtimePtr = 0L
        }
        println("QuickJSEngine: Destroyed")
    }
}
