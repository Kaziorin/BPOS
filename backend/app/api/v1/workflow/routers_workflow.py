"""HTTP layer for the Prompt 27 engines (§10.26 Approval & Workflow, §10.27 Business Rules)."""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts
import workflow as wf

router = APIRouter()


def _uid() -> str:
    return str(uuid.uuid4())


def _json_out(v):
    return json.dumps(v) if v is not None else None


# ═════════════════════════ WORKFLOW TEMPLATES ═════════════════════════

@router.get("/api/v1/approvals/templates")
async def list_templates(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                         db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM workflow_templates WHERE tenantId=:t ORDER BY entityType, conditionValue"),
        {"t": tenantId})).fetchall())
    for r in rows:
        r["levels"] = wf._j(r.get("levels"))
    return ok(rows)


@router.post("/api/v1/approvals/templates")
async def create_template(body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = (body.get("name") or "").strip()
    et = (body.get("entityType") or "").strip().upper()
    if not name or not et:
        return err("name and entityType are required", 400)
    levels = body.get("levels") or [{"level": 1, "role": "MANAGER"}]
    if not isinstance(levels, list) or not levels:
        return err("levels must be a non-empty list of {level, role}", 400)
    tid = _uid()
    await db.execute(text(
        "INSERT INTO workflow_templates (id, tenantId, name, entityType, entityLabel, conditionField, "
        "conditionOperator, conditionValue, levels, escalateAfterHours, isActive, createdBy) "
        "VALUES (:id, :t, :n, :et, :el, :cf, :co, :cv, :lv, :h, :ia, :u)"),
        {"id": tid, "t": tenantId, "n": name, "et": et, "el": body.get("entityLabel") or wf.ENTITY_LABELS.get(et),
         "cf": (body.get("conditionField") or "amount").strip(),
         "co": (body.get("conditionOperator") or ">").strip(),
         "cv": float(body.get("conditionValue") or 0), "lv": _json_out(levels),
         "h": int(body.get("escalateAfterHours") or 24), "ia": 1 if body.get("isActive", True) else 0,
         "u": user.id})
    await db.commit()
    return ok({"id": tid, "name": name, "entityType": et}, 201)


@router.patch("/api/v1/approvals/templates/{templateId}")
async def update_template(templateId: str, body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    fields, params = [], {"id": templateId, "t": tenantId}
    for key, col in (("name", "name"), ("entityType", "entityType"), ("entityLabel", "entityLabel"),
                     ("conditionField", "conditionField"), ("conditionOperator", "conditionOperator"),
                     ("escalateAfterHours", "escalateAfterHours")):
        if key in body and body[key] is not None:
            fields.append(f"{col}=:{col}")
            params[col] = body[key].upper() if key == "entityType" and isinstance(body[key], str) else body[key]
    if "conditionValue" in body and body["conditionValue"] is not None:
        fields.append("conditionValue=:conditionValue")
        params["conditionValue"] = float(body["conditionValue"])
    if "levels" in body and isinstance(body.get("levels"), list):
        fields.append("levels=:levels")
        params["levels"] = _json_out(body["levels"])
    if "isActive" in body and body["isActive"] is not None:
        fields.append("isActive=:isActive")
        params["isActive"] = 1 if body["isActive"] else 0
    if not fields:
        return err("Nothing to update", 400)
    res = await db.execute(text(f"UPDATE workflow_templates SET {', '.join(fields)}, updatedAt=NOW() "
                                f"WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Template not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/approvals/templates/{templateId}")
async def delete_template(templateId: str, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("DELETE FROM workflow_templates WHERE id=:id AND tenantId=:t"),
                           {"id": templateId, "t": tenantId})
    await db.commit()
    if res.rowcount == 0:
        return err("Template not found", 404)
    return ok({"deleted": True})


# ═════════════════════════ APPROVAL REQUESTS ═════════════════════════

@router.get("/api/v1/approvals")
async def list_approvals(status: str = "", entityType: str = "", mine: bool = False,
                         limit: int = Query(100), user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "ar.tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND ar.status=:s"
        params["s"] = status.upper()
    if entityType:
        where += " AND ar.entityType=:e"
        params["e"] = entityType.upper()
    if mine:
        where += " AND ar.submittedBy=:u"
        params["u"] = user.id
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT ar.*, COUNT(aps.id) AS totalLevels, "
        f"SUM(CASE WHEN aps.status='APPROVED' THEN 1 ELSE 0 END) AS approvedLevels "
        f"FROM approval_requests ar "
        f"LEFT JOIN approval_steps aps ON aps.requestId=ar.id "
        f"WHERE {where} GROUP BY ar.id ORDER BY ar.createdAt DESC LIMIT :lim"),
        {**params, "lim": min(limit, 500)})).fetchall())
    for r in rows:
        r["entityLabel"] = wf.ENTITY_LABELS.get(r["entityType"], r["entityType"])
        r["payload"] = wf._j(r.get("payload"))
        r["ageMinutes"] = r.get("createdAt")
    return ok(rows)


