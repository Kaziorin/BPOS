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

router = APIRouter()


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

    # Resolve branch/warehouse defaults — guaranteed non-null
    if not branchId:
        b_row = (await db.execute(text("SELECT id FROM branches WHERE tenantId=:t LIMIT 1"), {"t": tenant})).first()
        if b_row:
            branchId = b_row[0]
        else:
            b_id = _uuid_str()
            await db.execute(text(
                "INSERT INTO branches (id, tenantId, name, code, createdBy, updatedAt) "
                "VALUES (:id, :t, 'Main Branch', 'BR-MAIN', :u, NOW())"),
                {"id": b_id, "t": tenant, "u": user.id})
            await db.commit()
            branchId = b_id

    if not warehouseId:
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
        tot_amt = float(body.get("grandTotal") or body.get("total") or calc_sub)
        payments = [{"method": pm, "amount": tot_amt}]

    # stock check
    cfg = (await db.execute(text("SELECT allowNegativeStock FROM tenant_inventory_configs WHERE tenantId=:t"), {"t": tenant})).first()
    allow_negative = bool(cfg[0]) if cfg else False
    if not allow_negative:
        for it in items:
            s = (await db.execute(text(
                "SELECT qtyOnHand, qtyReserved FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId = :v)"),
                {"t": tenant, "w": warehouseId, "p": it["productId"], "v": it.get("variantId")})).first()
            avail = (float(s[0]) - float(s[1])) if s else 0.0
            if avail < float(it.get("qty", 0)):
                return err(f'Insufficient stock for "{it.get("name", it["productId"])}": need {it["qty"]}, available {avail}', 400)

    subtotal = sum(float(i.get("qty", 0)) * float(i.get("unitPrice", 0)) - float(i.get("discountAmount", 0) or 0) for i in items)
    discountTotal = float(body.get("discountTotal", 0) or 0)

    # §10.21 — Server-side VAT calculation (replace client-submitted taxTotal)
    tax_rule = await tax_engine.resolve_tax_rate(db, tenant, appliesTo="SALE")
    if tax_rule and tax_rule["rate"] > 0:
        tax_calc = tax_engine.calculate_tax(
            subtotal - discountTotal,
            tax_rule["rate"],
            tax_inclusive=tax_rule["taxInclusive"],
            rate_type=tax_rule["rateType"],
        )
        taxTotal = tax_calc["taxAmount"]
    else:
        # Fallback: sum per-product taxRate
        taxTotal = 0.0
        for it in items:
            line_amt = float(it.get("qty", 0)) * float(it.get("unitPrice", 0)) - float(it.get("discountAmount", 0) or 0)
            tr = await tax_engine.get_product_tax_rate(db, tenant, it["productId"], appliesTo="SALE")
            if tr and tr["rate"] > 0:
                tc = tax_engine.calculate_tax(line_amt, tr["rate"], tax_inclusive=tr["taxInclusive"])
                taxTotal += tc["taxAmount"]
        taxTotal = round(taxTotal, 2)

    service = float(body.get("serviceCharge", 0) or 0)
    delivery = float(body.get("deliveryFee", 0) or 0)
    tips = float(body.get("tips", 0) or 0)
    roundOff = float(body.get("roundOff", 0) or 0)
    total = max(subtotal - discountTotal + taxTotal + service + delivery + tips + roundOff, 0)
    paid = sum(float(p.get("amount", 0)) for p in payments)
    due = max(total - paid, 0)

    # credit limit check for CREDIT payments (§10.13)
    customerId = body.get("customerId")
    credit_amt = sum(float(p["amount"]) for p in payments if p.get("method") == "CREDIT")
    if credit_amt > 0 and customerId:
        c = (await db.execute(text(
            "SELECT creditLimit, currentDue, status FROM customers WHERE id=:id AND tenantId=:t"),
            {"id": customerId, "t": tenant})).first()
        if c:
            if c[2] == "INACTIVE":
                return err("Customer is inactive", 400)
            available = float(c[0]) - float(c[1])
            if credit_amt > available:
                return err(f"Credit limit exceeded — available ৳{available:,.0f}, requested ৳{credit_amt:,.0f}", 400)

    invoiceNo = gen_no("INV")
    saleId, invoiceId = _uuid_str(), _uuid_str()

    async with txn(db):
        await db.execute(text(
            "INSERT INTO sales (id, tenantId, branchId, terminalId, userId, customerId, invoiceNo, subtotal, "
            "discountTotal, taxTotal, serviceCharge, roundOff, total, paidTotal, dueTotal, paymentStatus, status, shiftId, note, createdBy) "
            "VALUES (:id, :t, :b, :term, :u, :cust, :inv, :sub, :disc, :tax, :svc, :ro, :total, :paid, :due, :ps, 'CONFIRMED', :shift, :note, :u)"),
            {"id": saleId, "t": tenant, "b": branchId, "term": body.get("terminalId"), "u": user.id,
             "cust": customerId, "inv": invoiceNo, "sub": subtotal, "disc": discountTotal, "tax": taxTotal,
             "svc": service or None, "ro": roundOff or None, "total": total, "paid": paid, "due": due,
             "ps": "PAID" if due <= 0 else ("PARTIAL" if paid > 0 else "UNPAID"),
             "shift": shiftId, "note": body.get("note"), })
        for it in items:
            line = float(it.get("qty", 0)) * float(it.get("unitPrice", 0)) - float(it.get("discountAmount", 0) or 0)
            await db.execute(text(
                "INSERT INTO sale_items (id, tenantId, saleId, productId, variantId, name, qty, unitPrice, discountAmount, lineTotal, batchNo, createdBy, updatedAt) "
                "VALUES (:id, :t, :s, :p, :v, :n, :q, :up, :d, :lt, :bn, :u, NOW())"),
                {"id": _uuid_str(), "t": tenant, "s": saleId, "p": it["productId"], "v": it.get("variantId"),
                 "n": it.get("name"), "q": it["qty"], "up": it["unitPrice"], "d": it.get("discountAmount", 0), "lt": line,
                 "bn": it.get("batchNo"), "u": user.id})
            # stock movement (source-traceable, §10.16)
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId = :v) FOR UPDATE"),
                {"t": tenant, "w": warehouseId, "p": it["productId"], "v": it.get("variantId")})).first()
            qty = float(it["qty"])
            if st:
                before = float(st[1]); after = before - qty
                await db.execute(text("UPDATE stock SET qtyOnHand=:a, updatedAt=NOW() WHERE id=:id"), {"a": after, "id": st[0]})
            else:
                before = 0.0; after = -qty
                await db.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, status, createdAt, updatedAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, :q, 0, 'ACTIVE', NOW(), NOW())"
                ), {"t": tenant, "w": warehouseId, "p": it["productId"], "v": it.get("variantId"), "q": after})
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
                {"id": _uuid_str(), "t": tenant, "b": branchId, "w": warehouseId, "p": it["productId"], "v": it.get("variantId"),
                 "q": -qty, "qb": float(st[1]) if st else 0, "qa": (float(st[1]) - qty) if st else -qty,
                 "rid": saleId, "note": f"Sale {invoiceNo}", "u": user.id})
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
                     "rid": saleId, "note": f"Recipe ingredient for sale {invoiceNo}", "u": user.id})
        await db.execute(text(
            "INSERT INTO invoices (id, tenantId, branchId, saleId, customerId, invoiceNo, invoiceType, issueDate, subtotal, discountTotal, taxTotal, total, paidTotal, status, createdBy, updatedAt) "
            "VALUES (:id, :t, :b, :s, :cust, :inv, 'TAX', NOW(), :sub, :d, :tax, :total, :paid, :st, :u, NOW())"),
            {"id": invoiceId, "t": tenant, "b": branchId, "s": saleId, "cust": customerId, "inv": invoiceNo,
             "sub": subtotal, "d": discountTotal, "tax": taxTotal, "total": total, "paid": paid,
             "st": "PAID" if due <= 0 else ("PARTIALLY_PAID" if paid > 0 else "ISSUED"), "u": user.id})
        payment_ids = []
        for p in payments:
            pid = _uuid_str()
            await db.execute(text(
                "INSERT INTO payments (id, tenantId, branchId, saleId, invoiceId, customerId, method, amount, reference, idempotencyKey, status, createdBy, updatedAt) "
                "VALUES (:id, :t, :b, :s, :inv, :cust, :m, :amt, :ref, :ik, 'COMPLETED', :u, NOW())"),
                {"id": pid, "t": tenant, "b": branchId, "s": saleId, "inv": invoiceId, "cust": customerId,
                 "m": p.get("method", "CASH"), "amt": p["amount"], "ref": p.get("reference"),
                 "ik": p.get("idempotencyKey"), "u": user.id})
            payment_ids.append(pid)
            if p.get("method") == "CASH":
                await db.execute(text(
                    "INSERT INTO shift_txns (id, tenantId, shiftId, type, amount, refType, refId, note, userId) "
                    "VALUES (:id, :t, :sh, 'CASH_SALE', :amt, 'SALE', :rid, :note, :u)"),
                    {"id": _uuid_str(), "t": tenant, "sh": shiftId, "amt": float(p["amount"]), "rid": saleId,
                     "note": f"Cash sale {invoiceNo}", "u": user.id})
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
                     "note": f"Earned on sale {invoiceNo}", "u": user.id})
                # Prompt 26 loyalty engine — mirror into the ledger account (idempotent)
                await db.execute(text(
                    "INSERT INTO loyalty_accounts (id, tenantId, customerId, pointsBalance, lifetimeEarned, "
                    "lifetimeRedeemed, tier, status, createdBy) VALUES (UUID(), :t, :c, :p, :p, 0, 'BRONZE', 'ACTIVE', :u) "
                    "ON DUPLICATE KEY UPDATE pointsBalance = pointsBalance + :p, "
                    "lifetimeEarned = lifetimeEarned + :p, updatedAt = NOW(), updatedBy = :u"),
                    {"t": tenant, "c": customerId, "p": pts_earned, "u": user.id})
        # Accounting engine (§10.20): SALE journal — Debit asset per payment method,
        # Debit AR for any unpaid balance, Credit Sales Revenue, Credit VAT Payable.
        revenue = total - taxTotal
        sale_lines: list[tuple[str, float, float, str]] = []
        for p in payments:
            m = p.get("method", "CASH")
            amt = float(p.get("amount", 0) or 0)
            if amt > 0:
                sale_lines.append((acc.METHOD_ACCOUNT.get(m, "1000"), amt, 0.0, f"Payment via {m}"))
        if due > 0:
            sale_lines.append(("1100", due, 0.0, "Balance on credit"))
        sale_lines.append(("4000", 0.0, revenue, f"Sale {invoiceNo}"))
        if taxTotal > 0:
            sale_lines.append(("2100", 0.0, taxTotal, f"VAT collected {invoiceNo}"))
        await acc.post_journal(db, tenant, refType="SALE", refId=saleId,
                               narration=f"Sale {invoiceNo}", lines=sale_lines, userId=user.id)
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
                userId=user.id,
            )
        # COGS journal — Debit COGS, Credit Inventory (cost from product cost data)
        cogs_total = await acc.sale_cogs(db, tenant, saleId)
        if cogs_total > 0:
            await acc.post_journal(db, tenant, refType="SALE_COGS", refId=saleId,
                                   narration=f"COGS {invoiceNo}", lines=[
                                       ("5000", cogs_total, 0.0, "Cost of goods sold"),
                                       ("1200", 0.0, cogs_total, "Inventory reduction"),
                                   ], userId=user.id)

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
               "total": total, "paidTotal": paid, "dueTotal": due, "paymentIds": payment_ids,
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
async def pos_sales(page: int = Query(1), limit: int = Query(20), tenantId: str = Depends(resolve_tenant),
                    db: AsyncSession = Depends(get_db), user: AuthUser = Depends(require_auth)):
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        "SELECT s.id, s.invoiceNo, s.total, s.paidTotal, s.dueTotal, s.status, s.createdAt, c.name AS customerName "
        "FROM sales s LEFT JOIN customers c ON c.id=s.customerId WHERE s.tenantId=:t ORDER BY s.createdAt DESC LIMIT :lim OFFSET :off"),
        {"t": tenantId, "lim": lim, "off": off})).fetchall())
    total = (await db.execute(text("SELECT COUNT(*) FROM sales WHERE tenantId=:t"), {"t": tenantId})).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.post("/api/v1/pos/holds")
async def pos_hold(body: dict, user: AuthUser = Depends(require_auth),
                   tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Nothing to hold", 400)
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
    rows = rows_to_dicts((await db.execute(text(
        "SELECT id, holdNo, cartSnapshot, note, createdAt FROM held_sales WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 50"),
        {"t": tenantId})).fetchall())
    return ok(rows)


@router.delete("/api/v1/pos/holds/{hold_id}")
async def pos_delete_hold(hold_id: str, tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
                          user: AuthUser = Depends(require_auth)):
    await db.execute(text("DELETE FROM held_sales WHERE id=:id AND tenantId=:t"), {"id": hold_id, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


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
async def shift_history(branchId: str = "", status: str = "", page: int = Query(1), limit: int = Query(20),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
                        user: AuthUser = Depends(require_auth)):
    where = "tenantId=:t"; params: dict = {"t": tenantId}
    if branchId: where += " AND branchId=:b"; params["b"] = branchId
    if status: where += " AND status=:st"; params["st"] = status
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
    return ok({"shift": dict(sh._mapping), "summary": summary, "txns": txns})
