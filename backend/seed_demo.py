#!/usr/bin/env python
"""Demo seed for blue_ocean_pos — ports the original TS seeders (seed-core.ts,
seed.ts, seed-modules.ts) so the API boots with a working demo tenant.

Idempotent: safe to run repeatedly.
Login: admin@blueoceanspos.com / Admin@123   tenant: demo-shop
"""
from __future__ import annotations

import uuid

from sqlalchemy import text

from db import sync_engine
from security import hash_password

TENANT_SLUG = "demo-shop"


def _uuid() -> str:
    return str(uuid.uuid4())


PERMISSION_CODES = [
    "sales.create", "sales.view", "sales.refund",
    "inventory.view", "products.create", "products.edit", "products.delete",
    "customers.create", "customers.edit", "suppliers.create", "suppliers.edit",
    "reports.view", "products.categories.create",
    "branch.view", "branch.create", "branch.edit", "branch.delete",
    "warehouse.view", "warehouse.create", "warehouse.edit", "warehouse.delete",
    "device.view", "device.create", "device.edit", "device.delete",
    "settings.view", "settings.edit",
    "onboarding.view", "onboarding.edit",
    "rbac.roles.view", "rbac.roles.create", "rbac.roles.edit", "rbac.roles.delete",
    "rbac.permissions.view", "rbac.users.view", "rbac.users.edit",
    "accounting.accounts.view", "accounting.accounts.create",
    "accounting.journals.view", "accounting.journals.create",
    "accounting.ledger.view", "accounting.trialbalance.view",
    "accounting.pnl.view", "accounting.balancesheet.view", "accounting.cashflow.view",
    "system.admin",  # Prompt 39: system performance / queue / cache dashboard
]

