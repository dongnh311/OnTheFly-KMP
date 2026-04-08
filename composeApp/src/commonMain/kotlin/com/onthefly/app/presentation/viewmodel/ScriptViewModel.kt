package com.onthefly.app.presentation.viewmodel

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onthefly.app.data.repository.ScriptRepositoryImpl
import com.onthefly.app.data.source.NetworkRequest
import com.onthefly.app.data.source.NetworkSource
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.data.source.DevServerSource
import com.onthefly.app.data.source.ScriptUpdateManager
import com.onthefly.app.data.source.SharedDataStore
import com.onthefly.app.data.source.WebSocketCallback
import com.onthefly.app.data.source.WebSocketOptions
import com.onthefly.app.data.source.WebSocketSource
import com.onthefly.app.data.source.createHttpClient
import com.onthefly.app.domain.model.EngineEvent
import com.onthefly.app.domain.model.NativeAction
import com.onthefly.app.domain.model.UIComponent
import com.onthefly.app.domain.model.applyUpdates
import com.onthefly.app.domain.usecase.LoadScriptUseCase
import com.onthefly.app.engine.DebugConfig
import com.onthefly.app.engine.EngineError
import com.onthefly.app.engine.ErrorConfig
import com.onthefly.app.engine.NetworkSecurity
import com.onthefly.app.engine.QuickJSEngine
import com.onthefly.app.engine.ScriptVerifier
import com.onthefly.app.engine.VersionManager
import com.onthefly.app.platform.PlatformActions
import com.onthefly.app.engine.style.StyleRegistry
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

data class NavigationEvent(
    val screen: String,
    val data: Map<String, Any> = emptyMap(),
    val replace: Boolean = false,
    val clearStack: Boolean = false
)

data class SnackbarEvent(
    val message: String,
    val actionText: String? = null,
    val duration: Long = 3000L
)

data class PopupEvent(
    val title: String,
    val message: String,
    val confirmText: String = "OK",
    val cancelText: String? = "Cancel",
    val onConfirmCallback: String? = null,
    val onCancelCallback: String? = null
)

sealed class UIControlEvent {
    data object HideKeyboard : UIControlEvent()
    data class SetFocus(val componentId: String) : UIControlEvent()
    data class ScrollTo(val componentId: String) : UIControlEvent()
    data class ScrollToItem(val listId: String, val index: Int) : UIControlEvent()
}

