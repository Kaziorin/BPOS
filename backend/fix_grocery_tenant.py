import asyncio
import uuid
from db import engine
from sqlalchemy import text

async def fix():
    async with engine.connect() as conn:
        # 1. Create or find Grocery Tenant for blueocean@grocery.com
        grocery_tenant = (await conn.execute(text("SELECT id FROM tenants WHERE slug = 'blueocean-grocery' OR name = 'Blue Ocean Supermarket'"))).first()
        if not grocery_tenant:
            g_tenant_id = str(uuid.uuid4())
            await conn.execute(text("""
                INSERT INTO tenants (id, name, slug, businessType, status, currency, timezone, createdAt, updatedAt)
                VALUES (:id, 'Blue Ocean Supermarket', 'blueocean-grocery', 'GROCERY', 'ACTIVE', 'BDT', 'Asia/Dhaka', NOW(), NOW())
            """), {"id": g_tenant_id})
            
            # Company
            comp_id = str(uuid.uuid4())
            await conn.execute(text("""
                INSERT INTO companies (id, tenantId, name, legalName, createdAt, updatedAt)
                VALUES (:id, :t, 'Blue Ocean Supermarket Ltd', 'Blue Ocean Supermarket Ltd', NOW(), NOW())
            """), {"id": comp_id, "t": g_tenant_id})
            
            # Branch
            br_id = str(uuid.uuid4())
            await conn.execute(text("""
                INSERT INTO branches (id, tenantId, companyId, code, name, status, createdAt, updatedAt)
                VALUES (:id, :t, :c, 'MAIN', 'Grocery Main Outlet', 'ACTIVE', NOW(), NOW())
            """), {"id": br_id, "t": g_tenant_id, "c": comp_id})
            
            # Warehouse
            wh_id = str(uuid.uuid4())
            await conn.execute(text("""
                INSERT INTO warehouses (id, tenantId, branchId, code, name, status, createdAt, updatedAt)
                VALUES (:id, :t, :b, 'WH-GROCERY', 'Grocery Main Warehouse', 'ACTIVE', NOW(), NOW())
            """), {"id": wh_id, "t": g_tenant_id, "b": br_id})
            
            # Role
            role_id = str(uuid.uuid4())
            await conn.execute(text("""
                INSERT INTO roles (id, tenantId, name, isSystem, status, createdAt, updatedAt)
                VALUES (:id, :t, 'Cashier', 1, 'ACTIVE', NOW(), NOW())
            """), {"id": role_id, "t": g_tenant_id})
        else:
            g_tenant_id = grocery_tenant[0]

        # Update blueocean@grocery.com to belong to g_tenant_id
        await conn.execute(text("""
            UPDATE users SET tenantId = :t WHERE email = 'blueocean@grocery.com'
        """), {"t": g_tenant_id})
        
        # Verify
        users = (await conn.execute(text("""
            SELECT u.id, u.name, u.email, u.tenantId, t.name AS tenantName, t.businessType 
            FROM users u LEFT JOIN tenants t ON t.id = u.tenantId
            WHERE u.email IN ('blueocean@grocery.com', 'mirpurbranchstaff@restaurant.com', 'tariq@modelpharmacy.com', 'mamun@freshdaily.com')
        """))).fetchall()
        
        print("=== UPDATED USERS & TENANTS ===")
        for u in users:
            print(f"Email: {u.email} | Tenant: {u.tenantName} | BusinessType: {u.businessType}")
            
        await conn.commit()

if __name__ == "__main__":
    asyncio.run(fix())
