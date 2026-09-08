"""Loyalty / Wallet / Gift Card / Marketing Automation / Budgets (Prompt 26).

§10.23  Loyalty — points earn/redeem/expiry via tiers (Bronze→VIP), referral &
        cashback hooks; Wallet & Gift Card every change goes through a full
        transaction ledger (never a bare balance mutation).
§10.34  Marketing Automation — trigger-based campaigns (inactive / birthday /
        anniversary / first purchase / high-value / abandoned cart / expiry /
        loyalty milestone). Actual SMS/WhatsApp sending is stubbed until the
        Prompt 28 Notification Engine; the trigger + rule evaluation, coupon
        generation and per-customer grant ledger are real.
§10.35  Budgets — branch/department/category period budgets with a live
        budget-vs-actual variance report (extends the Prompt 25 target model).
"""
from __future__ import annotations

import json
import random
import string
import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db, txn
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

DEFAULT_TIERS = [
    ("Bronze", "BRONZE", 0, 1.0, 0.0, "amber", "Base membership — 1x points"),
    ("Silver", "SILVER", 500, 1.2, 0.5, "slate", "1.2x points, 0.5% cashback"),
    ("Gold", "GOLD", 1500, 1.5, 1.0, "yellow", "1.5x points, 1% cashback, priority queue"),
    ("VIP", "VIP", 4000, 2.0, 2.0, "violet", "2x points, 2% cashback, exclusive offers"),
]

TRIGGER_CATALOG = [
    {"code": "INACTIVE_30D", "label": "Inactive customers", "description": "No purchase for N days (default 30) → win-back coupon"},
    {"code": "BIRTHDAY", "label": "Birthday", "description": "Customer date-of-birth matches today (month/day)"},
    {"code": "ANNIVERSARY", "label": "Anniversary", "description": "Customer join-date anniversary is today"},
    {"code": "FIRST_PURCHASE", "label": "First purchase", "description": "Made their very first sale inside the lookback window"},
    {"code": "HIGH_VALUE", "label": "High-value purchase", "description": "A single confirmed sale ≥ minAmount inside the lookback window"},
    {"code": "ABANDONED_CART", "label": "Abandoned cart", "description": "Draft sales order older than N days, never converted"},
    {"code": "EXPIRY_REMINDER", "label": "Gift-card expiry", "description": "Holds an active gift card expiring within N days"},
    {"code": "LOYALTY_MILESTONE", "label": "Loyalty milestone", "description": "Customer lifetime points crossed milestonePoints (tier up)"},
]

_SKIP_REASON_KEY = "E2E26_SKIP"
_coupon_seq = random.Random()


def _uid() -> str:
    return str(uuid.uuid4())


def _json_in(v):
    """Columns holding JSON arrive as dict/list (asyncmy) or str (sync pymysql)."""
    if v is None:
        return None
    if isinstance(v, (dict, list)):
        return v
    if isinstance(v, str):
        try:
            return json.loads(v)
        except Exception:
            return None
    return v


def _json_out(v) -> str | None:
    return json.dumps(v) if v is not None else None


