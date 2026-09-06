#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Blue Oceans POS — Prompt 43 RELEASE GATE
# Runs the FULL test battery one final time before go-live:
#   • backend syntax (compileall)
#   • smoke_test.py (50 checks)
#   • every prompt E2E suite (_p18_e2e.py … _p42_e2e.py)
#   • frontend production build (types are gated at build)
# Summarizes per-suite PASS/FAIL and exits non-zero if anything failed.
#
# Usage:  bash backend/_run_p43_release.sh
# Requires: API on :4000 (systemd user unit omni-pos-api) + MySQL up.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")"

PASS=0; FAIL=0; FAILED_SUITES=()
LOG=/tmp/omni_release_$(date +%H%M%S).log
echo "Release gate log: $LOG"
exec > >(tee -a "$LOG") 2>&1

echo "═══ Blue Oceans POS — RELEASE GATE (Prompt 43) ═══"
date -u +"start: %Y-%m-%d %H:%M:%S UTC"

# ── 0. API must be up ──
if ! curl -s -m 3 http://localhost:4000/health >/dev/null 2>&1; then
  echo "API not reachable on :4000 — start omni-pos-api first." >&2
  exit 1
fi

run_suite() {
  local name="$1"; shift
  echo
  echo "── $name ────────────────────────────────────────────"
  if python3 "$@" 2>&1; then
    PASS=$((PASS+1)); echo "✔ $name PASSED"
  else
    FAIL=$((FAIL+1)); FAILED_SUITES+=("$name"); echo "✘ $name FAILED"
  fi
}

# ── 1. Backend syntax gate ──
echo; echo "── compileall (backend syntax) ──"
if python3 -m compileall -q . ; then echo "✔ syntax PASSED"; else
  echo "✘ syntax FAILED"; exit 1
fi

# ── 2. Backend suites: smoke first (fastest feedback), then p18→p42 ──
run_suite "smoke_test"               smoke_test.py
run_suite "prompt 18 (returns/RMA)"  _p18_e2e.py
run_suite "prompt 19 (offline sync)" _p19_e2e.py
run_suite "prompt 20 (restaurant)"   _p20_e2e.py
run_suite "prompt 21 (pharmacy)"     _p21_e2e.py
run_suite "prompt 22 (retail/grocery/wholesale)" _p22_e2e.py
run_suite "prompt 23 (industry/franchise)"       _p23_e2e.py
run_suite "prompt 24 (delivery)"     _p24_e2e.py
run_suite "prompt 25 (HRM/tasks)"    _p25_e2e.py
run_suite "prompt 26 (loyalty)"      _p26_e2e.py
run_suite "prompt 27 (workflow)"     _p27_e2e.py
run_suite "prompt 28 (notifications)" _p28_e2e.py
run_suite "prompt 29 (documents)"    _p29_e2e.py
run_suite "prompt 30 (reporting/BI)" _p30_e2e.py
run_suite "prompt 31 (AI)"           _p31_e2e.py
run_suite "prompt 32 (SaaS platform)" _p32_e2e.py
run_suite "prompt 33 (omnichannel)"  _p33_e2e.py
run_suite "prompt 34 (API/webhooks)" _p34_e2e.py
run_suite "prompt 35 (hardware/PWA)" _p35_e2e.py
run_suite "prompt 36 (search/import)" _p36_e2e.py
run_suite "prompt 37 (multi-currency)" _p37_e2e.py
run_suite "prompt 38 (audit/security)" _p38_e2e.py
run_suite "prompt 39 (perf/queue)"    _p39_e2e.py
run_suite "prompt 40 (backup/DR)"     _p40_e2e.py
run_suite "prompt 41 (full E2E)"      _p41_e2e.py
run_suite "prompt 42 (UI/UX E2E)"     _p42_e2e.py

# ── 3. Frontend build gate ──
echo; echo "── frontend production build ──"
(cd ../frontend && npm run build) && { echo "✔ frontend build PASSED"; PASS=$((PASS+1)); } || \
  { echo "✘ frontend build FAILED"; FAIL=$((FAIL+1)); FAILED_SUITES+=("frontend build"); }

# ── Summary ──
echo; echo "═══════════════════════════════════════════════"
echo "Suites passed: $PASS   failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed: ${FAILED_SUITES[*]}"
  echo "RELEASE GATE: ✘ NOT CLEARED"
  exit 1
fi
echo "RELEASE GATE: ✔ CLEARED — ready for first tenant go-live"
date -u +"end: %Y-%m-%d %H:%M:%S UTC"
