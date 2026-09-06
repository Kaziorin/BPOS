"""Module documents API router."""
from fastapi import APIRouter

router = APIRouter()

from . import routers_documents
router.include_router(routers_documents.router)
from . import routers_signatures
router.include_router(routers_signatures.router)
from . import routers_doc_templates
router.include_router(routers_doc_templates.router)

__all__ = ["router"]
