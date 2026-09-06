"""Module tax API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_tax
router.include_router(routers_tax.router)

__all__ = ["router"]
