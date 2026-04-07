#!/bin/bash
cd "$(dirname "$0")"

# Setup venv if needed
if [ ! -d ".venv" ]; then
    echo "  Setting up venv..."
    python3 -m venv .venv
    .venv/bin/pip install -q watchdog
fi

.venv/bin/python3 server.py "$@"
