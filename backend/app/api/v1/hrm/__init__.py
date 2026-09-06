"""Module hrm API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_hrm
router.include_router(routers_hrm.router)

__all__ = ["router"]
