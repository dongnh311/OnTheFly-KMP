package com.onthefly.app.presentation.renderer

import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import com.onthefly.app.domain.model.UIComponent

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
    key(id ?: component.hashCode()) {
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
        }
    }
}
