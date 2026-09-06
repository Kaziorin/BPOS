#!/usr/bin/env bash
# Prompt 41 — Full Testing Pass (§31): runner.
# Ensures the API is up, then executes the mandatory 10-scenario E2E suite.
set -euo pipefail
cd "$(dirname "$0")"

# API must be running (see _start_p41.sh / systemd unit omni-pos-api)
if ! curl -s -m 5 http://localhost:4000/health >/dev/null 2>&1; then
  echo "API not reachable on :4000 — start it first (e.g. systemctl --user start omni-pos-api)" >&2
  exit 1
fi

echo "── Prompt 41 E2E — Full Testing Pass (§31) ──────────────────────"
python3 _p41_e2e.py
