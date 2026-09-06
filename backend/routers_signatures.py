"""Digital Signature Router (Prompt 29 / §10.28).

Capture, verify, and list digital signatures for any entity.
Supports TYPED, DRAWN (base64 image), and UPLOAD signature types.

Use cases: delivery proof-of-delivery, invoice confirmation,
purchase approval, contract signing, customer acknowledgment, service completion.
"""
from __future__ import annotations

import hashlib
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params

router = APIRouter()

_VALID_ENTITY_TYPES = {
    "DELIVERY", "INVOICE", "PURCHASE", "APPROVAL", "CONTRACT",
    "SERVICE", "CUSTOMER", "SALE", "QUOTATION", "EMPLOYEE", "EXPENSE",
}

_VALID_SIG_TYPES = {"TYPED", "DRAWN", "UPLOAD"}


def _uid() -> str:
    return str(uuid.uuid4())


@router.post("/api/v1/signatures")
async def capture_signature(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Capture a digital signature."""
    entity_type = (body.get("entityType") or "").upper()
    if entity_type not in _VALID_ENTITY_TYPES:
        return err(f"Invalid entityType: {entity_type}", 400)
    entity_id = body.get("entityId")
    signer_name = body.get("signerName")
    sig_data = body.get("signatureData")
    if not entity_id or not signer_name or not sig_data:
        return err("entityId, signerName, and signatureData required", 400)

    sig_type = (body.get("signatureType") or "TYPED").upper()
    if sig_type not in _VALID_SIG_TYPES:
        sig_type = "TYPED"

    # hash the signature data for later verification
    sig_hash = hashlib.sha256(sig_data.encode()).hexdigest()

    sig_id = _uid()
    await db.execute(text(
        "INSERT INTO digital_signatures "
        "(id, tenantId, entityType, entityId, signerName, signerRole, signerEmail, "
        "signatureData, signatureType, ipAddress, deviceInfo) "
        "VALUES (:id, :t, :et, :ei, :sn, :sr, :se, :sd, :st, :ip, :di)"),
        {"id": sig_id, "t": tenantId, "et": entity_type, "ei": entity_id,
         "sn": signer_name, "sr": body.get("signerRole"),
         "se": body.get("signerEmail"), "sd": sig_data, "st": sig_type,
         "ip": body.get("ipAddress"), "di": body.get("deviceInfo")})

    await db.commit()
    return ok({"id": sig_id, "signerName": signer_name, "signatureType": sig_type,
               "signedAt": sig_id[:8], "verified": False}, 201)


@router.get("/api/v1/signatures")
async def list_signatures(
    entityType: str = "",
    entityId: str = "",
    page: int = Query(1),
    limit: int = Query(20),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List signatures, optionally filtered by entity."""
    offset, limit = paginate_params(page, limit)
    where_clauses = ["tenantId=:t"]
    params: dict = {"t": tenantId, "lim": limit, "off": offset}

    if entityType:
        where_clauses.append("entityType=:et")
        params["et"] = entityType.upper()
    if entityId:
        where_clauses.append("entityId=:ei")
        params["ei"] = entityId

    where = " AND ".join(where_clauses)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT id, tenantId, entityType, entityId, signerName, signerRole, signerEmail, "
        f"signatureType, ipAddress, isVerified, signedAt, createdAt "
        f"FROM digital_signatures WHERE {where} ORDER BY signedAt DESC LIMIT :lim OFFSET :off"),
        params)).fetchall())
    total = (await db.execute(text(
        f"SELECT COUNT(*) FROM digital_signatures WHERE {where}"), params)).first()[0]
    return ok({"items": rows, "total": total, "page": page, "limit": limit})


@router.get("/api/v1/signatures/{signatureId}")
async def get_signature(
    signatureId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get signature details (includes the signature data for verification)."""
    row = (await db.execute(text(
        "SELECT * FROM digital_signatures WHERE id=:id AND tenantId=:t"),
        {"id": signatureId, "t": tenantId})).first()
    if not row:
        return err("Not found", 404)
    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    return ok(data)


@router.post("/api/v1/signatures/{signatureId}/verify")
async def verify_signature(
    signatureId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Mark a signature as verified / audit-verified."""
    row = (await db.execute(text(
        "SELECT * FROM digital_signatures WHERE id=:id AND tenantId=:t"),
        {"id": signatureId, "t": tenantId})).first()
    if not row:
        return err("Not found", 404)
    await db.execute(text(
        "UPDATE digital_signatures SET isVerified=1 WHERE id=:id"), {"id": signatureId})
    await db.commit()
    return ok({"verified": True})


@router.get("/api/v1/signatures/entity/{entityType}/{entityId}")
async def signatures_for_entity(
    entityType: str,
    entityId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all signatures for a given entity (shorthand)."""
    rows = rows_to_dicts((await db.execute(text(
        "SELECT id, signerName, signerRole, signatureType, isVerified, signedAt "
        "FROM digital_signatures WHERE tenantId=:t AND entityType=:et AND entityId=:ei "
        "ORDER BY signedAt DESC"),
        {"t": tenantId, "et": entityType.upper(), "ei": entityId})).fetchall())
    return ok(rows)
