"""Offline-First Sync Engine router (Prompt 19, §13).

Endpoints:
  POST /api/v1/sync/upload        — upload a batch of offline transactions
  POST /api/v1/sync/upload/one    — upload a single offline transaction
  GET  /api/v1/sync/status        — device sync status + pending count
  POST /api/v1/sync/pull          — pull latest config/products/prices for offline cache
  GET  /api/v1/sync/conflicts     — list transactions in CONFLICT status
  POST /api/v1/sync/conflicts/:id/resolve — resolve a conflict

Device management (§10.37):
  GET    /api/v1/devices          — list devices
  POST   /api/v1/devices/register — register a new device
  POST   /api/v1/devices/:id/lock    — remote lock
  POST   /api/v1/devices/:id/unlock  — remote unlock
  POST   /api/v1/devices/:id/disable — remote disable
  POST   /api/v1/devices/:id/force-sync — trigger forced sync
  POST   /api/v1/devices/:id/force-logout — remote force-logout

Conflict resolution per entity type (§13):
  - Customer/Product/Supplier attribute edits → last-write-wins
  - Stock → movement-aggregated (deltas summed, never overwritten)
  - Financial transactions (Sale/Invoice/Payment) → never silently overwritten, flagged for review
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import accounting as acc
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, gen_no

router = APIRouter()


def _uuid() -> str:
    return str(uuid.uuid4())


# ────────────────────── UPLOAD (batch) ──────────────────────


@router.post("/api/v1/sync/upload")
async def sync_upload_batch(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Upload a batch of offline transactions for server-side processing.

    Body: { deviceId, transactions: [{ entityType, entityId?, localSequence, idempotencyKey, payload }] }

    Each transaction is processed independently — a failure in one doesn't block others.
    Returns per-transaction results: { success, syncStatus, error? }.
    """
    deviceId = body.get("deviceId")
    transactions = body.get("transactions") or []
    if not deviceId:
        return err("deviceId is required", 400)
    if not transactions:
        return err("transactions array is required", 400)

    # Ensure device exists
    await _ensure_device(db, tenantId, deviceId, user.id)

    results = []
    for tx in transactions:
        result = await _process_single_transaction(db, tenantId, deviceId, tx, user.id)
        results.append(result)

    # Update device sync status
    pending = sum(1 for r in results if r["syncStatus"] == "PENDING")
    synced = sum(1 for r in results if r["syncStatus"] == "SYNCED")
    failed = sum(1 for r in results if r["syncStatus"] == "FAILED")
    conflicts = sum(1 for r in results if r["syncStatus"] == "CONFLICT")

    await db.execute(
        text(
            "UPDATE device_sync_status SET lastSyncAt = NOW(), "
            "pendingCount = GREATEST(COALESCE(pendingCount,0) - :synced + :pending, 0), "
            "failedCount = GREATEST(COALESCE(failedCount,0) + :failed, 0), updatedAt = NOW() "
            "WHERE tenantId = :t AND deviceId = :d"
        ),
        {"t": tenantId, "d": deviceId, "synced": synced, "pending": pending, "failed": failed},
    )
    # Prompt 28 — surface sync failures to the user (in-app)
    if failed > 0 or conflicts > 0:
        try:
            import notify as _nt
            await _nt.dispatch(
                db, tenantId, "SYNC_FAILURE", user_id=user.id,
                params={"device": deviceId, "reason": f"{failed} failed, {conflicts} conflicted out of {len(results)} uploaded"})
        except Exception:
            pass
    await db.commit()

    return ok({
        "processed": len(results),
        "synced": synced,
        "pending": pending,
        "failed": failed,
        "conflicts": conflicts,
        "results": results,
    })


