"""Catalog routers — products, categories, brands, customers, suppliers (Prompts 6-7 parity)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import os
import uuid
from pathlib import Path

import math
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params, ApiJSONResponse
import cache as cache_mod  # Prompt 39: TTL cache (products/customers quick-lookup)
import workflow as wf

router = APIRouter()


# ─────────────────────────── MEDIA UPLOADER ───────────────────────────

@router.post("/api/v1/media/upload")
@router.post("/api/v1/upload/image")
async def upload_image_media(file: UploadFile = File(...)):
    if not file or not file.filename:
        return err("No file uploaded", 400)

    # Save physically to backend/image_storage folder
    backend_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
    storage_dir = os.path.join(backend_dir, "image_storage")
    os.makedirs(storage_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    safe_filename = f"{uuid.uuid4().hex[:12]}{ext.lower()}"
    file_path = os.path.join(storage_dir, safe_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    url = f"http://localhost:4000/image_storage/{safe_filename}"
    return ok({"url": url, "filename": safe_filename, "originalName": file.filename, "size": len(contents)}, 201)


# ─────────────────────────── PRODUCTS ───────────────────────────

@router.get("/api/v1/products")
async def list_products(
    search: str = "", productType: str = "", status: str = "", businessType: str = "",
    page: int = Query(1), limit: int = Query(20),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    # Prompt 39: product catalog list is cached (30s TTL, per tenant + filters).
    cache_key = f"products:{tenantId}:list:{search}|{productType}|{status}|{businessType}|{page}|{limit}"
    hit = cache_mod.get(cache_key)
    if hit is not None:
        return ApiJSONResponse(hit)
    where = "p.tenantId = :t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (p.name LIKE :s OR p.sku LIKE :s OR p.barcode LIKE :s)"
        params["s"] = f"%{search}%"
    if productType:
        where += " AND p.productType = :pt"; params["pt"] = productType
    if businessType:
        where += " AND (p.productType = :bt OR LOWER(p.name) LIKE :bt_s)"
        params["bt"] = businessType
        params["bt_s"] = f"%{businessType.lower()}%"
    if status:
        where += " AND p.status = :st"; params["st"] = status
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    f"SELECT p.id, p.name, p.sku, p.barcode, p.productType, p.costPrice, p.sellingPrice, "
                    f"p.wholesalePrice, p.status, p.createdAt, p.imageUrl, p.manufacturer, p.taxRate, p.warrantyDays, p.description, p.reorderPoint, p.attributes, p.createdBy, "
                    f"c.name AS categoryName, c.id AS categoryId, "
                    f"subc.id AS subCategoryId, subc.name AS subCategoryName, "
                    f"b.id AS brandId, b.name AS brandName, u.id AS unitId, u.name AS unitName, "
                    f"sup.id AS supplierId, sup.name AS supplierName, "
                    f"COALESCE((SELECT SUM(qtyOnHand - qtyReserved) FROM stock WHERE productId = p.id AND tenantId = p.tenantId), 0) AS totalStock "
                    f"FROM products p LEFT JOIN categories c ON c.id = p.categoryId "
                    f"LEFT JOIN categories subc ON subc.id = p.subCategoryId "
                    f"LEFT JOIN brands b ON b.id = p.brandId LEFT JOIN units u ON u.id = p.unitId "
                    f"LEFT JOIN suppliers sup ON sup.id = p.supplierId "
                    f"WHERE {where} ORDER BY p.createdAt DESC LIMIT :lim OFFSET :off"
                ),
                {**params, "lim": lim, "off": off},
            )
        ).fetchall()
    )
    for r in rows:
        cat_id = r.pop("categoryId", None)
        cat_name = r.pop("categoryName", None)
        r["category"] = {"id": cat_id, "name": cat_name} if cat_id or cat_name else None

        subcat_id = r.pop("subCategoryId", None)
        subcat_name = r.pop("subCategoryName", None)
        r["subCategory"] = {"id": subcat_id, "name": subcat_name} if subcat_id or subcat_name else None

        brand_id = r.pop("brandId", None)
        brand_name = r.pop("brandName", None)
        r["brand"] = {"id": brand_id, "name": brand_name} if brand_id or brand_name else None

        unit_id = r.pop("unitId", None)
        unit_name = r.pop("unitName", None)
        r["unit"] = {"id": unit_id, "name": unit_name} if unit_id or unit_name else None

        sup_id = r.pop("supplierId", None)
        sup_name = r.pop("supplierName", None)
        r["supplier"] = {"id": sup_id, "name": sup_name} if sup_id or sup_name else None

        raw_attr = r.get("attributes")
        if raw_attr:
            try:
                import json
                r["attributes"] = json.loads(raw_attr) if isinstance(raw_attr, str) else raw_attr
            except Exception:
                r["attributes"] = {}
        else:
            r["attributes"] = {}

        r["productType"] = r.pop("productType")
        r["costPrice"] = r.pop("costPrice"); r["sellingPrice"] = r.pop("sellingPrice")
        r["wholesalePrice"] = r.pop("wholesalePrice")
        r["totalStock"] = float(r.get("totalStock") or 0)
        r["createdAt"] = r.pop("createdAt")
        r["imageUrl"] = r.get("imageUrl")
        r["_count"] = {"variants": 0, "stockRows": 0}
    total = (await db.execute(text(f"SELECT COUNT(*) FROM products p WHERE {where}"), params)).first()[0]
    body = {"data": rows, "pagination": {"page": page, "limit": lim, "total": total,
                                         "totalPages": (total + lim - 1) // lim}}
    cache_mod.set(cache_key, body, ttl=30)
    return ApiJSONResponse(body)


@router.post("/api/v1/products")
async def create_product(
    body: dict,
    user: AuthUser = Depends(require_permission("products.create")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    name, sku = body.get("name"), body.get("sku")
    if not name or not sku:
        return err("Name and SKU are required", 400)
    dup = (
        await db.execute(text("SELECT id FROM products WHERE tenantId=:t AND (sku=:s OR (barcode=:b AND barcode IS NOT NULL))"),
                          {"t": tenantId, "s": sku, "b": body.get("barcode")})
    ).first()
    if dup:
        return err("Product with this SKU/barcode already exists", 409)
    import json
    await db.execute(
        text(
            "INSERT INTO products (id, tenantId, categoryId, subCategoryId, brandId, unitId, supplierId, name, sku, barcode, "
            "manufacturer, productType, costPrice, sellingPrice, wholesalePrice, minPrice, maxPrice, taxRate, "
            "warrantyDays, description, reorderPoint, imageUrl, attributes, createdBy) "
            "VALUES (UUID(), :t, :c, :subc, :b, :u, :sup, :n, :sku, :bar, :man, :pt, :cp, :sp, :wp, :minp, :maxp, :tax, :war, :d, :rp, :img, :attr, :cb)"
        ),
        {
            "t": tenantId, "c": body.get("categoryId"), "subc": body.get("subCategoryId"), "b": body.get("brandId"), "u": body.get("unitId"),
            "sup": body.get("supplierId"), "n": name, "sku": sku, "bar": body.get("barcode"),
            "man": body.get("manufacturer"), "pt": body.get("productType", "Standard"),
            "cp": body.get("costPrice", 0), "sp": body.get("sellingPrice", 0),
            "wp": body.get("wholesalePrice"), "minp": body.get("minPrice"), "maxp": body.get("maxPrice"),
            "tax": body.get("taxRate"), "war": body.get("warrantyDays"), "d": body.get("description"),
            "rp": body.get("reorderPoint"),
            "img": body.get("imageUrl"),
            "attr": json.dumps(body.get("attributes")) if isinstance(body.get("attributes"), (dict, list)) else body.get("attributes"),
            "cb": user.id,
        },
    )
    await db.commit()
    cache_mod.invalidate_namespace("products", tenantId)
    row = (
        await db.execute(text("SELECT id, name, sku FROM products WHERE tenantId=:t AND sku=:s"), {"t": tenantId, "s": sku})
    ).first()
    return ok({"id": row.id, "name": row.name, "sku": row.sku}, 201)


# ─────────────────────────── CATEGORIES & UNITS ───────────────────────────

@router.get("/api/v1/products/categories")
async def list_categories(
    page: int = Query(None),
    limit: int = Query(None),
    search: str = Query(None),
    status: str = Query(None),
    isMain: bool = Query(None),
    businessType: str = Query(None),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    try:
        await db.execute(text("ALTER TABLE categories ADD COLUMN businessTypes TEXT"))
        await db.commit()
    except Exception:
        pass
    try:
        await db.execute(text("ALTER TABLE categories ADD COLUMN icon VARCHAR(100)"))
        await db.commit()
    except Exception:
        pass

    where = "WHERE tenantId=:t"
    params = {"t": tenantId}
    if search:
        where += " AND LOWER(name) LIKE :s"
        params["s"] = f"%{search.lower()}%"
    if status and status != "ALL":
        where += " AND status = :st"
        params["st"] = status
    if isMain is True:
        where += " AND parentId IS NULL"
    elif isMain is False:
        where += " AND parentId IS NOT NULL"
    if businessType:
        where += " AND (businessTypes IS NULL OR businessTypes = '' OR LOWER(businessTypes) LIKE :bt)"
        params["bt"] = f"%{businessType.lower()}%"

    if page is not None or limit is not None:
        p = max(1, page or 1)
        l = max(1, limit or 25)
        count_res = (await db.execute(text(f"SELECT COUNT(*) FROM categories {where}"), params)).first()
        total = count_res[0] if count_res else 0
        offset = (p - 1) * l
        params["l"] = l
        params["o"] = offset
        rows = rows_to_dicts(
            (await db.execute(text(f"SELECT id, name, parentId, status, businessTypes, icon FROM categories {where} ORDER BY name LIMIT :l OFFSET :o"), params)).fetchall()
        )
        return ok({"data": rows, "total": total, "page": p, "limit": l, "totalPages": math.ceil(total / l) if l > 0 else 1})

    rows = rows_to_dicts(
        (
            await db.execute(
                text(f"SELECT id, name, parentId, status, businessTypes, icon FROM categories {where} ORDER BY name"),
                params,
            )
        ).fetchall()
    )
    return ok(rows)


@router.post("/api/v1/products/categories")
async def create_category(body: dict, user: AuthUser = Depends(require_permission("products.categories.create")),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    dup = (await db.execute(text("SELECT id FROM categories WHERE tenantId=:t AND name=:n"), {"t": tenantId, "n": name})).first()
    if dup: return err("Category already exists", 409)

    b_types = body.get("businessTypes")
    if isinstance(b_types, list):
        b_types_str = ",".join(b_types)
    else:
        b_types_str = str(b_types) if b_types else None

    icon = body.get("icon")

    try:
        await db.execute(text("ALTER TABLE categories ADD COLUMN businessTypes TEXT"))
        await db.commit()
    except Exception:
        pass
    try:
        await db.execute(text("ALTER TABLE categories ADD COLUMN icon VARCHAR(100)"))
        await db.commit()
    except Exception:
        pass

    await db.execute(text("INSERT INTO categories (id, tenantId, name, parentId, businessTypes, icon, createdBy) VALUES (UUID(), :t, :n, :p, :bt, :ic, :u)"),
                     {"t": tenantId, "n": name, "p": body.get("parentId"), "bt": b_types_str, "ic": icon, "u": user.id})
    await db.commit()
    row = (await db.execute(text("SELECT id, name, parentId, businessTypes, icon FROM categories WHERE tenantId=:t AND name=:n ORDER BY createdAt DESC LIMIT 1"),
                     {"t": tenantId, "n": name})).first()
    return ok({"id": row[0] if row else None, "name": name, "businessTypes": b_types_str, "icon": icon, "created": True}, 201)


@router.put("/api/v1/products/categories/{categoryId}")
async def update_category(categoryId: str, body: dict,
                          user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    exists = (await db.execute(text("SELECT id FROM categories WHERE id=:id AND tenantId=:t"), {"id": categoryId, "t": tenantId})).first()
    if not exists:
        return err("Category not found", 404)

    try:
        await db.execute(text("ALTER TABLE categories ADD COLUMN businessTypes TEXT"))
        await db.commit()
    except Exception:
        pass
    try:
        await db.execute(text("ALTER TABLE categories ADD COLUMN icon VARCHAR(100)"))
        await db.commit()
    except Exception:
        pass

    if "businessTypes" in body and isinstance(body["businessTypes"], list):
        body["businessTypes"] = ",".join(body["businessTypes"])

    allowed = {"name": "name", "parentId": "parentId", "status": "status", "description": "description", "businessTypes": "businessTypes", "icon": "icon"}
    sets, params = [], {"id": categoryId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body:
            sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if not sets:
        return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    res = await db.execute(text(f"UPDATE categories SET {', '.join(sets)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Category not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/products/categories/{categoryId}")
async def delete_category(categoryId: str,
                          user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    used = (await db.execute(text("SELECT COUNT(*) FROM products WHERE (categoryId=:id OR subCategoryId=:id) AND tenantId=:t"),
                              {"id": categoryId, "t": tenantId})).first()
    if used[0] > 0:
        await db.execute(text("UPDATE categories SET status='INACTIVE', updatedBy=:u WHERE id=:id AND tenantId=:t"),
                         {"id": categoryId, "t": tenantId, "u": user.id})
        await db.commit()
        return ok({"deleted": False, "deactivated": True, "reason": "Category is used by products"})
    subs = (await db.execute(text("SELECT COUNT(*) FROM categories WHERE parentId=:id AND tenantId=:t"),
                              {"id": categoryId, "t": tenantId})).first()
    if subs[0] > 0:
        await db.execute(text("UPDATE categories SET status='INACTIVE', updatedBy=:u WHERE id=:id AND tenantId=:t"),
                         {"id": categoryId, "t": tenantId, "u": user.id})
        await db.commit()
        return ok({"deleted": False, "deactivated": True, "reason": "Category has sub-categories"})
    res = await db.execute(text("DELETE FROM categories WHERE id=:id AND tenantId=:t"), {"id": categoryId, "t": tenantId})
    await db.commit()
    return ok({"deleted": res.rowcount > 0})


# ─────────────────────────── PRODUCT TYPES ───────────────────────────

DEFAULT_PRODUCT_TYPES = [
    "Standard Product (Physical item)",
    "Combo / Kit (Package deal)",
    "Digital / License (Download)",
    "Service (Labor / Consulting)",
    "Weighted Product (Scale)",
    "Batch Controlled (Lot & Expiry)",
    "Serialized (Unique Serial #)",
]

@router.get("/api/v1/product-types")
async def list_product_types(
    search: str = Query(None),
    status: str = Query(None),
    businessType: str = Query(None),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    try:
        await db.execute(text("ALTER TABLE product_types ADD COLUMN businessTypes TEXT"))
        await db.commit()
    except Exception:
        pass

    try:
        count_res = (await db.execute(text("SELECT COUNT(*) FROM product_types WHERE tenantId=:t"), {"t": tenantId})).first()
        if not count_res or count_res[0] == 0:
            for pt_name in DEFAULT_PRODUCT_TYPES:
                await db.execute(
                    text(
                        "INSERT INTO product_types (id, tenantId, name, status) "
                        "VALUES (UUID(), :t, :n, 'ACTIVE')"
                    ),
                    {"t": tenantId, "n": pt_name}
                )
            await db.commit()
    except Exception as e:
        print("Auto-seed product types warning:", e)

    where = "WHERE tenantId=:t"
    params = {"t": tenantId}
    if search:
        where += " AND LOWER(name) LIKE :s"
        params["s"] = f"%{search.lower()}%"
    if status and status != "ALL":
        where += " AND status = :st"
        params["st"] = status
    if businessType:
        where += " AND (businessTypes IS NULL OR businessTypes = '' OR LOWER(businessTypes) LIKE :bt)"
        params["bt"] = f"%{businessType.lower()}%"

    rows = rows_to_dicts(
        (await db.execute(text(f"SELECT id, name, status, businessTypes, createdAt FROM product_types {where} ORDER BY createdAt ASC"), params)).fetchall()
    )
    return ok(rows)


@router.post("/api/v1/product-types")
async def create_product_type(
    body: dict,
    user: AuthUser = Depends(require_permission("products.create")),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    name = body.get("name")
    if not name:
        return err("Name is required", 400)

    dup = (await db.execute(text("SELECT id FROM product_types WHERE tenantId=:t AND name=:n"), {"t": tenantId, "n": name})).first()
    if dup:
        return err("Product Type with this name already exists", 409)

    b_types = body.get("businessTypes")
    if isinstance(b_types, list):
        b_types_str = ",".join(b_types)
    else:
        b_types_str = str(b_types) if b_types else None

    try:
        await db.execute(text("ALTER TABLE product_types ADD COLUMN businessTypes TEXT"))
        await db.commit()
    except Exception:
        pass

    await db.execute(
        text(
            "INSERT INTO product_types (id, tenantId, name, status, businessTypes, createdBy) "
            "VALUES (UUID(), :t, :n, 'ACTIVE', :bt, :u)"
        ),
        {"t": tenantId, "n": name, "bt": b_types_str, "u": user.id}
    )
    await db.commit()
    row = (await db.execute(text("SELECT id, name, status, businessTypes FROM product_types WHERE tenantId=:t AND name=:n ORDER BY createdAt DESC LIMIT 1"), {"t": tenantId, "n": name})).first()
    return ok({"id": row[0] if row else None, "name": name, "businessTypes": b_types_str, "created": True}, 201)


@router.put("/api/v1/product-types/{typeId}")
async def update_product_type(
    typeId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    exists = (await db.execute(text("SELECT id FROM product_types WHERE id=:id AND tenantId=:t"), {"id": typeId, "t": tenantId})).first()
    if not exists:
        return err("Product Type not found", 404)

    try:
        await db.execute(text("ALTER TABLE product_types ADD COLUMN businessTypes TEXT"))
        await db.commit()
    except Exception:
        pass

    if "businessTypes" in body and isinstance(body["businessTypes"], list):
        body["businessTypes"] = ",".join(body["businessTypes"])

    allowed = {"name": "name", "status": "status", "businessTypes": "businessTypes"}
    sets, params = [], {"id": typeId, "t": tenantId}
    for jk, ck in allowed.items():
        if jk in body:
            sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if not sets:
        return err("Nothing to update", 400)

    res = await db.execute(text(f"UPDATE product_types SET {', '.join(sets)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/product-types/{typeId}")
async def delete_product_type(
    typeId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(text("DELETE FROM product_types WHERE id=:id AND tenantId=:t"), {"id": typeId, "t": tenantId})
    await db.commit()
    return ok({"deleted": res.rowcount > 0})


@router.get("/api/v1/units")
async def list_units(
    page: int = Query(None),
    limit: int = Query(None),
    search: str = Query(None),
    status: str = Query(None),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "WHERE (tenantId=:t OR tenantId IS NULL)"
    params = {"t": tenantId}
    if search:
        where += " AND (LOWER(name) LIKE :s OR LOWER(code) LIKE :s)"
        params["s"] = f"%{search.lower()}%"
    if status and status != "ALL":
        where += " AND status = :st"
        params["st"] = status

    if page is not None or limit is not None:
        p = max(1, page or 1)
        l = max(1, limit or 25)
        count_res = (await db.execute(text(f"SELECT COUNT(*) FROM units {where}"), params)).first()
        total = count_res[0] if count_res else 0
        offset = (p - 1) * l
        params["l"] = l
        params["o"] = offset
        rows = rows_to_dicts(
            (await db.execute(text(f"SELECT id, name, code, status FROM units {where} ORDER BY name LIMIT :l OFFSET :o"), params)).fetchall()
        )
        return ok({"data": rows, "total": total, "page": p, "limit": l, "totalPages": math.ceil(total / l) if l > 0 else 1})

    rows = rows_to_dicts(
        (
            await db.execute(
                text(f"SELECT id, name, code, status FROM units {where} ORDER BY name"),
                params,
            )
        ).fetchall()
    )
    return ok(rows)


@router.get("/api/v1/products/{productId}")
async def get_product(
    productId: str,
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    # Prompt 39: product detail cached 30s per tenant — invalidated on any write.
    cache_key = f"products:{tenantId}:{productId}"
    hit = cache_mod.get(cache_key)
    if hit is not None:
        return ApiJSONResponse(hit)
    r = (
        await db.execute(
            text(
                "SELECT p.*, c.name AS cat_name, subc.name AS subcat_name, b.name AS brandName, u.name AS unitName, sup.name AS supplierName "
                "FROM products p LEFT JOIN categories c ON c.id=p.categoryId LEFT JOIN categories subc ON subc.id=p.subCategoryId "
                "LEFT JOIN brands b ON b.id=p.brandId LEFT JOIN units u ON u.id=p.unitId LEFT JOIN suppliers sup ON sup.id=p.supplierId "
                "WHERE p.id=:id AND p.tenantId=:t"
            ),
            {"id": productId, "t": tenantId},
        )
    ).first()
    if not r:
        return err("Product not found", 404)
    d = dict(r._mapping)
    for k_old, k_new in [("productType", "productType"), ("costPrice", "costPrice"), ("sellingPrice", "sellingPrice"),
                          ("wholesalePrice", "wholesalePrice"), ("minPrice", "minPrice"), ("maxPrice", "maxPrice"),
                          ("taxRate", "taxRate"), ("warrantyDays", "warrantyDays"), ("createdAt", "createdAt")]:
        d[k_new] = d.pop(k_old, None)
    cat_id = d.pop("categoryId", None)
    cat_name = d.pop("cat_name", None)
    d["category"] = {"id": cat_id, "name": cat_name} if cat_id or cat_name else None

    subcat_id = d.pop("subCategoryId", None)
    subcat_name = d.pop("subcat_name", None)
    d["subCategory"] = {"id": subcat_id, "name": subcat_name} if subcat_id or subcat_name else None

    brand_id = d.pop("brandId", None)
    brand_name = d.pop("brandName", None)
    d["brand"] = {"id": brand_id, "name": brand_name} if brand_id or brand_name else None

    unit_id = d.pop("unitId", None)
    unit_name = d.pop("unitName", None)
    d["unit"] = {"id": unit_id, "name": unit_name} if unit_id or unit_name else None

    sup_id = d.pop("supplierId", None)
    sup_name = d.pop("supplierName", None)
    d["supplier"] = {"id": sup_id, "name": sup_name} if sup_id or sup_name else None
    variants = rows_to_dicts(
        (
            await db.execute(
                text("SELECT id, name, sku, barcode, costPrice, sellingPrice, wholesalePrice, minPrice, maxPrice, status "
                     "FROM product_variants WHERE tenantId=:t AND productId=:id"),
                {"t": tenantId, "id": productId},
            )
        ).fetchall()
    )
    stock = rows_to_dicts(
        (
            await db.execute(
                text("SELECT s.*, w.name AS warehouseName, w.code AS wh_code FROM stock s JOIN warehouses w ON w.id=s.warehouseId "
                     "WHERE s.tenantId=:t AND s.productId=:id"),
                {"t": tenantId, "id": productId},
            )
        ).fetchall()
    )
    body = {"data": {**d, "variants": variants, "stockRows": stock,
                    "_count": {"variants": len(variants), "stockRows": len(stock)}}}
    cache_mod.set(cache_key, body, ttl=30)
    return ApiJSONResponse(body)


@router.put("/api/v1/products/{productId}")
async def update_product(
    productId: str,
    body: dict,
    user: AuthUser = Depends(require_permission("products.edit")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    exists = (
        await db.execute(text("SELECT id FROM products WHERE id=:id AND tenantId=:t"), {"id": productId, "t": tenantId})
    ).first()
    if not exists:
        return err("Product not found", 404)
    if "attributes" in body and isinstance(body["attributes"], (dict, list)):
        import json
        body["attributes"] = json.dumps(body["attributes"])
    allowed = {"name": "name", "categoryId": "categoryId", "subCategoryId": "subCategoryId", "brandId": "brandId", "unitId": "unitId",
               "supplierId": "supplierId", "barcode": "barcode", "manufacturer": "manufacturer",
               "productType": "productType", "costPrice": "costPrice", "sellingPrice": "sellingPrice",
               "wholesalePrice": "wholesalePrice", "minPrice": "minPrice", "maxPrice": "maxPrice",
               "taxRate": "taxRate", "warrantyDays": "warrantyDays", "description": "description",
               "imageUrl": "imageUrl", "status": "status", "attributes": "attributes"}
    sets, params = [], {"id": productId, "t": tenantId, "u": user.id}
    # ── Prompt 27 price approval: big price moves need manager sign-off (§10.26) ──
    price_keys = ["sellingPrice", "wholesalePrice", "costPrice"]
    proposed_prices = {k: body[k] for k in price_keys if k in body and body[k] is not None}
    if proposed_prices:
        cur = (await db.execute(text(
            "SELECT name, sku, sellingPrice, wholesalePrice, costPrice FROM products WHERE id=:id AND tenantId=:t"),
            {"id": productId, "t": tenantId})).first()
        if cur:
            delta = 0.0
            for k in price_keys:
                if k in proposed_prices:
                    old = float(cur[2] if k == "sellingPrice" else cur[3] if k == "wholesalePrice" else cur[4] or 0)
                    delta = max(delta, abs(float(proposed_prices[k]) - old))
            apr = await wf.create_approval(
                db, tenantId, "PRICE_CHANGE", productId, cur[1],
                f"Price change on {cur[0]} (৳{delta:,.0f})", delta,
                {"productId": productId, "prices": proposed_prices, "delta": delta}, user.id)
            if apr:
                await db.commit()
                cache_mod.invalidate_namespace("products", tenantId)
                return ok({"updated": False, "needsApproval": True, "approval": apr}, 202)
    for jk, ck in allowed.items():
        if jk in body:
            sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if sets:
        sets.append("updatedBy = :u")
        await db.execute(text(f"UPDATE products SET {', '.join(sets)} WHERE id = :id AND tenantId = :t"), params)
        await db.commit()
        cache_mod.invalidate_namespace("products", tenantId)
    return ok({"updated": True})


@router.delete("/api/v1/products/{productId}")
async def delete_product(
    productId: str,
    user: AuthUser = Depends(require_permission("products.delete")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    used = (
        await db.execute(text("SELECT COUNT(*) FROM sale_items WHERE productId=:id"), {"id": productId})
    ).first()
    if used[0] > 0:
        await db.execute(text("UPDATE products SET status='INACTIVE' WHERE id=:id AND tenantId=:t"), {"id": productId, "t": tenantId})
        await db.commit()
        cache_mod.invalidate_namespace("products", tenantId)
        return ok({"deleted": False, "deactivated": True, "reason": "has sales"})
    res = await db.execute(text("DELETE FROM products WHERE id=:id AND tenantId=:t"), {"id": productId, "t": tenantId})
    await db.commit()
    cache_mod.invalidate_namespace("products", tenantId)
    return ok({"deleted": res.rowcount > 0})


# ─────────────────────────── BRANDS ───────────────────────────


@router.get("/api/v1/brands")
async def list_brands(
    page: int = Query(None),
    limit: int = Query(None),
    search: str = Query(None),
    status: str = Query(None),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "WHERE tenantId=:t"
    params = {"t": tenantId}
    if search:
        where += " AND LOWER(name) LIKE :s"
        params["s"] = f"%{search.lower()}%"
    if status and status != "ALL":
        where += " AND status = :st"
        params["st"] = status

    if page is not None or limit is not None:
        p = max(1, page or 1)
        l = max(1, limit or 25)
        count_res = (await db.execute(text(f"SELECT COUNT(*) FROM brands {where}"), params)).first()
        total = count_res[0] if count_res else 0
        offset = (p - 1) * l
        params["l"] = l
        params["o"] = offset
        rows = rows_to_dicts(
            (await db.execute(text(f"SELECT id, name, status FROM brands {where} ORDER BY name LIMIT :l OFFSET :o"), params)).fetchall()
        )
        return ok({"data": rows, "total": total, "page": p, "limit": l, "totalPages": math.ceil(total / l) if l > 0 else 1})

    rows = rows_to_dicts(
        (await db.execute(text(f"SELECT id, name, status FROM brands {where} ORDER BY name"), params)).fetchall()
    )
    return ok(rows)


@router.post("/api/v1/brands")
async def create_brand(body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Brand name is required", 400)
    dup = (await db.execute(text("SELECT id FROM brands WHERE tenantId=:t AND name=:n"), {"t": tenantId, "n": name})).first()
    if dup: return err("Brand already exists", 409)
    await db.execute(text("INSERT INTO brands (id, tenantId, name, status, createdBy) VALUES (UUID(), :t, :n, 'ACTIVE', :u)"),
                     {"t": tenantId, "n": name, "u": user.id})
    await db.commit()
    row = (await db.execute(text("SELECT id, name FROM brands WHERE tenantId=:t AND name=:n"), {"t": tenantId, "n": name})).first()
    return ok({"id": row[0], "name": row[1], "created": True}, 201)


@router.put("/api/v1/brands/{brandId}")
async def update_brand(brandId: str, body: dict,
                       user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    exists = (await db.execute(text("SELECT id FROM brands WHERE id=:id AND tenantId=:t"), {"id": brandId, "t": tenantId})).first()
    if not exists:
        return err("Brand not found", 404)
    allowed = {"name": "name", "status": "status"}
    sets, params = [], {"id": brandId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body:
            sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if not sets:
        return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    res = await db.execute(text(f"UPDATE brands SET {', '.join(sets)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Brand not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/brands/{brandId}")
async def delete_brand(brandId: str,
                       user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    used = (await db.execute(text("SELECT COUNT(*) FROM products WHERE brandId=:id AND tenantId=:t"),
                              {"id": brandId, "t": tenantId})).first()
    if used[0] > 0:
        await db.execute(text("UPDATE brands SET status='INACTIVE', updatedBy=:u WHERE id=:id AND tenantId=:t"),
                         {"id": brandId, "t": tenantId, "u": user.id})
        await db.commit()
        return ok({"deleted": False, "deactivated": True, "reason": "Brand is used by products"})
    res = await db.execute(text("DELETE FROM brands WHERE id=:id AND tenantId=:t"), {"id": brandId, "t": tenantId})
    await db.commit()
    return ok({"deleted": res.rowcount > 0})


@router.post("/api/v1/units")
async def create_unit(body: dict, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name, code = body.get("name"), body.get("code") or body.get("name", "").lower()[:10]
    if not name: return err("Unit name is required", 400)
    dup = (await db.execute(text("SELECT id FROM units WHERE tenantId=:t AND name=:n"), {"t": tenantId, "n": name})).first()
    if dup: return err("Unit already exists", 409)
    await db.execute(text("INSERT INTO units (id, tenantId, name, code, status, createdBy) VALUES (UUID(), :t, :n, :c, 'ACTIVE', :u)"),
                     {"t": tenantId, "n": name, "c": code, "u": user.id})
    await db.commit()
    row = (await db.execute(text("SELECT id, name, code FROM units WHERE tenantId=:t AND name=:n"), {"t": tenantId, "n": name})).first()
    return ok({"id": row[0], "name": row[1], "code": row[2], "created": True}, 201)


@router.put("/api/v1/units/{unitId}")
async def update_unit(unitId: str, body: dict,
                      user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    exists = (await db.execute(text("SELECT id FROM units WHERE id=:id AND tenantId=:t"), {"id": unitId, "t": tenantId})).first()
    if not exists:
        return err("Unit not found", 404)
    allowed = {"name": "name", "code": "code", "status": "status"}
    sets, params = [], {"id": unitId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body:
            sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if not sets:
        return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    res = await db.execute(text(f"UPDATE units SET {', '.join(sets)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Unit not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/units/{unitId}")
async def delete_unit(unitId: str,
                      user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    used = (await db.execute(text("SELECT COUNT(*) FROM products WHERE unitId=:id AND tenantId=:t"),
                              {"id": unitId, "t": tenantId})).first()
    if used[0] > 0:
        await db.execute(text("UPDATE units SET status='INACTIVE', updatedBy=:u WHERE id=:id AND tenantId=:t"),
                         {"id": unitId, "t": tenantId, "u": user.id})
        await db.commit()
        return ok({"deleted": False, "deactivated": True, "reason": "Unit is used by products"})
    res = await db.execute(text("DELETE FROM units WHERE id=:id AND tenantId=:t"), {"id": unitId, "t": tenantId})
    await db.commit()
    return ok({"deleted": res.rowcount > 0})


# ─────────────────────────── CUSTOMERS ───────────────────────────

@router.get("/api/v1/customers")
async def list_customers(
    search: str = "", segmentation: str = "", groupId: str = "", status: str = "",
    page: int = Query(1), limit: int = Query(20),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    # Prompt 39: customer quick-lookup cached 20s per tenant + filters.
    cache_key = f"customers:{tenantId}:list:{search}|{segmentation}|{groupId}|{status}|{page}|{limit}"
    hit = cache_mod.get(cache_key)
    if hit is not None:
        return ApiJSONResponse(hit)
    where = "c.tenantId = :t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (c.name LIKE :s OR c.phone LIKE :s OR c.email LIKE :s)"; params["s"] = f"%{search}%"
    if segmentation: where += " AND c.segmentation = :seg"; params["seg"] = segmentation
    if groupId: where += " AND c.groupId = :g"; params["g"] = groupId
    if status: where += " AND c.status = :st"; params["st"] = status
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    f"SELECT c.*, g.name AS group_name, "
                    f"(SELECT COUNT(*) FROM sales s WHERE s.customerId = c.id) salesCount "
                    f"FROM customers c LEFT JOIN customer_groups g ON g.id = c.groupId "
                    f"WHERE {where} ORDER BY c.createdAt DESC LIMIT :lim OFFSET :off"
                ),
                {**params, "lim": lim, "off": off},
            )
        ).fetchall()
    )
    for r in rows:
        r["group"] = {"id": r.pop("groupId"), "name": r.pop("group_name")} if r.get("group_name") else None
        r["_count"] = {"sales": r.pop("salesCount"), "invoices": 0, "complaints": 0}
    total = (await db.execute(text(f"SELECT COUNT(*) FROM customers c WHERE {where}"), params)).first()[0]
    body = {"data": rows, "pagination": {"page": page, "limit": lim, "total": total,
                                         "totalPages": (total + lim - 1) // lim}}
    cache_mod.set(cache_key, body, ttl=20)
    return ApiJSONResponse(body)


@router.post("/api/v1/customers")
async def create_customer(
    body: dict, user: AuthUser = Depends(require_permission("customers.create")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    phone = body.get("phone")
    if phone:
        dup = (await db.execute(text("SELECT id FROM customers WHERE tenantId=:t AND phone=:p"), {"t": tenantId, "p": phone})).first()
        if dup: return err("Customer with this phone already exists", 409)
    await db.execute(
        text(
            "INSERT INTO customers (id, tenantId, name, phone, email, address, city, dateOfBirth, gender, taxRegNo, "
            "groupId, segmentation, creditLimit, creditPeriodDays, openingDue, currentDue, notes, createdBy) "
            "VALUES (UUID(), :t, :n, :p, :e, :a, :c, :dob, :g, :tax, :gr, :seg, :cl, :cp, :od, :od, :notes, :u)"
        ),
        {"t": tenantId, "n": name, "p": phone, "e": body.get("email"), "a": body.get("address"), "c": body.get("city"),
         "dob": body.get("dateOfBirth"), "g": body.get("gender"), "tax": body.get("taxRegNo"), "gr": body.get("groupId"),
         "seg": body.get("segmentation", "NEW"), "cl": body.get("creditLimit", 0), "cp": body.get("creditPeriodDays"),
         "od": body.get("openingDue", 0), "notes": body.get("notes"), "u": user.id},
    )
    await db.commit()
    cache_mod.invalidate_namespace("customers", tenantId)
    return ok({"created": True, "name": name}, 201)


@router.get("/api/v1/customers/{customerId}")
async def get_customer(customerId: str, tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (
        await db.execute(
            text(
                "SELECT c.*, g.name AS group_name FROM customers c LEFT JOIN customer_groups g ON g.id=c.groupId "
                "WHERE c.id=:id AND c.tenantId=:t"
            ),
            {"id": customerId, "t": tenantId},
        )
    ).first()
    if not r: return err("Customer not found", 404)
    d = dict(r._mapping)
    d["group"] = {"id": d.pop("groupId"), "name": d.pop("group_name")} if d.get("group_name") else None
    notes = rows_to_dicts(
        (await db.execute(text("SELECT * FROM customer_notes WHERE customerId=:id ORDER BY createdAt DESC LIMIT 20"), {"id": customerId})).fetchall()
    )
    complaints = rows_to_dicts(
        (await db.execute(text("SELECT * FROM customer_complaints WHERE customerId=:id ORDER BY createdAt DESC LIMIT 20"), {"id": customerId})).fetchall()
    )
    sales_agg = (
        await db.execute(
            text("SELECT COUNT(*) c, COALESCE(SUM(total),0) s FROM sales WHERE customerId=:id AND status != 'CANCELLED'"),
            {"id": customerId},
        )
    ).first()
    recent = rows_to_dicts(
        (
            await db.execute(
                text("SELECT id, invoiceNo, total, status, createdAt FROM sales WHERE tenantId=:t AND customerId=:id ORDER BY createdAt DESC LIMIT 10"),
                {"t": tenantId, "id": customerId},
            )
        ).fetchall()
    )
    return ok({**d, "customerNotes": notes, "complaints": complaints,
               "purchaseHistory": {"totalSpent": float(sales_agg.s or 0), "totalOrders": sales_agg.c},
               "recentSales": recent, "_count": {"sales": sales_agg.c, "invoices": 0, "complaints": len(complaints)}})


@router.put("/api/v1/customers/{customerId}")
async def update_customer(customerId: str, body: dict,
                          user: AuthUser = Depends(require_permission("customers.edit")),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    allowed = {"name": "name", "phone": "phone", "email": "email", "address": "address", "city": "city",
               "segmentation": "segmentation", "groupId": "groupId", "creditLimit": "creditLimit",
               "creditPeriodDays": "creditPeriodDays", "currentDue": "currentDue", "walletBalance": "walletBalance",
               "storeCredit": "storeCredit", "loyaltyPoints": "loyaltyPoints", "notes": "notes", "status": "status"}
    sets, params = [], {"id": customerId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body: sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if not sets: return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    res = await db.execute(text(f"UPDATE customers SET {', '.join(sets)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    cache_mod.invalidate_namespace("customers", tenantId)
    if res.rowcount == 0: return err("Customer not found", 404)
    return ok({"updated": True})


@router.post("/api/v1/customers/{customerId}/notes")
async def add_note(customerId: str, body: dict,
                   user: AuthUser = Depends(require_permission("customers.edit")),
                   tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    note = body.get("note")
    if not note: return err("Note is required", 400)
    await db.execute(
        text("INSERT INTO customer_notes (id, tenantId, customerId, note, createdBy, updatedAt) VALUES (UUID(), :t, :id, :n, :u, NOW())"),
        {"t": tenantId, "id": customerId, "n": note, "u": user.id},
    )
    await db.commit()
    return ok({"created": True}, 201)


@router.post("/api/v1/customers/{customerId}/complaints")
async def add_complaint(customerId: str, body: dict,
                        user: AuthUser = Depends(require_permission("customers.edit")),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    subject = body.get("subject")
    if not subject: return err("Subject is required", 400)
    await db.execute(
        text(
            "INSERT INTO customer_complaints (id, tenantId, customerId, subject, description, priority, createdBy) "
            "VALUES (UUID(), :t, :id, :s, :d, :p, :u)"
        ),
        {"t": tenantId, "id": customerId, "s": subject, "d": body.get("description"),
         "p": body.get("priority", "MEDIUM"), "u": user.id},
    )
    await db.commit()
    return ok({"created": True}, 201)


@router.get("/api/v1/customer-groups")
async def list_customer_groups(tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts(
        (
            await db.execute(
                text("SELECT g.*, (SELECT COUNT(*) FROM customers c WHERE c.groupId = g.id) customerCount "
                     "FROM customer_groups g WHERE g.tenantId=:t ORDER BY g.name"),
                {"t": tenantId},
            )
        ).fetchall()
    )
    for r in rows:
        r["_count"] = {"customers": r.pop("customerCount")}
    return ok(rows)


# ─────────────────────────── SUPPLIERS ───────────────────────────

@router.get("/api/v1/suppliers")
async def list_suppliers(
    search: str = "", status: str = "", page: int = Query(1), limit: int = Query(20),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    where = "s.tenantId = :t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (s.name LIKE :q OR s.company LIKE :q OR s.phone LIKE :q)"; params["q"] = f"%{search}%"
    if status: where += " AND s.status = :st"; params["st"] = status
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    f"SELECT s.*, (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplierId = s.id) poCount, "
                    f"(SELECT COUNT(*) FROM products p WHERE p.supplierId = s.id) productCount "
                    f"FROM suppliers s WHERE {where} ORDER BY s.createdAt DESC LIMIT :lim OFFSET :off"
                ),
                {**params, "lim": lim, "off": off},
            )
        ).fetchall()
    )
    for r in rows:
        r["_count"] = {"purchaseOrders": r.pop("poCount"), "goodsReceipts": 0, "products": r.pop("productCount")}
    total = (await db.execute(text(f"SELECT COUNT(*) FROM suppliers s WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.post("/api/v1/suppliers")
async def create_supplier(body: dict, user: AuthUser = Depends(require_permission("suppliers.create")),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    dup = (await db.execute(text("SELECT id FROM suppliers WHERE tenantId=:t AND name=:n"), {"t": tenantId, "n": name})).first()
    if dup: return err("Supplier with this name already exists", 409)
    await db.execute(
        text(
            "INSERT INTO suppliers (id, tenantId, name, company, contactPerson, phone, email, address, city, vatRegNo, "
            "paymentTermsDays, creditLimit, openingDue, currentDue, rebatePercent, notes, createdBy) "
            "VALUES (UUID(), :t, :n, :c, :cp, :p, :e, :a, :ct, :v, :pt, :cl, :od, :od, :rb, :notes, :u)"
        ),
        {"t": tenantId, "n": name, "c": body.get("company"), "cp": body.get("contactPerson"), "p": body.get("phone"),
         "e": body.get("email"), "a": body.get("address"), "ct": body.get("city"), "v": body.get("vatRegNo"),
         "pt": body.get("paymentTermsDays"), "cl": body.get("creditLimit", 0), "od": body.get("openingDue", 0),
         "rb": body.get("rebatePercent") if body.get("rebatePercent") is not None else 0,
         "notes": body.get("notes"), "u": user.id},
    )
    await db.commit()
    return ok({"created": True, "name": name}, 201)


@router.get("/api/v1/suppliers/{supplierId}")
async def get_supplier(supplierId: str, tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text("SELECT * FROM suppliers WHERE id=:id AND tenantId=:t"), {"id": supplierId, "t": tenantId})).first()
    if not r: return err("Supplier not found", 404)
    d = dict(r._mapping)
    agg = (await db.execute(
        text("SELECT COUNT(*) c, COALESCE(SUM(total),0) s FROM purchase_orders WHERE supplierId=:id AND status != 'CANCELLED'"),
        {"id": supplierId})).first()
    recent = rows_to_dicts(
        (await db.execute(
            text("SELECT id, poNo, total, status, createdAt FROM purchase_orders WHERE tenantId=:t AND supplierId=:id ORDER BY createdAt DESC LIMIT 10"),
            {"t": tenantId, "id": supplierId})).fetchall()
    )
    productCount = (await db.execute(text("SELECT COUNT(*) FROM products WHERE supplierId=:id"), {"id": supplierId})).first()[0]
    return ok({**d, "purchaseHistory": {"totalPurchased": float(agg.s or 0), "totalOrders": agg.c},
               "recentPOs": recent, "_count": {"purchaseOrders": agg.c, "goodsReceipts": 0, "products": productCount}})


@router.put("/api/v1/suppliers/{supplierId}")
async def update_supplier(supplierId: str, body: dict,
                          user: AuthUser = Depends(require_permission("suppliers.edit")),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    allowed = {"name": "name", "company": "company", "contactPerson": "contactPerson", "phone": "phone",
               "email": "email", "address": "address", "city": "city", "vatRegNo": "vatRegNo",
               "paymentTermsDays": "paymentTermsDays", "creditLimit": "creditLimit", "currentDue": "currentDue",
               "rebatePercent": "rebatePercent", "deliveryPerformanceScore": "deliveryPerformanceScore",
               "qualityScore": "qualityScore", "defectRate": "defectRate", "returnRate": "returnRate",
               "notes": "notes", "status": "status"}
    sets, params = [], {"id": supplierId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body: sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if not sets: return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    res = await db.execute(text(f"UPDATE suppliers SET {', '.join(sets)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0: return err("Supplier not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/suppliers/{supplierId}")
async def delete_supplier(supplierId: str,
                          user: AuthUser = Depends(require_permission("suppliers.delete")),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    used = (await db.execute(text("SELECT COUNT(*) FROM products WHERE supplierId=:id AND tenantId=:t"),
                              {"id": supplierId, "t": tenantId})).first()
    po_used = (await db.execute(text("SELECT COUNT(*) FROM purchase_orders WHERE supplierId=:id"),
                                 {"id": supplierId})).first()
    if (used[0] > 0) or (po_used[0] > 0):
        await db.execute(text("UPDATE suppliers SET status='INACTIVE', updatedBy=:u WHERE id=:id AND tenantId=:t"),
                         {"id": supplierId, "t": tenantId, "u": user.id})
        await db.commit()
        return ok({"deleted": False, "deactivated": True, "reason": "Supplier has products or purchase orders"})
    res = await db.execute(text("DELETE FROM suppliers WHERE id=:id AND tenantId=:t"), {"id": supplierId, "t": tenantId})
    await db.commit()
    return ok({"deleted": res.rowcount > 0})


# ─────────────────────────── WAREHOUSES ───────────────────────────

@router.get("/api/v1/warehouses")
async def list_warehouses(tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts(
        (await db.execute(
            text("SELECT w.*, b.name AS branchName FROM warehouses w LEFT JOIN branches b ON b.id=w.branchId "
                 "WHERE w.tenantId=:t ORDER BY w.name"),
            {"t": tenantId})).fetchall()
    )
    for r in rows:
        r["branch"] = {"id": r.pop("branchId"), "name": r.pop("branchName")}
    return ok(rows)


@router.post("/api/v1/warehouses")
async def create_warehouse(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    code = body.get("code") or name.upper().replace(" ", "-")[:10]
    branchId = body.get("branchId")
    if not branchId: return err("Branch is required", 400)
    dup = (await db.execute(text("SELECT id FROM warehouses WHERE tenantId=:t AND code=:c"), {"t": tenantId, "c": code})).first()
    if dup: return err("Warehouse with this code already exists", 409)
    await db.execute(
        text("INSERT INTO warehouses (id, tenantId, branchId, code, name, type, status, isLocationBased, createdBy) "
             "VALUES (UUID(), :t, :b, :c, :n, :tp, 'ACTIVE', :loc, :u)"),
        {"t": tenantId, "b": branchId, "c": code, "n": name,
         "tp": body.get("type", "GENERAL"), "loc": body.get("isLocationBased", False), "u": user.id})
    await db.commit()
    row = (await db.execute(text("SELECT id, name, code FROM warehouses WHERE tenantId=:t AND code=:c"), {"t": tenantId, "c": code})).first()
    return ok({"id": row[0], "name": row[1], "code": row[2], "created": True}, 201)


@router.put("/api/v1/warehouses/{warehouseId}")
async def update_warehouse(warehouseId: str, body: dict,
                           user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    exists = (await db.execute(text("SELECT id FROM warehouses WHERE id=:id AND tenantId=:t"), {"id": warehouseId, "t": tenantId})).first()
    if not exists:
        return err("Warehouse not found", 404)
    allowed = {"name": "name", "code": "code", "branchId": "branchId", "type": "type", "status": "status", "isLocationBased": "isLocationBased"}
    sets, params = [], {"id": warehouseId, "t": tenantId, "u": user.id}
    for jk, ck in allowed.items():
        if jk in body:
            sets.append(f"{ck} = :{ck}"); params[ck] = body[jk]
    if not sets:
        return err("Nothing to update", 400)
    sets.append("updatedBy = :u")
    res = await db.execute(text(f"UPDATE warehouses SET {', '.join(sets)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    if res.rowcount == 0:
        return err("Warehouse not found", 404)
    return ok({"updated": True})


@router.delete("/api/v1/warehouses/{warehouseId}")
async def delete_warehouse(warehouseId: str,
                           user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    used = (await db.execute(text("SELECT COUNT(*) FROM stock WHERE warehouseId=:id AND tenantId=:t"),
                              {"id": warehouseId, "t": tenantId})).first()
    if used[0] > 0:
        await db.execute(text("UPDATE warehouses SET status='INACTIVE', updatedBy=:u WHERE id=:id AND tenantId=:t"),
                         {"id": warehouseId, "t": tenantId, "u": user.id})
        await db.commit()
        return ok({"deleted": False, "deactivated": True, "reason": "Warehouse has stock entries"})
    res = await db.execute(text("DELETE FROM warehouses WHERE id=:id AND tenantId=:t"), {"id": warehouseId, "t": tenantId})
    await db.commit()
    return ok({"deleted": res.rowcount > 0})
