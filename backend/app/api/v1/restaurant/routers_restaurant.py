"""Restaurant Module Router (Prompt 20, §11.1).

Covers:
- Floor & Table management with interactive states (AVAILABLE, RESERVED, OCCUPIED, ORDERING, PREPARING, BILL_REQUESTED, PAYMENT_PENDING, CLEANING)
- Table waiter assignment & transfer/split/merge
- KOT (Kitchen Order Ticket) creation & multi-station routing (KITCHEN, GRILL, BAR, DESSERT)
- KDS (Kitchen Display System) status progression (NEW → ACCEPTED → PREPARING → READY → SERVED)
- Recipe & BOM management with automated ingredient stock consumption & food costing
- Tenant feature flag enforcement (RESTAURANT business type check)
"""
from __future__ import annotations

import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db, txn
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, gen_no

router = APIRouter()


def _uuid() -> str:
    return str(uuid.uuid4())


async def _check_restaurant_enabled(db: AsyncSession, tenantId: str):
    """Verify tenant is allowed to use Restaurant module."""
    t = (await db.execute(
        text("SELECT businessType FROM tenants WHERE id = :t"),
        {"t": tenantId},
    )).first()
    if not t:
        raise Exception("Tenant not found")
    btype = (t[0] or "").upper()
    if btype != "RESTAURANT" and btype != "ALL":
        # Check setting override if businessType is general
        try:
            s = (await db.execute(
                text("SELECT value FROM tenant_settings WHERE tenantId = :t AND settingKey = 'restaurant_enabled'"),
                {"t": tenantId},
            )).first()
            enabled = s[0] if s else "true"  # Default enabled if not restricted
        except Exception:
            enabled = "true"  # Fallback to enabled if table missing or query fails
        if str(enabled).lower() in ("false", "0", "off"):
            raise Exception("Restaurant module is disabled for this tenant (§11.9)")


# ═════════════════════════ FLOORS & TABLES ═════════════════════════

