# OnTheFly KMP

**Dynamic UI Engine** for Android, iOS and Desktop — renders native Compose widgets from JavaScript scripts at runtime via the **QuickJS** engine.

Zero WebView, zero HTML — all UI is native Jetpack Compose / Compose Multiplatform driven entirely by JavaScript.

```
JavaScript defines UI → QuickJS executes (C) → UIComponent tree (Kotlin) → Compose renders native → User interactions flow back to JS
```

## Screenshots

| Android | iOS |
|:---:|:---:|
| <img src="screenshots/android_home.png" width="300"/> | <img src="screenshots/ios_home.png" width="300"/> |
| Pixel 8 Pro (API 34) | iPhone 16 Pro (iOS 18) |

> Same JS bundle, native UI on both platforms — powered by QuickJS engine.

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Language | Kotlin Multiplatform | 2.1.10 |
| UI | Compose Multiplatform | 1.7.3 |
| Navigation | Compose Navigation | 2.8.0-alpha12 |
| Networking | Ktor Client | 2.3.12 |
| JS Engine | QuickJS (embedded C) | 2025-09-13 |
| Lifecycle | AndroidX Lifecycle | 2.8.4 |
| Build | Gradle 8.11.1, AGP 8.7.3 | - |
| Android Min SDK | 24 (Android 7.0) | Target: 36 |
| iOS Min | 16.0 | - |

## UI Components (40+)

### Layout
| Component | Description |
|---|---|
| `Column` | Vertical layout (padding, spacing, alignment, scrollable, border, opacity, onClick) |
| `Row` | Horizontal layout (spaceBetween, spaceAround, spaceEvenly, scrollable) |
| `Box` | Stack/overlay container (contentAlignment: topStart...bottomEnd) |
| `Card` | Elevated container with shadow, borderRadius |
| `Spacer` | Fixed width/height spacer |
| `Divider` | Horizontal line separator |
| `LazyColumn` | Virtualized vertical list (pull-to-refresh, infinite scroll, stagger animation) |
| `LazyRow` | Virtualized horizontal list |
| `Grid` | Multi-column grid layout |

### Display
| Component | Description |
|---|---|
| `Text` | Styled text (fontSize, fontWeight, fontStyle, maxLines, textDecoration, lineHeight) |
| `RichText` | Multiple styled spans with click handlers |
| `Image` | Remote/local image with contentScale, borderRadius |
| `Icon` | Material icons (50+ mapped: home, settings, search, favorite, etc.) |
| `Badge` | Notification dot or count badge |
| `Avatar` | Circular avatar with initials fallback |
| `ProgressBar` | Linear/circular, determinate/indeterminate |

### Input
| Component | Description |
|---|---|
| `Button` | Filled/outlined/text variants, loading spinner, leading icon |
| `IconButton` | Circular icon-only button |
| `TextField` | Label, placeholder, type (text/password/email/number/phone/multiline), error, icons |
| `Toggle` / `Switch` | On/off switch with label |
| `Checkbox` | Checkable with label |
| `RadioGroup` | Radio options (vertical/horizontal) |
| `Dropdown` | Select dropdown with options |
| `SearchBar` | Search input with clear and cancel |
| `Slider` | Continuous/discrete value slider with label |
| `Chip` | Selectable label with icon, close button |

### Navigation
| Component | Description |
|---|---|
| `TopAppBar` | Title, subtitle, navigation icon, action buttons |
| `BottomNavBar` | Bottom navigation with icons, labels, badges |
| `TabBar` | Tab row (fixed or scrollable) with indicator |
| `TabContent` | Animated page switching by selected index |
| `Drawer` | Side panel with header, menu items, scrim overlay |

### Feedback / Overlay
| Component | Description |
|---|---|
| `FullScreenPopup` | Animated overlay (fade/slide/scale) |
| `ConfirmDialog` | Alert dialog with confirm/cancel |
| `BottomSheet` | Slide-up panel with handle, configurable height |
| `Snackbar` | Auto-dismiss message bar with action, top/bottom position |
| `LoadingOverlay` | Full-screen spinner with message |
| `Tooltip` | Tooltip wrapper around child component |

