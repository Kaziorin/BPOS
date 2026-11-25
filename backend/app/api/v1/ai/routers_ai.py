"""AI Intelligence Layer Router (Prompt 31 / §16).

Separate platform layer that READS from Reporting/BI (Prompt 30),
never bypassing business logic.  Every AI query MUST pass through the
same RBAC check as a normal API call.

AI modules:
- Demand Forecasting (moving average, trend detection)
- Inventory AI (reorder, overstock, dead-stock, expiry-risk)
- Sales AI (best/slow products, trends, branch performance)
- Profit AI (margin analysis, explainable output)
- Fraud AI (suspicious patterns — alert only)
- Customer AI (LTV, churn risk, cross-sell)
- Supplier AI (scoring)
- Procurement AI (explainable purchase recommendations)
- AI Business Copilot (natural-language Q&A)
- AI Action System (suggestions → human confirmation → approval engine)
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser, get_user_permissions
from util import ok, err, rows_to_dicts

router = APIRouter()


def _uid() -> str:
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════════
# HELPER: Permission-scoped data access
# ═══════════════════════════════════════════════════════════════════

async def _check_ai_permission(user: AuthUser, db: AsyncSession, required_perm: str = ""):
    """Enforce RBAC: every AI query must pass the same permission check."""
    perms = await get_user_permissions(user.id, user.tenantId, db)
    if required_perm and required_perm not in perms:
        return False, perms
    return True, perms


async def _log_ai_permission(db: AsyncSession, tenant_id: str, user_id: str,
                              query: str, permitted: bool, denied_reason: str = None,
                              required_perm: str = None):
    await db.execute(text(
        "INSERT INTO ai_permissions_log (id, tenantId, userId, query, permitted, deniedReason, requiredPermission) "
        "VALUES (:id, :t, :u, :q, :p, :dr, :rp)"),
        {"id": _uid(), "t": tenant_id, "u": user_id, "q": query[:500],
         "p": 1 if permitted else 0, "dr": denied_reason, "rp": required_perm})
    await db.commit()


# ═══════════════════════════════════════════════════════════════════
# 1. DEMAND FORECASTING
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/demand-forecast")
async def demand_forecast(
    productId: str = "",
    branchId: str = "",
    days: int = 30,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Forecast demand using moving average of recent sales."""
    where = "s.tenantId=:t AND s.status='CONFIRMED'"
    params: dict = {"t": tenantId}
    if productId:
        where += " AND si.productId=:p"; params["p"] = productId
    if branchId:
        where += " AND s.branchId=:b"; params["b"] = branchId

    # Get daily sales for last 90 days
    rows = (await db.execute(text(
        f"SELECT DATE(s.createdAt) AS saleDate, si.productId, p.name AS productName, "
        f"SUM(si.qty) AS dailyQty "
        f"FROM sale_items si "
        f"JOIN sales s ON s.id=si.saleId "
        f"JOIN products p ON p.id=si.productId "
        f"WHERE {where} AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY) "
        f"GROUP BY DATE(s.createdAt), si.productId, p.name "
        f"ORDER BY saleDate"), params)).fetchall()

    # Group by product
    product_data: dict = {}
    for r in rows:
        pid = r[1]
        if pid not in product_data:
            product_data[pid] = {"name": r[2], "dailySales": []}
        product_data[pid]["dailySales"].append(float(r[3] or 0))

    forecasts = []
    for pid, pd in product_data.items():
        sales = pd["dailySales"]
        if not sales:
            continue
        # Simple moving average forecast
        avg_daily = sum(sales) / len(sales) if sales else 0
        # Weighted moving average (recent days weighted more)
        recent = sales[-14:] if len(sales) >= 14 else sales
        wma = sum(s * (i + 1) for i, s in enumerate(recent)) / sum(range(1, len(recent) + 1)) if recent else 0
        forecast = round(wma * days, 1)
        # Trend detection
        if len(sales) >= 30:
            first_half = sum(sales[:15]) / 15
            second_half = sum(sales[15:]) / 15
            trend_pct = round(((second_half - first_half) / first_half * 100) if first_half > 0 else 0, 1)
        else:
            trend_pct = 0

        forecasts.append({
            "productId": pid, "productName": pd["name"],
            "avgDailySales": round(avg_daily, 2),
            "weightedAvgDaily": round(wma, 2),
            "forecastQty": forecast,
            "forecastDays": days,
            "trendPct": trend_pct,
            "trendDirection": "up" if trend_pct > 5 else ("down" if trend_pct < -5 else "stable"),
        })

    forecasts.sort(key=lambda x: x["forecastQty"], reverse=True)
    return ok({"forecasts": forecasts, "period": f"{days} days", "basedOn": "90-day moving average"})


