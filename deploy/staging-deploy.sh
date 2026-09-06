#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Blue Oceans POS — staging deployment (Prompt 43, release pipeline)
#
# Runs end-to-end against THIS host as the target "staging" environment:
#   1. sanity-check the backend env + DB connectivity
#   2. seed the demo tenant (idempotent)
#   3. build the frontend production bundle (release gate on types/compile)
#   4. install + start the systemd units (API :4000, Web :3000)
#   5. smoke-check both services
#
# Usage:  bash deploy/staging-deploy.sh   (run from repo root)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "── 1/5 Backend env sanity ──"
[ -f backend/.env ] || { echo "backend/.env missing — copy backend/.env.production.example → backend/.env" >&2; exit 1; }
cd backend
python3 - <<'PY'
import db
print("   DB reachable, tables reflected:", len(db.metadata.tables))
PY

echo "── 2/5 Seed demo tenant (idempotent) ──"
python3 seed_demo.py | tail -1

echo "── 3/5 Frontend production build ──"
cd "$ROOT/frontend"
npm ci --silent 2>/dev/null || npm install --silent
npm run build

echo "── 4/5 Install + start systemd units ──"
if [ -w /etc/systemd/system ]; then
  sudo cp "$ROOT/deploy/omni-pos-api.service" /etc/systemd/system/
  sudo cp "$ROOT/deploy/omni-pos-web.service"  /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now omni-pos-api omni-pos-web
else
  # User-level fallback for the dev/staging box (matches how the API runs today)
  cp "$ROOT/deploy/omni-pos-api.service" ~/.config/systemd/user/omni-pos-api.service
  cp "$ROOT/deploy/omni-pos-web.service"  ~/.config/systemd/user/omni-pos-web.service
  systemctl --user daemon-reload
  systemctl --user enable --now omni-pos-api omni-pos-web
fi

echo "── 5/5 Smoke check ──"
for i in $(seq 1 15); do
  curl -sf -m 2 http://localhost:4000/health >/dev/null 2>&1 && break
  sleep 1
done
curl -sf http://localhost:4000/health >/dev/null && echo "   API  :4000 OK" || { echo "   API  :4000 FAILED" >&2; exit 1; }
for i in $(seq 1 30); do
  curl -sf -o /dev/null -m 2 http://localhost:3000/login >/dev/null 2>&1 && break
  sleep 1
done
curl -sf -o /dev/null http://localhost:3000/login && echo "   Web  :3000 OK" || { echo "   Web  :3000 FAILED" >&2; exit 1; }

echo
echo "✅ Staging deployment complete."
echo "   UI:  http://localhost:3000   API docs: http://localhost:4000/docs"
echo "   Next: bash backend/_run_p43_release.sh  (full release-gate test suite)"
