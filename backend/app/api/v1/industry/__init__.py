"""Module industry API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_industry
router.include_router(routers_industry.router)

__all__ = ["router"]
