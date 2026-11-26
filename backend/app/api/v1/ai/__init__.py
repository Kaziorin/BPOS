"""Module ai API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_ai
from . import routers_sales_intelligence
from . import routers_accounting_assistant
from . import routers_customer_intelligence
from . import routers_pos_assistant

router.include_router(routers_ai.router)
router.include_router(routers_sales_intelligence.router)
router.include_router(routers_accounting_assistant.router)
router.include_router(routers_customer_intelligence.router)
router.include_router(routers_pos_assistant.router)

__all__ = ["router"]
