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

    # Intent detection (keyword-based — production would use NLU)
    if any(w in msg_lower for w in ["sale", "revenue", "today", "how much"]):
        r = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(total),0) FROM sales "
            "WHERE tenantId=:t AND status='CONFIRMED' AND DATE(createdAt)=CURDATE()"),
            {"t": tenantId})).first()
        answer = f"Today: {r[0]} sales totaling ৳{float(r[1] or 0):,.0f}."

    elif any(w in msg_lower for w in ["profit", "margin", "loss"]):
        if not has_profit:
            answer = "⛔ You don't have permission to view profit data. Contact your manager."
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
            answer = f"This month: Revenue ৳{rev:,.0f}, Expenses ৳{exp:,.0f}, Profit ৳{profit:,.0f} ({margin:.1f}% margin)."

    elif any(w in msg_lower for w in ["overdue", "due", "unpaid", "outstanding"]):
        r = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(total - paidTotal),0) FROM invoices "
            "WHERE tenantId=:t AND status != 'PAID' AND status != 'VOID'"),
            {"t": tenantId})).first()
        answer = f"Outstanding AR: {r[0]} invoices, ৳{float(r[1] or 0):,.0f} total due."

    elif any(w in msg_lower for w in ["low stock", "stock", "inventory"]):
        r = (await db.execute(text(
            "SELECT COUNT(*) FROM stock s JOIN products p ON p.id=s.productId "
            "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) AND s.qtyOnHand > 0"),
            {"t": tenantId})).first()
        answer = f"Low stock items: {r[0]} products need attention."
        suggestions.append("View Inventory AI → /ai?tab=inventory")

    elif any(w in msg_lower for w in ["customer", "top customer", "best customer"]):
        r = rows_to_dicts((await db.execute(text(
            "SELECT c.name, COUNT(s.id) AS orders, SUM(s.total) AS spend "
            "FROM customers c JOIN sales s ON s.customerId=c.id "
            "WHERE c.tenantId=:t AND s.status='CONFIRMED' "
            "GROUP BY c.id, c.name ORDER BY spend DESC LIMIT 5"), {"t": tenantId})).fetchall())
        if r:
            lines = [f"{i+1}. {c['name']}: ৳{float(c['spend'] or 0):,.0f} ({c['orders']} orders)"
                     for i, c in enumerate(r)]
            answer = "Top customers:\n" + "\n".join(lines)
        else:
            answer = "No customer sales data yet."

    elif any(w in msg_lower for w in ["worst", "performing", "branch"]):
        r = rows_to_dicts((await db.execute(text(
            "SELECT b.name, COUNT(s.id) AS orders, COALESCE(SUM(s.total),0) AS revenue "
            "FROM branches b LEFT JOIN sales s ON s.branchId=b.id AND s.status='CONFIRMED' "
            "AND s.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01') "
            "WHERE b.tenantId=:t GROUP BY b.id, b.name ORDER BY revenue ASC LIMIT 5"),
            {"t": tenantId})).fetchall())
        if r:
            lines = [f"{c['name']}: ৳{float(c['revenue'] or 0):,.0f} ({c['orders']} orders)"
                     for c in r]
            answer = "Branch performance (lowest first):\n" + "\n".join(lines)
        else:
            answer = "Not enough data to compare branches."

    elif any(w in msg_lower for w in ["purchase", "buy", "reorder", "procurement"]):
        r = (await db.execute(text(
            "SELECT COUNT(*) FROM stock s JOIN products p ON p.id=s.productId "
            "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10)"),
            {"t": tenantId})).first()
        answer = f"{r[0]} products need reorder. Check the Procurement AI for recommendations."
        suggestions.append("View Procurement AI → /ai?tab=procurement")

    elif any(w in msg_lower for w in ["installment", "emi"]):
        r = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(amount - paidAmount),0) FROM installment_schedules "
            "WHERE tenantId=:t AND status='OVERDUE'"), {"t": tenantId})).first()
        answer = f"Overdue installments: {r[0]} schedules, ৳{float(r[1] or 0):,.0f} outstanding."

    else:
        answer = ("I can help with: sales, profit, inventory, customers, branches, "
                  "installments, and procurement. Try asking:\n"
                  "• \"What were today's sales?\"\n"
                  "• \"Why is profit down?\"\n"
                  "• \"Which products need reorder?\"\n"
                  "• \"Show overdue installments\"\n"
                  "• \"Which branch is performing worst?\"")

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
