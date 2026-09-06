"""Module delivery API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_delivery
router.include_router(routers_delivery.router)

__all__ = ["router"]
