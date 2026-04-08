package com.onthefly.app.presentation.renderer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.EaseIn
import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.EaseOut
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.ui.unit.IntOffset
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import kotlinx.coroutines.delay

/**
 * Parse animation config from props map.
 * Format: { type: "fadeIn", duration: 300, delay: 0, easing: "easeOut" }
 */
data class AnimationConfig(
    val type: String = "none",
    val duration: Int = 300,
    val delay: Int = 0,
    val easing: String = "easeOut"
)

fun parseAnimationConfig(value: Any?): AnimationConfig? {
    val map = value as? Map<*, *> ?: return null
    return AnimationConfig(
        type = map["type"] as? String ?: "none",
        duration = (map["duration"] as? Number)?.toInt() ?: 300,
        delay = (map["delay"] as? Number)?.toInt() ?: 0,
        easing = map["easing"] as? String ?: "easeOut"
    )
}

fun AnimationConfig.toEnterTransition(): EnterTransition {
    val spec = if (easing == "spring") {
        spring<Float>(stiffness = Spring.StiffnessMediumLow)
    } else {
        tween<Float>(
            durationMillis = duration,
            delayMillis = delay,
            easing = when (easing) {
                "linear" -> LinearEasing
                "easeIn" -> EaseIn
                "easeInOut" -> EaseInOut
                else -> EaseOut
            }
        )
    }
    val intOffsetSpec = if (easing == "spring") {
        spring<IntOffset>(stiffness = Spring.StiffnessMediumLow)
    } else {
        tween<IntOffset>(
            durationMillis = duration,
            delayMillis = delay,
            easing = when (easing) {
                "linear" -> LinearEasing
                "easeIn" -> EaseIn
                "easeInOut" -> EaseInOut
                else -> EaseOut
            }
        )
    }

    return when (type) {
        "fadeIn" -> fadeIn(spec)
        "slideInLeft" -> slideInHorizontally(intOffsetSpec) { -it }
        "slideInRight" -> slideInHorizontally(intOffsetSpec) { it }
        "slideInUp" -> slideInVertically(intOffsetSpec) { it }
        "slideInDown" -> slideInVertically(intOffsetSpec) { -it }
        "scaleIn" -> scaleIn(spec)
        else -> fadeIn(spec)
    }
}

fun AnimationConfig.toExitTransition(): ExitTransition {
    val spec = if (easing == "spring") {
        spring<Float>(stiffness = Spring.StiffnessMediumLow)
    } else {
        tween<Float>(
            durationMillis = duration,
            delayMillis = delay,
            easing = when (easing) {
                "linear" -> LinearEasing
                "easeIn" -> EaseIn
                "easeInOut" -> EaseInOut
                else -> EaseOut
            }
        )
    }
    val intOffsetSpec = if (easing == "spring") {
        spring<IntOffset>(stiffness = Spring.StiffnessMediumLow)
    } else {
        tween<IntOffset>(
            durationMillis = duration,
            delayMillis = delay,
            easing = when (easing) {
                "linear" -> LinearEasing
                "easeIn" -> EaseIn
                "easeInOut" -> EaseInOut
                else -> EaseOut
            }
        )
    }

    return when (type) {
        "fadeOut" -> fadeOut(spec)
        "slideOutLeft" -> slideOutHorizontally(intOffsetSpec) { -it }
        "slideOutRight" -> slideOutHorizontally(intOffsetSpec) { it }
        "slideOutUp" -> slideOutVertically(intOffsetSpec) { -it }
        "slideOutDown" -> slideOutVertically(intOffsetSpec) { it }
        "scaleOut" -> scaleOut(spec)
        else -> fadeOut(spec)
    }
}

/**
 * Wraps content with enter/exit animation if specified in props.
 */
@Composable
fun AnimatedWrapper(
    enterAnimation: AnimationConfig?,
    exitAnimation: AnimationConfig?,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    if (enterAnimation == null && exitAnimation == null) {
        content()
        return
    }

    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        val delayMs = enterAnimation?.delay?.toLong() ?: 0L
        if (delayMs > 0) delay(delayMs)
        visible = true
    }

    AnimatedVisibility(
        visible = visible,
        enter = enterAnimation?.toEnterTransition() ?: fadeIn(),
        exit = exitAnimation?.toExitTransition() ?: fadeOut(),
        modifier = modifier
    ) {
        content()
    }
}

/**
 * Parse stagger animation config for lists.
 * Format: { type: "slideInLeft", duration: 200, staggerDelay: 50 }
 */
data class StaggerConfig(
    val type: String = "fadeIn",
    val duration: Int = 200,
    val staggerDelay: Int = 50
)

fun parseStaggerConfig(value: Any?): StaggerConfig? {
    val map = value as? Map<*, *> ?: return null
    return StaggerConfig(
        type = map["type"] as? String ?: "fadeIn",
        duration = (map["duration"] as? Number)?.toInt() ?: 200,
        staggerDelay = (map["staggerDelay"] as? Number)?.toInt() ?: 50
    )
}
