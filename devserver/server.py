#!/usr/bin/env python3
"""
OnTheFly Dev Server

Usage:
    python server.py                     Start dev server (with file watcher)
    python server.py validate [bundle]   Validate JS syntax
    python server.py deploy [bundle]     Copy scripts → Android assets
    python server.py build-release       Build release zip (validate + zip → releases/)
    python server.py release             Start release server standalone (port 8082)
"""

import http.server
import json
import os
import sys
import shutil
import argparse
import threading
import time
import subprocess
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    HAS_WATCHDOG = True
except ImportError:
    HAS_WATCHDOG = False

try:
    import asyncio
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False

# ═══════════════════════════════════════════════════════════
#  WebSocket Push (replaces polling for live-reload)
# ═══════════════════════════════════════════════════════════

WS_PORT = 8081
ws_clients = set()
_ws_loop = None


def start_ws_server():
    """Start WebSocket server in a background thread for push-based reload."""
    if not HAS_WEBSOCKETS:
        return

    global _ws_loop

    async def ws_handler(websocket, path=None):
        ws_clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            ws_clients.discard(websocket)

    async def run_server():
        async with websockets.serve(ws_handler, '0.0.0.0', WS_PORT):
            await asyncio.Future()  # run forever

    def thread_target():
        global _ws_loop
        _ws_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_ws_loop)
        _ws_loop.run_until_complete(run_server())

    t = threading.Thread(target=thread_target, daemon=True)
    t.start()
    print(f'  \033[32m✓\033[0m WebSocket push on port {WS_PORT}')


def notify_ws_clients():
    """Broadcast reload notification to all connected WebSocket clients."""
    if not HAS_WEBSOCKETS or not ws_clients or _ws_loop is None:
        return
    message = json.dumps({'type': 'reload', 'version': get_version()})
    for ws in list(ws_clients):
        try:
            asyncio.run_coroutine_threadsafe(ws.send(message), _ws_loop)
        except Exception:
            ws_clients.discard(ws)

DEFAULT_PORT = 8080
SCRIPT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts')
SCREENS_DIR = os.path.join(SCRIPT_DIR, 'screens')
ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          '..', 'composeApp', 'src', 'androidMain', 'assets', 'scripts')


SPECIAL_DIRS = {'_base', '_libs', 'languages'}
APP_ID = 'com.onthefly.app'


def resolve_bundle_dir(scripts_dir, bundle_name):
    """Resolve a bundle name to its directory on disk.
    Special dirs (_base, _libs, languages) live at root; screen bundles live under screens/.
    """
    if bundle_name.startswith('_') or bundle_name in SPECIAL_DIRS:
        return os.path.join(scripts_dir, bundle_name)
    screens = os.path.join(scripts_dir, 'screens')
    candidate = os.path.join(screens, bundle_name)
    if os.path.isdir(candidate):
        return candidate
    # Fallback to root (for version.json etc.)
    return os.path.join(scripts_dir, bundle_name)


def list_all_bundles(scripts_dir):
    """List all bundle names: special dirs from root + screens from screens/."""
    bundles = []
    # Special dirs at root
    for d in sorted(os.listdir(scripts_dir)):
        dp = os.path.join(scripts_dir, d)
        if os.path.isdir(dp) and (d.startswith('_') or d in SPECIAL_DIRS):
            bundles.append(d)
    # Screen bundles
    screens = os.path.join(scripts_dir, 'screens')
    if os.path.isdir(screens):
        for d in sorted(os.listdir(screens)):
            if os.path.isdir(os.path.join(screens, d)):
                bundles.append(d)
    return bundles

# ═══════════════════════════════════════════════════════════
#  Version Tracking
# ═══════════════════════════════════════════════════════════

g_version = '0'
g_version_lock = threading.Lock()

g_bundle_versions = {}
g_bundle_lock = threading.Lock()

# Tracks whether the last file change passed validation
g_last_change_valid = True


def bump_version():
    global g_version
    with g_version_lock:
        g_version = str(int(time.time()))
    notify_ws_clients()


def bump_bundle_version(bundle_name):
    with g_bundle_lock:
        g_bundle_versions[bundle_name] = str(int(time.time()))
    bump_version()


def get_version():
    with g_version_lock:
        return g_version


def get_bundle_version(bundle_name):
    with g_bundle_lock:
        return g_bundle_versions.get(bundle_name)


# ═══════════════════════════════════════════════════════════
#  Device Tracking
# ═══════════════════════════════════════════════════════════

g_devices = {}
g_devices_lock = threading.Lock()

DEVICE_TIMEOUT = 10  # seconds before device is considered disconnected


class DeviceInfo:
    """Tracks a connected app instance."""

    def __init__(self, ip, user_agent=''):
        self.ip = ip
        self.user_agent = user_agent
        self.platform = self._detect_platform(ip, user_agent)
        self.first_seen = time.time()
        self.last_seen = time.time()
        self.seen_version = None
        self.status = 'connected'       # connected → reloading → synced
        self.reload_count = 0
        self.last_reload_at = None
        self.bundles_fetched = set()
        self._was_alive = True          # for disconnect detection

    @staticmethod
    def _detect_platform(ip, ua):
        ua_lower = (ua or '').lower()
        if 'darwin' in ua_lower or 'ios' in ua_lower:
            return 'iOS'
        if 'ktor' in ua_lower or 'okhttp' in ua_lower:
            # Android Emulator usually proxies network bounds through 127.0.0.1 to the host.
            # Without explicit headers, OkHttp from 127.0.0.1 could be Desktop or Android Emulator.
            if ip.startswith('10.0.2.') or ip.startswith('10.0.3.'):
                return 'Android (emu)'
            if ip in ('127.0.0.1', '::1', 'localhost'):
                return 'Android/Desktop'
            return 'Android'
        if ip in ('127.0.0.1', '::1', 'localhost'):
            return 'Local'
        return ip

    def on_version_poll(self, current_version, user_agent=''):
        """Called every time the device polls /version."""
        prev_status = self.status
        self.last_seen = time.time()
        if user_agent and user_agent != self.user_agent:
            self.user_agent = user_agent
            self.platform = self._detect_platform(self.ip, user_agent)

        if self.seen_version is None:
            # First poll
            self.seen_version = current_version
            self.status = 'synced'
        elif self.seen_version == current_version:
            # Version unchanged — device is up-to-date
            if self.status == 'reloading':
                self.status = 'synced'
                self.reload_count += 1
                self.last_reload_at = time.time()
                return 'reload_complete'
            self.status = 'synced'
        else:
            # New version — device will start reloading
            self.seen_version = current_version
            self.status = 'reloading'
            return 'reload_started'
        return None

    def on_script_fetch(self, bundle_name):
        """Called when device fetches a script file."""
        self.last_seen = time.time()
        self.bundles_fetched.add(bundle_name)

    def is_alive(self):
        return time.time() - self.last_seen < DEVICE_TIMEOUT

    def status_icon(self):
        if not self.is_alive():
            return '\033[90m○\033[0m'  # grey — disconnected
        if self.status == 'synced':
            return '\033[32m●\033[0m'  # green
        if self.status == 'reloading':
            return '\033[33m◐\033[0m'  # yellow
        return '\033[34m●\033[0m'      # blue — connected

    def status_text(self):
        if not self.is_alive():
            ago = int(time.time() - self.last_seen)
            return f'\033[90mdisconnected ({ago}s ago)\033[0m'
        if self.status == 'synced':
            return '\033[32msynced\033[0m'
        if self.status == 'reloading':
            return '\033[33mreloading…\033[0m'
        return '\033[34mconnected\033[0m'


