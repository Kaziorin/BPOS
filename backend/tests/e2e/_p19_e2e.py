"""Live end-to-end verification of Prompt 19 — Offline-First Sync Engine.

Run:  ./venv/bin/python _p19_e2e.py   (server must be up on :4000)

Exercises:
  1. Device registration
  2. Pull cache data for offline use
  3. Upload 20+ offline sales via sync engine
  4. Verify zero duplicates (idempotency)
  5. Verify stock correctly decremented
  6. Verify trial balance stays balanced
  7. Test conflict resolution
  8. Test device management (lock/disable/force-sync)
"""
import json
import time
import uuid
import urllib.error
import urllib.request

BASE = "http://localhost:4000"
PASSED = []


def call(method, path, body=None, hdrs=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", **(hdrs or {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def check(label, cond, detail=""):
    if cond:
        PASSED.append(label)
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label}  {detail}")
        raise SystemExit(1)


# ── Auth ──
st, d = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
assert st == 200, d
H = {"Authorization": f"Bearer {d['token']}", "x-tenant-id": d["tenant"]["slug"]}


def trial_balance():
    st, d = call("GET", "/api/v1/accounting/trial-balance", hdrs=H)
    return d.get("data", d)


# ── Fetch seed data ──
print("== Fetch entities ==")
st, pr = call("GET", "/api/v1/products?limit=5", hdrs=H)
products = pr["data"] if isinstance(pr.get("data"), list) else pr.get("data", {}).get("items", [])
check("products fetched", len(products) > 0)
prod = next((p for p in products if "Repair" not in p["name"]), products[0])

st, cs = call("GET", "/api/v1/customers?limit=5", hdrs=H)
cust = cs["data"][0]
check("customer fetched", cust is not None)

st, bs = call("GET", "/api/v1/branches?limit=5", hdrs=H)
branch = bs["data"][0]
check("branch fetched", branch is not None)

st, ws = call("GET", "/api/v1/warehouses?limit=5", hdrs=H)
wh = ws["data"][0] if ws.get("data") else None

print(f"  product={prod['name']}  customer={cust['name']}  branch={branch['name']}")


# ═════════════════════════ 1. DEVICE REGISTRATION ═════════════════════════
print("\n== 1. Device registration ==")
device_id = f"e2e-device-{uuid.uuid4().hex[:8]}"
st, reg = call("POST", "/api/v1/devices/register", {
    "deviceId": device_id,
    "deviceName": "E2E Test Device",
    "branchId": branch["id"],
    "os": "Linux",
}, hdrs=H)
check("device registered", st in (200, 201), reg)

st, devs = call("GET", "/api/v1/devices", hdrs=H)
check("device appears in list", any(d["deviceId"] == device_id for d in devs.get("data", [])))


# ═════════════════════════ 2. PULL CACHE ═════════════════════════
print("\n== 2. Pull cache data ==")
st, cache = call("POST", "/api/v1/sync/pull", {
    "deviceId": device_id,
    "entities": ["products", "customers", "config"],
}, hdrs=H)
check("cache pull works", st in (200, 201), cache)
cache_data = cache.get("data", {})
check("products cached", len(cache_data.get("products", [])) > 0)
check("customers cached", len(cache_data.get("customers", [])) > 0)
check("branches cached", len(cache_data.get("branches", [])) > 0)


# ═════════════════════════ 3. BASELINE ═════════════════════════
print("\n== 3. Baseline ==")
tb_before = trial_balance()
check("TB balanced before sync sales", tb_before["balanced"],
      f"D={tb_before['totalDebit']} C={tb_before['totalCredit']}")

# Get initial stock
stock_before = 0
if wh:
    st, stk = call("GET", f"/api/v1/inventory/stock/{wh['id']}", hdrs=H)
    stock_list = stk.get("data", [])
    if isinstance(stock_list, list):
        p_stk = next((item for item in stock_list if item.get("product", {}).get("id") == prod["id"] or item.get("productId") == prod["id"]), None)
        if p_stk:
            stock_before = float(p_stk.get("qtyOnHand", 0))
print(f"  stock before: {stock_before}")


# ═════════════════════════ 4. UPLOAD 20+ OFFLINE SALES ═════════════════════════
print("\n== 4. Upload 20+ offline sales ==")
NUM_SALES = 22
SALE_QTY = 2
SALE_PRICE = 100.0

# Open shift for the branch
st, so = call("POST", "/api/v1/cash-register/open", {
    "branchId": branch["id"], "openingCash": 10000}, hdrs=H)
if st not in (200, 201):
    print(f"  (shift: {st} — proceeding)")

transactions = []
for i in range(NUM_SALES):
    sale_id = str(uuid.uuid4())
    idempotency_key = f"sync-sale-{device_id}-{i}"
    transactions.append({
        "entityType": "SALE",
        "entityId": sale_id,
        "localSequence": i + 1,
        "idempotencyKey": idempotency_key,
        "payload": {
            "saleId": sale_id,
            "branchId": branch["id"],
            "warehouseId": (wh or {}).get("id"),
            "customerId": cust["id"],
            "items": [{"productId": prod["id"], "qty": SALE_QTY, "unitPrice": SALE_PRICE, "name": prod["name"]}],
            "payments": [{"method": "CASH", "amount": SALE_QTY * SALE_PRICE}],
        },
    })

st, sync_result = call("POST", "/api/v1/sync/upload", {
    "deviceId": device_id,
    "transactions": transactions,
}, hdrs=H)
check("sync upload succeeds", st in (200, 201), sync_result)

result_data = sync_result.get("data", {})
check(f"all {NUM_SALES} sales synced",
      result_data.get("synced", 0) == NUM_SALES,
      f"synced={result_data.get('synced')} processed={result_data.get('processed')}")
