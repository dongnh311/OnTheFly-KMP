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

## Project Structure

```
OnTheFly_KMP/
├── composeApp/src/
│   ├── commonMain/                     ← ~90% shared code
│   │   └── kotlin/com/onthefly/app/
│   │       ├── App.kt                  Main composable
│   │       ├── domain/
│   │       │   ├── model/              UIComponent, UIUpdate, EngineEvent, NativeAction, ScriptBundle
│   │       │   ├── repository/         ScriptRepository (interface)
│   │       │   └── usecase/            LoadScriptUseCase
│   │       ├── engine/
│   │       │   ├── QuickJSEngine.kt    expect QuickJSBridge + shared engine logic
│   │       │   └── style/              ComponentStyle, StyleRegistry
│   │       ├── data/
│   │       │   ├── repository/         ScriptRepositoryImpl
│   │       │   └── source/             expect ScriptStorage, NetworkSource, DevServerSource, ScriptUpdateManager
│   │       ├── presentation/
│   │       │   ├── renderer/           DynamicRenderer (renders UIComponent → Compose)
│   │       │   ├── viewmodel/          ScriptViewModel
│   │       │   ├── navigation/         AppNavigation, ViewDataStore
│   │       │   └── screen/             SplashScreen, ScriptScreen, ScriptViewModelFactory
│   │       └── util/                   JsonParser (cross-platform)
│   │
│   ├── androidMain/                    ← Android-specific
│   │   ├── kotlin/.../engine/          QuickJSBridge actual (JNI)
│   │   ├── kotlin/.../data/source/     ScriptStorage actual (Context + SharedPrefs)
│   │   ├── kotlin/.../                 MainActivity
│   │   ├── cpp/                        bridge.cpp + QuickJS C source + CMakeLists.txt
│   │   └── AndroidManifest.xml
│   │
│   ├── iosMain/                        ← iOS-specific
│   │   ├── kotlin/.../engine/          QuickJSBridge actual (cinterop → direct C calls)
│   │   ├── kotlin/.../data/source/     ScriptStorage actual (NSFileManager + NSUserDefaults)
│   │   └── kotlin/.../                 MainViewController
│   │
│   └── desktopMain/                    ← Desktop-specific (JVM)
│       ├── kotlin/.../engine/          QuickJSBridge actual (JNI)
│       ├── kotlin/.../data/source/     ScriptStorage actual (java.io.File + Preferences)
│       └── kotlin/.../                 Main.kt (Window)
│
├── native/                             ← Shared C/C++ source
│   ├── quickjs/                        QuickJS engine source (C)
│   ├── ios/
│   │   ├── onthefly_bridge.h           C API header
│   │   ├── onthefly_bridge.c           C bridge implementation (no JNI)
│   │   ├── build_ios.sh                Build static libs for iOS targets
│   │   └── build/                      Compiled .a files per target
│   ├── bridge_desktop.cpp              Desktop JNI bridge
│   └── CMakeLists.txt                  Desktop CMake config
│
├── iosApp/                             ← Xcode project
│   ├── iosApp.xcodeproj/
│   └── iosApp/
│       ├── iOSApp.swift
│       ├── ContentView.swift           SwiftUI wrapper for ComposeUIViewController
│       └── Info.plist
│
├── devserver/                          ← Dev tools & JS bundles
│   ├── scripts/                        JavaScript source bundles
│   │   ├── version.json
│   │   ├── home/
│   │   ├── demo-app/
│   │   ├── detail-app/
│   │   ├── api-demo/
│   │   ├── popup-fullscreen/
│   │   └── popup-confirm/
│   ├── server.py                       Dev server (HTTP + file watcher)
│   └── start.sh
│
├── gradle/
│   └── libs.versions.toml             Version catalog
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Architecture

### Clean Architecture + MVVM

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION                                                │
│  SplashScreen → ScriptScreen → DynamicRenderer              │
│  ScriptViewModel (manages engine, state, events)            │
│  AppNavigation (Compose Navigation)                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│ DOMAIN                                                      │
│  UIComponent, UIUpdate, EngineEvent, NativeAction           │
│  ScriptRepository (interface), LoadScriptUseCase            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│ DATA                                                        │
│  ScriptRepositoryImpl, ScriptStorage (expect/actual)        │
│  NetworkSource (Ktor), DevServerSource, ScriptUpdateManager │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│ ENGINE (Native C)                                           │
│  QuickJSBridge (expect/actual per platform)                 │
│  QuickJS C library → bridge.cpp/onthefly_bridge.c           │
│  StyleRegistry, ComponentStyle                              │
└─────────────────────────────────────────────────────────────┘
```

### QuickJS Bridge per Platform

| Platform | Bridge Mechanism | Native Library |
|---|---|---|
| Android | JNI (`System.loadLibrary`) | `libonthefly-engine.so` (NDK/CMake) |
| iOS | Kotlin/Native cinterop (direct C calls) | `libonthefly_ios.a` (static) |
| Desktop | JNI (`System.loadLibrary`) | `libonthefly-engine.dylib/dll/so` |

### How It Works

```
1. App launches → ScriptStorage.ensureInitialized() (copies bundled scripts)
2. Navigates to "script/{bundleName}"
3. ScriptViewModel.loadAndRun(bundleName):
   a. Check dev server for updates (optional)
   b. Load theme.js → StyleRegistry
   c. Load main.js → QuickJSEngine.eval()
   d. Get UI tree → UIComponent → DynamicRenderer renders Compose widgets
4. User interaction → Component event → JS handler → update/action
5. Hot reload: polls dev server every 2s → detects changes → reloads
```

