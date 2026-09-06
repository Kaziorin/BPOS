"""Module loyalty API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_loyalty
router.include_router(routers_loyalty.router)

__all__ = ["router"]
