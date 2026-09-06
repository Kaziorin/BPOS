"""Multi-Currency System (Prompt 37, §22).

- Currency management (list active currencies)
- Exchange rate CRUD with history (immutable rates at transaction time)
- Currency-specific product pricing
- Real-time rate conversion
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

# Pre-seeded currencies
DEFAULT_CURRENCIES = [
    ("BDT", "Bangladeshi Taka", "৳", 2),
    ("USD", "US Dollar", "$", 2),
    ("EUR", "Euro", "€", 2),
    ("GBP", "British Pound", "£", 2),
    ("INR", "Indian Rupee", "₹", 2),
    ("SAR", "Saudi Riyal", "﷼", 2),
    ("AED", "UAE Dirham", "د.إ", 2),
    ("JPY", "Japanese Yen", "¥", 0),
    ("CNY", "Chinese Yuan", "¥", 2),
]


def _uid() -> str:
    return str(uuid.uuid4())


async def _ensure_currencies(db: AsyncSession):
    """Seed default currencies if not present."""
    count = (await db.execute(text("SELECT COUNT(*) FROM currencies"))).scalar()
    if count and count > 0:
        return
    for code, name, symbol, decimal_places in DEFAULT_CURRENCIES:
        await db.execute(text(
            "INSERT IGNORE INTO currencies (id, code, name, symbol, decimalPlaces) "
            "VALUES (:id, :c, :n, :s, :d)"),
            {"id": _uid(), "c": code, "n": name, "s": symbol, "d": decimal_places})
    await db.commit()


# ═══════════════ CURRENCIES ═══════════════

@router.get("/api/v1/currencies")
async def list_currencies(db: AsyncSession = Depends(get_db)):
    await _ensure_currencies(db)
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM currencies WHERE isActive=1 ORDER BY code"))).fetchall())
    return ok(rows)


@router.get("/api/v1/currencies/{code}")
async def get_currency(code: str, db: AsyncSession = Depends(get_db)):
    await _ensure_currencies(db)
    row = (await db.execute(text(
        "SELECT * FROM currencies WHERE code=:c"), {"c": code.upper()})).first()
    if not row:
        return err("Currency not found", 404)
    return ok(dict(row._mapping) if hasattr(row, '_mapping') else dict(row))


# ═══════════════ EXCHANGE RATES ═══════════════

@router.get("/api/v1/exchange-rates")
async def list_rates(
    fromCurrency: str = "",
    toCurrency: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if fromCurrency:
        where += " AND fromCurrency=:fc"; params["fc"] = fromCurrency.upper()
    if toCurrency:
        where += " AND toCurrency=:tc"; params["tc"] = toCurrency.upper()

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM exchange_rates WHERE {where} ORDER BY effectiveFrom DESC LIMIT 100"), params)).fetchall())
    return ok(rows)


@router.post("/api/v1/exchange-rates")
async def create_rate(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create a new exchange rate. Previous active rate is auto-deactivated."""
    from_curr = (body.get("fromCurrency") or "").upper()
    to_curr = (body.get("toCurrency") or "").upper()
    rate = body.get("rate")

    if not from_curr or not to_curr or rate is None:
        return err("fromCurrency, toCurrency, and rate required", 400)
    if from_curr == to_curr:
        return err("fromCurrency and toCurrency must be different", 400)
    try:
        rate = float(rate)
        if rate <= 0:
            return err("rate must be positive", 400)
    except (ValueError, TypeError):
        return err("rate must be a number", 400)

    # Deactivate previous active rate for this pair
    await db.execute(text(
        "UPDATE exchange_rates SET isActive=0, effectiveTo=NOW() "
        "WHERE tenantId=:t AND fromCurrency=:fc AND toCurrency=:tc AND isActive=1"),
        {"t": tenantId, "fc": from_curr, "tc": to_curr})

    rid = _uid()
    await db.execute(text(
        "INSERT INTO exchange_rates (id, tenantId, fromCurrency, toCurrency, rate, source, isActive, createdBy) "
        "VALUES (:id, :t, :fc, :tc, :r, :s, 1, :u)"),
        {"id": rid, "t": tenantId, "fc": from_curr, "tc": to_curr,
         "r": rate, "s": body.get("source", "MANUAL"), "u": user.id})
    await db.commit()

    return ok({"id": rid, "fromCurrency": from_curr, "toCurrency": to_curr,
               "rate": rate, "message": "Previous rate auto-deactivated"}, 201)


