"""BlueOceans POS API — Python FastAPI backend (full conversion of the TS backend).

Same MySQL DB, same endpoints, same response shapes — the Next.js frontend
works unchanged. Run:  ./venv/bin/uvicorn main:app --port 4000 --reload
"""
from __future__ import annotations

import asyncio
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import db as _db  # noqa: F401  (reflect tables at import)
from routers_core import router as core_router
from routers_rbac import router as rbac_router
from routers_catalog import router as catalog_router
from routers_pos import router as pos_router
from routers_business import router as business_router
from routers_extra import router as extra_router
from routers_accounting import router as accounting_router
from routers_tax import router as tax_router
from routers_return import router as return_router
from routers_sync import router as sync_router
from routers_restaurant import router as restaurant_router
from routers_reports import router as reports_router
from routers_hrm import router as hrm_router
from routers_industry import router as industry_router
from routers_delivery import router as delivery_router
from routers_tasks import router as tasks_router
from routers_loyalty import router as loyalty_router
from routers_workflow import router as workflow_router
from routers_notify import router as notify_router
from routers_documents import router as documents_router
from routers_signatures import router as signatures_router
from routers_doc_templates import router as doc_templates_router
from routers_reporting import router as reporting_router
from routers_ai import router as ai_router
from routers_saas import router as saas_router
from routers_omnichannel import router as omnichannel_router
from routers_webhooks import router as webhooks_router
from routers_api_keys import router as api_keys_router
from routers_integrations import router as integrations_router
from routers_hardware import router as hardware_router
from routers_realtime import router as realtime_router
from routers_search import router as search_router
from routers_import_export import router as import_export_router
from routers_currency import router as currency_router
from routers_localization import router as localization_router
from routers_audit import router as audit_router
from routers_system import router as system_router, record_latency  # Prompt 39/40
from routers_backup import router as backup_router  # Prompt 40: backup & DR
from security_middleware import install_middleware
import jobs as jobs_mod  # Prompt 39: background job queue worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the background-job worker on boot (Prompt 39, §25)."""
    worker_task = await jobs_mod.start_worker()
    try:
        yield
    finally:
        await jobs_mod.stop_worker(worker_task)


app = FastAPI(title="BlueOceans POS API", version="2.0.0-py", docs_url="/docs", lifespan=lifespan)

# CORS origins — comma-separated CORS_ORIGIN env (Prompt 43: production
# domains), defaulting to local dev. e.g. https://pos.example.com,https://app.example.com
_cors = os.getenv("CORS_ORIGIN", "http://localhost:3000,http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router)
app.include_router(rbac_router)
app.include_router(catalog_router)
app.include_router(pos_router)
app.include_router(business_router)
app.include_router(extra_router)
app.include_router(accounting_router)
app.include_router(tax_router)
app.include_router(return_router)
app.include_router(sync_router)
app.include_router(restaurant_router)
app.include_router(reports_router)
app.include_router(hrm_router)
app.include_router(industry_router)
app.include_router(delivery_router)
app.include_router(tasks_router)
app.include_router(loyalty_router)
app.include_router(workflow_router)
app.include_router(notify_router)
app.include_router(documents_router)
app.include_router(signatures_router)
app.include_router(doc_templates_router)
app.include_router(reporting_router)
app.include_router(ai_router)
app.include_router(saas_router)
app.include_router(omnichannel_router)
app.include_router(webhooks_router)
app.include_router(api_keys_router)
app.include_router(integrations_router)
app.include_router(hardware_router)
app.include_router(realtime_router)
app.include_router(search_router)
app.include_router(import_export_router)
app.include_router(currency_router)
app.include_router(localization_router)
app.include_router(audit_router)
app.include_router(system_router)
app.include_router(backup_router)


@app.middleware("http")
async def _timing_middleware(request: Request, call_next):
    """Record per-route latency + status for the observability dashboard
    (Prompt 39 latency, Prompt 40 error-rate)."""
    t0 = time.perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
    finally:
        route = getattr(request.scope.get("route"), "path", None)
        record_latency(route or request.url.path, (time.perf_counter() - t0) * 1000, status)
    return response

# Security middleware
install_middleware(app)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "blue-oceans-pos-api-py", "ts": time.time()}


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    return JSONResponse({"error": str(exc)}, status_code=500)