def start_device_monitor():
    """Background thread that detects device disconnects in real-time."""
    def monitor_loop():
        while True:
            time.sleep(3)
            with g_devices_lock:
                for ip, dev in g_devices.items():
                    alive = dev.is_alive()
                    if dev._was_alive and not alive:
                        dev._was_alive = False
                        print(f'\n  \033[31m▸\033[0m Device disconnected: \033[1m{dev.platform}\033[0m ({ip})')
                        alive_count = sum(1 for d in g_devices.values() if d.is_alive())
                        if alive_count > 0:
                            print(f'    \033[90m{alive_count} device(s) still connected\033[0m')
                        else:
                            print(f'    \033[90mNo devices connected\033[0m')
    t = threading.Thread(target=monitor_loop, daemon=True)
    t.start()


def track_device(ip, user_agent=''):
    """Track a device polling /version. Returns event string or None."""
    with g_devices_lock:
        current_ver = get_version()
        if ip not in g_devices:
            dev = DeviceInfo(ip, user_agent)
            dev.seen_version = current_ver
            dev.status = 'synced'
            g_devices[ip] = dev
            alive_count = sum(1 for d in g_devices.values() if d.is_alive())
            print(f'  \033[32m▸\033[0m Device connected: \033[1m{dev.platform}\033[0m ({ip})  [{alive_count} total]')
            return 'new_device'
        else:
            dev = g_devices[ip]
            was_alive = dev.is_alive()
            event = dev.on_version_poll(current_ver, user_agent)
            dev._was_alive = True  # mark alive again
            if not was_alive:
                alive_count = sum(1 for d in g_devices.values() if d.is_alive())
                print(f'  \033[32m▸\033[0m Device reconnected: \033[1m{dev.platform}\033[0m ({ip})  [{alive_count} total]')
            if event == 'reload_complete':
                elapsed = ''
                if dev.last_reload_at and dev.seen_version:
                    elapsed = f' ({dev.reload_count} total)'
                print(f'  \033[32m✓\033[0m Reload complete: \033[1m{dev.platform}\033[0m ({ip}){elapsed}')
            elif event == 'reload_started':
                print(f'  \033[33m↻\033[0m Reloading: \033[1m{dev.platform}\033[0m ({ip})')
            return event


def track_script_fetch(ip, bundle_name):
    """Track when a device fetches script files."""
    with g_devices_lock:
        if ip in g_devices:
            g_devices[ip].on_script_fetch(bundle_name)


def get_connected_devices():
    """Return list of alive devices."""
    with g_devices_lock:
        return [(ip, dev) for ip, dev in g_devices.items() if dev.is_alive()]


def get_all_devices():
    """Return all tracked devices."""
    with g_devices_lock:
        return list(g_devices.items())


def count_synced():
    """Count devices that are synced with latest version."""
    with g_devices_lock:
        return sum(1 for dev in g_devices.values() if dev.is_alive() and dev.status == 'synced')


# ═══════════════════════════════════════════════════════════
#  File Watcher (watchdog) — with validation
# ═══════════════════════════════════════════════════════════

class ScriptChangeHandler(FileSystemEventHandler):
    def __init__(self, scripts_dir):
        self.scripts_dir = scripts_dir
        self.last_event = 0
        self.last_path = ''

    def on_any_event(self, event):
        if event.is_directory:
            return
        # Debounce: ignore events within 200ms for same file
        now = time.time()
        if now - self.last_event < 0.2 and event.src_path == self.last_path:
            return
        self.last_event = now
        self.last_path = event.src_path

        # Skip non-script files
        src = event.src_path
        if not any(src.endswith(ext) for ext in ('.js', '.json')):
            return

        rel = os.path.relpath(src, self.scripts_dir)
        parts = rel.split(os.sep)
        # Resolve bundle name: screens/home/main.js → bundle="home", _libs/utils.js → bundle="_libs"
        if parts[0] == 'screens' and len(parts) >= 3:
            bundle = parts[1]
            filename = parts[-1]
        elif len(parts) >= 2:
            bundle = parts[0]
            filename = parts[-1]
        else:
            return

        if not os.path.isdir(resolve_bundle_dir(self.scripts_dir, bundle)):
            return

        # ── Validate before pushing ──────────────────────
        global g_last_change_valid

        print(f'\n  \033[33m↻\033[0m File changed: \033[1m{bundle}/{filename}\033[0m')

        ok, results = validate_bundle(self.scripts_dir, bundle)
        if not ok:
            g_last_change_valid = False
            print(f'  \033[31m✗ Validation FAILED — NOT pushing to devices\033[0m')
            for fn, fok, errs in results:
                if not fok:
                    for e in errs:
                        print(f'    \033[31m{fn}: {e}\033[0m')
            alive = len(get_connected_devices())
            if alive > 0:
                print(f'  \033[90m  ({alive} device(s) waiting for valid code)\033[0m')
            print()
            return

        # ── Validation passed ────────────────────────────
        if not g_last_change_valid:
            print(f'  \033[32m✓ Errors fixed!\033[0m')
        g_last_change_valid = True

        bump_bundle_version(bundle)
        alive = len(get_connected_devices())
        synced = count_synced()
        reloading = alive - synced

        print(f'  \033[32m✓\033[0m Validated → pushing v{get_version()}', end='')
        if alive > 0:
            print(f'  ({alive} device(s) connected)')
        else:
            print(f'  \033[90m(no devices connected)\033[0m')
        print()


def start_watcher(scripts_dir):
    if not HAS_WATCHDOG:
        print('  \033[33m⚠\033[0m watchdog not installed — using polling fallback')
        print('    Install: pip install watchdog')

        def poll_loop():
            last_mtime = 0
            while True:
                max_mtime = 0
                for root, dirs, files in os.walk(scripts_dir):
                    for f in files:
                        fp = os.path.join(root, f)
                        try:
                            max_mtime = max(max_mtime, os.path.getmtime(fp))
                        except OSError:
                            pass
                if max_mtime > last_mtime and last_mtime > 0:
                    bump_version()
                last_mtime = max_mtime
                time.sleep(1)
        t = threading.Thread(target=poll_loop, daemon=True)
        t.start()
        return

    handler = ScriptChangeHandler(scripts_dir)
    observer = Observer()
    observer.schedule(handler, scripts_dir, recursive=True)
    observer.daemon = True
    observer.start()
    print('  \033[32m✓\033[0m File watcher active (watchdog + validation)')


# ═══════════════════════════════════════════════════════════
#  JS Validator
# ═══════════════════════════════════════════════════════════

