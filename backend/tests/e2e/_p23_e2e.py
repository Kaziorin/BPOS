"""End-to-End Test for Prompt 23 — Manufacturing / Salon / Repair / Franchise (§11.6/11.7/11.8/10.30).

Definition-of-Done coverage:
  1. Production order correctly consumes raw materials and produces finished stock
  2. Salon appointment booking + service sale + commission works end-to-end
  3. Repair ticket lifecycle works end-to-end with warranty linkage
  4. Franchise settlement calculates correctly across ≥2 franchise branches

Note: API routes are under /api/v1/... (same convention as the whole backend).
"""
from __future__ import annotations

import json
import uuid
import urllib.request
import urllib.error
from datetime import date

BASE_URL = "http://localhost:4000"
PASSED = []

OIL = "125c3824-1f54-44d8-99d4-1fa748de13f4"          # raw material, stock 240
COFFEE = "fec5d954-5b6b-4690-a891-2835c828dd56"        # finished good (no BOM yet)
CABLE = "f85891f5-6ea1-4746-96e4-cc6b6b4a33d7"         # spare part, stock 730
PHONE = "23de115d-56ca-46e3-9950-a84dbb366f48"         # serialized product
# The rebuilt demo DB no longer ships the TS-era Dhanmondi warehouse id, so WH
# is resolved to the live default warehouse at run time (see _run).
WH = "d928e637-1df2-4697-a7d6-acedb9753c9b"            # overridden in _run
CUST = "058f5f00-d0cd-4946-8f8d-1b7c72f75373"          # Sumaiya Khatun

TAG = uuid.uuid4().hex[:6].upper()


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


_STOCK_SNAPSHOT: dict = {}


def snapshot_stock():
    """Capture qtyOnHand of the stock rows the manufacturing/repair sections
    mutate (OIL/COFFEE/CABLE in the resolved warehouse) so cleanup can
    restore them — repeated runs must not leak stock."""
    from sqlalchemy import text
    import db as dbmod
    with dbmod.sync_engine.connect() as c:
        for key, pid in (("oil", OIL), ("coffee", COFFEE), ("cable", CABLE)):
            row = c.execute(text("SELECT id, qtyOnHand FROM stock WHERE productId=:p AND warehouseId=:w"),
                            {"p": pid, "w": WH}).first()
            _STOCK_SNAPSHOT[key] = (row[0], float(row[1])) if row else None


