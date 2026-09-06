"""Task Management Router (Prompt 25 / §10.31).

Generic task engine — a task can attach to ANY entity (customer, invoice, sale,
repair ticket, purchase order, employee…) via entityType/entityId, be assigned to
an employee, user or role, carry a priority/deadline, comments and attachments,
and flow through a status lifecycle with an optional approval gate:

    PENDING → IN_PROGRESS → BLOCKED? → COMPLETED → (APPROVED | reopen)

Integration points:
- Attachables resolve to a human label automatically (customer name, invoice no…)
- Tasks list filters by status / assignee / entity / due range / search.
- Used by HRM dashboards and any module that needs follow-up work items.
"""
from __future__ import annotations

import uuid

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import workflow as wf
from db import get_db, txn
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, gen_no, paginate_params

router = APIRouter()

TASK_FLOW = {
    "PENDING": {"IN_PROGRESS", "BLOCKED", "CANCELLED"},
    "IN_PROGRESS": {"BLOCKED", "COMPLETED", "CANCELLED"},
    "BLOCKED": {"IN_PROGRESS", "CANCELLED"},
    "COMPLETED": {"APPROVED", "IN_PROGRESS"},  # reopen allowed; approval optional
}


def _uid() -> str:
    return str(uuid.uuid4())


# Which entities a task may link to, and how to render a friendly label.
_ENTITY_LOOKUP = [
    ("CUSTOMER", "customers", "id", "name", "name"),
    ("INVOICE", "invoices", "id", "invoiceNo", "invoiceNo"),
    ("SALE", "sales", "id", "invoiceNo", "invoiceNo"),
    ("SALES_ORDER", "sales_orders", "id", "orderNo", "orderNo"),
    ("REPAIR_TICKET", "repair_tickets", "id", "ticketNo", "ticketNo"),
    ("PURCHASE_ORDER", "purchase_orders", "id", "orderNo", "orderNo"),
    ("PURCHASE_REQUISITION", "purchase_requisitions", "id", "reqNo", "reqNo"),
    ("EMPLOYEE", "hrm_employees", "id", "employeeNo", "employeeNo"),
    ("LEAD", "leads", "id", "name", "name"),
    ("DELIVERY", "delivery_orders", "id", "deliveryNo", "deliveryNo"),
]


async def _entity_label(db: AsyncSession, tenant_id: str, entity_type: str | None, entity_id: str | None) -> str | None:
    """Best-effort human label for an attached entity (e.g. customer name)."""
    if not entity_type or not entity_id:
        return None
    for typ, table, pk, col, _ in _ENTITY_LOOKUP:
        if typ == entity_type.upper():
            try:
                row = (await db.execute(
                    text(f"SELECT {col} FROM {table} WHERE {pk}=:id AND tenantId=:t LIMIT 1"),
                    {"id": entity_id, "t": tenant_id})).first()
                return str(row[0]) if row else None
            except Exception:
                return None
    return None


async def _resolve_assignee(db: AsyncSession, tenant_id: str, atype: str, aid: str | None) -> str | None:
    """Display name for an assigned employee / user / role."""
    if not aid:
        return None
    try:
        if atype == "EMPLOYEE":
            row = (await db.execute(text(
                "SELECT CONCAT_WS(' ', firstName, lastName) FROM hrm_employees "
                "WHERE id=:id AND tenantId=:t"), {"id": aid, "t": tenant_id})).first()
        elif atype == "USER":
            row = (await db.execute(text("SELECT name FROM users WHERE id=:id"), {"id": aid})).first()
        elif atype == "ROLE":
            row = (await db.execute(text(
                "SELECT name FROM roles WHERE id=:id AND tenantId=:t"), {"id": aid, "t": tenant_id})).first()
        else:
            return None
        return str(row[0]) if row else None
    except Exception:
        return None


def _task_out(row: dict) -> dict:
    r = dict(row)
    return r


