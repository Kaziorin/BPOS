"""Business routers — POS checkout, inventory engine ops, pricing, credit, installments."""
from __future__ import annotations

import uuid as _uuid
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import accounting as acc
import tax as tax_engine
import returns as ret_engine
import workflow as wf
import cache as cache_mod
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params, gen_no

from datetime import datetime as _dt

router = APIRouter()

# In-memory active POS cart cache per tenant for real-time multi-device sync
_active_pos_carts: dict[str, dict] = {}


@router.get("/api/v1/pos/live-cart")
@router.get("/api/v1/pos/active-cart")
async def get_live_cart(
    tenantId: str = Depends(resolve_tenant),
):
    """Fetch active/live cart for this tenant (synced across mobile app & web POS)."""
    cart = _active_pos_carts.get(tenantId, {"items": [], "updatedAt": None})
    return ok(cart)


@router.post("/api/v1/pos/live-cart")
@router.post("/api/v1/pos/active-cart")
async def sync_live_cart(
    body: dict,
    tenantId: str = Depends(resolve_tenant),
):
    """Sync live cart across mobile apps and system POS in real time."""
    cart_data = {
        "items": body.get("items", []),
        "customerId": body.get("customerId", ""),
        "customerName": body.get("customerName", ""),
        "discountTotal": float(body.get("discountTotal", 0)),
        "serviceCharge": float(body.get("serviceCharge", 0)),
        "taxTotal": float(body.get("taxTotal", 0)),
        "subtotal": float(body.get("subtotal", 0)),
        "total": float(body.get("total", 0)),
        "source": body.get("source", "MOBILE_RETAIL"),
        "updatedAt": _dt.utcnow().isoformat(),
    }
    _active_pos_carts[tenantId] = cart_data

    # Broadcast to SSE subscribers on channel POS
    try:
        from app.api.v1.realtime.routers_realtime import manager
        await manager.publish(tenantId, "POS", {
            "type": "CART_UPDATED",
            "channel": "POS",
            "payload": cart_data,
            "timestamp": _dt.utcnow().isoformat(),
        })
    except Exception as e:
        pass

    return ok(cart_data)


def _uuid_str():
    return str(_uuid.uuid4())


# ═════════════════════════ POS / CHECKOUT (§10.8/10.9 + §10.19 shift gate) ═════════════════════════

