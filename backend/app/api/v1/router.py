"""Master API v1 router bundling all module-wise routers."""
from __future__ import annotations

import sys
from pathlib import Path
from fastapi import APIRouter

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Import module-wise routers from each domain folder
from app.api.v1.auth import router as auth_router
from app.api.v1.rbac import router as rbac_router
from app.api.v1.catalog import router as catalog_router
from app.api.v1.pos import router as pos_router
from app.api.v1.sales import router as sales_router
from app.api.v1.accounting import router as accounting_router
from app.api.v1.tax import router as tax_router
from app.api.v1.returns import router as returns_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.restaurant import router as restaurant_router
from app.api.v1.reports import router as reports_router
from app.api.v1.hrm import router as hrm_router
from app.api.v1.industry import router as industry_router
from app.api.v1.delivery import router as delivery_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.loyalty import router as loyalty_router
from app.api.v1.workflow import router as workflow_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.documents import router as documents_router
from app.api.v1.ai import router as ai_router
from app.api.v1.saas import router as saas_router
from app.api.v1.omnichannel import router as omnichannel_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.hardware import router as hardware_router
from app.api.v1.realtime import router as realtime_router
from app.api.v1.search import router as search_router
from app.api.v1.localization import router as localization_router
from app.api.v1.audit import router as audit_router
from app.api.v1.system import router as system_router

api_v1_router = APIRouter()

MODULE_ROUTERS = [
    auth_router,
    rbac_router,
    catalog_router,
    pos_router,
    sales_router,
    accounting_router,
    tax_router,
    returns_router,
    inventory_router,
    restaurant_router,
    reports_router,
    hrm_router,
    industry_router,
    delivery_router,
    tasks_router,
    loyalty_router,
    workflow_router,
    notifications_router,
    documents_router,
    ai_router,
    saas_router,
    omnichannel_router,
    integrations_router,
    hardware_router,
    realtime_router,
    search_router,
    localization_router,
    audit_router,
    system_router,
]

for r in MODULE_ROUTERS:
    api_v1_router.include_router(r)

__all__ = ["api_v1_router"]
