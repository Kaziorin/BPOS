"""Module accounting API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_accounting
router.include_router(routers_accounting.router)

__all__ = ["router"]
