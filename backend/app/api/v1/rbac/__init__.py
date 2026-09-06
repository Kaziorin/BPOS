"""Module rbac API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_rbac
router.include_router(routers_rbac.router)

__all__ = ["router"]
