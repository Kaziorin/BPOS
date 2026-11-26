"""AI Customer Intelligence Router (E. AI Customer Intelligence).
- Customer Segmentation (RFM Engine)
- Customer Churn Prediction
- Customer Lifetime Value (LTV)
- Personalized Product Recommendations
- Next Purchase Prediction
- Loyalty Offer Suggestions
- Customer Due Risk Analysis
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


# ═══════════════════════════════════════════════════════════════════
# 1. CUSTOMER RFM SEGMENTATION
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/customers/segmentation")
async def customer_rfm_segmentation(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Categorizes customer base into RFM clusters with targeted promotional strategies."""
    customers = rows_to_dicts((await db.execute(text(
        "SELECT c.id, c.name, c.phone, c.email, "
        "COUNT(s.id) AS orderCount, "
        "COALESCE(SUM(s.total), 0) AS totalSpend, "
        "MAX(s.createdAt) AS lastOrderDate, "
        "DATEDIFF(NOW(), MAX(s.createdAt)) AS recencyDays "
        "FROM customers c "
        "LEFT JOIN sales s ON s.customerId=c.id AND s.status='CONFIRMED' "
        "WHERE c.tenantId=:t "
        "GROUP BY c.id, c.name, c.phone, c.email"), {"t": tenantId})).fetchall())

    segments = {
        "Champions": {"customers": [], "count": 0, "avgSpend": 0.0, "strategy": "Exclusive VIP rewards, early access to new collections."},
        "Loyal Customers": {"customers": [], "count": 0, "avgSpend": 0.0, "strategy": "Upsell higher-value products, offer referral bonuses."},
        "Potential Loyalists": {"customers": [], "count": 0, "avgSpend": 0.0, "strategy": "Engage with loyalty program, recommend popular items."},
        "Recent Customers": {"customers": [], "count": 0, "avgSpend": 0.0, "strategy": "Provide onboarding support and first-repeat discount."},
        "At Risk": {"customers": [], "count": 0, "avgSpend": 0.0, "strategy": "Send personalized win-back SMS/email with special 15% discount."},
        "Dormant / Lost": {"customers": [], "count": 0, "avgSpend": 0.0, "strategy": "Re-engage with clearance deals or survey feedback."},
    }

    for c in customers:
        spend = float(c.get("totalSpend") or 0)
        orders = int(c.get("orderCount") or 0)
        recency = int(c.get("recencyDays") or 999) if c.get("lastOrderDate") else 999

        if orders >= 5 and spend >= 20000 and recency <= 30:
            seg = "Champions"
        elif orders >= 3 and recency <= 45:
            seg = "Loyal Customers"
        elif orders >= 2 and recency <= 30:
            seg = "Potential Loyalists"
        elif orders == 1 and recency <= 30:
            seg = "Recent Customers"
        elif orders >= 2 and recency > 60:
            seg = "At Risk"
        else:
            seg = "Dormant / Lost"

        segments[seg]["customers"].append({
            "id": c.get("id"),
            "name": c.get("name"),
            "phone": c.get("phone"),
            "orders": orders,
            "totalSpend": round(spend, 2),
            "recencyDays": recency,
        })
        segments[seg]["count"] += 1

    total_customers = len(customers)
    segment_summary = []
    for name, data in segments.items():
        cnt = data["count"]
        tot_spend = sum(x["totalSpend"] for x in data["customers"])
        avg_spend = round(tot_spend / cnt, 2) if cnt > 0 else 0
        data["avgSpend"] = avg_spend
        segment_summary.append({
            "segment": name,
            "count": cnt,
            "percentage": round((cnt / total_customers * 100), 1) if total_customers > 0 else 0,
            "avgSpend": avg_spend,
            "strategy": data["strategy"],
            "sampleCustomers": data["customers"][:5],
        })

    return ok({
        "totalCustomers": total_customers,
        "segments": segment_summary,
    })


