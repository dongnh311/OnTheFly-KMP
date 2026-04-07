package com.onthefly.app.domain.model

data class NativeAction(
    val action: String,
    val data: Map<String, Any> = emptyMap()
) {
    companion object {
        const val NAVIGATE = "navigate"
        const val SEND_REQUEST = "sendRequest"
        const val SEND_VIEW_DATA = "sendViewData"
        const val SHOW_POPUP = "showPopup"
        const val SHOW_TOAST = "showToast"
        const val GO_BACK = "goBack"
        const val NAVIGATE_DELAYED = "navigateDelayed"
        const val SHARED_STORE = "sharedStore"
    }
}
