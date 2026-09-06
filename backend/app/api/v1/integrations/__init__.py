"""Module integrations API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_webhooks
router.include_router(routers_webhooks.router)
from . import routers_api_keys
router.include_router(routers_api_keys.router)
from . import routers_integrations
router.include_router(routers_integrations.router)

__all__ = ["router"]
