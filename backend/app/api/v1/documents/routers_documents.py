"""Document Management Router (Prompt 29 / §10.28).

Upload, attach, version, list, preview, download, and audit document attachments
for any entity type.  File *metadata* lives in MySQL; the actual bytes land on disk
under ``uploads/<tenantId>/`` — never inline blobs in the primary DB.

Entity types: CUSTOMER, SUPPLIER, INVOICE, PURCHASE, EMPLOYEE, WARRANTY,
PRESCRIPTION, DELIVERY, EXPENSE, SALE, QUOTATION, PURCHASE_ORDER.
"""
from __future__ import annotations

import hashlib
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db, txn
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params

router = APIRouter()

UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), "uploads")

_VALID_ENTITY_TYPES = {
    "CUSTOMER", "SUPPLIER", "INVOICE", "PURCHASE", "EMPLOYEE", "WARRANTY",
    "PRESCRIPTION", "DELIVERY", "EXPENSE", "SALE", "QUOTATION", "PURCHASE_ORDER",
}

# ── helpers ───────────────────────────────────────────────────────────────

def _uid() -> str:
    return str(uuid.uuid4())


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def _safe_filename(name: str) -> str:
    """Strip path components and sanitise."""
    name = os.path.basename(name)
    return name.replace("/", "_").replace("\\", "_") or "file"


async def _audit(db: AsyncSession, tenant_id: str, action: str,
                 attachment_id: str | None, entity_type: str | None,
                 entity_id: str | None, user_id: str | None,
                 ip: str | None = None, details: str | None = None):
    await db.execute(text(
        "INSERT INTO document_audit_log (id, tenantId, attachmentId, action, entityType, "
        "entityId, userId, ipAddress, details) VALUES (:id, :t, :a, :act, :et, :ei, :u, :ip, :d)"),
        {"id": _uid(), "t": tenant_id, "a": attachment_id, "act": action,
         "et": entity_type, "ei": entity_id, "u": user_id, "ip": ip, "d": details})


# ═══════════════════ UPLOAD ═══════════════════

