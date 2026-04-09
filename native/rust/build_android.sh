#!/bin/bash
# Build Rust native library for Android (arm64-v8a, armeabi-v7a, x86_64)
# Requires: cargo-ndk (cargo install cargo-ndk), Android NDK
set -e
cd "$(dirname "$0")"

echo "=== Building OnTheFly Engine (Rust) for Android ==="

# Install cargo-ndk if not present
if ! command -v cargo-ndk &> /dev/null; then
    echo "Installing cargo-ndk..."
    cargo install cargo-ndk
fi

OUTPUT_DIR="../../onthefly-engine/src/androidMain/jniLibs"

echo "Building for arm64-v8a, armeabi-v7a, x86_64..."
cargo ndk \
    -t arm64-v8a \
    -t armeabi-v7a \
    -t x86_64 \
    -o "$OUTPUT_DIR" \
    build --release

echo ""
echo "=== Android build complete ==="
for abi in arm64-v8a armeabi-v7a x86_64; do
    LIB="$OUTPUT_DIR/$abi/libonthefly_engine.so"
    if [ -f "$LIB" ]; then
        echo "  $abi: $(du -h "$LIB" | cut -f1)"
    else
        echo "  $abi: NOT FOUND"
    fi
done
