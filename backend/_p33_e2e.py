"""Prompt 33 — Omnichannel & E-commerce Integration: E2E Verification.

Run:  venv/bin/python _p33_e2e.py   (server must be up on :4000)

Covers:
  1. Order Channels (CRUD + toggle)
  2. Online Order Flow (create, list, filter, lifecycle)
  3. Marketplace Adapters (CRUD, sync products/orders/inventory, logs)
  4. Kiosk Sessions (create, cart, checkout)
  5. QR Menu Ordering (create menu, browse products, place order)
  6. Validation edge cases
"""
import json
import uuid
import urllib.error
import urllib.request

from db import sync_engine
from sqlalchemy import text

BASE = "http://localhost:4000"
PASSED = []
MARK = "P33"


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


def uid():
    return str(uuid.uuid4())


def sql_exec(stmt, **p):
    with sync_engine.connect() as c:
        c.execute(text(stmt), p)
        c.commit()


def sql_scalar(stmt, **p):
    with sync_engine.connect() as c:
        return c.execute(text(stmt), p).scalar()


# Login as admin
st, d = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
assert st == 200, d
H = {"Authorization": f"Bearer {d['token']}", "x-tenant-id": d["tenant"]["slug"]}
TENANT = d["tenant"]["id"]
print(f"tenant={TENANT} slug={d['tenant']['slug']}")


# Get existing product, branch, warehouse
st, prods = call("GET", "/api/v1/products", hdrs=H)
product_list = prods.get("data", []) if st == 200 else []
check("products available", len(product_list) > 0, str(prods)[:200])
PID = product_list[0]["id"]

st, brs = call("GET", "/api/v1/branches", hdrs=H)
branches = brs.get("data", []) if st == 200 else []
BID = branches[0]["id"] if branches else None

st, whs = call("GET", "/api/v1/warehouses", hdrs=H)
warehouses = whs.get("data", []) if st == 200 else []
WID = warehouses[0]["id"] if warehouses else None


# ═══════════════ 1. ORDER CHANNELS ═══════════════
print("\n== 1. Order Channels ==")

ch_code = f"TCH_{MARK}"
st, r = call("POST", "/api/v1/channels", {"code": ch_code, "name": "Test Channel", "isEnabled": True}, hdrs=H)
check("create channel", st in (200, 201), str(r)[:200])

st, r = call("GET", "/api/v1/channels", hdrs=H)
channels = r.get("data", []) if st == 200 else []
test_ch = [c for c in channels if c.get("code") == ch_code]
check("channel appears in list", len(test_ch) > 0, str(r)[:200])

st, r = call("PATCH", f"/api/v1/channels/{ch_code}", {"isEnabled": False}, hdrs=H)
check("disable channel", st == 200, str(r)[:200])

st, r = call("PATCH", f"/api/v1/channels/{ch_code}", {"isEnabled": True}, hdrs=H)
check("re-enable channel", st == 200, str(r)[:200])


# ═══════════════ 2. ONLINE ORDER FLOW ═══════════════
print("\n== 2. Online Order Flow ==")

