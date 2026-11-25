"""Auth router — /api/auth (login) + /api/v1/tenant, menu, dashboard-summary."""
from __future__ import annotations

import json
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

    role_name = row.roleName or ""

    token = sign_token(
        {
            "id": row.id,
            "tenantId": row.tenantId,
            "branchId": row.branchId or "",
            "name": row.name,
            "email": row.email,
            "roleId": row.roleId or "",
            "roleName": role_name,
            "businessType": row.businessType or "",
        }
    )
    # Fetch subscription & enabled modules for the tenant
    sub_row = (await db.execute(text("""
        SELECT s.id, s.status, s.trialEndsAt, p.code as planCode, p.name as planName
        FROM saas_subscriptions s
        JOIN saas_plans p ON p.id = s.planId
        WHERE s.tenantId = :t
        ORDER BY s.createdAt DESC LIMIT 1
    """), {"t": row.tenantId})).first()

    mod_rows = (await db.execute(text("""
        SELECT m.code
        FROM tenant_modules tm
        JOIN modules m ON m.id = tm.moduleId
        WHERE tm.tenantId = :t AND tm.isEnabled = 1
    """), {"t": row.tenantId})).fetchall()
    enabled_mods = [m[0].lower() for m in mod_rows] if mod_rows else []

    sub_data = {
        "planCode": sub_row.planCode if sub_row else "STARTER",
        "planName": sub_row.planName if sub_row else "Starter",
        "status": sub_row.status if sub_row else "ACTIVE",
        "trialEndsAt": str(sub_row.trialEndsAt) if sub_row and sub_row.trialEndsAt else None,
        "enabledModules": enabled_mods,
    }

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
                "role": role_name,
                "roleName": role_name,
                "businessType": row.businessType or "RETAIL",
            },
            "tenant": {
                "id": row.tenantId,
                "slug": row.tenantSlug or "default",
                "name": row.tenantName or "Default Store",
                "businessType": row.businessType or "RETAIL",
            },
            "subscription": sub_data,
        }
    )


@router.get("/api/auth/me")
@router.get("/api/v1/auth/me")
async def get_me(user: AuthUser = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    role = user.roleName or user.role or ""

    sub_row = (await db.execute(text("""
        SELECT s.id, s.status, s.trialEndsAt, p.code as planCode, p.name as planName
        FROM saas_subscriptions s
        JOIN saas_plans p ON p.id = s.planId
        WHERE s.tenantId = :t
        ORDER BY s.createdAt DESC LIMIT 1
    """), {"t": user.tenantId})).first()

    mod_rows = (await db.execute(text("""
        SELECT m.code
        FROM tenant_modules tm
        JOIN modules m ON m.id = tm.moduleId
        WHERE tm.tenantId = :t AND tm.isEnabled = 1
    """), {"t": user.tenantId})).fetchall()
    enabled_mods = [m[0].lower() for m in mod_rows] if mod_rows else []

    sub_data = {
        "planCode": sub_row.planCode if sub_row else "STARTER",
        "planName": sub_row.planName if sub_row else "Starter",
        "status": sub_row.status if sub_row else "ACTIVE",
        "trialEndsAt": str(sub_row.trialEndsAt) if sub_row and sub_row.trialEndsAt else None,
        "enabledModules": enabled_mods,
    }

    return ok({
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "tenantId": user.tenantId,
            "branchId": user.branchId,
            "role": role,
            "roleName": role,
            "businessType": user.businessType,
        },
        "subscription": sub_data,
    })


