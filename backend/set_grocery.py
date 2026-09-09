import asyncio
from db import engine, AsyncSessionLocal
from sqlalchemy import text
from app.api.v1.saas.routers_saas import seed_tenant_business_metadata

async def main():
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE tenants SET name = 'Green Valley Supermarket', businessType = 'GROCERY' WHERE id = '1798fdaa-84d9-4bd4-903d-02784a398676'"))
        await conn.execute(text("UPDATE users SET name = 'Grocery Admin' WHERE email = 'admin@gmail.com'"))
        print("Tenant updated to GROCERY")

    async with AsyncSessionLocal() as db:
        await seed_tenant_business_metadata(db, '1798fdaa-84d9-4bd4-903d-02784a398676', 'GROCERY')
        await db.commit()
        print("Seeded GROCERY categories and units successfully")

if __name__ == "__main__":
    asyncio.run(main())
