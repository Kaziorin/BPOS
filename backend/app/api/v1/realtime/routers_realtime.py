"""Real-Time Engine (Prompt 35, §10.38).

WebSocket/SSE server for:
- KDS updates (KOT creation → kitchen display, status changes)
- Dashboard live feed (new orders, payments, alerts)
- Sync status updates
- Delivery tracking
- Inventory alerts

Architecture:
- SSE endpoint (simpler, no WS server needed): /api/v1/realtime/stream
- Event publishing: POST /api/v1/realtime/publish
- Channel subscription: GET /api/v1/realtime/channels
- Event history: GET /api/v1/realtime/events
"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Set

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

# ═══════════════ IN-MEMORY SSE CONNECTIONS ═══════════════
# In production, use Redis pub/sub for multi-instance scaling

class ConnectionManager:
    """Manages SSE connections per tenant/channel."""

    def __init__(self):
        self._connections: Dict[str, Set[asyncio.Queue]] = {}
        self._counts: Dict[str, int] = {}

    def _key(self, tenant_id: str, channel: str) -> str:
        return f"{tenant_id}:{channel}"

    def subscribe(self, tenant_id: str, channel: str) -> asyncio.Queue:
        key = self._key(tenant_id, channel)
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._connections.setdefault(key, set()).add(q)
        self._counts[key] = len(self._connections[key])
        return q

    def unsubscribe(self, tenant_id: str, channel: str, q: asyncio.Queue):
        key = self._key(tenant_id, channel)
        if key in self._connections:
            self._connections[key].discard(q)
            self._counts[key] = len(self._connections[key])

    async def publish(self, tenant_id: str, channel: str, event: dict):
        key = self._key(tenant_id, channel)
        queues = self._connections.get(key, set())
        for q in list(queues):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                pass  # Drop oldest

    def subscriber_count(self, tenant_id: str, channel: str) -> int:
        return self._counts.get(self._key(tenant_id, channel), 0)

    def all_stats(self) -> dict:
        return {k: v for k, v in self._counts.items() if v > 0}


manager = ConnectionManager()

CHANNEL_TYPES = ["KDS", "DASHBOARD", "SYNC", "DELIVERY", "INVENTORY", "POS"]


def _uid() -> str:
    return str(uuid.uuid4())


# ═══════════════ SSE STREAM ENDPOINT ═══════════════

@router.get("/api/v1/realtime/stream")
async def sse_stream(
    channel: str = "DASHBOARD",
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):
    """SSE stream for real-time updates. Client connects here for live events.

    Query params: channel (KDS|DASHBOARD|SYNC|DELIVERY|INVENTORY|POS)

    Usage from frontend:
      const es = new EventSource('/api/v1/realtime/stream?channel=KDS');
      es.onmessage = (e) => { const data = JSON.parse(e.data); ... };
    """
    # Extract tenant from query or header
    tenant_id = request.query_params.get("tenantId", "")
    if not tenant_id:
        tenant_id = request.headers.get("X-Tenant-Id", "default")

    queue = manager.subscribe(tenant_id, channel)

    async def event_generator():
        try:
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'channel': channel, 'timestamp': datetime.utcnow().isoformat()})}\n\n"

            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f": keepalive {datetime.utcnow().isoformat()}\n\n"
        finally:
            manager.unsubscribe(tenant_id, channel, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ═══════════════ PUBLISH EVENTS ═══════════════

@router.post("/api/v1/realtime/publish")
async def publish_event(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Publish a real-time event to a channel.

    Body: { channel: "KDS", eventType: "KOT_CREATED", payload: {...} }
    """
    channel = (body.get("channel") or "DASHBOARD").upper()
    event_type = body.get("eventType", "UNKNOWN")
    payload = body.get("payload", {})
    branch_id = body.get("branchId")

    if channel not in CHANNEL_TYPES:
        return err(f"channel must be one of: {CHANNEL_TYPES}", 400)

    event = {
        "type": event_type,
        "channel": channel,
        "payload": payload,
        "branchId": branch_id,
        "timestamp": datetime.utcnow().isoformat(),
        "id": _uid(),
    }

    # Store in DB
    await db.execute(text(
        "INSERT INTO realtime_events (id, tenantId, channelType, eventType, payload, branchId) "
        "VALUES (:id, :t, :ch, :et, :p, :b)"),
        {"id": event["id"], "t": tenantId, "ch": channel,
         "et": event_type, "p": json.dumps(payload), "b": branch_id})

    # Update channel stats
    channel_id = f"{tenantId}:{branch_id or 'all'}:{channel}"
    await db.execute(text(
        "INSERT INTO realtime_channels (id, tenantId, channelType, branchId, channelId, lastEventAt) "
        "VALUES (:id, :t, :ch, :b, :cid, NOW()) "
        "ON DUPLICATE KEY UPDATE lastEventAt=NOW()"),
        {"id": _uid(), "t": tenantId, "ch": channel, "b": branch_id, "cid": channel_id})
    await db.commit()

    # Publish to SSE subscribers
    await manager.publish(tenantId, channel, event)
    # Also publish to branch-specific channel if branch specified
    if branch_id:
        await manager.publish(tenantId, f"{channel}:{branch_id}", event)

    return ok({"published": True, "eventId": event["id"],
               "subscribers": manager.subscriber_count(tenantId, channel)})


