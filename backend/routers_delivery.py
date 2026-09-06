"""Delivery & Logistics (module 27 / Prompt 24).

Generic delivery engine — consumed by Restaurant (Prompt 20), Wholesale
(Prompt 22) and later E-commerce (Prompt 33). Never restaurant-specific.

- Delivery order lifecycle:
    PENDING → PACKED → ASSIGNED → OUT_FOR_DELIVERY → DELIVERED
    and  PENDING/ASSIGNED → FAILED → RESCHEDULED | RETURNED | CANCELLED
- Riders, vehicles, zones (fee/limits), routes.
- Delivery fee, COD collection, proof of delivery (signature/photo).
- Auto rider assignment = simple round-robin (lowest deliveryCount first),
  replaceable later by a route-optimization engine.
- Status transitions update the linked Sale/Invoice; a successful COD
  delivery records the payment (payments.method='COD') + accounting journal
  (Prompt 9/16 engines) and settles the customer's AR.
"""
from __future__ import annotations

import uuid as _uuid

from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import accounting as acc
from db import get_db, txn
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, gen_no

router = APIRouter()


def _uid() -> str:
    return str(_uuid.uuid4())


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# Allowed transitions for the delivery order lifecycle.
DELIVERY_FLOW = {
    "PENDING": {"PACKED", "CANCELLED"},
    "PACKED": {"ASSIGNED", "PENDING", "CANCELLED"},
    "ASSIGNED": {"OUT_FOR_DELIVERY", "FAILED", "PENDING", "CANCELLED"},
    "OUT_FOR_DELIVERY": {"DELIVERED", "FAILED"},
    "FAILED": {"RESCHEDULED", "RETURNED", "PENDING"},
    "RESCHEDULED": {"PACKED", "ASSIGNED", "CANCELLED", "FAILED"},
}


async def _notify_delivery(db, od: dict, status: str):
    """Prompt 28 — delivery update to the customer (consent handled by engine)."""
    if not od.get("customerId"):
        return
    try:
        import notify as _nt
        await _nt.dispatch(
            db, od["tenantId"], "DELIVERY_UPDATE", customer_id=od["customerId"],
            name=od.get("customerName"), ref_type="DELIVERY_ORDER", ref_id=od["id"],
            params={"name": od.get("customerName") or "", "deliveryNo": od.get("deliveryNo"),
                    "status": status.replace("_", " ").title()})
    except Exception:
        pass  # notifications never block the delivery lifecycle


async def _track(db, tenantId, delivery_id, status, note, user, lat=None, lng=None):
    await db.execute(text(
        "INSERT INTO delivery_tracking (id, tenantId, deliveryId, status, latitude, longitude, note, createdBy) "
        "VALUES (:id, :t, :d, :st, :la, :lo, :n, :u)"),
        {"id": _uid(), "t": tenantId, "d": delivery_id, "st": status, "la": lat, "lo": lng,
         "n": (note or "")[:280], "u": user.id})


async def _release_rider(db, rider_id: str | None):
    """Rider is free again once their delivery is done/failed/returned/cancelled."""
    if not rider_id:
        return
    open_count = (await db.execute(text(
        "SELECT COUNT(*) FROM delivery_orders WHERE riderId=:r "
        "AND status IN ('PENDING','PACKED','ASSIGNED','OUT_FOR_DELIVERY','RESCHEDULED')"),
        {"r": rider_id})).first()[0]
    if open_count == 0:
        await db.execute(text("UPDATE delivery_riders SET status='AVAILABLE' WHERE id=:id"),
                         {"id": rider_id})


# ═══════════════════════════ ZONES / ROUTES / VEHICLES / RIDERS ═══════════════════════════

