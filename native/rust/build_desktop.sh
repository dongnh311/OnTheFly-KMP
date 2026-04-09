#!/bin/bash
# Build Rust native library for Desktop (macOS/Linux/Windows)
set -e
cd "$(dirname "$0")"

echo "=== Building OnTheFly Engine (Rust) for Desktop ==="
cargo build --release

# Show output
if [[ "$(uname)" == "Darwin" ]]; then
    LIB="target/release/libonthefly_engine.dylib"
elif [[ "$(uname)" == "Linux" ]]; then
    LIB="target/release/libonthefly_engine.so"
else
    LIB="target/release/onthefly_engine.dll"
fi

if [ -f "$LIB" ]; then
    echo "Done: $LIB ($(du -h "$LIB" | cut -f1))"
else
    echo "Error: $LIB not found"
    exit 1
fi
