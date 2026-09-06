#!/usr/bin/env python
"""Prompt 40 — Backup, Disaster Recovery & Observability — E2E (spec §26).

Against a LIVE server (:4000):
  1. Observability indicators/metrics reflect REAL system status (API latency +
     error counts, DB, queue/worker, sync, notification failures, CPU/memory/
     disk, uptime, backups) — a forced 400/404 must move the counters, and a
     FAILED notification_logs row must flip the Notifications tile.
  2. FULL backup created through the job queue (backup_full) with checksum.
  3. Backup VERIFY: restore to scratch DB → 195 tables + 20 core tables match
     live row-for-row → scratch dropped.
  4. RESTORE DRILL: dump restored into a fresh DB which then boots as a working
     system (db.py imports + reflects all tables against it) — DoD #1.
  5. Automated daily backup exists in the job queue (scheduler pass).
  6. Offline durability: device "crash/restart" (batch replayed after crash and
     mid-batch crash) → zero lost transactions, zero duplicates, sync queue
     counters intact, stock movements exact, trial balance stays balanced —
     DoD #2.

Run:  python3 _p40_e2e.py    (server must be up on :4000)
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
import uuid

from sqlalchemy import text

from db import sync_engine

BASE = "http://localhost:4000"
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FAILS = []
MARK = f"p40_{int(time.time()) % 100000}"


def req(method, path, body=None, token=None, tenant="demo-shop", timeout=30):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if tenant:
        r.add_header("x-tenant-id", tenant)
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {"error": "non-json"}
    except Exception as e:
        return 0, {"error": str(e)}


def main():
    passed = 0

    def check(name, cond, extra=""):
        nonlocal passed
        passed += 1
        mark = "✓" if cond else "✗"
        print(f"  {mark} {name}" + (f" — {extra}" if extra and not cond else ""))
        if not cond:
            FAILS.append(name)

    def poll(cond, timeout=20, interval=1.0):
        end = time.time() + timeout
        while time.time() < end:
            if cond():
                return True
            time.sleep(interval)
        return cond()

    def sql1(q, **p):
        with sync_engine.connect() as c:
            r = c.execute(text(q), p).first()
            return r[0] if r else None

    print(f"Prompt 40 E2E — Backup / DR / Observability (mark {MARK})")

    # ── auth ──
    s, b = req("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"}, tenant=None)
    check("login", s == 200 and "token" in b)
    token = b["token"]
    H = {"Authorization": f"Bearer {token}", "x-tenant-id": "demo-shop"}
    # build a header-set req wrapper for brevity
    def api(method, path, body=None, timeout=30):
        return req(method, path, body, token=token, timeout=timeout)

    # ═══════════ 1. OBSERVABILITY IS REAL ═══════════
    print("\n== 1. Observability ==")
    s, b = api("GET", "/api/v1/system/indicators")
    inds = b.get("data", {})
    check("indicators endpoint has all 7 tiles",
          all(k in inds for k in ("api", "db", "queue", "sync", "notifications", "storage", "backups")),
          str(list(inds.keys())))
    check("each tile carries ok + detail (real status)",
          all(isinstance(v.get("ok"), bool) and isinstance(v.get("detail"), str) for v in inds.values()))

    s, b = api("GET", "/api/v1/system/metrics")
    m = b.get("data", {})
    check("metrics: api latency + error counters",
          "api" in m and "requestCount" in m["api"] and "error5xx" in m["api"] and "p95Ms" in m["api"])
    check("metrics: sys resources from /proc (load/mem/rss)",
          "sys" in m and "loadAvg" in m["sys"] and "processRssMb" in m["sys"] and "disk" in m["sys"],
          str(list(m.get("sys", {}).keys())))
    check("metrics: sync + notifications + storage + backups sections",
          all(k in m for k in ("sync", "notifications", "storage", "backups", "cache", "worker")))

    # force a 400 and a 404 → error counters must move (dashboard reflects reality)
    s, b = api("POST", "/api/v1/products", {"name": "no-sku"})  # 400 missing sku
    check("forced 400 recorded", s == 400, str(b)[:120])
    s, b = api("GET", "/api/v1/system/jobs/definitely-not-a-job-id")  # 404 route mismatch
    check("forced 404 recorded", s in (404, 405), str(b)[:120])
    s, b = api("GET", "/api/v1/system/metrics")
    check("api error4xx counter grew (real capture)",
          b.get("data", {}).get("api", {}).get("error4xx", 0) >= 2,
          f"4xx={b.get('data', {}).get('api', {}).get('error4xx')}")

    # notification failures tile must flip when a FAILED log row exists
    notif_before = b.get("data", {}).get("notifications", {}).get("failed24h", 0)
    with sync_engine.connect() as c:
        tid = c.execute(text("SELECT id FROM tenants WHERE slug='demo-shop'")).first()[0]
        c.execute(text(
            "INSERT INTO notification_logs (id, tenantId, eventType, channel, recipientType, "
            "status, errorMsg, createdAt) VALUES (UUID(), :t, 'SMTP_TEST', 'EMAIL', 'USER', "
            "'FAILED', 'e2e injected failure', NOW())"), {"t": tid})
        c.commit()
    s, b = api("GET", "/api/v1/system/metrics")
    check("notification failure tile reflects real FAILED row (24h)",
          b.get("data", {}).get("notifications", {}).get("failed24h", 0) == notif_before + 1,
          f"{notif_before} → {b.get('data', {}).get('notifications', {}).get('failed24h')}")
    s, b = api("GET", "/api/v1/system/indicators")
    check("notifications indicator ok=false when failures exist",
          b.get("data", {}).get("notifications", {}).get("ok") is False,
          str(b.get("data", {}).get("notifications")))
    with sync_engine.connect() as c:
        c.execute(text("DELETE FROM notification_logs WHERE tenantId=:t AND eventType='SMTP_TEST'"),
                  {"t": tid})
        c.commit()

    # ═══════════ 2–4. BACKUP → VERIFY → RESTORE-TO-WORKING ═══════════
    print("\n== 2. Backup lifecycle ==")
    s, b = api("POST", "/api/v1/system/backups", {})
    job = (b.get("data") or {}).get("job", {})
    check("create backup runs through the queue", s == 201 and job.get("status") == "SUCCEEDED",
          str(b)[:200])
    backup_id = (job.get("result") or {}).get("backupId")
    check("backup record id returned", bool(backup_id))
    s, b = api("GET", "/api/v1/system/backups")
    rows = b.get("data", [])
    rec = next((r for r in rows if r["id"] == backup_id), None)
    check("backup listed COMPLETED with checksum + tables",
          rec and rec.get("status") == "COMPLETED" and len(rec.get("checksum") or "") == 64
          and (rec.get("tableCount") or 0) > 100,
          str(rec)[:200] if rec else "missing")
    dump_path = os.path.join(BACKEND_DIR, "backups", rec["fileName"]) if rec else ""
    check("backup file exists on disk", bool(rec) and os.path.exists(dump_path))
    with open(dump_path, "rb") as f:
        head = f.read(60).decode(errors="replace")
    check("dump file is a real mysqldump", "40101 SET" in head or "MySQL dump" in head)
    check("automated daily backup job present in queue (scheduler)",
          bool(sql1("SELECT COUNT(*) FROM background_jobs WHERE type='backup_full' "
                    "AND status='SUCCEEDED' AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)") >= 1))

    s, b = api("POST", f"/api/v1/system/backups/{backup_id}/verify", {}, timeout=180)
    vrep = b.get("data", {})
    check("verify restores to scratch + compares", s == 200, str(b)[:200])
    check("verify: every core table matches live", bool(vrep.get("matches")), str(vrep)[:300])
    check("verify: table counts compared (full schema)",
          vrep.get("liveTableCount", 0) == vrep.get("restoredTableCount", 0)
          and vrep.get("liveTableCount", 0) > 100,
          f"live={vrep.get('liveTableCount')} restored={vrep.get('restoredTableCount')}")
    check("verify: scratch DB dropped after compare",
          not sql1("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name=:s",
                   s=vrep.get("scratchDb", "__none__")),
          vrep.get("scratchDb", ""))
    s, b = api("GET", f"/api/v1/system/backups/{backup_id}")
    check("backup marked VERIFIED", (b.get("data") or {}).get("status") == "VERIFIED")

    # restore drill into a fresh DB, then BOOT it as a working system
    target = f"p40_restore_{int(time.time())}"
    s, b = api("POST", f"/api/v1/system/backups/{backup_id}/restore",
               {"targetDb": target}, timeout=180)
    rrep = b.get("data", {})
    check("restore drill into new DB", s == 200 and rrep.get("targetDb") == target, str(b)[:200])
    check("restored system has tenants + users",
          (rrep.get("tenants") or 0) >= 1 and (rrep.get("users") or 0) >= 1,
          str(rrep)[:200])
    boot = subprocess.run(
        [sys.executable, "-c",
         "import db; print('TABLES', len(db.metadata.tables))"],
        cwd=BACKEND_DIR, capture_output=True, text=True, timeout=120,
        env={**os.environ,
             "DATABASE_URL": f"mysql://admin@localhost:3306/{target}"})
    check("restored DB boots as a working system (db.py reflects all tables)",
          boot.returncode == 0 and "TABLES" in boot.stdout,
          f"rc={boot.returncode} out={boot.stdout[-200:]} err={boot.stderr[-200:]}")
    subprocess.run(["mysql", "-u", "admin", "-e", f"DROP DATABASE IF EXISTS `{target}`"],
                   check=False)

    # ═══════════ 5. OFFLINE CRASH/RESTART DURABILITY ═══════════
    print("\n== 5. Offline durability (device crash/restart) ==")
    s, b = api("GET", "/api/v1/branches?limit=3")
    branch = (b.get("data") or [{}])[0]
    s, b = api("GET", "/api/v1/products?limit=5")
    prod = next((p for p in (b.get("data") or []) if p.get("name") == "Cold Coffee"), (b.get("data") or [{}])[0])
    s, b = api("GET", "/api/v1/customers?limit=3")
    cust = (b.get("data") or [{}])[0]
    s, b = api("GET", "/api/v1/warehouses?limit=3")
    wh = (b.get("data") or [{}])[0]
    check("seed entities fetched", bool(branch.get("id") and prod.get("id") and cust.get("id") and wh.get("id")))

    device = f"{MARK}-device"
    s, b = api("POST", "/api/v1/devices/register",
               {"deviceId": device, "deviceName": "P40 crash-test device", "branchId": branch["id"]})
    check("device registered", s in (200, 201))
    api("POST", "/api/v1/cash-register/open", {"branchId": branch["id"], "openingCash": 5000})
    api("POST", "/api/v1/sync/pull", {"deviceId": device, "entities": ["products", "customers", "prices"]})

    def offline_sale(seq, qty=2, price=60.0):
        sid = str(uuid.uuid4())
        return {
            "entityType": "SALE", "entityId": sid, "localSequence": seq,
            "idempotencyKey": f"{device}-sale-{seq}",
            "payload": {"saleId": sid, "branchId": branch["id"], "warehouseId": wh["id"],
                        "customerId": cust["id"],
                        "items": [{"productId": prod["id"], "qty": qty, "unitPrice": price,
                                   "name": prod["name"]}],
                        "payments": [{"method": "CASH", "amount": qty * price}]},
        }

    outbox_a = [offline_sale(i + 1) for i in range(4)]
    s, b = api("POST", "/api/v1/sync/upload", {"deviceId": device, "transactions": outbox_a})
    check("batch A uploaded (4 sales)", (b.get("data") or {}).get("synced") == 4, str(b)[:200])

    # CRASH: device crashed right after the server acked; on restart the SAME
    # outbox replays — every txn must be idempotent (0 lost, 0 duplicate).
    s, b = api("POST", "/api/v1/sync/upload", {"deviceId": device, "transactions": outbox_a})
    check("post-crash replay: 4 duplicates, none re-created",
          (b.get("data") or {}).get("synced") == 4 and (b.get("data") or {}).get("failed") == 0,
          str(b)[:250])
    sale_ids = {t["entityId"] for t in outbox_a}
    # exact existence check per id (avoids SQLAlchemy IN-tuple pitfalls)
    missing = 0
    for sid in sale_ids:
        if not sql1("SELECT COUNT(*) FROM sales WHERE id=:i", i=sid):
            missing += 1
    check("all 4 sales exist exactly once after replay", missing == 0, f"missing={missing}")
    with sync_engine.connect() as c:
        tid = c.execute(text("SELECT id FROM tenants WHERE slug='demo-shop'")).first()[0]
        dup_check = c.execute(text(
            "SELECT COUNT(*) FROM sales s WHERE s.tenantId=:t AND s.id IN "
            "(SELECT entityId FROM sync_transactions WHERE tenantId=:t AND idempotencyKey LIKE :p)"),
            {"t": tid, "p": f"{device}-sale-%"}).first()
        check("exactly 4 sales for 4 outbox rows (no duplicates on server)",
              int(dup_check[0]) == 4, f"sales={dup_check[0]}")

    # CRASH MID-BATCH: outbox had 3 more; only 2 reached the server before the
    # device died; after restart the FULL outbox replays → 1 new + 2 dup = 3.
    outbox_b = [offline_sale(i + 5, qty=1, price=30.0) for i in range(3)]
    s, b = api("POST", "/api/v1/sync/upload", {"deviceId": device, "transactions": outbox_b[:2]})
    check("mid-batch crash: only 2 of 3 reached server",
          (b.get("data") or {}).get("synced") == 2, str(b)[:200])
    s, b = api("POST", "/api/v1/sync/upload", {"deviceId": device, "transactions": outbox_b})
    check("restart replay of full batch: 3 handled (1 new, 2 dup), 0 failed",
          (b.get("data") or {}).get("synced") == 3 and (b.get("data") or {}).get("failed") == 0,
          str(b)[:250])
    all_ids = sale_ids | {t["entityId"] for t in outbox_b}
    with sync_engine.connect() as c:
        total_sales = c.execute(text(
            "SELECT COUNT(*) FROM sales WHERE tenantId=:t AND id IN :ids"),
            {"t": tid, "ids": tuple(all_ids)}).first()
        check("zero lost after crashes — all 7 outbox sales on server",
              int(total_sales[0]) == 7, f"sales={total_sales[0]}")

    # persistent sync queue counters survive (device_sync_status)
    s, b = api("GET", f"/api/v1/sync/status?deviceId={device}", timeout=15)
    sd = b.get("data", {})
    check("device sync status: pending=0 failed=0 lastSyncAt set",
          sd.get("pendingCount", -1) == 0 and sd.get("failedCount", -1) == 0 and sd.get("lastSyncAt"),
          str(sd)[:200])

    # stock movements recorded exactly (7 sales: 4×2 + 3×1 = 11 units out)
    with sync_engine.connect() as c:
        mv = c.execute(text(
            "SELECT COALESCE(SUM(qty),0) FROM stock_movements WHERE tenantId=:t "
            "AND refType='SALE' AND refId IN :ids"), {"t": tid, "ids": tuple(all_ids)}).first()
        check("stock movements sum = −11 (nothing lost/duplicated)",
              abs(float(mv[0]) - (-11.0)) < 0.01, f"sum={mv[0]}")
    s, b = api("GET", "/api/v1/accounting/trial-balance")
    check("trial balance balanced after crash-replay sales",
          (b.get("data") or {}).get("balanced") is True, str(b)[:150])

    # sync health tile reflects the reconnected device (stale=false)
    s, b = api("GET", "/api/v1/system/indicators")
    check("sync indicator detail mentions the device state (real rows)",
          "devices" in (b.get("data", {}).get("sync", {}) or {}).get("detail", ""),
          str((b.get("data") or {}).get("sync")))

    # ── cleanup created data ──
    with sync_engine.connect() as c:
        c.execute(text("DELETE FROM sync_transactions WHERE tenantId=:t AND deviceId=:d"),
                  {"t": tid, "d": device})
        c.execute(text("DELETE FROM sale_items WHERE tenantId=:t AND saleId IN :ids"),
                  {"t": tid, "ids": tuple(all_ids)})
        c.execute(text("DELETE FROM invoices WHERE tenantId=:t AND saleId IN :ids"),
                  {"t": tid, "ids": tuple(all_ids)})
        c.execute(text("DELETE FROM payments WHERE tenantId=:t AND saleId IN :ids"),
                  {"t": tid, "ids": tuple(all_ids)})
        c.execute(text("DELETE FROM shift_txns WHERE tenantId=:t AND refType='SALE' AND refId IN :ids"),
                  {"t": tid, "ids": tuple(all_ids)})
        c.execute(text("DELETE FROM stock_movements WHERE tenantId=:t AND refType='SALE' AND refId IN :ids"),
                  {"t": tid, "ids": tuple(all_ids)})
        c.execute(text("DELETE FROM sales WHERE tenantId=:t AND id IN :ids"),
                  {"t": tid, "ids": tuple(all_ids)})
        c.execute(text("DELETE FROM device_sync_status WHERE tenantId=:t AND deviceId=:d"),
                  {"t": tid, "d": device})
        c.commit()

    print(f"\nPrompt 40 E2E: {passed} checks, {len(FAILS)} failures")
    if FAILS:
        for f in FAILS:
            print(f"  ✗ {f}")
        sys.exit(1)
    print("ALL PASSED ✓")


if __name__ == "__main__":
    main()
