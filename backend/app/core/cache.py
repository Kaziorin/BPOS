"""Caching layer for observable domain-level data with TTL."""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import cache as _c

ALLOWED_NAMESPACES = _c.ALLOWED_NAMESPACES
FINANCIAL_NAMESPACES = _c.FINANCIAL_NAMESPACES
get = _c.get
set = _c.set
invalidate = _c.invalidate
invalidate_namespace = _c.invalidate_namespace
get_stats = _c.get_stats
reset_stats = _c.reset_stats
