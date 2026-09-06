#!/usr/bin/env python
"""End-to-end smoke test against the running Python API (:4000)."""
import json
import sys
import urllib.request
import urllib.error

BASE = "http://localhost:4000"
FAILS = []


def req(method, path, body=None, token=None, tenant="demo-shop"):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if tenant:
        r.add_header("x-tenant-id", tenant)
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {"error": "non-json"}
    except Exception as e:
        return 0, {"error": str(e)}


def check(name, cond, extra=""):
    mark = "✓" if cond else "✗"
    print(f"  {mark} {name}" + (f" — {extra}" if extra and not cond else ""))
    if not cond:
        FAILS.append(name)


def main():
    print("Python FastAPI smoke test")
    # 1. health
    s, b = req("GET", "/health", tenant=None)
    check("health", s == 200 and b.get("status") == "ok")

    # 2. login
    s, b = req("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"}, tenant=None)
    check("login", s == 200 and "token" in b)
    token = b["token"]

    # 3. tenant + menu + dashboard (no auth)
    s, b = req("GET", "/api/v1/tenant")
    check("tenant", s == 200 and "tenant" in b.get("data", {}))
    s, b = req("GET", "/api/v1/menu")
    check("menu (49 modules)", s == 200 and len(b.get("data", {})) >= 4, f"cats={len(b.get('data', {}))}")
    s, b = req("GET", "/api/v1/dashboard/summary")
    check("dashboard", s == 200 and "totalSales" in b.get("data", {}))

    # 4. RBAC
    s, b = req("GET", "/api/v1/rbac/roles", token=token)
    check("rbac roles", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/rbac/permissions/modules", token=token)
    check("rbac permissions", s == 200 and isinstance(b.get("data"), dict))

    # 5. catalog
    s, b = req("GET", "/api/v1/products?limit=3", token=token)
    check("products", s == 200 and len(b.get("data", [])) > 0)
    pid = b["data"][0]["id"] if b.get("data") else None
    if pid:
        s, b = req("GET", f"/api/v1/products/{pid}")
        check("product detail", s == 200 and "id" in b.get("data", {}))
    s, b = req("GET", "/api/v1/brands")
    check("brands", s == 200 and isinstance(b.get("data"), list))

    # 6. customers + suppliers
    s, b = req("GET", "/api/v1/customers?limit=3", token=token)
    check("customers", s == 200 and len(b.get("data", [])) > 0)
    s, b = req("GET", "/api/v1/customer-groups")
    check("customer groups", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/suppliers?limit=3", token=token)
    check("suppliers", s == 200 and len(b.get("data", [])) > 0)

    # 7. pricing / promotions / coupons
    s, b = req("GET", "/api/v1/price-lists", token=token)
    check("price lists", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/promotions", token=token)
    check("promotions", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/coupons", token=token)
    check("coupons", s == 200 and isinstance(b.get("data"), list))

    # 8. invoices + credit + installments
    s, b = req("GET", "/api/v1/invoices", token=token)
    check("invoices", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/credit", token=token)
    check("credit", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/credit/aging", token=token)
    check("credit aging", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/installments", token=token)
    check("installments", s == 200 and isinstance(b.get("data"), list))

    # 9. sales orders / quotations
    s, b = req("GET", "/api/v1/sales/orders", token=token)
    check("sales orders", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/sales/quotations", token=token)
    check("quotations", s == 200 and isinstance(b.get("data"), list))

    # 10. purchasing chain
    s, b = req("GET", "/api/v1/purchasing/summary", token=token)
    check("purchasing summary", s == 200 and "totalPayable" in b.get("data", {}))
    s, b = req("GET", "/api/v1/purchasing/orders?limit=3", token=token)
    check("purchase orders", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/purchasing/requisitions", token=token)
    check("requisitions", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/purchasing/grns", token=token)
    check("grns", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/purchasing/invoices", token=token)
    check("purchase invoices", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/purchasing/suppliers/compare", token=token)
    check("supplier comparison", s == 200 and isinstance(b.get("data"), list))

    # 11. expenses + commission
    s, b = req("GET", "/api/v1/expenses?limit=3", token=token)
    check("expenses", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/expenses/categories", token=token)
    check("expense categories", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/expenses/recurring", token=token)
    check("recurring expenses", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/expenses/petty-cash", token=token)
    check("petty cash", s == 200 and "funds" in b.get("data", {}))
    s, b = req("GET", "/api/v1/commission?limit=3", token=token)
    check("commissions", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/commission/rules", token=token)
    check("commission rules", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/commission/agents", token=token)
    check("commission agents", s == 200 and isinstance(b.get("data"), list))

    # 12. cash register
    s, b = req("GET", "/api/v1/branches", token=token)
    check("branches", s == 200 and len(b.get("data", [])) > 0)
    branch_id = b["data"][0]["id"] if b.get("data") else None
    s, b = req("GET", f"/api/v1/cash-register/current?branchId={branch_id}", token=token)
    check("cash-register current", s == 200 and "shift" in b.get("data", {}))
    s, b = req("GET", "/api/v1/cash-register?limit=3", token=token)
    check("shift history", s == 200 and isinstance(b.get("data"), list))

    # 13. inventory
    s, b = req("GET", "/api/v1/warehouses", token=token)
    check("warehouses", s == 200 and len(b.get("data", [])) > 0)
    wh = b["data"][0]["id"] if b.get("data") else None
    s, b = req("GET", f"/api/v1/inventory/stock/{wh}", token=token)
    check("stock", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/inventory/movements?limit=3", token=token)
    check("stock movements", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/inventory/batches", token=token)
    check("batches", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/inventory/transfers", token=token)
    check("transfers", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/inventory/consignments", token=token)
    check("consignments", s == 200 and isinstance(b.get("data"), list))
    s, b = req("GET", "/api/v1/inventory/landed-costs", token=token)
    check("landed costs", s == 200 and isinstance(b.get("data"), list))

    # 14. POS: sale without shift must fail (§10.19 gate)
    s, b = req("POST", "/api/v1/pos/confirm",
               {"branchId": "no-open-shift-branch",
                "items": [{"productId": pid, "name": "x", "qty": 1, "unitPrice": 100}],
                "payments": [{"method": "CASH", "amount": 100}]}, token=token)
    no_shift = "shift" in str(b.get("error", "")).lower()
    check("POS blocked without open shift", no_shift, str(b.get("error"))[:60])

    print()
    print(f"{'ALL PASSED' if not FAILS else str(len(FAILS)) + ' FAILED'}")
    if FAILS:
        sys.exit(1)


main()
