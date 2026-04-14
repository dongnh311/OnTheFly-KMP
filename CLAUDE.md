# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OnTheFly KMP is a JavaScript-driven dynamic UI engine for Kotlin Multiplatform. It renders native Compose widgets from JS scripts executed at runtime by the QuickJS C engine. Zero WebView — all UI is native Compose.

**Flow:** JavaScript defines UI → QuickJS executes (C) → UIComponent tree (Kotlin) → Compose renders native → User interactions flow back to JS

## Build & Run Commands

```bash
# Android
./gradlew :composeApp:assembleDebug

# Desktop (requires native lib built first)
cd native && mkdir -p build && cd build && cmake .. && make    # one-time native build
./gradlew :composeApp:run

# iOS (requires framework built first)
cd native/ios && ./build_ios.sh                                # one-time native build
# Then open iosApp/iosApp.xcodeproj in Xcode

# Tests (commonTest runs on desktop JVM target)
./gradlew :onthefly-engine:desktopTest

# Publish library to local Maven
./gradlew :onthefly-engine:publishToMavenLocal

# Hot reload dev server (HTTP :8080, WebSocket :8081)
cd devserver && python server.py
```

## Module Structure

Two Gradle modules (`settings.gradle.kts`):

- **`onthefly-engine`** — KMP library (Android, iOS, Desktop). Core engine, renderers, viewmodel, data layer. Publishable via `maven-publish`.
- **`composeApp`** — Sample app depending on `:onthefly-engine`. Entry points: `MainActivity.kt` (Android), `Main.kt` (Desktop), `MainViewController.kt` (iOS), common `App.kt` (NavHost).

## Architecture

### Engine Core (`onthefly-engine/src/commonMain/.../engine/`)

| Package | Purpose |
|---|---|
| `core/` | `QuickJSEngine` + `expect/actual QuickJSBridge` (JNI on Android/Desktop, cinterop on iOS) |
| `model/` | `UIComponent`, `NativeAction`, `EngineEvent`, `ScriptBundle`, `UIUpdate` |
| `data/` | `ScriptStorage` interface, `ScriptRepository`, `NetworkSource`, `WebSocketSource`, `LoadScriptUseCase` |
| `renderer/` | `DynamicRenderer` + 40+ Compose component renderers |
| `viewmodel/` | `ScriptViewModel` — orchestrates JS engine, state, WebSocket, errors |
| `ui/` | `OnTheFlyScreen` — the public composable API surface |
| `style/` | `StyleRegistry`, `ComponentStyle`, dark mode |
| `platform/` | `PlatformActions` interface — native ops (URL, clipboard, vibration, etc.) |
| `security/` | `SecurityConfig`, `NetworkSecurity`, `ScriptVerifier` |

### Platform-Specific Code (`androidMain/`, `iosMain/`, `desktopMain/`)

Each platform implements `actual QuickJSBridge`, `ScriptStorage`, `PlatformActions`, `Sha256`, and `PlatformNetwork`. Android/Desktop use JNI; iOS uses cinterop.

### Native C/C++ (`native/`)

- `quickjs/` — QuickJS C engine source (2025-09-13)
- `bridge_desktop.cpp` — JNI bridge for Desktop
- `ios/` — Objective-C bridge + `build_ios.sh` for iOS framework
- `CMakeLists.txt` — CMake build for Desktop native lib
- Android native build: `onthefly-engine/src/androidMain/cpp/CMakeLists.txt`

### Bidirectional JS ↔ Kotlin Communication

- **JS → Kotlin:** `NativeAction` (navigate, network request, storage, platform action)
- **Kotlin → JS:** `EngineEvent` (lifecycle, input, network response, WebSocket messages)

### JS State Model

- `OnTheFly.state()` / `setState()` — local component state
- `OnTheFly.computed()` — reactive derived values
- `OnTheFly.shared` — cross-screen shared store
- `ScriptStorage` — persistent key-value storage

## Dev Server (`devserver/`)

Python-based hot reload server. Watches `devserver/scripts/` for changes and pushes updates via WebSocket.

Script bundles live in `devserver/scripts/screens/` — each bundle has `manifest.json`, `main.js`, and optional `theme.js`. Shared code in `_base/` (UI builders + utils), `_libs/` (app state, theme, i18n, data), and `_modules/` (ES modules), i18n in `languages/`.

### Script Load Order

`_base/*.js` (alphabetical) → `_libs/*.js` (alphabetical) → register `_modules/*.js` → theme.js → bundle base.js → main.js. This ensures UI builder functions from `_base/ui.js` are available to all subsequent scripts. ES modules from `_modules/` are **registered but not evaluated** — they only run when a screen imports them.

### ES Modules (`_modules/`)

Files in `_modules/` are ES modules that screens can selectively import. Unlike `_base/` and `_libs/` (which auto-load for all screens), modules only execute when imported.

**Creating a module:** `devserver/scripts/_modules/dataHelper.js`
```javascript
export function formatPrice(value) {
    return "$" + Number(value).toFixed(2);
}
```

**Using in a screen:** Add `"type": "module"` to `manifest.json`, then use `import` in `main.js`:
```json
{ "name": "My Screen", "version": "1.0.0", "entry": "main.js", "type": "module" }
```
```javascript
import { formatPrice } from "dataHelper";

function render() {
    OnTheFly.setUI(Text({ text: formatPrice(150.5) }));
}
```

