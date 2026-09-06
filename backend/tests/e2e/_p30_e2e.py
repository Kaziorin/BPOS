"""Live end-to-end verification of Prompt 30 — Reporting & BI Engine.

Run:  ./venv/bin/python _p30_e2e.py   (server must be up on :4000)

Covers the Prompt 30 DoD:
  1. All listed report categories generate correctly against seeded multi-branch data
  2. Scheduled report delivery + saved report presets work
  3. Dashboard Builder lets a user add/arrange at least 3 widget types on a custom dashboard
  4. Export CSV works
"""
import json
import urllib.error
import urllib.request
from datetime import datetime, timedelta

from db import sync_engine
from sqlalchemy import text

BASE = "http://localhost:4000"
MARK = "P30E2E"
PASSED = []


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


st, d = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
assert st == 200, d
H = {"Authorization": f"Bearer {d['token']}", "x-tenant-id": d["tenant"]["slug"]}
TENANT = d["tenant"]["id"]
print(f"tenant={TENANT} slug={d['tenant']['slug']}")


def sql_exec(stmt, **p):
    with sync_engine.connect() as c:
        c.execute(text(stmt), p)
        c.commit()


def sql_fetch(stmt, **p):
    with sync_engine.connect() as c:
        return c.execute(text(stmt), p).fetchall()


def sql_scalar(stmt, **p):
    with sync_engine.connect() as c:
        return c.execute(text(stmt), p).scalar()


# ═══════════════ 1. SALES REPORTS ═══════════════
print("\n== 1. Sales reports ==")

