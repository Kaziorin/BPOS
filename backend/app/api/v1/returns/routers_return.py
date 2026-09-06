"""Return / RMA / Warranty router (Prompt 18).

Full return flow: Original Invoice → Return Request → Validation → Return Stock → Refund →
Accounting Reversal → Commission Reversal → Loyalty Reversal

RMA: RMA number, return reason, inspection, defect classification, warranty validation,
repair/replacement/refund/store-credit outcome, restocking, warranty history.

Warranty: warranty start/end/type linked to serial/IMEI; claim flow:
Claim → Inspection → Approved → Repair/Replace → Complete.
"""
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import returns as ret_engine
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, gen_no

router = APIRouter()


def _uuid():
    return str(uuid.uuid4())


# ═════════════════════════ RETURNS ═════════════════════════

@router.get("/api/v1/returns")
async def list_returns(
    status: str = "", saleId: str = "", page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "r.tenantId = :t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND r.status = :st"
        params["st"] = status
    if saleId:
        where += " AND r.saleId = :s"
        params["s"] = saleId
    off = (page - 1) * limit
    rows = rows_to_dicts(
        (await db.execute(
            text(
                f"SELECT r.*, s.invoiceNo, c.name AS customerName "
                f"FROM returns r "
                f"LEFT JOIN sales s ON s.id = r.saleId "
                f"LEFT JOIN customers c ON c.id = s.customerId "
                f"WHERE {where} ORDER BY r.createdAt DESC LIMIT :lim OFFSET :off"
            ),
            {**params, "lim": limit, "off": off},
        )).fetchall()
    )
    for r in rows:
        r["sale"] = {"id": r.pop("saleId"), "invoiceNo": r.pop("invoiceNo")} if r.get("invoiceNo") else None
        r["customer"] = {"name": r.pop("customerName")} if r.get("customerName") else None
        # Fetch return items
        items = rows_to_dicts(
            (await db.execute(
                text("SELECT * FROM return_items WHERE returnId = :rid"),
                {"rid": r["id"]},
            )).fetchall()
        )
        r["items"] = items
    total = (await db.execute(text(f"SELECT COUNT(*) FROM returns r WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total, "totalPages": (total + limit - 1) // limit}})


@router.get("/api/v1/returns/{returnId}")
async def get_return(
    returnId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    r = (
        await db.execute(
            text("SELECT * FROM returns WHERE id = :id AND tenantId = :t"),
            {"id": returnId, "t": tenantId},
        )
    ).first()
    if not r:
        return err("Return not found", 404)
    d = dict(r._mapping)
    items = rows_to_dicts(
        (await db.execute(text("SELECT * FROM return_items WHERE returnId = :rid"), {"rid": returnId})).fetchall()
    )
    d["items"] = items
    return ok(d)


@router.post("/api/v1/returns")
async def create_return(
    body: dict, user: AuthUser = Depends(require_permission("sales.refund")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Process a full return with all reversals (§10.22)."""
    saleId = body.get("saleId")
    if not saleId:
        return err("saleId is required", 400)
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
        return ok(result, 201)
    except Exception as e:
        return err(str(e), 400)


# ═════════════════════════ RMA TICKETS ═════════════════════════

@router.get("/api/v1/rma")
async def list_rma_tickets(
    status: str = "", page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "rt.tenantId = :t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND rt.status = :st"
        params["st"] = status
    off = (page - 1) * limit
    rows = rows_to_dicts(
        (await db.execute(
            text(
                f"SELECT rt.*, s.invoiceNo, c.name AS customerName "
                f"FROM rma_tickets rt "
                f"LEFT JOIN sales s ON s.id = rt.saleId "
                f"LEFT JOIN customers c ON c.id = rt.customerId "
                f"WHERE {where} ORDER BY rt.createdAt DESC LIMIT :lim OFFSET :off"
            ),
            {**params, "lim": limit, "off": off},
        )).fetchall()
    )
    for r in rows:
        r["sale"] = {"id": r.pop("saleId"), "invoiceNo": r.pop("invoiceNo")} if r.get("invoiceNo") else None
        r["customer"] = {"name": r.pop("customerName")} if r.get("customerName") else None
        items = rows_to_dicts(
            (await db.execute(
                text("SELECT * FROM rma_items WHERE rmaTicketId = :rid"),
                {"rid": r["id"]},
            )).fetchall()
        )
        r["items"] = items
    total = (await db.execute(text(f"SELECT COUNT(*) FROM rma_tickets rt WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total, "totalPages": (total + limit - 1) // limit}})


@router.post("/api/v1/rma")
async def create_rma_ticket(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    saleId = body.get("saleId")
    items = body.get("items") or []
    if not items:
        return err("At least one item is required", 400)

    rmaNo = gen_no("RMA")
    rma_id = _uuid()

    # Calculate total from items
    total = sum(float(i.get("unitPrice", 0)) * float(i.get("qty", 1)) for i in items)

    async with txn(db):
        await db.execute(
            text(
                "INSERT INTO rma_tickets "
                "(id, tenantId, branchId, rmaNo, saleId, customerId, returnType, reason, "
                "defectType, status, refundAmount, createdBy) "
                "VALUES (:id, :t, :b, :rno, :s, :c, :rt, :r, :dt, 'OPEN', :ra, :u)"
            ),
            {
                "id": rma_id, "t": tenantId, "b": body.get("branchId"),
                "rno": rmaNo, "s": saleId, "c": body.get("customerId"),
                "rt": body.get("returnType", "REFUND"),
                "r": body.get("reason"), "dt": body.get("defectType", "OTHER"),
                "ra": total, "u": user.id,
            },
        )
        for it in items:
            await db.execute(
                text(
                    "INSERT INTO rma_items "
                    "(id, tenantId, rmaTicketId, saleItemId, productId, variantId, productName, "
                    "serialNo, batchNo, qty, unitPrice, itemCondition, defectDescription) "
                    "VALUES (:id, :t, :rt, :si, :p, :v, :n, :sn, :bn, :q, :up, :ic, :dd)"
                ),
                {
                    "id": _uuid(), "t": tenantId, "rt": rma_id,
                    "si": it.get("saleItemId"), "p": it["productId"],
                    "v": it.get("variantId"), "n": it.get("productName"),
                    "sn": it.get("serialNo"), "bn": it.get("batchNo"),
                    "q": it.get("qty", 1), "up": it.get("unitPrice", 0),
                    "ic": it.get("itemCondition", "NEW"),
                    "dd": it.get("defectDescription"),
                },
            )
    return ok({"id": rma_id, "rmaNo": rmaNo, "total": total}, 201)


@router.post("/api/v1/rma/{rmaId}/action")
async def rma_action(
    rmaId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Process an RMA ticket through its lifecycle."""
    action = body.get("action")
    if not action:
        return err("action is required (inspect/approve/reject/start_repair/ready/complete/cancel)", 400)
    try:
        async with txn(db):
            result = await ret_engine.process_rma(
                db, tenantId,
                rmaTicketId=rmaId,
                action=action,
                userId=user.id,
                notes=body.get("notes"),
                resolution=body.get("resolution"),
                refundAmount=body.get("refundAmount"),
            )
        return ok(result)
    except Exception as e:
        return err(str(e), 400)


# ═════════════════════════ WARRANTY CLAIMS ═════════════════════════

@router.get("/api/v1/warranty")
async def list_warranty_claims(
    status: str = "", page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "wc.tenantId = :t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND wc.status = :st"
        params["st"] = status
    off = (page - 1) * limit
    rows = rows_to_dicts(
        (await db.execute(
            text(
                f"SELECT wc.*, p.name AS productName, c.name AS customerName "
                f"FROM warranty_claims wc "
                f"LEFT JOIN products p ON p.id = wc.productId "
                f"LEFT JOIN customers c ON c.id = wc.customerId "
                f"WHERE {where} ORDER BY wc.createdAt DESC LIMIT :lim OFFSET :off"
            ),
            {**params, "lim": limit, "off": off},
        )).fetchall()
    )
    for r in rows:
        r["product"] = {"id": r.pop("productId"), "name": r.pop("productName")} if r.get("productName") else None
        r["customer"] = {"id": r.pop("customerId"), "name": r.pop("customerName")} if r.get("customerName") else None
        # Check if warranty is still valid
        r["isWarrantyValid"] = str(r.get("warrantyEnd", "")) >= str(date.today())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM warranty_claims wc WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total, "totalPages": (total + limit - 1) // limit}})


@router.post("/api/v1/warranty")
async def create_warranty_claim(
    body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    productId = body.get("productId")
    issue = body.get("issueDescription")
    warranty_start = body.get("warrantyStart")
    warranty_end = body.get("warrantyEnd")
    if not productId or not issue or not warranty_start or not warranty_end:
        return err("productId, issueDescription, warrantyStart, warrantyEnd are required", 400)

    claimNo = gen_no("WCR")
    claim_id = _uuid()

    async with txn(db):
        await db.execute(
            text(
                "INSERT INTO warranty_claims "
                "(id, tenantId, branchId, claimNo, customerId, productId, variantId, "
                "serialNo, saleId, warrantyStart, warrantyEnd, warrantyType, "
                "issueDescription, status, createdBy) "
                "VALUES (:id, :t, :b, :cno, :c, :p, :v, :sn, :s, :ws, :we, :wt, :issue, 'SUBMITTED', :u)"
            ),
            {
                "id": claim_id, "t": tenantId, "b": body.get("branchId"),
                "cno": claimNo, "c": body.get("customerId"),
                "p": productId, "v": body.get("variantId"),
                "sn": body.get("serialNo"), "s": body.get("saleId"),
                "ws": warranty_start, "we": warranty_end,
                "wt": body.get("warrantyType", "MANUFACTURER"),
                "issue": issue, "u": user.id,
            },
        )
        # Record initial history
        await db.execute(
            text(
                "INSERT INTO warranty_history "
                "(id, tenantId, warrantyClaimId, action, notes, performedBy) "
                "VALUES (:id, :t, :wid, 'submitted', :n, :u)"
            ),
            {"id": _uuid(), "t": tenantId, "wid": claim_id, "n": "Claim submitted", "u": user.id},
        )
    return ok({"id": claim_id, "claimNo": claimNo}, 201)


@router.post("/api/v1/warranty/{claimId}/action")
async def warranty_action(
    claimId: str, body: dict, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Process a warranty claim through its lifecycle."""
    action = body.get("action")
    if not action:
        return err("action is required (inspect/approve/reject/start_repair/ready/complete/cancel)", 400)
    try:
        async with txn(db):
            result = await ret_engine.process_warranty_claim(
                db, tenantId,
                claimId=claimId,
                action=action,
                userId=user.id,
                notes=body.get("notes"),
                resolution=body.get("resolution"),
                actualCost=body.get("actualCost"),
            )
        return ok(result)
    except Exception as e:
        return err(str(e), 400)


@router.get("/api/v1/warranty/{claimId}/history")
async def warranty_claim_history(
    claimId: str, user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (await db.execute(
            text(
                "SELECT wh.*, u.name AS performedByName "
                "FROM warranty_history wh "
                "LEFT JOIN users u ON u.id = wh.performedBy "
                "WHERE wh.tenantId = :t AND wh.warrantyClaimId = :wid "
                "ORDER BY wh.createdAt DESC"
            ),
            {"t": tenantId, "wid": claimId},
        )).fetchall()
    )
    for r in rows:
        r["performedBy"] = {"id": r.pop("performedBy"), "name": r.pop("performedByName")} if r.get("performedByName") else None
    return ok(rows)
