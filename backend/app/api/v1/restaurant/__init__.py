"""Module restaurant API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_restaurant
router.include_router(routers_restaurant.router)

__all__ = ["router"]