# (code, name, category, icon, route, sortOrder) — modules from seed-modules.ts.
# Prompt 42: `route` is the module's real landing page (never "/") so the
# sidebar's dynamic-nav singleDirect flattening yields clean direct links.
MODULES = [
    ("platform", "Platform & SaaS Management", "PLATFORM", "Settings", "/saas", 1),
    ("tenant", "Tenant / Company Management", "PLATFORM", "Building2", "/settings", 2),
    ("auth", "Authentication & Security", "PLATFORM", "Shield", "/audit-security", 3),
    ("rbac", "User / Role / Permission (RBAC)", "PLATFORM", "Users", "/rbac", 4),
    ("settings", "System / Global Settings", "PLATFORM", "Settings", "/settings", 5),
    ("onboarding", "Tenant Onboarding", "PLATFORM", "Rocket", "/onboarding", 6),
    ("integrations", "API / Webhooks / Integrations", "PLATFORM", "Plug", "/integrations", 7),
    ("system", "System Performance", "PLATFORM", "Activity", "/system/performance", 8),
    ("dashboard", "Dashboard", "CORE", "LayoutDashboard", "/dashboard", 10),
    ("products", "Product & Catalog", "CORE", "Package", "/products", 11),
    ("customers", "Customer & CRM", "CORE", "Users", "/customers", 12),
    ("suppliers", "Supplier Management", "CORE", "Truck", "/suppliers", 13),
    ("pos", "POS & Checkout Engine", "CORE", "Monitor", "/pos", 14),
    ("sales", "Sales Management", "CORE", "ShoppingCart", "/sales", 15),
    ("invoices", "Invoice Engine", "CORE", "FileText", "/invoices", 16),
    ("payments", "Payment & Collection", "CORE", "CreditCard", "/payments", 17),
    ("credit", "Credit Management", "CORE", "Clock", "/credit", 18),
    ("installments", "Installment Management", "CORE", "Calendar", "/installments", 19),
    ("commission", "Commission Engine", "CORE", "Percent", "/commission", 20),
    ("inventory", "Inventory & Warehouse", "CORE", "Warehouse", "/inventory", 21),
    ("purchases", "Purchasing", "CORE", "ShoppingBag", "/purchasing", 22),
    ("accounting", "Accounting Engine", "CORE", "BookOpen", "/accounting", 23),
    ("vat", "VAT / Tax Engine", "CORE", "Calculator", "/tax", 24),
    ("returns", "Return / Refund / RMA / Warranty", "CORE", "RotateCcw", "/returns", 25),
    ("loyalty", "Loyalty / Membership / Wallet", "CORE", "Star", "/loyalty", 26),
    ("promotions", "Promotion Engine", "CORE", "Tag", "/promotions", 27),
    ("delivery", "Delivery & Logistics", "CORE", "MapPin", "/delivery", 28),
    ("hrm", "HRM", "CORE", "UserCog", "/hrm", 29),
    ("expenses", "Expense Management", "CORE", "Receipt", "/expenses", 30),
    ("cashregister", "Cash Register & Shift", "CORE", "DollarSign", "/cash-register", 31),
    ("workflow", "Approval & Workflow Engine", "ENGINE", "GitMerge", "/workflow", 32),
    ("notifications", "Notification Engine", "ENGINE", "Bell", "/notifications", 33),
    ("audit", "Audit System", "ENGINE", "Eye", "/audit-security", 34),
    ("reporting", "Reporting / BI / AI", "ENGINE", "BarChart3", "/reports", 35),
    ("sync", "Offline Sync Engine", "ENGINE", "RefreshCw", "/settings", 36),
    ("documents", "Document Management", "CORE", "FolderOpen", "/data", 37),
    ("tasks", "Task Management", "CORE", "CheckSquare", "/tasks", 38),
    ("marketing", "Marketing Automation", "CORE", "Megaphone", "/marketing", 39),
    ("targets", "Sales Target & Budget", "CORE", "Target", "/targets", 40),
    ("appointments", "Appointment / Booking & Queue", "CORE", "Calendar", "/appointments", 41),
    ("baserules", "Business Rule Engine", "ENGINE", "Settings", "/business-rules", 42),
    ("restaurant", "Restaurant", "INDUSTRY", "UtensilsCrossed", "/restaurant", 50),
    ("pharmacy", "Pharmacy", "INDUSTRY", "Package", "/pharmacy", 51),
    ("retail", "Retail", "INDUSTRY", "ShoppingBag", "/omnichannel", 52),
    ("grocery", "Grocery / Supermarket", "INDUSTRY", "Package", "/omnichannel", 53),
    ("wholesale", "Wholesale & Distribution", "INDUSTRY", "Truck", "/omnichannel", 54),
    ("manufacturing", "Manufacturing / Bakery", "INDUSTRY", "Settings", "/manufacturing", 55),
    ("salon", "Salon & Spa", "INDUSTRY", "Scissors", "/salon", 56),
    ("repair", "Repair & Service Center", "INDUSTRY", "Settings", "/repair", 57),
    ("franchise", "Franchise Management", "INDUSTRY", "Settings", "/franchise", 58),
]

# Landing-page label shown for accordion modules (the accordion header already
# shows the full module name, so the first child uses a short page label).
MODULE_LANDING_LABEL = {
    "customers": "Customers",
    "pos": "POS",
    "sales": "Sales",
    "inventory": "Inventory",
    "purchases": "Purchasing",
    "accounting": "Accounting",
    "expenses": "Expenses",
    "returns": "Returns",
}

# Modules with real sub-pages → (label, route) top-level menu items appended
# after the landing item. Mirrors what the Prompt 42 nav fix verified live.
MODULE_SUB_PAGES = {
    "customers": [("New Customer", "/customers/create")],
    "pos": [
        ("Held Sales", "/pos/holds"),
        ("Self Checkout", "/pos/self-checkout"),
        ("Price Checker", "/pos/price-checker"),
    ],
    "sales": [("Orders", "/sales/orders"), ("Quotations", "/sales/quotations")],
    "inventory": [
        ("Stock", "/inventory/stock"),
        ("Batches & Expiry", "/inventory/batches"),
        ("Transfers", "/inventory/transfers"),
        ("Counts", "/inventory/counts"),
        ("Serials", "/inventory/serials"),
        ("Movements", "/inventory/movements"),
    ],
    "purchases": [
        ("Purchase Orders", "/purchasing/orders"),
        ("GRNs", "/purchasing/grns"),
        ("Requisitions", "/purchasing/requisitions"),
        ("Purchase Returns", "/purchasing/returns"),
    ],
    "accounting": [
        ("Accounts", "/accounting/accounts"),
        ("Journals", "/accounting/journals"),
        ("Ledger", "/accounting/ledger"),
        ("Trial Balance", "/accounting/trial-balance"),
        ("Profit & Loss", "/accounting/pnl"),
        ("Balance Sheet", "/accounting/balance-sheet"),
    ],
    "expenses": [
        ("Categories", "/expenses/categories"),
        ("Recurring", "/expenses/recurring"),
        ("Petty Cash", "/expenses/petty-cash"),
        ("Report", "/expenses/report"),
    ],
    "returns": [("RMA", "/rma"), ("Warranty", "/warranty")],
}


