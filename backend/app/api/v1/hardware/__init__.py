"""Module hardware API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_hardware
router.include_router(routers_hardware.router)

__all__ = ["router"]
