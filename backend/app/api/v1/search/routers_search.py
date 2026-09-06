"""Global Search Engine (Prompt 36, §20).

Unified search across: products, customers, suppliers, invoices, orders,
quotations, payments, employees, repair tickets, serials, batches.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, rows_to_dicts

router = APIRouter()


@router.get("/api/v1/search")
async def global_search(
    q: str = "",
    type: str = "",
    limit: int = Query(20),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Global search across all entity types.

    Query: /api/v1/search?q=burger&type=PRODUCTS
    """
    if not q or len(q) < 1:
        return ok([])

    query = f"%{q}%"
    lim = min(limit, 100)
    results = []
    types_lower = (type or "").upper()

    # Search products
    if not types_lower or types_lower in ("PRODUCTS", "PRODUCT"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, name, sku, barcode, sellingPrice, costPrice, categoryId, 'PRODUCTS' AS entityType "
            "FROM products WHERE tenantId=:t AND (name LIKE :q OR sku LIKE :q OR barcode LIKE :q) "
            "LIMIT :l"), {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search customers
    if not types_lower or types_lower in ("CUSTOMERS", "CUSTOMER"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, name, phone, email, loyaltyPoints, currentDue, 'CUSTOMERS' AS entityType "
            "FROM customers WHERE tenantId=:t AND (name LIKE :q OR phone LIKE :q OR email LIKE :q) "
            "LIMIT :l"), {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search suppliers
    if not types_lower or types_lower in ("SUPPLIERS", "SUPPLIER"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, name, phone, email, company, 'SUPPLIERS' AS entityType "
            "FROM suppliers WHERE tenantId=:t AND (name LIKE :q OR phone LIKE :q OR company LIKE :q) "
            "LIMIT :l"), {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search invoices
    if not types_lower or types_lower in ("INVOICES", "INVOICE"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, invoiceNo, total, paidTotal, status, createdAt, 'INVOICES' AS entityType "
            "FROM invoices WHERE tenantId=:t AND (invoiceNo LIKE :q) LIMIT :l"),
            {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search sales
    if not types_lower or types_lower in ("SALES", "SALE"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, invoiceNo, total, paidTotal, status, saleDate, 'SALES' AS entityType "
            "FROM sales WHERE tenantId=:t AND (invoiceNo LIKE :q) LIMIT :l"),
            {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search sales orders
    if not types_lower or types_lower in ("ORDERS", "ORDER"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, orderNo, total, status, source, createdAt, 'ORDERS' AS entityType "
            "FROM sales_orders WHERE tenantId=:t AND (orderNo LIKE :q) LIMIT :l"),
            {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search quotations
    if not types_lower or types_lower in ("QUOTATIONS", "QUOTATION"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, quotationNo, total, status, createdAt, 'QUOTATIONS' AS entityType "
            "FROM quotations WHERE tenantId=:t AND (quotationNo LIKE :q) LIMIT :l"),
            {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search payments
    if not types_lower or types_lower in ("PAYMENTS", "PAYMENT"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, reference, method, amount, status, paidAt, 'PAYMENTS' AS entityType "
            "FROM payments WHERE tenantId=:t AND (reference LIKE :q) LIMIT :l"),
            {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search employees
    if not types_lower or types_lower in ("EMPLOYEES", "EMPLOYEE"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, name, email, phone, status, 'EMPLOYEES' AS entityType "
            "FROM users WHERE tenantId=:t AND (name LIKE :q OR email LIKE :q) LIMIT :l"),
            {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Search categories
    if not types_lower or types_lower in ("CATEGORIES", "CATEGORY"):
        rows = rows_to_dicts((await db.execute(text(
            "SELECT id, name, 'CATEGORIES' AS entityType "
            "FROM categories WHERE tenantId=:t AND (name LIKE :q) LIMIT :l"),
            {"t": tenantId, "q": query, "l": lim})).fetchall())
        results.extend(rows)

    # Sort: exact matches first, then by entity type priority, limit total
    type_priority = {"PRODUCTS": 0, "CUSTOMERS": 1, "INVOICES": 2, "SALES": 3,
                     "ORDERS": 4, "SUPPLIERS": 5, "EMPLOYEES": 6}
    results.sort(key=lambda r: (
        0 if (r.get("name") or r.get("invoiceNo") or r.get("orderNo") or r.get("quotationNo") or r.get("reference") or "").lower() == q.lower() else
        1 if q.lower() in ((r.get("name") or r.get("invoiceNo") or r.get("orderNo") or r.get("quotationNo") or r.get("reference") or "")).lower() else 2,
        type_priority.get(r.get("entityType", ""), 99)
    ))

    return ok(results[:lim])


@router.get("/api/v1/search/suggestions")
async def search_suggestions(
    q: str = "",
    limit: int = Query(5),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Quick search suggestions for autocomplete."""
    if not q or len(q) < 2:
        return ok([])

    query = f"%{q}%"
    lim = min(limit, 10)

    # Top products + customers
    products = rows_to_dicts((await db.execute(text(
        "SELECT id, name, sku, 'PRODUCT' AS type FROM products "
        "WHERE tenantId=:t AND (name LIKE :q OR sku LIKE :q) LIMIT :l"),
        {"t": tenantId, "q": query, "l": lim})).fetchall())
    customers = rows_to_dicts((await db.execute(text(
        "SELECT id, name, phone, 'CUSTOMER' AS type FROM customers "
        "WHERE tenantId=:t AND (name LIKE :q OR phone LIKE :q) LIMIT :l"),
        {"t": tenantId, "q": query, "l": lim})).fetchall())

    suggestions = (products + customers)[:lim]
    return ok(suggestions)
