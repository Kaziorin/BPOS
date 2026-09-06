#!/bin/bash
# Durable start of the Python API (port 4000 = same as TS backend).
cd "$(dirname "$0")"
setsid nohup ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 4000 > /tmp/opencode/pyapi_4000.log 2>&1 < /dev/null &
echo "started on :4000 (log: /tmp/opencode/pyapi_4000.log)"
