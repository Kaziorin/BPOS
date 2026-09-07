"""FastAPI Application Factory (Production Architecture)."""
from __future__ import annotations

import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Ensure root backend dir is on path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.core.middleware import install_middleware
from app.services.job_worker import start_worker, stop_worker
from app.api.v1.router import api_v1_router
from app.api.v1.system.routers_system import record_latency


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: starts background workers on startup."""
    worker_task = await start_worker()
    try:
        yield
    finally:
        await stop_worker(worker_task)


def create_app() -> FastAPI:
    """Build and configure the production FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Rate Limiting & Security Headers
    install_middleware(app)

    # Timing & Observability Middleware
    @app.middleware("http")
    async def timing_middleware(request: Request, call_next):
        t0 = time.perf_counter()
        status = 500
        try:
            response = await call_next(request)
            status = response.status_code
        finally:
            route = getattr(request.scope.get("route"), "path", None)
            record_latency(route or request.url.path, (time.perf_counter() - t0) * 1000, status)
        return response

    # CORS Middleware — MUST be outermost (added last) so all responses get CORS headers
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS_LIST,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount Master API v1 Router
    app.include_router(api_v1_router)

    # Mount Physical Image Storage directory (§ media uploads)
    import os
    from fastapi.staticfiles import StaticFiles

    image_storage_dir = os.path.join(BACKEND_DIR, "image_storage")
    os.makedirs(image_storage_dir, exist_ok=True)
    app.mount("/image_storage", StaticFiles(directory=image_storage_dir), name="image_storage")

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "version": settings.VERSION, "uptime": time.time()}

    return app


app = create_app()
