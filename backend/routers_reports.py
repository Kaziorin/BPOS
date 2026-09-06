"""Reports & Analytics Router (Prompt 21, §12).

Covers:
- Sales Reports: daily/weekly/monthly, by product, by category, by cashier, by payment method
- Inventory Reports: stock valuation, low stock, dead stock, stock movements
- Financial Reports: P&L, expense breakdown, cash flow, tax collected
- Customer Reports: top customers, credit aging, purchase history
- Dashboard Analytics: KPIs, trend data, comparison periods
"""
from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()


# ═════════════════════════ SALES REPORTS ═════════════════════════

@router.get("/api/v1/reports/sales/summary")
async def sales_summary(
    period: str = "daily",  # daily | weekly | monthly | yearly
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Sales summary grouped by period with totals."""
    where = "s.tenantId = :t AND s.status = 'CONFIRMED'"
    params: dict = {"t": tenantId}

    if branchId:
        where += " AND s.branchId = :b"
        params["b"] = branchId

    if startDate:
        where += " AND s.createdAt >= :sd"
        params["sd"] = startDate
    else:
        # Default: last 30 days
        where += " AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)"

    if endDate:
        where += " AND s.createdAt <= :ed"
        params["ed"] = endDate

    date_fmt = {
        "daily": "%Y-%m-%d",
        "weekly": "%x-W%v",
        "monthly": "%Y-%m",
        "yearly": "%Y",
    }.get(period, "%Y-%m-%d")

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT DATE_FORMAT(s.createdAt, :fmt) AS period, "
            f"COUNT(*) AS saleCount, "
            f"COALESCE(SUM(s.subtotal), 0) AS subtotal, "
            f"COALESCE(SUM(s.discountTotal), 0) AS discountTotal, "
            f"COALESCE(SUM(s.taxTotal), 0) AS taxTotal, "
            f"COALESCE(SUM(s.total), 0) AS total, "
            f"COALESCE(SUM(s.paidTotal), 0) AS paidTotal, "
            f"COALESCE(SUM(s.dueTotal), 0) AS dueTotal "
            f"FROM sales s WHERE {where} "
            f"GROUP BY period ORDER BY period DESC"
        ),
        {**params, "fmt": date_fmt},
    )).fetchall())

    return ok(rows)


@router.get("/api/v1/reports/sales/by-product")
async def sales_by_product(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    limit: int = Query(50),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Top selling products by revenue and quantity."""
    where = "si.tenantId = :t AND s.status = 'CONFIRMED'"
    params: dict = {"t": tenantId}

    if branchId:
        where += " AND s.branchId = :b"
        params["b"] = branchId
    if startDate:
        where += " AND s.createdAt >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND s.createdAt <= :ed"
        params["ed"] = endDate

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT si.productId, p.name AS productName, p.sku, p.categoryId, "
            f"c.name AS categoryName, "
            f"COUNT(DISTINCT si.saleId) AS saleCount, "
            f"SUM(si.qty) AS totalQty, "
            f"SUM(si.lineTotal) AS totalRevenue, "
            f"AVG(si.unitPrice) AS avgUnitPrice "
            f"FROM sale_items si "
            f"JOIN products p ON p.id = si.productId "
            f"JOIN sales s ON s.id = si.saleId "
            f"LEFT JOIN categories c ON c.id = p.categoryId "
            f"WHERE {where} "
            f"GROUP BY si.productId, p.name, p.sku, p.categoryId, c.name "
            f"ORDER BY totalRevenue DESC LIMIT :lim"
        ),
        {**params, "lim": limit},
    )).fetchall())

    for r in rows:
        r["categoryId"] = r.pop("categoryId", None)
        r["category"] = {"id": r.pop("categoryId", None), "name": r.pop("categoryName", None)} if r.get("categoryName") else None

    return ok(rows)