order1_id = None
st, r = call("POST", "/api/v1/omnichannel/orders", {
    "channel": "WEBSITE",
    "customerName": "Online Customer",
    "customerPhone": f"0171{MARK}111",
    "customerEmail": "online@test.com",
    "items": [{"productId": PID, "qty": 2, "unitPrice": 100}],
    "shippingAddress": "123 Test St, Dhaka",
    "paymentMethod": "COD",
    "branchId": BID,
    "warehouseId": WID,
}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create website order", st in (200, 201) and "orderId" in data, str(r)[:300])
order1_id = data.get("orderId")
order1_no = data.get("orderNo")
check("order has total", "total" in data and data["total"] == 200, str(data)[:200])
print(f"     Order: {order1_no}")

# List orders
st, r = call("GET", "/api/v1/omnichannel/orders", hdrs=H)
od = r.get("data", {}) if st == 200 else {}
order_list = od.get("items", []) if isinstance(od, dict) else od
check("list orders", st == 200 and isinstance(order_list, list), str(r)[:200])
check("order count >= 1", od.get("total", 0) >= 1 if isinstance(od, dict) else False, str(r)[:200])

# Filter by status
st, r = call("GET", "/api/v1/omnichannel/orders?status=RECEIVED", hdrs=H)
check("filter orders by status", st == 200, str(r)[:200])

# Advance lifecycle
if order1_id:
    for status in ["VALIDATED", "ALLOCATED", "SHIPPED", "DELIVERED"]:
        st, r = call("PATCH", f"/api/v1/omnichannel/orders/{order1_id}/status", {"status": status}, hdrs=H)
        check(f"advance to {status}", st == 200, str(r)[:200])

    # Can't go back from DELIVERED
    st, r = call("PATCH", f"/api/v1/omnichannel/orders/{order1_id}/status", {"status": "SHIPPED"}, hdrs=H)
    check("reject advance from DELIVERED", st == 400, str(r)[:200])

# Mobile order
st, r = call("POST", "/api/v1/omnichannel/orders", {
    "channel": "MOBILE",
    "customerName": "Mobile Customer",
    "customerPhone": f"0172{MARK}222",
    "items": [{"productId": PID, "qty": 1, "unitPrice": 50}],
    "paymentMethod": "BKASH",
}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create mobile order", st in (200, 201) and "orderId" in data, str(r)[:200])
order2_id = data.get("orderId")

# Cancel an order
if order2_id:
    st, r = call("PATCH", f"/api/v1/omnichannel/orders/{order2_id}/status", {"status": "CANCELLED"}, hdrs=H)
    check("cancel order", st == 200, str(r)[:200])

# Phone order
st, r = call("POST", "/api/v1/omnichannel/orders", {
    "channel": "PHONE",
    "customerName": "Phone Customer",
    "customerPhone": f"0173{MARK}333",
    "items": [{"productId": PID, "qty": 3, "unitPrice": 75}],
}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create phone order", st in (200, 201) and "orderId" in data, str(r)[:200])
order3_id = data.get("orderId")


# ═══════════════ 3. MARKETPLACE ADAPTERS ═══════════════
print("\n== 3. Marketplace Adapters ==")

st, r = call("POST", "/api/v1/marketplace/adapters", {
    "platform": "SHOPIFY", "name": f"Shopify {MARK}",
    "config": {"shopUrl": "mystore.myshopify.com", "accessToken": "shpat_xxx"}
}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create Shopify adapter", st in (200, 201) and "id" in data, str(r)[:200])
ad1_id = data.get("id")

st, r = call("POST", "/api/v1/marketplace/adapters", {
    "platform": "WOOCOMMERCE", "name": f"Woo {MARK}",
    "config": {"siteUrl": "https://woo.example.com"}
}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create WooCommerce adapter", st in (200, 201) and "id" in data, str(r)[:200])
ad2_id = data.get("id")

# Invalid platform
st, r = call("POST", "/api/v1/marketplace/adapters", {"platform": "INVALID"}, hdrs=H)
check("reject invalid platform", st == 400, str(r)[:200])

# List
st, r = call("GET", "/api/v1/marketplace/adapters", hdrs=H)
adapters = r.get("data", []) if st == 200 else []
check("list adapters", st == 200 and isinstance(adapters, list), str(r)[:200])
check("adapter count >= 2", len(adapters) >= 2, f"got {len(adapters)}")

# Update
if ad1_id:
    st, r = call("PATCH", f"/api/v1/marketplace/adapters/{ad1_id}", {"status": "ACTIVE"}, hdrs=H)
    check("activate adapter", st == 200, str(r)[:200])

# Sync products
if ad1_id:
    st, r = call("POST", f"/api/v1/marketplace/adapters/{ad1_id}/sync/products", hdrs=H)
    data = r.get("data", {}) if st == 200 else {}
    check("sync products from Shopify", st == 200 and "synced" in data, str(r)[:200])

# Sync orders
if ad1_id:
    st, r = call("POST", f"/api/v1/marketplace/adapters/{ad1_id}/sync/orders", hdrs=H)
    data = r.get("data", {}) if st == 200 else {}
    check("sync orders from marketplace", st == 200 and "imported" in data, str(r)[:200])

# Push inventory
if ad1_id:
    st, r = call("POST", f"/api/v1/marketplace/adapters/{ad1_id}/sync/inventory", hdrs=H)
    data = r.get("data", {}) if st == 200 else {}
    check("push inventory to marketplace", st == 200 and "pushed" in data, str(r)[:200])

# View sync logs
if ad1_id:
    st, r = call("GET", f"/api/v1/marketplace/adapters/{ad1_id}/sync-logs", hdrs=H)
    logs = r.get("data", []) if st == 200 else []
    check("view sync logs", st == 200 and isinstance(logs, list), str(r)[:200])
    check("sync log entries >= 2", len(logs) >= 2, f"got {len(logs)}")

# Delete adapter
if ad2_id:
    st, r = call("DELETE", f"/api/v1/marketplace/adapters/{ad2_id}", hdrs=H)
    check("delete adapter", st == 200, str(r)[:200])


# ═══════════════ 4. KIOSK MODE ═══════════════
print("\n== 4. Kiosk Mode ==")

st, r = call("POST", "/api/v1/kiosk/sessions", {"branchId": BID, "kioskId": f"K-{MARK}"}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("start kiosk session", st in (200, 201) and "sessionId" in data, str(r)[:200])
ks_id = data.get("sessionId")

if ks_id:
    # Add items to cart
    st, r = call("PATCH", f"/api/v1/kiosk/sessions/{ks_id}/cart", {
        "items": [
            {"productId": PID, "qty": 1, "unitPrice": 100},
            {"productId": PID, "qty": 2, "unitPrice": 50},
        ]
    }, hdrs=H)
    data = r.get("data", {}) if st == 200 else {}
    check("update kiosk cart", st == 200 and "total" in data, str(r)[:200])
    check("cart total = 200", data.get("total") == 200, str(data)[:200])

    # Checkout
    st, r = call("POST", f"/api/v1/kiosk/sessions/{ks_id}/checkout", {"paymentMethod": "CASH"}, hdrs=H)
    data = r.get("data", {}) if st == 200 else {}
    check("kiosk checkout", st == 200 and "orderId" in data, str(r)[:200])
    kiosk_order_id = data.get("orderId")

# List sessions
st, r = call("GET", "/api/v1/kiosk/sessions", hdrs=H)
sessions = r.get("data", []) if st == 200 else []
check("list kiosk sessions", st == 200 and isinstance(sessions, list), str(r)[:200])
check("kiosk session count >= 1", len(sessions) >= 1, f"got {len(sessions)}")


# ═══════════════ 5. QR MENU ORDERING ═══════════════
print("\n== 5. QR Menu Ordering ==")

st, r = call("POST", "/api/v1/qr/menus", {"name": f"QR Menu {MARK}", "branchId": BID}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create QR menu", st in (200, 201) and "id" in data, str(r)[:200])
qr_menu_id = data.get("id")

# List menus
st, r = call("GET", "/api/v1/qr/menus", hdrs=H)
menus = r.get("data", []) if st == 200 else []
check("list QR menus", st == 200 and isinstance(menus, list), str(r)[:200])

# Get menu products (public — no auth)
if qr_menu_id:
    st, r = call("GET", f"/api/v1/qr/menus/{qr_menu_id}/products", hdrs={})
    data = r.get("data", {}) if st == 200 else {}
    products = data.get("products", []) if isinstance(data, dict) else []
    check("QR menu products (public)", st == 200 and isinstance(products, list), str(r)[:200])

    # Place QR order (public)
    if products:
        st, r = call("POST", "/api/v1/qr/orders", {
            "menuId": qr_menu_id,
            "items": [{"productId": products[0]["id"], "qty": 2, "unitPrice": products[0]["sellingPrice"]}],
        }, hdrs={})
        data = r.get("data", {}) if st in (200, 201) else {}
        check("place QR order (public)", st in (200, 201) and "orderId" in data, str(r)[:200])
        check("QR order has total", "total" in data, str(data)[:200])
        print(f"     QR order: {data.get('orderNo')} total={data.get('total')}")

# Non-existent menu
st, r = call("GET", "/api/v1/qr/menus/nonexistent/products", hdrs={})
check("reject non-existent QR menu", st == 404, str(r)[:200])

# Empty items
st, r = call("POST", "/api/v1/qr/orders", {"menuId": qr_menu_id or "x", "items": []}, hdrs={})
check("reject empty QR order", st == 400, str(r)[:200])


# ═══════════════ 6. VALIDATION & EDGE CASES ═══════════════
print("\n== 6. Validation & Edge Cases ==")

# Empty items for online order
st, r = call("POST", "/api/v1/omnichannel/orders", {"items": []}, hdrs=H)
check("reject empty online order", st == 400, str(r)[:200])

# Invalid status transition
if order1_id:
    st, r = call("PATCH", f"/api/v1/omnichannel/orders/{order1_id}/status", {"status": "INVALID"}, hdrs=H)
    check("reject invalid status", st == 400, str(r)[:200])

# Non-existent adapter update
st, r = call("PATCH", "/api/v1/marketplace/adapters/nonexistent", {"status": "ACTIVE"}, hdrs=H)
check("404 on non-existent adapter", st == 404, str(r)[:200])

# Delete non-existent adapter (idempotent — uses DELETE which returns 200 even if nothing deleted)
st, r = call("DELETE", "/api/v1/marketplace/adapters/nonexistent", hdrs=H)
check("idempotent delete", st == 200, str(r)[:200])

# Kiosk checkout with empty cart
ks_empty = call("POST", "/api/v1/kiosk/sessions", {"branchId": BID, "kioskId": f"K-{MARK}-E"}, hdrs=H)
ks_empty_id = (ks_empty[1].get("data") or {}).get("sessionId") if ks_empty[0] in (200, 201) else None
if ks_empty_id:
    st, r = call("POST", f"/api/v1/kiosk/sessions/{ks_empty_id}/checkout", {"paymentMethod": "CASH"}, hdrs=H)
    check("reject empty cart checkout", st == 400, str(r)[:200])

# Non-existent kiosk session checkout
st, r = call("POST", "/api/v1/kiosk/sessions/nonexistent/checkout", {"paymentMethod": "CASH"}, hdrs=H)
check("404 on non-existent kiosk", st == 404, str(r)[:200])


# ═══════════════ CLEANUP ═══════════════
print("\n== cleanup ==")

try:
    sql_exec("DELETE FROM channel_orders WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM sales_order_items WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM kiosk_sessions WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM qr_menus WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM marketplace_adapters WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM marketplace_sync_log WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM order_channels WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM delivery_orders WHERE tenantId=:t AND saleId IN (SELECT id FROM sales_orders WHERE tenantId=:t AND (orderNo LIKE 'ORD-%' OR orderNo LIKE 'KIO-%' OR orderNo LIKE 'QR-%'))", t=TENANT)
    sql_exec("DELETE FROM sales_orders WHERE tenantId=:t AND (orderNo LIKE 'ORD-%' OR orderNo LIKE 'KIO-%' OR orderNo LIKE 'QR-%')", t=TENANT)
    sql_exec("DELETE FROM customers WHERE tenantId=:t AND phone LIKE :p", t=TENANT, p=f"%{MARK}%")
except Exception as e:
    print(f"  Warning: cleanup partial: {e}")

print("  Cleanup done")


# ═══════════════ SUMMARY ═══════════════
print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 33 — Omnichannel & E-commerce Integration: VERIFIED")
print(f"{'='*60}")
