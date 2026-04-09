#!/bin/bash
# Build Rust native library for iOS (arm64, x86_64 sim, arm64 sim)
set -e
cd "$(dirname "$0")"

echo "=== Building OnTheFly Engine (Rust) for iOS ==="

export IPHONEOS_DEPLOYMENT_TARGET=16.0

TARGETS=(
    "aarch64-apple-ios"
    "aarch64-apple-ios-sim"
    "x86_64-apple-ios"
)

for target in "${TARGETS[@]}"; do
    echo "Building for $target..."
    # Use --crate-type staticlib to avoid cdylib linking issues on iOS
    cargo rustc --target "$target" --release --crate-type staticlib
done

# Copy to conventional locations for Gradle
IOS_OUT="ios_libs"
mkdir -p "$IOS_OUT/iosArm64"
mkdir -p "$IOS_OUT/iosSimulatorArm64"
mkdir -p "$IOS_OUT/iosX64"

cp target/aarch64-apple-ios/release/libonthefly_engine.a "$IOS_OUT/iosArm64/"
cp target/aarch64-apple-ios-sim/release/libonthefly_engine.a "$IOS_OUT/iosSimulatorArm64/"
cp target/x86_64-apple-ios/release/libonthefly_engine.a "$IOS_OUT/iosX64/"

echo ""
echo "=== iOS build complete ==="
for dir in iosArm64 iosSimulatorArm64 iosX64; do
    LIB="$IOS_OUT/$dir/libonthefly_engine.a"
    if [ -f "$LIB" ]; then
        echo "  $dir: $(du -h "$LIB" | cut -f1)"
    else
        echo "  $dir: NOT FOUND"
    fi
done