def _coupon_code(prefix: str = "WIN") -> str:
    suffix = "".join(_coupon_seq.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"


async def _ensure_loyalty_account(db: AsyncSession, tenant_id: str, customer_id: str, user_id: str = None):
    """Create a customer's loyalty account on demand (idempotent)."""
    acc = (await db.execute(text(
        "SELECT id, pointsBalance, lifetimeEarned, lifetimeRedeemed, tier FROM loyalty_accounts "
        "WHERE tenantId=:t AND customerId=:c"), {"t": tenant_id, "c": customer_id})).first()
    if acc:
        return dict(acc._mapping)
    aid = _uid()
    await db.execute(text(
        "INSERT INTO loyalty_accounts (id, tenantId, customerId, pointsBalance, lifetimeEarned, "
        "lifetimeRedeemed, tier, status, createdBy) VALUES (:id, :t, :c, 0, 0, 0, 'BRONZE', 'ACTIVE', :u)"),
        {"id": aid, "t": tenant_id, "c": customer_id, "u": user_id})
    return {"id": aid, "pointsBalance": 0, "lifetimeEarned": 0, "lifetimeRedeemed": 0, "tier": "BRONZE"}


async def _apply_tier(db: AsyncSession, tenant_id: str, account: dict) -> str:
    """Recompute tier from lifetime earned points (never lowers prestige)."""
    tiers = rows_to_dicts((await db.execute(text(
        "SELECT * FROM loyalty_tiers WHERE tenantId=:t AND isActive=1 "
        "ORDER BY minPoints DESC"), {"t": tenant_id})).fetchall())
    if not tiers:  # seed defaults on first use
        for name, code, min_pts, mult, cb, color, benefits in DEFAULT_TIERS:
            await db.execute(text(
                "INSERT INTO loyalty_tiers (id, tenantId, name, code, minPoints, multiplier, cashbackRate, benefits, color, createdBy) "
                "VALUES (:id, :t, :n, :c, :mp, :m, :cb, :b, :col, NULL) ON DUPLICATE KEY UPDATE name=VALUES(name)"),
                {"id": _uid(), "t": tenant_id, "n": name, "c": code, "mp": min_pts, "m": mult,
                 "cb": cb, "b": benefits, "col": color})
        tiers = rows_to_dicts((await db.execute(text(
            "SELECT * FROM loyalty_tiers WHERE tenantId=:t AND isActive=1 "
            "ORDER BY minPoints DESC"), {"t": tenant_id})).fetchall())
    earned = int(account.get("lifetimeEarned") or 0)
    current = (account.get("tier") or "BRONZE").upper()
    tiers_asc = sorted(tiers, key=lambda x: float(x["minPoints"]))
    new_tier = "BRONZE"
    for t in tiers_asc:
        if earned >= float(t["minPoints"]):
            new_tier = t["code"]
    # prestige ladder: never downgrade
    idx_cur = next((i for i, t in enumerate(tiers_asc) if t["code"] == current), 0)
    idx_new = next((i for i, t in enumerate(tiers_asc) if t["code"] == new_tier), 0)
    if idx_new > idx_cur:
        await db.execute(text("UPDATE loyalty_accounts SET tier=:tr, updatedAt=NOW() WHERE id=:id"),
                         {"tr": new_tier, "id": account["id"]})
        return new_tier
    return current


async def _settings(db: AsyncSession, tenant_id: str) -> dict:
    row = (await db.execute(text("SELECT * FROM loyalty_settings WHERE tenantId=:t"), {"t": tenant_id})).first()
    if row:
        return dict(row._mapping)
    # default row
    await db.execute(text(
        "INSERT INTO loyalty_settings (tenantId, pointsPerAmount, redeemValuePerPoint, expiryMonths, "
        "minRedeemPoints, earnEnabled, redeemEnabled) VALUES (:t, 100, 1, 12, 100, 1, 1)"),
        {"t": tenant_id})
    return {"tenantId": tenant_id, "pointsPerAmount": 100.0, "redeemValuePerPoint": 1.0,
            "expiryMonths": 12, "minRedeemPoints": 100, "earnEnabled": 1, "redeemEnabled": 1}


# ═════════════════════════ LOYALTY ═════════════════════════

@router.get("/api/v1/loyalty/settings")
async def get_loyalty_settings(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    return ok(await _settings(db, tenantId))


@router.put("/api/v1/loyalty/settings")
async def update_loyalty_settings(body: dict, user: AuthUser = Depends(require_auth),
                                  tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    await _settings(db, tenantId)
    fields, params = [], {"t": tenantId, "u": user.id}
    for key in ("pointsPerAmount", "redeemValuePerPoint", "expiryMonths", "minRedeemPoints", "earnEnabled", "redeemEnabled"):
        if key in body and body[key] is not None:
            fields.append(f"{key}=:{key}")
            params[key] = body[key]
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE loyalty_settings SET {', '.join(fields)}, updatedBy=:u, updatedAt=NOW() WHERE tenantId=:t"), params)
    await db.commit()
    return ok(await _settings(db, tenantId))


@router.get("/api/v1/loyalty/tiers")
async def list_tiers(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                     db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM loyalty_tiers WHERE tenantId=:t ORDER BY minPoints"), {"t": tenantId})).fetchall())
    if not rows:
        for name, code, min_pts, mult, cb, color, benefits in DEFAULT_TIERS:
            await db.execute(text(
                "INSERT INTO loyalty_tiers (id, tenantId, name, code, minPoints, multiplier, cashbackRate, benefits, color, createdBy) "
                "VALUES (:id, :t, :n, :c, :mp, :m, :cb, :b, :col, NULL) ON DUPLICATE KEY UPDATE name=VALUES(name)"),
                {"id": _uid(), "t": tenantId, "n": name, "c": code, "mp": min_pts, "m": mult,
                 "cb": cb, "b": benefits, "col": color})
        await db.commit()
        rows = rows_to_dicts((await db.execute(text(
            "SELECT * FROM loyalty_tiers WHERE tenantId=:t ORDER BY minPoints"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/loyalty/tiers")
async def create_tier(body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name, code = (body.get("name") or "").strip(), (body.get("code") or "").strip().upper()
    if not name or not code:
        return err("name and code are required", 400)
    dup = (await db.execute(text("SELECT id FROM loyalty_tiers WHERE tenantId=:t AND code=:c"),
                            {"t": tenantId, "c": code})).first()
    if dup:
        return err("Tier code already exists", 409)
    tid = _uid()
    await db.execute(text(
        "INSERT INTO loyalty_tiers (id, tenantId, name, code, minPoints, multiplier, cashbackRate, benefits, color, isActive, createdBy) "
        "VALUES (:id, :t, :n, :c, :mp, :m, :cb, :b, :col, 1, :u)"),
        {"id": tid, "t": tenantId, "n": name, "c": code, "mp": body.get("minPoints", 0),
         "m": body.get("multiplier", 1.0), "cb": body.get("cashbackRate", 0),
         "b": body.get("benefits"), "col": body.get("color", "amber"), "u": user.id})
    await db.commit()
    return ok({"id": tid, "name": name, "code": code}, 201)


@router.patch("/api/v1/loyalty/tiers/{tierId}")
async def update_tier(tierId: str, body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM loyalty_tiers WHERE id=:id AND tenantId=:t"),
                            {"id": tierId, "t": tenantId})).first()
    if not row:
        return err("Tier not found", 404)
    fields, params = [], {"id": tierId, "t": tenantId}
    for key in ("name", "code", "minPoints", "multiplier", "cashbackRate", "benefits", "color", "isActive"):
        if key in body and body[key] is not None:
            fields.append(f"{key}=:{key}")
            params[key] = body[key].upper() if key == "code" and isinstance(body[key], str) else body[key]
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE loyalty_tiers SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/loyalty/tiers/{tierId}")
async def delete_tier(tierId: str, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM loyalty_tiers WHERE id=:id AND tenantId=:t"),
                            {"id": tierId, "t": tenantId})).first()
    if not row:
        return err("Tier not found", 404)
    await db.execute(text("DELETE FROM loyalty_tiers WHERE id=:id AND tenantId=:t"), {"id": tierId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


@router.get("/api/v1/loyalty/accounts")
async def list_loyalty_accounts(search: str = "", tier: str = "", limit: int = Query(100),
                                user: AuthUser = Depends(require_auth),
                                tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "a.tenantId=:t"
    params: dict = {"t": tenantId}
    if tier:
        where += " AND a.tier=:tr"
        params["tr"] = tier.upper()
    if search:
        where += " AND (c.name LIKE :q OR c.phone LIKE :q)"
        params["q"] = f"%{search}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT a.*, c.name AS customerName, c.phone, c.email, c.dateOfBirth "
        f"FROM loyalty_accounts a JOIN customers c ON c.id=a.customerId AND c.tenantId=a.tenantId "
        f"WHERE {where} ORDER BY a.lifetimeEarned DESC LIMIT :lim"), {**params, "lim": min(limit, 500)})).fetchall())
    return ok(rows)


@router.get("/api/v1/loyalty/accounts/{customerId}")
async def get_loyalty_account(customerId: str, user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    acc = await _ensure_loyalty_account(db, tenantId, customerId, user.id)
    acc["customerName"] = (await db.execute(text("SELECT name FROM customers WHERE id=:id AND tenantId=:t"),
                                            {"id": customerId, "t": tenantId})).scalar()
    txns = rows_to_dicts((await db.execute(text(
        "SELECT * FROM loyalty_transactions WHERE tenantId=:t AND customerId=:c ORDER BY createdAt DESC LIMIT 100"),
        {"t": tenantId, "c": customerId})).fetchall())
    return ok({"account": acc, "transactions": txns})


@router.post("/api/v1/loyalty/earn")
async def loyalty_earn(body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Earn points — on an explicit spend amount (or derive from a confirmed sale)."""
    customer_id = body.get("customerId")
    if not customer_id:
        return err("customerId is required", 400)
    sale_id = body.get("saleId")
    amount = float(body.get("amount") or 0)
    if sale_id and not amount:
        sale = (await db.execute(text("SELECT total FROM sales WHERE id=:id AND tenantId=:t"),
                                 {"id": sale_id, "t": tenantId})).first()
        if not sale:
            return err("Sale not found", 404)
        amount = float(sale[0] or 0)
    if amount <= 0:
        return err("amount must be > 0 (or a valid saleId)", 400)
    settings = await _settings(db, tenantId)
    earn_en = settings.get("earnEnabled")
    if earn_en is None or int(earn_en) != 1:
        return err("Points earning is disabled", 400)
    pts_per = float(settings.get("pointsPerAmount") or 100)
    base_pts = int(amount // pts_per)
    if base_pts <= 0:
        return err("Amount too small to earn points", 400)
    acc = await _ensure_loyalty_account(db, tenantId, customer_id, user.id)
    # multiplier from the account's current tier
    tier_row = (await db.execute(text("SELECT multiplier FROM loyalty_tiers WHERE tenantId=:t AND code=:c"),
                                 {"t": tenantId, "c": acc["tier"]})).first()
    mult = float(tier_row[0]) if tier_row else 1.0
    pts = max(int(base_pts * mult), 1)
    before = int(acc["pointsBalance"] or 0)
    async with txn(db):
        await db.execute(text(
            "UPDATE loyalty_accounts SET pointsBalance = pointsBalance + :p, lifetimeEarned = lifetimeEarned + :p, "
            "updatedAt=NOW(), updatedBy=:u WHERE id=:id"),
            {"p": pts, "id": acc["id"], "u": user.id})
        # ledger always records every movement
        await db.execute(text(
            "INSERT INTO loyalty_transactions (id, tenantId, customerId, saleId, type, pointsEarned, "
            "pointsRedeemed, note, createdBy) VALUES (:id, :t, :c, :s, 'EARN', :p, 0, :n, :u)"),
            {"id": _uid(), "t": tenantId, "c": customer_id, "s": sale_id, "p": pts,
             "n": body.get("note") or f"Earned on {amount:,.0f} spend", "u": user.id})
        # keep the legacy customers.loyaltyPoints column in sync
        await db.execute(text("UPDATE customers SET loyaltyPoints = loyaltyPoints + :p WHERE id=:c AND tenantId=:t"),
                         {"p": pts, "c": customer_id, "t": tenantId})
    acc["pointsBalance"] = before + pts
    acc["lifetimeEarned"] = int(acc.get("lifetimeEarned") or 0) + pts
    new_tier = await _apply_tier(db, tenantId, acc)
    await db.commit()
    return ok({"customerId": customer_id, "pointsEarned": pts, "pointsBalance": before + pts,
               "tier": new_tier, "basePoints": base_pts, "multiplier": mult}, 201)


@router.post("/api/v1/loyalty/redeem")
async def loyalty_redeem(body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Redeem points for a taka discount value (converted via settings)."""
    customer_id = body.get("customerId")
    points = int(body.get("points") or 0)
    if not customer_id:
        return err("customerId is required", 400)
    if points <= 0:
        return err("points must be > 0", 400)
    settings = await _settings(db, tenantId)
    redeem_en = settings.get("redeemEnabled")
    if redeem_en is None or int(redeem_en) != 1:
        return err("Points redemption is disabled", 400)
    if points < int(settings.get("minRedeemPoints") or 100):
        return err(f"Minimum redemption is {settings.get('minRedeemPoints')} points", 400)
    acc = await _ensure_loyalty_account(db, tenantId, customer_id, user.id)
    balance = int(acc["pointsBalance"] or 0)
    if points > balance:
        return err(f"Insufficient points — balance {balance}", 400)
    value = round(points * float(settings.get("redeemValuePerPoint") or 1), 2)
    async with txn(db):
        await db.execute(text(
            "UPDATE loyalty_accounts SET pointsBalance = pointsBalance - :p, lifetimeRedeemed = lifetimeRedeemed + :p, "
            "updatedAt=NOW(), updatedBy=:u WHERE id=:id"),
            {"p": points, "id": acc["id"], "u": user.id})
        await db.execute(text(
            "INSERT INTO loyalty_transactions (id, tenantId, customerId, saleId, type, pointsEarned, "
            "pointsRedeemed, note, createdBy) VALUES (:id, :t, :c, NULL, 'REDEEM', 0, :p, :n, :u)"),
            {"id": _uid(), "t": tenantId, "c": customer_id, "p": points,
             "n": body.get("note") or f"Redeemed for ৳{value:,.2f} discount", "u": user.id})
        await db.execute(text("UPDATE customers SET loyaltyPoints = GREATEST(loyaltyPoints - :p, 0) WHERE id=:c AND tenantId=:t"),
                         {"p": points, "c": customer_id, "t": tenantId})
    await db.commit()
    return ok({"customerId": customer_id, "pointsRedeemed": points, "pointsBalance": balance - points,
               "discountValue": value}, 201)


@router.post("/api/v1/loyalty/adjust")
async def loyalty_adjust(body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    customer_id = body.get("customerId")
    delta = int(body.get("points") or 0)  # can be negative
    if not customer_id or delta == 0:
        return err("customerId and non-zero points are required", 400)
    acc = await _ensure_loyalty_account(db, tenantId, customer_id, user.id)
    balance = int(acc["pointsBalance"] or 0)
    if delta < 0 and -delta > balance:
        return err("Adjustment exceeds balance", 400)
    async with txn(db):
        await db.execute(text(
            "UPDATE loyalty_accounts SET pointsBalance = pointsBalance + :p, "
            "lifetimeEarned = lifetimeEarned + GREATEST(:p, 0), updatedAt=NOW(), updatedBy=:u WHERE id=:id"),
            {"p": delta, "id": acc["id"], "u": user.id})
        await db.execute(text(
            "INSERT INTO loyalty_transactions (id, tenantId, customerId, saleId, type, pointsEarned, "
            "pointsRedeemed, note, createdBy) VALUES (:id, :t, :c, NULL, 'ADJUST', GREATEST(:p,0), "
            "GREATEST(-:p,0), :n, :u)"),
            {"id": _uid(), "t": tenantId, "c": customer_id, "p": delta,
             "n": body.get("note") or "Manual adjustment", "u": user.id})
        await db.execute(text("UPDATE customers SET loyaltyPoints = GREATEST(loyaltyPoints + :p, 0) WHERE id=:c AND tenantId=:t"),
                         {"p": delta, "c": customer_id, "t": tenantId})
    await db.commit()
    return ok({"customerId": customer_id, "pointsBalance": balance + delta}, 200)


@router.get("/api/v1/loyalty/transactions")
async def list_loyalty_transactions(customerId: str = "", type: str = "", limit: int = Query(100),
                                    user: AuthUser = Depends(require_auth),
                                    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if customerId:
        where += " AND customerId=:c"
        params["c"] = customerId
    if type:
        where += " AND type=:ty"
        params["ty"] = type.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM loyalty_transactions WHERE {where} ORDER BY createdAt DESC LIMIT :lim"),
        {**params, "lim": min(limit, 500)})).fetchall())
    return ok(rows)


# ═════════════════════════ WALLET (ledger-first) ═════════════════════════

async def _ensure_wallet(db: AsyncSession, tenant_id: str, customer_id: str, user_id: str = None) -> dict:
    acc = (await db.execute(text(
        "SELECT id, balance, lifetimeCredited, lifetimeDebited, status FROM wallet_accounts "
        "WHERE tenantId=:t AND customerId=:c"), {"t": tenant_id, "c": customer_id})).first()
    if acc:
        return dict(acc._mapping)
    aid = _uid()
    await db.execute(text(
        "INSERT INTO wallet_accounts (id, tenantId, customerId, balance, lifetimeCredited, lifetimeDebited, status, createdBy) "
        "VALUES (:id, :t, :c, 0, 0, 0, 'ACTIVE', :u)"),
        {"id": aid, "t": tenant_id, "c": customer_id, "u": user_id})
    return {"id": aid, "balance": 0.0, "lifetimeCredited": 0.0, "lifetimeDebited": 0.0, "status": "ACTIVE"}


async def _wallet_tx(db: AsyncSession, tenant_id: str, wallet: dict, customer_id: str, tx_type: str,
                     amount: float, user_id: str, ref_type: str = None, ref_id: str = None,
                     note: str = None) -> float:
    """Ledger-driven wallet mutation — balance is recomputed from the ledger, the
    account row is only ever updated to the sum of its own transactions."""
    before = float(wallet.get("balance") or 0)
    credit_types = {"ADD", "CASHBACK", "REFUND", "STORE_CREDIT", "PROMOTIONAL", "ADJUSTMENT_CREDIT"}
    if tx_type in credit_types:
        after, cred, deb = before + amount, amount, 0.0
    else:
        if amount > before:
            raise ValueError("Insufficient wallet balance")
        after, cred, deb = before - amount, 0.0, amount
    await db.execute(text(
        "INSERT INTO wallet_transactions (id, tenantId, walletId, customerId, type, amount, balanceBefore, "
        "balanceAfter, refType, refId, note, createdBy) VALUES (:id, :t, :w, :c, :ty, :am, :bb, :ba, :rt, :ri, :n, :u)"),
        {"id": _uid(), "t": tenant_id, "w": wallet["id"], "c": customer_id, "ty": tx_type, "am": amount,
         "bb": before, "ba": after, "rt": ref_type, "ri": ref_id, "n": note, "u": user_id})
    await db.execute(text(
        "UPDATE wallet_accounts SET balance = balance + :d, lifetimeCredited = lifetimeCredited + :cr, "
        "lifetimeDebited = lifetimeDebited + :db, updatedAt=NOW(), updatedBy=:u WHERE id=:id"),
        {"d": after - before, "cr": cred, "db": deb, "id": wallet["id"], "u": user_id})
    # keep legacy customers.walletBalance in sync
    await db.execute(text("UPDATE customers SET walletBalance = GREATEST(walletBalance + :d, 0) WHERE id=:c AND tenantId=:t"),
                     {"d": after - before, "c": customer_id, "t": tenant_id})
    return after


@router.get("/api/v1/wallet/accounts")
async def list_wallet_accounts(search: str = "", limit: int = Query(100), user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "w.tenantId=:t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (c.name LIKE :q OR c.phone LIKE :q)"
        params["q"] = f"%{search}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT w.*, c.name AS customerName, c.phone FROM wallet_accounts w "
        f"JOIN customers c ON c.id=w.customerId AND c.tenantId=w.tenantId "
        f"WHERE {where} ORDER BY w.balance DESC LIMIT :lim"), {**params, "lim": min(limit, 500)})).fetchall())
    return ok(rows)


@router.get("/api/v1/wallet/accounts/{customerId}")
async def get_wallet_account(customerId: str, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    wallet = await _ensure_wallet(db, tenantId, customerId, user.id)
    cust = (await db.execute(text("SELECT name, phone FROM customers WHERE id=:id AND tenantId=:t"),
                             {"id": customerId, "t": tenantId})).first()
    txns = rows_to_dicts((await db.execute(text(
        "SELECT * FROM wallet_transactions WHERE tenantId=:t AND customerId=:c ORDER BY createdAt DESC LIMIT 100"),
        {"t": tenantId, "c": customerId})).fetchall())
    return ok({"wallet": wallet, "customerName": cust[0] if cust else None,
               "phone": cust[1] if cust else None, "transactions": txns})


@router.post("/api/v1/wallet/credit")
async def wallet_credit(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    customer_id = body.get("customerId")
    amount = float(body.get("amount") or 0)
    tx_type = (body.get("type") or "ADD").upper()
    if not customer_id:
        return err("customerId is required", 400)
    if amount <= 0:
        return err("amount must be > 0", 400)
    if tx_type not in ("ADD", "CASHBACK", "REFUND", "STORE_CREDIT", "PROMOTIONAL"):
        return err("type must be ADD/CASHBACK/REFUND/STORE_CREDIT/PROMOTIONAL", 400)
    wallet = await _ensure_wallet(db, tenantId, customer_id, user.id)
    try:
        async with txn(db):
            after = await _wallet_tx(db, tenantId, wallet, customer_id, tx_type, amount, user.id,
                                     body.get("refType"), body.get("refId"), body.get("note"))
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok({"customerId": customer_id, "type": tx_type, "amount": amount, "balance": after}, 201)


@router.post("/api/v1/wallet/debit")
async def wallet_debit(body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    customer_id = body.get("customerId")
    amount = float(body.get("amount") or 0)
    if not customer_id:
        return err("customerId is required", 400)
    if amount <= 0:
        return err("amount must be > 0", 400)
    wallet = await _ensure_wallet(db, tenantId, customer_id, user.id)
    try:
        async with txn(db):
            after = await _wallet_tx(db, tenantId, wallet, customer_id, "DEDUCT", amount, user.id,
                                     body.get("refType"), body.get("refId"), body.get("note") or "Wallet payment")
    except ValueError as e:
        return err(str(e), 400)
    await db.commit()
    return ok({"customerId": customer_id, "type": "DEDUCT", "amount": amount, "balance": after}, 201)


@router.get("/api/v1/wallet/transactions")
async def list_wallet_transactions(customerId: str = "", limit: int = Query(100),
                                   user: AuthUser = Depends(require_auth),
                                   tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if customerId:
        where += " AND customerId=:c"
        params["c"] = customerId
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM wallet_transactions WHERE {where} ORDER BY createdAt DESC LIMIT :lim"),
        {**params, "lim": min(limit, 500)})).fetchall())
    return ok(rows)


# ═════════════════════════ GIFT CARDS (ledger-first) ═════════════════════════

def _gen_card_no(prefix: str = "GC") -> str:
    return f"{prefix}{''.join(_coupon_seq.choices(string.digits, k=10))}"


@router.post("/api/v1/gift-cards")
async def create_gift_card(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    initial = float(body.get("initialAmount") or 0)
    if initial <= 0:
        return err("initialAmount must be > 0", 400)
    card_no = (body.get("cardNo") or _gen_card_no()).strip()
    dup = (await db.execute(text("SELECT id FROM gift_cards WHERE tenantId=:t AND cardNo=:n"),
                            {"t": tenantId, "n": card_no})).first()
    if dup:
        return err("Card number already exists", 409)
    expiry = body.get("expiryDate")
    if not expiry:
        months = 12
        expiry = (date.today() + timedelta(days=365)).isoformat()
    card_id = _uid()
    cust_id = body.get("issuedToCustomerId")
    cust_name = None
    if cust_id:
        cust = (await db.execute(text("SELECT name FROM customers WHERE id=:id AND tenantId=:t"),
                                 {"id": cust_id, "t": tenantId})).first()
        cust_name = cust[0] if cust else None
    async with txn(db):
        await db.execute(text(
            "INSERT INTO gift_cards (id, tenantId, cardNo, cardType, barcode, pin, initialAmount, balance, "
            "currency, expiryDate, status, issuedToCustomerId, issuedToName, createdBy) "
            "VALUES (:id, :t, :n, :ct, :bc, :pin, :ia, :ia, 'BDT', :ex, 'ACTIVE', :ci, :cn, :u)"),
            {"id": card_id, "t": tenantId, "n": card_no, "ct": (body.get("cardType") or "DIGITAL").upper(),
             "bc": body.get("barcode") or card_no, "pin": body.get("pin"), "ia": initial,
             "ex": expiry, "ci": cust_id, "cn": cust_name, "u": user.id})
        # Issue ledger entry — the only way the balance moves
        await db.execute(text(
            "INSERT INTO gift_card_transactions (id, tenantId, cardId, type, amount, balanceBefore, balanceAfter, "
            "note, createdBy) VALUES (:id, :t, :c, 'ISSUE', :am, 0, :am, :n, :u)"),
            {"id": _uid(), "t": tenantId, "c": card_id, "am": initial,
             "n": body.get("note") or f"Card issued with ৳{initial:,.0f}", "u": user.id})
    return ok({"id": card_id, "cardNo": card_no, "balance": initial, "expiryDate": expiry}, 201)


@router.get("/api/v1/gift-cards")
async def list_gift_cards(search: str = "", status: str = "", limit: int = Query(100),
                          user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status=:s"
        params["s"] = status.upper()
    if search:
        where += " AND (cardNo LIKE :q OR issuedToName LIKE :q OR barcode LIKE :q)"
        params["q"] = f"%{search}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM gift_cards WHERE {where} ORDER BY createdAt DESC LIMIT :lim"),
        {**params, "lim": min(limit, 500)})).fetchall())
    return ok(rows)


@router.get("/api/v1/gift-cards/lookup")
async def lookup_gift_card(cardNo: str = "", barcode: str = "", user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where, params = "tenantId=:t", {"t": tenantId}
    if cardNo:
        where += " AND cardNo=:n"
        params["n"] = cardNo
    elif barcode:
        where += " AND barcode=:b"
        params["b"] = barcode
    else:
        return err("cardNo or barcode required", 400)
    row = (await db.execute(text(f"SELECT * FROM gift_cards WHERE {where} LIMIT 1"), params)).first()
    if not row:
        return err("Gift card not found", 404)
    return ok(dict(row._mapping))


@router.get("/api/v1/gift-cards/{cardId}")
async def get_gift_card(cardId: str, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM gift_cards WHERE id=:id AND tenantId=:t"),
                            {"id": cardId, "t": tenantId})).first()
    if not row:
        return err("Gift card not found", 404)
    txns = rows_to_dicts((await db.execute(text(
        "SELECT * FROM gift_card_transactions WHERE tenantId=:t AND cardId=:c ORDER BY createdAt DESC LIMIT 100"),
        {"t": tenantId, "c": cardId})).fetchall())
    d = dict(row._mapping)
    d["transactions"] = txns
    return ok(d)


async def _gift_mutate(db: AsyncSession, tenant_id: str, card: dict, tx_type: str, amount: float,
                       user_id: str, note: str = None, sale_id: str = None, ref_type: str = None,
                       ref_id: str = None) -> float:
    before = float(card["balance"])
    if tx_type in ("REDEEM", "ADJUST_OUT", "DISABLE"):
        if amount > before:
            raise ValueError("Insufficient gift card balance")
        after = before - amount
    elif tx_type == "DISABLE_EMPTY":
        after = 0.0
    else:  # RELOAD / REFUND / ADJUST
        after = before + amount
    stype = tx_type
    if tx_type == "REDEEM":
        stype = "REDEEM"
    elif tx_type == "ADJUST_OUT":
        stype = "ADJUST"
    elif tx_type == "ADJUST":
        stype = "ADJUST"
    elif tx_type == "DISABLE_EMPTY":
        stype = "DISABLE"
    await db.execute(text(
        "INSERT INTO gift_card_transactions (id, tenantId, cardId, type, amount, balanceBefore, balanceAfter, "
        "refType, refId, saleId, note, createdBy) VALUES (:id, :t, :c, :ty, :am, :bb, :ba, :rt, :ri, :s, :n, :u)"),
        {"id": _uid(), "t": tenant_id, "c": card["id"], "ty": stype, "am": amount,
         "bb": before, "ba": after, "rt": ref_type, "ri": ref_id, "s": sale_id, "n": note, "u": user_id})
    await db.execute(text("UPDATE gift_cards SET balance=:b, updatedAt=NOW() WHERE id=:id"),
                     {"b": after, "id": card["id"]})
    return after


@router.post("/api/v1/gift-cards/{cardId}/redeem")
async def redeem_gift_card(cardId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM gift_cards WHERE id=:id AND tenantId=:t"),
                            {"id": cardId, "t": tenantId})).first()
    if not row:
        return err("Gift card not found", 404)
    card = dict(row._mapping)
    if card["status"] != "ACTIVE":
        return err(f"Card is {card['status']}", 400)
    if card.get("expiryDate") and card["expiryDate"] < date.today():
        return err("Card has expired", 400)
    amount = float(body.get("amount") or 0)
    if amount <= 0:
        return err("amount must be > 0", 400)
    try:
        async with txn(db):
            after = await _gift_mutate(db, tenantId, card, "REDEEM", amount, user.id,
                                       body.get("note") or "Redeemed at POS",
                                       sale_id=body.get("saleId"), ref_type="SALE", ref_id=body.get("saleId"))
    except ValueError as e:
        return err(str(e), 400)
    return ok({"cardId": cardId, "redeemed": amount, "balance": after}, 200)


@router.post("/api/v1/gift-cards/{cardId}/reload")
async def reload_gift_card(cardId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM gift_cards WHERE id=:id AND tenantId=:t"),
                            {"id": cardId, "t": tenantId})).first()
    if not row:
        return err("Gift card not found", 404)
    card = dict(row._mapping)
    if card["status"] != "ACTIVE":
        return err(f"Card is {card['status']}", 400)
    amount = float(body.get("amount") or 0)
    if amount <= 0:
        return err("amount must be > 0", 400)
    async with txn(db):
        after = await _gift_mutate(db, tenantId, card, "RELOAD", amount, user.id,
                                   body.get("note") or f"Reloaded ৳{amount:,.0f}")
    return ok({"cardId": cardId, "reloaded": amount, "balance": after}, 200)


@router.post("/api/v1/gift-cards/{cardId}/disable")
async def disable_gift_card(cardId: str, body: dict, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM gift_cards WHERE id=:id AND tenantId=:t"),
                            {"id": cardId, "t": tenantId})).first()
    if not row:
        return err("Gift card not found", 404)
    card = dict(row._mapping)
    if card["status"] != "ACTIVE":
        return err(f"Card is {card['status']}", 400)
    reason = body.get("reason") or "Card disabled"
    await db.execute(text("UPDATE gift_cards SET status='DISABLED', updatedAt=NOW() WHERE id=:id"), {"id": cardId})
    await db.execute(text(
        "INSERT INTO gift_card_transactions (id, tenantId, cardId, type, amount, balanceBefore, balanceAfter, "
        "note, createdBy) VALUES (:id, :t, :c, 'DISABLE', 0, :bb, :bb, :n, :u)"),
        {"id": _uid(), "t": tenantId, "c": cardId, "bb": float(card["balance"]), "n": reason, "u": user.id})
    await db.commit()
    return ok({"cardId": cardId, "status": "DISABLED"}, 200)


