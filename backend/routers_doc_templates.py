"""Document Template Router (Prompt 29 / §10.28 / §38 item 26).

Tenant-editable template builder for invoice, quotation, purchase-order, delivery-note,
receipt, and custom document types.  Extends Prompt 11's Invoice Engine into a fully
configurable template system with field selection, branding, layout, header/footer,
and terms & conditions.

Template config JSON structure:
{
  "layout": "A4" | "THERMAL_80MM" | "THERMAL_58MM" | "LETTER",
  "orientation": "portrait" | "landscape",
  "branding": { "logo": "url or data-URI", "primaryColor": "#hex", "companyName": "...",
                 "address": "...", "phone": "...", "email": "...", "website": "..." },
  "fields": [ { "key": "invoiceNo", "label": "Invoice #", "show": true, "position": "header" },
              { "key": "customerName", "label": "Customer", "show": true, "position": "body" },
              ... ],
  "header": { "title": "INVOICE", "subtitle": "Thank you for your business" },
  "footer": { "text": "...", "pageNumbers": true },
  "terms": "Payment due within 30 days...",
  "columns": ["item", "qty", "unitPrice", "total"],
  "showTax": true, "showDiscount": true, "showPaymentInfo": true
}
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db, txn
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts

router = APIRouter()

_VALID_DOC_TYPES = {
    "INVOICE", "QUOTATION", "PURCHASE_ORDER", "DELIVERY_NOTE",
    "RECEIPT", "CONTRACT", "CREDIT_NOTE", "CUSTOM",
}

# ── Default field templates per doc type ────────────────────────────────
_DEFAULT_FIELDS = {
    "INVOICE": [
        {"key": "companyName", "label": "Company", "show": True, "position": "header"},
        {"key": "invoiceNo", "label": "Invoice #", "show": True, "position": "header"},
        {"key": "issueDate", "label": "Date", "show": True, "position": "header"},
        {"key": "dueDate", "label": "Due Date", "show": True, "position": "header"},
        {"key": "customerName", "label": "Bill To", "show": True, "position": "body"},
        {"key": "customerAddress", "label": "Address", "show": True, "position": "body"},
        {"key": "customerPhone", "label": "Phone", "show": True, "position": "body"},
        {"key": "customerEmail", "label": "Email", "show": False, "position": "body"},
        {"key": "items", "label": "Items", "show": True, "position": "table"},
        {"key": "subtotal", "label": "Subtotal", "show": True, "position": "footer"},
        {"key": "discountTotal", "label": "Discount", "show": True, "position": "footer"},
        {"key": "taxTotal", "label": "Tax", "show": True, "position": "footer"},
        {"key": "total", "label": "Total", "show": True, "position": "footer"},
        {"key": "paidTotal", "label": "Paid", "show": True, "position": "footer"},
        {"key": "dueTotal", "label": "Amount Due", "show": True, "position": "footer"},
        {"key": "paymentMethod", "label": "Payment Method", "show": True, "position": "footer"},
        {"key": "notes", "label": "Notes", "show": False, "position": "footer"},
    ],
    "QUOTATION": [
        {"key": "companyName", "label": "Company", "show": True, "position": "header"},
        {"key": "quotationNo", "label": "Quotation #", "show": True, "position": "header"},
        {"key": "issueDate", "label": "Date", "show": True, "position": "header"},
        {"key": "validUntil", "label": "Valid Until", "show": True, "position": "header"},
        {"key": "customerName", "label": "Customer", "show": True, "position": "body"},
        {"key": "items", "label": "Items", "show": True, "position": "table"},
        {"key": "total", "label": "Total", "show": True, "position": "footer"},
        {"key": "terms", "label": "Terms", "show": True, "position": "footer"},
    ],
    "PURCHASE_ORDER": [
        {"key": "companyName", "label": "Company", "show": True, "position": "header"},
        {"key": "orderNo", "label": "PO #", "show": True, "position": "header"},
        {"key": "issueDate", "label": "Date", "show": True, "position": "header"},
        {"key": "supplierName", "label": "Supplier", "show": True, "position": "body"},
        {"key": "supplierAddress", "label": "Supplier Address", "show": True, "position": "body"},
        {"key": "items", "label": "Items", "show": True, "position": "table"},
        {"key": "subtotal", "label": "Subtotal", "show": True, "position": "footer"},
        {"key": "taxTotal", "label": "Tax", "show": True, "position": "footer"},
        {"key": "total", "label": "Total", "show": True, "position": "footer"},
        {"key": "deliveryDate", "label": "Expected Delivery", "show": True, "position": "footer"},
        {"key": "terms", "label": "Terms", "show": True, "position": "footer"},
    ],
}

_DEFAULT_CONFIG = {
    "layout": "A4",
    "orientation": "portrait",
    "branding": {
        "logo": None,
        "primaryColor": "#1a56db",
        "companyName": "",
        "address": "",
        "phone": "",
        "email": "",
        "website": "",
    },
    "fields": [],
    "header": {"title": "", "subtitle": ""},
    "footer": {"text": "", "pageNumbers": True},
    "terms": "",
    "columns": ["item", "qty", "unitPrice", "total"],
    "showTax": True,
    "showDiscount": True,
    "showPaymentInfo": True,
}


def _uid() -> str:
    return str(uuid.uuid4())


def _base_config(doc_type: str) -> dict:
    """Return a fresh default config for a document type."""
    cfg = json.loads(json.dumps(_DEFAULT_CONFIG))
    cfg["fields"] = json.loads(json.dumps(_DEFAULT_FIELDS.get(doc_type, _DEFAULT_FIELDS["INVOICE"])))
    return cfg


# ═══════════════════ LIST ═══════════════════

@router.get("/api/v1/doc-templates")
async def list_templates(
    docType: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if docType:
        where += " AND docType=:dt"
        params["dt"] = docType.upper()
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM document_templates WHERE {where} ORDER BY isDefault DESC, name"),
        params)).fetchall())
    # parse JSON config for each row
    for r in rows:
        if isinstance(r.get("config"), str):
            try:
                r["config"] = json.loads(r["config"])
            except (json.JSONDecodeError, TypeError):
                pass
    return ok(rows)


# ═══════════════════ GET ═══════════════════

@router.get("/api/v1/doc-templates/{templateId}")
async def get_template(
    templateId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT * FROM document_templates WHERE id=:id AND tenantId=:t"),
        {"id": templateId, "t": tenantId})).first()
    if not row:
        return err("Not found", 404)
    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    if isinstance(data.get("config"), str):
        try:
            data["config"] = json.loads(data["config"])
        except (json.JSONDecodeError, TypeError):
            pass
    return ok(data)


# ═══════════════════ CREATE ═══════════════════

@router.post("/api/v1/doc-templates")
async def create_template(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    doc_type = (body.get("docType") or "INVOICE").upper()
    if not name:
        return err("name required", 400)
    if doc_type not in _VALID_DOC_TYPES:
        return err(f"Invalid docType: {doc_type}", 400)

    config = body.get("config") or _base_config(doc_type)
    config_json = json.dumps(config) if isinstance(config, dict) else config

    tmpl_id = _uid()
    is_default = 1 if body.get("isDefault") else 0

    # if marking as default, unset other defaults for this docType
    if is_default:
        await db.execute(text(
            "UPDATE document_templates SET isDefault=0 WHERE tenantId=:t AND docType=:dt"),
            {"t": tenantId, "dt": doc_type})

    await db.execute(text(
        "INSERT INTO document_templates "
        "(id, tenantId, name, docType, config, isActive, isDefault, createdBy) "
        "VALUES (:id, :t, :n, :dt, :cfg, 1, :def, :u)"),
        {"id": tmpl_id, "t": tenantId, "n": name, "dt": doc_type,
         "cfg": config_json, "def": is_default, "u": user.id})

    await db.commit()
    return ok({"id": tmpl_id, "name": name, "docType": doc_type, "isDefault": bool(is_default)}, 201)


# ═══════════════════ UPDATE ═══════════════════

@router.patch("/api/v1/doc-templates/{templateId}")
async def update_template(
    templateId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(text(
        "SELECT * FROM document_templates WHERE id=:id AND tenantId=:t"),
        {"id": templateId, "t": tenantId})).first()
    if not row:
        return err("Not found", 404)

    fields, params = [], {"id": templateId, "t": tenantId}
    if "name" in body:
        fields.append("name=:name")
        params["name"] = body["name"]
    if "config" in body:
        cfg = body["config"]
        fields.append("config=:cfg")
        params["cfg"] = json.dumps(cfg) if isinstance(cfg, dict) else cfg
    if "isActive" in body:
        fields.append("isActive=:active")
        params["active"] = 1 if body["isActive"] else 0
    if "isDefault" in body and body["isDefault"]:
        doc_type = (row._mapping["docType"] if hasattr(row, '_mapping') else row[2])
        await db.execute(text(
            "UPDATE document_templates SET isDefault=0 WHERE tenantId=:t AND docType=:dt AND id!=:id"),
            {"t": tenantId, "dt": doc_type, "id": templateId})
        fields.append("isDefault=1")
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")

    await db.execute(text(
        f"UPDATE document_templates SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


# ═══════════════════ DELETE ═══════════════════

@router.delete("/api/v1/doc-templates/{templateId}")
async def delete_template(
    templateId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(text(
        "DELETE FROM document_templates WHERE id=:id AND tenantId=:t"),
        {"id": templateId, "t": tenantId})
    if res.rowcount == 0:
        return err("Not found", 404)
    await db.commit()
    return ok({"deleted": True})


# ═══════════════════ RENDER ═══════════════════

@router.post("/api/v1/doc-templates/{templateId}/render")
async def render_template(
    templateId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Render a template with supplied data, producing a final document structure
    with all placeholders resolved.  Does NOT generate a PDF — that's the frontend's job.

    Body should contain the entity data to fill:
    { "items": [...], "subtotal": ..., "total": ..., "customerName": ..., etc. }
    """
    row = (await db.execute(text(
        "SELECT * FROM document_templates WHERE id=:id AND tenantId=:t AND isActive=1"),
        {"id": templateId, "t": tenantId})).first()
    if not row:
        return err("Template not found", 404)

    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    config = data.get("config")
    if isinstance(config, str):
        try:
            config = json.loads(config)
        except (json.JSONDecodeError, TypeError):
            config = {}

    # resolve fields from the supplied data
    fields = config.get("fields", [])
    resolved = {}
    for f in fields:
        key = f.get("key", "")
        if f.get("show", True) and key in body:
            resolved[key] = {"label": f.get("label", key), "value": body[key]}
        elif f.get("show", True) and key not in body:
            resolved[key] = {"label": f.get("label", key), "value": None}

    # merge extra data not in template fields (e.g. items array)
    extra = {k: v for k, v in body.items() if k not in resolved}

    return ok({
        "templateId": templateId,
        "name": data.get("name"),
        "docType": data.get("docType"),
        "layout": config.get("layout", "A4"),
        "orientation": config.get("orientation", "portrait"),
        "branding": config.get("branding", {}),
        "header": config.get("header", {}),
        "footer": config.get("footer", {}),
        "terms": config.get("terms", ""),
        "columns": config.get("columns", []),
        "showTax": config.get("showTax", True),
        "showDiscount": config.get("showDiscount", True),
        "showPaymentInfo": config.get("showPaymentInfo", True),
        "fields": resolved,
        "data": extra,
    })


# ═══════════════════ DEFAULT / CLONE ═══════════════════

@router.post("/api/v1/doc-templates/{templateId}/clone")
async def clone_template(
    templateId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Clone a template with a new name."""
    row = (await db.execute(text(
        "SELECT * FROM document_templates WHERE id=:id AND tenantId=:t"),
        {"id": templateId, "t": tenantId})).first()
    if not row:
        return err("Not found", 404)

    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    new_name = body.get("name", f"{data['name']} (Copy)")

    new_id = _uid()
    config = data.get("config")
    if isinstance(config, str):
        config = config  # keep as string

    await db.execute(text(
        "INSERT INTO document_templates "
        "(id, tenantId, name, docType, config, isActive, isDefault, createdBy) "
        "VALUES (:id, :t, :n, :dt, :cfg, 1, 0, :u)"),
        {"id": new_id, "t": tenantId, "n": new_name, "dt": data["docType"],
         "cfg": config, "u": user.id})

    await db.commit()
    return ok({"id": new_id, "name": new_name}, 201)
