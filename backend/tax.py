"""Tax Engine (Prompt 17) — configurable, version-controlled VAT/Tax engine.

Design (§10.21 + Prompt 17 DoD):
- Tax rates are tenant-configurable, never hard-coded.
- Tax rules version when a rate changes: old transactions keep their original rule.
- Every tax calculation is recorded in `tax_transactions` for audit trail.
- POS, Invoice, GRN, and Accounting all call `calculate_tax()` which resolves
  the correct rate for a given transaction date and context.

Standard journal rules for VAT:
  SALE VAT     Debit AR/Cash (tax collected), Credit VAT Payable (2100)
  PURCHASE VAT Debit Input VAT (2110), Credit AP (tax paid)
  VAT REVERSAL Opposite of above

IMPORTANT DISCLAIMER (§10.21):
  All production VAT/NBR workflows and Mushak forms must be reviewed against
  the currently applicable regulations by a qualified Bangladesh VAT professional
  before production deployment. Tax rules must never be hard-coded into core
  business logic.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from util import gen_no


def _uuid() -> str:
    return str(uuid.uuid4())


# ──────────────────── RATE RESOLUTION ────────────────────


async def resolve_tax_rate(
    db: AsyncSession,
    tenantId: str,
    *,
    appliesTo: str = "BOTH",
    effective_date: Optional[date] = None,
    taxRuleId: Optional[str] = None,
) -> Optional[dict]:
    """Resolve the active tax rate for a tenant on a given date.

    If taxRuleId is provided, uses that specific rule.
    Otherwise, picks the highest-priority active rule matching appliesTo.
    Returns dict with keys: ruleId, ruleName, ruleType, rateId, rate, rateType,
                            taxInclusive, appliesTo.
    Returns None if no active tax rule exists (tax = 0, backward-compatible).
    """
    eff = effective_date or date.today()

    if taxRuleId:
        row = (
            await db.execute(
                text(
                    "SELECT tr.id AS ruleId, tr.name AS ruleName, tr.ruleType, tr.appliesTo, "
                    "tr.taxRateId, tr.priority, "
                    "tr2.id AS rateId2, tr2.name AS rateName, tr2.code, tr2.rate, tr2.rateType, "
                    "tr2.taxInclusive, tr2.effectiveFrom, tr2.effectiveTo "
                    "FROM tax_rules tr "
                    "JOIN tax_rates tr2 ON tr2.id = tr.taxRateId "
                    "WHERE tr.tenantId = :t AND tr.id = :rid AND tr.isActive = 1 "
                    "AND tr2.isActive = 1 "
                    "AND tr2.effectiveFrom <= :eff "
                    "AND (tr2.effectiveTo IS NULL OR tr2.effectiveTo >= :eff2)"
                ),
                {"t": tenantId, "rid": taxRuleId, "eff": eff, "eff2": eff},
            )
        ).first()
    else:
        row = (
            await db.execute(
                text(
                    "SELECT tr.id AS ruleId, tr.name AS ruleName, tr.ruleType, tr.appliesTo, "
                    "tr.taxRateId, tr.priority, "
                    "tr2.id AS rateId2, tr2.name AS rateName, tr2.code, tr2.rate, tr2.rateType, "
                    "tr2.taxInclusive, tr2.effectiveFrom, tr2.effectiveTo "
                    "FROM tax_rules tr "
                    "JOIN tax_rates tr2 ON tr2.id = tr.taxRateId "
                    "WHERE tr.tenantId = :t AND tr.isActive = 1 "
                    "AND tr2.isActive = 1 "
                    "AND (tr.appliesTo = :at OR tr.appliesTo = 'BOTH') "
                    "AND tr2.effectiveFrom <= :eff "
                    "AND (tr2.effectiveTo IS NULL OR tr2.effectiveTo >= :eff2) "
                    "ORDER BY tr.priority DESC, tr.createdAt DESC LIMIT 1"
                ),
                {"t": tenantId, "at": appliesTo, "eff": eff, "eff2": eff},
            )
        ).first()

    if not row:
        return None

    return {
        "ruleId": row[0],
        "ruleName": row[1],
        "ruleType": row[2],
        "appliesTo": row[3],
        "taxRateId": row[4],
        "priority": row[5],
        "rateId": row[6],
        "rateName": row[7],
        "code": row[8],
        "rate": float(row[9]),
        "rateType": row[10],
        "taxInclusive": bool(row[11]),
        "effectiveFrom": str(row[12]),
        "effectiveTo": str(row[13]) if row[13] else None,
    }


async def get_product_tax_rate(
    db: AsyncSession,
    tenantId: str,
    productId: str,
    *,
    appliesTo: str = "BOTH",
    effective_date: Optional[date] = None,
) -> Optional[dict]:
    """Get the tax rate for a specific product.

    Uses the product's taxRate field as a fallback if no tenant-level rule exists.
    """
    # First try tenant-level tax rules
    rule = await resolve_tax_rate(db, tenantId, appliesTo=appliesTo, effective_date=effective_date)
    if rule:
        return rule

    # Fallback to product-level taxRate
    row = (
        await db.execute(
            text("SELECT taxRate FROM products WHERE id = :pid AND tenantId = :t"),
            {"pid": productId, "t": tenantId},
        )
    ).first()
    if row and float(row[0] or 0) > 0:
        return {
            "ruleId": None,
            "ruleName": "Product Rate",
            "ruleType": "STANDARD",
            "appliesTo": appliesTo,
            "taxRateId": None,
            "priority": 0,
            "rateId": None,
            "rateName": "Product",
            "code": "PRODUCT",
            "rate": float(row[0]),
            "rateType": "PERCENTAGE",
            "taxInclusive": False,
            "effectiveFrom": None,
            "effectiveTo": None,
        }

    return None


# ──────────────────── TAX CALCULATION ────────────────────


def calculate_tax(
    amount: float,
    rate: float,
    *,
    tax_inclusive: bool = False,
    rate_type: str = "PERCENTAGE",
) -> dict:
    """Calculate tax for a given amount and rate.

    For PERCENTAGE rate type:
      - tax_exclusive: tax_amount = amount * rate / 100
                       total_with_tax = amount + tax_amount
      - tax_inclusive: tax_amount = amount * rate / (100 + rate)
                       taxable_amount = amount - tax_amount

    Returns:
        {
            "taxableAmount": float,  # The base amount before tax
            "taxRate": float,        # The rate used
            "taxAmount": float,      # The tax amount
            "totalWithTax": float,   # Total including tax
        }
    """
    r = float(rate)
    a = float(amount)

    if rate_type == "FIXED":
        if tax_inclusive:
            tax = r
            taxable = a - tax
        else:
            tax = r
            taxable = a
        return {
            "taxableAmount": round(taxable, 2),
            "taxRate": r,
            "taxAmount": round(tax, 2),
            "totalWithTax": round(taxable + tax, 2),
        }

    # PERCENTAGE
    if tax_inclusive:
        # amount already includes tax
        # amount = taxable + taxable * rate/100 = taxable * (1 + rate/100)
        taxable = a / (1 + r / 100) if (1 + r / 100) != 0 else a
        tax = a - taxable
        return {
            "taxableAmount": round(taxable, 2),
            "taxRate": r,
            "taxAmount": round(tax, 2),
            "totalWithTax": round(a, 2),
        }
    else:
        # amount is pre-tax
        tax = a * r / 100
        return {
            "taxableAmount": round(a, 2),
            "taxRate": r,
            "taxAmount": round(tax, 2),
            "totalWithTax": round(a + tax, 2),
        }


# ──────────────────── RECORD TAX TRANSACTION ────────────────────


async def record_tax_transaction(
    db: AsyncSession,
    tenantId: str,
    *,
    branchId: Optional[str],
    refType: str,
    refId: str,
    refNo: str,
    taxRuleId: str,
    taxRateId: str,
    taxRate: float,
    taxableAmount: float,
    taxAmount: float,
    isTaxInclusive: bool = False,
    userId: str = "",
) -> str:
    """Record a tax transaction for audit trail. Returns the record ID."""
    now = datetime.now()
    rec_id = _uuid()
    await db.execute(
        text(
            "INSERT INTO tax_transactions "
            "(id, tenantId, branchId, refType, refId, refNo, taxRuleId, taxRateId, "
            "taxRate, taxableAmount, taxAmount, isTaxInclusive, period, periodMonth, status, createdBy) "
            "VALUES (:id, :t, :b, :rt, :ri, :rn, :tr, :trr, :rate, :ta, :tax, :ti, :p, :pm, 'ACTIVE', :u)"
        ),
        {
            "id": rec_id,
            "t": tenantId,
            "b": branchId,
            "rt": refType,
            "ri": refId,
            "rn": refNo,
            "tr": taxRuleId,
            "trr": taxRateId,
            "rate": taxRate,
            "ta": round(taxableAmount, 2),
            "tax": round(taxAmount, 2),
            "ti": 1 if isTaxInclusive else 0,
            "p": now.year,
            "pm": now.month,
            "u": userId or None,
        },
    )
    return rec_id


async def reverse_tax_transaction(
    db: AsyncSession,
    tenantId: str,
    *,
    refType: str,
    refId: str,
    reason: str = "Reversal",
) -> None:
    """Mark tax transactions as REVERSED for a given source transaction."""
    await db.execute(
        text(
            "UPDATE tax_transactions SET status = 'REVERSED' "
            "WHERE tenantId = :t AND refType = :rt AND refId = :ri AND status = 'ACTIVE'"
        ),
        {"t": tenantId, "rt": refType, "ri": refId},
    )


# ──────────────────── VAT REPORTS ────────────────────


async def sales_vat_report(
    db: AsyncSession,
    tenantId: str,
    *,
    year: int,
    month: int,
    branchId: Optional[str] = None,
) -> dict:
    """Generate Sales VAT report for a given month.

    Returns total taxable sales, total VAT collected, and breakdown by tax rate.
    """
    where = "tt.tenantId = :t AND tt.period = :y AND tt.periodMonth = :m AND tt.status = 'ACTIVE' AND tt.refType IN ('SALE', 'SALE_RETURN')"
    params: dict = {"t": tenantId, "y": year, "m": month}
    if branchId:
        where += " AND tt.branchId = :b"
        params["b"] = branchId

    # Totals
    totals = (
        await db.execute(
            text(
                f"SELECT COALESCE(SUM(tt.taxableAmount), 0), COALESCE(SUM(tt.taxAmount), 0), COUNT(*) "
                f"FROM tax_transactions tt WHERE {where}"
            ),
            params,
        )
    ).first()

    # Breakdown by tax rate
    breakdown = (
        await db.execute(
            text(
                f"SELECT tr.name AS rateName, tr.code AS rateCode, tt.taxRate, "
                f"SUM(tt.taxableAmount) AS taxable, SUM(tt.taxAmount) AS tax, COUNT(*) AS txCount "
                f"FROM tax_transactions tt "
                f"JOIN tax_rates tr ON tr.id = tt.taxRateId "
                f"WHERE {where} "
                f"GROUP BY tt.taxRateId ORDER BY tt.taxRate DESC"
            ),
            params,
        )
    ).fetchall()

    return {
        "period": {"year": year, "month": month},
        "totalTaxableSales": round(float(totals[0]), 2),
        "totalVATCollected": round(float(totals[1]), 2),
        "transactionCount": totals[2],
        "byRate": [
            {
                "rateName": r[0],
                "rateCode": r[1],
                "rate": float(r[2]),
                "taxableAmount": round(float(r[3]), 2),
                "taxAmount": round(float(r[4]), 2),
                "transactionCount": r[5],
            }
            for r in breakdown
        ],
    }


async def purchase_vat_report(
    db: AsyncSession,
    tenantId: str,
    *,
    year: int,
    month: int,
    branchId: Optional[str] = None,
) -> dict:
    """Generate Purchase VAT report for a given month.

    Returns total taxable purchases, total VAT paid (Input VAT), breakdown by tax rate.
    """
    where = "tt.tenantId = :t AND tt.period = :y AND tt.periodMonth = :m AND tt.status = 'ACTIVE' AND tt.refType IN ('GRN', 'PURCHASE_RETURN')"
    params: dict = {"t": tenantId, "y": year, "m": month}
    if branchId:
        where += " AND tt.branchId = :b"
        params["b"] = branchId

    totals = (
        await db.execute(
            text(
                f"SELECT COALESCE(SUM(tt.taxableAmount), 0), COALESCE(SUM(tt.taxAmount), 0), COUNT(*) "
                f"FROM tax_transactions tt WHERE {where}"
            ),
            params,
        )
    ).first()

    breakdown = (
        await db.execute(
            text(
                f"SELECT tr.name AS rateName, tr.code AS rateCode, tt.taxRate, "
                f"SUM(tt.taxableAmount) AS taxable, SUM(tt.taxAmount) AS tax, COUNT(*) AS txCount "
                f"FROM tax_transactions tt "
                f"JOIN tax_rates tr ON tr.id = tt.taxRateId "
                f"WHERE {where} "
                f"GROUP BY tt.taxRateId ORDER BY tt.taxRate DESC"
            ),
            params,
        )
    ).fetchall()

    return {
        "period": {"year": year, "month": month},
        "totalTaxablePurchases": round(float(totals[0]), 2),
        "totalVATPaid": round(float(totals[1]), 2),
        "transactionCount": totals[2],
        "byRate": [
            {
                "rateName": r[0],
                "rateCode": r[1],
                "rate": float(r[2]),
                "taxableAmount": round(float(r[3]), 2),
                "taxAmount": round(float(r[4]), 2),
                "transactionCount": r[5],
            }
            for r in breakdown
        ],
    }


async def consolidated_vat_report(
    db: AsyncSession,
    tenantId: str,
    *,
    year: int,
    month: int,
    branchId: Optional[str] = None,
) -> dict:
    """Generate consolidated VAT report — net VAT payable = Sales VAT - Purchase VAT."""
    sales = await sales_vat_report(db, tenantId, year=year, month=month, branchId=branchId)
    purchases = await purchase_vat_report(db, tenantId, year=year, month=month, branchId=branchId)

    net_vat = round(sales["totalVATCollected"] - purchases["totalVATPaid"], 2)

    return {
        "period": {"year": year, "month": month},
        "salesVAT": sales["totalVATCollected"],
        "purchaseVAT": purchases["totalVATPaid"],
        "netVATPayable": net_vat,
        "status": "PAYABLE" if net_vat > 0 else ("REFUNDABLE" if net_vat < 0 else "NIL"),
        "sales": sales,
        "purchases": purchases,
    }


# ──────────────────── DEFAULT COA ENTRIES ────────────────────

# Added to DEFAULT_COA in accounting.py:
#   "2100" → "VAT Payable" (LIABILITY) — already exists
#   "2110" → "Input VAT" (ASSET) — new
#   "2120" → "VAT Receivable" (ASSET) — new (for refundable VAT)
