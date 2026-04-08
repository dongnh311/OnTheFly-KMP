package com.onthefly.app.platform

import java.awt.Desktop
import java.awt.Toolkit
import java.awt.datatransfer.DataFlavor
import java.awt.datatransfer.StringSelection
import java.net.URI

actual class PlatformActions {

    actual fun openUrl(url: String) {
        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(URI(url))
            }
        } catch (_: Exception) { }
    }

    actual fun copyToClipboard(text: String) {
        try {
            val clipboard = Toolkit.getDefaultToolkit().systemClipboard
            clipboard.setContents(StringSelection(text), null)
        } catch (_: Exception) { }
    }

    actual fun readClipboard(): String? {
        return try {
            val clipboard = Toolkit.getDefaultToolkit().systemClipboard
            clipboard.getData(DataFlavor.stringFlavor) as? String
        } catch (_: Exception) { null }
    }

    actual fun share(title: String?, text: String?, url: String?) {
        // Desktop doesn't have native share sheet — copy to clipboard
        val shareText = listOfNotNull(text, url).joinToString("\n")
        if (shareText.isNotEmpty()) copyToClipboard(shareText)
    }

    actual fun getDeviceInfo(): Map<String, Any> {
        val screenSize = Toolkit.getDefaultToolkit().screenSize
        return mapOf(
            "type" to "deviceInfo",
            "platform" to "desktop",
            "osVersion" to System.getProperty("os.version", ""),
            "model" to System.getProperty("os.name", "Desktop"),
            "screenWidth" to screenSize.width,
            "screenHeight" to screenSize.height,
            "density" to 1.0,
            "locale" to java.util.Locale.getDefault().toLanguageTag(),
            "isDarkMode" to false,
            "appVersion" to "1.0.0",
            "engineVersion" to "1.0.0"
        )
    }

    actual fun vibrate(type: String?, durationMs: Int?) {
        // Desktop: beep as haptic substitute
        try { Toolkit.getDefaultToolkit().beep() } catch (_: Exception) { }
    }

    actual fun showToast(message: String, long: Boolean) {
        println("Toast: $message")
    }

    actual fun setStatusBarColor(color: String, darkIcons: Boolean) {
        // No status bar on desktop
    }

    actual fun setScreenBrightness(level: Float) {
        // Not supported on desktop
    }

    actual fun keepScreenOn(enabled: Boolean) {
        // Not supported on desktop
    }

    actual fun setOrientation(orientation: String) {
        // Not supported on desktop
    }
}
