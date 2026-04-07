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
import com.onthefly.app.engine.QuickJSEngine
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
                _error.value = e.message
            }
        }
    }

    private fun loadFromLocal(bundleName: String) {
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

        // 5. Load bundle-specific base.js (optional)
        val bundleBase = repository.loadBundleBase(bundleName)
        if (bundleBase != null) {
            val r = engine.eval(bundleBase, "$bundleName/base.js")
            if (r.startsWith("Error:")) { _error.value = "base.js: $r"; return }
        }

        // 6. Load main entry
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

    fun dispatchLifecycleEvent(event: String) {
        if (!isInitialized) return
        try { engine.dispatchEvent(event); refreshUI() } catch (_: Exception) { }
    }

    fun sendDataToScript(eventName: String, jsonData: String) {
        if (!isInitialized) return
        try { engine.dispatchEvent(eventName, jsonData); refreshUI() } catch (_: Exception) { }
    }

    fun onComponentEvent(eventName: String, componentId: String, data: String? = null) {
        if (!isInitialized) return
        try { engine.dispatchComponentEvent(eventName, componentId, data); refreshUI() } catch (_: Exception) { }
    }

    fun onEvent(functionName: String) {
        if (!isInitialized) return
        try { engine.callFunction(functionName); refreshUI() } catch (e: Exception) { _error.value = e.message }
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
            }
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun handleSendRequest(data: Map<String, Any>) {
        val requestId = data["id"] as? String ?: "req_${kotlinx.datetime.Clock.System.now().epochSeconds}"
        val url = data["url"] as? String ?: ""
        val method = data["method"] as? String ?: "GET"
        val headers = (data["headers"] as? Map<String, Any>)?.mapValues { it.value.toString() } ?: emptyMap()
        val body = data["body"] as? String
        if (url.isEmpty()) return

        viewModelScope.launch {
            val response = NetworkSource.execute(NetworkRequest(requestId, url, method, headers, body))
            sendDataToScript(EngineEvent.ON_DATA_RECEIVED, response.toJson())
        }
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
