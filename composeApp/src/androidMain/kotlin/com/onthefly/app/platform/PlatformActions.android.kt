package com.onthefly.app.platform

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.app.Activity
import android.content.pm.ActivityInfo
import android.graphics.Color as AndroidColor
import android.view.WindowManager
import android.widget.Toast
import androidx.core.view.WindowInsetsControllerCompat

actual class PlatformActions(private val context: Context) {

    actual fun openUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } catch (_: Exception) { }
    }

    actual fun copyToClipboard(text: String) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("OnTheFly", text))
    }

    actual fun readClipboard(): String? {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        return clipboard.primaryClip?.getItemAt(0)?.text?.toString()
    }

    actual fun share(title: String?, text: String?, url: String?) {
        val shareText = listOfNotNull(text, url).joinToString("\n")
        if (shareText.isEmpty()) return
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, shareText)
            if (title != null) putExtra(Intent.EXTRA_SUBJECT, title)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(Intent.createChooser(intent, title ?: "Share").apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
    }

    actual fun getDeviceInfo(): Map<String, Any> {
        val displayMetrics = context.resources.displayMetrics
        return mapOf(
            "type" to "deviceInfo",
            "platform" to "android",
            "osVersion" to Build.VERSION.RELEASE,
            "model" to Build.MODEL,
            "manufacturer" to Build.MANUFACTURER,
            "screenWidth" to displayMetrics.widthPixels,
            "screenHeight" to displayMetrics.heightPixels,
            "density" to displayMetrics.density,
            "locale" to context.resources.configuration.locales[0].toLanguageTag(),
            "isDarkMode" to ((context.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES),
            "appVersion" to try { context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "1.0.0" } catch (_: Exception) { "1.0.0" },
            "engineVersion" to "1.0.0"
        )
    }

    @Suppress("DEPRECATION")
    actual fun vibrate(type: String?, durationMs: Int?) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        val duration = durationMs?.toLong() ?: when (type) {
            "light" -> 30L
            "medium" -> 60L
            "heavy" -> 100L
            "success" -> 50L
            "warning" -> 80L
            "error" -> 120L
            else -> 50L
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            vibrator.vibrate(duration)
        }
    }

    actual fun showToast(message: String, long: Boolean) {
        Toast.makeText(context, message, if (long) Toast.LENGTH_LONG else Toast.LENGTH_SHORT).show()
    }

    actual fun setStatusBarColor(color: String, darkIcons: Boolean) {
        val activity = context as? Activity ?: return
        try {
            activity.window.statusBarColor = AndroidColor.parseColor(color)
            val controller = WindowInsetsControllerCompat(activity.window, activity.window.decorView)
            controller.isAppearanceLightStatusBars = darkIcons
        } catch (_: Exception) { }
    }

    actual fun setScreenBrightness(level: Float) {
        val activity = context as? Activity ?: return
        val params = activity.window.attributes
        params.screenBrightness = level.coerceIn(0f, 1f)
        activity.window.attributes = params
    }

    actual fun keepScreenOn(enabled: Boolean) {
        val activity = context as? Activity ?: return
        if (enabled) {
            activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    actual fun setOrientation(orientation: String) {
        val activity = context as? Activity ?: return
        activity.requestedOrientation = when (orientation) {
            "portrait" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            "landscape" -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            else -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }
}