def validate_js(file_path):
    errors = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except (OSError, IOError) as e:
        return False, [f'  Cannot read file: {e}']

    open_braces = 0
    open_brackets = 0
    open_parens = 0
    in_string = None
    in_block_comment = False

    for line_num, line in enumerate(content.split('\n'), 1):
        i = 0
        while i < len(line):
            c = line[i]
            prev = line[i - 1] if i > 0 else ''

            if in_block_comment:
                if c == '/' and prev == '*':
                    in_block_comment = False
                i += 1
                continue

            if in_string:
                if c == in_string and prev != '\\':
                    in_string = None
                i += 1
                continue

            if c == '/' and i + 1 < len(line) and line[i + 1] == '*':
                in_block_comment = True
                i += 2
                continue

            if c == '/' and i + 1 < len(line) and line[i + 1] == '/':
                break

            if c in ('"', "'", '`'):
                in_string = c
                i += 1
                continue

            if c == '{': open_braces += 1
            elif c == '}': open_braces -= 1
            elif c == '[': open_brackets += 1
            elif c == ']': open_brackets -= 1
            elif c == '(': open_parens += 1
            elif c == ')': open_parens -= 1

            for name, val in [('braces', open_braces), ('brackets', open_brackets), ('parens', open_parens)]:
                if val < 0:
                    errors.append(f'  Line {line_num}: unexpected closing {name}')
                    if name == 'braces': open_braces = 0
                    elif name == 'brackets': open_brackets = 0
                    else: open_parens = 0

            i += 1

    if open_braces != 0: errors.append(f'  Unmatched braces: {open_braces} unclosed')
    if open_brackets != 0: errors.append(f'  Unmatched brackets: {open_brackets} unclosed')
    if open_parens != 0: errors.append(f'  Unmatched parens: {open_parens} unclosed')
    if in_block_comment: errors.append(f'  Unterminated block comment')

    return len(errors) == 0, errors


def validate_bundle(scripts_dir, bundle_name):
    bundle_dir = resolve_bundle_dir(scripts_dir, bundle_name)
    results = []
    all_ok = True

    # Special dirs (_libs, _base, languages) don't require manifest.json
    if bundle_name.startswith('_') or bundle_name in SPECIAL_DIRS:
        for f in sorted(os.listdir(bundle_dir)):
            if f.endswith('.js'):
                ok, errors = validate_js(os.path.join(bundle_dir, f))
                results.append((f, ok, errors))
                if not ok: all_ok = False
        if not results:
            results.append(('(empty)', True, []))
        return all_ok, results

    manifest_path = os.path.join(bundle_dir, 'manifest.json')
    if not os.path.isfile(manifest_path):
        return False, [('manifest.json', False, ['  Missing'])]

    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        missing = [k for k in ('name', 'version', 'entry') if k not in manifest]
        if missing:
            results.append(('manifest.json', False, [f'  Missing fields: {", ".join(missing)}']))
            all_ok = False
        else:
            results.append(('manifest.json', True, []))
    except json.JSONDecodeError as e:
        results.append(('manifest.json', False, [f'  Invalid JSON: {e}']))
        all_ok = False

    for f in sorted(os.listdir(bundle_dir)):
        if f.endswith('.js'):
            ok, errors = validate_js(os.path.join(bundle_dir, f))
            results.append((f, ok, errors))
            if not ok: all_ok = False

    return all_ok, results


def cmd_validate(scripts_dir, bundle_filter=None):
    bundles = list_all_bundles(scripts_dir)
    if bundle_filter:
        bundles = [b for b in bundles if b == bundle_filter]
        if not bundles:
            print(f'  Bundle not found: {bundle_filter}')
            return False

    print('')
    all_ok = True
    for bundle in bundles:
        ok, results = validate_bundle(scripts_dir, bundle)
        s = '\033[32m✓\033[0m' if ok else '\033[31m✗\033[0m'
        print(f'  {s} {bundle}/')
        for fn, fok, errs in results:
            fs = '\033[32m✓\033[0m' if fok else '\033[31m✗\033[0m'
            print(f'    {fs} {fn}')
            for e in errs: print(f'      {e}')
        if not ok: all_ok = False

    print('')
    if all_ok:
        print(f'  \033[32mAll {len(bundles)} bundle(s) valid ✓\033[0m')
    else:
        print(f'  \033[31mValidation FAILED ✗\033[0m')
    print('')
    return all_ok


# ═══════════════════════════════════════════════════════════
#  Deploy
# ═══════════════════════════════════════════════════════════

def cmd_deploy(scripts_dir, bundle_filter=None):
    bundles = list_all_bundles(scripts_dir)
    if bundle_filter:
        bundles = [b for b in bundles if b == bundle_filter]
        if not bundles:
            print(f'  Bundle not found: {bundle_filter}')
            return

    # Validate first
    for b in bundles:
        ok, _ = validate_bundle(scripts_dir, b)
        if not ok:
            print(f'  \033[31m✗\033[0m {b}/ failed validation. Run: python server.py validate')
            return

    version_src = os.path.join(scripts_dir, 'version.json')
    deployed_targets = []

    # ─── Android: copy to assets ───────────────────────
    android_assets = os.path.abspath(ASSETS_DIR)
    has_android = False
    try:
        result = subprocess.run(['adb', 'devices'], capture_output=True, text=True, timeout=3)
        has_android = any(line.strip().endswith('device') for line in result.stdout.strip().split('\n')[1:])
    except Exception:
        pass

    os.makedirs(android_assets, exist_ok=True)
    if os.path.isfile(version_src):
        shutil.copy2(version_src, os.path.join(android_assets, 'version.json'))
    for b in bundles:
        src = resolve_bundle_dir(scripts_dir, b)
        dst = os.path.join(android_assets, b)
        if os.path.exists(dst): shutil.rmtree(dst)
        shutil.copytree(src, dst)
    deployed_targets.append(f'Android assets ({len(bundles)} bundles)')

    # ─── iOS: copy to DerivedData app bundle (if exists) ──
    ios_app_scripts = None
    derived_data = os.path.expanduser('~/Library/Developer/Xcode/DerivedData')
    if os.path.isdir(derived_data):
        for d in os.listdir(derived_data):
            if d.startswith('iosApp-'):
                candidate = os.path.join(derived_data, d, 'Build/Products/Debug-iphonesimulator/iosApp.app/scripts')
                app_path = os.path.join(derived_data, d, 'Build/Products/Debug-iphonesimulator/iosApp.app')
                if os.path.isdir(app_path):
                    ios_app_scripts = candidate
                    break

    if ios_app_scripts:
        if os.path.exists(ios_app_scripts):
            shutil.rmtree(ios_app_scripts)
        os.makedirs(ios_app_scripts, exist_ok=True)
        if os.path.isfile(version_src):
            shutil.copy2(version_src, os.path.join(ios_app_scripts, 'version.json'))
        # Copy special dirs
        for dir_name in ['_base', '_libs', 'languages']:
            src_dir = os.path.join(scripts_dir, dir_name)
            if os.path.isdir(src_dir):
                shutil.copytree(src_dir, os.path.join(ios_app_scripts, dir_name))
        # Copy screen bundles (flattened)
        for b in bundles:
            if b.startswith('_') or b == 'languages':
                continue
            src = resolve_bundle_dir(scripts_dir, b)
            shutil.copytree(src, os.path.join(ios_app_scripts, b))
        deployed_targets.append('iOS app bundle')

    # ─── Desktop: scripts are read from devserver directly in dev mode ──
    deployed_targets.append('Desktop (reads from devserver)')

    print('')
    for b in bundles:
        print(f'  \033[32m✓\033[0m {b}/')
    print(f'\n  Deployed to: {", ".join(deployed_targets)}')

    # Auto-reload connected devices
    alive = get_connected_devices()
    if alive:
        bump_version()
        print(f'  \033[33m↻\033[0m Pushed reload to {len(alive)} device(s)')
    print('')