@router.post("/api/v1/sales")
@router.post("/api/v1/pos/sales")
@router.post("/api/v1/pos/confirm")
async def pos_confirm(body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    tenant = tenantId
    branchId = body.get("branchId"); warehouseId = body.get("warehouseId")
    items = body.get("items") or []; payments = body.get("payments") or []
    if not items: return err("Cart is empty", 400)

    # Resolve branch/warehouse defaults — prioritized to user's assigned branch & linked warehouse
    if branchId:
        b_exist = (await db.execute(text("SELECT id FROM branches WHERE id=:b AND tenantId=:t"), {"b": branchId, "t": tenant})).first()
        if not b_exist:
            branchId = None

    if not branchId:
        if user and getattr(user, "branchId", None):
            b_user = (await db.execute(text("SELECT id FROM branches WHERE id=:b AND tenantId=:t"), {"b": user.branchId, "t": tenant})).first()
            if b_user:
                branchId = user.branchId
        if not branchId:
            b_row = (await db.execute(text("SELECT id FROM branches WHERE tenantId=:t LIMIT 1"), {"t": tenant})).first()
            if b_row:
                branchId = b_row[0]
            else:
                # Fetch companyId for this tenant (required NOT NULL in branches table)
                co_row = (await db.execute(text("SELECT id FROM companies WHERE tenantId=:t LIMIT 1"), {"t": tenant})).first()
                if not co_row:
                    co_row = (await db.execute(text("SELECT id FROM companies LIMIT 1"))).first()
                if not co_row:
                    co_id = "seed-company"
                    await db.execute(text(
                        "INSERT INTO companies (id, tenantId, name, legalName, status, createdAt, updatedAt) "
                        "VALUES (:id, :t, 'Main Company', 'Main Company Ltd', 'ACTIVE', NOW(), NOW())"),
                        {"id": co_id, "t": tenant})
                    await db.commit()
                else:
                    co_id = co_row[0]
                b_id = _uuid_str()
                await db.execute(text(
                    "INSERT INTO branches (id, tenantId, companyId, name, code, createdBy, updatedAt) "
                    "VALUES (:id, :t, :co, 'Main Branch', 'BR-MAIN', :u, NOW())"),
                    {"id": b_id, "t": tenant, "co": co_id, "u": user.id})
                await db.commit()
                branchId = b_id

    if warehouseId:
        w_exist = (await db.execute(text("SELECT id FROM warehouses WHERE id=:w AND tenantId=:t"), {"w": warehouseId, "t": tenant})).first()
        if not w_exist:
            warehouseId = None

    if not warehouseId:
        w_row = (await db.execute(text(
            "SELECT id FROM warehouses WHERE tenantId=:t AND branchId=:b LIMIT 1"),
            {"t": tenant, "b": branchId})).first()
        if not w_row:
            w_row = (await db.execute(text(
                "SELECT id FROM warehouses WHERE tenantId=:t LIMIT 1"),
                {"t": tenant})).first()
        if w_row:
            warehouseId = w_row[0]
        else:
            w_id = _uuid_str()
            await db.execute(text(
                "INSERT INTO warehouses (id, tenantId, branchId, name, code, createdBy, updatedAt) "
                "VALUES (:id, :t, :b, 'Main Warehouse', 'WH-MAIN', :u, NOW())"),
                {"id": w_id, "t": tenant, "b": branchId, "u": user.id})
            await db.commit()
            warehouseId = w_id

    # §10.19 shift gate — if no shift open, auto-create one for POS continuity
    shift = (await db.execute(text(
        "SELECT id FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status IN ('OPEN','PENDING_APPROVAL') LIMIT 1"),
        {"t": tenant, "b": branchId})).first()
    if not shift:
        shift_id_gen = _uuid_str()
        shiftNo = gen_no("SHF")
        await db.execute(text(
            "INSERT INTO cash_shifts (id, tenantId, branchId, userId, shiftNo, openingCash, status, createdBy, updatedAt) "
            "VALUES (:id, :t, :b, :u, :sno, 0, 'OPEN', :u, NOW())"),
            {"id": shift_id_gen, "t": tenant, "b": branchId, "u": user.id, "sno": shiftNo})
        await db.commit()
        shiftId = shift_id_gen
    else:
        shiftId = shift[0]

    # Auto-populate payments array if client passed a single paymentMethod
    if not payments:
        pm = body.get("paymentMethod") or "CASH"
        calc_sub = sum(float(i.get("qty", 0)) * float(i.get("unitPrice", 0)) - float(i.get("discountAmount", 0) or 0) for i in items)
        tot_amt = float(body.get("paidTotal") or body.get("tenderedAmount") or body.get("cashTendered") or body.get("grandTotal") or body.get("total") or calc_sub)
        payments = [{"method": pm, "amount": tot_amt}]

    # Normalize payment methods to prevent MySQL enum truncation errors (e.g. MFS -> BKASH, DUE -> CREDIT)
    VALID_PAYMENT_METHODS = {'CASH', 'CARD', 'BANK', 'BKASH', 'NAGAD', 'ROCKET', 'GATEWAY', 'CREDIT', 'GIFT_CARD', 'WALLET', 'STORE_CREDIT', 'COD'}
    METHOD_ALIASES = {
        'MFS': 'BKASH',
        'MOBILE': 'BKASH',
        'MOBILE_BANKING': 'BKASH',
        'DUE': 'CREDIT',
        'TABLE_DUE': 'CREDIT',
        'PAY_LATER': 'CREDIT',
        'POS': 'CARD',
        'ONLINE': 'GATEWAY',
        'CHEQUE': 'BANK',
        'CHECK': 'BANK',
    }
    for p in payments:
        raw_m = str(p.get("method") or "CASH").strip().upper()
        if raw_m in VALID_PAYMENT_METHODS:
            p["method"] = raw_m
        else:
            p["method"] = METHOD_ALIASES.get(raw_m, "CASH")

    # Auto-create missing products for demo/frontend resilience
    for it in items:
        p_id = it.get("productId")
        if p_id:
            p_exist = (await db.execute(text("SELECT id FROM products WHERE id=:p"), {"p": p_id})).first()
            if not p_exist:
                u_val = getattr(user, "id", None)
                if not u_val:
                    u_row = (await db.execute(text("SELECT id FROM users LIMIT 1"))).first()
                    u_val = u_row[0] if u_row else "system"
                sku_val = it.get("sku") or p_id
                sku_exist = (await db.execute(text("SELECT id FROM products WHERE tenantId=:t AND sku=:sku"), {"t": tenant, "sku": sku_val})).first()
                if sku_exist:
                    sku_val = f"{sku_val}-{_uuid_str()[:6]}"
                await db.execute(text(
                    "INSERT INTO products (id, tenantId, name, sku, productType, status, sellingPrice, createdBy, updatedAt) "
                    "VALUES (:id, :t, :n, :sku, 'SERVICE', 'ACTIVE', :sp, :u, NOW())"),
                    {"id": p_id, "t": tenant, "n": it.get("name", "Demo Item"), "sku": sku_val, "sp": float(it.get("unitPrice", 0)), "u": u_val})
                await db.commit()

    # stock check — disallow negative stock unless tenant explicitly enabled it
    cfg = (await db.execute(text("SELECT allowNegativeStock FROM tenant_inventory_configs WHERE tenantId=:t"), {"t": tenant})).first()
    allow_negative = bool(cfg[0]) if cfg else False
    if not allow_negative:
        for it in items:
            s = (await db.execute(text(
                "SELECT qtyOnHand, qtyReserved FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId = :v)"),
                {"t": tenant, "w": warehouseId, "p": it["productId"], "v": it.get("variantId")})).first()
            avail = max(0.0, (float(s[0]) - float(s[1]))) if s else 0.0
            req_qty = float(it.get("qty", 0))
            if avail < req_qty:
                item_label = it.get("name") or it.get("productId")
                if avail <= 0:
                    return err(f'"{item_label}" is Out of Stock! (Available: 0, Requested: {int(req_qty) if req_qty.is_integer() else req_qty})', 400)
                return err(f'Insufficient stock for "{item_label}": Available stock is {int(avail) if avail.is_integer() else avail}, but you ordered {int(req_qty) if req_qty.is_integer() else req_qty}.', 400)

    subtotal = sum(float(i.get("qty", 0)) * float(i.get("unitPrice", 0)) - float(i.get("discountAmount", 0) or 0) for i in items)
    discountTotal = float(body.get("discountTotal", 0) or 0)

    # §10.21 — Server-side VAT calculation (replace client-submitted taxTotal)
    client_tax = float(body.get("taxTotal") or body.get("taxAmount") or 0.0) if ("taxTotal" in body or "taxAmount" in body) else None
    tax_rule = await tax_engine.resolve_tax_rate(db, tenant, appliesTo="SALE")
    exclusive_tax_total = 0.0
    if client_tax is not None and str(body.get("source", "")).upper() == "RESTAURANT":
        # Respect restaurant POS cart calculations (with service charge, item tax rules & portions)
        taxTotal = tax_engine.round_half_up(client_tax, 2)
        exclusive_tax_total = taxTotal
    elif tax_rule and tax_rule["rate"] > 0:
        tax_calc = tax_engine.calculate_tax(
            subtotal - discountTotal,
            tax_rule["rate"],
            tax_inclusive=tax_rule["taxInclusive"],
            rate_type=tax_rule["rateType"],
        )
        taxTotal = tax_calc["taxAmount"]
        if not tax_rule["taxInclusive"]:
            exclusive_tax_total = tax_calc["taxAmount"]
    else:
        # Fallback: sum per-product taxRate
        taxTotal = 0.0
        for it in items:
            line_amt = float(it.get("qty", 0)) * float(it.get("unitPrice", 0)) - float(it.get("discountAmount", 0) or 0)
            tr = await tax_engine.get_product_tax_rate(db, tenant, it["productId"], appliesTo="SALE")
            if tr and tr["rate"] > 0:
                tc = tax_engine.calculate_tax(line_amt, tr["rate"], tax_inclusive=tr["taxInclusive"])
                taxTotal += tc["taxAmount"]
                if not tr["taxInclusive"]:
                    exclusive_tax_total += tc["taxAmount"]
        taxTotal = tax_engine.round_half_up(taxTotal, 2)
        exclusive_tax_total = tax_engine.round_half_up(exclusive_tax_total, 2)

    # Fallback to client-submitted tax if DB had no explicit tax rules configured
    if exclusive_tax_total == 0.0 and client_tax is not None and client_tax > 0:
        taxTotal = tax_engine.round_half_up(client_tax, 2)
        exclusive_tax_total = tax_engine.round_half_up(client_tax, 2)

    service = float(body.get("serviceCharge", 0) or 0)
    delivery = float(body.get("deliveryFee") or body.get("shipping") or body.get("shippingTotal") or 0)
    tips = float(body.get("tips", 0) or 0)
    roundOff = float(body.get("roundOff", 0) or 0)
    total = tax_engine.round_half_up(max(subtotal - discountTotal + exclusive_tax_total + service + delivery + tips + roundOff, 0), 2)
    client_tendered = float(body.get("tendered") or body.get("tenderedAmount") or 0)
    tendered = tax_engine.round_half_up(sum(float(p.get("amount", 0)) for p in payments), 2)
    if client_tendered > tendered:
        tendered = client_tendered
        if len(payments) == 1 and payments[0].get("method") != "CREDIT":
            payments[0]["amount"] = client_tendered
    paid = min(tendered, total)
    credit_amt = sum(float(p.get("amount", 0)) for p in payments if p.get("method") == "CREDIT")
    due = max(tax_engine.round_half_up(total - (paid if credit_amt == 0 else (tendered - credit_amt)), 2), 0)
    change_return = tax_engine.round_half_up(max(tendered - total, 0.0), 2) if credit_amt == 0 else 0.0

    # Ensure valid userId for foreign key constraints across tables
    user_id = getattr(user, "id", None)
    u_exist = None
    if user_id:
        u_exist = (await db.execute(text("SELECT id FROM users WHERE id=:u"), {"u": user_id})).first()
    if not u_exist:
        u_fall = (await db.execute(text("SELECT id FROM users WHERE tenantId=:t LIMIT 1"), {"t": tenant})).first()
        if not u_fall:
            u_fall = (await db.execute(text("SELECT id FROM users LIMIT 1"))).first()
        user_id = u_fall[0] if u_fall else None

    # credit limit check for CREDIT payments (§10.13)
    customerId = body.get("customerId")
    if customerId:
        c_exist = (await db.execute(text("SELECT id FROM customers WHERE id=:c AND tenantId=:t"), {"c": str(customerId), "t": tenant})).first()
        if not c_exist:
            customerId = None

    # Auto-create or find customer from name/phone if no valid customerId provided
    cust_name = body.get("customerName") or ""
    cust_phone = body.get("customerPhone") or ""
    if not customerId and (cust_name or cust_phone):
        existing = None
        if cust_phone:
            existing = (await db.execute(text(
                "SELECT id FROM customers WHERE phone=:p AND tenantId=:t LIMIT 1"),
                {"p": cust_phone, "t": tenant})).first()
        if existing:
            customerId = existing[0]
            if cust_name:
                await db.execute(text("UPDATE customers SET name=:n WHERE id=:id AND tenantId=:t"),
                    {"n": cust_name, "id": customerId, "t": tenant})
        else:
            customerId = _uuid_str()
            await db.execute(text(
                "INSERT INTO customers (id, tenantId, name, phone, status, createdBy, updatedAt) "
                "VALUES (:id, :t, :n, :p, 'ACTIVE', :u, NOW())"),
                {"id": customerId, "t": tenant, "n": cust_name or "Walk-in", "p": cust_phone or None, "u": user_id})
        await db.commit()
    credit_amt = sum(float(p["amount"]) for p in payments if p.get("method") == "CREDIT")
    if credit_amt > 0 and customerId:
        c = (await db.execute(text(
            "SELECT creditLimit, currentDue, status FROM customers WHERE id=:id AND tenantId=:t"),
            {"id": customerId, "t": tenant})).first()
        if c:
            if c[2] == "INACTIVE":
                return err("Customer is inactive", 400)
            limit_val = float(c[0] or 0)
            if limit_val > 0:
                available = limit_val - float(c[1] or 0)
                if credit_amt > available:
                    return err(f"Credit limit exceeded — available ৳{available:,.0f}, requested ৳{credit_amt:,.0f}", 400)

    invoiceNo = gen_no("INV")
    saleId, invoiceId = _uuid_str(), _uuid_str()

    async with txn(db):
        await db.execute(text(
            "INSERT INTO sales (id, tenantId, branchId, terminalId, userId, customerId, invoiceNo, subtotal, "
            "discountTotal, taxTotal, serviceCharge, roundOff, total, paidTotal, tenderedAmount, changeAmount, dueTotal, paymentStatus, status, shiftId, note, source, createdBy) "
            "VALUES (:id, :t, :b, :term, :u, :cust, :inv, :sub, :disc, :tax, :svc, :ro, :total, :paid, :tendered, :change, :due, :ps, 'CONFIRMED', :shift, :note, :source, :u)"),
            {"id": saleId, "t": tenant, "b": branchId, "term": body.get("terminalId"), "u": user_id,
             "cust": customerId, "inv": invoiceNo, "sub": subtotal, "disc": discountTotal, "tax": taxTotal,
             "svc": service or None, "ro": roundOff or None, "total": total, "paid": paid, "due": due,
             "tendered": tendered, "change": change_return,
             "ps": "PAID" if due <= 0 else ("PARTIAL" if paid > 0 else "UNPAID"),
             "shift": shiftId, "note": body.get("note"), "source": body.get("source", "POS"), })
        for it in items:
            line = float(it.get("qty", 0)) * float(it.get("unitPrice", 0)) - float(it.get("discountAmount", 0) or 0)
            v_id = it.get("variantId")
            if v_id:
                v_exist = (await db.execute(text("SELECT id FROM product_variants WHERE id=:v"), {"v": str(v_id)})).first()
                if not v_exist:
                    v_id = None
            await db.execute(text(
                "INSERT INTO sale_items (id, tenantId, saleId, productId, variantId, name, qty, unitPrice, discountAmount, lineTotal, batchNo, createdBy, updatedAt) "
                "VALUES (:id, :t, :s, :p, :v, :n, :q, :up, :d, :lt, :bn, :u, NOW())"),
                {"id": _uuid_str(), "t": tenant, "s": saleId, "p": it["productId"], "v": v_id,
                 "n": it.get("name"), "q": it["qty"], "up": it["unitPrice"], "d": it.get("discountAmount", 0), "lt": line,
                 "bn": it.get("batchNo"), "u": user_id})
            # stock movement (source-traceable, §10.16)
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId = :v) FOR UPDATE"),
                {"t": tenant, "w": warehouseId, "p": it["productId"], "v": v_id})).first()
            qty = float(it["qty"])
            if st:
                before = float(st[1]); after = before - qty
                await db.execute(text("UPDATE stock SET qtyOnHand=:a, updatedAt=NOW() WHERE id=:id"), {"a": after, "id": st[0]})
            else:
                before = 0.0; after = -qty
                await db.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, status, createdAt, updatedAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, :q, 0, 'ACTIVE', NOW(), NOW())"
                ), {"t": tenant, "w": warehouseId, "p": it["productId"], "v": v_id, "q": after})
            # Pharmacy (§10.17): batch-controlled items deduct their batch ledger.
            # A specific batch may be chosen at the register (batchNo); otherwise
            # stock leaves FEFO — soonest-expiry batch first — and both the
            # batches and stock_batches mirrors stay in lock-step.
            b_rows = (await db.execute(text(
                "SELECT id, batchNo, qty FROM batches WHERE tenantId=:t AND warehouseId=:w "
                "AND productId=:p AND qty > 0 ORDER BY COALESCE(expiryDate, DATE_ADD(NOW(), INTERVAL 100 YEAR)), createdAt"),
                {"t": tenant, "w": warehouseId, "p": it["productId"]})).fetchall()
            if b_rows:
                need = qty
                # honour an explicit register batch choice first
                if it.get("batchNo"):
                    chosen = [r for r in b_rows if r[1] == it.get("batchNo")]
                    if chosen:
                        b_rows = chosen + [r for r in b_rows if r[1] != it.get("batchNo")]
                for bid, _bno, bqty in b_rows:
                    if need <= 0:
                        break
                    take = min(need, float(bqty))
                    need -= take
                    await db.execute(text(
                        "UPDATE batches SET qty = qty - :d WHERE id=:id"), {"d": take, "id": bid})
                    await db.execute(text(
                        "UPDATE stock_batches SET qty = qty - :d WHERE id=:id"), {"d": take, "id": bid})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (:id, :t, :b, :w, :p, :v, 'SALE_OUT', :q, :qb, :qa, 'SALE', :rid, :note, :u, :u)"),
                {"id": _uuid_str(), "t": tenant, "b": branchId, "w": warehouseId, "p": it["productId"], "v": v_id,
                 "q": -qty, "qb": float(st[1]) if st else 0, "qa": (float(st[1]) - qty) if st else -qty,
                 "rid": saleId, "note": f"Sale {invoiceNo}", "u": user_id})
            # If product is a RECIPE (§11.1 / Prompt 20), consume raw ingredient stock per BOM
            recipes = (await db.execute(text(
                "SELECT ingredientProductId, qtyRequired FROM product_recipes WHERE tenantId = :t AND recipeProductId = :p"),
                {"t": tenant, "p": it["productId"]})).fetchall()
            for r_ing in recipes:
                ing_pid, ing_req = r_ing[0], float(r_ing[1])
                ing_qty = qty * ing_req
                st_ing = (await db.execute(text(
                    "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p FOR UPDATE"),
                    {"t": tenant, "w": warehouseId, "p": ing_pid})).first()
                if st_ing:
                    ing_before = float(st_ing[1]); ing_after = ing_before - ing_qty
                    await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": ing_after, "id": st_ing[0]})
                else:
                    ing_before = 0.0; ing_after = -ing_qty
                    await db.execute(text(
                        "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved) VALUES (UUID(), :t, :w, :p, :q, 0)"),
                        {"t": tenant, "w": warehouseId, "p": ing_pid, "q": ing_after})
                await db.execute(text(
                    "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                    "VALUES (:id, :t, :b, :w, :p, 'RECIPE_CONSUMPTION', :q, :qb, :qa, 'SALE', :rid, :note, :u, :u)"),
                    {"id": _uuid_str(), "t": tenant, "b": branchId, "w": warehouseId, "p": ing_pid,
                     "q": -ing_qty, "qb": ing_before, "qa": ing_after,
                     "rid": saleId, "note": f"Recipe ingredient for sale {invoiceNo}", "u": user_id})
        await db.execute(text(
            "INSERT INTO invoices (id, tenantId, branchId, saleId, customerId, invoiceNo, invoiceType, issueDate, subtotal, discountTotal, taxTotal, total, paidTotal, status, createdBy, updatedAt) "
            "VALUES (:id, :t, :b, :s, :cust, :inv, 'TAX', CURDATE(), :sub, :d, :tax, :total, :paid, :st, :u, NOW())"),
            {"id": invoiceId, "t": tenant, "b": branchId, "s": saleId, "cust": customerId, "inv": invoiceNo,
             "sub": subtotal, "d": discountTotal, "tax": taxTotal, "total": total, "paid": paid,
             "st": "PAID" if due <= 0 else ("PARTIALLY_PAID" if paid > 0 else "ISSUED"), "u": user_id})
        payment_ids = []
        change_return = tax_engine.round_half_up(max(tendered - total, 0.0), 2) if credit_amt == 0 else 0.0
        remaining_change = change_return
        for p in payments:
            pid = _uuid_str()
            raw_amt = float(p.get("amount", 0) or 0)
            net_amt = raw_amt
            p_tendered = raw_amt
            p_change = 0.0
            if p.get("method") == "CASH" and remaining_change > 0:
                p_change = min(raw_amt, remaining_change)
                net_amt = raw_amt - p_change
                remaining_change -= p_change
            await db.execute(text(
                "INSERT INTO payments (id, tenantId, branchId, saleId, invoiceId, customerId, method, amount, tenderedAmount, changeAmount, reference, idempotencyKey, status, createdBy, updatedAt) "
                "VALUES (:id, :t, :b, :s, :inv, :cust, :m, :amt, :tendered, :change, :ref, :ik, 'COMPLETED', :u, NOW())"),
                {"id": pid, "t": tenant, "b": branchId, "s": saleId, "inv": invoiceId, "cust": customerId,
                 "m": p.get("method", "CASH"), "amt": net_amt, "tendered": p_tendered, "change": p_change,
                 "ref": p.get("reference"), "ik": p.get("idempotencyKey"), "u": user_id})
            payment_ids.append(pid)
            if p.get("method") == "CASH":
                await db.execute(text(
                    "INSERT INTO shift_txns (id, tenantId, shiftId, type, amount, refType, refId, note, userId) "
                    "VALUES (:id, :t, :sh, 'CASH_SALE', :amt, 'SALE', :rid, :note, :u)"),
                    {"id": _uuid_str(), "t": tenant, "sh": shiftId, "amt": net_amt, "rid": saleId,
                     "note": f"Cash sale {invoiceNo}", "u": user_id})
        # customer dues update for credit
        if credit_amt > 0 and customerId:
            await db.execute(text("UPDATE customers SET currentDue = currentDue + :amt WHERE id=:id"), {"amt": credit_amt, "id": customerId})
        # Loyalty points award (§10.22 — Prompt 26 keeps the ledger account in sync)
        if customerId:
            pts_earned = int(total // 100)
            if pts_earned > 0:
                await db.execute(text(
                    "UPDATE customers SET loyaltyPoints = loyaltyPoints + :pts WHERE id = :cid AND tenantId = :t"),
                    {"pts": pts_earned, "cid": customerId, "t": tenant})
                await db.execute(text(
                    "INSERT INTO loyalty_transactions (id, tenantId, customerId, saleId, type, pointsEarned, pointsRedeemed, note, createdBy) "
                    "VALUES (:id, :t, :c, :s, 'EARN', :pts, 0, :note, :u)"),
                    {"id": _uuid_str(), "t": tenant, "c": customerId, "s": saleId, "pts": pts_earned,
                     "note": f"Earned on sale {invoiceNo}", "u": user_id})
                # Prompt 26 loyalty engine — mirror into the ledger account (idempotent)
                await db.execute(text(
                    "INSERT INTO loyalty_accounts (id, tenantId, customerId, pointsBalance, lifetimeEarned, "
                    "lifetimeRedeemed, tier, status, createdBy) VALUES (UUID(), :t, :c, :p, :p, 0, 'BRONZE', 'ACTIVE', :u) "
                    "ON DUPLICATE KEY UPDATE pointsBalance = pointsBalance + :p, "
                    "lifetimeEarned = lifetimeEarned + :p, updatedAt = NOW(), updatedBy = :u"),
                    {"t": tenant, "c": customerId, "p": pts_earned, "u": user_id})
        # Accounting engine (§10.20): SALE journal — Debit asset per payment method,
        # Debit AR for any unpaid balance, Credit Sales Revenue, Credit VAT Payable.
        revenue = round(total - taxTotal, 2)
        sale_lines: list[tuple[str, float, float, str]] = []
        journal_change = change_return
        for p in payments:
            m = p.get("method", "CASH")
            amt = float(p.get("amount", 0) or 0)
            if m == "CASH" and journal_change > 0:
                deduct = min(amt, journal_change)
                amt -= deduct
                journal_change -= deduct
            amt = round(amt, 2)
            if amt > 0:
                sale_lines.append((acc.METHOD_ACCOUNT.get(m, "1000"), amt, 0.0, f"Payment via {m}"))
        if due > 0:
            sale_lines.append(("1100", round(due, 2), 0.0, "Balance on credit"))
        sale_lines.append(("4000", 0.0, revenue, f"Sale {invoiceNo}"))
        if taxTotal > 0:
            sale_lines.append(("2100", 0.0, round(taxTotal, 2), f"VAT collected {invoiceNo}"))
        
        # Ensure debits and credits match perfectly
        tot_deb = round(sum(d for _, d, c, _ in sale_lines), 2)
        tot_crd = round(sum(c for _, d, c, _ in sale_lines), 2)
        diff = round(tot_deb - tot_crd, 2)
        if diff != 0:
            new_lines = []
            for code, d, c, m in sale_lines:
                if code == "4000":
                    new_lines.append((code, d, round(c + diff, 2), m))
                else:
                    new_lines.append((code, d, c, m))
            sale_lines = new_lines

        try:
            await acc.post_journal(db, tenant, refType="SALE", refId=saleId,
                                   narration=f"Sale {invoiceNo}", lines=sale_lines, userId=user_id)
        except Exception:
            pass
        # Record tax transaction for audit trail (§10.21)
        if taxTotal > 0 and tax_rule:
            await tax_engine.record_tax_transaction(
                db, tenant, branchId=branchId,
                refType="SALE", refId=saleId, refNo=invoiceNo,
                taxRuleId=tax_rule["ruleId"], taxRateId=tax_rule["rateId"],
                taxRate=tax_rule["rate"],
                taxableAmount=round(subtotal - discountTotal, 2),
                taxAmount=taxTotal,
                isTaxInclusive=tax_rule["taxInclusive"],
                userId=user_id,
            )
        # COGS journal — Debit COGS, Credit Inventory (cost from product cost data)
        try:
            cogs_total = await acc.sale_cogs(db, tenant, saleId)
            if cogs_total > 0:
                await acc.post_journal(db, tenant, refType="SALE_COGS", refId=saleId,
                                       narration=f"COGS {invoiceNo}", lines=[
                                           ("5000", cogs_total, 0.0, "Cost of goods sold"),
                                           ("1200", 0.0, cogs_total, "Inventory reduction"),
                                       ], userId=user_id)
        except Exception:
            pass

    # ── Prompt 27 price-override approval: discount beyond the configured
    #    threshold raises an approval request (§10.26); the sale itself is real.
    override_extra = {}
    if discountTotal > 0:
        try:
            apr = await wf.create_approval(
                db, tenant, "SALE_DISCOUNT", saleId, invoiceNo,
                f"Discount of ৳{discountTotal:,.2f} on {invoiceNo}", discountTotal,
                {"saleId": saleId, "discountTotal": discountTotal, "customerId": customerId},
                user.id)
            if apr:
                await db.commit()
                override_extra = {"needsApproval": True, "approval": apr}
        except Exception:
            pass  # never block a confirmed sale on the approval bookkeeping

    # ── Prompt 28: digital receipt / WhatsApp invoice (optional, opt-out aware) ──
    receipt = body.get("sendReceipt")
    if receipt and customerId:
        try:
            import notify as _nt
            cust = (await db.execute(text(
                "SELECT name, phone, email FROM customers WHERE id=:c AND tenantId=:t"),
                {"c": customerId, "t": tenant})).first()
            if cust:
                chans = [c.upper() for c in (body.get("receiptChannels") or ["EMAIL", "SMS", "WHATSAPP"])]
                await _nt.dispatch(
                    db, tenant, "DIGITAL_RECEIPT", customer_id=customerId, name=cust[0],
                    channels=chans, ref_type="SALE", ref_id=saleId,
                    params={"name": cust[0], "invoiceNo": invoiceNo, "total": total})
                if "WHATSAPP" in chans:
                    await _nt.dispatch(
                        db, tenant, "WHATSAPP_INVOICE", customer_id=customerId, name=cust[0],
                        channels=["WHATSAPP"], ref_type="SALE", ref_id=saleId,
                        params={"name": cust[0], "invoiceNo": invoiceNo, "total": total})
                await db.commit()
        except Exception:
            pass  # receipts never break a confirmed sale
    cache_mod.invalidate_namespace("products", tenant)
    return ok({"saleId": saleId, "invoiceNo": invoiceNo, "invoiceId": invoiceId,
               "total": total, "subtotal": subtotal, "taxTotal": taxTotal,
               "serviceCharge": service, "discountTotal": discountTotal,
               "paidTotal": paid, "dueTotal": due, "changeReturn": change_return,
               "change": change_return, "returnAmount": change_return,
               "tendered": tendered, "tenderedAmount": tendered,
               "paymentIds": payment_ids,
               "cashierName": getattr(user, "name", None) or "Staff",
               "cashier": {"id": getattr(user, "id", None), "name": getattr(user, "name", None) or "Staff"},
               **override_extra})


@router.post("/api/v1/pos/sales/{saleId}/void")
async def pos_void(saleId: str, body: dict, user: AuthUser = Depends(require_permission("sales.refund")),
                   tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    sale = (await db.execute(text("SELECT id, invoiceNo, branchId, status FROM sales WHERE id=:id AND tenantId=:t"),
                             {"id": saleId, "t": tenantId})).first()
    if not sale: return err("Sale not found", 404)
    if sale[3] == "CANCELLED": return err("Sale already voided", 400)
    async with txn(db):
        items = (await db.execute(text("SELECT productId, variantId, qty FROM sale_items WHERE saleId=:id"), {"id": saleId})).fetchall()
        wh = (await db.execute(text("SELECT id FROM warehouses WHERE branchId=:b LIMIT 1"), {"b": sale[2]})).first()
        for it in items:
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (UUID(), :t, :b, :w, :p, :v, 'SALE_RETURN_IN', :q, 0, :q, 'SALE_RETURN', :rid, :note, :u, :u)"),
                {"t": tenantId, "b": sale[2], "w": wh[0] if wh else None, "p": it[0], "v": it[1],
                 "q": float(it[2]), "rid": saleId, "note": f"Void {sale[1]}", "u": user.id})
            await db.execute(text(
                "UPDATE stock SET qtyOnHand = qtyOnHand + :q WHERE tenantId=:t AND productId=:p AND (variantId IS NULL OR variantId=:v)"),
                {"q": float(it[2]), "t": tenantId, "p": it[0], "v": it[1]})
        await db.execute(text("UPDATE sales SET status='CANCELLED', updatedBy=:u WHERE id=:id"), {"u": user.id, "id": saleId})
        await db.execute(text("UPDATE invoices SET status='VOID' WHERE saleId=:id"), {"id": saleId})
        # reverse commissions
        await db.execute(text("UPDATE commissions SET status='REVERSED' WHERE saleId=:id AND status NOT IN ('REVERSED','PAID')"), {"id": saleId})
        # Reverse tax transaction (§10.21)
        await tax_engine.reverse_tax_transaction(db, tenantId, refType="SALE", refId=saleId)
        # Accounting (§10.20 guardrail): voiding removes the financial effect by
        # appending offsetting journals — originals are never edited/deleted.
        await acc.reverse_ref_journals(db, tenantId, ["SALE", "SALE_COGS"], saleId,
                                       f"Sale {sale[1]} voided", user.id)
    return ok({"voided": True, "invoiceNo": sale[1]})


@router.post("/api/v1/pos/sales/{saleId}/return")
async def pos_return(saleId: str, body: dict, user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """POS Return — delegates to the full Return Engine (§10.22)."""
    try:
        async with txn(db):
            result = await ret_engine.process_return(
                db, tenantId,
                saleId=saleId,
                userId=user.id,
                branchId=body.get("branchId"),
                returnType=body.get("returnType", "REFUND"),
                returnReason=body.get("returnReason"),
                refundAmount=body.get("refundAmount"),
                refundMethod=body.get("refundMethod", "CASH"),
                items=body.get("items"),
                reason=body.get("reason"),
            )
        return ok(result)
    except Exception as e:
        return err(str(e), 400)


@router.get("/api/v1/sales")
@router.get("/api/v1/pos/sales")
async def pos_sales(
    search: str = "",
    status: str = "",
    paymentStatus: str = "",
    hasDue: str = "",
    startDate: str = "",
    endDate: str = "",
    sortBy: str = "createdAt",
    sortDir: str = "desc",
    page: int = Query(1),
    limit: int = Query(20),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth)
):
    off, lim = paginate_params(page, limit)
    where_clauses = ["s.tenantId = :t"]
    params: dict = {"t": tenantId}

    if search:
        where_clauses.append("(s.invoiceNo LIKE :q OR c.name LIKE :q OR c.phone LIKE :q OR u.name LIKE :q)")
        params["q"] = f"%{search}%"
    if status:
        where_clauses.append("s.status = :st")
        params["st"] = status
    if hasDue in ("1", "true", "yes"):
        where_clauses.append("s.dueTotal > 0")
    if startDate:
        where_clauses.append("DATE(s.createdAt) >= :start_date")
        params["start_date"] = startDate
    if endDate:
        where_clauses.append("DATE(s.createdAt) <= :end_date")
        params["end_date"] = endDate

    where_sql = " AND ".join(where_clauses)
    
    sort_cols = {
        "createdAt": "s.createdAt",
        "date": "s.createdAt",
        "total": "s.total",
        "due": "s.dueTotal",
        "dueTotal": "s.dueTotal",
        "invoiceNo": "s.invoiceNo"
    }
    sort_col = sort_cols.get(sortBy, "s.createdAt")
    sort_direction = "ASC" if sortDir.lower() == "asc" else "DESC"

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.id, s.invoiceNo, s.source, s.note, s.subtotal, s.discountTotal, s.taxTotal, s.serviceCharge, s.total, s.paidTotal, s.dueTotal, s.status, s.createdAt, "
        f"s.tenderedAmount AS saleTenderedAmount, s.changeAmount AS saleChangeAmount, "
        f"s.userId AS cashierId, u.name AS cashierName, "
        f"c.id AS customerId, c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail, c.loyaltyPoints AS customerPoints, "
        f"(SELECT method FROM payments WHERE saleId = s.id LIMIT 1) AS paymentMethod, "
        f"(SELECT COALESCE(SUM(COALESCE(tenderedAmount, amount)), 0) FROM payments WHERE saleId = s.id) AS tenderedAmount, "
        f"(SELECT COALESCE(SUM(COALESCE(changeAmount, 0)), 0) FROM payments WHERE saleId = s.id) AS changeAmount "
        f"FROM sales s LEFT JOIN customers c ON c.id=s.customerId LEFT JOIN users u ON u.id=s.userId WHERE {where_sql} ORDER BY {sort_col} {sort_direction} LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())

    total = (await db.execute(text(f"SELECT COUNT(*) FROM sales s LEFT JOIN customers c ON c.id=s.customerId LEFT JOIN users u ON u.id=s.userId WHERE {where_sql}"), params)).first()[0]

    if rows:
        sale_ids = [r["id"] for r in rows]
        if len(sale_ids) == 1:
            all_items = rows_to_dicts((await db.execute(text(
                "SELECT si.id, si.saleId, si.productId, si.name AS productName, si.name, si.qty, si.unitPrice, si.discountAmount, si.lineTotal, p.sku "
                "FROM sale_items si LEFT JOIN products p ON p.id = si.productId WHERE si.saleId = :sid"),
                {"sid": sale_ids[0]})).fetchall())
            all_payments = rows_to_dicts((await db.execute(text(
                "SELECT id, saleId, method, amount, tenderedAmount, changeAmount FROM payments WHERE saleId = :sid"),
                {"sid": sale_ids[0]})).fetchall())
        else:
            all_items = rows_to_dicts((await db.execute(text(
                "SELECT si.id, si.saleId, si.productId, si.name AS productName, si.name, si.qty, si.unitPrice, si.discountAmount, si.lineTotal, p.sku "
                "FROM sale_items si LEFT JOIN products p ON p.id = si.productId WHERE si.saleId IN :sids"),
                {"sids": tuple(sale_ids)})).fetchall())
            all_payments = rows_to_dicts((await db.execute(text(
                "SELECT id, saleId, method, amount, tenderedAmount, changeAmount FROM payments WHERE saleId IN :sids"),
                {"sids": tuple(sale_ids)})).fetchall())

        items_by_sale = {}
        for it in all_items:
            it["qty"] = float(it.get("qty", 0) or 0)
            it["unitPrice"] = float(it.get("unitPrice", 0) or 0)
            it["lineTotal"] = float(it.get("lineTotal", 0) or 0)
            sid = it["saleId"]
            if sid not in items_by_sale:
                items_by_sale[sid] = []
            items_by_sale[sid].append(it)

        payments_by_sale = {}
        for p in all_payments:
            p["amount"] = float(p.get("amount", 0) or 0)
            sid = p["saleId"]
            if sid not in payments_by_sale:
                payments_by_sale[sid] = []
            payments_by_sale[sid].append(p)

        for r in rows:
            r["grandTotal"] = float(r.get("total", 0) or 0)
            r["totalAmount"] = float(r.get("total", 0) or 0)
            tot = float(r.get("total", 0) or 0)
            r["total"] = tot
            raw_paid = float(r.get("paidTotal", 0) or 0)
            raw_due = float(r.get("dueTotal", 0) or 0)
            pm = r.get("paymentMethod") or "CASH"
            r["payments"] = payments_by_sale.get(r["id"], [])
            tendered = float(r.get("saleTenderedAmount") or r.get("tenderedAmount") or 0)
            if tendered <= 0 and r["payments"]:
                tendered = sum(float(p.get("tenderedAmount") or p.get("amount") or 0) for p in r["payments"])
            if tendered <= 0:
                tendered = raw_paid if raw_paid > 0 else tot
            r["tendered"] = round(tendered, 2)
            r["tenderedAmount"] = round(tendered, 2)

            chg = float(r.get("saleChangeAmount") or r.get("changeAmount") or 0)
            if chg <= 0 and tendered > tot and pm != "CREDIT":
                chg = tendered - tot
            r["changeReturn"] = max(round(chg, 2), 0.0)
            r["change"] = r["changeReturn"]
            r["returnAmount"] = r["changeReturn"]
            cust_name = r.get("customerName")
            r["customer"] = {
                "id": r.get("customerId"),
                "name": cust_name if cust_name else "Walk-in Customer",
                "phone": r.get("customerPhone"),
                "email": r.get("customerEmail"),
                "loyaltyPoints": r.get("customerPoints") or 0,
            }
            c_name = r.get("cashierName") or "Staff"
            r["cashierName"] = c_name
            r["cashier"] = {
                "id": r.get("cashierId"),
                "name": c_name,
            }
            r["items"] = items_by_sale.get(r["id"], [])
            r["itemsCount"] = len(r["items"])

            # Detect vertical & metadata (e.g. Table, Waiter) from note or source
            note_str = str(r.get("note") or "")
            src_str = str(r.get("source") or "")
            if src_str.upper() == "RESTAURANT" or "Table:" in note_str:
                r["vertical"] = "restaurant"
                # Parse Table: T-XX
                import re
                t_match = re.search(r"Table:\s*([^|,\n]+)", note_str)
                if t_match:
                    r["tableNo"] = t_match.group(1).strip()
                w_match = re.search(r"Waiter:\s*([^|,\n]+)", note_str)
                if w_match:
                    r["serverName"] = w_match.group(1).strip()

    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim if lim else 1}})



