"""Security, Rate Limiting, and Observability Middleware."""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import security_middleware as _sec

RateLimitStore = _sec.RateLimitStore
rate_limit_store = _sec.rate_limit_store
detect_sql_injection = _sec.detect_sql_injection
detect_xss = _sec.detect_xss
install_middleware = _sec.install_middleware
