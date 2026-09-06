"""Industry Extensions 2 (Prompt 23, §11.6 / §11.7 / §11.8 / §10.30).

Implements, each on its own endpoint namespace so the tenant's business type /
feature flags decide what shows in the UI:

- Manufacturing / Bakery (§11.6): BOM (reuses the product_recipes model from
  Prompt 20), production orders with the flow
  Raw Materials → Production Order → Consumption → Finished Product → Finished Stock.
  Completion is one atomic transaction: every ingredient leaves stock through a
  traceable stock_movement (PRODUCTION_OUT) and the finished good enters stock
  (PRODUCTION_IN), with yield/wastage and production costing.

- Appointment / Booking engine (§10.25, generic): one `appointments` table and
  one set of endpoints consumed by Salon AND Repair (and any future bookable
  business) — booking, staff conflict detection, availability slots, status
  lifecycle (BOOKED → CONFIRMED → CHECKED_IN → IN_SERVICE → COMPLETED /
  NO_SHOW / CANCELLED).

- Salon & Spa (§11.7): services, packages (composite of services), staff
  schedule surfaced from bookings. Completing a service runs a real sale
  (sale + invoice + payment + accounting journal) and creates the staff
  commission through the §10.15 commission tables.

- Repair & Service Center (§11.8): tickets with spare parts / labor lines and
  the lifecycle Received → Inspection → Estimate → Approved → Repairing →
  Quality Check → Ready → Delivered. Parts are consumed from stock at payment,
  and warranty-covered repairs create a warranty claim (§18 warranty module)
  on delivery.

- Franchise Management (§10.30): franchisees, linked branches/warehouses,
  royalty + commission + fee settlement engine that calculates across all of a
  franchise's branches for a period.
"""
from __future__ import annotations

import uuid as _uuid
from datetime import date, datetime, timedelta

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


def _today() -> str:
    return str(date.today())


async def _default_branch_warehouse(db: AsyncSession, tenantId: str):
    """Return (branchId, warehouseId) for a tenant — first branch that has a
    warehouse, falling back to the first branch (warehouse may be None)."""
    row = (await db.execute(text(
        "SELECT b.id, (SELECT w.id FROM warehouses w WHERE w.branchId = b.id LIMIT 1) "
        "FROM branches b WHERE b.tenantId=:t AND EXISTS (SELECT 1 FROM warehouses w WHERE w.branchId = b.id) "
        "LIMIT 1"), {"t": tenantId})).first()
    if row:
        return (row[0], row[1])
    row = (await db.execute(text(
        "SELECT b.id, (SELECT w.id FROM warehouses w WHERE w.branchId = b.id LIMIT 1) "
        "FROM branches b WHERE b.tenantId=:t LIMIT 1"), {"t": tenantId})).first()
    return (row[0], row[1]) if row else (None, None)


async def _ensure_service_product(db, tenantId, *, name, price, cost_price, sku_tag, user) -> str:
    """Create (or reuse) a SERVICE-type products row so sale_items FK holds.
    sale_items.productId → products.id, so every service/package/labor line
    needs a real product behind it."""
    sku = f"{sku_tag}-{_uuid.uuid4().hex[:6].upper()}"
    pid = _uid()
    await db.execute(text(
        "INSERT INTO products (id, tenantId, name, sku, productType, costPrice, sellingPrice, status, createdBy) "
        "VALUES (:id, :t, :n, :s, 'SERVICE', :cp, :sp, 'ACTIVE', :u)"),
        {"id": pid, "t": tenantId, "n": name, "s": sku,
         "cp": cost_price, "sp": price, "u": user.id})
    return pid


async def _insert_sale_from_lines(db, tenantId, *, branchId, customerId, lines,
                                  invoice_prefix, note, user, shiftId=None):
    """Create sale + invoice + payments + accounting journal from generic lines.

    lines: list of dicts {productId, variantId, name, qty, unitPrice,
    discountAmount, lineTotal, method (payment method), paid}
    Returns (saleId, invoiceId, invoiceNo, total).
    """
    subtotal = round(sum(float(l["lineTotal"]) for l in lines), 2)
    payments = [l for l in lines if l.get("paid", 0) > 0]
    paid = round(sum(float(p["paid"]) for p in payments), 2)
    due = round(max(subtotal - paid, 0), 2)
    invoiceNo = gen_no(invoice_prefix)
    saleId, invoiceId = _uid(), _uid()
    await db.execute(text(
        "INSERT INTO sales (id, tenantId, branchId, terminalId, userId, customerId, invoiceNo, subtotal, "
        "discountTotal, taxTotal, serviceCharge, roundOff, total, paidTotal, dueTotal, paymentStatus, status, shiftId, note, createdBy) "
        "VALUES (:id, :t, :b, NULL, :u, :cust, :inv, :sub, 0, 0, NULL, NULL, :total, :paid, :due, :ps, 'CONFIRMED', :sh, :n, :u)"),
        {"id": saleId, "t": tenantId, "b": branchId, "u": user.id, "cust": customerId, "inv": invoiceNo,
         "sub": subtotal, "total": subtotal, "paid": paid, "due": due,
         "ps": "PAID" if due <= 0 else ("PARTIAL" if paid > 0 else "UNPAID"),
         "sh": shiftId, "n": note, "u": user.id})
    for l in lines:
        line_pid = l.get("productId")
        if not line_pid:
            line_pid = await _ensure_service_product(
                db, tenantId, name=l["name"], price=float(l["unitPrice"]),
                cost_price=0, sku_tag="SRV", user=user)
        await db.execute(text(
            "INSERT INTO sale_items (id, tenantId, saleId, productId, variantId, name, qty, unitPrice, "
            "discountAmount, lineTotal, createdBy, updatedAt) "
            "VALUES (:id, :t, :s, :p, :v, :n, :q, :up, :d, :lt, :u, NOW())"),
            {"id": _uid(), "t": tenantId, "s": saleId, "p": line_pid, "v": l.get("variantId"),
             "n": l["name"], "q": l["qty"], "up": l["unitPrice"], "d": l.get("discountAmount", 0),
             "lt": l["lineTotal"], "u": user.id})
    await db.execute(text(
        "INSERT INTO invoices (id, tenantId, branchId, saleId, customerId, invoiceNo, invoiceType, issueDate, "
        "subtotal, discountTotal, taxTotal, total, paidTotal, status, createdBy, updatedAt) "
        "VALUES (:id, :t, :b, :s, :cust, :inv, 'STANDARD', NOW(), :sub, 0, 0, :total, :paid, :st, :u, NOW())"),
        {"id": invoiceId, "t": tenantId, "b": branchId, "s": saleId, "cust": customerId, "inv": invoiceNo,
         "sub": subtotal, "total": subtotal, "paid": paid,
         "st": "PAID" if due <= 0 else ("PARTIALLY_PAID" if paid > 0 else "ISSUED"), "u": user.id})
    payment_ids = []
    for p in payments:
        pid = _uid()
        await db.execute(text(
            "INSERT INTO payments (id, tenantId, branchId, saleId, invoiceId, customerId, method, amount, "
            "reference, idempotencyKey, status, createdBy, updatedAt) "
            "VALUES (:id, :t, :b, :s, :inv, :cust, :m, :amt, :ref, :ik, 'COMPLETED', :u, NOW())"),
            {"id": pid, "t": tenantId, "b": branchId, "s": saleId, "inv": invoiceId, "cust": customerId,
             "m": p.get("method", "CASH"), "amt": p["paid"], "ref": p.get("reference"),
             "ik": p.get("idempotencyKey"), "u": user.id})
        payment_ids.append(pid)
        if p.get("method") == "CREDIT" and customerId:
            await db.execute(text("UPDATE customers SET currentDue = currentDue + :amt WHERE id=:id"),
                             {"amt": p["paid"], "id": customerId})
    # Accounting (§10.20) — debit asset per payment method, credit service revenue.
    sale_lines: list = []
    for p in payments:
        m = p.get("method", "CASH")
        amt = float(p["paid"])
        sale_lines.append((acc.METHOD_ACCOUNT.get(m, "1000"), amt, 0.0, f"Payment via {m}"))
    if due > 0:
        sale_lines.append(("1100", due, 0.0, "Balance on credit"))
    sale_lines.append(("4000", 0.0, subtotal, f"{note} {invoiceNo}"))
    await acc.post_journal(db, tenantId, refType="SALE", refId=saleId,
                           narration=f"{note} {invoiceNo}", lines=sale_lines, userId=user.id)
    return {"saleId": saleId, "invoiceId": invoiceId, "invoiceNo": invoiceNo,
            "subtotal": subtotal, "total": subtotal, "paid": paid, "due": due, "paymentIds": payment_ids}


async def _post_service_sale(db, tenantId, *, branchId, customerId, service_id, service_name,
                             qty, unit_price, payment_method, user, product_id=None):
    """Shared sale creation used by Salon service completion and repair delivery."""
    qty = float(qty or 1)
    line_total = round(qty * float(unit_price or 0), 2)
    lines = [{
        "productId": product_id or service_id, "variantId": None, "name": service_name,
        "qty": qty, "unitPrice": float(unit_price or 0), "discountAmount": 0,
        "lineTotal": line_total,
        "method": payment_method or "CASH", "paid": line_total,
    }]
    res = await _insert_sale_from_lines(
        db, tenantId, branchId=branchId, customerId=customerId, lines=lines,
        invoice_prefix="INV", note="Service sale", user=user)
    return {**res, "lineTotal": line_total}


# ═══════════════════════════ GENERIC APPOINTMENT / BOOKING ENGINE (§10.25) ═══════════════════════════

WORK_START = 9 * 60   # 09:00
WORK_END = 21 * 60    # 21:00


def _parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        try:
            return datetime.strptime(str(s), "%Y-%m-%dT%H:%M:%S")
        except Exception:
            return None


