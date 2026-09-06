"""SaaS Billing + Feature Flags + Custom Fields + Form Builder + Platform Admin (Prompt 32 / §10.1, §23, §10.36).

Platform Admin overview: tenants, subscriptions, plans, usage, limits.
Feature Flags: per-tenant module on/off.
Custom Fields: tenant-defined fields for any entity type.
Custom Form Builder: tenant-configurable forms built on custom fields.
Platform Health monitoring.
Support Tickets.
Limit enforcement at creation points.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()


def _uid() -> str:
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════════
# 1. SaaS PLANS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/plans")
async def list_plans(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM saas_plans WHERE isActive=1 ORDER BY monthlyPrice"))).fetchall())
    for r in rows:
        if isinstance(r.get("includedModules"), str):
            try: r["includedModules"] = json.loads(r["includedModules"])
            except: pass
    return ok(rows)


@router.get("/api/v1/saas/plans/{planId}")
async def get_plan(
    planId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text("SELECT * FROM saas_plans WHERE id=:id"), {"id": planId})).first()
    if not row: return err("Plan not found", 404)
    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    if isinstance(data.get("includedModules"), str):
        try: data["includedModules"] = json.loads(data["includedModules"])
        except: pass
    return ok(data)


# ═══════════════════════════════════════════════════════════════════
# 2. SUBSCRIPTIONS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/subscription")
async def get_subscription(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT s.*, p.name AS planName, p.code AS planCode, "
        "p.maxUsers, p.maxBranches, p.maxWarehouses, p.maxPOS, p.maxProducts, "
        "p.maxStorageMB, p.maxAPICallsDaily, p.maxAIQueriesDaily, p.includedModules "
        "FROM saas_subscriptions s JOIN saas_plans p ON p.id=s.planId "
        "WHERE s.tenantId=:t ORDER BY s.createdAt DESC LIMIT 1"), {"t": tenantId})).first()
    if not row:
        return ok(None)
    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    for col in ("includedModules",):
        if isinstance(data.get(col), str):
            try: data[col] = json.loads(data[col])
            except: pass
    return ok(data)


@router.post("/api/v1/saas/subscription")
async def create_subscription(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    plan_id = body.get("planId")
    if not plan_id: return err("planId required", 400)
    plan = (await db.execute(text("SELECT * FROM saas_plans WHERE id=:id AND isActive=1"), {"id": plan_id})).first()
    if not plan: return err("Plan not found", 404)

    now = datetime.utcnow()
    cycle = body.get("billingCycle", "MONTHLY").upper()
    trial_days = 14 if cycle == "MONTHLY" else 30

    sub_id = _uid()
    await db.execute(text(
        "INSERT INTO saas_subscriptions (id, tenantId, planId, billingCycle, status, "
        "trialEndsAt, currentPeriodStart, currentPeriodEnd) "
        "VALUES (:id, :t, :p, :bc, 'TRIAL', :te, :ps, :pe)"),
        {"id": sub_id, "t": tenantId, "p": plan_id, "bc": cycle,
         "te": now + timedelta(days=trial_days), "ps": now, "pe": now + timedelta(days=30)})

    # Update tenant status
    await db.execute(text("UPDATE tenants SET status='TRIAL' WHERE id=:t"), {"t": tenantId})

    # Create initial invoice
    invoice_id = _uid()
    await db.execute(text(
        "INSERT INTO saas_invoices (id, tenantId, subscriptionId, amount, status, billingPeriod) "
        "VALUES (:id, :t, :s, :a, 'PENDING', :bp)"),
        {"id": invoice_id, "t": tenantId, "s": sub_id,
         "a": float(plan[5] if isinstance(plan, tuple) else 0), "bp": cycle})
    await db.commit()
    return ok({"id": sub_id, "status": "TRIAL", "trialEndsAt": str(now + timedelta(days=trial_days))}, 201)


@router.patch("/api/v1/saas/subscription")
async def update_subscription(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    sub = (await db.execute(text(
        "SELECT * FROM saas_subscriptions WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 1"),
        {"t": tenantId})).first()
    if not sub: return err("No active subscription", 404)

    fields, params = [], {"t": tenantId}
    if "planId" in body:
        fields.append("planId=:planId"); params["planId"] = body["planId"]
    if "status" in body:
        fields.append("status=:status"); params["status"] = body["status"]
        if body["status"] == "CANCELLED":
            fields.append("cancelledAt=NOW()")
    if "billingCycle" in body:
        fields.append("billingCycle=:bc"); params["bc"] = body["billingCycle"]
    if not fields: return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")

    await db.execute(text(
        f"UPDATE saas_subscriptions SET {', '.join(fields)} WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 1"), params)
    await db.commit()
    return ok({"updated": True})


# ═══════════════════════════════════════════════════════════════════
# 3. USAGE TRACKING
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/usage")
async def get_usage(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.utcnow().strftime("%Y-%m-01")
    # Auto-calculate from actual data
    users = (await db.execute(text("SELECT COUNT(*) FROM users WHERE tenantId=:t"), {"t": tenantId})).first()[0]
    branches = (await db.execute(text("SELECT COUNT(*) FROM branches WHERE tenantId=:t"), {"t": tenantId})).first()[0]
    pos_count = (await db.execute(text("SELECT COUNT(*) FROM terminals WHERE tenantId=:t"), {"t": tenantId})).first()[0]
    products = (await db.execute(text("SELECT COUNT(*) FROM products WHERE tenantId=:t"), {"t": tenantId})).first()[0]
    transactions = (await db.execute(text(
        "SELECT COUNT(*) FROM sales WHERE tenantId=:t AND createdAt >= :d"),
        {"t": tenantId, "d": today})).first()[0]

    # Get plan limits
    sub = (await db.execute(text(
        "SELECT p.maxUsers, p.maxBranches, p.maxWarehouses, p.maxPOS, p.maxProducts "
        "FROM saas_subscriptions s JOIN saas_plans p ON p.id=s.planId "
        "WHERE s.tenantId=:t ORDER BY s.createdAt DESC LIMIT 1"), {"t": tenantId})).first()

    limits = {}
    if sub:
        limits = {"maxUsers": sub[0], "maxBranches": sub[1], "maxWarehouses": sub[2],
                  "maxPOS": sub[3], "maxProducts": sub[4]}

    return ok({
        "users": users, "branches": branches, "pos": pos_count,
        "products": products, "transactions": transactions,
        "limits": limits,
        "warnings": [
            k for k, v in [("users", users), ("branches", branches), ("pos", pos_count), ("products", products)]
            if limits.get(f"max{k.capitalize()}") and v >= limits[f"max{k.capitalize()}"] * 0.9
        ],
    })


# ═══════════════════════════════════════════════════════════════════
# 4. FEATURE FLAGS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/feature-flags")
async def list_feature_flags(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM feature_flags WHERE tenantId=:t ORDER BY moduleCode"),
        {"t": tenantId})).fetchall())
    for r in rows:
        if isinstance(r.get("config"), str):
            try: r["config"] = json.loads(r["config"])
            except: pass
    # Also list all known modules
    all_modules = [
        "POS", "INVENTORY", "ACCOUNTING", "HRM", "DELIVERY", "RESTAURANT", "SALON",
        "MANUFACTURING", "FRANCHISE", "LOYALTY", "MARKETING", "REPORTS", "AI",
        "TASKS", "APPROVALS", "NOTIFICATIONS", "SYNC", "DOCUMENTS", "INVOICING",
    ]
    flags = {f["moduleCode"]: f for f in rows}
    result = []
    for mod in all_modules:
        if mod in flags:
            result.append(flags[mod])
        else:
            result.append({"moduleCode": mod, "isEnabled": True, "config": None})
    return ok(result)


@router.patch("/api/v1/saas/feature-flags/{moduleCode}")
async def toggle_feature_flag(
    moduleCode: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    is_enabled = body.get("isEnabled", True)
    config = body.get("config")
    config_json = json.dumps(config) if isinstance(config, dict) else config

    existing = (await db.execute(text(
        "SELECT id FROM feature_flags WHERE tenantId=:t AND moduleCode=:m"),
        {"t": tenantId, "m": moduleCode.upper()})).first()

    if existing:
        await db.execute(text(
            "UPDATE feature_flags SET isEnabled=:e, config=:c, updatedAt=NOW() "
            "WHERE tenantId=:t AND moduleCode=:m"),
            {"e": 1 if is_enabled else 0, "c": config_json, "t": tenantId, "m": moduleCode.upper()})
    else:
        await db.execute(text(
            "INSERT INTO feature_flags (id, tenantId, moduleCode, isEnabled, config) "
            "VALUES (:id, :t, :m, :e, :c)"),
            {"id": _uid(), "t": tenantId, "m": moduleCode.upper(),
             "e": 1 if is_enabled else 0, "c": config_json})
    await db.commit()
    return ok({"moduleCode": moduleCode.upper(), "isEnabled": is_enabled})


def check_feature_flag(tenant_id: str, module_code: str, db) -> bool:
    """Check if a feature flag is enabled for a tenant."""
    row = db.execute(text(
        "SELECT isEnabled FROM feature_flags WHERE tenantId=:t AND moduleCode=:m"),
        {"t": tenant_id, "m": module_code.upper()}).first()
    if not row: return True  # default enabled
    return bool(row[0])


# ═══════════════════════════════════════════════════════════════════
# 5. CUSTOM FIELDS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/custom-fields")
async def list_custom_fields(
    entityType: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t AND isActive=1"
    params: dict = {"t": tenantId}
    if entityType:
        where += " AND entityType=:et"; params["et"] = entityType.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM custom_fields WHERE {where} ORDER BY entityType, displayOrder"),
        params)).fetchall())
    for r in rows:
        if isinstance(r.get("options"), str):
            try: r["options"] = json.loads(r["options"])
            except: pass
    return ok(rows)


@router.post("/api/v1/saas/custom-fields")
async def create_custom_field(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    entity_type = (body.get("entityType") or "").upper()
    field_name = body.get("fieldName")
    field_type = (body.get("fieldType") or "TEXT").upper()
    if not entity_type or not field_name:
        return err("entityType and fieldName required", 400)

    fid = _uid()
    options = body.get("options")
    options_json = json.dumps(options) if isinstance(options, list) else options

    await db.execute(text(
        "INSERT INTO custom_fields (id, tenantId, entityType, fieldName, fieldType, "
        "options, isRequired, defaultValue, displayOrder) "
        "VALUES (:id, :t, :et, :fn, :ft, :opt, :req, :dv, :do)"),
        {"id": fid, "t": tenantId, "et": entity_type, "fn": field_name,
         "ft": field_type, "opt": options_json, "req": 1 if body.get("isRequired") else 0,
         "dv": body.get("defaultValue"), "do": body.get("displayOrder", 0)})
    await db.commit()
    return ok({"id": fid}, 201)


@router.patch("/api/v1/saas/custom-fields/{fieldId}")
async def update_custom_field(
    fieldId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": fieldId, "t": tenantId}
    for col in ("fieldName", "fieldType", "isRequired", "defaultValue", "displayOrder"):
        if col in body:
            fields.append(f"{col}=:{col}"); params[col] = body[col]
    if "options" in body:
        fields.append("options=:opt"); params["opt"] = json.dumps(body["options"]) if isinstance(body["options"], list) else body["options"]
    if not fields: return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE custom_fields SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/saas/custom-fields/{fieldId}")
async def delete_custom_field(
    fieldId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text("UPDATE custom_fields SET isActive=0 WHERE id=:id AND tenantId=:t"),
                     {"id": fieldId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


# ── Custom Field Values ──

@router.get("/api/v1/saas/custom-field-values/{entityType}/{entityId}")
async def get_custom_field_values(
    entityType: str,
    entityId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT cf.fieldName, cf.fieldType, cf.options, cfv.value "
        "FROM custom_field_values cfv "
        "JOIN custom_fields cf ON cf.id=cfv.fieldId "
        "WHERE cfv.tenantId=:t AND cfv.entityType=:et AND cfv.entityId=:ei"),
        {"t": tenantId, "et": entityType.upper(), "ei": entityId})).fetchall())
    return ok(rows)


@router.post("/api/v1/saas/custom-field-values")
async def upsert_custom_field_value(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    field_id = body.get("fieldId")
    entity_type = (body.get("entityType") or "").upper()
    entity_id = body.get("entityId")
    value = body.get("value")
    if not field_id or not entity_id:
        return err("fieldId and entityId required", 400)

    existing = (await db.execute(text(
        "SELECT id FROM custom_field_values WHERE tenantId=:t AND fieldId=:f AND entityId=:e"),
        {"t": tenantId, "f": field_id, "e": entity_id})).first()

    if existing:
        await db.execute(text(
            "UPDATE custom_field_values SET value=:v, updatedAt=NOW() WHERE id=:id"),
            {"v": str(value) if value is not None else None, "id": existing[0]})
    else:
        await db.execute(text(
            "INSERT INTO custom_field_values (id, tenantId, fieldId, entityType, entityId, value) "
            "VALUES (:id, :t, :f, :et, :e, :v)"),
            {"id": _uid(), "t": tenantId, "f": field_id, "et": entity_type,
             "e": entity_id, "v": str(value) if value is not None else None})
    await db.commit()
    return ok({"saved": True})


# ═══════════════════════════════════════════════════════════════════
# 6. CUSTOM FORM BUILDER
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/form-templates")
async def list_form_templates(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM custom_form_templates WHERE tenantId=:t ORDER BY name"),
        {"t": tenantId})).fetchall())
    for r in rows:
        if isinstance(r.get("fields"), str):
            try: r["fields"] = json.loads(r["fields"])
            except: pass
    return ok(rows)


@router.post("/api/v1/saas/form-templates")
async def create_form_template(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    form_type = (body.get("formType") or "CUSTOM").upper()
    fields = body.get("fields", [])
    if not name: return err("name required", 400)

    fid = _uid()
    await db.execute(text(
        "INSERT INTO custom_form_templates (id, tenantId, name, formType, fields, createdBy) "
        "VALUES (:id, :t, :n, :ft, :f, :u)"),
        {"id": fid, "t": tenantId, "n": name, "ft": form_type,
         "f": json.dumps(fields) if isinstance(fields, list) else fields, "u": user.id})
    await db.commit()
    return ok({"id": fid}, 201)


@router.patch("/api/v1/saas/form-templates/{templateId}")
async def update_form_template(
    templateId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": templateId, "t": tenantId}
    if "name" in body:
        fields.append("name=:name"); params["name"] = body["name"]
    if "fields" in body:
        fields.append("fields=:f"); params["f"] = json.dumps(body["fields"]) if isinstance(body["fields"], list) else body["fields"]
    if not fields: return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    await db.execute(text(f"UPDATE custom_form_templates SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/saas/form-templates/{templateId}")
async def delete_form_template(
    templateId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text("DELETE FROM custom_form_templates WHERE id=:id AND tenantId=:t"),
                     {"id": templateId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


# ═══════════════════════════════════════════════════════════════════
# 7. PLATFORM ADMIN PANEL
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/platform/overview")
async def platform_overview(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide stats (admin only)."""
    tenants = (await db.execute(text("SELECT COUNT(*) FROM tenants"))).first()[0]
    active = (await db.execute(text("SELECT COUNT(*) FROM tenants WHERE status='ACTIVE'"))).first()[0]
    trial = (await db.execute(text("SELECT COUNT(*) FROM tenants WHERE status='TRIAL'"))).first()[0]
    suspended = (await db.execute(text("SELECT COUNT(*) FROM tenants WHERE status='SUSPENDED'"))).first()[0]
    total_users = (await db.execute(text("SELECT COUNT(*) FROM users"))).first()[0]
    total_branches = (await db.execute(text("SELECT COUNT(*) FROM branches"))).first()[0]
    daily_sales = (await db.execute(text(
        "SELECT COUNT(*), COALESCE(SUM(total),0) FROM sales WHERE status='CONFIRMED' "
        "AND DATE(createdAt)=CURDATE()"))).first()
    monthly_revenue = (await db.execute(text(
        "SELECT COALESCE(SUM(si.amount),0) FROM saas_invoices si "
        "WHERE si.status='PAID' AND si.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')"))).first()[0]

    return ok({
        "totalTenants": tenants, "activeTenants": active, "trialTenants": trial,
        "suspendedTenants": suspended, "totalUsers": total_users, "totalBranches": total_branches,
        "dailyTransactions": int(daily_sales[0] or 0), "dailySalesAmount": float(daily_sales[1] or 0),
        "monthlySubscriptionRevenue": float(monthly_revenue or 0),
    })