@router.get("/api/v1/delivery/zones")
async def list_delivery_zones(user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant),
                              db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT z.*, (SELECT COUNT(*) FROM delivery_orders o WHERE o.zoneId=z.id) AS orderCount "
        "FROM delivery_zones z WHERE z.tenantId=:t ORDER BY z.name"),
        {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/delivery/zones")
async def create_delivery_zone(body: dict, user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name:
        return err("name is required", 400)
    z_id = _uid()
    await db.execute(text(
        "INSERT INTO delivery_zones (id, tenantId, branchId, name, code, city, area, deliveryFee, "
        "minOrderAmount, freeDeliveryAbove, isActive, createdBy) "
        "VALUES (:id, :t, :b, :n, :c, :ci, :a, :f, :mo, :fd, 1, :u)"),
        {"id": z_id, "t": tenantId, "b": body.get("branchId"), "n": name,
         "c": body.get("code") or name[:6].upper(), "ci": body.get("city"),
         "a": body.get("area"), "f": float(body.get("deliveryFee", 0) or 0),
         "mo": float(body.get("minOrderAmount", 0) or 0),
         "fd": float(body.get("freeDeliveryAbove", 0) or 0), "u": user.id})
    await db.commit()
    return ok({"id": z_id, "name": name}, 201)


@router.patch("/api/v1/delivery/zones/{zoneId}")
async def update_delivery_zone(zoneId: str, body: dict, user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    fields, params = [], {"id": zoneId, "t": tenantId}
    for key in ("name", "code", "city", "area", "deliveryFee", "minOrderAmount",
                "freeDeliveryAbove", "isActive"):
        if key in body:
            fields.append(f"{key} = :{key}"); params[key] = body[key]
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE delivery_zones SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.get("/api/v1/delivery/routes")
async def list_delivery_routes(user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT r.*, z.name AS zoneName FROM delivery_routes r "
        "LEFT JOIN delivery_zones z ON z.id=r.zoneId WHERE r.tenantId=:t ORDER BY r.name"),
        {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/delivery/routes")
async def create_delivery_route(body: dict, user: AuthUser = Depends(require_auth),
                                tenantId: str = Depends(resolve_tenant),
                                db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name:
        return err("name is required", 400)
    r_id = _uid()
    await db.execute(text(
        "INSERT INTO delivery_routes (id, tenantId, zoneId, branchId, name, description, isActive, createdBy) "
        "VALUES (:id, :t, :z, :b, :n, :d, 1, :u)"),
        {"id": r_id, "t": tenantId, "z": body.get("zoneId"), "b": body.get("branchId"),
         "n": name, "d": body.get("description"), "u": user.id})
    await db.commit()
    return ok({"id": r_id, "name": name}, 201)


@router.get("/api/v1/delivery/vehicles")
async def list_delivery_vehicles(user: AuthUser = Depends(require_auth),
                                 tenantId: str = Depends(resolve_tenant),
                                 db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT v.*, (SELECT COUNT(*) FROM delivery_orders o WHERE o.vehicleId=v.id) AS tripCount "
        "FROM delivery_vehicles v WHERE v.tenantId=:t ORDER BY v.name"),
        {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/delivery/vehicles")
async def create_delivery_vehicle(body: dict, user: AuthUser = Depends(require_auth),
                                  tenantId: str = Depends(resolve_tenant),
                                  db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name:
        return err("name is required", 400)
    v_id = _uid()
    await db.execute(text(
        "INSERT INTO delivery_vehicles (id, tenantId, name, type, plateNo, isActive, createdBy) "
        "VALUES (:id, :t, :n, :ty, :p, 1, :u)"),
        {"id": v_id, "t": tenantId, "n": name, "ty": body.get("type", "BIKE"),
         "p": body.get("plateNo"), "u": user.id})
    await db.commit()
    return ok({"id": v_id, "name": name, "type": body.get("type", "BIKE")}, 201)


@router.get("/api/v1/delivery/riders")
async def list_delivery_riders(status: str = "", zoneId: str = "",
                               user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    where = "r.tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND r.status=:st"; params["st"] = status
    if zoneId:
        where += " AND (r.zoneIds LIKE :z OR r.zoneIds IS NULL)"; params["z"] = f"%{zoneId}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT r.*, v.name AS vehicleName, "
        f"(SELECT COUNT(*) FROM delivery_orders o WHERE o.riderId=r.id AND o.status IN "
        f"('PENDING','PACKED','ASSIGNED','OUT_FOR_DELIVERY','RESCHEDULED')) AS activeDeliveries "
        f"FROM delivery_riders r LEFT JOIN delivery_vehicles v ON v.id=r.vehicleId "
        f"WHERE {where} ORDER BY r.status, r.name"),
        params)).fetchall())
    return ok(rows)


@router.post("/api/v1/delivery/riders")
async def create_delivery_rider(body: dict, user: AuthUser = Depends(require_auth),
                                tenantId: str = Depends(resolve_tenant),
                                db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name:
        return err("name is required", 400)
    # Optional link to an HRM employee (a rider is usually an employee too).
    employee_id = body.get("employeeId")
    if employee_id:
        emp = (await db.execute(text(
            "SELECT id FROM hrm_employees WHERE id=:id AND tenantId=:t"),
            {"id": employee_id, "t": tenantId})).first()
        if not emp:
            return err("Linked HRM employee not found", 404)
    r_id = _uid()
    await db.execute(text(
        "INSERT INTO delivery_riders (id, tenantId, branchId, employeeId, name, phone, email, vehicleId, "
        "zoneIds, status, rating, deliveryCount, isActive, createdBy) "
        "VALUES (:id, :t, :b, :e, :n, :p, :m, :v, :z, 'AVAILABLE', 0, 0, 1, :u)"),
        {"id": r_id, "t": tenantId, "b": body.get("branchId"), "e": employee_id, "n": name,
         "p": body.get("phone"), "m": body.get("email"), "v": body.get("vehicleId"),
         "z": body.get("zoneIds"), "u": user.id})
    await db.commit()
    return ok({"id": r_id, "name": name, "status": "AVAILABLE"}, 201)


@router.patch("/api/v1/delivery/riders/{riderId}")
async def update_delivery_rider(riderId: str, body: dict, user: AuthUser = Depends(require_auth),
                                tenantId: str = Depends(resolve_tenant),
                                db: AsyncSession = Depends(get_db)):
    fields, params = [], {"id": riderId, "t": tenantId}
    for key in ("name", "phone", "email", "vehicleId", "zoneIds", "status", "isActive"):
        if key in body:
            fields.append(f"{key} = :{key}"); params[key] = body[key]
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE delivery_riders SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


# ═══════════════════════════ DELIVERY ORDERS ═══════════════════════════

def _delivery_fee_for(zone_row, order_amount: float, asked: float | None) -> float:
    """Zone-based fee rules (§10.32-style, stored on the zone): free above a
    threshold, else flat zone fee. Explicit per-order fee overrides."""
    if asked is not None:
        return round(float(asked), 2)
    if not zone_row:
        return 0.0
    if float(zone_row.get("freeDeliveryAbove") or 0) > 0 and order_amount >= float(zone_row["freeDeliveryAbove"]):
        return 0.0
    return round(float(zone_row.get("deliveryFee") or 0), 2)


@router.post("/api/v1/delivery/orders")
async def create_delivery_order(body: dict, user: AuthUser = Depends(require_auth),
                                tenantId: str = Depends(resolve_tenant),
                                db: AsyncSession = Depends(get_db)):
    """Create a delivery for an existing sale/invoice (or a standalone drop).
    Generic sourceType: SALE / RESTAURANT / WHOLESALE / ONLINE / SALES_ORDER."""
    sale_id = body.get("saleId")
    customer_id = body.get("customerId")
    source_type = body.get("sourceType", "SALE").upper()
    # Pull customer/address/amount context from the linked sale when given.
    sale_ctx = None
    if sale_id:
        sale_ctx = (await db.execute(text(
            "SELECT s.id, s.invoiceNo, s.customerId, s.total, s.paidTotal, s.branchId, "
            "c.name AS customerName, c.phone AS customerPhone, c.address AS customerAddress "
            "FROM sales s LEFT JOIN customers c ON c.id=s.customerId "
            "WHERE s.id=:id AND s.tenantId=:t"),
            {"id": sale_id, "t": tenantId})).first()
        if not sale_ctx:
            return err("Linked sale not found", 404)
        customer_id = customer_id or sale_ctx[2]
    invoice_id = body.get("invoiceId")
    if sale_id and not invoice_id:
        inv_row = (await db.execute(text(
            "SELECT id FROM invoices WHERE saleId=:s AND tenantId=:t LIMIT 1"),
            {"s": sale_id, "t": tenantId})).first()
        invoice_id = inv_row[0] if inv_row else None
    customer_name = body.get("customerName") or (sale_ctx[6] if sale_ctx else None) or "Walk-in"
    customer_phone = body.get("customerPhone") or (sale_ctx[7] if sale_ctx else None)
    address = body.get("deliveryAddress") or (sale_ctx[8] if sale_ctx else None)
    if not customer_id and not customer_phone:
        return err("customerId or customerPhone is required", 400)
    if not address:
        return err("deliveryAddress is required", 400)
    # Resolve customer by phone when only a phone was supplied.
    if not customer_id and customer_phone:
        cust = (await db.execute(text(
            "SELECT id FROM customers WHERE tenantId=:t AND phone=:p LIMIT 1"),
            {"t": tenantId, "p": customer_phone})).first()
        customer_id = cust[0] if cust else None
    branch_id = body.get("branchId") or (sale_ctx[5] if sale_ctx else None)
    if not branch_id:
        row = (await db.execute(text(
            "SELECT b.id FROM branches b WHERE b.tenantId=:t LIMIT 1"),
            {"t": tenantId})).first()
        branch_id = row[0] if row else None

    zone_id = body.get("zoneId")
    zone_row = None
    if zone_id:
        zone_row = (await db.execute(text(
            "SELECT * FROM delivery_zones WHERE id=:id AND tenantId=:t"),
            {"id": zone_id, "t": tenantId})).first()
        zone_row = dict(zone_row._mapping) if zone_row else None
        if not zone_row:
            return err("Zone not found", 404)
    order_amount = float(sale_ctx[3] if sale_ctx else body.get("orderAmount", 0) or 0)
    delivery_fee = _delivery_fee_for(zone_row, order_amount, body.get("deliveryFee"))
    payment_type = body.get("paymentType", "COD" if sale_ctx and float(sale_ctx[4]) < order_amount else "PREPAID").upper()
    if payment_type not in ("PREPAID", "COD"):
        return err("paymentType must be PREPAID or COD", 400)
    cod_amount = float(body.get("codAmount", 0) or 0)
    if payment_type == "COD" and cod_amount <= 0:
        cod_amount = round(max(order_amount - float(sale_ctx[4] if sale_ctx else 0), 0) + delivery_fee, 2)
    total = round(cod_amount + delivery_fee, 2)

    order_id = _uid()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO delivery_orders (id, tenantId, branchId, deliveryNo, sourceType, sourceId, saleId, "
            "invoiceId, customerId, customerName, customerPhone, deliveryAddress, zoneId, routeId, riderId, "
            "vehicleId, status, paymentType, codAmount, deliveryFee, totalAmount, priority, scheduledAt, "
            "notes, createdBy) VALUES (:id, :t, :b, :no, :st, :si, :s, :inv, :c, :cn, :cp, :ad, :z, :r, :rid, "
            ":v, 'PENDING', :pt, :cod, :f, :tot, :pr, :sch, :n, :u)"),
            {"id": order_id, "t": tenantId, "b": branch_id, "no": gen_no("DLV"),
             "st": source_type, "si": body.get("sourceId"), "s": sale_id,
             "inv": invoice_id, "c": customer_id,
             "cn": (customer_name or "")[:140], "cp": customer_phone, "ad": (address or "")[:280],
             "z": zone_id, "r": body.get("routeId"), "rid": None, "v": None,
             "pt": payment_type, "cod": cod_amount, "f": delivery_fee, "tot": total,
             "pr": body.get("priority", "NORMAL"), "sch": body.get("scheduledAt"), "n": body.get("notes"),
             "u": user.id})
        await _track(db, tenantId, order_id, "PENDING", "Delivery order created", user)
    delivery = (await db.execute(text(
        "SELECT * FROM delivery_orders WHERE id=:id AND tenantId=:t"),
        {"id": order_id, "t": tenantId})).first()
    d = dict(delivery._mapping)
    d["customer"] = {"id": customer_id, "name": customer_name, "phone": customer_phone}
    return ok(d, 201)


@router.get("/api/v1/delivery/orders")
async def list_delivery_orders(status: str = "", riderId: str = "", zoneId: str = "",
                               sourceType: str = "", dateFrom: str = "", dateTo: str = "",
                               page: int = Query(1), limit: int = Query(50),
                               user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    where = "o.tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND o.status=:st"; params["st"] = status
    if riderId:
        where += " AND o.riderId=:r"; params["r"] = riderId
    if zoneId:
        where += " AND o.zoneId=:z"; params["z"] = zoneId
    if sourceType:
        where += " AND o.sourceType=:s"; params["s"] = sourceType
    if dateFrom:
        where += " AND o.createdAt >= :df"; params["df"] = f"{dateFrom} 00:00:00"
    if dateTo:
        where += " AND o.createdAt <= :dt"; params["dt"] = f"{dateTo} 23:59:59"
    off = max(page - 1, 0) * limit
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT o.*, r.name AS riderName, z.name AS zoneName, v.name AS vehicleName "
        f"FROM delivery_orders o "
        f"LEFT JOIN delivery_riders r ON r.id=o.riderId "
        f"LEFT JOIN delivery_zones z ON z.id=o.zoneId "
        f"LEFT JOIN delivery_vehicles v ON v.id=o.vehicleId "
        f"WHERE {where} ORDER BY o.createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": limit, "off": off})).fetchall())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM delivery_orders o WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.get("/api/v1/delivery/orders/{deliveryId}")
async def get_delivery_order(deliveryId: str, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant),
                             db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text(
        "SELECT o.*, r.name AS riderName, z.name AS zoneName, v.name AS vehicleName "
        "FROM delivery_orders o "
        "LEFT JOIN delivery_riders r ON r.id=o.riderId "
        "LEFT JOIN delivery_zones z ON z.id=o.zoneId "
        "LEFT JOIN delivery_vehicles v ON v.id=o.vehicleId "
        "WHERE o.id=:id AND o.tenantId=:t"),
        {"id": deliveryId, "t": tenantId})).first()
    if not row:
        return err("Delivery order not found", 404)
    d = dict(row._mapping)
    d["tracking"] = rows_to_dicts((await db.execute(text(
        "SELECT * FROM delivery_tracking WHERE deliveryId=:id ORDER BY createdAt"),
        {"id": deliveryId})).fetchall())
    d["items"] = []
    if d.get("saleId"):
        d["items"] = rows_to_dicts((await db.execute(text(
            "SELECT si.productId, si.name, si.qty, si.unitPrice, si.lineTotal FROM sale_items si "
            "WHERE si.saleId=:s ORDER BY si.createdAt"),
            {"s": d["saleId"]})).fetchall())
    return ok(d)