@router.get("/api/v1/appointments")
async def list_appointments(
    appointmentType: str = "", status: str = "", staffId: str = "", customerId: str = "",
    dateFrom: str = "", dateTo: str = "", page: int = Query(1), limit: int = Query(50),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "a.tenantId = :t"
    params: dict = {"t": tenantId}
    if appointmentType:
        where += " AND a.appointmentType = :at"; params["at"] = appointmentType
    if status:
        where += " AND a.status = :st"; params["st"] = status
    if staffId:
        where += " AND a.staffId = :s"; params["s"] = staffId
    if customerId:
        where += " AND a.customerId = :c"; params["c"] = customerId
    if dateFrom:
        where += " AND a.startAt >= :df"; params["df"] = f"{dateFrom} 00:00:00"
    if dateTo:
        where += " AND a.startAt <= :dt"; params["dt"] = f"{dateTo} 23:59:59"
    off = max(page - 1, 0) * limit
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT a.*, c.name AS customerName, c.phone AS customerPhone "
        f"FROM appointments a LEFT JOIN customers c ON c.id = a.customerId "
        f"WHERE {where} ORDER BY a.startAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": limit, "off": off})).fetchall())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM appointments a WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.get("/api/v1/appointments/calendar")
async def appointment_calendar(
    appointmentType: str = "", staffId: str = "",
    dateFrom: str = "", dateTo: str = "",
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Day-grid view: all appointments grouped by calendar date (for calendars)."""
    where = "a.tenantId = :t AND a.status != 'CANCELLED'"
    params: dict = {"t": tenantId}
    if appointmentType:
        where += " AND a.appointmentType = :at"; params["at"] = appointmentType
    if staffId:
        where += " AND a.staffId = :s"; params["s"] = staffId
    if dateFrom:
        where += " AND a.startAt >= :df"; params["df"] = f"{dateFrom} 00:00:00"
    if dateTo:
        where += " AND a.startAt <= :dt"; params["dt"] = f"{dateTo} 23:59:59"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT a.*, c.name AS customerName, c.phone AS customerPhone "
        f"FROM appointments a LEFT JOIN customers c ON c.id = a.customerId "
        f"WHERE {where} ORDER BY a.startAt"), params)).fetchall())
    days: dict[str, list] = {}
    for r in rows:
        d = str(r["startAt"])[:10]
        days.setdefault(d, []).append(r)
    return ok([{"date": d, "appointments": sorted(v, key=lambda x: str(x["startAt"]))} for d, v in days.items()])


@router.get("/api/v1/appointments/availability")
async def appointment_availability(
    date: str, staffId: str = "", durationMin: int = Query(30),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Free time slots for a staff member on a date (work window 09:00–21:00)."""
    day_start = datetime.strptime(date, "%Y-%m-%d")
    if not staffId:
        # No staff constraint → the whole work window is available.
        return ok([{"start": f"{date} 09:00", "end": f"{date} 21:00"}])
    busy = rows_to_dicts((await db.execute(text(
        "SELECT startAt, endAt FROM appointments WHERE tenantId=:t AND staffId=:s AND status NOT IN ('CANCELLED','NO_SHOW','COMPLETED') "
        "AND startAt >= :ds AND startAt < :de ORDER BY startAt"),
        {"t": tenantId, "s": staffId,
         "ds": day_start.strftime("%Y-%m-%d 00:00:00"),
         "de": (day_start + timedelta(days=1)).strftime("%Y-%m-%d 00:00:00")})).fetchall())
    slots = []
    cursor = WORK_START
    for b in busy:
        b_start = _parse_dt(str(b["startAt"])); b_end = _parse_dt(str(b["endAt"]))
        if not b_start or not b_end:
            continue
        start_min = b_start.hour * 60 + b_start.minute
        end_min = b_end.hour * 60 + b_end.minute
        if start_min > cursor:
            slots.append({"start": f"{date} {cursor // 60:02d}:{(cursor % 60):02d}",
                          "end": f"{date} {start_min // 60:02d}:{(start_min % 60):02d}"})
        cursor = max(cursor, end_min)
    if cursor < WORK_END:
        slots.append({"start": f"{date} {cursor // 60:02d}:{(cursor % 60):02d}",
                      "end": f"{date} {WORK_END // 60:02d}:{(WORK_END % 60):02d}"})
    # Trim slots shorter than the requested duration
    slots = [s for s in slots if _slot_minutes(s, durationMin) >= durationMin]
    return ok(slots)


def _slot_minutes(slot: dict, durationMin: int) -> int:
    st = datetime.strptime(slot["start"], "%Y-%m-%d %H:%M")
    en = datetime.strptime(slot["end"], "%Y-%m-%d %H:%M")
    return int((en - st).total_seconds() // 60)


async def _create_appointment(db, tenantId, user, body, appointment_type="GENERAL") -> dict | None:
    """Shared booking creation with staff/time conflict detection. Returns None on success
    with the record, or an error tuple."""
    customer_id = body.get("customerId")
    staff_id = body.get("staffId")
    start_at = body.get("startAt")
    if not start_at:
        raise ValueError("startAt is required")
    st = _parse_dt(start_at)
    if not st:
        raise ValueError("Invalid startAt — use YYYY-MM-DDTHH:MM:SS")
    duration = int(body.get("durationMin", 30) or 30)
    end_at = st + timedelta(minutes=duration)
    service_id = body.get("serviceId")
    service_name = body.get("serviceName")
    # Staff conflict — no overlapping bookings for the same staff member.
    if staff_id:
        clash = (await db.execute(text(
            "SELECT id, appointmentNo FROM appointments WHERE tenantId=:t AND staffId=:s "
            "AND status NOT IN ('CANCELLED','NO_SHOW','COMPLETED') AND startAt < :e AND endAt > :s2 LIMIT 1"),
            {"t": tenantId, "s": staff_id, "e": end_at.strftime("%Y-%m-%d %H:%M:%S"),
             "s2": st.strftime("%Y-%m-%d %H:%M:%S")})).first()
        if clash:
            raise ValueError(f"Staff already booked — overlapping appointment {clash[1]}")
    appt_id = _uid()
    no = gen_no("APT")
    await db.execute(text(
        "INSERT INTO appointments (id, tenantId, branchId, appointmentNo, appointmentType, customerId, serviceId, "
        "serviceName, staffId, staffName, startAt, endAt, durationMin, price, status, notes, createdBy) "
        "VALUES (:id, :t, :b, :no, :at, :c, :sv, :sn, :s, :sname, :sa, :ea, :dm, :p, 'BOOKED', :n, :u)"),
        {"id": appt_id, "t": tenantId, "b": body.get("branchId"), "no": no, "at": appointment_type,
         "c": customer_id, "sv": service_id, "sn": service_name, "s": staff_id,
         "sname": body.get("staffName"), "sa": st.strftime("%Y-%m-%d %H:%M:%S"),
         "ea": end_at.strftime("%Y-%m-%d %H:%M:%S"), "dm": duration, "p": body.get("price", 0),
         "n": body.get("notes"), "u": user.id})
    return {"id": appt_id, "appointmentNo": no, "startAt": st.isoformat(), "endAt": end_at.isoformat()}


@router.post("/api/v1/appointments")
async def create_appointment(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    try:
        created = await _create_appointment(db, tenantId, user, body, "GENERAL")
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok(created, 201)


@router.get("/api/v1/appointments/{appointmentId}")
async def get_appointment(
    appointmentId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(text(
        "SELECT a.*, c.name AS customerName, c.phone AS customerPhone "
        "FROM appointments a LEFT JOIN customers c ON c.id = a.customerId "
        "WHERE a.id=:id AND a.tenantId=:t"), {"id": appointmentId, "t": tenantId})).first()
    if not r:
        return err("Appointment not found", 404)
    return ok(dict(r._mapping))


@router.patch("/api/v1/appointments/{appointmentId}/status")
async def update_appointment_status(
    appointmentId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    status = body.get("status", "").upper()
    allowed = {"CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "NO_SHOW", "CANCELLED"}
    if status not in allowed:
        return err("status must be one of " + ", ".join(sorted(allowed)), 400)
    res = await db.execute(text(
        "UPDATE appointments SET status=:st, updatedBy=:u WHERE id=:id AND tenantId=:t"),
        {"st": status, "u": user.id, "id": appointmentId, "t": tenantId})
    await db.commit()
    if res.rowcount == 0:
        return err("Appointment not found", 404)
    return ok({"updated": True, "status": status})


# ═══════════════════════════ MANUFACTURING / BAKERY (§11.6) ═══════════════════════════

@router.get("/api/v1/manufacturing/bom")
async def list_bom(
    productId: str = "", user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    where = "pr.tenantId = :t"
    params: dict = {"t": tenantId}
    if productId:
        where += " AND pr.recipeProductId = :p"; params["p"] = productId
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT pr.*, fp.name AS finishedProductName, ip.name AS ingredientProductName, "
        f"ip.costPrice AS currentIngredientCost, ip.sellingPrice AS ingredientSellingPrice "
        f"FROM product_recipes pr "
        f"JOIN products fp ON fp.id = pr.recipeProductId "
        f"JOIN products ip ON ip.id = pr.ingredientProductId "
        f"WHERE {where} ORDER BY fp.name, ip.name"), params)).fetchall())
    return ok(rows)


@router.post("/api/v1/manufacturing/bom")
async def save_bom(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Save / replace the BOM of a finished product (reuses product_recipes)."""
    finishedProductId = body.get("finishedProductId")
    ingredients = body.get("ingredients") or []
    if not finishedProductId or not ingredients:
        return err("finishedProductId and ingredients[] are required", 400)
    prod = (await db.execute(text("SELECT id FROM products WHERE id=:id AND tenantId=:t"),
                             {"id": finishedProductId, "t": tenantId})).first()
    if not prod:
        return err("Finished product not found", 404)
    async with txn(db):
        await db.execute(text("DELETE FROM product_recipes WHERE tenantId=:t AND recipeProductId=:p"),
                         {"t": tenantId, "p": finishedProductId})
        for ing in ingredients:
            if not ing.get("ingredientProductId"):
                continue
            await db.execute(text(
                "INSERT INTO product_recipes (id, tenantId, recipeProductId, ingredientProductId, qtyRequired, unit, unitCost) "
                "VALUES (:id, :t, :rp, :ip, :q, :u, :uc)"),
                {"id": _uid(), "t": tenantId, "rp": finishedProductId, "ip": ing["ingredientProductId"],
                 "q": float(ing.get("qtyRequired", 1)), "u": ing.get("unit", "unit"),
                 "uc": float(ing.get("unitCost", 0))})
    return ok({"finishedProductId": finishedProductId, "ingredientCount": len(ingredients)}, 201)


@router.get("/api/v1/manufacturing/materials")
async def list_raw_materials(
    search: str = "", user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Products usable as raw materials: anything that is not itself a BOM output."""
    where = "p.tenantId=:t AND p.productType IN ('SIMPLE','BATCH_CONTROLLED','VARIABLE','RECIPE') " \
            "AND NOT EXISTS (SELECT 1 FROM product_recipes pr WHERE pr.recipeProductId = p.id AND pr.tenantId = p.tenantId)"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (p.name LIKE :q OR p.sku LIKE :q)"; params["q"] = f"%{search}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT p.id, p.name, p.sku, p.productType, p.costPrice, p.sellingPrice, u.name AS unitName "
        f"FROM products p LEFT JOIN units u ON u.id = p.unitId WHERE {where} ORDER BY p.name LIMIT 200"),
        params)).fetchall())
    return ok(rows)


