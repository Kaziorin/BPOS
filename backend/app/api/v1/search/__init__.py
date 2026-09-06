"""Module search API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_search
router.include_router(routers_search.router)
from . import routers_import_export
router.include_router(routers_import_export.router)

__all__ = ["router"]
