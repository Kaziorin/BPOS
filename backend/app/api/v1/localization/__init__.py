"""Module localization API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_currency
router.include_router(routers_currency.router)
from . import routers_localization
router.include_router(routers_localization.router)

__all__ = ["router"]
