package com.onthefly.engine.renderer

import com.onthefly.engine.util.escapeJson
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.onthefly.engine.model.EngineEvent
import com.onthefly.engine.model.UIComponent
import com.onthefly.engine.style.toComposeColor

@Composable
fun RenderTextField(c: UIComponent, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val componentId = c.propString("id") ?: ""
    val value = c.propString("value") ?: ""
    val placeholder = c.propString("placeholder") ?: ""
    val label = c.propString("label")
    val type = c.propString("type") ?: "text"
    val maxLines = c.propInt("maxLines", 1)
    val maxLength = (c.props["maxLength"] as? Number)?.toInt()
    val enabled = c.propBool("enabled", true)
    val readOnly = c.propBool("readOnly")
    val error = c.propString("error")
    val helperText = c.propString("helperText")
    val leadingIcon = c.propString("leadingIcon")
    val trailingIcon = c.propString("trailingIcon")
    val onChanged = c.propString("onChanged")
    val onSubmit = c.propString("onSubmit")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val style = c.resolveStyle()

    val textColor = c.propColor("textColor")
    val placeholderColor = c.propColor("placeholderColor")
    val bgColor = c.propColor("background")
    val borderColor = c.propColor("borderColor")
    val focusedBorderColor = c.propColor("focusedBorderColor")
    val cornerRadius = c.propInt("cornerRadius", 0).let { if (it > 0) it else c.propInt("borderRadius", 0) }

    val keyboardType = when (type) {
        "email" -> KeyboardType.Email
        "number" -> KeyboardType.Number
        "phone" -> KeyboardType.Phone
        "password" -> KeyboardType.Password
        else -> KeyboardType.Text
    }
    val isPassword = type == "password"
    val isMultiline = type == "multiline" || maxLines > 1

    // Internal state to avoid focus loss on recomposition
    var textState by remember(componentId) { mutableStateOf(value) }
    // Sync from JS when value changes externally (e.g., JS reset)
    LaunchedEffect(value) {
        if (value != textState && value.isNotEmpty()) textState = value
    }

    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = textColor ?: Color.Unspecified,
        unfocusedTextColor = textColor ?: Color.Unspecified,
        focusedPlaceholderColor = placeholderColor ?: Color.Unspecified,
        unfocusedPlaceholderColor = placeholderColor ?: Color.Unspecified,
        focusedContainerColor = bgColor ?: Color.Unspecified,
        unfocusedContainerColor = bgColor ?: Color.Unspecified,
        focusedBorderColor = focusedBorderColor ?: borderColor ?: Color.Unspecified,
        unfocusedBorderColor = borderColor ?: Color.Unspecified,
        cursorColor = textColor ?: Color.Unspecified
    )

    OutlinedTextField(
        value = textState,
        onValueChange = { newValue ->
            val limited = if (maxLength != null) newValue.take(maxLength) else newValue
            textState = limited
            if (componentId.isNotEmpty()) {
                onComponentEvent(
                    ComponentEvent(
                        EngineEvent.ON_TEXT_CHANGED,
                        componentId,
                        "{\"value\": \"${limited.escapeJson()}\"}"
                    )
                )
            }
        },
        modifier = modifier.fillMaxWidth().clip(RoundedCornerShape(cornerRadius.dp)),
        enabled = enabled,
        readOnly = readOnly,
        label = if (label != null) {{ Text(label) }} else null,
        placeholder = if (placeholder.isNotEmpty()) {{ Text(placeholder) }} else null,
        leadingIcon = if (leadingIcon != null) {{ Icon(resolveIcon(leadingIcon), contentDescription = null) }} else null,
        trailingIcon = if (trailingIcon != null) {{ Icon(resolveIcon(trailingIcon), contentDescription = null) }} else null,
        isError = error != null,
        supportingText = if (error != null || helperText != null) {
            {
                Text(
                    text = error ?: helperText ?: "",
                    color = if (error != null) MaterialTheme.colorScheme.error else Color.Unspecified
                )
            }
        } else null,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = if (isMultiline) ImeAction.Default else ImeAction.Done
        ),
        keyboardActions = KeyboardActions(
            onDone = {
                if (onSubmit != null) {
                    onComponentEvent(
                        ComponentEvent(
                            EngineEvent.ON_SUBMIT,
                            componentId,
                            "{\"value\": \"${value.escapeJson()}\"}"
                        )
                    )
                }
            }
        ),
        maxLines = if (isMultiline) maxLines.coerceAtLeast(3) else 1,
        singleLine = !isMultiline,
        colors = fieldColors,
        shape = RoundedCornerShape(cornerRadius.dp)
    )
}

