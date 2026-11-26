"""Shared SaaS plan, add-on, and tenant module entitlement helpers."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Iterable

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

VERTICAL_MODULE_CODES = {
    "retail",
    "grocery",
    "pharmacy",
    "restaurant",
    "wholesale",
    "manufacturing",
    "salon",
    "repair",
    "franchise",
}

STARTER_CORE_MODULES = {
    "dashboard",
    "pos",
    "sales",
    "products",
    "inventory",
    "cashregister",
    "customers",
    "invoices",
    "payments",
    "settings",
    "tenant",
    "tasks",
    "hrm",
    "notifications",
    "documents",
    "appointments",
    "onboarding",
    "sync",
}

ADVANCE_MODULES = STARTER_CORE_MODULES | {
    "accounting",
    "vat",
    "purchases",
    "suppliers",
    "credit",
    "installments",
    "returns",
    "promotions",
    "commission",
    "targets",
    "expenses",
    "reporting",
    "delivery",
    "loyalty",
    "marketing",
}

ADDON_FLAG_CODES = {
    "ecommerce",
    "ecommerce_sync",
    "kitchen",
    "bakery",
    "sms_gateway",
    "mobile_pos",
    "multi_branch",
    "barcode_hardware",
    "customer_loyalty",
    "restaurant_kds",
    "restaurant_tables",
    "restaurant_qr_menu",
    "pharmacy_batch",
    "prescription_mgmt",
}


def normalize_plan_code(plan_code: str | None) -> str:
    code = (plan_code or "STARTER").strip().upper()
    if code in ("ADVANCE", "PRO"):
        return "BUSINESS"
    if code in ("STARTER", "BUSINESS", "ENTERPRISE"):
        return code
    return "STARTER"


def expand_addon_codes(selected_addons: Iterable[str] | None) -> set[str]:
    expanded: set[str] = set()
    for raw in selected_addons or []:
        a = str(raw).strip().lower()
        if not a:
            continue
        expanded.add(a)
        if any(k in a for k in ("restaurant", "kds", "kitchen", "table", "qr_menu")):
            expanded.add("restaurant")
        if "kds" in a or "kitchen" in a:
            expanded.add("kitchen")
        if "ecommerce" in a:
            expanded.add("ecommerce")
        if any(k in a for k in ("pharmacy", "prescription", "rx")):
            expanded.add("pharmacy")
        if any(k in a for k in ("loyalty", "cashback")):
            expanded.add("loyalty")
        if "hardware" in a or "barcode" in a:
            expanded.add("inventory")
        if "bakery" in a:
            expanded.add("bakery")
            expanded.add("manufacturing")
    return expanded


def compute_enabled_module_codes(
    business_type: str,
    plan_code: str,
    selected_addons: Iterable[str] | None = None,
    all_module_codes: Iterable[str] | None = None,
) -> set[str]:
    norm_plan = normalize_plan_code(plan_code)
    bt_code = (business_type or "RETAIL").strip().lower()
    if norm_plan == "ENTERPRISE":
        enabled = ({str(c).lower() for c in (all_module_codes or ())} - VERTICAL_MODULE_CODES) | ADVANCE_MODULES | {bt_code}
    elif norm_plan == "BUSINESS":
        enabled = set(ADVANCE_MODULES) | {bt_code}
    else:
        enabled = set(STARTER_CORE_MODULES) | {bt_code}

    enabled |= expand_addon_codes(selected_addons)
    return enabled


async def sync_tenant_modules(
    db: AsyncSession,
    tenant_id: str,
    business_type: str,
    plan_code: str,
    selected_addons: Iterable[str] | None = None,
) -> set[str]:
    """Synchronize tenant_modules and add-on feature_flags for a tenant."""
    mods = (await db.execute(text("SELECT id, code FROM modules"))).fetchall()
    all_codes = {m[1].lower() for m in mods}
    enabled_set = compute_enabled_module_codes(business_type, plan_code, selected_addons, all_codes)

    existing_rows = (
        await db.execute(
            text("SELECT id, moduleId FROM tenant_modules WHERE tenantId = :t"),
            {"t": tenant_id},
        )
    ).fetchall()
    existing_by_mod = {r[1]: r[0] for r in existing_rows}

    for mod_id, mod_code in mods:
        is_en = 1 if mod_code.lower() in enabled_set else 0
        if mod_id in existing_by_mod:
            await db.execute(
                text(
                    "UPDATE tenant_modules SET isEnabled = :en, updatedAt = NOW(3) "
                    "WHERE id = :id"
                ),
                {"id": existing_by_mod[mod_id], "en": is_en},
            )
        else:
            await db.execute(
                text(
                    "INSERT INTO tenant_modules (id, tenantId, moduleId, isEnabled, createdAt, updatedAt) "
                    "VALUES (:id, :t, :m, :en, NOW(3), NOW(3))"
                ),
                {"id": str(uuid.uuid4()), "t": tenant_id, "m": mod_id, "en": is_en},
            )

    extra_addons = enabled_set - all_codes
    for addon_code in sorted(extra_addons):
        flag_code = addon_code.upper()
        existing_flag = (
            await db.execute(
                text("SELECT id FROM feature_flags WHERE tenantId = :t AND moduleCode = :m LIMIT 1"),
                {"t": tenant_id, "m": flag_code},
            )
        ).first()
        if existing_flag:
            await db.execute(
                text("UPDATE feature_flags SET isEnabled = 1, updatedAt = NOW() WHERE id = :id"),
                {"id": existing_flag[0]},
            )
        else:
            await db.execute(
                text(
                    "INSERT INTO feature_flags (id, tenantId, moduleCode, isEnabled) "
                    "VALUES (:id, :t, :m, 1)"
                ),
                {"id": str(uuid.uuid4()), "t": tenant_id, "m": flag_code},
            )

    return enabled_set


async def get_tenant_subscription_payload(
    db: AsyncSession,
    tenant_id: str,
    business_type_fallback: str = "RETAIL",
) -> dict:
    """Fetch unified subscription, limits, and enabled modules payload for auth & SaaS APIs."""
    t_row = (
        await db.execute(
            text("SELECT businessType, status FROM tenants WHERE id = :t LIMIT 1"),
            {"t": tenant_id},
        )
    ).first()
    business_type = (t_row.businessType if t_row and t_row.businessType else business_type_fallback).upper()

    sub_row = (
        await db.execute(
            text("""
                SELECT s.id, s.status, s.billingCycle, s.trialEndsAt, s.currentPeriodStart, s.currentPeriodEnd,
                       p.id AS planId, p.code AS planCode, p.name AS planName,
                       p.monthlyPrice, p.yearlyPrice,
                       p.maxUsers, p.maxBranches, p.maxWarehouses, p.maxPOS, p.maxProducts,
                       p.maxStorageMB, p.maxAPICallsDaily, p.maxAIQueriesDaily
                FROM saas_subscriptions s
                JOIN saas_plans p ON p.id = s.planId
                WHERE s.tenantId = :t
                ORDER BY s.createdAt DESC LIMIT 1
            """),
            {"t": tenant_id},
        )
    ).first()

    if not sub_row:
        starter_plan = (
            await db.execute(
                text("""
                    SELECT id, code, name, monthlyPrice, yearlyPrice,
                           maxUsers, maxBranches, maxWarehouses, maxPOS, maxProducts,
                           maxStorageMB, maxAPICallsDaily, maxAIQueriesDaily
                    FROM saas_plans WHERE code = 'STARTER' LIMIT 1
                """)
            )
        ).first()
        plan_code = starter_plan.code if starter_plan else "STARTER"
        plan_name = starter_plan.name if starter_plan else "Starter"
        limits = {
            "maxUsers": starter_plan.maxUsers if starter_plan else 5,
            "maxBranches": starter_plan.maxBranches if starter_plan else 1,
            "maxWarehouses": starter_plan.maxWarehouses if starter_plan else 1,
            "maxPOS": starter_plan.maxPOS if starter_plan else 2,
            "maxProducts": starter_plan.maxProducts if starter_plan else 1000,
            "maxStorageMB": starter_plan.maxStorageMB if starter_plan else 500,
            "maxAPICallsDaily": starter_plan.maxAPICallsDaily if starter_plan else 10000,
            "maxAIQueriesDaily": starter_plan.maxAIQueriesDaily if starter_plan else 50,
        }
        monthly_price = float(starter_plan.monthlyPrice or 990) if starter_plan else 990.0
        yearly_price = float(starter_plan.yearlyPrice or 9900) if starter_plan else 9900.0
        sub_meta = {
            "id": None,
            "planCode": plan_code,
            "planName": plan_name,
            "status": t_row.status if t_row and t_row.status else "ACTIVE",
            "billingCycle": "MONTHLY",
            "trialEndsAt": None,
            "currentPeriodStart": None,
            "currentPeriodEnd": None,
            "monthlyPrice": monthly_price,
            "yearlyPrice": yearly_price,
        }
    else:
        limits = {
            "maxUsers": sub_row.maxUsers,
            "maxBranches": sub_row.maxBranches,
            "maxWarehouses": sub_row.maxWarehouses,
            "maxPOS": sub_row.maxPOS,
            "maxProducts": sub_row.maxProducts,
            "maxStorageMB": sub_row.maxStorageMB,
            "maxAPICallsDaily": sub_row.maxAPICallsDaily,
            "maxAIQueriesDaily": sub_row.maxAIQueriesDaily,
        }
        exp_dt = sub_row.currentPeriodEnd or sub_row.trialEndsAt
        is_expired = bool(exp_dt and exp_dt <= datetime.utcnow()) or (sub_row.status or "").upper() == "EXPIRED"
        effective_status = "EXPIRED" if is_expired else sub_row.status
        sub_meta = {
            "id": sub_row.id,
            "planCode": sub_row.planCode,
            "planName": sub_row.planName,
            "status": effective_status,
            "isExpired": is_expired,
            "billingCycle": sub_row.billingCycle or "MONTHLY",
            "trialEndsAt": str(sub_row.trialEndsAt) if sub_row.trialEndsAt else None,
            "currentPeriodStart": str(sub_row.currentPeriodStart) if sub_row.currentPeriodStart else None,
            "currentPeriodEnd": str(sub_row.currentPeriodEnd) if sub_row.currentPeriodEnd else None,
            "monthlyPrice": float(sub_row.monthlyPrice or 0),
            "yearlyPrice": float(sub_row.yearlyPrice or 0),
        }

    mod_rows = (
        await db.execute(
            text("""
                SELECT m.code
                FROM tenant_modules tm
                JOIN modules m ON m.id = tm.moduleId
                WHERE tm.tenantId = :t AND tm.isEnabled = 1
            """),
            {"t": tenant_id},
        )
    ).fetchall()
    enabled_mods = {m[0].lower() for m in mod_rows if m[0]}

    flag_rows = (
        await db.execute(
            text("SELECT moduleCode FROM feature_flags WHERE tenantId = :t AND isEnabled = 1"),
            {"t": tenant_id},
        )
    ).fetchall()
    for f in flag_rows:
        fc = (f[0] or "").strip().lower()
        if fc in ADDON_FLAG_CODES:
            enabled_mods |= expand_addon_codes([fc])

    # If plan is Starter and tenant_modules were legacy-seeded with every vertical/enterprise module,
    # clamp vertical & plan-gated modules unless explicitly granted via feature_flags or higher plan.
    norm_plan = normalize_plan_code(sub_meta["planCode"])
    if norm_plan != "ENTERPRISE":
        allowed_by_plan = compute_enabled_module_codes(business_type, norm_plan)
        explicit_flags = {
            (f[0] or "").strip().lower()
            for f in flag_rows
            if (f[0] or "").strip().lower() in ADDON_FLAG_CODES
        }
        allowed_mods = allowed_by_plan | expand_addon_codes(explicit_flags)
        enabled_mods = enabled_mods & allowed_mods

    return {
        **sub_meta,
        "businessType": business_type,
        "limits": limits,
        "enabledModules": sorted(enabled_mods),
    }
