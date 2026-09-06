"""Integration Marketplace (Prompt 34, §38 item 30).

Directory of connectors: Payment Gateway, SMS Provider, Email, Accounting Export,
Marketplace Adapters, Logistics, POS Hardware.
Tenants can enable/configure/disable integrations.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

# Default marketplace catalog
DEFAULT_INTEGRATIONS = [
    # Payment Gateways
    {"code": "STRIPE", "name": "Stripe", "category": "PAYMENT", "description": "Accept credit/debit cards, Apple Pay, Google Pay", "icon": "stripe", "docsUrl": "https://stripe.com/docs"},
    {"code": "RAZORPAY", "name": "Razorpay", "category": "PAYMENT", "description": "Cards, UPI, NetBanking, Wallets", "icon": "razorpay", "docsUrl": "https://razorpay.com/docs"},
    {"code": "bKASH", "name": "bKASH", "category": "PAYMENT", "description": "Mobile financial service for Bangladesh", "icon": "bkash", "docsUrl": "https://developer.bkash.com"},
    {"code": "NAGAD", "name": "Nagad", "category": "PAYMENT", "description": "Digital financial services", "icon": "nagad", "docsUrl": "https://nagad.com.bd"},
    {"code": "SQUARE", "name": "Square", "category": "PAYMENT", "description": "POS payments and invoicing", "icon": "square", "docsUrl": "https://developer.squareup.com"},
    # SMS Providers
    {"code": "TWILIO", "name": "Twilio", "category": "SMS", "description": "Programmable SMS for notifications, OTPs, alerts", "icon": "twilio", "docsUrl": "https://twilio.com/docs"},
    {"code": "NEXMO", "name": "Vonage (Nexmo)", "category": "SMS", "description": "Global SMS and voice API", "icon": "vonage", "docsUrl": "https://vonage.com/docs"},
    {"code": "SMS_BANGLADESH", "name": "SMS Gateway BD", "category": "SMS", "description": "Local Bangladeshi SMS gateway", "icon": "sms-bd", "docsUrl": "#"},
    # Email
    {"code": "SENDGRID", "name": "SendGrid", "category": "EMAIL", "description": "Transactional and marketing email", "icon": "sendgrid", "docsUrl": "https://docs.sendgrid.com"},
    {"code": "MAILGUN", "name": "Mailgun", "category": "EMAIL", "description": "Email API for developers", "icon": "mailgun", "docsUrl": "https://documentation.mailgun.com"},
    # Accounting
    {"code": "QUICKBOOKS", "name": "QuickBooks", "category": "ACCOUNTING", "description": "Sync invoices, expenses, journal entries", "icon": "quickbooks", "docsUrl": "https://developer.intuit.com"},
    {"code": "XERO", "name": "Xero", "category": "ACCOUNTING", "description": "Cloud accounting integration", "icon": "xero", "docsUrl": "https://developer.xero.com"},
    # Marketplace
    {"code": "SHOPIFY", "name": "Shopify", "category": "MARKETPLACE", "description": "Sync products, orders, inventory with Shopify store", "icon": "shopify", "docsUrl": "https://shopify.dev"},
    {"code": "WOOCOMMERCE", "name": "WooCommerce", "category": "MARKETPLACE", "description": "WordPress e-commerce integration", "icon": "woocommerce", "docsUrl": "https://woocommerce.github.io"},
    # Logistics
    {"code": "PATHAO", "name": "Pathao", "category": "LOGISTICS", "description": "Last-mile delivery in Bangladesh", "icon": "pathao", "docsUrl": "https://pathao.com/docs"},
    {"code": "REDX", "name": "RedX", "category": "LOGISTICS", "description": "Courier and parcel delivery", "icon": "redx", "docsUrl": "https://www.redx.com.bd"},
    {"code": "PAPERFLY", "name": "Paperfly", "category": "LOGISTICS", "description": "E-commerce delivery partner", "icon": "paperfly", "docsUrl": "#"},
    # POS Hardware
    {"code": "EPSON_PRINTER", "name": "Epson Thermal Printer", "category": "POS", "description": "Epson TM-T88/T20 thermal receipt printer", "icon": "epson", "docsUrl": "#"},
    {"code": "BIXOLON", "name": "Bixolon Printer", "category": "POS", "description": "Bixolon thermal POS printer", "icon": "bixolon", "docsUrl": "#"},
]


def _uid() -> str:
    return str(uuid.uuid4())


@router.get("/api/v1/integrations")
async def list_integrations(
    category: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if category:
        where += " AND category=:c"; params["c"] = category.upper()

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM integrations WHERE {where} ORDER BY category, name"), params)).fetchall())
    for r in rows:
        if isinstance(r.get("config"), str):
            try: r["config"] = json.loads(r["config"])
            except: pass
    return ok(rows)


@router.get("/api/v1/integrations/catalog")
async def marketplace_catalog(
    category: str = "",
):
    """Return the available integrations catalog (not tenant-scoped)."""
    catalog = DEFAULT_INTEGRATIONS
    if category:
        catalog = [i for i in catalog if i["category"] == category.upper()]
    return ok(catalog)


@router.get("/api/v1/integrations/categories")
async def integration_categories():
    cats = {}
    for i in DEFAULT_INTEGRATIONS:
        c = i["category"]
        cats[c] = cats.get(c, 0) + 1
    return ok(cats)


@router.post("/api/v1/integrations/{code}/enable")
async def enable_integration(
    code: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Enable and optionally configure an integration."""
    code = code.upper()
    # Find in catalog
    catalog_match = next((i for i in DEFAULT_INTEGRATIONS if i["code"] == code), None)
    if not catalog_match:
        return err(f"Integration '{code}' not found in catalog", 404)

    config = body.get("config", {})
    iid = _uid()

    # Upsert
    existing = (await db.execute(text(
        "SELECT id FROM integrations WHERE tenantId=:t AND code=:c"),
        {"t": tenantId, "c": code})).first()

    if existing:
        eid = (dict(existing._mapping) if hasattr(existing, '_mapping') else dict(existing))["id"]
        config_str = json.dumps(config) if isinstance(config, dict) else config
        await db.execute(text(
            "UPDATE integrations SET config=:cfg, isEnabled=1, status='ENABLED', "
            "updatedAt=NOW() WHERE id=:id"),
            {"cfg": config_str, "id": eid})
        await db.commit()
        return ok({"id": eid, "code": code, "status": "ENABLED", "message": f"{catalog_match['name']} enabled"})

    await db.execute(text(
        "INSERT INTO integrations (id, tenantId, code, name, category, description, config, "
        "isEnabled, status, icon, docsUrl) VALUES (:id, :t, :c, :n, :cat, :d, :cfg, 1, 'ENABLED', :i, :u)"),
        {"id": iid, "t": tenantId, "c": code, "n": catalog_match["name"],
         "cat": catalog_match["category"], "d": catalog_match["description"],
         "cfg": json.dumps(config) if isinstance(config, dict) else config,
         "i": catalog_match.get("icon"), "u": catalog_match.get("docsUrl")})
    await db.commit()
    return ok({"id": iid, "code": code, "status": "ENABLED"}, 201)


@router.post("/api/v1/integrations/{code}/disable")
async def disable_integration(
    code: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(text(
        "UPDATE integrations SET isEnabled=0, status='AVAILABLE', updatedAt=NOW() "
        "WHERE tenantId=:t AND code=:c"),
        {"t": tenantId, "c": code.upper()})
    if res.rowcount == 0:
        return err("Integration not found", 404)
    await db.commit()
    return ok({"disabled": True})


@router.patch("/api/v1/integrations/{code}/config")
async def update_integration_config(
    code: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    config = body.get("config", {})
    res = await db.execute(text(
        "UPDATE integrations SET config=:cfg, updatedAt=NOW() WHERE tenantId=:t AND code=:c"),
        {"cfg": json.dumps(config) if isinstance(config, dict) else config,
         "t": tenantId, "c": code.upper()})
    if res.rowcount == 0:
        return err("Integration not found", 404)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/integrations/{code}")
async def remove_integration(
    code: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "DELETE FROM integrations WHERE tenantId=:t AND code=:c"),
        {"t": tenantId, "c": code.upper()})
    await db.commit()
    return ok({"deleted": True})
