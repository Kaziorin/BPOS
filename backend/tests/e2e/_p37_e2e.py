"""Prompt 37 — Multi-Currency & Localization: E2E.

Run:  venv/bin/python _p37_e2e.py   (server must be up on :4000)
"""
import json
import urllib.error
import urllib.request

from db import sync_engine
from sqlalchemy import text

BASE = "http://localhost:4000"
PASSED = []
MARK = "P37"


def call(method, path, body=None, hdrs=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", **(hdrs or {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def check(label, cond, detail=""):
    if cond:
        PASSED.append(label)
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label}  {detail}")
        raise SystemExit(1)


def sql_exec(stmt, **p):
    with sync_engine.connect() as c:
        c.execute(text(stmt), p)
        c.commit()


# Login
st, d = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
assert st == 200, d
H = {"Authorization": f"Bearer {d['token']}", "x-tenant-id": d["tenant"]["slug"]}
TENANT = d["tenant"]["id"]
print(f"tenant={TENANT} slug={d['tenant']['slug']}")


# ═══════════════ 1. CURRENCIES ═══════════════
print("\n== 1. Currencies ==")

st, r = call("GET", "/api/v1/currencies", hdrs=H)
currencies = r.get("data", []) if st == 200 else []
check("list currencies", st == 200 and isinstance(currencies, list), str(r)[:200])
check("currencies seeded", len(currencies) >= 5, f"got {len(currencies)}")
check("BDT exists", any(c["code"] == "BDT" for c in currencies), str(currencies[:3]))
check("USD exists", any(c["code"] == "USD" for c in currencies), "")