@Composable
fun RenderButton(
    c: UIComponent,
    onEvent: (String) -> Unit,
    onComponentEvent: (ComponentEvent) -> Unit,
    modifier: Modifier
) {
    val text = c.propString("text") ?: "Button"
    val onClick = c.propString("onClick")
    val componentId = c.propString("id")
    val style = c.resolveStyle()
    val variant = c.propString("variant") ?: "filled"
    val iconName = c.propString("icon")
    val enabled = c.propBool("enabled", true)
    val loading = c.propBool("loading")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val bgColor = c.propColor("background") ?: style?.backgroundComposeColor()?.takeIf { it != Color.Unspecified }
    val textColor = c.propColor("textColor") ?: style?.textComposeColor()?.takeIf { it != Color.Unspecified }
    val disabledBgColor = c.propColor("disabledColor")
    val disabledTxtColor = c.propColor("disabledTextColor")
    val borderRadius = c.resolveBorderRadius(style).let { if (it == 0) 8 else it }
    val shape = RoundedCornerShape(borderRadius.dp)

    val onClickAction: () -> Unit = {
        if (!loading) {
            if (componentId != null) onComponentEvent(ComponentEvent(EngineEvent.ON_CLICK, componentId))
            onClick?.let { onEvent(it) }
        }
    }

    val buttonContent: @Composable () -> Unit = {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = textColor ?: Color.White
            )
            Spacer(Modifier.width(8.dp))
        }
        if (iconName != null && !loading) {
            Icon(
                imageVector = resolveIcon(iconName),
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(Modifier.width(8.dp))
        }
        Text(text = text)
    }

    var mod = modifier
        .applyWidth(c.props["width"] ?: style?.width ?: "wrap")
    val height = (c.props["height"] as? Number)?.toInt() ?: style?.height ?: 48
    mod = mod.heightIn(min = height.dp)

    when (variant) {
        "outlined" -> {
            OutlinedButton(
                onClick = onClickAction,
                modifier = mod,
                enabled = enabled && !loading,
                shape = shape
            ) { buttonContent() }
        }
        "text" -> {
            TextButton(
                onClick = onClickAction,
                modifier = mod,
                enabled = enabled && !loading
            ) { buttonContent() }
        }
        else -> { // "filled", "tonal"
            val colors = ButtonDefaults.buttonColors(
                containerColor = bgColor ?: ButtonDefaults.buttonColors().containerColor,
                contentColor = textColor ?: ButtonDefaults.buttonColors().contentColor,
                disabledContainerColor = disabledBgColor ?: ButtonDefaults.buttonColors().disabledContainerColor,
                disabledContentColor = disabledTxtColor ?: ButtonDefaults.buttonColors().disabledContentColor
            )
            Button(
                onClick = onClickAction,
                modifier = mod,
                enabled = enabled && !loading,
                colors = colors,
                shape = shape
            ) { buttonContent() }
        }
    }
}

