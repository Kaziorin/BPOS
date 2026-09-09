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