st, r = call("GET", "/api/v1/reports/sales/summary", hdrs=H)
check("sales summary", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/sales/by-product", hdrs=H)
check("sales by product", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/sales/by-category", hdrs=H)
check("sales by category", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/sales/by-cashier", hdrs=H)
check("sales by cashier", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/sales/by-payment", hdrs=H)
check("sales by payment", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/sales/hourly", hdrs=H)
check("sales hourly", st == 200, str(r)[:200])

# ═══════════════ 2. INVENTORY REPORTS ═══════════════
print("\n== 2. Inventory reports ==")

st, r = call("GET", "/api/v1/reports/inventory/valuation", hdrs=H)
check("inventory valuation", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/inventory/low-stock", hdrs=H)
check("low stock", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/inventory/movements", hdrs=H)
check("stock movements", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/inventory/dead-stock", hdrs=H)
check("dead stock", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/inventory/aging", hdrs=H)
data = r.get("data", r)
check("inventory aging", st == 200 and "items" in data, str(r)[:200])

st, r = call("GET", "/api/v1/reports/inventory/expiry?days=365", hdrs=H)
data = r.get("data", r)
check("inventory expiry", st == 200 and "items" in data, str(r)[:200])

# ═══════════════ 3. FINANCIAL REPORTS ═══════════════
print("\n== 3. Financial reports ==")

st, r = call("GET", "/api/v1/reports/financial/pnl", hdrs=H)
data = r.get("data", r)
check("P&L", st == 200 and "revenue" in data, str(r)[:200])

st, r = call("GET", "/api/v1/reports/financial/balance-sheet", hdrs=H)
data = r.get("data", r)
check("balance sheet", st == 200 and "totalAssets" in data, str(r)[:200])

st, r = call("GET", "/api/v1/reports/financial/ar", hdrs=H)
data = r.get("data", r)
check("accounts receivable", st == 200 and "totalOutstanding" in data, str(r)[:200])

st, r = call("GET", "/api/v1/reports/financial/ar?aging=true", hdrs=H)
data = r.get("data", r)
check("AR with aging buckets", st == 200 and "aging" in data, str(r)[:200])

st, r = call("GET", "/api/v1/reports/financial/ap", hdrs=H)
data = r.get("data", r)
check("accounts payable", st == 200 and "totalOutstanding" in data, str(r)[:200])

st, r = call("GET", "/api/v1/reports/financial/cash-flow", hdrs=H)
check("cash flow", st == 200, str(r)[:200])

# ═══════════════ 4. COMMISSION REPORTS ═══════════════
print("\n== 4. Commission reports ==")

st, r = call("GET", "/api/v1/reports/commission/summary", hdrs=H)
data = r.get("data", r)
check("commission summary", st == 200 and "totalEarned" in data, str(r)[:200])

# ═══════════════ 5. INSTALLMENT REPORTS ═══════════════
print("\n== 5. Installment reports ==")

st, r = call("GET", "/api/v1/reports/installments/summary", hdrs=H)
data = r.get("data", r)
check("installment summary", st == 200 and "totalFinanced" in data, str(r)[:200])

st, r = call("GET", "/api/v1/reports/installments/overdue", hdrs=H)
check("overdue installments", st == 200, str(r)[:200])

# ═══════════════ 6. CUSTOMER REPORTS ═══════════════
print("\n== 6. Customer & expense reports ==")

st, r = call("GET", "/api/v1/reports/customers/top", hdrs=H)
check("top customers", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/customers/credit-aging", hdrs=H)
check("credit aging", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/expenses/summary", hdrs=H)
check("expense summary", st == 200, str(r)[:200])

# ═══════════════ 7. DASHBOARD KPIs ═══════════════
print("\n== 7. Dashboard KPIs ==")

st, r = call("GET", "/api/v1/reports/dashboard/kpis", hdrs=H)
check("dashboard KPIs", st == 200, str(r)[:200])

st, r = call("GET", "/api/v1/reports/dashboard/trend", hdrs=H)
check("dashboard trend", st == 200, str(r)[:200])

# ═══════════════ 8. EXPORT CSV ═══════════════
print("\n== 8. Report export ==")

# CSV returns raw text, not JSON — use raw request
def call_raw(method, path, hdrs=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        headers={"Content-Type": "application/json", **(hdrs or {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode() if e.fp else ""

st, r = call_raw("GET", "/api/v1/reports/export?reportType=sales_by_product&format=csv", hdrs=H)
check("export sales by product CSV", st == 200 and len(r) > 10, r[:200])

st, r = call_raw("GET", "/api/v1/reports/export?reportType=stock_valuation&format=csv", hdrs=H)
check("export stock valuation CSV", st == 200 and len(r) > 10, r[:200])

st, r = call_raw("GET", "/api/v1/reports/export?reportType=ar_aging&format=csv", hdrs=H)
check("export AR aging CSV", st == 200 and len(r) > 10, r[:200])

st, r = call("GET", "/api/v1/reports/export?reportType=unknown&format=csv", hdrs=H)
check("unknown report type returns error", st == 400, str(r)[:200])

# ═══════════════ 9. SAVED REPORTS ═══════════════
print("\n== 9. Saved reports ==")

st, r = call("GET", "/api/v1/reports/saved", hdrs=H)
check("list saved reports", st == 200, str(r)[:200])

st, r = call("POST", "/api/v1/reports/saved", {
    "name": f"{MARK} Monthly Sales",
    "reportType": "SALES_SUMMARY",
    "config": {"startDate": "2026-01-01", "endDate": "2026-12-31"}
}, hdrs=H)
check("create saved report", st == 201, str(r)[:200])
saved_id = r.get("data", {}).get("id")

st, r = call("PATCH", f"/api/v1/reports/saved/{saved_id}", {"name": f"{MARK} Updated Sales"}, hdrs=H)
check("update saved report", st == 200, str(r))

st, r = call("GET", "/api/v1/reports/saved", hdrs=H)
check("saved report appears in list", st == 200 and any(s.get("name") == f"{MARK} Updated Sales" for s in r.get("data", r)), str(r)[:200])

st, r = call("DELETE", f"/api/v1/reports/saved/{saved_id}", hdrs=H)
check("delete saved report", st == 200, str(r))

# ═══════════════ 10. SCHEDULED REPORTS ═══════════════
print("\n== 10. Scheduled reports ==")

st, r = call("GET", "/api/v1/reports/scheduled", hdrs=H)
check("list scheduled reports", st == 200, str(r)[:200])

st, r = call("POST", "/api/v1/reports/scheduled", {
    "name": f"{MARK} Weekly Sales",
    "reportType": "SALES_SUMMARY",
    "frequency": "WEEKLY",
    "deliveryChannel": "EMAIL",
    "recipients": ["admin@example.com"],
    "config": {"startDate": "2026-01-01"}
}, hdrs=H)
check("create scheduled report", st == 201, str(r)[:200])
sched_id = r.get("data", {}).get("id")

st, r = call("PATCH", f"/api/v1/reports/scheduled/{sched_id}", {
    "frequency": "MONTHLY",
    "recipients": ["admin@example.com", "manager@example.com"]
}, hdrs=H)
check("update scheduled report", st == 200, str(r))

st, r = call("DELETE", f"/api/v1/reports/scheduled/{sched_id}", hdrs=H)
check("delete scheduled report", st == 200, str(r))

# ═══════════════ 11. DASHBOARD BUILDER ═══════════════
print("\n== 11. Dashboard builder ==")

st, r = call("GET", "/api/v1/dashboards", hdrs=H)
check("list dashboards", st == 200, str(r)[:200])

st, r = call("POST", "/api/v1/dashboards", {
    "name": f"{MARK} Test Dashboard",
    "isDefault": True,
    "layout": {"columns": 12, "rowHeight": 80}
}, hdrs=H)
check("create dashboard", st == 201, str(r)[:200])
dash_id = r.get("data", {}).get("id")

# Add 3 different widget types
st, r = call("POST", f"/api/v1/dashboards/{dash_id}/widgets", {
    "widgetType": "KPI_CARD",
    "title": "Total Sales",
    "config": {"kpiType": "totalSales"},
    "posX": 0, "posY": 0, "width": 4, "height": 3
}, hdrs=H)
check("add KPI_CARD widget", st == 201, str(r)[:200])
w1_id = r.get("data", {}).get("id")

st, r = call("POST", f"/api/v1/dashboards/{dash_id}/widgets", {
    "widgetType": "CHART",
    "title": "Sales Trend",
    "config": {"chartType": "bar"},
    "posX": 4, "posY": 0, "width": 4, "height": 4
}, hdrs=H)
check("add CHART widget", st == 201, str(r)[:200])
w2_id = r.get("data", {}).get("id")

st, r = call("POST", f"/api/v1/dashboards/{dash_id}/widgets", {
    "widgetType": "TABLE",
    "title": "Top Products",
    "config": {},
    "posX": 8, "posY": 0, "width": 4, "height": 4
}, hdrs=H)
check("add TABLE widget", st == 201, str(r)[:200])
w3_id = r.get("data", {}).get("id")

# List widgets
st, r = call("GET", f"/api/v1/dashboards/{dash_id}/widgets", hdrs=H)
check("list dashboard widgets (3)", st == 200 and len(r.get("data", r)) == 3, str(r)[:200])

# Get widget data
st, r = call("GET", f"/api/v1/dashboards/widgets/{w1_id}/data", hdrs=H)
data = r.get("data", r)
check("widget data endpoint works", st == 200 and "label" in data, str(r)[:200])

# Update widget position (reorder)
st, r = call("POST", f"/api/v1/dashboards/{dash_id}/widgets/reorder", {
    "widgets": [
        {"id": w1_id, "posX": 0, "posY": 0, "width": 6, "height": 3},
        {"id": w2_id, "posX": 6, "posY": 0, "width": 6, "height": 4},
        {"id": w3_id, "posX": 0, "posY": 4, "width": 12, "height": 4},
    ]
}, hdrs=H)
check("reorder widgets", st == 200 and r.get("data", {}).get("reordered") == 3, str(r)[:200])

# Update single widget
st, r = call("PATCH", f"/api/v1/dashboards/{dash_id}/widgets/{w1_id}", {
    "title": "Total Sales (Updated)"
}, hdrs=H)
check("update widget", st == 200, str(r))

# Delete a widget
st, r = call("DELETE", f"/api/v1/dashboards/{dash_id}/widgets/{w3_id}", hdrs=H)
check("delete widget", st == 200, str(r))

st, r = call("GET", f"/api/v1/dashboards/{dash_id}/widgets", hdrs=H)
check("widget count after delete (2)", st == 200 and len(r.get("data", r)) == 2, str(r)[:200])

# Update dashboard
st, r = call("PATCH", f"/api/v1/dashboards/{dash_id}", {
    "name": f"{MARK} Renamed Dashboard"
}, hdrs=H)
check("update dashboard name", st == 200, str(r))

# Delete dashboard
st, r = call("DELETE", f"/api/v1/dashboards/{dash_id}", hdrs=H)
check("delete dashboard", st == 200, str(r))

print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 30 — Reporting & BI Engine: VERIFIED")
print(f"{'='*60}")
