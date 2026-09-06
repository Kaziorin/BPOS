"""Module realtime API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_realtime
router.include_router(routers_realtime.router)

__all__ = ["router"]
