package com.onthefly.app.domain.model

data class NativeAction(
    val action: String,
    val data: Map<String, Any> = emptyMap()
) {
    companion object {
        // Navigation
        const val NAVIGATE = "navigate"
        const val GO_BACK = "goBack"
        const val NAVIGATE_DELAYED = "navigateDelayed"
        const val NAVIGATE_REPLACE = "navigateReplace"
        const val NAVIGATE_CLEAR_STACK = "navigateClearStack"

        // Network
        const val SEND_REQUEST = "sendRequest"
        const val CANCEL_REQUEST = "cancelRequest"

        // UI
        const val SHOW_TOAST = "showToast"
        const val SHOW_POPUP = "showPopup"
        const val SHOW_SNACKBAR = "showSnackbar"
        const val HIDE_KEYBOARD = "hideKeyboard"
        const val SET_FOCUS = "setFocus"
        const val SCROLL_TO = "scrollTo"
        const val SCROLL_TO_ITEM = "scrollToItem"

        // Data
        const val SEND_VIEW_DATA = "sendViewData"
        const val SHARED_STORE = "sharedStore"

        // Storage
        const val SET_STORAGE = "setStorage"
        const val GET_STORAGE = "getStorage"
        const val REMOVE_STORAGE = "removeStorage"

        // Platform
        const val OPEN_URL = "openUrl"
        const val COPY_TO_CLIPBOARD = "copyToClipboard"
        const val READ_CLIPBOARD = "readClipboard"
        const val SHARE = "share"
        const val GET_DEVICE_INFO = "getDeviceInfo"
        const val VIBRATE = "vibrate"
        const val SET_STATUS_BAR = "setStatusBar"
        const val SET_SCREEN_BRIGHTNESS = "setScreenBrightness"
        const val KEEP_SCREEN_ON = "keepScreenOn"
        const val SET_ORIENTATION = "setOrientation"

        // Logging
        const val LOG = "log"
    }
}
