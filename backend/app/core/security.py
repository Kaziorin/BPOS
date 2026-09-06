"""Security, JWT Authentication, and Role-Based Access Control (RBAC)."""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Set

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

PERM_CACHE_TTL = 60  # seconds
_perm_cache: dict[tuple[str, str], tuple[set[str], float]] = {}


def sign_token(payload: dict, days: int = 7) -> str:
    payload = {**payload}
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=days)
    payload["iat"] = int(time.time())
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


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
        self.name = payload.get("name", "")
        self.email = payload.get("email", "")
        self.roleId = payload.get("roleId", "")
        self.roleName = payload.get("roleName", "")


async def require_auth(request: Request, db: AsyncSession = Depends(get_db)) -> AuthUser:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Unauthorized — missing Bearer token")
    token = auth[7:]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    request.state.user = AuthUser(payload)
    return request.state.user


async def resolve_tenant(
    request: Request,
    x_tenant_id: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> str:
    """Resolve tenant by slug or UUID with tenant isolation validation."""
    if not x_tenant_id:
        raise HTTPException(401, "Missing x-tenant-id header — every request must carry a tenant")
    ident = x_tenant_id.strip()
    row = (
        await db.execute(
            text("SELECT id FROM tenants WHERE id = :i OR slug = :i LIMIT 1"), {"i": ident}
        )
    ).first()
    if not row:
        raise HTTPException(404, f"Tenant not found for '{ident}'")
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(auth[7:], settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            raise HTTPException(401, "Invalid or expired token")
        token_tenant = payload.get("tenantId")
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
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(401, "Unauthorized — missing Bearer token")
        try:
            payload = jwt.decode(authorization[7:], settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            raise HTTPException(401, "Invalid or expired token")
        user = AuthUser(payload)
        request.state.user = user

        if not x_tenant_id:
            raise HTTPException(401, "Missing x-tenant-id header — every request must carry a tenant")
        row = (
            await db.execute(
                text("SELECT id FROM tenants WHERE id = :i OR slug = :i LIMIT 1"), {"i": x_tenant_id.strip()}
            )
        ).first()
        if not row:
            raise HTTPException(404, f"Tenant not found for '{x_tenant_id}'")
        if user.tenantId and user.tenantId != row[0]:
            raise HTTPException(403, "Token tenant does not match x-tenant-id header")
        request.state.tenantId = row[0]

        perms = await get_user_permissions(user.id, user.tenantId, db)
        if not any(c in perms for c in codes):
            raise HTTPException(403, f"Forbidden — requires one of {codes}")
        return user

    return dep


def invalidate_perm_cache(tenantId: str):
    for k in [k for k in _perm_cache if k[1] == tenantId]:
        _perm_cache.pop(k, None)