def cleanup(tenant_uuid: str):
    """Remove every artifact this test (or a previous run) created so the DB
    returns to baseline: re-runs never collide, the product-list ordering
    other E2E tests rely on (p20 takes prods[0/1] and expects stock) is
    not polluted by auto-created SERVICE/LAB products, and stock levels for
    OIL/COFFEE/CABLE are restored."""
    from sqlalchemy import text
    import db as dbmod

    # Restore stock levels mutated by the manufacturing/repair sections.
    with dbmod.sync_engine.begin() as c:
        for key, pid in (("oil", OIL), ("coffee", COFFEE), ("cable", CABLE)):
            snap = _STOCK_SNAPSHOT.get(key)
            if snap:
                c.execute(text("UPDATE stock SET qtyOnHand=:q WHERE id=:id"), {"q": snap[1], "id": snap[0]})
            else:
                c.execute(text("DELETE FROM stock WHERE productId=:p AND warehouseId=:w"),
                          {"p": pid, "w": WH})

    with dbmod.sync_engine.begin() as c:
        c.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        c.execute(text("DELETE FROM warranty_claims WHERE claimNo LIKE 'WC-%' AND tenantId=:t"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM commissions WHERE agentType='SALON_STYLIST' AND tenantId=:t"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM sale_items WHERE saleId IN (SELECT id FROM sales WHERE note LIKE 'Service sale%' OR note LIKE 'Repair %' OR note LIKE 'Franchise test %')"))
        c.execute(text("DELETE FROM payments WHERE saleId IN (SELECT id FROM sales WHERE note LIKE 'Service sale%' OR note LIKE 'Repair %' OR note LIKE 'Franchise test %')"))
        c.execute(text("DELETE FROM invoices WHERE saleId IN (SELECT id FROM sales WHERE note LIKE 'Service sale%' OR note LIKE 'Repair %' OR note LIKE 'Franchise test %')"))
        c.execute(text("DELETE FROM journals WHERE refType='SALE' AND refId IN (SELECT id FROM sales WHERE note LIKE 'Service sale%' OR note LIKE 'Repair %' OR note LIKE 'Franchise test %')"))
        c.execute(text("DELETE FROM sales WHERE note LIKE 'Service sale%' OR note LIKE 'Repair %' OR note LIKE 'Franchise test %'"))
        c.execute(text("DELETE FROM appointments WHERE appointmentType='SALON' AND tenantId=:t"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM repair_tickets WHERE ticketNo LIKE 'TKT-%' AND tenantId=:t"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM repair_ticket_items WHERE ticketId IN (SELECT id FROM repair_tickets WHERE tenantId=:t AND ticketNo LIKE 'TKT-%')"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM production_orders WHERE productionNo LIKE 'PO-%' AND tenantId=:t"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM production_order_items WHERE productionOrderId IN (SELECT id FROM production_orders WHERE tenantId=:t AND productionNo LIKE 'PO-%')"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM franchise_settlement_lines WHERE settlementId IN (SELECT id FROM franchise_settlements WHERE tenantId=:t)"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM franchise_settlements WHERE tenantId=:t"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM franchise_branches WHERE franchiseId IN (SELECT id FROM franchises WHERE tenantId=:t AND name LIKE 'E2E Franchise %')"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM franchises WHERE tenantId=:t AND name LIKE 'E2E Franchise %'"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM branches WHERE tenantId=:t AND (name LIKE 'E2E-B1-%' OR name LIKE 'E2E-B2-%')"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM salon_package_items WHERE packageId IN (SELECT id FROM salon_packages WHERE tenantId=:t AND name LIKE 'E2E %')"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM salon_packages WHERE tenantId=:t AND name LIKE 'E2E %'"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM salon_services WHERE tenantId=:t AND name LIKE 'Haircut %'"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM hrm_employees WHERE tenantId=:t AND email LIKE 'nusrat%@test.com'"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM stock_movements WHERE refType='PRODUCTION_ORDER' OR refType='REPAIR_TICKET' OR productId IN (SELECT id FROM products WHERE tenantId=:t AND (sku LIKE 'SVC-%' OR sku LIKE 'PKG-%' OR sku LIKE 'LAB-%' OR sku LIKE 'SRV-%'))"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM stock WHERE productId IN (SELECT id FROM products WHERE tenantId=:t AND (sku LIKE 'SVC-%' OR sku LIKE 'PKG-%' OR sku LIKE 'LAB-%' OR sku LIKE 'SRV-%'))"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM consignment_items WHERE productId IN (SELECT id FROM products WHERE tenantId=:t AND (sku LIKE 'SVC-%' OR sku LIKE 'PKG-%' OR sku LIKE 'LAB-%' OR sku LIKE 'SRV-%'))"), {"t": tenant_uuid})
        c.execute(text("DELETE FROM products WHERE tenantId=:t AND (sku LIKE 'SVC-%' OR sku LIKE 'PKG-%' OR sku LIKE 'LAB-%' OR sku LIKE 'SRV-%')"), {"t": tenant_uuid})
        c.execute(text("SET FOREIGN_KEY_CHECKS=1"))


