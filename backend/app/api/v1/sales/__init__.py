"""Module sales API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_business
router.include_router(routers_business.router)
from . import routers_extra
router.include_router(routers_extra.router)

__all__ = ["router"]