@router.get("/api/v1/manufacturing/finished-goods")
async def list_finished_goods(
    search: str = "", user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Products that have a BOM — these are the producible finished goods."""
    where = "p.tenantId=:t AND EXISTS (SELECT 1 FROM product_recipes pr WHERE pr.recipeProductId = p.id AND pr.tenantId = p.tenantId)"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (p.name LIKE :q OR p.sku LIKE :q)"; params["q"] = f"%{search}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT p.id, p.name, p.sku, p.productType, p.costPrice, p.sellingPrice FROM products p "
        f"WHERE {where} ORDER BY p.name LIMIT 200"), params)).fetchall())
    for r in rows:
        ing = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(qtyRequired * COALESCE(unitCost, 0)), 0) FROM product_recipes "
            "WHERE tenantId=:t AND recipeProductId=:p"), {"t": tenantId, "p": r["id"]})).first()
        r["ingredientCount"] = ing[0]; r["bomCost"] = round(float(ing[1]), 2)
    return ok(rows)


@router.post("/api/v1/manufacturing/orders")
async def create_production_order(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    finishedProductId = body.get("finishedProductId")
    qty_planned = float(body.get("qtyPlanned", 0) or 0)
    if not finishedProductId or qty_planned <= 0:
        return err("finishedProductId and qtyPlanned (>0) are required", 400)
    prod = (await db.execute(text("SELECT id, name FROM products WHERE id=:id AND tenantId=:t"),
                             {"id": finishedProductId, "t": tenantId})).first()
    if not prod:
        return err("Product not found", 404)
    ingredients = rows_to_dicts((await db.execute(text(
        "SELECT pr.ingredientProductId, pr.qtyRequired, pr.unit, pr.unitCost, ip.name AS name, ip.costPrice "
        "FROM product_recipes pr JOIN products ip ON ip.id = pr.ingredientProductId "
        "WHERE pr.tenantId=:t AND pr.recipeProductId=:p"), {"t": tenantId, "p": finishedProductId})).fetchall())
    if not ingredients:
        return err("This product has no BOM — define raw materials first", 400)
    branchId = body.get("branchId"); warehouseId = body.get("warehouseId")
    if not branchId or not warehouseId:
        b, w = await _default_branch_warehouse(db, tenantId)
        branchId = branchId or b; warehouseId = warehouseId or w
    order_id = _uid()
    yield_pct = float(body.get("yieldPct", 100) or 100)
    async with txn(db):
        await db.execute(text(
            "INSERT INTO production_orders (id, tenantId, branchId, warehouseId, productionNo, finishedProductId, "
            "finishedProductName, qtyPlanned, yieldPct, batchNo, status, productionDate, dueDate, laborCost, "
            "overheadCost, note, createdBy) VALUES (:id, :t, :b, :w, :no, :fp, :fn, :q, :y, :bn, 'DRAFT', :pd, :dd, :lc, :oc, :n, :u)"),
            {"id": order_id, "t": tenantId, "b": branchId, "w": warehouseId, "no": gen_no("PO"),
             "fp": finishedProductId, "fn": prod[1], "q": qty_planned, "y": yield_pct,
             "bn": body.get("batchNo"), "pd": body.get("productionDate") or _today(),
             "dd": body.get("dueDate"), "lc": body.get("laborCost", 0), "oc": body.get("overheadCost", 0),
             "n": body.get("note"), "u": user.id})
        for ing in ingredients:
            unit_cost = float(ing.get("unitCost") or ing.get("costPrice") or 0)
            await db.execute(text(
                "INSERT INTO production_order_items (id, tenantId, productionOrderId, productId, productName, "
                "qtyRequired, unitCost, lineCost) VALUES (:id, :t, :o, :p, :n, :q, :uc, :lc)"),
                {"id": _uid(), "t": tenantId, "o": order_id, "p": ing["ingredientProductId"],
                 "n": ing["name"], "q": float(ing["qtyRequired"]) * qty_planned, "uc": unit_cost,
                 "lc": round(unit_cost * float(ing["qtyRequired"]) * qty_planned, 2)})
    return ok({"id": order_id, "status": "DRAFT"}, 201)


@router.get("/api/v1/manufacturing/orders")
async def list_production_orders(
    status: str = "", finishedProductId: str = "", branchId: str = "",
    page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "o.tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND o.status=:st"; params["st"] = status
    if finishedProductId:
        where += " AND o.finishedProductId=:p"; params["p"] = finishedProductId
    if branchId:
        where += " AND o.branchId=:b"; params["b"] = branchId
    off = max(page - 1, 0) * limit
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT o.*, b.name AS branchName, w.name AS warehouseName FROM production_orders o "
        f"LEFT JOIN branches b ON b.id = o.branchId LEFT JOIN warehouses w ON w.id = o.warehouseId "
        f"WHERE {where} ORDER BY o.createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": limit, "off": off})).fetchall())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM production_orders o WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.get("/api/v1/manufacturing/orders/{orderId}")
async def get_production_order(
    orderId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(text(
        "SELECT o.*, b.name AS branchName, w.name AS warehouseName FROM production_orders o "
        "LEFT JOIN branches b ON b.id = o.branchId LEFT JOIN warehouses w ON w.id = o.warehouseId "
        "WHERE o.id=:id AND o.tenantId=:t"), {"id": orderId, "t": tenantId})).first()
    if not r:
        return err("Production order not found", 404)
    d = dict(r._mapping)
    items = rows_to_dicts((await db.execute(text(
        "SELECT i.* FROM production_order_items i WHERE i.productionOrderId=:id ORDER BY i.createdAt"),
        {"id": orderId})).fetchall())
    return ok({**d, "items": items})


@router.post("/api/v1/manufacturing/orders/{orderId}/start")
async def start_production_order(
    orderId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(text("SELECT status FROM production_orders WHERE id=:id AND tenantId=:t"),
                          {"id": orderId, "t": tenantId})).first()
    if not r:
        return err("Production order not found", 404)
    if r[0] != "DRAFT":
        return err(f"Cannot start an order in status {r[0]}", 400)
    await db.execute(text("UPDATE production_orders SET status='IN_PROGRESS', updatedBy=:u WHERE id=:id"),
                     {"u": user.id, "id": orderId})
    await db.commit()
    return ok({"updated": True, "status": "IN_PROGRESS"})


@router.post("/api/v1/manufacturing/orders/{orderId}/complete")
async def complete_production_order(
    orderId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Atomic completion: consume every BOM ingredient from stock (PRODUCTION_OUT),
    produce the finished good into stock (PRODUCTION_IN) at the order's yield, and
    record production costing. Rolls back entirely on any failure."""
    order = (await db.execute(text(
        "SELECT * FROM production_orders WHERE id=:id AND tenantId=:t"),
        {"id": orderId, "t": tenantId})).first()
    if not order:
        return err("Production order not found", 404)
    od = dict(order._mapping)
    if od["status"] != "IN_PROGRESS":
        return err(f"Only IN_PROGRESS orders can be completed (current: {od['status']})", 400)
    warehouse_id = od["warehouseId"]
    items = rows_to_dicts((await db.execute(text(
        "SELECT * FROM production_order_items WHERE productionOrderId=:id ORDER BY createdAt"),
        {"id": orderId})).fetchall())
    if not items:
        return err("Order has no consumption lines", 400)

    qty_planned = float(od["qtyPlanned"])
    yield_pct = float(od["yieldPct"] or 100)
    qty_produced = round(qty_planned * yield_pct / 100.0, 3)
    qty_wastage = round(qty_planned - qty_produced, 3)

    async with txn(db):
        material_cost = 0.0
        for it in items:
            pid = it["productId"]
            qty_req = float(it["qtyRequired"])
            st = (await db.execute(text(
                "SELECT id, qtyOnHand, avgCost FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p "
                "AND (variantId IS NULL) FOR UPDATE"),
                {"t": tenantId, "w": warehouse_id, "p": pid})).first()
            before = float(st[1]) if st else 0.0
            after = round(before - qty_req, 3)
            unit_cost = float(it.get("unitCost") or 0)
            if unit_cost <= 0 and st and st[2]:
                unit_cost = float(st[2])
            line_cost = round(unit_cost * qty_req, 2)
            material_cost += line_cost
            if st:
                await db.execute(text("UPDATE stock SET qtyOnHand=:a, avgCost=:ac WHERE id=:id"),
                                 {"a": after, "ac": unit_cost if unit_cost > 0 else st[2], "id": st[0]})
            else:
                await db.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved, avgCost) "
                    "VALUES (UUID(), :t, :w, :p, :q, 0, :ac)"),
                    {"t": tenantId, "w": warehouse_id, "p": pid, "q": after, "ac": unit_cost})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, movementType, qty, "
                "qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (:id, :t, :b, :w, :p, 'PRODUCTION_OUT', :q, :qb, :qa, 'PRODUCTION_ORDER', :rid, :n, :u, :u)"),
                {"id": _uid(), "t": tenantId, "b": od["branchId"], "w": warehouse_id, "p": pid,
                 "q": -qty_req, "qb": before, "qa": after, "rid": orderId,
                 "n": f"Consumed for {od['productionNo']}", "u": user.id})
            await db.execute(text(
                "UPDATE production_order_items SET qtyConsumed=:qc, lineCost=:lc, unitCost=:uc WHERE id=:id"),
                {"qc": qty_req, "lc": line_cost, "uc": unit_cost, "id": it["id"]})
        # Produce finished goods
        fp = od["finishedProductId"]
        st = (await db.execute(text(
            "SELECT id, qtyOnHand, avgCost FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p "
            "AND (variantId IS NULL) FOR UPDATE"),
            {"t": tenantId, "w": warehouse_id, "p": fp})).first()
        before = float(st[1]) if st else 0.0
        after = round(before + qty_produced, 3)
        if st:
            await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": after, "id": st[0]})
        else:
            await db.execute(text(
                "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved) "
                "VALUES (UUID(), :t, :w, :p, :q, 0)"),
                {"t": tenantId, "w": warehouse_id, "p": fp, "q": after})
        await db.execute(text(
            "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, movementType, qty, "
            "qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
            "VALUES (:id, :t, :b, :w, :p, 'PRODUCTION_IN', :q, :qb, :qa, 'PRODUCTION_ORDER', :rid, :n, :u, :u)"),
            {"id": _uid(), "t": tenantId, "b": od["branchId"], "w": warehouse_id, "p": fp,
             "q": qty_produced, "qb": before, "qa": after, "rid": orderId,
             "n": f"Finished goods from {od['productionNo']}", "u": user.id})
        # Production costing
        labor = float(od.get("laborCost") or body.get("laborCost") or 0)
        overhead = float(od.get("overheadCost") or body.get("overheadCost") or 0)
        total_cost = round(material_cost + labor + overhead, 2)
        unit_cost = round(total_cost / qty_produced, 2) if qty_produced > 0 else 0.0
        await db.execute(text(
            "UPDATE production_orders SET status='COMPLETED', qtyProduced=:qp, qtyWastage=:qw, materialCost=:mc, "
            "laborCost=:lc, overheadCost=:oc, totalCost=:tc, unitCost=:uc, updatedBy=:u WHERE id=:id"),
            {"qp": qty_produced, "qw": qty_wastage, "mc": round(material_cost, 2), "lc": labor,
             "oc": overhead, "tc": total_cost, "uc": unit_cost, "u": user.id, "id": orderId})
    return ok({
        "id": orderId, "status": "COMPLETED", "qtyPlanned": qty_planned,
        "qtyProduced": qty_produced, "qtyWastage": qty_wastage, "yieldPct": yield_pct,
        "materialCost": round(material_cost, 2), "laborCost": labor, "overheadCost": overhead,
        "totalCost": total_cost, "unitCost": unit_cost,
    })


