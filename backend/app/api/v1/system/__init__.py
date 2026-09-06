"""Module system API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_system
router.include_router(routers_system.router)
from . import routers_backup
router.include_router(routers_backup.router)

__all__ = ["router"]
