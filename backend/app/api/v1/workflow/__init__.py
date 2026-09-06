"""Module workflow API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_workflow
router.include_router(routers_workflow.router)

__all__ = ["router"]
