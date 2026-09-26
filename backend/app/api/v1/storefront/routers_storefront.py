"""Storefront Public API Router for E-Commerce Application.

Provides public storefront access for online customers:
- Store info & Configuration
- Product catalog, search & filtering
- Categories & Brands
- Cart checkout & Stock reservation
- Order tracking
- Customer authentication & Order history
"""
from __future__ import annotations

import json
import uuid
import time
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Header, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import resolve_tenant, sign_token, hash_password, verify_password, JWT_SECRET
from util import ok, err, rows_to_dicts, paginate_params, gen_no, ApiJSONResponse
import jwt

router = APIRouter(prefix="/api/v1/storefront", tags=["Storefront"])


def _uid() -> str:
    return str(uuid.uuid4())


# ─────────────────────────────────────────────────────────────────────────────
# 1. STORE CONFIG & META
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/config")
async def get_store_config(
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Returns store metadata, business type, branding, contact info."""
    tenant = (await db.execute(
        text("SELECT id, name, slug, businessType, address, phone, email, currency FROM tenants WHERE id=:t"),
        {"t": tenantId}
    )).first()

    if not tenant:
        return err("Store not found", 404)

    t_dict = dict(tenant._mapping) if hasattr(tenant, "_mapping") else {
        "id": tenant[0], "name": tenant[1], "slug": tenant[2],
        "businessType": tenant[3] if len(tenant) > 3 else "RETAIL",
        "address": tenant[4] if len(tenant) > 4 else "",
        "phone": tenant[5] if len(tenant) > 5 else "",
        "email": tenant[6] if len(tenant) > 6 else "",
        "currency": tenant[7] if len(tenant) > 7 else "BDT"
    }

    # Fetch tenant settings if any
    settings_rows = rows_to_dicts(
        (await db.execute(text("SELECT settingKey, value FROM tenant_settings WHERE tenantId=:t"), {"t": tenantId})).fetchall()
    )
    store_settings = {r["settingKey"]: r["value"] for r in settings_rows}

    # Fetch active categories count
    cat_count = (await db.execute(
        text("SELECT COUNT(*) FROM categories WHERE tenantId=:t"), {"t": tenantId}
    )).scalar() or 0

    # Fetch active products count
    prod_count = (await db.execute(
        text("SELECT COUNT(*) FROM products WHERE tenantId=:t AND status='ACTIVE'"), {"t": tenantId}
    )).scalar() or 0

    return ok({
        "tenant": t_dict,
        "businessType": t_dict.get("businessType") or "RETAIL",
        "settings": store_settings,
        "totalCategories": cat_count,
        "totalProducts": prod_count,
        "supportedPaymentMethods": ["COD", "BKASH", "NAGAD", "CARD", "BANK_TRANSFER"],
        "deliveryMethods": [
            {"id": "STANDARD", "name": "Standard Home Delivery", "cost": 60, "eta": "2-3 Days"},
            {"id": "EXPRESS", "name": "Express Same-Day Delivery", "cost": 120, "eta": "Inside Dhaka (24 Hours)"},
            {"id": "STORE_PICKUP", "name": "Store Pickup (Click & Collect)", "cost": 0, "eta": "Ready in 2 Hours"}
        ]
    })


# ─────────────────────────────────────────────────────────────────────────────
# 2. CATEGORIES & BRANDS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/categories")
async def list_storefront_categories(
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Returns categories tree with product count."""
    rows = rows_to_dicts(
        (await db.execute(
            text(
                "SELECT c.id, c.name, c.code, c.description, c.parentId, c.status, "
                "COUNT(p.id) AS productCount "
                "FROM categories c "
                "LEFT JOIN products p ON p.categoryId = c.id AND p.status='ACTIVE' "
                "WHERE c.tenantId = :t "
                "GROUP BY c.id, c.name, c.code, c.description, c.parentId, c.status "
                "ORDER BY c.name ASC"
            ),
            {"t": tenantId}
        )).fetchall()
    )

    # Build tree
    parents = [r for r in rows if not r.get("parentId")]
    child_map: dict[str, list] = {}
    for r in rows:
        pid = r.get("parentId")
        if pid:
            child_map.setdefault(pid, []).append(r)

    for p in parents:
        p["subCategories"] = child_map.get(p["id"], [])

    return ok(parents)


@router.get("/brands")
async def list_storefront_brands(
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts(
        (await db.execute(
            text(
                "SELECT b.id, b.name, b.code, b.description, COUNT(p.id) AS productCount "
                "FROM brands b "
                "LEFT JOIN products p ON p.brandId = b.id AND p.status='ACTIVE' "
                "WHERE b.tenantId = :t "
                "GROUP BY b.id, b.name, b.code, b.description "
                "ORDER BY b.name ASC"
            ),
            {"t": tenantId}
        )).fetchall()
    )
    return ok(rows)


# ─────────────────────────────────────────────────────────────────────────────
# 3. PRODUCTS LIST & DETAILS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/products")
async def list_storefront_products(
    search: str = "",
    categoryId: str = "",
    subCategoryId: str = "",
    brandId: str = "",
    businessType: str = "",
    minPrice: float = 0,
    maxPrice: float = 0,
    inStock: bool = False,
    sort: str = "newest",  # newest, price_asc, price_desc, name_asc
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Public customer-facing product search and listing."""
    where = "p.tenantId = :t AND p.status = 'ACTIVE'"
    params: dict = {"t": tenantId}

    if search:
        where += " AND (p.name LIKE :s OR p.sku LIKE :s OR p.description LIKE :s OR p.attributes LIKE :s)"
        params["s"] = f"%{search}%"

    if categoryId:
        where += " AND (p.categoryId = :cat OR p.subCategoryId = :cat)"
        params["cat"] = categoryId

    if subCategoryId:
        where += " AND p.subCategoryId = :subcat"
        params["subcat"] = subCategoryId

    if brandId:
        where += " AND p.brandId = :brand"
        params["brand"] = brandId

    if businessType:
        where += " AND (p.productType = :bt OR LOWER(p.name) LIKE :bt_s)"
        params["bt"] = businessType
        params["bt_s"] = f"%{businessType.lower()}%"

    if minPrice > 0:
        where += " AND p.sellingPrice >= :minp"
        params["minp"] = minPrice

    if maxPrice > 0:
        where += " AND p.sellingPrice <= :maxp"
        params["maxp"] = maxPrice

    # Sorting
    order_by = "p.createdAt DESC"
    if sort == "price_asc":
        order_by = "p.sellingPrice ASC"
    elif sort == "price_desc":
        order_by = "p.sellingPrice DESC"
    elif sort == "name_asc":
        order_by = "p.name ASC"

    # Total count
    count_sql = f"SELECT COUNT(*) FROM products p WHERE {where}"
    total_items = (await db.execute(text(count_sql), params)).scalar() or 0

    off, lim = paginate_params(page, limit)
    sql = text(
        f"SELECT p.id, p.name, p.sku, p.barcode, p.productType, p.sellingPrice, "
        f"p.wholesalePrice, p.imageUrl, p.manufacturer, p.description, p.attributes, p.warrantyDays, p.createdAt, "
        f"c.name AS categoryName, c.id AS categoryId, "
        f"subc.id AS subCategoryId, subc.name AS subCategoryName, "
        f"b.id AS brandId, b.name AS brandName, u.name AS unitName, "
        f"COALESCE((SELECT SUM(qtyOnHand - qtyReserved) FROM stock WHERE productId = p.id AND tenantId = p.tenantId), 0) AS totalStock "
        f"FROM products p "
        f"LEFT JOIN categories c ON c.id = p.categoryId "
        f"LEFT JOIN categories subc ON subc.id = p.subCategoryId "
        f"LEFT JOIN brands b ON b.id = p.brandId "
        f"LEFT JOIN units u ON u.id = p.unitId "
        f"WHERE {where} "
        f"ORDER BY {order_by} LIMIT :lim OFFSET :off"
    )

    rows = rows_to_dicts((await db.execute(sql, {**params, "lim": lim, "off": off})).fetchall())

    # Format attributes (parse JSON safely)
    for r in rows:
        if isinstance(r.get("attributes"), str):
            try:
                r["attributes"] = json.loads(r["attributes"])
            except Exception:
                pass
        stock = float(r.get("totalStock") or 0)
        r["inStock"] = stock > 0
        r["stockQuantity"] = stock

    return ok({
        "items": rows,
        "total": total_items,
        "page": page,
        "limit": limit,
        "totalPages": (total_items + limit - 1) // limit if limit else 1
    })


@router.get("/products/{productId}")
async def get_storefront_product(
    productId: str,
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get single product details with related items."""
    sql = text(
        "SELECT p.id, p.name, p.sku, p.barcode, p.productType, p.sellingPrice, "
        "p.wholesalePrice, p.imageUrl, p.manufacturer, p.description, p.attributes, p.taxRate, p.warrantyDays, p.createdAt, "
        "c.name AS categoryName, c.id AS categoryId, "
        "subc.id AS subCategoryId, subc.name AS subCategoryName, "
        "b.id AS brandId, b.name AS brandName, u.name AS unitName, "
        "COALESCE((SELECT SUM(qtyOnHand - qtyReserved) FROM stock WHERE productId = p.id AND tenantId = p.tenantId), 0) AS totalStock "
        "FROM products p "
        "LEFT JOIN categories c ON c.id = p.categoryId "
        "LEFT JOIN categories subc ON subc.id = p.subCategoryId "
        "LEFT JOIN brands b ON b.id = p.brandId "
        "LEFT JOIN units u ON u.id = p.unitId "
        "WHERE p.id = :pid AND p.tenantId = :t AND p.status = 'ACTIVE'"
    )
    row = (await db.execute(sql, {"pid": productId, "t": tenantId})).first()
    if not row:
        return err("Product not found or unavailable", 404)

    p_dict = dict(row._mapping) if hasattr(row, "_mapping") else dict(zip(
        ["id", "name", "sku", "barcode", "productType", "sellingPrice", "wholesalePrice", "imageUrl",
         "manufacturer", "description", "attributes", "taxRate", "warrantyDays", "createdAt",
         "categoryName", "categoryId", "subCategoryId", "subCategoryName", "brandId", "brandName", "unitName", "totalStock"],
        row
    ))

    if isinstance(p_dict.get("attributes"), str):
        try:
            p_dict["attributes"] = json.loads(p_dict["attributes"])
        except Exception:
            pass

    stock = float(p_dict.get("totalStock") or 0)
    p_dict["inStock"] = stock > 0
    p_dict["stockQuantity"] = stock

    # Fetch Related Products in same category
    related_rows = []
    if p_dict.get("categoryId"):
        related_rows = rows_to_dicts((await db.execute(
            text(
                "SELECT id, name, sku, sellingPrice, imageUrl, "
                "COALESCE((SELECT SUM(qtyOnHand - qtyReserved) FROM stock WHERE productId = p.id), 0) AS totalStock "
                "FROM products p WHERE categoryId = :cat AND id != :pid AND tenantId = :t AND status='ACTIVE' LIMIT 6"
            ),
            {"cat": p_dict["categoryId"], "pid": productId, "t": tenantId}
        )).fetchall())

    p_dict["relatedProducts"] = related_rows
    return ok(p_dict)


@router.get("/featured")
async def get_featured_showcase(
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Returns featured collections, trending items, and banner data."""
    # 1. New Arrivals
    new_arrivals = rows_to_dicts((await db.execute(
        text(
            "SELECT p.id, p.name, p.sku, p.sellingPrice, p.imageUrl, c.name AS categoryName, b.name AS brandName, "
            "COALESCE((SELECT SUM(qtyOnHand - qtyReserved) FROM stock WHERE productId = p.id), 0) AS totalStock "
            "FROM products p "
            "LEFT JOIN categories c ON c.id = p.categoryId "
            "LEFT JOIN brands b ON b.id = p.brandId "
            "WHERE p.tenantId = :t AND p.status='ACTIVE' ORDER BY p.createdAt DESC LIMIT 8"
        ),
        {"t": tenantId}
    )).fetchall())

    # 2. Trending / Top categories
    top_categories = rows_to_dicts((await db.execute(
        text(
            "SELECT c.id, c.name, c.code, COUNT(p.id) AS productCount "
            "FROM categories c "
            "JOIN products p ON p.categoryId = c.id AND p.status='ACTIVE' "
            "WHERE c.tenantId = :t "
            "GROUP BY c.id, c.name, c.code "
            "ORDER BY productCount DESC LIMIT 6"
        ),
        {"t": tenantId}
    )).fetchall())

    return ok({
        "newArrivals": new_arrivals,
        "topCategories": top_categories,
        "promotions": [
            {
                "id": "promo-1",
                "title": "Welcome to our Online Store",
                "subtitle": "Shop authentic products with instant delivery",
                "discountBadge": "10% OFF FIRST ORDER",
                "buttonText": "Shop Now",
                "buttonLink": "/products"
            }
        ]
    })


# ─────────────────────────────────────────────────────────────────────────────
# 4. STOREFRONT CHECKOUT & ORDER CREATION
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/checkout")
async def storefront_checkout(
    body: dict,
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Public customer checkout endpoint.

    Flow:
    1. Resolve or create customer by phone/email.
    2. Validate items and compute totals.
    3. Create sales_order with source='WEBSITE'.
    4. Insert sales_order_items.
    5. Reserve stock in default warehouse.
    6. Return order summary with trackable orderNo.
    """
    items = body.get("items", [])
    if not items:
        return err("Cart items are required", 400)

    customer_name = (body.get("customerName") or "").strip()
    customer_phone = (body.get("customerPhone") or "").strip()
    customer_email = (body.get("customerEmail") or "").strip()
    shipping_address = (body.get("shippingAddress") or "").strip()
    payment_method = (body.get("paymentMethod") or "COD").upper()
    notes = body.get("notes") or ""

    if not customer_phone and not customer_email:
        return err("Customer phone or email is required", 400)

    # 1. Customer resolution
    customer_id = None
    if customer_phone:
        existing = (await db.execute(
            text("SELECT id FROM customers WHERE tenantId=:t AND phone=:p LIMIT 1"),
            {"t": tenantId, "p": customer_phone}
        )).first()
        if existing:
            customer_id = existing[0]

    if not customer_id and customer_name:
        customer_id = _uid()
        email_val = customer_email or f"{customer_id[:8]}@ecommerce.local"
        await db.execute(
            text(
                "INSERT IGNORE INTO customers (id, tenantId, name, phone, email, address) "
                "VALUES (:id, :t, :n, :p, :e, :addr)"
            ),
            {"id": customer_id, "t": tenantId, "n": customer_name, "p": customer_phone, "e": email_val, "addr": shipping_address}
        )

    # 2. Get default branch & warehouse
    br = (await db.execute(text("SELECT id FROM branches WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
    branch_id = br[0] if br else None

    wh = (await db.execute(text("SELECT id FROM warehouses WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
    warehouse_id = wh[0] if wh else None

    # 3. Calculate totals & build line items
    subtotal = 0.0
    order_items = []

    for item in items:
        pid = item.get("productId")
        qty = float(item.get("qty", 1))
        # Fetch current verified selling price from DB
        p_row = (await db.execute(
            text("SELECT id, name, sellingPrice, taxRate FROM products WHERE id=:pid AND tenantId=:t"),
            {"pid": pid, "t": tenantId}
        )).first()

        if not p_row:
            return err(f"Product not found: {pid}", 400)

        price = float(p_row[2] or 0)
        line_total = qty * price
        subtotal += line_total
        order_items.append({
            "productId": pid,
            "productName": p_row[1],
            "qty": qty,
            "unitPrice": price,
            "lineTotal": line_total
        })

    shipping_cost = float(body.get("shippingCost", 60.0))
    discount = float(body.get("discountTotal", 0.0))
    tax = float(body.get("taxTotal", 0.0))
    grand_total = subtotal - discount + tax + shipping_cost

    # 4. Create sales_order
    order_id = _uid()
    order_no = gen_no("ECO")

    order_notes = f"Shipping: {shipping_address} | Payment: {payment_method}"
    if notes:
        order_notes += f" | Notes: {notes}"

    await db.execute(
        text(
            "INSERT INTO sales_orders (id, tenantId, branchId, warehouseId, customerId, orderNo, "
            "source, status, subtotal, discountTotal, taxTotal, total, note, createdBy) "
            "VALUES (:id, :t, :b, :w, :c, :o, 'WEBSITE', 'CONFIRMED', :sub, :disc, :tax, :tot, :n, 'STOREFRONT')"
        ),
        {
            "id": order_id, "t": tenantId, "b": branch_id, "w": warehouse_id,
            "c": customer_id, "o": order_no,
            "sub": subtotal, "disc": discount, "tax": tax, "tot": grand_total,
            "n": order_notes
        }
    )

    # 5. Insert Order Items & Reserve Stock
    for oi in order_items:
        await db.execute(
            text(
                "INSERT INTO sales_order_items (id, tenantId, salesOrderId, productId, qtyOrdered, unitPrice, lineTotal) "
                "VALUES (:id, :t, :o, :p, :q, :up, :lt)"
            ),
            {
                "id": _uid(), "t": tenantId, "o": order_id, "p": oi["productId"],
                "q": oi["qty"], "up": oi["unitPrice"], "lt": oi["lineTotal"]
            }
        )

        # Update reserved stock in stock table if warehouse exists
        if warehouse_id:
            await db.execute(
                text(
                    "UPDATE stock SET qtyReserved = qtyReserved + :q "
                    "WHERE productId = :p AND warehouseId = :w AND tenantId = :t"
                ),
                {"q": oi["qty"], "p": oi["productId"], "w": warehouse_id, "t": tenantId}
            )

    await db.commit()

    return ok({
        "orderId": order_id,
        "orderNo": order_no,
        "status": "CONFIRMED",
        "subtotal": subtotal,
        "shippingCost": shipping_cost,
        "grandTotal": grand_total,
        "customerName": customer_name,
        "customerPhone": customer_phone,
        "shippingAddress": shipping_address,
        "paymentMethod": payment_method,
        "message": "Your order has been placed successfully! Our team will contact you shortly."
    }, 201)


# ─────────────────────────────────────────────────────────────────────────────
# 5. ORDER TRACKING (PUBLIC)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/orders/track/{orderNo}")
async def track_order(
    orderNo: str,
    phone: str = "",
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Track an online order by Order Number."""
    sql = text(
        "SELECT o.id, o.orderNo, o.source, o.status, o.subtotal, o.discountTotal, o.taxTotal, o.total, "
        "o.note, o.createdAt, c.name AS customerName, c.phone AS customerPhone "
        "FROM sales_orders o "
        "LEFT JOIN customers c ON c.id = o.customerId "
        "WHERE o.orderNo = :ono AND o.tenantId = :t"
    )
    row = (await db.execute(sql, {"ono": orderNo.strip(), "t": tenantId})).first()
    if not row:
        return err("Order not found with this order number", 404)

    order_dict = dict(row._mapping) if hasattr(row, "_mapping") else dict(zip(
        ["id", "orderNo", "source", "status", "subtotal", "discountTotal", "taxTotal", "total", "note", "createdAt", "customerName", "customerPhone"],
        row
    ))

    # Optional phone verification
    if phone and order_dict.get("customerPhone"):
        if phone.strip()[-4:] not in str(order_dict.get("customerPhone")):
            return err("Phone number verification failed", 403)

    # Fetch items
    items_rows = rows_to_dicts((await db.execute(
        text(
            "SELECT oi.id, oi.productId, oi.qtyOrdered, oi.unitPrice, oi.lineTotal, "
            "p.name AS productName, p.imageUrl "
            "FROM sales_order_items oi "
            "LEFT JOIN products p ON p.id = oi.productId "
            "WHERE oi.salesOrderId = :oid AND oi.tenantId = :t"
        ),
        {"oid": order_dict["id"], "t": tenantId}
    )).fetchall())

    order_dict["items"] = items_rows

    # Timeline steps
    status = (order_dict.get("status") or "PENDING").upper()
    steps = [
        {"key": "CONFIRMED", "label": "Order Placed", "done": True},
        {"key": "PROCESSING", "label": "Processing & Packing", "done": status in ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"]},
        {"key": "SHIPPED", "label": "On the Way (Courier)", "done": status in ["SHIPPED", "DELIVERED", "COMPLETED"]},
        {"key": "DELIVERED", "label": "Delivered", "done": status in ["DELIVERED", "COMPLETED"]}
    ]
    order_dict["timeline"] = steps

    return ok(order_dict)


# ─────────────────────────────────────────────────────────────────────────────
# 6. CUSTOMER AUTH (OPTIONAL FOR ONLINE SHOPPERS)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/auth/register")
async def customer_register(
    body: dict,
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = (body.get("name") or "").strip()
    phone = (body.get("phone") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not name or not phone or not password:
        return err("Name, phone, and password are required", 400)

    # Check existing
    existing = (await db.execute(
        text("SELECT id FROM customers WHERE tenantId=:t AND (phone=:p OR (email=:e AND email != '')) LIMIT 1"),
        {"t": tenantId, "p": phone, "e": email}
    )).first()
    if existing:
        return err("An account with this phone or email already exists", 400)

    cust_id = _uid()
    pw_hash = hash_password(password)

    await db.execute(
        text(
            "INSERT INTO customers (id, tenantId, name, phone, email, notes) "
            "VALUES (:id, :t, :n, :p, :e, :notes)"
        ),
        {"id": cust_id, "t": tenantId, "n": name, "p": phone, "e": email or f"{cust_id[:8]}@cust.local", "notes": json.dumps({"pw": pw_hash})}
    )
    await db.commit()

    token = sign_token({
        "id": cust_id,
        "tenantId": tenantId,
        "name": name,
        "phone": phone,
        "email": email,
        "role": "CUSTOMER"
    })

    return ok({
        "token": token,
        "customer": {"id": cust_id, "name": name, "phone": phone, "email": email}
    }, 201)


@router.post("/auth/login")
async def customer_login(
    body: dict,
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    ident = (body.get("identifier") or body.get("phone") or body.get("email") or "").strip()
    password = body.get("password") or ""

    if not ident or not password:
        return err("Identifier (Phone/Email) and password required", 400)

    row = (await db.execute(
        text("SELECT id, name, phone, email, notes FROM customers WHERE tenantId=:t AND (phone=:i OR email=:i) LIMIT 1"),
        {"t": tenantId, "i": ident}
    )).first()

    if not row:
        return err("Customer account not found", 401)

    c_id, name, phone, email, notes = row[0], row[1], row[2], row[3], row[4]
    valid = False
    if notes:
        try:
            parsed = json.loads(notes)
            if isinstance(parsed, dict) and "pw" in parsed:
                valid = verify_password(password, parsed["pw"])
        except Exception:
            pass

    if not valid:
        return err("Invalid password", 401)

    token = sign_token({
        "id": c_id,
        "tenantId": tenantId,
        "name": name,
        "phone": phone,
        "email": email,
        "role": "CUSTOMER"
    })

    return ok({
        "token": token,
        "customer": {"id": c_id, "name": name, "phone": phone, "email": email}
    })
