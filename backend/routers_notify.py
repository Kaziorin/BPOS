"""Prompt 28 — Notification Engine + Customer Communication router."""

import uuid as _uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import AuthUser, require_auth, resolve_tenant
from util import err, ok, rows_to_dicts
from notify import (CHANNELS, EVENTS, CUSTOMER_EVENTS, USER_EVENTS, dispatch,
                    inbox_for, unread_count, run_scheduled_checks,
                    DEFAULT_BODY, DEFAULT_TITLES, _uid)

router = APIRouter()


def _json_out(v):
    import json
    if v is None:
        return None
    if isinstance(v, str):
        return v
    return json.dumps(v)


def _json_in(v):
    import json
    if v is None:
        return None
    if isinstance(v, (dict, list)):
        return v
    try:
        return json.loads(v)
    except Exception:
        return {}


# ══════════════════════ EVENT CATALOG ══════════════════════

@router.get("/api/v1/notify/events")
async def list_events(user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    out = []
    for code, meta in EVENTS.items():
        out.append({"code": code, "label": meta["label"], "audience": meta["audience"],
                    "channels": meta["channels"]})
    return ok(out)


# ══════════════════════ IN-APP INBOX ══════════════════════

@router.get("/api/v1/notifications")
async def list_inbox(unreadOnly: bool = False, limit: int = Query(100),
                     user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                     db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t AND (userId=:u OR userId IS NULL)"
    params: dict = {"t": tenantId, "u": user.id}
    if unreadOnly:
        where += " AND isRead=0"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM inapp_notifications WHERE {where} ORDER BY createdAt DESC LIMIT :l"),
        {**params, "l": min(limit, 200)})).fetchall())
    unread = await unread_count(db, tenantId, user.id)
    return ok({"items": rows, "unread": unread})


