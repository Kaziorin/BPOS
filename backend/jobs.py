"""Background job queue + worker (Prompt 39, §25).

DB-backed (table ``background_jobs``) so jobs survive restarts and are visible
to the system admin UI. The FastAPI process runs one asyncio worker task (see
``worker_main`` / main.py lifespan) that:

  1. claims due QUEUED rows with ``FOR UPDATE SKIP LOCKED`` and runs them,
  2. runs scheduler passes that enqueue recurring work:
       - webhook events stuck in RETRYING whose backoff elapsed
       - recurring expense templates that are due (per tenant)
       - scheduled reports that are due (per tenant)
       - per-tenant notify ``run_scheduled_checks`` scans (low stock, expiry,
         installment due, quotation expiry, offline devices)

Concurrency rules (important):
  * every DB op uses a SHORT-LIVED session — never a session held across the
    loop, otherwise FOR UPDATE row locks accumulate and poison the queue;
  * ``claim_next`` acquires a row with FOR UPDATE SKIP LOCKED then commits
    immediately, releasing the lock before the handler runs — a second worker
    cannot double-run a job because the claim UPDATE is guarded by
    ``status='QUEUED'`` (0 rows → someone else claimed it).

Guardrail (§25): the POS sale path is fully synchronous and never depends on
this queue. Endpoints that used to do async work inline now call
``enqueue_and_run`` — the queue row is the single source of truth either way.
"""
from __future__ import annotations

import asyncio
import json
import time
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text

from db import AsyncSessionLocal
from util import encode

JOB_TYPES = [
    "webhook_deliver", "email", "sms", "whatsapp", "notification",
    "report_generate", "pdf_generate", "import_process", "export_process",
    "sync_process", "ai_process", "recurring_expenses", "scheduled_check",
    "backup_full",  # Prompt 40: automated daily FULL database backup
]

# ── worker observability (read by routers_system) ──
WORKER = {
    "alive": False,
    "startedAt": None,
    "lastHeartbeat": None,
    "processed": 0,
    "failed": 0,
    "lastError": None,
    "schedulerRuns": 0,
    "queuePolls": 0,
}

# per-tenant throttling for the notify scheduled-checks pass
_last_scheduled_check: dict[str, float] = {}
CHECK_INTERVAL_SECONDS = 120  # per-tenant gap between scheduled-check scans
SCHEDULER_INTERVAL_SECONDS = 15
POLL_INTERVAL_SECONDS = 0.5
BATCH = 10

# frequency → next-run advance (shared by recurring expenses + scheduled reports)
_FREQ_DELTA = {
    "DAILY": timedelta(days=1), "WEEKLY": timedelta(weeks=1),
    "MONTHLY": timedelta(days=30), "QUARTERLY": timedelta(days=90),
    "YEARLY": timedelta(days=365),
}


def _uid() -> str:
    return str(uuid.uuid4())


async def _session():
    """Every operation gets its own short-lived session."""
    return AsyncSessionLocal()


# ═══════════════════════════════ API (used by routers) ═══════════════════════════════

async def enqueue(db, tenant_id: str, type_: str, payload: dict | None = None,
                  priority: int = 5, max_attempts: int = 3,
                  run_at: datetime | None = None, created_by: str | None = None) -> str:
    """Insert a QUEUED job. Cheap + never blocks a request path."""
    if type_ not in JOB_TYPES:
        raise ValueError(f"Unknown job type '{type_}' — supported: {JOB_TYPES}")
    jid = _uid()
    await db.execute(text(
        "INSERT INTO background_jobs (id, tenantId, type, status, priority, payload, "
        "maxAttempts, runAt, createdBy, createdAt, updatedAt) "
        "VALUES (:id, :t, :ty, 'QUEUED', :pr, :pl, :ma, COALESCE(:ra, NOW()), :cb, NOW(3), NOW(3))"),
        {"id": jid, "t": tenant_id, "ty": type_, "pr": priority,
         "pl": json.dumps(payload or {}, default=encode),
         "ma": max_attempts, "ra": run_at, "cb": created_by})
    return jid