@router.post("/api/v1/documents/upload")
async def upload_document(
    request: Request,
    entityType: str = Form(...),
    entityId: str = Form(...),
    category: str = Form(""),
    description: str = Form(""),
    accessLevel: str = Form("PRIVATE"),
    expiryDate: str = Form(""),
    file: UploadFile = File(...),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    entityType = entityType.upper()
    if entityType not in _VALID_ENTITY_TYPES:
        return err(f"Invalid entityType: {entityType}. Must be one of: {', '.join(sorted(_VALID_ENTITY_TYPES))}", 400)

    # read file bytes
    contents = await file.read()
    file_size = len(contents)
    if file_size > 50 * 1024 * 1024:  # 50 MB limit
        return err("File too large (max 50 MB)", 400)

    # compute SHA-256 for dedup / audit
    sha256 = hashlib.sha256(contents).hexdigest()

    # determine storage path
    att_id = _uid()
    safe_name = _safe_filename(file.filename or "upload")
    date_dir = datetime.utcnow().strftime("%Y/%m")
    rel_dir = os.path.join(tenantId, entityType.lower(), date_dir)
    abs_dir = os.path.join(UPLOAD_ROOT, rel_dir)
    _ensure_dir(abs_dir)
    stored_name = f"{att_id[:8]}_{safe_name}"
    abs_path = os.path.join(abs_dir, stored_name)
    rel_path = os.path.join(rel_dir, stored_name)

    # write file
    with open(abs_path, "wb") as fp:
        fp.write(contents)

    # insert attachment row
    await db.execute(text(
        "INSERT INTO document_attachments "
        "(id, tenantId, entityType, entityId, fileName, originalName, mimeType, fileSize, "
        "filePath, category, description, accessLevel, expiryDate, version, uploadedBy) "
        "VALUES (:id, :t, :et, :ei, :fn, :on, :mt, :fs, :fp, :cat, :desc, :al, :ed, 1, :u)"),
        {"id": att_id, "t": tenantId, "et": entityType, "ei": entityId,
         "fn": stored_name, "on": file.filename, "mt": file.content_type,
         "fs": file_size, "fp": rel_path, "cat": category or None,
         "desc": description or None, "al": accessLevel.upper(),
         "ed": expiryDate or None, "u": user.id})

    # first version row
    await db.execute(text(
        "INSERT INTO document_versions "
        "(id, tenantId, attachmentId, version, fileName, fileSize, filePath, uploadedBy, changeNote) "
        "VALUES (:id, :t, :aid, 1, :fn, :fs, :fp, :u, 'Initial upload')"),
        {"id": _uid(), "t": tenantId, "aid": att_id, "fn": stored_name,
         "fs": file_size, "fp": rel_path, "u": user.id})

    await _audit(db, tenantId, "UPLOAD", att_id, entityType, entityId, user.id)
    await db.commit()

    return ok({"id": att_id, "fileName": stored_name, "originalName": file.filename,
               "fileSize": file_size, "mimeType": file.content_type, "version": 1}, 201)


# ═══════════════════ UPLOAD (JSON — no file, create placeholder/reference) ═══════════════════

@router.post("/api/v1/documents")
async def create_document_ref(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create a document attachment record from a URL or external reference (no file upload)."""
    entityType = (body.get("entityType") or "").upper()
    if entityType not in _VALID_ENTITY_TYPES:
        return err(f"Invalid entityType: {entityType}", 400)
    entity_id = body.get("entityId")
    file_name = body.get("fileName", "document")
    file_path = body.get("filePath", "")
    if not entity_id:
        return err("entityId required", 400)

    att_id = _uid()
    await db.execute(text(
        "INSERT INTO document_attachments "
        "(id, tenantId, entityType, entityId, fileName, originalName, mimeType, fileSize, "
        "filePath, category, description, accessLevel, expiryDate, version, uploadedBy) "
        "VALUES (:id, :t, :et, :ei, :fn, :on, :mt, :fs, :fp, :cat, :desc, :al, :ed, 1, :u)"),
        {"id": att_id, "t": tenantId, "et": entityType, "ei": entity_id,
         "fn": file_name, "on": body.get("originalName", file_name),
         "mt": body.get("mimeType"), "fs": body.get("fileSize", 0),
         "fp": file_path, "cat": body.get("category"),
         "desc": body.get("description"), "al": (body.get("accessLevel") or "PRIVATE").upper(),
         "ed": body.get("expiryDate"), "u": user.id})

    await _audit(db, tenantId, "UPLOAD", att_id, entityType, entity_id, user.id)
    await db.commit()
    return ok({"id": att_id}, 201)


# ═══════════════════ VERSION ═══════════════════

@router.post("/api/v1/documents/{attachmentId}/versions")
async def upload_new_version(
    attachmentId: str,
    request: Request,
    changeNote: str = Form(""),
    file: UploadFile = File(...),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Upload a new version of an existing attachment."""
    att = (await db.execute(text(
        "SELECT * FROM document_attachments WHERE id=:id AND tenantId=:t AND isActive=1"),
        {"id": attachmentId, "t": tenantId})).first()
    if not att:
        return err("Attachment not found", 404)

    contents = await file.read()
    file_size = len(contents)

    # next version number
    cur_ver = att._mapping["version"] if hasattr(att, '_mapping') else 1
    new_ver = cur_ver + 1

    safe_name = _safe_filename(file.filename or "upload")
    att_dir = os.path.dirname(os.path.join(UPLOAD_ROOT, att._mapping["filePath"] if hasattr(att, '_mapping') else ""))
    _ensure_dir(att_dir)
    stored_name = f"{attachmentId[:8]}_v{new_ver}_{safe_name}"
    abs_path = os.path.join(att_dir, stored_name)
    rel_path = os.path.relpath(abs_path, UPLOAD_ROOT)

    with open(abs_path, "wb") as fp:
        fp.write(contents)

    # update attachment
    await db.execute(text(
        "UPDATE document_attachments SET version=:v, fileName=:fn, fileSize=:fs, filePath=:fp, "
        "updatedAt=NOW() WHERE id=:id"),
        {"v": new_ver, "fn": stored_name, "fs": file_size, "fp": rel_path, "id": attachmentId})

    # version row
    await db.execute(text(
        "INSERT INTO document_versions "
        "(id, tenantId, attachmentId, version, fileName, fileSize, filePath, uploadedBy, changeNote) "
        "VALUES (:id, :t, :aid, :v, :fn, :fs, :fp, :u, :cn)"),
        {"id": _uid(), "t": tenantId, "aid": attachmentId, "v": new_ver,
         "fn": stored_name, "fs": file_size, "fp": rel_path,
         "u": user.id, "cn": changeNote or None})

    await _audit(db, tenantId, "VERSION", attachmentId,
                 att._mapping["entityType"], att._mapping["entityId"], user.id,
                 details=f"v{new_ver}")
    await db.commit()

    return ok({"id": attachmentId, "version": new_ver, "fileSize": file_size})


# ═══════════════════ VERSION HISTORY ═══════════════════

@router.get("/api/v1/documents/{attachmentId}/versions")
async def list_versions(
    attachmentId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM document_versions WHERE attachmentId=:a AND tenantId=:t ORDER BY version DESC"),
        {"a": attachmentId, "t": tenantId})).fetchall())
    return ok(rows)


# ═══════════════════ LIST ═══════════════════

