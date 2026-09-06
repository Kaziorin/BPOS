#!/bin/bash
# Prompt 39 — boot a fresh backend and run the performance/caching/queue E2E.
set -e
cd "$(dirname "$0")"

pkill -9 -f "uvicorn main:app" 2>/dev/null || true
sleep 1

PY=python3
[ -x venv/bin/python ] && PY=venv/bin/python

"$PY" -m uvicorn main:app --host 0.0.0.0 --port 4000 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for i in $(seq 1 45); do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo "Server ready on attempt $i"
        break
    fi
    sleep 1
done

echo "=== Running P39 E2E ==="
"$PY" _p39_e2e.py 2>&1
EXIT_CODE=$?
exit $EXIT_CODE
