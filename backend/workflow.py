"""Approval & Workflow Engine (§10.26) + Business Rule Engine (§10.27) — Prompt 27.

One reusable approval engine powers every approval point in the product — stock
adjustments, catalog price changes, POS price overrides, credit limits/holds,
purchase orders, expenses, shift-close variances and task approvals are all
*configured instances* (workflow_templates) of this single engine, never
separate per-module systems.

Approval semantics
------------------
- A module evaluates a change against the tenant's active `workflow_templates`
  for its entityType (condition: amount/field >/>= threshold). No matching
  template → the change applies immediately (auto-approved, no record).
- A matching template → `create_approval()` opens an `approval_requests` row
  (PENDING) with every level pre-materialized as `approval_steps`. The deferred
  change itself is stored in `payload`; it only takes effect when the final
  level approves and the per-entityType applier runs.
- Levels may be rejected (request REJECTED + reason), escalated (level skipped
  upward) or auto-escalated on timeout via `sweep_timeouts()`.
- Comments ride on the acted-upon step row — a full audit trail.

Business rules (§10.27)
-----------------------
IF/THEN rules per tenant: trigger + conditions + actions. Supported triggers:
LOW_STOCK, SALE_DISCOUNT, VIP_CUSTOMER, CREDIT_SALE. Actions are executed by
`evaluate_rules()`; modules may also call `fire_trigger()` (e.g. POS discount
handling) so the same rules apply from inside code paths.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from util import gen_no

ENTITY_LABELS = {
    "PRICE_CHANGE": "Catalog price change",
    "STOCK_ADJUST": "Stock adjustment",
    "PRICE_OVERRIDE": "POS price override",
    "CREDIT_LIMIT": "Customer credit limit",
    "CREDIT_HOLD": "Customer credit hold",
    "PURCHASE_ORDER": "Purchase order",
    "PURCHASE_REQUISITION": "Purchase requisition",
    "EXPENSE": "Expense",
    "SHIFT_CLOSE": "Shift close variance",
    "TASK": "Task approval",
    "SALE_DISCOUNT": "Discount / price override",
}

DEFAULT_LEVELS = [{"level": 1, "role": "MANAGER"}]


def _uid() -> str:
    return str(uuid.uuid4())


def _j(v):
    if v is None:
        return None
    if isinstance(v, (dict, list)):
        return v
    if isinstance(v, str):
        try:
            return json.loads(v)
        except Exception:
            return None
    return v


def _levels_of(tmpl_row: dict) -> list[dict]:
    lv = _j(tmpl_row.get("levels"))
    if not isinstance(lv, list) or not lv:
        return DEFAULT_LEVELS
    out = []
    for i, x in enumerate(lv, start=1):
        role = (x.get("role") or "MANAGER").upper() if isinstance(x, dict) else str(x).upper()
        out.append({"level": i, "role": role})
    return out


def _matches(tmpl: dict, amount: float, extra: dict | None = None) -> bool:
    """Template condition vs the change amount/field value."""
    op = (tmpl.get("conditionOperator") or ">").strip()
    val = float(tmpl.get("conditionValue") or 0)
    fld = (tmpl.get("conditionField") or "amount").strip()
    if fld != "amount" and extra and fld in extra:
        try:
            got = float(extra[fld])
        except (TypeError, ValueError):
            got = amount
    else:
        got = amount
    try:
        if op == ">": return got > val
        if op == ">=": return got >= val
        if op == "<": return got < val
        if op == "<=": return got <= val
        if op in ("==", "="): return got == val
    except Exception:
        return False
    return False


async def find_matching_template(db: AsyncSession, tenant_id: str, entity_type: str,
                                 amount: float, extra: dict | None = None):
    rows = (await db.execute(text(
        "SELECT * FROM workflow_templates WHERE tenantId=:t AND entityType=:e AND isActive=1 "
        "ORDER BY conditionValue ASC"), {"t": tenant_id, "e": entity_type})).fetchall()
    for r in rows:
        d = dict(r._mapping)
        if _matches(d, amount, extra):
            return d
    return None


async def _pending_for_entity(db: AsyncSession, tenant_id: str, entity_type: str, entity_id: str):
    return (await db.execute(text(
        "SELECT * FROM approval_requests WHERE tenantId=:t AND entityType=:e AND entityId=:i "
        "AND status='PENDING' ORDER BY createdAt DESC LIMIT 1"),
        {"t": tenant_id, "e": entity_type, "i": entity_id})).first()


async def create_approval(db: AsyncSession, tenant_id: str, entity_type: str, entity_id: str,
                          entity_no: str, summary: str, amount: float, payload: dict | None,
                          submitted_by: str, extra: dict | None = None) -> dict | None:
    """Open an approval request when a template condition matches the change.

    Returns None when the change is auto-approved (no approval needed) — callers
    then apply their change as usual. Returns the request info when the caller
    must hold off until the engine approves (applier applies the payload).
    """
    tmpl = await find_matching_template(db, tenant_id, entity_type, amount, extra)
    if not tmpl:
        return None
    existing = await _pending_for_entity(db, tenant_id, entity_type, entity_id)
    if existing:
        r = dict(existing._mapping)
        return {"approvalId": r["id"], "requestNo": r["requestNo"], "needsApproval": True,
                "currentLevel": r["currentLevel"], "currentRole": r["currentRole"],
                "status": r["status"], "existing": True}
    levels = _levels_of(tmpl)
    rid = _uid()
    rno = gen_no("APR")
    first = levels[0]
    hours = int(tmpl.get("escalateAfterHours") or 24)
    async def _run():
        await db.execute(text(
            "INSERT INTO approval_requests (id, tenantId, requestNo, entityType, entityId, entityNo, "
            "summary, amount, payload, status, currentLevel, currentRole, submittedBy, expiresAt) "
            "VALUES (:id, :t, :no, :et, :ei, :en, :s, :a, :p, 'PENDING', :cl, :cr, :u, DATE_ADD(NOW(), INTERVAL :h HOUR))"),
            {"id": rid, "t": tenant_id, "no": rno, "et": entity_type, "ei": entity_id, "en": entity_no,
             "s": summary[:290], "a": float(amount or 0), "p": json.dumps(payload) if payload is not None else None,
             "cl": first["level"], "cr": first["role"], "u": submitted_by, "h": max(hours, 1)})
        for lv in levels:
            await db.execute(text(
                "INSERT INTO approval_steps (id, tenantId, requestId, level, role, status) "
                "VALUES (:id, :t, :r, :l, :rl, 'PENDING')"),
                {"id": _uid(), "t": tenant_id, "r": rid, "l": lv["level"], "rl": lv["role"]})
    # caller may already be inside a transaction — run via session default behavior
    await _run()
    # Prompt 28 — surface an in-app approval-required notification (non-fatal)
    try:
        import notify as _nt
        await _nt.dispatch(
            db, tenant_id, "APPROVAL_REQUIRED", ref_type="APPROVAL", ref_id=rid,
            params={"summary": (summary or "")[:120], "level": first["level"], "role": first["role"]})
    except Exception:
        pass
    return {"approvalId": rid, "requestNo": rno, "needsApproval": True,
            "currentLevel": first["level"], "currentRole": first["role"], "status": "PENDING"}


async def _load(db: AsyncSession, tenant_id: str, request_id: str, lock: bool = False):
    q = ("SELECT * FROM approval_requests WHERE id=:id AND tenantId=:t"
         + (" FOR UPDATE" if lock else ""))
    row = (await db.execute(text(q), {"id": request_id, "t": tenant_id})).first()
    if not row:
        raise ValueError("Approval request not found")
    return dict(row._mapping)


async def _next_pending_step(db: AsyncSession, request_id: str, after_level: int):
    return (await db.execute(text(
        "SELECT * FROM approval_steps WHERE requestId=:r AND status='PENDING' AND level > :l "
        "ORDER BY level LIMIT 1"), {"r": request_id, "l": after_level})).first()


async def _act(db: AsyncSession, tenant_id: str, request_id: str, user_id: str, action: str,
               comment: str | None) -> dict:
    req = await _load(db, tenant_id, request_id, lock=True)
    if req["status"] != "PENDING":
        raise ValueError(f"Request is {req['status']} — cannot {action}")
    step = (await db.execute(text(
        "SELECT * FROM approval_steps WHERE requestId=:r AND level=:l AND status='PENDING' FOR UPDATE"),
        {"r": request_id, "l": req["currentLevel"]})).first()
    if not step:
        raise ValueError("No pending step at the current level")
    step_d = dict(step._mapping)
    if action == "approve":
        await db.execute(text(
            "UPDATE approval_steps SET status='APPROVED', comment=:c, actedBy=:u, actedAt=NOW() WHERE id=:id"),
            {"c": comment, "u": user_id, "id": step_d["id"]})
        nxt = await _next_pending_step(db, request_id, req["currentLevel"])
        if nxt:
            nd = dict(nxt._mapping)
            await db.execute(text(
                "UPDATE approval_requests SET currentLevel=:l, currentRole=:r, updatedAt=NOW() WHERE id=:id"),
                {"l": nd["level"], "r": nd["role"], "id": request_id})
            return {"status": "PENDING", "currentLevel": nd["level"], "currentRole": nd["role"],
                    "requestNo": req["requestNo"], "approved": True, "final": False}
        # final level — apply the deferred payload via the per-type applier
        await db.execute(text(
            "UPDATE approval_requests SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), "
            "appliedAt=NOW(), updatedAt=NOW() WHERE id=:id"), {"u": user_id, "id": request_id})
        applied = await _apply_payload(db, tenant_id, req, user_id)
        return {"status": "APPROVED", "requestNo": req["requestNo"], "approved": True,
                "final": True, "applied": applied}
    if action == "reject":
        reason = comment or "Rejected"
        await db.execute(text(
            "UPDATE approval_steps SET status='REJECTED', comment=:c, actedBy=:u, actedAt=NOW() WHERE id=:id"),
            {"c": comment, "u": user_id, "id": step_d["id"]})
        await db.execute(text(
            "UPDATE approval_requests SET status='REJECTED', rejectedBy=:u, rejectedAt=NOW(), "
            "rejectionReason=:rr, updatedAt=NOW() WHERE id=:id"),
            {"u": user_id, "rr": reason, "id": request_id})
        return {"status": "REJECTED", "requestNo": req["requestNo"], "approved": False, "final": True}
    raise ValueError(f"Unknown action {action}")


async def escalate_approval(db: AsyncSession, tenant_id: str, request_id: str, user_id: str,
                            comment: str | None = None) -> dict:
    """Skip the current level upward (manual or timeout auto-escalation)."""
    req = await _load(db, tenant_id, request_id, lock=True)
    if req["status"] != "PENDING":
        raise ValueError(f"Request is {req['status']} — cannot escalate")
    await db.execute(text(
        "UPDATE approval_steps SET status='ESCALATED', comment=:c, actedBy=:u, actedAt=NOW() "
        "WHERE requestId=:r AND level=:l AND status='PENDING'"),
        {"c": comment or "Escalated", "u": user_id, "r": request_id, "l": req["currentLevel"]})
    nxt = await _next_pending_step(db, request_id, req["currentLevel"])
    if nxt:
        nd = dict(nxt._mapping)
        await db.execute(text(
            "UPDATE approval_requests SET currentLevel=:l, currentRole=:r, escalatedAt=NOW(), "
            "updatedAt=NOW() WHERE id=:id"), {"l": nd["level"], "r": nd["role"], "id": request_id})
        return {"status": "ESCALATED", "currentLevel": nd["level"], "currentRole": nd["role"],
                "requestNo": req["requestNo"], "final": False}
    await db.execute(text(
        "UPDATE approval_requests SET status='ESCALATED', escalatedAt=NOW(), updatedAt=NOW() WHERE id=:id"),
        {"id": request_id})
    return {"status": "ESCALATED", "requestNo": req["requestNo"], "final": True}


async def cancel_approval(db: AsyncSession, tenant_id: str, request_id: str, user_id: str,
                          reason: str | None = None) -> dict:
    req = await _load(db, tenant_id, request_id, lock=True)
    if req["status"] != "PENDING":
        raise ValueError(f"Request is {req['status']} — cannot cancel")
    await db.execute(text(
        "UPDATE approval_requests SET status='CANCELLED', rejectedBy=:u, rejectedAt=NOW(), "
        "rejectionReason=:rr, updatedAt=NOW() WHERE id=:id"),
        {"u": user_id, "rr": reason or "Cancelled by submitter", "id": request_id})
    await db.execute(text(
        "UPDATE approval_steps SET status='REJECTED', comment=:c WHERE requestId=:r AND status='PENDING'"),
        {"c": reason or "Cancelled by submitter", "r": request_id})
    return {"status": "CANCELLED", "requestNo": req["requestNo"]}


async def sweep_timeouts(db: AsyncSession, tenant_id: str, user_id: str = None) -> dict:
    """Auto-escalate every PENDING request past its expiresAt (timeout)."""
    expired = (await db.execute(text(
        "SELECT id FROM approval_requests WHERE tenantId=:t AND status='PENDING' AND expiresAt < NOW()"),
        {"t": tenant_id})).fetchall()
    escalated, expired_after_last = 0, 0
    for (rid,) in expired:
        try:
            res = await escalate_approval(db, tenant_id, rid, user_id or "system")
            if res.get("final"):
                expired_after_last += 1
            else:
                escalated += 1
        except Exception:
            continue
    return {"timeoutsFound": len(expired), "escalated": escalated, "final": expired_after_last}


# ───────────────────────────── per-type appliers ─────────────────────────────
async def _apply_payload(db: AsyncSession, tenant_id: str, req: dict, user_id: str) -> bool:
    entity_type = req["entityType"]
    payload = _j(req.get("payload")) or {}
    try:
        if entity_type == "PRICE_CHANGE":
            prices = payload.get("prices") or {}
            if prices:
                sets = ", ".join(f"{k}=:{k}" for k in prices)
                params = {k: v for k, v in prices.items()}
                await db.execute(text(f"UPDATE products SET {sets}, updatedBy=:u WHERE id=:id AND tenantId=:t"),
                                 {**params, "u": user_id, "id": payload["productId"], "t": tenant_id})
        elif entity_type == "STOCK_ADJUST":
            items = payload.get("items") or []
            default_wh = payload.get("warehouseId")
            for it in items:
                diff = float(it["diff"])
                w_id = it.get("warehouseId") or default_wh
                if not w_id:
                    continue
                st = (await db.execute(text(
                    "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p "
                    "AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                    {"t": tenant_id, "w": w_id, "p": it["productId"], "v": it.get("variantId")})).first()
                before = float(st[1]) if st else 0
                after = max(before + diff, 0)
                if st:
                    await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": after, "id": st[0]})
                await db.execute(text(
                    "INSERT INTO stock_movements (id, tenantId, warehouseId, productId, variantId, movementType, qty, "
                    "qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                    "VALUES (UUID(), :t, :w, :p, :v, :mt, :q, :qb, :qa, 'APPROVAL', :rid, :n, :u, :u)"),
                    {"t": tenant_id, "w": w_id, "p": it["productId"], "v": it.get("variantId"),
                     "mt": "ADJUSTMENT_IN" if diff > 0 else "ADJUSTMENT_OUT", "q": diff, "qb": before, "qa": after,
                     "rid": req["id"], "n": f"Approved adjustment ({req['requestNo']})", "u": user_id})
            if payload.get("countId"):
                await db.execute(text(
                    "UPDATE stock_counts SET status='COMPLETED', updatedBy=:u WHERE id=:id AND tenantId=:t"),
                    {"u": user_id, "id": payload["countId"], "t": tenant_id})
        elif entity_type == "CREDIT_LIMIT":
            await db.execute(text(
                "UPDATE customers SET creditLimit=:cl, creditPeriodDays=COALESCE(:cp, creditPeriodDays), "
                "updatedBy=:u WHERE id=:id AND tenantId=:t"),
                {"cl": payload["creditLimit"], "cp": payload.get("creditPeriodDays"),
                 "u": user_id, "id": payload["customerId"], "t": tenant_id})
        elif entity_type == "CREDIT_HOLD":
            hold = 1 if payload.get("onHold", True) else 0
            await db.execute(text(
                "UPDATE customers SET status = CASE WHEN :h=1 THEN 'INACTIVE' ELSE 'ACTIVE' END, updatedBy=:u "
                "WHERE id=:id AND tenantId=:t"),
                {"h": hold, "u": user_id, "id": payload["customerId"], "t": tenant_id})
        elif entity_type == "EXPENSE":
            await db.execute(text(
                "UPDATE expenses SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), updatedBy=:u "
                "WHERE id=:id AND tenantId=:t"), {"u": user_id, "id": payload["expenseId"], "t": tenant_id})
        elif entity_type == "PURCHASE_ORDER":
            await db.execute(text(
                "UPDATE purchase_orders SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), updatedBy=:u "
                "WHERE id=:id AND tenantId=:t"), {"u": user_id, "id": payload["poId"], "t": tenant_id})
        elif entity_type == "PURCHASE_REQUISITION":
            await db.execute(text(
                "UPDATE purchase_requisitions SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), updatedBy=:u "
                "WHERE id=:id AND tenantId=:t"), {"u": user_id, "id": payload["reqId"], "t": tenant_id})
        elif entity_type == "SHIFT_CLOSE":
            await db.execute(text(
                "UPDATE cash_shifts SET status='CLOSED', closedAt=NOW(), approvedBy=:u, approvedAt=NOW(), "
                "updatedBy=:u WHERE id=:id AND tenantId=:t"),
                {"u": user_id, "id": payload["shiftId"], "t": tenant_id})
        elif entity_type == "TASK":
            await db.execute(text(
                "UPDATE tasks SET status='APPROVED', approvedBy=:u, approvedAt=NOW() WHERE id=:id AND tenantId=:t"),
                {"u": user_id, "id": payload["taskId"], "t": tenant_id})
        # SALE_DISCOUNT / PRICE_OVERRIDE are approval-of-record — nothing to re-apply
        return True
    except Exception:
        return False


# ───────────────────────────── Business Rules (§10.27) ─────────────────────────────

async def _rule_matches(rule: dict, context: dict) -> bool:
    conds = _j(rule.get("conditions")) or {}
    for fld, spec in conds.items():
        got = context.get(fld)
        if isinstance(spec, dict):
            op = spec.get("op", "eq")
            val = spec.get("value")
        else:
            op, val = "eq", spec
        try:
            if op == "gt": ok = got is not None and float(got) > float(val)
            elif op == "gte": ok = got is not None and float(got) >= float(val)
            elif op == "lt": ok = got is not None and float(got) < float(val)
            elif op == "eq": ok = got == val
            elif op == "ne": ok = got != val
            else: ok = True
        except Exception:
            ok = False
        if not ok:
            return False
    return True


async def evaluate_rules(db: AsyncSession, tenant_id: str, trigger: str, context: dict,
                         user_id: str = None) -> dict:
    """Fire every active rule for the trigger against the context.

    Returns executed actions with results so callers/tests can assert.
    """
    rules = (await db.execute(text(
        "SELECT * FROM business_rules WHERE tenantId=:t AND triggerType=:tr AND isActive=1 "
        "ORDER BY priority DESC, createdAt ASC"), {"t": tenant_id, "tr": trigger})).fetchall()
    results: list[dict] = []
    for r in rules:
        rd = dict(r._mapping)
        if not await _rule_matches(rd, context):
            continue
        actions = _j(rd.get("actions")) or []
        fired = False
        for a in actions:
            at = a.get("type")
            if at == "CREATE_PURCHASE_RECOMMENDATION":
                created = await _recommend_purchases(db, tenant_id, a, user_id)
                if created:
                    fired = True
                results.append({"rule": rd["name"], "action": at, "created": created})
            elif at == "CREATE_APPROVAL":
                ent = a.get("entityType") or "SALE_DISCOUNT"
                amt = float(context.get("amount") or a.get("amount") or 0)
                apr = await create_approval(
                    db, tenant_id, ent, context.get("entityId"), context.get("entityNo"),
                    a.get("summary") or f"Business rule: {rd['name']}", amt,
                    a.get("payload") or {}, user_id or context.get("userId"))
                if apr:
                    fired = True
                results.append({"rule": rd["name"], "action": at, "approval": apr})
            elif at == "SET_DISCOUNT":
                results.append({"rule": rd["name"], "action": at,
                                "discountPct": float(a.get("discountPct") or context.get("discountPct") or 0)})
                fired = True
            elif at == "BLOCK":
                results.append({"rule": rd["name"], "action": at, "blocked": True,
                                "reason": a.get("reason") or rd["name"]})
                fired = True
            elif at == "LOG":
                results.append({"rule": rd["name"], "action": at, "note": a.get("note") or "rule fired"})
                fired = True
        if fired:
            await db.execute(text(
                "UPDATE business_rules SET lastFiredAt=NOW() WHERE id=:id"), {"id": rd["id"]})
    return {"trigger": trigger, "matched": len(results), "results": results}


async def fire_trigger(db: AsyncSession, tenant_id: str, trigger: str, context: dict,
                       user_id: str = None) -> dict:
    """Module-side hook: evaluate rules for a trigger and surface blocking verdicts."""
    out = await evaluate_rules(db, tenant_id, trigger, context, user_id)
    blocked = [r for r in out["results"] if r.get("blocked")]
    return {**out, "blocked": blocked}


async def _recommend_purchases(db: AsyncSession, tenant_id: str, action: dict, user_id: str = None) -> int:
    """IF stock < reorder point THEN create a purchase recommendation."""
    reorder = action.get("reorderPoint")
    rows = (await db.execute(text(
        "SELECT s.productId, s.warehouseId, p.name AS productName, s.qtyOnHand, "
        "COALESCE(p.reorderPoint, 10) AS rp FROM stock s "
        "JOIN products p ON p.id=s.productId AND p.tenantId=s.tenantId "
        "WHERE s.tenantId=:t AND (s.warehouseId=:w OR :w IS NULL)"),
        {"t": tenant_id, "w": action.get("warehouseId")})).fetchall()
    created = 0
    for r in rows:
        d = dict(r._mapping)
        rp = float(reorder) if reorder is not None else float(d["rp"])
        qty = float(d["qtyOnHand"] or 0)
        if qty < rp:
            dup = (await db.execute(text(
                "SELECT id FROM purchase_recommendations WHERE tenantId=:t AND productId=:p "
                "AND warehouseId=:w AND status='PENDING'"),
                {"t": tenant_id, "p": d["productId"], "w": d["warehouseId"]})).first()
            if dup:
                continue
            await db.execute(text(
                "INSERT INTO purchase_recommendations (id, tenantId, productId, productName, warehouseId, "
                "currentStock, reorderPoint, suggestedQty, status, note, createdBy) "
                "VALUES (UUID(), :t, :p, :n, :w, :cs, :rp, :sq, 'PENDING', :note, :u)"),
                {"t": tenant_id, "p": d["productId"], "n": d["productName"], "w": d["warehouseId"],
                 "cs": qty, "rp": rp, "sq": max(rp - qty, 0), "note": "Auto: stock below reorder point",
                 "u": user_id})
            created += 1
    return created
