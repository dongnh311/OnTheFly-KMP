package com.onthefly.engine.platform

interface PlatformActions {
    fun openUrl(url: String)
    fun copyToClipboard(text: String)
    fun readClipboard(): String?
    fun share(title: String?, text: String?, url: String?)
    fun getDeviceInfo(): Map<String, Any>
    fun vibrate(type: String?, durationMs: Int?)
    fun showToast(message: String, long: Boolean = false)
    fun setStatusBarColor(color: String, darkIcons: Boolean)
    fun setScreenBrightness(level: Float)
    fun keepScreenOn(enabled: Boolean)
    fun setOrientation(orientation: String)
}
