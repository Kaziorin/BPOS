#!/usr/bin/env python
"""Prompt 39 — Performance, Caching, Background Jobs & Scalability — E2E.

Verifies, against a LIVE server (port 4000):
  1. System health shows worker alive, DB connected, cache surfaced
  2. Background job queue: enqueue → worker processes → SUCCEEDED (observable),
     plus cancel + retry lifecycle via the admin API
  3. Webhook delivery runs through the queue (fire → job → receiver hit) and the
     worker scheduler AUTO-RETRIES a failed event after its backoff — no manual
     action required
  4. Recurring expenses generate automatically via the worker's scheduler pass
     and on manual "run now" — both through the same queue handler
  5. Caching: repeat product read is a cache hit; a write invalidates instantly
     (never stale); financial endpoints never add cache entries
  6. Load test vs §25 targets: product search / customer lookup near-instant

Run:  python3 _p39_e2e.py   (server must already be running)
"""
import json
import statistics
import sys
import threading
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer

from sqlalchemy import text

from db import sync_engine  # cleanup / direct assertions (same pattern as prior e2e files)

BASE = "http://localhost:4000"
FAILS = []
MARK = f"P39{int(time.time()) % 100000}"

# ── tiny local webhook receivers ────────────────────────────────────────────
_hit_ok = 0
_hit_fail = 0


class _OKHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        global _hit_ok
        _hit_ok += 1
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"{}")

    def log_message(self, *a):
        pass


class _FailHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        global _hit_fail
        _hit_fail += 1
        self.send_response(500)
        self.end_headers()
        self.wfile.write(b"boom")

    def log_message(self, *a):
        pass


def req(method, path, body=None, token=None, tenant="demo-shop"):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if tenant:
        r.add_header("x-tenant-id", tenant)
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {"error": "non-json"}
    except Exception as e:
        return 0, {"error": str(e)}


