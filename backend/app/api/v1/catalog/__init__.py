"""Module catalog API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_catalog
router.include_router(routers_catalog.router)

__all__ = ["router"]