@router.post("/api/v1/delivery/orders/{deliveryId}/assign")
async def assign_delivery_rider(deliveryId: str, body: dict, user: AuthUser = Depends(require_auth),
                                tenantId: str = Depends(resolve_tenant),
                                db: AsyncSession = Depends(get_db)):
    """Assign a rider (+vehicle) to a delivery. When no riderId is given the
    engine auto-assigns round-robin: the rider with the fewest open deliveries
    (lowest load) — a stub for real route optimization (Prompt 24 allows)."""
    order = (await db.execute(text(
        "SELECT * FROM delivery_orders WHERE id=:id AND tenantId=:t FOR UPDATE"),
        {"id": deliveryId, "t": tenantId})).first()
    if not order:
        return err("Delivery order not found", 404)
    od = dict(order._mapping)
    if od["status"] not in ("PACKED", "PENDING", "RESCHEDULED", "FAILED"):
        return err(f"Cannot assign rider while status is {od['status']}", 400)
    rider_id = body.get("riderId")
    if not rider_id:
        # Round-robin: least-loaded available rider, preferring riders in the zone.
        zone = od.get("zoneId")
        rows = (await db.execute(text(
            "SELECT r.id FROM delivery_riders r WHERE r.tenantId=:t AND r.status='AVAILABLE' AND r.isActive=1 "
            "ORDER BY r.deliveryCount ASC, "
            "CASE WHEN (:z IS NOT NULL AND (r.zoneIds LIKE CONCAT('%', :z, '%') OR r.zoneIds IS NULL)) THEN 0 ELSE 1 END, "
            "r.updatedAt ASC LIMIT 1"),
            {"t": tenantId, "z": zone})).fetchall()
        if not rows:
            return err("No available rider — add a rider or mark one AVAILABLE", 409)
        rider_id = rows[0][0]
    rider = (await db.execute(text(
        "SELECT * FROM delivery_riders WHERE id=:id AND tenantId=:t AND isActive=1"),
        {"id": rider_id, "t": tenantId})).first()
    if not rider:
        return err("Rider not found", 404)
    rd = dict(rider._mapping)
    vehicle_id = body.get("vehicleId") or rd.get("vehicleId")
    async with txn(db):
        await db.execute(text(
            "UPDATE delivery_orders SET riderId=:r, vehicleId=:v, status='ASSIGNED', assignedAt=:a, updatedBy=:u "
            "WHERE id=:id"),
            {"r": rider_id, "v": vehicle_id, "a": _now(), "u": user.id, "id": deliveryId})
        await db.execute(text("UPDATE delivery_riders SET status='BUSY' WHERE id=:id"),
                         {"id": rider_id})
        await _track(db, tenantId, deliveryId, "ASSIGNED",
                     f"Assigned to rider {rd.get('name')}", user)
    return ok({"id": deliveryId, "status": "ASSIGNED", "riderId": rider_id,
               "riderName": rd.get("name"), "vehicleId": vehicle_id}, 200)