@router.get("/api/v1/approvals/{requestId}")
async def get_approval(requestId: str, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM approval_requests WHERE id=:id AND tenantId=:t"),
                            {"id": requestId, "t": tenantId})).first()
    if not row:
        return err("Approval request not found", 404)
    d = dict(row._mapping)
    d["payload"] = wf._j(d.get("payload"))
    d["entityLabel"] = wf.ENTITY_LABELS.get(d["entityType"], d["entityType"])
    steps = rows_to_dicts((await db.execute(text(
        "SELECT * FROM approval_steps WHERE requestId=:r ORDER BY level"), {"r": requestId})).fetchall())
    d["steps"] = steps
    return ok(d)


@router.post("/api/v1/approvals/{requestId}/approve")
async def approve_request(requestId: str, body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    try:
        res = await wf._act(db, tenantId, requestId, user.id, "approve", body.get("comment"))
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok(res)


@router.post("/api/v1/approvals/{requestId}/reject")
async def reject_request(requestId: str, body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    try:
        res = await wf._act(db, tenantId, requestId, user.id, "reject", body.get("comment"))
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok(res)


@router.post("/api/v1/approvals/{requestId}/escalate")
async def escalate_request(requestId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    try:
        res = await wf.escalate_approval(db, tenantId, requestId, user.id, body.get("comment"))
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok(res)


@router.post("/api/v1/approvals/{requestId}/cancel")
async def cancel_request(requestId: str, body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    try:
        res = await wf.cancel_approval(db, tenantId, requestId, user.id, body.get("reason"))
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok(res)


@router.post("/api/v1/approvals/sweep-timeouts")
async def sweep_timeouts(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                         db: AsyncSession = Depends(get_db)):
    res = await wf.sweep_timeouts(db, tenantId, user.id)
    await db.commit()
    return ok(res)


# ═════════════════════════ BUSINESS RULES (§10.27) ═════════════════════════

RULE_TRIGGERS = ["LOW_STOCK", "SALE_DISCOUNT", "VIP_CUSTOMER", "CREDIT_SALE"]


@router.get("/api/v1/business-rules")
async def list_rules(trigger: str = "", user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if trigger:
        where += " AND triggerType=:tr"
        params["tr"] = trigger.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM business_rules WHERE {where} ORDER BY priority DESC, createdAt"), params)).fetchall())
    for r in rows:
        r["conditions"] = wf._j(r.get("conditions"))
        r["actions"] = wf._j(r.get("actions"))
    return ok(rows)


@router.post("/api/v1/business-rules")
async def create_rule(body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = (body.get("name") or "").strip()
    trigger = (body.get("triggerType") or "").upper().strip()
    if not name or trigger not in RULE_TRIGGERS:
        return err(f"name and a valid triggerType ({', '.join(RULE_TRIGGERS)}) are required", 400)
    actions = body.get("actions") or []
    if not isinstance(actions, list) or not actions:
        return err("actions must be a non-empty list", 400)
    rid = _uid()
    await db.execute(text(
        "INSERT INTO business_rules (id, tenantId, name, triggerType, conditions, actions, priority, "
        "isActive, createdBy) VALUES (:id, :t, :n, :tr, :c, :a, :p, :ia, :u)"),
        {"id": rid, "t": tenantId, "n": name, "tr": trigger, "c": _json_out(body.get("conditions")),
         "a": _json_out(actions), "p": int(body.get("priority") or 0),
         "ia": 1 if body.get("isActive", True) else 0, "u": user.id})
    await db.commit()
    return ok({"id": rid, "name": name, "triggerType": trigger}, 201)


@router.patch("/api/v1/business-rules/{ruleId}")
async def update_rule(ruleId: str, body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    fields, params = [], {"id": ruleId, "t": tenantId}
    if body.get("name") is not None:
        fields.append("name=:name"); params["name"] = body["name"]
    if body.get("triggerType") is not None:
        fields.append("triggerType=:triggerType"); params["triggerType"] = body["triggerType"].upper()
    if body.get("conditions") is not None:
        fields.append("conditions=:conditions"); params["conditions"] = _json_out(body["conditions"])
    if body.get("actions") is not None:
        fields.append("actions=:actions"); params["actions"] = _json_out(body["actions"])
    if body.get("priority") is not None:
        fields.append("priority=:priority"); params["priority"] = int(body["priority"])
    if body.get("isActive") is not None:
        fields.append("isActive=:isActive"); params["isActive"] = 1 if body["isActive"] else 0
    if not fields:
        return err("Nothing to update", 400)
    res = await db.execute(text(f"UPDATE business_rules SET {', '.join(fields)}, updatedAt=NOW() "
                                f"WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Rule not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/business-rules/{ruleId}")
async def delete_rule(ruleId: str, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("DELETE FROM business_rules WHERE id=:id AND tenantId=:t"),
                           {"id": ruleId, "t": tenantId})
    await db.commit()
    if res.rowcount == 0:
        return err("Rule not found", 404)
    return ok({"deleted": True})


@router.post("/api/v1/business-rules/evaluate")
async def evaluate_rule(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    trigger = (body.get("triggerType") or "").upper().strip()
    if trigger not in RULE_TRIGGERS:
        return err("triggerType must be one of " + ", ".join(RULE_TRIGGERS), 400)
    context = body.get("context") or {}
    res = await wf.evaluate_rules(db, tenantId, trigger, {**context, "userId": user.id}, user.id)
    await db.commit()
    return ok(res)


# ═════════════════════════ PURCHASE RECOMMENDATIONS ═════════════════════════

@router.get("/api/v1/purchase-recommendations")
async def list_recommendations(status: str = "", user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status=:s"
        params["s"] = status.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM purchase_recommendations WHERE {where} ORDER BY createdAt DESC LIMIT 200"),
        params)).fetchall())
    return ok(rows)


@router.post("/api/v1/purchase-recommendations/{recId}/convert")
async def convert_recommendation(recId: str, body: dict, user: AuthUser = Depends(require_auth),
                                 tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text(
        "SELECT * FROM purchase_recommendations WHERE id=:id AND tenantId=:t"),
        {"id": recId, "t": tenantId})).first()
    if not row:
        return err("Recommendation not found", 404)
    d = dict(row._mapping)
    if d["status"] != "PENDING":
        return err(f"Recommendation is {d['status']}", 400)
    # convert into a real requisition line under an auto requisition
    requisition_id = None
    if body.get("requisitionId"):
        requisition_id = body["requisitionId"]
    else:
        pr_no = "PR" + uuid.uuid4().hex[:10].upper()
        req_id = _uid()
        await db.execute(text(
            "INSERT INTO purchase_requisitions (id, tenantId, branchId, warehouseId, requestedBy, prNo, "
            "requestDate, status, note, createdBy) VALUES (:id, :t, NULL, :w, :u, :no, NOW(), 'DRAFT', :n, :u)"),
            {"id": req_id, "t": tenantId, "w": d["warehouseId"], "u": user.id, "no": pr_no,
             "n": f"Auto requisition from recommendation ({d['productName']})"})
        requisition_id = req_id
    await db.execute(text(
        "INSERT INTO purchase_requisition_items (id, tenantId, requisitionId, productId, qty, estUnitPrice, note) "
        "VALUES (UUID(), :t, :r, :p, :q, 0, :n)"),
        {"t": tenantId, "r": requisition_id, "p": d["productId"], "q": max(float(d["suggestedQty"]), 1),
         "n": f"From recommendation {d['id']}"})
    await db.execute(text("UPDATE purchase_recommendations SET status='CONVERTED', updatedAt=NOW() WHERE id=:id"),
                     {"id": recId})
    await db.commit()
    return ok({"converted": True, "requisitionId": requisition_id, "productId": d["productId"],
               "suggestedQty": d["suggestedQty"]})


@router.post("/api/v1/purchase-recommendations/{recId}/dismiss")
async def dismiss_recommendation(recId: str, user: AuthUser = Depends(require_auth),
                                 tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    res = await db.execute(text(
        "UPDATE purchase_recommendations SET status='DISMISSED', updatedAt=NOW() WHERE id=:id AND tenantId=:t"),
        {"id": recId, "t": tenantId})
    await db.commit()
    if res.rowcount == 0:
        return err("Recommendation not found", 404)
    return ok({"dismissed": True})


# ═════════════════════════ WORKFLOW BUILDER (Prompt 34) ═════════════════════════

ENTITY_TYPES = [
    "EXPENSE", "PRICE_CHANGE", "CREDIT_LIMIT", "STOCK_ADJUST",
    "PURCHASE", "REFUND", "DISCOUNT", "WRITE_OFF",
    "SALARY", "LEAVE", "SHIFT_CLOSE", "INVOICE",
]

@router.get("/api/v1/workflow-builder/rules")
async def list_builder_rules(
    entityType: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if entityType:
        where += " AND entityType=:e"; params["e"] = entityType.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM workflow_builder_rules WHERE {where} ORDER BY priority, name"), params)).fetchall())
    for r in rows:
        for field in ("conditions", "approvers", "notifyChannels"):
            if isinstance(r.get(field), str):
                try: r[field] = json.loads(r[field])
                except: pass
    return ok(rows)


@router.post("/api/v1/workflow-builder/rules")
async def create_builder_rule(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name", "")
    entity_type = (body.get("entityType") or "").upper()
    if not name or not entity_type:
        return err("name and entityType required", 400)
    if entity_type not in ENTITY_TYPES:
        return err(f"entityType must be one of: {ENTITY_TYPES}", 400)

    conditions = body.get("conditions", {})
    approvers = body.get("approvers", [])
    if not approvers:
        return err("At least one approver required", 400)

    rid = _uid()
    await db.execute(text(
        "INSERT INTO workflow_builder_rules (id, tenantId, name, entityType, description, "
        "conditions, approvers, escalationHours, notifyChannels, isActive, priority, createdBy) "
        "VALUES (:id, :t, :n, :e, :d, :cond, :app, :esc, :notif, :active, :prio, :u)"),
        {"id": rid, "t": tenantId, "n": name, "e": entity_type,
         "d": body.get("description"),
         "cond": json.dumps(conditions),
         "app": json.dumps(approvers),
         "esc": body.get("escalationHours", 24),
         "notif": json.dumps(body.get("notifyChannels", ["IN_APP"])),
         "active": 1 if body.get("isActive", True) else 0,
         "prio": body.get("priority", 100),
         "u": user.id})
    await db.commit()
    return ok({"id": rid}, 201)


@router.get("/api/v1/workflow-builder/rules/{ruleId}")
async def get_builder_rule(
    ruleId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT * FROM workflow_builder_rules WHERE id=:id AND tenantId=:t"),
        {"id": ruleId, "t": tenantId})).first()
    if not row:
        return err("Rule not found", 404)
    data = dict(row._mapping) if hasattr(row, '_mapping') else dict(row)
    for field in ("conditions", "approvers", "notifyChannels"):
        if isinstance(data.get(field), str):
            try: data[field] = json.loads(data[field])
            except: pass
    return ok(data)


@router.patch("/api/v1/workflow-builder/rules/{ruleId}")
async def update_builder_rule(
    ruleId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": ruleId, "t": tenantId}
    for key in ("name", "description", "escalationHours", "priority"):
        if key in body:
            fields.append(f"{key}=:{key}"); params[key] = body[key]
    if "entityType" in body:
        et = body["entityType"].upper()
        if et not in ENTITY_TYPES:
            return err(f"entityType must be one of: {ENTITY_TYPES}", 400)
        fields.append("entityType=:entityType"); params["entityType"] = et
    if "conditions" in body:
        fields.append("conditions=:conditions"); params["conditions"] = json.dumps(body["conditions"])
    if "approvers" in body:
        fields.append("approvers=:approvers"); params["approvers"] = json.dumps(body["approvers"])
    if "notifyChannels" in body:
        fields.append("notifyChannels=:notif"); params["notif"] = json.dumps(body["notifyChannels"])
    if "isActive" in body:
        fields.append("isActive=:active"); params["active"] = 1 if body["isActive"] else 0
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    res = await db.execute(text(
        f"UPDATE workflow_builder_rules SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    if res.rowcount == 0:
        return err("Rule not found", 404)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/workflow-builder/rules/{ruleId}")
async def delete_builder_rule(
    ruleId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(text(
        "DELETE FROM workflow_builder_rules WHERE id=:id AND tenantId=:t"),
        {"id": ruleId, "t": tenantId})
    if res.rowcount == 0:
        return err("Rule not found", 404)
    await db.commit()
    return ok({"deleted": True})


@router.get("/api/v1/workflow-builder/entity-types")
async def list_entity_types():
    return ok(ENTITY_TYPES)
