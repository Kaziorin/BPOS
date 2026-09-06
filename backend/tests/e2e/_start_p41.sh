#!/bin/bash
# Durable backend start for Prompt 41 work (no venv — uses system python).
cd /home/wadi/Project/NextJs/modernpos/backend
pkill -9 -f "uvicorn main:app" 2>/dev/null
sleep 1
rm -f /tmp/opencode/pyapi_4000.log
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 4000 \
    > /tmp/opencode/pyapi_4000.log 2>&1 < /dev/null &
echo $! > /tmp/opencode/backend.pid
echo "started pid $(cat /tmp/opencode/backend.pid)"