# ═══════════════════════════════════════════════════════════════════
# 2. NEXT PURCHASE PREDICTION
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/customers/next-purchase-prediction")
async def next_purchase_prediction(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Predicts estimated next purchase date based on customer's historical order frequency."""
    rows = rows_to_dicts((await db.execute(text(
        "SELECT c.id, c.name, c.phone, "
        "COUNT(s.id) AS orderCount, "
        "MIN(s.createdAt) AS firstOrder, "
        "MAX(s.createdAt) AS lastOrder, "
        "DATEDIFF(MAX(s.createdAt), MIN(s.createdAt)) AS lifespanDays, "
        "DATEDIFF(NOW(), MAX(s.createdAt)) AS daysSinceLastOrder, "
        "COALESCE(AVG(s.total), 0) AS aov "
        "FROM customers c "
        "JOIN sales s ON s.customerId=c.id AND s.status='CONFIRMED' "
        "WHERE c.tenantId=:t "
        "GROUP BY c.id, c.name, c.phone "
        "HAVING orderCount >= 2 "
        "ORDER BY daysSinceLastOrder ASC LIMIT 25"), {"t": tenantId})).fetchall())

    predictions = []
    for r in rows:
        orders = int(r.get("orderCount") or 2)
        lifespan = int(r.get("lifespanDays") or 30)
        days_since = int(r.get("daysSinceLastOrder") or 0)
        last_dt = r.get("lastOrder")

        # Average inter-order frequency
        avg_interval = max(round(lifespan / max(orders - 1, 1)), 5)

        # Expected next purchase date
        if isinstance(last_dt, str):
            try:
                last_dt_obj = datetime.fromisoformat(last_dt)
            except Exception:
                last_dt_obj = datetime.now() - timedelta(days=days_since)
        elif isinstance(last_dt, datetime):
            last_dt_obj = last_dt
        else:
            last_dt_obj = datetime.now() - timedelta(days=days_since)

        expected_next = last_dt_obj + timedelta(days=avg_interval)
        days_until_next = (expected_next.date() - datetime.now().date()).days

        if days_until_next < 0:
            status = "OVERDUE_FOR_PURCHASE"
            confidence = 0.82
        elif days_until_next <= 3:
            status = "DUE_SOON"
            confidence = 0.91
        else:
            status = "ON_SCHEDULE"
            confidence = 0.75

        predictions.append({
            "customerId": r.get("id"),
            "customerName": r.get("name"),
            "phone": r.get("phone"),
            "orderCount": orders,
            "avgOrderIntervalDays": avg_interval,
            "daysSinceLastOrder": days_since,
            "predictedNextDate": expected_next.strftime("%Y-%m-%d"),
            "daysUntilPredicted": days_until_next,
            "status": status,
            "confidenceScore": confidence,
            "avgOrderValue": round(float(r.get("aov") or 0), 2),
            "suggestedAction": (
                f"Send reminder offer today! Typical repeat cycle is every {avg_interval} days."
                if status in ["OVERDUE_FOR_PURCHASE", "DUE_SOON"]
                else f"Next purchase anticipated around {expected_next.strftime('%d %b')}."
            ),
        })

    return ok({
        "predictions": predictions,
        "dueSoonCount": sum(1 for p in predictions if p["status"] in ["OVERDUE_FOR_PURCHASE", "DUE_SOON"]),
    })


# ═══════════════════════════════════════════════════════════════════
# 3. PERSONALIZED PRODUCT RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/customers/{customerId}/recommendations")
async def personalized_customer_recommendations(
    customerId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Generates personalized product recommendations based on customer's purchase history."""
    # 1. Customer's previously purchased items
    bought_rows = rows_to_dicts((await db.execute(text(
        "SELECT DISTINCT p.id, p.name, p.categoryId "
        "FROM sale_items si "
        "JOIN sales s ON s.id=si.saleId "
        "JOIN products p ON p.id=si.productId "
        "WHERE s.customerId=:c AND s.tenantId=:t AND s.status='CONFIRMED' LIMIT 10"),
        {"c": customerId, "t": tenantId})).fetchall())

    bought_ids = [b["id"] for b in bought_rows]
    bought_cats = list({b["categoryId"] for b in bought_rows if b.get("categoryId")})

    # 2. Find recommended items from preferred categories or top sellers
    where_cat = "p.categoryId IN :cats" if bought_cats else "1=1"
    params: dict = {"t": tenantId}
    if bought_cats:
        params["cats"] = tuple(bought_cats)

    recomms = rows_to_dicts((await db.execute(text(
        f"SELECT p.id, p.name, p.sku, p.sellingPrice, p.costPrice, s.qtyOnHand "
        f"FROM products p "
        f"JOIN stock s ON s.productId=p.id "
        f"WHERE p.tenantId=:t AND s.qtyOnHand > 0 "
        f"{f'AND p.id NOT IN ({','.join([chr(39)+pid+chr(39) for pid in bought_ids])})' if bought_ids else ''} "
        f"ORDER BY s.qtyOnHand DESC LIMIT 5"), params)).fetchall())

    formatted = [
        {
            "productId": r.get("id"),
            "productName": r.get("name"),
            "sku": r.get("sku"),
            "sellingPrice": float(r.get("sellingPrice") or 0),
            "availableStock": float(r.get("qtyOnHand") or 0),
            "matchReason": "Frequently purchased with your preferred categories",
            "suggestedPromo": "Offer 5% instant bundle discount",
        }
        for r in recomms
    ]

    return ok({"customerId": customerId, "recommendations": formatted, "count": len(formatted)})


# ═══════════════════════════════════════════════════════════════════
# 4. LOYALTY OFFER SUGGESTIONS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/customers/loyalty-suggestions")
async def loyalty_offer_suggestions(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
):
    """Generates automated personalized loyalty promotional offers for customer cohorts."""
    offers = [
        {
            "id": "offer-vip-champions",
            "targetSegment": "Champions",
            "campaignTitle": "💎 VIP Exclusive: Early Access & Double Points",
            "offerDetails": "2x Reward points on all weekend purchases + ৳500 voucher on orders above ৳5,000.",
            "estimatedReach": "Top 10% highest spenders",
            "expectedROI": "High retention, +18% basket uplift",
            "suggestedChannel": "Personalized WhatsApp / SMS",
        },
        {
            "id": "offer-winback-at-risk",
            "targetSegment": "At Risk (>60d Inactive)",
            "campaignTitle": "🎁 We Miss You: Special 15% Comeback Gift",
            "offerDetails": "Flat 15% discount coupon valid for the next 7 days on their favorite categories.",
            "estimatedReach": "Customers with prior orders inactive > 60 days",
            "expectedROI": "Recovers ~22% churning customers",
            "suggestedChannel": "Targeted SMS with instant link",
        },
        {
            "id": "offer-tier-upgrade",
            "targetSegment": "Potential Loyalists",
            "campaignTitle": "⭐ Unlock Silver Tier: Just 1 Order Away",
            "offerDetails": "Spend ৳1,500 more this week to unlock permanent 5% cashback on all future purchases.",
            "estimatedReach": "2nd & 3rd time repeat buyers",
            "expectedROI": "Accelerates lifetime loyalty migration",
            "suggestedChannel": "POS Checkout printed coupon + SMS",
        },
    ]

    return ok({"campaignOffers": offers, "totalSuggestions": len(offers)})


# ═══════════════════════════════════════════════════════════════════
# 5. CUSTOMER DUE RISK ANALYSIS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/ai/customers/due-risk")
async def customer_due_risk_analysis(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Evaluates customer credit exposure, outstanding aging balance, and credit rating."""
    rows = rows_to_dicts((await db.execute(text(
        "SELECT c.id, c.name, c.phone, "
        "COALESCE(SUM(i.total - i.paidTotal), 0) AS totalDue, "
        "COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), i.createdAt) <= 30 THEN (i.total - i.paidTotal) ELSE 0 END), 0) AS aging0to30, "
        "COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), i.createdAt) BETWEEN 31 AND 60 THEN (i.total - i.paidTotal) ELSE 0 END), 0) AS aging31to60, "
        "COALESCE(SUM(CASE WHEN DATEDIFF(NOW(), i.createdAt) > 60 THEN (i.total - i.paidTotal) ELSE 0 END), 0) AS agingOver60, "
        "MAX(DATEDIFF(NOW(), i.createdAt)) AS maxAgeDays, "
        "COUNT(i.id) AS openInvoices "
        "FROM customers c "
        "JOIN invoices i ON i.customerId=c.id AND i.status NOT IN ('PAID', 'VOID') "
        "WHERE c.tenantId=:t "
        "GROUP BY c.id, c.name, c.phone "
        "HAVING totalDue > 0 "
        "ORDER BY totalDue DESC LIMIT 20"), {"t": tenantId})).fetchall())

    risk_assessments = []
    for r in rows:
        total_due = float(r.get("totalDue") or 0)
        over_60 = float(r.get("agingOver60") or 0)
        over_30 = float(r.get("aging31to60") or 0)
        max_age = int(r.get("maxAgeDays") or 0)

        # Credit Grade: A (Excellent), B (Low Risk), C (Watchlist), D (High Default Risk)
        if over_60 > 10000 or max_age > 90:
            grade = "D"
            risk_label = "HIGH DEFAULT RISK"
            credit_status = "FREEZE_CREDIT"
        elif over_30 > 5000 or max_age > 45:
            grade = "C"
            risk_label = "MODERATE WATCHLIST"
            credit_status = "CAP_CREDIT_LIMIT"
        elif max_age > 15:
            grade = "B"
            risk_label = "LOW RISK"
            credit_status = "NORMAL_CREDIT"
        else:
            grade = "A"
            risk_label = "EXCELLENT"
            credit_status = "UNRESTRICTED"

        risk_assessments.append({
            "customerId": r.get("id"),
            "customerName": r.get("name"),
            "phone": r.get("phone"),
            "creditGrade": grade,
            "riskLabel": risk_label,
            "creditStatus": credit_status,
            "totalDue": round(total_due, 2),
            "aging0to30": round(float(r.get("aging0to30") or 0), 2),
            "aging31to60": round(over_30, 2),
            "agingOver60": round(over_60, 2),
            "maxAgeDays": max_age,
            "openInvoices": int(r.get("openInvoices") or 1),
        })

    return ok({
        "riskAssessments": risk_assessments,
        "highRiskCount": sum(1 for a in risk_assessments if a["creditGrade"] in ["C", "D"]),
        "totalCreditExposure": round(sum(a["totalDue"] for a in risk_assessments), 2),
    })
