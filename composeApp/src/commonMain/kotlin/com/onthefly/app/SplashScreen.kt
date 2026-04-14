package com.onthefly.app

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onthefly.engine.data.ScriptStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// Dark theme colors
private val DarkBg = Color(0xFF0A0E17)
private val DarkAccentCyan = Color(0xFF06B6D4)
private val DarkAccentBlue = Color(0xFF3B82F6)
private val DarkSubtleGray = Color(0xFF6B7280)
private val DarkProgressTrack = Color(0xFF1E293B)
private val DarkTextPrimary = Color.White

// Light theme colors
private val LightBg = Color(0xFFF8FAFC)
private val LightAccentCyan = Color(0xFF0891B2)
private val LightAccentBlue = Color(0xFF2563EB)
private val LightSubtleGray = Color(0xFF64748B)
private val LightProgressTrack = Color(0xFFE2E8F0)
private val LightTextPrimary = Color(0xFF1E293B)

private const val MIN_DISPLAY_MS = 2000L

data class SplashStrings(
    val checking: String,
    val extracting: String,
    val downloading: String,
    val ready: String
) {
    companion object {
        val EN = SplashStrings(
            checking = "Checking version...",
            extracting = "Updating scripts...",
            downloading = "Downloading update...",
            ready = "Ready"
        )
        val VI = SplashStrings(
            checking = "Đang kiểm tra phiên bản...",
            extracting = "Đang cập nhật...",
            downloading = "Đang tải bản cập nhật...",
            ready = "Sẵn sàng"
        )

        fun forLocale(locale: String): SplashStrings = when (locale) {
            "vi" -> VI
            else -> EN
        }
    }
}

@Composable
fun SplashScreen(
    localStorage: ScriptStorage,
    productionServerUrl: String? = null,
    appVersion: String = "1.0.0",
    onReady: () -> Unit
) {
    // Read persisted preferences
    val isDark = remember {
        val saved = localStorage.getKV("dark_mode")
        saved == null || saved == "true" // default to dark
    }
    val locale = remember {
        localStorage.getKV("stock_lang") ?: localStorage.getKV("__locale") ?: "en"
    }
    val strings = remember(locale) { SplashStrings.forLocale(locale) }

    // Theme colors based on preference
    val bgColor = if (isDark) DarkBg else LightBg
    val textPrimary = if (isDark) DarkTextPrimary else LightTextPrimary
    val accentCyan = if (isDark) DarkAccentCyan else LightAccentCyan
    val accentBlue = if (isDark) DarkAccentBlue else LightAccentBlue
    val subtleGray = if (isDark) DarkSubtleGray else LightSubtleGray
    val progressTrack = if (isDark) DarkProgressTrack else LightProgressTrack

    var progress by remember { mutableFloatStateOf(0f) }
    var statusText by remember { mutableStateOf(strings.checking) }

    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 300)
    )

    LaunchedEffect(Unit) {
        // Run initialization in background
        val initJob = async(Dispatchers.Default) {
            initializeScripts(localStorage, productionServerUrl)
        }

        // Smooth progress animation over the display period
        statusText = strings.checking
        animateProgressSmooth(0f, 0.3f, 400L) { progress = it }

        statusText = strings.extracting
        animateProgressSmooth(0.3f, 0.75f, 800L) { progress = it }

        statusText = strings.downloading
        animateProgressSmooth(0.75f, 0.95f, 500L) { progress = it }

        // Wait for init to actually finish
        initJob.await()

        statusText = strings.ready
        animateProgressSmooth(0.95f, 1f, 200L) { progress = it }

        delay(100L)
        onReady()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(bgColor)
    ) {
        // Center: App logo
        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "OnTheFly",
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold,
                color = textPrimary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Dynamic UI Engine",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = accentCyan,
                textAlign = TextAlign.Center
            )
        }

        // Bottom: Progress bar + version + status
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 48.dp, vertical = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = accentBlue,
                trackColor = progressTrack
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Ver.$appVersion",
                    fontSize = 12.sp,
                    color = subtleGray
                )
                Text(
                    text = "  |  ",
                    fontSize = 12.sp,
                    color = subtleGray.copy(alpha = 0.5f)
                )
                Text(
                    text = "${(animatedProgress * 100).toInt()}%",
                    fontSize = 12.sp,
                    color = subtleGray
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = statusText,
                fontSize = 11.sp,
                color = subtleGray.copy(alpha = 0.6f)
            )
        }
    }
}

private suspend fun animateProgressSmooth(
    from: Float,
    to: Float,
    durationMs: Long,
    onProgress: (Float) -> Unit
) {
    val steps = (durationMs / 30L).toInt().coerceAtLeast(1)
    val stepDelay = durationMs / steps
    for (i in 1..steps) {
        val t = i.toFloat() / steps
        onProgress(from + (to - from) * t)
        delay(stepDelay)
    }
}

private fun initializeScripts(
    storage: ScriptStorage,
    productionServerUrl: String?
) {
    val localVersion = storage.getLocalVersion()
    val bundledVersion = storage.getBundledVersion()

    val needsBundledExtraction = localVersion == null ||
            (bundledVersion != null && com.onthefly.engine.version.VersionManager.compareVersions(bundledVersion, localVersion ?: "0.0.0") > 0)

    if (needsBundledExtraction) {
        storage.extractBundledScripts()
    }

    if (productionServerUrl != null) {
        storage.checkAndDownloadRemoteUpdate(serverUrl = productionServerUrl)
    }

    storage.ensureInitialized()
}