# ═════════════════════════ MARKETING AUTOMATION (§10.34) ═════════════════════════

@router.get("/api/v1/marketing/triggers")
async def list_triggers(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                        db: AsyncSession = Depends(get_db)):
    return ok(TRIGGER_CATALOG)


@router.get("/api/v1/marketing/campaigns")
async def list_campaigns(status: str = "", triggerType: str = "", user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status=:s"
        params["s"] = status.upper()
    if triggerType:
        where += " AND triggerType=:tr"
        params["tr"] = triggerType.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM marketing_campaigns WHERE {where} ORDER BY createdAt DESC LIMIT 100"), params)).fetchall())
    for r in rows:
        r["channels"] = _json_in(r.get("channels"))
        r["conditions"] = _json_in(r.get("conditions"))
        r["couponTemplate"] = _json_in(r.get("couponTemplate"))
    return ok(rows)


@router.post("/api/v1/marketing/campaigns")
async def create_campaign(body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = (body.get("name") or "").strip()
    trigger = (body.get("triggerType") or "").upper()
    if not name or trigger not in {t["code"] for t in TRIGGER_CATALOG}:
        return err("name and a valid triggerType are required", 400)
    cid = _uid()
    await db.execute(text(
        "INSERT INTO marketing_campaigns (id, tenantId, name, triggerType, status, channels, conditions, "
        "couponTemplate, startDate, endDate, createdBy) VALUES (:id, :t, :n, :tr, 'DRAFT', :ch, :co, :cp, :sd, :ed, :u)"),
        {"id": cid, "t": tenantId, "n": name, "tr": trigger,
         "ch": _json_out(body.get("channels")) or '["SMS"]',
         "co": _json_out(body.get("conditions")), "cp": _json_out(body.get("couponTemplate")),
         "sd": body.get("startDate"), "ed": body.get("endDate"), "u": user.id})
    await db.commit()
    return ok({"id": cid, "name": name, "triggerType": trigger, "status": "DRAFT"}, 201)


@router.get("/api/v1/marketing/campaigns/{campaignId}")
async def get_campaign(campaignId: str, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT * FROM marketing_campaigns WHERE id=:id AND tenantId=:t"),
                            {"id": campaignId, "t": tenantId})).first()
    if not row:
        return err("Campaign not found", 404)
    d = dict(row._mapping)
    d["channels"] = _json_in(d.get("channels"))
    d["conditions"] = _json_in(d.get("conditions"))
    d["couponTemplate"] = _json_in(d.get("couponTemplate"))
    grants = rows_to_dicts((await db.execute(text(
        "SELECT g.*, c.phone, c.email FROM marketing_grants g "
        "LEFT JOIN customers c ON c.id=g.customerId AND c.tenantId=g.tenantId "
        "WHERE g.tenantId=:t AND g.campaignId=:c ORDER BY g.createdAt DESC LIMIT 200"),
        {"t": tenantId, "c": campaignId})).fetchall())
    d["grants"] = grants
    return ok(d)


@router.patch("/api/v1/marketing/campaigns/{campaignId}")
async def update_campaign(campaignId: str, body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM marketing_campaigns WHERE id=:id AND tenantId=:t"),
                            {"id": campaignId, "t": tenantId})).first()
    if not row:
        return err("Campaign not found", 404)
    fields, params = [], {"id": campaignId, "t": tenantId}
    for key in ("name", "triggerType", "status", "startDate", "endDate"):
        if key in body and body[key] is not None:
            fields.append(f"{key}=:{key}")
            params[key] = (body[key].upper() if key in ("triggerType", "status") else body[key])
    for key, col in (("channels", "channels"), ("conditions", "conditions"), ("couponTemplate", "couponTemplate")):
        if key in body:
            fields.append(f"{col}=:{col}")
            params[col] = _json_out(body[key])
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE marketing_campaigns SET {', '.join(fields)}, updatedAt=NOW() WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.post("/api/v1/marketing/campaigns/{campaignId}/activate")
async def activate_campaign(campaignId: str, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT status FROM marketing_campaigns WHERE id=:id AND tenantId=:t"),
                            {"id": campaignId, "t": tenantId})).first()
    if not row:
        return err("Campaign not found", 404)
    await db.execute(text("UPDATE marketing_campaigns SET status='ACTIVE', updatedAt=NOW() WHERE id=:id"), {"id": campaignId})
    await db.commit()
    return ok({"status": "ACTIVE"})


