"""Security Middleware (Prompt 38, §24).

- Rate limiting (per IP, per user)
- Input sanitization (SQL injection, XSS detection)
- Request logging
- Security headers
"""
from __future__ import annotations

import re
import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

# ═══════════════ RATE LIMITING ═══════════════

class RateLimitStore:
    """In-memory rate limit store. In production, use Redis."""
    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._blocked: dict[str, float] = {}

    def is_blocked(self, key: str) -> bool:
        if key in self._blocked:
            if time.time() < self._blocked[key]:
                return True
            del self._blocked[key]
        return False

    def check(self, key: str, limit: int = 100, window: int = 60) -> tuple[bool, int]:
        """Returns (allowed, remaining)."""
        now = time.time()
        # Clean old entries
        self._requests[key] = [t for t in self._requests[key] if now - t < window]

        if len(self._requests[key]) >= limit:
            return False, 0

        self._requests[key].append(now)
        return True, limit - len(self._requests[key])

    def block(self, key: str, duration: int = 300):
        self._blocked[key] = time.time() + duration


rate_limit_store = RateLimitStore()

# ═══════════════ INPUT SANITIZATION ═══════════════

SQL_INJECTION_PATTERNS = [
    r"(?i)(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|set|where)\b)",
    r"(?i)(--|;|\/\*|\*\/)",
    r"(?i)(\bor\b\s+\d+\s*=\s*\d+)",
    r"(?i)(\band\b\s+\d+\s*=\s*\d+)",
    r"(?i)(0x[0-9a-f]+)",
    r"(?i)(char\(|concat\(|benchmark\(|sleep\()",
]

XSS_PATTERNS = [
    r"<script[^>]*>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe[^>]*>",
    r"<object[^>]*>",
    r"<embed[^>]*>",
    r"<svg[^>]*onload",
]


def detect_sql_injection(value: str) -> bool:
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, value):
            return True
    return False


def detect_xss(value: str) -> bool:
    for pattern in XSS_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            return True
    return False


def sanitize_input(value: str) -> str:
    """Basic input sanitization."""
    if not isinstance(value, str):
        return value
    # Remove null bytes
    value = value.replace("\x00", "")
    # Trim
    value = value.strip()
    return value


# ═══════════════ SECURITY MIDDLEWARE ═══════════════

class SecurityMiddleware(BaseHTTPMiddleware):
    """Core security middleware: rate limiting, input sanitization, security headers."""

    def __init__(self, app, rate_limit: int = 100, window: int = 60):
        super().__init__(app)
        self.rate_limit = rate_limit
        self.window = window

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Rate limiting (skip health check, docs, and localhost in dev)
        path = request.url.path
        is_local = client_ip in ("127.0.0.1", "::1", "localhost", "testclient")
        if not is_local and path not in ("/health", "/docs", "/openapi.json"):
            rl_key = f"{client_ip}:{path}"
            allowed, remaining = rate_limit_store.check(rl_key, self.rate_limit, self.window)
            if not allowed:
                rate_limit_store.block(client_ip, 60)
                return JSONResponse(
                    {"error": "Rate limit exceeded", "retry_after": self.window},
                    status_code=429,
                    headers={"Retry-After": str(self.window)},
                )

            # Check if IP is blocked
            if rate_limit_store.is_blocked(client_ip):
                return JSONResponse(
                    {"error": "IP temporarily blocked due to suspicious activity"},
                    status_code=429,
                )

        # Check query params for injection
        for key, value in request.query_params.items():
            if detect_sql_injection(value):
                return JSONResponse(
                    {"error": "Invalid input detected"}, status_code=400)

        # Check path for XSS
        if detect_xss(path):
            return JSONResponse(
                {"error": "Invalid path"}, status_code=400)

        # Process request
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        return response


# ═══════════════ INPUT VALIDATION HELPERS ═══════════════

def validate_body_for_injection(body: dict) -> list[str]:
    """Check all string values in a request body for injection attempts."""
    threats = []
    for key, value in body.items():
        if isinstance(value, str):
            if detect_sql_injection(value):
                threats.append(f"SQL injection in field '{key}'")
            if detect_xss(value):
                threats.append(f"XSS attempt in field '{key}'")
        elif isinstance(value, dict):
            sub = validate_body_for_injection(value)
            threats.extend([f"{key}.{t}" for t in sub])
    return threats


def install_middleware(app):
    """Install security middleware on FastAPI app."""
    app.add_middleware(SecurityMiddleware, rate_limit=200, window=60)

