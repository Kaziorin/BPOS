"""Shared response helpers and serialization utilities."""
from __future__ import annotations

import json
import time
import uuid
from datetime import date, datetime, timedelta
from datetime import time as dt_time
from decimal import Decimal
from typing import Any

from fastapi.responses import JSONResponse


class ApiJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return json.dumps(
            content,
            default=encode,
            separators=(",", ":"),
        ).encode()


def encode(o: Any) -> Any:
    if isinstance(o, Decimal):
        return float(o)
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    if isinstance(o, dt_time):
        return o.isoformat()
    if isinstance(o, timedelta):
        total = int(o.total_seconds())
        sign = "-" if total < 0 else ""
        total = abs(total)
        h, rem = divmod(total, 3600)
        m, s = divmod(rem, 60)
        return f"{sign}{h:02d}:{m:02d}:{s:02d}"
    if isinstance(o, uuid.UUID):
        return str(o)
    if isinstance(o, bytes):
        return o.decode()
    raise TypeError(f"not JSON serializable: {type(o)}")


def encode_if_needed(v: Any) -> Any:
    if isinstance(v, Decimal):
        return float(v)
    return v


def rows_to_dicts(rows) -> list[dict]:
    out = []
    for r in rows:
        if hasattr(r, "_mapping"):
            out.append({k: encode_if_needed(v) for k, v in r._mapping.items()})
        else:
            out.append(list(r))
    return out


def gen_no(prefix: str) -> str:
    """Generate human-readable sequence numbers (e.g. INV-18F9A7B)."""
    return f"{prefix}-{format(int(time.time() * 1000), 'X')}"


def ok(data: Any, status_code: int = 200, extra: dict | None = None) -> ApiJSONResponse:
    body = {"data": data}
    if extra:
        body.update(extra)
    return ApiJSONResponse(body, status_code=status_code)


def err(message: str, status_code: int = 400) -> ApiJSONResponse:
    return ApiJSONResponse({"error": message}, status_code=status_code)


def paginate_params(page: int = 1, limit: int = 20) -> tuple[int, int]:
    return (max(page, 1) - 1) * limit, max(min(limit, 500), 1)
