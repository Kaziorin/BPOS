"""Module notifications API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_notify
router.include_router(routers_notify.router)

__all__ = ["router"]
