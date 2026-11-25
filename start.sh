#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
OS_NAME="$(uname -s)"

# Ensure GUI environment variables on Linux
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
elif [ "$OS_NAME" = "Darwin" ]; then
    export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi

# Load nvm-managed Node.js / npm
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
if ! command -v node >/dev/null 2>&1 && [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NODE_BIN="$({ ls -d "$HOME/.nvm/versions/node"/*/bin 2>/dev/null | sort -V 2>/dev/null || ls -d "$HOME/.nvm/versions/node"/*/bin 2>/dev/null | sort; } | tail -n 1 || true)"
    [ -n "$LATEST_NODE_BIN" ] && export PATH="$LATEST_NODE_BIN:$PATH"
fi

PYTHON_CMD="python3"
if ! command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python"
fi

if ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
    echo "[ERROR] Python 3 was not found in PATH."
    exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] Node.js / npm not found. Please install Node.js 20+ or configure nvm."
    exit 1
fi

# Ensure backend/.env exists (do not overwrite existing configs)
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$BACKEND_DIR/.env.example" ]; then
    echo "[INFO] Creating backend/.env from backend/.env.example..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi

BACKEND_PORT=4000
FRONTEND_PORT=3000

if [ -f "$BACKEND_DIR/.env" ]; then
    ENV_PORT=$(grep -E '^PORT=' "$BACKEND_DIR/.env" | tail -n 1 | cut -d '=' -f2- | tr -d '"\r ')
    if [[ "$ENV_PORT" =~ ^[0-9]+$ ]]; then
        BACKEND_PORT="$ENV_PORT"
    fi
fi

echo "====================================================================="
echo "   BLUE OCEANS POS (BPOS) - FULL STACK LAUNCHER"
echo "====================================================================="
echo "OS: $OS_NAME | Node.js: $(node -v) | Backend: :$BACKEND_PORT | Frontend: :$FRONTEND_PORT"
echo ""

