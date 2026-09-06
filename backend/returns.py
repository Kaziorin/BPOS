"""Return Engine (Prompt 18) — full return flow, RMA, warranty claims.

Design (§10.22 + Prompt 18 DoD):
- Return is its own transaction type, never a simple invoice delete.
- Flow: Original Invoice → Return Request → Validation → Return Stock → Refund →
  Accounting Reversal → Commission Reversal → Loyalty Reversal
- RMA: RMA number, return reason, inspection, defect classification, warranty validation,
  repair/replacement/refund/store-credit outcome, restocking, warranty history.
- Warranty: warranty start/end/type linked to serial/IMEI; claim flow:
  Claim → Inspection → Approved → Repair/Replace → Complete.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from util import gen_no


def _uuid() -> str:
    return str(uuid.uuid4())


# ──────────────────── RETURN PROCESSING ────────────────────


async def process_return(
    db: AsyncSession,
    tenantId: str,
    *,
    saleId: str,
    userId: str,
    branchId: Optional[str] = None,
    returnType: str = "REFUND",
    returnReason: Optional[str] = None,
    refundAmount: Optional[float] = None,
    refundMethod: str = "CASH",
    items: Optional[list[dict]] = None,
    reason: Optional[str] = None,
) -> dict:
    """Process a full return with all reversals.

    This is the core return engine. It:
    1. Validates the original sale exists and is returnable
    2. Returns stock (with movement records)
    3. Creates refund payment
    4. Posts accounting reversal journal
    5. Reverses commission
    6. Records tax reversal
    7. Creates the return record with items

    Returns dict with returnNo, refundAmount, etc.
    """
    import accounting as acc
    import tax as tax_engine

    # Fetch original sale
    sale = (
        await db.execute(
            text(
                "SELECT id, invoiceNo, branchId, customerId, total, taxTotal, status "
                "FROM sales WHERE id = :id AND tenantId = :t"
            ),
            {"id": saleId, "t": tenantId},
        )
    ).first()
    if not sale:
        raise Exception("Sale not found")
    if sale[5] == "CANCELLED":
        raise Exception("Sale is already cancelled — cannot return")

    sale_branch = branchId or sale[2]
    customerId = sale[3]
    orig_total = float(sale[4])
    orig_tax = float(sale[5] or 0)

    # Determine refund amount
    actual_refund = refundAmount if refundAmount is not None else orig_total

    # Determine which items to return
    if items:
        # Partial return — specific items
        return_items_data = items
    else:
        # Full return — all items
        raw_items = (
            await db.execute(
                text(
                    "SELECT si.id, si.productId, si.variantId, si.name, si.qty, si.unitPrice, si.lineTotal, si.batchNo "
                    "FROM sale_items si WHERE si.saleId = :s AND si.tenantId = :t"
                ),
                {"s": saleId, "t": tenantId},
            )
        ).fetchall()
        return_items_data = [
            {
                "saleItemId": r[0],
                "productId": r[1],
                "variantId": r[2],
                "productName": r[3],
                "qty": float(r[4]),
                "unitPrice": float(r[5]),
                "lineTotal": float(r[6]),
                "batchNo": r[7],
            }
            for r in raw_items
        ]

    # Resolve warehouse
    wh = (
        await db.execute(
            text("SELECT id FROM warehouses WHERE branchId = :b LIMIT 1"),
            {"b": sale_branch},
        )
    ).first()
    warehouseId = wh[0] if wh else None

    returnNo = gen_no("RET")
    returnId = _uuid()

    # ── Stock return ──
    for it in return_items_data:
        qty = float(it.get("qty", 1))
        pid = it["productId"]
        vid = it.get("variantId")

        # Get current stock
        st = (
            await db.execute(
                text(
                    "SELECT id, qtyOnHand FROM stock "
                    "WHERE tenantId = :t AND warehouseId = :w AND productId = :p "
                    "AND (variantId IS NULL OR variantId = :v) FOR UPDATE"
                ),
                {"t": tenantId, "w": warehouseId, "p": pid, "v": vid},
            )
        ).first()
        before = float(st[1]) if st else 0
        after = before + qty

        if st:
            await db.execute(
                text("UPDATE stock SET qtyOnHand = :a WHERE id = :id"),
                {"a": after, "id": st[0]},
            )
        else:
            await db.execute(
                text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, updatedAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, :q, 0, NOW())"
                ),
                {"t": tenantId, "w": warehouseId, "p": pid, "v": vid, "q": qty},
            )

        # Stock movement record
        await db.execute(
            text(
                "INSERT INTO stock_movements "
                "(id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, "
                "qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (:id, :t, :b, :w, :p, :v, 'SALE_RETURN_IN', :q, :qb, :qa, 'SALE_RETURN', :rid, :note, :u, :u)"
            ),
            {
                "id": _uuid(), "t": tenantId, "b": sale_branch, "w": warehouseId,
                "p": pid, "v": vid, "q": qty, "qb": before, "qa": after,
                "rid": saleId, "note": f"Return {returnNo}", "u": userId,
            },
        )
        # Pharmacy (§10.17): a batch-controlled return restores the batch ledger.
        # The register sends batchNo back on the return line, so the exact
        # batches sold (FEFO) are restocked in both mirrored tables.
        if it.get("batchNo"):
            b_row = (
                await db.execute(
                    text(
                        "SELECT id FROM batches WHERE tenantId = :t AND warehouseId = :w "
                        "AND productId = :p AND batchNo = :b LIMIT 1"
                    ),
                    {"t": tenantId, "w": warehouseId, "p": pid, "b": it.get("batchNo")},
                )
            ).first()
            sb_row = (
                await db.execute(
                    text(
                        "SELECT id FROM stock_batches WHERE tenantId = :t AND warehouseId = :w "
                        "AND productId = :p AND batchNo = :b LIMIT 1"
                    ),
                    {"t": tenantId, "w": warehouseId, "p": pid, "b": it.get("batchNo")},
                )
            ).first()
            if b_row:
                await db.execute(
                    text("UPDATE batches SET qty = qty + :q WHERE id = :id"),
                    {"q": qty, "id": b_row[0]},
                )
            if sb_row:
                await db.execute(
                    text("UPDATE stock_batches SET qty = qty + :q WHERE id = :id"),
                    {"q": qty, "id": sb_row[0]},
                )

    # ── Create return record ──
    is_partial = bool(items) and len(items) < len(return_items_data) if items else False
    await db.execute(
        text(
            "INSERT INTO returns "
            "(id, tenantId, branchId, saleId, returnNo, returnType, returnReason, "
            "refundAmount, restocked, partialReturn, status, processedBy, createdBy, updatedAt) "
            "VALUES (:id, :t, :b, :s, :rno, :rt, :rr, :ra, 1, :pr, 'COMPLETED', :u, :u, NOW())"
        ),
        {
            "id": returnId, "t": tenantId, "b": sale_branch, "s": saleId,
            "rno": returnNo, "rt": returnType, "rr": returnReason,
            "ra": actual_refund, "pr": 1 if is_partial else 0, "u": userId,
        },
    )

    # ── Return items ──
    for it in return_items_data:
        await db.execute(
            text(
                "INSERT INTO return_items "
                "(id, tenantId, returnId, saleItemId, productId, variantId, productName, "
                "qty, unitPrice, lineTotal, reason, itemCondition, restocked) "
                "VALUES (:id, :t, :ri, :si, :p, :v, :n, :q, :up, :lt, :r, :ic, 1)"
            ),
            {
                "id": _uuid(), "t": tenantId, "ri": returnId,
                "si": it.get("saleItemId"), "p": it["productId"],
                "v": it.get("variantId"), "n": it.get("productName"),
                "q": it.get("qty", 1), "up": it.get("unitPrice", 0),
                "lt": it.get("lineTotal", 0), "r": reason or it.get("reason"),
                "ic": it.get("itemCondition", "NEW"),
            },
        )

    # ── Refund payment ──
    if actual_refund > 0:
        await db.execute(
            text(
                "INSERT INTO payments "
                "(id, tenantId, branchId, saleId, customerId, method, amount, reference, "
                "status, note, createdBy, updatedAt) "
                "VALUES (:id, :t, :b, :s, :c, :m, -:amt, :ref, 'REFUNDED', :note, :u, NOW())"
            ),
            {
                "id": _uuid(), "t": tenantId, "b": sale_branch, "s": saleId,
                "c": customerId, "m": refundMethod, "amt": actual_refund,
                "ref": returnNo, "note": f"Refund for {sale[1]}", "u": userId,
            },
        )

    # ── Cash refund on shift ──
    if actual_refund > 0 and refundMethod == "CASH":
        sh = (
            await db.execute(
                text(
                    "SELECT id FROM cash_shifts "
                    "WHERE tenantId = :t AND branchId = :b AND status IN ('OPEN','PENDING_APPROVAL') LIMIT 1"
                ),
                {"t": tenantId, "b": sale_branch},
            )
        ).first()
        if sh:
            await db.execute(
                text(
                    "INSERT INTO shift_txns "
                    "(id, tenantId, shiftId, type, amount, refType, refId, note, userId) "
                    "VALUES (:id, :t, :sh, 'CASH_REFUND', :amt, 'RETURN', :rid, :note, :u)"
                ),
                {
                    "id": _uuid(), "t": tenantId, "sh": sh[0], "amt": actual_refund,
                    "rid": saleId, "note": f"Refund {returnNo}", "u": userId,
                },
            )

    # ── Update sale status ──
    await db.execute(
        text("UPDATE sales SET status = 'RETURNED', updatedBy = :u WHERE id = :id"),
        {"u": userId, "id": saleId},
    )

    # ── Accounting reversal ──
    ret_lines: list[tuple[str, float, float, str]] = [
        ("4100", actual_refund, 0.0, f"Sales return {returnNo}"),
        (acc.METHOD_ACCOUNT.get(refundMethod, "1000"), 0.0, actual_refund, f"Refund via {refundMethod}"),
    ]
    if orig_tax > 0:
        # Reverse the VAT portion
        ret_lines.append(("2100", orig_tax, 0.0, f"VAT reversal {returnNo}"))
    await acc.post_journal(
        db, tenantId, refType="SALE_RETURN", refId=saleId,
        narration=f"Return {returnNo}", lines=ret_lines, userId=userId,
    )

    # ── Tax transaction reversal ──
    if orig_tax > 0:
        await tax_engine.reverse_tax_transaction(
            db, tenantId, refType="SALE", refId=saleId,
        )

    # ── COGS reversal ──
    cogs_total = await acc.sale_cogs(db, tenantId, saleId)
    if cogs_total > 0:
        await acc.post_journal(
            db, tenantId, refType="SALE_RETURN_COGS", refId=saleId,
            narration=f"COGS reversal {returnNo}",
            lines=[
                ("1200", cogs_total, 0.0, "Inventory restored"),
                ("5000", 0.0, cogs_total, "COGS reversal"),
            ],
            userId=userId,
        )

    # ── Commission reversal ──
    await db.execute(
        text(
            "UPDATE commissions SET status = 'REVERSED', updatedBy = :u "
            "WHERE saleId = :s AND status NOT IN ('REVERSED','PAID')"
        ),
        {"u": userId, "s": saleId},
    )

    # ── Loyalty reversal (§10.22) ──
    if customerId:
        # Fetch loyalty points earned on this sale
        loyalty_row = (
            await db.execute(
                text(
                    "SELECT pointsEarned FROM loyalty_transactions "
                    "WHERE tenantId = :t AND saleId = :s AND type = 'EARN'"
                ),
                {"t": tenantId, "s": saleId},
            )
        ).first()
        points_to_reverse = int(loyalty_row[0]) if loyalty_row and loyalty_row[0] else 0
        if points_to_reverse > 0:
            # Deduct points from customer balance (floor at 0)
            await db.execute(
                text(
                    "UPDATE customers SET loyaltyPoints = GREATEST(loyaltyPoints - :pts, 0) "
                    "WHERE id = :cid AND tenantId = :t"
                ),
                {"pts": points_to_reverse, "cid": customerId, "t": tenantId},
            )
            # Prompt 26 loyalty engine — reverse the ledger account too (if it exists)
            await db.execute(
                text(
                    "UPDATE loyalty_accounts SET pointsBalance = GREATEST(pointsBalance - :pts, 0), "
                    "lifetimeEarned = GREATEST(lifetimeEarned - :pts, 0), updatedAt = NOW() "
                    "WHERE tenantId = :t AND customerId = :c"
                ),
                {"pts": points_to_reverse, "t": tenantId, "c": customerId},
            )
            # Record the reversal transaction
            await db.execute(
                text(
                    "INSERT INTO loyalty_transactions "
                    "(id, tenantId, customerId, saleId, type, pointsEarned, pointsRedeemed, "
                    "note, createdBy) "
                    "VALUES (:id, :t, :c, :s, 'REVERSAL', 0, :pts, :note, :u)"
                ),
                {
                    "id": _uuid(), "t": tenantId, "c": customerId, "s": saleId,
                    "pts": points_to_reverse,
                    "note": f"Loyalty reversal on return {returnNo}", "u": userId,
                },
            )

    return {
        "returnId": returnId,
        "returnNo": returnNo,
        "refundAmount": actual_refund,
        "itemsReturned": len(return_items_data),
    }


# ──────────────────── RMA PROCESSING ────────────────────


async def process_rma(
    db: AsyncSession,
    tenantId: str,
    *,
    rmaTicketId: str,
    action: str,
    userId: str,
    notes: Optional[str] = None,
    resolution: Optional[str] = None,
    refundAmount: Optional[float] = None,
) -> dict:
    """Process an RMA ticket through its lifecycle.

    Actions:
      inspect     → OPEN → INSPECTION
      approve     → INSPECTION/APPROVED → APPROVED
      reject      → INSPECTION → REJECTED
      start_repair → APPROVED → IN_REPAIR
      ready       → IN_REPAIR → READY
      complete    → READY/IN_REPAIR → COMPLETED (triggers return processing)
      cancel      → any → CANCELLED
    """
    rma = (
        await db.execute(
            text(
                "SELECT id, rmaNo, saleId, returnType, status, refundAmount, branchId "
                "FROM rma_tickets WHERE id = :id AND tenantId = :t"
            ),
            {"id": rmaTicketId, "t": tenantId},
        )
    ).first()
    if not rma:
        raise Exception("RMA ticket not found")

    current_status = rma[4]
    valid_transitions = {
        "inspect": ["OPEN"],
        "approve": ["INSPECTION", "APPROVED"],
        "reject": ["INSPECTION"],
        "start_repair": ["APPROVED"],
        "ready": ["IN_REPAIR"],
        "complete": ["READY", "IN_REPAIR", "APPROVED"],
        "cancel": ["OPEN", "INSPECTION", "APPROVED", "IN_REPAIR", "READY"],
    }

    if action not in valid_transitions:
        raise Exception(f"Invalid action: {action}")
    if current_status not in valid_transitions[action]:
        raise Exception(f"Cannot {action} from status {current_status}")

    new_status_map = {
        "inspect": "INSPECTION",
        "approve": "APPROVED",
        "reject": "REJECTED",
        "start_repair": "IN_REPAIR",
        "ready": "READY",
        "complete": "COMPLETED",
        "cancel": "CANCELLED",
    }
    new_status = new_status_map[action]

    updates = {"status": new_status, "updatedBy": userId}
    if action == "inspect":
        updates["inspectionNotes"] = notes
        updates["inspectedBy"] = userId
        updates["inspectedAt"] = datetime.now().isoformat()
    elif action == "complete":
        updates["resolution"] = resolution
        updates["resolutionNotes"] = notes
        updates["completedBy"] = userId
        updates["completedAt"] = datetime.now().isoformat()
        if refundAmount is not None:
            updates["refundAmount"] = refundAmount

    set_parts = [f"{k} = :{k}" for k in updates if k not in ("updatedBy",)]
    set_parts.append("updatedBy = :updatedBy")
    params = {**updates, "id": rmaTicketId, "t": tenantId}

    await db.execute(
        text(f"UPDATE rma_tickets SET {', '.join(set_parts)} WHERE id = :id AND tenantId = :t"),
        params,
    )

    # Record history
    await db.execute(
        text(
            "INSERT INTO warranty_history "
            "(id, tenantId, warrantyClaimId, action, notes, performedBy) "
            "VALUES (:id, :t, :wid, :a, :n, :u)"
        ),
        {"id": _uuid(), "t": tenantId, "wid": rmaTicketId, "a": action, "n": notes, "u": userId},
    )

    # On complete — process the actual return if linked to a sale
    if action == "complete" and rma[2] and resolution in ("REFUND", "REPLACEMENT", "STORE_CREDIT"):
        ret_result = await process_return(
            db, tenantId,
            saleId=rma[2], userId=userId, branchId=rma[5],
            returnType=resolution,
            returnReason=rma[3],
            refundAmount=refundAmount or rma[5],
            reason=notes,
        )
        await db.execute(
            text("UPDATE rma_tickets SET restocked = 1, refundAmount = :ra WHERE id = :id"),
            {"ra": ret_result["refundAmount"], "id": rmaTicketId},
        )
        return {**updates, "returnProcessed": ret_result}

    return updates


# ──────────────────── WARRANTY CLAIM PROCESSING ────────────────────


async def process_warranty_claim(
    db: AsyncSession,
    tenantId: str,
    *,
    claimId: str,
    action: str,
    userId: str,
    notes: Optional[str] = None,
    resolution: Optional[str] = None,
    actualCost: Optional[float] = None,
) -> dict:
    """Process a warranty claim through its lifecycle.

    Actions:
      inspect     → SUBMITTED → INSPECTION
      approve     → INSPECTION → APPROVED
      reject      → INSPECTION → REJECTED
      start_repair → APPROVED → IN_REPAIR
      ready       → IN_REPAIR → REPLACEMENT_READY
      complete    → IN_REPAIR/REPLACEMENT_READY → COMPLETED
      cancel      → any → CANCELLED
    """
    claim = (
        await db.execute(
            text(
                "SELECT id, claimNo, status, warrantyEnd FROM warranty_claims "
                "WHERE id = :id AND tenantId = :t"
            ),
            {"id": claimId, "t": tenantId},
        )
    ).first()
    if not claim:
        raise Exception("Warranty claim not found")

    current_status = claim[2]
    warranty_end = claim[3]

    # Check warranty validity
    if action in ("approve", "start_repair") and warranty_end < date.today():
        raise Exception("Warranty has expired — cannot approve claim")

    valid_transitions = {
        "inspect": ["SUBMITTED"],
        "approve": ["INSPECTION"],
        "reject": ["INSPECTION"],
        "start_repair": ["APPROVED"],
        "ready": ["IN_REPAIR"],
        "complete": ["IN_REPAIR", "REPLACEMENT_READY", "APPROVED"],
        "cancel": ["SUBMITTED", "INSPECTION", "APPROVED", "IN_REPAIR", "REPLACEMENT_READY"],
    }

    if action not in valid_transitions:
        raise Exception(f"Invalid action: {action}")
    if current_status not in valid_transitions[action]:
        raise Exception(f"Cannot {action} from status {current_status}")

    new_status_map = {
        "inspect": "INSPECTION",
        "approve": "APPROVED",
        "reject": "REJECTED",
        "start_repair": "IN_REPAIR",
        "ready": "REPLACEMENT_READY",
        "complete": "COMPLETED",
        "cancel": "CANCELLED",
    }
    new_status = new_status_map[action]

    updates = {"status": new_status, "updatedBy": userId}
    if action == "inspect":
        updates["inspectionNotes"] = notes
        updates["inspectedBy"] = userId
        updates["inspectedAt"] = datetime.now().isoformat()
    elif action == "complete":
        updates["resolution"] = resolution
        updates["resolutionNotes"] = notes
        updates["completedBy"] = userId
        updates["completedAt"] = datetime.now().isoformat()
        if actualCost is not None:
            updates["actualCost"] = actualCost

    set_parts = [f"{k} = :{k}" for k in updates if k not in ("updatedBy",)]
    set_parts.append("updatedBy = :updatedBy")
    params = {**updates, "id": claimId, "t": tenantId}

    await db.execute(
        text(f"UPDATE warranty_claims SET {', '.join(set_parts)} WHERE id = :id AND tenantId = :t"),
        params,
    )

    # Record history
    await db.execute(
        text(
            "INSERT INTO warranty_history "
            "(id, tenantId, warrantyClaimId, action, notes, performedBy) "
            "VALUES (:id, :t, :wid, :a, :n, :u)"
        ),
        {"id": _uuid(), "t": tenantId, "wid": claimId, "a": action, "n": notes, "u": userId},
    )

    return updates
