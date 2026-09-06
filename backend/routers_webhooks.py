"""Webhook System (Prompt 34, §19).

- Webhook subscriptions (CRUD, per-tenant)
- Event firing with signature, retry, idempotency
- Event logs with delivery monitoring
- Supported events: invoice.created, invoice.paid, order.created, order.completed,
  payment.received, stock.low, customer.created, installment.due,
  commission.generated, sync.failed, delivery.completed
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from jobs import enqueue_and_run  # Prompt 39: delivery now runs through the job queue
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

SUPPORTED_EVENTS = [
    "invoice.created", "invoice.paid",
    "order.created", "order.completed",
    "payment.received", "stock.low",
    "customer.created", "installment.due",
    "commission.generated", "sync.failed",
    "delivery.completed",
]


def _uid() -> str:
    return str(uuid.uuid4())


def _generate_key() -> str:
    """Generate a webhook signing secret."""
    return hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:48]


def _sign_payload(payload: str, secret: str) -> str:
    """HMAC-SHA256 signature for webhook payload."""
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


async def _deliver_event(event: dict, sub: dict, db: AsyncSession):
    """Attempt to deliver a webhook event."""
    event_id = event["id"]
    url = sub["url"]
    secret = sub.get("secret", "")
    payload_str = event.get("payload", "{}")
    raw_payload = payload_str if isinstance(payload_str, str) else json.dumps(payload_str)

    signature = _sign_payload(raw_payload, secret) if secret else ""
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event.get("eventType", ""),
        "X-Webhook-Id": event_id,
    }

    log_id = _uid()
    status = "FAILED"
    response_status = None
    error_msg = None
    duration_ms = 0

    try:
        start = time.time()
        req = urllib.request.Request(url, data=raw_payload.encode(), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=sub.get("timeoutMs", 5000) / 1000) as resp:
            response_status = resp.status
            status = "SUCCESS" if 200 <= resp.status < 300 else "FAILED"
        duration_ms = int((time.time() - start) * 1000)
    except Exception as e:
        error_msg = str(e)[:500]
        status = "FAILED"

    await db.execute(text(
        "INSERT INTO webhook_logs (id, tenantId, eventId, subscriptionId, attempt, "
        "requestUrl, requestBody, responseStatus, durationMs, status, errorMsg) "
        "VALUES (:id, :t, :ev, :sub, :att, :url, :body, :rs, :dur, :st, :err)"),
        {"id": log_id, "t": event.get("tenantId"), "ev": event_id,
         "sub": sub["id"], "att": event.get("attemptCount", 1) + 1,
         "url": url, "body": raw_payload[:10000], "rs": response_status,
         "dur": duration_ms, "st": status, "err": error_msg})

    new_attempt = event.get("attemptCount", 0) + 1
    max_attempts = event.get("maxAttempts", 3)

    if status == "SUCCESS":
        await db.execute(text(
            "UPDATE webhook_events SET status='SUCCESS', attemptCount=:a, lastAttemptAt=NOW(), "
            "updatedAt=NOW() WHERE id=:id"), {"a": new_attempt, "id": event_id})
    elif new_attempt >= max_attempts:
        await db.execute(text(
            "UPDATE webhook_events SET status='FAILED', attemptCount=:a, lastAttemptAt=NOW(), "
            "lastError=:err, updatedAt=NOW() WHERE id=:id"),
            {"a": new_attempt, "err": error_msg, "id": event_id})
    else:
        backoff = min(300, 2 ** new_attempt * 10)
        await db.execute(text(
            "UPDATE webhook_events SET status='RETRYING', attemptCount=:a, lastAttemptAt=NOW(), "
            "lastError=:err, nextRetryAt=DATE_ADD(NOW(), INTERVAL :sec SECOND), updatedAt=NOW() "
            "WHERE id=:id"), {"a": new_attempt, "err": error_msg, "sec": backoff, "id": event_id})

    await db.commit()


async def deliver_event_by_id(db: AsyncSession, event_id: str, tenant_id: str) -> dict:
    """Job handler entry point — deliver one webhook event (idempotent).

    Called by the background worker (jobs.py) and by fire/retry via the queue.
    Already-successful events are skipped; exhausted events stay FAILED.
    """
    ev = (await db.execute(text(
        "SELECT * FROM webhook_events WHERE id=:id AND tenantId=:t"),
        {"id": event_id, "t": tenant_id})).first()
    if not ev:
        raise ValueError(f"webhook event {event_id} not found")
    ev_data = dict(ev._mapping) if hasattr(ev, '_mapping') else dict(ev)
    if ev_data.get("status") == "SUCCESS":
        return {"eventId": event_id, "status": "SUCCESS", "delivered": False, "reason": "already-delivered"}
    if ev_data.get("attemptCount", 0) >= ev_data.get("maxAttempts", 3):
        return {"eventId": event_id, "status": "FAILED", "delivered": False, "reason": "max-attempts-exhausted"}
    sub = (await db.execute(text(
        "SELECT * FROM webhook_subscriptions WHERE id=:id AND tenantId=:t"),
        {"id": ev_data["subscriptionId"], "t": tenant_id})).first()
    if not sub:
        await db.execute(text(
            "UPDATE webhook_events SET status='FAILED', lastError='subscription deleted', "
            "updatedAt=NOW() WHERE id=:id"), {"id": event_id})
        await db.commit()
        return {"eventId": event_id, "status": "FAILED", "delivered": False, "reason": "subscription-missing"}
    sub_data = dict(sub._mapping) if hasattr(sub, '_mapping') else dict(sub)
    await _deliver_event(ev_data, sub_data, db)  # writes log + finalizes status, commits
    return {"eventId": event_id, "delivered": True}


# ════════════════════════════════════════════════════════════════
# FIXED ROUTES FIRST (before {subscriptionId} parameterized routes)
# ════════════════════════════════════════════════════════════════

@router.get("/api/v1/webhooks/events/supported")
async def supported_events():
    return ok(SUPPORTED_EVENTS)


@router.get("/api/v1/webhooks/stats")
async def webhook_stats(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(text(
        "SELECT COUNT(*) FROM webhook_events WHERE tenantId=:t"), {"t": tenantId})).first()[0]
    success = (await db.execute(text(
        "SELECT COUNT(*) FROM webhook_events WHERE tenantId=:t AND status='SUCCESS'"),
        {"t": tenantId})).first()[0]
    failed = (await db.execute(text(
        "SELECT COUNT(*) FROM webhook_events WHERE tenantId=:t AND status='FAILED'"),
        {"t": tenantId})).first()[0]
    pending = (await db.execute(text(
        "SELECT COUNT(*) FROM webhook_events WHERE tenantId=:t AND status IN ('PENDING','RETRYING')"),
        {"t": tenantId})).first()[0]
    subs = (await db.execute(text(
        "SELECT COUNT(*) FROM webhook_subscriptions WHERE tenantId=:t AND isActive=1"),
        {"t": tenantId})).first()[0]
    return ok({
        "totalEvents": total, "success": success, "failed": failed,
        "pending": pending, "activeSubscriptions": subs,
        "successRate": round(success / total * 100, 1) if total > 0 else 0,
    })


@router.get("/api/v1/webhooks/events")
async def list_events(
    status: str = "",
    eventType: str = "",
    subscriptionId: str = "",
    limit: int = 50,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "we.tenantId=:t"
    params: dict = {"t": tenantId, "lim": min(limit, 200)}
    if status:
        where += " AND we.status=:s"; params["s"] = status.upper()
    if eventType:
        where += " AND we.eventType=:et"; params["et"] = eventType
    if subscriptionId:
        where += " AND we.subscriptionId=:sub"; params["sub"] = subscriptionId

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT we.*, ws.url AS subscriptionUrl FROM webhook_events we "
        f"LEFT JOIN webhook_subscriptions ws ON ws.id=we.subscriptionId "
        f"WHERE {where} ORDER BY we.createdAt DESC LIMIT :lim"), params)).fetchall())
    for r in rows:
        if isinstance(r.get("payload"), str):
            try: r["payload"] = json.loads(r["payload"])
            except: pass
    return ok(rows)


@router.post("/api/v1/webhooks/fire")
async def fire_event(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    event_type = body.get("eventType", "")
    payload = body.get("payload", {})
    idempotency_key = body.get("idempotencyKey")

    if event_type not in SUPPORTED_EVENTS:
        return err(f"Invalid event type. Supported: {SUPPORTED_EVENTS}", 400)

    subs = rows_to_dicts((await db.execute(text(
        "SELECT * FROM webhook_subscriptions WHERE tenantId=:t AND isActive=1"),
        {"t": tenantId})).fetchall())

    matched = []
    for sub in subs:
        events = sub.get("events", [])
        if isinstance(events, str):
            try: events = json.loads(events)
            except: events = []
        if event_type in events:
            matched.append(sub)

    if not matched:
        return ok({"fired": 0, "message": "No matching subscriptions"})

    fired_count = 0
    created_event_ids: list[str] = []
    for sub in matched:
        event_id = _uid()
        idem_key = idempotency_key or f"{event_type}:{event_id}"

        if idempotency_key:
            existing = (await db.execute(text(
                "SELECT id FROM webhook_events WHERE tenantId=:t AND idempotencyKey=:ik"),
                {"t": tenantId, "ik": idempotency_key})).first()
            if existing:
                continue

        await db.execute(text(
            "INSERT INTO webhook_events (id, tenantId, subscriptionId, eventType, payload, "
            "status, maxAttempts, idempotencyKey, nextRetryAt) "
            "VALUES (:id, :t, :sub, :et, :payload, 'PENDING', :max, :ik, NOW())"),
            {"id": event_id, "t": tenantId, "sub": sub["id"],
             "et": event_type, "payload": json.dumps(payload),
             "max": sub.get("retryCount", 3), "ik": idem_key})
        fired_count += 1
        created_event_ids.append(event_id)

    await db.commit()

    # Prompt 39: delivery is now a background job. Each event is enqueued and
    # executed inline through the *same* handler the worker uses — the queue
    # row is the single source of truth, retries are automatic, and the POS
    # request path never blocks on slow receivers.
    for event_id in created_event_ids:
        await enqueue_and_run(db, tenantId, "webhook_deliver", {"eventId": event_id},
                              priority=3, created_by=user.id)

    return ok({"fired": fired_count, "subscriptions": len(matched),
               "queued": len(created_event_ids)})


# ════════════════════════════════════════════════════════════════
# PARAMETERIZED SUBSCRIPTION ROUTES (after fixed routes)
# ════════════════════════════════════════════════════════════════

@router.get("/api/v1/webhooks")
async def list_subscriptions(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM webhook_subscriptions WHERE tenantId=:t ORDER BY createdAt DESC"),
        {"t": tenantId})).fetchall())
    for r in rows:
        if isinstance(r.get("events"), str):
            try: r["events"] = json.loads(r["events"])
            except: pass
    return ok(rows)


@router.post("/api/v1/webhooks")
async def create_subscription(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    url = body.get("url", "")
    events = body.get("events", [])
    if not url or not events:
        return err("url and events required", 400)

    invalid = [e for e in events if e not in SUPPORTED_EVENTS]
    if invalid:
        return err(f"Invalid events: {invalid}. Supported: {SUPPORTED_EVENTS}", 400)

    sid = _uid()
    secret = body.get("secret") or _generate_key()
    await db.execute(text(
        "INSERT INTO webhook_subscriptions (id, tenantId, url, events, secret, isActive, retryCount, timeoutMs, description) "
        "VALUES (:id, :t, :url, :events, :secret, :active, :retry, :timeout, :desc)"),
        {"id": sid, "t": tenantId, "url": url, "events": json.dumps(events),
         "secret": secret, "active": 1 if body.get("isActive", True) else 0,
         "retry": body.get("retryCount", 3), "timeout": body.get("timeoutMs", 5000),
         "desc": body.get("description")})
    await db.commit()
    return ok({"id": sid, "secret": secret, "message": "Save the secret — it won't be shown again"}, 201)


@router.get("/api/v1/webhooks/{subscriptionId}")
async def get_subscription(
    subscriptionId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT * FROM webhook_subscriptions WHERE id=:id AND tenantId=:t"),
        {"id": subscriptionId, "t": tenantId})).first()
    if not row:
        return err("Subscription not found", 404)
    data = dict(row._mapping) if hasattr(row, '_mapping') else dict(row)
    if isinstance(data.get("events"), str):
        try: data["events"] = json.loads(data["events"])
        except: pass
    data.pop("secret", None)
    return ok(data)


@router.patch("/api/v1/webhooks/{subscriptionId}")
async def update_subscription(
    subscriptionId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": subscriptionId, "t": tenantId}
    if "url" in body:
        fields.append("url=:url"); params["url"] = body["url"]
    if "events" in body:
        fields.append("events=:events"); params["events"] = json.dumps(body["events"])
    if "isActive" in body:
        fields.append("isActive=:active"); params["active"] = 1 if body["isActive"] else 0
    if "retryCount" in body:
        fields.append("retryCount=:retry"); params["retry"] = body["retryCount"]
    if "timeoutMs" in body:
        fields.append("timeoutMs=:timeout"); params["timeout"] = body["timeoutMs"]
    if "description" in body:
        fields.append("description=:desc"); params["desc"] = body["description"]
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    res = await db.execute(text(
        f"UPDATE webhook_subscriptions SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    if res.rowcount == 0:
        return err("Subscription not found", 404)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/webhooks/{subscriptionId}")
async def delete_subscription(
    subscriptionId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "DELETE FROM webhook_subscriptions WHERE id=:id AND tenantId=:t"),
        {"id": subscriptionId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


@router.get("/api/v1/webhooks/events/{eventId}/logs")
async def event_logs(
    eventId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM webhook_logs WHERE eventId=:e AND tenantId=:t ORDER BY attempt"),
        {"e": eventId, "t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/webhooks/retry/{eventId}")
async def retry_event(
    eventId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    event = (await db.execute(text(
        "SELECT * FROM webhook_events WHERE id=:id AND tenantId=:t"),
        {"id": eventId, "t": tenantId})).first()
    if not event:
        return err("Event not found", 404)

    ev_data = dict(event._mapping) if hasattr(event, '_mapping') else dict(event)
    sub = (await db.execute(text(
        "SELECT * FROM webhook_subscriptions WHERE id=:id AND tenantId=:t"),
        {"id": ev_data["subscriptionId"], "t": tenantId})).first()
    if not sub:
        return err("Subscription not found", 404)

    sub_data = dict(sub._mapping) if hasattr(sub, '_mapping') else dict(sub)

    await db.execute(text(
        "UPDATE webhook_events SET status='PENDING', nextRetryAt=NOW() WHERE id=:id"),
        {"id": eventId})
    await db.commit()

    # Prompt 39: retry goes through the job queue (worker owns delivery).
    await enqueue_and_run(db, tenantId, "webhook_deliver", {"eventId": eventId},
                          priority=3, created_by=user.id)
    return ok({"retried": True})