def seed_fixtures(tenant_uuid: str, wh_id: str):
    """Create the fixture catalog this suite expects (same ids as the original
    TS-era demo seed) inside the live tenant/warehouse. Idempotent: rows that
    already exist are left untouched, so stock baselines are stable across runs.
    """
    from sqlalchemy import text
    import db as dbmod

    def _exists(tbl: str, pid: str) -> bool:
        with dbmod.sync_engine.connect() as c:
            return c.execute(text(f"SELECT 1 FROM {tbl} WHERE id=:p"), {"p": pid}).first() is not None

    prods = [
        (OIL, "Cooking Oil", "RAW-OIL", "SIMPLE", 150.0, 200.0, 240),
        (COFFEE, "Roasted Coffee", "FG-COFFEE", "SIMPLE", 400.0, 600.0, 10),
        (CABLE, "Charging Cable", "PART-CABLE", "SIMPLE", 150.0, 250.0, 730),
        (PHONE, "Smartphone (Serialized)", "UNIT-PHONE", "SERIALIZED", 60000.0, 75000.0, 5),
    ]
    with dbmod.sync_engine.begin() as c:
        for pid, name, sku, ptype, cost, sell, qty in prods:
            if not _exists("products", pid):
                c.execute(text(
                    "INSERT INTO products (id, tenantId, name, sku, productType, costPrice, "
                    "sellingPrice, status, createdAt) VALUES (:id, :t, :n, :s, :pt, :c, :p, 'ACTIVE', NOW(3))"),
                    {"id": pid, "t": tenant_uuid, "n": name, "s": sku, "pt": ptype, "c": cost, "p": sell})
            row = c.execute(text(
                "SELECT id FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p"),
                {"t": tenant_uuid, "w": wh_id, "p": pid}).first()
            if not row:
                c.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, avgCost, status) "
                    "VALUES (UUID(), :t, :w, :p, :q, :c, 'ACTIVE')"),
                    {"t": tenant_uuid, "w": wh_id, "p": pid, "q": qty, "c": cost})
        if not _exists("customers", CUST):
            c.execute(text(
                "INSERT INTO customers (id, tenantId, name, phone, address, currentDue, creditLimit, segmentation) "
                "VALUES (:id, :t, 'Sumaiya Khatun', '01711000023', 'House 7, Dhanmondi', 0, 50000, 'REGULAR')"),
                {"id": CUST, "t": tenant_uuid})


