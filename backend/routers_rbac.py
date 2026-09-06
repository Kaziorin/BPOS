"""RBAC router — roles CRUD, permissions, user-role assignment (Prompt 4 parity)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, require_permission, resolve_tenant, AuthUser, invalidate_perm_cache
from util import ok, err, rows_to_dicts, paginate_params

router = APIRouter()


@router.get("/api/v1/rbac/roles")
async def list_roles(
    user: AuthUser = Depends(require_permission("rbac.roles.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT r.id, r.name, r.description, r.isSystem, "
                    "(SELECT COUNT(*) FROM role_permissions rp WHERE rp.roleId = r.id) permCount, "
                    "(SELECT COUNT(*) FROM users u WHERE u.roleId = r.id) userCount "
                    "FROM roles r WHERE r.tenantId = :t ORDER BY r.name"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    return ok(rows)


@router.post("/api/v1/rbac/roles")
async def create_role(
    body: dict,
    user: AuthUser = Depends(require_permission("rbac.roles.create")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    if not name:
        return err("Name is required", 400)
    exists = (
        await db.execute(text("SELECT id FROM roles WHERE tenantId = :t AND name = :n"), {"t": tenantId, "n": name})
    ).first()
    if exists:
        return err("Role name already exists", 409)
    await db.execute(
        text(
            "INSERT INTO roles (id, tenantId, name, description, isSystem, createdBy) "
            "VALUES (UUID(), :t, :n, :d, 0, :u)"
        ),
        {"t": tenantId, "n": name, "d": body.get("description"), "u": user.id},
    )
    await db.commit()
    row = (
        await db.execute(text("SELECT id, name, description FROM roles WHERE tenantId=:t AND name=:n"),
                         {"t": tenantId, "n": name})
    ).first()
    return ok({"id": row.id, "name": row.name, "description": row.description}, 201)


@router.put("/api/v1/rbac/roles/{roleId}")
async def update_role(
    roleId: str,
    body: dict,
    user: AuthUser = Depends(require_permission("rbac.roles.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    sets, params = [], {"rid": roleId, "t": tenantId, "u": user.id}
    if body.get("name"):
        sets.append("name = :n"); params["n"] = body["name"]
    if body.get("description") is not None:
        sets.append("description = :d"); params["d"] = body["description"]
    if not sets:
        return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    res = await db.execute(text(f"UPDATE roles SET {', '.join(sets)} WHERE id = :rid AND tenantId = :t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Role not found", 404)
    invalidate_perm_cache(tenantId)
    return ok({"updated": True})


@router.delete("/api/v1/rbac/roles/{roleId}")
async def delete_role(
    roleId: str,
    user: AuthUser = Depends(require_permission("rbac.roles.delete")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    used = (
        await db.execute(text("SELECT COUNT(*) c FROM users WHERE roleId = :r"), {"r": roleId})
    ).first()
    if used.c > 0:
        return err("Cannot delete role with assigned users", 400)
    res = await db.execute(text("DELETE FROM roles WHERE id = :r AND tenantId = :t"), {"r": roleId, "t": tenantId})
    await db.commit()
    if res.rowcount == 0:
        return err("Role not found", 404)
    return ok({"deleted": True})


@router.get("/api/v1/rbac/roles/{roleId}/permissions")
async def role_permissions(
    roleId: str,
    user: AuthUser = Depends(require_permission("rbac.roles.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT p.id, p.code, p.module, p.action FROM role_permissions rp "
                    "JOIN permissions p ON p.id = rp.permissionId WHERE rp.roleId = :r"
                ),
                {"r": roleId},
            )
        ).fetchall()
    )
    return ok(rows)


@router.put("/api/v1/rbac/roles/{roleId}/permissions")
async def set_role_permissions(
    roleId: str,
    body: dict,
    user: AuthUser = Depends(require_permission("rbac.roles.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    codes = body.get("permissionCodes") or []
    await db.execute(text("DELETE FROM role_permissions WHERE roleId = :r"), {"r": roleId})
    for c in codes:
        await db.execute(
            text(
                "INSERT INTO role_permissions (roleId, permissionId) "
                "SELECT :r, id FROM permissions WHERE code = :c LIMIT 1"
            ),
            {"r": roleId, "c": c},
        )
    await db.commit()
    invalidate_perm_cache(tenantId)
    return ok({"updated": len(codes)})


@router.get("/api/v1/rbac/permissions/modules")
async def permissions_by_module(
    user: AuthUser = Depends(require_permission("rbac.permissions.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (
            await db.execute(text("SELECT id, code, module, action, description FROM permissions ORDER BY module, action"))
        ).fetchall()
    )
    grouped: dict[str, list] = {}
    for r in rows:
        grouped.setdefault(r["module"], []).append(r)
    return ok(grouped)


@router.get("/api/v1/rbac/users")
async def list_users(
    user: AuthUser = Depends(require_permission("rbac.users.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT ua.id, ua.name, ua.email, ua.phone, ua.status, r.id AS roleId, r.name AS roleName "
                    "FROM users ua LEFT JOIN roles r ON r.id = ua.roleId "
                    "WHERE ua.tenantId = :t ORDER BY ua.name"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    return ok(rows)


@router.put("/api/v1/rbac/users/{userId}/role")
async def assign_role(
    userId: str,
    body: dict,
    user: AuthUser = Depends(require_permission("rbac.users.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    roleId = body.get("roleId")
    if not roleId:
        return err("roleId is required", 400)
    res = await db.execute(
        text("UPDATE users SET roleId = :r, updatedBy = :u WHERE id = :id AND tenantId = :t"),
        {"r": roleId, "u": user.id, "id": userId, "t": tenantId},
    )
    await db.commit()
    if res.rowcount == 0:
        return err("User not found", 404)
    invalidate_perm_cache(tenantId)
    return ok({"updated": True})
