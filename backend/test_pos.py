import asyncio
import traceback
from db import get_db
from app.api.v1.pos.routers_pos import pos_confirm
from security import AuthUser

async def test():
    async for session in get_db():
        db = session
        break
    user = AuthUser({"id": "test", "tenantId": "default"})
    body = {"items": [{"productId": "p1", "qty": 1, "unitPrice": 10}], "payments": [{"method": "CASH", "amount": 10}]}
    try:
        await pos_confirm(body, user, "default", db)
        print("Success")
    except Exception:
        traceback.print_exc()

asyncio.run(test())