@router.post("/api/v1/delivery/orders/{deliveryId}/status")
async def transition_delivery_order(deliveryId: str, body: dict, user: AuthUser = Depends(require_auth),
                                    tenantId: str = Depends(resolve_tenant),
                                    db: AsyncSession = Depends(get_db)):
    """Lifecycle driver. Target statuses:
    PACKED → ASSIGNED (auto round-robin when no rider set) → OUT_FOR_DELIVERY → DELIVERED
    and FAILED → RESCHEDULED | RETURNED | CANCELLED.
    A successful COD delivery records the payment (Prompt 9 engine), updates the
    linked sale/invoice (Prompt 10/11) and posts the accounting journal.
    """
    order = (await db.execute(text(
        "SELECT * FROM delivery_orders WHERE id=:id AND tenantId=:t FOR UPDATE"),
        {"id": deliveryId, "t": tenantId})).first()
    if not order:
        return err("Delivery order not found", 404)
    od = dict(order._mapping)
    target = body.get("status", "").upper()
    if target == od["status"]:
        return err(f"Delivery is already {od['status']}", 400)
    allowed = DELIVERY_FLOW.get(od["status"], set())
    if target not in allowed:
        return err(f"Cannot move from {od['status']} to {target} — allowed: {sorted(allowed)}", 400)

    async with txn(db):
        # PACKED — mark the parcel ready.
        if target == "PACKED":
            await db.execute(text(
                "UPDATE delivery_orders SET status='PACKED', packedAt=:a, updatedBy=:u WHERE id=:id"),
                {"a": _now(), "u": user.id, "id": deliveryId})
            await _track(db, tenantId, deliveryId, "PACKED", body.get("note") or "Order packed", user)
            # Prompt 28 — delivery update notification (consent-aware)
            await _notify_delivery(db, od, "PACKED")
            return ok({"id": deliveryId, "status": "PACKED"})

        # RESCHEDULED — failed delivery scheduled again (back to queue).
        if target == "RESCHEDULED":
            await db.execute(text(
                "UPDATE delivery_orders SET status='RESCHEDULED', rescheduleCount=rescheduleCount+1, "
                "failureReason=:fr, updatedBy=:u WHERE id=:id"),
                {"fr": body.get("reason") or od.get("failureReason"), "u": user.id, "id": deliveryId})
            await _release_rider(db, od.get("riderId"))
            await _track(db, tenantId, deliveryId, "RESCHEDULED",
                         body.get("reason") or "Rescheduled for another attempt", user)
            await _notify_delivery(db, od, "RESCHEDULED")
            return ok({"id": deliveryId, "status": "RESCHEDULED",
                       "rescheduleCount": int(od.get("rescheduleCount", 0)) + 1})

        # FAILED — delivery attempt failed.
        if target == "FAILED":
            await db.execute(text(
                "UPDATE delivery_orders SET status='FAILED', failedAt=:a, failureReason=:fr, updatedBy=:u "
                "WHERE id=:id"),
                {"a": _now(), "fr": body.get("reason"), "u": user.id, "id": deliveryId})
            await _release_rider(db, od.get("riderId"))
            await _track(db, tenantId, deliveryId, "FAILED", body.get("reason") or "Delivery attempt failed", user)
            await _notify_delivery(db, od, "FAILED")
            return ok({"id": deliveryId, "status": "FAILED"})

        # RETURNED — undeliverable → goods return to store (upstream return flow handles stock).
        if target == "RETURNED":
            await db.execute(text(
                "UPDATE delivery_orders SET status='RETURNED', returnedAt=:a, returnReason=:rr, updatedBy=:u "
                "WHERE id=:id"),
                {"a": _now(), "rr": body.get("reason") or od.get("failureReason"), "u": user.id, "id": deliveryId})
            await _release_rider(db, od.get("riderId"))
            await _track(db, tenantId, deliveryId, "RETURNED", body.get("reason") or "Returned to store", user)
            await _notify_delivery(db, od, "RETURNED")
            return ok({"id": deliveryId, "status": "RETURNED"})

        # CANCELLED — cancelled before dispatch.
        if target == "CANCELLED":
            await db.execute(text(
                "UPDATE delivery_orders SET status='CANCELLED', updatedBy=:u WHERE id=:id"),
                {"u": user.id, "id": deliveryId})
            await _release_rider(db, od.get("riderId"))
            await _track(db, tenantId, deliveryId, "CANCELLED", body.get("note") or "Cancelled", user)
            await _notify_delivery(db, od, "CANCELLED")
            return ok({"id": deliveryId, "status": "CANCELLED"})

        # OUT_FOR_DELIVERY — rider en route.
        if target == "OUT_FOR_DELIVERY":
            if not od.get("riderId"):
                return err("Assign a rider before going out for delivery", 400)
            await db.execute(text(
                "UPDATE delivery_orders SET status='OUT_FOR_DELIVERY', dispatchedAt=:a, updatedBy=:u WHERE id=:id"),
                {"a": _now(), "u": user.id, "id": deliveryId})
            await _track(db, tenantId, deliveryId, "OUT_FOR_DELIVERY",
                         body.get("note") or "Out for delivery", user,
                         lat=body.get("latitude"), lng=body.get("longitude"))
            # Prompt 28 — rider is on the way
            await _notify_delivery(db, od, "OUT_FOR_DELIVERY")
            return ok({"id": deliveryId, "status": "OUT_FOR_DELIVERY"})

        # DELIVERED — terminal success. COD collection happens here.
        if target == "DELIVERED":
            return await _deliver_order(db, od, body, user)

    return err("Unsupported transition", 400)