def reseed_pharmacy() -> None:
    """Prompt 42: reset the demo medicines' batches + stock to baseline after
    e2e suites sold/returned real ledger rows. Idempotent, cheap, no-op safe."""
    conn = sync_engine.connect()
    try:
        t = conn.execute(text("SELECT id FROM tenants WHERE slug = :s"), {"s": TENANT_SLUG}).first()
        if not t:
            return
        tenant_id = t[0]
        wh = conn.execute(text(
            "SELECT w.id FROM warehouses w JOIN branches b ON b.id = w.branchId "
            "WHERE b.tenantId = :t LIMIT 1"), {"t": tenant_id}).first()
        if not wh:
            return
        wh_id = wh[0]
        cat = conn.execute(text("SELECT id FROM categories WHERE tenantId = :t LIMIT 1"),
                           {"t": tenant_id}).first()
        brand = conn.execute(text("SELECT id FROM brands WHERE tenantId = :t LIMIT 1"),
                             {"t": tenant_id}).first()
        unit = conn.execute(text("SELECT id FROM units WHERE tenantId = :t OR tenantId IS NULL LIMIT 1"),
                            {"t": tenant_id}).first()
        if not (cat and brand and unit):
            return
        import datetime as _dt
        meds = [
            ("Napa Extra 500mg", "MED-001", 40.0, 70.0, (120, 45, 200)),
            ("Ace Plus Paracetamol", "MED-002", 55.0, 100.0, (90, 25, 150)),
            ("Fexo 120mg Antihistamine", "MED-003", 130.0, 220.0, (300, 60, 180)),
            ("Omidon 10mg", "MED-004", 80.0, 140.0, (200, 15, 160)),
            ("Seclo 20mg", "MED-005", 90.0, 160.0, (75, 35, 140)),
        ]
        for name, sku, cost, price, days_tuple in meds:
            row = conn.execute(text("SELECT id FROM products WHERE tenantId = :t AND sku = :s"),
                               {"t": tenant_id, "s": sku}).first()
            if not row:
                continue
            prod_id = row[0]
            conn.execute(text("DELETE FROM batches WHERE tenantId = :t AND productId = :p"),
                         {"t": tenant_id, "p": prod_id})
            conn.execute(text("DELETE FROM stock_batches WHERE tenantId = :t AND productId = :p"),
                         {"t": tenant_id, "p": prod_id})
            conn.execute(text("DELETE FROM stock WHERE tenantId = :t AND productId = :p"),
                         {"t": tenant_id, "p": prod_id})
            total_qty = 0
            for bi, days in enumerate(days_tuple):
                bqty = float(days)
                total_qty += bqty
                exp = (_dt.date.today() + _dt.timedelta(days=days)).isoformat()
                bno = f"{sku.replace('-', '')}-{chr(65 + bi)}-{_dt.date.today().strftime('%y%m')}"
                for tbl in ("batches", "stock_batches"):
                    conn.execute(text(
                        f"INSERT INTO {tbl} (id, tenantId, productId, warehouseId, batchNo, qty, costPrice, expiryDate, createdAt, updatedAt) "
                        "VALUES (:id, :t, :p, :w, :b, :q, :c, :e, NOW(3), NOW(3))"
                    ), {"id": _uuid(), "t": tenant_id, "p": prod_id, "w": wh_id,
                        "b": bno, "q": bqty, "c": cost, "e": exp})
            conn.execute(text(
                "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved, status, createdAt, updatedAt) "
                "VALUES (:id, :t, :w, :p, :q, 0, 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": _uuid(), "t": tenant_id, "w": wh_id, "p": prod_id, "q": total_qty})
        conn.commit()
    finally:
        conn.close()