def _run():
    print("=" * 72)
    print("Prompt 23 E2E — Manufacturing / Salon / Repair / Franchise")
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
    # Resolve the live default branch→warehouse (the engine writes stock there)
    # and seed the fixture catalog with the suite's canonical ids before the
    # snapshot runs, so cleanup can restore exact baselines.
    global WH
    wh_row = q1("SELECT (SELECT w.id FROM warehouses w WHERE w.branchId=b.id LIMIT 1) "
                "FROM branches b WHERE b.tenantId=:t LIMIT 1", t=tenant_uuid)
    WH = wh_row[0] if wh_row and wh_row[0] else WH
    seed_fixtures(tenant_uuid, WH)
    # Order matters: snapshot current stock BEFORE the pre-run cleanup so the
    # cleanup restores real baseline levels instead of deleting the rows.
    snapshot_stock()
    cleanup(tenant_uuid)

    # ═══════════ 1. MANUFACTURING — production consumes raw → produces finished stock ═══════════
    print("\n== 1. Manufacturing (BOM → Production Order → Stock) ==")
    st, bom = call("POST", "/api/v1/manufacturing/bom", {
        "finishedProductId": COFFEE,
        "ingredients": [{"ingredientProductId": OIL, "qtyRequired": 0.5, "unit": "L", "unitCost": 150}],
    }, hdrs=H)
    check("BOM defined for finished good", st in (200, 201), str(bom))

    st, finished = call("GET", "/api/v1/manufacturing/finished-goods", hdrs=H)
    coffee_fg = [f for f in finished.get("data", []) if f["id"] == COFFEE]
    check("finished-goods lists product with BOM", st == 200 and coffee_fg and coffee_fg[0]["ingredientCount"] == 1, str(finished))
    check("BOM cost shown", coffee_fg and float(coffee_fg[0]["bomCost"]) == 75.0, str(coffee_fg))

    st, oil_stock_before = call("GET", f"/api/v1/inventory/movements?productId={OIL}", hdrs=H)
    check("movements endpoint reachable", st == 200)

    st, order = call("POST", "/api/v1/manufacturing/orders", {
        "finishedProductId": COFFEE, "qtyPlanned": 20, "yieldPct": 95,
        "batchNo": f"BATCH-{TAG}", "laborCost": 100, "note": "E2E production",
    }, hdrs=H)
    check("production order created", st in (200, 201), str(order))
    order_id = order["data"]["id"]

    st, start = call("POST", f"/api/v1/manufacturing/orders/{order_id}/start", {}, hdrs=H)
    check("order started", st == 200 and start["data"]["status"] == "IN_PROGRESS", str(start))

    def _stock_qty(pid: str) -> float:
        row = q1("SELECT qtyOnHand FROM stock WHERE productId=:p AND warehouseId=:w", p=pid, w=WH)
        return float(row[0]) if row else 0.0

    oil_before = _stock_qty(OIL)
    coffee_before = _stock_qty(COFFEE)

    st, complete = call("POST", f"/api/v1/manufacturing/orders/{order_id}/complete", {}, hdrs=H)
    check("order completed", st == 200 and complete["data"]["status"] == "COMPLETED", str(complete))
    cd = complete["data"]
    check("yield applied (20 planned @95% → 19 produced, 1 wastage)",
          cd["qtyPlanned"] == 20 and cd["qtyProduced"] == 19 and cd["qtyWastage"] == 1, str(cd))
    check("costing: materials 1500 + labor 100 = 1600 total, unit 84.21",
          cd["materialCost"] == 1500 and cd["totalCost"] == 1600 and abs(cd["unitCost"] - 84.21) < 0.01, str(cd))

    oil_after = float(q1("SELECT qtyOnHand FROM stock WHERE productId=:p AND warehouseId=:w", p=OIL, w=WH)[0])
    coffee_row = q1("SELECT qtyOnHand FROM stock WHERE productId=:p AND warehouseId=:w", p=COFFEE, w=WH)
    coffee_after = float(coffee_row[0]) if coffee_row else 0.0
    check("raw material consumed exactly 10L (0.5 × 20)", abs((oil_before - oil_after) - 10) < 0.001,
          f"{oil_before} → {oil_after}")
    check("finished goods produced into stock (+19)", abs((coffee_after - coffee_before) - 19) < 0.001,
          f"before={coffee_before} after={coffee_after}")

    st, movs = call("GET", f"/api/v1/inventory/movements?productId={OIL}", hdrs=H)
    out_movs = [m for m in movs.get("data", []) if m.get("refType") == "PRODUCTION_ORDER"]
    check("ingredient movement PRODUCTION_OUT traceable", st == 200 and out_movs
          and float(out_movs[0]["qty"]) == -10 and out_movs[0]["qtyBefore"] and out_movs[0]["qtyAfter"], str(movs)[:200])
    st, cmovs = call("GET", f"/api/v1/inventory/movements?productId={COFFEE}", hdrs=H)
    in_movs = [m for m in cmovs.get("data", []) if m.get("refType") == "PRODUCTION_ORDER"]
    check("finished stock movement PRODUCTION_IN traceable", st == 200 and in_movs and float(in_movs[0]["qty"]) == 19, str(cmovs)[:200])

    st, detail = call("GET", f"/api/v1/manufacturing/orders/{order_id}", hdrs=H)
    items = detail["data"].get("items", [])
    check("order detail shows consumed line (qtyConsumed=10)", st == 200 and items
          and float(items[0]["qtyConsumed"]) == 10 and float(items[0]["lineCost"]) == 1500, str(detail)[:200])

    st, costing = call("GET", f"/api/v1/manufacturing/costing/{COFFEE}?qty=2", hdrs=H)
    check("production costing API works", st == 200 and float(costing["data"]["totalCost"]) == 150.0, str(costing))

    # ═══════════ 2. SALON — appointment booking + service sale + commission ═══════════
    print("\n== 2. Salon (booking → service sale → commission) ==")
    svc_name = f"Haircut {TAG}"
    st, svc = call("POST", "/api/v1/salon/services", {
        "name": svc_name, "category": "HAIR", "price": 800, "costPrice": 100,
        "durationMin": 45, "commissionType": "PERCENTAGE", "commissionValue": 10,
    }, hdrs=H)
    check("salon service created", st in (200, 201), str(svc))
    svc_id = svc["data"]["id"]

    # Fresh stylist per run (unique email via TAG) so leftover bookings from
    # earlier runs can never collide with this run's slot.
    st, emp = call("POST", "/api/v1/hrm/employees", {
        "firstName": f"Nusrat{TAG}", "lastName": "Stylist", "email": f"nusrat{TAG}@test.com",
        "phone": f"+88017{TAG}00", "joinDate": "2026-01-01", "employmentType": "FULL_TIME",
    }, hdrs=H)
    check("salon stylist (hrm employee) created", st in (200, 201), str(emp))
    staff_id = emp["data"]["id"]
    st, staff = call("GET", "/api/v1/salon/staff", hdrs=H)
    staff_list = staff.get("data", [])
    check("salon staff list served", st == 200 and any(s["id"] == staff_id for s in staff_list), str(staff)[:150])

    tomorrow = date.today().isoformat()
    # Unique slot per run (10:00 + hash of TAG) so re-runs never clash with leftovers.
    slot_hour = 10 + (int(TAG, 16) % 8)
    start_at = f"{tomorrow}T{slot_hour:02d}:00:00"
    st, book = call("POST", "/api/v1/salon/bookings", {
        "customerId": CUST, "staffId": staff_id, "serviceId": svc_id,
        "startAt": start_at, "notes": "E2E booking",
    }, hdrs=H)
    check("salon booking created", st in (200, 201), str(book))
    appt_id = book["data"]["id"]

    st, clash = call("POST", "/api/v1/salon/bookings", {
        "customerId": CUST, "staffId": staff_id, "serviceId": svc_id,
        "startAt": start_at, "notes": "double book",
    }, hdrs=H)
    check("staff double-booking rejected", clash.get("error", "").lower().find("booked") >= 0, str(clash))

    st, avail = call("GET", f"/api/v1/appointments/availability?date={tomorrow}&staffId={staff_id}&durationMin=45", hdrs=H)
    check("availability endpoint returns slots", st == 200, str(avail))

    st, conf = call("PATCH", f"/api/v1/appointments/{appt_id}/status", {"status": "CONFIRMED"}, hdrs=H)
    check("booking confirmed", st == 200, str(conf))

    st, complete_svc = call("POST", f"/api/v1/salon/bookings/{appt_id}/complete", {"paymentMethod": "CASH"}, hdrs=H)
    check("service completion sale created", st == 200 and complete_svc["data"]["sale"]["total"] == 800, str(complete_svc))
    commission = complete_svc["data"]["commission"]
    check("stylist commission 10% = ৳80 calculated", bool(commission) and commission["amount"] == 80 and commission["type"] == "PERCENTAGE", str(commission))

    sale_id = complete_svc["data"]["sale"]["saleId"]
    r = q1("SELECT status, total, paidTotal FROM sales WHERE id=:id", id=sale_id)
    check("sale CONFIRMED paid 800", r and r[0] == "CONFIRMED" and float(r[1]) == 800.0 and float(r[2]) == 800.0, str(r))
    r = q1("SELECT COUNT(*) FROM commissions WHERE saleId=:id AND status='CALCULATED' AND amount=80", id=sale_id)
    check("commission row persisted (CALCULATED, ৳80)", r and r[0] == 1, str(r))
    r = q1("SELECT COUNT(*) FROM journals WHERE refId=:id", id=sale_id)
    check("accounting journal posted for service sale", r and r[0] >= 1, str(r))
    r = q1("SELECT status FROM appointments WHERE id=:id", id=appt_id)
    check("appointment marked COMPLETED", r and r[0] == "COMPLETED", str(r))

    # ═══════════ 3. REPAIR — ticket lifecycle + warranty linkage ═══════════
    print("\n== 3. Repair (lifecycle + warranty) ==")
    serial_no = f"IMEI-{TAG}6789"
    with dbmod.sync_engine.begin() as c:
        c.execute(text("INSERT INTO serials (id, tenantId, productId, serialNo, status, warrantyStart, warrantyEnd) "
                       "VALUES (:id, :t, :p, :s, 'SOLD', '2026-01-01', '2027-12-31')"),
                  {"id": str(uuid.uuid4()), "t": "f7b5ec24-0000-4000-8000-000000000001", "p": PHONE, "s": serial_no})
        # tenantId above is a guess-avoiding placeholder replaced below via tenant lookup
    # The serial must belong to the demo tenant — fetch the real tenant id first.
    row = q1("SELECT t.id FROM tenants t WHERE t.slug='demo-shop'")
    tenant_uuid = row[0]
    with dbmod.sync_engine.begin() as c:
        c.execute(text("DELETE FROM serials WHERE serialNo=:s"), {"s": serial_no})
        c.execute(text("INSERT INTO serials (id, tenantId, productId, serialNo, status, warrantyStart, warrantyEnd) "
                       "VALUES (:id, :t, :p, :s, 'SOLD', '2026-01-01', '2027-12-31')"),
                  {"id": str(uuid.uuid4()), "t": tenant_uuid, "p": PHONE, "s": serial_no})

    st, ticket = call("POST", "/api/v1/repair/tickets", {
        "customerId": CUST, "productId": PHONE, "serialNo": serial_no,
        "deviceInfo": "Galaxy S24 Ultra", "reportedProblem": "Screen cracked, battery drains fast",
        "priority": "HIGH", "notes": f"E2E {TAG}",
    }, hdrs=H)
    check("repair ticket received + warranty auto-detected", st in (200, 201)
          and ticket["data"]["status"] == "RECEIVED" and ticket["data"]["warrantyEligible"] is True
          and ticket["data"]["warrantyType"] == "STORE", str(ticket))
    ticket_id = ticket["data"]["id"]

    st, part = call("POST", f"/api/v1/repair/tickets/{ticket_id}/items",
                    {"lineType": "PART", "productId": CABLE, "qty": 1, "unitPrice": 250}, hdrs=H)
    check("spare part line added", st in (200, 201), str(part))
    st, labor = call("POST", f"/api/v1/repair/tickets/{ticket_id}/items",
                     {"lineType": "LABOR", "name": "Screen + battery labour", "qty": 1, "unitPrice": 500}, hdrs=H)
    check("labour line added", st in (200, 201), str(labor))

    flow = [("INSPECTION", "start inspection"), ("ESTIMATE", "estimate"),
            ("APPROVED", "approve"), ("REPAIRING", "repairing"),
            ("QUALITY_CHECK", "quality check"), ("READY", "ready")]
    for target, label in flow:
        body = {"status": target}
        if target == "ESTIMATE":
            body["estimatedCost"] = 750
        st, tr = call("POST", f"/api/v1/repair/tickets/{ticket_id}/status", body, hdrs=H)
        check(f"ticket → {label}", st == 200 and tr["data"]["status"] == target, str(tr))

    cable_before = float(q1("SELECT qtyOnHand FROM stock WHERE productId=:p AND warehouseId=:w", p=CABLE, w=WH)[0])
    st, deliver = call("POST", f"/api/v1/repair/tickets/{ticket_id}/status", {"status": "DELIVERED", "paymentMethod": "CASH"}, hdrs=H)
    check("ticket delivered & billed", st == 200 and deliver["data"]["status"] == "DELIVERED" and deliver["data"]["total"] == 750, str(deliver))
    check("warranty claim filed on delivery", bool(deliver["data"]["warrantyClaim"]), str(deliver))

    cable_after = float(q1("SELECT qtyOnHand FROM stock WHERE productId=:p AND warehouseId=:w", p=CABLE, w=WH)[0])
    check("spare part consumed from stock (1 unit)", abs((cable_before - cable_after) - 1) < 0.001, f"{cable_before} → {cable_after}")
    r = q1("SELECT warrantyClaimId, actualCost, status FROM repair_tickets WHERE id=:id", id=ticket_id)
    check("ticket finalized with actual cost 750", r and r[0] and float(r[1]) == 750.0 and r[2] == "DELIVERED", str(r))
    r = q1("SELECT claimNo, status, resolution, actualCost FROM warranty_claims WHERE id=:id", id=r[0])
    check("warranty claim resolved", r and r[1] == "RESOLVED" and r[2] == "REPAIRED" and float(r[3]) == 750.0, str(r))

    st, bad = call("POST", f"/api/v1/repair/tickets/{ticket_id}/status", {"status": "REPAIRING"}, hdrs=H)
    check("transition after DELIVERED rejected", bad.get("error", "").find("Cannot move") >= 0, str(bad))

    st, tdetail = call("GET", f"/api/v1/repair/tickets/{ticket_id}", hdrs=H)
    check("ticket detail lists lines + warranty claim", st == 200 and len(tdetail["data"]["items"]) == 2
          and tdetail["data"]["warrantyClaim"]["claimNo"], str(tdetail)[:250])

    # ═══════════ 4. FRANCHISE — settlement across ≥2 branches ═══════════
    print("\n== 4. Franchise (settlement across 2 branches) ==")
    st, fr = call("POST", "/api/v1/franchise/franchisees", {
        "name": f"E2E Franchise {TAG}", "territory": "Dhaka", "contactPerson": "E2E Owner",
        "openingFee": 50000, "royaltyRatePct": 10, "commissionRatePct": 0,
    }, hdrs=H)
    check("franchisee created", st in (200, 201), str(fr))
    fr_id = fr["data"]["id"]

    b1 = b2 = None
    for nm in (f"E2E-B1-{TAG}", f"E2E-B2-{TAG}"):
        st, br = call("POST", "/api/v1/branches", {"name": nm, "code": nm.replace("-", "")[:8]}, hdrs=H)
        check(f"branch {nm} created", st in (200, 201), str(br))
        if not b1: b1 = br["data"]["id"]
        else: b2 = br["data"]["id"]

    st, link = call("POST", f"/api/v1/franchise/franchisees/{fr_id}/branches",
                    {"branches": [{"branchId": b1}, {"branchId": b2}]}, hdrs=H)
    check("2 branches linked to franchise", st in (200, 201), str(link))
    st, fr_list = call("GET", "/api/v1/franchise/franchisees", hdrs=H)
    mine = [f for f in fr_list.get("data", []) if f["id"] == fr_id]
    check("franchisee lists 2 branches", st == 200 and mine and len(mine[0]["branches"]) == 2, str(fr_list)[:200])

    # Seed confirmed sales in each franchise branch (test data for the settlement engine).
    admin_user = q1("SELECT id FROM users WHERE email='admin@blueoceanspos.com'")
    admin_uid = admin_user[0] if admin_user else None
    with dbmod.sync_engine.begin() as c:
        for idx, (branch_id, amt) in enumerate(((b1, 60000), (b1, 40000), (b2, 60000))):
            c.execute(text(
                "INSERT INTO sales (id, tenantId, branchId, userId, customerId, invoiceNo, subtotal, discountTotal, "
                "taxTotal, total, paidTotal, dueTotal, paymentStatus, status, note, createdBy, saleDate) "
                "VALUES (UUID(), :t, :b, :u, :c, :inv, :amt, 0, 0, :amt, :amt, 0, 'PAID', 'CONFIRMED', :n, :u, NOW())"),
                {"t": tenant_uuid, "b": branch_id, "u": admin_uid, "c": CUST,
                 "inv": f"E2E-{TAG}-{idx}", "amt": amt,
                 "n": f"Franchise test {TAG}"})

    today = date.today()
    period_start = f"{today.year}-{today.month:02d}-01"
    period_end = today.isoformat()

    st, calc = call("POST", "/api/v1/franchise/settlements/calculate", {
        "franchiseId": fr_id, "periodStart": period_start, "periodEnd": period_end,
    }, hdrs=H)
    check("settlement calculated", st == 200, str(calc))
    pd = calc["data"]
    check("gross sales across BOTH branches = 160,000", float(pd["grossSales"]) == 160000.0, str(pd))
    check("returns = 0, net = gross", float(pd["returnsTotal"]) == 0 and float(pd["netSales"]) == 160000.0, str(pd))
    check("royalty 10% = 16,000", float(pd["royaltyAmount"]) == 16000.0 and float(pd["royaltyRatePct"]) == 10, str(pd))
    check("per-branch lines computed (2 branches)", len(pd["lines"]) == 2
          and sum(float(l["netSales"]) for l in pd["lines"]) == 160000.0, str(pd["lines"]))
    b1_line = next(l for l in pd["lines"] if l["branchId"] == b1)
    b2_line = next(l for l in pd["lines"] if l["branchId"] == b2)
    check("branch 1 (100k) royalty 10k, branch 2 (60k) royalty 6k",
          float(b1_line["royaltyAmount"]) == 10000.0 and float(b2_line["royaltyAmount"]) == 6000.0, str(pd["lines"]))

    st, save = call("POST", "/api/v1/franchise/settlements", {
        "franchiseId": fr_id, "periodStart": period_start, "periodEnd": period_end,
        "includeOpeningFee": True, "notes": "E2E settlement",
    }, hdrs=H)
    check("settlement saved with opening fee (total 66,000)", st in (200, 201) and float(save["data"]["totalAmount"]) == 66000.0, str(save))
    stl_id = save["data"]["id"]

    r = q1("SELECT status, grossSales, royaltyAmount, feeAmount FROM franchise_settlements WHERE id=:id", id=stl_id)
    check("settlement row persisted DRAFT", r and r[0] == "DRAFT" and float(r[1]) == 160000.0
          and float(r[2]) == 16000.0 and float(r[3]) == 50000.0, str(r))
    r = q1("SELECT COUNT(*) FROM franchise_settlement_lines WHERE settlementId=:id", id=stl_id)
    check("2 per-branch settlement lines stored", r and r[0] == 2, str(r))

    st, dup = call("POST", "/api/v1/franchise/settlements", {
        "franchiseId": fr_id, "periodStart": period_start, "periodEnd": period_end,
    }, hdrs=H)
    check("re-saving same period upserts (no duplicate)", st in (200, 201) and dup["data"]["id"] == stl_id, str(dup))
    r = q1("SELECT COUNT(*) FROM franchise_settlements WHERE franchiseId=:id AND periodStart=:ps AND periodEnd=:pe",
           id=fr_id, ps=period_start, pe=period_end)
    check("exactly one settlement per franchise+period", r and r[0] == 1, str(r))

    st, appr = call("POST", f"/api/v1/franchise/settlements/{stl_id}/status", {"status": "APPROVED"}, hdrs=H)
    check("settlement approved", st == 200, str(appr))
    st, pay = call("POST", f"/api/v1/franchise/settlements/{stl_id}/status", {"status": "PAID"}, hdrs=H)
    check("settlement paid", st == 200, str(pay))
    r = q1("SELECT status, approvedAt, paidAt FROM franchise_settlements WHERE id=:id", id=stl_id)
    check("settlement APPROVED → PAID with timestamps", r and r[0] == "PAID" and r[1] and r[2], str(r))

    st, report = call("GET", f"/api/v1/franchise/franchisees/{fr_id}/report", hdrs=H)
    check("franchise report reflects sales + settled royalty", st == 200
          and float(report["data"]["totalSales"]) == 160000.0 and float(report["data"]["settledRoyalty"]) == 16000.0, str(report)[:250])

    print("\n" + "=" * 72)
    print(f"Prompt 23 E2E: {len(PASSED)} checks passed ✅")
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
        snapshot_stock()  # capture current levels for the next run's restore


if __name__ == "__main__":
    main()
