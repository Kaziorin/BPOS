"""Auth router — /api/auth (login) + /api/v1/tenant, menu, dashboard-summary."""
from __future__ import annotations

import textwrap

from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import resolve_tenant, require_auth, sign_token, verify_password, AuthUser
from util import ok, err, rows_to_dicts, ApiJSONResponse

router = APIRouter()


@router.post("/api/auth/login")
async def login(body: dict, db: AsyncSession = Depends(get_db)):
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    ident = (body.get("tenantId") or body.get("tenant") or "").strip()
    if not email or not password:
        return err("Email and password are required", 400)

    sql = textwrap.dedent(
        """
        SELECT ua.id, ua.name, ua.email, ua.passwordHash, ua.tenantId, ua.branchId, ua.roleId,
               r.name AS roleName, t.slug AS tenantSlug, t.name AS tenantName, t.businessType
        FROM users ua
        LEFT JOIN roles r ON r.id = ua.roleId
        LEFT JOIN tenants t ON t.id = ua.tenantId
        WHERE ua.email = :e
        """
    )
    row = (await db.execute(text(sql), {"e": email})).first()
    if not row or not verify_password(password, row.passwordHash):
        return err("Invalid email or password", 401)

    token = sign_token(
        {
            "id": row.id,
            "tenantId": row.tenantId,
            "branchId": row.branchId or "",
            "name": row.name,
            "email": row.email,
            "roleId": row.roleId or "",
            "roleName": row.roleName or "",
            "businessType": row.businessType or "",
        }
    )
    return ApiJSONResponse(
        {
            "token": token,
            "user": {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "tenantId": row.tenantId,
                "branchId": row.branchId or None,
                "roleId": row.roleId,
                "role": row.roleName or "",
                "roleName": row.roleName or "",
                "businessType": row.businessType or "RETAIL",
            },
            "tenant": {
                "id": row.tenantId,
                "slug": row.tenantSlug or "default",
                "name": row.tenantName or "Default Store",
                "businessType": row.businessType or "RETAIL",
            },
        }
    )


