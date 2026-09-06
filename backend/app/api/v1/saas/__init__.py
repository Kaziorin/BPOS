"""Module saas API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_saas
router.include_router(routers_saas.router)

__all__ = ["router"]
