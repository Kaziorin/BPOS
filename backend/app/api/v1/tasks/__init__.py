"""Module tasks API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_tasks
router.include_router(routers_tasks.router)

__all__ = ["router"]
