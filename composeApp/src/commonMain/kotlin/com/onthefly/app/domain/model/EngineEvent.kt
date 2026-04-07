package com.onthefly.app.domain.model

object EngineEvent {
    // Lifecycle (Native -> JS)
    const val ON_CREATE_VIEW = "onCreateView"
    const val ON_RESUME = "onResume"
    const val ON_PAUSE = "onPause"
    const val ON_DESTROY = "onDestroy"
    const val ON_VISIBLE = "onVisible"
    const val ON_INVISIBLE = "onInvisible"
    const val ON_NETWORK_RECONNECT = "onNetworkReconnect"
    const val ON_BACK_PRESSED = "onBackPressed"

    // Data (Native -> JS)
    const val ON_DATA_RECEIVED = "onDataReceived"
    const val ON_EVENT_RECEIVED = "onEventReceived"
    const val ON_REALTIME_DATA = "onRealtimeData"
    const val ON_VIEW_DATA = "onViewData"

    // Component (Compose -> JS)
    const val ON_CLICK = "onClick"
    const val ON_TOGGLE = "onToggle"
    const val ON_SELECTED = "onSelected"
    const val ON_CHECK_CLICK = "onCheckClick"
    const val ON_TEXT_CHANGED = "onTextChanged"
    const val ON_SCROLL = "onScroll"
}