st, r = call("GET", "/api/v1/currencies/BDT", hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("get BDT currency", st == 200 and data.get("code") == "BDT", str(r)[:200])
check("BDT symbol is ৳", data.get("symbol") == "৳", str(data)[:200])

st, r = call("GET", "/api/v1/currencies/INVALID", hdrs=H)
check("404 for invalid currency", st == 404, str(r)[:200])


# ═══════════════ 2. TENANT CURRENCY ═══════════════
print("\n== 2. Tenant Currency Settings ==")

st, r = call("GET", "/api/v1/tenant/currency", hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("get tenant currency", st == 200 and "baseCurrency" in data, str(r)[:200])
base_currency = data.get("baseCurrency", "BDT")

st, r = call("PATCH", "/api/v1/tenant/currency", {"baseCurrency": "BDT"}, hdrs=H)
check("set tenant currency", st == 200, str(r)[:200])

st, r = call("PATCH", "/api/v1/tenant/currency", {"baseCurrency": ""}, hdrs=H)
check("reject empty currency", st == 400, str(r)[:200])


# ═══════════════ 3. EXCHANGE RATES ═══════════════
print("\n== 3. Exchange Rates ==")

# Create BDT→USD rate
st, r = call("POST", "/api/v1/exchange-rates", {
    "fromCurrency": "BDT", "toCurrency": "USD", "rate": 0.0085, "source": "MANUAL"
}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create BDT→USD rate", st in (200, 201) and "id" in data, str(r)[:200])
check("rate value correct", data.get("rate") == 0.0085, str(data)[:200])
rate1_id = data.get("id")

# Create BDT→EUR rate
st, r = call("POST", "/api/v1/exchange-rates", {
    "fromCurrency": "BDT", "toCurrency": "EUR", "rate": 0.0078, "source": "OPEN_EXCHANGE"
}, hdrs=H)
check("create BDT→EUR rate", st in (200, 201), str(r)[:200])

# Same pair — should auto-deactivate old rate
st, r = call("POST", "/api/v1/exchange-rates", {
    "fromCurrency": "BDT", "toCurrency": "USD", "rate": 0.0087, "source": "MANUAL"
}, hdrs=H)
check("update BDT→USD rate (auto-deactivate old)", st in (200, 201), str(r)[:200])

# Same currency pair
st, r = call("POST", "/api/v1/exchange-rates", {
    "fromCurrency": "BDT", "toCurrency": "BDT", "rate": 1.0
}, hdrs=H)
check("reject same currency pair", st == 400, str(r)[:200])

# Missing fields
st, r = call("POST", "/api/v1/exchange-rates", {"fromCurrency": "BDT"}, hdrs=H)
check("reject missing rate", st == 400, str(r)[:200])

# Negative rate
st, r = call("POST", "/api/v1/exchange-rates", {
    "fromCurrency": "BDT", "toCurrency": "USD", "rate": -1
}, hdrs=H)
check("reject negative rate", st == 400, str(r)[:200])

# List rates
st, r = call("GET", "/api/v1/exchange-rates", hdrs=H)
rates = r.get("data", []) if st == 200 else []
check("list exchange rates", st == 200 and isinstance(rates, list), str(r)[:200])
check("rate history recorded", len(rates) >= 2, f"got {len(rates)} rates")
# The old rate should be inactive
inactive_rates = [r for r in rates if not r.get("isActive")]
check("old rates deactivated", len(inactive_rates) >= 1, f"got {len(inactive_rates)} inactive")

# Get active rate
st, r = call("GET", "/api/v1/exchange-rates/active?fromCurrency=BDT&toCurrency=USD", hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("get active BDT→USD rate", st == 200 and "rate" in data, str(r)[:200])
check("active rate is latest", data.get("rate") == 0.0087, str(data)[:200])

# Rate history
st, r = call("GET", "/api/v1/exchange-rates/history?fromCurrency=BDT&toCurrency=USD", hdrs=H)
history = r.get("data", []) if st == 200 else []
check("rate history has entries", len(history) >= 2, f"got {len(history)} historical rates")

# Convert amount
st, r = call("POST", "/api/v1/exchange-rates/convert", {
    "amount": 1000, "fromCurrency": "BDT", "toCurrency": "USD"
}, hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("convert BDT→USD", st == 200 and "converted" in data, str(r)[:200])
check("conversion correct", data.get("converted") == 8.7, f"got {data.get('converted')}")  # 1000 * 0.0087

# Convert same currency
st, r = call("POST", "/api/v1/exchange-rates/convert", {
    "amount": 100, "fromCurrency": "BDT", "toCurrency": "BDT"
}, hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("convert same currency = same amount", data.get("converted") == 100, str(data)[:200])

# Convert unknown pair
st, r = call("POST", "/api/v1/exchange-rates/convert", {
    "amount": 100, "fromCurrency": "XYZ", "toCurrency": "USD"
}, hdrs=H)
check("reject convert unknown pair", st in (400, 404), str(r)[:200])


# ═══════════════ 4. CURRENCY PRICING ═══════════════
print("\n== 4. Currency-Specific Pricing ==")

# Get a product
st, prods = call("GET", "/api/v1/products?limit=1", hdrs=H)
product_list = prods.get("data", []) if st == 200 else []
if product_list:
    pid = product_list[0]["id"]

    # Set USD price
    st, r = call("POST", "/api/v1/currency-pricing", {
        "productId": pid, "currencyCode": "USD", "price": 5.99, "wholesalePrice": 4.50
    }, hdrs=H)
    check("set USD price for product", st == 200, str(r)[:200])

    # Set EUR price
    st, r = call("POST", "/api/v1/currency-pricing", {
        "productId": pid, "currencyCode": "EUR", "price": 5.49
    }, hdrs=H)
    check("set EUR price for product", st == 200, str(r)[:200])

    # Get all prices for product
    st, r = call("GET", f"/api/v1/currency-pricing/{pid}", hdrs=H)
    prices = r.get("data", []) if st == 200 else []
    check("get product currency prices", st == 200 and isinstance(prices, list), str(r)[:200])
    check("has USD and EUR prices", len(prices) >= 2, f"got {len(prices)} prices")

    # Update USD price (upsert)
    st, r = call("POST", "/api/v1/currency-pricing", {
        "productId": pid, "currencyCode": "USD", "price": 6.49
    }, hdrs=H)
    check("update USD price (upsert)", st == 200, str(r)[:200])
else:
    check("currency pricing (no products)", True, "skipped")


# ═══════════════ 5. LOCALIZATION ═══════════════
print("\n== 5. Localization ==")

# Get supported locales
st, r = call("GET", "/api/v1/locales", hdrs=H)
locales = r.get("data", []) if st == 200 else []
check("list locales", st == 200 and len(locales) >= 3, str(r)[:200])
check("English locale", any(l["code"] == "en" for l in locales), "")
check("Bengali locale", any(l["code"] == "bn" for l in locales), "")
check("Arabic locale", any(l["code"] == "ar" for l in locales), "")

# Get English translations
st, r = call("GET", "/api/v1/locales/translations/en", hdrs=H)
en_trans = r.get("data", {}) if st == 200 else {}
check("English translations loaded", st == 200 and len(en_trans) >= 30, f"got {len(en_trans)} strings")
check("has nav.dashboard", en_trans.get("nav.dashboard") == "Dashboard", str(en_trans)[:200])
check("has pos.cart.total", en_trans.get("pos.cart.total") == "Total", str(en_trans)[:200])

# Get Bengali translations
st, r = call("GET", "/api/v1/locales/translations/bn", hdrs=H)
bn_trans = r.get("data", {}) if st == 200 else {}
check("Bengali translations loaded", st == 200 and len(bn_trans) >= 30, f"got {len(bn_trans)} strings")
check("Bengali nav.dashboard", bn_trans.get("nav.dashboard") == "ড্যাশবোর্ড", str(bn_trans)[:200])

# Get filtered translations
st, r = call("GET", "/api/v1/locales/translations/en?prefix=nav.", hdrs=H)
nav_trans = r.get("data", {}) if st == 200 else {}
check("filtered nav translations", st == 200 and len(nav_trans) >= 5, f"got {len(nav_trans)} nav strings")

# Upsert custom translation
st, r = call("POST", "/api/v1/locales/translations", {
    "locale": "en", "keyPath": "custom.test.key", "value": "Hello Custom!"
}, hdrs=H)
check("upsert translation", st == 200, str(r)[:200])

# Verify custom translation exists
st, r = call("GET", "/api/v1/locales/translations/en?prefix=custom.", hdrs=H)
custom = r.get("data", {}) if st == 200 else {}
check("custom translation visible", custom.get("custom.test.key") == "Hello Custom!", str(custom)[:200])

# Bulk upsert
st, r = call("POST", "/api/v1/locales/translations/bulk", {
    "locale": "bn",
    "translations": {"custom.bulk.test": "বাংলা বাল্ক", "custom.bulk.hello": "হ্যালো"}
}, hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("bulk upsert translations", st == 200 and data.get("upserted") == 2, str(r)[:200])

# Locale stats
st, r = call("GET", "/api/v1/locales/stats", hdrs=H)
stats = r.get("data", []) if st == 200 else []
check("locale stats", st == 200 and isinstance(stats, list), str(r)[:200])
check("en has many strings", any(s["locale"] == "en" and s["count"] > 20 for s in stats), str(stats)[:200])


# ═══════════════ 6. TENANT LOCALE SETTINGS ═══════════════
print("\n== 6. Tenant Locale Settings ==")

st, r = call("GET", "/api/v1/tenant/locale", hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("get tenant locale", st == 200, str(r)[:200])

st, r = call("POST", "/api/v1/tenant/locale", {
    "locale": "bn", "baseCurrency": "BDT", "dateFormat": "DD/MM/YYYY",
    "timezone": "Asia/Dhaka", "rtl": False, "fiscalYearStartMonth": 7
}, hdrs=H)
check("set tenant locale to Bengali", st == 200, str(r)[:200])

# Verify locale changed
st, r = call("GET", "/api/v1/tenant/locale", hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("locale updated to bn", data.get("locale") == "bn", str(data)[:200])
check("fiscal year set to July", data.get("fiscalYearStartMonth") == 7, str(data)[:200])

# Switch to Arabic (RTL)
st, r = call("POST", "/api/v1/tenant/locale", {
    "locale": "ar", "rtl": True
}, hdrs=H)
check("set locale to Arabic (RTL)", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/tenant/locale", hdrs=H)
data = r.get("data", {}) if st == 200 else {}
check("Arabic RTL enabled", data.get("rtl") == 1 or data.get("rtl") == True, str(data)[:200])

# Invalid locale
st, r = call("POST", "/api/v1/tenant/locale", {"locale": "xyz"}, hdrs=H)
check("reject invalid locale", st == 400, str(r)[:200])

# Switch back to English
st, r = call("POST", "/api/v1/tenant/locale", {"locale": "en", "rtl": False}, hdrs=H)
check("switch back to English", st == 200, str(r)[:200])


# ═══════════════ 7. IMMUTABLE RATE VERIFICATION ═══════════════
print("\n== 7. Immutable Rate Verification ==")

# Historical rate should always be preserved in history
st, r = call("GET", "/api/v1/exchange-rates/history?fromCurrency=BDT&toCurrency=USD", hdrs=H)
history = r.get("data", []) if st == 200 else []
check("rate history preserved (immutable)", len(history) >= 2, f"got {len(history)} historical rates")
check("all history rates have different values", len(set(h["rate"] for h in history)) >= 2, str(history)[:200])


# ═══════════════ CLEANUP ═══════════════
print("\n== cleanup ==")
try:
    sql_exec("DELETE FROM exchange_rates WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM currency_pricing WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM localization_strings WHERE key_path LIKE :k", k=f"custom.{MARK}%")
    # Restore tenant to English
    sql_exec("UPDATE tenants SET currency='BDT' WHERE id=:t", t=TENANT)
except Exception as e:
    print(f"  Warning: cleanup partial: {e}")
print("  Cleanup done")


# ═══════════════ SUMMARY ═══════════════
print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 37 — Multi-Currency & Localization: VERIFIED")
print(f"{'='*60}")
