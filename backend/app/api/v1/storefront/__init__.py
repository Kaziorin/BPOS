"""Storefront API module for public E-commerce application."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_storefront
router.include_router(routers_storefront.router)

__all__ = ["router"]