async def enqueue_and_run(db, tenant_id: str, type_: str, payload: dict | None = None,
                          priority: int = 5, max_attempts: int = 3,
                          created_by: str | None = None) -> dict:
    """Enqueue then execute immediately through the *same* handler the worker
    uses. Keeps latency for manually-triggered flows while making the queue row
    the single source of truth (guardrail: the request path never *depends* on
    the worker — if the inline run fails the job stays QUEUED for retry)."""
    jid = await enqueue(db, tenant_id, type_, payload, priority, max_attempts, created_by=created_by)
    await db.commit()
    outcome = await run_job(jid, type_, tenant_id, payload or {})
    return {"id": jid, "status": outcome["status"], "result": outcome.get("result")}


# ═══════════════════════════════ worker core ═══════════════════════════════

async def claim_next():
    """Atomically claim one due job.

    SELECT ... FOR UPDATE SKIP LOCKED picks the row without blocking siblings;
    we then mark it RUNNING (guarded by status='QUEUED') and COMMIT, releasing
    the row lock before the handler runs. Never double-executed: the guarded
    UPDATE affects 0 rows if another worker claimed it first.
    """
    session = await _session()
    try:
        row = (await session.execute(text(
            "SELECT id, tenantId, type, payload, attempts, maxAttempts "
            "FROM background_jobs "
            "WHERE status='QUEUED' AND runAt <= NOW(3) "
            "ORDER BY priority ASC, createdAt ASC LIMIT 1 FOR UPDATE SKIP LOCKED"))).first()
        if not row:
            await session.commit()
            return None
        res = await session.execute(text(
            "UPDATE background_jobs SET status='RUNNING', startedAt=NOW(3), attempts=attempts+1, "
            "updatedAt=NOW(3) WHERE id=:id AND status='QUEUED'"), {"id": row.id})
        await session.commit()
        if res.rowcount == 0:
            return None  # another worker claimed it between SELECT and UPDATE
        return row
    finally:
        await session.close()


async def run_job(job_id: str, type_: str, tenant_id: str, payload: dict) -> dict:
    """Execute one job's handler (own session) and finalize its row."""
    outcome: dict = {"status": "SUCCEEDED", "result": None}
    session = await _session()
    try:
        handler = _HANDLERS.get(type_, _handle_generic)
        outcome["result"] = await handler(session, tenant_id, payload)

        await session.execute(text(
            "UPDATE background_jobs SET status='SUCCEEDED', finishedAt=NOW(3), result=:res, "
            "lastError=NULL, updatedAt=NOW(3) WHERE id=:id"),
            {"id": job_id, "res": json.dumps(outcome["result"], default=encode)})
        await session.commit()
    except Exception as e:  # noqa: BLE001 — worker must survive bad jobs
        outcome = {"status": "FAILED", "result": {"error": str(e)[:500]}}
        await session.rollback()
        try:
            row = (await session.execute(text(
                "SELECT attempts, maxAttempts FROM background_jobs WHERE id=:id"),
                {"id": job_id})).first()
            attempts = int(row[0]) if row else 0
            max_attempts = int(row[1]) if row else 3
            if attempts >= max_attempts:
                await session.execute(text(
                    "UPDATE background_jobs SET status='FAILED', finishedAt=NOW(3), lastError=:err, "
                    "updatedAt=NOW(3) WHERE id=:id"), {"id": job_id, "err": str(e)[:500]})
            else:
                await session.execute(text(
                    "UPDATE background_jobs SET status='QUEUED', lastError=:err, "
                    "runAt=DATE_ADD(NOW(3), INTERVAL :backoff SECOND), updatedAt=NOW(3) WHERE id=:id"),
                    {"id": job_id, "err": str(e)[:500],
                     "backoff": min(300, 2 ** attempts * 10)})
            await session.commit()
        except Exception:  # noqa: BLE001
            await session.rollback()
    finally:
        await session.close()
    return outcome


async def process_due() -> int:
    """Claim and run up to BATCH due jobs. Returns count executed."""
    WORKER["queuePolls"] += 1
    ran = 0
    for _ in range(BATCH):
        row = await claim_next()
        if not row:
            break
        payload = {}
        if row.payload:
            try:
                payload = json.loads(row.payload) if isinstance(row.payload, str) else row.payload
            except Exception:
                payload = {}
        try:
            outcome = await run_job(row.id, row.type, row.tenantId, payload)
            WORKER["processed"] += 1
            if outcome["status"] == "FAILED":
                WORKER["failed"] += 1
                WORKER["lastError"] = str(outcome["result"].get("error"))[:300]
        except Exception as e:  # noqa: BLE001
            WORKER["failed"] += 1
            WORKER["lastError"] = str(e)[:300]
        ran += 1
    return ran


