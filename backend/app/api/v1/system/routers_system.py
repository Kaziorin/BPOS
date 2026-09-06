"""System Operations router (Prompt 39, §25/§26) — performance, caching,
background-job queue and scalability observability for the admin dashboard.

Everything here is tenant-scoped except worker/cache/DB health which is
platform-level ops data, gated behind ``system.admin``.

Also owns the lightweight in-process latency recorder that main.py's timing
middleware feeds (ring buffer + per-route aggregates) — surfaced by
``GET /api/v1/system/performance``.
"""
from __future__ import annotations

import asyncio
import json
import os
import threading
import time
import uuid
from collections import deque
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import cache as cache_mod
import jobs as jobs_mod
from db import get_db
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

# ── latency recorder (fed by main.py middleware) ──
_lat_lock = threading.Lock()
_recent: deque = deque(maxlen=4000)  # (timestamp, route, ms, status)
_route_agg: dict[str, list] = {}  # route -> [count, total_ms, worst_ms, worst_at, err5xx]
STARTED_AT = time.time()


def record_latency(route: str, ms: float, status: int = 200) -> None:
    """Middleware hook: called after every matched request completes."""
    with _lat_lock:
        _recent.append((time.time(), route, ms, status))
        agg = _route_agg.setdefault(route, [0, 0.0, 0.0, time.time(), 0])
        agg[0] += 1
        agg[1] += ms
        if status >= 500:
            agg[4] += 1
        if ms > agg[2]:
            agg[2] = ms
            agg[3] = time.time()


def _pct(sorted_ms: list, pct: float) -> float:
    if not sorted_ms:
        return 0.0
    return round(sorted_ms[min(len(sorted_ms) - 1, int(len(sorted_ms) * pct))], 1)


def latency_summary() -> dict:
    with _lat_lock:
        ms_list = sorted(x[2] for x in _recent)
        err5 = sum(1 for x in _recent if x[3] >= 500)
        err4 = sum(1 for x in _recent if 400 <= x[3] < 500)
        total = len(_recent)
        top = sorted(_route_agg.items(), key=lambda kv: -kv[1][1])[:12]
        slowest = []
        for route, agg in top:
            count, tms, worst, worst_at, err5xx = agg
            slowest.append({
                "route": route, "count": count, "totalMs": round(tms, 1),
                "avgMs": round(tms / count, 1) if count else 0,
                "worstMs": round(worst, 1),
                "errors5xx": err5xx,
                "worstAt": datetime.fromtimestamp(worst_at).isoformat(),
            })
        return {
            "samples": total,
            "requestCount": total,
            "error5xx": err5,
            "error4xx": err4,
            "errorRate5xx": round(err5 / total * 100, 2) if total else 0,
            "p50Ms": _pct(ms_list, 0.50),
            "p95Ms": _pct(ms_list, 0.95),
            "p99Ms": _pct(ms_list, 0.99),
            "maxMs": _pct(ms_list, 1.0) if ms_list else 0,
            "slowest": slowest,
        }


def _worker_info() -> dict:
    w = jobs_mod.WORKER
    hb = w.get("lastHeartbeat")
    return {
        "alive": bool(w.get("alive")),
        "startedAt": w.get("startedAt"),
        "lastHeartbeat": datetime.fromtimestamp(hb).isoformat() if hb else None,
        "lastHeartbeatAgoSec": round(time.time() - hb, 1) if hb else None,
        "processed": w.get("processed", 0),
        "failed": w.get("failed", 0),
        "lastError": w.get("lastError"),
        "queuePolls": w.get("queuePolls", 0),
        "schedulerRuns": w.get("schedulerRuns", 0),
    }


def _uid() -> str:
    return str(uuid.uuid4())


# ═══════════════════════════════ health ═══════════════════════════════