@Composable
fun RenderToggle(c: UIComponent, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val label = c.propString("label") ?: ""
    val checked = c.propBool("checked")
    val enabled = c.propBool("enabled", true)
    val componentId = c.propString("id") ?: ""
    val activeColor = c.propColor("activeColor")
    val inactiveColor = c.propColor("inactiveColor")
    val thumbColor = c.propColor("thumbColor")
    val onToggle = c.propString("onToggle")
    val visible = c.propBool("visible", true)
    if (!visible) return

    val scale = c.propFloat("scale", 1f)
    val borderColor = c.propColor("borderColor")
    val hasCustomColors = activeColor != null || inactiveColor != null || thumbColor != null
    val switchColors = if (hasCustomColors) {
        SwitchDefaults.colors(
            checkedTrackColor = activeColor ?: SwitchDefaults.colors().checkedTrackColor,
            uncheckedTrackColor = inactiveColor ?: SwitchDefaults.colors().uncheckedTrackColor,
            checkedThumbColor = thumbColor ?: Color.White,
            checkedBorderColor = activeColor ?: Color.Transparent,
            uncheckedThumbColor = thumbColor ?: Color.White,
            uncheckedBorderColor = borderColor ?: SwitchDefaults.colors().uncheckedBorderColor
        )
    } else {
        SwitchDefaults.colors()
    }

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        if (label.isNotEmpty()) {
            Text(text = label, style = MaterialTheme.typography.bodyLarge)
        }
        Switch(
            checked = checked,
            onCheckedChange = { newValue ->
                onComponentEvent(
                    ComponentEvent(EngineEvent.ON_TOGGLE, componentId, "{\"checked\": $newValue}")
                )
            },
            enabled = enabled,
            colors = switchColors,
            modifier = Modifier.graphicsLayer(scaleX = scale, scaleY = scale)
        )
    }
}

@Composable
fun RenderCheckbox(c: UIComponent, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val label = c.propString("label") ?: ""
    val checked = c.propBool("checked")
    val enabled = c.propBool("enabled", true)
    val componentId = c.propString("id") ?: ""
    val color = c.propColor("color")
    val visible = c.propBool("visible", true)
    if (!visible) return

    Row(
        modifier = modifier.fillMaxWidth().clickable(enabled = enabled) {
            onComponentEvent(
                ComponentEvent(EngineEvent.ON_CHECK_CHANGED, componentId, "{\"checked\": ${!checked}}")
            )
        }.padding(horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = checked,
            onCheckedChange = { newValue ->
                onComponentEvent(
                    ComponentEvent(EngineEvent.ON_CHECK_CHANGED, componentId, "{\"checked\": $newValue}")
                )
            },
            enabled = enabled,
            colors = if (color != null) {
                CheckboxDefaults.colors(checkedColor = color)
            } else {
                CheckboxDefaults.colors()
            }
        )
        Spacer(Modifier.width(8.dp))
        Text(text = label, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
fun RenderRadioGroup(c: UIComponent, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val componentId = c.propString("id") ?: ""
    val selected = c.propString("selected")
    val direction = c.propString("direction") ?: "vertical"
    val visible = c.propBool("visible", true)
    if (!visible) return

    @Suppress("UNCHECKED_CAST")
    val options = (c.props["options"] as? List<Map<String, Any>>) ?: emptyList()

    val content: @Composable (Map<String, Any>) -> Unit = { option ->
        val value = option["value"] as? String ?: ""
        val optionLabel = option["label"] as? String ?: value
        Row(
            modifier = Modifier.clickableNoIndication {
                onComponentEvent(
                    ComponentEvent(EngineEvent.ON_RADIO_CHANGED, componentId, "{\"value\": \"$value\"}")
                )
            }.padding(vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = value == selected,
                onClick = {
                    onComponentEvent(
                        ComponentEvent(EngineEvent.ON_RADIO_CHANGED, componentId, "{\"value\": \"$value\"}")
                    )
                }
            )
            Spacer(Modifier.width(8.dp))
            Text(text = optionLabel, style = MaterialTheme.typography.bodyLarge)
        }
    }

    if (direction == "horizontal") {
        Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            options.forEach { content(it) }
        }
    } else {
        Column(modifier = modifier.fillMaxWidth()) {
            options.forEach { content(it) }
        }
    }
}

@Composable
fun RenderDropdown(c: UIComponent, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val componentId = c.propString("id") ?: ""
    val selected = c.propString("selected")
    val placeholder = c.propString("placeholder") ?: "Select..."
    val label = c.propString("label")
    val enabled = c.propBool("enabled", true)
    val visible = c.propBool("visible", true)
    if (!visible) return

    @Suppress("UNCHECKED_CAST")
    val options = (c.props["options"] as? List<Map<String, Any>>) ?: emptyList()

    var expanded by remember { mutableStateOf(false) }
    val selectedOption = options.find { it["value"] == selected }
    val displayText = selectedOption?.get("label") as? String ?: selected ?: placeholder

    Column(modifier = modifier.fillMaxWidth()) {
        if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 4.dp)
            )
        }
        Box {
            OutlinedTextField(
                value = displayText,
                onValueChange = {},
                readOnly = true,
                enabled = enabled,
                modifier = Modifier.fillMaxWidth().clickable(enabled = enabled) { expanded = true },
                trailingIcon = {
                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Expand")
                },
                shape = RoundedCornerShape(8.dp)
            )
            // Invisible clickable overlay
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .clickable(enabled = enabled) { expanded = true }
            )
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                options.forEach { option ->
                    val value = option["value"] as? String ?: ""
                    val optionLabel = option["label"] as? String ?: value
                    DropdownMenuItem(
                        text = { Text(optionLabel) },
                        onClick = {
                            expanded = false
                            onComponentEvent(
                                ComponentEvent(
                                    EngineEvent.ON_DROPDOWN_CHANGED,
                                    componentId,
                                    "{\"value\": \"${value.escapeJson()}\", \"label\": \"${optionLabel.escapeJson()}\"}"
                                )
                            )
                        },
                        trailingIcon = if (value == selected) {
                            { Icon(Icons.Default.Check, contentDescription = null, tint = MaterialTheme.colorScheme.primary) }
                        } else null
                    )
                }
            }
        }
    }
}

