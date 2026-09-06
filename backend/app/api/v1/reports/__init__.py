"""Module reports API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_reports
router.include_router(routers_reports.router)
from . import routers_reporting
router.include_router(routers_reporting.router)

__all__ = ["router"]