# ═══════════════════════════════ scheduler passes ═══════════════════════════════

async def has_live_job(db, tenant_id: str, type_: str, ref: str | None = None) -> bool:
    """True when a QUEUED/RUNNING job of this type (optionally ref-scoped) exists."""
    if ref:
        like = f'%"{ref}"%'
        row = (await db.execute(text(
            "SELECT id FROM background_jobs WHERE tenantId=:t AND type=:ty "
            "AND status IN ('QUEUED','RUNNING') AND payload LIKE :like LIMIT 1"),
            {"t": tenant_id, "ty": type_, "like": like})).first()
    else:
        row = (await db.execute(text(
            "SELECT id FROM background_jobs WHERE tenantId=:t AND type=:ty "
            "AND status IN ('QUEUED','RUNNING') LIMIT 1"),
            {"t": tenant_id, "ty": type_})).first()
    return row is not None


async def scheduler_tick() -> dict:
    """Scan the DB for work that is *due by the clock* and enqueue it.

    Runs in its own short-lived session (commits at the end) so it can never
    hold locks while the API serves requests.
    """
    WORKER["schedulerRuns"] += 1
    enqueued: dict[str, int] = {}
    session = await _session()
    try:
        # 1. webhook events waiting on retry backoff → webhook_deliver jobs
        events = (await session.execute(text(
            "SELECT id, tenantId FROM webhook_events "
            "WHERE status='RETRYING' AND nextRetryAt IS NOT NULL AND nextRetryAt <= NOW(3) "
            "AND attemptCount < maxAttempts LIMIT 20"))).fetchall()
        for ev in events:
            if not await has_live_job(session, ev.tenantId, "webhook_deliver", ev.id):
                await enqueue(session, ev.tenantId, "webhook_deliver",
                              {"eventId": ev.id}, priority=3)
                enqueued["webhook_deliver"] = enqueued.get("webhook_deliver", 0) + 1

        # 2. due recurring expense templates → recurring_expenses per tenant
        tenants = (await session.execute(text(
            "SELECT DISTINCT tenantId FROM recurring_expenses "
            "WHERE isActive=1 AND nextRunDate <= NOW(3) "
            "AND (endDate IS NULL OR endDate >= CURDATE()) LIMIT 20"))).fetchall()
        for (tid,) in tenants:
            if not await has_live_job(session, tid, "recurring_expenses"):
                await enqueue(session, tid, "recurring_expenses", {"tenantId": tid}, priority=2)
                enqueued["recurring_expenses"] = enqueued.get("recurring_expenses", 0) + 1

        # 3. due scheduled reports → report_generate per report
        reports = (await session.execute(text(
            "SELECT id, tenantId FROM scheduled_reports "
            "WHERE isActive=1 AND nextRunAt IS NOT NULL AND nextRunAt <= NOW(3) LIMIT 20"))).fetchall()
        for rep in reports:
            if not await has_live_job(session, rep.tenantId, "report_generate", rep.id):
                await enqueue(session, rep.tenantId, "report_generate",
                              {"scheduledReportId": rep.id, "tenantId": rep.tenantId},
                              priority=2)
                enqueued["report_generate"] = enqueued.get("report_generate", 0) + 1

        # 4. per-tenant notify scheduled checks — throttled per tenant
        now = time.monotonic()
        actives = (await session.execute(text(
            "SELECT id FROM tenants WHERE status='ACTIVE' LIMIT 50"))).fetchall()
        for (tid,) in actives:
            last = _last_scheduled_check.get(tid, 0)
            if now - last >= CHECK_INTERVAL_SECONDS:
                _last_scheduled_check[tid] = now
                await enqueue(session, tid, "scheduled_check", {"tenantId": tid}, priority=6)
                enqueued["scheduled_check"] = enqueued.get("scheduled_check", 0) + 1

        # 5. Prompt 40 — automated daily FULL backup (one per 24h window, no dup)
        due_backup = (await session.execute(text(
            "SELECT id FROM background_jobs WHERE type='backup_full' "
            "AND status IN ('QUEUED','RUNNING','SUCCEEDED') "
            "AND createdAt > DATE_SUB(NOW(3), INTERVAL 24 HOUR) LIMIT 1"))).first()
        if not due_backup and actives:
            await enqueue(session, actives[0][0], "backup_full", {"tenantId": actives[0][0]},
                          priority=1, created_by="system-scheduler")
            enqueued["backup_full"] = enqueued.get("backup_full", 0) + 1

        await session.commit()
    finally:
        await session.close()
    return enqueued