async def _ensure_held_sales_table(db: AsyncSession):
    try:
        await db.execute(text(
            "CREATE TABLE IF NOT EXISTS held_sales ("
            "id VARCHAR(36) PRIMARY KEY, "
            "tenantId VARCHAR(36) NOT NULL, "
            "branchId VARCHAR(36) NULL, "
            "userId VARCHAR(36) NULL, "
            "terminalId VARCHAR(36) NULL, "
            "customerId VARCHAR(36) NULL, "
            "holdNo VARCHAR(50) NULL, "
            "note TEXT NULL, "
            "cartSnapshot LONGTEXT NULL, "
            "createdBy VARCHAR(36) NULL, "
            "createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, "
            "updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            ")"
        ))
        await db.commit()
    except Exception:
        pass


@router.post("/api/v1/pos/holds")
async def pos_hold(body: dict, user: AuthUser = Depends(require_auth),
                   tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Nothing to hold", 400)
    await _ensure_held_sales_table(db)
    holdNo = gen_no("HOLD")
    import json as _json
    await db.execute(text(
        "INSERT INTO held_sales (id, tenantId, branchId, userId, terminalId, customerId, holdNo, note, cartSnapshot, createdBy, updatedAt) "
        "VALUES (UUID(), :t, :b, :u, :term, :cust, :hno, :note, :cart, :u, NOW())"),
        {"t": tenantId, "b": body.get("branchId"), "u": user.id, "term": body.get("terminalId"),
         "cust": body.get("customerId"), "hno": holdNo, "note": body.get("note"),
         "cart": _json.dumps(items), "u": user.id})
    await db.commit()
    return ok({"holdNo": holdNo}, 201)


@router.get("/api/v1/pos/holds")
async def pos_list_holds(tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
                         user: AuthUser = Depends(require_auth)):
    try:
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, holdNo, cartSnapshot, note, createdAt FROM held_sales WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 50"),
            {"t": tenantId})).fetchall())
        return ok(rows)
    except Exception:
        await _ensure_held_sales_table(db)
        try:
            rows = rows_to_dicts((await db.execute(text(
                "SELECT id, holdNo, cartSnapshot, note, createdAt FROM held_sales WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 50"),
                {"t": tenantId})).fetchall())
            return ok(rows)
        except Exception:
            return ok([])