# Stop any lingering processes on backend/frontend ports
free_port() {
    local port="$1"
    local pids=""
    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "[INFO] Freeing port $port (PID: $pids)..."
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

free_port "$BACKEND_PORT"
free_port "$FRONTEND_PORT"

# Clean stale Next.js dev lock if present
LOCK_FILE="$FRONTEND_DIR/.next/dev/lock"
if [ -f "$LOCK_FILE" ]; then
    echo "[INFO] Removing stale Next.js dev lock..."
    rm -f "$LOCK_FILE"
fi

# Check MySQL reachability from backend/.env (+ .env.<APP_ENV>)
"$PYTHON_CMD" - "$BACKEND_DIR" <<'EOF'
import os, socket, sys
from urllib.parse import urlparse

backend_dir = sys.argv[1]
env = {}

def load_env(path):
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

load_env(os.path.join(backend_dir, ".env"))
app_env = env.get("APP_ENV", "local").strip().lower()
load_env(os.path.join(backend_dir, f".env.{app_env}"))

host, port = "localhost", 3306
if env.get("DATABASE_URL"):
    try:
        u = urlparse(env["DATABASE_URL"])
        if u.hostname:
            host = u.hostname
        if u.port:
            port = int(u.port)
    except Exception:
        pass
else:
    host = env.get("DB_HOST", host)
    try:
        port = int(env.get("DB_PORT", port))
    except Exception:
        port = 3306

s = socket.socket()
s.settimeout(2.5)
res = s.connect_ex((host, port))
s.close()
if res == 0:
    print(f"[OK] MySQL reachable at {host}:{port} (profile: {app_env})")
else:
    print(f"[WARNING] Cannot reach MySQL at {host}:{port} (profile: {app_env}). Check backend/.env or DB server.")
EOF

# Setup backend venv & dependencies if missing
if [ ! -x "$BACKEND_DIR/venv/bin/uvicorn" ]; then
    echo "[INFO] Setting up backend Python virtual environment..."
    "$PYTHON_CMD" -m venv "$BACKEND_DIR/venv"
    "$BACKEND_DIR/venv/bin/pip" install --upgrade pip
    "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
elif ! "$BACKEND_DIR/venv/bin/python" -c "import fastapi, uvicorn, sqlalchemy, pydantic" >/dev/null 2>&1; then
    echo "[INFO] Installing missing backend Python packages..."
    "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

# Install frontend dependencies if missing
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "[INFO] Installing frontend npm dependencies..."
    (cd "$FRONTEND_DIR" && npm install)
fi

BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=0

kill_tree() {
    local pid="$1"
    local sig="${2:-TERM}"
    [ -z "$pid" ] && return
    local children=""
    if command -v pgrep >/dev/null 2>&1; then
        children=$(pgrep -P "$pid" 2>/dev/null || true)
    fi
    for child in $children; do
        kill_tree "$child" "$sig"
    done
    kill -"$sig" "$pid" 2>/dev/null || true
}

cleanup() {
    [ "$CLEANED_UP" -eq 1 ] && return
    CLEANED_UP=1
    echo ""
    echo "[INFO] Shutting down Blue Oceans POS servers..."
    kill_tree "$FRONTEND_PID" TERM
    kill_tree "$BACKEND_PID" TERM
    sleep 1
    kill_tree "$FRONTEND_PID" KILL
    kill_tree "$BACKEND_PID" KILL
    rm -f "$LOCK_FILE"
    wait 2>/dev/null || true
    echo "[OK] Blue Oceans POS stopped cleanly."
}
trap cleanup EXIT INT TERM HUP

echo ""
echo "[1/2] Starting FastAPI Backend on http://127.0.0.1:$BACKEND_PORT..."
(
    cd "$BACKEND_DIR"
    exec "$BACKEND_DIR/venv/bin/uvicorn" main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload
) &
BACKEND_PID=$!

echo -n "[INFO] Waiting for backend API"
BACKEND_READY=0
for _ in $(seq 1 60); do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo ""
        echo "[ERROR] Backend exited unexpectedly. Check the error output above."
        exit 1
    fi
    if curl -sf "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null 2>&1 || curl -sf "http://127.0.0.1:$BACKEND_PORT/docs" >/dev/null 2>&1; then
        echo " Ready!"
        BACKEND_READY=1
        break
    fi
    sleep 0.5
    echo -n "."
done
if [ "$BACKEND_READY" -eq 0 ]; then
    echo ""
    echo "[WARNING] Backend is taking longer than expected on port $BACKEND_PORT (still starting)."
fi

echo "[2/2] Starting Next.js POS Frontend on http://localhost:$FRONTEND_PORT..."
(
    cd "$FRONTEND_DIR"
    exec npm run dev -- -p "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

echo -n "[INFO] Waiting for frontend"
FRONTEND_READY=0
for _ in $(seq 1 40); do
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo ""
        echo "[ERROR] Frontend exited unexpectedly. Check the error output above."
        exit 1
    fi
    if curl -s --max-time 1 "http://127.0.0.1:$FRONTEND_PORT" >/dev/null 2>&1; then
        echo " Ready!"
        FRONTEND_READY=1
        break
    fi
    sleep 0.5
    echo -n "."
done
if [ "$FRONTEND_READY" -eq 0 ]; then
    echo ""
    echo "[WARNING] Frontend did not respond in time, opening browser anyway..."
fi

# Open browser detached so closing terminal does not kill the browser
(
    sleep 1
    URL="http://localhost:$FRONTEND_PORT"
    if [ "$OS_NAME" = "Darwin" ]; then
        open "$URL" >/dev/null 2>&1 || true
    elif command -v xdg-open >/dev/null 2>&1; then
        nohup xdg-open "$URL" >/dev/null 2>&1 &
    elif command -v google-chrome >/dev/null 2>&1; then
        nohup google-chrome "$URL" >/dev/null 2>&1 &
    elif command -v brave-browser >/dev/null 2>&1; then
        nohup brave-browser "$URL" >/dev/null 2>&1 &
    fi
)

echo ""
echo "====================================================================="
echo "   BLUE OCEANS POS IS RUNNING! (Press Ctrl+C to stop)"
echo "====================================================================="
echo "   POS App:        http://localhost:$FRONTEND_PORT"
echo "   Backend API:    http://localhost:$BACKEND_PORT"
echo "   API Swagger:    http://localhost:$BACKEND_PORT/docs"
echo "====================================================================="
echo ""

set +e
wait "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?
set -e

if [ "$EXIT_CODE" -ne 0 ]; then
    echo ""
    echo "[WARNING] One of the servers exited with status $EXIT_CODE."
fi