# ═══════════════════════════════════════════════════════════
#  HTTP Server
# ═══════════════════════════════════════════════════════════

def build_version_response(scripts_dir):
    version_file = os.path.join(scripts_dir, 'version.json')
    if os.path.isfile(version_file):
        with open(version_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = {'schemaVersion': 1, 'bundles': {}}

    # Scan all bundles (special dirs + screens)
    for b in list_all_bundles(scripts_dir):
        if b in data.get('bundles', {}):
            continue  # already in version.json
        bd = resolve_bundle_dir(scripts_dir, b)
        if not os.path.isdir(bd):
            continue
        mp = os.path.join(bd, 'manifest.json')
        if os.path.isfile(mp):
            with open(mp, 'r') as mf:
                m = json.load(mf)
            data.setdefault('bundles', {})[b] = {
                'version': m.get('version', '1.0.0'),
                'files': sorted(os.listdir(bd))
            }
        elif b.startswith('_') or b in SPECIAL_DIRS:
            # Special dirs (_libs, _base, languages) don't need manifest
            data_files = sorted(f for f in os.listdir(bd) if f.endswith('.js') or f.endswith('.json'))
            if data_files:
                data.setdefault('bundles', {})[b] = {
                    'version': '1.0.0',
                    'files': data_files
                }

    # Inject per-bundle lastModified from watcher
    for b_name in list(data.get('bundles', {}).keys()):
        bv = get_bundle_version(b_name)
        if bv:
            data['bundles'][b_name]['lastModified'] = bv
    data['globalVersion'] = get_version()
    return data


class DevHandler(http.server.BaseHTTPRequestHandler):
    scripts_dir = SCRIPT_DIR

    def do_GET(self):
        client_ip = self.client_address[0]
        user_agent = self.headers.get('User-Agent', '')

        if self.path == '/version':
            track_device(client_ip, user_agent)
            self._json(build_version_response(self.scripts_dir))
            return

        if self.path.startswith('/scripts/'):
            rel = self.path[len('/scripts/'):]
            parts = rel.split('/')
            if len(parts) >= 2:
                bundle_name = parts[0]
                file_name = '/'.join(parts[1:])
                track_script_fetch(client_ip, bundle_name)
                # Resolve through screens/ or root
                fp = os.path.join(resolve_bundle_dir(self.scripts_dir, bundle_name), file_name)
            else:
                fp = os.path.join(self.scripts_dir, rel)

            if os.path.isfile(fp):
                with open(fp, 'r', encoding='utf-8') as f:
                    ct = 'application/json' if fp.endswith('.json') else 'application/javascript'
                    self._text(f.read(), ct)
            else:
                self._err(404)
            return

        if self.path == '/status':
            alive = get_connected_devices()
            all_devs = get_all_devices()
            self._json({
                'server': 'OnTheFly Dev Server',
                'version': get_version(),
                'devices': {
                    'connected': len(alive),
                    'total': len(all_devs),
                    'list': [{
                        'ip': ip,
                        'platform': dev.platform,
                        'status': dev.status if dev.is_alive() else 'disconnected',
                        'reloads': dev.reload_count,
                        'lastSeen': int(time.time() - dev.last_seen),
                    } for ip, dev in all_devs]
                }
            })
            return

        if self.path == '/':
            bs = list_all_bundles(self.scripts_dir)
            alive = get_connected_devices()
            self._json({
                'server': 'OnTheFly Dev Server',
                'bundles': bs,
                'version': get_version(),
                'connectedDevices': len(alive)
            })
            return

        self._err(404)

    def _json(self, data):
        b = json.dumps(data, indent=2).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b)

    def _text(self, text, ct='text/plain'):
        b = text.encode()
        self.send_response(200)
        self.send_header('Content-Type', ct)
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b)

    def _err(self, code):
        self.send_response(code)
        self.end_headers()

    def log_message(self, format, *args):
        p = args[0] if args else ''
        if '/version' in str(p): return
        if '/status' in str(p): return
        req = str(p)
        filename = req.rsplit('/', 1)[-1].split(' ')[0] if '/' in req else ''
        if filename:
            super().log_message(format + " file:  %s", *args, filename)
        else:
            super().log_message(format, *args)


# ═══════════════════════════════════════════════════════════
#  Interactive Terminal
# ═══════════════════════════════════════════════════════════

def _find_ios_simulator():
    """Find currently booted iOS simulator. Returns (udid, name) or (None, None)."""
    try:
        import json as _json
        result = subprocess.run(['xcrun', 'simctl', 'list', 'devices', 'booted', '-j'],
                                 capture_output=True, text=True)
        data = _json.loads(result.stdout)
        for runtime, devs in data.get('devices', {}).items():
            for d in devs:
                if d.get('state') == 'Booted':
                    return d['udid'], d['name']
    except Exception:
        pass
    return None, None


