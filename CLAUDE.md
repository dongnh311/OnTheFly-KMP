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

Script bundles live in `devserver/scripts/screens/` — each bundle has `manifest.json`, `main.js`, and optional `theme.js`. Shared code in `_base/` and `_libs/`, i18n in `languages/`.

The `copyScriptsToAssets` Gradle task (in `composeApp/build.gradle.kts`) copies scripts into Android assets on every build.

## Key Technical Details

- **Kotlin 2.1.10**, **Compose Multiplatform 1.7.3**, **AGP 8.7.3**, **Gradle 8.11.1**
- **JVM target: 17** for both modules
- **Android:** minSdk 24, targetSdk 36, NDK ABIs: arm64-v8a, armeabi-v7a, x86_64
- **iOS:** minimum 16.0, static framework
- **Dependency versions** centralized in `gradle/libs.versions.toml`
- **Typesafe project accessors** enabled (`projects.ontheflyEngine`)
- Desktop JVM arg `-Donthefly.native.dir` points to the native lib directory
