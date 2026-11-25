#!/usr/bin/env bash
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
OS_NAME="$(uname -s)"

BACKEND_PORT=4000
FRONTEND_PORT=3000

if [ -f "$BACKEND_DIR/.env" ]; then
    ENV_PORT=$(grep -E '^PORT=' "$BACKEND_DIR/.env" | tail -n 1 | cut -d '=' -f2- | tr -d '"\r ')
    if [[ "$ENV_PORT" =~ ^[0-9]+$ ]]; then
        BACKEND_PORT="$ENV_PORT"
    fi
fi

echo "Stopping Blue Oceans POS (Backend:$BACKEND_PORT, Frontend:$FRONTEND_PORT)..."

stop_port() {
    local port="$1"
    local label="$2"
    local pids=""
    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "Stopping $label on port $port (PID: $pids)..."
            kill $pids 2>/dev/null || true
            sleep 1
            pids=$(lsof -ti :"$port" 2>/dev/null || true)
            if [ -n "$pids" ]; then
                kill -9 $pids 2>/dev/null || true
            fi
        fi
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    fi
}

stop_port "$BACKEND_PORT" "Backend"
stop_port "$FRONTEND_PORT" "Frontend"

# Clean up any lingering uvicorn/next processes belonging to this project
pkill -f "$BACKEND_DIR/venv/bin/uvicorn" 2>/dev/null || true
pkill -f "$FRONTEND_DIR/node_modules/.bin/next" 2>/dev/null || true
rm -f "$FRONTEND_DIR/.next/dev/lock"

echo "Blue Oceans POS stopped successfully."
if [ "$OS_NAME" = "Darwin" ] && command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"Frontend ($FRONTEND_PORT) & Backend ($BACKEND_PORT) stopped.\" with title \"Blue Oceans POS\"" 2>/dev/null || true
elif command -v notify-send >/dev/null 2>&1; then
    notify-send "Blue Oceans POS" "Frontend ($FRONTEND_PORT) & Backend ($BACKEND_PORT) stopped." 2>/dev/null || true
fi