def main() -> None:
    conn = sync_engine.connect()
    try:
        # ── Tenant ──
        t = conn.execute(text("SELECT id FROM tenants WHERE slug = :s"), {"s": TENANT_SLUG}).first()
        tenant_id = t[0] if t else _uuid()
        if not t:
            conn.execute(text(
                "INSERT INTO tenants (id, name, slug, businessType, status, currency, timezone, createdAt, updatedAt) "
                "VALUES (:id, 'Demo Restaurant', :s, 'RESTAURANT', 'ACTIVE', 'BDT', 'Asia/Dhaka', NOW(3), NOW(3))"
            ), {"id": tenant_id, "s": TENANT_SLUG})

        # ── Permissions ──
        perm_ids: dict[str, str] = {}
        for code in PERMISSION_CODES:
            module, action = code.split(".", 1)
            row = conn.execute(text("SELECT id FROM permissions WHERE code = :c"), {"c": code}).first()
            pid = row[0] if row else _uuid()
            if not row:
                conn.execute(text(
                    "INSERT INTO permissions (id, code, module, action, createdAt) VALUES (:id, :c, :m, :a, NOW(3))"
                ), {"id": pid, "c": code, "m": module, "a": action})
            perm_ids[code] = pid

        # ── Roles ──
        def upsert_role(name: str, system: bool) -> str:
            row = conn.execute(text(
                "SELECT id FROM roles WHERE tenantId = :t AND name = :n"), {"t": tenant_id, "n": name}).first()
            rid = row[0] if row else _uuid()
            if not row:
                conn.execute(text(
                    "INSERT INTO roles (id, tenantId, name, isSystem, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :n, :sys, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": rid, "t": tenant_id, "n": name, "sys": 1 if system else 0})
            return rid

        owner_id = upsert_role("Owner", True)
        cashier_id = upsert_role("Cashier", True)

        for code, pid in perm_ids.items():
            row = conn.execute(text(
                "SELECT id FROM role_permissions WHERE roleId = :r AND permissionId = :p"),
                {"r": owner_id, "p": pid}).first()
            if not row:
                conn.execute(text(
                    "INSERT INTO role_permissions (id, roleId, permissionId, createdAt) VALUES (:id, :r, :p, NOW(3))"
                ), {"id": _uuid(), "r": owner_id, "p": pid})
        for code in ("sales.create", "sales.view", "inventory.view", "customers.create"):
            pid = perm_ids.get(code)
            if not pid:
                continue
            row = conn.execute(text(
                "SELECT id FROM role_permissions WHERE roleId = :r AND permissionId = :p"),
                {"r": cashier_id, "p": pid}).first()
            if not row:
                conn.execute(text(
                    "INSERT INTO role_permissions (id, roleId, permissionId, createdAt) VALUES (:id, :r, :p, NOW(3))"
                ), {"id": _uuid(), "r": cashier_id, "p": pid})

        # ── Company / Branch / Warehouse ──
        company = conn.execute(text("SELECT id FROM companies WHERE id = 'seed-company'")).first()
        company_id = company[0] if company else "seed-company"
        if not company:
            conn.execute(text(
                "INSERT INTO companies (id, tenantId, name, legalName, status, createdAt, updatedAt) "
                "VALUES (:id, :t, 'Demo Restaurant Ltd.', 'Demo Restaurant Ltd.', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": company_id, "t": tenant_id})

        branch = conn.execute(text(
            "SELECT id FROM branches WHERE tenantId = :t AND code = 'DHK-01'"), {"t": tenant_id}).first()
        branch_id = branch[0] if branch else _uuid()
        if not branch:
            conn.execute(text(
                "INSERT INTO branches (id, tenantId, companyId, code, name, status, createdAt, updatedAt) "
                "VALUES (:id, :t, :c, 'DHK-01', 'Dhanmondi Branch', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": branch_id, "t": tenant_id, "c": company_id})

        warehouse = conn.execute(text(
            "SELECT id FROM warehouses WHERE tenantId = :t AND code = 'WH-DHK-01'"), {"t": tenant_id}).first()
        wh_id = warehouse[0] if warehouse else _uuid()
        if not warehouse:
            conn.execute(text(
                "INSERT INTO warehouses (id, tenantId, branchId, code, name, status, createdAt, updatedAt) "
                "VALUES (:id, :t, :b, 'WH-DHK-01', 'Dhanmondi Warehouse', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": wh_id, "t": tenant_id, "b": branch_id})

        # ── Admin user ──
        admin = conn.execute(text(
            "SELECT id FROM users WHERE tenantId = :t AND email = 'admin@blueoceanspos.com'"),
            {"t": tenant_id}).first()
        if not admin:
            conn.execute(text(
                "INSERT INTO users (id, tenantId, branchId, name, email, passwordHash, roleId, status, createdAt, updatedAt) "
                "VALUES (:id, :t, :b, 'Tenant Admin', 'admin@blueoceanspos.com', :ph, :r, 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": _uuid(), "t": tenant_id, "b": branch_id, "ph": hash_password("Admin@123"), "r": owner_id})

        # ── Catalog: unit / category / brand / products ──
        unit = conn.execute(text("SELECT id FROM units WHERE tenantId = :t AND code = 'pcs'"), {"t": tenant_id}).first()
        unit_id = unit[0] if unit else _uuid()
        if not unit:
            conn.execute(text(
                "INSERT INTO units (id, tenantId, name, code, status, createdAt, updatedAt) "
                "VALUES (:id, :t, 'Piece', 'pcs', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": unit_id, "t": tenant_id})

        cat = conn.execute(text(
            "SELECT id FROM categories WHERE tenantId = :t AND parentId IS NULL AND name = 'Beverages'"),
            {"t": tenant_id}).first()
        cat_id = cat[0] if cat else _uuid()
        if not cat:
            conn.execute(text(
                "INSERT INTO categories (id, tenantId, name, status, createdAt, updatedAt) "
                "VALUES (:id, :t, 'Beverages', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": cat_id, "t": tenant_id})

        brand = conn.execute(text("SELECT id FROM brands WHERE tenantId = :t AND name = 'Local'"), {"t": tenant_id}).first()
        brand_id = brand[0] if brand else _uuid()
        if not brand:
            conn.execute(text(
                "INSERT INTO brands (id, tenantId, name, status, createdAt, updatedAt) "
                "VALUES (:id, :t, 'Local', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": brand_id, "t": tenant_id})

        products = [
            ("Cold Coffee", "BEV-001", 60.0, 120.0),
            ("Hot Tea", "BEV-002", 15.0, 30.0),
            ("Orange Juice", "BEV-003", 80.0, 150.0),
        ]
        for name, sku, cost, price in products:
            row = conn.execute(text("SELECT id FROM products WHERE tenantId = :t AND sku = :s"),
                               {"t": tenant_id, "s": sku}).first()
            if not row:
                prod_id = _uuid()
                conn.execute(text(
                    "INSERT INTO products (id, tenantId, categoryId, brandId, unitId, name, sku, productType, "
                    "costPrice, sellingPrice, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :c, :b, :u, :n, :s, 'SIMPLE', :cost, :price, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": prod_id, "t": tenant_id, "c": cat_id, "b": brand_id, "u": unit_id,
                    "n": name, "s": sku, "cost": cost, "price": price})
                # Baseline stock for the demo warehouse so POS/e2e suites have sellable qty
                conn.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :w, :p, 500, 0, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": _uuid(), "t": tenant_id, "w": wh_id, "p": prod_id})

        # ── Pharmacy medicines (batch-controlled, §10.17 / Prompt 42 UI) ──
        # Each medicine gets its own batches at different expiry dates so the
        # pharmacy register can demo batch selection, FEFO and expiry badges.
        import datetime as _dt
        meds = [
            ("Napa Extra 500mg", "MED-001", 40.0, 70.0, (120, 45, 200)),
            ("Ace Plus Paracetamol", "MED-002", 55.0, 100.0, (90, 25, 150)),
            ("Fexo 120mg Antihistamine", "MED-003", 130.0, 220.0, (300, 60, 180)),
            ("Omidon 10mg", "MED-004", 80.0, 140.0, (200, 15, 160)),
            ("Seclo 20mg", "MED-005", 90.0, 160.0, (75, 35, 140)),
        ]
        for name, sku, cost, price, days_tuple in meds:
            row = conn.execute(text("SELECT id FROM products WHERE tenantId = :t AND sku = :s"),
                               {"t": tenant_id, "s": sku}).first()
            if not row:
                prod_id = _uuid()
                conn.execute(text(
                    "INSERT INTO products (id, tenantId, categoryId, brandId, unitId, name, sku, productType, "
                    "costPrice, sellingPrice, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :c, :b, :u, :n, :s, 'BATCH_CONTROLLED', :cost, :price, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": prod_id, "t": tenant_id, "c": cat_id, "b": brand_id, "u": unit_id,
                    "n": name, "s": sku, "cost": cost, "price": price})
                conn.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, qtyOnHand, qtyReserved, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :w, :p, 0, 0, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": _uuid(), "t": tenant_id, "w": wh_id, "p": prod_id})
            else:
                prod_id = row[0]
                # Idempotent reset — e2e suites sell & restore demo meds, so each
                # seed re-baselines batch quantities to the defaults below.
                conn.execute(text("DELETE FROM batches WHERE tenantId = :t AND productId = :p"),
                             {"t": tenant_id, "p": prod_id})
                conn.execute(text("DELETE FROM stock_batches WHERE tenantId = :t AND productId = :p"),
                             {"t": tenant_id, "p": prod_id})
            total_qty = 0
            for bi, days in enumerate(days_tuple):
                bqty = float(days)
                total_qty += bqty
                exp = (_dt.date.today() + _dt.timedelta(days=days)).isoformat()
                bno = f"{sku.replace('-', '')}-{chr(65 + bi)}-{_dt.date.today().strftime('%y%m')}"
                for tbl in ("batches", "stock_batches"):
                    conn.execute(text(
                        f"INSERT INTO {tbl} (id, tenantId, productId, warehouseId, batchNo, qty, costPrice, expiryDate, createdAt, updatedAt) "
                        "VALUES (:id, :t, :p, :w, :b, :q, :c, :e, NOW(3), NOW(3))"
                    ), {"id": _uuid(), "t": tenant_id, "p": prod_id, "w": wh_id,
                        "b": bno, "q": bqty, "c": cost, "e": exp})
            conn.execute(text(
                "UPDATE stock SET qtyOnHand = :q WHERE tenantId = :t AND productId = :p AND warehouseId = :w"),
                {"q": total_qty, "t": tenant_id, "p": prod_id, "w": wh_id})

        # ── Customers / groups / suppliers ──
        grp = conn.execute(text("SELECT id FROM customer_groups WHERE tenantId = :t AND name = 'General'"),
                           {"t": tenant_id}).first()
        grp_id = grp[0] if grp else _uuid()
        if not grp:
            conn.execute(text(
                "INSERT INTO customer_groups (id, tenantId, name, discountPercent, status, createdAt, updatedAt) "
                "VALUES (:id, :t, 'General', 0, 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": grp_id, "t": tenant_id})

        for name, phone in (("Core Walk-in", "01900000000"), ("Rahim Uddin", "01811111111"),
                            ("Karim Mia", "01822222222")):
            row = conn.execute(text("SELECT id FROM customers WHERE tenantId = :t AND phone = :p"),
                               {"t": tenant_id, "p": phone}).first()
            if not row:
                conn.execute(text(
                    "INSERT INTO customers (id, tenantId, branchId, groupId, name, phone, status, createdAt, updatedAt) "
                    "VALUES (:id, :t, :b, :g, :n, :p, 'ACTIVE', NOW(3), NOW(3))"
                ), {"id": _uuid(), "t": tenant_id, "b": branch_id, "g": grp_id, "n": name, "p": phone})

        supp = conn.execute(text("SELECT id FROM suppliers WHERE tenantId = :t AND name = 'Default Supplier'"),
                            {"t": tenant_id}).first()
        if not supp:
            conn.execute(text(
                "INSERT INTO suppliers (id, tenantId, name, company, phone, status, createdAt, updatedAt) "
                "VALUES (:id, :t, 'Default Supplier', 'Default Supplier', '01800000000', 'ACTIVE', NOW(3), NOW(3))"
            ), {"id": _uuid(), "t": tenant_id})

        # ── Modules + menu items + tenant_modules ──
        # Prompt 42: the seed is the single source of truth for the sidebar nav.
        # Each module carries a real route (its landing page); modules with real
        # sub-pages expose them as top-level menu items so the sidebar renders
        # one clean accordion level (see dynamic-nav.ts singleDirect flattening).
        for code, name, cat_, icon, route, sort in MODULES:
            m = conn.execute(text("SELECT id FROM modules WHERE code = :c"), {"c": code}).first()
            mid = m[0] if m else _uuid()
            if not m:
                conn.execute(text(
                    "INSERT INTO modules (id, code, name, description, category, icon, route, sortOrder, isActive, isCore, createdAt, updatedAt) "
                    "VALUES (:id, :c, :n, :n, :cat, :ic, :r, :so, 1, 1, NOW(3), NOW(3))"
                ), {"id": mid, "c": code, "n": name, "cat": cat_, "ic": icon, "r": route, "so": sort})
            else:
                # keep module route/name in lock-step with the seed (Prompt 42 nav fix)
                conn.execute(text(
                    "UPDATE modules SET route = :r, name = :n WHERE id = :mid AND (route IS NULL OR route = '/' OR route <> :r)"),
                    {"r": route, "n": name, "mid": mid})
            # top-level menu items: [landing page] + any real sub-pages
            landing_label = MODULE_LANDING_LABEL.get(code, name)
            pages = [(landing_label, route)] + MODULE_SUB_PAGES.get(code, [])
            for idx, (label, page_route) in enumerate(pages, start=1):
                mi = conn.execute(text(
                    "SELECT id, route FROM menu_items WHERE moduleId = :m AND parentId IS NULL AND route = :r"),
                    {"m": mid, "r": page_route}).first()
                if not mi:
                    conn.execute(text(
                        "INSERT INTO menu_items (id, moduleId, label, route, sortOrder, isVisible, createdAt, updatedAt) "
                        "VALUES (:id, :m, :l, :r, :so, 1, NOW(3), NOW(3))"
                    ), {"id": _uuid(), "m": mid, "l": label, "r": page_route, "so": idx})
                else:
                    # align label/sort; never clobber a real route a tenant customized
                    if mi[1] in ("/", "") or mi[1] is None:
                        conn.execute(text(
                            "UPDATE menu_items SET route = :r, label = :l, sortOrder = :so "
                            "WHERE id = :mid AND (route IN ('/', '') OR route IS NULL)"),
                            {"r": page_route, "l": label, "so": idx, "mid": mi[0]})
            # enable for demo tenant
            tm = conn.execute(text(
                "SELECT id FROM tenant_modules WHERE tenantId = :t AND moduleId = :m"),
                {"t": tenant_id, "m": mid}).first()
            if not tm:
                conn.execute(text(
                    "INSERT INTO tenant_modules (id, tenantId, moduleId, isEnabled, createdAt, updatedAt) "
                    "VALUES (:id, :t, :m, 1, NOW(3), NOW(3))"
                ), {"id": _uuid(), "t": tenant_id, "m": mid})

        conn.commit()
        print(f"Seed OK — tenant '{TENANT_SLUG}' ready.")
        print("Login: admin@blueoceanspos.com / Admin@123")
    finally:
        conn.close()


if __name__ == "__main__":
    main()