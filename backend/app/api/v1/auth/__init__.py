"""Module auth API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_core
router.include_router(routers_core.router)

__all__ = ["router"]