Lifecycle functions (`onCreateView`, `render`, `onTextChanged`, etc.) are auto-bound to `globalThis` by the engine — no manual `globalThis.xxx = xxx` needed. Globals from `_base/` and `_libs/` (`OnTheFly`, `StockTheme`, `St()`, `Column()`, etc.) remain accessible in modules.

### UI Builder Functions

All JS scripts use builder functions instead of raw object literals for UI declarations. Defined in `_base/ui.js`, loaded automatically for all screens.

```javascript
// Builder style (current)
Column({ alignment: "center", padding: { horizontal: 32 } }, [
    Text({ text: "Hello", fontSize: 28, fontWeight: "bold" }),
    Spacer({ height: 8 }),
    Button({ text: "Click", onClick: "handleClick" })
])

// Equivalent raw object (what the engine receives)
{ type: "Column", props: { alignment: "center", padding: { horizontal: 32 } }, children: [
    { type: "Text", props: { text: "Hello", fontSize: 28, fontWeight: "bold" } },
    { type: "Spacer", props: { height: 8 } },
    { type: "Button", props: { text: "Click", onClick: "handleClick" } }
]}
```

**Name mappings:** `Image` → `Img()`, `IconButton` → `IconBtn()`, `FullScreenPopup` → `Popup()`, `LoadingOverlay` → `Loading()`, `ProgressBar` → `Progress()`. All others match 1:1.

VS Code autocomplete is provided via TypeScript declarations in `devserver/types/onthefly.d.ts` + `devserver/jsconfig.json`.

The `zipScriptsToAssets` Gradle task (in `composeApp/build.gradle.kts`) creates `scripts.zip` in Android assets on every build. The app extracts this zip on first launch or when a newer bundled version is detected.

### Release Server (Production OTA Simulation)

The dev server includes a built-in release server on port 8082 for testing OTA updates:

```bash
cd devserver && python server.py build-release   # Build release zip + version.json
cd devserver && python server.py release-server   # Start release server only
# Or just run `python server.py` — release server auto-starts alongside dev server
```

Endpoints: `GET /api/version` (version check), `GET /api/download` (download zip).

### Script Delivery Modes

| Mode | Description |
|---|---|
| **Build APK** | `zipScriptsToAssets` bundles `scripts.zip` into assets. App extracts on first launch via `SplashScreen`. |
| **Production OTA** | App checks release server for newer version, downloads zip, extracts with atomic swap. |
| **Dev Hot Reload** | WebSocket push from dev server (unchanged). |

### Splash Screen

Native Compose `SplashScreen` handles initialization: version check → extract bundled scripts → check/download OTA updates. Displays for minimum 2 seconds with smooth progress animation. Reads persisted dark mode and language preferences to theme itself.

### Settings Persistence

Dark mode and language preferences are persisted to native storage (`SharedPreferences` on Android, `NSUserDefaults` on iOS, `java.util.prefs.Preferences` on Desktop) via `OnTheFly.sendToNative("setStorage", ...)` from JS. On app restart, `ScriptViewModel.restorePersistedPreferences()` restores them into `SharedDataStore` before scripts load.

## UI/View Change Rule — Props-First in Kotlin

**IMPORTANT:** When modifying any UI/view-related feature, always prioritize adding it as props in Kotlin renderer (.kt), NOT as logic in JavaScript (.js). JS code should only pass prop values — all rendering logic lives in Kotlin Compose.

**Principle:** Kotlin renderers own the rendering behavior. JS scripts declare *what* to show via props, Kotlin decides *how* to render it.

**Examples:**

- **Text color based on price change:** Add props `priceColorEnabled` (Boolean), `upColor`, `holdColor`, `downColor` to the Kotlin renderer. JS just sets `priceColorEnabled: true` and the colors — Kotlin handles the color logic.
- **Flash animation based on price change:** Add props `flashEnabled` (Boolean), `flashUpColor`, `flashHoldColor`, `flashDownColor` to the Kotlin renderer. JS sets `flashEnabled: true` with colors — Kotlin handles the flash animation lifecycle.
- **Any conditional styling:** If a visual behavior depends on a condition (e.g., positive/negative value), the condition check and style application belong in the Kotlin renderer, controlled by declarative props from JS.

**Why:** This keeps JS scripts thin and declarative, avoids duplicating rendering logic across screens, and ensures consistent behavior across all platforms (Android/iOS/Desktop).

**IMPORTANT:** Whenever you **add, remove, or modify** props, events, native actions, or JS API functions, you **MUST** update `BRIDGE_API_REFERENCE.md` in the project root to reflect the changes. This file is the single source of truth for all bridge capabilities.

## Key Technical Details

- **Kotlin 2.1.10**, **Compose Multiplatform 1.7.3**, **AGP 8.7.3**, **Gradle 8.11.1**
- **JVM target: 17** for both modules
- **Android:** minSdk 24, targetSdk 36, NDK ABIs: arm64-v8a, armeabi-v7a, x86_64
- **iOS:** minimum 16.0, static framework
- **Dependency versions** centralized in `gradle/libs.versions.toml`
- **Typesafe project accessors** enabled (`projects.ontheflyEngine`)
- Desktop JVM arg `-Donthefly.native.dir` points to the native lib directory
