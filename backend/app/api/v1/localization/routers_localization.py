"""Localization System (Prompt 37, §22).

- Translation strings management (en, bn, ar)
- Tenant locale settings (currency, date format, timezone, RTL)
- UI translation (separate from business data translation)
"""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

SUPPORTED_LOCALES = [
    {"code": "en", "name": "English", "nativeName": "English", "rtl": False},
    {"code": "bn", "name": "Bengali", "nativeName": "বাংলা", "rtl": False},
    {"code": "ar", "name": "Arabic", "nativeName": "العربية", "rtl": True},
]

# Pre-seeded UI translations for English and Bengali
SEED_TRANSLATIONS = {
    "en": {
        "nav.dashboard": "Dashboard",
        "nav.pos": "Point of Sale",
        "nav.products": "Products",
        "nav.customers": "Customers",
        "nav.suppliers": "Suppliers",
        "nav.invoices": "Invoices",
        "nav.orders": "Orders",
        "nav.inventory": "Inventory",
        "nav.accounting": "Accounting",
        "nav.reports": "Reports",
        "nav.settings": "Settings",
        "nav.hrm": "HR & Payroll",
        "nav.delivery": "Delivery",
        "nav.restaurant": "Restaurant",
        "nav.laundry": "Laundry",
        "nav.repair": "Repair",
        "pos.cart.subtotal": "Subtotal",
        "pos.cart.discount": "Discount",
        "pos.cart.tax": "Tax",
        "pos.cart.total": "Total",
        "pos.cart.pay": "Pay",
        "pos.cart.clear": "Clear Cart",
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.create": "Create",
        "common.search": "Search",
        "common.loading": "Loading...",
        "common.noData": "No data found",
        "common.success": "Success",
        "common.error": "Error",
        "common.confirm": "Confirm",
        "common.back": "Back",
        "common.next": "Next",
        "common.previous": "Previous",
        "common.all": "All",
        "common.active": "Active",
        "common.inactive": "Inactive",
        "common.status": "Status",
        "common.date": "Date",
        "common.amount": "Amount",
        "common.quantity": "Quantity",
        "common.price": "Price",
        "common.total": "Total",
        "common.action": "Action",
        "common.actions": "Actions",
        "common.details": "Details",
        "common.print": "Print",
        "common.export": "Export",
        "common.import": "Import",
        "common.filter": "Filter",
        "common.sort": "Sort",
        "common.refresh": "Refresh",
        "common.close": "Close",
        "common.open": "Open",
        "common.yes": "Yes",
        "common.no": "No",
        "common.ok": "OK",
        "common.name": "Name",
        "common.phone": "Phone",
        "common.email": "Email",
        "common.address": "Address",
        "common.notes": "Notes",
        "common.description": "Description",
    },
    "bn": {
        "nav.dashboard": "ড্যাশবোর্ড",
        "nav.pos": "পয়েন্ট অফ সেল",
        "nav.products": "পণ্য",
        "nav.customers": "গ্রাহক",
        "nav.suppliers": "সরবরাহকারী",
        "nav.invoices": "চালান",
        "nav.orders": "অর্ডার",
        "nav.inventory": "ইনভেন্টরি",
        "nav.accounting": "হিসাববিজ্ঞান",
        "nav.reports": "রিপোর্ট",
        "nav.settings": "সেটিংস",
        "nav.hrm": "এইচআর ও বেতন",
        "nav.delivery": "ডেলিভারি",
        "nav.restaurant": "রেস্তোরাঁ",
        "nav.laundry": "ধোপাখানা",
        "nav.repair": "মেরামত",
        "pos.cart.subtotal": "উপমোট",
        "pos.cart.discount": "ছাড়",
        "pos.cart.tax": "কর",
        "pos.cart.total": "মোট",
        "pos.cart.pay": "পেমেন্ট",
        "pos.cart.clear": "কার্ট মুছুন",
        "common.save": "সংরক্ষণ",
        "common.cancel": "বাতিল",
        "common.delete": "মুছুন",
        "common.edit": "সম্পাদনা",
        "common.create": "তৈরি",
        "common.search": "অনুসন্ধান",
        "common.loading": "লোড হচ্ছে...",
        "common.noData": "কোনো তথ্য পাওয়া যায়নি",
        "common.success": "সফল",
        "common.error": "ত্রুটি",
        "common.confirm": "নিশ্চিত",
        "common.back": "পেছনে",
        "common.next": "পরবর্তী",
        "common.previous": "পূর্ববর্তী",
        "common.all": "সব",
        "common.active": "সক্রিয়",
        "common.inactive": "নিষ্ক্রিয়",
        "common.status": "অবস্থা",
        "common.date": "তারিখ",
        "common.amount": "পরিমাণ",
        "common.quantity": "পরিমাণ",
        "common.price": "মূল্য",
        "common.total": "মোট",
        "common.action": "কাজ",
        "common.actions": "কাজসমূহ",
        "common.details": "বিস্তারিত",
        "common.print": "প্রিন্ট",
        "common.export": "রপ্তানি",
        "common.import": "আমদানি",
        "common.filter": "ফিল্টার",
        "common.sort": "সাজান",
        "common.refresh": "রিফ্রেশ",
        "common.close": "বন্ধ",
        "common.open": "খোলা",
        "common.yes": "হ্যাঁ",
        "common.no": "না",
        "common.ok": "ঠিক আছে",
        "common.name": "নাম",
        "common.phone": "ফোন",
        "common.email": "ইমেইল",
        "common.address": "ঠিকানা",
        "common.notes": "নোট",
        "common.description": "বিবরণ",
    },
}


def _uid() -> str:
    return str(uuid.uuid4())


