#!/bin/bash
set -e
cd /home/wadi/BlueOcean/php/modernpos/backend
pkill -9 -f "uvicorn main:app" 2>/dev/null || true
sleep 1
venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 4000 &
SERVER_PID=$!
for i in $(seq 1 30); do
    if curl -s http://localhost:4000/api/v1/products > /dev/null 2>&1; then
        echo "Server ready on attempt $i"
        break
    fi
    sleep 1
done
echo "=== Running P38 E2E ==="
venv/bin/python _p38_e2e.py 2>&1
EXIT_CODE=$?
kill $SERVER_PID 2>/dev/null || true
exit $EXIT_CODE
