package com.onthefly.engine.renderer

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.model.UIComponent
import com.onthefly.engine.style.toComposeColor

// ═══════════════════════════════════════════════════════════
//  TopAppBar
// ═══════════════════════════════════════════════════════════

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RenderTopAppBar(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val title = c.propString("title") ?: ""
    val subtitle = c.propString("subtitle")
    val navIcon = c.propString("navigationIcon")
    val onNavClick = c.propString("onNavigationClick")
    val bgColor = c.propColor("background")
    val titleColor = c.propColor("titleColor")
    val componentId = c.propString("id")

    @Suppress("UNCHECKED_CAST")
    val actions = c.props["actions"] as? List<Map<String, Any>> ?: emptyList()

    TopAppBar(
        title = {
            Column {
                Text(
                    text = title,
                    color = titleColor ?: Color.Unspecified,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        fontSize = 12.sp,
                        color = (titleColor ?: Color.Unspecified).copy(alpha = 0.7f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        },
        navigationIcon = {
            if (navIcon != null) {
                IconButton(onClick = {
                    if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
                    onNavClick?.let { onEvent(it) }
                }) {
                    Icon(resolveIcon(navIcon), contentDescription = navIcon, tint = titleColor ?: Color.Unspecified)
                }
            }
        },
        actions = {
            for (action in actions) {
                val actionIcon = action["icon"] as? String ?: continue
                val actionId = action["id"] as? String
                IconButton(onClick = {
                    if (actionId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, actionId))
                }) {
                    Icon(resolveIcon(actionIcon), contentDescription = actionIcon, tint = titleColor ?: Color.Unspecified)
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = bgColor ?: MaterialTheme.colorScheme.surface
        ),
        modifier = modifier
    )
}

// ═══════════════════════════════════════════════════════════
//  BottomNavBar
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderBottomNavBar(
    c: UIComponent,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val componentId = c.propString("id") ?: ""
    val selected = c.propInt("selected", 0)
    val bgColor = c.propColor("background") ?: Color.Unspecified
    val selectedColor = c.propColor("selectedColor") ?: MaterialTheme.colorScheme.primary
    val unselectedColor = c.propColor("unselectedColor") ?: Color.Unspecified
    val showLabels = c.propBool("showLabels", true)

    @Suppress("UNCHECKED_CAST")
    val items = c.props["items"] as? List<Map<String, Any>> ?: emptyList()
    @Suppress("UNCHECKED_CAST")
    val badgeCounts = c.props["badgeCounts"] as? List<Number>

    NavigationBar(
        modifier = modifier,
        containerColor = bgColor
    ) {
        items.forEachIndexed { index, item ->
            val icon = item["icon"] as? String ?: "home"
            val label = item["label"] as? String ?: ""
            val isSelected = index == selected
            val badgeCount = badgeCounts?.getOrNull(index)?.toInt() ?: 0

            NavigationBarItem(
                selected = isSelected,
                onClick = {
                    onComponentEvent(
                        ComponentEvent(EngineEvent.ON_TAB_CHANGED, componentId, "{\"index\":$index}")
                    )
                },
                icon = {
                    if (badgeCount > 0) {
                        BadgedBox(badge = { Badge { Text("$badgeCount") } }) {
                            Icon(resolveIcon(icon), contentDescription = label)
                        }
                    } else {
                        Icon(resolveIcon(icon), contentDescription = label)
                    }
                },
                label = if (showLabels) {{ Text(label, maxLines = 1) }} else null,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = selectedColor,
                    selectedTextColor = selectedColor,
                    unselectedIconColor = unselectedColor,
                    unselectedTextColor = unselectedColor
                )
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  TabBar
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderTabBar(
    c: UIComponent,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val componentId = c.propString("id") ?: ""
    val selected = c.propInt("selected", 0)
    val scrollable = c.propBool("scrollable")
    val indicatorColor = c.propColor("indicatorColor") ?: MaterialTheme.colorScheme.primary

    @Suppress("UNCHECKED_CAST")
    val tabs = c.props["tabs"] as? List<Map<String, Any>> ?: emptyList()

    val tabContent: @Composable (Int, Map<String, Any>) -> Unit = { index, tab ->
        val text = tab["text"] as? String ?: ""
        val icon = tab["icon"] as? String

        Tab(
            selected = index == selected,
            onClick = {
                onComponentEvent(
                    ComponentEvent(EngineEvent.ON_TAB_CHANGED, componentId, "{\"index\":$index}")
                )
            },
            text = { Text(text) },
            icon = if (icon != null) {{ Icon(resolveIcon(icon), contentDescription = text, modifier = Modifier.size(20.dp)) }} else null
        )
    }

    if (scrollable) {
        ScrollableTabRow(
            selectedTabIndex = selected.coerceIn(0, (tabs.size - 1).coerceAtLeast(0)),
            modifier = modifier,
            indicator = { tabPositions ->
                if (tabPositions.isNotEmpty() && selected in tabPositions.indices) {
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selected]),
                        color = indicatorColor
                    )
                }
            }
        ) {
            tabs.forEachIndexed { index, tab -> tabContent(index, tab) }
        }
    } else {
        TabRow(
            selectedTabIndex = selected.coerceIn(0, (tabs.size - 1).coerceAtLeast(0)),
            modifier = modifier,
            indicator = { tabPositions ->
                if (tabPositions.isNotEmpty() && selected in tabPositions.indices) {
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selected]),
                        color = indicatorColor
                    )
                }
            }
        ) {
            tabs.forEachIndexed { index, tab -> tabContent(index, tab) }
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  TabContent
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderTabContent(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val selectedIndex = c.propInt("selectedIndex", 0)

    @Suppress("UNCHECKED_CAST")
    val pages = c.children.ifEmpty {
        (c.props["pages"] as? List<Map<String, Any>>)?.map { parseUIComponentFromMap(it) } ?: emptyList()
    }

    if (pages.isEmpty()) return

    val safeIndex = selectedIndex.coerceIn(0, pages.size - 1)

    AnimatedContent(
        targetState = safeIndex,
        transitionSpec = {
            if (targetState > initialState) {
                slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
            } else {
                slideInHorizontally { -it } togetherWith slideOutHorizontally { it }
            }
        },
        modifier = modifier.fillMaxWidth()
    ) { index ->
        if (index in pages.indices) {
            DynamicRenderer(pages[index], onEvent, onComponentEvent)
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  Drawer
// ═══════════════════════════════════════════════════════════

@Composable
fun RenderDrawer(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val componentId = c.propString("id") ?: ""
    val visible = c.propBool("visible")
    val side = c.propString("side") ?: "left"
    val drawerWidth = c.propInt("width", 300)
    val bgColor = c.propColor("background") ?: Color.White
    val selectedId = c.propString("selectedId")
    val onItemClick = c.propString("onItemClick")
    val onDismiss = c.propString("onDismiss")

    @Suppress("UNCHECKED_CAST")
    val headerMap = c.props["header"] as? Map<String, Any>
    val header = headerMap?.let { parseUIComponentFromMap(it) }

    @Suppress("UNCHECKED_CAST")
    val items = c.props["items"] as? List<Map<String, Any>> ?: emptyList()

    if (!visible) return

    // Scrim overlay
    Box(modifier = Modifier.fillMaxSize()) {
        // Dim background
        Box(
            modifier = Modifier.fillMaxSize()
                .background(Color.Black.copy(alpha = 0.4f))
                .clickableNoIndication {
                    onDismiss?.let { onEvent(it) }
                }
        )

        // Drawer panel
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(drawerWidth.dp)
                .background(bgColor)
                .align(if (side == "right") Alignment.CenterEnd else Alignment.CenterStart)
        ) {
            Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
                // Header
                if (header != null) {
                    DynamicRenderer(header, onEvent, onComponentEvent)
                }

                // Items
                for (item in items) {
                    val itemType = item["type"] as? String
                    if (itemType == "divider") {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                        continue
                    }

                    val itemId = item["id"] as? String ?: ""
                    val itemIcon = item["icon"] as? String
                    val itemLabel = item["label"] as? String ?: ""
                    val isSelected = itemId == selectedId

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickableNoIndication {
                                onComponentEvent(
                                    ComponentEvent(
                                        EngineEvent.ON_CLICK,
                                        componentId,
                                        "{\"itemId\":\"$itemId\"}"
                                    )
                                )
                                onItemClick?.let { onEvent(it) }
                            }
                            .background(if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        if (itemIcon != null) {
                            Icon(
                                resolveIcon(itemIcon),
                                contentDescription = itemLabel,
                                tint = if (isSelected) MaterialTheme.colorScheme.primary else Color(0xFF757575),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Text(
                            text = itemLabel,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Unspecified
                        )
                    }
                }
            }
        }
    }
}