# ═════════════════════════ LIST / CREATE ═════════════════════════

@router.get("/api/v1/tasks")
async def list_tasks(
    status: str = "", assigneeId: str = "", assigneeType: str = "EMPLOYEE",
    entityType: str = "", entityId: str = "", createdByMe: int = 0,
    search: str = "", page: int = Query(1), limit: int = Query(50),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "t.tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND t.status=:st"; params["st"] = status
    if assigneeId:
        where += " AND t.assigneeType=:at AND t.assigneeId=:a"; params["at"] = assigneeType; params["a"] = assigneeId
    if entityType:
        where += " AND t.entityType=:et"; params["et"] = entityType.upper()
        if entityId:
            where += " AND t.entityId=:eid"; params["eid"] = entityId
    if createdByMe:
        where += " AND t.creatorId=:c"; params["c"] = user.id
    if search:
        where += " AND (t.title LIKE :q OR t.taskNo LIKE :q)"; params["q"] = f"%{search}%"
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT t.*, CONCAT_WS(' ', e.firstName, e.lastName) AS assigneeName, u.name AS creatorName "
        f"FROM tasks t "
        f"LEFT JOIN hrm_employees e ON e.id = t.assigneeId AND t.assigneeType='EMPLOYEE' "
        f"LEFT JOIN users u ON u.id = t.creatorId "
        f"WHERE {where} ORDER BY "
        f"CASE t.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3 END, "
        f"t.dueAt IS NULL, t.dueAt ASC, t.createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    for r in rows:
        if not r.get("assigneeName"):
            r["assigneeName"] = await _resolve_assignee(db, tenantId, r.get("assigneeType"), r.get("assigneeId"))
        if not r.get("entityLabel"):
            r["entityLabel"] = await _entity_label(db, tenantId, r.get("entityType"), r.get("entityId"))
    total = (await db.execute(text(f"SELECT COUNT(*) FROM tasks t WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total}})


@router.get("/api/v1/tasks/entity/{entityType}/{entityId}")
async def tasks_for_entity(entityType: str, entityId: str,
                           user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant),
                           db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT t.*, CONCAT_WS(' ', e.firstName, e.lastName) AS assigneeName "
        "FROM tasks t LEFT JOIN hrm_employees e ON e.id=t.assigneeId "
        "WHERE t.tenantId=:t AND t.entityType=:et AND t.entityId=:eid "
        "ORDER BY t.createdAt DESC"), {"t": tenantId, "et": entityType.upper(), "eid": entityId})).fetchall())
    return ok(rows)