@router.get("/api/v1/documents")
async def list_documents(
    entityType: str = "",
    entityId: str = "",
    category: str = "",
    search: str = "",
    page: int = Query(1),
    limit: int = Query(20),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    offset, limit = paginate_params(page, limit)
    where_clauses = ["tenantId=:t", "isActive=1"]
    params: dict = {"t": tenantId, "lim": limit, "off": offset}

    if entityType:
        where_clauses.append("entityType=:et")
        params["et"] = entityType.upper()
    if entityId:
        where_clauses.append("entityId=:ei")
        params["ei"] = entityId
    if category:
        where_clauses.append("category=:cat")
        params["cat"] = category
    if search:
        where_clauses.append("(fileName LIKE :s OR description LIKE :s OR originalName LIKE :s)")
        params["s"] = f"%{search}%"

    where = " AND ".join(where_clauses)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM document_attachments WHERE {where} ORDER BY createdAt DESC LIMIT :lim OFFSET :off"),
        params)).fetchall())
    total = (await db.execute(text(
        f"SELECT COUNT(*) FROM document_attachments WHERE {where}"), params)).first()[0]
    return ok({"items": rows, "total": total, "page": page, "limit": limit})


# ═══════════════════ GET ═══════════════════

@router.get("/api/v1/documents/{attachmentId}")
async def get_document(
    attachmentId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    att = (await db.execute(text(
        "SELECT * FROM document_attachments WHERE id=:id AND tenantId=:t"),
        {"id": attachmentId, "t": tenantId})).first()
    if not att:
        return err("Not found", 404)
    data = dict(att._mapping) if hasattr(att, '_mapping') else {}
    await _audit(db, tenantId, "VIEW", attachmentId, data.get("entityType"),
                 data.get("entityId"), user.id)
    await db.commit()
    return ok(data)


# ═══════════════════ DOWNLOAD ═══════════════════

@router.get("/api/v1/documents/{attachmentId}/download")
async def download_document(
    attachmentId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    att = (await db.execute(text(
        "SELECT * FROM document_attachments WHERE id=:id AND tenantId=:t AND isActive=1"),
        {"id": attachmentId, "t": tenantId})).first()
    if not att:
        return err("Not found", 404)
    data = dict(att._mapping) if hasattr(att, '_mapping') else {}
    abs_path = os.path.join(UPLOAD_ROOT, data["filePath"])
    if not os.path.isfile(abs_path):
        return err("File missing from storage", 404)

    await _audit(db, tenantId, "DOWNLOAD", attachmentId,
                 data.get("entityType"), data.get("entityId"), user.id)
    await db.commit()

    from fastapi.responses import FileResponse
    return FileResponse(abs_path, filename=data.get("originalName") or data["fileName"],
                        media_type=data.get("mimeType") or "application/octet-stream")


# ═══════════════════ UPDATE ═══════════════════

@router.patch("/api/v1/documents/{attachmentId}")
async def update_document(
    attachmentId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    att = (await db.execute(text(
        "SELECT * FROM document_attachments WHERE id=:id AND tenantId=:t"),
        {"id": attachmentId, "t": tenantId})).first()
    if not att:
        return err("Not found", 404)

    fields, params = [], {"id": attachmentId, "t": tenantId}
    for col in ("category", "description", "accessLevel", "expiryDate"):
        if col in body:
            fields.append(f"{col}=:{col}")
            params[col] = body[col]
    if "isActive" in body:
        fields.append("isActive=:active")
        params["active"] = 1 if body["isActive"] else 0
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")

    await db.execute(text(f"UPDATE document_attachments SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await _audit(db, tenantId, "UPDATE", attachmentId, att._mapping["entityType"],
                 att._mapping["entityId"], user.id, details=str(body))
    await db.commit()
    return ok({"updated": True})


# ═══════════════════ DELETE (soft) ═══════════════════

@router.delete("/api/v1/documents/{attachmentId}")
async def delete_document(
    attachmentId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    att = (await db.execute(text(
        "SELECT * FROM document_attachments WHERE id=:id AND tenantId=:t"),
        {"id": attachmentId, "t": tenantId})).first()
    if not att:
        return err("Not found", 404)
    await db.execute(text(
        "UPDATE document_attachments SET isActive=0, updatedAt=NOW() WHERE id=:id"), {"id": attachmentId})
    await _audit(db, tenantId, "DELETE", attachmentId, att._mapping["entityType"],
                 att._mapping["entityId"], user.id)
    await db.commit()
    return ok({"deleted": True})


# ═══════════════════ AUDIT LOG ═══════════════════

@router.get("/api/v1/documents/{attachmentId}/audit")
async def audit_log(
    attachmentId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM document_audit_log WHERE attachmentId=:a AND tenantId=:t ORDER BY createdAt DESC LIMIT 100"),
        {"a": attachmentId, "t": tenantId})).fetchall())
    return ok(rows)


# ═══════════════════ BULK LIST BY ENTITY TYPE ═══════════════════

@router.get("/api/v1/documents/entity/{entityType}/{entityId}")
async def documents_for_entity(
    entityType: str,
    entityId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM document_attachments WHERE tenantId=:t AND entityType=:et AND entityId=:ei "
        "AND isActive=1 ORDER BY createdAt DESC"),
        {"t": tenantId, "et": entityType.upper(), "ei": entityId})).fetchall())
    return ok(rows)