@router.get("/api/v1/reports/sales/by-category")
async def sales_by_category(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Sales breakdown by product category."""
    where = "si.tenantId = :t AND s.status = 'CONFIRMED'"
    params: dict = {"t": tenantId}

    if branchId:
        where += " AND s.branchId = :b"
        params["b"] = branchId
    if startDate:
        where += " AND s.createdAt >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND s.createdAt <= :ed"
        params["ed"] = endDate

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT COALESCE(c.id, 'uncategorized') AS categoryId, "
            f"COALESCE(c.name, 'Uncategorized') AS categoryName, "
            f"COUNT(DISTINCT si.saleId) AS saleCount, "
            f"SUM(si.qty) AS totalQty, "
            f"SUM(si.lineTotal) AS totalRevenue, "
            f"COUNT(DISTINCT si.productId) AS productCount "
            f"FROM sale_items si "
            f"JOIN products p ON p.id = si.productId "
            f"JOIN sales s ON s.id = si.saleId "
            f"LEFT JOIN categories c ON c.id = p.categoryId "
            f"WHERE {where} "
            f"GROUP BY c.id, c.name "
            f"ORDER BY totalRevenue DESC"
        ),
        params,
    )).fetchall())

    return ok(rows)


@router.get("/api/v1/reports/sales/by-cashier")
async def sales_by_cashier(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Sales performance by cashier / staff member."""
    where = "s.tenantId = :t AND s.status = 'CONFIRMED'"
    params: dict = {"t": tenantId}

    if branchId:
        where += " AND s.branchId = :b"
        params["b"] = branchId
    if startDate:
        where += " AND s.createdAt >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND s.createdAt <= :ed"
        params["ed"] = endDate

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT s.userId AS cashierId, u.name AS cashierName, "
            f"COUNT(*) AS saleCount, "
            f"COALESCE(SUM(s.subtotal), 0) AS subtotal, "
            f"COALESCE(SUM(s.discountTotal), 0) AS discountTotal, "
            f"COALESCE(SUM(s.total), 0) AS totalRevenue, "
            f"COALESCE(SUM(s.paidTotal), 0) AS totalPaid, "
            f"COALESCE(SUM(s.dueTotal), 0) AS totalDue, "
            f"AVG(s.total) AS avgSaleValue "
            f"FROM sales s "
            f"LEFT JOIN users u ON u.id = s.userId "
            f"WHERE {where} "
            f"GROUP BY s.userId, u.name "
            f"ORDER BY totalRevenue DESC"
        ),
        params,
    )).fetchall())

    return ok(rows)


@router.get("/api/v1/reports/sales/by-payment")
async def sales_by_payment_method(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Sales breakdown by payment method."""
    where = "p.tenantId = :t AND p.status = 'COMPLETED'"
    params: dict = {"t": tenantId}

    if branchId:
        where += " AND p.branchId = :b"
        params["b"] = branchId
    if startDate:
        where += " AND p.createdAt >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND p.createdAt <= :ed"
        params["ed"] = endDate

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT p.method AS paymentMethod, "
            f"COUNT(*) AS paymentCount, "
            f"COALESCE(SUM(p.amount), 0) AS totalAmount "
            f"FROM payments p "
            f"WHERE {where} "
            f"GROUP BY p.method "
            f"ORDER BY totalAmount DESC"
        ),
        params,
    )).fetchall())

    return ok(rows)


@router.get("/api/v1/reports/sales/hourly")
async def sales_hourly(
    date: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Hourly sales distribution for a given day (or today)."""
    where = "s.tenantId = :t AND s.status = 'CONFIRMED'"
    params: dict = {"t": tenantId}

    if date:
        where += " AND DATE(s.createdAt) = :d"
        params["d"] = date
    else:
        where += " AND DATE(s.createdAt) = CURDATE()"

    if branchId:
        where += " AND s.branchId = :b"
        params["b"] = branchId

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT HOUR(s.createdAt) AS hour, "
            f"COUNT(*) AS saleCount, "
            f"COALESCE(SUM(s.total), 0) AS totalRevenue "
            f"FROM sales s WHERE {where} "
            f"GROUP BY HOUR(s.createdAt) ORDER BY hour"
        ),
        params,
    )).fetchall())

    # Fill missing hours with zeros
    hours_map = {r["hour"]: r for r in rows}
    result = []
    for h in range(24):
        if h in hours_map:
            result.append(hours_map[h])
        else:
            result.append({"hour": h, "saleCount": 0, "totalRevenue": 0})

    return ok(result)


# ═════════════════════════ INVENTORY REPORTS ═════════════════════════