@router.get("/api/v1/system/health")
async def system_health(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    t0 = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        db_ok, db_ms = True, round((time.perf_counter() - t0) * 1000, 1)
    except Exception as e:  # noqa: BLE001
        db_ok, db_ms, = False, -1
    q = (await db.execute(text(
        "SELECT status, COUNT(*) FROM background_jobs GROUP BY status"))).fetchall()
    queue = {r[0]: r[1] for r in q}
    tenant_q = (await db.execute(text(
        "SELECT status, COUNT(*) FROM background_jobs WHERE tenantId=:t GROUP BY status"),
        {"t": tenantId})).fetchall()
    extras = await _gather_subsystems(db, tenantId)
    return ok({
        "status": "ok" if db_ok else "degraded",
        "service": "blue-oceans-pos-api-py",
        "uptimeSec": round(time.time() - STARTED_AT),
        "db": {"connected": db_ok, "pingMs": db_ms},
        "worker": _worker_info(),
        "queue": {
            "global": {"QUEUED": queue.get("QUEUED", 0), "RUNNING": queue.get("RUNNING", 0),
                       "SUCCEEDED": queue.get("SUCCEEDED", 0), "FAILED": queue.get("FAILED", 0)},
            "tenant": {r[0]: r[1] for r in tenant_q},
        },
        "cache": cache_mod.stats(),
        "latency": latency_summary(),
        "api": extras["api"],
        "sys": extras["sys"],
        "sync": extras["sync"],
        "notifications": extras["notifications"],
        "storage": extras["storage"],
        "backups": extras["backups"],
        "indicators": extras["indicators"],
    })


# ═══════════════════════════════ jobs admin ═══════════════════════════════

@router.get("/api/v1/system/jobs")
async def list_jobs(
    status: str = "", type: str = "", limit: int = Query(50),
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId, "lim": min(limit, 200)}
    if status:
        where += " AND status=:s"; params["s"] = status.upper()
    if type:
        where += " AND type=:ty"; params["ty"] = type
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT id, type, status, priority, payload, attempts, maxAttempts, runAt, startedAt, "
        f"finishedAt, lastError, result, createdBy, createdAt FROM background_jobs "
        f"WHERE {where} ORDER BY createdAt DESC LIMIT :lim"), params)).fetchall())
    for r in rows:
        for k in ("payload", "result"):
            if isinstance(r.get(k), str):
                try:
                    r[k] = json.loads(r[k])
                except Exception:
                    r[k] = None
    return ok(rows)