async def _seed_translations(db: AsyncSession):
    """Seed default translations if not present."""
    count = (await db.execute(text("SELECT COUNT(*) FROM localization_strings"))).scalar()
    if count and count > 0:
        return
    for locale, strings in SEED_TRANSLATIONS.items():
        for key, value in strings.items():
            await db.execute(text(
                "INSERT IGNORE INTO localization_strings (id, locale, key_path, value, context) "
                "VALUES (:id, :l, :k, :v, 'UI')"),
                {"id": _uid(), "l": locale, "k": key, "v": value})
    await db.commit()


# ═══════════════ LOCALES ═══════════════

@router.get("/api/v1/locales")
async def list_locales():
    return ok(SUPPORTED_LOCALES)


@router.get("/api/v1/locales/translations/{locale}")
async def get_translations(
    locale: str,
    prefix: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Get all translations for a locale, optionally filtered by prefix."""
    await _seed_translations(db)

    where = "locale=:l"
    params: dict = {"l": locale}
    if prefix:
        where += " AND key_path LIKE :p"; params["p"] = f"{prefix}%"

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT key_path, value FROM localization_strings WHERE {where}"),
        params)).fetchall())

    # Convert flat list to nested dict
    translations = {}
    for r in rows:
        translations[r["key_path"]] = r["value"]

    return ok(translations)


@router.post("/api/v1/locales/translations")
async def upsert_translation(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Upsert a translation string. Body: { locale, keyPath, value, context? }"""
    locale = body.get("locale", "en")
    key_path = body.get("keyPath", "")
    value = body.get("value", "")
    context = body.get("context", "UI")

    if not key_path or not value:
        return err("keyPath and value required", 400)

    await db.execute(text(
        "INSERT INTO localization_strings (id, locale, key_path, value, context) "
        "VALUES (:id, :l, :k, :v, :c) "
        "ON DUPLICATE KEY UPDATE value=VALUES(value), updatedAt=NOW()"),
        {"id": _uid(), "l": locale, "k": key_path, "v": value, "c": context})
    await db.commit()

    return ok({"locale": locale, "keyPath": key_path, "value": value})


@router.post("/api/v1/locales/translations/bulk")
async def bulk_upsert_translations(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Bulk upsert translations. Body: { locale, translations: {key: value} }"""
    locale = body.get("locale", "en")
    translations = body.get("translations", {})

    if not translations:
        return err("translations required", 400)

    count = 0
    for key, value in translations.items():
        await db.execute(text(
            "INSERT INTO localization_strings (id, locale, key_path, value, context) "
            "VALUES (:id, :l, :k, :v, 'UI') "
            "ON DUPLICATE KEY UPDATE value=VALUES(value), updatedAt=NOW()"),
            {"id": _uid(), "l": locale, "k": key, "v": value})
        count += 1

    await db.commit()
    return ok({"locale": locale, "upserted": count})


@router.get("/api/v1/locales/stats")
async def locale_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text(
        "SELECT locale, COUNT(*) AS count FROM localization_strings GROUP BY locale ORDER BY locale"
    ))
    rows = rows_to_dicts(result.fetchall())
    return ok(rows)


# ═══════════════ TENANT LOCALE SETTINGS ═══════════════

@router.get("/api/v1/tenant/locale")
async def get_tenant_locale(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT * FROM tenant_locales WHERE tenantId=:t"), {"t": tenantId})).first()
    if not row:
        # Return defaults
        return ok({
            "locale": "en", "baseCurrency": "BDT", "dateFormat": "YYYY-MM-DD",
            "timeFormat": "24h", "numberFormat": "1,234.56",
            "timezone": "Asia/Dhaka", "fiscalYearStartMonth": 1, "rtl": False,
        })
    data = dict(row._mapping) if hasattr(row, '_mapping') else dict(row)
    return ok(data)


@router.post("/api/v1/tenant/locale")
async def set_tenant_locale(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Set tenant locale configuration."""
    locale = body.get("locale", "en")
    base_currency = (body.get("baseCurrency") or "BDT").upper()
    rtl = 1 if body.get("rtl") else 0

    locale_info = next((l for l in SUPPORTED_LOCALES if l["code"] == locale), None)
    if not locale_info:
        return err(f"Unsupported locale. Supported: {[l['code'] for l in SUPPORTED_LOCALES]}", 400)

    await db.execute(text(
        "INSERT INTO tenant_locales (id, tenantId, locale, baseCurrency, dateFormat, timeFormat, "
        "numberFormat, timezone, fiscalYearStartMonth, rtl) "
        "VALUES (:id, :t, :l, :bc, :df, :tf, :nf, :tz, :fy, :rtl) "
        "ON DUPLICATE KEY UPDATE locale=VALUES(locale), baseCurrency=VALUES(baseCurrency), "
        "dateFormat=VALUES(dateFormat), timeFormat=VALUES(timeFormat), numberFormat=VALUES(numberFormat), "
        "timezone=VALUES(timezone), fiscalYearStartMonth=VALUES(fiscalYearStartMonth), "
        "rtl=VALUES(rtl), updatedAt=NOW()"),
        {"id": _uid(), "t": tenantId, "l": locale, "bc": base_currency,
         "df": body.get("dateFormat", "YYYY-MM-DD"),
         "tf": body.get("timeFormat", "24h"),
         "nf": body.get("numberFormat", "1,234.56"),
         "tz": body.get("timezone", "Asia/Dhaka"),
         "fy": body.get("fiscalYearStartMonth", 1),
         "rtl": rtl})

    # Also update tenant currency
    await db.execute(text(
        "UPDATE tenants SET currency=:c WHERE id=:t"), {"c": base_currency, "t": tenantId})
    await db.commit()

    return ok({"locale": locale, "baseCurrency": base_currency, "rtl": bool(rtl)})
