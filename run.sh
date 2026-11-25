#!/usr/bin/env bash
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OS_NAME="$(uname -s)"

# Ensure display & D-Bus session environment when launched from Desktop/GUI on Linux
if [ "$OS_NAME" = "Linux" ]; then
    if [ -z "${DISPLAY:-}" ]; then
        if [ -e "/tmp/.X11-unix/X0" ]; then
            export DISPLAY=:0
        elif [ -e "/tmp/.X11-unix/X1" ]; then
            export DISPLAY=:1
        fi
    fi
    export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
    if [ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ] && [ -S "$XDG_RUNTIME_DIR/bus" ]; then
        export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
    fi
fi

# Launch inside a visible terminal when double-clicked or invoked without a TTY
if [ ! -t 1 ]; then
    if [ "$OS_NAME" = "Darwin" ] && command -v osascript >/dev/null 2>&1; then
        ESCAPED_DIR="${ROOT_DIR//\"/\\\"}"
        osascript -e "tell application \"Terminal\" to do script \"cd \\\"$ESCAPED_DIR\\\" && ./start.sh\"" -e 'tell application "Terminal" to activate'
        exit 0
    elif command -v gnome-terminal >/dev/null 2>&1; then
        exec gnome-terminal --title="Blue Oceans POS Launcher" -- bash -c '"$1/start.sh"; echo; echo "Process stopped. Press Enter to exit."; read -r' _ "$ROOT_DIR"
    elif command -v x-terminal-emulator >/dev/null 2>&1; then
        exec x-terminal-emulator -e bash -c '"$1/start.sh"; echo; echo "Process stopped. Press Enter to exit."; read -r' _ "$ROOT_DIR"
    elif command -v xterm >/dev/null 2>&1; then
        exec xterm -geometry 120x35 -fa 'Monospace' -fs 10 -title "Blue Oceans POS Launcher" -e bash -c '"$1/start.sh"; echo; echo "Process stopped. Press Enter to exit."; read -r' _ "$ROOT_DIR"
    fi
fi

exec "$ROOT_DIR/start.sh"