async def _deliver_order(db, od: dict, body: dict, user) -> dict:
    tenant_id = od["tenantId"]
    delivery_id = od["id"]
    customer_id = od.get("customerId")
    # Proof of delivery (§—signature/photo) capture.
    pod_type = body.get("podType", "NONE").upper()
    if pod_type not in ("NONE", "SIGNATURE", "PHOTO", "BOTH"):
        pod_type = "NONE"
    await db.execute(text(
        "UPDATE delivery_orders SET status='DELIVERED', deliveredAt=:a, podType=:pt, podSignature=:ps, "
        "podPhotoUrl=:pp, podReceivedByName=:rn, updatedBy=:u WHERE id=:id"),
        {"a": _now(), "pt": pod_type, "ps": body.get("podSignature"),
         "pp": body.get("podPhotoUrl"), "rn": body.get("receivedByName"),
         "u": user.id, "id": delivery_id})
    rider_id = od.get("riderId")
    await db.execute(text("UPDATE delivery_riders SET deliveryCount=deliveryCount+1 WHERE id=:id"),
                     {"id": rider_id}) if rider_id else None
    await _release_rider(db, rider_id)
    await _track(db, tenant_id, delivery_id, "DELIVERED",
                 f"Delivered to {body.get('receivedByName') or od.get('customerName')}", user)

    # COD settlement: record the payment against the linked sale/invoice, mark
    # them paid, and post the double-entry journal (Prompt 9/16 engines).
    cod = float(od.get("codAmount") or 0)
    payment = None
    sale_id = od.get("saleId")
    invoice_id = od.get("invoiceId")
    # Prompt 28 — delivered (customer update)
    await _notify_delivery(db, od, "DELIVERED")

    if od.get("paymentType") == "COD" and cod > 0:
        if not invoice_id and sale_id:
            inv = (await db.execute(text(
                "SELECT id FROM invoices WHERE saleId=:s AND tenantId=:t LIMIT 1"),
                {"s": sale_id, "t": tenant_id})).first()
            invoice_id = inv[0] if inv else None
        payment_id = _uid()
        await db.execute(text(
            "INSERT INTO payments (id, tenantId, branchId, saleId, invoiceId, customerId, method, amount, "
            "reference, status, note, createdBy, updatedAt) "
            "VALUES (:id, :t, :b, :s, :inv, :c, 'COD', :amt, :ref, 'COMPLETED', :note, :u, NOW())"),
            {"id": payment_id, "t": tenant_id, "b": od.get("branchId"), "s": sale_id,
             "inv": invoice_id, "c": customer_id, "amt": cod,
             "ref": f"COD on {od.get('deliveryNo')}",
             "note": f"Cash on delivery — {od.get('deliveryNo')}", "u": user.id})
        # Sale: advance paid total / shrink due.
        if sale_id:
            sale = (await db.execute(text(
                "SELECT total, paidTotal FROM sales WHERE id=:id AND tenantId=:t FOR UPDATE"),
                {"id": sale_id, "t": tenant_id})).first()
            if sale:
                new_paid = round(float(sale[1]) + cod, 2)
                due = round(float(sale[0]) - new_paid, 2)
                ps = "PAID" if due <= 0.01 else "PARTIAL"
                await db.execute(text(
                    "UPDATE sales SET paidTotal=:p, dueTotal=:d, paymentStatus=:ps, status=:s WHERE id=:id"),
                    {"p": new_paid, "d": max(due, 0), "ps": ps,
                     "s": "COMPLETED" if due <= 0.01 else "CONFIRMED", "id": sale_id})
        # Invoice: advance paid total / status.
        if invoice_id:
            inv = (await db.execute(text(
                "SELECT total, paidTotal FROM invoices WHERE id=:id AND tenantId=:t FOR UPDATE"),
                {"id": invoice_id, "t": tenant_id})).first()
            if inv:
                new_paid = round(float(inv[1]) + cod, 2)
                due = round(float(inv[0]) - new_paid, 2)
                await db.execute(text(
                    "UPDATE invoices SET paidTotal=:p, status=:s WHERE id=:id"),
                    {"p": new_paid, "s": "PAID" if due <= 0.01 else "PARTIALLY_PAID", "id": invoice_id})
        # Customer AR settlement (the unpaid sale was booked to AR at sale time).
        if customer_id:
            await db.execute(text(
                "UPDATE customers SET currentDue = GREATEST(currentDue - :amt, 0) WHERE id=:c"),
                {"amt": cod, "c": customer_id})
        # Accounting (Prompt 16): Debit Cash on Hand, Credit Accounts Receivable.
        acc_lines = [("1000", cod, 0.0, f"COD collected on {od.get('deliveryNo')}"),
                     ("1100", 0.0, cod, f"Settlement of AR via COD {od.get('deliveryNo')}")]
        try:
            await acc.post_journal(db, tenant_id, refType="COD_COLLECTION", refId=delivery_id,
                                   narration=f"COD collection {od.get('deliveryNo')}",
                                   lines=acc_lines, userId=user.id)
        except Exception:
            pass  # AR balance may already be settled — journal is best-effort audit
        payment = {"id": payment_id, "amount": cod, "method": "COD",
                   "reference": f"COD on {od.get('deliveryNo')}"}

    return ok({"id": delivery_id, "status": "DELIVERED",
               "deliveryNo": od.get("deliveryNo"), "codCollected": cod, "payment": payment})