# ═══════════════════════════════ handlers ═══════════════════════════════

async def _handle_webhook_deliver(db, tenant_id: str, payload: dict) -> dict:
    event_id = payload.get("eventId")
    if not event_id:
        raise ValueError("webhook_deliver requires eventId")
    from routers_webhooks import deliver_event_by_id  # lazy — avoids import cycle
    return await deliver_event_by_id(db, event_id, tenant_id)


async def _handle_recurring_expenses(db, tenant_id: str, payload: dict) -> dict:
    tid = payload.get("tenantId") or tenant_id
    due = (await db.execute(text(
        "SELECT id, name, amount, branchId, categoryId, frequency FROM recurring_expenses "
        "WHERE tenantId=:t AND isActive=1 AND nextRunDate <= NOW(3) AND "
        "(endDate IS NULL OR endDate >= CURDATE())"), {"t": tid})).fetchall()
    generated = 0
    for r in due:
        await db.execute(text(
            "INSERT INTO expenses (id, tenantId, branchId, categoryId, title, description, amount, "
            "expenseDate, paymentMethod, status, recurringExpenseId, createdBy) "
            "VALUES (UUID(), :t, :b, :c, :n, 'Auto-generated by background job queue', :a, NOW(), "
            "'BANK', 'PENDING', :rid, 'system')"),
            {"t": tid, "b": r.branchId, "c": r.categoryId, "n": r.name,
             "a": float(r.amount), "rid": r.id})
        freq = r.frequency or "MONTHLY"
        await db.execute(text(
            "UPDATE recurring_expenses SET lastGeneratedAt=NOW(3), nextRunDate=DATE_ADD(NOW(3), "
            "INTERVAL :d DAY) WHERE id=:id"),
            {"d": _FREQ_DELTA.get(freq, timedelta(days=30)).days, "id": r.id})
        generated += 1
    await db.commit()
    return {"generated": generated, "templates": len(due), "tenantId": tid}


async def _handle_report_generate(db, tenant_id: str, payload: dict) -> dict:
    rid = payload.get("scheduledReportId")
    if not rid:
        raise ValueError("report_generate requires scheduledReportId")
    row = (await db.execute(text(
        "SELECT id, tenantId, name, reportType, frequency FROM scheduled_reports "
        "WHERE id=:id AND tenantId=:t"), {"id": rid, "t": tenant_id})).first()
    if not row:
        raise ValueError(f"scheduled report {rid} not found")
    freq = row.frequency or "MONTHLY"
    await db.execute(text(
        "UPDATE scheduled_reports SET lastRunAt=NOW(3), "
        "nextRunAt=DATE_ADD(NOW(3), INTERVAL :d DAY) WHERE id=:id"),
        {"d": _FREQ_DELTA.get(freq, timedelta(days=30)).days, "id": rid})
    await db.commit()
    return {"reportType": row.reportType, "name": row.name, "generatedAt": datetime.now().isoformat()}


async def _handle_scheduled_check(db, tenant_id: str, payload: dict) -> dict:
    tid = payload.get("tenantId") or tenant_id
    import notify  # lazy — keeps module graph clean
    fired = await notify.run_scheduled_checks(db, tid)
    await db.commit()
    return {"tenantId": tid, "fired": fired.get("fired", {})}


async def _handle_notification(db, tenant_id: str, payload: dict) -> dict:
    """Write an in-app notification row (real engine table)."""
    await db.execute(text(
        "INSERT INTO inapp_notifications (id, tenantId, userId, eventType, title, body, "
        "refType, refId, isRead, createdAt) "
        "VALUES (:id, :t, :u, :et, :title, :body, :rt, :ri, 0, NOW(3))"),
        {"id": _uid(), "t": tenant_id, "u": payload.get("userId"),
         "et": payload.get("eventType", "QUEUE_NOTIFICATION"),
         "title": payload.get("title", "Notification"),
         "body": payload.get("body", ""),
         "rt": payload.get("refType"), "ri": payload.get("refId")})
    await db.commit()
    return {"channel": "IN_APP", "recipient": payload.get("userId"), "status": "SENT"}


