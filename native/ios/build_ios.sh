#!/bin/bash
# Build QuickJS + bridge as static library for iOS targets
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
QUICKJS_DIR="$SCRIPT_DIR/../quickjs"
BUILD_DIR="$SCRIPT_DIR/build"

CFLAGS="-DCONFIG_VERSION=\"2025-09-13\" -DCONFIG_BIGNUM -D_GNU_SOURCE -I$QUICKJS_DIR -I$SCRIPT_DIR -Wno-implicit-function-declaration -Wno-int-conversion -Wno-sign-compare -Wno-unused-parameter -Wno-missing-field-initializers -O2"

SOURCES="$QUICKJS_DIR/quickjs.c $QUICKJS_DIR/cutils.c $QUICKJS_DIR/dtoa.c $QUICKJS_DIR/libregexp.c $QUICKJS_DIR/libunicode.c $QUICKJS_DIR/quickjs-libc.c $SCRIPT_DIR/onthefly_bridge.c"

build_target() {
    local TARGET=$1
    local SDK=$2
    local ARCH=$3
    local OUT_DIR="$BUILD_DIR/$TARGET"

    mkdir -p "$OUT_DIR"

    echo "Building for $TARGET ($ARCH)..."

    local SDK_PATH=$(xcrun --sdk $SDK --show-sdk-path)
    local CC="xcrun --sdk $SDK clang"

    local TARGET_FLAG=""
    case $TARGET in
        iosArm64) TARGET_FLAG="-target arm64-apple-ios16.0" ;;
        iosX64) TARGET_FLAG="-target x86_64-apple-ios16.0-simulator" ;;
        iosSimulatorArm64) TARGET_FLAG="-target arm64-apple-ios16.0-simulator" ;;
    esac

    for src in $SOURCES; do
        local obj="$OUT_DIR/$(basename ${src%.c}.o)"
        $CC $CFLAGS $TARGET_FLAG -isysroot $SDK_PATH -c "$src" -o "$obj"
    done

    ar rcs "$OUT_DIR/libonthefly_ios.a" "$OUT_DIR"/*.o
    echo "  -> $OUT_DIR/libonthefly_ios.a"
}

build_target "iosArm64" "iphoneos" "arm64"
build_target "iosX64" "iphonesimulator" "x86_64"
build_target "iosSimulatorArm64" "iphonesimulator" "arm64"

echo "Done! Static libraries built for all iOS targets."