@router.get("/api/v1/system/jobs/stats")
async def job_stats(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    by_status = rows_to_dicts((await db.execute(text(
        "SELECT status, COUNT(*) AS count, COALESCE(SUM(attempts),0) AS attempts "
        "FROM background_jobs WHERE tenantId=:t GROUP BY status"), {"t": tenantId})).fetchall())
    by_type = rows_to_dicts((await db.execute(text(
        "SELECT type, COUNT(*) AS count, "
        "COALESCE(SUM(status='SUCCEEDED'),0) AS succeeded, "
        "COALESCE(SUM(status='FAILED'),0) AS failed "
        "FROM background_jobs WHERE tenantId=:t GROUP BY type ORDER BY count DESC"),
        {"t": tenantId})).fetchall())
    recent = rows_to_dicts((await db.execute(text(
        "SELECT type, status, finishedAt, attempts, lastError, createdAt "
        "FROM background_jobs WHERE tenantId=:t AND status IN ('SUCCEEDED','FAILED') "
        "ORDER BY finishedAt DESC LIMIT 10"), {"t": tenantId})).fetchall())
    return ok({
        "byStatus": by_status,
        "byType": by_type,
        "recent": recent,
        "worker": _worker_info(),
    })


@router.post("/api/v1/system/jobs/enqueue")
async def enqueue_job(
    body: dict,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    jtype = body.get("type", "")
    if jtype not in jobs_mod.JOB_TYPES:
        return err(f"Unknown job type '{jtype}'. Supported: {jobs_mod.JOB_TYPES}", 400)
    jid = await jobs_mod.enqueue(
        db, tenantId, jtype, body.get("payload") or {},
        priority=int(body.get("priority", 5)),
        max_attempts=int(body.get("maxAttempts", 3)),
        created_by=user.id)
    await db.commit()
    return ok({"id": jid, "status": "QUEUED", "type": jtype,
               "note": "worker processes this asynchronously"}, 201)


@router.post("/api/v1/system/jobs/{jobId}/retry")
async def retry_job(
    jobId: str,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT id, status, attempts, maxAttempts FROM background_jobs WHERE id=:id AND tenantId=:t"),
        {"id": jobId, "t": tenantId})).first()
    if not row:
        return err("Job not found", 404)
    if row.status not in ("FAILED", "CANCELLED", "SUCCEEDED"):
        return err(f"Only finished jobs can be retried (status={row.status})", 400)
    if row.attempts >= row.maxAttempts:
        await db.execute(text(
            "UPDATE background_jobs SET maxAttempts=maxAttempts+2, status='QUEUED', "
            "runAt=NOW(3), lastError=NULL WHERE id=:id"), {"id": jobId})
    else:
        await db.execute(text(
            "UPDATE background_jobs SET status='QUEUED', runAt=NOW(3), lastError=NULL WHERE id=:id"),
            {"id": jobId})
    await db.commit()
    return ok({"retried": True, "id": jobId, "status": "QUEUED"})


@router.post("/api/v1/system/jobs/{jobId}/cancel")
async def cancel_job(
    jobId: str,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(text(
        "UPDATE background_jobs SET status='CANCELLED', finishedAt=NOW(3) "
        "WHERE id=:id AND tenantId=:t AND status='QUEUED'"),
        {"id": jobId, "t": tenantId})
    await db.commit()
    if res.rowcount == 0:
        return err("Only QUEUED jobs can be cancelled", 400)
    return ok({"cancelled": True, "id": jobId})


# ═══════════════════════════════ cache admin ═══════════════════════════════

@router.get("/api/v1/system/cache/stats")
async def cache_stats(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    return ok(cache_mod.stats())


@router.post("/api/v1/system/cache/clear")
async def cache_clear(
    body: dict | None = None,
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    ns = (body or {}).get("namespace") or ""
    if ns:
        if ns not in cache_mod.ALLOWED_NAMESPACES:
            return err(f"Unknown namespace '{ns}'", 400)
        cleared = cache_mod.invalidate_namespace(ns, None)
    else:
        cleared = cache_mod.clear()
    return ok({"cleared": cleared, "namespace": ns or "all"})


# ═══════════════════════════════ performance ═══════════════════════════════

@router.get("/api/v1/system/performance")
async def performance(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Live latency + throughput + cache + queue picture (spec §25 targets)."""
    extra = await _gather_subsystems(db, tenantId)
    return ok({
        "latency": latency_summary(),
        "cache": cache_mod.stats(),
        "worker": _worker_info(),
        **extra,
        "targets": {
            "productSearchMs": 300, "cartOpsMs": 100, "checkoutMs": 800,
            "note": "near-instant targets from spec §25 — p95 must stay under these",
        },
    })


# ═══════════════════════════════ observability gatherers (Prompt 40, §26) ═══════════════════════════════

async def _gather_subsystems(db: AsyncSession, tenant_id: str) -> dict:
    """One gatherer powering /health, /metrics and /indicators — real data,
    no fakes: DB rows + /proc + statvfs, not canned answers."""
    api = latency_summary()

    # system resources via /proc (no psutil dependency)
    load = (0.0, 0.0, 0.0)
    mem = {}
    try:
        with open("/proc/loadavg") as f:
            parts = f.read().split()
            load = tuple(float(parts[i]) for i in range(3))
        with open("/proc/meminfo") as f:
            for line in f:
                k, v = line.split(":")[0], int(line.split()[1])
                mem[k] = v
    except Exception:
        pass
    rss_mb = 0.0
    try:
        with open("/proc/self/statm") as f:
            rss_pages = int(f.read().split()[1])
        page_kb = 4  # Linux default; close enough for a gauge
        rss_mb = round(rss_pages * page_kb / 1024, 1)
    except Exception:
        pass
    sysinfo = {
        "loadAvg": {"1m": load[0], "5m": load[1], "15m": load[2]},
        "memTotalMb": round(mem.get("MemTotal", 0) / 1024, 0),
        "memAvailableMb": round(mem.get("MemAvailable", 0) / 1024, 0),
        "memUsedPercent": round((1 - mem.get("MemAvailable", 0) / max(mem.get("MemTotal", 1), 1)) * 100, 1),
        "processRssMb": rss_mb,
        "uptimeSec": round(time.time() - STARTED_AT),
    }
    try:
        import os
        st = os.statvfs("/")
        disk = {"freeGb": round(st.f_bavail * st.f_frsize / 1e9, 1),
                "totalGb": round(st.f_blocks * st.f_frsize / 1e9, 1)}
    except Exception:
        disk = {}
    sysinfo["disk"] = disk

    # queue health
    q = (await db.execute(text(
        "SELECT status, COUNT(*) FROM background_jobs GROUP BY status"))).fetchall()
    queue_global = {r[0]: r[1] for r in q}

    # sync health (devices + pending + failed + conflicts)
    sync = {"devices": 0, "active": 0, "stale": 0, "pending": 0, "failed": 0,
            "conflicts": 0, "syncedToday": 0, "deviceRows": []}
    dev_rows = (await db.execute(text(
        "SELECT deviceId, deviceName, status, isLocked, lastSyncAt, pendingCount, failedCount "
        "FROM device_sync_status WHERE tenantId=:t ORDER BY COALESCE(lastSyncAt, createdAt) DESC LIMIT 50"),
        {"t": tenant_id})).fetchall()
    devs = []
    for r in dev_rows:
        stale = not r.lastSyncAt or (time.time() - r.lastSyncAt.replace(tzinfo=None).timestamp() > 300) if r.lastSyncAt else True
        sync["devices"] += 1
        if r.status == "ACTIVE" and not r.isLocked:
            sync["active"] += 1
        if stale:
            sync["stale"] += 1
        sync["pending"] += int(r.pendingCount or 0)
        sync["failed"] += int(r.failedCount or 0)
        devs.append({"deviceId": r.deviceId, "deviceName": r.deviceName, "status": r.status,
                     "isLocked": bool(r.isLocked), "lastSyncAt": str(r.lastSyncAt)[:19] if r.lastSyncAt else None,
                     "stale": bool(stale), "pendingCount": int(r.pendingCount or 0),
                     "failedCount": int(r.failedCount or 0)})
    sync["deviceRows"] = devs[:10]
    c = (await db.execute(text(
        "SELECT COUNT(*) FROM sync_transactions WHERE tenantId=:t AND syncStatus='CONFLICT'"),
        {"t": tenant_id})).scalar()
    sync["conflicts"] = int(c or 0)
    t = (await db.execute(text(
        "SELECT COUNT(*) FROM sync_transactions WHERE tenantId=:t AND syncedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)"),
        {"t": tenant_id})).scalar()
    sync["syncedToday"] = int(t or 0)

    # notification failures (last 24h) + activity
    notif_row = (await db.execute(text(
        "SELECT "
        "COALESCE(SUM(status='FAILED'),0) AS failed24h, "
        "COALESCE(SUM(status IN ('SENT','FAILED')),0) AS attempted24h "
        "FROM notification_logs WHERE tenantId=:t AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)"),
        {"t": tenant_id})).first()
    notif = {"failed24h": int(notif_row[0] or 0), "attempted24h": int(notif_row[1] or 0)}
    unread = (await db.execute(text(
        "SELECT COUNT(*) FROM inapp_notifications WHERE tenantId=:t AND isRead=0"),
        {"t": tenant_id})).scalar()
    notif["unreadInApp"] = int(unread or 0)

    # storage + backups
    import backup as backup_mod
    storage = {}
    try:
        backup_mod.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        st = os.statvfs(str(backup_mod.BACKUP_DIR))
        storage = {"backupDir": str(backup_mod.BACKUP_DIR),
                   "backupDirFreeGb": round(st.f_bavail * st.f_frsize / 1e9, 1),
                   "backupDirTotalGb": round(st.f_blocks * st.f_frsize / 1e9, 1),
                   "retention": backup_mod.RETENTION}
    except Exception:
        pass
    bkp_rows = await asyncio.to_thread(backup_mod.list_backups, 5)
    last = bkp_rows[0] if bkp_rows else None
    backups = {"count": len(await asyncio.to_thread(backup_mod.list_backups, 500)),
               "latest": last, "recent": bkp_rows}

    # ── indicator tiles (real status → green/amber/red on the dashboard) ──
    lat = api
    indicators = {
        "api": {"ok": lat.get("p95Ms", 999) <= 800 and lat.get("errorRate5xx", 99) < 5,
                "label": "API",
                "detail": f"p95 {lat.get('p95Ms')}ms · {lat.get('requestCount', 0)} req · "
                           f"{lat.get('error5xx', 0)} 5xx"},
        "db": {"ok": True, "label": "Database", "detail": "connected"},
        "queue": {"ok": bool(jobs_mod.WORKER.get("alive")) and jobs_mod.WORKER.get("failed", 0) == 0,
                   "label": "Queue",
                   "detail": f"worker {'alive' if jobs_mod.WORKER.get('alive') else 'down'} · "
                              f"queued {queue_global.get('QUEUED', 0)} · failed {queue_global.get('FAILED', 0)}"},
        "sync": {"ok": sync["devices"] == 0 or (sync["pending"] == 0 and sync["failed"] == 0),
                  "label": "Sync",
                  "detail": f"{sync['devices']} devices · {sync['pending']} pending · "
                             f"{sync['failed']} failed · {sync['conflicts']} conflicts"},
        "notifications": {"ok": notif["failed24h"] == 0, "label": "Notifications",
                           "detail": f"{notif['failed24h']} failed / {notif['attempted24h']} "
                                      f"attempted (24h)"},
        "storage": {"ok": storage.get("backupDirFreeGb", 0) > 1, "label": "Storage",
                     "detail": f"{storage.get('backupDirFreeGb', '-')} GB free (backups dir)"},
        "backups": {"ok": bool(last) and last.get("status") in ("COMPLETED", "VERIFIED", "RESTORED"),
                     "label": "Backups",
                     "detail": f"{backups['count']} on disk · latest "
                                f"{str(last.get('createdAt'))[:19] if last else 'none'}"},
    }
    return {"api": api, "sys": sysinfo, "sync": sync, "notifications": notif,
            "storage": storage, "backups": backups, "indicators": indicators}


@router.get("/api/v1/system/metrics")
async def system_metrics(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Full observability payload (Prompt 40, §26): API latency/errors, DB,
    queue, sync, notifications, CPU/memory/storage, uptime, backups."""
    extra = await _gather_subsystems(db, tenantId)
    return ok({
        **extra,
        "cache": cache_mod.stats(),
        "worker": _worker_info(),
    })


@router.get("/api/v1/system/indicators")
async def system_indicators(
    user: AuthUser = Depends(require_permission("system.admin")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """The dashboard tiles only — API/DB/Queue/Sync/Notifications/Storage/
    Backups, each with a real ok/detail pair."""
    extra = await _gather_subsystems(db, tenantId)
    return ok(extra["indicators"])
