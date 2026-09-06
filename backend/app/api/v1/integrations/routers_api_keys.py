"""API Key Management (Prompt 34, §38 item 28).

- Tenant-scoped API key issuance with scopes
- Rotation (issue new, revoke old)
- Revocation with reason
- Usage logging
- Middleware for key validation
"""
from __future__ import annotations

import hashlib
import json
import secrets
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

ALL_SCOPES = [
    "sales.read", "sales.write",
    "products.read", "products.write",
    "customers.read", "customers.write",
    "suppliers.read", "suppliers.write",
    "inventory.read", "inventory.write",
    "invoices.read", "invoices.write",
    "orders.read", "orders.write",
    "payments.read", "payments.write",
    "purchases.read", "purchases.write",
    "accounting.read", "accounting.write",
    "reports.read",
    "delivery.read", "delivery.write",
    "employees.read", "employees.write",
    "webhooks.manage",
    "integrations.manage",
    "settings.manage",
    "admin.full",
]


def _uid() -> str:
    return str(uuid.uuid4())


def _generate_key() -> str:
    """Generate a full API key: omni_<random40>"""
    return f"omni_{secrets.token_urlsafe(32)}"


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


@router.get("/api/v1/api-keys")
async def list_keys(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT id, tenantId, name, keyPrefix, scopes, isActive, expiresAt, "
        "lastUsedAt, createdBy, revokedAt, revokeReason, createdAt "
        "FROM api_keys WHERE tenantId=:t ORDER BY createdAt DESC"),
        {"t": tenantId})).fetchall())
    for r in rows:
        if isinstance(r.get("scopes"), str):
            try: r["scopes"] = json.loads(r["scopes"])
            except: pass
    return ok(rows)


@router.post("/api/v1/api-keys")
async def create_key(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name", "")
    scopes = body.get("scopes", [])
    expires_days = body.get("expiresInDays")

    if not name:
        return err("name required", 400)
    if not scopes:
        return err("At least one scope required", 400)

    # Validate scopes
    invalid = [s for s in scopes if s not in ALL_SCOPES]
    if invalid:
        return err(f"Invalid scopes: {invalid}", 400)

    raw_key = _generate_key()
    key_hash = _hash_key(raw_key)
    key_prefix = raw_key[:12]  # omni_xxxx

    expires_at = None
    if expires_days:
        expires_at = (datetime.utcnow() + timedelta(days=int(expires_days))).strftime("%Y-%m-%d %H:%M:%S")

    kid = _uid()
    await db.execute(text(
        "INSERT INTO api_keys (id, tenantId, name, keyHash, keyPrefix, scopes, isActive, "
        "expiresAt, createdBy) VALUES (:id, :t, :n, :kh, :kp, :scopes, 1, :exp, :u)"),
        {"id": kid, "t": tenantId, "n": name, "kh": key_hash, "kp": key_prefix,
         "scopes": json.dumps(scopes), "exp": expires_at, "u": user.id})
    await db.commit()

    return ok({
        "id": kid, "key": raw_key, "keyPrefix": key_prefix,
        "message": "Save the key — it won't be shown again. Store it securely.",
    }, 201)


@router.post("/api/v1/api-keys/{keyId}/rotate")
async def rotate_key(
    keyId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Issue a new key and revoke the old one."""
    old = (await db.execute(text(
        "SELECT * FROM api_keys WHERE id=:id AND tenantId=:t AND revokedAt IS NULL"),
        {"id": keyId, "t": tenantId})).first()
    if not old:
        return err("Active key not found", 404)

    old_data = dict(old._mapping) if hasattr(old, '_mapping') else dict(old)

    # Revoke old
    await db.execute(text(
        "UPDATE api_keys SET isActive=0, revokedAt=NOW(), revokeReason='ROTATED' WHERE id=:id"),
        {"id": keyId})

    # Create new with same name/scopes
    raw_key = _generate_key()
    key_hash = _hash_key(raw_key)
    key_prefix = raw_key[:12]
    new_id = _uid()

    await db.execute(text(
        "INSERT INTO api_keys (id, tenantId, name, keyHash, keyPrefix, scopes, isActive, "
        "expiresAt, createdBy) VALUES (:id, :t, :n, :kh, :kp, :scopes, 1, :exp, :u)"),
        {"id": new_id, "t": tenantId, "n": old_data.get("name", ""),
         "kh": key_hash, "kp": key_prefix,
         "scopes": old_data.get("scopes", "[]"),
         "exp": old_data.get("expiresAt"), "u": user.id})
    await db.commit()

    return ok({
        "newKeyId": new_id, "key": raw_key, "keyPrefix": key_prefix,
        "oldKeyId": keyId,
        "message": "Key rotated. New key shown once — save it securely.",
    })


@router.post("/api/v1/api-keys/{keyId}/revoke")
async def revoke_key(
    keyId: str,
    body: dict = None,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    reason = (body or {}).get("reason", "Revoked by user")
    res = await db.execute(text(
        "UPDATE api_keys SET isActive=0, revokedAt=NOW(), revokeReason=:r "
        "WHERE id=:id AND tenantId=:t AND revokedAt IS NULL"),
        {"id": keyId, "t": tenantId, "r": reason})
    if res.rowcount == 0:
        return err("Key not found or already revoked", 404)
    await db.commit()
    return ok({"revoked": True})


@router.get("/api/v1/api-keys/validate")
async def validate_key(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Validate an API key from Authorization header. Used by middleware."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return err("Missing Bearer token", 401)

    raw_key = auth[7:]
    if not raw_key.startswith("omni_"):
        return err("Invalid key format", 401)

    key_hash = _hash_key(raw_key)
    row = (await db.execute(text(
        "SELECT ak.*, t.slug AS tenantSlug FROM api_keys ak "
        "JOIN tenants t ON t.id = ak.tenantId "
        "WHERE ak.keyHash=:kh AND ak.isActive=1"),
        {"kh": key_hash})).first()
    if not row:
        return err("Invalid or revoked API key", 401)

    data = dict(row._mapping) if hasattr(row, '_mapping') else dict(row)

    # Check expiry
    if data.get("expiresAt"):
        exp = data["expiresAt"]
        if isinstance(exp, str):
            exp = datetime.strptime(exp, "%Y-%m-%d %H:%M:%S")
        if exp < datetime.utcnow():
            return err("API key expired", 401)

    # Update lastUsedAt
    await db.execute(text(
        "UPDATE api_keys SET lastUsedAt=NOW() WHERE id=:id"), {"id": data["id"]})
    await db.commit()

    scopes = data.get("scopes", [])
    if isinstance(scopes, str):
        try: scopes = json.loads(scopes)
        except: scopes = []

    return ok({
        "valid": True, "tenantId": data["tenantId"],
        "tenantSlug": data.get("tenantSlug"),
        "scopes": scopes, "keyId": data["id"],
    })


@router.get("/api/v1/api-keys/scopes")
async def list_scopes():
    return ok(ALL_SCOPES)


@router.get("/api/v1/api-keys/{keyId}/usage")
async def key_usage(
    keyId: str,
    limit: int = 50,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM api_key_usage_log WHERE apiKeyId=:k AND tenantId=:t "
        "ORDER BY createdAt DESC LIMIT :lim"),
        {"k": keyId, "t": tenantId, "lim": min(limit, 200)})).fetchall())
    return ok(rows)
