"""Module labels API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_labels
router.include_router(routers_labels.router)

__all__ = ["router"]