def check(name, cond, extra=""):
    mark = "✓" if cond else "✗"
    print(f"  {mark} {name}" + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def poll(cond, timeout=15, interval=0.7):
    end = time.time() + timeout
    while time.time() < end:
        if cond():
            return True
        time.sleep(interval)
    return cond()


def main():
    ok_server = HTTPServer(("127.0.0.1", 18990), _OKHandler)
    fail_server = HTTPServer(("127.0.0.1", 18991), _FailHandler)
    threading.Thread(target=ok_server.serve_forever, daemon=True).start()
    threading.Thread(target=fail_server.serve_forever, daemon=True).start()

    print("Prompt 39 E2E — Performance / Caching / Background Jobs / Scalability")
    print(f"  mark: {MARK}")
    passed = 0

    def check(name, cond, extra=""):
        nonlocal passed
        passed += 1
        mark = "✓" if cond else "✗"
        print(f"  {mark} {name}" + (f" — {extra}" if extra and not cond else ""))
        if not cond:
            FAILS.append(name)

    # 1. health (open) + login
    s, b = req("GET", "/health", tenant=None)
    check("health", s == 200 and b.get("status") == "ok")
    s, b = req("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"}, tenant=None)
    check("login", s == 200 and "token" in b, str(b)[:200])
    token = b["token"]

    # 2. system health — worker alive, db ok, cache surfaced
    s, b = req("GET", "/api/v1/system/health", token=token)
    d = b.get("data", {})
    check("system health 200", s == 200)
    check("db connected", d.get("db", {}).get("connected") is True)
    check("worker alive", d.get("worker", {}).get("alive") is True, str(d.get("worker"))[:200])
    check("cache stats present", "cache" in d and "hitRate" in d.get("cache", {}))
    check("no financial namespace cached (health)", d.get("cache", {}).get("financialNamespacesCached") == [])

    # 3. enqueue → worker processes asynchronously → SUCCEEDED (poll the queue)
    s, b = req("POST", "/api/v1/system/jobs/enqueue",
               {"type": "notification",
                "payload": {"title": f"{MARK} queue test", "body": "processed by worker",
                            "eventType": "QUEUE_NOTIFICATION", "userId": None}},
               token=token)
    check("enqueue returns QUEUED job", s == 201 and b.get("data", {}).get("status") == "QUEUED", str(b)[:200])
    jid = b.get("data", {}).get("id", "")
    done = poll(lambda: any(j.get("id") == jid and j.get("status") == "SUCCEEDED"
                            for j in req("GET", "/api/v1/system/jobs?limit=50", token=token)[1].get("data", [])),
                timeout=15)
    check("worker executed queued job → SUCCEEDED (async)", done, f"job {jid}")
    s, b = req("GET", "/api/v1/system/jobs/stats", token=token)
    st = b.get("data", {})
    check("job stats byStatus/byType", "byStatus" in st and "byType" in st)

    # cancel → retry lifecycle
    s, b = req("POST", "/api/v1/system/jobs/enqueue", {"type": "notification", "payload": {"title": "x", "body": "y"}}, token=token)
    cid = b.get("data", {}).get("id", "")
    s, b = req("POST", f"/api/v1/system/jobs/{cid}/cancel", token=token)
    check("cancel queued job", s == 200, str(b)[:200])
    s, b = req("POST", f"/api/v1/system/jobs/{cid}/retry", token=token)
    check("retry cancelled job → QUEUED", s == 200 and b.get("data", {}).get("status") == "QUEUED", str(b)[:200])

    # 4a. webhook delivery through the queue (successful receiver)
    s, b = req("POST", "/api/v1/webhooks",
               {"url": "http://127.0.0.1:18990/hook", "events": ["invoice.created"], "description": f"{MARK} ok"},
               token=token)
    check("create webhook sub (ok receiver)", s == 201, str(b)[:200])
    ok_sub = b.get("data", {}).get("id", "")
    s, b = req("POST", "/api/v1/webhooks/fire",
               {"eventType": "invoice.created", "payload": {"invoiceNo": f"INV-{MARK}", "total": 100},
                "idempotencyKey": f"{MARK}-ok"},
               token=token)
    fired = (b.get("data", {}) or {}).get("fired", 0)
    check("fire event → queued for delivery", s == 200 and fired >= 1, str(b)[:250])
    delivered = poll(lambda: _hit_ok >= fired, timeout=15)
    check("webhook receiver got the event", delivered, f"hits={_hit_ok}")
    s, b = req("GET", "/api/v1/system/jobs?type=webhook_deliver&limit=20", token=token)
    jobs = b.get("data", [])
    check("webhook_deliver job recorded", any(j.get("type") == "webhook_deliver" for j in jobs))
    check("webhook_deliver job SUCCEEDED", any(j.get("type") == "webhook_deliver" and j.get("status") == "SUCCEEDED" for j in jobs),
          str([(j.get("status"), j.get("type")) for j in jobs[:5]]))
    s, b = req("GET", "/api/v1/webhooks/stats", token=token)
    check("webhook stats success ≥ 1", b.get("data", {}).get("success", 0) >= 1, str(b.get("data"))[:200])
    req("DELETE", f"/api/v1/webhooks/{ok_sub}", token=token)

    # 4b. failing receiver → scheduler AUTO-RETRIES after backoff (no manual action)
    s, b = req("POST", "/api/v1/webhooks",
               {"url": "http://127.0.0.1:18991/hook", "events": ["invoice.created"], "description": f"{MARK} fail"},
               token=token)
    fail_sub = b.get("data", {}).get("id", "")
    req("POST", "/api/v1/webhooks/fire",
        {"eventType": "invoice.created", "payload": {"invoiceNo": f"INV-{MARK}-F", "total": 1},
         "idempotencyKey": f"{MARK}-fail"},
        token=token)
    auto_retried = poll(lambda: _hit_fail >= 2, timeout=45, interval=1.5)
    check("scheduler auto-retried failed webhook (2nd attempt, no manual action)",
          auto_retried, f"fail hits={_hit_fail} (backoff ~20s then scheduler requeues)")
    req("DELETE", f"/api/v1/webhooks/{fail_sub}", token=token)

    # 5. recurring expenses — automatic scheduled pass via the queue
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    s, b = req("POST", "/api/v1/expenses/recurring",
               {"name": f"{MARK} Auto", "amount": 77, "frequency": "DAILY", "nextRunDate": yesterday},
               token=token)
    check("create recurring template", s == 201, str(b)[:200])
    s, b = req("GET", "/api/v1/expenses/recurring", token=token)
    tmpl = next((r.get("id") for r in b.get("data", []) if r.get("name") == f"{MARK} Auto"), None)
    check("recurring template listed", tmpl is not None)
    auto_ran = poll(lambda: bool(sql_count_expenses_for(tmpl) >= 1), timeout=45, interval=2)
    check("scheduler pass auto-generated expense via queue", auto_ran,
          f"expenses={sql_count_expenses_for(tmpl)}")
    s, b = req("GET", "/api/v1/expenses/recurring", token=token)
    row = next((r for r in b.get("data", []) if r.get("id") == tmpl), None)
    check("template advanced after auto-run (lastGeneratedAt set)",
          bool(row and row.get("lastGeneratedAt")), str(row)[:200])

    # manual run-now — same queue handler (make it due again first, like a new period)
    with sync_engine.connect() as c:
        c.execute(text("UPDATE recurring_expenses SET nextRunDate=DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id=:id"),
                  {"id": tmpl})
        c.commit()
    s, b = req("POST", "/api/v1/expenses/recurring/run", {}, token=token)
    check("manual run-now through queue", s == 200 and b.get("data", {}).get("jobId"), str(b)[:250])
    check("manual run generated a second expense",
          sql_count_expenses_for(tmpl) >= 2, f"count={sql_count_expenses_for(tmpl)}")

    # 6. caching — hit on repeat read, instant invalidation on write, no financial cache
    s, b = req("GET", "/api/v1/system/cache/stats", token=token)
    h0 = b.get("data", {}).get("hits", 0)
    c0 = b.get("data", {}).get("size", 0)
    s1, b1 = req("GET", "/api/v1/products?search=coffee&limit=5", token=token)
    s2, b2 = req("GET", "/api/v1/products?search=coffee&limit=5", token=token)
    check("product search twice returns identical body", s1 == 200 and b1 == b2)
    s, b = req("GET", "/api/v1/system/cache/stats", token=token)
    check("2nd product read was a cache hit (hits grew)", b.get("data", {}).get("hits", 0) > h0,
          f"hits {h0} → {b.get('data', {}).get('hits')}")

    # rename an existing seeded product (cached detail) → PUT → rename back.
    # The renamed detail must be served immediately (write invalidates cache).
    s, b = req("GET", "/api/v1/products?search=cold&limit=3", token=token)
    pid = (b.get("data") or [{}])[0].get("id")
    orig = (b.get("data") or [{}])[0].get("name")
    check("pick seeded product for cache test", pid is not None, str(b)[:200])
    s, b = req("GET", f"/api/v1/products/{pid}", token=token)
    check("product detail 200", s == 200 and b.get("data", {}).get("id") == pid)
    new_name = f"{orig} {MARK} renamed"
    s, b = req("PUT", f"/api/v1/products/{pid}", {"name": new_name}, token=token)
    check("rename product (PUT, invalidates cache)", s == 200, str(b)[:200])
    s, b = req("GET", f"/api/v1/products/{pid}", token=token)
    check("no stale data — renamed product served after write",
          b.get("data", {}).get("name") == new_name, str(b.get("data", {}).get("name")))
    s, b = req("PUT", f"/api/v1/products/{pid}", {"name": orig}, token=token)
    check("restore original product name", s == 200, str(b)[:200])

    # financial endpoints must never populate the cache
    for ep in ("/api/v1/invoices?limit=3", "/api/v1/accounting/ledger?limit=3",
               "/api/v1/sales?limit=3", "/api/v1/accounting/journals?limit=3"):
        st, _ = req("GET", ep, token=token)
        check(f"financial endpoint reachable ({ep.split('?')[0]})", st in (200, 400, 404))
    s, b = req("GET", "/api/v1/system/cache/stats", token=token)
    cd = b.get("data", {})
    check("cache size did not grow from financial reads", cd.get("size", 0) <= c0 + 8,
          f"size {c0} → {cd.get('size')}")
    check("no financial namespace cached after financial reads", cd.get("financialNamespacesCached") == [])
    allowed = {"products", "customers", "price_lists", "tax", "permissions", "branches"}
    for ns in cd.get("namespaces", {}):
        check(f"cache namespace '{ns}' is whitelisted (non-financial)", ns in allowed)

    # 7. load test vs §25 targets (near-instant product search + customer lookup)
    lat = []
    for _ in range(25):
        t0 = time.perf_counter()
        req("GET", "/api/v1/products?search=coffee&limit=10", token=token)
        lat.append((time.perf_counter() - t0) * 1000)
    lat.sort()
    p95 = lat[min(len(lat) - 1, int(len(lat) * 0.95))]
    print(f"  ── load: product search avg={statistics.mean(lat):.0f}ms p50={statistics.median(lat):.0f}ms p95={p95:.0f}ms (target p95<300ms)")
    check("product search meets §25 target (p95 < 300ms)", p95 < 300, f"p95={p95:.0f}ms")
    lat2 = []
    for _ in range(20):
        t0 = time.perf_counter()
        req("GET", "/api/v1/customers?search=rahim&limit=10", token=token)
        lat2.append((time.perf_counter() - t0) * 1000)
    lat2.sort()
    p95b = lat2[min(len(lat2) - 1, int(len(lat2) * 0.95))]
    print(f"  ── load: customer lookup avg={statistics.mean(lat2):.0f}ms p95={p95b:.0f}ms (target p95<300ms)")
    check("customer lookup meets §25 target (p95 < 300ms)", p95b < 300, f"p95={p95b:.0f}ms")

    s, b = req("GET", "/api/v1/system/performance", token=token)
    pd = b.get("data", {})
    check("performance endpoint reports latency + targets",
          "latency" in pd and "p95Ms" in pd.get("latency", {}) and "targets" in pd)

    # ── cleanup rows created by this test ──
    with sync_engine.connect() as c:
        tid = c.execute(text("SELECT id FROM tenants WHERE slug='demo-shop'")).first()[0]
        c.execute(text("DELETE FROM background_jobs WHERE tenantId=:t"), {"t": tid})
        trows = c.execute(text("SELECT id FROM recurring_expenses WHERE tenantId=:t AND name LIKE :m"),
                          {"t": tid, "m": f"{MARK}%"}).fetchall()
        for (rid,) in trows:
            c.execute(text("DELETE FROM expenses WHERE tenantId=:t AND recurringExpenseId=:r"),
                      {"t": tid, "r": rid})
            c.execute(text("DELETE FROM recurring_expenses WHERE id=:r"), {"r": rid})
        c.execute(text("DELETE FROM products WHERE tenantId=:t AND sku LIKE 'P39-%'"), {"t": tid})
        c.execute(text("DELETE FROM inapp_notifications WHERE tenantId=:t AND title LIKE :m"),
                  {"t": tid, "m": f"{MARK}%"})
        c.commit()

    ok_server.shutdown()
    fail_server.shutdown()
    print(f"\nPrompt 39 E2E: {passed} checks, {len(FAILS)} failures")
    if FAILS:
        for f in FAILS:
            print(f"  ✗ {f}")
        sys.exit(1)
    print("ALL PASSED ✓")


def sql_count_expenses_for(template_id):
    if not template_id:
        return 0
    with sync_engine.connect() as c:
        r = c.execute(text("SELECT COUNT(*) FROM expenses WHERE recurringExpenseId=:r"),
                      {"r": template_id}).first()
        return int(r[0])


if __name__ == "__main__":
    main()
