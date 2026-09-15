import asyncio
from db import get_db
from sqlalchemy import text

async def t():
    async for s in get_db():
        res = await s.execute(text("DESCRIBE products"))
        for r in res:
            print(r)
        break

asyncio.run(t())
