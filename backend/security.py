"""Config + security (JWT, bcrypt, RBAC with cache) — mirrors TS middleware/auth.ts."""
from __future__ import annotations

import os
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-in-production-please")
TENANT_HEADER = "x-tenant-id"
PERM_CACHE_TTL = 60  # seconds — same as TS

_perm_cache: dict[tuple[str, str], tuple[set[str], float]] = {}


def sign_token(payload: dict, days: int = 7) -> str:
    payload = {**payload}
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=days)
    payload["iat"] = int(time.time())
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(10)).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


class AuthUser:
    def __init__(self, payload: dict):
        self.id = payload["id"]
        self.tenantId = payload["tenantId"]
        self.branchId = payload.get("branchId", "")
        self.name = payload.get("name", "")
        self.email = payload.get("email", "")
        self.roleId = payload.get("roleId", "")
        self.roleName = payload.get("roleName", "")
        self.role = payload.get("roleName", "") or payload.get("role", "")
        self.businessType = payload.get("businessType", "")


async def require_auth(request: Request, db: AsyncSession = Depends(get_db)) -> AuthUser:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Unauthorized — missing Bearer token")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    
    # Verify that the user still exists and is active in DB
    user_id = payload.get("id")
    if user_id:
        user_row = (await db.execute(text("SELECT id, status FROM users WHERE id = :id"), {"id": user_id})).first()
        if not user_row or user_row[1] != "ACTIVE":
            raise HTTPException(401, "User account not found or deactivated")

    request.state.user = AuthUser(payload)
    return request.state.user


async def resolve_tenant(
    request: Request,
    x_tenant_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Resolve tenant by slug or UUID — fallback to JWT token or default tenant if missing."""
    auth = request.headers.get("authorization", "")
    token_tenant = None
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
            token_tenant = payload.get("tenantId")
        except Exception:
            pass

    ident = (x_tenant_id or "").strip()
    if not ident:
        if token_tenant:
            request.state.tenantId = token_tenant
            return token_tenant
        row = (await db.execute(text("SELECT id FROM tenants LIMIT 1"))).first()
        if row:
            request.state.tenantId = row[0]
            return row[0]
        raise HTTPException(401, "Missing x-tenant-id header — no active tenant found")

    row = (
        await db.execute(
            text("SELECT id FROM tenants WHERE id = :i OR slug = :i LIMIT 1"), {"i": ident}
        )
    ).first()
    if not row:
        if token_tenant:
            request.state.tenantId = token_tenant
            return token_tenant
        raise HTTPException(404, f"Tenant not found for '{ident}'")

    if token_tenant and token_tenant != row[0]:
        raise HTTPException(403, "Token tenant does not match x-tenant-id header")

    request.state.tenantId = row[0]
    return row[0]


async def get_user_permissions(userId: str, tenantId: str, db: AsyncSession) -> set[str]:
    key = (userId, tenantId)
    cached = _perm_cache.get(key)
    if cached and time.time() - cached[1] < PERM_CACHE_TTL:
        return cached[0]
    rows = await db.execute(
        text(
            "SELECT p.code FROM role_permissions rp "
            "JOIN permissions p ON p.id = rp.permissionId "
            "WHERE rp.roleId = (SELECT roleId FROM users WHERE id = :u AND tenantId = :t)"
        ),
        {"u": userId, "t": tenantId},
    )
    perms = {r[0] for r in rows.fetchall()}
    _perm_cache[key] = (perms, time.time())
    return perms


def require_permission(*codes: str):
    async def dep(
        request: Request,
        x_tenant_id: Optional[str] = Header(None),
        authorization: Optional[str] = Header(None),
        db: AsyncSession = Depends(get_db),
    ) -> AuthUser:
        # Inline auth (self-contained — mirrors require_auth)
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(401, "Unauthorized — missing Bearer token")
        try:
            payload = jwt.decode(authorization[7:], JWT_SECRET, algorithms=["HS256"])
        except Exception:
            raise HTTPException(401, "Invalid or expired token")
        
        # Verify that the user still exists and is active in DB
        user_id = payload.get("id")
        if user_id:
            user_row = (await db.execute(text("SELECT id, status FROM users WHERE id = :id"), {"id": user_id})).first()
            if not user_row or user_row[1] != "ACTIVE":
                raise HTTPException(401, "User account not found or deactivated")

        user = AuthUser(payload)
        request.state.user = user

        # Tenant resolve (slug or uuid → id) with graceful fallback
        ident = (x_tenant_id or "").strip()
        t_id = None
        if ident:
            row = (await db.execute(text("SELECT id FROM tenants WHERE id = :i OR slug = :i LIMIT 1"), {"i": ident})).first()
            if row: t_id = row[0]
        if not t_id:
            t_id = user.tenantId
        if not t_id:
            row = (await db.execute(text("SELECT id FROM tenants LIMIT 1"))).first()
            if row: t_id = row[0]

        request.state.tenantId = t_id

        perms = await get_user_permissions(user.id, user.tenantId, db)
        if not any(c in perms for c in codes):
            raise HTTPException(403, f"Forbidden — requires one of {codes}")
        return user

    return dep


def invalidate_perm_cache(tenantId: str):
    for k in [k for k in _perm_cache if k[1] == tenantId]:
        _perm_cache.pop(k, None)
