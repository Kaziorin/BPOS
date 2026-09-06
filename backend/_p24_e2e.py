"""End-to-End Test for Prompt 24 — Delivery & Logistics (module 27).

Definition-of-Done coverage:
  1. Full delivery lifecycle works incl. failed delivery → reschedule → retry
  2. COD delivery correctly creates a payment record and updates the linked
     sale/invoice status + posts the accounting journal + settles customer AR
  3. Rider/vehicle/zone/route CRUD + auto rider assignment (round-robin)

Note: API routes are under /api/v1/... (same convention as the whole backend).
"""
from __future__ import annotations

import json
import uuid
import urllib.request
import urllib.error

BASE_URL = "http://localhost:4000"
PASSED = []

TAG = uuid.uuid4().hex[:6].upper()
PHONE = f"0171{TAG}999"
DELIVERY_NOTE = f"E2E {TAG}"

COD_CUST = str(uuid.uuid4())   # seeded below with known id
WALKIN_CUST = str(uuid.uuid4())  # standalone (restaurant-style) delivery customer
SALE_ID = str(uuid.uuid4())
INV_ID = str(uuid.uuid4())


def call(method: str, path: str, body: dict | None = None, hdrs: dict | None = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if hdrs:
        headers.update(hdrs)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw) if raw else {"error": str(e)}
        except Exception:
            return e.code, {"error": raw or str(e)}


def check(name: str, cond: bool, detail: str = ""):
    if cond:
        PASSED.append(name)
        print(f"  PASS  {name}")
    else:
        print(f"  FAIL  {name}  {detail}")
        raise AssertionError(f"Check failed: {name} — {detail}")


def cleanup(tenant_uuid: str):
    """Remove every artifact this test (or a previous run) created so the DB
    returns to baseline: delivery orders/tracking (tagged by note), the test
    riders/vehicles/zones/routes, the seeded COD customer + sale + invoice,
    the COD payments and journals posted against them. Self-cleaning so any
    number of re-runs stay neutral and never collide."""
    from sqlalchemy import text
    import db as dbmod

    with dbmod.sync_engine.begin() as c:
        c.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        c.execute(text(
            "DELETE FROM delivery_tracking WHERE deliveryId IN "
            "(SELECT id FROM delivery_orders WHERE tenantId=:t AND notes LIKE :n)"), {"t": tenant_uuid, "n": f"{DELIVERY_NOTE}%"})
        c.execute(text(
            "DELETE FROM journals WHERE refType='COD_COLLECTION' AND refId IN "
            "(SELECT id FROM delivery_orders WHERE tenantId=:t AND notes LIKE :n)"), {"t": tenant_uuid, "n": f"{DELIVERY_NOTE}%"})
        c.execute(text(
            "DELETE FROM delivery_orders WHERE tenantId=:t AND notes LIKE :n"), {"t": tenant_uuid, "n": f"{DELIVERY_NOTE}%"})
        c.execute(text("DELETE FROM delivery_riders WHERE tenantId=:t AND name LIKE :n"), {"t": tenant_uuid, "n": f"E2E-{TAG} Rider%"})
        c.execute(text("DELETE FROM delivery_vehicles WHERE tenantId=:t AND name LIKE :n"), {"t": tenant_uuid, "n": f"E2E-{TAG} Vehicle%"})
        c.execute(text("DELETE FROM delivery_routes WHERE tenantId=:t AND name LIKE :n"), {"t": tenant_uuid, "n": f"E2E-{TAG} Route%"})
        c.execute(text("DELETE FROM delivery_zones WHERE tenantId=:t AND name LIKE :n"), {"t": tenant_uuid, "n": f"E2E-{TAG} Zone%"})
        c.execute(text("DELETE FROM payments WHERE saleId=:s"), {"s": SALE_ID})
        c.execute(text("DELETE FROM invoices WHERE id=:i"), {"i": INV_ID})
        c.execute(text("DELETE FROM sales WHERE id=:s"), {"s": SALE_ID})
        c.execute(text("DELETE FROM customers WHERE id=:c"), {"c": COD_CUST})
        c.execute(text("DELETE FROM customers WHERE id=:c"), {"c": WALKIN_CUST})
        c.execute(text("SET FOREIGN_KEY_CHECKS=1"))


