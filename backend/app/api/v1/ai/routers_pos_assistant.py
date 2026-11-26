"""AI POS Assistant Router (F. AI POS Assistant).
- Smart Product Recommendation & Upselling
- Automatic Discount Suggestions
- Natural Language Checkout Assistance
- Barcode / Image Recognition Endpoint
"""
from __future__ import annotations

import re
from fastapi import APIRouter, Depends, Body
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# 1. SMART PRODUCT RECOMMENDATION & UPSELLING
# ═══════════════════════════════════════════════════════════════════

@router.post("/api/v1/ai/pos/smart-recommendations")
async def pos_smart_recommendations(
    body: dict = Body(...),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Recommends relevant impulse add-ons and frequently co-purchased items for current cart."""
    cart_pids = body.get("cartProductIds") or []
    limit = min(int(body.get("limit") or 4), 8)

    recommendations = []

    # 1. If cart has products, find co-occurring items in historical orders
    if cart_pids:
        pid_list_str = ",".join([f"'{pid}'" for pid in cart_pids if isinstance(pid, str)])
        if pid_list_str:
            co_bought = rows_to_dicts((await db.execute(text(
                f"SELECT si2.productId, p.name, p.sku, p.sellingPrice, s.qtyOnHand, COUNT(*) AS pairFreq "
                f"FROM sale_items si1 "
                f"JOIN sale_items si2 ON si2.saleId=si1.saleId AND si2.productId != si1.productId "
                f"JOIN products p ON p.id=si2.productId "
                f"JOIN stock s ON s.productId=p.id "
                f"WHERE si1.productId IN ({pid_list_str}) AND s.qtyOnHand > 0 "
                f"GROUP BY si2.productId, p.name, p.sku, p.sellingPrice, s.qtyOnHand "
                f"ORDER BY pairFreq DESC LIMIT :lim"), {"lim": limit})).fetchall())

            for r in co_bought:
                recommendations.append({
                    "productId": r.get("productId"),
                    "productName": r.get("name"),
                    "sku": r.get("sku"),
                    "sellingPrice": float(r.get("sellingPrice") or 0),
                    "stock": float(r.get("qtyOnHand") or 0),
                    "upsellType": "FREQUENTLY_BOUGHT_TOGETHER",
                    "upsellMessage": f"Customers buying items in this cart frequently add {r.get('name')}.",
                })

    # 2. Fallback: impulse checkout items with high margin & positive stock
    if len(recommendations) < limit:
        needed = limit - len(recommendations)
        existing_ids = [r["productId"] for r in recommendations] + list(cart_pids)
        existing_str = ",".join([f"'{pid}'" for pid in existing_ids if isinstance(pid, str)])
        where_not = f"AND p.id NOT IN ({existing_str})" if existing_str else ""

        impulse_items = rows_to_dicts((await db.execute(text(
            f"SELECT p.id, p.name, p.sku, p.sellingPrice, s.qtyOnHand "
            f"FROM products p "
            f"JOIN stock s ON s.productId=p.id "
            f"WHERE p.tenantId=:t AND s.qtyOnHand > 5 {where_not} "
            f"ORDER BY p.sellingPrice ASC LIMIT :lim"), {"t": tenantId, "lim": needed})).fetchall())

        for r in impulse_items:
            recommendations.append({
                "productId": r.get("id"),
                "productName": r.get("name"),
                "sku": r.get("sku"),
                "sellingPrice": float(r.get("sellingPrice") or 0),
                "stock": float(r.get("qtyOnHand") or 0),
                "upsellType": "POPULAR_ADDON",
                "upsellMessage": f"Popular quick checkout add-on (৳{float(r.get('sellingPrice') or 0):,.0f}).",
            })

    return ok({"recommendations": recommendations, "count": len(recommendations)})


# ═══════════════════════════════════════════════════════════════════
# 2. AUTOMATIC DISCOUNT SUGGESTIONS
# ═══════════════════════════════════════════════════════════════════

@router.post("/api/v1/ai/pos/discount-suggestion")
async def pos_discount_suggestion(
    body: dict = Body(...),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
):
    """Calculates optimal volume discount or promotional offer based on cart size and customer tier."""
    subtotal = float(body.get("subtotal") or 0)
    item_count = int(body.get("itemCount") or 0)
    customer_id = body.get("customerId")

    suggestions = []

    # 1. Tier / Threshold discount
    if subtotal >= 5000:
        suggestions.append({
            "type": "VOLUME_DISCOUNT",
            "title": "🎉 High Volume Order Discount (7%)",
            "discountPct": 7,
            "savings": round(subtotal * 0.07, 2),
            "reason": "Cart subtotal exceeds ৳5,000 threshold.",
        })
    elif subtotal >= 2000:
        suggestions.append({
            "type": "VOLUME_DISCOUNT",
            "title": "✨ Smart Cart Discount (5%)",
            "discountPct": 5,
            "savings": round(subtotal * 0.05, 2),
            "reason": "Cart subtotal exceeds ৳2,000 threshold.",
        })
    elif subtotal > 1500:
        diff = 2000 - subtotal
        suggestions.append({
            "type": "UPSELL_TARGET",
            "title": f"💡 Add ৳{diff:,.0f} more to unlock 5% discount",
            "discountPct": 0,
            "savings": 0,
            "reason": f"Customer is only ৳{diff:,.0f} away from qualifying for 5% bill discount.",
        })

    # 2. Multi-item quantity bonus
    if item_count >= 5:
        suggestions.append({
            "type": "MULTI_ITEM_DISCOUNT",
            "title": "🛍️ Multi-Item Bundle Promo (Flat ৳100 Off)",
            "discountFlat": 100,
            "savings": 100.0,
            "reason": f"Cart contains {item_count} items (eligible for bundle saver).",
        })

    # 3. Customer loyalty tier bonus if registered customer
    if customer_id:
        suggestions.append({
            "type": "LOYALTY_TIER",
            "title": "⭐ Registered Customer Bonus (3%)",
            "discountPct": 3,
            "savings": round(subtotal * 0.03, 2),
            "reason": "Customer membership reward points applied.",
        })

    return ok({
        "subtotal": subtotal,
        "itemCount": item_count,
        "suggestions": suggestions,
        "bestSavings": max([s.get("savings", 0) for s in suggestions], default=0),
    })


# ═══════════════════════════════════════════════════════════════════
# 3. NATURAL LANGUAGE CHECKOUT ASSISTANCE
# ═══════════════════════════════════════════════════════════════════

@router.post("/api/v1/ai/pos/nl-checkout")
async def pos_natural_language_checkout(
    body: dict = Body(...),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Interprets voice / text cashier command into structured POS actions."""
    command = str(body.get("command") or "").strip().lower()

    if not command:
        return err("Empty POS command", 400)

    # 1. Add Product command (e.g. "add 2 cold drinks", "যোগ করো ২ টি কোক", "add 5 paracetamol")
    add_match = re.search(r"(?:add|put|insert|যোগ\s*করো|দাও)\s*(\d+)?\s*(?:ta|ti|টি|টা)?\s*(.+)", command)
    if add_match:
        qty = int(add_match.group(1)) if add_match.group(1) else 1
        query = add_match.group(2).strip()

        # Find closest product
        prod = (await db.execute(text(
            "SELECT id, name, sku, barcode, sellingPrice FROM products "
            "WHERE tenantId=:t AND (name LIKE :q OR barcode LIKE :q OR sku LIKE :q) LIMIT 1"),
            {"t": tenantId, "q": f"%{query}%"})).first()

        if prod:
            return ok({
                "action": "ADD_ITEM",
                "product": {
                    "id": prod[0],
                    "name": prod[1],
                    "sku": prod[2],
                    "barcode": prod[3],
                    "sellingPrice": float(prod[4] or 0),
                },
                "quantity": qty,
                "message": f"Added {qty}x {prod[1]} to cart.",
            })
        else:
            return ok({
                "action": "SEARCH_PRODUCT",
                "searchQuery": query,
                "quantity": qty,
                "message": f"Searching catalog for '{query}'...",
            })

    # 2. Discount command (e.g. "discount 10%", "give 5% discount", "১০% ডিসকাউন্ট")
    disc_match = re.search(r"(\d+(?:\.\d+)?)\s*%\s*(?:discount|off|ডিসকাউন্ট)?", command)
    if disc_match:
        pct = float(disc_match.group(1))
        return ok({
            "action": "APPLY_DISCOUNT",
            "discountPct": pct,
            "message": f"Applying {pct}% discount to current transaction.",
        })

    # 3. Payment command (e.g. "cash payment 500", "ক্যাশ ৫০০ টাকা", "bkash 1200", "card 2500")
    if "cash" in command or "ক্যাশ" in command:
        amt_match = re.search(r"(\d+(?:\.\d+)?)", command)
        amt = float(amt_match.group(1)) if amt_match else 0
        return ok({
            "action": "SET_PAYMENT",
            "method": "CASH",
            "amount": amt,
            "message": f"Setting Cash payment of ৳{amt:,.2f}.",
        })
    elif "bkash" in command or "বিকাশ" in command or "nagad" in command or "নগদ" in command:
        amt_match = re.search(r"(\d+(?:\.\d+)?)", command)
        amt = float(amt_match.group(1)) if amt_match else 0
        return ok({
            "action": "SET_PAYMENT",
            "method": "MFS_DIGITAL",
            "amount": amt,
            "message": f"Setting Digital MFS payment of ৳{amt:,.2f}.",
        })
    elif "card" in command or "কার্ড" in command:
        amt_match = re.search(r"(\d+(?:\.\d+)?)", command)
        amt = float(amt_match.group(1)) if amt_match else 0
        return ok({
            "action": "SET_PAYMENT",
            "method": "CARD",
            "amount": amt,
            "message": f"Setting Card payment of ৳{amt:,.2f}.",
        })

    # 4. Hold sale command (e.g. "hold this sale", "হোল্ড করো")
    if "hold" in command or "হোল্ড" in command or "park" in command:
        return ok({
            "action": "HOLD_SALE",
            "message": "Parking / Holding current transaction for next customer.",
        })

    # 5. Clear / Reset cart (e.g. "clear cart", "মুছে ফেলো")
    if "clear" in command or "মুছে" in command or "reset" in command:
        return ok({
            "action": "CLEAR_CART",
            "message": "Clearing all items from cart.",
        })

    # 6. Complete / Checkout bill (e.g. "checkout", "বিল করো", "complete sale")
    if "checkout" in command or "complete" in command or "বিল" in command or "pay" in command:
        return ok({
            "action": "PROCEED_CHECKOUT",
            "message": "Opening payment modal for final bill settlement.",
        })

    return ok({
        "action": "UNKNOWN",
        "rawCommand": command,
        "message": f"Received command '{command}'. You can say 'Add 2 [Product]', '10% discount', 'Cash 500', or 'Hold sale'.",
    })


# ═══════════════════════════════════════════════════════════════════
# 4. PRODUCT RECOGNITION (Barcode & Camera Image Lookups)
# ═══════════════════════════════════════════════════════════════════

@router.post("/api/v1/ai/pos/recognize-product")
async def pos_recognize_product(
    body: dict = Body(...),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Instant lookup for scanned camera barcode or visual identifier."""
    code = str(body.get("code") or body.get("barcode") or "").strip()

    if not code:
        return err("No barcode or code provided", 400)

    prod = (await db.execute(text(
        "SELECT p.id, p.name, p.sku, p.barcode, p.sellingPrice, s.qtyOnHand "
        "FROM products p "
        "LEFT JOIN stock s ON s.productId=p.id "
        "WHERE p.tenantId=:t AND (p.barcode=:c OR p.sku=:c OR p.id=:c) LIMIT 1"),
        {"t": tenantId, "c": code})).first()

    if not prod:
        return err(f"No product recognized for code '{code}'", 404)

    return ok({
        "recognized": True,
        "product": {
            "id": prod[0],
            "name": prod[1],
            "sku": prod[2],
            "barcode": prod[3],
            "sellingPrice": float(prod[4] or 0),
            "stock": float(prod[5] or 0),
        },
    })