### Advanced
| Component | Description |
|---|---|
| `SwipeToAction` | Swipe to reveal left/right action buttons |
| `WebView` | Web content (placeholder — needs platform SDK) |
| `MapView` | Map display (placeholder — needs platform SDK) |
| `VideoPlayer` | Video playback (placeholder — needs platform SDK) |

## Engine Features

### State Management
```javascript
// Reactive local state
OnTheFly.state("count", 0);
OnTheFly.setState("count", OnTheFly.getState("count") + 1);

// Auto-binding in UI
{ type: "Text", props: { text: "Count: $state.count" } }

// Computed values
OnTheFly.computed("total", function() { return getState("price") * getState("qty"); });
{ type: "Text", props: { text: "Total: $computed.total" } }

// Global store (cross-screen)
OnTheFly.store.set("user", { name: "Dong" });
OnTheFly.store.watch("cart", function(v) { /* react to changes */ });

// Persistent storage (survives restart)
OnTheFly.sendToNative("setStorage", { key: "token", value: "abc" });
```

### Multi-Language (i18n)
```javascript
OnTheFly.setLocale("vi");
OnTheFly.t("welcome_back");              // "Chào mừng trở lại!"
OnTheFly.t("greeting", { name: "Dong" }); // "Xin chào, Dong!"

// Auto-binding in UI
{ type: "Text", props: { text: "$lang.welcome_back" } }
{ type: "Button", props: { text: "$lang.submit" } }
```

Language files: `devserver/scripts/languages/en.json`, `vi.json` (65+ keys each).

### Animation System
```javascript
// Enter/exit animations on any component
{ type: "Card", props: {
    enterAnimation: { type: "slideInUp", duration: 300, easing: "spring" },
    exitAnimation: { type: "fadeOut", duration: 200 }
}}

// Stagger animation for lists
{ type: "LazyColumn", props: {
    itemAnimation: { type: "slideInLeft", duration: 200, staggerDelay: 50 }
}}

// Types: fadeIn/Out, slideIn/OutLeft/Right/Up/Down, scaleIn/Out
// Easing: linear, easeIn, easeOut, easeInOut, spring
```

### Error Handling
```javascript
function onError(error) {
  // error = { type: "js_error"|"network_error"|"timeout_error", message, code, details }
  if (error.type === "network_error" && error.status === 401) {
    OnTheFly.sendToNative("navigateClearStack", { screen: "login" });
  }
}
```
- Auto-retry on script load failures (configurable `maxRetries`)
- Network requests: retry with exponential backoff, timeout, cancellation
- Error config from manifest.json: `showFallbackUI`, `reportErrors`, `maxRetries`

### Security
- **Script signature verification** (SHA-256 per-file + bundle hash)
- **Domain whitelist** for outbound requests
- **HTTPS enforcement** (configurable)
- **Rate limiting** (max requests per minute)
- Platform SHA-256: `java.security` (Android/Desktop), `CommonCrypto` (iOS)

### Platform Integration
```javascript
OnTheFly.sendToNative("openUrl", { url: "https://example.com" });
OnTheFly.sendToNative("copyToClipboard", { text: "Hello" });
OnTheFly.sendToNative("share", { title: "Check this", text: "...", url: "..." });
OnTheFly.sendToNative("getDeviceInfo", {});  // → platform, model, screen, locale, darkMode
OnTheFly.sendToNative("vibrate", { type: "success" });
```

### Dark Mode
```javascript
OnTheFly.registerStyles({ title: { color: "#FFF" } }, "dark");
OnTheFly.setTheme("dark");
```

### Custom Components
```javascript
OnTheFly.registerComponent("UserCard", function(props) {
  return {
    type: "Card", children: [
      { type: "Row", props: { spacing: 12 }, children: [
        { type: "Avatar", props: { name: props.name, size: 40 } },
        { type: "Text", props: { text: props.name, fontWeight: "bold" } }
      ]}
    ]
  };
});
// Usage: { type: "UserCard", props: { name: "Dong" } }
```

### Debug Tools
```javascript
OnTheFly.debug.showConsole(true);
OnTheFly.debug.enableInspector(true);
OnTheFly.debug.enableNetworkLog(true);
OnTheFly.debug.showPerformanceOverlay(true);
OnTheFly.debug.config({ console: true, inspector: false, verboseLogging: true });
```

