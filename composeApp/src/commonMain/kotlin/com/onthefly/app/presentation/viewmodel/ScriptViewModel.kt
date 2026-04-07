package com.onthefly.app.presentation.viewmodel

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.onthefly.app.data.repository.ScriptRepositoryImpl
import com.onthefly.app.data.source.NetworkRequest
import com.onthefly.app.data.source.NetworkSource
import com.onthefly.app.data.source.ScriptStorage
import com.onthefly.app.data.source.ScriptUpdateManager
import com.onthefly.app.data.source.SharedDataStore
import com.onthefly.app.domain.model.EngineEvent
import com.onthefly.app.domain.model.NativeAction
import com.onthefly.app.domain.model.UIComponent
import com.onthefly.app.domain.model.applyUpdates
import com.onthefly.app.domain.usecase.LoadScriptUseCase
import com.onthefly.app.engine.EngineError
import com.onthefly.app.engine.ErrorConfig
import com.onthefly.app.engine.NetworkSecurity
import com.onthefly.app.engine.QuickJSEngine
import com.onthefly.app.engine.ScriptVerifier
import com.onthefly.app.engine.style.StyleRegistry
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

data class NavigationEvent(
    val screen: String,
    val data: Map<String, Any> = emptyMap()
)

class ScriptViewModel(localStorage: ScriptStorage) : ViewModel() {

    private val repository = ScriptRepositoryImpl(localStorage)
    private val loadScript = LoadScriptUseCase(repository)
    private val updateManager = ScriptUpdateManager(localStorage)
    private val engine = QuickJSEngine()

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

        // 5. Load errorConfig from manifest
        try {
            val manifestJson = localStorage.readFile(bundleName, "manifest.json")
            val manifest = com.onthefly.app.util.JsonParser.parseObject(manifestJson)
            @Suppress("UNCHECKED_CAST")
            errorConfig = ErrorConfig.fromMap(manifest["errorConfig"] as? Map<*, *>)
        } catch (_: Exception) { }

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
        viewModelScope.launch {
            while (true) {
                delay(2000)
                if (!isInitialized) continue
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
            }
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

    fun consumeGoBack(): Boolean {
        if (_pendingGoBack) { _pendingGoBack = false; return true }
        return false
    }

    override fun onCleared() {
        if (isInitialized) dispatchLifecycleEvent(EngineEvent.ON_DESTROY)
        engine.close()
        super.onCleared()
    }
}