@router.get("/api/v1/tenant")
async def tenant_info(
    request: Request,
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    t = (
        await db.execute(
            text("SELECT id, slug, name, businessType, status, currency, timezone FROM tenants WHERE id = :t"),
            {"t": tenantId},
        )
    ).first()
    if not t:
        return err("Tenant not found", 404)
    company = (
        await db.execute(
            text(
                "SELECT c.id, c.legalName, c.address, c.vatRegNo FROM companies c "
                "WHERE c.tenantId = :t LIMIT 1"
            ),
            {"t": tenantId},
        )
    ).first()
    branches = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT id, name, code, address, phone FROM branches WHERE tenantId = :t LIMIT 10"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    warehouses = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT w.id, w.name, w.code, w.branchId FROM warehouses w "
                    "JOIN branches b ON b.id = w.branchId WHERE b.tenantId = :t LIMIT 20"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    return ok(
        {
            "tenant": {"id": t.id, "slug": t.slug, "name": t.name, "businessType": t.businessType,
                        "status": t.status, "currency": t.currency, "timezone": t.timezone},
            "company": {"id": company.id, "legalName": company.legalName, "address": company.address,
                        "vatRegNo": company.vatRegNo} if company else None,
            "branches": branches,
            "warehouses": warehouses,
        }
    )


@router.get("/api/v1/menu")
async def menu(tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Dynamic menu grouped by category (spec §9/§32) — identical shape to TS."""
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT tm.id, m.code AS moduleCode, m.name AS moduleName, m.category, m.icon AS moduleIcon, "
                    "       m.route AS moduleRoute, mi.id AS itemId, mi.label, mi.icon, mi.route, mi.permission "
                    "FROM tenant_modules tm "
                    "JOIN modules m ON m.id = tm.moduleId "
                    "LEFT JOIN menu_items mi ON mi.moduleId = m.id AND mi.isVisible = 1 AND mi.parentId IS NULL "
                    "WHERE tm.tenantId = :t AND tm.isEnabled = 1 "
                    "ORDER BY m.sortOrder, mi.sortOrder"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    # children per parent item
    child_rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT pmi.id AS parentId, cmi.id, cmi.label, cmi.icon, cmi.route, cmi.permission "
                    "FROM menu_items cmi JOIN menu_items pmi ON pmi.id = cmi.parentId "
                    "JOIN modules m ON m.id = pmi.moduleId "
                    "JOIN tenant_modules tm ON tm.moduleId = m.id AND tm.tenantId = :t "
                    "WHERE cmi.isVisible = 1 ORDER BY cmi.sortOrder"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    children_by_parent: dict[str, list] = {}
    for c in child_rows:
        children_by_parent.setdefault(c["parentId"], []).append(
            {"id": c["id"], "label": c["label"], "icon": c["icon"], "route": c["route"], "permission": c["permission"]}
        )

    by_category: dict[str, list] = {}
    for r in rows:
        cat = r["category"]
        if cat not in by_category:
            by_category[cat] = []
        module = next((mm for mm in by_category[cat] if mm["moduleCode"] == r["moduleCode"]), None)
        if module is None:
            module = {
                "moduleCode": r["moduleCode"],
                "moduleName": r["moduleName"],
                "moduleIcon": r["moduleIcon"],
                "moduleRoute": r["moduleRoute"],
                "items": [],
            }
            by_category[cat].append(module)
        if r["itemId"]:
            module["items"].append(
                {
                    "id": r["itemId"],
                    "label": r["label"],
                    "icon": r["icon"],
                    "route": r["route"],
                    "permission": r["permission"],
                    "children": children_by_parent.get(r["itemId"], []),
                }
            )
    return ok(by_category)


@router.get("/api/v1/dashboard/summary")
async def dashboard_summary(
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)
):
    # Today's sales
    today_sales = (
        await db.execute(
            text(
                "SELECT COUNT(*) c, COALESCE(SUM(total),0) t, COALESCE(SUM(paidTotal),0) p "
                "FROM sales WHERE tenantId = :t AND status = 'CONFIRMED' AND DATE(createdAt) = CURDATE()"
            ),
            {"t": tenantId},
        )
    ).first()

    # All-time sales
    all_sales = (
        await db.execute(
            text(
                "SELECT COUNT(*) c, COALESCE(SUM(total),0) t, COALESCE(SUM(paidTotal),0) p "
                "FROM sales WHERE tenantId = :t AND status = 'CONFIRMED'"
            ),
            {"t": tenantId},
        )
    ).first()

    products = (
        await db.execute(text("SELECT COUNT(*) c FROM products WHERE tenantId = :t"), {"t": tenantId})
    ).first()

    low = (
        await db.execute(
            text(
                "SELECT COUNT(*) c FROM stock WHERE tenantId = :t AND qtyOnHand <= 10 AND qtyOnHand > 0"
            ),
            {"t": tenantId},
        )
    ).first()

    customers = (
        await db.execute(text("SELECT COUNT(*) c FROM customers WHERE tenantId = :t"), {"t": tenantId})
    ).first()

    dues = (
        await db.execute(
            text("SELECT COALESCE(SUM(currentDue),0) d FROM customers WHERE tenantId = :t"), {"t": tenantId}
        )
    ).first()

    # Recent 5 sales
    recent_rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT s.id, s.invoiceNo, COALESCE(c.name, 'Walk-in Customer') AS customer, "
                    "s.total, s.status, s.createdAt "
                    "FROM sales s "
                    "LEFT JOIN customers c ON c.id = s.customerId "
                    "WHERE s.tenantId = :t "
                    "ORDER BY s.createdAt DESC LIMIT 5"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )

    today_total = float(today_sales[1] or 0) if (today_sales and today_sales[0] > 0) else float(all_sales[1] or 0)
    today_count = int(today_sales[0] or 0) if (today_sales and today_sales[0] > 0) else int(all_sales[0] or 0)
    total_due = float(dues[0] or 0)

    return ok(
        {
            # Standard DashboardSummary types
            "todaySalesTotal": str(today_total),
            "todaySalesCount": today_count,
            "totalProducts": int(products[0] or 0),
            "lowStockCount": int(low[0] or 0),
            "totalCustomers": int(customers[0] or 0),
            "totalDue": str(total_due),
            "recentSales": [
                {
                    "id": str(r["id"]),
                    "invoiceNo": str(r.get("invoiceNo") or "INV"),
                    "customer": str(r.get("customer") or "Walk-in Customer"),
                    "total": str(r.get("total") or "0"),
                    "status": str(r.get("status") or "CONFIRMED"),
                    "createdAt": str(r.get("createdAt") or ""),
                }
                for r in recent_rows
            ],
            # Backwards compatibility keys
            "totalSales": float(all_sales[1] or 0),
            "salesCount": int(all_sales[0] or 0),
            "totalPaid": float(all_sales[2] or 0),
            "productCount": int(products[0] or 0),
            "customerCount": int(customers[0] or 0),
            "customerDues": float(dues[0] or 0),
        }
    )


@router.get("/api/v1/dashboard/trend")
async def dashboard_trend(
    days: int = Query(7),
    branchId: str = "",
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Daily sales trend for dashboard charts."""
    params: dict = {"t": tenantId, "d": max(1, days)}
    branch_filter = ""
    if branchId:
        branch_filter = " AND s.branchId = :b"
        params["b"] = branchId

    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    f"SELECT DATE(s.createdAt) AS date, "
                    f"COALESCE(SUM(s.total), 0) AS total "
                    f"FROM sales s "
                    f"WHERE s.tenantId = :t AND s.status = 'CONFIRMED' "
                    f"AND s.createdAt >= DATE_SUB(NOW(), INTERVAL :d DAY) "
                    f"{branch_filter} "
                    f"GROUP BY DATE(s.createdAt) ORDER BY date"
                ),
                params,
            )
        ).fetchall()
    )

    # Format into TrendPoint list: [{"date": "2026-09-06", "total": 12500.0}]
    results = [{"date": str(r["date"]), "total": float(r["total"] or 0)} for r in rows]
    return ok(results)


@router.get("/api/v1/modules")
async def modules(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (
            await db.execute(
                text("SELECT id, code, name, category, icon, route, sortOrder FROM modules ORDER BY sortOrder"),
            )
        ).fetchall()
    )
    return ok(rows)
