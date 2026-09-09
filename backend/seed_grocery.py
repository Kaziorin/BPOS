#!/usr/bin/env python
"""Grocery Supermarket POS Seeder for Blue Ocean POS.
Idempotent script to seed complete grocery catalog, categories, units, and inventory stock into MySQL.
"""
from __future__ import annotations

import uuid
import datetime
from sqlalchemy import text
from db import sync_engine

TENANT_SLUG = "demo-shop"

def _uuid() -> str:
    return str(uuid.uuid4())

GROCERY_CATEGORIES = [
    ("Fruits & Veg", "Fresh fruits, vegetables, greens & organic produce"),
    ("Grocery", "Staple foods, rice, oil, sugar, spices & flour"),
    ("Beverages", "Soft drinks, juices, tea, coffee & energy drinks"),
    ("Snacks", "Chips, biscuits, chocolates, nuts & crackers"),
    ("Dairy", "Milk, butter, cheese, eggs, yogurt & cream"),
    ("Household", "Detergents, cleaners, tissue, soaps & cleaning items"),
    ("Bakery", "Fresh bread, cakes, pastries, croissants & buns"),
    ("Frozen Foods", "Frozen pizza, nuggets, ice cream, french fries & ready meals"),
    ("Meat & Fish", "Fresh salmon, beef steak, chicken, mutton & seafood"),
    ("Personal Care", "Shampoos, body washes, soaps, toothpaste & lotion"),
    ("Baby Care", "Baby powder, diapers, milk formula, wipes & baby wash"),
    ("Pet Supplies", "Cat food, dog food, pet treats & accessories"),
]

