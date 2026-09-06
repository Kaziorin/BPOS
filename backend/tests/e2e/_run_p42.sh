#!/usr/bin/env bash
# Prompt 42 — UI/UX Polish Pass (§27): run the full E2E verification.
# Requires: backend on :4000 (systemd user unit omni-pos-api) + MySQL up.
set -euo pipefail
cd "$(dirname "$0")"

# Ensure API is up
if ! curl -s -m 3 http://localhost:4000/health >/dev/null 2>&1; then
  echo "API not responding on :4000 — start it (systemctl --user start omni-pos-api) and retry." >&2
  exit 1
fi

echo "── Seed (idempotent; re-baselines demo nav + pharmacy stock) ──"
python3 seed_demo.py | tail -1

echo "── Prompt 42 E2E ──"
python3 _p42_e2e.py