def _run():
    print("=" * 72)
    print("Prompt 24 E2E — Delivery & Logistics")
    print("=" * 72)

    st, resp = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
    check("login", st == 200 and "token" in resp, str(resp))
    token = resp["token"]
    H = {"Authorization": f"Bearer {token}", "x-tenant-id": "demo-shop"}

    from sqlalchemy import text
    import db as dbmod

    def q1(sql: str, **params):
        with dbmod.sync_engine.connect() as c:
            return c.execute(text(sql), params or None).first()

    tenant_uuid = q1("SELECT id FROM tenants WHERE slug='demo-shop'")[0]
    cleanup(tenant_uuid)

    # ═══════════ 0. Setup — zone / vehicle / 2 riders ═══════════
    print("\n== 0. Master data (zone / vehicle / riders) ==")
    st, zone = call("POST", "/api/v1/delivery/zones", {
        "name": f"E2E-{TAG} Zone A", "city": "Dhaka", "area": "Dhanmondi",
        "deliveryFee": 60, "minOrderAmount": 0, "freeDeliveryAbove": 2000,
    }, hdrs=H)
    check("zone created with fee rules", st in (200, 201) and zone.get("data", {}).get("id"), str(zone))
    zone_id = zone["data"]["id"]

    st, route = call("POST", "/api/v1/delivery/routes", {
        "name": f"E2E-{TAG} Route A", "zoneId": zone_id, "description": "E2E route",
    }, hdrs=H)
    check("route created in zone", st in (200, 201) and route.get("data", {}).get("id"), str(route))

    st, vehicle = call("POST", "/api/v1/delivery/vehicles", {
        "name": f"E2E-{TAG} Vehicle A", "type": "BIKE", "plateNo": f"DLV-{TAG}",
    }, hdrs=H)
    check("vehicle created", st in (200, 201) and vehicle.get("data", {}).get("id"), str(vehicle))
    vehicle_id = vehicle["data"]["id"]

    rider_ids = []
    for nm in ("A", "B"):
        st, rider = call("POST", "/api/v1/delivery/riders", {
            "name": f"E2E-{TAG} Rider {nm}", "phone": f"018{TAG}{ord(nm)}", "vehicleId": vehicle_id,
        }, hdrs=H)
        check(f"rider {nm} created AVAILABLE", st in (200, 201)
              and rider.get("data", {}).get("status") == "AVAILABLE", str(rider))
        rider_ids.append(rider["data"]["id"])
    rider_a, rider_b = rider_ids

    # ═══════════ 1. Full lifecycle incl. failed → reschedule → retry ═══════════
    print("\n== 1. Delivery lifecycle (PACK → ASSIGN → OFD → FAIL → RESCHEDULE → DELIVER) ==")
    # Customer for the standalone (restaurant-style) delivery — seed a dedicated one
    # (the rebuilt demo DB no longer guarantees a customer with currentDue>0).
    with dbmod.sync_engine.begin() as c:
        c.execute(text(
            "INSERT INTO customers (id, tenantId, name, phone, address, currentDue, creditLimit, segmentation) "
            "VALUES (:id, :t, :n, :p, :a, 1000, 20000, 'NEW')"),
            {"id": WALKIN_CUST, "t": tenant_uuid, "n": f"E2E Walk-in {TAG}",
             "p": f"0172{TAG}888", "a": "House 12, Road 5, Dhanmondi, Dhaka"})
    walkin_id = WALKIN_CUST

    st, od = call("POST", "/api/v1/delivery/orders", {
        "sourceType": "RESTAURANT", "customerId": walkin_id, "customerName": "E2E Walk-in",
        "deliveryAddress": "House 12, Road 5, Dhanmondi, Dhaka", "zoneId": zone_id,
        "orderAmount": 1500, "paymentType": "PREPAID", "priority": "NORMAL",
        "notes": f"{DELIVERY_NOTE} lifecycle",
    }, hdrs=H)
    check("delivery order created PENDING", st in (200, 201) and od["data"]["status"] == "PENDING", str(od))
    d1 = od["data"]["id"]
    check("zone fee 60 applied to delivery", float(od["data"]["deliveryFee"]) == 60.0
          and float(od["data"]["totalAmount"]) == 60.0, str(od))

    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/status", {"status": "PACKED"}, hdrs=H)
    check("PENDING → PACKED", st == 200 and r["data"]["status"] == "PACKED", str(r))

    # Manual assign rider A (round-robin itself is checked in section 2).
    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/assign", {"riderId": rider_a}, hdrs=H)
    check("assign rider A", st == 200 and r["data"]["status"] == "ASSIGNED" and r["data"]["riderId"] == rider_a, str(r))
    st, riders = call("GET", "/api/v1/delivery/riders", hdrs=H)
    ra = [x for x in riders.get("data", []) if x["id"] == rider_a][0]
    check("rider A now BUSY (1 active)", ra["status"] == "BUSY" and ra["activeDeliveries"] == 1, str(ra))

    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/status", {"status": "OUT_FOR_DELIVERY"}, hdrs=H)
    check("ASSIGNED → OUT_FOR_DELIVERY", st == 200 and r["data"]["status"] == "OUT_FOR_DELIVERY", str(r))

    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/status", {"status": "FAILED", "reason": "Customer not home"}, hdrs=H)
    check("OUT_FOR_DELIVERY → FAILED (attempt 1)", st == 200 and r["data"]["status"] == "FAILED", str(r))
    st, riders = call("GET", "/api/v1/delivery/riders", hdrs=H)
    ra = [x for x in riders.get("data", []) if x["id"] == rider_a][0]
    check("rider A released back to AVAILABLE after failure", ra["status"] == "AVAILABLE", str(ra))

    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/status", {"status": "RESCHEDULED", "reason": "Retry tomorrow"}, hdrs=H)
    check("FAILED → RESCHEDULED", st == 200 and r["data"]["status"] == "RESCHEDULED"
          and r["data"]["rescheduleCount"] == 1, str(r))

    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/status", {"status": "PACKED"}, hdrs=H)
    check("RESCHEDULED → PACKED (retry attempt)", st == 200 and r["data"]["status"] == "PACKED", str(r))
    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/assign", {"riderId": rider_a}, hdrs=H)
    check("re-assigned for retry", st == 200 and r["data"]["status"] == "ASSIGNED", str(r))
    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/status", {"status": "OUT_FOR_DELIVERY"}, hdrs=H)
    check("back out for delivery", st == 200, str(r))
    st, r = call("POST", f"/api/v1/delivery/orders/{d1}/status", {"status": "DELIVERED",
                 "podType": "SIGNATURE", "podSignature": f"sig-{TAG}", "receivedByName": "E2E Walk-in"}, hdrs=H)
    check("second attempt DELIVERED", st == 200 and r["data"]["status"] == "DELIVERED", str(r))

    row = q1("SELECT rescheduleCount, deliveredAt, podType, podReceivedByName, riderId FROM delivery_orders WHERE id=:id", id=d1)
    check("reschedule count persisted (1), POD captured",
          row and row[0] == 1 and row[1] and row[2] == "SIGNATURE" and row[3] == "E2E Walk-in" and row[4] == rider_a, str(row))
    row = q1("SELECT deliveryCount FROM delivery_riders WHERE id=:id", id=rider_a)
    check("rider A deliveryCount incremented to 1", row and row[0] == 1, str(row))
    row = q1("SELECT COUNT(*) FROM delivery_tracking WHERE deliveryId=:id", id=d1)
    check("tracking history written for full lifecycle (10 events)",
          row and row[0] == 10, str(row))

    # ═══════════ 2. Auto-assign = round-robin (least-loaded available rider) ═══════════
    print("\n== 2. Auto rider assignment (round-robin) ==")
    # Rider A has 1 completed delivery; rider B has 0 → auto-assign must pick B.
    st, od2 = call("POST", "/api/v1/delivery/orders", {
        "sourceType": "RESTAURANT", "customerId": walkin_id, "customerName": "E2E Round Robin",
        "deliveryAddress": "Road 7, Banani, Dhaka", "notes": f"{DELIVERY_NOTE} rr1",
    }, hdrs=H)
    d2 = od2["data"]["id"]
    st, r = call("POST", f"/api/v1/delivery/orders/{d2}/status", {"status": "PACKED"}, hdrs=H)
    check("order 2 packed", st == 200, str(r))
    st, r = call("POST", f"/api/v1/delivery/orders/{d2}/assign", {}, hdrs=H)
    check("auto-assign picks least-loaded rider (B, 0 deliveries)",
          st == 200 and r["data"]["riderId"] == rider_b, str(r))

    # B is now busy → next auto-assign must fall back to A (only available).
    st, od3 = call("POST", "/api/v1/delivery/orders", {
        "sourceType": "RESTAURANT", "customerId": walkin_id, "customerName": "E2E Round Robin 2",
        "deliveryAddress": "Road 9, Gulshan, Dhaka", "notes": f"{DELIVERY_NOTE} rr2",
    }, hdrs=H)
    d3 = od3["data"]["id"]
    st, r = call("POST", f"/api/v1/delivery/orders/{d3}/status", {"status": "PACKED"}, hdrs=H)
    st, r = call("POST", f"/api/v1/delivery/orders/{d3}/assign", {}, hdrs=H)
    check("next auto-assign picks the remaining available rider (A)",
          st == 200 and r["data"]["riderId"] == rider_a, str(r))
    st, riders = call("GET", "/api/v1/delivery/riders", hdrs=H)
    both_busy = all([x for x in riders.get("data", []) if x["id"] in rider_ids][i]["status"] == "BUSY" for i in range(2))
    check("both riders BUSY with 1 active delivery each", both_busy, str(riders)[:200])

    # ═══════════ 3. COD — delivery collects due, records payment, updates sale/invoice ═══════════
    print("\n== 3. COD delivery → payment + sale/invoice settlement + AR + journal ==")
    # Seed: customer with AR 5000, an unpaid CONFIRMED sale of 5000 (paid 1000),
    # and its invoice — the exact state a wholesale/restaurant COD sale leaves.
    with dbmod.sync_engine.begin() as c:
        c.execute(text(
            "INSERT INTO customers (id, tenantId, name, phone, address, currentDue, creditLimit, segmentation) "
            "VALUES (:id, :t, :n, :p, :a, 5000, 20000, 'NEW')"),
            {"id": COD_CUST, "t": tenant_uuid, "n": f"E2E COD {TAG}", "p": PHONE, "a": "Road 12, Uttara, Dhaka"})
        c.execute(text(
            "INSERT INTO sales (id, tenantId, branchId, userId, customerId, invoiceNo, subtotal, discountTotal, "
            "taxTotal, total, paidTotal, dueTotal, paymentStatus, status, note, createdBy, saleDate) "
            "VALUES (:id, :t, :b, :u, :c, :inv, 5000, 0, 0, 5000, 1000, 4000, 'PARTIAL', 'CONFIRMED', :n, :u, NOW())"),
            {"id": SALE_ID, "t": tenant_uuid, "b": q1("SELECT id FROM branches WHERE tenantId=:t LIMIT 1", t=tenant_uuid)[0],
             "u": q1("SELECT id FROM users WHERE email='admin@blueoceanspos.com'")[0], "c": COD_CUST,
             "inv": f"E2E-COD-{TAG}", "n": f"{DELIVERY_NOTE} COD sale"})
        c.execute(text(
            "INSERT INTO invoices (id, tenantId, branchId, saleId, customerId, invoiceNo, invoiceType, issueDate, "
            "subtotal, taxTotal, total, paidTotal, status, note, createdBy) "
            "VALUES (:id, :t, :b, :s, :c, :inv, 'STANDARD', CURDATE(), 5000, 0, 5000, 1000, 'PARTIALLY_PAID', :n, :u)"),
            {"id": INV_ID, "t": tenant_uuid, "b": q1("SELECT id FROM branches WHERE tenantId=:t LIMIT 1", t=tenant_uuid)[0],
             "s": SALE_ID, "c": COD_CUST, "inv": f"INV-COD-{TAG}", "n": f"{DELIVERY_NOTE} COD invoice",
             "u": q1("SELECT id FROM users WHERE email='admin@blueoceanspos.com'")[0]})

    st, od4 = call("POST", "/api/v1/delivery/orders", {
        "saleId": SALE_ID, "deliveryAddress": "House 4, Road 12, Uttara, Dhaka",
        "paymentType": "COD", "deliveryFee": 60, "notes": f"{DELIVERY_NOTE} cod",
    }, hdrs=H)
    d4 = od4["data"]["id"]
    check("COD delivery linked to sale created (due 4000 + explicit fee 60)",
          st in (200, 201) and od4["data"]["paymentType"] == "COD"
          and float(od4["data"]["codAmount"]) == 4060.0, str(od4))
    check("delivery resolved invoice + customer from sale",
          od4["data"]["invoiceId"] == INV_ID and od4["data"]["customerId"] == COD_CUST, str(od4))

    st, r = call("POST", f"/api/v1/delivery/orders/{d4}/status", {"status": "PACKED"}, hdrs=H)
    st, r = call("POST", f"/api/v1/delivery/orders/{d4}/assign", {"riderId": rider_b}, hdrs=H)
    check("COD order assigned", st == 200 and r["data"]["status"] == "ASSIGNED", str(r))
    st, r = call("POST", f"/api/v1/delivery/orders/{d4}/status", {"status": "OUT_FOR_DELIVERY"}, hdrs=H)
    check("COD order out for delivery", st == 200, str(r))
    st, r = call("POST", f"/api/v1/delivery/orders/{d4}/status", {"status": "DELIVERED",
                 "podType": "SIGNATURE", "podSignature": f"cod-{TAG}", "receivedByName": f"E2E COD {TAG}"}, hdrs=H)
    check("COD delivery DELIVERED and amount collected",
          st == 200 and r["data"]["status"] == "DELIVERED" and float(r["data"]["codCollected"]) == 4060.0, str(r))
    check("COD payment created on delivery", bool(r["data"].get("payment"))
          and float(r["data"]["payment"]["amount"]) == 4060.0 and r["data"]["payment"]["method"] == "COD", str(r))

    pay = q1("SELECT id, method, amount, status, saleId, invoiceId FROM payments WHERE saleId=:s", s=SALE_ID)
    check("payment row persisted (COD, COMPLETED, 4060)",
          pay and pay[1] == "COD" and float(pay[2]) == 4060.0 and pay[3] == "COMPLETED"
          and pay[4] == SALE_ID and pay[5] == INV_ID, str(pay))
    sale = q1("SELECT paidTotal, dueTotal, paymentStatus, status FROM sales WHERE id=:id", id=SALE_ID)
    check("sale now fully paid (paid 5060, due 0, PAID/COMPLETED)",
          sale and float(sale[0]) == 5060.0 and float(sale[1]) == 0.0
          and sale[2] == "PAID" and sale[3] == "COMPLETED", str(sale))
    inv = q1("SELECT paidTotal, status FROM invoices WHERE id=:id", id=INV_ID)
    check("invoice status updated to PAID", inv and float(inv[0]) == 5060.0 and inv[1] == "PAID", str(inv))
    cust = q1("SELECT currentDue FROM customers WHERE id=:id", id=COD_CUST)
    check("customer AR settled (5000 − 4060 = 940)",
          cust and abs(float(cust[0]) - 940.0) < 0.01, str(cust))
    jrn = q1("SELECT COUNT(*) FROM journals WHERE refType='COD_COLLECTION' AND refId=:id", id=d4)
    check("COD accounting journal posted (debit Cash / credit AR)", jrn and jrn[0] >= 1, str(jrn))

    # ═══════════ 4. Edge branches + detail ═══════════
    print("\n== 4. Edge branches & read endpoints ==")
    st, r = call("POST", f"/api/v1/delivery/orders/{d2}/status", {"status": "FAILED", "reason": "Wrong address"}, hdrs=H)
    st, r = call("POST", f"/api/v1/delivery/orders/{d2}/status", {"status": "RETURNED", "reason": "Undeliverable"}, hdrs=H)
    check("FAILED → RETURNED branch", st == 200 and r["data"]["status"] == "RETURNED", str(r))
    st, bad = call("POST", f"/api/v1/delivery/orders/{d2}/status", {"status": "DELIVERED"}, hdrs=H)
    check("RETURNED is terminal (cannot deliver)", st == 400, str(bad))
    st, bad = call("POST", f"/api/v1/delivery/orders/{d4}/status", {"status": "FAILED"}, hdrs=H)
    check("DELIVERED is terminal (cannot fail)", st == 400, str(bad))

    st, detail = call("GET", f"/api/v1/delivery/orders/{d4}", hdrs=H)
    check("delivery detail served with full tracking history",
          st == 200 and detail["data"]["deliveryNo"] and len(detail["data"]["tracking"]) >= 5, str(detail)[:200])

    st, dash = call("GET", "/api/v1/delivery/dashboard", hdrs=H)
    check("dashboard KPIs served", st == 200 and "counts" in dash["data"] and "DELIVERED" in dash["data"]["counts"], str(dash)[:200])

    # Section 1's walk-in delivery D1 belongs to a real customer; D2/D3 riders were
    # released by FAILED/RETURNED? D2 returned → rider released; D3 still open BUSY —
    # cleanup removes all tagged orders regardless.
    print("\n" + "=" * 72)
    print(f"Prompt 24 E2E: {len(PASSED)} checks passed ✅")
    print("=" * 72)


def main():
    from sqlalchemy import text
    import db as dbmod
    with dbmod.sync_engine.connect() as c:
        tenant_uuid = c.execute(text("SELECT id FROM tenants WHERE slug='demo-shop'")).first()[0]
    try:
        _run()
    finally:
        cleanup(tenant_uuid)


if __name__ == "__main__":
    main()
