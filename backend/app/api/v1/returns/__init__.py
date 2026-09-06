"""Module returns API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_return
router.include_router(routers_return.router)

__all__ = ["router"]