@router.post("/api/v1/manufacturing/orders/{orderId}/cancel")
async def cancel_production_order(
    orderId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(text("SELECT status FROM production_orders WHERE id=:id AND tenantId=:t"),
                          {"id": orderId, "t": tenantId})).first()
    if not r:
        return err("Production order not found", 404)
    if r[0] in ("COMPLETED", "CANCELLED"):
        return err(f"Cannot cancel an order in status {r[0]}", 400)
    await db.execute(text("UPDATE production_orders SET status='CANCELLED', updatedBy=:u WHERE id=:id"),
                     {"u": user.id, "id": orderId})
    await db.commit()
    return ok({"updated": True, "status": "CANCELLED"})


@router.get("/api/v1/manufacturing/costing/{productId}")
async def production_costing(
    productId: str, qty: float = Query(1),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Cost of producing qty units of a finished good from its BOM."""
    prod = (await db.execute(text("SELECT id, name, sellingPrice FROM products WHERE id=:id AND tenantId=:t"),
                             {"id": productId, "t": tenantId})).first()
    if not prod:
        return err("Product not found", 404)
    ingredients = rows_to_dicts((await db.execute(text(
        "SELECT pr.ingredientProductId, pr.qtyRequired, pr.unit, pr.unitCost, ip.name AS name, ip.costPrice "
        "FROM product_recipes pr JOIN products ip ON ip.id = pr.ingredientProductId "
        "WHERE pr.tenantId=:t AND pr.recipeProductId=:p"), {"t": tenantId, "p": productId})).fetchall())
    q = float(qty or 1)
    lines = []
    for ing in ingredients:
        unit_cost = float(ing.get("unitCost") or ing.get("costPrice") or 0)
        lines.append({"productId": ing["ingredientProductId"], "name": ing["name"],
                      "qtyPerUnit": float(ing["qtyRequired"]), "unitCost": unit_cost,
                      "lineCost": round(unit_cost * float(ing["qtyRequired"]) * q, 2)})
    total_cost = round(sum(float(l["lineCost"]) for l in lines), 2)
    return ok({
        "productId": productId, "productName": prod[1], "sellingPrice": float(prod[2] or 0),
        "qty": q, "totalCost": total_cost,
        "unitCost": round(total_cost / q if q > 0 else 0, 2),
        "grossMargin": round(float(prod[2] or 0) - (total_cost / q if q > 0 else 0), 2),
        "ingredients": lines,
    })


# ═══════════════════════════ SALON & SPA (§11.7) ═══════════════════════════

@router.get("/api/v1/salon/services")
async def list_salon_services(
    category: str = "", activeOnly: bool = False,
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "s.tenantId=:t"
    params: dict = {"t": tenantId}
    if category:
        where += " AND s.category=:c"; params["c"] = category
    if activeOnly:
        where += " AND s.isActive=1"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.*, b.name AS branchName FROM salon_services s LEFT JOIN branches b ON b.id=s.branchId "
        f"WHERE {where} ORDER BY s.category, s.name"), params)).fetchall())
    return ok(rows)


@router.post("/api/v1/salon/services")
async def create_salon_service(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    price = float(body.get("price", 0) or 0)
    if not name or price <= 0:
        return err("name and price (>0) are required", 400)
    s_id = _uid()
    async with txn(db):
        product_id = await _ensure_service_product(
            db, tenantId, name=name, price=price,
            cost_price=float(body.get("costPrice", 0) or 0), sku_tag="SVC", user=user)
        await db.execute(text(
            "INSERT INTO salon_services (id, tenantId, branchId, name, category, description, price, costPrice, "
            "durationMin, commissionType, commissionValue, productId, isActive, createdBy) "
            "VALUES (:id, :t, :b, :n, :c, :d, :p, :cp, :dm, :ct, :cv, :pid, 1, :u)"),
            {"id": s_id, "t": tenantId, "b": body.get("branchId"), "n": name,
             "c": body.get("category", "OTHER"), "d": body.get("description"),
             "p": price, "cp": body.get("costPrice", 0), "dm": body.get("durationMin", 30),
             "ct": body.get("commissionType", "NONE"), "cv": body.get("commissionValue", 0),
             "pid": product_id, "u": user.id})
    return ok({"id": s_id, "name": name, "productId": product_id}, 201)


@router.patch("/api/v1/salon/services/{serviceId}")
async def update_salon_service(
    serviceId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": serviceId, "t": tenantId}
    for key in ("name", "category", "description", "price", "costPrice", "durationMin",
                "commissionType", "commissionValue", "isActive"):
        if key in body:
            fields.append(f"{key} = :{key}"); params[key] = body[key]
    if not fields:
        return err("Nothing to update", 400)
    res = await db.execute(text(f"UPDATE salon_services SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Service not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/salon/services/{serviceId}")
async def delete_salon_service(
    serviceId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    used = (await db.execute(text(
        "SELECT COUNT(*) FROM salon_package_items WHERE serviceId=:id"),
        {"id": serviceId})).first()[0]
    if used:
        return err("Service is used by a package — remove it from the package first", 400)
    await db.execute(text("DELETE FROM salon_services WHERE id=:id AND tenantId=:t"),
                     {"id": serviceId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


@router.get("/api/v1/salon/packages")
async def list_salon_packages(
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT p.* FROM salon_packages p WHERE p.tenantId=:t ORDER BY p.name"), {"t": tenantId})).fetchall())
    for p in rows:
        items = rows_to_dicts((await db.execute(text(
            "SELECT pi.serviceId, pi.qty, s.name AS serviceName, s.price, s.durationMin "
            "FROM salon_package_items pi JOIN salon_services s ON s.id = pi.serviceId "
            "WHERE pi.packageId=:pid ORDER BY s.name"), {"pid": p["id"]})).fetchall())
        p["items"] = items
        p["regularTotal"] = round(sum(float(i["price"]) * float(i["qty"]) for i in items), 2)
    return ok(rows)


@router.post("/api/v1/salon/packages")
async def create_salon_package(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    service_ids = body.get("serviceIds") or []
    if not name or not service_ids:
        return err("name and serviceIds[] are required", 400)
    svcs = rows_to_dicts((await db.execute(text(
        "SELECT id, name, price FROM salon_services WHERE tenantId=:t AND id IN :ids"),
        {"t": tenantId, "ids": tuple(service_ids)})).fetchall())
    regular = round(sum(float(s["price"]) for s in svcs), 2)
    price = float(body.get("price", 0) or 0) or regular
    if price > regular and regular > 0:
        price = regular  # never charge more than sum of parts
    p_id = _uid()
    async with txn(db):
        product_id = await _ensure_service_product(
            db, tenantId, name=name, price=price, cost_price=0, sku_tag="PKG", user=user)
        await db.execute(text(
            "INSERT INTO salon_packages (id, tenantId, branchId, name, description, price, regularPrice, productId, isActive, createdBy) "
            "VALUES (:id, :t, :b, :n, :d, :p, :rp, :pid, 1, :u)"),
            {"id": p_id, "t": tenantId, "b": body.get("branchId"), "n": name,
             "d": body.get("description"), "p": price, "rp": regular, "pid": product_id, "u": user.id})
        for s in svcs:
            await db.execute(text(
                "INSERT INTO salon_package_items (id, tenantId, packageId, serviceId, qty) VALUES (:id, :t, :p, :s, 1)"),
                {"id": _uid(), "t": tenantId, "p": p_id, "s": s["id"]})
    return ok({"id": p_id, "name": name, "price": price, "regularPrice": regular, "productId": product_id}, 201)


@router.delete("/api/v1/salon/packages/{packageId}")
async def delete_salon_package(
    packageId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    async with txn(db):
        await db.execute(text("DELETE FROM salon_package_items WHERE packageId=:id"), {"id": packageId})
        await db.execute(text("DELETE FROM salon_packages WHERE id=:id AND tenantId=:t"),
                         {"id": packageId, "t": tenantId})
    return ok({"deleted": True})


@router.post("/api/v1/salon/bookings")
async def create_salon_booking(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Salon appointment — consumes the generic §10.25 booking engine."""
    service_id = body.get("serviceId")
    service = None
    if service_id:
        service = (await db.execute(text(
            "SELECT id, name, price, durationMin FROM salon_services WHERE id=:id AND tenantId=:t"),
            {"id": service_id, "t": tenantId})).first()
        if not service:
            return err("Service not found", 404)
    try:
        created = await _create_appointment(db, tenantId, user, {
            **body,
            "serviceId": service_id or body.get("packageId"),
            "serviceName": body.get("serviceName") or (service[1] if service else "Salon service"),
            "durationMin": body.get("durationMin") or (service[3] if service else 30),
            "price": body.get("price", service[2] if service else 0),
        }, "SALON")
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok(created, 201)


@router.post("/api/v1/salon/bookings/{appointmentId}/complete")
async def complete_salon_service(
    appointmentId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Complete a salon appointment: records the service sale (invoice + payment +
    accounting journal) and the staff commission (§10.15 tables)."""
    appt = (await db.execute(text(
        "SELECT * FROM appointments WHERE id=:id AND tenantId=:t AND appointmentType='SALON'"),
        {"id": appointmentId, "t": tenantId})).first()
    if not appt:
        return err("Salon appointment not found", 404)
    ad = dict(appt._mapping)
    if ad["status"] in ("COMPLETED", "CANCELLED", "NO_SHOW"):
        return err(f"Appointment is already {ad['status']}", 400)
    service = (await db.execute(text(
        "SELECT * FROM salon_services WHERE id=:id AND tenantId=:t"),
        {"id": ad["serviceId"], "t": tenantId})).first() if ad.get("serviceId") else None
    service_price = float(service._mapping.get("price") or 0) if service else 0.0
    price = float(body.get("price") or ad.get("price") or service_price or 0)
    if price <= 0:
        return err("Service price must be > 0", 400)
    payment_method = body.get("paymentMethod", "CASH")
    branch_id = ad.get("branchId")
    if not branch_id:
        b, _ = await _default_branch_warehouse(db, tenantId)
        branch_id = b

    async with txn(db):
        product_id = None
        if service:
            product_id = service._mapping.get("productId")
        else:
            # Package booking — serviceId holds the package id; use its linked product.
            pkg = (await db.execute(text(
                "SELECT productId FROM salon_packages WHERE id=:id AND tenantId=:t"),
                {"id": ad.get("serviceId"), "t": tenantId})).first()
            product_id = pkg[0] if pkg else None
        sale = await _post_service_sale(
            db, tenantId, branchId=branch_id, customerId=ad.get("customerId"),
            service_id=ad.get("serviceId"), service_name=ad.get("serviceName") or "Salon service",
            qty=1, unit_price=price, payment_method=payment_method, user=user,
            product_id=product_id)
        # Staff commission (§10.15)
        commission = None
        if ad.get("staffId"):
            staff = (await db.execute(text(
                "SELECT userId, firstName, lastName, employeeNo FROM hrm_employees WHERE id=:id AND tenantId=:t"),
                {"id": ad["staffId"], "t": tenantId})).first()
            if staff:
                staff_name = f"{staff[1]} {staff[2]}".strip() or staff[3]
                ctype, cvalue = "NONE", 0.0
                if service:
                    ctype = service._mapping.get("commissionType") or "NONE"
                    cvalue = float(service._mapping.get("commissionValue") or 0)
                if ctype == "PERCENTAGE" and cvalue > 0:
                    amount = round(price * cvalue / 100, 2)
                    commission = {"amount": amount, "type": "PERCENTAGE", "rate": cvalue}
                elif ctype == "FIXED" and cvalue > 0:
                    amount = round(cvalue, 2)
                    commission = {"amount": amount, "type": "FIXED", "rate": cvalue}
                if commission:
                    await db.execute(text(
                        "INSERT INTO commissions (id, tenantId, saleId, agentUserId, agentName, commissionType, "
                        "basisAmount, rate, amount, status, agentType, note, createdBy) "
                        "VALUES (:id, :t, :s, :au, :an, :ct, :ba, :r, :am, 'CALCULATED', 'SALON_STYLIST', :n, :u)"),
                        {"id": _uid(), "t": tenantId, "s": sale["saleId"], "au": staff[0], "an": staff_name,
                         "ct": commission["type"], "ba": price, "r": commission["rate"],
                         "am": commission["amount"], "n": f"Commission on {sale['invoiceNo']}", "u": user.id})
                    commission["agentName"] = staff_name
        await db.execute(text(
            "UPDATE appointments SET status='COMPLETED', price=:p, updatedBy=:u WHERE id=:id"),
            {"p": price, "u": user.id, "id": appointmentId})
    return ok({
        "appointmentId": appointmentId, "status": "COMPLETED",
        "sale": sale, "commission": commission,
    })


@router.get("/api/v1/salon/staff")
async def list_salon_staff(
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Staff who can perform services — hrm employees (stylists/therapists)."""
    rows = rows_to_dicts((await db.execute(text(
        "SELECT e.id, e.userId, e.employeeNo, e.firstName, e.lastName, e.phone, d.name AS departmentName, "
        "ds.name AS designationName, e.branchId FROM hrm_employees e "
        "LEFT JOIN hrm_departments d ON d.id = e.departmentId "
        "LEFT JOIN hrm_designations ds ON ds.id = e.designationId "
        "WHERE e.tenantId=:t AND e.status != 'TERMINATED' ORDER BY e.firstName"),
        {"t": tenantId})).fetchall())
    for r in rows:
        r["name"] = f"{r.pop('firstName','')} {r.pop('lastName','')}".strip()
    return ok(rows)


# ═══════════════════════════ REPAIR & SERVICE CENTER (§11.8) ═══════════════════════════

REPAIR_FLOW = {
    "RECEIVED": {"INSPECTION"},
    "INSPECTION": {"ESTIMATE", "CANCELLED"},
    "ESTIMATE": {"APPROVED", "CANCELLED"},
    "APPROVED": {"REPAIRING", "CANCELLED"},
    "REPAIRING": {"QUALITY_CHECK"},
    "QUALITY_CHECK": {"READY"},
    "READY": {"DELIVERED"},
}


@router.get("/api/v1/repair/tickets")
async def list_repair_tickets(
    status: str = "", technicianId: str = "", customerId: str = "", search: str = "",
    page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "t.tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND t.status=:st"; params["st"] = status
    if technicianId:
        where += " AND t.technicianId=:x"; params["x"] = technicianId
    if customerId:
        where += " AND t.customerId=:c"; params["c"] = customerId
    if search:
        where += " AND (t.ticketNo LIKE :q OR t.serialNo LIKE :q OR t.deviceInfo LIKE :q OR t.reportedProblem LIKE :q)"
        params["q"] = f"%{search}%"
    off = max(page - 1, 0) * limit
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT t.*, c.name AS customerName, c.phone AS customerPhone, p.name AS productName "
        f"FROM repair_tickets t "
        f"LEFT JOIN customers c ON c.id = t.customerId "
        f"LEFT JOIN products p ON p.id = t.productId "
        f"WHERE {where} ORDER BY t.createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": limit, "off": off})).fetchall())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM repair_tickets t WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.post("/api/v1/repair/tickets")