@router.post("/api/v1/tasks")
async def create_task(body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    title = (body.get("title") or "").strip()
    if not title:
        return err("title is required", 400)
    entity_type = (body.get("entityType") or "").upper() or None
    entity_id = body.get("entityId") or None
    assignee_type = (body.get("assigneeType") or "EMPLOYEE").upper()
    if assignee_type not in ("EMPLOYEE", "USER", "ROLE"):
        return err("assigneeType must be EMPLOYEE, USER or ROLE", 400)
    task_no = gen_no("TSK")
    task_id = _uid()
    label = await _entity_label(db, tenantId, entity_type, entity_id)
    assignee_name = await _resolve_assignee(db, tenantId, assignee_type, body.get("assigneeId"))
    async with txn(db):
        await db.execute(text(
            "INSERT INTO tasks (id, tenantId, taskNo, title, description, entityType, entityId, entityLabel, "
            "assigneeType, assigneeId, assigneeRole, creatorId, priority, status, dueAt, createdBy) "
            "VALUES (:id, :t, :no, :ti, :d, :et, :eid, :el, :at, :aid, :role, :cr, :p, 'PENDING', :due, :u)"),
            {"id": task_id, "t": tenantId, "no": task_no, "ti": title, "d": body.get("description"),
             "et": entity_type, "eid": entity_id, "el": label or body.get("entityLabel"),
             "at": assignee_type, "aid": body.get("assigneeId") or None,
             "role": body.get("assigneeRole") if assignee_type == "ROLE" else None,
             "cr": user.id, "p": body.get("priority", "NORMAL"),
             "due": body.get("dueAt"), "u": user.id})
    task = (await db.execute(text("SELECT * FROM tasks WHERE id=:id AND tenantId=:t"),
                             {"id": task_id, "t": tenantId})).first()
    d = dict(task._mapping)
    d["entityLabel"] = label
    d["assigneeName"] = assignee_name
    return ok(d, 201)


@router.get("/api/v1/tasks/{taskId}")
async def get_task(taskId: str, user: AuthUser = Depends(require_auth),
                   tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM tasks WHERE id=:id AND tenantId=:t"),
                            {"id": taskId, "t": tenantId})).first()
    if not row:
        return err("Task not found", 404)
    d = dict(row._mapping)
    d["entityLabel"] = d.get("entityLabel") or await _entity_label(db, tenantId, d.get("entityType"), d.get("entityId"))
    d["assigneeName"] = await _resolve_assignee(db, tenantId, d.get("assigneeType"), d.get("assigneeId"))
    d["comments"] = rows_to_dicts((await db.execute(text(
        "SELECT * FROM task_comments WHERE taskId=:id ORDER BY createdAt"), {"id": taskId})).fetchall())
    d["attachments"] = rows_to_dicts((await db.execute(text(
        "SELECT * FROM task_attachments WHERE taskId=:id ORDER BY createdAt"), {"id": taskId})).fetchall())
    return ok(d)


@router.patch("/api/v1/tasks/{taskId}")
async def update_task(taskId: str, body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(text("SELECT id FROM tasks WHERE id=:id AND tenantId=:t"),
                                 {"id": taskId, "t": tenantId})).first()
    if not existing:
        return err("Task not found", 404)
    fields, params = [], {"id": taskId, "t": tenantId}
    for key in ("title", "description", "priority", "dueAt", "entityType", "entityId", "entityLabel",
                "assigneeType", "assigneeId", "assigneeRole", "cancelReason"):
        if key in body and body[key] is not None:
            fields.append(f"{key}=:{key}")
            params[key] = body[key].upper() if key in ("entityType", "assigneeType", "priority") and isinstance(body[key], str) else body[key]
    # Re-resolve entity label if entity changed.
    if "entityType" in body and "entityId" in body:
        params["entityLabel"] = await _entity_label(db, tenantId, body["entityType"], body["entityId"])
        fields.append("entityLabel=:entityLabel")
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE tasks SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.post("/api/v1/tasks/{taskId}/status")
async def transition_task(taskId: str, body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM tasks WHERE id=:id AND tenantId=:t FOR UPDATE"),
                            {"id": taskId, "t": tenantId})).first()
    if not row:
        return err("Task not found", 404)
    t = dict(row._mapping)
    target = (body.get("status") or "").upper()
    allowed = TASK_FLOW.get(t["status"], set())
    if target == "COMPLETED":
        if t["status"] not in ("IN_PROGRESS", "BLOCKED", "PENDING"):
            return err(f"Cannot complete a task in status {t['status']}", 400)
        async with txn(db):
            await db.execute(text(
                "UPDATE tasks SET status='COMPLETED', completedBy=:u, completedAt=NOW() WHERE id=:id"),
                {"u": user.id, "id": taskId})
        return ok({"status": "COMPLETED", "completedAt": datetime.now().isoformat()})
    if target == "APPROVED":
        if t["status"] != "COMPLETED":
            return err("Only a COMPLETED task can be approved", 400)
        # ── Prompt 27: task sign-off routes through the workflow engine when a
        #    TASK template is configured; otherwise it approves inline as before.
        try:
            apr = await wf.create_approval(
                db, tenantId, "TASK", taskId, t.get("taskNo") or t["id"][:8],
                f"Task approval: {t.get('title', '')[:80]}", 1,
                {"taskId": taskId}, user.id)
        except Exception:
            apr = None
        if apr:
            await db.commit()
            return ok({"status": "COMPLETED", "needsApproval": True, "approval": apr}, 202)
        async with txn(db):
            await db.execute(text(
                "UPDATE tasks SET status='APPROVED', approvedBy=:u, approvedAt=NOW() WHERE id=:id"),
                {"u": user.id, "id": taskId})
        return ok({"status": "APPROVED", "approvedAt": datetime.now().isoformat()})
    if target == "CANCELLED":
        # A task can only be cancelled while it is still open — completed and
        # approved tasks are terminal and must not be cancelled retroactively.
        if t["status"] not in ("PENDING", "IN_PROGRESS", "BLOCKED"):
            return err(f"Cannot cancel a task in status {t['status']}", 400)
        async with txn(db):
            await db.execute(text(
                "UPDATE tasks SET status='CANCELLED', cancelReason=:r WHERE id=:id"),
                {"r": body.get("reason"), "id": taskId})
        return ok({"status": "CANCELLED"})
    if target not in allowed:
        return err(f"Cannot move from {t['status']} to {target} — allowed: {sorted(allowed)}", 400)
    async with txn(db):
        await db.execute(text("UPDATE tasks SET status=:s WHERE id=:id"),
                         {"s": target, "id": taskId})
    return ok({"status": target})


