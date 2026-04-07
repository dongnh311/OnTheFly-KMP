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

    /**
     * Inject the reactive state management API.
     * Provides: OnTheFly.state(), getState(), setState(), computed(), store.*
     * Must be called after init() and before loading user scripts.
     */
    fun injectStateAPI() {
        val script = """
(function() {
    // ═══ Local State (per screen) ═══
    var _state = {};
    var _bindings = {};      // { stateKey: [{ id, prop, template }] }
    var _computedFns = {};   // { key: fn }
    var _computedCache = {}; // { key: value }
    var _computedDeps = {};  // { key: [depKeys] }

    // Declare a reactive state variable
    OnTheFly.state = function(key, initialValue) {
        if (_state[key] === undefined) {
            _state[key] = initialValue;
        }
        return _state[key];
    };

    // Get current state value
    OnTheFly.getState = function(key) {
        return _state[key];
    };

    // Set state → auto-update bound components
    OnTheFly.setState = function(key, value) {
        _state[key] = value;
        _flushBindings(key);
        _recomputeAll();
    };

    // Declare a computed value
    OnTheFly.computed = function(key, fn) {
        _computedFns[key] = fn;
        try {
            _computedCache[key] = fn();
        } catch(e) {
            _computedCache[key] = undefined;
        }
    };

    function _getComputed(key) {
        if (_computedFns[key]) {
            try { return _computedFns[key](); } catch(e) { return _computedCache[key]; }
        }
        return _computedCache[key];
    }

    function _recomputeAll() {
        for (var k in _computedFns) {
            var oldVal = _computedCache[k];
            try {
                var newVal = _computedFns[k]();
                if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                    _computedCache[k] = newVal;
                    _flushComputedBindings(k);
                }
            } catch(e) {}
        }
    }

    // ═══ Binding resolution ═══

    // Resolve ${'$'}state.xxx and ${'$'}computed.xxx in a string
    function _resolveBindings(template) {
        if (typeof template !== 'string') return template;
        // Full match: "${'$'}state.key" → return raw value (could be object/array)
        var fullStateMatch = template.match(/^\${'$'}state\.([a-zA-Z0-9_.]+)$/);
        if (fullStateMatch) {
            return _deepGet(_state, fullStateMatch[1]);
        }
        var fullComputedMatch = template.match(/^\${'$'}computed\.([a-zA-Z0-9_.]+)$/);
        if (fullComputedMatch) {
            return _getComputed(fullComputedMatch[1]);
        }
        // Partial match: "Hello ${'$'}state.name" → string interpolation
        return template.replace(/\${'$'}state\.([a-zA-Z0-9_.]+)/g, function(_, path) {
            var val = _deepGet(_state, path);
            return val !== undefined ? String(val) : '';
        }).replace(/\${'$'}computed\.([a-zA-Z0-9_.]+)/g, function(_, key) {
            var val = _getComputed(key);
            return val !== undefined ? String(val) : '';
        });
    }

    function _deepGet(obj, path) {
        var parts = path.split('.');
        var cur = obj;
        for (var i = 0; i < parts.length; i++) {
            if (cur === undefined || cur === null) return undefined;
            cur = cur[parts[i]];
        }
        return cur;
    }

    // Track binding: which component props use ${'$'}state.xxx
    function _trackBindings(node) {
        if (!node || !node.props) return;
        var id = node.props.id;
        if (id) {
            for (var prop in node.props) {
                var val = node.props[prop];
                if (typeof val === 'string' && val.indexOf('${'$'}state.') >= 0) {
                    var matches = val.match(/\${'$'}state\.([a-zA-Z0-9_]+)/g);
                    if (matches) {
                        for (var m = 0; m < matches.length; m++) {
                            var stateKey = matches[m].replace('${'$'}state.', '').split('.')[0];
                            if (!_bindings[stateKey]) _bindings[stateKey] = [];
                            _bindings[stateKey].push({ id: id, prop: prop, template: val });
                        }
                    }
                }
                if (typeof val === 'string' && val.indexOf('${'$'}computed.') >= 0) {
                    var cmatches = val.match(/\${'$'}computed\.([a-zA-Z0-9_]+)/g);
                    if (cmatches) {
                        for (var cm = 0; cm < cmatches.length; cm++) {
                            var compKey = '_computed_' + cmatches[cm].replace('${'$'}computed.', '');
                            if (!_bindings[compKey]) _bindings[compKey] = [];
                            _bindings[compKey].push({ id: id, prop: prop, template: val });
                        }
                    }
                }
            }
        }
        if (node.children) {
            for (var c = 0; c < node.children.length; c++) {
                _trackBindings(node.children[c]);
            }
        }
    }

    // Flush updates for a state key
    function _flushBindings(stateKey) {
        var binds = _bindings[stateKey];
        if (!binds) return;
        var updates = {};
        for (var i = 0; i < binds.length; i++) {
            var b = binds[i];
            if (!updates[b.id]) updates[b.id] = {};
            updates[b.id][b.prop] = _resolveBindings(b.template);
        }
        for (var id in updates) {
            OnTheFly.update(id, updates[id]);
        }
    }

    function _flushComputedBindings(computedKey) {
        var binds = _bindings['_computed_' + computedKey];
        if (!binds) return;
        var updates = {};
        for (var i = 0; i < binds.length; i++) {
            var b = binds[i];
            if (!updates[b.id]) updates[b.id] = {};
            updates[b.id][b.prop] = _resolveBindings(b.template);
        }
        for (var id in updates) {
            OnTheFly.update(id, updates[id]);
        }
    }

    // ═══ Override setUI to resolve bindings and track them ═══
    var _origSetUI = OnTheFly.setUI;
    OnTheFly.setUI = function(tree) {
        _bindings = {};
        _trackBindings(tree);
        var resolved = _resolveTree(tree);
        _origSetUI(resolved);
    };

    function _resolveTree(node) {
        if (!node) return node;
        var resolved = { type: node.type };
        if (node.props) {
            var rp = {};
            for (var k in node.props) {
                rp[k] = _resolveBindings(node.props[k]);
            }
            resolved.props = rp;
        }
        if (node.children) {
            resolved.children = [];
            for (var i = 0; i < node.children.length; i++) {
                resolved.children.push(_resolveTree(node.children[i]));
            }
        }
        if (node.child) {
            resolved.child = _resolveTree(node.child);
        }
        return resolved;
    }

    // ═══ Global Store (cross-screen, in-memory) ═══
    // Extends existing OnTheFly.shared with watch() capability
    var _watchers = {};

    OnTheFly.store = {
        get: function(key) {
            return OnTheFly.shared ? OnTheFly.shared.get(key) : undefined;
        },
        set: function(key, value) {
            if (OnTheFly.shared) OnTheFly.shared.set(key, value);
            var fns = _watchers[key];
            if (fns) {
                for (var i = 0; i < fns.length; i++) {
                    try { fns[i](value); } catch(e) {}
                }
            }
        },
        watch: function(key, callback) {
            if (!_watchers[key]) _watchers[key] = [];
            _watchers[key].push(callback);
        },
        remove: function(key) {
            if (OnTheFly.shared) OnTheFly.shared.remove(key);
        },
        clear: function() {
            if (OnTheFly.shared) {
                var keys = OnTheFly.shared.keys();
                for (var i = 0; i < keys.length; i++) {
                    OnTheFly.shared.remove(keys[i]);
                }
            }
            _watchers = {};
        }
    };

    // ═══ Animated Update ═══
    OnTheFly.animatedUpdate = function(id, props, animConfig) {
        OnTheFly.update(id, props);
    };

    // ═══ Custom Component Registration ═══
    var _customComponents = {};

    OnTheFly.registerComponent = function(name, builderFn) {
        _customComponents[name] = builderFn;
    };

    // Override setUI to resolve custom components
    var _prevSetUI = OnTheFly.setUI;
    OnTheFly.setUI = function(tree) {
        var resolved = _resolveCustomComponents(tree);
        _prevSetUI(resolved);
    };

    function _resolveCustomComponents(node) {
        if (!node || !node.type) return node;
        var builder = _customComponents[node.type];
        if (builder) {
            var expanded = builder(node.props || {});
            return _resolveCustomComponents(expanded);
        }
        var result = { type: node.type, props: node.props };
        if (node.children) {
            result.children = [];
            for (var i = 0; i < node.children.length; i++) {
                result.children.push(_resolveCustomComponents(node.children[i]));
            }
        }
        if (node.child) {
            result.child = _resolveCustomComponents(node.child);
        }
        return result;
    }
})();
"""
        eval(script, "<state-api>")
    }

    /**
     * Inject bundle info and engine version APIs.
     */
    fun injectBundleInfo(bundleName: String, bundleVersion: String) {
        val script = """
(function() {
    OnTheFly.getBundleInfo = function() {
        return { name: "$bundleName", version: "$bundleVersion" };
    };
    OnTheFly.getEngineVersion = function() {
        return "${VersionManager.ENGINE_VERSION}";
    };
})();
"""
        eval(script, "<bundle-info>")
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

    /**
     * Safely dispatch an event with try-catch wrapping.
     * On JS error: calls onError() if defined, returns the error.
     */
    fun safeDispatchEvent(eventName: String, data: String? = null): String? {
        val result = dispatchEvent(eventName, data)
        if (result.startsWith("Error:")) {
            val error = EngineError(
                type = "js_error",
                message = result.removePrefix("Error: "),
                details = mapOf("event" to eventName)
            )
            dispatchOnError(error)
            return result
        }
        return null
    }

    fun safeDispatchComponentEvent(eventName: String, componentId: String, data: String? = null): String? {
        val result = dispatchComponentEvent(eventName, componentId, data)
        if (result.startsWith("Error:")) {
            val error = EngineError(
                type = "js_error",
                message = result.removePrefix("Error: "),
                details = mapOf("event" to eventName, "componentId" to componentId)
            )
            dispatchOnError(error)
            return result
        }
        return null
    }

    /**
     * Dispatch an error to the JS onError handler.
     * Returns true if onError handled it, false if not defined.
     */
    fun dispatchOnError(error: EngineError): Boolean {
        if (contextPtr == 0L) return false
        val script = "typeof onError === 'function' && onError(${error.toJson()})"
        return try {
            val result = eval(script, "<error-handler>")
            !result.startsWith("Error:")
        } catch (_: Exception) {
            false
        }
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