async def create_repair_ticket(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    customer_id = body.get("customerId")
    if not customer_id:
        return err("customerId is required", 400)
    product_id = body.get("productId")
    serial_no = body.get("serialNo")
    # Warranty eligibility — serialized products still inside their warranty window.
    warranty_eligible = False
    warranty_type = None
    warranty_start = warranty_end = None
    if product_id and serial_no:
        ser = (await db.execute(text(
            "SELECT id, warrantyEnd, warrantyStart FROM serials WHERE tenantId=:t AND productId=:p AND serialNo=:s LIMIT 1"),
            {"t": tenantId, "p": product_id, "s": serial_no})).first()
        if ser and ser[1] and str(ser[1]) >= _today():
            warranty_eligible = True
            warranty_type = "STORE"
            warranty_start, warranty_end = str(ser[2]), str(ser[1])
    tech = None
    if body.get("technicianId"):
        tech = (await db.execute(text(
            "SELECT firstName, lastName, employeeNo FROM hrm_employees WHERE id=:id AND tenantId=:t"),
            {"id": body["technicianId"], "t": tenantId})).first()
    ticket_id = _uid()
    await db.execute(text(
        "INSERT INTO repair_tickets (id, tenantId, branchId, ticketNo, customerId, productId, serialNo, deviceInfo, "
        "reportedProblem, status, priority, technicianId, technicianName, dueAt, warrantyEligible, warrantyType, "
        "warrantyStart, warrantyEnd, notes, createdBy) "
        "VALUES (:id, :t, :b, :no, :c, :p, :s, :di, :rp, 'RECEIVED', :pr, :x, :xn, :dd, :we, :wt, :ws, :we2, :n, :u)"),
        {"id": ticket_id, "t": tenantId, "b": body.get("branchId"), "no": gen_no("TKT"),
         "c": customer_id, "p": product_id, "s": serial_no, "di": body.get("deviceInfo"),
         "rp": body.get("reportedProblem"), "pr": body.get("priority", "MEDIUM"),
         "x": body.get("technicianId"), "xn": f"{tech[0]} {tech[1]}".strip() if tech else None,
         "dd": body.get("dueAt"), "we": 1 if warranty_eligible else 0,
         "wt": warranty_type, "ws": warranty_start, "we2": warranty_end,
         "n": body.get("notes"), "u": user.id})
    await db.commit()
    return ok({"id": ticket_id, "status": "RECEIVED",
               "warrantyEligible": warranty_eligible, "warrantyType": warranty_type}, 201)


@router.get("/api/v1/repair/tickets/{ticketId}")
async def get_repair_ticket(
    ticketId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(text(
        "SELECT t.*, c.name AS customerName, c.phone AS customerPhone, p.name AS productName "
        "FROM repair_tickets t LEFT JOIN customers c ON c.id = t.customerId "
        "LEFT JOIN products p ON p.id = t.productId "
        "WHERE t.id=:id AND t.tenantId=:t"), {"id": ticketId, "t": tenantId})).first()
    if not r:
        return err("Repair ticket not found", 404)
    d = dict(r._mapping)
    items = rows_to_dicts((await db.execute(text(
        "SELECT i.* FROM repair_ticket_items i WHERE i.ticketId=:id ORDER BY i.createdAt"),
        {"id": ticketId})).fetchall())
    warranty_claim = None
    if d.get("warrantyClaimId"):
        wc = (await db.execute(text(
            "SELECT claimNo, status, actualCost, resolution FROM warranty_claims WHERE id=:id"),
            {"id": d["warrantyClaimId"]})).first()
        if wc:
            warranty_claim = dict(wc._mapping)
    return ok({**d, "items": items, "warrantyClaim": warranty_claim})


@router.post("/api/v1/repair/tickets/{ticketId}/items")
async def add_repair_ticket_item(
    ticketId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Add a spare part (product) or labor line to a ticket."""
    t = (await db.execute(text("SELECT id, status FROM repair_tickets WHERE id=:id AND tenantId=:t"),
                          {"id": ticketId, "t": tenantId})).first()
    if not t:
        return err("Repair ticket not found", 404)
    if t[1] in ("DELIVERED", "CANCELLED"):
        return err(f"Cannot edit a ticket in status {t[1]}", 400)
    line_type = body.get("lineType", "PART").upper()
    if line_type not in ("PART", "LABOR", "OTHER"):
        return err("lineType must be PART, LABOR or OTHER", 400)
    name = body.get("name")
    qty = float(body.get("qty", 1) or 1)
    unit_price = float(body.get("unitPrice", 0) or 0)
    product_id = body.get("productId")
    if not name:
        # Auto name from product if not given
        if product_id:
            p = (await db.execute(text("SELECT name FROM products WHERE id=:id"), {"id": product_id})).first()
            name = p[0] if p else "Part"
        else:
            return err("name is required for non-product lines", 400)
    item_id = _uid()
    await db.execute(text(
        "INSERT INTO repair_ticket_items (id, tenantId, ticketId, lineType, productId, name, qty, unitPrice, lineTotal) "
        "VALUES (:id, :t, :tk, :lt, :p, :n, :q, :up, :lt2)"),
        {"id": item_id, "t": tenantId, "tk": ticketId, "lt": line_type, "p": product_id,
         "n": name, "q": qty, "up": unit_price, "lt2": round(qty * unit_price, 2)})
    await db.commit()
    return ok({"id": item_id, "lineType": line_type, "name": name, "lineTotal": round(qty * unit_price, 2)}, 201)


@router.delete("/api/v1/repair/tickets/{ticketId}/items/{itemId}")
async def remove_repair_ticket_item(
    ticketId: str, itemId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "DELETE FROM repair_ticket_items WHERE id=:id AND ticketId=:tk AND tenantId=:t"),
        {"id": itemId, "tk": ticketId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


@router.post("/api/v1/repair/tickets/{ticketId}/status")
async def transition_repair_ticket(
    ticketId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Move a ticket through the §11.8 lifecycle:
    RECEIVED → INSPECTION → ESTIMATE → APPROVED → REPAIRING → QUALITY_CHECK → READY → DELIVERED."""
    t = (await db.execute(text("SELECT * FROM repair_tickets WHERE id=:id AND tenantId=:t"),
                          {"id": ticketId, "t": tenantId})).first()
    if not t:
        return err("Repair ticket not found", 404)
    td = dict(t._mapping)
    target = body.get("status", "").upper()
    if target == td["status"]:
        return err("Ticket is already in that status", 400)
    allowed = REPAIR_FLOW.get(td["status"], set())
    if target not in allowed:
        return err(f"Cannot move from {td['status']} to {target} — allowed: {sorted(allowed) or 'final'}",
                   400)
    items = rows_to_dicts((await db.execute(text(
        "SELECT * FROM repair_ticket_items WHERE ticketId=:id"), {"id": ticketId})).fetchall())
    parts_total = round(sum(float(i["lineTotal"]) for i in items if i["lineType"] == "PART"), 2)
    labor_total = round(sum(float(i["lineTotal"]) for i in items if i["lineType"] == "LABOR"), 2)
    other_total = round(sum(float(i["lineTotal"]) for i in items if i["lineType"] == "OTHER"), 2)
    estimate = round(parts_total + labor_total + other_total, 2)
    updates = {"status": target, "updatedBy": user.id}
    if target == "INSPECTION":
        await db.execute(text(
            "UPDATE repair_tickets SET status='INSPECTION', diagnosis=:dg, updatedBy=:u WHERE id=:id"),
            {"dg": body.get("diagnosis", td.get("diagnosis")), "u": user.id, "id": ticketId})
        await db.commit()
        return ok({"updated": True, "status": "INSPECTION"})
    if target == "ESTIMATE":
        updates["estimatedCost"] = float(body.get("estimatedCost", estimate) or estimate)
        if body.get("diagnosis"):
            updates["diagnosis"] = body["diagnosis"]
        await db.execute(text(
            "UPDATE repair_tickets SET status=:st, estimatedCost=:ec, diagnosis=:dg, updatedBy=:u WHERE id=:id"),
            {"st": target, "ec": updates["estimatedCost"], "dg": body.get("diagnosis", td.get("diagnosis")),
             "u": user.id, "id": ticketId})
        await db.commit()
        return ok({"updated": True, "status": target, "estimatedCost": updates["estimatedCost"]})
    if target == "APPROVED":
        await db.execute(text("UPDATE repair_tickets SET status='APPROVED', estimatedCost=:ec, updatedBy=:u WHERE id=:id"),
                         {"ec": float(body.get("estimatedCost", td.get("estimatedCost") or estimate) or estimate),
                          "u": user.id, "id": ticketId})
        await db.commit()
        return ok({"updated": True, "status": "APPROVED"})
    if target == "REPAIRING":
        await db.execute(text(
            "UPDATE repair_tickets SET status='REPAIRING', technicianId=:x, technicianName=:xn, updatedBy=:u WHERE id=:id"),
            {"x": body.get("technicianId", td.get("technicianId")),
             "xn": body.get("technicianName", td.get("technicianName")), "u": user.id, "id": ticketId})
        await db.commit()
        return ok({"updated": True, "status": "REPAIRING"})
    if target in ("QUALITY_CHECK", "READY"):
        await db.execute(text(f"UPDATE repair_tickets SET status=:st, updatedBy=:u WHERE id=:id"),
                         {"st": target, "u": user.id, "id": ticketId})
        await db.commit()
        return ok({"updated": True, "status": target})
    if target == "DELIVERED":
        return await _deliver_repair_ticket(db, td, ticketId, items, body, user)
    return err(f"Unsupported transition to {target}", 400)


async def _deliver_repair_ticket(db, td: dict, ticketId: str, items: list, body: dict, user) -> dict:
    """Finalize a repair: consume spare parts from stock, record the labour+parts
    sale, create the warranty claim when applicable, mark the ticket DELIVERED."""
    parts = [i for i in items if i["lineType"] == "PART"]
    labor = [i for i in items if i["lineType"] == "LABOR"]
    parts_total = round(sum(float(i["lineTotal"]) for i in parts), 2)
    labor_total = round(sum(float(i["lineTotal"]) for i in labor), 2)
    total = round(parts_total + labor_total, 2)
    if total <= 0:
        return err("Ticket has no parts or labor lines to charge", 400)
    customer_id = td.get("customerId")
    branch_id = td.get("branchId")
    if not branch_id:
        b, _ = await _default_branch_warehouse(db, td["tenantId"])
        branch_id = b
    payment_method = body.get("paymentMethod", "CASH")
    async with txn(db):
        # Consume spare parts from stock (source-traceable movement)
        for p in parts:
            pid = p.get("productId")
            if not pid:
                continue
            wh = (await db.execute(text(
                "SELECT w.id FROM warehouses w JOIN branches b ON b.id = w.branchId "
                "WHERE w.branchId=:b AND w.tenantId=:t LIMIT 1"),
                {"b": branch_id, "t": td["tenantId"]})).first()
            warehouse_id = wh[0] if wh else None
            if not warehouse_id:
                continue
            qty = float(p["qty"])
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p FOR UPDATE"),
                {"t": td["tenantId"], "w": warehouse_id, "p": pid})).first()
            before = float(st[1]) if st else 0.0
            after = round(before - qty, 3)
            if st:
                await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": after, "id": st[0]})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, movementType, qty, "
                "qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (:id, :t, :b, :w, :p, 'SALE_OUT', :q, :qb, :qa, 'REPAIR_TICKET', :rid, :n, :u, :u)"),
                {"id": _uid(), "t": td["tenantId"], "b": branch_id, "w": warehouse_id, "p": pid,
                 "q": -qty, "qb": before, "qa": after, "rid": ticketId,
                 "n": f"Spare part for {td.get('ticketNo')}", "u": user.id})
        # Build the sale lines (parts + labour) with payment allocated per line.
        all_lines = []
        for i in [*parts, *labor]:
            line_pid = i.get("productId")
            if not line_pid:  # labour/other lines need a real product for the sale_items FK
                line_pid = await _ensure_service_product(
                    db, td["tenantId"], name=i["name"], price=float(i["unitPrice"]),
                    cost_price=0, sku_tag="LAB", user=user)
            all_lines.append({
                "productId": line_pid, "variantId": None, "name": i["name"],
                "qty": float(i["qty"]), "unitPrice": float(i["unitPrice"]), "discountAmount": 0,
                "lineTotal": float(i["lineTotal"]), "method": payment_method,
                "paid": round(float(i["lineTotal"]), 2),
            })
        sale = await _insert_sale_from_lines(
            db, td["tenantId"], branchId=branch_id, customerId=customer_id, lines=all_lines,
            invoice_prefix="INV", note=f"Repair {td.get('ticketNo')}", user=user)
        # Warranty claim when the device was covered (§18 linkage)
        warranty_claim = None
        if td.get("warrantyEligible") and not td.get("warrantyClaimId"):
            claim_id = _uid()
            await db.execute(text(
                "INSERT INTO warranty_claims (id, tenantId, branchId, claimNo, customerId, productId, serialNo, "
                "warrantyStart, warrantyEnd, warrantyType, issueDescription, status, resolution, resolutionNotes, "
                "actualCost, inspectedBy, inspectedAt, completedBy, completedAt, createdBy) "
                "VALUES (:id, :t, :b, :no, :c, :p, :s, :ws, :we, :wt, :iss, 'RESOLVED', 'REPAIRED', :rn, :ac, :u, NOW(), :u, NOW(), :u)"),
                {"id": claim_id, "t": td["tenantId"], "b": branch_id, "no": gen_no("WC"),
                 "c": customer_id, "p": td.get("productId"), "s": td.get("serialNo"),
                 "ws": td.get("warrantyStart") or _today(), "we": td.get("warrantyEnd") or _today(),
                 "wt": td.get("warrantyType") or "MANUFACTURER",
                 "iss": td.get("reportedProblem"), "rn": f"Repaired under warranty — {td.get('ticketNo')}",
                 "ac": total, "u": user.id})
            await db.execute(text(
                "UPDATE repair_tickets SET warrantyClaimId=:wc WHERE id=:id"),
                {"wc": claim_id, "id": ticketId})
            warranty_claim = {"id": claim_id}
        await db.execute(text(
            "UPDATE repair_tickets SET status='DELIVERED', partsCost=:pc, laborCost=:lc, actualCost=:ac, "
            "updatedBy=:u WHERE id=:id"),
            {"pc": parts_total, "lc": labor_total, "ac": total, "u": user.id, "id": ticketId})
    return ok({"status": "DELIVERED", "sale": sale, "partsCost": parts_total,
               "laborCost": labor_total, "total": total, "warrantyClaim": warranty_claim})