@router.post("/api/v1/tasks/{taskId}/comments")
async def add_task_comment(taskId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM tasks WHERE id=:id AND tenantId=:t"),
                            {"id": taskId, "t": tenantId})).first()
    if not row:
        return err("Task not found", 404)
    comment = (body.get("comment") or "").strip()
    if not comment:
        return err("comment is required", 400)
    me = (await db.execute(text("SELECT name FROM users WHERE id=:id"), {"id": user.id})).first()
    cid = _uid()
    await db.execute(text(
        "INSERT INTO task_comments (id, tenantId, taskId, authorId, authorName, comment) "
        "VALUES (:id, :t, :tid, :a, :an, :c)"),
        {"id": cid, "t": tenantId, "tid": taskId, "a": user.id,
         "an": (me[0] if me else None) or "User", "c": comment})
    await db.commit()
    return ok({"id": cid, "comment": comment, "authorName": (me[0] if me else None) or "User"}, 201)


@router.post("/api/v1/tasks/{taskId}/attachments")
async def add_task_attachment(taskId: str, body: dict, user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM tasks WHERE id=:id AND tenantId=:t"),
                            {"id": taskId, "t": tenantId})).first()
    if not row:
        return err("Task not found", 404)
    fileName = body.get("fileName")
    if not fileName:
        return err("fileName is required", 400)
    aid = _uid()
    await db.execute(text(
        "INSERT INTO task_attachments (id, tenantId, taskId, fileName, fileUrl, fileType, sizeBytes, uploadedBy) "
        "VALUES (:id, :t, :tid, :f, :u, :ft, :sz, :by)"),
        {"id": aid, "t": tenantId, "tid": taskId, "f": fileName, "u": body.get("fileUrl"),
         "ft": body.get("fileType"), "sz": body.get("sizeBytes"), "by": user.id})
    await db.commit()
    return ok({"id": aid, "fileName": fileName}, 201)


@router.delete("/api/v1/tasks/{taskId}")
async def delete_task(taskId: str, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM tasks WHERE id=:id AND tenantId=:t"),
                            {"id": taskId, "t": tenantId})).first()
    if not row:
        return err("Task not found", 404)
    async with txn(db):
        await db.execute(text("DELETE FROM task_comments WHERE taskId=:id"), {"id": taskId})
        await db.execute(text("DELETE FROM task_attachments WHERE taskId=:id"), {"id": taskId})
        await db.execute(text("DELETE FROM tasks WHERE id=:id"), {"id": taskId})
    return ok({"deleted": True})