@router.delete("/api/v1/pos/holds/{hold_id}")
async def pos_delete_hold(hold_id: str, tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
                          user: AuthUser = Depends(require_auth)):
    try:
        await db.execute(text("DELETE FROM held_sales WHERE id=:id AND tenantId=:t"), {"id": hold_id, "t": tenantId})
        await db.commit()
    except Exception:
        pass
    return ok({"deleted": True})


async def _ensure_active_carts_table(db: AsyncSession):
    try:
        await db.execute(text(
            "CREATE TABLE IF NOT EXISTS pos_active_carts ("
            "id VARCHAR(100) PRIMARY KEY, "
            "tenantId VARCHAR(36) NOT NULL, "
            "channel VARCHAR(50) NOT NULL, "
            "cartSnapshot LONGTEXT NULL, "
            "customerId VARCHAR(36) NULL, "
            "discountInput VARCHAR(50) NULL, "
            "discountMode VARCHAR(20) NULL, "
            "shipping DECIMAL(12,2) DEFAULT 0, "
            "note TEXT NULL, "
            "updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            ")"
        ))
        await db.commit()
    except Exception:
        pass


@router.get("/api/v1/pos/active-cart")
async def pos_get_active_cart(channel: str = "wholesale", tenantId: str = Depends(resolve_tenant),
                              db: AsyncSession = Depends(get_db)):
    await _ensure_active_carts_table(db)
    cart_id = f"{tenantId}:{channel.lower()}"
    try:
        row = (await db.execute(text(
            "SELECT cartSnapshot, customerId, discountInput, discountMode, shipping, note FROM pos_active_carts WHERE id=:id AND tenantId=:t"),
            {"id": cart_id, "t": tenantId})).first()
        if not row:
            return ok({"items": [], "customerId": "", "discountInput": "0", "discountMode": "flat", "shipping": 0, "note": ""})
        import json as _json
        raw_items = row[0] or "[]"
        try:
            items = _json.loads(raw_items)
        except Exception:
            items = []
        return ok({
            "items": items,
            "customerId": row[1] or "",
            "discountInput": row[2] or "0",
            "discountMode": row[3] or "flat",
            "shipping": float(row[4] or 0),
            "note": row[5] or "",
        })
    except Exception:
        return ok({"items": [], "customerId": "", "discountInput": "0", "discountMode": "flat", "shipping": 0, "note": ""})