@router.get("/api/v1/reports/inventory/valuation")
async def inventory_valuation(
    warehouseId: str = "",
    categoryId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Stock valuation report — total inventory value at cost and selling price."""
    where = "s.tenantId = :t"
    params: dict = {"t": tenantId}

    if warehouseId:
        where += " AND s.warehouseId = :w"
        params["w"] = warehouseId
    if categoryId:
        where += " AND p.categoryId = :c"
        params["c"] = categoryId

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT s.productId, p.name AS productName, p.sku, p.costPrice, p.sellingPrice, "
            f"p.categoryId, c.name AS categoryName, w.name AS warehouseName, w.id AS warehouseId, "
            f"s.qtyOnHand, s.qtyReserved, "
            f"(s.qtyOnHand * p.costPrice) AS costValue, "
            f"(s.qtyOnHand * p.sellingPrice) AS retailValue "
            f"FROM stock s "
            f"JOIN products p ON p.id = s.productId "
            f"JOIN warehouses w ON w.id = s.warehouseId "
            f"LEFT JOIN categories c ON c.id = p.categoryId "
            f"WHERE {where} AND s.qtyOnHand > 0 "
            f"ORDER BY costValue DESC"
        ),
        params,
    )).fetchall())

    totalCost = sum(float(r.get("costValue", 0)) for r in rows)
    totalRetail = sum(float(r.get("retailValue", 0)) for r in rows)
    totalQty = sum(float(r.get("qtyOnHand", 0)) for r in rows)

    for r in rows:
        r["categoryId"] = r.get("categoryId")
        r["category"] = {"id": r.pop("categoryId", None), "name": r.pop("categoryName", None)} if r.get("categoryName") else None

    return ok(rows, extra={
        "summary": {
            "totalProducts": len(rows),
            "totalQtyOnHand": totalQty,
            "totalCostValue": round(totalCost, 2),
            "totalRetailValue": round(totalRetail, 2),
            "potentialMargin": round(totalRetail - totalCost, 2),
            "potentialMarginPct": round((totalRetail - totalCost) / totalRetail * 100, 2) if totalRetail > 0 else 0,
        }
    })


@router.get("/api/v1/reports/inventory/low-stock")
async def low_stock_report(
    threshold: int = Query(10),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Products with stock below the threshold."""
    rows = rows_to_dicts((await db.execute(
        text(
            "SELECT s.productId, p.name AS productName, p.sku, p.categoryId, c.name AS categoryName, "
            "w.name AS warehouseName, w.id AS warehouseId, s.qtyOnHand, s.qtyReserved, "
            "(s.qtyOnHand - s.qtyReserved) AS qtyAvailable "
            "FROM stock s "
            "JOIN products p ON p.id = s.productId "
            "JOIN warehouses w ON w.id = s.warehouseId "
            "LEFT JOIN categories c ON c.id = p.categoryId "
            "WHERE s.tenantId = :t AND (s.qtyOnHand - s.qtyReserved) <= :th "
            "ORDER BY qtyAvailable ASC"
        ),
        {"t": tenantId, "th": threshold},
    )).fetchall())

    for r in rows:
        r["category"] = {"id": r.pop("categoryId", None), "name": r.pop("categoryName", None)} if r.get("categoryName") else None
        r["isOutOfStock"] = float(r.get("qtyAvailable", 0)) <= 0

    return ok(rows)


@router.get("/api/v1/reports/inventory/movements")
async def stock_movement_report(
    productId: str = "",
    warehouseId: str = "",
    movementType: str = "",
    startDate: str = "",
    endDate: str = "",
    limit: int = Query(100),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Detailed stock movement history with filters."""
    where = "sm.tenantId = :t"
    params: dict = {"t": tenantId}

    if productId:
        where += " AND sm.productId = :p"
        params["p"] = productId
    if warehouseId:
        where += " AND sm.warehouseId = :w"
        params["w"] = warehouseId
    if movementType:
        where += " AND sm.movementType = :mt"
        params["mt"] = movementType
    if startDate:
        where += " AND sm.createdAt >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND sm.createdAt <= :ed"
        params["ed"] = endDate

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT sm.*, p.name AS productName, p.sku, w.name AS warehouseName "
            f"FROM stock_movements sm "
            f"JOIN products p ON p.id = sm.productId "
            f"JOIN warehouses w ON w.id = sm.warehouseId "
            f"WHERE {where} "
            f"ORDER BY sm.createdAt DESC LIMIT :lim"
        ),
        {**params, "lim": min(limit, 500)},
    )).fetchall())

    return ok(rows)


@router.get("/api/v1/reports/inventory/dead-stock")
async def dead_stock_report(
    daysInactive: int = Query(90),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Products with no sales in the last N days but still in stock."""
    rows = rows_to_dicts((await db.execute(
        text(
            "SELECT s.productId, p.name AS productName, p.sku, p.costPrice, p.sellingPrice, "
            "p.categoryId, c.name AS categoryName, w.name AS warehouseName, "
            "s.qtyOnHand, (s.qtyOnHand * p.costPrice) AS deadStockValue, "
            "MAX(sale.lastSaleDate) AS lastSaleDate "
            "FROM stock s "
            "JOIN products p ON p.id = s.productId "
            "JOIN warehouses w ON w.id = s.warehouseId "
            "LEFT JOIN categories c ON c.id = p.categoryId "
            "LEFT JOIN ("
            "  SELECT si.productId, MAX(si.createdAt) AS lastSaleDate "
            "  FROM sale_items si JOIN sales sa ON sa.id = si.saleId "
            "  WHERE sa.tenantId = :t AND sa.status = 'CONFIRMED' "
            "  GROUP BY si.productId"
            ") sale ON sale.productId = s.productId "
            "WHERE s.tenantId = :t AND s.qtyOnHand > 0 "
            "AND (sale.lastSaleDate IS NULL OR sale.lastSaleDate < DATE_SUB(NOW(), INTERVAL :days DAY)) "
            "GROUP BY s.productId, p.name, p.sku, p.costPrice, p.sellingPrice, "
            "c.name, w.name, s.qtyOnHand, sale.lastSaleDate "
            "ORDER BY deadStockValue DESC"
        ),
        {"t": tenantId, "days": daysInactive},
    )).fetchall())

    totalValue = sum(float(r.get("deadStockValue", 0)) for r in rows)

    for r in rows:
        r["category"] = {"id": r.pop("categoryId", None), "name": r.pop("categoryName", None)} if r.get("categoryName") else None

    return ok(rows, extra={"summary": {"totalDeadStockItems": len(rows), "totalDeadStockValue": round(totalValue, 2)}})


# ═════════════════════════ FINANCIAL / P&L ═════════════════════════

@router.get("/api/v1/reports/financial/pnl")
async def profit_and_loss(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Profit & Loss statement — Revenue, COGS, Expenses, Net Profit."""
    date_filter = ""
    params: dict = {"t": tenantId}

    if startDate:
        date_filter += " AND createdAt >= :sd"
        params["sd"] = startDate
    else:
        date_filter += " AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)"

    if endDate:
        date_filter += " AND createdAt <= :ed"
        params["ed"] = endDate

    branch_filter = ""
    if branchId:
        branch_filter = " AND branchId = :b"
        params["b"] = branchId

    # Revenue (from sales)
    sales_row = (await db.execute(text(
        f"SELECT COALESCE(SUM(subtotal - discountTotal), 0) AS revenue, "
        f"COALESCE(SUM(taxTotal), 0) AS taxCollected, "
        f"COALESCE(SUM(serviceCharge), 0) AS serviceCharges "
        f"FROM sales WHERE tenantId = :t AND status = 'CONFIRMED' {date_filter} {branch_filter}"
    ), params)).first()
    revenue = float(sales_row[0] or 0)
    taxCollected = float(sales_row[1] or 0)
    serviceCharges = float(sales_row[2] or 0)

    # COGS (from ledger entries via journals)
    try:
        cogs_row = (await db.execute(text(
            f"SELECT COALESCE(SUM(le.debit), 0) "
            f"FROM ledger_entries le JOIN journals j ON j.id = le.journalId "
            f"WHERE j.tenantId = :t AND j.refType = 'SALE_COGS' AND le.accountCode = '5000' "
            f"{date_filter.replace('createdAt', 'j.createdAt')} {branch_filter.replace('branchId', 'j.branchId')}"
        ), params)).first()
        cogs = float(cogs_row[0] or 0)
    except Exception:
        cogs = 0

    grossProfit = revenue - cogs
    grossMarginPct = round((grossProfit / revenue * 100), 2) if revenue > 0 else 0

    # Expenses (approved & paid)
    exp_row = (await db.execute(text(
        f"SELECT COALESCE(SUM(amount), 0) FROM expenses "
        f"WHERE tenantId = :t AND status IN ('APPROVED', 'PAID') {date_filter.replace('createdAt', 'expenseDate')} {branch_filter}"
    ), params)).first()
    totalExpenses = float(exp_row[0] or 0)

    # Expense breakdown by category
    exp_cats = rows_to_dicts((await db.execute(text(
        f"SELECT ec.name AS categoryName, ec.`group` AS expenseGroup, SUM(e.amount) AS totalAmount "
        f"FROM expenses e LEFT JOIN expense_categories ec ON ec.id = e.categoryId "
        f"WHERE e.tenantId = :t AND e.status IN ('APPROVED', 'PAID') {date_filter.replace('createdAt', 'e.expenseDate')} {branch_filter.replace('branchId', 'e.branchId')} "
        f"GROUP BY ec.name, ec.`group` ORDER BY totalAmount DESC"
    ), params)).fetchall())

    netProfit = grossProfit - totalExpenses
    netMarginPct = round((netProfit / revenue * 100), 2) if revenue > 0 else 0

    return ok({
        "revenue": round(revenue, 2),
        "taxCollected": round(taxCollected, 2),
        "serviceCharges": round(serviceCharges, 2),
        "cogs": round(cogs, 2),
        "grossProfit": round(grossProfit, 2),
        "grossMarginPct": grossMarginPct,
        "expenses": round(totalExpenses, 2),
        "expenseBreakdown": exp_cats,
        "netProfit": round(netProfit, 2),
        "netMarginPct": netMarginPct,
    })


@router.get("/api/v1/reports/financial/cash-flow")
async def cash_flow(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Cash flow summary — inflows vs outflows."""
    where = "tenantId = :t"
    params: dict = {"t": tenantId}

    if startDate:
        where += " AND createdAt >= :sd"
        params["sd"] = startDate
    else:
        where += " AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)"

    if endDate:
        where += " AND createdAt <= :ed"
        params["ed"] = endDate

    if branchId:
        where += " AND branchId = :b"
        params["b"] = branchId

    # Cash sales inflow
    sd_val = startDate or '2000-01-01'
    ed_val = endDate or '2099-12-31'
    cash_in = (await db.execute(text(
        f"SELECT COALESCE(SUM(p.amount), 0) FROM payments p "
        f"WHERE p.tenantId = :t AND p.status = 'COMPLETED' AND p.method IN ('CASH','CARD','MOBILE_BANKING') "
        f"AND p.createdAt >= :sd AND p.createdAt <= :ed"
    ), {**params, "sd": sd_val, "ed": ed_val})).first()

    # Refunds outflow
    refunds = (await db.execute(text(
        f"SELECT COALESCE(SUM(amount), 0) FROM payments "
        f"WHERE {where} AND method = 'REFUND' AND status = 'COMPLETED'"
    ), params)).first()

    # Expenses outflow
    expenses_out = (await db.execute(text(
        f"SELECT COALESCE(SUM(amount), 0) FROM expenses "
        f"WHERE {where} AND status IN ('APPROVED', 'PAID')"
    ), params)).first()

    inflow = float(cash_in[0] or 0)
    outflow = float((refunds[0] or 0)) + float((expenses_out[0] or 0))

    return ok({
        "inflow": round(inflow, 2),
        "outflow": round(outflow, 2),
        "netCashFlow": round(inflow - outflow, 2),
        "refunds": round(float(refunds[0] or 0), 2),
        "expenses": round(float(expenses_out[0] or 0), 2),
    })


# ═════════════════════════ CUSTOMER REPORTS ═════════════════════════

@router.get("/api/v1/reports/customers/top")
async def top_customers(
    startDate: str = "",
    endDate: str = "",
    limit: int = Query(20),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Top customers by total spend."""
    where = "s.tenantId = :t AND s.status = 'CONFIRMED' AND s.customerId IS NOT NULL"
    params: dict = {"t": tenantId}

    if startDate:
        where += " AND s.createdAt >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND s.createdAt <= :ed"
        params["ed"] = endDate

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT s.customerId, c.name AS customerName, c.phone, c.email, c.loyaltyPoints, "
            f"COUNT(*) AS purchaseCount, "
            f"COALESCE(SUM(s.total), 0) AS totalSpend, "
            f"AVG(s.total) AS avgOrderValue, "
            f"MAX(s.createdAt) AS lastPurchaseDate "
            f"FROM sales s "
            f"JOIN customers c ON c.id = s.customerId "
            f"WHERE {where} "
            f"GROUP BY s.customerId, c.name, c.phone, c.email, c.loyaltyPoints "
            f"ORDER BY totalSpend DESC LIMIT :lim"
        ),
        {**params, "lim": limit},
    )).fetchall())

    return ok(rows)


@router.get("/api/v1/reports/customers/credit-aging")
async def customer_credit_aging(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Credit aging analysis for all customers with dues."""
    rows = rows_to_dicts((await db.execute(
        text(
            "SELECT c.id AS customerId, c.name AS customerName, c.phone, "
            "c.creditLimit, c.currentDue, c.status, "
            "COALESCE(SUM(CASE WHEN i.issueDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN i.total - i.paidTotal ELSE 0 END), 0) AS current30, "
            "COALESCE(SUM(CASE WHEN i.issueDate < DATE_SUB(NOW(), INTERVAL 30 DAY) AND i.issueDate >= DATE_SUB(NOW(), INTERVAL 60 DAY) THEN i.total - i.paidTotal ELSE 0 END), 0) AS d31_60, "
            "COALESCE(SUM(CASE WHEN i.issueDate < DATE_SUB(NOW(), INTERVAL 60 DAY) AND i.issueDate >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN i.total - i.paidTotal ELSE 0 END), 0) AS d61_90, "
            "COALESCE(SUM(CASE WHEN i.issueDate < DATE_SUB(NOW(), INTERVAL 90 DAY) THEN i.total - i.paidTotal ELSE 0 END), 0) AS d90plus "
            "FROM customers c "
            "LEFT JOIN invoices i ON i.customerId = c.id AND i.status IN ('ISSUED', 'PARTIALLY_PAID') "
            "WHERE c.tenantId = :t AND c.creditLimit > 0 "
            "GROUP BY c.id, c.name, c.phone, c.creditLimit, c.currentDue, c.status "
            "HAVING currentDue > 0 "
            "ORDER BY currentDue DESC"
        ),
        {"t": tenantId},
    )).fetchall())

    return ok(rows)


# ═════════════════════════ EXPENSE REPORTS ═════════════════════════

@router.get("/api/v1/reports/expenses/summary")
async def expense_summary(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Expense summary with category breakdown."""
    where = "e.tenantId = :t"
    params: dict = {"t": tenantId}

    if startDate:
        where += " AND e.expenseDate >= :sd"
        params["sd"] = startDate
    else:
        where += " AND e.expenseDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    if endDate:
        where += " AND e.expenseDate <= :ed"
        params["ed"] = endDate
    if branchId:
        where += " AND e.branchId = :b"
        params["b"] = branchId

    total_row = (await db.execute(text(
        f"SELECT COALESCE(SUM(amount), 0) FROM expenses e WHERE {where}"
    ), params)).first()
    totalExpenses = float(total_row[0] or 0)

    by_category = rows_to_dicts((await db.execute(text(
        f"SELECT ec.name AS categoryName, ec.`group` AS expenseGroup, "
        f"COUNT(*) AS count, SUM(e.amount) AS totalAmount "
        f"FROM expenses e LEFT JOIN expense_categories ec ON ec.id = e.categoryId "
        f"WHERE {where} "
        f"GROUP BY ec.name, ec.`group` ORDER BY totalAmount DESC"
    ), params)).fetchall())

    by_method = rows_to_dicts((await db.execute(text(
        f"SELECT e.paymentMethod, COUNT(*) AS count, SUM(e.amount) AS totalAmount "
        f"FROM expenses e WHERE {where} "
        f"GROUP BY e.paymentMethod ORDER BY totalAmount DESC"
    ), params)).fetchall())

    return ok({
        "totalExpenses": round(totalExpenses, 2),
        "byCategory": by_category,
        "byPaymentMethod": by_method,
    })


# ═════════════════════════ DASHBOARD KPIs ═════════════════════════

@router.get("/api/v1/reports/dashboard/kpis")
async def dashboard_kpis(
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Comprehensive dashboard KPIs with current vs previous period comparison."""
    params: dict = {"t": tenantId}
    branch_filter = ""
    if branchId:
        branch_filter = " AND branchId = :b"
        params["b"] = branchId

    # Current period (this month)
    curr = (await db.execute(text(
        f"SELECT COUNT(*) AS saleCount, COALESCE(SUM(total), 0) AS totalSales, "
        f"COALESCE(SUM(paidTotal), 0) AS totalPaid, COALESCE(SUM(dueTotal), 0) AS totalDue "
        f"FROM sales WHERE tenantId = :t AND status = 'CONFIRMED' "
        f"AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01') {branch_filter}"
    ), params)).first()

    # Previous period (last month)
    prev = (await db.execute(text(
        f"SELECT COUNT(*) AS saleCount, COALESCE(SUM(total), 0) AS totalSales, "
        f"COALESCE(SUM(paidTotal), 0) AS totalPaid, COALESCE(SUM(dueTotal), 0) AS totalDue "
        f"FROM sales WHERE tenantId = :t AND status = 'CONFIRMED' "
        f"AND createdAt >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') "
        f"AND createdAt < DATE_FORMAT(NOW(), '%Y-%m-01') {branch_filter}"
    ), params)).first()

    # Today
    today = (await db.execute(text(
        f"SELECT COUNT(*) AS saleCount, COALESCE(SUM(total), 0) AS totalSales "
        f"FROM sales WHERE tenantId = :t AND status = 'CONFIRMED' "
        f"AND DATE(createdAt) = CURDATE() {branch_filter}"
    ), params)).first()

    # Products & stock
    product_count = (await db.execute(text(
        "SELECT COUNT(*) FROM products WHERE tenantId = :t"
    ), {"t": tenantId})).first()

    low_stock = (await db.execute(text(
        "SELECT COUNT(*) FROM stock WHERE tenantId = :t AND qtyOnHand <= 10 AND qtyOnHand > 0"
    ), {"t": tenantId})).first()

    out_of_stock = (await db.execute(text(
        "SELECT COUNT(*) FROM stock WHERE tenantId = :t AND qtyOnHand <= 0"
    ), {"t": tenantId})).first()

    customer_count = (await db.execute(text(
        "SELECT COUNT(*) FROM customers WHERE tenantId = :t"
    ), {"t": tenantId})).first()

    customer_dues = (await db.execute(text(
        "SELECT COALESCE(SUM(currentDue), 0) FROM customers WHERE tenantId = :t"
    ), {"t": tenantId})).first()

    # Compute change %
    def _pct(curr_val, prev_val):
        if prev_val and prev_val > 0:
            return round((curr_val - prev_val) / prev_val * 100, 1)
        return 0

    return ok({
        "today": {"saleCount": today[0], "totalSales": round(float(today[1] or 0), 2)},
        "thisMonth": {
            "saleCount": curr[0],
            "totalSales": round(float(curr[1] or 0), 2),
            "totalPaid": round(float(curr[2] or 0), 2),
            "totalDue": round(float(curr[3] or 0), 2),
            "changePct": _pct(float(curr[1] or 0), float(prev[1] or 0)),
        },
        "lastMonth": {
            "saleCount": prev[0],
            "totalSales": round(float(prev[1] or 0), 2),
        },
        "products": {
            "total": product_count[0],
            "lowStock": low_stock[0],
            "outOfStock": out_of_stock[0],
        },
        "customers": {
            "total": customer_count[0],
            "totalDues": round(float(customer_dues[0] or 0), 2),
        },
    })


@router.get("/api/v1/reports/dashboard/trend")
async def sales_trend(
    days: int = Query(30),
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Daily sales trend for chart rendering."""
    params: dict = {"t": tenantId, "d": days}
    branch_filter = ""
    if branchId:
        branch_filter = " AND s.branchId = :b"
        params["b"] = branchId

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT DATE(s.createdAt) AS date, "
            f"COUNT(*) AS saleCount, "
            f"COALESCE(SUM(s.total), 0) AS totalSales, "
            f"COALESCE(SUM(s.paidTotal), 0) AS totalPaid "
            f"FROM sales s "
            f"WHERE s.tenantId = :t AND s.status = 'CONFIRMED' "
            f"AND s.createdAt >= DATE_SUB(NOW(), INTERVAL :d DAY) "
            f"{branch_filter} "
            f"GROUP BY DATE(s.createdAt) ORDER BY date"
        ),
        params,
    )).fetchall())

    return ok(rows)