@router.get("/api/v1/restaurant/floors")
async def list_floors(
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    where = "tenantId = :t"
    params: dict = {"t": tenantId}
    if branchId:
        where += " AND branchId = :b"
        params["b"] = branchId

    rows = rows_to_dicts((await db.execute(
        text(f"SELECT * FROM restaurant_floors WHERE {where} ORDER BY sortOrder, name"),
        params,
    )).fetchall())
    return ok(rows)


@router.post("/api/v1/restaurant/floors")
async def create_floor(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    name = body.get("name")
    branchId = body.get("branchId")
    if not name or not branchId:
        return err("name and branchId are required", 400)

    floor_id = _uuid()
    await db.execute(
        text("INSERT INTO restaurant_floors (id, tenantId, branchId, name, sortOrder) VALUES (:id, :t, :b, :n, :so)"),
        {"id": floor_id, "t": tenantId, "b": branchId, "n": name, "so": body.get("sortOrder", 0)},
    )
    await db.commit()
    return ok({"id": floor_id, "name": name}, 201)


@router.put("/api/v1/restaurant/floors/{floorId}")
async def update_floor(
    floorId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    name = body.get("name")
    if not name:
        return err("name is required", 400)

    sort_order = body.get("sortOrder")
    if sort_order is not None:
        res = await db.execute(
            text("UPDATE restaurant_floors SET name = :n, sortOrder = :so, updatedAt = NOW() WHERE id = :id AND tenantId = :t"),
            {"n": name, "so": sort_order, "id": floorId, "t": tenantId},
        )
    else:
        res = await db.execute(
            text("UPDATE restaurant_floors SET name = :n, updatedAt = NOW() WHERE id = :id AND tenantId = :t"),
            {"n": name, "id": floorId, "t": tenantId},
        )
    if res.rowcount == 0:
        return err("Floor not found", 404)
    await db.commit()
    return ok({"id": floorId, "name": name})


@router.delete("/api/v1/restaurant/floors/{floorId}")
async def delete_floor(
    floorId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    async with txn(db):
        await db.execute(
            text("UPDATE restaurant_tables SET floorId = NULL WHERE floorId = :f AND tenantId = :t"),
            {"f": floorId, "t": tenantId},
        )
        res = await db.execute(
            text("DELETE FROM restaurant_floors WHERE id = :id AND tenantId = :t"),
            {"id": floorId, "t": tenantId},
        )
        if res.rowcount == 0:
            return err("Floor not found", 404)

    return ok({"deleted": True, "floorId": floorId})


@router.get("/api/v1/restaurant/tables")
async def list_tables(
    branchId: str = "",
    floorId: str = "",
    status: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    where = "rt.tenantId = :t"
    params: dict = {"t": tenantId}
    if branchId:
        where += " AND rt.branchId = :b"
        params["b"] = branchId
    if floorId:
        where += " AND rt.floorId = :f"
        params["f"] = floorId
    if status:
        where += " AND rt.status = :st"
        params["st"] = status

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT rt.*, rf.name AS floorName, u.name AS waiterName "
            f"FROM restaurant_tables rt "
            f"LEFT JOIN restaurant_floors rf ON rf.id = rt.floorId "
            f"LEFT JOIN users u ON u.id = rt.waiterUserId "
            f"WHERE {where} ORDER BY rt.tableNo"
        ),
        params,
    )).fetchall())

    for r in rows:
        r["floor"] = {"id": r.pop("floorId"), "name": r.pop("floorName")} if r.get("floorName") else None
        r["waiter"] = {"id": r.pop("waiterUserId"), "name": r.pop("waiterName")} if r.get("waiterName") else None

    return ok(rows)


@router.post("/api/v1/restaurant/tables")
async def create_table(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    tableNo = body.get("tableNo")
    branchId = body.get("branchId")
    if not tableNo or not branchId:
        return err("tableNo and branchId are required", 400)

    tbl_id = _uuid()
    await db.execute(
        text(
            "INSERT INTO restaurant_tables "
            "(id, tenantId, branchId, floorId, tableNo, name, capacity, status) "
            "VALUES (:id, :t, :b, :f, :no, :n, :c, 'AVAILABLE')"
        ),
        {
            "id": tbl_id, "t": tenantId, "b": branchId,
            "f": body.get("floorId"), "no": tableNo,
            "n": body.get("name") or f"Table {tableNo}",
            "c": body.get("capacity", 4),
        },
    )
    await db.commit()
    return ok({"id": tbl_id, "tableNo": tableNo, "status": "AVAILABLE"}, 201)


@router.patch("/api/v1/restaurant/tables/{tableId}/status")
async def update_table_status(
    tableId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    status = body.get("status")
    valid_statuses = [
        "AVAILABLE", "RESERVED", "OCCUPIED", "ORDERING",
        "PREPARING", "BILL_REQUESTED", "PAYMENT_PENDING", "CLEANING",
    ]
    if status not in valid_statuses:
        return err(f"Invalid status. Must be one of: {', '.join(valid_statuses)}", 400)

    tbl = (await db.execute(
        text("SELECT id FROM restaurant_tables WHERE id = :id AND tenantId = :t"),
        {"id": tableId, "t": tenantId},
    )).first()
    if not tbl:
        return err("Table not found", 404)

    updates = {"status": status}
    params: dict = {"st": status, "id": tableId, "t": tenantId}

    if "waiterUserId" in body:
        params["w"] = body.get("waiterUserId")
        sql_extra = ", waiterUserId = :w"
    else:
        sql_extra = ""

    if "currentOrderNo" in body:
        params["ord"] = body.get("currentOrderNo")
        sql_extra += ", currentOrderNo = :ord"

    if status == "AVAILABLE" or status == "CLEANING":
        sql_extra += ", currentOrderNo = NULL, currentSaleId = NULL"

    await db.execute(
        text(f"UPDATE restaurant_tables SET status = :st {sql_extra}, updatedAt = NOW() WHERE id = :id AND tenantId = :t"),
        params,
    )
    await db.commit()
    return ok({"tableId": tableId, "status": status})


@router.put("/api/v1/restaurant/tables/{tableId}")
async def update_table(
    tableId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    params: dict = {"id": tableId, "t": tenantId}
    set_clauses = ["updatedAt = NOW()"]

    if "name" in body:
        params["n"] = body["name"]
        set_clauses.append("name = :n")
    if "tableNo" in body:
        params["no"] = body["tableNo"]
        set_clauses.append("tableNo = :no")
    if "capacity" in body:
        params["c"] = body["capacity"]
        set_clauses.append("capacity = :c")
    if "floorId" in body:
        params["f"] = body["floorId"]
        set_clauses.append("floorId = :f")

    sql = f"UPDATE restaurant_tables SET {', '.join(set_clauses)} WHERE id = :id AND tenantId = :t"
    res = await db.execute(text(sql), params)
    if res.rowcount == 0:
        return err("Table not found", 404)

    await db.commit()
    return ok({"tableId": tableId, "updated": True})


@router.post("/api/v1/restaurant/tables/transfer")
async def transfer_table(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Transfer or merge table order to another table."""
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    fromTableId = body.get("fromTableId")
    toTableId = body.get("toTableId")
    if not fromTableId or not toTableId:
        return err("fromTableId and toTableId are required", 400)

    async with txn(db):
        from_tbl = (await db.execute(
            text("SELECT id, tableNo, status, currentOrderNo, waiterUserId FROM restaurant_tables WHERE id = :id AND tenantId = :t"),
            {"id": fromTableId, "t": tenantId},
        )).first()
        to_tbl = (await db.execute(
            text("SELECT id, tableNo, status FROM restaurant_tables WHERE id = :id AND tenantId = :t"),
            {"id": toTableId, "t": tenantId},
        )).first()

        if not from_tbl or not to_tbl:
            return err("One or both tables not found", 404)

        order_no = from_tbl[3]
        waiter = from_tbl[4]

        # Re-assign KOT tickets to destination table
        if order_no:
            await db.execute(
                text("UPDATE restaurant_kot SET tableId = :to WHERE tableId = :from AND tenantId = :t"),
                {"to": toTableId, "from": fromTableId, "t": tenantId},
            )

        # Target table takes order
        await db.execute(
            text("UPDATE restaurant_tables SET status = 'OCCUPIED', currentOrderNo = :ord, waiterUserId = :w WHERE id = :id AND tenantId = :t"),
            {"ord": order_no, "w": waiter, "id": toTableId, "t": tenantId},
        )

        # Source table becomes available
        await db.execute(
            text("UPDATE restaurant_tables SET status = 'AVAILABLE', currentOrderNo = NULL, waiterUserId = NULL WHERE id = :id AND tenantId = :t"),
            {"id": fromTableId, "t": tenantId},
        )

    return ok({"transferred": True, "from": from_tbl[1], "to": to_tbl[1]})


# ═════════════════════════ KOT & KDS ROUTING ═════════════════════════

@router.get("/api/v1/restaurant/kot")
async def list_kot(
    branchId: str = "",
    station: str = "",
    status: str = "",
    tableId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    where = "k.tenantId = :t"
    params: dict = {"t": tenantId}
    if branchId:
        where += " AND k.branchId = :b"
        params["b"] = branchId
    if station:
        where += " AND k.station = :st"
        params["st"] = station
    if status:
        where += " AND k.status = :s"
        params["s"] = status
    if tableId:
        where += " AND k.tableId = :tbl"
        params["tbl"] = tableId

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT k.*, rt.tableNo, u.name AS waiterName "
            f"FROM restaurant_kot k "
            f"LEFT JOIN restaurant_tables rt ON rt.id = k.tableId "
            f"LEFT JOIN users u ON u.id = k.waiterUserId "
            f"WHERE {where} ORDER BY k.createdAt DESC LIMIT 100"
        ),
        params,
    )).fetchall())

    for r in rows:
        items = rows_to_dicts((await db.execute(
            text("SELECT * FROM restaurant_kot_items WHERE kotId = :kid"),
            {"kid": r["id"]},
        )).fetchall())
        r["items"] = items

    return ok(rows)


@router.post("/api/v1/restaurant/kot")
async def create_kot(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create a Kitchen Order Ticket (KOT) routed to target station."""
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    branchId = body.get("branchId")
    items = body.get("items") or []
    if not branchId or not items:
        return err("branchId and items are required", 400)

    tableId = body.get("tableId")
    orderType = body.get("orderType", "DINE_IN")
    station = body.get("station", "KITCHEN")
    kot_no = gen_no("KOT")
    kot_id = _uuid()

    async with txn(db):
        await db.execute(
            text(
                "INSERT INTO restaurant_kot "
                "(id, tenantId, branchId, tableId, kotNo, orderType, station, status, waiterUserId, notes) "
                "VALUES (:id, :t, :b, :tbl, :kno, :ot, :st, 'NEW', :u, :notes)"
            ),
            {
                "id": kot_id, "t": tenantId, "b": branchId, "tbl": tableId,
                "kno": kot_no, "ot": orderType, "st": station,
                "u": user.id, "notes": body.get("notes"),
            },
        )

        for it in items:
            await db.execute(
                text(
                    "INSERT INTO restaurant_kot_items "
                    "(id, tenantId, kotId, productId, name, qty, modifiersJson, notes, status) "
                    "VALUES (:id, :t, :kid, :p, :n, :q, :m, :note, 'NEW')"
                ),
                {
                    "id": _uuid(), "t": tenantId, "kid": kot_id,
                    "p": it["productId"], "n": it.get("name", "Item"),
                    "q": float(it.get("qty", 1)),
                    "m": json.dumps(it.get("modifiers")) if it.get("modifiers") else None,
                    "note": it.get("notes"),
                },
            )

        # Update table status to ORDERING / PREPARING if linked to a table
        if tableId:
            await db.execute(
                text("UPDATE restaurant_tables SET status = 'PREPARING', currentOrderNo = :ord, waiterUserId = :u WHERE id = :id AND tenantId = :t"),
                {"ord": kot_no, "u": user.id, "id": tableId, "t": tenantId},
            )

    return ok({"kotId": kot_id, "kotNo": kot_no, "station": station, "status": "NEW"}, 201)


@router.patch("/api/v1/restaurant/kot/{kotId}/status")
async def update_kot_status(
    kotId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """KDS status progression: NEW → ACCEPTED → PREPARING → READY → SERVED."""
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    status = body.get("status")
    valid_statuses = ["NEW", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"]
    if status not in valid_statuses:
        return err(f"Invalid KDS status. Must be one of: {', '.join(valid_statuses)}", 400)

    async with txn(db):
        res = await db.execute(
            text("UPDATE restaurant_kot SET status = :st, updatedAt = NOW() WHERE id = :id AND tenantId = :t"),
            {"st": status, "id": kotId, "t": tenantId},
        )
        if res.rowcount == 0:
            return err("KOT ticket not found", 404)

        await db.execute(
            text("UPDATE restaurant_kot_items SET status = :st WHERE kotId = :kid AND tenantId = :t"),
            {"st": status, "kid": kotId, "t": tenantId},
        )

    return ok({"kotId": kotId, "status": status})


@router.get("/api/v1/restaurant/kds")
async def kds_feed(
    branchId: str = "",
    station: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Kitchen Display System active feed grouped by station."""
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    where = "k.tenantId = :t AND k.status IN ('NEW','ACCEPTED','PREPARING','READY')"
    params: dict = {"t": tenantId}
    if branchId:
        where += " AND k.branchId = :b"
        params["b"] = branchId
    if station:
        where += " AND k.station = :st"
        params["st"] = station

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT k.*, rt.tableNo, u.name AS waiterName "
            f"FROM restaurant_kot k "
            f"LEFT JOIN restaurant_tables rt ON rt.id = k.tableId "
            f"LEFT JOIN users u ON u.id = k.waiterUserId "
            f"WHERE {where} ORDER BY k.createdAt ASC"
        ),
        params,
    )).fetchall())

    for r in rows:
        items = rows_to_dicts((await db.execute(
            text("SELECT * FROM restaurant_kot_items WHERE kotId = :kid"),
            {"kid": r["id"]},
        )).fetchall())
        r["items"] = items

    return ok(rows)


# ═════════════════════════ RECIPES & FOOD COSTING ═════════════════════════

@router.get("/api/v1/restaurant/recipes")
async def list_recipes(
    recipeProductId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    where = "pr.tenantId = :t"
    params: dict = {"t": tenantId}
    if recipeProductId:
        where += " AND pr.recipeProductId = :p"
        params["p"] = recipeProductId

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT pr.*, rp.name AS recipeProductName, ip.name AS ingredientProductName, ip.costPrice AS currentIngredientCost "
            f"FROM product_recipes pr "
            f"JOIN products rp ON rp.id = pr.recipeProductId "
            f"JOIN products ip ON ip.id = pr.ingredientProductId "
            f"WHERE {where} ORDER BY rp.name"
        ),
        params,
    )).fetchall())

    return ok(rows)


@router.post("/api/v1/restaurant/recipes")
async def save_recipe(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Save or replace a recipe (BOM) for a product."""
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    recipeProductId = body.get("recipeProductId")
    ingredients = body.get("ingredients") or []
    if not recipeProductId or not ingredients:
        return err("recipeProductId and ingredients list are required", 400)

    async with txn(db):
        # Delete existing recipe items
        await db.execute(
            text("DELETE FROM product_recipes WHERE tenantId = :t AND recipeProductId = :p"),
            {"t": tenantId, "p": recipeProductId},
        )

        # Insert new recipe ingredients
        for ing in ingredients:
            await db.execute(
                text(
                    "INSERT INTO product_recipes "
                    "(id, tenantId, recipeProductId, ingredientProductId, qtyRequired, unit, unitCost) "
                    "VALUES (:id, :t, :rp, :ip, :q, :u, :uc)"
                ),
                {
                    "id": _uuid(), "t": tenantId, "rp": recipeProductId,
                    "ip": ing["ingredientProductId"],
                    "q": float(ing.get("qtyRequired", 1)),
                    "u": ing.get("unit", "unit"),
                    "uc": float(ing.get("unitCost", 0)),
                },
            )

        # Update product type to RECIPE
        await db.execute(
            text("UPDATE products SET productType = 'RECIPE' WHERE id = :p AND tenantId = :t"),
            {"p": recipeProductId, "t": tenantId},
        )

    return ok({"recipeProductId": recipeProductId, "ingredientsCount": len(ingredients)}, 201)


@router.get("/api/v1/restaurant/recipes/{productId}/food-cost")
async def get_food_cost(
    productId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Calculate food cost and profit margin for a recipe product."""
    try:
        await _check_restaurant_enabled(db, tenantId)
    except Exception as e:
        return err(str(e), 403)

    prod = (await db.execute(
        text("SELECT id, name, sellingPrice FROM products WHERE id = :p AND tenantId = :t"),
        {"p": productId, "t": tenantId},
    )).first()
    if not prod:
        return err("Product not found", 404)

    selling_price = float(prod[2] or 0)

    ingredients = rows_to_dicts((await db.execute(
        text(
            "SELECT pr.*, ip.name AS ingredientName, ip.costPrice "
            "FROM product_recipes pr "
            "JOIN products ip ON ip.id = pr.ingredientProductId "
            "WHERE pr.tenantId = :t AND pr.recipeProductId = :p"
        ),
        {"t": tenantId, "p": productId},
    )).fetchall())

    total_food_cost = sum(
        float(ing.get("qtyRequired", 1)) * (float(ing.get("unitCost") or ing.get("costPrice") or 0))
        for ing in ingredients
    )

    margin = selling_price - total_food_cost
    margin_pct = round((margin / selling_price * 100), 2) if selling_price > 0 else 0.0

    return ok({
        "productId": productId,
        "productName": prod[1],
        "sellingPrice": selling_price,
        "totalFoodCost": round(total_food_cost, 2),
        "grossMargin": round(margin, 2),
        "grossMarginPct": margin_pct,
        "ingredients": ingredients,
    })


# ═════════════════════════ RESTAURANT TIME SLOTS & SHIFTS ═════════════════════════

async def _ensure_time_slots_table(db: AsyncSession):
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS restaurant_time_slots (
                id VARCHAR(36) PRIMARY KEY,
                tenantId VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL,
                startTime VARCHAR(10) NOT NULL,
                endTime VARCHAR(10) NOT NULL,
                daysOfWeek VARCHAR(50) DEFAULT 'ALL',
                isActive TINYINT(1) DEFAULT 1,
                sortOrder INT DEFAULT 0,
                color VARCHAR(30) DEFAULT '#0d9488',
                description VARCHAR(255) NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant (tenantId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """))
    except Exception as e:
        print("Time slots table check/create note:", e)

    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS tenant_settings (
                id VARCHAR(36) PRIMARY KEY,
                tenantId VARCHAR(36) NOT NULL,
                settingKey VARCHAR(100) NOT NULL,
                value TEXT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uk_tenant_setting (tenantId, settingKey),
                INDEX idx_ts_tenant (tenantId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """))
    except Exception as e:
        print("Tenant settings table check/create note:", e)


def _is_time_in_slot(current_time: str, start_time: str, end_time: str) -> bool:
    """Check if HH:MM falls between start and end time (supporting overnight slots)."""
    try:
        cur = current_time.strip()
        st = start_time.strip()
        et = end_time.strip()
        if st <= et:
            return st <= cur <= et
        else:
            # Over midnight (e.g. 23:00 to 04:00)
            return cur >= st or cur <= et
    except Exception:
        return False


def _add_minutes_to_time(time_str: str, minutes: int) -> str:
    try:
        from datetime import datetime, timedelta
        t = datetime.strptime(time_str.strip(), "%H:%M")
        return (t + timedelta(minutes=minutes)).strftime("%H:%M")
    except Exception:
        return time_str


async def _get_today_shift_overrides(db: AsyncSession, tenantId: str) -> dict:
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")
    try:
        row = (await db.execute(
            text("SELECT value FROM tenant_settings WHERE tenantId = :t AND settingKey = 'restaurant_today_shift_overrides'"),
            {"t": tenantId},
        )).first()
        if row and row[0]:
            data = json.loads(row[0])
            if data.get("date") == today_str:
                return data.get("overrides", {})
    except Exception as e:
        print("Error reading shift overrides:", e)
    return {}


async def _save_today_shift_overrides(db: AsyncSession, tenantId: str, overrides: dict):
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")
    val_json = json.dumps({"date": today_str, "overrides": overrides})
    async with txn(db):
        existing = (await db.execute(
            text("SELECT id FROM tenant_settings WHERE tenantId = :t AND settingKey = 'restaurant_today_shift_overrides'"),
            {"t": tenantId},
        )).first()
        if existing:
            await db.execute(
                text("UPDATE tenant_settings SET value = :v, updatedAt = CURRENT_TIMESTAMP WHERE tenantId = :t AND settingKey = 'restaurant_today_shift_overrides'"),
                {"t": tenantId, "v": val_json},
            )
        else:
            await db.execute(
                text("INSERT INTO tenant_settings (id, tenantId, settingKey, value) VALUES (:id, :t, 'restaurant_today_shift_overrides', :v)"),
                {"id": _uuid(), "t": tenantId, "v": val_json},
            )


@router.get("/api/v1/restaurant/time-slots")
async def list_time_slots(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """List all configured time slots for restaurant with multi-shift active computation & today's dynamic overrides."""
    await _ensure_time_slots_table(db)
    rows = rows_to_dicts((await db.execute(
        text("SELECT * FROM restaurant_time_slots WHERE tenantId = :t ORDER BY sortOrder, startTime"),
        {"t": tenantId},
    )).fetchall())

    from datetime import datetime
    now_str = datetime.now().strftime("%H:%M")
    today_overrides = await _get_today_shift_overrides(db, tenantId)

    try:
        setting_row = (await db.execute(
            text("SELECT value FROM tenant_settings WHERE tenantId = :t AND settingKey = 'restaurant_time_slot_filter'"),
            {"t": tenantId},
        )).first()
        filter_enabled = str(setting_row[0]).lower() in ("true", "1", "yes", "on") if setting_row else False
    except Exception:
        filter_enabled = False

    active_slots = []
    enriched_slots = []

    for slot in rows:
        slot_id = slot.get("id")
        is_active = bool(slot.get("isActive", True))
        st = slot.get("startTime", "00:00")
        et = slot.get("endTime", "23:59")

        override = today_overrides.get(slot_id)
        is_slot_active_now = False

        if override:
            action = override.get("action")
            if action == "FORCE_ACTIVE":
                # Started early or collated
                is_slot_active_now = True
            elif action == "FORCE_INACTIVE":
                # Ended early today
                is_slot_active_now = False
            elif action in ("EXTEND_1H", "EXTEND_30M", "EXTENDED"):
                until_time = override.get("untilTime", et)
                is_slot_active_now = _is_time_in_slot(now_str, st, until_time)
        else:
            if is_active and _is_time_in_slot(now_str, st, et):
                is_slot_active_now = True

        slot_copy = dict(slot)
        slot_copy["isCurrentlyActive"] = is_slot_active_now
        slot_copy["todayOverride"] = override
        enriched_slots.append(slot_copy)

        if is_slot_active_now:
            active_slots.append(slot_copy)

    return ok({
        "slots": enriched_slots,
        "activeSlots": active_slots,
        "activeSlot": active_slots[0] if active_slots else None,
        "activeSlotIds": [s["id"] for s in active_slots],
        "todayOverrides": today_overrides,
        "timeSlotFilterEnabled": filter_enabled,
        "currentTime": now_str,
    })


@router.post("/api/v1/restaurant/time-slots/override")
async def override_today_time_slot(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Dynamically start early, end early, extend +1h/+30m, or collate multiple shifts today without altering master schedule."""
    slot_id = body.get("slotId")
    action = body.get("action")  # "START_NOW", "END_EARLY", "EXTEND_1H", "EXTEND_30M", "RESET", "RESET_ALL"

    if action == "RESET_ALL":
        await _save_today_shift_overrides(db, tenantId, {})
        return ok({"message": "All shifts reset to standard schedule", "overrides": {}})

    if not slot_id or not action:
        return err("slotId and action are required", 400)

    slot = (await db.execute(
        text("SELECT * FROM restaurant_time_slots WHERE id = :id AND tenantId = :t"),
        {"id": slot_id, "t": tenantId},
    )).first()

    if not slot:
        return err("Shift not found", 404)

    slot_dict = dict(slot._mapping)
    et = slot_dict.get("endTime", "23:59")
    from datetime import datetime
    now_str = datetime.now().strftime("%H:%M")

    overrides = await _get_today_shift_overrides(db, tenantId)

    if action == "RESET":
        if slot_id in overrides:
            del overrides[slot_id]
    elif action == "START_NOW":
        overrides[slot_id] = {
            "action": "FORCE_ACTIVE",
            "activatedAt": now_str,
            "note": "Started / collated for today",
        }
    elif action == "END_EARLY":
        overrides[slot_id] = {
            "action": "FORCE_INACTIVE",
            "endedAt": now_str,
            "note": "Ended early for today",
        }
    elif action == "EXTEND_1H":
        base_time = et if et > now_str else now_str
        extended_et = _add_minutes_to_time(base_time, 60)
        overrides[slot_id] = {
            "action": "EXTEND_1H",
            "untilTime": extended_et,
            "extendedBy": "+60m",
            "note": f"Extended until {extended_et}",
        }
    elif action == "EXTEND_30M":
        base_time = et if et > now_str else now_str
        extended_et = _add_minutes_to_time(base_time, 30)
        overrides[slot_id] = {
            "action": "EXTEND_30M",
            "untilTime": extended_et,
            "extendedBy": "+30m",
            "note": f"Extended until {extended_et}",
        }
    else:
        return err(f"Invalid action '{action}'", 400)

    await _save_today_shift_overrides(db, tenantId, overrides)
    return ok({
        "message": f"Shift action '{action}' applied for today",
        "overrides": overrides,
    })


@router.post("/api/v1/restaurant/time-slots")
async def create_time_slot(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Create a new restaurant meal shift / time slot."""
    await _ensure_time_slots_table(db)
    name = body.get("name", "").strip()
    start_time = body.get("startTime", "").strip()
    end_time = body.get("endTime", "").strip()

    if not name or not start_time or not end_time:
        return err("name, startTime and endTime are required", 400)

    slot_id = _uuid()
    days = body.get("daysOfWeek", "ALL")
    is_active = 1 if body.get("isActive", True) else 0
    sort_order = int(body.get("sortOrder", 0))
    color = body.get("color", "#0d9488")
    description = body.get("description", "")

    async with txn(db):
        await db.execute(
            text("""
                INSERT INTO restaurant_time_slots (id, tenantId, name, startTime, endTime, daysOfWeek, isActive, sortOrder, color, description)
                VALUES (:id, :t, :name, :st, :et, :days, :act, :so, :col, :desc)
            """),
            {
                "id": slot_id,
                "t": tenantId,
                "name": name,
                "st": start_time,
                "et": end_time,
                "days": days,
                "act": is_active,
                "so": sort_order,
                "col": color,
                "desc": description,
            },
        )

    return ok({"id": slot_id, "name": name, "startTime": start_time, "endTime": end_time}, 201)


@router.put("/api/v1/restaurant/time-slots/{slot_id}")
async def update_time_slot(
    slot_id: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing time slot."""
    await _ensure_time_slots_table(db)
    async with txn(db):
        await db.execute(
            text("""
                UPDATE restaurant_time_slots
                SET name = COALESCE(:name, name),
                    startTime = COALESCE(:st, startTime),
                    endTime = COALESCE(:et, endTime),
                    daysOfWeek = COALESCE(:days, daysOfWeek),
                    isActive = COALESCE(:act, isActive),
                    sortOrder = COALESCE(:so, sortOrder),
                    color = COALESCE(:col, color),
                    description = COALESCE(:desc, description)
                WHERE id = :id AND tenantId = :t
            """),
            {
                "id": slot_id,
                "t": tenantId,
                "name": body.get("name"),
                "st": body.get("startTime"),
                "et": body.get("endTime"),
                "days": body.get("daysOfWeek"),
                "act": 1 if body.get("isActive") is True else (0 if body.get("isActive") is False else None),
                "so": body.get("sortOrder"),
                "col": body.get("color"),
                "desc": body.get("description"),
            },
        )
    return ok({"id": slot_id, "updated": True})


@router.delete("/api/v1/restaurant/time-slots/{slot_id}")
async def delete_time_slot(
    slot_id: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Delete a time slot."""
    await _ensure_time_slots_table(db)
    async with txn(db):
        await db.execute(
            text("DELETE FROM restaurant_time_slots WHERE id = :id AND tenantId = :t"),
            {"id": slot_id, "t": tenantId},
        )
    return ok({"id": slot_id, "deleted": True})


@router.get("/api/v1/restaurant/time-slots/settings")
async def get_time_slot_settings(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Get restaurant time slot filtering global settings."""
    try:
        row = (await db.execute(
            text("SELECT value FROM tenant_settings WHERE tenantId = :t AND settingKey = 'restaurant_time_slot_filter'"),
            {"t": tenantId},
        )).first()
        val = row[0] if row else "false"
        enabled = str(val).lower() in ("true", "1", "yes", "on")
    except Exception:
        enabled = False

    return ok({"timeSlotFilterEnabled": enabled})


@router.put("/api/v1/restaurant/time-slots/settings")
async def update_time_slot_settings(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Toggle restaurant time slot filtering on POS."""
    enabled = bool(body.get("timeSlotFilterEnabled", False))
    val = "true" if enabled else "false"

    async with txn(db):
        existing = (await db.execute(
            text("SELECT id FROM tenant_settings WHERE tenantId = :t AND settingKey = 'restaurant_time_slot_filter'"),
            {"t": tenantId},
        )).first()
        if existing:
            await db.execute(
                text("UPDATE tenant_settings SET value = :v, updatedAt = CURRENT_TIMESTAMP WHERE tenantId = :t AND settingKey = 'restaurant_time_slot_filter'"),
                {"t": tenantId, "v": val},
            )
        else:
            await db.execute(
                text("INSERT INTO tenant_settings (id, tenantId, settingKey, value) VALUES (:id, :t, 'restaurant_time_slot_filter', :v)"),
                {"id": _uuid(), "t": tenantId, "v": val},
            )

    return ok({"timeSlotFilterEnabled": enabled})


@router.get("/api/v1/restaurant/time-slots/matrix")
async def get_time_slot_matrix(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Fetch all products for bulk time slot assignment matrix."""
    await _ensure_time_slots_table(db)
    
    # 1. Fetch all slots
    slots = rows_to_dicts((await db.execute(
        text("SELECT * FROM restaurant_time_slots WHERE tenantId = :t ORDER BY sortOrder, startTime"),
        {"t": tenantId},
    )).fetchall())

    # 2. Fetch all products
    prods = rows_to_dicts((await db.execute(
        text("""
            SELECT p.id, p.name, p.sku, p.sellingPrice, p.imageUrl, p.attributes,
                   c.name as categoryName
            FROM products p
            LEFT JOIN categories c ON c.id = p.categoryId
            WHERE p.tenantId = :t
            ORDER BY p.name ASC
        """),
        {"t": tenantId},
    )).fetchall())

    matrix_items = []
    for p in prods:
        raw_attrs = p.get("attributes")
        attrs = {}
        if isinstance(raw_attrs, str):
            try:
                attrs = json.loads(raw_attrs)
            except Exception:
                attrs = {}
        elif isinstance(raw_attrs, dict):
            attrs = raw_attrs

        rest_attrs = attrs.get("restaurant", {})
        time_slot_ids = rest_attrs.get("timeSlotIds", [])
        all_time_slots = rest_attrs.get("allTimeSlots", len(time_slot_ids) == 0)

        matrix_items.append({
            "id": p["id"],
            "name": p["name"],
            "sku": p["sku"],
            "categoryName": p.get("categoryName") or "General",
            "sellingPrice": float(p.get("sellingPrice") or 0),
            "imageUrl": p.get("imageUrl") or "",
            "timeSlotIds": time_slot_ids if isinstance(time_slot_ids, list) else [],
            "allTimeSlots": bool(all_time_slots),
        })

    return ok({
        "slots": slots,
        "products": matrix_items,
    })


@router.put("/api/v1/restaurant/time-slots/matrix")
async def save_time_slot_matrix(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Bulk update time slot assignments for multiple products."""
    assignments = body.get("assignments", [])
    if not isinstance(assignments, list):
        return err("assignments array is required", 400)

    async with txn(db):
        for item in assignments:
            p_id = item.get("productId")
            slot_ids = item.get("timeSlotIds", [])
            all_slots = bool(item.get("allTimeSlots", len(slot_ids) == 0))
            if not p_id:
                continue

            # Load existing attributes
            row = (await db.execute(
                text("SELECT attributes FROM products WHERE id = :p AND tenantId = :t"),
                {"p": p_id, "t": tenantId},
            )).first()

            if not row:
                continue

            raw_attrs = row[0]
            attrs = {}
            if isinstance(raw_attrs, str):
                try:
                    attrs = json.loads(raw_attrs)
                except Exception:
                    attrs = {}
            elif isinstance(raw_attrs, dict):
                attrs = raw_attrs

            if "restaurant" not in attrs:
                attrs["restaurant"] = {}

            attrs["restaurant"]["timeSlotIds"] = slot_ids
            attrs["restaurant"]["allTimeSlots"] = all_slots

            await db.execute(
                text("UPDATE products SET attributes = :attr WHERE id = :p AND tenantId = :t"),
                {"attr": json.dumps(attrs), "p": p_id, "t": tenantId},
            )

    return ok({"updatedCount": len(assignments)})