### Versioning
```javascript
OnTheFly.getBundleInfo();    // { name: "home", version: "2.1.0" }
OnTheFly.getEngineVersion(); // "1.0.0"
```
- Engine-bundle compatibility check (`minEngineVersion`, `maxEngineVersion`)
- Semver comparison for version validation

## Project Structure

```
OnTheFly-KMP/
├── composeApp/src/
│   ├── commonMain/kotlin/com/onthefly/app/
│   │   ├── App.kt
│   │   ├── domain/
│   │   │   ├── model/              UIComponent, EngineEvent, NativeAction, ScriptBundle
│   │   │   ├── repository/         ScriptRepository
│   │   │   └── usecase/            LoadScriptUseCase
│   │   ├── engine/
│   │   │   ├── QuickJSEngine.kt    Bridge + state/i18n/debug API injection
│   │   │   ├── ErrorHandler.kt     EngineError, ErrorConfig
│   │   │   ├── SecurityConfig.kt   Domain whitelist, HTTPS, rate limiting
│   │   │   ├── ScriptVerifier.kt   SHA-256 signature verification
│   │   │   ├── VersionManager.kt   Semver compatibility
│   │   │   ├── DebugConfig.kt      Observable debug state
│   │   │   └── style/              ComponentStyle, StyleRegistry (dark mode)
│   │   ├── data/
│   │   │   ├── repository/         ScriptRepositoryImpl (libs, base, languages)
│   │   │   └── source/             ScriptStorage, NetworkSource, DevServerSource
│   │   ├── platform/
│   │   │   └── PlatformActions.kt  expect: openUrl, clipboard, share, deviceInfo, vibrate
│   │   ├── presentation/
│   │   │   ├── renderer/
│   │   │   │   ├── DynamicRenderer.kt      Component router + animation wrapper
│   │   │   │   ├── RenderUtils.kt          Prop helpers, modifiers, accessibility
│   │   │   │   ├── LayoutRenderers.kt       Column, Row, Box, Card, Spacer, Divider
│   │   │   │   ├── DisplayRenderers.kt      Text, Image, Icon, IconButton
│   │   │   │   ├── InputRenderers.kt        Button, TextField, Toggle, Checkbox, etc.
│   │   │   │   ├── ListRenderers.kt         LazyColumn, LazyRow, Grid + stagger
│   │   │   │   ├── NavigationRenderers.kt   TopAppBar, BottomNavBar, TabBar, Drawer
│   │   │   │   ├── FeedbackRenderers.kt     FullScreenPopup, ConfirmDialog
│   │   │   │   ├── OverlayRenderers.kt      BottomSheet, Snackbar, Badge, Avatar, etc.
│   │   │   │   ├── AdvancedRenderers.kt     RichText, Slider, SwipeToAction, WebView
│   │   │   │   └── AnimationUtils.kt        Enter/exit/stagger animation system
│   │   │   ├── viewmodel/          ScriptViewModel
│   │   │   ├── navigation/         AppNavigation
│   │   │   └── screen/             ScriptScreen, ScriptViewModelFactory
│   │   └── util/                   JsonParser
│   │
│   ├── androidMain/                Android: JNI bridge, ScriptStorage, PlatformActions
│   ├── iosMain/                    iOS: cinterop bridge, ScriptStorage, PlatformActions
│   └── desktopMain/                Desktop: JNI bridge, ScriptStorage, PlatformActions
│
├── native/                         C/C++ QuickJS bridges
│   ├── quickjs/                    QuickJS engine source
│   ├── ios/                        iOS C bridge + build script
│   ├── bridge_desktop.cpp          Desktop JNI bridge
│   └── CMakeLists.txt
│
├── devserver/
│   ├── scripts/
│   │   ├── _base/                  Shared utility functions
│   │   ├── _libs/                  Shared state libraries
│   │   ├── languages/              i18n translations (en.json, vi.json)
│   │   ├── screens/                Screen bundles
│   │   │   ├── home/
│   │   │   ├── components-demo/
│   │   │   ├── demo-app/
│   │   │   ├── detail-app/
│   │   │   ├── api-demo/
│   │   │   ├── popup-fullscreen/
│   │   │   └── popup-confirm/
│   │   └── version.json
│   └── server.py                   Dev server (HTTP + watcher + validation)
│
└── iosApp/                         Xcode project wrapper
```

