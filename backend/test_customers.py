import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

engine = create_async_engine('mysql+asyncmy://root:Blue%401234@192.168.181.104:3306/blue_ocean_pos')

async def main():
    async with engine.begin() as conn:
        res = await conn.execute(text('SHOW CREATE TABLE customers'))
        for r in res.fetchall():
            print(r[1])

asyncio.run(main())
