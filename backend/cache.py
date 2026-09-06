"""TTL caching layer (Prompt 39, §25) — in-process, namespaced, observable.

Cacheable domains (per spec): product catalog, price, tax config, permissions,
branch settings, customer quick-lookup.  **Financial source-of-truth data is
NEVER cached** — only callers listed in ``cache_key``/``ALLOWED_NAMESPACES``
store here, and every entry is tagged with its namespace so the system admin
endpoint can prove no financial namespace exists.

The cache is a plain dict with monotonic-clock expiry + an RLock (we live in an
asyncio process but middleware/workers may touch it from different tasks).
Values are deep-copied on read so callers can never mutate a shared entry.
"""
from __future__ import annotations

import copy
import threading
import time
from typing import Any, Callable

# ── allowed namespaces (whitelist — nothing financial can be cached) ──
# key format:  "<namespace>:<tenantId>:<...>"
ALLOWED_NAMESPACES = {
    "products",    # catalog list/detail (includes prices — spec-cacheable)
    "customers",   # quick-lookup lists only (no live balances in cached rows)
    "price_lists", # pricing config
    "tax",         # tax config read by POS (rules are versioned, TTL-short)
    "permissions", # RBAC permission sets (also in security.py with its own TTL)
    "branches",    # branch settings
}

FINANCIAL_NAMESPACES = {  # documentation / guard — reserved, never used
    "sales", "invoices", "payments", "ledger", "journals", "accounts",
    "gl", "cash", "expenses", "pnl", "balance", "credit",
}

_store: dict[str, tuple[Any, float]] = {}
_lock = threading.RLock()
_hits = 0
_misses = 0
_sets = 0
_evictions = 0  # expired-on-read
_invalidations = 0  # explicit namespace purge

_NAMESPACE_FOR_KEY_CACHE: dict[str, str] = {}


def _namespace_of(key: str) -> str:
    return key.split(":", 1)[0]


def get(key: str) -> Any | None:
    """Return a deep copy of the cached value or None (miss / expired)."""
    global _hits, _misses, _evictions
    now = time.monotonic()
    with _lock:
        entry = _store.get(key)
        if entry is None:
            _misses += 1
            return None
        val, exp = entry
        if now > exp:
            _store.pop(key, None)
            _evictions += 1
            _misses += 1
            return None
        _hits += 1
        return copy.deepcopy(val)


def set(key: str, value: Any, ttl: int) -> None:
    """Store value for ``ttl`` seconds. Namespace must be whitelisted."""
    global _sets
    ns = _namespace_of(key)
    if ns not in ALLOWED_NAMESPACES:
        # Hard guard: financial / unknown namespaces are refused, never cached.
        raise ValueError(
            f"refusing to cache namespace '{ns}' — financial source-of-truth "
            f"data is never cached (allowed: {sorted(ALLOWED_NAMESPACES)})")
    with _lock:
        _store[key] = (copy.deepcopy(value), time.monotonic() + max(1, ttl))
        _sets += 1


def delete(key: str) -> None:
    with _lock:
        _store.pop(key, None)


def invalidate_namespace(ns: str, tenant_id: str | None = None) -> int:
    """Drop every key under ``ns`` (optionally scoped to one tenant).

    Called from the write-path of every cached domain so a catalog/customer/
    tax mutation is visible immediately (never stale).
    """
    global _invalidations
    prefix = f"{ns}:{tenant_id}:" if tenant_id else f"{ns}:"
    with _lock:
        keys = [k for k in _store if k.startswith(prefix)]
        for k in keys:
            _store.pop(k, None)
        _invalidations += len(keys)
        return len(keys)


def clear() -> int:
    """Flush the whole cache (admin action). Returns entries removed."""
    global _invalidations
    with _lock:
        n = len(_store)
        _store.clear()
        _invalidations += n
        return n


def stats() -> dict:
    with _lock:
        namespaces: dict[str, int] = {}
        for k in _store:
            ns = _namespace_of(k)
            namespaces[ns] = namespaces.get(ns, 0) + 1
        total = _hits + _misses
        return {
            "size": len(_store),
            "hits": _hits,
            "misses": _misses,
            "sets": _sets,
            "evictions": _evictions,
            "invalidations": _invalidations,
            "hitRate": round(_hits / total * 100, 1) if total else 0,
            "namespaces": namespaces,
            "financialNamespacesCached": sorted(
                {ns for ns in namespaces if ns in FINANCIAL_NAMESPACES}),
            "ttlSecondsByNamespace": {
                "products": 30, "customers": 20, "price_lists": 60,
                "tax": 60, "permissions": 60, "branches": 60,
            },
        }


def get_or_set(key: str, ttl: int, producer: Callable[[], Any]) -> Any:
    """Classic read-through helper (sync producer)."""
    hit = get(key)
    if hit is not None:
        return hit
    value = producer()
    set(key, value, ttl)
    return value


def cached(ttl: int, namespace: str):
    """Decorator for pure sync functions: cache by arg repr under a namespace.

    Usage:  @cached(ttl=30, namespace="products")
            def load_products(tenant_id, search): ...   # first arg MUST be tenant
    The first positional/keyword arg named ``tenant_id`` is used for scoping so
    an invalidation can target one tenant.
    """
    def deco(fn: Callable):
        def wrapper(*args, **kwargs):
            # extract tenant scope from signature if present
            import inspect
            sig = inspect.signature(fn)
            bound = sig.bind_partial(*args, **kwargs)
            tid = bound.arguments.get("tenant_id") or bound.arguments.get("tenantId")
            scope = f"{tid}:" if tid else ""
            key = f"{namespace}:{scope}{fn.__name__}:{repr(args)}{repr(sorted(kwargs.items()))}"
            hit = get(key)
            if hit is not None:
                return hit
            value = fn(*args, **kwargs)
            set(key, value, ttl)
            return value
        wrapper.__name__ = fn.__name__
        wrapper.__doc__ = fn.__doc__
        return wrapper
    return deco