GROCERY_PRODUCTS = [
    # Fruits & Veg
    ("Banana", "BAN-1KG", "8901001001", 40.0, 60.0, "kg", "Fruits & Veg", 250),
    ("Red Apple", "APL-1KG", "8901001002", 130.0, 180.0, "kg", "Fruits & Veg", 150),
    ("Potato", "POT-1KG", "8901001003", 20.0, 30.0, "kg", "Fruits & Veg", 500),
    ("Onion", "ONI-1KG", "8901001004", 18.0, 28.0, "kg", "Fruits & Veg", 400),
    ("Tomato", "TOM-1KG", "8901001005", 28.0, 40.0, "kg", "Fruits & Veg", 200),
    ("Cucumber", "CUC-1KG", "8901001006", 15.0, 25.0, "kg", "Fruits & Veg", 180),
    ("Carrot", "CAR-1KG", "8901001007", 35.0, 50.0, "kg", "Fruits & Veg", 120),
    
    # Grocery staples
    ("Basmati Rice 1kg", "RIC-1KG", "8902002001", 85.0, 120.0, "kg", "Grocery", 1000),
    ("Sunflower Oil 1L", "OIL-1L", "8902002002", 125.0, 160.0, "pcs", "Grocery", 300),
    ("Refined Sugar 1kg", "SUG-1KG", "8902002003", 52.0, 70.0, "kg", "Grocery", 400),
    ("Fresh Atta 1kg", "ATT-1KG", "8902002004", 38.0, 50.0, "kg", "Grocery", 600),
    ("Iodized Salt 1kg", "SLT-1KG", "8902002005", 25.0, 38.0, "kg", "Grocery", 450),
    
    # Beverages
    ("Coca-Cola 1.5L", "COC-1L5", "8903003001", 85.0, 110.0, "pcs", "Beverages", 400),
    ("Nescafe Classic 50g", "NES-50G", "8903003002", 88.0, 115.0, "pcs", "Beverages", 250),
    ("Teatulia Black Tea 200g", "TEA-200G", "8903003003", 95.0, 140.0, "pcs", "Beverages", 200),
    ("Fresh Mango Juice 1L", "JUC-1L", "8903003004", 70.0, 95.0, "pcs", "Beverages", 180),
    
    # Snacks
    ("Lays Classic 52g", "LAY-52G", "8904004001", 24.0, 35.0, "pcs", "Snacks", 500),
    ("Oreo Biscuits 120g", "BIS-120G", "8904004002", 35.0, 50.0, "pcs", "Snacks", 350),
    ("Cadbury Dairy Milk 50g", "CHO-50G", "8904004003", 60.0, 85.0, "pcs", "Snacks", 300),
    
    # Dairy
    ("Pasteurized Milk 1L", "MLK-1L", "8905005001", 52.0, 70.0, "pcs", "Dairy", 200),
    ("Farm Eggs (Dozen)", "EGG-DOZ", "8905005002", 98.0, 130.0, "dozen", "Dairy", 150),
    ("Salted Butter 200g", "BUT-200G", "8905005003", 160.0, 210.0, "pcs", "Dairy", 110),
    ("Sweet Yogurt 500g", "YOG-500G", "8905005004", 75.0, 105.0, "pcs", "Dairy", 130),
    
    # Household
    ("Surf Excel Detergent 1kg", "SUR-1KG", "8906006001", 145.0, 190.0, "kg", "Household", 300),
    ("Toilet Tissue (4 Pack)", "TIS-4P", "8906006002", 40.0, 60.0, "pcs", "Household", 450),
    ("Dishwashing Liquid 500ml", "DET-1KG", "8906006003", 85.0, 120.0, "pcs", "Household", 350),
    
    # Bakery
    ("White Bread 400g", "BRD-400G", "8907007001", 32.0, 45.0, "pcs", "Bakery", 100),
    ("Butter Croissant (2pcs)", "CRO-2P", "8907007002", 58.0, 85.0, "pcs", "Bakery", 80),
    ("Chocolate Cake 500g", "CAK-500G", "8907007003", 240.0, 350.0, "pcs", "Bakery", 30),
    
    # Frozen Foods
    ("Frozen Chicken Pizza 350g", "PIZ-350G", "8908008001", 210.0, 290.0, "pcs", "Frozen Foods", 75),
    ("Vanilla Ice Cream 1L", "ICE-1L", "8908008002", 155.0, 220.0, "pcs", "Frozen Foods", 120),
    ("Chicken Nuggets 500g", "NUG-500G", "8908008003", 185.0, 260.0, "pcs", "Frozen Foods", 90),
    
    # Meat & Fish
    ("Fresh Salmon Fillet 1kg", "SAL-1KG", "8909009001", 620.0, 850.0, "kg", "Meat & Fish", 50),
    ("Prime Beef Steak 1kg", "STE-1KG", "8909009002", 540.0, 750.0, "kg", "Meat & Fish", 60),
    ("Fresh Broiler Chicken 1kg", "CHK-1KG", "8909009003", 140.0, 195.0, "kg", "Meat & Fish", 150),
    
    # Personal Care
    ("Moisturizing Body Wash 500ml", "WAS-500M", "8910010001", 170.0, 240.0, "pcs", "Personal Care", 150),
    ("Anti-Dandruff Shampoo 350ml", "SHA-350M", "8910010002", 200.0, 280.0, "pcs", "Personal Care", 180),
    
    # Baby Care
    ("Soft Baby Powder 200g", "BAB-200G", "8911011001", 220.0, 310.0, "pcs", "Baby Care", 90),
    
    # Pet Supplies
    ("Premium Cat Food 1kg", "CAT-1KG", "8912012001", 300.0, 420.0, "pcs", "Pet Supplies", 65),
]

