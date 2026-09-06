"""Backup & Disaster Recovery router (Prompt 40, §26).

Admin-only (``system.admin``) endpoints for the full backup lifecycle:
  POST   /api/v1/system/backups                — create a FULL backup now (via the job queue)
  GET    /api/v1/system/backups                — list backups (status, size, checksum)
  GET    /api/v1/system/backups/{backupId}     — one backup
  POST   /api/v1/system/backups/{backupId}/verify  — restore to a scratch DB, compare vs
                                                     live (table list + core row counts), drop
  POST   /api/v1/system/backups/{backupId}/restore — restore into a named target DB
                                                     (e.g. tenant-restore / DR drill target)
  DELETE /api/v1/system/backups/{backupId}     — remove file + record

Automated backups run daily through the background job queue (``backup_full``,
see jobs.py scheduler pass). Tenant/branch restoration procedure lives in
DISASTER-RECOVERY.md.
"""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import backup as backup_mod
import jobs as jobs_mod
from db import get_db
from security import require_permission, resolve_tenant, AuthUser
from util import ok, err

router = APIRouter()


@router.get("/api/v1/system/backups")
async def list_backups(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = await asyncio.to_thread(backup_mod.list_backups, 50)
    return ok(rows)


@router.post("/api/v1/system/backups")
async def create_backup(
    body: dict | None = None,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create a FULL backup now — enqueued + run through the same queue handler
    the daily scheduler uses (single source of truth for backup jobs)."""
    job = await jobs_mod.enqueue_and_run(
        db, tenantId, "backup_full",
        {"tenantId": tenantId, "source": "manual"},
        priority=1, created_by=user.id)
    return ok({"job": job, "note": "full mysqldump snapshot created"}, 201)


@router.get("/api/v1/system/backups/{backupId}")
async def get_backup(
    backupId: str,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = await asyncio.to_thread(backup_mod.get_backup, backupId)
    if not row:
        return err("Backup not found", 404)
    if row.get("result") and isinstance(row["result"], str):
        try:
            row["result"] = json.loads(row["result"])
        except Exception:
            row["result"] = None
    return ok(row)


@router.post("/api/v1/system/backups/{backupId}/verify")
async def verify_backup(
    backupId: str,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Restore into a scratch DB, compare table list + core row counts against
    the live DB, drop the scratch DB. Proves the backup is restorable."""
    for attempt in range(2):
        try:
            report = await asyncio.to_thread(backup_mod.verify_backup, backupId)
            return ok(report)
        except (FileNotFoundError, LookupError) as e:
            return err(str(e), 404)
        except Exception as e:  # noqa: BLE001 — transient lock races → one retry
            if attempt == 0:
                await asyncio.sleep(1.5)
                continue
            return err(f"Verification failed: {e}", 500)
    return err("Verification failed", 500)


@router.post("/api/v1/system/backups/{backupId}/restore")
async def restore_backup(
    backupId: str,
    body: dict | None = None,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Restore the dump into a target database (DR drill / tenant restoration).
    ``targetDb`` must be a fresh name — the live DB is never overwritten here."""
    row = await asyncio.to_thread(backup_mod.get_backup, backupId)
    if not row:
        return err("Backup not found", 404)
    target = (body or {}).get("targetDb") or f"restored_{backupId[:8]}"
    try:
        report = await asyncio.to_thread(
            backup_mod.restore_to, row["filePath"], target, True)
        await asyncio.to_thread(
            backup_mod._mark_restored, backupId, report)  # noqa: SLF001
    except Exception as e:  # noqa: BLE001
        return err(f"Restore failed: {e}", 500)
    return ok(report)


@router.delete("/api/v1/system/backups/{backupId}")
async def delete_backup(
    backupId: str,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    deleted = await asyncio.to_thread(backup_mod.delete_backup, backupId)
    if not deleted:
        return err("Backup not found", 404)
    return ok({"deleted": True})


@router.post("/api/v1/system/backups/retention")
async def run_retention(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    removed = await asyncio.to_thread(backup_mod.enforce_retention)
    return ok({"removed": removed, "retention": backup_mod.RETENTION})
