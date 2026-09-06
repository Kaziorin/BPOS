"""Tax Engine router (Prompt 17) — tax rates, tax rules, VAT reports, customer/supplier VAT info.

⚠️ DISCLAIMER (§10.21):
  All production VAT/NBR workflows and Mushak forms must be reviewed against
  the currently applicable regulations by a qualified Bangladesh VAT professional
  before production deployment. Tax rules must never be hard-coded into core
  business logic.
"""
from __future__ import annotations

import json as _json
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import tax as tax_engine
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()


def _uuid():
    import uuid
    return str(uuid.uuid4())


# ═════════════════════════ TAX RATES ═════════════════════════

@router.get("/api/v1/tax/rates")
async def list_tax_rates(
    status: str = "",
    user: AuthUser = Depends(require_permission("settings.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId = :t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status = :st"
        params["st"] = status
    rows = rows_to_dicts(
        (await db.execute(
            text(f"SELECT * FROM tax_rates WHERE {where} ORDER BY isDefault DESC, rate DESC, name"),
            params,
        )).fetchall()
    )
    return ok(rows)


@router.post("/api/v1/tax/rates")
async def create_tax_rate(
    body: dict,
    user: AuthUser = Depends(require_permission("settings.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    code = body.get("code")
    rate = body.get("rate")
    if not name or not code:
        return err("name and code are required", 400)
    if rate is None:
        return err("rate is required", 400)

    dup = (
        await db.execute(
            text("SELECT id FROM tax_rates WHERE tenantId = :t AND code = :c"),
            {"t": tenantId, "c": code},
        )
    ).first()
    if dup:
        return err(f"Tax rate with code '{code}' already exists", 409)

    eff_from = body.get("effectiveFrom") or str(date.today())

    async with txn(db):
        rate_id = _uuid()
        await db.execute(
            text(
                "INSERT INTO tax_rates "
                "(id, tenantId, name, code, rate, rateType, taxInclusive, effectiveFrom, effectiveTo, "
                "isActive, isDefault, description, status, createdBy) "
                "VALUES (:id, :t, :n, :c, :r, :rt, :ti, :ef, :et, :ia, :id2, :d, 'ACTIVE', :u)"
            ),
            {
                "id": rate_id,
                "t": tenantId,
                "n": name,
                "c": code,
                "r": float(rate),
                "rt": body.get("rateType", "PERCENTAGE"),
                "ti": 1 if body.get("taxInclusive") else 0,
                "ef": eff_from,
                "et": body.get("effectiveTo"),
                "ia": 1 if body.get("isActive", True) else 0,
                "id2": 1 if body.get("isDefault") else 0,
                "d": body.get("description"),
                "u": user.id,
            },
        )
        # If this is the default, unset others
        if body.get("isDefault"):
            await db.execute(
                text("UPDATE tax_rates SET isDefault = 0 WHERE tenantId = :t AND id != :id"),
                {"t": tenantId, "id": rate_id},
            )
    return ok({"id": rate_id, "name": name, "code": code, "rate": float(rate)}, 201)


@router.put("/api/v1/tax/rates/{rateId}")
async def update_tax_rate(
    rateId: str,
    body: dict,
    user: AuthUser = Depends(require_permission("settings.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    exists = (
        await db.execute(
            text("SELECT id FROM tax_rates WHERE id = :id AND tenantId = :t"),
            {"id": rateId, "t": tenantId},
        )
    ).first()
    if not exists:
        return err("Tax rate not found", 404)

    allowed = {
        "name": "name", "rate": "rate", "rateType": "rateType", "taxInclusive": "taxInclusive",
        "effectiveFrom": "effectiveFrom", "effectiveTo": "effectiveTo", "isActive": "isActive",
        "isDefault": "isDefault", "description": "description", "status": "status",
    }
    sets, params = [], {"id": rateId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body:
            val = body[jk]
            if jk == "rate":
                val = float(val)
            elif jk in ("taxInclusive", "isActive", "isDefault"):
                val = 1 if val else 0
            sets.append(f"{ck} = :{ck}")
            params[ck] = val

    if not sets:
        return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    await db.execute(text(f"UPDATE tax_rates SET {', '.join(sets)} WHERE id = :id AND tenantId = :t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/tax/rates/{rateId}")
async def delete_tax_rate(
    rateId: str,
    user: AuthUser = Depends(require_permission("settings.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    # Check if any tax rule references this rate
    used = (
        await db.execute(
            text("SELECT COUNT(*) FROM tax_rules WHERE taxRateId = :id"),
            {"id": rateId},
        )
    ).first()
    if used[0] > 0:
        return err("Cannot delete — this rate is used by tax rules. Deactivate instead.", 400)

    res = await db.execute(
        text("DELETE FROM tax_rates WHERE id = :id AND tenantId = :t"),
        {"id": rateId, "t": tenantId},
    )
    await db.commit()
    if res.rowcount == 0:
        return err("Tax rate not found", 404)
    return ok({"deleted": True})


# ═════════════════════════ TAX RULES ═════════════════════════

@router.get("/api/v1/tax/rules")
async def list_tax_rules(
    user: AuthUser = Depends(require_permission("settings.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (await db.execute(
            text(
                "SELECT tr.*, tr2.name AS rateName, tr2.code AS rateCode, tr2.rate, tr2.rateType "
                "FROM tax_rules tr "
                "JOIN tax_rates tr2 ON tr2.id = tr.taxRateId "
                "WHERE tr.tenantId = :t "
                "ORDER BY tr.priority DESC, tr.createdAt DESC"
            ),
            {"t": tenantId},
        )).fetchall()
    )
    for r in rows:
        r["rate"] = {
            "id": r.pop("taxRateId"),
            "name": r.pop("rateName"),
            "code": r.pop("rateCode"),
            "rate": float(r.pop("rate")),
            "rateType": r.pop("rateType"),
        }
    return ok(rows)


@router.post("/api/v1/tax/rules")
async def create_tax_rule(
    body: dict,
    user: AuthUser = Depends(require_permission("settings.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    taxRateId = body.get("taxRateId")
    if not name or not taxRateId:
        return err("name and taxRateId are required", 400)

    # Verify rate exists
    rate = (
        await db.execute(
            text("SELECT id FROM tax_rates WHERE id = :id AND tenantId = :t"),
            {"id": taxRateId, "t": tenantId},
        )
    ).first()
    if not rate:
        return err("Tax rate not found", 404)

    async with txn(db):
        rule_id = _uuid()
        await db.execute(
            text(
                "INSERT INTO tax_rules "
                "(id, tenantId, name, description, ruleType, taxRateId, appliesTo, priority, isActive, createdBy) "
                "VALUES (:id, :t, :n, :d, :rt, :tr, :at, :p, :ia, :u)"
            ),
            {
                "id": rule_id,
                "t": tenantId,
                "n": name,
                "d": body.get("description"),
                "rt": body.get("ruleType", "STANDARD"),
                "tr": taxRateId,
                "at": body.get("appliesTo", "BOTH"),
                "p": body.get("priority", 0),
                "ia": 1 if body.get("isActive", True) else 0,
                "u": user.id,
            },
        )
        # Save version 1
        await db.execute(
            text(
                "INSERT INTO tax_rule_versions "
                "(id, tenantId, taxRuleId, version, name, ruleType, taxRateId, appliesTo, "
                "effectiveFrom, snapshot, changedBy) "
                "VALUES (:id, :t, :tr, 1, :n, :rt, :trr, :at, COALESCE(:ef, CURDATE()), :snap, :u)"
            ),
            {
                "id": _uuid(),
                "t": tenantId,
                "tr": rule_id,
                "n": name,
                "rt": body.get("ruleType", "STANDARD"),
                "trr": taxRateId,
                "at": body.get("appliesTo", "BOTH"),
                "ef": body.get("effectiveFrom"),
                "snap": _json.dumps({"name": name, "rateId": taxRateId, "ruleType": body.get("ruleType", "STANDARD")}),
                "u": user.id,
            },
        )
    return ok({"id": rule_id, "name": name}, 201)


@router.put("/api/v1/tax/rules/{ruleId}")
async def update_tax_rule(
    ruleId: str,
    body: dict,
    user: AuthUser = Depends(require_permission("settings.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    exists = (
        await db.execute(
            text("SELECT id, name, ruleType, taxRateId, appliesTo FROM tax_rules WHERE id = :id AND tenantId = :t"),
            {"id": ruleId, "t": tenantId},
        )
    ).first()
    if not exists:
        return err("Tax rule not found", 404)

    # Get current version number
    ver = (
        await db.execute(
            text("SELECT COALESCE(MAX(version), 0) FROM tax_rule_versions WHERE taxRuleId = :id"),
            {"id": ruleId},
        )
    ).first()
    new_ver = int(ver[0]) + 1

    allowed = {"name": "name", "description": "description", "ruleType": "ruleType",
               "taxRateId": "taxRateId", "appliesTo": "appliesTo", "priority": "priority", "isActive": "isActive"}
    sets, params = [], {"id": ruleId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body:
            sets.append(f"{ck} = :{ck}")
            params[ck] = body[jk] if jk != "isActive" else (1 if body[jk] else 0)

    if not sets:
        return err("Nothing to update", 400)

    async with txn(db):
        sets.append("updatedBy = :u")
        await db.execute(text(f"UPDATE tax_rules SET {', '.join(sets)} WHERE id = :id AND tenantId = :t"), params)
        # Save version
        snap = {k: body[k] for k in body if k in ("name", "ruleType", "taxRateId", "appliesTo", "priority", "isActive")}
        await db.execute(
            text(
                "INSERT INTO tax_rule_versions "
                "(id, tenantId, taxRuleId, version, name, ruleType, taxRateId, appliesTo, "
                "effectiveFrom, snapshot, changedBy) "
                "VALUES (:id, :t, :tr, :v, :n, :rt, :trr, :at, COALESCE(:ef, CURDATE()), :snap, :u)"
            ),
            {
                "id": _uuid(),
                "t": tenantId,
                "tr": ruleId,
                "v": new_ver,
                "n": body.get("name", exists[1]),
                "rt": body.get("ruleType", exists[2]),
                "trr": body.get("taxRateId", exists[3]),
                "at": body.get("appliesTo", exists[4]),
                "ef": body.get("effectiveFrom"),
                "snap": _json.dumps(snap),
                "u": user.id,
            },
        )
    return ok({"updated": True, "version": new_ver})


@router.delete("/api/v1/tax/rules/{ruleId}")
async def delete_tax_rule(
    ruleId: str,
    user: AuthUser = Depends(require_permission("settings.edit")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        text("DELETE FROM tax_rules WHERE id = :id AND tenantId = :t"),
        {"id": ruleId, "t": tenantId},
    )
    await db.commit()
    if res.rowcount == 0:
        return err("Tax rule not found", 404)
    return ok({"deleted": True})


@router.get("/api/v1/tax/rules/{ruleId}/versions")
async def tax_rule_versions(
    ruleId: str,
    user: AuthUser = Depends(require_permission("settings.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (await db.execute(
            text(
                "SELECT * FROM tax_rule_versions "
                "WHERE tenantId = :t AND taxRuleId = :tr "
                "ORDER BY version DESC"
            ),
            {"t": tenantId, "tr": ruleId},
        )).fetchall()
    )
    return ok(rows)


# ═════════════════════════ RESOLVE TAX (for POS/Invoice) ═════════════════════════

@router.get("/api/v1/tax/resolve")
async def resolve_tax(
    appliesTo: str = "BOTH",
    effective_date: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Resolve the active tax rate for the tenant — called by frontend POS/Invoice."""
    eff = date.fromisoformat(effective_date) if effective_date else date.today()
    rule = await tax_engine.resolve_tax_rate(db, tenantId, appliesTo=appliesTo, effective_date=eff)
    if not rule:
        return ok({"rule": None, "message": "No active tax rule — tax will be 0%"})
    return ok({"rule": rule})


@router.post("/api/v1/tax/calculate")
async def calculate_tax(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Calculate tax for a given amount — called by frontend POS/Invoice."""
    amount = float(body.get("amount", 0) or 0)
    appliesTo = body.get("appliesTo", "BOTH")
    taxRuleId = body.get("taxRuleId")

    rule = await tax_engine.resolve_tax_rate(db, tenantId, appliesTo=appliesTo, taxRuleId=taxRuleId)
    if not rule:
        return ok({
            "taxableAmount": amount, "taxRate": 0, "taxAmount": 0,
            "totalWithTax": amount, "rule": None,
        })

    result = tax_engine.calculate_tax(
        amount, rule["rate"],
        tax_inclusive=rule["taxInclusive"],
        rate_type=rule["rateType"],
    )
    result["rule"] = rule
    return ok(result)


# ═════════════════════════ VAT REPORTS ═════════════════════════

@router.get("/api/v1/tax/reports/sales-vat")
async def report_sales_vat(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    branchId: str = "",
    user: AuthUser = Depends(require_permission("accounting.pnl.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    report = await tax_engine.sales_vat_report(db, tenantId, year=year, month=month, branchId=branchId or None)
    return ok(report)


@router.get("/api/v1/tax/reports/purchase-vat")
async def report_purchase_vat(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    branchId: str = "",
    user: AuthUser = Depends(require_permission("accounting.pnl.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    report = await tax_engine.purchase_vat_report(db, tenantId, year=year, month=month, branchId=branchId or None)
    return ok(report)


@router.get("/api/v1/tax/reports/consolidated")
async def report_consolidated(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    branchId: str = "",
    user: AuthUser = Depends(require_permission("accounting.pnl.view")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    report = await tax_engine.consolidated_vat_report(db, tenantId, year=year, month=month, branchId=branchId or None)
    return ok(report)


# ═════════════════════════ CUSTOMER VAT INFO ═════════════════════════

@router.get("/api/v1/customers/{customerId}/vat")
async def get_customer_vat(
    customerId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (
        await db.execute(
            text("SELECT * FROM customer_vat_info WHERE tenantId = :t AND customerId = :c"),
            {"t": tenantId, "c": customerId},
        )
    ).first()
    if not row:
        return ok(None)
    return ok(dict(row._mapping))


@router.put("/api/v1/customers/{customerId}/vat")
async def upsert_customer_vat(
    customerId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    exists = (
        await db.execute(
            text("SELECT id FROM customer_vat_info WHERE tenantId = :t AND customerId = :c"),
            {"t": tenantId, "c": customerId},
        )
    ).first()

    async with txn(db):
        if exists:
            sets, params = [], {"id": exists[0], "t": tenantId}
            for k in ("vatRegNo", "tin", "businessName", "businessAddress", "isVATRegistered", "taxRuleId"):
                if k in body:
                    sets.append(f"{k} = :{k}")
                    params[k] = body[k]
            if sets:
                sets.append("updatedAt = NOW()")
                await db.execute(text(f"UPDATE customer_vat_info SET {', '.join(sets)} WHERE id = :id"), params)
        else:
            await db.execute(
                text(
                    "INSERT INTO customer_vat_info "
                    "(id, tenantId, customerId, vatRegNo, tin, businessName, businessAddress, isVATRegistered, taxRuleId) "
                    "VALUES (:id, :t, :c, :vr, :tin, :bn, :ba, :ivr, :tr)"
                ),
                {
                    "id": _uuid(), "t": tenantId, "c": customerId,
                    "vr": body.get("vatRegNo"), "tin": body.get("tin"),
                    "bn": body.get("businessName"), "ba": body.get("businessAddress"),
                    "ivr": 1 if body.get("isVATRegistered") else 0,
                    "tr": body.get("taxRuleId"),
                },
            )
    return ok({"saved": True})


# ═════════════════════════ SUPPLIER VAT INFO ═════════════════════════

@router.get("/api/v1/suppliers/{supplierId}/vat")
async def get_supplier_vat(
    supplierId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (
        await db.execute(
            text("SELECT * FROM supplier_vat_info WHERE tenantId = :t AND supplierId = :s"),
            {"t": tenantId, "s": supplierId},
        )
    ).first()
    if not row:
        return ok(None)
    return ok(dict(row._mapping))


@router.put("/api/v1/suppliers/{supplierId}/vat")
async def upsert_supplier_vat(
    supplierId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    exists = (
        await db.execute(
            text("SELECT id FROM supplier_vat_info WHERE tenantId = :t AND supplierId = :s"),
            {"t": tenantId, "s": supplierId},
        )
    ).first()

    async with txn(db):
        if exists:
            sets, params = [], {"id": exists[0], "t": tenantId}
            for k in ("vatRegNo", "tin", "businessName", "businessAddress", "isVATRegistered", "taxRuleId"):
                if k in body:
                    sets.append(f"{k} = :{k}")
                    params[k] = body[k]
            if sets:
                sets.append("updatedAt = NOW()")
                await db.execute(text(f"UPDATE supplier_vat_info SET {', '.join(sets)} WHERE id = :id"), params)
        else:
            await db.execute(
                text(
                    "INSERT INTO supplier_vat_info "
                    "(id, tenantId, supplierId, vatRegNo, tin, businessName, businessAddress, isVATRegistered, taxRuleId) "
                    "VALUES (:id, :t, :s, :vr, :tin, :bn, :ba, :ivr, :tr)"
                ),
                {
                    "id": _uuid(), "t": tenantId, "s": supplierId,
                    "vr": body.get("vatRegNo"), "tin": body.get("tin"),
                    "bn": body.get("businessName"), "ba": body.get("businessAddress"),
                    "ivr": 1 if body.get("isVATRegistered") else 0,
                    "tr": body.get("taxRuleId"),
                },
            )
    return ok({"saved": True})
