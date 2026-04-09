package com.onthefly.engine.renderer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.model.UIComponent
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RenderLazyColumn(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val componentId = c.propString("id") ?: ""
    val spacing = c.propInt("spacing")
    val padding = c.propInt("padding")
    val onEndReached = c.propString("onEndReached")
    val endReachedThreshold = c.propInt("endReachedThreshold", 3)
    val refreshing = c.propBool("refreshing")
    val onRefresh = c.propString("onRefresh")
    val visible = c.propBool("visible", true)
    if (!visible) return

    @Suppress("UNCHECKED_CAST")
    val items = c.children.ifEmpty {
        (c.props["items"] as? List<Map<String, Any>>)?.map { itemMap ->
            parseUIComponentFromMap(itemMap)
        } ?: emptyList()
    }

    val listState = rememberLazyListState()

    // Detect end reached
    if (onEndReached != null) {
        val endReached = remember {
            derivedStateOf {
                val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
                lastVisible >= items.size - endReachedThreshold
            }
        }
        LaunchedEffect(endReached.value) {
            if (endReached.value && items.isNotEmpty()) {
                onComponentEvent(ComponentEvent(EngineEvent.ON_END_REACHED, componentId))
            }
        }
    }

    val stagger = parseStaggerConfig(c.props["itemAnimation"])

    var mod = modifier
        .applyWidth(c.props["width"] ?: "fill")
        .applyHeight(c.props["height"] ?: "fill")

    val itemContent: @Composable (Int, UIComponent) -> Unit = { index, item ->
        if (stagger != null) {
            StaggeredItem(
                index = index,
                stagger = stagger
            ) {
                DynamicRenderer(item, onEvent, onComponentEvent)
            }
        } else {
            DynamicRenderer(item, onEvent, onComponentEvent)
        }
    }

    if (onRefresh != null) {
        PullToRefreshBox(
            isRefreshing = refreshing,
            onRefresh = { onComponentEvent(ComponentEvent(EngineEvent.ON_REFRESH, componentId)) },
            modifier = mod
        ) {
            LazyColumn(
                state = listState,
                contentPadding = PaddingValues(padding.dp),
                verticalArrangement = if (spacing > 0) Arrangement.spacedBy(spacing.dp) else Arrangement.Top
            ) {
                itemsIndexed(items, key = { _, item -> item.props["id"]?.toString() ?: item.hashCode() }) { index, item ->
                    itemContent(index, item)
                }
            }
        }
    } else {
        LazyColumn(
            modifier = mod,
            state = listState,
            contentPadding = PaddingValues(padding.dp),
            verticalArrangement = if (spacing > 0) Arrangement.spacedBy(spacing.dp) else Arrangement.Top
        ) {
            itemsIndexed(items, key = { _, item -> item.props["id"]?.toString() ?: item.hashCode() }) { index, item ->
                itemContent(index, item)
            }
        }
    }
}

@Composable
fun RenderLazyRow(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val spacing = c.propInt("spacing")
    val padding = c.propInt("padding")
    val paddingH = c.propInt("paddingHorizontal")
    val paddingV = c.propInt("paddingVertical")
    val visible = c.propBool("visible", true)
    if (!visible) return

    @Suppress("UNCHECKED_CAST")
    val items = c.children.ifEmpty {
        (c.props["items"] as? List<Map<String, Any>>)?.map { itemMap ->
            parseUIComponentFromMap(itemMap)
        } ?: emptyList()
    }

    val contentPadding = if (paddingH > 0 || paddingV > 0) {
        PaddingValues(horizontal = paddingH.dp, vertical = paddingV.dp)
    } else {
        PaddingValues(padding.dp)
    }

    LazyRow(
        modifier = modifier
            .applyWidth(c.props["width"] ?: "fill")
            .applyHeight(c.props["height"]),
        contentPadding = contentPadding,
        horizontalArrangement = if (spacing > 0) Arrangement.spacedBy(spacing.dp) else Arrangement.Start
    ) {
        items(items, key = { it.props["id"]?.toString() ?: it.hashCode() }) { item ->
            DynamicRenderer(item, onEvent, onComponentEvent)
        }
    }
}

@Composable
fun RenderGrid(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val columns = c.propInt("columns", 2)
    val spacing = c.propInt("spacing")
    val hSpacing = (c.props["horizontalSpacing"] as? Number)?.toInt() ?: spacing
    val vSpacing = (c.props["verticalSpacing"] as? Number)?.toInt() ?: spacing
    val padding = c.propInt("padding")
    val visible = c.propBool("visible", true)
    if (!visible) return

    @Suppress("UNCHECKED_CAST")
    val items = c.children.ifEmpty {
        (c.props["items"] as? List<Map<String, Any>>)?.map { itemMap ->
            parseUIComponentFromMap(itemMap)
        } ?: emptyList()
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        modifier = modifier
            .applyWidth(c.props["width"] ?: "fill")
            .applyHeight(c.props["height"]),
        contentPadding = PaddingValues(padding.dp),
        horizontalArrangement = Arrangement.spacedBy(hSpacing.dp),
        verticalArrangement = Arrangement.spacedBy(vSpacing.dp)
    ) {
        items(items, key = { it.props["id"]?.toString() ?: it.hashCode() }) { item ->
            DynamicRenderer(item, onEvent, onComponentEvent)
        }
    }
}

@Composable
fun StaggeredItem(index: Int, stagger: StaggerConfig, content: @Composable () -> Unit) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(stagger.staggerDelay.toLong() * index)
        visible = true
    }
    val enter = AnimationConfig(
        type = stagger.type,
        duration = stagger.duration
    ).toEnterTransition()

    AnimatedVisibility(visible = visible, enter = enter, exit = fadeOut()) {
        content()
    }
}

@Suppress("UNCHECKED_CAST")
fun parseUIComponentFromMap(map: Map<String, Any>): UIComponent {
    val type = map["type"] as? String ?: "Box"
    val rawProps = map["props"] as? Map<String, Any> ?: emptyMap()
    val rawChildren = map["children"] as? List<Map<String, Any>> ?: emptyList()
    val children = rawChildren.map { parseUIComponentFromMap(it) }
    return UIComponent(type = type, props = rawProps, children = children)
}