@Composable
fun RenderSearchBar(c: UIComponent, onEvent: (String) -> Unit, onComponentEvent: (ComponentEvent) -> Unit, modifier: Modifier) {
    val componentId = c.propString("id") ?: ""
    val value = c.propString("value") ?: ""
    val placeholder = c.propString("placeholder") ?: "Search..."
    val showCancel = c.propBool("showCancel")
    val onChanged = c.propString("onChanged")
    val onSubmit = c.propString("onSubmit")
    val onCancel = c.propString("onCancel")
    val visible = c.propBool("visible", true)
    if (!visible) return

    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        BasicTextField(
            value = value,
            onValueChange = { newValue ->
                if (onChanged != null) {
                    onComponentEvent(
                        ComponentEvent(
                            EngineEvent.ON_TEXT_CHANGED,
                            componentId,
                            "{\"value\": \"${newValue.escapeJson()}\"}"
                        )
                    )
                }
            },
            modifier = Modifier.weight(1f).height(40.dp),
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(
                onSearch = {
                    if (onSubmit != null) {
                        onComponentEvent(
                            ComponentEvent(
                                EngineEvent.ON_SUBMIT,
                                componentId,
                                "{\"value\": \"${value.escapeJson()}\"}"
                            )
                        )
                    }
                }
            ),
            decorationBox = { innerTextField ->
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(24.dp))
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Search, contentDescription = "Search", modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.width(8.dp))
                    Box(modifier = Modifier.weight(1f)) {
                        if (value.isEmpty()) {
                            Text(placeholder, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                        }
                        innerTextField()
                    }
                    if (value.isNotEmpty()) {
                        IconButton(onClick = {
                            onComponentEvent(
                                ComponentEvent(
                                    EngineEvent.ON_TEXT_CHANGED,
                                    componentId,
                                    "{\"value\": \"\"}"
                                )
                            )
                        }, modifier = Modifier.size(20.dp)) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear", modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        )
        if (showCancel) {
            Spacer(Modifier.width(8.dp))
            TextButton(onClick = {
                onCancel?.let { onEvent(it) }
            }) {
                Text("Cancel")
            }
        }
    }
}

