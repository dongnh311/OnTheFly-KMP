# OnTheFly Engine — Bridge API Reference

Complete reference of all views, props, events, and functions available in the JS ↔ Kotlin bridge.

---

## Table of Contents

- [1. Component Types & Props](#1-component-types--props)
  - [Layout](#layout)
  - [Display](#display)
  - [Input](#input)
  - [Lists](#lists)
  - [Navigation](#navigation)
  - [Feedback / Overlay](#feedback--overlay)
  - [Display Extras](#display-extras)
  - [Advanced](#advanced)
  - [Charts](#charts)
- [2. Common Props (All Components)](#2-common-props-all-components)
- [3. Events (Compose → JS)](#3-events-compose--js)
- [4. Native Actions (JS → Kotlin)](#4-native-actions-js--kotlin)
- [5. Lifecycle Events (Kotlin → JS)](#5-lifecycle-events-kotlin--js)
- [6. OnTheFly JS API](#6-onthefly-js-api)
- [7. Available Icons](#7-available-icons)
- [8. Animation Config](#8-animation-config)
- [9. Style System](#9-style-system)
- [10. ScriptStorage Interface](#10-scriptstorage-interface)
- [11. SplashScreen API](#11-splashscreen-api)
- [12. Settings Persistence](#12-settings-persistence)

---

## 1. Component Types & Props

### Layout

#### `Column`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | Int | 0 | Vertical spacing between children (dp) |
| `alignment` | String | "start" | Horizontal alignment: `"start"`, `"center"`, `"end"` |
| `scrollable` | Boolean | false | Enable vertical scrolling |
| `flashBackground` | Color | — | Flash animation background color |
| `flashDuration` | Int | 500 | Flash animation duration (ms) |
| `backgroundGradient` | Array | — | Color array for gradient, e.g. `["#FF0000", "#0000FF"]` |
| `gradientDirection` | String | "vertical" | `"vertical"`, `"horizontal"`, `"diagonal"` |
| `onClick` | String | — | JS function name to call on click |
| `children[].weight` | Float | — | Flex weight for child inside Column |

#### `Row`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | Int | 0 | Horizontal spacing between children (dp) |
| `alignment` | String | "start" | Horizontal arrangement: `"start"`, `"center"`, `"end"`, `"spaceBetween"`, `"spaceAround"`, `"spaceEvenly"` |
| `crossAlignment` | String | "top" | Vertical alignment: `"top"`, `"center"`, `"bottom"` |
| `scrollable` | Boolean | false | Enable horizontal scrolling |
| `backgroundGradient` | Array | — | Color array for gradient |
| `gradientDirection` | String | "vertical" | `"vertical"`, `"horizontal"`, `"diagonal"` |
| `onClick` | String | — | JS function name to call on click |
| `children[].weight` | Float | — | Flex weight for child inside Row |

#### `Box`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `contentAlignment` | String | "topStart" | 9-point: `"topStart"`, `"topCenter"`, `"topEnd"`, `"centerStart"`, `"center"`, `"centerEnd"`, `"bottomStart"`, `"bottomCenter"`, `"bottomEnd"` |
| `flashBackground` | Color | — | Flash animation background color |
| `flashDuration` | Int | 500 | Flash animation duration (ms) |
| `backgroundGradient` | Array | — | Color array for gradient |
| `gradientDirection` | String | "vertical" | `"vertical"`, `"horizontal"`, `"diagonal"` |
| `onClick` | String | — | JS function name to call on click |

#### `Spacer`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | Int | 0 | Height in dp |
| `width` | Int | 0 | Width in dp |

#### `Divider`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | Color | — | Divider color |
| `thickness` | Int | 1 | Thickness in dp |
| `marginHorizontal` | Int | 0 | Horizontal margin (dp) |
| `marginVertical` | Int | 0 | Vertical margin (dp) |

#### `Card`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | Int | 16 | Inner padding (dp) |
| `elevation` | Int | 4 | Shadow elevation (dp) |
| `onClick` | String | — | JS function name to call on click |

---

### Display

#### `Text`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | String | "" | Text content |
| `fontSize` | Int | — | Font size (sp) |
| `fontWeight` | String | — | `"normal"`, `"bold"`, `"100"`–`"900"`, `"semibold"`, `"medium"`, `"light"` |
| `fontStyle` | String | — | `"italic"` or `"normal"` |
| `color` | Color | — | Text color |
| `textAlign` | String | — | `"start"`, `"center"`, `"end"`, `"justify"` |
| `maxLines` | Int | — | Maximum number of lines |
| `overflow` | String | "ellipsis" | `"ellipsis"`, `"clip"`, `"visible"` |
| `lineHeight` | Float | — | Line height (sp) |
| `letterSpacing` | Float | — | Letter spacing (sp) |
| `textDecoration` | String | — | `"underline"`, `"lineThrough"` |
| `selectable` | Boolean | false | Allow user to select/copy text |
| `html` | Boolean | false | Parse simple HTML: `<b>`, `<i>`, `<u>`, `<s>`, `<br>`, `<font color="..." size="...">` |
| `onClick` | String | — | JS function name to call on click |

#### `Image`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | String | — | Image URL |
| `contentScale` | String | "fit" | `"fill"`, `"crop"`, `"inside"`, `"none"`, `"fit"` |
| `borderRadius` | Int | 0 | Corner radius (dp) |
| `tintColor` | Color | — | Color filter/tint overlay |
| `contentDescription` | String | — | Accessibility description |
| `onClick` | String | — | JS function name to call on click |

#### `Icon`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | String | "help" | Icon name (see [Available Icons](#7-available-icons)) |
| `size` | Int | 24 | Icon size (dp) |
| `color` | Color | — | Icon tint color |
| `onClick` | String | — | JS function name to call on click |

#### `IconButton`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | String | "help" | Icon name |
| `iconSize` | Int | 24 | Icon size (dp) |
| `color` | Color | — | Icon tint color |
| `enabled` | Boolean | true | Whether button is enabled |
| `onClick` | String | — | JS function name to call on click |

---

### Input

#### `TextField`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | String | "" | Current text value |
| `placeholder` | String | "" | Placeholder text |
| `label` | String | — | Floating label |
| `type` | String | "text" | `"text"`, `"email"`, `"number"`, `"phone"`, `"password"`, `"multiline"` |
| `maxLines` | Int | 1 | Max lines (multiline mode) |
| `maxLength` | Int | — | Character limit |
| `enabled` | Boolean | true | Editable state |
| `readOnly` | Boolean | false | Read-only mode |
| `error` | String | — | Error message (shows error state) |
| `helperText` | String | — | Helper text below field |
| `leadingIcon` | String | — | Icon name for leading icon |
| `trailingIcon` | String | — | Icon name for trailing icon |
| `textColor` | Color | — | Input text color |
| `placeholderColor` | Color | — | Placeholder text color |
| `background` | Color | — | Background color |
| `borderColor` | Color | — | Border color |
| `focusedBorderColor` | Color | — | Border color when focused |
| `cornerRadius` | Int | 0 | Corner radius (dp) |
| `onChanged` | String | — | Event handler name (triggers `onTextChanged`) |
| `onSubmit` | String | — | Event handler name (triggers `onSubmit`) |

**Events:** `onTextChanged` → `{ value }`, `onSubmit` → `{ value }`

#### `Button`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | String | "Button" | Button label |
| `variant` | String | "filled" | `"filled"`, `"outlined"`, `"text"` |
| `icon` | String | — | Leading icon name |
| `enabled` | Boolean | true | Whether clickable |
| `loading` | Boolean | false | Show loading spinner |
| `background` | Color | — | Background color |
| `textColor` | Color | — | Label text color |
| `disabledColor` | Color | — | Background color when disabled |
| `disabledTextColor` | Color | — | Text color when disabled |
| `onClick` | String | — | JS function name |

**Events:** `onClick`

#### `Toggle` / `Switch`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | String | "" | Label text |
| `checked` | Boolean | false | Toggle state |
| `enabled` | Boolean | true | Interactive state |
| `activeColor` | Color | — | Track color when checked |
| `inactiveColor` | Color | — | Track color when unchecked |
| `thumbColor` | Color | — | Thumb color |
| `borderColor` | Color | — | Border color when unchecked |
| `scale` | Float | 1.0 | Scale transform |
| `onToggle` | String | — | Event handler name |

**Events:** `onToggle` → `{ checked }`

#### `Checkbox`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | String | "" | Label text |
| `checked` | Boolean | false | Checked state |
| `enabled` | Boolean | true | Interactive state |
| `color` | Color | — | Checked color |

**Events:** `onCheckChanged` → `{ checked }`

#### `RadioGroup`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selected` | String | — | Currently selected value |
| `direction` | String | "vertical" | `"vertical"` or `"horizontal"` |
| `options` | Array | [] | `[{ label, value }, ...]` |

**Events:** `onRadioChanged` → `{ value }`

#### `Dropdown`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selected` | String | — | Currently selected value |
| `placeholder` | String | "Select..." | Placeholder text |
| `label` | String | — | Label above dropdown |
| `enabled` | Boolean | true | Interactive state |
| `options` | Array | [] | `[{ label, value }, ...]` |

**Events:** `onDropdownChanged` → `{ value, label }`

#### `SearchBar`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | String | "" | Current search text |
| `placeholder` | String | "Search..." | Placeholder |
| `showCancel` | Boolean | false | Show cancel button |
| `onChanged` | String | — | Text change handler |
| `onSubmit` | String | — | Search submit handler |
| `onCancel` | String | — | Cancel button handler |

**Events:** `onTextChanged` → `{ value }`, `onSubmit` → `{ value }`

---

### Lists

#### `LazyColumn`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | Int | 0 | Vertical spacing between items (dp) |
| `padding` | Int | 0 | Content padding (dp) |
| `onEndReached` | String | — | Infinite scroll handler |
| `endReachedThreshold` | Int | 3 | Items from end to trigger |
| `refreshing` | Boolean | false | Pull-to-refresh state |
| `onRefresh` | String | — | Refresh handler (enables pull-to-refresh) |
| `items` | Array | — | Items as prop (alternative to children) |
| `itemAnimation` | Object | — | Stagger animation config (see [Animation](#8-animation-config)) |

**Events:** `onEndReached`, `onRefresh`

#### `LazyRow`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | Int | 0 | Horizontal spacing (dp) |
| `padding` | Int | 0 | Content padding (dp) |
| `paddingHorizontal` | Int | 0 | Horizontal content padding (dp) |
| `paddingVertical` | Int | 0 | Vertical content padding (dp) |
| `items` | Array | — | Items as prop |

#### `Grid`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | Int | 2 | Number of columns |
| `spacing` | Int | 0 | Spacing (dp) |
| `horizontalSpacing` | Int | spacing | Horizontal gap (dp) |
| `verticalSpacing` | Int | spacing | Vertical gap (dp) |
| `padding` | Int | 0 | Content padding (dp) |
| `items` | Array | — | Items as prop |

---

### Navigation

#### `TopAppBar`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | String | "" | Title text |
| `subtitle` | String | — | Subtitle text |
| `navigationIcon` | String | — | Left icon name |
| `onNavigationClick` | String | — | Nav icon click handler |
| `background` | Color | — | Background color |
| `titleColor` | Color | — | Title/icon tint color |
| `actions` | Array | [] | `[{ icon, id }, ...]` Action buttons |

**Events:** `onClick` on nav icon, `onClick` on each action (by `id`)

#### `BottomNavBar`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selected` | Int | 0 | Selected tab index |
| `background` | Color | — | Background color |
| `selectedColor` | Color | — | Active item color |
| `unselectedColor` | Color | — | Inactive item color |
| `showLabels` | Boolean | true | Show text labels |
| `items` | Array | [] | `[{ icon, label }, ...]` |
| `badgeCounts` | Array | — | `[0, 3, 0, ...]` Badge count per item |

**Events:** `onTabChanged` → `{ index }`

#### `TabBar`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selected` | Int | 0 | Selected tab index |
| `scrollable` | Boolean | false | Scrollable tabs |
| `indicatorColor` | Color | — | Tab indicator color |
| `tabs` | Array | [] | `[{ text, icon? }, ...]` |

**Events:** `onTabChanged` → `{ index }`

#### `TabContent`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedIndex` | Int | 0 | Visible page index |
| `pages` | Array | — | Page components (alternative to children) |

#### `Drawer`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | Boolean | false | Show/hide drawer |
| `side` | String | "left" | `"left"` or `"right"` |
| `width` | Int | 300 | Drawer width (dp) |
| `background` | Color | white | Background color |
| `selectedId` | String | — | Currently selected item ID |
| `onItemClick` | String | — | Item click handler |
| `onDismiss` | String | — | Dismiss handler |
| `header` | Object | — | Header component map |
| `items` | Array | [] | `[{ id, icon?, label, type? }, ...]` (type="divider" for separator) |

**Events:** `onClick` → `{ itemId }`

---

### Feedback / Overlay

#### `FullScreenPopup`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | Boolean | false | Show/hide |
| `onDismiss` | String | — | Close handler |
| `animation` | String | "fade" | `"fade"`, `"slide"`, `"slideUp"`, `"scale"`, `"none"` |
| `background` | Color | white | Background color |

#### `ConfirmDialog`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | Boolean | false | Show/hide |
| `title` | String | "Confirm" | Dialog title |
| `message` | String | "" | Dialog message |
| `confirmText` | String | "OK" | Confirm button text |
| `cancelText` | String | "Cancel" | Cancel button text |
| `confirmColor` | Color | — | Confirm button color |
| `onConfirm` | String | — | Confirm handler |
| `onCancel` | String | — | Cancel handler |

#### `BottomSheet`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | Boolean | false | Show/hide |
| `background` | Color | — | Sheet background |
| `borderRadius` | Int | 16 | Top corner radius (dp) |
| `showHandle` | Boolean | true | Show drag handle |
| `dismissOnClickOutside` | Boolean | true | Close on scrim tap |
| `height` | String | "wrap" | `"full"`, `"half"`, `"wrap"`, or pixel number |
| `onDismiss` | String | — | Dismiss handler |

**Events:** `onDismiss`

#### `Snackbar`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | String | "" | Snackbar text |
| `actionText` | String | — | Action button text |
| `duration` | Int | 3000 | Auto-dismiss duration (ms) |
| `background` | Color | — | Background color |
| `textColor` | Color | — | Message text color |
| `actionColor` | Color | — | Action button color |
| `position` | String | "bottom" | `"top"` or `"bottom"` |
| `onAction` | String | — | Action click handler |
| `onDismiss` | String | — | Dismiss handler |

#### `LoadingOverlay`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | Boolean | false | Show/hide |
| `message` | String | — | Loading message |
| `background` | Color | black 50% | Overlay background |
| `indicatorColor` | Color | white | Spinner color |

---

### Display Extras

#### `Badge`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | Int | 0 | Badge count (shows "99+" if >99) |
| `color` | Color | — | Background color |
| `textColor` | Color | — | Count text color |

#### `Avatar`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | String | — | Name (initials extracted) |
| `size` | Int | 40 | Avatar size (dp) |
| `background` | Color | — | Background color |
| `borderWidth` | Int | 0 | Border width (dp) |
| `borderColor` | Color | — | Border color |
| `onClick` | String | — | Click handler |

#### `ProgressBar`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | Float | 0 | Progress value (0.0–1.0) |
| `type` | String | "linear" | `"linear"` or `"circular"` |
| `color` | Color | primary | Bar color |
| `trackColor` | Color | — | Track color |
| `size` | Int | 4 | Thickness (dp) / diameter (dp) |
| `indeterminate` | Boolean | false | Indeterminate mode |

#### `Chip`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | String | "" | Chip label |
| `selected` | Boolean | false | Selected state |
| `icon` | String | — | Leading icon name |
| `background` | Color | — | Default background |
| `selectedBackground` | Color | — | Selected background |
| `textColor` | Color | — | Default text color |
| `selectedTextColor` | Color | white | Selected text color |
| `borderRadius` | Int | 20 | Corner radius (dp) |
| `closable` | Boolean | false | Show close (X) button |
| `onClick` | String | — | Click handler |
| `onClose` | String | — | Close handler |

**Events:** `onClick`, `onChipClose`

---

### Advanced

#### `RichText`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `textAlign` | String | — | Text alignment |
| `maxLines` | Int | — | Max lines |
| `spans` | Array | [] | `[{ text, fontSize?, fontWeight?, fontStyle?, color?, textDecoration?, onClick? }, ...]` |

#### `Slider`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | Float | 0 | Current value |
| `min` | Float | 0 | Minimum value |
| `max` | Float | 1 | Maximum value |
| `steps` | Int | 0 | Discrete steps (0 = continuous) |
| `label` | String | — | Label text |
| `showValue` | Boolean | true | Show current value |
| `color` | Color | primary | Slider color |

**Events:** `onSliderChanged` → `{ value }`

#### `SwipeToAction`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onAction` | String | — | Action handler |
| `rightActions` | Array | [] | `[{ id, icon, color }, ...]` |
| `leftActions` | Array | [] | `[{ id, icon, color }, ...]` |
| `child` | Object | — | Child component map |

**Events:** `onClick` → `{ actionId }`

#### `WebView` (placeholder)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | String | — | URL to load |
| `height` | Int | 300 | View height (dp) |

#### `MapView` (placeholder)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `latitude` | Float | 0 | Latitude |
| `longitude` | Float | 0 | Longitude |
| `height` | Int | 300 | View height (dp) |

#### `VideoPlayer` (placeholder)
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | String | — | Video URL |
| `height` | Int | 200 | View height (dp) |

---

### Charts

#### `CandlestickChart`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | Int | 250 | Chart height (dp, ignored if `fillHeight`) |
| `fillHeight` | Boolean | false | Fill parent height |
| `background` | Color | — | Background color |
| `upColor` | Color | #10B981 | Bullish candle color |
| `downColor` | Color | #EF4444 | Bearish candle color |
| `ma7Color` | Color | #00D4AA | MA7 line color |
| `ma25Color` | Color | #E8B84B | MA25 line color |
| `ma99Color` | Color | #B84BE8 | MA99 line color |
| `gridColor` | Color | #374151 | Grid line color |
| `textColor` | Color | #6B7280 | Label text color |
| `showGrid` | Boolean | true | Show grid lines |
| `showVolume` | Boolean | true | Show volume bars |
| `volumeHeightRatio` | Float | 0.2 | Volume chart height ratio |
| `candleWidth` | Int | 10 | Candle width (dp) |
| `candles` | Array | [] | `[{ o, h, l, c, v, t }, ...]` (open, high, low, close, volume, timestamp) |
| `ma7` | Array | [] | `[{ t, value }, ...]` |
| `ma25` | Array | [] | `[{ t, value }, ...]` |
| `ma99` | Array | [] | `[{ t, value }, ...]` |

#### `LineChart`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | Int | 120 | Chart height (dp) |
| `background` | Color | #1F2937 | Background color |
| `lineColor` | Color | #00D4AA | Line color |
| `fillAlpha` | Float | 0.3 | Gradient fill opacity |
| `lineWidth` | Float | 2 | Line stroke width (dp) |
| `borderRadius` | Int | 14 | Corner radius (dp) |
| `points` | Array | [] | `[number, number, ...]` Y values |

---

## 2. Common Props (All Components)

These props are available on most components:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | String | — | Unique component ID (required for events/updates) |
| `visible` | Boolean | true | Show/hide component |
| `style` | String | — | Style name from `StyleRegistry` |
| `width` | String/Int | "fill" | `"fill"`, `"wrap"`, or dp number |
| `height` | String/Int | — | `"fill"`, `"wrap"`, or dp number |
| `opacity` | Float | 1.0 | Opacity (0.0–1.0) |
| `background` | Color | — | Background color (hex string) |
| `borderRadius` | Int | 0 | Corner radius (dp) |
| `cornerRadius` | Int | 0 | Alias for `borderRadius` |
| `borderWidth` | Int | 0 | Border width (dp) |
| `borderColor` | Color | — | Border color |
| `padding` | Int/Object | 0 | Uniform or `{ top, bottom, start, end, horizontal, vertical }` |
| `minWidth` | Int | — | Minimum width constraint (dp) |
| `maxWidth` | Int | — | Maximum width constraint (dp) |
| `minHeight` | Int | — | Minimum height constraint (dp) |
| `maxHeight` | Int | — | Maximum height constraint (dp) |
| `rotation` | Float | — | Rotation in degrees |
| `scaleX` | Float | — | Horizontal scale (1.0 = 100%) |
| `scaleY` | Float | — | Vertical scale (1.0 = 100%) |
| `translateX` | Float | — | Horizontal translation (dp) |
| `translateY` | Float | — | Vertical translation (dp) |
| `clipToBounds` | Boolean | false | Clip children that overflow bounds |
| `enterAnimation` | Object | — | Enter animation config |
| `exitAnimation` | Object | — | Exit animation config |

**Border shape per corner:**
`borderRadiusTopLeft`, `borderRadiusTopRight`, `borderRadiusBottomLeft`, `borderRadiusBottomRight`

---

## 3. Events (Compose → JS)

Events are dispatched from Kotlin UI to JS when users interact with components.

| Event | Data Payload | Triggered By |
|-------|-------------|--------------|
| `onClick` | — | Column, Row, Box, Card, Text, Image, Icon, IconButton, Button, Avatar, Chip, TopAppBar actions, Drawer items, Snackbar action, SwipeToAction |
| `onTextChanged` | `{ value }` | TextField, SearchBar |
| `onSubmit` | `{ value }` | TextField (keyboard done/search), SearchBar |
| `onToggle` | `{ checked }` | Toggle/Switch |
| `onCheckChanged` | `{ checked }` | Checkbox |
| `onRadioChanged` | `{ value }` | RadioGroup |
| `onSliderChanged` | `{ value }` | Slider |
| `onDropdownChanged` | `{ value, label }` | Dropdown |
| `onTabChanged` | `{ index }` | BottomNavBar, TabBar |
| `onEndReached` | — | LazyColumn (infinite scroll) |
| `onRefresh` | — | LazyColumn (pull-to-refresh) |
| `onDismiss` | — | BottomSheet |
| `onChipClose` | — | Chip (closable) |

**JS handler pattern:**
```javascript
function onClick(id, data) {
    // id = component ID, data = JSON payload
}
```

---

## 4. Native Actions (JS → Kotlin)

Called from JS via `OnTheFly.sendToNative(action, data)`.

### Navigation
| Action | Data | Description |
|--------|------|-------------|
| `navigate` | `{ screen, data? }` | Navigate to screen |
| `goBack` | — | Go back |
| `navigateDelayed` | `{ screen, data?, delay }` | Navigate after delay (ms) |
| `navigateReplace` | `{ screen, data? }` | Replace current screen |
| `navigateClearStack` | `{ screen, data? }` | Clear stack and navigate |

### Network
| Action | Data | Description |
|--------|------|-------------|
| `sendRequest` | `{ id, url, method?, headers?, body?, timeout?, retry?, retryDelay? }` | HTTP request |
| `cancelRequest` | `{ id }` | Cancel pending request |

### UI
| Action | Data | Description |
|--------|------|-------------|
| `showToast` | `{ message, long? }` | Show toast |
| `showPopup` | `{ title, message, confirmText?, cancelText?, onConfirm?, onCancel? }` | Show dialog |
| `showSnackbar` | `{ message, actionText?, duration?, type? }` | Show snackbar |
| `hideKeyboard` | — | Hide soft keyboard |
| `setFocus` | `{ id }` | Focus a component |
| `scrollTo` | `{ position }` | Scroll to position |
| `scrollToItem` | `{ index }` | Scroll to list item |

### Data
| Action | Data | Description |
|--------|------|-------------|
| `sendViewData` | `{ target, data }` | Send data to another screen |
| `sharedStore` | `{ key, value }` | Update shared data store |

### Storage (Persistent)
| Action | Data | Description |
|--------|------|-------------|
| `setStorage` | `{ key, value }` | Save to persistent storage |
| `getStorage` | `{ key, requestId }` | Read from storage (response via `onDataReceived`) |
| `removeStorage` | `{ key }` | Delete from storage |

### Platform
| Action | Data | Description |
|--------|------|-------------|
| `openUrl` | `{ url }` | Open URL in browser |
| `copyToClipboard` | `{ text }` | Copy to clipboard |
| `readClipboard` | `{ requestId }` | Read clipboard |
| `share` | `{ title?, text?, url? }` | Native share sheet |
| `getDeviceInfo` | `{ requestId }` | Get device info |
| `vibrate` | `{ type?, duration? }` | Haptic feedback: `"light"`, `"medium"`, `"heavy"`, `"success"`, `"warning"`, `"error"` |
| `setStatusBar` | `{ color, darkIcons }` | Set status bar style |
| `setScreenBrightness` | `{ level }` | Set brightness (0.0–1.0) |
| `keepScreenOn` | `{ enabled }` | Prevent screen sleep |
| `setOrientation` | `{ orientation }` | Lock orientation: `"portrait"`, `"landscape"` |

### WebSocket
| Action | Data | Description |
|--------|------|-------------|
| `connectWebSocket` | `{ url, id?, autoReconnect?, maxReconnectAttempts? }` | Open WebSocket |
| `sendWebSocket` | `{ message, id? }` | Send WS message |
| `closeWebSocket` | `{ id? }` | Close WS connection |

### Logging
| Action | Data | Description |
|--------|------|-------------|
| `log` | `{ level, message }` | Log message: level = `"v"`, `"d"`, `"i"`, `"w"`, `"e"` |

---

## 5. Lifecycle Events (Kotlin → JS)

Events dispatched from Kotlin to JS. JS defines global functions with matching names.

| Event | When | Data |
|-------|------|------|
| `onCreateView()` | Screen loaded and script evaluated | — |
| `onResume()` | App resumed | — |
| `onPause()` | App paused | — |
| `onDestroy()` | Screen destroyed | — |
| `onVisible()` | Screen became visible | — |
| `onInvisible()` | Screen became invisible | — |
| `onBackPressed()` | Back button pressed | — |
| `onNetworkReconnect()` | Network reconnected | — |
| `onDataReceived(data)` | HTTP response received | `{ requestId, status, body, error? }` |
| `onEventReceived(data)` | Custom event | varies |
| `onViewData(data)` | Navigation data received | varies |
| `onRealtimeData(data)` | WebSocket message | `{ id, message }` |
| `onWSConnected(data)` | WebSocket connected | `{ id }` |
| `onWSDisconnected(data)` | WebSocket disconnected | `{ id }` |
| `onWSError(data)` | WebSocket error | `{ id, error }` |
| `onError(error)` | Engine error | `{ type, message, code?, details? }` |

---

## 6. OnTheFly JS API

Functions injected into the JS runtime by the engine.

### UI
| Function | Description |
|----------|-------------|
| `OnTheFly.setUI(tree)` | Set the full UI tree (object with `type`, `props`, `children`) |
| `OnTheFly.update(id, props)` | Partial update: merge props into component by ID |
| `OnTheFly.registerStyles(styles)` | Register component styles |
| `OnTheFly.sendToNative(action, data)` | Send native action (see section 4) |

### State
| Function | Description |
|----------|-------------|
| `OnTheFly.state(key, initialValue)` | Declare reactive state |
| `OnTheFly.getState(key)` | Get state value |
| `OnTheFly.setState(key, value)` | Set state (triggers auto-update on bound components) |
| `OnTheFly.computed(key, fn)` | Declare computed value with caching |

**Binding syntax in props:** `"$state.myKey"`, `"$computed.myKey"`, `"$lang.myKey"`

### Shared Store (cross-screen)
| Function | Description |
|----------|-------------|
| `OnTheFly.shared.get(key)` | Get shared value |
| `OnTheFly.shared.set(key, value)` | Set shared value |
| `OnTheFly.shared.remove(key)` | Remove key |
| `OnTheFly.shared.getAll()` | Get all as object |
| `OnTheFly.shared.keys()` | Get all keys |

### Global Store (with watchers)
| Function | Description |
|----------|-------------|
| `OnTheFly.store.get(key)` | Get store value |
| `OnTheFly.store.set(key, value)` | Set store value (notifies watchers) |
| `OnTheFly.store.watch(key, callback)` | Watch for changes |

### i18n
| Function | Description |
|----------|-------------|
| `OnTheFly.t(key, params?)` | Translate key with optional param interpolation |
| `OnTheFly.i18n.setLocale(locale)` | Set active locale |
| `OnTheFly.i18n.getLocale()` | Get active locale |
| `OnTheFly.i18n.getAvailableLocales()` | List available locales |

### WebSocket
| Function | Description |
|----------|-------------|
| `OnTheFly.connectWS(url, options?)` | Connect (`{ id?, autoReconnect?, maxReconnectAttempts? }`) |
| `OnTheFly.sendWS(message, id?)` | Send message |
| `OnTheFly.closeWS(id?)` | Close connection |
| `OnTheFly.getWSState(id?)` | Get state: `"connecting"`, `"connected"`, `"disconnecting"`, `"disconnected"` |

### Validation
| Function | Description |
|----------|-------------|
| `OnTheFly.validate(value, rules)` | Validate single value |
| `OnTheFly.validateForm(formRules)` | Validate form `{ fieldName: { value, rules } }` |

**Rules:** `required`, `email`, `minLength`, `maxLength`, `pattern`, `min`, `max`, `match`, `custom`

### Debug
| Function | Description |
|----------|-------------|
| `OnTheFly.debug.setEnabled(bool)` | Enable/disable debug |
| `OnTheFly.debug.showConsole()` | Show debug console |
| `OnTheFly.debug.clearConsole()` | Clear console |
| `OnTheFly.debug.enableInspector()` | Enable component inspector |
| `OnTheFly.debug.enableNetworkLog()` | Enable network logging |
| `OnTheFly.debug.showPerformanceOverlay()` | Show performance overlay |
| `OnTheFly.debug.showStateInspector()` | Show state inspector |

### Logging
| Function | Description |
|----------|-------------|
| `console.log(...)` | Debug log |
| `OnTheFly.log(msg)` | Info level |
| `OnTheFly.log.v(msg)` | Verbose |
| `OnTheFly.log.d(msg)` | Debug |
| `OnTheFly.log.i(msg)` | Info |
| `OnTheFly.log.w(msg)` | Warning |
| `OnTheFly.log.e(msg)` | Error |

### Bundle Info
| Function | Description |
|----------|-------------|
| `OnTheFly.getBundleInfo()` | Returns `{ name, version }` |
| `OnTheFly.getEngineVersion()` | Returns engine version string |

---

## 7. Available Icons

Built-in Material 3 icons resolved by name string:

| Name | Name | Name | Name |
|------|------|------|------|
| `home` | `settings` | `search` | `add` |
| `close` | `delete` | `edit` | `favorite` |
| `favorite_border` | `star` | `person` | `email` |
| `phone` | `lock` | `visibility` | `visibility_off` |
| `check` | `check_circle` | `error` | `warning` |
| `info` | `arrow_back` | `arrow_forward` | `arrow_drop_down` |
| `menu` | `more_vert` | `refresh` | `share` |
| `notifications` | `shopping_cart` | `location_on` | `calendar_today` |
| `access_time` | `camera` | `photo` | `send` |
| `done` | `clear` | `account_circle` | `thumb_up` |
| `chat` | `help` | `play_arrow` | `pause` |
| `stop` | `download` | `upload` | `copy` |
| `save` | `archive` | | |

Unknown names fall back to `help` icon.

---

## 8. Animation Config

### Enter/Exit Animation

Pass as `enterAnimation` or `exitAnimation` prop on any component:

```javascript
{
    type: "fadeIn",       // animation type
    duration: 300,        // ms
    delay: 0,             // ms delay before start
    easing: "easeInOut"   // easing curve
}
```

**Types:** `fadeIn`, `slideInLeft`, `slideInRight`, `slideInUp`, `slideInDown`, `scaleIn`

**Easing:** `linear`, `easeIn`, `easeOut`, `easeInOut`, `spring`

### Stagger Animation (Lists)

Pass as `itemAnimation` prop on `LazyColumn`:

```javascript
{
    type: "fadeIn",       // animation type per item
    duration: 300,        // ms per item
    staggerDelay: 50      // ms delay between items
}
```

---

## 9. Style System

### Registering Styles (JS)

```javascript
OnTheFly.registerStyles(JSON.stringify({
    "myButton": {
        "backgroundColor": "#FF5722",
        "color": "#FFFFFF",
        "fontSize": 16,
        "fontWeight": "bold",
        "borderRadius": 8,
        "padding": 12
    }
}));
```

### Using Styles

```javascript
{ type: "Button", props: { style: "myButton", text: "Click Me" } }
```

### Style Properties

| Property | Type | Description |
|----------|------|-------------|
| `fontSize` | Int | Font size (sp) |
| `fontWeight` | String | Font weight |
| `fontStyle` | String | Font style |
| `color` | String | Text color (hex) |
| `textColor` | String | Text color alias |
| `textAlign` | String | Text alignment |
| `textDecoration` | String | Underline/lineThrough |
| `lineHeight` | Float | Line height (sp) |
| `letterSpacing` | Float | Letter spacing (sp) |
| `background` | String | Background color (hex) |
| `backgroundColor` | String | Background alias |
| `borderRadius` | Int | Corner radius (dp) |
| `cornerRadius` | Int | Corner radius alias |
| `borderWidth` | Int | Border width (dp) |
| `borderColor` | String | Border color (hex) |
| `elevation` | Int | Shadow elevation (dp) |
| `padding` | Int | Uniform padding (dp) |
| `paddingTop` | Int | Top padding (dp) |
| `paddingBottom` | Int | Bottom padding (dp) |
| `paddingStart` | Int | Start padding (dp) |
| `paddingEnd` | Int | End padding (dp) |
| `spacing` | Int | Child spacing (dp) |
| `alignment` | String | Alignment |
| `crossAlignment` | String | Cross alignment |
| `width` | Any | Width ("fill"/"wrap"/dp) |
| `height` | Int | Height (dp) |
| `opacity` | Float | Opacity (0.0–1.0) |

Props on components **override** style values. Style values **override** defaults.

---

## 10. ScriptStorage Interface

The `ScriptStorage` interface provides script file I/O, key-value persistence, zip-based bundling, and OTA update support.

### Core Methods

| Method | Return | Description |
|--------|--------|-------------|
| `readFile(bundleName, fileName)` | `String?` | Read a script file from a bundle |
| `listBundles()` | `List<String>` | List all available script bundles |
| `getManifest(bundleName)` | `String?` | Read bundle manifest.json |
| `ensureInitialized()` | `Unit` | Ensure scripts directory exists and is populated |

### Key-Value Storage (Persistent)

| Method | Return | Description |
|--------|--------|-------------|
| `setKV(key, value)` | `Unit` | Save string value to persistent storage |
| `getKV(key)` | `String?` | Read string value from persistent storage |
| `removeKV(key)` | `Unit` | Remove key from persistent storage |

### Zip Bundling & OTA Updates

| Method | Return | Description |
|--------|--------|-------------|
| `getLocalVersion()` | `String?` | Get version of locally installed scripts |
| `getBundledVersion()` | `String?` | Get version from bundled zip in app assets |
| `extractBundledScripts(onProgress?)` | `Unit` | Extract bundled scripts.zip to local storage (atomic swap) |
| `installFromZip(zipFilePath, onProgress?)` | `Unit` | Install scripts from a downloaded zip file (atomic swap) |
| `getScriptsDirectory()` | `String` | Get absolute path to local scripts directory |
| `checkAndDownloadRemoteUpdate(serverUrl, onProgress?)` | `Boolean` | Check remote server for updates, download and install if newer. Returns true if updated. |

**Atomic swap pattern:** Extract to `scripts_tmp/` → delete old `scripts/` → rename `scripts_tmp/` to `scripts/`. On failure, `scripts_tmp/` is cleaned up and old scripts remain intact.

### Platform Implementations

| Platform | Class | Storage Backend |
|----------|-------|-----------------|
| Android | `AndroidScriptStorage` | `SharedPreferences` for KV, app internal files for scripts |
| iOS | `IosScriptStorage` | `NSUserDefaults` for KV, documents directory for scripts |
| Desktop | `DesktopScriptStorage` | `java.util.prefs.Preferences` for KV, file system for scripts |

---

## 11. SplashScreen API

Native Compose splash screen that handles app initialization with visual progress feedback.

```kotlin
@Composable
fun SplashScreen(
    localStorage: ScriptStorage,
    productionServerUrl: String? = null,  // set to enable OTA update check
    appVersion: String = "1.0.0",
    onReady: () -> Unit                   // called when initialization completes
)
```

### Behavior

1. Reads persisted `dark_mode` and `stock_lang` from `localStorage.getKV()` to theme itself
2. Runs initialization in background: version check → extract bundled scripts → check OTA updates
3. Displays smooth progress animation over minimum 2 seconds
4. Supports dark/light theme and EN/VI localization
5. Calls `onReady()` when initialization completes

### Initialization Flow

| Phase | Progress | Duration | Action |
|-------|----------|----------|--------|
| Checking | 0% → 30% | 400ms | Compare local vs bundled version |
| Extracting | 30% → 75% | 800ms | Extract bundled scripts if newer |
| Downloading | 75% → 95% | 500ms | Check & download OTA update (if server URL set) |
| Ready | 95% → 100% | 200ms | Finalize |

---

## 12. Settings Persistence

Dark mode and language preferences are persisted across app restarts.

### JS → Native Storage (on user change)

```javascript
// In appState.js
AppState.setDarkMode(enabled);
// → OnTheFly.sendToNative("setStorage", { key: "dark_mode", value: String(enabled) })

// In stockI18n.js
StockI18n.setLang("vi");
// → OnTheFly.sendToNative("setStorage", { key: "stock_lang", value: lang })
```

### Native → SharedDataStore (on app startup)

`ScriptViewModel.restorePersistedPreferences()` reads `dark_mode` and `stock_lang` from `localStorage.getKV()` and sets them into `SharedDataStore` before scripts load. This ensures JS code sees the correct values immediately via `AppState.isDarkMode()` and `StockI18n.getLang()`.