async def _handle_outbound_channel(db, tenant_id: str, payload: dict, channel: str) -> dict:
    """email / sms / whatsapp — record an outbound attempt on notification_logs
    through the demo carrier (same table the notification engine uses)."""
    if not payload.get("address"):
        raise ValueError(f"{channel} job requires payload.address (phone/email)")
    await db.execute(text(
        "INSERT INTO notification_logs (id, tenantId, eventType, channel, recipientType, "
        "recipientId, recipientName, recipientAddress, subject, body, status, refType, refId, "
        "sentAt, createdAt) VALUES (:id, :t, :et, :ch, :rt, :ri, :rn, :ra, :sub, :body, "
        "'SENT', :ft, :fi, NOW(3), NOW(3))"),
        {"id": _uid(), "t": tenant_id, "et": payload.get("eventType", "QUEUE_MESSAGE"),
         "ch": channel, "rt": "CUSTOMER", "ri": payload.get("recipientId"),
         "rn": payload.get("recipientName"), "ra": payload["address"],
         "sub": payload.get("subject"), "body": payload.get("body"),
         "ft": payload.get("refType"), "fi": payload.get("refId")})
    await db.commit()
    return {"channel": channel, "address": payload["address"], "status": "SENT",
            "carrier": "demo-carrier"}


async def _handle_backup_full(db, tenant_id: str, payload: dict) -> dict:
    """Prompt 40 — run a FULL mysqldump backup (blocking IO → thread)."""
    import backup as backup_mod
    record = await asyncio.to_thread(
        backup_mod.run_backup, "FULL",
        "SCHEDULE" if (payload.get("source") == "scheduler") else "MANUAL")
    return {"backupId": record["id"], "fileName": record["fileName"],
            "sizeBytes": record["sizeBytes"], "tableCount": record["tableCount"],
            "checksum": record["checksum"]}


async def _handle_generic(db, tenant_id: str, payload: dict) -> dict:
    """Heavy-engine jobs (pdf_generate, import/export, sync, ai, marketplace)
    run on the same queue. Engines attach by implementing a handler here; until
    one is attached the job acknowledges receipt so the pipeline stays
    observable end-to-end."""
    return {"ack": True, "task": payload.get("task"),
            "receivedAt": datetime.now().isoformat(),
            "engine": "modular-monolith-worker"}


_HANDLERS = {
    "backup_full": _handle_backup_full,
    "webhook_deliver": _handle_webhook_deliver,
    "recurring_expenses": _handle_recurring_expenses,
    "report_generate": _handle_report_generate,
    "scheduled_check": _handle_scheduled_check,
    "notification": _handle_notification,
    "email": lambda db, t, p: _handle_outbound_channel(db, t, p, "EMAIL"),
    "sms": lambda db, t, p: _handle_outbound_channel(db, t, p, "SMS"),
    "whatsapp": lambda db, t, p: _handle_outbound_channel(db, t, p, "WHATSAPP"),
}

# ═══════════════════════════════ loop lifecycle ═══════════════════════════════

async def worker_main(stop_event: asyncio.Event) -> None:
    """Background task started by the FastAPI lifespan."""
    WORKER.update({"alive": True, "startedAt": datetime.now().isoformat(),
                   "lastHeartbeat": time.time()})
    last_sched = 0.0
    try:
        while not stop_event.is_set():
            try:
                await process_due()
                now = time.monotonic()
                if now - last_sched >= SCHEDULER_INTERVAL_SECONDS:
                    try:
                        await scheduler_tick()
                    except Exception as e:  # noqa: BLE001
                        WORKER["lastError"] = f"scheduler: {e}"
                    last_sched = now
                WORKER["lastHeartbeat"] = time.time()
            except Exception as e:  # noqa: BLE001 — keep the loop alive
                WORKER["lastError"] = str(e)[:300]
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=POLL_INTERVAL_SECONDS)
            except asyncio.TimeoutError:
                pass
    finally:
        WORKER["alive"] = False


async def start_worker() -> asyncio.Task:
    """Kick off the worker task (used by lifespan)."""
    stop_event = asyncio.Event()
    task = asyncio.create_task(worker_main(stop_event))
    task._stop_event = stop_event  # type: ignore[attr-defined]
    return task


async def stop_worker(task: asyncio.Task) -> None:
    stop_event = getattr(task, "_stop_event", None)
    if stop_event:
        stop_event.set()
    task.cancel()
    try:
        await task
    except (asyncio.CancelledError, Exception):  # noqa: BLE001
        pass
