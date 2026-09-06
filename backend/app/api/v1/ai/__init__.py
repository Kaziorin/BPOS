"""Module ai API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_ai
router.include_router(routers_ai.router)

__all__ = ["router"]