## Bidirectional Event System

### Native → JS (30+ events)

| Category | Events |
|---|---|
| Lifecycle | `onCreateView`, `onResume`, `onPause`, `onDestroy`, `onVisible`, `onInvisible` |
| Data | `onDataReceived`, `onViewData`, `onDeepLink`, `onPushNotification` |
| Input | `onClick`, `onToggle`, `onTextChanged`, `onSubmit`, `onCheckChanged`, `onRadioChanged`, `onSliderChanged`, `onDropdownChanged` |
| Navigation | `onTabChanged`, `onDrawerItemClick` |
| List | `onRefresh`, `onEndReached`, `onSwipeAction` |
| Error | `onError` (js_error, network_error, timeout_error) |

### JS → Native (30+ actions)

| Category | Actions |
|---|---|
| Navigation | `navigate`, `goBack`, `navigateDelayed`, `navigateReplace`, `navigateClearStack` |
| Network | `sendRequest` (retry, timeout), `cancelRequest` |
| UI | `showToast`, `showSnackbar`, `hideKeyboard`, `setFocus`, `scrollTo` |
| Storage | `setStorage`, `getStorage`, `removeStorage` |
| Platform | `openUrl`, `copyToClipboard`, `readClipboard`, `share`, `getDeviceInfo`, `vibrate` |

## expect/actual Pattern

| expect (commonMain) | actual Android | actual iOS | actual Desktop |
|---|---|---|---|
| `QuickJSBridge` | JNI → bridge.cpp | cinterop → onthefly_bridge.c | JNI → bridge_desktop.cpp |
| `ScriptStorage` | Context + SharedPrefs | NSFileManager + NSUserDefaults | java.io.File + Preferences |
| `PlatformActions` | Intent, ClipboardManager, Vibrator | UIKit, UIPasteboard, Haptics | AWT Desktop, Toolkit |
| `sha256Hex()` | java.security.MessageDigest | CommonCrypto CC_SHA256 | java.security.MessageDigest |
| `currentTimeMillis()` | System.currentTimeMillis() | NSDate.timeIntervalSince1970 | System.currentTimeMillis() |
| `createHttpClient()` | Ktor OkHttp | Ktor Darwin | Ktor OkHttp |
| `getDevServerBaseUrl()` | `10.0.2.2:8080` | `localhost:8080` | `localhost:8080` |

## Build & Run

### Prerequisites

- JDK 17+
- Android SDK (API 36)
- Android NDK 27.0.12077973
- CMake 3.22.1
- Xcode 15+ (for iOS)

### Android

```bash
./gradlew :composeApp:assembleDebug
# Or open in Android Studio and run
```

### Desktop

```bash
# Compile native library first (one-time):
cd native && mkdir -p build && cd build
cmake .. && make

# Run:
./gradlew :composeApp:run
```

### iOS

```bash
# Build QuickJS static libraries (one-time):
cd native/ios && ./build_ios.sh

# Open iosApp/iosApp.xcodeproj in Xcode and run
```

## Hot Reload (Dev Server)

```bash
cd devserver
pip install watchdog   # optional, for fast file watching
python server.py
# Server runs on port 8080
# Edit JS → save → auto-validate → push to devices in ~2s
```

### Dev Server Commands

| Command | Description |
|---|---|
| `s` / `status` | Server status + connected devices |
| `c` / `clients` | List connected devices with details |
| `v [bundle]` | Validate JS syntax |
| `d [bundle]` | Deploy scripts to Android assets |
| `l` / `list` | List all bundles |
| `r` / `reload` | Force reload all devices |
| `ra` / `run android` | Launch Android emulator build |
| `rd` / `run desktop` | Launch desktop app |
| `q` / `quit` | Stop server |

## Migrated From

This project was migrated from [OnTheFly-Android](https://github.com/dongnh311/OnTheFly-Android) (single-platform Android) to Kotlin Multiplatform, retaining 100% of the logic and JS bundles while adding iOS and Desktop support.