@router.get("/api/v1/saas/platform/tenants")
async def platform_tenants(
    status: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "1=1"
    params: dict = {}
    if status:
        where += " AND t.status=:s"; params["s"] = status.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT t.id, t.name, t.slug, t.status, t.businessType, t.createdAt, "
        f"(SELECT COUNT(*) FROM users u WHERE u.tenantId=t.id) AS userCount, "
        f"(SELECT COUNT(*) FROM branches b WHERE b.tenantId=t.id) AS branchCount, "
        f"(SELECT COUNT(*) FROM sales s WHERE s.tenantId=t.id AND s.status='CONFIRMED') AS saleCount "
        f"FROM tenants t WHERE {where} ORDER BY t.createdAt DESC LIMIT 100"), params)).fetchall())
    return ok(rows)


@router.get("/api/v1/saas/platform/health")
async def platform_health(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM platform_health ORDER BY checkedAt DESC LIMIT 20"))).fetchall())
    return ok(rows)


@router.post("/api/v1/saas/platform/health/check")
async def run_health_check(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Run platform health checks."""
    checks = []
    # DB check
    try:
        start = datetime.utcnow()
        (await db.execute(text("SELECT 1"))).first()
        latency = int((datetime.utcnow() - start).total_seconds() * 1000)
        status = "OK" if latency < 100 else "DEGRADED"
        await db.execute(text(
            "INSERT INTO platform_health (id, checkType, status, latencyMs) VALUES (:id, 'DATABASE', :s, :l)"),
            {"id": _uid(), "s": status, "l": latency})
        checks.append({"type": "DATABASE", "status": status, "latencyMs": latency})
    except Exception as e:
        await db.execute(text(
            "INSERT INTO platform_health (id, checkType, status, details) VALUES (:id, 'DATABASE', 'DOWN', :d)"),
            {"id": _uid(), "d": str(e)[:300]})
        checks.append({"type": "DATABASE", "status": "DOWN"})

    await db.commit()
    return ok({"checks": checks})


# ═══════════════════════════════════════════════════════════════════
# 8. SUPPORT TICKETS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/tickets")
async def list_tickets(
    status: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status=:s"; params["s"] = status.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM support_tickets WHERE {where} ORDER BY createdAt DESC LIMIT 50"), params)).fetchall())
    return ok(rows)


@router.post("/api/v1/saas/tickets")
async def create_ticket(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = _uid()
    await db.execute(text(
        "INSERT INTO support_tickets (id, tenantId, subject, description, category, priority, createdBy) "
        "VALUES (:id, :t, :sub, :desc, :cat, :pri, :u)"),
        {"id": tid, "t": tenantId, "sub": body.get("subject", ""),
         "desc": body.get("description"), "cat": body.get("category", "GENERAL"),
         "pri": (body.get("priority") or "MEDIUM").upper(), "u": user.id})
    await db.commit()
    return ok({"id": tid}, 201)


@router.patch("/api/v1/saas/tickets/{ticketId}")
async def update_ticket(
    ticketId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": ticketId, "t": tenantId}
    for col in ("status", "priority", "assignedTo"):
        if col in body:
            fields.append(f"{col}=:{col}"); params[col] = body[col]
    if not fields: return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    await db.execute(text(f"UPDATE support_tickets SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


# ═══════════════════════════════════════════════════════════════════
# 9. LIMIT ENFORCEMENT HELPER
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/saas/check-limit/{resourceType}")
async def check_limit(
    resourceType: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Check if tenant is within limits for a resource type."""
    resource_map = {
        "users": ("users", "maxUsers"),
        "branches": ("branches", "maxBranches"),
        "products": ("products", "maxProducts"),
        "pos": ("terminals", "maxPOS"),
    }
    if resourceType not in resource_map:
        return err("Unknown resource type", 400)

    table, limit_col = resource_map[resourceType]
    count = (await db.execute(text(f"SELECT COUNT(*) FROM {table} WHERE tenantId=:t"),
                              {"t": tenantId})).first()[0]
    sub = (await db.execute(text(
        f"SELECT p.{limit_col} FROM saas_subscriptions s JOIN saas_plans p ON p.id=s.planId "
        f"WHERE s.tenantId=:t ORDER BY s.createdAt DESC LIMIT 1"), {"t": tenantId})).first()
    limit = int(sub[0]) if sub else 999999
    allowed = count < limit

    return ok({"resource": resourceType, "current": count, "limit": limit, "allowed": allowed,
               "message": f"{resourceType}: {count}/{limit}"})
