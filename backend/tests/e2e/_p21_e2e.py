"""End-to-End Test for Prompt 21 — Reports & Analytics.

Verifies:
1. Dashboard KPIs endpoint
2. Sales summary report (daily)
3. Sales by product report
4. Sales by category report
5. Sales by cashier report
6. Sales by payment method report
7. Inventory valuation report
8. Low stock report
9. Stock movement report
10. P&L report
11. Cash flow report
12. Top customers report
13. Expense summary report
14. Sales trend data
"""
from __future__ import annotations

import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:4000"
PASSED = []


def call(method: str, path: str, body: dict | None = None, hdrs: dict | None = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if hdrs:
        headers.update(hdrs)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw) if raw else {"error": str(e)}
        except Exception:
            return e.code, {"error": raw or str(e)}


def check(name: str, cond: bool, detail: str = ""):
    if cond:
        PASSED.append(name)
        print(f"  PASS  {name}")
    else:
        print(f"  FAIL  {name}  {detail}")
        raise AssertionError(f"Check failed: {name} — {detail}")


def main():
    print("============================================================")
    print("Prompt 21 E2E Verification — Reports & Analytics")
    print("============================================================")

    # 1. Login
    st, resp = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
    check("login", st == 200 and "token" in resp)
    token = resp["token"]
    H = {"Authorization": f"Bearer {token}", "x-tenant-id": "demo-shop"}

    # Fetch branch & warehouse for reference
    st, br = call("GET", "/api/v1/branches", hdrs=H)
    branch = br["data"][0]
    branchId = branch["id"]

    # ── 1. DASHBOARD KPIs ──
    print("\n== 1. Dashboard KPIs ==")
    st, kpis_res = call("GET", "/api/v1/reports/dashboard/kpis", hdrs=H)
    check("KPIs returned", st == 200 and "data" in kpis_res, str(kpis_res))
    kpis = kpis_res["data"]
    check("KPIs has today", "today" in kpis and "saleCount" in kpis["today"])
    check("KPIs has thisMonth", "thisMonth" in kpis and "totalSales" in kpis["thisMonth"])
    check("KPIs has products", "products" in kpis and "total" in kpis["products"])
    check("KPIs has customers", "customers" in kpis and "total" in kpis["customers"])
    print(f"  today={kpis['today']['totalSales']}  month={kpis['thisMonth']['totalSales']}  products={kpis['products']['total']}  customers={kpis['customers']['total']}")

    # ── 2. SALES TREND ──
    print("\n== 2. Sales Trend ==")
    st, trend_res = call("GET", "/api/v1/reports/dashboard/trend?days=30", hdrs=H)
    check("trend returned", st == 200, str(trend_res))
    check("trend has data", isinstance(trend_res.get("data"), list))
    print(f"  trend points: {len(trend_res.get('data', []))}")

    # ── 3. SALES SUMMARY (daily) ──
    print("\n== 3. Sales Summary ==")
    st, sum_res = call("GET", "/api/v1/reports/sales/summary?period=daily", hdrs=H)
    check("sales summary returned", st == 200, str(sum_res))
    check("sales summary is list", isinstance(sum_res.get("data"), list))
    print(f"  periods: {len(sum_res.get('data', []))}")

    # ── 4. SALES BY PRODUCT ──
    print("\n== 4. Sales by Product ==")
    st, bp_res = call("GET", "/api/v1/reports/sales/by-product?limit=10", hdrs=H)
    check("by-product returned", st == 200, str(bp_res))
    check("by-product is list", isinstance(bp_res.get("data"), list))
    print(f"  products: {len(bp_res.get('data', []))}")

    # ── 5. SALES BY CATEGORY ──
    print("\n== 5. Sales by Category ==")
    st, bc_res = call("GET", "/api/v1/reports/sales/by-category", hdrs=H)
    check("by-category returned", st == 200, str(bc_res))
    check("by-category is list", isinstance(bc_res.get("data"), list))

    # ── 6. SALES BY CASHIER ──
    print("\n== 6. Sales by Cashier ==")
    st, cashier_res = call("GET", "/api/v1/reports/sales/by-cashier", hdrs=H)
    check("by-cashier returned", st == 200, str(cashier_res))
    check("by-cashier is list", isinstance(cashier_res.get("data"), list))

    # ── 7. SALES BY PAYMENT METHOD ──
    print("\n== 7. Sales by Payment Method ==")
    st, pay_res = call("GET", "/api/v1/reports/sales/by-payment", hdrs=H)
    check("by-payment returned", st == 200, str(pay_res))
    check("by-payment is list", isinstance(pay_res.get("data"), list))

    # ── 8. INVENTORY VALUATION ──
    print("\n== 8. Inventory Valuation ==")
    st, val_res = call("GET", "/api/v1/reports/inventory/valuation", hdrs=H)
    check("valuation returned", st == 200, str(val_res))
    check("valuation has summary", "summary" in val_res)
    val_sum = val_res.get("summary", {})
    check("valuation has totalCostValue", "totalCostValue" in val_sum)
    check("valuation has totalRetailValue", "totalRetailValue" in val_sum)
    print(f"  products={val_sum.get('totalProducts', 0)}  cost={val_sum.get('totalCostValue', 0)}  retail={val_sum.get('totalRetailValue', 0)}")

    # ── 9. LOW STOCK ──
    print("\n== 9. Low Stock Report ==")
    st, low_res = call("GET", "/api/v1/reports/inventory/low-stock?threshold=10", hdrs=H)
    check("low-stock returned", st == 200, str(low_res))
    check("low-stock is list", isinstance(low_res.get("data"), list))
    print(f"  low stock items: {len(low_res.get('data', []))}")

    # ── 10. STOCK MOVEMENTS ──
    print("\n== 10. Stock Movements ==")
    st, mvt_res = call("GET", "/api/v1/reports/inventory/movements?limit=10", hdrs=H)
    check("movements returned", st == 200, str(mvt_res))
    check("movements is list", isinstance(mvt_res.get("data"), list))

    # ── 11. P&L ──
    print("\n== 11. Profit & Loss ==")
    st, pnl_res = call("GET", "/api/v1/reports/financial/pnl", hdrs=H)
    check("P&L returned", st == 200, str(pnl_res))
    pnl = pnl_res["data"]
    check("P&L has revenue", "revenue" in pnl)
    check("P&L has cogs", "cogs" in pnl)
    check("P&L has grossProfit", "grossProfit" in pnl)
    check("P&L has expenses", "expenses" in pnl)
    check("P&L has netProfit", "netProfit" in pnl)
    print(f"  revenue={pnl['revenue']}  cogs={pnl['cogs']}  gp={pnl['grossProfit']}  exp={pnl['expenses']}  np={pnl['netProfit']}")

    # ── 12. CASH FLOW ──
    print("\n== 12. Cash Flow ==")
    st, cf_res = call("GET", "/api/v1/reports/financial/cash-flow", hdrs=H)
    check("cash flow returned", st == 200, str(cf_res))
    cf = cf_res["data"]
    check("cash flow has inflow", "inflow" in cf)
    check("cash flow has outflow", "outflow" in cf)
    check("cash flow has netCashFlow", "netCashFlow" in cf)
    print(f"  inflow={cf['inflow']}  outflow={cf['outflow']}  net={cf['netCashFlow']}")

    # ── 13. TOP CUSTOMERS ──
    print("\n== 13. Top Customers ==")
    st, cust_res = call("GET", "/api/v1/reports/customers/top?limit=10", hdrs=H)
    check("top customers returned", st == 200, str(cust_res))
    check("top customers is list", isinstance(cust_res.get("data"), list))
    print(f"  top customers: {len(cust_res.get('data', []))}")

    # ── 14. EXPENSE SUMMARY ──
    print("\n== 14. Expense Summary ==")
    st, exp_res = call("GET", "/api/v1/reports/expenses/summary", hdrs=H)
    check("expense summary returned", st == 200, str(exp_res))
    exp = exp_res["data"]
    check("expense summary has totalExpenses", "totalExpenses" in exp)
    check("expense summary has byCategory", "byCategory" in exp)
    print(f"  totalExpenses={exp['totalExpenses']}  categories={len(exp.get('byCategory', []))}")

    # ── 15. BRANCH-SCOPED REPORTS ──
    print("\n== 15. Branch-Scoped Reports ==")
    st, branch_sales = call("GET", f"/api/v1/reports/sales/summary?period=daily&branchId={branchId}", hdrs=H)
    check("branch-scoped sales summary", st == 200, str(branch_sales))

    st, branch_kpis = call("GET", f"/api/v1/reports/dashboard/kpis?branchId={branchId}", hdrs=H)
    check("branch-scoped KPIs", st == 200, str(branch_kpis))

    # ── Summary ──
    print(f"\n{'='*60}")
    print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
    print(f"Prompt 21 — Reports & Analytics: VERIFIED")
    print(f"  • Dashboard KPIs: OK")
    print(f"  • Sales reports (summary, by-product, by-category, by-cashier, by-payment): OK")
    print(f"  • Inventory reports (valuation, low-stock, movements): OK")
    print(f"  • Financial reports (P&L, cash flow): OK")
    print(f"  • Customer reports (top customers): OK")
    print(f"  • Expense reports: OK")
    print(f"  • Branch-scoped filtering: OK")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