class ScriptViewModel(
    private val localStorage: ScriptStorage,
    private val platformActions: PlatformActions? = null
) : ViewModel() {

    private val repository = ScriptRepositoryImpl(localStorage)
    private val loadScript = LoadScriptUseCase(repository)
    private val updateManager = ScriptUpdateManager(localStorage)
    private val engine = QuickJSEngine()

    private val webSocketSource by lazy {
        WebSocketSource(
            client = createHttpClient(),
            callback = object : WebSocketCallback {
                override fun onConnected(id: String) {
                    engine.eval("OnTheFly._updateWSState('$id', 'connected')", "<ws>")
                    sendDataToScript(EngineEvent.ON_WS_CONNECTED, """{"id":"$id"}""")
                }
                override fun onMessage(id: String, message: String) {
                    val escaped = message.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")
                    sendDataToScript(EngineEvent.ON_REALTIME_DATA, """{"id":"$id","message":"$escaped","type":"text"}""")
                }
                override fun onDisconnected(id: String, code: Int, reason: String) {
                    engine.eval("OnTheFly._updateWSState('$id', 'disconnected')", "<ws>")
                    sendDataToScript(EngineEvent.ON_WS_DISCONNECTED, """{"id":"$id","code":$code,"reason":"$reason"}""")
                }
                override fun onError(id: String, error: String) {
                    val escaped = error.replace("\\", "\\\\").replace("\"", "\\\"")
                    sendDataToScript(EngineEvent.ON_WS_ERROR, """{"id":"$id","error":"$escaped"}""")
                }
            },
            scope = viewModelScope
        )
    }

    private val _uiTree = mutableStateOf<UIComponent?>(null)
    val uiTree: State<UIComponent?> = _uiTree

    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    private val _isDevServer = mutableStateOf(false)
    val isDevServer: State<Boolean> = _isDevServer

    private val _toastChannel = Channel<String>(Channel.BUFFERED)
    val toastFlow = _toastChannel.receiveAsFlow()

    private val _navChannel = Channel<NavigationEvent>(Channel.BUFFERED)
    val navFlow = _navChannel.receiveAsFlow()

    private val _snackbarChannel = Channel<SnackbarEvent>(Channel.BUFFERED)
    val snackbarFlow = _snackbarChannel.receiveAsFlow()

    private val _popupState = mutableStateOf<PopupEvent?>(null)
    val popupState: State<PopupEvent?> = _popupState

    private val _uiControlChannel = Channel<UIControlEvent>(Channel.BUFFERED)
    val uiControlFlow = _uiControlChannel.receiveAsFlow()

    private var _pendingGoBack = false
    private var isInitialized = false
    private var currentBundleName: String = ""
    private var errorConfig = ErrorConfig()
    private var loadRetryCount = 0

    fun loadAndRun(bundleName: String) {
        if (isInitialized) return
        currentBundleName = bundleName

        viewModelScope.launch {
            val updated = updateManager.updateFromDevServer(bundleName)
            _isDevServer.value = updated

            try {
                engine.init()
                loadFromLocal(bundleName)
                isInitialized = true
                dispatchLifecycleEvent(EngineEvent.ON_CREATE_VIEW)
            } catch (e: Exception) {
                handleLoadError(e.message ?: "Unknown error")
            }
        }
    }

    private fun loadFromLocal(bundleName: String) {
        // 0. Verify script signature if enabled
        val verification = ScriptVerifier.verify(bundleName, localStorage)
        if (!verification.success) {
            val errMsg = "Script verification failed: ${verification.errors.joinToString("; ")}"
            _error.value = errMsg
            println("ScriptViewModel: $errMsg")
            return
        }

        // 1. Inject OnTheFly.shared API (Kotlin-backed shared store)
        engine.injectSharedAPI(SharedDataStore.toJson())

        // 1b. Inject reactive state management (state/setState/computed/store)
        engine.injectStateAPI()

        // 1c. Inject debug API
        engine.injectDebugAPI()

        // 1d. Inject i18n (multi-language) API
        val languages = repository.loadLanguages()
        if (languages.isNotEmpty()) {
            val langMap = languages.associate { (locale, json) -> locale to json }
            val savedLocale = localStorage.getKV("__locale") ?: "en"
            engine.injectI18nAPI(langMap, savedLocale)
            println("ScriptViewModel: Loaded ${langMap.size} language(s): ${langMap.keys}")
        }

        // 2. Load global libraries (_libs/*.js) — singleton, shared state
        val libs = repository.loadGlobalLibs()
        for ((fileName, content) in libs) {
            val r = engine.eval(content, "_libs/$fileName")
            if (r.startsWith("Error:")) { _error.value = "lib $fileName: $r"; return }
        }
        if (libs.isNotEmpty()) println("QuickJSEngine: Loaded ${libs.size} lib(s)")

        // 3. Load global base functions (_base/*.js) — utilities
        val baseFns = repository.loadGlobalBase()
        for ((fileName, content) in baseFns) {
            val r = engine.eval(content, "_base/$fileName")
            if (r.startsWith("Error:")) { _error.value = "base $fileName: $r"; return }
        }
        if (baseFns.isNotEmpty()) println("QuickJSEngine: Loaded ${baseFns.size} base file(s)")

        // 4. Load theme
        val themeScript = repository.loadTheme(bundleName)
        if (themeScript != null) {
            StyleRegistry.clear()
            engine.eval(themeScript, "theme.js")
            engine.loadStyles()
        }

        // 5. Load manifest config (errorConfig, version compatibility)
        var bundleVersion = "1.0.0"
        try {
            val manifestJson = localStorage.readFile(bundleName, "manifest.json")
            val manifest = com.onthefly.app.util.JsonParser.parseObject(manifestJson)
            @Suppress("UNCHECKED_CAST")
            errorConfig = ErrorConfig.fromMap(manifest["errorConfig"] as? Map<*, *>)
            bundleVersion = manifest["version"] as? String ?: "1.0.0"
            // Version compatibility check
            val versionCheck = VersionManager.checkCompatibility(
                minEngineVersion = manifest["minEngineVersion"] as? String,
                maxEngineVersion = manifest["maxEngineVersion"] as? String
            )
            if (!versionCheck.compatible) {
                _error.value = versionCheck.reason
                return
            }
        } catch (_: Exception) { }

        // 5b. Inject bundle info APIs
        engine.injectBundleInfo(bundleName, bundleVersion)

        // 5c. Inject WebSocket API
        engine.injectWebSocketAPI()

        // 5d. Inject form validation API
        engine.injectValidationAPI()

        // 6. Load bundle-specific base.js (optional)
        val bundleBase = repository.loadBundleBase(bundleName)
        if (bundleBase != null) {
            val r = engine.eval(bundleBase, "$bundleName/base.js")
            if (r.startsWith("Error:")) { _error.value = "base.js: $r"; return }
        }

        // 7. Load main entry
        val bundle = loadScript(bundleName)
        val result = engine.eval(bundle.scriptContent, bundle.entry)
        engine.drainLogs()
        if (result.startsWith("Error:")) {
            _error.value = result
            return
        }

        _uiTree.value = engine.getUITree()
        processNativeActions()
    }

    fun reload() {
        if (currentBundleName.isEmpty()) return
        engine.close()
        isInitialized = false
        _error.value = null
        _uiTree.value = null
        loadAndRun(currentBundleName)
        _toastChannel.trySend("Reloaded!")
    }

    fun startAutoReload() {
        // Try WebSocket push first
        DevServerSource.startWsListener(viewModelScope) {
            viewModelScope.launch {
                updateManager.updateFromDevServer(currentBundleName)
                reload()
            }
        }

        // Fallback polling (runs when WS is unavailable)
        viewModelScope.launch {
            while (true) {
                delay(2000)
                if (!isInitialized || DevServerSource.useWebSocket) continue
                try {
                    if (updateManager.devServerHasChanges()) {
                        updateManager.updateFromDevServer(currentBundleName)
                        reload()
                    }
                } catch (_: Exception) { }
            }
        }
    }

    private fun handleLoadError(message: String) {
        if (loadRetryCount < errorConfig.maxRetries) {
            loadRetryCount++
            println("ScriptViewModel: Load error, retrying ($loadRetryCount/${errorConfig.maxRetries}): $message")
            viewModelScope.launch {
                delay(1000L * loadRetryCount)
                try {
                    engine.close()
                    engine.init()
                    loadFromLocal(currentBundleName)
                    isInitialized = true
                    dispatchLifecycleEvent(EngineEvent.ON_CREATE_VIEW)
                } catch (e: Exception) {
                    handleLoadError(e.message ?: "Unknown error")
                }
            }
        } else {
            _error.value = message
            if (errorConfig.reportErrors) {
                println("ScriptViewModel: SCRIPT_ERROR: $message")
            }
        }
    }

    fun dispatchLifecycleEvent(event: String) {
        if (!isInitialized) return
        try {
            val err = engine.safeDispatchEvent(event)
            if (err != null && errorConfig.reportErrors) {
                println("ScriptViewModel: JS_ERROR in $event: $err")
            }
            refreshUI()
        } catch (_: Exception) { }
    }

    fun sendDataToScript(eventName: String, jsonData: String) {
        if (!isInitialized) return
        try {
            val err = engine.safeDispatchEvent(eventName, jsonData)
            if (err != null && errorConfig.reportErrors) {
                println("ScriptViewModel: JS_ERROR in $eventName: $err")
            }
            refreshUI()
        } catch (_: Exception) { }
    }

    fun onComponentEvent(eventName: String, componentId: String, data: String? = null) {
        if (!isInitialized) return
        try {
            val err = engine.safeDispatchComponentEvent(eventName, componentId, data)
            if (err != null && errorConfig.reportErrors) {
                println("ScriptViewModel: JS_ERROR in $eventName($componentId): $err")
            }
            refreshUI()
        } catch (_: Exception) { }
    }

    fun onEvent(functionName: String) {
        if (!isInitialized) return
        try {
            engine.callFunction(functionName)
            refreshUI()
        } catch (e: Exception) {
            val error = EngineError(type = "js_error", message = e.message ?: "Unknown error")
            engine.dispatchOnError(error)
            if (errorConfig.reportErrors) println("ScriptViewModel: JS_ERROR in $functionName: ${e.message}")
            refreshUI()
        }
    }

    private fun refreshUI() {
        engine.drainLogs()
        val updates = engine.getPendingUpdates()
        if (updates.isNotEmpty()) {
            _uiTree.value = _uiTree.value?.applyUpdates(updates)
        } else {
            engine.getUITree()?.let { _uiTree.value = it }
        }
        processNativeActions()
    }

    @Suppress("UNCHECKED_CAST")
    private fun processNativeActions() {
        val actions = engine.getPendingActions()
        for (action in actions) {
            when (action.action) {
                NativeAction.SHOW_TOAST -> _toastChannel.trySend(action.data["message"] as? String ?: "")
                NativeAction.NAVIGATE -> {
                    val screen = action.data["screen"] as? String ?: ""
                    val navData = (action.data["data"] as? Map<String, Any>) ?: emptyMap()
                    _navChannel.trySend(NavigationEvent(screen = screen, data = navData))
                }
                NativeAction.GO_BACK -> _pendingGoBack = true
                NativeAction.NAVIGATE_DELAYED -> {
                    val screen = action.data["screen"] as? String ?: ""
                    val delayMs = (action.data["delayMs"] as? Number)?.toLong() ?: 2000L
                    viewModelScope.launch { delay(delayMs); _navChannel.trySend(NavigationEvent(screen = screen)) }
                }
                NativeAction.SHARED_STORE -> {
                    val key = action.data["key"] as? String ?: ""
                    val value = action.data["value"]
                    if (key.isNotEmpty()) SharedDataStore.set(key, value)
                }
                NativeAction.SEND_REQUEST -> handleSendRequest(action.data)
                NativeAction.CANCEL_REQUEST -> handleCancelRequest(action.data)
                NativeAction.SET_STORAGE -> handleSetStorage(action.data)
                NativeAction.GET_STORAGE -> handleGetStorage(action.data)
                NativeAction.REMOVE_STORAGE -> handleRemoveStorage(action.data)
                // Platform actions
                NativeAction.OPEN_URL -> platformActions?.openUrl(action.data["url"] as? String ?: "")
                NativeAction.COPY_TO_CLIPBOARD -> platformActions?.copyToClipboard(action.data["text"] as? String ?: "")
                NativeAction.READ_CLIPBOARD -> {
                    val text = platformActions?.readClipboard()
                    sendDataToScript(EngineEvent.ON_DATA_RECEIVED, "{\"type\":\"clipboard\",\"text\":${if (text != null) "\"$text\"" else "null"}}")
                }
                NativeAction.SHARE -> platformActions?.share(
                    title = action.data["title"] as? String,
                    text = action.data["text"] as? String,
                    url = action.data["url"] as? String
                )
                NativeAction.GET_DEVICE_INFO -> {
                    val info = platformActions?.getDeviceInfo() ?: emptyMap()
                    val json = com.onthefly.app.util.JsonParser.toJsonString(info)
                    sendDataToScript(EngineEvent.ON_DATA_RECEIVED, json)
                }
                NativeAction.VIBRATE -> platformActions?.vibrate(
                    type = action.data["type"] as? String,
                    durationMs = (action.data["duration"] as? Number)?.toInt()
                )
                // Navigation (replace/clear)
                NativeAction.NAVIGATE_REPLACE -> {
                    val screen = action.data["screen"] as? String ?: ""
                    val navData = (action.data["data"] as? Map<String, Any>) ?: emptyMap()
                    _navChannel.trySend(NavigationEvent(screen = screen, data = navData, replace = true))
                }
                NativeAction.NAVIGATE_CLEAR_STACK -> {
                    val screen = action.data["screen"] as? String ?: ""
                    val navData = (action.data["data"] as? Map<String, Any>) ?: emptyMap()
                    _navChannel.trySend(NavigationEvent(screen = screen, data = navData, clearStack = true))
                }
                // UI actions
                NativeAction.SHOW_SNACKBAR -> {
                    val message = action.data["message"] as? String ?: ""
                    val actionText = action.data["actionText"] as? String
                    val duration = (action.data["duration"] as? Number)?.toLong() ?: 3000L
                    _snackbarChannel.trySend(SnackbarEvent(message, actionText, duration))
                }
                NativeAction.SHOW_POPUP -> {
                    _popupState.value = PopupEvent(
                        title = action.data["title"] as? String ?: "Alert",
                        message = action.data["message"] as? String ?: "",
                        confirmText = action.data["confirmText"] as? String ?: "OK",
                        cancelText = action.data["cancelText"] as? String,
                        onConfirmCallback = action.data["onConfirm"] as? String,
                        onCancelCallback = action.data["onCancel"] as? String
                    )
                }
                NativeAction.HIDE_KEYBOARD -> _uiControlChannel.trySend(UIControlEvent.HideKeyboard)
                NativeAction.SET_FOCUS -> {
                    val id = action.data["id"] as? String ?: ""
                    if (id.isNotEmpty()) _uiControlChannel.trySend(UIControlEvent.SetFocus(id))
                }
                NativeAction.SCROLL_TO -> {
                    val id = action.data["id"] as? String ?: ""
                    if (id.isNotEmpty()) _uiControlChannel.trySend(UIControlEvent.ScrollTo(id))
                }
                NativeAction.SCROLL_TO_ITEM -> {
                    val listId = action.data["listId"] as? String ?: ""
                    val index = (action.data["index"] as? Number)?.toInt() ?: 0
                    _uiControlChannel.trySend(UIControlEvent.ScrollToItem(listId, index))
                }
                NativeAction.SEND_VIEW_DATA -> {
                    com.onthefly.app.presentation.navigation.ViewDataStore.put(action.data)
                }
                NativeAction.LOG -> {
                    val level = action.data["level"] as? String ?: "d"
                    val message = action.data["message"] as? String ?: action.data.toString()
                    println("[$level] Script: $message")
                }
                // Platform display actions
                NativeAction.SET_STATUS_BAR -> platformActions?.setStatusBarColor(
                    color = action.data["color"] as? String ?: "#000000",
                    darkIcons = action.data["darkIcons"] as? Boolean ?: false
                )
                NativeAction.SET_SCREEN_BRIGHTNESS -> platformActions?.setScreenBrightness(
                    (action.data["level"] as? Number)?.toFloat() ?: 1.0f
                )
                NativeAction.KEEP_SCREEN_ON -> platformActions?.keepScreenOn(
                    action.data["enabled"] as? Boolean ?: true
                )
                NativeAction.SET_ORIENTATION -> platformActions?.setOrientation(
                    action.data["orientation"] as? String ?: "auto"
                )
                // WebSocket
                NativeAction.CONNECT_WS -> {
                    val id = action.data["id"] as? String ?: "default"
                    val url = action.data["url"] as? String ?: ""
                    val secCheck = NetworkSecurity.validate(url)
                    if (!secCheck.allowed) {
                        engine.dispatchOnError(EngineError(
                            type = "websocket_error",
                            message = secCheck.reason ?: "WebSocket blocked by security policy",
                            details = mapOf("url" to url, "id" to id)
                        ))
                    } else {
                        @Suppress("UNCHECKED_CAST")
                        val options = WebSocketOptions(
                            headers = (action.data["headers"] as? Map<String, Any>)?.mapValues { it.value.toString() } ?: emptyMap(),
                            autoReconnect = action.data["autoReconnect"] as? Boolean ?: true,
                            maxReconnectAttempts = (action.data["maxReconnectAttempts"] as? Number)?.toInt() ?: 5,
                            reconnectDelayMs = (action.data["reconnectDelay"] as? Number)?.toLong() ?: 1000,
                            pingIntervalMs = (action.data["pingInterval"] as? Number)?.toLong() ?: 30000
                        )
                        webSocketSource.connect(id, url, options)
                    }
                }
                NativeAction.SEND_WS -> {
                    val id = action.data["id"] as? String ?: "default"
                    val message = action.data["message"] as? String ?: ""
                    webSocketSource.send(id, message)
                }
                NativeAction.CLOSE_WS -> {
                    val id = action.data["id"] as? String ?: "default"
                    webSocketSource.close(id)
                }
                "__debug" -> handleDebugAction(action.data)
                "__setTheme" -> {
                    val theme = action.data["theme"] as? String ?: "light"
                    StyleRegistry.setTheme(theme)
                }
            }
        }
    }

    private fun handleDebugAction(data: Map<String, Any>) {
        val debugAction = data["action"] as? String ?: return
        val value = data["value"] as? Boolean ?: false
        when (debugAction) {
            "setEnabled" -> DebugConfig.enabled.value = value
            "showConsole" -> DebugConfig.showConsole.value = value
            "showInspector" -> DebugConfig.showInspector.value = value
            "showNetworkLog" -> DebugConfig.showNetworkLog.value = value
            "showPerformanceOverlay" -> DebugConfig.showPerformanceOverlay.value = value
            "showStateInspector" -> DebugConfig.showStateInspector.value = value
            "verboseLogging" -> DebugConfig.verboseLogging.value = value
            "clearConsole" -> { /* clear log buffer */ }
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun handleSendRequest(data: Map<String, Any>) {
        val requestId = data["id"] as? String
            ?: data["requestId"] as? String
            ?: "req_${kotlinx.datetime.Clock.System.now().epochSeconds}"
        val url = data["url"] as? String ?: ""
        val method = data["method"] as? String ?: "GET"
        val headers = (data["headers"] as? Map<String, Any>)?.mapValues { it.value.toString() } ?: emptyMap()
        val body = data["body"] as? String
        val timeout = (data["timeout"] as? Number)?.toLong() ?: 30000L
        val retry = (data["retry"] as? Number)?.toInt() ?: 0
        val retryDelay = (data["retryDelay"] as? Number)?.toLong() ?: 1000L
        if (url.isEmpty()) return

        // Security check
        val secCheck = NetworkSecurity.validate(url)
        if (!secCheck.allowed) {
            println("ScriptViewModel: Request blocked: ${secCheck.reason}")
            val error = EngineError(
                type = "network_error",
                message = secCheck.reason ?: "Request blocked by security policy",
                details = mapOf("url" to url, "requestId" to requestId)
            )
            engine.dispatchOnError(error)
            refreshUI()
            return
        }

        val job = viewModelScope.launch {
            val response = NetworkSource.execute(
                NetworkRequest(requestId, url, method, headers, body, timeout, retry, retryDelay)
            )
            NetworkSource.completeRequest(requestId)

            if (response.isError) {
                // Dispatch onError for network errors
                val error = EngineError(
                    type = if (response.status == -3) "timeout_error" else "network_error",
                    message = response.error ?: "HTTP ${response.status}",
                    code = response.status,
                    details = mapOf("url" to url, "requestId" to requestId, "status" to response.status)
                )
                engine.dispatchOnError(error)
                if (errorConfig.reportErrors) {
                    println("ScriptViewModel: NETWORK_ERROR: ${response.error} (${response.status}) $url")
                }
            }
            sendDataToScript(EngineEvent.ON_DATA_RECEIVED, response.toJson())
        }
        NetworkSource.trackRequest(requestId, job)
    }

    private fun handleCancelRequest(data: Map<String, Any>) {
        val requestId = data["requestId"] as? String ?: return
        NetworkSource.cancelRequest(requestId)
    }

    private fun handleSetStorage(data: Map<String, Any>) {
        val key = data["key"] as? String ?: return
        val value = data["value"]?.toString() ?: return
        localStorage.setKV(key, value)
    }

    private fun handleGetStorage(data: Map<String, Any>) {
        val key = data["key"] as? String ?: return
        val value = localStorage.getKV(key)
        val json = "{\"type\":\"storage\",\"key\":\"$key\",\"value\":${if (value != null) "\"$value\"" else "null"}}"
        sendDataToScript(EngineEvent.ON_DATA_RECEIVED, json)
    }

    private fun handleRemoveStorage(data: Map<String, Any>) {
        val key = data["key"] as? String ?: return
        localStorage.removeKV(key)
    }

    fun dismissPopup(confirmed: Boolean) {
        val popup = _popupState.value ?: return
        _popupState.value = null
        if (confirmed) {
            popup.onConfirmCallback?.let { onEvent(it) }
        } else {
            popup.onCancelCallback?.let { onEvent(it) }
        }
    }

    fun consumeGoBack(): Boolean {
        if (_pendingGoBack) { _pendingGoBack = false; return true }
        return false
    }

    override fun onCleared() {
        if (isInitialized) dispatchLifecycleEvent(EngineEvent.ON_DESTROY)
        webSocketSource.closeAll()
        engine.close()
        super.onCleared()
    }
}