@router.post("/api/auth/register")
@router.post("/api/v1/auth/register")
async def register(body: dict, db: AsyncSession = Depends(get_db)):
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name = (body.get("name") or body.get("ownerName") or "").strip()
    business_name = (body.get("businessName") or body.get("storeName") or name or "My Store").strip()
    business_type = (body.get("businessType") or "RETAIL").strip().upper()
    phone = (body.get("phone") or "").strip()
    plan_code = (body.get("planCode") or "STARTER").strip().upper()
    if plan_code in ("ADVANCE", "PRO"):
        plan_code = "BUSINESS"
    selected_addons = [str(a).strip().lower() for a in (body.get("selectedAddons") or [])]

    if not email or not password:
        return err("Email and password are required", 400)
    if len(password) < 6:
        return err("Password must be at least 6 characters", 400)

    # Check duplicate email
    dup = (await db.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email})).first()
    if dup:
        return err("An account with this email already exists. Please sign in instead.", 409)

    import uuid, re
    from db import txn
    from security import hash_password
    from app.api.v1.saas.routers_saas import seed_tenant_business_metadata

    tenant_id = str(uuid.uuid4())
    slug_base = re.sub(r'[^a-z0-9]+', '-', business_name.lower()).strip('-') or "store"
    slug = f"{slug_base}-{tenant_id[:6]}"

    async with txn(db):
        # 1. Create Tenant
        await db.execute(text("""
            INSERT INTO tenants (id, name, slug, businessType, status, currency, timezone, createdAt, updatedAt)
            VALUES (:id, :n, :s, :bt, 'ACTIVE', 'BDT', 'Asia/Dhaka', NOW(), NOW())
        """), {"id": tenant_id, "n": business_name, "s": slug, "bt": business_type})

        # 2. Create Company
        company_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT INTO companies (id, tenantId, name, legalName, phone, email, createdAt, updatedAt)
            VALUES (:id, :t, :n, :n, :p, :e, NOW(), NOW())
        """), {"id": company_id, "t": tenant_id, "n": business_name, "p": phone, "e": email})

        # 3. Create Default Owner Role & Cashier Role
        owner_role_id = str(uuid.uuid4())
        cashier_role_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT INTO roles (id, tenantId, name, isSystem, status, createdAt, updatedAt)
            VALUES (:id, :t, 'Owner', 1, 'ACTIVE', NOW(), NOW()),
                   (:cid, :t, 'Cashier', 1, 'ACTIVE', NOW(), NOW())
        """), {"id": owner_role_id, "cid": cashier_role_id, "t": tenant_id})

        # 4. Create Primary Branch & Warehouse
        branch_id = str(uuid.uuid4())
        wh_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT INTO branches (id, tenantId, companyId, code, name, phone, email, status, createdAt, updatedAt)
            VALUES (:id, :t, :c, 'MAIN', 'Main Branch', :p, :e, 'ACTIVE', NOW(), NOW())
        """), {"id": branch_id, "t": tenant_id, "c": company_id, "p": phone, "e": email})

        await db.execute(text("""
            INSERT INTO warehouses (id, tenantId, branchId, code, name, status, createdAt, updatedAt)
            VALUES (:id, :t, :b, 'WH-MAIN', 'Main Warehouse', 'ACTIVE', NOW(), NOW())
        """), {"id": wh_id, "t": tenant_id, "b": branch_id})

        # 5. Create Owner User
        user_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT INTO users (id, tenantId, branchId, name, email, phone, passwordHash, roleId, status, createdAt, updatedAt)
            VALUES (:id, :t, :b, :n, :e, :p, :ph, :r, 'ACTIVE', NOW(), NOW())
        """), {
            "id": user_id, "t": tenant_id, "b": branch_id, "n": name or business_name,
            "e": email, "p": phone, "ph": hash_password(password), "r": owner_role_id
        })

        # 6. Lookup Plan & Create SaaS Subscription (No default free trial)
        plan_row = (await db.execute(text("SELECT id, name, code FROM saas_plans WHERE code = :c LIMIT 1"), {"c": plan_code})).first()
        if not plan_row:
            plan_row = (await db.execute(text("SELECT id, name, code FROM saas_plans WHERE code = 'STARTER' LIMIT 1"))).first()

        payment_details = body.get("paymentDetails")
        request_trial = body.get("requestTrial")

        if payment_details and payment_details.get("trxId"):
            sub_status = "ACTIVE"
            tenant_status = "ACTIVE"
            trial_ends = None
        elif request_trial:
            sub_status = "TRIAL_REQUESTED"
            tenant_status = "PENDING"
            trial_ends = None
        else:
            sub_status = "PENDING_PAYMENT"
            tenant_status = "PENDING"
            trial_ends = None

        sub_id = str(uuid.uuid4())
        await db.execute(text("""
            INSERT INTO saas_subscriptions (id, tenantId, planId, billingCycle, status, trialEndsAt, currentPeriodStart, currentPeriodEnd, createdAt, updatedAt)
            VALUES (:id, :t, :p, 'MONTHLY', :st, :te, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW())
        """), {"id": sub_id, "t": tenant_id, "p": plan_row.id if plan_row else None, "st": sub_status, "te": trial_ends})

        # Update tenant status
        await db.execute(text("UPDATE tenants SET status = :st WHERE id = :t"), {"st": tenant_status, "t": tenant_id})

        # If payment completed through gateway, record initial invoice as PAID
        if payment_details and payment_details.get("trxId"):
            inv_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO saas_invoices (id, tenantId, subscriptionId, amount, status, billingPeriod, createdAt, updatedAt)
                VALUES (:id, :t, :s, :a, 'PAID', 'MONTHLY', NOW(), NOW())
            """), {"id": inv_id, "t": tenant_id, "s": sub_id, "a": float(payment_details.get("amount") or 0)})

        # 7. Configure Tenant Modules based on Plan & Selected Add-ons
        starter_mods = {'dashboard', 'pos', 'sales', 'products', 'inventory', 'cashregister', 'customers', 'invoices', 'payments', 'settings', business_type.lower()}
        advance_mods = starter_mods | {'accounting', 'vat', 'purchasing', 'suppliers', 'credit', 'installments', 'returns', 'promotions', 'commission', 'targets', 'expenses', 'reports', 'delivery', 'appointments'}

        if plan_code in ('BUSINESS', 'ADVANCE'):
            enabled_set = set(advance_mods)
        elif plan_code == 'ENTERPRISE':
            all_m_codes = {m[1].lower() for m in (await db.execute(text("SELECT id, code FROM modules"))).fetchall()}
            enabled_set = set(all_m_codes)
        else:
            enabled_set = set(starter_mods)

        # Include selected add-ons with smart module mapping
        for a in selected_addons:
            a_low = str(a).lower()
            enabled_set.add(a_low)
            if any(k in a_low for k in ('restaurant', 'kds', 'kitchen', 'table', 'qr_menu')):
                enabled_set.add('restaurant')
            if 'ecommerce' in a_low:
                enabled_set.add('ecommerce')
            if any(k in a_low for k in ('pharmacy', 'prescription', 'rx')):
                enabled_set.add('pharmacy')
            if any(k in a_low for k in ('loyalty', 'cashback')):
                enabled_set.add('loyalty')
            if 'hardware' in a_low or 'barcode' in a_low:
                enabled_set.add('inventory')

        mods = (await db.execute(text("SELECT id, code FROM modules"))).fetchall()
        for m in mods:
            m_code = m[1].lower()
            is_en = 1 if (m_code in enabled_set or plan_code == 'ENTERPRISE') else 0
            await db.execute(text("""
                INSERT INTO tenant_modules (id, tenantId, moduleId, isEnabled, createdAt)
                VALUES (UUID(), :t, :m, :en, NOW())
            """), {"t": tenant_id, "m": m[0], "en": is_en})

    token = sign_token({
        "id": user_id,
        "tenantId": tenant_id,
        "branchId": branch_id,
        "name": name or business_name,
        "email": email,
        "roleId": owner_role_id,
        "roleName": "Owner",
        "businessType": business_type,
    })

    return ok({
        "token": token,
        "user": {
            "id": user_id,
            "name": name or business_name,
            "email": email,
            "tenantId": tenant_id,
            "branchId": branch_id,
            "roleId": owner_role_id,
            "role": "Owner",
            "roleName": "Owner",
            "businessType": business_type,
        },
        "tenant": {
            "id": tenant_id,
            "slug": slug,
            "name": business_name,
            "businessType": business_type,
        },
        "subscription": {
            "planCode": plan_row.code if plan_row else "STARTER",
            "planName": plan_row.name if plan_row else "Starter",
            "status": sub_status,
            "trialEndsAt": str(trial_ends) if trial_ends else None,
            "enabledModules": list(enabled_set),
        }
    }, 201)


@router.get("/api/auth/pricing")
@router.get("/api/v1/auth/pricing")
async def get_pricing(db: AsyncSession = Depends(get_db)):
    """Public endpoint: Returns active SaaS plans and industry-specific add-ons dynamically from the database."""
    # 1. Fetch Plans
    plans_res = await db.execute(text("""
        SELECT id, name, code, description, monthlyPrice, yearlyPrice,
               maxUsers, maxBranches, maxWarehouses, maxPOS, maxProducts, maxStorageMB,
               maxAPICallsDaily, maxAIQueriesDaily, isActive
        FROM saas_plans
        WHERE isActive = 1
        ORDER BY monthlyPrice ASC
    """))
    plans = []
    for r in plans_res.fetchall():
        plans.append({
            "id": r.id,
            "name": r.name,
            "code": r.code,
            "description": r.description or "",
            "monthlyPrice": float(r.monthlyPrice or 0),
            "yearlyPrice": float(r.yearlyPrice or 0),
            "maxUsers": r.maxUsers,
            "maxBranches": r.maxBranches,
            "maxWarehouses": r.maxWarehouses,
            "maxPOS": r.maxPOS,
            "maxProducts": r.maxProducts,
            "maxStorageMB": r.maxStorageMB,
            "maxAPICallsDaily": r.maxAPICallsDaily,
            "maxAIQueriesDaily": r.maxAIQueriesDaily,
        })

    # 2. Fetch Add-ons
    addons_res = await db.execute(text("""
        SELECT id, code, name, description, industry, monthlyPrice, yearlyPrice,
               icon, badge, features, sortOrder
        FROM saas_addons
        WHERE isActive = 1
        ORDER BY sortOrder ASC, monthlyPrice ASC
    """))
    addons = []
    for a in addons_res.fetchall():
        feats = a.features
        if isinstance(feats, str):
            try:
                feats = json.loads(feats)
            except Exception:
                feats = []
        elif not feats:
            feats = []
        addons.append({
            "id": a.id,
            "code": a.code,
            "name": a.name,
            "description": a.description or "",
            "industry": a.industry,
            "monthlyPrice": float(a.monthlyPrice or 0),
            "yearlyPrice": float(a.yearlyPrice or 0),
            "icon": a.icon or "Layers",
            "badge": a.badge or "",
            "features": feats,
            "sortOrder": a.sortOrder,
        })

    return ok({"plans": plans, "addons": addons})


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


@router.put("/api/v1/tenant")
@router.post("/api/v1/tenant")
async def update_tenant(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    from db import txn
    from app.api.v1.saas.routers_saas import seed_tenant_business_metadata

    name = (body.get("name") or "").strip()
    business_type = (body.get("businessType") or "").strip().upper()
    currency = (body.get("currency") or "").strip().upper()
    timezone = (body.get("timezone") or "").strip()
    legal_name = (body.get("legalName") or name).strip()
    address = (body.get("address") or "").strip()
    phone = (body.get("phone") or "").strip()
    email = (body.get("email") or "").strip()
    vat_reg_no = (body.get("vatRegNo") or "").strip()

    mapped_bt = business_type
    if "GROCERY" in mapped_bt: mapped_bt = "GROCERY"
    elif "RESTAURANT" in mapped_bt: mapped_bt = "RESTAURANT"
    elif "PHARMACY" in mapped_bt: mapped_bt = "PHARMACY"
    elif "WHOLESALE" in mapped_bt: mapped_bt = "WHOLESALE"
    elif "MANUFACTURING" in mapped_bt: mapped_bt = "MANUFACTURING"
    elif "SALON" in mapped_bt: mapped_bt = "SALON"
    elif "REPAIR" in mapped_bt: mapped_bt = "REPAIR"
    elif "FRANCHISE" in mapped_bt: mapped_bt = "FRANCHISE"
    elif "RETAIL" in mapped_bt: mapped_bt = "RETAIL"

    async with txn(db):
        updates = []
        params: dict = {"t": tenantId}
        if name:
            updates.append("name = :name")
            params["name"] = name
        if mapped_bt:
            updates.append("businessType = :bt")
            params["bt"] = mapped_bt
        if currency:
            updates.append("currency = :currency")
            params["currency"] = currency
        if timezone:
            updates.append("timezone = :timezone")
            params["timezone"] = timezone

        if updates:
            sql = f"UPDATE tenants SET {', '.join(updates)}, updatedAt = NOW() WHERE id = :t"
            await db.execute(text(sql), params)

        # Update company
        comp = (await db.execute(text("SELECT id FROM companies WHERE tenantId = :t LIMIT 1"), {"t": tenantId})).first()
        if comp:
            await db.execute(text("""
                UPDATE companies SET
                    legalName = COALESCE(:ln, legalName),
                    address = COALESCE(:addr, address),
                    phone = COALESCE(:ph, phone),
                    email = COALESCE(:em, email),
                    vatRegNo = COALESCE(:vat, vatRegNo),
                    updatedAt = NOW()
                WHERE id = :cid
            """), {"cid": comp.id, "ln": legal_name or None, "addr": address or None, "ph": phone or None, "em": email or None, "vat": vat_reg_no or None})

    return ok({"message": "Tenant settings updated successfully", "businessType": mapped_bt})


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

    today_total = float(today_sales[1] or 0) if today_sales else 0.0
    today_count = int(today_sales[0] or 0) if today_sales else 0
    total_due = float(dues[0] or 0) if dues else 0.0

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