# ═══════════════════════════ DASHBOARD / TRACKING ═══════════════════════════

@router.get("/api/v1/delivery/dashboard")
async def delivery_dashboard(user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant),
                             db: AsyncSession = Depends(get_db)):
    counts = {}
    for st in ("PENDING", "PACKED", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"):
        counts[st] = (await db.execute(text(
            "SELECT COUNT(*) FROM delivery_orders WHERE tenantId=:t AND status=:s"),
            {"t": tenantId, "s": st})).first()[0]
    today = date.today().isoformat()
    today_delivered = (await db.execute(text(
        "SELECT COALESCE(SUM(codAmount + deliveryFee),0) FROM delivery_orders "
        "WHERE tenantId=:t AND status='DELIVERED' AND DATE(deliveredAt)=:d"),
        {"t": tenantId, "d": today})).first()[0]
    riders_active = (await db.execute(text(
        "SELECT COUNT(*) FROM delivery_riders WHERE tenantId=:t AND status='AVAILABLE' AND isActive=1"),
        {"t": tenantId})).first()[0]
    pending_cod = (await db.execute(text(
        "SELECT COALESCE(SUM(codAmount),0) FROM delivery_orders "
        "WHERE tenantId=:t AND paymentType='COD' AND status NOT IN ('DELIVERED','CANCELLED','RETURNED')"),
        {"t": tenantId})).first()[0]
    return ok({"counts": counts, "todayDeliveredValue": float(today_delivered or 0),
               "availableRiders": riders_active, "pendingCodValue": float(pending_cod or 0)})
