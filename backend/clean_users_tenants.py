import asyncio
from db import engine
from sqlalchemy import text
from security import hash_password

async def clean_database():
    async with engine.connect() as conn:
        # Find admin@gmail.com
        admin = (await conn.execute(text("SELECT id, name, email, tenantId, passwordHash FROM users WHERE email LIKE 'admin@g%mail.com'"))).first()
        admin_tenant_id = admin.tenantId if admin else None
        
        print("Admin user found:", admin)
        
        # Disable foreign key checks for clean truncation
        await conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        
        # 1. Clean sales, orders, carts, POS holds, payments
        tables_to_clean = [
            "sale_items", "sales", "payments", "pos_sessions", "pos_holds", "pos_hold_items",
            "stock_movements", "stock_transfers", "stock", "stock_alerts",
            "product_variants", "products", "discounts", "promotions", "coupon_usages", "coupons",
            "expenses", "purchases", "purchase_items", "grns", "grn_items"
        ]
        for tbl in tables_to_clean:
            try:
                await conn.execute(text(f"TRUNCATE TABLE {tbl}"))
                print(f"Truncated {tbl}")
            except Exception as e:
                print(f"Could not truncate {tbl}: {e}")

        # 2. Delete all users except admin@gmail.com
        await conn.execute(text("DELETE FROM users WHERE email NOT LIKE 'admin@g%mail.com'"))
        
        # Ensure admin@gmail.com exists with password '123456'
        admin_hash = hash_password("123456")
        admin_exists = (await conn.execute(text("SELECT id, tenantId FROM users WHERE email = 'admin@gmail.com'"))).first()
        
        if admin_exists:
            await conn.execute(text("""
                UPDATE users SET passwordHash = :h, name = 'Super Administrator' WHERE email = 'admin@gmail.com'
            """), {"h": admin_hash})
            t_id = admin_exists.tenantId
        else:
            import uuid
            t_id = str(uuid.uuid4())
            u_id = str(uuid.uuid4())
            await conn.execute(text("""
                INSERT INTO tenants (id, name, slug, businessType, status, currency, timezone, createdAt, updatedAt)
                VALUES (:t, 'Super Admin HQ', 'admin-hq', 'RETAIL', 'ACTIVE', 'BDT', 'Asia/Dhaka', NOW(), NOW())
            """), {"t": t_id})
            await conn.execute(text("""
                INSERT INTO users (id, tenantId, name, email, passwordHash, status, createdAt, updatedAt)
                VALUES (:u, :t, 'Super Administrator', 'admin@gmail.com', :h, 'ACTIVE', NOW(), NOW())
            """), {"u": u_id, "t": t_id, "h": admin_hash})

        # 3. Clean other tenants if they are not admin's tenant
        if t_id:
            await conn.execute(text("DELETE FROM tenants WHERE id != :t"), {"t": t_id})
            await conn.execute(text("DELETE FROM companies WHERE tenantId != :t"), {"t": t_id})
            await conn.execute(text("DELETE FROM branches WHERE tenantId != :t"), {"t": t_id})
            await conn.execute(text("DELETE FROM warehouses WHERE tenantId != :t"), {"t": t_id})

        await conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        await conn.commit()
        
        # Verify remaining users and tenants
        users = (await conn.execute(text("SELECT id, name, email, tenantId FROM users"))).fetchall()
        tenants = (await conn.execute(text("SELECT id, name, slug, businessType FROM tenants"))).fetchall()
        print("\n=== REMAINING USERS ===")
        for u in users:
            print(f"User: {u.name} | Email: {u.email} | Tenant ID: {u.tenantId}")
        print("\n=== REMAINING TENANTS ===")
        for t in tenants:
            print(f"Tenant: {t.name} | Slug: {t.slug} | BusinessType: {t.businessType}")

if __name__ == "__main__":
    asyncio.run(clean_database())