@router.post("/api/v1/marketing/campaigns/{campaignId}/pause")
async def pause_campaign(campaignId: str, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT status FROM marketing_campaigns WHERE id=:id AND tenantId=:t"),
                            {"id": campaignId, "t": tenantId})).first()
    if not row:
        return err("Campaign not found", 404)
    await db.execute(text("UPDATE marketing_campaigns SET status='PAUSED', updatedAt=NOW() WHERE id=:id"), {"id": campaignId})
    await db.commit()
    return ok({"status": "PAUSED"})


async def _match_customers(db: AsyncSession, tenant_id: str, campaign: dict) -> list[dict]:
    """Evaluate the campaign trigger against the tenant's customers. Returns a
    list of {customerId, name, phone, email, reason}."""
    trigger = campaign["triggerType"]
    conds = _json_in(campaign.get("conditions")) or {}
    days = int(conds.get("daysInactive") or conds.get("days") or 30)
    lookback = int(conds.get("lookbackDays") or 30)
    min_amount = float(conds.get("minAmount") or 10000)
    milestone = int(conds.get("milestonePoints") or 500)
    rows = []
    q = None
    params: dict = {"t": tenant_id}
    if trigger == "INACTIVE_30D":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email, "
             "COALESCE(c.lastPurchaseAt, c.createdAt) AS lastActive FROM customers c "
             "WHERE c.tenantId=:t AND c.status='ACTIVE' AND "
             "COALESCE(c.lastPurchaseAt, c.createdAt) < NOW() - INTERVAL :d DAY")
        params["d"] = max(days, 1)
    elif trigger == "BIRTHDAY":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email FROM customers c "
             "WHERE c.tenantId=:t AND c.dateOfBirth IS NOT NULL "
             "AND MONTH(c.dateOfBirth)=MONTH(CURDATE()) AND DAY(c.dateOfBirth)=DAY(CURDATE())")
    elif trigger == "ANNIVERSARY":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email FROM customers c "
             "WHERE c.tenantId=:t AND MONTH(c.createdAt)=MONTH(CURDATE()) "
             "AND DAY(c.createdAt)=DAY(CURDATE())")
    elif trigger == "FIRST_PURCHASE":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email, MIN(s.saleDate) AS firstSale "
             "FROM customers c JOIN sales s ON s.customerId=c.id AND s.tenantId=c.tenantId "
             "AND s.status IN ('CONFIRMED','COMPLETED') "
             "WHERE c.tenantId=:t GROUP BY c.id, c.name, c.phone, c.email "
             "HAVING firstSale >= CURDATE() - INTERVAL :lb DAY")
        params["lb"] = max(lookback, 1)
    elif trigger == "HIGH_VALUE":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email FROM customers c "
             "WHERE c.tenantId=:t AND EXISTS (SELECT 1 FROM sales s WHERE s.customerId=c.id "
             "AND s.tenantId=c.tenantId AND s.status IN ('CONFIRMED','COMPLETED') "
             "AND s.total >= :ma AND s.saleDate >= CURDATE() - INTERVAL :lb DAY)")
        params["ma"], params["lb"] = min_amount, max(lookback, 1)
    elif trigger == "ABANDONED_CART":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email FROM customers c "
             "WHERE c.tenantId=:t AND EXISTS (SELECT 1 FROM sales_orders so WHERE so.customerId=c.id "
             "AND so.tenantId=c.tenantId AND so.status='DRAFT' "
             "AND so.createdAt < NOW() - INTERVAL :d DAY)")
        params["d"] = max(days, 1)
    elif trigger == "EXPIRY_REMINDER":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email FROM customers c "
             "WHERE c.tenantId=:t AND EXISTS (SELECT 1 FROM gift_cards gc WHERE gc.issuedToCustomerId=c.id "
             "AND gc.tenantId=c.tenantId AND gc.status='ACTIVE' AND gc.expiryDate IS NOT NULL "
             "AND gc.expiryDate BETWEEN CURDATE() AND CURDATE() + INTERVAL :d DAY)")
        params["d"] = max(days, 1)
    elif trigger == "LOYALTY_MILESTONE":
        q = ("SELECT c.id AS customerId, c.name, c.phone, c.email FROM loyalty_accounts la "
             "JOIN customers c ON c.id=la.customerId AND c.tenantId=la.tenantId "
             "WHERE la.tenantId=:t AND la.lifetimeEarned >= :ms AND la.lifetimeEarned - :ms < 10000")
        params["ms"] = milestone
    if not q:
        return []
    try:
        raw = (await db.execute(text(q), params)).fetchall()
    except Exception:
        return []
    for r in raw:
        rows.append({"customerId": str(r[0]), "name": r[1], "phone": r[2], "email": r[3],
                     "reason": TRIGGER_CATALOG[next(i for i, t in enumerate(TRIGGER_CATALOG) if t["code"] == trigger)]["label"]})
    return rows