@router.get("/api/v1/exchange-rates/active")
async def get_active_rate(
    fromCurrency: str = "",
    toCurrency: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get the current active rate for a currency pair."""
    fc = fromCurrency.upper()
    tc = toCurrency.upper()
    if not fc or not tc:
        return err("fromCurrency and toCurrency required", 400)

    row = (await db.execute(text(
        "SELECT * FROM exchange_rates WHERE tenantId=:t AND fromCurrency=:fc AND toCurrency=:tc "
        "AND isActive=1 ORDER BY effectiveFrom DESC LIMIT 1"),
        {"t": tenantId, "fc": fc, "tc": tc})).first()

    if not row:
        # Try reverse rate
        row = (await db.execute(text(
            "SELECT * FROM exchange_rates WHERE tenantId=:t AND fromCurrency=:fc AND toCurrency=:tc "
            "AND isActive=1 ORDER BY effectiveFrom DESC LIMIT 1"),
            {"t": tenantId, "fc": tc, "tc": fc})).first()
        if row:
            data = dict(row._mapping) if hasattr(row, '_mapping') else dict(row)
            data["rate"] = 1.0 / float(data["rate"]) if data.get("rate") else 0
            data["reversed"] = True
            return ok(data)
        return err("No active rate found for this pair", 404)

    return ok(dict(row._mapping) if hasattr(row, '_mapping') else dict(row))


@router.get("/api/v1/exchange-rates/history")
async def rate_history(
    fromCurrency: str = "",
    toCurrency: str = "",
    limit: int = Query(50),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get rate history (immutable past rates preserved)."""
    where = "tenantId=:t"
    params: dict = {"t": tenantId, "lim": min(limit, 200)}
    if fromCurrency:
        where += " AND fromCurrency=:fc"; params["fc"] = fromCurrency.upper()
    if toCurrency:
        where += " AND toCurrency=:tc"; params["tc"] = toCurrency.upper()

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM exchange_rates WHERE {where} ORDER BY effectiveFrom DESC LIMIT :lim"), params)).fetchall())
    return ok(rows)


@router.post("/api/v1/exchange-rates/convert")
async def convert_amount(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Convert an amount between currencies at the active rate.
    Body: { amount, fromCurrency, toCurrency, rateDate? }
    If rateDate is provided, use the historical rate that was active at that time.
    """
    amount = float(body.get("amount", 0))
    fc = (body.get("fromCurrency") or "").upper()
    tc = (body.get("toCurrency") or "").upper()
    rate_date = body.get("rateDate")

    if not fc or not tc:
        return err("fromCurrency and toCurrency required", 400)
    if fc == tc:
        return ok({"amount": amount, "converted": amount, "rate": 1.0, "from": fc, "to": tc})

    # Find active rate (or historical if rateDate provided)
    if rate_date:
        row = (await db.execute(text(
            "SELECT rate FROM exchange_rates WHERE tenantId=:t AND fromCurrency=:fc AND toCurrency=:tc "
            "AND effectiveFrom <= :rd AND (effectiveTo IS NULL OR effectiveTo > :rd) "
            "ORDER BY effectiveFrom DESC LIMIT 1"),
            {"t": tenantId, "fc": fc, "tc": tc, "rd": rate_date})).first()
    else:
        row = (await db.execute(text(
            "SELECT rate FROM exchange_rates WHERE tenantId=:t AND fromCurrency=:fc AND toCurrency=:tc "
            "AND isActive=1 ORDER BY effectiveFrom DESC LIMIT 1"),
            {"t": tenantId, "fc": fc, "tc": tc})).first()

    if not row:
        return err(f"No exchange rate found for {fc}→{tc}", 404)

    rate = float(row[0])
    converted = round(amount * rate, 4)

    return ok({
        "amount": amount, "from": fc, "to": tc,
        "rate": rate, "converted": converted,
        "rateDate": rate_date or datetime.utcnow().isoformat(),
        "immutable": True,  # Rates are immutable once set
    })


# ═══════════════ CURRENCY-SPECIFIC PRICING ═══════════════

@router.get("/api/v1/currency-pricing/{productId}")
async def get_product_pricing(
    productId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get all currency prices for a product."""
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM currency_pricing WHERE tenantId=:t AND productId=:p"),
        {"t": tenantId, "p": productId})).fetchall())
    return ok(rows)


@router.post("/api/v1/currency-pricing")
async def set_product_pricing(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Set/override price for a specific currency.
    Body: { productId, currencyCode, price, minPrice?, wholesalePrice? }
    """
    product_id = body.get("productId")
    currency = (body.get("currencyCode") or "").upper()
    price = body.get("price")

    if not product_id or not currency or price is None:
        return err("productId, currencyCode, and price required", 400)

    pid = _uid()
    await db.execute(text(
        "INSERT INTO currency_pricing (id, tenantId, productId, currencyCode, price, minPrice, wholesalePrice) "
        "VALUES (:id, :t, :p, :c, :pr, :min, :wh) "
        "ON DUPLICATE KEY UPDATE price=VALUES(price), minPrice=VALUES(minPrice), "
        "wholesalePrice=VALUES(wholesalePrice), updatedAt=NOW()"),
        {"id": pid, "t": tenantId, "p": product_id, "c": currency,
         "pr": price, "min": body.get("minPrice"), "wh": body.get("wholesalePrice")})
    await db.commit()

    return ok({"productId": product_id, "currency": currency, "price": price})


# ═══════════════ TENANT CURRENCY SETTINGS ═══════════════

@router.get("/api/v1/tenant/currency")
async def get_tenant_currency(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT currency FROM tenants WHERE id=:t"), {"t": tenantId})).first()
    if not row:
        return err("Tenant not found", 404)
    return ok({"baseCurrency": row[0] or "BDT"})


@router.patch("/api/v1/tenant/currency")
async def set_tenant_currency(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    currency = (body.get("baseCurrency") or "").upper()
    if not currency:
        return err("baseCurrency required", 400)
    await db.execute(text(
        "UPDATE tenants SET currency=:c WHERE id=:t"), {"c": currency, "t": tenantId})
    await db.commit()
    return ok({"baseCurrency": currency})