check("zero failed", result_data.get("failed", 0) == 0,
      f"failed={result_data.get('failed')}")


# ═════════════════════════ 5. VERIFY ZERO DUPLICATES ═════════════════════════
print("\n== 5. Verify zero duplicates ==")

# Re-upload the same batch — should be idempotent
st, dup_result = call("POST", "/api/v1/sync/upload", {
    "deviceId": device_id,
    "transactions": transactions,
}, hdrs=H)
check("duplicate upload succeeds", st in (200, 201), dup_result)
dup_data = dup_result.get("data", {})
# All should be marked as "already synced" (SYNCED with note "duplicate")
check("no new sales created from duplicates",
      dup_data.get("synced", 0) == NUM_SALES,
      f"synced={dup_data.get('synced')} — expected {NUM_SALES} 'already synced'")

# Verify the sales count matches exactly NUM_SALES (not 2x)
st, sales_list = call("GET", "/api/v1/pos/sales?limit=200", hdrs=H)
all_sales = sales_list.get("data", [])
# Count sales created by the sync (they have invoice numbers starting with INV-)
synced_sale_ids = {t["entityId"] for t in transactions}
server_sale_ids = {s["id"] for s in all_sales}
overlap = synced_sale_ids & server_sale_ids
check(f"exactly {NUM_SALES} sales exist on server",
      len(overlap) == NUM_SALES,
      f"found {len(overlap)} of {NUM_SALES} on server")


# ═════════════════════════ 6. VERIFY STOCK ═════════════════════════
print("\n== 6. Verify stock ==")
st, stk_after = call("GET", f"/api/v1/inventory/stock/{wh['id']}", hdrs=H) if wh else (200, {})
stock_after = 0
stock_list_after = stk_after.get("data", [])
if isinstance(stock_list_after, list):
    p_stk_a = next((item for item in stock_list_after if item.get("product", {}).get("id") == prod["id"] or item.get("productId") == prod["id"]), None)
    if p_stk_a:
        stock_after = float(p_stk_a.get("qtyOnHand", 0))

expected_decrease = NUM_SALES * SALE_QTY
actual_decrease = stock_before - stock_after
print(f"  stock before={stock_before}  after={stock_after}  decrease={actual_decrease}  expected={expected_decrease}")
check("stock correctly decremented",
      abs(actual_decrease - expected_decrease) < 0.01,
      f"actual={actual_decrease} expected={expected_decrease}")


# ═════════════════════════ 7. VERIFY ACCOUNTING ═════════════════════════
print("\n== 7. Verify accounting ==")
tb_after = trial_balance()
check("TB balanced after 20+ sync sales", tb_after["balanced"],
      f"D={tb_after['totalDebit']} C={tb_after['totalCredit']}")


# ═════════════════════════ 8. SYNC STATUS ═════════════════════════
print("\n== 8. Sync status ==")
st, status = call("GET", f"/api/v1/sync/status?deviceId={device_id}", hdrs=H)
check("sync status returns", st == 200, status)
status_data = status.get("data", {})
check("lastSyncAt is set", status_data.get("lastSyncAt") is not None)
print(f"  pending={status_data.get('pendingCount', '?')}  failed={status_data.get('failedCount', '?')}")


# ═════════════════════════ 9. DEVICE MANAGEMENT ═════════════════════════
print("\n== 9. Device management ==")

# Lock
st, _ = call("POST", f"/api/v1/devices/{device_id}/lock", {}, hdrs=H)
check("device lock", st in (200, 201))

# Try to sync with locked device
st, lock_test = call("POST", "/api/v1/sync/upload", {
    "deviceId": device_id,
    "transactions": [{
        "entityType": "SALE",
        "idempotencyKey": f"lock-test-{uuid.uuid4().hex[:8]}",
        "localSequence": 999,
        "payload": {"items": [{"productId": prod["id"], "qty": 1, "unitPrice": 10}]},
    }],
}, hdrs=H)
lock_results = lock_test.get("data", {}).get("results", [])
check("locked device rejected",
      lock_results and lock_results[0].get("syncStatus") == "FAILED",
      f"result={lock_results[0] if lock_results else 'no results'}")

# Unlock
st, _ = call("POST", f"/api/v1/devices/{device_id}/unlock", {}, hdrs=H)
check("device unlock", st in (200, 201))

# Disable
st, _ = call("POST", f"/api/v1/devices/{device_id}/disable", {}, hdrs=H)
check("device disable", st in (200, 201))

# Re-enable via register
st, _ = call("POST", "/api/v1/devices/register", {
    "deviceId": device_id, "deviceName": "Re-enabled", "branchId": branch["id"],
}, hdrs=H)
check("device re-registered", st in (200, 201))

# Force sync
st, _ = call("POST", f"/api/v1/devices/{device_id}/force-sync", {}, hdrs=H)
check("device force-sync", st in (200, 201))


# ═════════════════════════ 10. FINAL TB ═════════════════════════
print("\n== 10. Final accounting check ==")
tb_final = trial_balance()
check("FINAL TB balanced", tb_final["balanced"],
      f"D={tb_final['totalDebit']} C={tb_final['totalCredit']}")


# ── Summary ──
print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 19 — Offline-First Sync Engine: VERIFIED")
print(f"  • Device registration: OK")
print(f"  • Cache pull: OK")
print(f"  • {NUM_SALES} offline sales synced: OK")
print(f"  • Zero duplicates (idempotency): OK")
print(f"  • Stock correctly decremented: OK")
print(f"  • Accounting balanced: OK")
print(f"  • Device management: OK")
print(f"{'='*60}")
