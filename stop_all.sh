#!/usr/bin/env bash
# ========================================================
#   BLUEOCEANS OMNIPOS - STOP ALL SERVICES (Linux/macOS)
# ========================================================

echo "Stopping all OmniPOS services (ports 4000, 3000, 3001)..."

for PORT in 4000 3000 3001; do
    if command -v lsof &> /dev/null; then
        PID=$(lsof -ti:$PORT || true)
        if [ -n "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
            echo "[OK] Stopped process on port $PORT (PID: $PID)"
        fi
    elif command -v fuser &> /dev/null; then
        fuser -k ${PORT}/tcp 2>/dev/null || true
        echo "[OK] Stopped process on port $PORT"
    fi
done

echo "All services stopped."