# ═══════════════════════════ FRANCHISE MANAGEMENT (§10.30) ═══════════════════════════

@router.get("/api/v1/franchise/franchisees")
async def list_franchisees(
    status: str = "", user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    where = "f.tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND f.status=:st"; params["st"] = status
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT f.* FROM franchises f WHERE {where} ORDER BY f.name"), params)).fetchall())
    for f in rows:
        links = rows_to_dicts((await db.execute(text(
            "SELECT fb.branchId, fb.warehouseId, fb.isActive, b.name AS branchName, w.name AS warehouseName "
            "FROM franchise_branches fb "
            "LEFT JOIN branches b ON b.id = fb.branchId LEFT JOIN warehouses w ON w.id = fb.warehouseId "
            "WHERE fb.franchiseId=:fid"), {"fid": f["id"]})).fetchall())
        f["branches"] = links
        f["_count"] = {"branches": len(links)}
    return ok(rows)


@router.post("/api/v1/franchise/franchisees")
async def create_franchisee(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    if not name:
        return err("name is required", 400)
    f_id = _uid()
    await db.execute(text(
        "INSERT INTO franchises (id, tenantId, franchiseNo, name, contactPerson, phone, email, address, territory, "
        "openingFee, royaltyRatePct, commissionRatePct, contractStart, contractEnd, status, createdBy) "
        "VALUES (:id, :t, :no, :n, :cp, :p, :e, :a, :x, :of, :rr, :cr, :cs, :ce, 'ACTIVE', :u)"),
        {"id": f_id, "t": tenantId, "no": gen_no("FR"), "n": name, "cp": body.get("contactPerson"),
         "p": body.get("phone"), "e": body.get("email"), "a": body.get("address"),
         "x": body.get("territory"), "of": body.get("openingFee", 0),
         "rr": body.get("royaltyRatePct", 5), "cr": body.get("commissionRatePct", 0),
         "cs": body.get("contractStart"), "ce": body.get("contractEnd"), "u": user.id})
    await db.commit()
    return ok({"id": f_id, "name": name}, 201)


@router.post("/api/v1/franchise/franchisees/{franchiseId}/branches")
async def assign_franchise_branches(
    franchiseId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Link existing branches (and optional warehouses) to a franchise."""
    f = (await db.execute(text("SELECT id FROM franchises WHERE id=:id AND tenantId=:t"),
                          {"id": franchiseId, "t": tenantId})).first()
    if not f:
        return err("Franchise not found", 404)
    links = body.get("branches") or []
    if not links:
        return err("branches[] with {branchId, warehouseId?} is required", 400)
    async with txn(db):
        for link in links:
            bid = link.get("branchId")
            if not bid:
                continue
            exists = (await db.execute(text(
                "SELECT id FROM franchise_branches WHERE franchiseId=:fid AND branchId=:bid AND tenantId=:t"),
                {"fid": franchiseId, "bid": bid, "t": tenantId})).first()
            if exists:
                continue
            await db.execute(text(
                "INSERT INTO franchise_branches (id, tenantId, franchiseId, branchId, warehouseId, startDate, isActive) "
                "VALUES (:id, :t, :fid, :bid, :wid, :sd, 1)"),
                {"id": _uid(), "t": tenantId, "fid": franchiseId, "bid": bid,
                 "wid": link.get("warehouseId"), "sd": body.get("startDate")})
    return ok({"linked": True}, 201)


@router.delete("/api/v1/franchise/franchisees/{franchiseId}/branches/{branchId}")
async def unlink_franchise_branch(
    franchiseId: str, branchId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "DELETE FROM franchise_branches WHERE franchiseId=:fid AND branchId=:bid AND tenantId=:t"),
        {"fid": franchiseId, "bid": branchId, "t": tenantId})
    await db.commit()
    return ok({"unlinked": True})


async def _franchise_branch_sales(db, tenantId, branch_ids: tuple, period_start: str, period_end: str):
    """Aggregate sales and returns per franchise branch over a period."""
    if not branch_ids:
        return [], 0.0, 0.0
    sales_rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.branchId, b.name AS branchName, COALESCE(SUM(s.total),0) AS gross "
        f"FROM sales s JOIN branches b ON b.id = s.branchId "
        f"WHERE s.tenantId=:t AND s.branchId IN :ids AND s.status='CONFIRMED' "
        f"AND s.saleDate >= :ps AND s.saleDate < :pe "
        f"GROUP BY s.branchId, b.name"),
        {"t": tenantId, "ids": branch_ids, "ps": f"{period_start} 00:00:00",
         "pe": f"{period_end} 23:59:59"})).fetchall())
    returns_rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.branchId, COALESCE(SUM(r.refundAmount),0) AS ret "
        f"FROM returns r JOIN sales s ON s.id = r.saleId "
        f"WHERE s.tenantId=:t AND s.branchId IN :ids AND r.status <> 'CANCELLED' "
        f"AND s.saleDate >= :ps AND s.saleDate < :pe "
        f"GROUP BY s.branchId"),
        {"t": tenantId, "ids": branch_ids, "ps": f"{period_start} 00:00:00",
         "pe": f"{period_end} 23:59:59"})).fetchall())
    ret_map = {r["branchId"]: float(r["ret"]) for r in returns_rows}
    lines = []
    total_gross = total_returns = 0.0
    for s in sales_rows:
        ret = ret_map.get(s["branchId"], 0.0)
        lines.append({"branchId": s["branchId"], "branchName": s["branchName"],
                      "grossSales": round(float(s["gross"]), 2), "returnsTotal": round(ret, 2),
                      "netSales": round(float(s["gross"]) - ret, 2)})
        total_gross += float(s["gross"]); total_returns += ret
    return lines, round(total_gross, 2), round(total_returns, 2)


async def _compute_franchise_settlement(db, tenantId, franchise_id, period_start, period_end, body=None):
    f = (await db.execute(text("SELECT * FROM franchises WHERE id=:id AND tenantId=:t"),
                          {"id": franchise_id, "t": tenantId})).first()
    if not f:
        return None, "Franchise not found"
    fd = dict(f._mapping)
    links = (await db.execute(text("SELECT branchId FROM franchise_branches WHERE franchiseId=:fid AND tenantId=:t AND isActive=1"),
                              {"fid": franchise_id, "t": tenantId})).fetchall()
    branch_ids = tuple(l[0] for l in links)
    if not branch_ids:
        return None, "Franchise has no linked branches"
    lines, gross, returns_total = await _franchise_branch_sales(
        db, tenantId, branch_ids, period_start, period_end)
    net_sales = round(gross - returns_total, 2)
    if body and body.get("royaltyRatePct") is not None:
        royalty_rate = float(body.get("royaltyRatePct"))
    else:
        royalty_rate = float(fd.get("royaltyRatePct") or 0)
    if body and body.get("commissionRatePct") is not None:
        commission_rate = float(body.get("commissionRatePct"))
    else:
        commission_rate = float(fd.get("commissionRatePct") or 0)
    royalty = round(net_sales * royalty_rate / 100.0, 2)
    commission = round(net_sales * commission_rate / 100.0, 2)
    fee = float(body.get("feeAmount", 0) or 0) if body else 0.0
    if body and body.get("includeOpeningFee") and fee <= 0:
        fee = float(fd.get("openingFee") or 0)
    per_branch = []
    for l in lines:
        per_branch.append({**l, "royaltyAmount": round(l["netSales"] * royalty_rate / 100.0, 2)})
    total = round(royalty + fee + commission, 2)
    return {
        "franchiseId": franchise_id, "franchiseName": fd.get("name"),
        "royaltyRatePct": royalty_rate, "commissionRatePct": commission_rate,
        "periodStart": period_start, "periodEnd": period_end,
        "branchCount": len(lines), "grossSales": gross, "returnsTotal": returns_total,
        "netSales": net_sales, "royaltyAmount": royalty, "feeAmount": fee,
        "commissionAmount": commission, "totalAmount": total, "lines": per_branch,
    }, None


@router.post("/api/v1/franchise/settlements/calculate")
async def calculate_franchise_settlement(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    franchise_id = body.get("franchiseId")
    period_start = body.get("periodStart"); period_end = body.get("periodEnd")
    if not franchise_id or not period_start or not period_end:
        return err("franchiseId, periodStart, periodEnd are required", 400)
    result, error = await _compute_franchise_settlement(db, tenantId, franchise_id, period_start, period_end, body)
    if error:
        return err(error, 400)
    return ok(result)


@router.post("/api/v1/franchise/settlements")
async def create_franchise_settlement(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    franchise_id = body.get("franchiseId")
    period_start = body.get("periodStart"); period_end = body.get("periodEnd")
    if not franchise_id or not period_start or not period_end:
        return err("franchiseId, periodStart, periodEnd are required", 400)
    result, error = await _compute_franchise_settlement(db, tenantId, franchise_id, period_start, period_end, body)
    if error:
        return err(error, 400)
    existing = (await db.execute(text(
        "SELECT id FROM franchise_settlements WHERE tenantId=:t AND franchiseId=:fid AND periodStart=:ps AND periodEnd=:pe"),
        {"t": tenantId, "fid": franchise_id, "ps": period_start, "pe": period_end})).first()
    settlement_id = existing[0] if existing else _uid()
    async with txn(db):
        if existing:
            await db.execute(text("DELETE FROM franchise_settlement_lines WHERE settlementId=:id"),
                             {"id": settlement_id})
            await db.execute(text(
                "UPDATE franchise_settlements SET grossSales=:g, returnsTotal=:r, netSales=:n, royaltyRatePct=:rr, "
                "royaltyAmount=:ra, feeAmount=:f, commissionAmount=:ca, totalAmount=:ta, notes=:no "
                "WHERE id=:id"),
                {"g": result["grossSales"], "r": result["returnsTotal"], "n": result["netSales"],
                 "rr": result["royaltyRatePct"], "ra": result["royaltyAmount"], "f": result["feeAmount"],
                 "ca": result["commissionAmount"], "ta": result["totalAmount"], "no": body.get("notes"),
                 "id": settlement_id})
        else:
            await db.execute(text(
                "INSERT INTO franchise_settlements (id, tenantId, franchiseId, settlementNo, periodStart, periodEnd, "
                "grossSales, returnsTotal, netSales, royaltyRatePct, royaltyAmount, feeAmount, commissionAmount, "
                "totalAmount, status, notes, createdBy) "
                "VALUES (:id, :t, :fid, :no, :ps, :pe, :g, :r, :n, :rr, :ra, :f, :ca, :ta, 'DRAFT', :no2, :u)"),
                {"id": settlement_id, "t": tenantId, "fid": franchise_id, "no": gen_no("STL"),
                 "ps": period_start, "pe": period_end, "g": result["grossSales"],
                 "r": result["returnsTotal"], "n": result["netSales"], "rr": result["royaltyRatePct"],
                 "ra": result["royaltyAmount"], "f": result["feeAmount"], "ca": result["commissionAmount"],
                 "ta": result["totalAmount"], "no2": body.get("notes"), "u": user.id})
        for line in result["lines"]:
            await db.execute(text(
                "INSERT INTO franchise_settlement_lines (id, tenantId, settlementId, branchId, branchName, grossSales, "
                "returnsTotal, netSales, royaltyAmount) VALUES (:id, :t, :sid, :b, :bn, :g, :r, :n, :ra)"),
                {"id": _uid(), "t": tenantId, "sid": settlement_id, "b": line["branchId"],
                 "bn": line["branchName"], "g": line["grossSales"], "r": line["returnsTotal"],
                 "n": line["netSales"], "ra": line["royaltyAmount"]})
    return ok({"id": settlement_id, "settlementNo": None, **result}, 201)


@router.get("/api/v1/franchise/settlements")
async def list_franchise_settlements(
    franchiseId: str = "", status: str = "",
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "s.tenantId=:t"
    params: dict = {"t": tenantId}
    if franchiseId:
        where += " AND s.franchiseId=:f"; params["f"] = franchiseId
    if status:
        where += " AND s.status=:st"; params["st"] = status
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.*, f.name AS franchiseName FROM franchise_settlements s "
        f"JOIN franchises f ON f.id = s.franchiseId "
        f"WHERE {where} ORDER BY s.periodEnd DESC, s.createdAt DESC"), params)).fetchall())
    return ok(rows)


@router.post("/api/v1/franchise/settlements/{settlementId}/status")
async def update_franchise_settlement_status(
    settlementId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    status = body.get("status", "").upper()
    if status not in ("APPROVED", "PAID", "CANCELLED"):
        return err("status must be APPROVED, PAID or CANCELLED", 400)
    s = (await db.execute(text("SELECT status FROM franchise_settlements WHERE id=:id AND tenantId=:t"),
                          {"id": settlementId, "t": tenantId})).first()
    if not s:
        return err("Settlement not found", 404)
    if status == "PAID" and s[0] != "APPROVED":
        return err("Only an APPROVED settlement can be marked PAID", 400)
    extra = ""
    params: dict = {"st": status, "u": user.id, "id": settlementId}
    if status == "APPROVED":
        extra = ", approvedBy=:u, approvedAt=NOW()"
    if status == "PAID":
        extra = ", paidAt=NOW()"
    await db.execute(text(f"UPDATE franchise_settlements SET status=:st{extra} WHERE id=:id"), params)
    await db.commit()
    return ok({"updated": True, "status": status})


@router.get("/api/v1/franchise/franchisees/{franchiseId}/report")
async def franchise_report(
    franchiseId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Dashboard numbers for a franchisee across all its branches."""
    f = (await db.execute(text("SELECT * FROM franchises WHERE id=:id AND tenantId=:t"),
                          {"id": franchiseId, "t": tenantId})).first()
    if not f:
        return err("Franchise not found", 404)
    fd = dict(f._mapping)
    links = rows_to_dicts((await db.execute(text(
        "SELECT fb.branchId, b.name AS branchName FROM franchise_branches fb "
        "JOIN branches b ON b.id = fb.branchId WHERE fb.franchiseId=:fid AND fb.tenantId=:t AND fb.isActive=1"),
        {"fid": franchiseId, "t": tenantId})).fetchall())
    branch_ids = tuple(l["branchId"] for l in links)
    total_sales = 0.0
    if branch_ids:
        r = (await db.execute(text(
            "SELECT COALESCE(SUM(total),0) FROM sales WHERE tenantId=:t AND branchId IN :ids AND status='CONFIRMED'"),
            {"t": tenantId, "ids": branch_ids})).first()
        total_sales = float(r[0])
    stl = (await db.execute(text(
        "SELECT COALESCE(SUM(royaltyAmount),0), COALESCE(SUM(totalAmount),0) FROM franchise_settlements "
        "WHERE tenantId=:t AND franchiseId=:fid AND status NOT IN ('CANCELLED')"),
        {"t": tenantId, "fid": franchiseId})).first()
    return ok({
        **{k: fd.get(k) for k in ("id", "franchiseNo", "name", "contactPerson", "territory",
                                  "openingFee", "royaltyRatePct", "commissionRatePct", "status")},
        "branches": links, "totalSales": round(total_sales, 2),
        "settledRoyalty": round(float(stl[0]), 2), "settledTotal": round(float(stl[1]), 2),
    })


# ═══════════════════════════ SHARED LOOKUPS FOR THE UI ═══════════════════════════

@router.get("/api/v1/manufacturing/lookups")
async def manufacturing_lookups(
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    branches = rows_to_dicts((await db.execute(text(
        "SELECT id, name FROM branches WHERE tenantId=:t ORDER BY name"), {"t": tenantId})).fetchall())
    warehouses = rows_to_dicts((await db.execute(text(
        "SELECT id, name, branchId FROM warehouses WHERE tenantId=:t ORDER BY name"), {"t": tenantId})).fetchall())
    return ok({"branches": branches, "warehouses": warehouses})