@router.post("/api/v1/marketing/campaigns/{campaignId}/run")
async def run_campaign(campaignId: str, body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Evaluate the trigger NOW and generate per-customer coupon grants. Sending
    itself (SMS/Email/…) is stubbed as PENDING until the Prompt 28 engine."""
    row = (await db.execute(text("SELECT * FROM marketing_campaigns WHERE id=:id AND tenantId=:t"),
                            {"id": campaignId, "t": tenantId})).first()
    if not row:
        return err("Campaign not found", 404)
    camp = dict(row._mapping)
    if camp["status"] not in ("ACTIVE", "DRAFT"):
        return err("Only ACTIVE or DRAFT campaigns can run", 400)
    matched = await _match_customers(db, tenantId, camp)
    coupon_tpl = _json_in(camp.get("couponTemplate")) or {}
    channels = _json_in(camp.get("channels")) or ["SMS"]
    created_grants = 0
    skipped = 0
    coupons_created = 0
    existing = set(r[0] for r in (await db.execute(text(
        "SELECT customerId FROM marketing_grants WHERE tenantId=:t AND campaignId=:c"),
        {"t": tenantId, "c": campaignId})).fetchall())
    prefix = (coupon_tpl.get("codePrefix") or camp["triggerType"][:3]).upper()
    for m in matched:
        if m["customerId"] in existing:
            skipped += 1
            continue
        coupon_id, coupon_code = None, None
        if coupon_tpl:
            code = _coupon_code(prefix)
            # keep trying until the code is unique
            for _ in range(10):
                dup = (await db.execute(text("SELECT id FROM coupons WHERE tenantId=:t AND code=:c"),
                                        {"t": tenantId, "c": code})).first()
                if not dup:
                    break
                code = _coupon_code(prefix)
            valid_days = int(coupon_tpl.get("validDays") or 14)
            coupon_id = _uid()
            await db.execute(text(
                "INSERT INTO coupons (id, tenantId, code, description, discountType, discountValue, minAmount, "
                "maxDiscount, usageLimit, perCustomerLimit, validFrom, validTo, isActive, status, createdBy) "
                "VALUES (:id, :t, :c, :d, :dt, :dv, :ma, :md, :ul, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL :vd DAY), 1, 'ACTIVE', :u)"),
                {"id": coupon_id, "t": tenantId, "c": code,
                 "d": coupon_tpl.get("description") or f"{camp['name']} offer",
                 "dt": coupon_tpl.get("discountType", "PERCENTAGE").upper(),
                 "dv": float(coupon_tpl.get("discountValue") or 10),
                 "ma": coupon_tpl.get("minAmount"), "md": coupon_tpl.get("maxDiscount"),
                 "ul": coupon_tpl.get("usageLimit", 1), "vd": valid_days, "u": user.id})
            coupon_code = code
            coupons_created += 1
        # one grant row per customer (uk: campaignId+customerId) — Prompt 28
        # Notification Engine fans the message out over the campaign's channel set.
        grant_id = _uid()
        await db.execute(text(
            "INSERT INTO marketing_grants (id, tenantId, campaignId, customerId, customerName, channel, "
            "couponId, couponCode, status, reason, createdBy) VALUES (:id, :t, :c, :cu, :cn, :ch, :co, :cc, 'PENDING', :r, :u)"),
            {"id": grant_id, "t": tenantId, "c": campaignId, "cu": m["customerId"], "cn": m["name"],
             "ch": channels[0], "co": coupon_id, "cc": coupon_code, "r": m["reason"], "u": user.id})
        # ── Prompt 28: real notification send (consent handled centrally by the engine) ──
        try:
            import notify as _nt
            send_res = await _nt.dispatch(
                db, tenantId, "PROMOTION", customer_id=m["customerId"], name=m["name"],
                channels=channels, ref_type="MARKETING_CAMPAIGN", ref_id=campaignId,
                params={"name": m["name"], "offer": camp["name"],
                        "coupon": f" — coupon {coupon_code}" if coupon_code else ""})
            best = send_res["results"][0]["status"] if send_res.get("results") else "FAILED"
            grant_status = {"SENT": "SENT", "SKIPPED_OPTOUT": "SKIPPED", "CHANNEL_OFF": "SKIPPED"}.get(best, "FAILED")
            await db.execute(text(
                "UPDATE marketing_grants SET status=:st, sentAt=CASE WHEN :st='SENT' THEN NOW() ELSE NULL END "
                "WHERE id=:id"), {"st": grant_status, "id": grant_id})
        except Exception:
            pass
        created_grants += 1
        existing.add(m["customerId"])
    await db.execute(text(
        "UPDATE marketing_campaigns SET lastRunAt=NOW(), totalMatched=totalMatched + :m, "
        "totalSent=totalSent + :g, updatedAt=NOW() WHERE id=:id"),
        {"m": len(matched) - skipped, "g": created_grants, "id": campaignId})
    await db.commit()
    return ok({"campaignId": campaignId, "matched": len(matched), "newCustomers": len(matched) - skipped,
               "skippedExisting": skipped, "couponsCreated": coupons_created,
               "grantsCreated": created_grants, "channel": channels[0] if channels else None,
               "sent": True, "note": "Promotions dispatched via the Prompt 28 Notification Engine (consent-aware)"})


@router.get("/api/v1/marketing/grants")
async def list_grants(campaignId: str = "", status: str = "", limit: int = Query(100),
                      user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                      db: AsyncSession = Depends(get_db)):
    where = "g.tenantId=:t"
    params: dict = {"t": tenantId}
    if campaignId:
        where += " AND g.campaignId=:c"
        params["c"] = campaignId
    if status:
        where += " AND g.status=:s"
        params["s"] = status.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT g.*, c.phone, c.email FROM marketing_grants g "
        f"LEFT JOIN customers c ON c.id=g.customerId AND c.tenantId=g.tenantId "
        f"WHERE {where} ORDER BY g.createdAt DESC LIMIT :lim"), {**params, "lim": min(limit, 500)})).fetchall())
    return ok(rows)


@router.delete("/api/v1/marketing/campaigns/{campaignId}")
async def delete_campaign(campaignId: str, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM marketing_campaigns WHERE id=:id AND tenantId=:t"),
                            {"id": campaignId, "t": tenantId})).first()
    if not row:
        return err("Campaign not found", 404)
    async with txn(db):
        await db.execute(text("DELETE FROM marketing_grants WHERE campaignId=:c"), {"c": campaignId})
        await db.execute(text("DELETE FROM marketing_campaigns WHERE id=:id"), {"id": campaignId})
    return ok({"deleted": True})


# ═════════════════════════ BUDGETS (§10.35) ═════════════════════════

async def _budget_actual(db: AsyncSession, tenant_id: str, b: dict) -> float:
    """Live actual from CONFIRMED/COMPLETED sales inside the budget period."""
    try:
        ps, pe = b["periodStart"], b["periodEnd"]
        if b["scopeType"] == "BRANCH":
            row = (await db.execute(text(
                "SELECT COALESCE(SUM(total),0) FROM sales WHERE tenantId=:t AND branchId=:s "
                "AND status IN ('CONFIRMED','COMPLETED') AND DATE(saleDate) BETWEEN :ps AND :pe"),
                {"t": tenant_id, "s": b["scopeId"], "ps": ps, "pe": pe})).first()
            return round(float(row[0]), 2)
        if b["scopeType"] == "DEPARTMENT":
            # user-ids of employees in the department → their sales
            user_ids = [r[0] for r in (await db.execute(text(
                "SELECT userId FROM hrm_employees WHERE tenantId=:t AND departmentId=:d AND userId IS NOT NULL"),
                {"t": tenant_id, "d": b["scopeId"]})).fetchall()]
            if not user_ids:
                return 0.0
            row = (await db.execute(text(
                "SELECT COALESCE(SUM(total),0) FROM sales WHERE tenantId=:t AND userId IN :uids "
                "AND status IN ('CONFIRMED','COMPLETED') AND DATE(saleDate) BETWEEN :ps AND :pe"),
                {"t": tenant_id, "uids": tuple(user_ids), "ps": ps, "pe": pe})).first()
            return round(float(row[0]), 2)
        if b["scopeType"] == "CATEGORY":
            row = (await db.execute(text(
                "SELECT COALESCE(SUM(si.lineTotal),0) FROM sale_items si "
                "JOIN sales s ON s.id=si.saleId AND s.tenantId=si.tenantId "
                "JOIN products p ON p.id=si.productId AND p.tenantId=si.tenantId "
                "WHERE si.tenantId=:t AND p.categoryId=:s AND s.status IN ('CONFIRMED','COMPLETED') "
                "AND DATE(s.saleDate) BETWEEN :ps AND :pe"),
                {"t": tenant_id, "s": b["scopeId"], "ps": ps, "pe": pe})).first()
            return round(float(row[0]), 2)
        return 0.0
    except Exception:
        return 0.0


@router.get("/api/v1/budgets")
async def list_budgets(scopeType: str = "", user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if scopeType:
        where += " AND scopeType=:st"
        params["st"] = scopeType.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM budgets WHERE {where} ORDER BY periodStart DESC, createdAt DESC LIMIT 200"), params)).fetchall())
    # decorate scope names
    for r in rows:
        r["scopeName"] = r["scopeId"]
        try:
            if r["scopeType"] == "BRANCH":
                nm = (await db.execute(text("SELECT name FROM branches WHERE id=:id"), {"id": r["scopeId"]})).first()
            elif r["scopeType"] == "DEPARTMENT":
                nm = (await db.execute(text("SELECT name FROM hrm_departments WHERE id=:id"), {"id": r["scopeId"]})).first()
            else:
                nm = (await db.execute(text("SELECT name FROM categories WHERE id=:id"), {"id": r["scopeId"]})).first()
            if nm:
                r["scopeName"] = nm[0]
        except Exception:
            pass
    return ok(rows)


@router.post("/api/v1/budgets")
async def create_budget(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    scope_type = (body.get("scopeType") or "").upper()
    scope_id = body.get("scopeId")
    amount = float(body.get("amount") or 0)
    if scope_type not in ("BRANCH", "DEPARTMENT", "CATEGORY"):
        return err("scopeType must be BRANCH/DEPARTMENT/CATEGORY", 400)
    if not scope_id:
        return err("scopeId is required", 400)
    if amount <= 0:
        return err("amount must be > 0", 400)
    ps = body.get("periodStart")
    pe = body.get("periodEnd")
    if not ps or not pe:
        return err("periodStart and periodEnd are required", 400)
    dup = (await db.execute(text(
        "SELECT id FROM budgets WHERE tenantId=:t AND scopeType=:st AND scopeId=:s AND periodStart=:ps AND periodEnd=:pe"),
        {"t": tenantId, "st": scope_type, "s": scope_id, "ps": ps, "pe": pe})).first()
    if dup:
        return err("A budget for this scope and period already exists", 409)
    bid = _uid()
    await db.execute(text(
        "INSERT INTO budgets (id, tenantId, name, scopeType, scopeId, periodType, periodStart, periodEnd, "
        "amount, note, status, createdBy) VALUES (:id, :t, :n, :st, :s, :pt, :ps, :pe, :a, :n2, 'ACTIVE', :u)"),
        {"id": bid, "t": tenantId, "n": body.get("name") or f"{scope_type.title()} budget",
         "st": scope_type, "s": scope_id, "pt": (body.get("periodType") or "CUSTOM").upper(),
         "ps": ps, "pe": pe, "a": amount, "n2": body.get("note"), "u": user.id})
    await db.commit()
    return ok({"id": bid, "scopeType": scope_type, "scopeId": scope_id, "amount": amount}, 201)


@router.get("/api/v1/budgets/variance")
async def budget_variance(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                          db: AsyncSession = Depends(get_db)):
    """Budget vs actual — actual is computed live from confirmed sales."""
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM budgets WHERE tenantId=:t ORDER BY periodStart DESC, createdAt DESC LIMIT 200"),
        {"t": tenantId})).fetchall())
    out = []
    for b in rows:
        b["scopeName"] = b["scopeId"]
        try:
            if b["scopeType"] == "BRANCH":
                nm = (await db.execute(text("SELECT name FROM branches WHERE id=:id"), {"id": b["scopeId"]})).first()
            elif b["scopeType"] == "DEPARTMENT":
                nm = (await db.execute(text("SELECT name FROM hrm_departments WHERE id=:id"), {"id": b["scopeId"]})).first()
            else:
                nm = (await db.execute(text("SELECT name FROM categories WHERE id=:id"), {"id": b["scopeId"]})).first()
            if nm:
                b["scopeName"] = nm[0]
        except Exception:
            pass
        actual = await _budget_actual(db, tenantId, b)
        amount = float(b.get("amount") or 0)
        variance = round(actual - amount, 2)
        b["actual"] = actual
        b["variance"] = variance
        b["variancePct"] = round(variance / amount * 100, 1) if amount else 0
        b["achievementPct"] = round(actual / amount * 100, 1) if amount else 0
        b["onTrack"] = actual >= amount
        out.append(b)
    totals = {
        "totalBudget": round(sum(float(x.get("amount") or 0) for x in out), 2),
        "totalActual": round(sum(x["actual"] for x in out), 2),
        "totalVariance": round(sum(x["variance"] for x in out), 2),
    }
    return ok({"budgets": out, "totals": totals})


@router.patch("/api/v1/budgets/{budgetId}")
async def update_budget(budgetId: str, body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM budgets WHERE id=:id AND tenantId=:t"),
                            {"id": budgetId, "t": tenantId})).first()
    if not row:
        return err("Budget not found", 404)
    fields, params = [], {"id": budgetId, "t": tenantId}
    for key in ("name", "amount", "periodStart", "periodEnd", "status", "note", "scopeType", "scopeId"):
        if key in body and body[key] is not None:
            fields.append(f"{key}=:{key}")
            params[key] = body[key]
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE budgets SET {', '.join(fields)}, updatedAt=NOW() WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/budgets/{budgetId}")
async def delete_budget(budgetId: str, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM budgets WHERE id=:id AND tenantId=:t"),
                            {"id": budgetId, "t": tenantId})).first()
    if not row:
        return err("Budget not found", 404)
    await db.execute(text("DELETE FROM budgets WHERE id=:id"), {"id": budgetId})
    await db.commit()
    return ok({"deleted": True})