# ═══════════════ KDS-SPECIFIC PUBLISH ═══════════════

@router.post("/api/v1/realtime/kot-created")
async def kot_created_event(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Called by restaurant module when a KOT is created — pushes to KDS displays."""
    event = {
        "type": "KOT_CREATED",
        "channel": "KDS",
        "payload": body,
        "timestamp": datetime.utcnow().isoformat(),
        "id": _uid(),
    }

    await db.execute(text(
        "INSERT INTO realtime_events (id, tenantId, channelType, eventType, payload, branchId) "
        "VALUES (:id, :t, 'KDS', 'KOT_CREATED', :p, :b)"),
        {"id": event["id"], "t": tenantId, "p": json.dumps(body),
         "b": body.get("branchId")})
    await db.commit()

    await manager.publish(tenantId, "KDS", event)
    if body.get("branchId"):
        await manager.publish(tenantId, f"KDS:{body['branchId']}", event)

    return ok({"published": True})


@router.post("/api/v1/realtime/kds-status")
async def kds_status_event(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Called when KDS status changes — pushes to all KDS + dashboard."""
    event = {
        "type": "KDS_STATUS_CHANGED",
        "channel": "KDS",
        "payload": body,
        "timestamp": datetime.utcnow().isoformat(),
        "id": _uid(),
    }

    await db.execute(text(
        "INSERT INTO realtime_events (id, tenantId, channelType, eventType, payload, branchId) "
        "VALUES (:id, :t, 'KDS', 'KDS_STATUS_CHANGED', :p, :b)"),
        {"id": event["id"], "t": tenantId, "p": json.dumps(body),
         "b": body.get("branchId")})
    await db.commit()

    await manager.publish(tenantId, "KDS", event)
    await manager.publish(tenantId, "DASHBOARD", event)

    return ok({"published": True})


@router.post("/api/v1/realtime/order-received")
async def order_received_event(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """New order received — pushes to dashboard + POS channels."""
    event = {
        "type": "ORDER_RECEIVED",
        "channel": "DASHBOARD",
        "payload": body,
        "timestamp": datetime.utcnow().isoformat(),
        "id": _uid(),
    }

    await db.execute(text(
        "INSERT INTO realtime_events (id, tenantId, channelType, eventType, payload, branchId) "
        "VALUES (:id, :t, 'DASHBOARD', 'ORDER_RECEIVED', :p, :b)"),
        {"id": event["id"], "t": tenantId, "p": json.dumps(body),
         "b": body.get("branchId")})
    await db.commit()

    await manager.publish(tenantId, "DASHBOARD", event)
    await manager.publish(tenantId, "POS", event)

    return ok({"published": True})


# ═══════════════ CHANNEL MANAGEMENT ═══════════════

@router.get("/api/v1/realtime/channels")
async def list_channels(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM realtime_channels WHERE tenantId=:t ORDER BY channelType"),
        {"t": tenantId})).fetchall())

    # Add live subscriber counts
    for r in rows:
        ch = r.get("channelType", "")
        branch = r.get("branchId", "")
        r["liveSubscribers"] = manager.subscriber_count(tenantId, ch)

    return ok(rows)


@router.get("/api/v1/realtime/events")
async def list_events(
    channelType: str = "",
    eventType: str = "",
    limit: int = 50,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId, "lim": min(limit, 200)}
    if channelType:
        where += " AND channelType=:ch"; params["ch"] = channelType.upper()
    if eventType:
        where += " AND eventType=:et"; params["et"] = eventType.upper()

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM realtime_events WHERE {where} ORDER BY createdAt DESC LIMIT :lim"),
        params)).fetchall())
    for r in rows:
        if isinstance(r.get("payload"), str):
            try: r["payload"] = json.loads(r["payload"])
            except: pass
    return ok(rows)


@router.get("/api/v1/realtime/stats")
async def realtime_stats(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    channels = (await db.execute(text(
        "SELECT COUNT(DISTINCT channelId) FROM realtime_channels WHERE tenantId=:t"),
        {"t": tenantId})).first()[0]
    events_today = (await db.execute(text(
        "SELECT COUNT(*) FROM realtime_events WHERE tenantId=:t AND DATE(createdAt) = CURDATE()"),
        {"t": tenantId})).first()[0]
    total_events = (await db.execute(text(
        "SELECT COUNT(*) FROM realtime_events WHERE tenantId=:t"),
        {"t": tenantId})).first()[0]

    return ok({
        "activeChannels": channels,
        "eventsToday": events_today,
        "totalEvents": total_events,
        "liveConnections": manager.all_stats(),
    })