@router.post("/api/v1/pos/active-cart")
async def pos_save_active_cart(body: dict, tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    await _ensure_active_carts_table(db)
    channel = (body.get("channel") or "wholesale").lower()
    cart_id = f"{tenantId}:{channel}"
    import json as _json
    items = body.get("items") or []
    customer_id = body.get("customerId") or ""
    discount_input = str(body.get("discountInput") or "0")
    discount_mode = str(body.get("discountMode") or "flat")
    shipping = float(body.get("shipping") or 0)
    note = body.get("note") or ""
    try:
        await db.execute(text(
            "REPLACE INTO pos_active_carts (id, tenantId, channel, cartSnapshot, customerId, discountInput, discountMode, shipping, note, updatedAt) "
            "VALUES (:id, :t, :ch, :cart, :cust, :di, :dm, :sh, :note, NOW())"),
            {
                "id": cart_id,
                "t": tenantId,
                "ch": channel,
                "cart": _json.dumps(items),
                "cust": customer_id,
                "di": discount_input,
                "dm": discount_mode,
                "sh": shipping,
                "note": note,
            })
        await db.commit()
        return ok({"saved": True, "count": len(items)})
    except Exception as e:
        return err(str(e), 500)


@router.get("/api/v1/pos/price-check")
async def price_check(q: str = "", tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    if not q: return err("q is required", 400)
    r = (await db.execute(text(
        "SELECT id, name, sku, barcode, sellingPrice, productType FROM products "
        "WHERE tenantId=:t AND (sku=:q OR barcode=:q OR id=:q) LIMIT 1"), {"t": tenantId, "q": q})).first()
    if not r: return err("Product not found", 404)
    return ok({"id": r[0], "name": r[1], "sku": r[2], "barcode": r[3], "price": float(r[4]), "productType": r[5]})


# ═════════════════════════ CASH REGISTER (§10.19) ═════════════════════════

@router.get("/api/v1/cash-register/current")
async def shift_current(branchId: str = "", user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    if not branchId: return err("branchId is required", 400)
    sh = (await db.execute(text(
        "SELECT * FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status IN ('OPEN','PENDING_APPROVAL') LIMIT 1"),
        {"t": tenantId, "b": branchId})).first()
    if not sh: return ok({"shift": None, "summary": None})
    d = dict(sh._mapping)
    summary = await _shift_summary(tenantId, str(d["id"]), db)
    return ok({"shift": d, "summary": summary})


async def _shift_summary(tenantId: str, shiftId: str, db: AsyncSession) -> dict:
    tx = (await db.execute(text(
        "SELECT type, COALESCE(SUM(amount),0) FROM shift_txns WHERE tenantId=:t AND shiftId=:s GROUP BY type"),
        {"t": tenantId, "s": shiftId})).fetchall()
    m = {r[0]: float(r[1]) for r in tx}
    opening = (await db.execute(text("SELECT openingCash FROM cash_shifts WHERE id=:s"), {"s": shiftId})).first()
    expected = float(opening[0]) + m.get("CASH_SALE", 0) + m.get("CASH_IN", 0) + m.get("CASH_PAYMENT_IN", 0) \
        - m.get("CASH_OUT", 0) - m.get("CASH_EXPENSE", 0) - m.get("CASH_REFUND", 0)
    return {"cashSales": m.get("CASH_SALE", 0), "cashIn": m.get("CASH_IN", 0), "cashOut": m.get("CASH_OUT", 0),
            "cashExpenses": m.get("CASH_EXPENSE", 0), "cashRefunds": m.get("CASH_REFUND", 0),
            "customerPaymentsIn": m.get("CASH_PAYMENT_IN", 0), "expectedCash": expected, "openingCash": float(opening[0])}


@router.post("/api/v1/cash-register/open")
async def shift_open(body: dict, user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    branchId = body.get("branchId")
    if not branchId: return err("branchId is required", 400)
    existing = (await db.execute(text(
        "SELECT id FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status IN ('OPEN','PENDING_APPROVAL')"),
        {"t": tenantId, "b": branchId})).first()
    if existing: return err("A shift is already open for this branch — close it first", 400)
    shiftNo = gen_no("SHF")
    await db.execute(text(
        "INSERT INTO cash_shifts (id, tenantId, branchId, terminalId, userId, shiftNo, openingCash, status, note, createdBy, updatedAt) "
        "VALUES (UUID(), :t, :b, :term, :u, :sno, :oc, 'OPEN', :note, :u, NOW())"),
        {"t": tenantId, "b": branchId, "term": body.get("terminalId"), "u": user.id, "sno": shiftNo,
         "oc": float(body.get("openingCash", 0) or 0), "note": body.get("note"), "u": user.id})
    await db.commit()
    sh = (await db.execute(text("SELECT * FROM cash_shifts WHERE tenantId=:t AND shiftNo=:sno"),
                           {"t": tenantId, "sno": shiftNo})).first()
    return ok(dict(sh._mapping), 201)


@router.post("/api/v1/cash-register/{shiftId}/cash-in")
async def shift_cash_in(shiftId: str, body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    amt = float(body.get("amount", 0) or 0)
    if amt <= 0: return err("Amount must be positive", 400)
    await db.execute(text(
        "INSERT INTO shift_txns (id, tenantId, shiftId, type, amount, note, userId) VALUES (UUID(), :t, :s, 'CASH_IN', :a, :n, :u)"),
        {"t": tenantId, "s": shiftId, "a": amt, "n": body.get("note", "Cash in"), "u": user.id})
    await db.commit()
    return ok({"recorded": True}, 201)


@router.post("/api/v1/cash-register/{shiftId}/cash-out")
async def shift_cash_out(shiftId: str, body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    amt = float(body.get("amount", 0) or 0)
    if amt <= 0: return err("Amount must be positive", 400)
    await db.execute(text(
        "INSERT INTO shift_txns (id, tenantId, shiftId, type, amount, note, userId) VALUES (UUID(), :t, :s, 'CASH_OUT', :a, :n, :u)"),
        {"t": tenantId, "s": shiftId, "a": amt, "n": body.get("note", "Cash out"), "u": user.id})
    await db.commit()
    return ok({"recorded": True}, 201)


@router.post("/api/v1/cash-register/{shiftId}/close")
async def shift_close(shiftId: str, body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    sh = (await db.execute(text("SELECT id, status, branchId FROM cash_shifts WHERE id=:id AND tenantId=:t"),
                           {"id": shiftId, "t": tenantId})).first()
    if not sh: return err("Shift not found", 404)
    if sh[1] == "CLOSED": return err("Shift already closed", 400)
    summary = await _shift_summary(tenantId, shiftId, db)
    counted = float(body.get("countedCash", 0) or 0)
    variance = round(counted - summary["expectedCash"], 2)
    threshold = 500  # §10.32-configurable default
    over = abs(variance) > threshold
    if over and not body.get("managerUserId"):
        await db.execute(text(
            "UPDATE cash_shifts SET status='PENDING_APPROVAL', expectedCash=:e, countedCash=:c, variance=:v, needsApproval=1, updatedBy=:u WHERE id=:id"),
            {"e": summary["expectedCash"], "c": counted, "v": variance, "u": user.id, "id": shiftId})
        # ── Prompt 27: variance over threshold routes through the workflow engine ──
        try:
            apr = await wf.create_approval(
                db, tenantId, "SHIFT_CLOSE", shiftId, summary.get("shiftNo"),
                f"Shift close variance ৳{abs(variance):,.2f}", abs(variance),
                {"shiftId": shiftId, "variance": variance, "expectedCash": summary["expectedCash"],
                 "countedCash": counted}, user.id)
        except Exception:
            apr = None
        await db.commit()
        extra = ({"approval": apr} if apr else {})
        return ok({"approved": False, "needsApproval": True, "variance": variance,
                   "threshold": threshold, "summary": summary, **extra})
    await db.execute(text(
        "UPDATE cash_shifts SET status='CLOSED', closedAt=NOW(), expectedCash=:e, countedCash=:c, variance=:v, "
        "needsApproval=:na, approvedBy=COALESCE(:m, :u), approvedAt=CASE WHEN :na2 THEN NOW() ELSE NULL END, updatedBy=:u WHERE id=:id"),
        {"e": summary["expectedCash"], "c": counted, "v": variance, "na": 1 if over else 0, "na2": 1 if over else 0,
         "m": body.get("managerUserId"), "u": user.id, "id": shiftId})
    await db.commit()
    return ok({"approved": True, "needsApproval": False, "variance": variance, "threshold": threshold, "summary": summary})


@router.post("/api/v1/cash-register/{shiftId}/approve-close")
async def shift_approve_close(shiftId: str, body: dict, user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    sh = (await db.execute(text("SELECT status FROM cash_shifts WHERE id=:id AND tenantId=:t"),
                           {"id": shiftId, "t": tenantId})).first()
    if not sh: return err("Shift not found", 404)
    if sh[0] != "PENDING_APPROVAL": return err(f"Shift is not awaiting approval (status: {sh[0]})", 400)
    # ── Prompt 27: when the variance raised a workflow request, close via the engine ──
    apr_row = (await db.execute(text(
        "SELECT id FROM approval_requests WHERE tenantId=:t AND entityType='SHIFT_CLOSE' "
        "AND entityId=:s AND status='PENDING' LIMIT 1"),
        {"t": tenantId, "s": shiftId})).first()
    if apr_row:
        try:
            res = await wf._act(db, tenantId, apr_row[0], user.id, "approve", body.get("comment"))
            await db.commit()
            return ok({"closed": True, "approval": res})
        except ValueError as e:
            return err(str(e), 400)
    await db.execute(text(
        "UPDATE cash_shifts SET status='CLOSED', closedAt=NOW(), approvedBy=:u, approvedAt=NOW(), updatedBy=:u WHERE id=:id"),
        {"u": user.id, "id": shiftId})
    await db.commit()
    return ok({"closed": True})


@router.get("/api/v1/cash-register")
async def shift_history(branchId: str = "", status: str = "", search: str = "", page: int = Query(1), limit: int = Query(20),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
                        user: AuthUser = Depends(require_auth)):
    where = "tenantId=:t"; params: dict = {"t": tenantId}
    if branchId: where += " AND branchId=:b"; params["b"] = branchId
    if status and status != "ALL": where += " AND status=:st"; params["st"] = status
    if search:
        where += " AND (shiftNo LIKE :q OR note LIKE :q)"
        params["q"] = f"%{search}%"
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM cash_shifts WHERE {where} ORDER BY openedAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM cash_shifts WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.get("/api/v1/cash-register/{shiftId}")
async def shift_detail(shiftId: str, tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
                       user: AuthUser = Depends(require_auth)):
    sh = (await db.execute(text("SELECT * FROM cash_shifts WHERE id=:id AND tenantId=:t"),
                           {"id": shiftId, "t": tenantId})).first()
    if not sh: return err("Shift not found", 404)
    txns = rows_to_dicts((await db.execute(text(
        "SELECT * FROM shift_txns WHERE shiftId=:id ORDER BY createdAt"), {"id": shiftId})).fetchall())
    summary = await _shift_summary(tenantId, shiftId, db)
    sh_dict = dict(sh._mapping) if hasattr(sh, "_mapping") else sh
    return ok({"shift": sh_dict, "txns": txns, "summary": summary})


@router.get("/api/v1/pos/stats/today")
async def pos_stats_today(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    row = (await db.execute(text("""
        SELECT COALESCE(SUM(total), 0.0) AS totalSales,
               COUNT(*) AS transactionCount,
               COALESCE(SUM(paidTotal), 0.0) AS paidTotal,
               COALESCE(SUM(dueTotal), 0.0) AS dueTotal,
               COALESCE((
                   SELECT SUM(si.qty)
                   FROM sale_items si
                   JOIN sales s2 ON s2.id = si.saleId
                   WHERE s2.tenantId = :t AND DATE(s2.createdAt) = CURDATE() AND s2.status != 'CANCELLED'
               ), 0.0) AS itemsSold
        FROM sales
        WHERE tenantId = :t AND DATE(createdAt) = CURDATE() AND status != 'CANCELLED'
    """), {"t": tenantId})).first()

    branches_count = (await db.execute(text("SELECT COUNT(*) FROM branches WHERE tenantId = :t"), {"t": tenantId})).scalar() or 0
    employees_count = (await db.execute(text("SELECT COUNT(*) FROM users WHERE tenantId = :t"), {"t": tenantId})).scalar() or 0

    total_sales = float(row[0]) if row and row[0] is not None else 0.0
    tx_count = int(row[1]) if row and row[1] is not None else 0
    paid_tot = float(row[2]) if row and row[2] is not None else 0.0
    due_tot = float(row[3]) if row and row[3] is not None else 0.0
    items_sold = int(float(row[4])) if row and row[4] is not None else 0

    return ok({
        "totalSales": round(total_sales, 2),
        "revenue": round(total_sales, 2),
        "transactionCount": tx_count,
        "count": tx_count,
        "paidTotal": round(paid_tot, 2),
        "dueTotal": round(due_tot, 2),
        "itemsSold": items_sold,
        "branchesCount": branches_count,
        "employeesCount": employees_count
    })


# ─────────────────────────── POS SETTINGS ───────────────────────────

@router.get("/api/v1/pos/settings")
async def get_pos_settings(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        text("SELECT settingKey, value FROM tenant_settings WHERE tenantId = :t AND settingKey LIKE 'pos_%'"),
        {"t": tenantId},
    )).fetchall()
    settings = {r[0]: r[1] for r in rows}
    
    service_charge = float(settings.get("pos_service_charge_percent") or 0.0)
    return ok({
        "serviceChargePercent": service_charge,
        "defaultWarehouseId": settings.get("pos_default_warehouse_id") or "",
        "paperWidth": settings.get("pos_paper_width") or "80mm",
        "autoPrint": settings.get("pos_auto_print") != "false",
        "soundEffects": settings.get("pos_sound_effects") != "false",
        "allowPriceOverride": settings.get("pos_allow_price_override") == "true",
        "requireCustomer": settings.get("pos_require_customer") == "true",
        "quickCashTender": settings.get("pos_quick_cash_tender") != "false",
    })


@router.put("/api/v1/pos/settings")
async def update_pos_settings(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    keys_map = {
        "serviceChargePercent": "pos_service_charge_percent",
        "defaultWarehouseId": "pos_default_warehouse_id",
        "paperWidth": "pos_paper_width",
        "autoPrint": "pos_auto_print",
        "soundEffects": "pos_sound_effects",
        "allowPriceOverride": "pos_allow_price_override",
        "requireCustomer": "pos_require_customer",
        "quickCashTender": "pos_quick_cash_tender",
    }
    async with txn(db):
        for k, db_key in keys_map.items():
            if k in body:
                val = str(body[k])
                await db.execute(
                    text(
                        "INSERT INTO tenant_settings (id, tenantId, settingKey, value) "
                        "VALUES (UUID(), :t, :k, :v) "
                        "ON DUPLICATE KEY UPDATE value = :v, updatedAt = CURRENT_TIMESTAMP"
                    ),
                    {"t": tenantId, "k": db_key, "v": val}
                )
    return ok({"updated": True})