## Bidirectional Event System

### Native → JS (EngineEvent)

| Event | When |
|---|---|
| `onCreateView` | Screen loaded |
| `onResume` / `onPause` | Lifecycle changes |
| `onVisible` / `onInvisible` | Screen visibility changes |
| `onDestroy` | Screen destroyed |
| `onDataReceived` | API response received |
| `onViewData` | Data from previous screen |
| `onClick` | Button/component click |
| `onToggle` | Switch toggled |

### JS → Native (NativeAction)

| Action | Description |
|---|---|
| `navigate` | Navigate to screen with data |
| `sendRequest` | HTTP API call via Ktor |
| `showToast` | Display toast/snackbar |
| `goBack` | Back navigation |
| `navigateDelayed` | Navigate after a delay |

## Native UI Components

Components rendered by DynamicRenderer from JS definitions:

| Component | Description |
|---|---|
| `Column` | Vertical layout with padding/spacing/alignment/background |
| `Row` | Horizontal layout |
| `Text` | Styled text display (fontSize, fontWeight, color) |
| `Button` | Click handler with styled background/shape |
| `Spacer` | Fixed height spacer |
| `Toggle` | Switch on/off with label |
| `FullScreenPopup` | Animated overlay (fade + slide) |
| `ConfirmDialog` | AlertDialog with title, message, confirm/cancel |

## Script Bundle Format

Each "screen" is a bundle consisting of 3 files:

```
bundle-name/
├── manifest.json    → { "name": "...", "version": "1.0.0", "entry": "main.js" }
├── theme.js         → OnTheFly.registerStyles({...})
└── main.js          → UI tree + logic + event handlers
```

### JavaScript API

```javascript
// Set UI tree
OnTheFly.setUI({
  type: "Column",
  props: { style: "container" },
  children: [
    { type: "Text", props: { text: "Hello", style: "title" } },
    { type: "Button", props: { text: "Click", id: "btn1" } }
  ]
});

// Targeted update (only updates component by ID, no full re-render)
OnTheFly.update("counter", { text: "42" });

// Register styles
OnTheFly.registerStyles({
  title: { fontSize: 24, fontWeight: "bold", color: "#0F3460" },
  container: { padding: 16, spacing: 12, alignment: "center" }
});

// Send action to native
OnTheFly.sendToNative("navigate", { screen: "detail-app", data: { id: 1 } });
OnTheFly.sendToNative("sendRequest", { url: "https://api.example.com/data", method: "GET" });
OnTheFly.sendToNative("showToast", { message: "Done!" });

// Logging
OnTheFly.log("info message");
OnTheFly.log.d("debug"); OnTheFly.log.e("error");
console.log("also works");

// Event handlers (defined as global functions)
function onCreateView() { /* screen loaded */ }
function onClick(id) { /* component clicked */ }
function onToggle(id, data) { /* switch toggled */ }
function onDataReceived(data) { /* API response */ }
function onViewData(data) { /* data from previous screen */ }
```

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
# The app searches native/build/ automatically

# Run:
./gradlew :composeApp:run
```

### iOS

```bash
# Build QuickJS static libraries (one-time):
cd native/ios && ./build_ios.sh

# Open iosApp/iosApp.xcodeproj in Xcode and run
# Or:
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
```

## Hot Reload (Dev Server)

```bash
cd devserver
python server.py
# Server runs on port 8080
# App polls automatically every 2 seconds
# Edit JS → save → app reloads in ~2s
# "DEV" badge appears in top-right when connected
```

### Dev Server Commands

| Command | Description |
|---|---|
| `v [bundle]` | Validate JS syntax |
| `d [bundle]` | Deploy scripts to Android assets |
| `l` | List bundles |
| `r` | Force reload |
| `q` | Quit |

## Bundled Demo Scripts

| Bundle | Description |
|---|---|
| `home` | Landing screen |
| `demo-app` | Navigation, counter, toggle, popup, dialog |
| `detail-app` | Data passing between screens |
| `api-demo` | HTTP GET/POST to JSONPlaceholder |
| `popup-fullscreen` | Full-screen overlay patterns |
| `popup-confirm` | Confirm dialog demo |

## expect/actual Pattern

Platform-specific components use Kotlin Multiplatform `expect/actual`:

| expect (commonMain) | actual Android | actual iOS | actual Desktop |
|---|---|---|---|
| `QuickJSBridge` | JNI → bridge.cpp | cinterop → onthefly_bridge.c | JNI → bridge_desktop.cpp |
| `ScriptStorage` | Context + SharedPrefs | NSFileManager + NSUserDefaults | java.io.File + Preferences |
| `createHttpClient()` | Ktor OkHttp engine | Ktor Darwin engine | Ktor OkHttp engine |
| `getDevServerBaseUrl()` | `10.0.2.2:8080` (emulator) | `localhost:8080` | `localhost:8080` |

## Migrated From

This project was migrated from [OnTheFly-Android](https://github.com/dongnh311/OnTheFly-Android) (single-platform Android) to Kotlin Multiplatform, retaining 100% of the logic and JS bundles while adding iOS and Desktop support.
