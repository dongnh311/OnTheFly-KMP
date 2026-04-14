package com.onthefly.engine.platform

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.useContents
import platform.Foundation.*
import platform.UIKit.*
import platform.darwin.NSObject

@OptIn(ExperimentalForeignApi::class)
class IosPlatformActions : PlatformActions {

    override fun openUrl(url: String) {
        val nsUrl = NSURL.URLWithString(url) ?: return
        UIApplication.sharedApplication.openURL(nsUrl)
    }

    override fun copyToClipboard(text: String) {
        UIPasteboard.generalPasteboard.string = text
    }

    override fun readClipboard(): String? {
        return UIPasteboard.generalPasteboard.string
    }

    override fun share(title: String?, text: String?, url: String?) {
        // iOS share requires UIViewController — simplified fallback
        val items = mutableListOf<Any>()
        text?.let { items.add(it) }
        url?.let { NSURL.URLWithString(it)?.let { u -> items.add(u) } }
        if (items.isEmpty()) return

        // Note: Full share sheet requires access to the root UIViewController
        // which needs to be passed from the SwiftUI/UIKit layer
        println("Share: ${text ?: ""} ${url ?: ""}")
    }

    override fun getDeviceInfo(): Map<String, Any> {
        val device = UIDevice.currentDevice
        val screen = UIScreen.mainScreen
        val locale = NSLocale.currentLocale
        return mapOf(
            "type" to "deviceInfo",
            "platform" to "ios",
            "osVersion" to device.systemVersion,
            "model" to device.model,
            "screenWidth" to screen.bounds.useContents { size.width.toInt() },
            "screenHeight" to screen.bounds.useContents { size.height.toInt() },
            "density" to screen.scale.toFloat(),
            "locale" to locale.localeIdentifier,
            "isDarkMode" to (screen.traitCollection.userInterfaceStyle == UIUserInterfaceStyle.UIUserInterfaceStyleDark),
            "appVersion" to (NSBundle.mainBundle.objectForInfoDictionaryKey("CFBundleShortVersionString") as? String ?: "1.0.0"),
            "engineVersion" to "1.0.0"
        )
    }

    override fun vibrate(type: String?, durationMs: Int?) {
        // iOS haptic feedback via UIImpactFeedbackGenerator
        val style = when (type) {
            "light" -> UIImpactFeedbackStyle.UIImpactFeedbackStyleLight
            "medium" -> UIImpactFeedbackStyle.UIImpactFeedbackStyleMedium
            "heavy" -> UIImpactFeedbackStyle.UIImpactFeedbackStyleHeavy
            "success" -> {
                val gen = UINotificationFeedbackGenerator()
                gen.notificationOccurred(UINotificationFeedbackType.UINotificationFeedbackTypeSuccess)
                return
            }
            "warning" -> {
                val gen = UINotificationFeedbackGenerator()
                gen.notificationOccurred(UINotificationFeedbackType.UINotificationFeedbackTypeWarning)
                return
            }
            "error" -> {
                val gen = UINotificationFeedbackGenerator()
                gen.notificationOccurred(UINotificationFeedbackType.UINotificationFeedbackTypeError)
                return
            }
            else -> UIImpactFeedbackStyle.UIImpactFeedbackStyleMedium
        }
        val gen = UIImpactFeedbackGenerator(style = style)
        gen.impactOccurred()
    }

    override fun showToast(message: String, long: Boolean) {
        // iOS doesn't have native toast — log for now
        println("Toast: $message")
    }

    override fun setStatusBarColor(color: String, darkIcons: Boolean) {
        // iOS status bar style is controlled via Info.plist or UIViewController
        println("PlatformActions.ios: setStatusBarColor($color, darkIcons=$darkIcons)")
    }

    override fun setScreenBrightness(level: Float) {
        UIScreen.mainScreen.brightness = level.toDouble().coerceIn(0.0, 1.0)
    }

    override fun keepScreenOn(enabled: Boolean) {
        UIApplication.sharedApplication.idleTimerDisabled = enabled
    }

    override fun setOrientation(orientation: String) {
        // iOS orientation control requires UIViewController — log for now
        println("PlatformActions.ios: setOrientation($orientation)")
    }
}
