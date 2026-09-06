"""Audit Trail System (Prompt 38, §17).

Comprehensive audit logging for all critical business actions.
Plus security event logging and security middleware integration.
"""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

AUDIT_ACTIONS = [
    "CREATE", "UPDATE", "DELETE", "VIEW", "APPROVE", "REJECT", "VOID",
    "EXPORT", "IMPORT", "LOGIN", "LOGOUT", "ADJUST", "TRANSFER",
    "PRICE_CHANGE", "DISCOUNT", "REFUND", "PAYMENT", "CREDIT",
]

ENTITY_TYPES = [
    "SALE", "INVOICE", "PRODUCT", "STOCK", "CUSTOMER", "SUPPLIER",
    "EMPLOYEE", "ORDER", "DELIVERY", "PAYMENT", "EXPENSE", "QUOTATION",
    "COMMISSION", "INSTALLMENT", "SHIFT", "USER", "SETTING", "TAX",
]


def _uid() -> str:
    return uuid.uuid4().hex[:20]


# ═══════════════ AUDIT INGEST ═══════════════

@router.post("/api/v1/audit/ingest")
async def ingest_audit_logs(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Bulk ingest audit logs."""
    logs = body.get("logs", [])
    inserted = 0
    for entry in logs:
        entry.setdefault("tenantId", tenantId)
        entry.setdefault("userId", str(user.id) if hasattr(user, "id") else None)
        # Map our entry fields to actual DB columns
        entity = entry.get("entityType", entry.get("entity", "UNKNOWN"))
        old_val = entry.get("oldValue", entry.get("oldValues"))
        new_val = entry.get("newValue", entry.get("newValues"))
        data_field = entry.get("data")
        # Merge data into newValues if no explicit newValues
        if data_field and not new_val:
            new_val = data_field
        await db.execute(text(
            "INSERT INTO audit_logs (id, tenantId, userId, action, entity, entityId, "
            "oldValues, newValues, ipAddress, reason) "
            "VALUES (:id, :t, :u, :a, :e, :eid, :ov, :nv, :ip, :reason)"),
            {"id": _uid(), "t": entry.get("tenantId"), "u": entry.get("userId"),
             "a": entry.get("action", "CREATE"), "e": entity,
             "eid": entry.get("entityId"),
             "ov": json.dumps(old_val) if old_val else None,
             "nv": json.dumps(new_val) if new_val else None,
             "ip": entry.get("ipAddress"),
             "reason": entry.get("reason")})
        inserted += 1
    await db.commit()
    return ok({"inserted": inserted})


async def log_audit(
    db, tenant_id, action, entity_type, entity_id,
    old_value=None, new_value=None, ip=None, user_id=None,
    reason=None,
):
    """Internal helper: write a single audit log entry."""
    await db.execute(text(
        "INSERT INTO audit_logs (id, tenantId, userId, action, entity, entityId, "
        "oldValues, newValues, ipAddress, reason) "
        "VALUES (:id, :t, :u, :a, :e, :eid, :ov, :nv, :ip, :reason)"),
        {"id": _uid(), "t": tenant_id, "u": user_id, "a": action, "e": entity_type,
         "eid": entity_id, "ov": json.dumps(old_value) if old_value else None,
         "nv": json.dumps(new_value) if new_value else None,
         "ip": ip, "reason": reason})


# ═══════════════ AUDIT QUERY ═══════════════

@router.get("/api/v1/audit/logs")
async def list_audit_logs(
    entityType: str = "",
    entityId: str = "",
    action: str = "",
    userId: str = "",
    tenantId: str = "",
    limit: int = 100,
    user: AuthUser = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    where = "1=1"
    params: dict = {"lim": min(limit, 500)}
    if tenantId:
        where += " AND tenantId=:t"; params["t"] = tenantId
    if entityType:
        where += " AND entity=:et"; params["et"] = entityType.upper()
    if entityId:
        where += " AND entityId=:eid"; params["eid"] = entityId
    if action:
        where += " AND action=:a"; params["a"] = action.upper()
    if userId:
        where += " AND userId=:u"; params["u"] = userId

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM audit_logs WHERE {where} ORDER BY createdAt DESC LIMIT :lim"),
        params)).fetchall())
    for r in rows:
        for f in ("oldValues", "newValues", "data"):
            if isinstance(r.get(f), str):
                try: r[f] = json.loads(r[f])
                except: pass
    return ok(rows)


@router.get("/api/v1/audit/logs/entity/{entityType}/{entityId}")
async def entity_audit_trail(
    entityType: str,
    entityId: str,
    limit: int = Query(50),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM audit_logs WHERE tenantId=:t AND entity=:et AND entityId=:eid "
        "ORDER BY createdAt DESC LIMIT :lim"),
        {"t": tenantId, "et": entityType.upper(), "eid": entityId,
         "lim": min(limit, 200)})).fetchall())
    for r in rows:
        for f in ("oldValues", "newValues"):
            if isinstance(r.get(f), str):
                try: r[f] = json.loads(r[f])
                except: pass
    return ok(rows)


@router.get("/api/v1/audit/stats")
async def audit_stats(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(text(
        "SELECT COUNT(*) FROM audit_logs WHERE tenantId=:t"),
        {"t": tenantId})).scalar() or 0
    today = (await db.execute(text(
        "SELECT COUNT(*) FROM audit_logs WHERE tenantId=:t AND DATE(createdAt)=CURDATE()"),
        {"t": tenantId})).scalar() or 0
    by_entity = rows_to_dicts((await db.execute(text(
        "SELECT entity AS entityType, COUNT(*) AS count FROM audit_logs WHERE tenantId=:t "
        "GROUP BY entity ORDER BY count DESC LIMIT 10"),
        {"t": tenantId})).fetchall())
    return ok({"total": total, "today": today, "byEntity": by_entity})


@router.get("/api/v1/audit/reports/activity")
async def activity_report(
    days: int = 30,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(text(
        "SELECT COUNT(*) FROM audit_logs WHERE tenantId=:t "
        "AND createdAt >= DATE_SUB(NOW(), INTERVAL :d DAY)"),
        {"t": tenantId, "d": days})).scalar() or 0
    by_action = rows_to_dicts((await db.execute(text(
        "SELECT action, COUNT(*) AS count FROM audit_logs "
        "WHERE tenantId=:t AND createdAt >= DATE_SUB(NOW(), INTERVAL :d DAY) "
        "GROUP BY action ORDER BY count DESC LIMIT 20"),
        {"t": tenantId, "d": days})).fetchall())
    by_entity = rows_to_dicts((await db.execute(text(
        "SELECT entity AS entityType, COUNT(*) AS count FROM audit_logs "
        "WHERE tenantId=:t AND createdAt >= DATE_SUB(NOW(), INTERVAL :d DAY) "
        "GROUP BY entity ORDER BY count DESC LIMIT 20"),
        {"t": tenantId, "d": days})).fetchall())
    return ok({"totalActions": total, "byAction": by_action, "byEntity": by_entity})


@router.get("/api/v1/audit/reports/user")
async def user_audit_report(
    userId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    if not userId:
        userId = str(user.id) if hasattr(user, "id") else "0"
    total = (await db.execute(text(
        "SELECT COUNT(*) FROM audit_logs WHERE tenantId=:t AND userId=:u"),
        {"t": tenantId, "u": userId})).scalar() or 0
    by_action = rows_to_dicts((await db.execute(text(
        "SELECT action, COUNT(*) AS count FROM audit_logs WHERE tenantId=:t AND userId=:u "
        "GROUP BY action ORDER BY count DESC LIMIT 20"),
        {"t": tenantId, "u": userId})).fetchall())
    return ok({"userId": userId, "totalActions": total, "byAction": by_action})


@router.post("/api/v1/audit/undo")
async def undo_audit(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    log_id = body.get("logId", "")
    row = (await db.execute(text(
        "SELECT * FROM audit_logs WHERE id=:id AND tenantId=:t"),
        {"id": log_id, "t": tenantId})).first()
    if not row:
        return err("Audit log not found", 404)
    return ok({"message": "Undo requested", "logId": log_id})


@router.get("/api/v1/audit/actions")
async def list_actions():
    return ok(AUDIT_ACTIONS)


@router.get("/api/v1/audit/entity-types")
async def list_entity_types():
    return ok(ENTITY_TYPES)


# ═══════════════ SECURITY EVENTS ═══════════════

@router.post("/api/v1/security/ingest")
async def ingest_security_events(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    events = body.get("events", [])
    inserted = 0
    for ev in events:
        ev.setdefault("tenantId", tenantId)
        await db.execute(text(
            "INSERT INTO security_events (id, tenantId, userId, eventType, severity, ipAddress, "
            "userAgent, endpoint, details) "
            "VALUES (:id, :t, :u, :et, :sev, :ip, :ua, :ep, :d)"),
            {"id": _uid(), "t": ev.get("tenantId"), "u": ev.get("userId"),
             "et": ev.get("eventType", "SUSPICIOUS_ACTIVITY"),
             "sev": ev.get("severity", "LOW"),
             "ip": ev.get("ipAddress"), "ua": ev.get("userAgent"),
             "ep": ev.get("endpoint"),
             "d": json.dumps(ev.get("details")) if ev.get("details") else None})
        inserted += 1
    await db.commit()
    return ok({"inserted": inserted})


async def log_security_event(
    db, event_type, ip_address=None, user_agent=None,
    user_id=None, tenant_id=None, endpoint=None,
    details=None, blocked=False, severity="LOW",
):
    await db.execute(text(
        "INSERT INTO security_events (id, tenantId, eventType, severity, ipAddress, "
        "userAgent, userId, endpoint, details) "
        "VALUES (:id, :t, :et, :sev, :ip, :ua, :u, :ep, :d)"),
        {"id": _uid(), "t": tenant_id, "et": event_type, "sev": severity,
         "ip": ip_address, "ua": user_agent, "u": user_id,
         "ep": endpoint, "d": json.dumps(details) if details else None})


@router.get("/api/v1/security/events")
async def list_security_events(
    eventType: str = "",
    severity: str = "",
    blocked: str = "",
    tenantId: str = "",
    limit: int = 100,
    user: AuthUser = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    where = "1=1"
    params: dict = {"lim": min(limit, 500)}
    if tenantId:
        where += " AND (tenantId=:t OR tenantId IS NULL)"; params["t"] = tenantId
    if eventType:
        where += " AND eventType=:et"; params["et"] = eventType.upper()
    if severity:
        where += " AND severity=:sev"; params["sev"] = severity.upper()
    if blocked:
        where += " AND blocked=:b"; params["b"] = 1 if blocked == "true" else 0

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM security_events WHERE {where} ORDER BY createdAt DESC LIMIT :lim"),
        params)).fetchall())
    for r in rows:
        if isinstance(r.get("details"), str):
            try: r["details"] = json.loads(r["details"])
            except: pass
    return ok(rows)


@router.get("/api/v1/security/stats")
async def security_stats(
    days: int = 30,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t"),
        {"t": tenantId})).scalar() or 0
    blocked = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t AND blocked=1"),
        {"t": tenantId})).scalar() or 0
    critical = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t AND severity='CRITICAL'"),
        {"t": tenantId})).scalar() or 0
    failed_logins = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t AND eventType='LOGIN_FAILED'"),
        {"t": tenantId})).scalar() or 0
    return ok({"totalEvents": total, "blocked": blocked, "critical": critical, "failedLogins": failed_logins})


@router.get("/api/v1/security/health")
async def security_health(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t"),
        {"t": tenantId})).scalar() or 0
    critical = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t AND severity='CRITICAL'"),
        {"t": tenantId})).scalar() or 0
    failed = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t AND eventType='LOGIN_FAILED'"),
        {"t": tenantId})).scalar() or 0
    injections = (await db.execute(text(
        "SELECT COUNT(*) FROM security_events WHERE tenantId=:t AND eventType='SQL_INJECTION_ATTEMPT'"),
        {"t": tenantId})).scalar() or 0

    risk_level = "LOW"
    if critical > 0 or injections > 0:
        risk_level = "HIGH"
    elif failed > 5 or total > 100:
        risk_level = "MEDIUM"

    recommendations = []
    if failed > 10:
        recommendations.append("Review failed login patterns — possible brute force attack")
    if injections > 0:
        recommendations.append("SQL injection attempts detected — review WAF rules")
    if critical > 0:
        recommendations.append(f"{critical} critical security events require immediate attention")
    if not recommendations:
        recommendations.append("No immediate actions needed")

    return ok({
        "riskLevel": risk_level,
        "totalEvents": total,
        "criticalEvents": critical,
        "failedLogins": failed,
        "injectionAttempts": injections,
        "recommendations": recommendations,
    })


@router.get("/api/v1/security/event-types")
async def security_event_types():
    return ok([
        "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT",
        "RATE_LIMIT", "SQL_INJECTION_ATTEMPT", "XSS_ATTEMPT",
        "IDOR_ATTEMPT", "TENANT_ESCAPE_ATTEMPT", "PRIVILEGE_ESCALATION",
        "INVALID_TOKEN", "EXPIRED_TOKEN", "SESSION_HIJACK",
        "FILE_UPLOAD_VIOLATION", "CSRF_ATTEMPT", "SUSPICIOUS_ACTIVITY",
    ])
