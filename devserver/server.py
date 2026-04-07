#!/usr/bin/env python3
"""
OnTheFly Dev Server

Usage:
    python server.py                     Start dev server (with file watcher)
    python server.py validate [bundle]   Validate JS syntax
    python server.py deploy [bundle]     Copy scripts → Android assets
"""

import http.server
import json
import os
import sys
import shutil
import argparse
import threading
import time
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    HAS_WATCHDOG = True
except ImportError:
    HAS_WATCHDOG = False

DEFAULT_PORT = 8080
SCRIPT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts')
ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          '..', 'composeApp', 'src', 'androidMain', 'assets', 'scripts')

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
        if 'darwin' in ua_lower:
            return 'iOS'
        if 'ktor' in ua_lower or 'okhttp' in ua_lower:
            # Ktor client on Android emulator comes from 10.0.2.x / 10.0.3.x
            if ip.startswith('10.0.2.') or ip.startswith('10.0.3.'):
                return 'Android (emu)'
            if ip in ('127.0.0.1', '::1', 'localhost'):
                return 'Desktop/iOS'
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
        # Debounce: ignore events within 500ms for same file
        now = time.time()
        if now - self.last_event < 0.5 and event.src_path == self.last_path:
            return
        self.last_event = now
        self.last_path = event.src_path

        # Skip non-script files
        src = event.src_path
        if not any(src.endswith(ext) for ext in ('.js', '.json')):
            return

        rel = os.path.relpath(src, self.scripts_dir)
        parts = rel.split(os.sep)
        bundle = parts[0] if len(parts) > 1 else None
        filename = parts[-1]

        if not bundle or not os.path.isdir(os.path.join(self.scripts_dir, bundle)):
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
    bundle_dir = os.path.join(scripts_dir, bundle_name)
    results = []
    all_ok = True

    # Special dirs (_libs, _base) don't require manifest.json
    if bundle_name.startswith('_'):
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
    bundles = sorted([d for d in os.listdir(scripts_dir)
                      if os.path.isdir(os.path.join(scripts_dir, d))])
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
    assets_dir = os.path.abspath(ASSETS_DIR)
    bundles = sorted([d for d in os.listdir(scripts_dir)
                      if os.path.isdir(os.path.join(scripts_dir, d))])
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

    os.makedirs(assets_dir, exist_ok=True)
    version_src = os.path.join(scripts_dir, 'version.json')
    if os.path.isfile(version_src):
        shutil.copy2(version_src, os.path.join(assets_dir, 'version.json'))

    print('')
    for b in bundles:
        src = os.path.join(scripts_dir, b)
        dst = os.path.join(assets_dir, b)
        if os.path.exists(dst): shutil.rmtree(dst)
        shutil.copytree(src, dst)
        n = len(os.listdir(dst))
        print(f'  \033[32m✓\033[0m {b}/ ({n} files)')

    print(f'\n  Deployed {len(bundles)} bundle(s) → {assets_dir}\n')


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

    # Scan all directories (bundles + _libs + _base)
    for b in os.listdir(scripts_dir):
        bd = os.path.join(scripts_dir, b)
        if not os.path.isdir(bd):
            continue
        if b in data.get('bundles', {}):
            continue  # already in version.json
        # For regular bundles, require manifest.json
        mp = os.path.join(bd, 'manifest.json')
        if os.path.isfile(mp):
            with open(mp, 'r') as mf:
                m = json.load(mf)
            data.setdefault('bundles', {})[b] = {
                'version': m.get('version', '1.0.0'),
                'files': sorted(os.listdir(bd))
            }
        elif b.startswith('_'):
            # Special dirs (_libs, _base) don't need manifest
            js_files = sorted(f for f in os.listdir(bd) if f.endswith('.js'))
            if js_files:
                data.setdefault('bundles', {})[b] = {
                    'version': '1.0.0',
                    'files': js_files
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
                track_script_fetch(client_ip, parts[0])

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
            bs = sorted([d for d in os.listdir(self.scripts_dir)
                         if os.path.isdir(os.path.join(self.scripts_dir, d))])
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
        super().log_message(format, *args)


# ═══════════════════════════════════════════════════════════
#  Interactive Terminal
# ═══════════════════════════════════════════════════════════

def interactive_loop(scripts_dir):
    """Run in background thread. Reads commands from stdin."""
    HELP = """
  \033[1mCommands:\033[0m
    s, status              Server status + connected devices
    c, clients             List connected devices
    v, validate [bundle]   Validate JS syntax
    d, deploy [bundle]     Copy scripts → Android assets
    l, list                List bundles
    r, reload              Bump version (force app reload)
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

        elif cmd in ('v', 'validate'):
            cmd_validate(scripts_dir, arg)

        elif cmd in ('d', 'deploy'):
            cmd_deploy(scripts_dir, arg)

        elif cmd in ('l', 'list', 'ls'):
            bundles = sorted([d for d in os.listdir(scripts_dir)
                              if os.path.isdir(os.path.join(scripts_dir, d))])
            print('')
            for b in bundles:
                files = os.listdir(os.path.join(scripts_dir, b))
                bv = get_bundle_version(b)
                mod = f'  (modified)' if bv else ''
                print(f'  {b}/ ({len(files)} files){mod}')
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


def cmd_status(scripts_dir):
    """Show server status overview."""
    bundles = sorted([d for d in os.listdir(scripts_dir)
                      if os.path.isdir(os.path.join(scripts_dir, d))])
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
    print(f'  \033[1mDevices:\033[0m {len(alive)} connected, {len(all_devs)} total')

    if all_devs:
        for ip, dev in all_devs:
            icon = dev.status_icon()
            status = dev.status_text()
            reloads = f'  reloads: {dev.reload_count}' if dev.reload_count > 0 else ''
            print(f'    {icon} {dev.platform:<16} {ip:<20} {status}{reloads}')
    else:
        print('    \033[90m(no devices seen yet)\033[0m')

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
#  Main
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='OnTheFly Dev Server')
    parser.add_argument('command', nargs='?', default='serve',
                        choices=['serve', 'validate', 'deploy'],
                        help='serve (default), validate, deploy')
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

    # ─── Serve mode ──────────────────────────────────────
    DevHandler.scripts_dir = scripts_dir
    bump_version()

    bundles = sorted([d for d in os.listdir(scripts_dir)
                      if os.path.isdir(os.path.join(scripts_dir, d))])

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
