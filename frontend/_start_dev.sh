#!/usr/bin/env bash
# Durable Next.js dev server for the OmniPOS frontend (port 3000).
cd "$(dirname "$0")"
pkill -9 -f "next dev" 2>/dev/null
sleep 1
mkdir -p /tmp/opencode
setsid nohup npm run dev > /tmp/opencode/next_3000.log 2>&1 < /dev/null &
echo "frontend dev server starting on :3000 (log: /tmp/opencode/next_3000.log)"