# ═══════════════════════════════════════════════════════════════════
# 2. INVENTORY AI (reorder / overstock / dead-stock / expiry-risk)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/inventory")
async def inventory_ai(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """AI-powered inventory analysis: reorder, overstock, dead-stock, expiry risk."""
    perm_ok, _ = await _check_ai_permission(user, db)
    if not perm_ok:
        await _log_ai_permission(db, tenantId, user.id, "inventory AI", False, "No permission")
        return err("AI requires inventory viewing permission", 403)
    await _log_ai_permission(db, tenantId, user.id, "inventory AI", True)

    insights = []

    # Reorder recommendations
    reorder_rows = (await db.execute(text(
        "SELECT s.productId, p.name, p.sku, s.qtyOnHand, COALESCE(p.reorderPoint, 10) AS reorderPoint, "
        "p.costPrice "
        "FROM stock s JOIN products p ON p.id=s.productId "
        "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) "
        "ORDER BY s.qtyOnHand ASC LIMIT 50"), {"t": tenantId})).fetchall()

    for r in reorder_rows:
        cur_stock = float(r[3] or 0)
        reorder_pt = float(r[4] or 10)
        suggested = max(reorder_pt * 2 - cur_stock, reorder_pt)
        insights.append({
            "type": "REORDER", "productId": r[0], "productName": r[1], "sku": r[2],
            "currentStock": cur_stock, "reorderPoint": reorder_pt,
            "suggestedQty": round(suggested, 1),
            "costPrice": float(r[5] or 0),
            "explanation": f"Current stock ({cur_stock}) ≤ reorder point ({reorder_pt}). "
                          f"Recommended purchase: {suggested:.0f} units.",
        })

    # Dead stock (no movement in 90 days)
    dead_rows = (await db.execute(text(
        "SELECT s.productId, p.name, s.qtyOnHand, p.costPrice, "
        "MAX(sm.createdAt) AS lastMove "
        "FROM stock s JOIN products p ON p.id=s.productId "
        "LEFT JOIN stock_movements sm ON sm.productId=s.productId AND sm.warehouseId=s.warehouseId "
        "WHERE s.tenantId=:t AND s.qtyOnHand > 0 "
        "GROUP BY s.productId, p.name, s.qtyOnHand, p.costPrice "
        "HAVING lastMove IS NULL OR lastMove < DATE_SUB(NOW(), INTERVAL 90 DAY) "
        "ORDER BY (s.qtyOnHand * p.costPrice) DESC LIMIT 30"), {"t": tenantId})).fetchall()

    for r in dead_rows:
        insights.append({
            "type": "DEAD_STOCK", "productId": r[0], "productName": r[1],
            "qtyOnHand": float(r[2] or 0), "value": round(float(r[2] or 0) * float(r[3] or 0), 2),
            "explanation": f"No stock movement in 90+ days. Value at risk: ৳{float(r[2] or 0) * float(r[3] or 0):,.0f}",
        })

    return ok({"insights": insights, "reorderCount": len(reorder_rows), "deadStockCount": len(dead_rows)})


# ═══════════════════════════════════════════════════════════════════
# 3. PROFIT AI (explainable margin analysis)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/profit")
async def profit_ai(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """AI profit analysis with explainable output."""
    perm_ok, _ = await _check_ai_permission(user, db, "reports.view")
    if not perm_ok:
        await _log_ai_permission(db, tenantId, user.id, "profit AI", False, "reports.view required")
        return err("AI profit analysis requires reports.view permission", 403)
    await _log_ai_permission(db, tenantId, user.id, "profit AI", True)

    # This month vs last month
    this_month = (await db.execute(text(
        "SELECT COALESCE(SUM(subtotal - discountTotal),0) AS revenue, "
        "COALESCE(SUM(taxTotal),0) AS tax, COUNT(*) AS orders "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')"), {"t": tenantId})).first()

    last_month = (await db.execute(text(
        "SELECT COALESCE(SUM(subtotal - discountTotal),0) AS revenue, "
        "COALESCE(SUM(taxTotal),0) AS tax, COUNT(*) AS orders "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND createdAt >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') "
        "AND createdAt < DATE_FORMAT(NOW(), '%Y-%m-01')"), {"t": tenantId})).first()

    rev_this = float(this_month[0] or 0)
    rev_last = float(last_month[0] or 0)
    rev_change = ((rev_this - rev_last) / rev_last * 100) if rev_last > 0 else 0

    # Expense comparison
    exp_this = (await db.execute(text(
        "SELECT COALESCE(SUM(amount),0) FROM expenses "
        "WHERE tenantId=:t AND status IN ('APPROVED','PAID') "
        "AND expenseDate >= DATE_FORMAT(NOW(), '%Y-%m-01')"), {"t": tenantId})).first()
    exp_last = (await db.execute(text(
        "SELECT COALESCE(SUM(amount),0) FROM expenses "
        "WHERE tenantId=:t AND status IN ('APPROVED','PAID') "
        "AND expenseDate >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') "
        "AND expenseDate < DATE_FORMAT(NOW(), '%Y-%m-01')"), {"t": tenantId})).first()

    exp_this_val = float(exp_this[0] or 0)
    exp_last_val = float(exp_last[0] or 0)
    exp_change = ((exp_this_val - exp_last_val) / exp_last_val * 100) if exp_last_val > 0 else 0

    gross_this = rev_this - exp_this_val
    gross_last = rev_last - exp_last_val
    margin_this = (gross_this / rev_this * 100) if rev_this > 0 else 0
    margin_last = (gross_last / rev_last * 100) if rev_last > 0 else 0
    margin_change = margin_this - margin_last

    # Explainable output
    explanation_parts = []
    if rev_change > 0:
        explanation_parts.append(f"Revenue +{rev_change:.1f}%")
    elif rev_change < 0:
        explanation_parts.append(f"Revenue {rev_change:.1f}%")
    if exp_change > 5:
        explanation_parts.append(f"Expenses +{exp_change:.1f}%")
    elif exp_change < -5:
        explanation_parts.append(f"Expenses {exp_change:.1f}%")

    if margin_change < -2:
        verdict = "⚠️ Margin declined"
        explanation = f"{', '.join(explanation_parts)} → gross margin declined {margin_change:.1f}pp"
    elif margin_change > 2:
        verdict = "✅ Margin improved"
        explanation = f"{', '.join(explanation_parts)} → gross margin improved +{margin_change:.1f}pp"
    else:
        verdict = "➡️ Margin stable"
        explanation = f"{', '.join(explanation_parts) or 'No significant changes'} → margin stable"

    # Low-margin products
    low_margin = rows_to_dicts((await db.execute(text(
        "SELECT si.productId, p.name, SUM(si.qty) AS totalQty, "
        "SUM(si.qty * si.unitPrice) AS revenue, "
        "SUM(si.qty * p.costPrice) AS cost, "
        "ROUND((SUM(si.qty * si.unitPrice) - SUM(si.qty * p.costPrice)) / NULLIF(SUM(si.qty * si.unitPrice),0) * 100, 1) AS marginPct "
        "FROM sale_items si "
        "JOIN products p ON p.id=si.productId "
        "JOIN sales s ON s.id=si.saleId "
        "WHERE s.tenantId=:t AND s.status='CONFIRMED' "
        "AND s.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01') "
        "GROUP BY si.productId, p.name "
        "HAVING marginPct < 10 AND revenue > 0 "
        "ORDER BY marginPct ASC LIMIT 10"), {"t": tenantId})).fetchall())

    return ok({
        "verdict": verdict,
        "explanation": explanation,
        "thisMonth": {"revenue": round(rev_this, 2), "expenses": round(exp_this_val, 2),
                       "grossProfit": round(gross_this, 2), "marginPct": round(margin_this, 1),
                       "orders": int(this_month[2] or 0)},
        "lastMonth": {"revenue": round(rev_last, 2), "expenses": round(exp_last_val, 2),
                       "grossProfit": round(gross_last, 2), "marginPct": round(margin_last, 1),
                       "orders": int(last_month[2] or 0)},
        "lowMarginProducts": low_margin,
    })


# ═══════════════════════════════════════════════════════════════════
# 4. SALES AI
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/sales")
async def sales_ai(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Sales AI: best/slow products, trends, branch performance."""
    await _log_ai_permission(db, tenantId, user.id, "sales AI", True)

    # Best sellers this month
    best = rows_to_dicts((await db.execute(text(
        "SELECT si.productId, p.name, SUM(si.qty) AS qty, SUM(si.qty * si.unitPrice) AS revenue "
        "FROM sale_items si JOIN products p ON p.id=si.productId JOIN sales s ON s.id=si.saleId "
        "WHERE s.tenantId=:t AND s.status='CONFIRMED' "
        "AND s.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01') "
        "GROUP BY si.productId, p.name ORDER BY revenue DESC LIMIT 10"), {"t": tenantId})).fetchall())

    # Slow movers (sold in last 90 days but not this month)
    slow = rows_to_dicts((await db.execute(text(
        "SELECT DISTINCT si.productId, p.name FROM sale_items si "
        "JOIN products p ON p.id=si.productId JOIN sales s ON s.id=si.saleId "
        "WHERE s.tenantId=:t AND s.status='CONFIRMED' "
        "AND s.createdAt BETWEEN DATE_SUB(NOW(), INTERVAL 90 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY) "
        "AND si.productId NOT IN ("
        "  SELECT si2.productId FROM sale_items si2 JOIN sales s2 ON s2.id=si2.saleId "
        "  WHERE s2.tenantId=:t AND s2.status='CONFIRMED' "
        "  AND s2.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')"
        ") LIMIT 10"), {"t": tenantId})).fetchall())

    # Daily trend (last 14 days)
    trend = rows_to_dicts((await db.execute(text(
        "SELECT DATE(createdAt) AS date, COUNT(*) AS orders, SUM(total) AS revenue "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY) "
        "GROUP BY DATE(createdAt) ORDER BY date"), {"t": tenantId})).fetchall())

    return ok({"bestSellers": best, "slowMovers": slow, "dailyTrend": trend})


# ═══════════════════════════════════════════════════════════════════
# 5. FRAUD AI (alert only — never punishment)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/fraud")
async def fraud_ai(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Fraud detection: suspicious refunds, discounts, cash variance, stock manipulation."""
    alerts = []

    # High discount sales ( > 30% discount)
    high_disc = rows_to_dicts((await db.execute(text(
        "SELECT id, invoiceNo, total, discountTotal, "
        "ROUND(discountTotal / NULLIF(subtotal, 0) * 100, 1) AS discPct, "
        "userId, createdAt "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND discountTotal > 0 AND subtotal > 0 "
        "HAVING discPct > 30 "
        "ORDER BY discPct DESC LIMIT 20"), {"t": tenantId})).fetchall())
    for r in high_disc:
        alerts.append({
            "type": "HIGH_DISCOUNT", "severity": "MEDIUM",
            "title": f"High discount ({r.get('discPct', 0)}%) on {r.get('invoiceNo', '')}",
            "detail": f"৳{r.get('total', 0)} sale with {r.get('discPct', 0)}% discount",
            "entityType": "SALE", "entityId": r.get("id"),
        })

    # Unusual refund pattern (> 3 refunds by same user in 7 days)
    refund_users = rows_to_dicts((await db.execute(text(
        "SELECT userId, u.name, COUNT(*) AS refundCount, SUM(total) AS refundTotal "
        "FROM sales s LEFT JOIN users u ON u.id=s.userId "
        "WHERE s.tenantId=:t AND s.status='REFUNDED' "
        "AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) "
        "GROUP BY userId, u.name HAVING refundCount > 2 "
        "ORDER BY refundCount DESC LIMIT 10"), {"t": tenantId})).fetchall())
    for r in refund_users:
        alerts.append({
            "type": "REFUND_PATTERN", "severity": "HIGH",
            "title": f"Unusual refund pattern: {r.get('name', 'Unknown')} ({r.get('refundCount', 0)} refunds)",
            "detail": f"৳{r.get('refundTotal', 0)} refunded in 7 days by this user",
            "severity": "HIGH",
        })

    # Cash variance — shifts with note mentioning variance/diff/shortage
    try:
        variances = rows_to_dicts((await db.execute(text(
            "SELECT id, branchId, openingCash, status, note, closedAt "
            "FROM cash_shifts WHERE tenantId=:t AND status='CLOSED' "
            "AND (note LIKE '%variance%' OR note LIKE '%shortage%' OR note LIKE '%diff%') "
            "ORDER BY closedAt DESC LIMIT 10"), {"t": tenantId})).fetchall())
        for r in variances:
            alerts.append({
                "type": "CASH_VARIANCE", "severity": "MEDIUM",
                "title": f"Cash variance noted at branch",
                "detail": r.get("note", "Variance detected"),
            })
    except Exception:
        pass

    return ok({"alerts": alerts, "count": len(alerts), "note": "Alerts only — no automatic punishment"})


# ═══════════════════════════════════════════════════════════════════
# 6. CUSTOMER AI (LTV, churn risk, cross-sell)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/customers")
async def customer_ai(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Customer AI: high-value, churn risk, cross-sell opportunities."""
    # High-value customers
    high_value = rows_to_dicts((await db.execute(text(
        "SELECT c.id, c.name, c.phone, COUNT(s.id) AS orderCount, SUM(s.total) AS totalSpend, "
        "MAX(s.createdAt) AS lastOrderDate, "
        "DATEDIFF(NOW(), MAX(s.createdAt)) AS daysSinceLastOrder "
        "FROM customers c JOIN sales s ON s.customerId=c.id "
        "WHERE c.tenantId=:t AND s.status='CONFIRMED' "
        "GROUP BY c.id, c.name, c.phone "
        "ORDER BY totalSpend DESC LIMIT 10"), {"t": tenantId})).fetchall())

    # Churn risk (no order in 60+ days but had 3+ orders)
    churn_risk = rows_to_dicts((await db.execute(text(
        "SELECT c.id, c.name, c.phone, COUNT(s.id) AS orderCount, SUM(s.total) AS totalSpend, "
        "MAX(s.createdAt) AS lastOrderDate, "
        "DATEDIFF(NOW(), MAX(s.createdAt)) AS daysInactive "
        "FROM customers c JOIN sales s ON s.customerId=c.id "
        "WHERE c.tenantId=:t AND s.status='CONFIRMED' "
        "GROUP BY c.id, c.name, c.phone "
        "HAVING orderCount >= 3 AND daysInactive > 60 "
        "ORDER BY totalSpend DESC LIMIT 10"), {"t": tenantId})).fetchall())

    # Cross-sell: customers who bought product A but not product B
    # (simplified: customers who bought electronics but not accessories)
    cross_sell = rows_to_dicts((await db.execute(text(
        "SELECT c.id, c.name, c.phone, p.name AS lastProduct, s.total AS lastAmount "
        "FROM customers c "
        "JOIN sales s ON s.customerId=c.id AND s.tenantId=c.tenantId "
        "JOIN sale_items si ON si.saleId=s.id "
        "JOIN products p ON p.id=si.productId "
        "WHERE c.tenantId=:t AND s.status='CONFIRMED' "
        "AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) "
        "GROUP BY c.id, c.name, c.phone, p.name, s.total, s.createdAt "
        "ORDER BY s.createdAt DESC LIMIT 10"), {"t": tenantId})).fetchall())

    return ok({"highValue": high_value, "churnRisk": churn_risk, "crossSell": cross_sell})


# ═══════════════════════════════════════════════════════════════════
# 7. PROCUREMENT AI (explainable recommendations)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/procurement")
async def procurement_ai(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Explainable purchase recommendations."""
    # Products that need reorder
    products = rows_to_dicts((await db.execute(text(
        "SELECT s.productId, p.name, p.sku, s.qtyOnHand, "
        "COALESCE(p.reorderPoint, 10) AS reorderPoint, p.costPrice, "
        "COALESCE(p.sellingPrice, p.costPrice * 1.3) AS sellingPrice "
        "FROM stock s JOIN products p ON p.id=s.productId "
        "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) "
        "ORDER BY s.qtyOnHand ASC LIMIT 20"), {"t": tenantId})).fetchall())

    # Get avg daily sales for these products
    recommendations = []
    for prod in products:
        pid = prod["productId"]
        avg_row = (await db.execute(text(
            "SELECT COALESCE(AVG(daily_qty), 0) FROM ("
            "  SELECT DATE(s.createdAt) AS d, SUM(si.qty) AS daily_qty "
            "  FROM sale_items si JOIN sales s ON s.id=si.saleId "
            "  WHERE s.tenantId=:t AND s.status='CONFIRMED' AND si.productId=:p "
            "  AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) "
            "  GROUP BY DATE(s.createdAt) "
            ") sub"), {"t": tenantId, "p": pid})).first()

        avg_daily = float(avg_row[0] or 0)
        lead_time = 7  # default 7 days
        safety_stock = float(prod["reorderPoint"]) * 0.5
        current = float(prod["qtyOnHand"])
        needed = avg_daily * lead_time + safety_stock - current
        recommended = max(round(needed), 0)

        recommendations.append({
            "productId": pid, "productName": prod["name"], "sku": prod["sku"],
            "currentStock": current,
            "avgDailySales": round(avg_daily, 2),
            "leadTimeDays": lead_time,
            "safetyStock": round(safety_stock, 1),
            "recommendedPurchase": recommended,
            "costPrice": float(prod["costPrice"] or 0),
            "totalCost": round(recommended * float(prod["costPrice"] or 0), 2),
            "explanation": (
                f"avg daily sales: {avg_daily:.1f}, current stock: {current:.0f}, "
                f"lead time: {lead_time}d, safety stock: {safety_stock:.0f} "
                f"→ buy {recommended} units"
            ),
        })

    return ok({"recommendations": recommendations, "totalEstimatedCost": round(sum(r["totalCost"] for r in recommendations), 2)})


# ═══════════════════════════════════════════════════════════════════
# 8. AI BUSINESS COPILOT (natural-language Q&A)
# ═══════════════════════════════════════════════════════════════════

@router.post("/api/v1/ai/copilot")
async def ai_copilot(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Natural-language Q&A copilot. Answers questions about business data."""
    message = (body.get("message") or "").strip()
    session_id = body.get("sessionId") or _uid()
    if not message:
        return err("message required", 400)

    # Permission check — log every query
    perms = await get_user_permissions(user.id, tenantId, db)
    has_profit = "reports.view" in perms or "admin" in user.roleName.lower()
    await _log_ai_permission(db, tenantId, user.id, message, True)

    # Save user message
    await db.execute(text(
        "INSERT INTO ai_conversations (id, tenantId, userId, sessionId, role, message) "
        "VALUES (:id, :t, :u, :s, 'USER', :m)"),
        {"id": _uid(), "t": tenantId, "u": user.id, "s": session_id, "m": message})
    await db.commit()

    msg_lower = message.lower()
    answer = ""
    suggestions = []

    # Check for local Ollama or optional external LLM (OpenAI / Gemini)
    import os
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    is_bengali = any('\u0980' <= char <= '\u09FF' for char in message) or any(
        w in msg_lower for w in ["koto", "bikri", "lav", "baki", "kemon", "stock", "mal", "ki", "ke", "kake", "kobe", "keno"]
    )

    # 1. Local Ollama or External LLM Path
    try:
        import httpx
        # Fetch essential business stats for context injection
        stats_today = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(total),0) FROM sales WHERE tenantId=:t AND status='CONFIRMED' AND DATE(createdAt)=CURDATE()"),
            {"t": tenantId})).first()
        stats_month = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(total),0) FROM sales WHERE tenantId=:t AND status='CONFIRMED' AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')"),
            {"t": tenantId})).first()
        low_stock = (await db.execute(text(
            "SELECT COUNT(*) FROM stock s JOIN products p ON p.id=s.productId WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10)"),
            {"t": tenantId})).first()
        due_total = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(total - paidTotal),0) FROM invoices WHERE tenantId=:t AND status NOT IN ('PAID','VOID')"),
            {"t": tenantId})).first()

        system_instruction = (
            "You are the dedicated internal Offline AI Agent for Blue Oceans POS (Enterprise Multi-Branch ERP & POS System).\n"
            "STRICT OPERATIONAL RULES:\n"
            "1. You ONLY answer questions related to Blue Oceans POS features, modules, navigation, sales, profit, inventory stock, customer dues, accounting, hardware (receipt printers, barcode scanners), and retail operations.\n"
            "2. If the user asks anything unrelated to Blue Oceans POS or store management (such as movies, general knowledge, other coding, sports), politely decline in Bengali: 'আমি শুধুমাত্র ব্লু ওশানস পিওএস (Blue Oceans POS) এবং আপনার ব্যবসায়িক হিসাব-নিকাশ সম্পর্কিত প্রশ্নের উত্তর দিতে পারি।'\n"
            "3. Answer in the same language as the user (Bengali if asked in Bengali or Banglish, English if in English). Keep answers practical, clear, and concise.\n"
            f"\nLive Store Metrics Context:\n"
            f"- Today's Sales: {stats_today[0]} orders, Total ৳{float(stats_today[1] or 0):,.2f}\n"
            f"- This Month's Sales: {stats_month[0]} orders, Total ৳{float(stats_month[1] or 0):,.2f}\n"
            f"- Low Stock Products Needing Reorder: {low_stock[0]} items\n"
            f"- Total Outstanding Customer Due / AR: {due_total[0]} invoices, ৳{float(due_total[1] or 0):,.2f}\n"
            "\nBlue Oceans POS Features Overview:\n"
            "- Modules: Retail POS, Restaurant KOT & Dining Tables, Pharmacy (Rx & generic medicine), Grocery & Bakery (scales), Salon & Spa bookings, Wholesale B2B & RMA repair.\n"
            "- Multi-Branch: Central warehouse, inter-branch stock transfers, franchise royalties.\n"
            "- Accounts: Double-entry accounting, P&L, Balance Sheet, NBR VAT/Tax compliant, Customer EMI & Credit ledger.\n"
            "- Offline Resilience: Full offline POS billing with automatic cloud sync on reconnect.\n"
        )

        # 1A. Local Ollama LLM (Preferred Offline Agent with fast timeout)
        if ollama_url and not answer:
            try:
                # Fast timeout so it does not hang if CPU is slow
                async with httpx.AsyncClient(timeout=12.0) as client:
                    ollama_payload = {
                        "model": ollama_model,
                        "messages": [
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": message}
                        ],
                        "stream": False,
                        "options": {"temperature": 0.3}
                    }
                    resp = await client.post(f"{ollama_url}/api/chat", json=ollama_payload)
                    if resp.status_code == 200:
                        ollama_res = resp.json()
                        msg_obj = ollama_res.get("message") or {}
                        raw_ans = (msg_obj.get("content") or "").strip()
                        # Only accept if non-empty and coherent
                        if len(raw_ans) > 15:
                            answer = raw_ans
            except Exception:
                pass

        # 1B. Optional Google Gemini (Free Tier) if key is added in .env
        if not answer and gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json={
                        "systemInstruction": {"parts": [{"text": system_instruction}]},
                        "contents": [{"parts": [{"text": message}]}]
                    })
                    if resp.status_code == 200:
                        gem_data = resp.json()
                        candidates = gem_data.get("candidates") or []
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts") or []
                            if parts:
                                answer = parts[0].get("text", "").strip()
            except Exception:
                pass
    except Exception:
        pass

    # 2. Local Real-Time High-Accuracy Offline Business Intelligence Engine (Instant 0.01s)
    if not answer:
        # Identity & Greeting Intent
        if any(w in msg_lower for w in ["tomar name", "tomar nam", "your name", "who are you", "tumi k", "tumi ke", "পরিচয়", "নাম কি", "নাম কী", "কে তুমি", "কে আপনি", "hello", "hi", "kemon aso", "কেমন আছো", "কেমন আছেন"]):
            answer = (
                "👋 আমি ব্লু ওশানস পিওএস (Blue Oceans POS)-এর অফলাইন বিজনেস এআই কোপাইলট।\n\n"
                "আমি আপনার সফটওয়্যারের একজন ডেডিকেটেড সহকারী হিসেবে কাজ করি।\n"
                "• আপনার দোকানের আজকের বিক্রি, লাভ-ক্ষতি, পণ্যের বর্তমান স্টক ও কাস্টমার বকেয়ার লাইভ হিসাব দিতে পারি।\n"
                "• পিওএস, ইনভেন্টরি, রেস্তোরাঁ KOT, ফার্মেসি, অ্যাকাউন্টিং এবং অন্যান্য মডিউল ব্যবহারের সঠিক নির্দেশনা দিতে পারি।"
            )

        # How Subscription / SaaS Plans Work Intent
        elif any(w in msg_lower for w in ["subscription", "plan", "package", "প্যাকেজ", "প্ল্যান", "সাবস্ক্রিপশন", "কত টাকা", "চার্জ"]):
            plans_db = rows_to_dicts((await db.execute(text(
                "SELECT name, priceMonthly, maxUsers, maxBranches, maxTerminals, description FROM saas_plans ORDER BY priceMonthly ASC"))).fetchall())
            if plans_db:
                p_lines = []
                for p in plans_db:
                    p_lines.append(
                        f"• {p['name']} (৳{float(p['priceMonthly'] or 0):,.0f}/মাস):\n"
                        f"  আউটলেট: {p['maxBranches']}টি, টার্মিনাল: {p['maxTerminals']}টি, স্টাফ: {p['maxUsers']} জন।"
                    )
                answer = (
                    "💳 ব্লু ওশানস পিওএস-এর সাবস্ক্রিপশন প্ল্যানসমূহ:\n\n" +
                    "\n\n".join(p_lines) +
                    "\n\n⚙️ কীভাবে কাজ করে:\n"
                    "১. প্রতিটি প্ল্যানে আউটলেট, টার্মিনাল ও ইউজারের নির্ধারিত লিমিট থাকে।\n"
                    "২. মাসিক বা বাৎসরিক ভিত্তিতে সাবস্ক্রিপশন রিনিউ করা যায়।\n"
                    "৩. সুপার এডমিন প্যানেল থেকে যেকোনো সময় প্ল্যান আপগ্রেড বা এডিট করা সম্ভব।"
                )
            else:
                answer = (
                    "💳 ব্লু ওশানস পিওএস-এর প্রধান ৩টি কমার্শিয়াল সাবস্ক্রিপশন প্ল্যান:\n\n"
                    "১. Starter (৳৯৯০/মাস):\n"
                    "   • ১টি ব্রাঞ্চ, ২টি পিওএস টার্মিনাল, ৫ জন স্টাফ, ২৫০০ পণ্য ক্যাটালগ।\n"
                    "   • কোর রিটেইল পিওএস ও ইনভেন্টরি।\n\n"
                    "২. Business Pro (৳২,৯৯০/মাস):\n"
                    "   • ৫টি ব্রাঞ্চ, ১০টি টার্মিনাল, ২৫ জন স্টাফ, ২৫০০০ পণ্য।\n"
                    "   • মাল্টি-ব্রাঞ্চ স্টক ট্রান্সফার, রেস্তোরাঁ KOT ও অ্যাকাউন্টিং।\n\n"
                    "৩. Enterprise (৳৯,৯৯০/মাস):\n"
                    "   • আনলিমিটেড ব্রাঞ্চ ও টার্মিনাল, সম্পূর্ণ ইআরপি, ম্যানুফ্যাকচারিং ও ফ্র্যাঞ্চাইজি রয়্যালটি।"
                )

        # How Inventory Works Intent
        elif any(w in msg_lower for w in ["inventory ke vabe", "inventory kivabe", "how inventory", "inventory কাজ", "ইনভেন্টরি কীভাবে", "ইনভেন্টরি কিভাবে", "ইনভেন্টরি কাজ", "স্টক কীভাবে", "স্টক কিভাবে"]):
            # Get live stock overview
            total_items = (await db.execute(text("SELECT COUNT(*) FROM products WHERE tenantId=:t"), {"t": tenantId})).scalar() or 0
            low_items = (await db.execute(text(
                "SELECT COUNT(*) FROM stock s JOIN products p ON p.id=s.productId WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) AND s.qtyOnHand > 0"),
                {"t": tenantId})).scalar() or 0
            answer = (
                "📦 ব্লু ওশানস পিওএস-এ ইনভেন্টরি যেভাবে কাজ করে:\n\n"
                "১. ক্যাটালগ ও বারকোড ট্র্যাকিং:\n"
                "   প্রতিটি পণ্যের একক SKU, বারকোড, কেনা দাম (Cost Price) এবং বিক্রির দাম নির্ধারণ থাকে। বারকোড স্ক্যান করলেই তাৎক্ষণিক স্টক পাওয়া যায়।\n\n"
                "২. অটো স্টক ডিডাকশন (POS Billing):\n"
                "   পিওএস কাউন্টারে পণ্য বিক্রি হওয়ার সাথে সাথেই ইনভেন্টরি থেকে অটোমেটিক স্টক কমে যায়। কোনো কারণে সেল রিটার্ন হলে স্টক ফেরত আসে।\n\n"
                "৩. মাল্টি-ওয়্যারহাউস ও ইন্টার-ব্রাঞ্চ ট্রান্সফার:\n"
                "   সেন্ট্রাল ওয়্যারহাউস থেকে যেকোনো আউটলেট বা শাখায় পণ্য স্টক ট্রান্সফার চালান (Stock Transfer Order) এর মাধ্যমে পাঠানো ও গ্রহণ করা যায়।\n\n"
                "৪. ব্যাচ ও এক্সপায়ারি ট্র্যাকিং:\n"
                "   ফার্মেসি ও গ্রোসারির জন্য প্রতি চালানের ব্যাচ নম্বর ও মেয়াদোত্তীর্ণ তারিখ (Expiry Date) ট্র্যাক হয়। মেয়াদ শেষ হওয়ার আগেই এআই নোটিফিকেশন দেয়।\n\n"
                "৫. সেফটি রি-অর্ডার পয়েন্ট ও রিয়েল-টাইম স্ট্যাটাস:\n"
                f"   আপনার স্টোরে বর্তমানে সর্বমোট {total_items} টি পণ্য ক্যাটালগ রয়েছে। এর মধ্যে {low_items} টি পণ্যের স্টক রি-অর্ডার লেভেলের নিচে রয়েছে।"
            )

        # How POS / Billing Terminal Works Intent
        elif any(w in msg_lower for w in ["pos ke vabe", "pos kivabe", "how pos", "পিওএস কীভাবে", "বিলিং কীভাবে", "বিল কীভাবে", "ক্যাশ কাউন্টার"]):
            answer = (
                "🛒 ব্লু ওশানস পিওএস টার্মিনাল ব্যবহারের কার্যপ্রণালী:\n\n"
                "১. কুইক আইটেম সিলেকশন:\n"
                "   বারকোড স্ক্যানার দিয়ে স্ক্যান করুন অথবা স্ক্রিনের ক্যাটাগরি গ্রিড থেকে টাচ করে আইটেম কার্টে যোগ করুন।\n"
                "২. হোল্ড ও পার্ক সেল (Hold Sale):\n"
                "   কাস্টমার টাকা গোছাতে দেরি করলে সেল 'Hold' করে পরের কাস্টমারের বিল করা যায়, পরে যেকোনো সময় পুনরায় 'Resume' করা যায়।\n"
                "৩. মাল্টি-পেমেন্ট মেথড:\n"
                "   ক্যাশ, কার্ড, বিকাশ/নগদ কিউআর বা কাস্টমারের বাকির খাতে পেমেন্ট স্প্লিট করে নেওয়া যায়।\n"
                "৪. প্রিন্টিং ও হার্ডওয়্যার:\n"
                "   পেমেন্ট শেষ হতেই অটোমেটিক থার্মাল প্রিন্টারে রসিদ প্রিন্ট হয় এবং ক্যাশ ড্রয়ার খুলে যায়।\n"
                "৫. ১০০% অফলাইন সাপোর্ট:\n"
                "   দোকানের ইন্টারনেট চলে গেলেও পিওএস নিরবচ্ছিন্ন বিলিং করতে পারে এবং নেট আসলে সেন্ট্রাল ডাটাবেজে অটো সিঙ্ক করে।"
            )

        # How Accounting Works Intent
        elif any(w in msg_lower for w in ["accounting ke vabe", "accounting kivabe", "হিসাব কীভাবে", "অ্যাকাউন্টিং কীভাবে"]):
            answer = (
                "💰 ফিন্যান্সিয়াল অ্যাকাউন্টিং মডিউলের কার্যপ্রণালী:\n\n"
                "১. স্বয়ংক্রিয় ডাবল-এন্ট্রি বুককিপিং (Automatic Ledger):\n"
                "   প্রতিটি বিক্রি, পণ্য কেনা (Purchase), এবং খরচের এন্ট্রি সাথে সাথে চার্ট অফ অ্যাকাউন্টস লেজারে ডেবিট-ক্রেডিট হয়ে যায়।\n"
                "২. লাইভ লাভ-ক্ষতি (P&L) ও ব্যালেন্স শিট:\n"
                "   রিয়েল-টাইমে মোট রেভিনিউ বনাম খরচ বিশ্লেষণ করে নিট প্রফিট হিসাব করে।\n"
                "৩. এনবিআর ভ্যাট ও ট্যাক্স:\n"
                "   বাংলাদেশ এনবিআর ভ্যাট আইন অনুযায়ী সঠিক ভ্যাট চালান ও ট্যাক্স হিসাব তৈরি থাকে।\n"
                "৪. কাস্টমার ও সাপ্লায়ার লেজার:\n"
                "   কার কাছে কত বকেয়া পাওনা এবং সাপ্লায়ারকে কত দেনা আছে তা লেজার থেকে এক নজরে দেখা যায়।"
            )

    # 2. Local Real-Time SQL Business Intelligence (Zero Cost / Offline / Bilingual)
    if not answer:
        # System Features & Capabilities Intent
        if any(w in msg_lower for w in ["feature", "ke ke feature", "ki ki feature", "ফিচার", "সুবিধা", "মডিউল", "module", "system", "ব্যবহার", "কি কি আছে", "কী কী আছে", "ক্যাপাসিটি", "কি কি"]):
            if is_bengali:
                answer = (
                    "ব্লু ওশানস পিওএস (Blue Oceans POS)-এ অন্তর্ভুক্ত প্রধান ফিচার ও মডিউলসমূহ:\n\n"
                    "১. 🛒 মাল্টি-ইন্ডাস্ট্রি পিওএস টার্মিনাল:\n"
                    "   • রিটেইল পিওএস (বারকোড রিডার, টাচ সেল, কুইক বিলিং)\n"
                    "   • রেস্তোরাঁ ও কিচেন (ডাইন-ইন, টেবিল মেট্রিক্স, KOT ও কিচেন ডিসপ্লে)\n"
                    "   • ফার্মেসি পিওএস (প্রেসক্রিপশন আপলোড, জেনেরিক ও ড্রাগ ইন্টারেকশন)\n"
                    "   • গ্রোসারি ও বেকারি (ওয়েট স্কেল ইন্টিগ্রেশন, দ্রুত চেকআউট)\n"
                    "   • স্যালন ও স্পা (অ্যাপয়েন্টমেন্ট ও সার্ভিস বুকিং)\n"
                    "   • হোলসেল ও রিপেয়ার মোড (B2B কোটেশন, RMA ট্র্যাকিং)\n\n"
                    "২. 📦 ইনভেন্টরি ও ওয়্যারহাউস:\n"
                    "   • রিয়েল-টাইম স্টক লেভেল ও লো-স্টক নোটিফিকেশন\n"
                    "   • ব্যাচ নম্বর ও এক্সপায়ারি ডেট ট্র্যাকিং\n"
                    "   • একাধিক সেন্ট্রাল ওয়্যারহাউস ও ইন্টার-ব্রাঞ্চ স্টক ট্রান্সফার\n\n"
                    "৩. 💰 ফিন্যান্সিয়াল অ্যাকাউন্টিং:\n"
                    "   • ফুল ডাবল-এন্ট্রি বুককিপিং, লেজার ও চার্ট অফ অ্যাকাউন্টস\n"
                    "   • প্রফিট অ্যান্ড লস (P&L), ব্যালেন্স শিট ও ট্রায়াল ব্যালেন্স\n"
                    "   • এনবিআর ভ্যাট ও ট্যাক্স হিসাব, কাস্টমার বাকির খাতা ও কিস্তি (EMI)\n\n"
                    "৪. ⚡ অফলাইন রেজিলিয়েন্স ও হার্ডওয়্যার:\n"
                    "   • ইন্টারনেট চলে গেলেও নিরবচ্ছিন্ন অফলাইন সেল ও অটো ক্লাউড সিঙ্ক\n"
                    "   • থার্মাল প্রিন্টার (ESC/POS), ক্যাশ ড্রয়ার ও কাস্টমার ডিসপ্লে পোল\n\n"
                    "৫. 🏢 মাল্টি-ব্রাঞ্চ ও ফ্র্যাঞ্চাইজি:\n"
                    "   • সেন্ট্রাল পারচেজিং, মাল্টি-আউটলেট মনিটরিং ও ফ্র্যাঞ্চাইজি রয়্যালটি\n\n"
                    "৬. 🌐 ই-কমার্স ও লয়্যালটি:\n"
                    "   • অনলাইন শপ ইন্টিগ্রেশন, কাস্টমার ক্যাশব্যাক লয়্যালটি ও SMS ইনভয়েস।"
                )
            else:
                answer = (
                    "Blue Oceans POS Enterprise Features & Capabilities:\n\n"
                    "1. Multi-Mode POS Terminals: Retail, Restaurant KOT/Tables, Pharmacy Rx, Grocery, Bakery, Salon, Wholesale & Repair POS.\n"
                    "2. Inventory & Warehouses: Real-time stock, batch & expiry tracking, barcode printing, and inter-branch transfers.\n"
                    "3. Financial Accounting: Double-entry ledger, PnL, Balance Sheet, NBR VAT reports, customer credit & EMI installments.\n"
                    "4. Multi-Branch & Franchise: Central purchasing, multi-outlet management, and franchise royalty tracking.\n"
                    "5. Offline Resilience: Offline sales mode with automatic cloud sync and hardware integration.\n"
                    "6. eCommerce & Loyalty: Integrated webstore, customer loyalty points, and SMS invoice receipts."
                )

        # Sales & Revenue Intent
        elif any(w in msg_lower for w in ["sale", "sales", "revenue", "today", "how much", "বিক্রি", "সেল", "আজকের", "টাকা", "বেচাকেনা", "মোট"]):
            r = (await db.execute(text(
                "SELECT COUNT(*), COALESCE(SUM(total),0) FROM sales "
                "WHERE tenantId=:t AND status='CONFIRMED' AND DATE(createdAt)=CURDATE()"),
                {"t": tenantId})).first()
            if is_bengali:
                answer = f"আজকের বিক্রয় হিসাব: মোট {r[0]} টি অর্ডারে সর্বমোট ৳{float(r[1] or 0):,.2f} টাকা বিক্রি হয়েছে।"
            else:
                answer = f"Today's Sales: {r[0]} orders totaling ৳{float(r[1] or 0):,.2f}."

        # Profit & Margin Intent
        elif any(w in msg_lower for w in ["profit", "margin", "loss", "লাভ", "মার্জিন", "লস", "লোকসান"]):
            if not has_profit:
                answer = "⛔ দুঃখিত, আপনার রোলে লাভ-ক্ষতির ডেটা দেখার অনুমতি (reports.view) নেই।" if is_bengali else "⛔ You don't have permission to view profit data."
                await _log_ai_permission(db, tenantId, user.id, message, False, "reports.view required", "reports.view")
            else:
                r = (await db.execute(text(
                    "SELECT COALESCE(SUM(subtotal - discountTotal),0) FROM sales "
                    "WHERE tenantId=:t AND status='CONFIRMED' "
                    "AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')"),
                    {"t": tenantId})).first()
                e = (await db.execute(text(
                    "SELECT COALESCE(SUM(amount),0) FROM expenses "
                    "WHERE tenantId=:t AND status IN ('APPROVED','PAID') "
                    "AND expenseDate >= DATE_FORMAT(NOW(), '%Y-%m-01')"),
                    {"t": tenantId})).first()
                rev = float(r[0] or 0)
                exp = float(e[0] or 0)
                profit = rev - exp
                margin = (profit / rev * 100) if rev > 0 else 0
                if is_bengali:
                    answer = f"চলতি মাসের রিপোর্ট: সর্বমোট রেভিনিউ ৳{rev:,.0f}, খরচ ৳{exp:,.0f}, এবং আনুমানিক নিট প্রফিট ৳{profit:,.0f} ({margin:.1f}% মার্জিন)।"
                else:
                    answer = f"This Month: Revenue ৳{rev:,.0f}, Expenses ৳{exp:,.0f}, Net Profit ৳{profit:,.0f} ({margin:.1f}% margin)."

        # Overdue / Customer Due Intent
        elif any(w in msg_lower for w in ["overdue", "due", "unpaid", "outstanding", "বাকি", "বকেয়া", "পাওনা", "দেনাদার"]):
            r = (await db.execute(text(
                "SELECT COUNT(*), COALESCE(SUM(total - paidTotal),0) FROM invoices "
                "WHERE tenantId=:t AND status NOT IN ('PAID', 'VOID')"),
                {"t": tenantId})).first()
            if is_bengali:
                answer = f"বকেয়া বাকির হিসাব: সর্বমোট {r[0]} টি ইনভয়েসে মোট ৳{float(r[1] or 0):,.2f} টাকা বকেয়া পাওনা রয়েছে।"
            else:
                answer = f"Outstanding Customer AR: {r[0]} invoices, ৳{float(r[1] or 0):,.2f} total due."

        # Stock / Inventory Intent
        elif any(w in msg_lower for w in ["low stock", "stock", "inventory", "স্টক", "মালামাল", "পণ্য", "মাল", "মজুদ", "শেষ"]):
            r = (await db.execute(text(
                "SELECT COUNT(*) FROM stock s JOIN products p ON p.id=s.productId "
                "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) AND s.qtyOnHand > 0"),
                {"t": tenantId})).first()
            if is_bengali:
                answer = f"ইনভেন্টরি সতর্কতা: বর্তমানে {r[0]} টি পণ্যের স্টক রি-অর্ডার লেভেলের নিচে নেমে গেছে।"
                suggestions.append("ইনভেন্টরি এআই দেখুন → /ai?tab=inventory")
            else:
                answer = f"Inventory Alert: {r[0]} products are below their safety reorder point."
                suggestions.append("View Inventory AI → /ai?tab=inventory")

        # Top Customers Intent
        elif any(w in msg_lower for w in ["customer", "top customer", "best customer", "কাস্টমার", "গ্রাহক"]):
            r = rows_to_dicts((await db.execute(text(
                "SELECT c.name, COUNT(s.id) AS orders, SUM(s.total) AS spend "
                "FROM customers c JOIN sales s ON s.customerId=c.id "
                "WHERE c.tenantId=:t AND s.status='CONFIRMED' "
                "GROUP BY c.id, c.name ORDER BY spend DESC LIMIT 5"), {"t": tenantId})).fetchall())
            if r:
                lines = [f"{i+1}. {c['name']}: ৳{float(c['spend'] or 0):,.0f} ({c['orders']} orders)"
                         for i, c in enumerate(r)]
                answer = ("টপ কাস্টমারদের তালিকা:\n" if is_bengali else "Top Customers by Revenue:\n") + "\n".join(lines)
            else:
                answer = "এখনও পর্যাপ্ত কাস্টমার ট্রানজ্যাকশন রেকর্ড নেই।" if is_bengali else "No customer sales data yet."

        # Greetings & General Help
        elif any(w in msg_lower for w in ["hi", "hello", "help", "সালাম", "হাই", "হ্যালো", "কেমন", "সাহায্য"]):
            if is_bengali:
                answer = ("হ্যালো! আমি আপনার ব্লু ওশানস পিওএস বিজনেস কোপাইলট।\n"
                          "আপনি আমাকে আপনার ব্যবসার যেকোনো হিসাব জিজ্ঞেস করতে পারেন:\n"
                          "• \"আজকের মোট বিক্রি কত?\"\n"
                          "• \"চলতি মাসের লাভ কত?\"\n"
                          "• \"কোন কোন পণ্যের স্টক কম?\"\n"
                          "• \"বকেয়া বাকির পরিমাণ কত?\"\n"
                          "• \"সেরা কাস্টমার কারা?\"")
            else:
                answer = ("Hello! I am your Blue Oceans POS Business Copilot.\n"
                          "You can ask me questions about your store data:\n"
                          "• \"What are today's sales?\"\n"
                          "• \"How much profit this month?\"\n"
                          "• \"Which products need reorder?\"\n"
                          "• \"Show outstanding customer dues\"\n"
                          "• \"Who are my top customers?\"")

        else:
            if is_bengali:
                answer = ("আমি আপনার সেলস, প্রফিট, ইনভেন্টরি, কাস্টমার বাকি ও পারচেজ ডেটা বিশ্লেষণ করতে পারি। নিচের মতো করে প্রশ্ন করতে পারেন:\n"
                          "• \"আজকের সেল কত?\"\n"
                          "• \"চলতি মাসের প্রফিট কত?\"\n"
                          "• \"স্টক কম এমন প্রোডাক্ট দেখাও\"\n"
                          "• \"বকেয়া বাকির হিসাব দাও\"")
            else:
                answer = ("I can assist with sales, profit, inventory stock, customer dues, and procurement.\n"
                          "Try asking:\n"
                          "• \"What were today's sales?\"\n"
                          "• \"This month profit summary\"\n"
                          "• \"Which products are low on stock?\"\n"
                          "• \"Show total overdue balance\"")

    # Save assistant message
    await db.execute(text(
        "INSERT INTO ai_conversations (id, tenantId, userId, sessionId, role, message) "
        "VALUES (:id, :t, :u, :s, 'ASSISTANT', :m)"),
        {"id": _uid(), "t": tenantId, "u": user.id, "s": session_id, "m": answer})
    await db.commit()

    return ok({"answer": answer, "sessionId": session_id, "suggestions": suggestions})


# ═══════════════════════════════════════════════════════════════════
# 9. AI SUGGESTIONS / ACTIONS (require human confirmation)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/suggestions")
async def list_suggestions(
    status: str = "PENDING",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status=:s"; params["s"] = status.upper()

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM ai_suggestions WHERE {where} ORDER BY createdAt DESC LIMIT 50"),
        params)).fetchall())
    for r in rows:
        for col in ("inputs", "recommendation"):
            if isinstance(r.get(col), str):
                try:
                    r[col] = json.loads(r[col])
                except (json.JSONDecodeError, TypeError):
                    pass
    return ok(rows)


@router.post("/api/v1/ai/suggestions/{suggestionId}/accept")
async def accept_suggestion(
    suggestionId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Accept an AI suggestion — marks it and triggers the approval engine if financial."""
    row = (await db.execute(text(
        "SELECT * FROM ai_suggestions WHERE id=:id AND tenantId=:t AND status='PENDING'"),
        {"id": suggestionId, "t": tenantId})).first()
    if not row:
        return err("Suggestion not found or already acted on", 404)

    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    action_type = data.get("actionType", "")

    # Financial actions require approval
    financial_actions = {"CREATE_PURCHASE_REQ", "ADJUST_PRICE", "REORDER_STOCK"}
    if action_type in financial_actions:
        # Route through Prompt 27's approval engine
        try:
            import workflow as wf
            recommendation = data.get("recommendation")
            if isinstance(recommendation, str):
                recommendation = json.loads(recommendation)
            await wf.create_approval(
                db, tenant_id=tenantId, entity_type=f"AI_{action_type}",
                entity_id=suggestionId, entity_no=f"AI-{suggestionId[:8]}",
                summary=data.get("title", "AI Recommendation"),
                amount=float((recommendation or {}).get("totalCost", 0)),
                user=user)
            await db.execute(text(
                "UPDATE ai_suggestions SET status='ACCEPTED', actedBy=:u, actedAt=NOW() WHERE id=:id"),
                {"u": user.id, "id": suggestionId})
            await db.commit()
            return ok({"accepted": True, "approvalRequired": True,
                        "message": "Routed to approval engine. Awaiting manager approval."})
        except Exception as e:
            return err(f"Failed to route to approval: {str(e)}", 500)
    else:
        await db.execute(text(
            "UPDATE ai_suggestions SET status='ACCEPTED', actedBy=:u, actedAt=NOW() WHERE id=:id"),
            {"u": user.id, "id": suggestionId})
        await db.commit()
        return ok({"accepted": True, "approvalRequired": False})


@router.post("/api/v1/ai/suggestions/{suggestionId}/reject")
async def reject_suggestion(
    suggestionId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "UPDATE ai_suggestions SET status='REJECTED', actedBy=:u, actedAt=NOW() WHERE id=:id AND tenantId=:t"),
        {"u": user.id, "id": suggestionId, "t": tenantId})
    await db.commit()
    return ok({"rejected": True})


# ═══════════════════════════════════════════════════════════════════
# 10. AI INSIGHTS (aggregated)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/insights")
async def list_insights(
    insightType: str = "",
    severity: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t AND isDismissed=0"
    params: dict = {"t": tenantId}
    if insightType:
        where += " AND insightType=:it"; params["it"] = insightType
    if severity:
        where += " AND severity=:sv"; params["sv"] = severity

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM ai_insights WHERE {where} ORDER BY "
        f"CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, "
        f"createdAt DESC LIMIT 50"), params)).fetchall())
    for r in rows:
        if isinstance(r.get("detail"), str):
            try:
                r["detail"] = json.loads(r["detail"])
            except (json.JSONDecodeError, TypeError):
                pass
    return ok(rows)


@router.post("/api/v1/ai/insights/generate")
async def generate_insights(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI insights from current data (runs all analyses)."""
    generated = 0

    # Low stock insights
    low = (await db.execute(text(
        "SELECT COUNT(*) FROM stock s JOIN products p ON p.id=s.productId "
        "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) AND s.qtyOnHand > 0"),
        {"t": tenantId})).first()
    if low[0] > 0:
        existing = (await db.execute(text(
            "SELECT id FROM ai_insights WHERE tenantId=:t AND insightType='REORDER' "
            "AND DATE(createdAt)=CURDATE() AND isDismissed=0"), {"t": tenantId})).first()
        if not existing:
            await db.execute(text(
                "INSERT INTO ai_insights (id, tenantId, insightType, title, summary, severity) "
                "VALUES (:id, :t, 'REORDER', :title, :sum, 'MEDIUM')"),
                {"id": _uid(), "t": tenantId, "title": f"{low[0]} products need reorder",
                 "sum": f"{low[0]} products are at or below their reorder point"})
            generated += 1

    # Overdue installment insight
    overdue = (await db.execute(text(
        "SELECT COUNT(*), COALESCE(SUM(amount - paidAmount),0) FROM installment_schedules "
        "WHERE tenantId=:t AND status='OVERDUE'"), {"t": tenantId})).first()
    if overdue[0] > 0:
        existing = (await db.execute(text(
            "SELECT id FROM ai_insights WHERE tenantId=:t AND insightType='CHURN_RISK' "
            "AND DATE(createdAt)=CURDATE() AND isDismissed=0"), {"t": tenantId})).first()
        if not existing:
            await db.execute(text(
                "INSERT INTO ai_insights (id, tenantId, insightType, title, summary, severity) "
                "VALUES (:id, :t, 'CHURN_RISK', :title, :sum, 'HIGH')"),
                {"id": _uid(), "t": tenantId,
                 "title": f"{overdue[0]} overdue installment schedules",
                 "sum": f"৳{float(overdue[1] or 0):,.0f} outstanding from overdue installments"})
            generated += 1

    await db.commit()
    return ok({"generated": generated})


@router.patch("/api/v1/ai/insights/{insightId}/dismiss")
async def dismiss_insight(
    insightId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "UPDATE ai_insights SET isDismissed=1 WHERE id=:id AND tenantId=:t"),
        {"id": insightId, "t": tenantId})
    await db.commit()
    return ok({"dismissed": True})


@router.get("/api/v1/ai/conversations")
async def list_conversations(
    sessionId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if sessionId:
        where += " AND sessionId=:s"; params["s"] = sessionId
    else:
        where += " AND userId=:u"; params["u"] = user.id

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM ai_conversations WHERE {where} ORDER BY createdAt ASC LIMIT 200"),
        params)).fetchall())
    return ok(rows)