def seed_grocery() -> None:
    conn = sync_engine.connect()
    try:
        # Get tenant ID
        t = conn.execute(text("SELECT id FROM tenants WHERE slug = :s"), {"s": TENANT_SLUG}).first()
        if not t:
            print(f"Error: Tenant '{TENANT_SLUG}' not found! Run seed_demo.py first.")
            return
        tenant_id = t[0]

        # Get default warehouse
        wh = conn.execute(text("SELECT id FROM warehouses WHERE tenantId = :t LIMIT 1"), {"t": tenant_id}).first()
        if not wh:
            print(f"Error: No warehouse found for tenant '{tenant_id}'.")
            return
        wh_id = wh[0]

        # Get or create default Brand
        brand = conn.execute(text("SELECT id FROM brands WHERE tenantId = :t LIMIT 1"), {"t": tenant_id}).first()
        brand_id = brand[0] if brand else _uuid()
        if not brand:
            conn.execute(text(
                "INSERT INTO brands (id, tenantId, name, status, createdAt, updatedAt) "
                "VALUES (:id, :t, 'Fresh Brand', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": brand_id, "t": tenant_id})

        # Seed categories
        cat_map = {}
        for cname, cdesc in GROCERY_CATEGORIES:
            row = conn.execute(text(
                "SELECT id FROM categories WHERE tenantId = :t AND name = :n"
            ), {"t": tenant_id, "n": cname}).first()
            if row:
                cat_map[cname] = row[0]
            else:
                cid = _uuid()
                conn.execute(text(
                    "INSERT INTO categories (id, tenantId, name, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :n, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": cid, "t": tenant_id, "n": cname})
                cat_map[cname] = cid

        # Seed units
        unit_map = {}
        for ucode in ["pcs", "kg", "dozen", "gm", "L"]:
            row = conn.execute(text(
                "SELECT id FROM units WHERE (tenantId = :t OR tenantId IS NULL) AND code = :c"
            ), {"t": tenant_id, "c": ucode}).first()
            if row:
                unit_map[ucode] = row[0]
            else:
                uid = _uuid()
                conn.execute(text(
                    "INSERT INTO units (id, tenantId, name, code, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :n, :c, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": uid, "t": tenant_id, "n": ucode.title(), "c": ucode})
                unit_map[ucode] = uid

        # Seed products and stock
        seeded_count = 0
        for name, sku, barcode, cost, price, uom, cat_name, stock_qty in GROCERY_PRODUCTS:
            cid = cat_map.get(cat_name)
            uid = unit_map.get(uom, unit_map.get("pcs"))

            prod = conn.execute(text(
                "SELECT id FROM products WHERE tenantId = :t AND sku = :s"
            ), {"t": tenant_id, "s": sku}).first()

            if not prod:
                prod_id = _uuid()
                conn.execute(text(
                    "INSERT INTO products (id, tenantId, categoryId, brandId, unitId, name, sku, barcode, productType, "
                    "costPrice, sellingPrice, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :c, :b, :u, :n, :s, :bc, 'SIMPLE', :cost, :price, 'ACTIVE', NOW(3), NOW(3))"
                ), {
                    "id": prod_id, "t": tenant_id, "c": cid, "b": brand_id, "u": uid,
                    "n": name, "s": sku, "bc": barcode, "cost": cost, "price": price
                })

                # Insert stock
                conn.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :w, :p, :q, 0, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": _uuid(), "t": tenant_id, "w": wh_id, "p": prod_id, "q": stock_qty})
                seeded_count += 1
            else:
                # Update existing product price & barcode
                prod_id = prod[0]
                conn.execute(text(
                    "UPDATE products SET name = :n, barcode = :bc, costPrice = :cost, sellingPrice = :price, unitId = :u, categoryId = :c "
                    "WHERE id = :p AND tenantId = :t"
                ), {"n": name, "bc": barcode, "cost": cost, "price": price, "u": uid, "c": cid, "p": prod_id, "t": tenant_id})
                
                # Re-baseline stock
                stk = conn.execute(text("SELECT id FROM stock WHERE tenantId = :t AND productId = :p AND warehouseId = :w"),
                                   {"t": tenant_id, "p": prod_id, "w": wh_id}).first()
                if stk:
                    conn.execute(text("UPDATE stock SET qtyOnHand = :q WHERE id = :id"), {"q": stock_qty, "id": stk[0]})
                else:
                    conn.execute(text(
                        "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved, status, createdAt, updatedAt) "
                        "VALUES (:id, :t, :w, :p, :q, 0, 'ACTIVE', NOW(3), NOW(3))"
                    ), {"id": _uuid(), "t": tenant_id, "w": wh_id, "p": prod_id, "q": stock_qty})

        conn.commit()
        print(f"Successfully seeded {len(GROCERY_PRODUCTS)} Grocery POS products, categories & inventory stock!")
        print(f"New seeded items: {seeded_count}")

    finally:
        conn.close()

if __name__ == "__main__":
    seed_grocery()