@router.get("/api/v1/notifications/unread-count")
async def count_unread(user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    return ok({"unread": await unread_count(db, tenantId, user.id)})


@router.patch("/api/v1/notifications/{notificationId}/read")
async def mark_read(notificationId: str, user: AuthUser = Depends(require_auth),
                    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    await db.execute(text(
        "UPDATE inapp_notifications SET isRead=1, readAt=NOW() WHERE id=:id AND tenantId=:t "
        "AND (userId=:u OR userId IS NULL)"), {"id": notificationId, "t": tenantId, "u": user.id})
    await db.commit()
    return ok({"read": True})


@router.post("/api/v1/notifications/read-all")
async def mark_all_read(user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    await db.execute(text(
        "UPDATE inapp_notifications SET isRead=1, readAt=NOW() WHERE tenantId=:t "
        "AND (userId=:u OR userId IS NULL) AND isRead=0"), {"t": tenantId, "u": user.id})
    await db.commit()
    return ok({"readAll": True})


# ══════════════════════ CHANNELS ══════════════════════

@router.get("/api/v1/notify/channels")
async def list_channels(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                        db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text(
        "SELECT code, name, isEnabled FROM notification_channels WHERE tenantId=:t"),
        {"t": tenantId})).fetchall()
    present = {r[0] for r in rows}
    out = [{"code": r[0], "name": r[1], "isEnabled": r[2]} for r in rows]
    for ch in CHANNELS:
        if ch not in present:
            out.append({"code": ch, "name": ch.replace("_", " ").title(), "isEnabled": 1})
    return ok(out)


@router.patch("/api/v1/notify/channels/{code}")
async def toggle_channel(code: str, body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    code = code.upper()
    if code not in CHANNELS:
        return err(f"Unknown channel {code}", 400)
    enabled = 1 if body.get("isEnabled", True) else 0
    await db.execute(text(
        "INSERT INTO notification_channels (id, tenantId, code, name, isEnabled) VALUES (:id, :t, :c, :n, :e) "
        "ON DUPLICATE KEY UPDATE isEnabled=:e2, name=VALUES(name)"),
        {"id": _uuid.uuid4(), "t": tenantId, "c": code, "n": code.title(), "e": enabled, "e2": enabled})
    await db.commit()
    return ok({"code": code, "isEnabled": enabled})


# ══════════════════════ TEMPLATES ══════════════════════

@router.get("/api/v1/notify/templates")
async def list_templates(eventType: str = "", channel: str = "",
                         user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                         db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if eventType:
        where += " AND eventType=:e"
        params["e"] = eventType.upper()
    if channel:
        where += " AND channel=:c"
        params["c"] = channel.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM notification_templates WHERE {where} ORDER BY eventType, channel"), params)).fetchall())
    return ok(rows)


@router.post("/api/v1/notify/templates")
async def create_template(body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    event = (body.get("eventType") or "").upper().strip()
    channel = (body.get("channel") or "").upper().strip()
    if event not in EVENTS or channel not in CHANNELS:
        return err("eventType and channel are required (see /notify/events, /notify/channels)", 400)
    tid = _uid()
    await db.execute(text(
        "INSERT INTO notification_templates (id, tenantId, eventType, channel, name, subject, body, isActive, createdBy) "
        "VALUES (:id, :t, :e, :c, :n, :s, :b, :a, :u)"),
        {"id": tid, "t": tenantId, "e": event, "c": channel, "n": body.get("name"),
         "s": body.get("subject"), "b": body.get("body"), "a": 1 if body.get("isActive", True) else 0, "u": user.id})
    await db.commit()
    return ok({"id": tid}, 201)


@router.patch("/api/v1/notify/templates/{templateId}")
async def update_template(templateId: str, body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    fields, params = [], {"id": templateId, "t": tenantId}
    for key in ("name", "subject", "body", "eventType", "channel"):
        if body.get(key) is not None:
            fields.append(f"{key}=:{key}")
            params[key] = body[key].upper() if key in ("eventType", "channel") else body[key]
    if body.get("isActive") is not None:
        fields.append("isActive=:isActive")
        params["isActive"] = 1 if body["isActive"] else 0
    if not fields:
        return err("Nothing to update", 400)
    res = await db.execute(text(f"UPDATE notification_templates SET {', '.join(fields)}, updatedAt=NOW() "
                                f"WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Template not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/notify/templates/{templateId}")
async def delete_template(templateId: str, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    res = await db.execute(text("DELETE FROM notification_templates WHERE id=:id AND tenantId=:t"),
                           {"id": templateId, "t": tenantId})
    await db.commit()
    if res.rowcount == 0:
        return err("Template not found", 404)
    return ok({"deleted": True})


# ══════════════════════ OUTBOX ══════════════════════

@router.get("/api/v1/notify/logs")
async def list_logs(status: str = "", channel: str = "", eventType: str = "", limit: int = Query(100),
                    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                    db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status=:s"
        params["s"] = status.upper()
    if channel:
        where += " AND channel=:c"
        params["c"] = channel.upper()
    if eventType:
        where += " AND eventType=:e"
        params["e"] = eventType.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM notification_logs WHERE {where} ORDER BY createdAt DESC LIMIT :l"),
        {**params, "l": min(limit, 300)})).fetchall())
    return ok(rows)


@router.post("/api/v1/notify/logs/{logId}/retry")
async def retry_log(logId: str, user: AuthUser = Depends(require_auth),
                    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM notification_logs WHERE id=:id AND tenantId=:t"),
                            {"id": logId, "t": tenantId})).first()
    if not row:
        return err("Log not found", 404)
    d = dict(row._mapping)
    if d["status"] in ("SENT",):
        return err("Already sent", 400)
    if d["channel"] not in ("EMAIL", "SMS", "WHATSAPP", "PUSH"):
        return err(f"Cannot retry {d['channel']}", 400)
    await db.execute(text(
        "UPDATE notification_logs SET status='PENDING', errorMsg=NULL, sentAt=NULL WHERE id=:id"),
        {"id": logId})
    await db.execute(text(
        "UPDATE notification_logs SET status='SENT', sentAt=NOW(), "
        "errorMsg=CONCAT('carrier=', :car) WHERE id=:id"),
        {"car": {"SMS": "sms-gateway", "EMAIL": "smtp", "WHATSAPP": "whatsapp-api", "PUSH": "fcm"}.get(d["channel"], "carrier"),
         "id": logId})
    await db.commit()
    return ok({"retried": True, "status": "SENT"})


# ══════════════════════ MANUAL SEND / TEST ══════════════════════

@router.post("/api/v1/notify/send")
async def manual_send(body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Manually fire an event for a customer (or test without one)."""
    event = (body.get("eventType") or "").upper().strip()
    customer_id = body.get("customerId")
    channels = [c.upper() for c in (body.get("channels") or [])]
    params = body.get("params") or {}
    if event not in EVENTS:
        return err(f"Unknown event {event}", 400)
    res = await dispatch(db, tenantId, event, customer_id=customer_id, user_id=user.id,
                         channels=channels or None, params=params,
                         name=body.get("name"), address=body.get("address"),
                         ref_type=body.get("refType"), ref_id=body.get("refId"))
    await db.commit()
    return ok(res)


@router.post("/api/v1/notify/check")
async def notify_check(user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Run the periodic scans (low stock, expiry, installments, quotations, offline)."""
    res = await run_scheduled_checks(db, tenantId, user.id)
    await db.commit()
    return ok(res)


# ══════════════════════ CUSTOMER CONSENT / OPT-OUT ══════════════════════

@router.get("/api/v1/customers/{customerId}/consents")
async def get_consents(customerId: str, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(text(
        "SELECT channel, status, updatedAt FROM customer_consents WHERE tenantId=:t AND customerId=:c"),
        {"t": tenantId, "c": customerId})).fetchall()
    out = {r[0]: {"channel": r[0], "status": r[1], "updatedAt": str(r[2])} for r in rows}
    for ch in ("SMS", "EMAIL", "WHATSAPP", "PUSH", "IN_APP"):
        if ch not in out:
            out[ch] = {"channel": ch, "status": "OPTED_IN", "updatedAt": None}
    return ok(out)


@router.put("/api/v1/customers/{customerId}/consents")
async def set_consent(customerId: str, body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    channel = (body.get("channel") or "").upper().strip()
    status = (body.get("status") or "").upper().strip()
    if channel not in CHANNELS:
        return err(f"Unknown channel {channel}", 400)
    if status not in ("OPTED_IN", "OPTED_OUT"):
        return err("status must be OPTED_IN or OPTED_OUT", 400)
    cust = (await db.execute(text("SELECT id FROM customers WHERE id=:c AND tenantId=:t"),
                             {"c": customerId, "t": tenantId})).first()
    if not cust:
        return err("Customer not found", 404)
    await db.execute(text(
        "INSERT INTO customer_consents (id, tenantId, customerId, channel, status, updatedBy) "
        "VALUES (:id, :t, :c, :ch, :s, :u) ON DUPLICATE KEY UPDATE status=:s2, updatedBy=:u2, updatedAt=NOW()"),
        {"id": _uid(), "t": tenantId, "c": customerId, "ch": channel, "s": status, "u": user.id,
         "s2": status, "u2": user.id})
    await db.commit()
    return ok({"customerId": customerId, "channel": channel, "status": status})
