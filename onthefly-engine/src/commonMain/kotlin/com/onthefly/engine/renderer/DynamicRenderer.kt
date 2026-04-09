package com.onthefly.engine.renderer

import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import com.onthefly.engine.model.UIComponent

data class ComponentEvent(
    val eventName: String,
    val componentId: String,
    val data: String? = null
)

@Composable
fun DynamicRenderer(
    component: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val id = component.props["id"] as? String
    val enterAnim = parseAnimationConfig(component.props["enterAnimation"])
    val exitAnim = parseAnimationConfig(component.props["exitAnimation"])

    if (id != null) {
        key(id) {
            if (enterAnim != null || exitAnim != null) {
                AnimatedWrapper(enterAnimation = enterAnim, exitAnimation = exitAnim) {
                    RenderComponent(component, onEvent, onComponentEvent, modifier)
                }
            } else {
                RenderComponent(component, onEvent, onComponentEvent, modifier)
            }
        }
    } else {
        if (enterAnim != null || exitAnim != null) {
            AnimatedWrapper(enterAnimation = enterAnim, exitAnimation = exitAnim) {
                RenderComponent(component, onEvent, onComponentEvent, modifier)
            }
        } else {
            RenderComponent(component, onEvent, onComponentEvent, modifier)
        }
    }
}

@Composable
private fun RenderComponent(
    component: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    when (component.type) {
        // Layout
        "Column" -> RenderColumn(component, onEvent, onComponentEvent, modifier)
        "Row" -> RenderRow(component, onEvent, onComponentEvent, modifier)
        "Box" -> RenderBox(component, onEvent, onComponentEvent, modifier)
        "Spacer" -> RenderSpacer(component, modifier)
        "Divider" -> RenderDivider(component, modifier)
        "Card" -> RenderCard(component, onEvent, onComponentEvent, modifier)

        // Display
        "Text" -> RenderText(component, onEvent, onComponentEvent, modifier)
        "Image" -> RenderImage(component, onEvent, onComponentEvent, modifier)
        "Icon" -> RenderIcon(component, onEvent, onComponentEvent, modifier)
        "IconButton" -> RenderIconButton(component, onEvent, onComponentEvent, modifier)

        // Input
        "Button" -> RenderButton(component, onEvent, onComponentEvent, modifier)
        "TextField" -> RenderTextField(component, onComponentEvent, modifier)
        "Toggle", "Switch" -> RenderToggle(component, onComponentEvent, modifier)
        "Checkbox" -> RenderCheckbox(component, onComponentEvent, modifier)
        "RadioGroup" -> RenderRadioGroup(component, onComponentEvent, modifier)
        "Dropdown" -> RenderDropdown(component, onComponentEvent, modifier)
        "SearchBar" -> RenderSearchBar(component, onEvent, onComponentEvent, modifier)

        // Lists
        "LazyColumn" -> RenderLazyColumn(component, onEvent, onComponentEvent, modifier)
        "LazyRow" -> RenderLazyRow(component, onEvent, onComponentEvent, modifier)
        "Grid" -> RenderGrid(component, onEvent, onComponentEvent, modifier)

        // Navigation
        "TopAppBar" -> RenderTopAppBar(component, onEvent, onComponentEvent, modifier)
        "BottomNavBar" -> RenderBottomNavBar(component, onComponentEvent, modifier)
        "TabBar" -> RenderTabBar(component, onComponentEvent, modifier)
        "TabContent" -> RenderTabContent(component, onEvent, onComponentEvent, modifier)
        "Drawer" -> RenderDrawer(component, onEvent, onComponentEvent, modifier)

        // Feedback / Overlay
        "FullScreenPopup" -> RenderFullScreenPopup(component, onEvent, onComponentEvent)
        "ConfirmDialog" -> RenderConfirmDialog(component, onEvent)
        "BottomSheet" -> RenderBottomSheet(component, onEvent, onComponentEvent, modifier)
        "Snackbar" -> RenderSnackbar(component, onEvent, onComponentEvent, modifier)
        "LoadingOverlay" -> RenderLoadingOverlay(component, modifier)
        "Tooltip" -> RenderTooltip(component, onEvent, onComponentEvent, modifier)

        // Display extras
        "Badge" -> RenderBadge(component, modifier)
        "Avatar" -> RenderAvatar(component, onEvent, onComponentEvent, modifier)
        "ProgressBar" -> RenderProgressBar(component, modifier)
        "Chip" -> RenderChip(component, onEvent, onComponentEvent, modifier)

        // Advanced
        "RichText" -> RenderRichText(component, onEvent, onComponentEvent, modifier)
        "Slider" -> RenderSlider(component, onComponentEvent, modifier)
        "SwipeToAction" -> RenderSwipeToAction(component, onEvent, onComponentEvent, modifier)
        "WebView" -> RenderWebView(component, modifier)
        "MapView" -> RenderMapView(component, modifier)
        "VideoPlayer" -> RenderVideoPlayer(component, modifier)

        // Charts
        "CandlestickChart" -> RenderCandlestickChart(component, onEvent, onComponentEvent, modifier)
        "LineChart" -> RenderLineChart(component, modifier)
    }
}