def _boot_ios_simulator():
    """Boot the first available iPhone simulator. Returns (udid, name) or (None, None)."""
    try:
        import json as _json
        result = subprocess.run(['xcrun', 'simctl', 'list', 'devices', 'available', '-j'],
                                 capture_output=True, text=True, timeout=5)
        data = _json.loads(result.stdout)
        for runtime, devs in data.get('devices', {}).items():
            if 'iOS' not in runtime:
                continue
            for d in devs:
                if 'iPhone' in d.get('name', ''):
                    name = d['name']
                    udid = d['udid']
                    subprocess.run(['xcrun', 'simctl', 'boot', udid], capture_output=True, timeout=15)
                    subprocess.Popen(['open', '-a', 'Simulator'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    return udid, name
    except Exception:
        pass
    return None, None


def _xcode_build_ios(sim_id, sim_name):
    """Build iOS app via xcodebuild. Returns (return_code, app_path)."""
    dest = f'platform=iOS Simulator,id={sim_id}' if sim_id != 'booted' else f'platform=iOS Simulator,name={sim_name}'
    build_dir = os.path.abspath('../build/ios_build')
    ret = subprocess.Popen(['xcodebuild', '-project', 'iosApp/iosApp.xcodeproj',
                             '-scheme', 'iosApp', '-configuration', 'Debug',
                             '-destination', dest, '-sdk', 'iphonesimulator',
                             f'SYMROOT={build_dir}'], cwd='..').wait()
    app_path = f'{build_dir}/Debug-iphonesimulator/iosApp.app'
    if ret == 0 and os.path.isdir(app_path):
        return ret, app_path
    return ret, None


def _install_launch_ios(sim_id, app_path):
    """Install and launch app on iOS simulator."""
    subprocess.run(['xcrun', 'simctl', 'terminate', sim_id, APP_ID], capture_output=True)
    subprocess.run(['xcrun', 'simctl', 'install', sim_id, app_path], timeout=30)
    subprocess.run(['xcrun', 'simctl', 'launch', sim_id, APP_ID], timeout=10)


def _cmd_create_bundle(scripts_dir, name):
    """Scaffold a new script bundle."""
    bundle_dir = os.path.join(scripts_dir, 'screens', name)
    if os.path.exists(bundle_dir):
        print(f'  \033[31m✗\033[0m Bundle already exists: {name}/')
        return
    os.makedirs(bundle_dir)
    manifest = {"name": name.replace('-', ' ').title(), "version": "1.0.0", "entry": "main.js"}
    with open(os.path.join(bundle_dir, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
    with open(os.path.join(bundle_dir, 'main.js'), 'w') as f:
        f.write(f'// {name} screen\n\nfunction onCreateView() {{\n    render();\n}}\n\n'
                f'function render() {{\n    var theme = StockTheme.get();\n\n'
                f'    OnTheFly.setUI(\n        Column({{ background: theme.primary, fillMaxWidth: true }}, [\n'
                f'            Text({{ text: "{name}", fontSize: 24, fontWeight: "bold", color: theme.textPrimary }})\n'
                f'        ])\n    );\n}}\n\nrender();\n')
    with open(os.path.join(bundle_dir, 'theme.js'), 'w') as f:
        f.write(f'// Theme for {name}\n')
    print(f'  \033[32m✓\033[0m Created bundle: screens/{name}/')
    print(f'    manifest.json, main.js, theme.js')


def _cmd_bundle_size(scripts_dir):
    """Show bundle size breakdown."""
    bundles = list_all_bundles(scripts_dir)
    total = 0
    print('')
    print(f'  \033[1mBundle Sizes\033[0m')
    print('  ───────────────────────────────────────')
    rows = []
    for b in bundles:
        bd = resolve_bundle_dir(scripts_dir, b)
        size = 0
        if os.path.isdir(bd):
            for f in os.listdir(bd):
                fp = os.path.join(bd, f)
                if os.path.isfile(fp):
                    size += os.path.getsize(fp)
        total += size
        rows.append((b, size))
    rows.sort(key=lambda x: -x[1])
    for b, size in rows:
        bar = '█' * max(1, int(size / max(r[1] for r in rows) * 20)) if rows else ''
        if size > 10240:
            sz = f'{size // 1024}KB'
        else:
            sz = f'{size}B'
        print(f'  {sz:>8}  {bar:<20}  {b}')
    print('  ───────────────────────────────────────')
    print(f'  Total: {total // 1024}KB ({len(bundles)} bundles)')
    print('')


def interactive_loop(scripts_dir):
    """Run in background thread. Reads commands from stdin."""
    HELP = """
  \033[1mCommands:\033[0m
    ──────── Run ──────────────────────────
    ra, run android        Launch Android Emulator build
    ri, run ios            Launch iOS Simulator build
    rd, run desktop        Launch Desktop app

    ──────── Build & Kill ─────────────────
    ba, build android      Clean rebuild + install + launch Android
    bi, build ios          Clean rebuild + install + launch iOS
    bd, build desktop      Clean rebuild + launch Desktop
    ka, kill               Kill all emulators and processes

    ─────── Connection ────────────────────
    s, status              Server status + connected devices
    c, clients             List connected devices

    ─────── Dev Mode ──────────────────────
    v, validate [bundle]   Validate JS syntax
    d, deploy [bundle]     Deploy scripts → Android assets + iOS bundle
    l, list                List bundles
    r, reload              Bump version (force app reload)

    ──────── Release ──────────────────────
    br, build-release      Build release zip (validate + sign + zip)
    rs, release-server     Start/stop release server (port 8082)

    ──────── Bundle Tools ─────────────────
    new [name]             Create new bundle scaffold
    size                   Show bundle size breakdown
    uninstall              Uninstall app from all devices

    ──────── Other ────────────────────────
    clear                  Clear screen
    h, help                Show this help
    q, quit                Stop server
"""
    print(HELP)
    print('  Type a command or just edit JS files.\n')

    while True:
        try:
            line = input('  \033[36monthefly>\033[0m ').strip()
        except (EOFError, KeyboardInterrupt):
            print('\nServer stopped.')
            os._exit(0)

        if not line:
            continue

        parts = line.split()
        cmd = parts[0].lower()
        arg = parts[1] if len(parts) > 1 else None

        if cmd in ('q', 'quit', 'exit'):
            print('  Server stopped.')
            os._exit(0)

        elif cmd in ('h', 'help', '?'):
            print(HELP)

        elif cmd in ('s', 'status'):
            cmd_status(scripts_dir)

        elif cmd in ('c', 'clients', 'devices'):
            cmd_clients()

        elif cmd in ('ra', 'run') and (arg == 'android' or cmd == 'ra'):
            print('  🚀 Launching on Android Emulator...')
            ret = subprocess.Popen(['./gradlew', ':composeApp:installDebug', '--no-configuration-cache'], cwd='..').wait()
            if ret == 0:
                subprocess.Popen(['adb', 'shell', 'am', 'force-stop', APP_ID], stderr=subprocess.DEVNULL).wait()
                subprocess.Popen(['adb', 'shell', 'monkey', '-p', APP_ID, '-c', 'android.intent.category.LAUNCHER', '1'],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print('  \033[32m✓\033[0m Android app launched!')
            else:
                print('  \033[31m✗\033[0m Build failed!')

        elif cmd in ('ba', 'build') and (arg == 'android' or cmd == 'ba'):
            print('  🔨 Clean rebuild + install Android...')
            ret = subprocess.Popen(['./gradlew', ':onthefly-engine:clean', ':composeApp:clean',
                                     ':composeApp:assembleDebug', '--no-configuration-cache'], cwd='..').wait()
            if ret == 0:
                apk = os.path.abspath('../composeApp/build/outputs/apk/debug/composeApp-debug.apk')
                if not os.path.isfile(apk):
                    print(f'  \033[31m✗\033[0m APK not found: {apk}')
                else:
                    print('  📦 Installing APK...')
                    subprocess.Popen(['adb', 'install', '-r', apk]).wait()
                    print('  🚀 Launching app...')
                    subprocess.Popen(['adb', 'shell', 'am', 'force-stop', APP_ID]).wait()
                    subprocess.Popen(['adb', 'shell', 'monkey', '-p', APP_ID, '-c', 'android.intent.category.LAUNCHER', '1'],
                                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    print('  \033[32m✓\033[0m Build + install + launch complete!')
            else:
                print('  \033[31m✗\033[0m Build failed!')

        elif cmd in ('bi', 'build') and (arg == 'ios' or cmd == 'bi'):
            print('  🍎 Clean rebuild + install + launch iOS...')
            sim_id, sim_name = _find_ios_simulator()
            if not sim_id:
                sim_id, sim_name = _boot_ios_simulator()
            if not sim_id:
                print('  \033[31m✗\033[0m No iOS Simulator available')
                continue
            print(f'  Simulator: {sim_name}')
            ret = subprocess.Popen(['./gradlew', ':onthefly-engine:clean',
                                     ':onthefly-engine:linkDebugFrameworkIosSimulatorArm64',
                                     '--no-configuration-cache'], cwd='..').wait()
            if ret != 0:
                print('  \033[31m✗\033[0m Framework build failed!')
                continue
            ret, app_path = _xcode_build_ios(sim_id, sim_name)
            if ret == 0 and app_path:
                _install_launch_ios(sim_id, app_path)
                print('  \033[32m✓\033[0m Build + install + launch iOS complete!')
            else:
                print('  \033[31m✗\033[0m iOS build failed!')

        elif cmd in ('bd', 'build') and (arg == 'desktop' or cmd == 'bd'):
            print('  💻 Clean rebuild + launch Desktop...')
            ret = subprocess.Popen(['./gradlew', ':onthefly-engine:clean', ':composeApp:clean',
                                     ':composeApp:run', '--no-configuration-cache'], cwd='..').wait()
            if ret == 0:
                print('  \033[32m✓\033[0m Desktop build + launch complete!')
            else:
                print('  \033[31m✗\033[0m Desktop build failed!')

        elif cmd in ('ri', 'run') and (arg == 'ios' or cmd == 'ri'):
            print('  🍎 Launching on iOS Simulator...')
            sim_id, sim_name = _find_ios_simulator()
            if not sim_id:
                sim_id, sim_name = _boot_ios_simulator()
            if not sim_id:
                print('  \033[31m✗\033[0m No iOS Simulator available')
                continue
            print(f'  Simulator: {sim_name}')
            ret, app_path = _xcode_build_ios(sim_id, sim_name)
            if ret == 0 and app_path:
                _install_launch_ios(sim_id, app_path)
                print('  \033[32m✓\033[0m iOS app launched!')
            else:
                print('  \033[31m✗\033[0m iOS build failed!')

        elif cmd in ('rd', 'run') and (arg == 'desktop' or cmd == 'rd'):
            print('  💻 Launching Desktop App...')
            subprocess.Popen(['./gradlew', ':composeApp:run', '--no-configuration-cache'], cwd='..')

        elif cmd in ('ka', 'kill'):
            print('  🛑 Stopping emulators and processes...')
            subprocess.run(['adb', 'shell', 'am', 'force-stop', APP_ID],
                            capture_output=True, timeout=5)
            subprocess.run(['xcrun', 'simctl', 'terminate', 'booted', APP_ID],
                            capture_output=True, timeout=5)
            subprocess.run(['xcrun', 'simctl', 'shutdown', 'all'],
                            capture_output=True, timeout=10)
            for proc_name in ['composeApp', 'qemu-system']:
                subprocess.run(['pkill', '-f', proc_name], capture_output=True)
            print('  \033[32m✓\033[0m Done!')

        elif cmd in ('uninstall',):
            print('  🗑️  Uninstalling app from all devices...')
            subprocess.run(['adb', 'uninstall', APP_ID], capture_output=True, timeout=10)
            sim_id, _ = _find_ios_simulator()
            if sim_id:
                subprocess.run(['xcrun', 'simctl', 'uninstall', sim_id, APP_ID], capture_output=True, timeout=10)
            print('  \033[32m✓\033[0m Done!')

        elif cmd in ('new', 'create') and arg:
            _cmd_create_bundle(scripts_dir, arg)

        elif cmd in ('size', 'bundle-size'):
            _cmd_bundle_size(scripts_dir)

        elif cmd in ('br', 'build-release'):
            cmd_build_release(scripts_dir)

        elif cmd in ('rs', 'release-server'):
            start_release_server()
            print(f'  \033[90mRelease server running. Use Ctrl+C to stop all.\033[0m')

        elif cmd in ('v', 'validate'):
            cmd_validate(scripts_dir, arg)

        elif cmd in ('d', 'deploy'):
            cmd_deploy(scripts_dir, arg)

        elif cmd in ('l', 'list', 'ls'):
            bundles = list_all_bundles(scripts_dir)
            total_errors = 0
            print('')
            for b in bundles:
                bd = resolve_bundle_dir(scripts_dir, b)
                files = os.listdir(bd) if os.path.isdir(bd) else []
                ok, results = validate_bundle(scripts_dir, b)
                prefix = '  _/' if b.startswith('_') else '  screens/'
                if ok:
                    print(f'  \033[32m✓\033[0m {prefix}{b}/ ({len(files)} files)')
                else:
                    err_files = [fn for fn, fok, errs in results if not fok]
                    total_errors += len(err_files)
                    print(f'  \033[31m✗\033[0m {prefix}{b}/ ({len(files)} files) — {len(err_files)} error(s)')
                    for fn, fok, errs in results:
                        if not fok:
                            print(f'      \033[31m{fn}\033[0m')
                            for e in errs:
                                print(f'        {e}')
            print('')
            if total_errors > 0:
                print(f'  \033[31m{total_errors} file(s) with errors\033[0m')
            else:
                print(f'  \033[32mAll {len(bundles)} bundle(s) valid ✓\033[0m')
            print('')

        elif cmd in ('r', 'reload'):
            bump_version()
            alive = len(get_connected_devices())
            print(f'  \033[33m↻\033[0m Forced reload → version {get_version()} ({alive} device(s) connected)')

        elif cmd in ('clear', 'cls'):
            os.system('clear' if os.name != 'nt' else 'cls')
            print(HELP)

        else:
            print(f'  Unknown command: {cmd}. Type "help".')


def _detect_external_devices():
    """Detect Android emulators and iOS simulators outside dev server connections."""
    devices = []

    # Check Android emulator via adb
    try:
        result = subprocess.run(['adb', 'devices'], capture_output=True, text=True, timeout=3)
        for line in result.stdout.strip().split('\n')[1:]:
            if line.strip().endswith('device'):
                serial = line.split()[0]
                devices.append(('Android Emulator', serial, '● running'))
    except Exception:
        pass

    # Check iOS Simulator
    sim_id, sim_name = _find_ios_simulator()
    if sim_id:
        # Check if our app is installed
        try:
            result = subprocess.run(['xcrun', 'simctl', 'listapps', sim_id],
                                     capture_output=True, text=True, timeout=5)
            has_app = 'com.onthefly.app' in result.stdout
        except Exception:
            has_app = False
        status = '● app installed' if has_app else '○ no app'
        devices.append((f'iOS Simulator ({sim_name})', sim_id[:12], status))

    return devices


def cmd_status(scripts_dir):
    """Show server status overview."""
    bundles = list_all_bundles(scripts_dir)
    alive = get_connected_devices()
    all_devs = get_all_devices()

    print('')
    print(f'  \033[1mOnTheFly Dev Server Status\033[0m')
    print('  ───────────────────────────────────────')
    print(f'  Version:     {get_version()}')
    print(f'  Bundles:     {len(bundles)} ({", ".join(bundles)})')
    print(f'  Watcher:     {"watchdog" if HAS_WATCHDOG else "polling fallback"}')
    print(f'  Validation:  {"✓ OK" if g_last_change_valid else "✗ ERRORS (not pushing)"}')
    print('  ───────────────────────────────────────')

    # Dev server connected devices
    print(f'  \033[1mDev Server Devices:\033[0m {len(alive)} connected')
    if all_devs:
        for ip, dev in all_devs:
            icon = dev.status_icon()
            status = dev.status_text()
            reloads = f'  reloads: {dev.reload_count}' if dev.reload_count > 0 else ''
            print(f'    {icon} {dev.platform:<16} {ip:<20} {status}{reloads}')
    else:
        print('    \033[90m(no devices polling dev server)\033[0m')

    # External devices (emulators / simulators)
    ext_devices = _detect_external_devices()
    if ext_devices:
        print(f'  \033[1mEmulators/Simulators:\033[0m {len(ext_devices)} detected')
        for name, serial, status in ext_devices:
            print(f'    {status}  {name:<30} {serial}')

    print('')


def cmd_clients():
    """List connected devices."""
    all_devs = get_all_devices()
    alive = [(ip, dev) for ip, dev in all_devs if dev.is_alive()]

    print('')
    print(f'  \033[1mConnected Devices:\033[0m {len(alive)}/{len(all_devs)}')
    print('  ───────────────────────────────────────')

    if not all_devs:
        print('    \033[90m(no devices seen yet)\033[0m')
        print('    \033[90mRun your app — it polls /version every 2s\033[0m')
    else:
        for ip, dev in all_devs:
            icon = dev.status_icon()
            status = dev.status_text()
            age = int(time.time() - dev.first_seen)
            age_str = f'{age // 60}m{age % 60}s' if age >= 60 else f'{age}s'
            fetched = ', '.join(sorted(dev.bundles_fetched)) if dev.bundles_fetched else '-'
            print(f'    {icon} \033[1m{dev.platform}\033[0m')
            print(f'      IP:       {ip}')
            print(f'      Status:   {status}')
            print(f'      Reloads:  {dev.reload_count}')
            print(f'      Session:  {age_str}')
            print(f'      Bundles:  {fetched}')
            print(f'      Agent:    {dev.user_agent[:60] or "unknown"}')
            print()

    print('')


# ═══════════════════════════════════════════════════════════
#  Build Release (zip scripts for production)
# ═══════════════════════════════════════════════════════════

RELEASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'releases')
RELEASE_PORT = 8082


def sign_bundle(bundle_dir):
    """Compute SHA-256 hashes for all JS/JSON files and add signature to manifest."""
    import hashlib
    manifest_path = os.path.join(bundle_dir, 'manifest.json')
    if not os.path.isfile(manifest_path):
        return False

    with open(manifest_path, 'r') as f:
        manifest = json.load(f)

    file_hashes = {}
    for fname in sorted(os.listdir(bundle_dir)):
        if fname == 'manifest.json':
            continue
        if fname.endswith(('.js', '.json')):
            fp = os.path.join(bundle_dir, fname)
            if os.path.isfile(fp):
                with open(fp, 'r', encoding='utf-8') as f:
                    content = f.read()
                file_hashes[fname] = hashlib.sha256(content.encode('utf-8')).hexdigest()

    if not file_hashes:
        return False

    all_hashes = ''.join(file_hashes.values())
    bundle_hash = hashlib.sha256(all_hashes.encode('utf-8')).hexdigest()

    manifest['signature'] = {
        'algorithm': 'SHA-256',
        'files': file_hashes,
        'bundleHash': bundle_hash
    }

    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    return True


def cmd_build_release(scripts_dir):
    """Validate all bundles, sign, zip scripts, create release package."""
    import zipfile

    # Step 1: Validate
    bundles = list_all_bundles(scripts_dir)
    print('')
    print('  \033[1mBuilding Release\033[0m')
    print('  ───────────────────────────────────────')
    print(f'  Validating {len(bundles)} bundle(s)...')

    for b in bundles:
        ok, results = validate_bundle(scripts_dir, b)
        if not ok:
            print(f'  \033[31m✗\033[0m {b}/ failed validation')
            for fn, fok, errs in results:
                if not fok:
                    for e in errs:
                        print(f'    {e}')
            print(f'\n  \033[31mBuild FAILED — fix errors first\033[0m\n')
            return False

    print(f'  \033[32m✓\033[0m All {len(bundles)} bundle(s) valid')

    # Step 2: Sign bundles
    signed = 0
    screens_dir = os.path.join(scripts_dir, 'screens')
    if os.path.isdir(screens_dir):
        for bundle_name in sorted(os.listdir(screens_dir)):
            bundle_path = os.path.join(screens_dir, bundle_name)
            if os.path.isdir(bundle_path) and sign_bundle(bundle_path):
                signed += 1
    print(f'  \033[32m✓\033[0m Signed {signed} bundle(s)')

    # Step 3: Auto-update version.json (bump globalVersion + scan bundles)
    version_file = os.path.join(scripts_dir, 'version.json')
    if os.path.isfile(version_file):
        with open(version_file, 'r') as f:
            version_data = json.load(f)
        old_version = version_data.get('globalVersion', '0.0.0')
    else:
        old_version = '0.0.0'
        version_data = {'schemaVersion': 1, 'globalVersion': old_version, 'bundles': {}}

    # Bump: parse "YYYY.MM.DD.N" or semver, increment last part
    parts = old_version.split('.')
    today = time.strftime('%Y.%m.%d')
    today_parts = today.split('.')
    if parts[:3] == today_parts:
        # Same day — increment build number
        build_num = int(parts[3]) + 1 if len(parts) > 3 else 1
        global_version = f'{today}.{build_num}'
    else:
        global_version = f'{today}.1'

    # Scan all screen bundles for files + versions
    bundle_info = {}
    if os.path.isdir(screens_dir):
        for bundle_name in sorted(os.listdir(screens_dir)):
            bundle_path = os.path.join(screens_dir, bundle_name)
            if not os.path.isdir(bundle_path):
                continue
            manifest_path = os.path.join(bundle_path, 'manifest.json')
            bversion = '1.0.0'
            if os.path.isfile(manifest_path):
                try:
                    with open(manifest_path, 'r') as f:
                        m = json.load(f)
                    bversion = m.get('version', '1.0.0')
                except Exception:
                    pass
            bfiles = sorted([f for f in os.listdir(bundle_path) if os.path.isfile(os.path.join(bundle_path, f))])
            bundle_info[bundle_name] = {'version': bversion, 'files': bfiles}

    version_data['globalVersion'] = global_version
    version_data['bundles'] = bundle_info

    with open(version_file, 'w') as f:
        json.dump(version_data, f, indent=2)
        f.write('\n')
    print(f'  \033[32m✓\033[0m Updated version.json: {old_version} → {global_version}')

    # Step 4: Create release directory
    os.makedirs(RELEASE_DIR, exist_ok=True)

    # Step 5: Create zip
    zip_path = os.path.join(RELEASE_DIR, 'scripts.zip')
    entry_count = 0

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # version.json
        if os.path.isfile(version_file):
            zf.write(version_file, 'version.json')
            entry_count += 1

        # Special dirs: _base, _libs, languages
        for dir_name in ['_base', '_libs', 'languages']:
            src_dir = os.path.join(scripts_dir, dir_name)
            if os.path.isdir(src_dir):
                for root, dirs, files in os.walk(src_dir):
                    for f in files:
                        fp = os.path.join(root, f)
                        arcname = os.path.join(dir_name, os.path.relpath(fp, src_dir))
                        zf.write(fp, arcname)
                        entry_count += 1

        # Screen bundles (flattened)
        screens_dir = os.path.join(scripts_dir, 'screens')
        if os.path.isdir(screens_dir):
            for bundle_name in sorted(os.listdir(screens_dir)):
                bundle_path = os.path.join(screens_dir, bundle_name)
                if not os.path.isdir(bundle_path):
                    continue
                for root, dirs, files in os.walk(bundle_path):
                    for f in files:
                        fp = os.path.join(root, f)
                        arcname = os.path.join(bundle_name, os.path.relpath(fp, bundle_path))
                        zf.write(fp, arcname)
                        entry_count += 1

    zip_size = os.path.getsize(zip_path)

    # Step 6: Write release version.json
    release_version_path = os.path.join(RELEASE_DIR, 'version.json')
    release_version = {
        'version': global_version,
        'zipFile': 'scripts.zip',
        'zipSize': zip_size,
        'entries': entry_count,
        'buildTime': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    with open(release_version_path, 'w') as f:
        json.dump(release_version, f, indent=2)

    print(f'  \033[32m✓\033[0m Created scripts.zip ({zip_size // 1024}KB, {entry_count} entries)')
    print(f'  \033[32m✓\033[0m Version: {global_version}')
    print(f'  \033[32m✓\033[0m Output:  {RELEASE_DIR}/')
    print('  ───────────────────────────────────────')
    print(f'  \033[32mRelease build complete!\033[0m')
    print(f'  Start release server: \033[1mpython server.py release\033[0m')
    print('')
    return True


# ═══════════════════════════════════════════════════════════
#  Release Server (simulates production CDN)
# ═══════════════════════════════════════════════════════════

class ReleaseHandler(http.server.BaseHTTPRequestHandler):
    """Serves release artifacts for production update simulation."""

    def do_GET(self):
        if self.path == '/api/version':
            version_path = os.path.join(RELEASE_DIR, 'version.json')
            if os.path.isfile(version_path):
                with open(version_path, 'r') as f:
                    data = json.load(f)
                self._json(data)
            else:
                self._json({'error': 'No release found. Run: build-release'}, 404)
            return

        if self.path == '/api/download':
            zip_path = os.path.join(RELEASE_DIR, 'scripts.zip')
            if os.path.isfile(zip_path):
                self._file(zip_path)
            else:
                self._err(404)
            return

        if self.path == '/':
            version_path = os.path.join(RELEASE_DIR, 'version.json')
            version_info = {}
            if os.path.isfile(version_path):
                with open(version_path, 'r') as f:
                    version_info = json.load(f)
            self._json({
                'server': 'OnTheFly Release Server',
                'release': version_info,
                'endpoints': {
                    '/api/version': 'GET release version info',
                    '/api/download': 'GET download scripts.zip'
                }
            })
            return

        self._err(404)

    def _json(self, data, code=200):
        b = json.dumps(data, indent=2).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b)

    def _file(self, path):
        with open(path, 'rb') as f:
            content = f.read()
        self.send_response(200)
        self.send_header('Content-Type', 'application/zip')
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Content-Disposition', 'attachment; filename="scripts.zip"')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(content)

    def _err(self, code):
        self.send_response(code)
        self.end_headers()

    def log_message(self, format, *args):
        p = args[0] if args else ''
        print(f'  \033[90m[release] {p}\033[0m')


def start_release_server():
    """Start release server on RELEASE_PORT."""
    os.makedirs(RELEASE_DIR, exist_ok=True)
    server = http.server.HTTPServer(('0.0.0.0', RELEASE_PORT), ReleaseHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    print(f'  \033[32m✓\033[0m Release server on port {RELEASE_PORT}')
    print(f'    Version:  http://localhost:{RELEASE_PORT}/api/version')
    print(f'    Download: http://localhost:{RELEASE_PORT}/api/download')
    print(f'    Emulator: http://10.0.2.2:{RELEASE_PORT}')


# ═══════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='OnTheFly Dev Server')
    parser.add_argument('command', nargs='?', default='serve',
                        choices=['serve', 'validate', 'deploy', 'build-release', 'release'],
                        help='serve (default), validate, deploy, build-release, release')
    parser.add_argument('bundle', nargs='?', default=None)
    parser.add_argument('--port', type=int, default=DEFAULT_PORT)
    parser.add_argument('--dir', type=str, default=SCRIPT_DIR)
    args = parser.parse_args()

    scripts_dir = os.path.abspath(args.dir)
    if not os.path.isdir(scripts_dir):
        print(f'Error: {scripts_dir} not found')
        sys.exit(1)

    if args.command == 'validate':
        ok = cmd_validate(scripts_dir, args.bundle)
        sys.exit(0 if ok else 1)
    elif args.command == 'deploy':
        cmd_deploy(scripts_dir, args.bundle)
        sys.exit(0)
    elif args.command == 'build-release':
        ok = cmd_build_release(scripts_dir)
        sys.exit(0 if ok else 1)
    elif args.command == 'release':
        # Start release server standalone
        print('')
        print('  \033[1mOnTheFly Release Server\033[0m')
        print('  ═══════════════════════════════════════')
        start_release_server()
        print('  ═══════════════════════════════════════')
        print(f'  \033[90mServing releases from {RELEASE_DIR}/\033[0m')
        print(f'  \033[90mPress Ctrl+C to stop\033[0m')
        print('')
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print('\n  Server stopped.')
        sys.exit(0)

    # ─── Serve mode ──────────────────────────────────────
    DevHandler.scripts_dir = scripts_dir
    bump_version()

    bundles = list_all_bundles(scripts_dir)

    print('')
    print('  \033[1mOnTheFly Dev Server\033[0m')
    print('  ═══════════════════════════════════════')
    print(f'  Port:      {args.port}')
    print(f'  Scripts:   {scripts_dir}')
    print(f'  Bundles:   {", ".join(bundles)}')
    print(f'  Emulator:  http://10.0.2.2:{args.port}')
    print(f'  Local:     http://localhost:{args.port}')
    print('  ───────────────────────────────────────')

    # Start file watcher
    start_watcher(scripts_dir)

    # Start device disconnect monitor
    start_device_monitor()

    # Start WebSocket push server
    start_ws_server()

    # Start release server (simulates production CDN for OTA updates)
    start_release_server()

    # Start HTTP server in background
    server = http.server.HTTPServer(('0.0.0.0', args.port), DevHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    print(f'  \033[32m✓\033[0m HTTP server on port {args.port}')
    print('  ───────────────────────────────────────')
    print(f'  \033[90mWaiting for devices to connect...\033[0m')
    print(f'  \033[90mEdit JS files → auto-validate → push to devices\033[0m')
    print('  ═══════════════════════════════════════')

    # Interactive terminal
    interactive_loop(scripts_dir)


if __name__ == '__main__':
    main()
