"""Module inventory API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_sync
router.include_router(routers_sync.router)

__all__ = ["router"]