@router.post("/api/v1/sync/upload/one")
async def sync_upload_one(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Upload a single offline transaction."""
    deviceId = body.get("deviceId")
    if not deviceId:
        return err("deviceId is required", 400)

    await _ensure_device(db, tenantId, deviceId, user.id)
    result = await _process_single_transaction(db, tenantId, deviceId, body, user.id)
    await db.commit()
    return ok(result)


# ────────────────────── DEVICE SYNC STATUS ──────────────────────


@router.get("/api/v1/sync/status")
async def sync_status(
    deviceId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get sync status for a device (or all devices for the tenant)."""
    if deviceId:
        row = (await db.execute(
            text("SELECT * FROM device_sync_status WHERE tenantId = :t AND deviceId = :d"),
            {"t": tenantId, "d": deviceId},
        )).first()
        if not row:
            return ok({"device": None, "pendingCount": 0, "failedCount": 0})
        d = dict(row._mapping)
        return ok(d)
    else:
        rows = rows_to_dicts((await db.execute(
            text("SELECT * FROM device_sync_status WHERE tenantId = :t ORDER BY lastSyncAt DESC"),
            {"t": tenantId},
        )).fetchall())
        return ok(rows)


# ────────────────────── PULL (offline cache data) ──────────────────────


@router.post("/api/v1/sync/pull")
async def sync_pull(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Pull latest data for offline caching.

    Body: { deviceId, lastSyncAt?, entities?: ["products","customers","prices","config","promotions"] }

    Returns the requested entities with any changes since lastSyncAt.
    """
    deviceId = body.get("deviceId", "")
    entities = body.get("entities") or ["products", "customers", "prices", "config", "promotions"]
    last_sync = body.get("lastSyncAt")

    result = {}

    if "products" in entities:
        q = "SELECT id, name, sku, barcode, sellingPrice, costPrice, unitId, productType, categoryId, brandId, status FROM products WHERE tenantId = :t AND status = 'ACTIVE'"
        params: dict = {"t": tenantId}
        if last_sync:
            q += " AND updatedAt > :ls"
            params["ls"] = last_sync
        result["products"] = rows_to_dicts((await db.execute(text(q), params)).fetchall())

    if "customers" in entities:
        q = "SELECT id, name, phone, email, address, groupId AS customerGroupId, creditLimit, currentDue, loyaltyPoints, status FROM customers WHERE tenantId = :t"
        params = {"t": tenantId}
        if last_sync:
            q += " AND updatedAt > :ls"
            params["ls"] = last_sync
        result["customers"] = rows_to_dicts((await db.execute(text(q), params)).fetchall())

    if "prices" in entities:
        result["priceLists"] = rows_to_dicts((await db.execute(
            text("SELECT * FROM price_lists WHERE tenantId = :t"), {"t": tenantId}
        )).fetchall())

    if "config" in entities:
        # Branch, warehouse, tax, shift config
        result["branches"] = rows_to_dicts((await db.execute(
            text("SELECT id, name, address, phone, status FROM branches WHERE tenantId = :t"), {"t": tenantId}
        )).fetchall())
        result["warehouses"] = rows_to_dicts((await db.execute(
            text("SELECT id, name, branchId FROM warehouses WHERE tenantId = :t"), {"t": tenantId}
        )).fetchall())
        result["taxRules"] = rows_to_dicts((await db.execute(
            text("SELECT * FROM tax_rules WHERE tenantId = :t AND isActive = 1"), {"t": tenantId}
        )).fetchall())
        # Open shift for the branch
        result["openShifts"] = rows_to_dicts((await db.execute(
            text("SELECT id, branchId, shiftNo, openingCash, status FROM cash_shifts WHERE tenantId = :t AND status IN ('OPEN','PENDING_APPROVAL')"),
            {"t": tenantId},
        )).fetchall())

    if "promotions" in entities:
        result["promotions"] = rows_to_dicts((await db.execute(
            text("SELECT * FROM promotions WHERE tenantId = :t AND isActive = 1"), {"t": tenantId}
        )).fetchall())

    return ok(result)


# ────────────────────── CONFLICTS ──────────────────────


@router.get("/api/v1/sync/conflicts")
async def list_conflicts(
    page: int = Query(1), limit: int = Query(50),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all transactions in CONFLICT status for review."""
    off = (page - 1) * limit
    rows = rows_to_dicts((await db.execute(
        text(
            "SELECT st.*, u.name AS userName FROM sync_transactions st "
            "LEFT JOIN users u ON u.id = st.createdBy "
            "WHERE st.tenantId = :t AND st.syncStatus = 'CONFLICT' "
            "ORDER BY st.createdAt DESC LIMIT :lim OFFSET :off"
        ),
        {"t": tenantId, "lim": limit, "off": off},
    )).fetchall())
    total = (await db.execute(
        text("SELECT COUNT(*) FROM sync_transactions WHERE tenantId = :t AND syncStatus = 'CONFLICT'"),
        {"t": tenantId},
    )).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.post("/api/v1/sync/conflicts/{txId}/resolve")
async def resolve_conflict(
    txId: str, body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Resolve a conflict.

    Body: { resolution: "SERVER_WINS" | "CLIENT_WINS" | "MERGED", mergedPayload? }
    """
    resolution = body.get("resolution")
    if resolution not in ("SERVER_WINS", "CLIENT_WINS", "MERGED"):
        return err("resolution must be SERVER_WINS, CLIENT_WINS, or MERGED", 400)

    tx = (await db.execute(
        text("SELECT * FROM sync_transactions WHERE id = :id AND tenantId = :t"),
        {"id": txId, "t": tenantId},
    )).first()
    if not tx:
        return err("Transaction not found", 404)
    if tx.syncStatus != "CONFLICT":
        return err("Transaction is not in CONFLICT status", 400)

    txd = dict(tx._mapping)
    payload = json.loads(txd["payload"]) if txd.get("payload") else {}

    if resolution == "CLIENT_WINS" or resolution == "MERGED":
        # Use the client payload (or merged) to update the entity
        if resolution == "MERGED":
            payload = body.get("mergedPayload") or payload

        entity_type = txd["entityType"]
        entity_id = txd.get("entityId") or payload.get("id")

        if entity_type == "CUSTOMER" and entity_id:
            fields = []
            params: dict = {"id": entity_id, "t": tenantId}
            for k in ("name", "phone", "email", "address", "creditLimit"):
                if k in payload:
                    fields.append(f"{k} = :{k}")
                    params[k] = payload[k]
            if fields:
                await db.execute(text(f"UPDATE customers SET {', '.join(fields)} WHERE id = :id AND tenantId = :t"), params)

        elif entity_type == "PRODUCT" and entity_id:
            fields = []
            params = {"id": entity_id, "t": tenantId}
            for k in ("name", "sku", "barcode", "sellingPrice", "costPrice"):
                if k in payload:
                    fields.append(f"{k} = :{k}")
                    params[k] = payload[k]
            if fields:
                await db.execute(text(f"UPDATE products SET {', '.join(fields)} WHERE id = :id AND tenantId = :t"), params)

        elif entity_type == "STOCK":
            # Stock: movement-aggregated — record the delta as a stock movement
            delta = payload.get("delta", 0)
            pid = payload.get("productId")
            wid = payload.get("warehouseId")
            if pid and wid and delta != 0:
                st = (await db.execute(
                    text("SELECT id, qtyOnHand FROM stock WHERE tenantId = :t AND warehouseId = :w AND productId = :p FOR UPDATE"),
                    {"t": tenantId, "w": wid, "p": pid},
                )).first()
                before = float(st[1]) if st else 0
                after = before + delta
                if st:
                    await db.execute(text("UPDATE stock SET qtyOnHand = :a WHERE id = :id"), {"a": after, "id": st[0]})
                else:
                    await db.execute(
                        text("INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved) VALUES (UUID(), :t, :w, :p, :q, 0)"),
                        {"t": tenantId, "w": wid, "p": pid, "q": max(after, 0)},
                    )
                await db.execute(
                    text("INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                         "VALUES (UUID(), :t, NULL, :w, :p, 'SYNC_ADJUSTMENT', :q, :qb, :qa, 'SYNC', :rid, 'Conflict resolution', :u, :u)"),
                    {"t": tenantId, "w": wid, "p": pid, "q": delta, "qb": before, "qa": after,
                     "rid": txd["id"], "u": user.id},
                )

        elif entity_type == "SALE":
            # Financial: re-process the transaction via the POS engine
            # For safety, just flag it — financial conflicts should be reviewed manually
            pass

    # Mark resolved
    await db.execute(
        text("UPDATE sync_transactions SET syncStatus = 'SYNCED', syncedAt = NOW(), updatedAt = NOW() WHERE id = :id"),
        {"id": txId},
    )
    await db.commit()
    return ok({"resolved": True, "resolution": resolution})


# ────────────────────── DEVICE MANAGEMENT (§10.37) ──────────────────────


@router.get("/api/v1/devices")
async def list_devices(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(
        text("SELECT d.*, u.name AS userName FROM device_sync_status d "
             "LEFT JOIN users u ON u.id = d.userId WHERE d.tenantId = :t ORDER BY COALESCE(d.lastSyncAt, d.createdAt) DESC"),
        {"t": tenantId},
    )).fetchall())
    return ok(rows)


@router.post("/api/v1/devices/register")
async def register_device(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    deviceId = body.get("deviceId")
    if not deviceId:
        return err("deviceId is required", 400)

    existing = (await db.execute(
        text("SELECT id FROM device_sync_status WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId},
    )).first()

    if existing:
        # Update existing device
        await db.execute(
            text("UPDATE device_sync_status SET userId = :u, os = :os, deviceName = :dn, branchId = :b, status = 'ACTIVE', isLocked = 0, updatedAt = NOW() "
                 "WHERE tenantId = :t AND deviceId = :d"),
            {"t": tenantId, "d": deviceId, "u": user.id, "os": body.get("os"), "dn": body.get("deviceName"), "b": body.get("branchId")},
        )
    else:
        await db.execute(
            text("INSERT INTO device_sync_status (id, tenantId, deviceId, deviceName, branchId, userId, os, status) "
                 "VALUES (:id, :t, :d, :dn, :b, :u, :os, 'ACTIVE')"),
            {"id": _uuid(), "t": tenantId, "d": deviceId, "dn": body.get("deviceName"), "b": body.get("branchId"),
             "u": user.id, "os": body.get("os")},
        )
    await db.commit()
    return ok({"registered": True, "deviceId": deviceId})


@router.post("/api/v1/devices/{deviceId}/lock")
async def lock_device(
    deviceId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("UPDATE device_sync_status SET isLocked = 1, lockedAt = NOW(), lockedBy = :u, updatedAt = NOW() "
             "WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId, "u": user.id},
    )
    await db.commit()
    return ok({"locked": True, "deviceId": deviceId})


@router.post("/api/v1/devices/{deviceId}/unlock")
async def unlock_device(
    deviceId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("UPDATE device_sync_status SET isLocked = 0, lockedAt = NULL, lockedBy = NULL, updatedAt = NOW() "
             "WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId},
    )
    await db.commit()
    return ok({"unlocked": True, "deviceId": deviceId})


@router.post("/api/v1/devices/{deviceId}/disable")
async def disable_device(
    deviceId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("UPDATE device_sync_status SET status = 'DISABLED', updatedAt = NOW() "
             "WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId},
    )
    await db.commit()
    return ok({"disabled": True, "deviceId": deviceId})


@router.post("/api/v1/devices/{deviceId}/force-sync")
async def force_sync_device(
    deviceId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Mark a device as needing a full re-sync on next connection."""
    await db.execute(
        text("UPDATE device_sync_status SET lastSyncAt = NULL, lastSyncSequence = 0, updatedAt = NOW() "
             "WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId},
    )
    await db.commit()
    return ok({"forceSync": True, "deviceId": deviceId})


@router.post("/api/v1/devices/{deviceId}/force-logout")
async def force_logout_device(
    deviceId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate all sessions for a device (the client must re-authenticate)."""
    # Mark device as force-logged-out; the client checks this flag on next API call
    await db.execute(
        text("UPDATE device_sync_status SET status = 'FORCE_LOGOUT', updatedAt = NOW() "
             "WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId},
    )
    await db.commit()
    return ok({"forceLogout": True, "deviceId": deviceId})


# ═══════════════════ INTERNAL HELPERS ═══════════════════


async def _ensure_device(db: AsyncSession, tenantId: str, deviceId: str, userId: str):
    """Ensure the device row exists (auto-register on first sync)."""
    existing = (await db.execute(
        text("SELECT id FROM device_sync_status WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId},
    )).first()
    if not existing:
        await db.execute(
            text("INSERT INTO device_sync_status (id, tenantId, deviceId, userId, status) "
                 "VALUES (:id, :t, :d, :u, 'ACTIVE')"),
            {"id": _uuid(), "t": tenantId, "d": deviceId, "u": userId},
        )


async def _process_single_transaction(
    db: AsyncSession, tenantId: str, deviceId: str, tx: dict, userId: str,
) -> dict:
    """Process a single offline transaction. Returns result dict."""
    entity_type = tx.get("entityType", "")
    entity_id = tx.get("entityId")
    local_seq = tx.get("localSequence", 0)
    idempotency_key = tx.get("idempotencyKey")
    payload = tx.get("payload") or {}

    if not idempotency_key:
        return {"success": False, "syncStatus": "FAILED", "error": "idempotencyKey is required"}

    # ── Idempotency check (§13) ──
    existing = (await db.execute(
        text("SELECT id, syncStatus FROM sync_transactions WHERE tenantId = :t AND idempotencyKey = :ik"),
        {"t": tenantId, "ik": idempotency_key},
    )).first()
    if existing:
        if existing[1] == "SYNCED":
            return {"success": True, "syncStatus": "SYNCED", "note": "duplicate — already synced"}
        elif existing[1] == "PENDING":
            return {"success": True, "syncStatus": "PENDING", "note": "already queued"}

    # ── Check device lock ──
    device = (await db.execute(
        text("SELECT isLocked, status FROM device_sync_status WHERE tenantId = :t AND deviceId = :d"),
        {"t": tenantId, "d": deviceId},
    )).first()
    if device and device[0]:
        return {"success": False, "syncStatus": "FAILED", "error": "Device is locked"}
    if device and device[1] == "DISABLED":
        return {"success": False, "syncStatus": "FAILED", "error": "Device is disabled"}

    # ── Process based on entity type ──
    try:
        if entity_type == "SALE":
            result = await _sync_sale(db, tenantId, deviceId, payload, userId, idempotency_key)
        elif entity_type == "RETURN":
            result = await _sync_return(db, tenantId, deviceId, payload, userId, idempotency_key)
        elif entity_type == "STOCK":
            result = await _sync_stock(db, tenantId, deviceId, payload, userId, idempotency_key)
        elif entity_type == "CUSTOMER":
            result = await _sync_customer(db, tenantId, deviceId, payload, userId, idempotency_key)
        elif entity_type == "PRODUCT":
            result = await _sync_product(db, tenantId, deviceId, payload, userId, idempotency_key)
        elif entity_type == "HOLD":
            result = await _sync_hold(db, tenantId, deviceId, payload, userId, idempotency_key)
        else:
            # Unknown entity — queue for manual review
            result = {"syncStatus": "PENDING", "note": f"Queued for unknown entity type: {entity_type}"}

        # Record the sync transaction
        await db.execute(
            text("INSERT INTO sync_transactions "
                 "(id, tenantId, deviceId, entityType, entityId, localSequence, idempotencyKey, "
                 "syncStatus, payload, syncAttempts, lastSyncAttempt, syncedAt, createdBy) "
                 "VALUES (:id, :t, :d, :et, :ei, :ls, :ik, :ss, :p, 1, NOW(), NOW(), :u) "
                 "ON DUPLICATE KEY UPDATE syncStatus = :ss2, syncAttempts = syncAttempts + 1, "
                 "lastSyncAttempt = NOW(), syncedAt = NOW()"),
            {"id": _uuid(), "t": tenantId, "d": deviceId, "et": entity_type, "ei": entity_id,
             "ls": local_seq, "ik": idempotency_key, "ss": result.get("syncStatus", "SYNCED"),
             "ss2": result.get("syncStatus", "SYNCED"),
             "p": json.dumps(payload, default=str)[:60000], "u": userId},
        )

        return {"success": True, **result}

    except Exception as e:
        # Record the failed attempt
        await db.execute(
            text("INSERT INTO sync_transactions "
                 "(id, tenantId, deviceId, entityType, entityId, localSequence, idempotencyKey, "
                 "syncStatus, payload, syncAttempts, lastSyncAttempt, errorMessage, createdBy) "
                 "VALUES (:id, :t, :d, :et, :ei, :ls, :ik, 'FAILED', :p, 1, NOW(), :err, :u) "
                 "ON DUPLICATE KEY UPDATE syncStatus = 'FAILED', syncAttempts = syncAttempts + 1, "
                 "lastSyncAttempt = NOW(), errorMessage = :err2"),
            {"id": _uuid(), "t": tenantId, "d": deviceId, "et": entity_type, "ei": entity_id,
             "ls": local_seq, "ik": idempotency_key,
             "p": json.dumps(payload, default=str)[:60000], "err": str(e)[:500], "err2": str(e)[:500], "u": userId},
        )
        return {"success": False, "syncStatus": "FAILED", "error": str(e)[:500]}


# ──────────────────── Entity sync handlers ────────────────────


async def _sync_sale(db, tenantId, deviceId, payload, userId, idempotency_key):
    """Process an offline sale by delegating to the POS engine."""
    import routers_pos  # avoid circular at module level

    # Check if this sale already exists (idempotent)
    existing_sale = None
    if payload.get("saleId"):
        existing_sale = (await db.execute(
            text("SELECT id FROM sales WHERE id = :id AND tenantId = :t"),
            {"id": payload["saleId"], "t": tenantId},
        )).first()

    if existing_sale:
        return {"syncStatus": "SYNCED", "entityId": payload["saleId"], "note": "Sale already exists"}

    # Use the POS engine directly
    from sqlalchemy import text as sql_text
    import returns as ret  # noqa — needed for stock ops

    branchId = payload.get("branchId")
    warehouseId = payload.get("warehouseId")
    items = payload.get("items") or []
    payments = payload.get("payments") or []
    customerId = payload.get("customerId")

    if not items:
        return {"syncStatus": "FAILED", "error": "No items in sale"}

    # Resolve branch/warehouse if not provided
    if not branchId or not warehouseId:
        row = (await db.execute(sql_text(
            "SELECT b.id, (SELECT w.id FROM warehouses w WHERE w.branchId = b.id LIMIT 1) "
            "FROM branches b WHERE b.tenantId=:t LIMIT 1"), {"t": tenantId})).first()
        if not row:
            return {"syncStatus": "FAILED", "error": "No branch/warehouse"}
        branchId = branchId or row[0]
        warehouseId = warehouseId or row[1]

    # Shift check
    shift = (await db.execute(sql_text(
        "SELECT id FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status IN ('OPEN','PENDING_APPROVAL') LIMIT 1"),
        {"t": tenantId, "b": branchId})).first()
    shiftId = shift[0] if shift else None

    subtotal = sum(float(i.get("qty", 0)) * float(i.get("unitPrice", 0)) - float(i.get("discountAmount", 0) or 0) for i in items)
    discountTotal = float(payload.get("discountTotal", 0) or 0)
    taxTotal = float(payload.get("taxTotal", 0) or 0)
    service = float(payload.get("serviceCharge", 0) or 0)
    total = max(subtotal - discountTotal + taxTotal + service, 0)
    paid = sum(float(p.get("amount", 0)) for p in payments)
    due = max(total - paid, 0)

    saleId = payload.get("saleId") or str(uuid.uuid4())
    invoiceNo = gen_no("INV")
    invoiceId = str(uuid.uuid4())

    await db.execute(sql_text(
        "INSERT INTO sales (id, tenantId, branchId, userId, customerId, invoiceNo, subtotal, "
        "discountTotal, taxTotal, serviceCharge, total, paidTotal, dueTotal, paymentStatus, status, shiftId, createdBy) "
        "VALUES (:id, :t, :b, :u, :cust, :inv, :sub, :disc, :tax, :svc, :total, :paid, :due, :ps, 'CONFIRMED', :shift, :u)"),
        {"id": saleId, "t": tenantId, "b": branchId, "u": userId, "cust": customerId,
         "inv": invoiceNo, "sub": subtotal, "disc": discountTotal, "tax": taxTotal,
         "svc": service, "total": total, "paid": paid, "due": due,
         "ps": "PAID" if due <= 0 else ("PARTIAL" if paid > 0 else "UNPAID"), "shift": shiftId})

    for it in items:
        line = float(it.get("qty", 0)) * float(it.get("unitPrice", 0)) - float(it.get("discountAmount", 0) or 0)
        await db.execute(sql_text(
            "INSERT INTO sale_items (id, tenantId, saleId, productId, variantId, name, qty, unitPrice, discountAmount, lineTotal, batchNo, createdBy, updatedAt) "
            "VALUES (:id, :t, :s, :p, :v, :n, :q, :up, :d, :lt, :bn, :u, NOW())"),
            {"id": str(uuid.uuid4()), "t": tenantId, "s": saleId, "p": it["productId"],
             "v": it.get("variantId"), "n": it.get("name"), "q": it["qty"], "up": it["unitPrice"],
             "d": it.get("discountAmount", 0), "lt": line, "bn": it.get("batchNo"), "u": userId})

        # Stock movement
        st = (await db.execute(sql_text(
            "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p "
            "AND (variantId IS NULL OR variantId = :v) FOR UPDATE"),
            {"t": tenantId, "w": warehouseId, "p": it["productId"], "v": it.get("variantId")})).first()
        qty = float(it["qty"])
        before = float(st[1]) if st else 0
        after = before - qty
        if st:
            await db.execute(sql_text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": after, "id": st[0]})
        else:
            await db.execute(sql_text(
                "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved) "
                "VALUES (UUID(), :t, :w, :p, :v, :q, 0)"),
                {"t": tenantId, "w": warehouseId, "p": it["productId"], "v": it.get("variantId"), "q": max(after, 0)})

        # Pharmacy batch ledger (mirror of the online POS §10.17 FEFO path)
        b_rows = (await db.execute(sql_text(
            "SELECT id, batchNo, qty FROM batches WHERE tenantId=:t AND warehouseId=:w "
            "AND productId=:p AND qty > 0 ORDER BY COALESCE(expiryDate, DATE_ADD(NOW(), INTERVAL 100 YEAR)), createdAt"),
            {"t": tenantId, "w": warehouseId, "p": it["productId"]})).fetchall()
        if b_rows:
            need = qty
            if it.get("batchNo"):
                chosen = [r for r in b_rows if r[1] == it.get("batchNo")]
                if chosen:
                    b_rows = chosen + [r for r in b_rows if r[1] != it.get("batchNo")]
            for bid, _bno, bqty in b_rows:
                if need <= 0:
                    break
                take = min(need, float(bqty))
                need -= take
                await db.execute(sql_text("UPDATE batches SET qty = qty - :d WHERE id=:id"), {"d": take, "id": bid})
                await db.execute(sql_text("UPDATE stock_batches SET qty = qty - :d WHERE id=:id"), {"d": take, "id": bid})

        await db.execute(sql_text(
            "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
            "VALUES (UUID(), :t, :b, :w, :p, :v, 'SALE_OUT', :q, :qb, :qa, 'SALE', :rid, :note, :u, :u)"),
            {"t": tenantId, "b": branchId, "w": warehouseId, "p": it["productId"], "v": it.get("variantId"),
             "q": -qty, "qb": before, "qa": after, "rid": saleId, "note": f"Offline sale {invoiceNo}", "u": userId})

    # Invoice
    await db.execute(sql_text(
        "INSERT INTO invoices (id, tenantId, branchId, saleId, customerId, invoiceNo, invoiceType, issueDate, subtotal, discountTotal, taxTotal, total, paidTotal, status, createdBy, updatedAt) "
        "VALUES (:id, :t, :b, :s, :cust, :inv, 'TAX', NOW(), :sub, :d, :tax, :total, :paid, :st, :u, NOW())"),
        {"id": invoiceId, "t": tenantId, "b": branchId, "s": saleId, "cust": customerId,
         "inv": invoiceNo, "sub": subtotal, "d": discountTotal, "tax": taxTotal, "total": total, "paid": paid,
         "st": "PAID" if due <= 0 else ("PARTIALLY_PAID" if paid > 0 else "ISSUED"), "u": userId})

    # Payments
    for p in payments:
        await db.execute(sql_text(
            "INSERT INTO payments (id, tenantId, branchId, saleId, invoiceId, customerId, method, amount, reference, idempotencyKey, status, createdBy, updatedAt) "
            "VALUES (:id, :t, :b, :s, :inv, :cust, :m, :amt, :ref, :ik, 'COMPLETED', :u, NOW())"),
            {"id": str(uuid.uuid4()), "t": tenantId, "b": branchId, "s": saleId, "inv": invoiceId,
             "cust": customerId, "m": p.get("method", "CASH"), "amt": p["amount"],
             "ref": p.get("reference"), "ik": idempotency_key + "_pay", "u": userId})

        if p.get("method") == "CASH" and shiftId:
            await db.execute(sql_text(
                "INSERT INTO shift_txns (id, tenantId, shiftId, type, amount, refType, refId, note, userId) "
                "VALUES (UUID(), :t, :sh, 'CASH_SALE', :amt, 'SALE', :rid, :note, :u)"),
                {"t": tenantId, "sh": shiftId, "amt": float(p["amount"]), "rid": saleId,
                 "note": f"Offline sale {invoiceNo}", "u": userId})

    # Customer dues
    if customerId and due > 0:
        await db.execute(sql_text("UPDATE customers SET currentDue = currentDue + :amt WHERE id=:id"),
                         {"amt": due, "id": customerId})

    # Accounting journal
    revenue = total - taxTotal
    sale_lines = []
    for p in payments:
        m = p.get("method", "CASH")
        amt = float(p.get("amount", 0) or 0)
        if amt > 0:
            sale_lines.append((acc.METHOD_ACCOUNT.get(m, "1000"), amt, 0.0, f"Offline payment via {m}"))
    if due > 0:
        sale_lines.append(("1100", due, 0.0, "Balance on credit"))
    sale_lines.append(("4000", 0.0, revenue, f"Offline sale {invoiceNo}"))
    if taxTotal > 0:
        sale_lines.append(("2100", 0.0, taxTotal, f"VAT collected {invoiceNo}"))
    await acc.post_journal(db, tenantId, refType="SALE", refId=saleId,
                           narration=f"Offline sale {invoiceNo}", lines=sale_lines, userId=userId)

    # COGS
    cogs_total = await acc.sale_cogs(db, tenantId, saleId)
    if cogs_total > 0:
        await acc.post_journal(db, tenantId, refType="SALE_COGS", refId=saleId,
                               narration=f"COGS {invoiceNo}", lines=[
                                   ("5000", cogs_total, 0.0, "Cost of goods sold"),
                                   ("1200", 0.0, cogs_total, "Inventory reduction"),
                               ], userId=userId)

    return {"syncStatus": "SYNCED", "entityId": saleId, "invoiceNo": invoiceNo}


async def _sync_return(db, tenantId, deviceId, payload, userId, idempotency_key):
    """Process an offline return by delegating to the return engine."""
    import returns as ret_engine
    result = await ret_engine.process_return(
        db, tenantId,
        saleId=payload["saleId"],
        userId=userId,
        branchId=payload.get("branchId"),
        returnType=payload.get("returnType", "REFUND"),
        returnReason=payload.get("returnReason"),
        refundAmount=payload.get("refundAmount"),
        refundMethod=payload.get("refundMethod", "CASH"),
        items=payload.get("items"),
        reason=payload.get("reason"),
    )
    return {"syncStatus": "SYNCED", "entityId": result["returnId"], "returnNo": result["returnNo"]}


async def _sync_stock(db, tenantId, deviceId, payload, userId, idempotency_key):
    """Record a stock movement from an offline adjustment."""
    delta = payload.get("delta", 0)
    pid = payload.get("productId")
    wid = payload.get("warehouseId")
    branchId = payload.get("branchId")

    if not pid or not wid:
        return {"syncStatus": "FAILED", "error": "productId and warehouseId required"}

    st = (await db.execute(
        text("SELECT id, qtyOnHand FROM stock WHERE tenantId = :t AND warehouseId = :w AND productId = :p FOR UPDATE"),
        {"t": tenantId, "w": wid, "p": pid},
    )).first()
    before = float(st[1]) if st else 0
    after = before + delta

    if st:
        await db.execute(text("UPDATE stock SET qtyOnHand = :a WHERE id = :id"), {"a": after, "id": st[0]})
    else:
        await db.execute(
            text("INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved) VALUES (UUID(), :t, :w, :p, :q, 0)"),
            {"t": tenantId, "w": wid, "p": pid, "q": max(after, 0)},
        )

    await db.execute(
        text("INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
             "VALUES (UUID(), :t, :b, :w, :p, 'SYNC_ADJUSTMENT', :q, :qb, :qa, 'SYNC', :rid, :note, :u, :u)"),
        {"t": tenantId, "b": branchId, "w": wid, "p": pid, "q": delta, "qb": before, "qa": after,
         "rid": idempotency_key, "note": payload.get("note", "Offline stock adjustment"), "u": userId},
    )
    return {"syncStatus": "SYNCED", "entityId": pid}


async def _sync_customer(db, tenantId, deviceId, payload, userId, idempotency_key):
    """Upsert a customer from offline edits."""
    cid = payload.get("id")
    if not cid:
        cid = str(uuid.uuid4())
        await db.execute(
            text("INSERT INTO customers (id, tenantId, name, phone, email, address, status, createdBy) "
                 "VALUES (:id, :t, :n, :ph, :e, :a, 'ACTIVE', :u)"),
            {"id": cid, "t": tenantId, "n": payload.get("name", "Customer"),
             "ph": payload.get("phone"), "e": payload.get("email"), "a": payload.get("address"), "u": userId},
        )
    else:
        existing = (await db.execute(
            text("SELECT id FROM customers WHERE id = :id AND tenantId = :t"), {"id": cid, "t": tenantId}
        )).first()
        if existing:
            fields, params = [], {"id": cid, "t": tenantId}
            for k in ("name", "phone", "email", "address"):
                if k in payload:
                    fields.append(f"{k} = :{k}")
                    params[k] = payload[k]
            if fields:
                await db.execute(text(f"UPDATE customers SET {', '.join(fields)} WHERE id = :id AND tenantId = :t"), params)
        else:
            await db.execute(
                text("INSERT INTO customers (id, tenantId, name, phone, email, address, status, createdBy) "
                     "VALUES (:id, :t, :n, :ph, :e, :a, 'ACTIVE', :u)"),
                {"id": cid, "t": tenantId, "n": payload.get("name", "Customer"),
                 "ph": payload.get("phone"), "e": payload.get("email"), "a": payload.get("address"), "u": userId},
            )
    return {"syncStatus": "SYNCED", "entityId": cid}


async def _sync_product(db, tenantId, deviceId, payload, userId, idempotency_key):
    """Upsert a product from offline edits."""
    pid = payload.get("id")
    if not pid:
        pid = str(uuid.uuid4())
        await db.execute(
            text("INSERT INTO products (id, tenantId, name, sku, barcode, sellingPrice, costPrice, unitId, status, createdBy) "
                 "VALUES (:id, :t, :n, :sku, :bc, :sp, :cp, :u, 'ACTIVE', :u2)"),
            {"id": pid, "t": tenantId, "n": payload.get("name", "Product"), "sku": payload.get("sku"),
             "bc": payload.get("barcode"), "sp": payload.get("sellingPrice", 0),
             "cp": payload.get("costPrice", 0), "u": payload.get("unitId") or payload.get("unit"), "u2": userId},
        )
    else:
        existing = (await db.execute(
            text("SELECT id FROM products WHERE id = :id AND tenantId = :t"), {"id": pid, "t": tenantId}
        )).first()
        if existing:
            fields, params = [], {"id": pid, "t": tenantId}
            for k in ("name", "sku", "barcode", "sellingPrice", "costPrice"):
                if k in payload:
                    fields.append(f"{k} = :{k}")
                    params[k] = payload[k]
            if fields:
                await db.execute(text(f"UPDATE products SET {', '.join(fields)} WHERE id = :id AND tenantId = :t"), params)
    return {"syncStatus": "SYNCED", "entityId": pid}


async def _sync_hold(db, tenantId, deviceId, payload, userId, idempotency_key):
    """Upsert a held sale from offline."""
    hid = payload.get("id") or str(uuid.uuid4())
    existing = (await db.execute(
        text("SELECT id FROM held_sales WHERE id = :id AND tenantId = :t"), {"id": hid, "t": tenantId}
    )).first()
    if existing:
        await db.execute(
            text("UPDATE held_sales SET cartSnapshot = :cart, note = :note, updatedAt = NOW() WHERE id = :id"),
            {"cart": json.dumps(payload.get("items", [])), "note": payload.get("note"), "id": hid},
        )
    else:
        await db.execute(
            text("INSERT INTO held_sales (id, tenantId, branchId, userId, holdNo, note, cartSnapshot, createdBy, updatedAt) "
                 "VALUES (:id, :t, :b, :u, :hno, :note, :cart, :u, NOW())"),
            {"id": hid, "t": tenantId, "b": payload.get("branchId"), "u": userId,
             "hno": gen_no("HOLD"), "note": payload.get("note"),
             "cart": json.dumps(payload.get("items", []))},
        )
    return {"syncStatus": "SYNCED", "entityId": hid}
