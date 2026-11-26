"""AI Sales Intelligence Router (C. AI Sales Intelligence).
- Sales Target Prediction
- Branch Performance Analysis
- Discount Recommendation
- Customer Buying Pattern
"""
from __future__ import annotations

import calendar
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()


@router.get("/api/v1/ai/sales/targets")
async def sales_target_prediction(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Predicts month-end revenue and calculates target achievement feasibility."""
    now = datetime.now()
    _, total_days_in_month = calendar.monthrange(now.year, now.month)
    current_day = max(now.day, 1)
    days_remaining = max(total_days_in_month - current_day, 0)

    # 1. Current month confirmed revenue & orders
    current_month_row = (await db.execute(text(
        "SELECT COALESCE(SUM(total), 0) AS rev, COUNT(*) AS orders "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')"), {"t": tenantId})).first()
    current_rev = float(current_month_row[0] or 0)
    current_orders = int(current_month_row[1] or 0)

    # 2. Last month revenue for baseline
    last_month_row = (await db.execute(text(
        "SELECT COALESCE(SUM(total), 0) AS rev "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND createdAt >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') "
        "AND createdAt < DATE_FORMAT(NOW(), '%Y-%m-01')"), {"t": tenantId})).first()
    last_month_rev = float(last_month_row[0] or 0)

    # Set dynamic sales target: 110% of last month or a realistic minimum
    target_rev = round(last_month_rev * 1.10 if last_month_rev > 0 else (current_rev * 1.5 or 100000), 2)

    # 3. Daily run rates
    daily_current_runrate = current_rev / current_day
    projected_revenue = round(daily_current_runrate * total_days_in_month, 2)
    gap = max(target_rev - current_rev, 0)
    daily_required_runrate = round(gap / max(days_remaining, 1), 2) if days_remaining > 0 else 0

    # 4. Feasibility assessment
    if target_rev == 0:
        achievement_prob = "HIGH"
        status = "ON_TRACK"
    else:
        projected_ratio = (projected_revenue / target_rev) * 100
        if projected_ratio >= 100:
            achievement_prob = "VERY_HIGH"
            status = "EXCEEDING_TARGET"
        elif projected_ratio >= 85:
            achievement_prob = "HIGH"
            status = "ON_TRACK"
        elif projected_ratio >= 65:
            achievement_prob = "MODERATE"
            status = "NEEDS_BOOST"
        else:
            achievement_prob = "LOW"
            status = "AT_RISK"

    return ok({
        "currentRevenue": current_rev,
        "currentOrders": current_orders,
        "targetRevenue": target_rev,
        "projectedRevenue": projected_revenue,
        "dailyCurrentRunRate": round(daily_current_runrate, 2),
        "dailyRequiredRunRate": daily_required_runrate,
        "daysRemaining": days_remaining,
        "totalDaysInMonth": total_days_in_month,
        "currentDay": current_day,
        "achievementProbability": achievement_prob,
        "status": status,
        "recommendation": (
            "Target is well on track! Maintain current stock availability."
            if status in ["EXCEEDING_TARGET", "ON_TRACK"]
            else f"Boost promotion and top-selling replenishment to bridge ৳{gap:,.0f} gap with ৳{daily_required_runrate:,.0f}/day."
        ),
    })


@router.get("/api/v1/ai/sales/branches")
async def branch_performance_analysis(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Compares branch performance metrics with AI operational insights."""
    branches = rows_to_dicts((await db.execute(text(
        "SELECT b.id, b.name, b.code, "
        "COALESCE(SUM(CASE WHEN s.status='CONFIRMED' THEN s.total ELSE 0 END), 0) AS revenue, "
        "COUNT(CASE WHEN s.status='CONFIRMED' THEN s.id ELSE NULL END) AS orderCount, "
        "COALESCE(AVG(CASE WHEN s.status='CONFIRMED' THEN s.total ELSE NULL END), 0) AS aov, "
        "COUNT(CASE WHEN s.status='REFUNDED' THEN s.id ELSE NULL END) AS refundCount "
        "FROM branches b "
        "LEFT JOIN sales s ON s.branchId=b.id AND s.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01') "
        "WHERE b.tenantId=:t AND b.status='ACTIVE' "
        "GROUP BY b.id, b.name, b.code "
        "ORDER BY revenue DESC"), {"t": tenantId})).fetchall())

    total_revenue = sum(float(b.get("revenue") or 0) for b in branches)
    insights = []

    if branches:
        top_branch = branches[0]
        insights.append(f"Top performing branch: {top_branch['name']} generating ৳{float(top_branch['revenue']):,.0f} this month.")
        if len(branches) > 1 and float(branches[-1].get("revenue") or 0) < (float(top_branch['revenue']) * 0.3):
            insights.append(f"Lagging outlet: {branches[-1]['name']} requires stock replenishment or local promotional campaigns.")

    return ok({
        "branches": [
            {
                **b,
                "revenue": round(float(b.get("revenue") or 0), 2),
                "aov": round(float(b.get("aov") or 0), 2),
                "orderCount": int(b.get("orderCount") or 0),
                "revenueShare": round((float(b.get("revenue") or 0) / total_revenue * 100), 1) if total_revenue > 0 else 0,
            }
            for b in branches
        ],
        "totalRevenue": round(total_revenue, 2),
        "insights": insights,
    })


@router.get("/api/v1/ai/sales/discount-recommendations")
async def discount_recommendations(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Recommends optimal inventory clearance discounts preserving gross margin."""
    # Find products with high stock but low sales in last 30 days
    rows = rows_to_dicts((await db.execute(text(
        "SELECT p.id, p.name, p.sku, p.costPrice, p.sellingPrice, s.qtyOnHand, "
        "COALESCE(sales_sub.soldQty, 0) AS recentSold "
        "FROM stock s "
        "JOIN products p ON p.id=s.productId "
        "LEFT JOIN ("
        "  SELECT si.productId, SUM(si.qty) AS soldQty "
        "  FROM sale_items si JOIN sales s2 ON s2.id=si.saleId "
        "  WHERE s2.tenantId=:t AND s2.status='CONFIRMED' AND s2.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) "
        "  GROUP BY si.productId"
        ") sales_sub ON sales_sub.productId=p.id "
        "WHERE s.tenantId=:t AND s.qtyOnHand > 5 "
        "ORDER BY recentSold ASC, s.qtyOnHand DESC LIMIT 15"), {"t": tenantId})).fetchall())

    recommendations = []
    for r in rows:
        cost = float(r.get("costPrice") or 0)
        price = float(r.get("sellingPrice") or (cost * 1.3))
        qty = float(r.get("qtyOnHand") or 0)
        recent = float(r.get("recentSold") or 0)

        # Max safe discount to stay above cost price + 5%
        max_discount_pct = max(round(((price - (cost * 1.05)) / price * 100)), 5) if price > cost else 5
        recommended_discount = min(max(max_discount_pct, 5), 25)

        new_price = round(price * (1 - (recommended_discount / 100)), 2)
        unlocked_cash = round(new_price * qty, 2)

        recommendations.append({
            "productId": r.get("id"),
            "productName": r.get("name"),
            "sku": r.get("sku"),
            "qtyOnHand": qty,
            "costPrice": cost,
            "originalPrice": price,
            "recommendedDiscountPct": recommended_discount,
            "discountedPrice": new_price,
            "potentialLiquidationValue": unlocked_cash,
            "reason": (
                f"Slow velocity ({recent:.0f} sold in 30d). "
                f"A {recommended_discount}% discount clears {qty:.0f} units while preserving positive gross margin."
            ),
        })

    return ok({"recommendations": recommendations, "totalCount": len(recommendations)})


@router.get("/api/v1/ai/sales/buying-patterns")
async def customer_buying_patterns(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Analyzes customer buying habits: hourly peak, peak day, and basket behavior."""
    # 1. Hourly distribution
    hourly_rows = (await db.execute(text(
        "SELECT HOUR(createdAt) AS hr, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS rev "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND createdAt >= DATE_SUB(NOW(), INTERVAL 60 DAY) "
        "GROUP BY HOUR(createdAt) ORDER BY hr"), {"t": tenantId})).fetchall()
    hourly = [{"hour": int(r[0]), "orders": int(r[1]), "revenue": round(float(r[2]), 2)} for r in hourly_rows]

    # 2. Day of week distribution (1=Sunday, 7=Saturday in MySQL DAYOFWEEK)
    day_rows = (await db.execute(text(
        "SELECT DAYOFWEEK(createdAt) AS dow, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS rev "
        "FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
        "AND createdAt >= DATE_SUB(NOW(), INTERVAL 60 DAY) "
        "GROUP BY DAYOFWEEK(createdAt) ORDER BY dow"), {"t": tenantId})).fetchall()
    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    daily_pattern = [
        {"day": day_names[(int(r[0]) - 1) % 7], "orders": int(r[1]), "revenue": round(float(r[2]), 2)}
        for r in day_rows
    ]

    # 3. Average basket size (items per order)
    basket_row = (await db.execute(text(
        "SELECT COALESCE(AVG(item_count), 1), COALESCE(AVG(order_total), 0) FROM ("
        "  SELECT s.id, COUNT(si.id) AS item_count, s.total AS order_total "
        "  FROM sales s JOIN sale_items si ON si.saleId=s.id "
        "  WHERE s.tenantId=:t AND s.status='CONFIRMED' "
        "  AND s.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) "
        "  GROUP BY s.id, s.total"
        ") sub"), {"t": tenantId})).first()
    avg_items = round(float(basket_row[0] or 1), 1)
    avg_order_value = round(float(basket_row[1] or 0), 2)

    # Peak hour & peak day detection
    peak_hour = max(hourly, key=lambda x: x["revenue"])["hour"] if hourly else 18
    peak_day = max(daily_pattern, key=lambda x: x["revenue"])["day"] if daily_pattern else "Friday"

    return ok({
        "hourlyPattern": hourly,
        "dailyPattern": daily_pattern,
        "averageItemsPerBasket": avg_items,
        "averageOrderValue": avg_order_value,
        "peakHour": f"{peak_hour}:00 - {peak_hour+1}:00",
        "peakDay": peak_day,
        "summary": f"Peak shopping occurs on {peak_day} around {peak_hour}:00 with an average basket of {avg_items} items (৳{avg_order_value:,.0f}).",
    })
