"""Module omnichannel API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_omnichannel
router.include_router(routers_omnichannel.router)

__all__ = ["router"]
