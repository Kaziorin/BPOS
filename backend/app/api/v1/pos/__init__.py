"""Module pos API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_pos
router.include_router(routers_pos.router)

__all__ = ["router"]
