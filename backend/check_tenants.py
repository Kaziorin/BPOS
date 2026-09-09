import asyncio
from db import engine
from sqlalchemy import text

async def check():
    async with engine.connect() as conn:
        users = (await conn.execute(text("SELECT u.id, u.name, u.email, u.tenantId, t.name AS tenantName, t.businessType FROM users u LEFT JOIN tenants t ON t.id = u.tenantId"))).fetchall()
        print("=== USERS & TENANTS ===")
        for u in users:
            print(f"User: {u.name} | Email: {u.email} | Tenant: {u.tenantName} | BusinessType: {u.businessType}")
            
        tenants = (await conn.execute(text("SELECT id, name, slug, businessType FROM tenants"))).fetchall()
        print("\n=== ALL TENANTS ===")
        for t in tenants:
            print(f"Tenant: {t.name} | ID: {t.id} | Slug: {t.slug} | BusinessType: {t.businessType}")

if __name__ == "__main__":
    asyncio.run(check())
