"""Module audit API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_audit
router.include_router(routers_audit.router)

__all__ = ["router"]
