"""Remaining routers — credit, installments, sales orders, invoices, pricing, inventory queries, branches/settings."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import accounting as acc
import workflow as wf
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params, gen_no

router = APIRouter()


def _uuid():
    import uuid as u
    return str(u.uuid4())


# ═════════════════════════ CREDIT (§10.13) ═════════════════════════

@router.get("/api/v1/credit")
async def list_credit(onHoldOnly: bool = False, overLimitOnly: bool = False,
                      user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                      db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT id, name, phone, creditLimit, currentDue, creditPeriodDays, status FROM customers WHERE {where} "
        f"AND creditLimit > 0 ORDER BY currentDue DESC"), params)).fetchall())
    out = []
    for r in rows:
        item = {**r, "availableCredit": float(r["creditLimit"]) - float(r["currentDue"]),
                "isOverLimit": float(r["currentDue"]) > float(r["creditLimit"])}
        if onHoldOnly and r["status"] != "INACTIVE": continue
        if overLimitOnly and not item["isOverLimit"]: continue
        out.append(item)
    return ok(out)


@router.get("/api/v1/credit/aging")
async def credit_aging(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                       db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text(
        "SELECT i.customerId, c.name AS customerName, "
        "SUM(CASE WHEN i.issueDate >= NOW() - INTERVAL 30 DAY THEN i.total - i.paidTotal ELSE 0 END) b0, "
        "SUM(CASE WHEN i.issueDate < NOW() - INTERVAL 30 DAY AND i.issueDate >= NOW() - INTERVAL 60 DAY THEN i.total - i.paidTotal ELSE 0 END) b30, "
        "SUM(CASE WHEN i.issueDate < NOW() - INTERVAL 60 DAY AND i.issueDate >= NOW() - INTERVAL 90 DAY THEN i.total - i.paidTotal ELSE 0 END) b60, "
        "SUM(CASE WHEN i.issueDate < NOW() - INTERVAL 90 DAY THEN i.total - i.paidTotal ELSE 0 END) b90 "
        "FROM invoices i JOIN customers c ON c.id = i.customerId "
        "WHERE i.tenantId=:t AND i.status IN ('ISSUED','PARTIALLY_PAID') "
        "GROUP BY i.customerId, c.name HAVING (b0+b30+b60+b90) > 0"), {"t": tenantId})).fetchall()
    out = []
    for r in rows:
        out.append({"customerId": r[0], "customerName": r[1], "current": float(r[2]), "d1_30": float(r[3]),
                    "d31_60": float(r[4]), "d61_90": float(r[5]), "d90_plus": float(r[6]),
                    "total": float(r[2]) + float(r[3]) + float(r[4]) + float(r[5])})
    return ok(out)


@router.patch("/api/v1/credit/{customerId}/limit")
async def set_credit_limit(customerId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    limit = body.get("creditLimit")
    if limit is None: return err("creditLimit is required", 400)
    cur = (await db.execute(text("SELECT name, creditLimit FROM customers WHERE id=:id AND tenantId=:t"),
                            {"id": customerId, "t": tenantId})).first()
    if not cur: return err("Customer not found", 404)
    # ── Prompt 27 credit approval: raising the limit past the configured threshold ──
    increase = float(limit) - float(cur[1] or 0)
    if increase > 0:
        apr = await wf.create_approval(
            db, tenantId, "CREDIT_LIMIT", customerId, cur[0],
            f"Credit limit increase for {cur[0]} (+৳{increase:,.0f})", increase,
            {"customerId": customerId, "creditLimit": float(limit),
             "creditPeriodDays": body.get("creditPeriodDays")}, user.id)
        if apr:
            await db.commit()
            return ok({"updated": False, "needsApproval": True, "approval": apr}, 202)
    res = await db.execute(text(
        "UPDATE customers SET creditLimit=:c, creditPeriodDays=COALESCE(:p, creditPeriodDays), updatedBy=:u WHERE id=:id AND tenantId=:t"),
        {"c": limit, "p": body.get("creditPeriodDays"), "u": user.id, "id": customerId, "t": tenantId})
    await db.commit()
    return ok({"updated": True})


@router.post("/api/v1/credit/{customerId}/hold")
async def credit_hold(customerId: str, body: dict, user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    hold = 1 if body.get("onHold", True) else 0
    cur = (await db.execute(text("SELECT name FROM customers WHERE id=:id AND tenantId=:t"),
                            {"id": customerId, "t": tenantId})).first()
    if not cur: return err("Customer not found", 404)
    # ── Prompt 27 credit approval: placing/removing a hold needs sign-off ──
    apr = await wf.create_approval(
        db, tenantId, "CREDIT_HOLD", customerId, cur[0],
        f"{'Place' if hold else 'Release'} credit hold on {cur[0]}", 1,
        {"customerId": customerId, "onHold": bool(hold)}, user.id)
    if apr:
        await db.commit()
        return ok({"onHold": False, "needsApproval": True, "approval": apr}, 202)
    res = await db.execute(text(
        "UPDATE customers SET status = CASE WHEN :h=1 THEN 'INACTIVE' ELSE 'ACTIVE' END, updatedBy=:u WHERE id=:id AND tenantId=:t"),
        {"h": hold, "u": user.id, "id": customerId, "t": tenantId})
    await db.commit()
    return ok({"onHold": bool(hold)})


# ═════════════════════════ INSTALLMENTS (§10.14) ═════════════════════════

@router.get("/api/v1/installments")
async def list_installments(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT i.*, c.name AS customerName FROM installments i LEFT JOIN customers c ON c.id=i.customerId "
        "WHERE i.tenantId=:t ORDER BY i.createdAt DESC LIMIT 100"), {"t": tenantId})).fetchall())
    for r in rows:
        r["customer"] = {"id": r.pop("customerId"), "name": r.pop("customerName")} if r.get("customerName") else None
        r["schedules"] = rows_to_dicts((await db.execute(text(
            "SELECT * FROM installment_schedules WHERE installmentId=:id ORDER BY dueDate"), {"id": r["id"]})).fetchall())
    return ok(rows)


@router.post("/api/v1/installments")
async def create_installment(body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    customerId, total = body.get("customerId"), float(body.get("totalAmount", 0) or 0)
    count = int(body.get("installmentCount", 0) or 0)
    if not customerId or total <= 0 or count <= 0:
        return err("customerId, totalAmount, installmentCount required", 400)
    cust = (await db.execute(text("SELECT name, phone, email FROM customers WHERE id=:c AND tenantId=:t"),
                             {"c": customerId, "t": tenantId})).first()
    if not cust:
        return err("Customer not found", 404)
    cust_name = cust[0]
    freq = body.get("frequency", "MONTHLY")
    down = float(body.get("downPayment", 0) or 0)
    finance = max(total - down, 0)
    per = round(finance / count, 2)
    from datetime import datetime, timedelta
    step = {"WEEKLY": timedelta(weeks=1), "MONTHLY": timedelta(days=30)}.get(freq, timedelta(days=30))
    async with txn(db):
        ins_id = _uuid()
        await db.execute(text(
            "INSERT INTO installments (id, tenantId, customerId, saleId, planNo, financedAmount, downPayment, "
            "installmentCount, installmentAmount, frequency, startDate, totalPayable, status, createdBy) "
            "VALUES (:id, :t, :c, :s, :no, :fin, :dp, :cnt, :per, :f, NOW(), :tp, 'ACTIVE', :u)"),
            {"id": ins_id, "t": tenantId, "c": customerId, "s": body.get("saleId"), "no": gen_no("INS"),
             "fin": finance, "dp": down, "cnt": count, "per": per, "f": freq,
             "tp": round(per * count, 2), "u": user.id})
        for n in range(1, count + 1):
            await db.execute(text(
                "INSERT INTO installment_schedules (id, tenantId, installmentId, sequenceNo, dueDate, amount, paidAmount, status) "
                "VALUES (UUID(), :t, :ins, :n, :due, :amt, 0, 'DUE')"),
                {"t": tenantId, "ins": ins_id, "n": n, "due": datetime.now() + step * n, "amt": per})
        # Prompt 28 — welcome/reminder notification (consent-aware engine)
        try:
            import notify as _nt
            plan = (await db.execute(text("SELECT planNo FROM installments WHERE id=:i"), {"i": ins_id})).first()
            await _nt.dispatch(
                db, tenantId, "INSTALLMENT_DUE", customer_id=customerId, name=cust_name,
                ref_type="INSTALLMENT", ref_id=ins_id,
                params={"name": cust_name, "planNo": plan[0] if plan else "",
                        "amount": per, "dueDate": (datetime.now() + step).strftime("%Y-%m-%d")})
        except Exception:
            pass
    return ok({"id": ins_id, "perInstallment": per, "count": count}, 201)


@router.post("/api/v1/installments/{installmentId}/pay")
async def pay_installment(installmentId: str, body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    sched_id = body.get("scheduleId"); amount = float(body.get("amount", 0) or 0)
    if not sched_id or amount <= 0: return err("scheduleId and positive amount required", 400)
    async with txn(db):
        s = (await db.execute(text("SELECT id, amount, paidAmount, status FROM installment_schedules WHERE id=:id AND tenantId=:t FOR UPDATE"),
                              {"id": sched_id, "t": tenantId})).first()
        if not s: raise Exception("Schedule not found")
        if s[3] == "PAID": raise Exception("Installment already paid")
        new_paid = float(s[2]) + amount
        await db.execute(text(
            "UPDATE installment_schedules SET paidAmount=:p, status=:st WHERE id=:id"),
            {"p": new_paid, "st": "PAID" if new_paid >= float(s[1]) else "PARTIAL", "id": sched_id})
        remaining = (await db.execute(text(
            "SELECT COUNT(*) FROM installment_schedules WHERE installmentId=:ins AND status != 'PAID'"),
            {"ins": installmentId})).first()[0]
        if remaining == 0:
            await db.execute(text("UPDATE installments SET status='COMPLETED' WHERE id=:id"), {"id": installmentId})
        # Accounting (§10.20): INSTALLMENT_PAID journal — Debit Cash, Credit Accounts Receivable
        await acc.post_journal(db, tenantId, refType="INSTALLMENT_PAID", refId=installmentId,
                               narration=f"Installment {installmentId} paid", lines=[
                                   ("1000", amount, 0.0, "Installment receipt"),
                                   ("1100", 0.0, amount, "AR settlement"),
                               ], userId=user.id)
        # Prompt 28 — payment receipt to the customer (consent-aware)
        try:
            import notify as _nt
            ins_row = (await db.execute(text(
                "SELECT ip.customerId, c.name, ip.planNo FROM installments ip "
                "JOIN customers c ON c.id=ip.customerId WHERE ip.id=:i AND ip.tenantId=:t"),
                {"i": installmentId, "t": tenantId})).first()
            if ins_row:
                await _nt.dispatch(
                    db, tenantId, "PAYMENT", customer_id=ins_row[0], name=ins_row[1],
                    ref_type="INSTALLMENT", ref_id=installmentId,
                    params={"name": ins_row[1], "amount": amount,
                            "invoiceNo": f"plan {ins_row[2]}"})
        except Exception:
            pass
    return ok({"paid": amount, "completed": remaining == 0})


@router.post("/api/v1/installments/{installmentId}/settle")
async def settle_installment(installmentId: str, body: dict, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    async with txn(db):
        await db.execute(text(
            "UPDATE installment_schedules SET status='PAID', paidAmount=amount WHERE installmentId=:id AND status != 'PAID'"),
            {"id": installmentId})
        await db.execute(text("UPDATE installments SET status='COMPLETED' WHERE id=:id AND tenantId=:t"),
                         {"id": installmentId, "t": tenantId})
    return ok({"settled": True})


@router.post("/api/v1/installments/{installmentId}/reschedule")
async def reschedule_installment(installmentId: str, body: dict, user: AuthUser = Depends(require_auth),
                                 tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    count = int(body.get("installmentCount", 0) or 0)
    if count <= 0: return err("installmentCount required", 400)
    async with txn(db):
        ins = (await db.execute(text(
            "SELECT financedAmount, paidTotal FROM installments WHERE id=:id AND tenantId=:t"),
            {"id": installmentId, "t": tenantId})).first()
        if not ins: raise Exception("Installment not found")
        remaining = float(ins[0]) - float(ins[1] or 0)
        await db.execute(text("DELETE FROM installment_schedules WHERE installmentId=:id AND status='DUE'"), {"id": installmentId})
        per = round(remaining / count, 2)
        from datetime import datetime, timedelta
        for n in range(1, count + 1):
            await db.execute(text(
                "INSERT INTO installment_schedules (id, tenantId, installmentId, installmentNo, dueDate, amount, paidAmount, status) "
                "VALUES (UUID(), :t, :ins, :n, :due, :amt, 0, 'DUE')"),
                {"t": tenantId, "ins": installmentId, "n": n, "due": datetime.now() + timedelta(days=30 * n), "amt": per})
        await db.execute(text("UPDATE installments SET installmentCount=:c WHERE id=:id"),
                         {"c": count, "id": installmentId})
    return ok({"rescheduled": True, "perInstallment": per})


# ═════════════════════════ SALES ORDERS / QUOTATIONS (§10.10-10.11) ═════════════════════════

@router.get("/api/v1/sales/orders")
async def list_sales_orders(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM sales_orders WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 50"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.get("/api/v1/sales/quotations")
async def list_quotations(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                          db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM quotations WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 50"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/sales/quotations")
async def create_quotation(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Quotation needs items", 400)
    total = sum(float(i.get("qty", 0)) * float(i.get("unitPrice", 0)) for i in items)
    qno = gen_no("QUO")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO quotations (id, tenantId, branchId, customerId, quotationNo, quotationDate, validUntil, subtotal, total, "
            "status, note, createdBy) VALUES (UUID(), :t, :b, :c, :q, NOW(), :valid, :sub, :total, 'DRAFT', :n, :u)"),
            {"t": tenantId, "b": body.get("branchId"), "c": body.get("customerId"), "q": qno,
             "valid": body.get("validUntil"), "sub": total, "total": total, "n": body.get("note"), "u": user.id})
        qid = (await db.execute(text("SELECT id FROM quotations WHERE tenantId=:t AND quotationNo=:q"),
                               {"t": tenantId, "q": qno})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO quotation_items (id, tenantId, quotationId, productId, qty, unitPrice, lineTotal) "
                "VALUES (UUID(), :t, :q, :p, :qty, :up, :lt)"),
                {"t": tenantId, "q": qid, "p": i["productId"], "qty": i.get("qty", 0), "up": i.get("unitPrice", 0),
                 "lt": float(i.get("qty", 0)) * float(i.get("unitPrice", 0))})
    return ok({"quoteNo": qno, "id": qid, "total": total}, 201)


# ═════════════════════════ INVOICES (§10.12) ═════════════════════════

@router.get("/api/v1/invoices")
async def list_invoices(status: str = "", page: int = Query(1), limit: int = Query(20),
                        user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                        db: AsyncSession = Depends(get_db)):
    where = "i.tenantId=:t"; params: dict = {"t": tenantId}
    if status: where += " AND i.status=:st"; params["st"] = status
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT i.*, c.name AS customerName FROM invoices i LEFT JOIN customers c ON c.id=i.customerId "
        f"WHERE {where} ORDER BY i.createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    for r in rows:
        r["customer"] = {"id": r.pop("customerId"), "name": r.pop("customerName")} if r.get("customerName") else None
    total = (await db.execute(text(f"SELECT COUNT(*) FROM invoices i WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.get("/api/v1/invoices/{invoiceId}")
async def get_invoice(invoiceId: str, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text(
        "SELECT i.*, c.name AS customerName FROM invoices i LEFT JOIN customers c ON c.id=i.customerId "
        "WHERE i.id=:id AND i.tenantId=:t"), {"id": invoiceId, "t": tenantId})).first()
    if not r: return err("Invoice not found", 404)
    d = dict(r._mapping)
    d["customer"] = {"id": d.pop("customerId"), "name": d.pop("customerName")} if d.get("customerName") else None
    d["items"] = rows_to_dicts((await db.execute(text(
        "SELECT * FROM invoice_items WHERE invoiceId=:id"), {"id": invoiceId})).fetchall())
    return ok(d)


@router.post("/api/v1/invoices/payments/allocate")
async def allocate_payment(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """One payment across multiple invoices (§10.12)."""
    allocations = body.get("allocations") or []
    amount = float(body.get("amount", 0) or 0)
    alloc_sum = sum(float(a["amount"]) for a in allocations)
    if not allocations: return err("allocations required", 400)
    if abs(alloc_sum - amount) > 0.01: return err(f"Allocation mismatch: {alloc_sum} vs {amount}", 400)
    customerId = body.get("customerId")
    async with txn(db):
        for a in allocations:
            await db.execute(text(
                "INSERT INTO payments (id, tenantId, branchId, invoiceId, customerId, method, amount, reference, status, createdBy, updatedAt) "
                "VALUES (UUID(), :t, :b, :inv, :c, :m, :amt, :ref, 'COMPLETED', :u, NOW())"),
                {"t": tenantId, "b": body.get("branchId"), "inv": a["invoiceId"], "c": customerId,
                 "m": body.get("method", "CASH"), "amt": a["amount"], "ref": body.get("reference"), "u": user.id})
            inv = (await db.execute(text("SELECT total, paidTotal FROM invoices WHERE id=:id FOR UPDATE"),
                                    {"id": a["invoiceId"]})).first()
            new_paid = float(inv[1]) + float(a["amount"])
            due = float(inv[0]) - new_paid
            await db.execute(text("UPDATE invoices SET paidTotal=:p, status=:s WHERE id=:id"),
                             {"p": new_paid, "s": "PAID" if due <= 0.01 else "PARTIALLY_PAID", "id": a["invoiceId"]})
        if customerId:
            await db.execute(text("UPDATE customers SET currentDue = currentDue - :amt WHERE id=:c"),
                             {"amt": amount, "c": customerId})
    return ok({"allocated": amount, "invoices": len(allocations)}, 201)


# ═════════════════════════ PRICING (§10.5) ═════════════════════════

@router.get("/api/v1/price-lists")
async def list_price_lists(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                           db: AsyncSession = Depends(get_db)):
    # Prompt 39: price config cached 60s per tenant; invalidated on writes below.
    import cache as cache_mod
    from util import ApiJSONResponse
    cache_key = f"price_lists:{tenantId}:list"
    hit = cache_mod.get(cache_key)
    if hit is not None:
        return ApiJSONResponse(hit)
    rows = rows_to_dicts((await db.execute(text(
        "SELECT pl.*, (SELECT COUNT(*) FROM price_list_items x WHERE x.priceListId = pl.id) itemCount "
        "FROM price_lists pl WHERE pl.tenantId=:t ORDER BY pl.createdAt DESC"), {"t": tenantId})).fetchall())
    for r in rows: r["_count"] = {"items": r.pop("itemCount")}
    body = {"data": rows}
    cache_mod.set(cache_key, body, ttl=60)
    return ApiJSONResponse(body)


@router.post("/api/v1/price-lists")
async def create_price_list(body: dict, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    await db.execute(text(
        "INSERT INTO price_lists (id, tenantId, name, listType, isDefault, createdBy) VALUES (UUID(), :t, :n, :lt, :d, :u)"),
        {"t": tenantId, "n": name, "lt": body.get("listType", "RETAIL"), "d": 1 if body.get("isDefault") else 0, "u": user.id})
    await db.commit()
    import cache as cache_mod
    cache_mod.invalidate_namespace("price_lists", tenantId)
    return ok({"created": True}, 201)


@router.get("/api/v1/promotions")
async def list_promotions(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                          db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM promotions WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 100"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/promotions")
async def create_promotion(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name, ptype = body.get("name"), body.get("type")
    if not name or not ptype: return err("Name and type are required", 400)
    await db.execute(text(
        "INSERT INTO promotions (id, tenantId, name, description, type, value, min_qty, minAmount, maxDiscount, "
        "validFrom, validTo, priority, isActive, createdBy) "
        "VALUES (UUID(), :t, :n, :d, :ty, :v, :mq, :ma, :md, :vf, :vt, :pr, 1, :u)"),
        {"t": tenantId, "n": name, "d": body.get("description"), "ty": ptype, "v": body.get("value", 0),
         "mq": body.get("minQty"), "ma": body.get("minAmount"), "md": body.get("maxDiscount"),
         "vf": body.get("validFrom"), "vt": body.get("validTo"), "pr": body.get("priority", 0), "u": user.id})
    await db.commit()
    return ok({"created": True}, 201)


@router.get("/api/v1/coupons")
async def list_coupons(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                       db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM coupons WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 100"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/coupons")
async def create_coupon(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    code = body.get("code")
    if not code: return err("Code is required", 400)
    dup = (await db.execute(text("SELECT id FROM coupons WHERE tenantId=:t AND code=:c"), {"t": tenantId, "c": code})).first()
    if dup: return err("Coupon code already exists", 409)
    await db.execute(text(
        "INSERT INTO coupons (id, tenantId, code, description, discountType, discountValue, minAmount, maxDiscount, "
        "usageLimit, validFrom, validTo, isActive, createdBy) "
        "VALUES (UUID(), :t, :c, :d, :dt, :dv, :ma, :md, :ul, :vf, :vt, 1, :u)"),
        {"t": tenantId, "c": code, "d": body.get("description"), "dt": body.get("discountType", "PERCENTAGE"),
         "dv": body.get("discountValue", 0), "ma": body.get("minAmount"), "md": body.get("maxDiscount"),
         "ul": body.get("usageLimit"), "vf": body.get("validFrom"), "vt": body.get("validTo"), "u": user.id})
    await db.commit()
    return ok({"created": True}, 201)


# ═════════════════════════ INVENTORY QUERIES (§10.16) ═════════════════════════

@router.get("/api/v1/inventory/stock/{warehouseId}")
async def stock_by_warehouse(warehouseId: str, search: str = "", user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "s.tenantId=:t AND s.warehouseId=:w"
    params: dict = {"t": tenantId, "w": warehouseId}
    if search: where += " AND p.name LIKE :q"; params["q"] = f"%{search}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.*, p.name AS productName, p.sku FROM stock s JOIN products p ON p.id=s.productId "
        f"WHERE {where} ORDER BY p.name"), params)).fetchall())
    for r in rows:
        r["product"] = {"id": r.pop("productId"), "name": r.pop("productName"), "sku": r.pop("sku")}
        r["warehouse"] = {"id": r.pop("warehouseId")}
        r["qtyAvailable"] = float(r["qtyOnHand"]) - float(r["qtyReserved"])
    return ok(rows)


@router.get("/api/v1/inventory/movements")
async def stock_movements(productId: str = "", warehouseId: str = "", limit: int = Query(50),
                          user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                          db: AsyncSession = Depends(get_db)):
    where = "sm.tenantId=:t"; params: dict = {"t": tenantId}
    if productId: where += " AND sm.productId=:p"; params["p"] = productId
    if warehouseId: where += " AND sm.warehouseId=:w"; params["w"] = warehouseId
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT sm.*, p.name AS productName, w.name AS warehouseName FROM stock_movements sm "
        f"JOIN products p ON p.id=sm.productId JOIN warehouses w ON w.id=sm.warehouseId "
        f"WHERE {where} ORDER BY sm.createdAt DESC LIMIT :lim"),
        {**params, "lim": min(limit, 200)})).fetchall())
    return ok(rows)


@router.get("/api/v1/inventory/batches")
async def list_batches(expiringSoon: bool = False, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    extra = "AND b.expiryDate IS NOT NULL AND b.expiryDate <= NOW() + INTERVAL 30 DAY" if expiringSoon else ""
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT b.*, p.name AS productName FROM batches b JOIN products p ON p.id=b.productId "
        f"WHERE b.tenantId=:t AND b.qty > 0 {extra} ORDER BY b.expiryDate"),
        {"t": tenantId})).fetchall())
    for r in rows: r["product"] = {"id": r.pop("productId"), "name": r.pop("productName")}
    return ok(rows)


@router.get("/api/v1/inventory/serials")
async def list_serials(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                       db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT s.*, p.name AS productName FROM serials s JOIN products p ON p.id=s.productId "
        "WHERE s.tenantId=:t ORDER BY s.createdAt DESC LIMIT 200"), {"t": tenantId})).fetchall())
    for r in rows: r["product"] = {"id": r.pop("productId"), "name": r.pop("productName")}
    return ok(rows)


@router.get("/api/v1/inventory/transfers")
async def list_transfers(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                         db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM stock_transfers WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 100"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/inventory/transfers")
async def create_transfer(body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Transfer needs items", 400)
    from_, to_ = body.get("fromWarehouseId"), body.get("toWarehouseId")
    if not from_ or not to_: return err("fromWarehouseId and toWarehouseId required", 400)
    if from_ == to_: return err("Source and destination must differ", 400)
    trf_no = gen_no("TRF")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO stock_transfers (id, tenantId, transferNo, fromWarehouseId, toWarehouseId, transferDate, status, note, createdBy, updatedAt) "
            "VALUES (UUID(), :t, :no, :f, :to, NOW(), 'REQUESTED', :n, :u, NOW())"),
            {"t": tenantId, "no": trf_no, "f": from_, "to": to_, "n": body.get("note"), "u": user.id})
        trf_id = (await db.execute(text("SELECT id FROM stock_transfers WHERE tenantId=:t AND transferNo=:no"),
                                   {"t": tenantId, "no": trf_no})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO stock_transfer_items (id, tenantId, transferId, productId, variantId, qty, toWarehouseId, updatedAt) "
                "VALUES (UUID(), :t, :trf, :p, :v, :q, :to, NOW())"),
                {"t": tenantId, "trf": trf_id, "p": i["productId"], "v": i.get("variantId"), "q": i["qty"], "to": to_})
    return ok({"transferNo": trf_no, "id": trf_id, "status": "REQUESTED"}, 201)


@router.get("/api/v1/inventory/counts")
async def list_counts(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                      db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT sc.*, w.name AS warehouseName FROM stock_counts sc JOIN warehouses w ON w.id=sc.warehouseId "
        "WHERE sc.tenantId=:t ORDER BY sc.createdAt DESC"), {"t": tenantId})).fetchall())
    for r in rows: r["warehouse"] = {"id": r.pop("warehouseId"), "name": r.pop("warehouseName")}
    return ok(rows)


@router.post("/api/v1/inventory/counts")
async def create_count(body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    warehouseId = body.get("warehouseId")
    if not warehouseId: return err("warehouseId required", 400)
    countNo = gen_no("SC")
    stocks = (await db.execute(text(
        "SELECT productId, variantId, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND qtyOnHand > 0"),
        {"t": tenantId, "w": warehouseId})).fetchall()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO stock_counts (id, tenantId, warehouseId, countNo, countDate, countType, status, createdBy, updatedAt) "
            "VALUES (UUID(), :t, :w, :no, NOW(), 'PHYSICAL', 'IN_PROGRESS', :u, NOW())"),
            {"t": tenantId, "w": warehouseId, "no": countNo, "u": user.id})
        cid = (await db.execute(text("SELECT id FROM stock_counts WHERE tenantId=:t AND countNo=:no"),
                                {"t": tenantId, "no": countNo})).first()[0]
        for s in stocks:
            await db.execute(text(
                "INSERT INTO stock_count_items (id, tenantId, countId, productId, variantId, systemQty, countedQty, diffQty) "
                "VALUES (UUID(), :t, :c, :p, :v, :sq, 0, -:sq)"),
                {"t": tenantId, "c": cid, "p": s[0], "v": s[1], "sq": float(s[2])})
    return ok({"countNo": countNo, "id": cid, "items": len(stocks)}, 201)


@router.post("/api/v1/inventory/counts/{countId}/items")
async def submit_count_item(countId: str, body: dict, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    counted = float(body.get("countedQty", 0) or 0)
    r = (await db.execute(text(
        "SELECT sci.id, sci.systemQty FROM stock_count_items sci WHERE sci.countId=:c AND sci.tenantId=:t "
        "AND sci.productId=:p AND (sci.variantId IS NULL OR sci.variantId=:v)"),
        {"c": countId, "t": tenantId, "p": body.get("productId"), "v": body.get("variantId")})).first()
    if not r: return err("Count item not found", 404)
    await db.execute(text("UPDATE stock_count_items SET countedQty=:cq, diffQty=:dq WHERE id=:id"),
                     {"cq": counted, "dq": counted - float(r[1]), "id": r[0]})
    await db.commit()
    return ok({"updated": True})


@router.post("/api/v1/inventory/counts/{countId}/complete")
async def complete_count(countId: str, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    c = (await db.execute(text("SELECT status, warehouseId FROM stock_counts WHERE id=:id AND tenantId=:t"),
                          {"id": countId, "t": tenantId})).first()
    if not c: return err("Stock count not found", 404)
    if c[0] != "IN_PROGRESS": return err(f"Cannot complete in status {c[0]}", 400)
    items = (await db.execute(text(
        "SELECT productId, variantId, diffQty FROM stock_count_items WHERE countId=:c AND diffQty != 0"),
        {"c": countId})).fetchall()
    # ── Prompt 27 stock approval: adjustments beyond the threshold need sign-off ──
    if items:
        largest = max((abs(float(i[2])) for i in items), default=0)
        cno = (await db.execute(text("SELECT countNo FROM stock_counts WHERE id=:id"), {"id": countId})).first()
        count_no = cno[0] if cno else ""
        apr = await wf.create_approval(
            db, tenantId, "STOCK_ADJUST", countId, count_no,
            f"Stock count {count_no}: {len(items)} line(s) adjusted (largest {largest:,.1f})", largest,
            {"countId": countId, "warehouseId": c[1],
             "items": [{"productId": str(i[0]), "variantId": i[1], "diff": float(i[2])} for i in items]},
            user.id)
        if apr:
            await db.commit()
            return ok({"completed": False, "needsApproval": True, "approval": apr}, 202)
    async with txn(db):
        for it in items:
            diff = float(it[2])
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": c[1], "p": it[0], "v": it[1]})).first()
            before = float(st[1]) if st else 0
            after = before + diff
            if st: await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": after, "id": st[0]})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (UUID(), :t, :w, :p, :v, :mt, :q, :qb, :qa, 'STOCK_COUNT', :rid, :note, :u, :u)"),
                {"t": tenantId, "w": c[1], "p": it[0], "v": it[1],
                 "mt": "ADJUSTMENT_IN" if diff > 0 else "ADJUSTMENT_OUT", "q": diff, "qb": before, "qa": after,
                 "rid": countId, "note": f"Stock count adjustment ({diff})", "u": user.id})
        await db.execute(text("UPDATE stock_counts SET status='COMPLETED', updatedBy=:u WHERE id=:id"),
                         {"u": user.id, "id": countId})
    return ok({"completed": True, "adjusted": len(items)})


@router.get("/api/v1/inventory/landed-costs")
async def list_landed_costs(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM landed_costs WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 50"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/inventory/landed-costs")
async def create_landed_cost(body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Landed cost needs items", 400)
    additional = sum(float(body.get(k, 0) or 0) for k in
                     ("shippingCost", "customsCost", "insuranceCost", "handlingCost", "transportCost", "otherCost"))
    purchase = float(body.get("purchaseCost", 0) or 0)
    basis = body.get("allocationBasis", "VALUE")
    totalValue = sum(float(i.get("baseCost", 0)) * float(i.get("qty", 0)) for i in items)
    totalQty = sum(float(i.get("qty", 0)) for i in items)
    lc_no = gen_no("LC")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO landed_costs (id, tenantId, goodsReceiptId, supplierId, landedCostNo, purchaseCost, shippingCost, "
            "customsCost, insuranceCost, handlingCost, transportCost, otherCost, totalLandedCost, allocationBasis, createdBy) "
            "VALUES (UUID(), :t, :g, :s, :no, :pc, :sc, :cc, :ic, :hc, :tc, :oc, :tt, :ab, :u)"),
            {"t": tenantId, "g": body.get("goodsReceiptId"), "s": body.get("supplierId"), "no": lc_no,
             "pc": purchase, "sc": body.get("shippingCost", 0), "cc": body.get("customsCost", 0),
             "ic": body.get("insuranceCost", 0), "hc": body.get("handlingCost", 0),
             "tc": body.get("transportCost", 0), "oc": body.get("otherCost", 0),
             "tt": purchase + additional, "ab": basis, "u": user.id})
        lc_id = (await db.execute(text("SELECT id FROM landed_costs WHERE tenantId=:t AND landedCostNo=:no"),
                                  {"t": tenantId, "no": lc_no})).first()[0]
        for idx, i in enumerate(items):
            if basis == "QTY":
                allocated = round((additional * float(i.get("qty", 0)) / totalQty), 2) if totalQty else 0
            else:
                value = float(i.get("baseCost", 0)) * float(i.get("qty", 0))
                allocated = round((additional * value / totalValue), 2) if totalValue else 0
            if idx == len(items) - 1:
                allocated = round(additional - sum(
                    round((additional * (float(j.get("qty", 0)) / totalQty if basis == "QTY" else (float(j.get("baseCost", 0)) * float(j.get("qty", 0)) / totalValue))), 2)
                    for j in items[:-1]), 2)
            adjusted = float(i.get("baseCost", 0)) + (allocated / float(i.get("qty", 1)))
            await db.execute(text(
                "INSERT INTO landed_cost_items (id, tenantId, landedCostId, productId, variantId, allocatedCost, adjustedCost) "
                "VALUES (UUID(), :t, :lc, :p, :v, :ac, :adj)"),
                {"t": tenantId, "lc": lc_id, "p": i["productId"], "v": i.get("variantId"),
                 "ac": allocated, "adj": round(adjusted, 2)})
    return ok({"landedCostNo": lc_no, "totalLandedCost": purchase + additional}, 201)


@router.get("/api/v1/inventory/consignments")
async def list_consignments(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT c.*, s.name AS supplierName, w.name AS warehouseName FROM consignments c "
        "JOIN suppliers s ON s.id=c.supplierId JOIN warehouses w ON w.id=c.warehouseId "
        "WHERE c.tenantId=:t ORDER BY c.createdAt DESC LIMIT 50"), {"t": tenantId})).fetchall())
    for r in rows:
        r["supplier"] = {"id": r.pop("supplierId"), "name": r.pop("supplierName")}
        r["warehouse"] = {"id": r.pop("warehouseId"), "name": r.pop("warehouseName")}
        r["items"] = rows_to_dicts((await db.execute(text(
            "SELECT ci.*, p.name AS productName FROM consignment_items ci JOIN products p ON p.id=ci.productId WHERE ci.consignmentId=:id"),
            {"id": r["id"]})).fetchall())
    return ok(rows)


@router.post("/api/v1/inventory/consignments")
async def create_consignment(body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Consignment needs items", 400)
    supplierId, warehouseId = body.get("supplierId"), body.get("warehouseId")
    if not supplierId or not warehouseId: return err("supplierId and warehouseId required", 400)
    totalQty = sum(float(i.get("qtyReceived", 0)) for i in items)
    total_val = sum(float(i.get("qtyReceived", 0)) * float(i.get("unitCost", 0)) for i in items)
    con_no = gen_no("CON")
    wh = (await db.execute(text("SELECT branchId FROM warehouses WHERE id=:w"), {"w": warehouseId})).first()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO consignments (id, tenantId, supplierId, warehouseId, consignmentNo, status, totalQty, totalValue, commissionPct, note, createdBy, updatedAt) "
            "VALUES (UUID(), :t, :s, :w, :no, 'ACTIVE', :tq, :tv, :cp, :n, :u, NOW())"),
            {"t": tenantId, "s": supplierId, "w": warehouseId, "no": con_no, "tq": totalQty,
             "tv": total_val, "cp": body.get("commissionPct", 0), "n": body.get("note"), "u": user.id})
        con_id = (await db.execute(text("SELECT id FROM consignments WHERE tenantId=:t AND consignmentNo=:no"),
                                   {"t": tenantId, "no": con_no})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO consignment_items (id, tenantId, consignmentId, productId, variantId, qtyReceived, unitCost, sellingPrice) "
                "VALUES (UUID(), :t, :c, :p, :v, :q, :uc, :sp)"),
                {"t": tenantId, "c": con_id, "p": i["productId"], "v": i.get("variantId"),
                 "q": i.get("qtyReceived", 0), "uc": i.get("unitCost", 0), "sp": i.get("sellingPrice", 0)})
            # stock in (consignment)
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId")})).first()
            before = float(st[1]) if st else 0
            qty = float(i.get("qtyReceived", 0))
            if st: await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": before + qty, "id": st[0]})
            else: await db.execute(text(
                "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved) VALUES (UUID(), :t, :w, :p, :v, :q, 0)"),
                {"t": tenantId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId"), "q": qty})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (UUID(), :t, :b, :w, :p, :v, 'ADJUSTMENT_IN', :q, :qb, :qa, 'CONSIGNMENT', :rid, :note, :u, :u)"),
                {"t": tenantId, "b": wh[0] if wh else None, "w": warehouseId, "p": i["productId"], "v": i.get("variantId"),
                 "q": qty, "qb": before, "qa": before + qty, "rid": con_id, "note": f"Consignment {con_no}", "u": user.id})
    return ok({"consignmentNo": con_no, "id": con_id}, 201)


@router.post("/api/v1/inventory/consignments/{con_id}/settle")
async def settle_consignment(con_id: str, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    async with txn(db):
        items = (await db.execute(text(
            "SELECT qtySold, qtyReturned, sellingPrice FROM consignment_items WHERE consignmentId=:c"), {"c": con_id})).fetchall()
        totalSold = sum(float(r[0]) for r in items)
        total_ret = sum(float(r[1]) for r in items)
        sale_value = sum(float(r[0]) * float(r[2]) for r in items)
        con = (await db.execute(text("SELECT commissionPct FROM consignments WHERE id=:c"), {"c": con_id})).first()
        rate = float(con[0] or 0) / 100
        commission = round(sale_value * rate, 2)
        await db.execute(text(
            "INSERT INTO consignment_settlements (id, tenantId, consignmentId, totalSold, totalReturned, totalCommission, totalPayable, createdBy) "
            "VALUES (UUID(), :t, :c, :ts, :tr, :tc, :tp, :u)"),
            {"t": tenantId, "c": con_id, "ts": totalSold, "tr": total_ret, "tc": commission,
             "tp": sale_value - commission, "u": user.id})
        await db.execute(text("UPDATE consignments SET status='SETTLED' WHERE id=:c"), {"c": con_id})
    return ok({"totalSold": totalSold, "totalReturned": total_ret, "commission": commission, "payable": sale_value - commission})


# ═════════════════════════ BRANCHES / WAREHOUSES / SETTINGS ═════════════════════════

@router.get("/api/v1/branches")
async def list_branches(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                        db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM branches WHERE tenantId=:t ORDER BY name"), {"t": tenantId})).fetchall())
    for r in rows:
        r["warehouses"] = rows_to_dicts((await db.execute(text(
            "SELECT * FROM warehouses WHERE branchId=:b"), {"b": r["id"]})).fetchall())
    return ok(rows)


@router.post("/api/v1/branches")
async def create_branch(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    company_id = body.get("companyId")
    if not company_id:
        row = (await db.execute(text("SELECT id FROM companies WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
        company_id = row[0] if row else None
    branch_id = _uuid()
    await db.execute(text(
        "INSERT INTO branches (id, tenantId, companyId, code, name, phone, email, address, createdBy, updatedAt) "
        "VALUES (:id, :t, :c, :code, :n, :p, :e, :a, :u, NOW())"),
        {"id": branch_id, "t": tenantId, "c": company_id, "code": body.get("code", name[:8].upper()),
         "n": name, "p": body.get("phone"), "e": body.get("email"), "a": body.get("address"), "u": user.id})
    await db.commit()
    return ok({"id": branch_id, "name": name, "created": True}, 201)


@router.get("/api/v1/warehouses")
async def list_warehouses(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                          db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT w.* FROM warehouses w JOIN branches b ON b.id=w.branchId WHERE b.tenantId=:t"),
        {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/branches/{branchId}/warehouses")
async def create_warehouse(branchId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    await db.execute(text(
        "INSERT INTO warehouses (id, tenantId, branchId, code, name, type, createdBy) VALUES (UUID(), :t, :b, :c, :n, :ty, :u)"),
        {"t": tenantId, "b": branchId, "c": body.get("code", name[:8].upper()), "n": name,
         "ty": body.get("type", "BRANCH"), "u": user.id})
    await db.commit()
    return ok({"created": True}, 201)




@router.get("/api/v1/settings/{group}")
async def get_settings(group: str, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT `key`, value FROM settings WHERE tenantId=:t AND `group`=:g"),
        {"t": tenantId, "g": group})).fetchall())
    return ok({r["key"]: r["value"] for r in rows})


@router.put("/api/v1/settings/{group}")
async def put_settings(group: str, body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    for k, v in (body or {}).items():
        await db.execute(text(
            "INSERT INTO settings (id, tenantId, `group`, `key`, value) VALUES (UUID(), :t, :g, :k, :v) "
            "ON DUPLICATE KEY UPDATE value=:v2"),
            {"t": tenantId, "g": group, "k": k, "v": str(v), "v2": str(v)})
    await db.commit()
    return ok({"saved": True})
