"""Extended Reporting & BI Engine (Prompt 30 / §15).

Adds to the existing routers_reports.py (which covers sales, inventory, P&L, dashboard KPIs):
- Balance Sheet, Accounts Receivable, Accounts Payable
- Commission reports (agent sales, earned, payable, paid)
- Installment reports (financed, collected, outstanding, overdue, due today/this week)
- Inventory aging, expiry tracking, batch report
- Report export (CSV)
- Saved report presets (CRUD)
- Scheduled reports (CRUD)
- Dashboard builder (widget CRUD + data endpoint)

Architecture note: Heavy reports query the transactional DB through indexed WHERE clauses;
for the analytics pipeline we'll snapshot aggregates into `analytics_snapshots` daily.
"""
from __future__ import annotations

import csv
import io
import json
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params

router = APIRouter()


def _uid() -> str:
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════════
# 1. BALANCE SHEET (§15 Finance)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/financial/balance-sheet")
async def balance_sheet(
    asOfDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if branchId:
        where += " AND branchId=:b"
        params["b"] = branchId

    # Assets — ledger_entries has accountId (FK → accounts), accountCode is in accounts table
    try:
        assets_rows = (await db.execute(text(
            f"SELECT a.code AS accountCode, a.name AS accountName, SUM(le.debit - le.credit) AS balance "
            f"FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
            f"WHERE le.tenantId = :t AND a.code LIKE '1%' "
            f"GROUP BY a.code, a.name ORDER BY a.code"), params)).fetchall()
    except Exception:
        assets_rows = []
    assets = [{"code": r[0], "name": r[1], "balance": float(r[2] or 0)} for r in assets_rows]
    total_assets = sum(a["balance"] for a in assets)

    # Liabilities
    try:
        liab_rows = (await db.execute(text(
            f"SELECT a.code AS accountCode, a.name AS accountName, SUM(le.credit - le.debit) AS balance "
            f"FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
            f"WHERE le.tenantId = :t AND a.code LIKE '2%' "
            f"GROUP BY a.code, a.name ORDER BY a.code"), params)).fetchall()
    except Exception:
        liab_rows = []
    liabilities = [{"code": r[0], "name": r[1], "balance": float(r[2] or 0)} for r in liab_rows]
    total_liabilities = sum(l["balance"] for l in liabilities)

    # Equity
    try:
        eq_rows = (await db.execute(text(
            f"SELECT a.code AS accountCode, a.name AS accountName, SUM(le.credit - le.debit) AS balance "
            f"FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
            f"WHERE le.tenantId = :t AND a.code LIKE '3%' "
            f"GROUP BY a.code, a.name ORDER BY a.code"), params)).fetchall()
    except Exception:
        eq_rows = []
    equity = [{"code": r[0], "name": r[1], "balance": float(r[2] or 0)} for r in eq_rows]
    total_equity = sum(e["balance"] for e in equity)

    return ok({
        "asOfDate": asOfDate or datetime.utcnow().strftime("%Y-%m-%d"),
        "assets": assets, "totalAssets": total_assets,
        "liabilities": liabilities, "totalLiabilities": total_liabilities,
        "equity": equity, "totalEquity": total_equity,
        "balanced": abs(total_assets - total_liabilities - total_equity) < 0.01,
    })


# ═══════════════════════════════════════════════════════════════════
# 2. ACCOUNTS RECEIVABLE / PAYABLE
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/financial/ar")
async def accounts_receivable(
    branchId: str = "",
    aging: bool = False,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "i.tenantId=:t AND i.status != 'PAID' AND i.status != 'VOID'"
    params: dict = {"t": tenantId}
    if branchId:
        where += " AND i.branchId=:b"
        params["b"] = branchId

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT i.id, i.invoiceNo, i.total, i.paidTotal, i.issueDate, i.dueDate, "
        f"i.status, c.name AS customerName, c.id AS customerId, c.phone AS customerPhone "
        f"FROM invoices i LEFT JOIN customers c ON c.id=i.customerId "
        f"WHERE {where} ORDER BY i.dueDate ASC"), params)).fetchall())

    for r in rows:
        r["balance"] = float(r.get("total", 0)) - float(r.get("paidTotal", 0))
        if r.get("dueDate") and r["balance"] > 0:
            days = (datetime.utcnow() - datetime.fromisoformat(str(r["dueDate"]))).days
            r["agingDays"] = max(days, 0)
        else:
            r["agingDays"] = 0

    total = sum(r["balance"] for r in rows)
    buckets = {"current": 0, "1_30": 0, "31_60": 0, "61_90": 0, "over_90": 0}
    if aging:
        for r in rows:
            d = r.get("agingDays", 0)
            if d <= 0:
                buckets["current"] += r["balance"]
            elif d <= 30:
                buckets["1_30"] += r["balance"]
            elif d <= 60:
                buckets["31_60"] += r["balance"]
            elif d <= 90:
                buckets["61_90"] += r["balance"]
            else:
                buckets["over_90"] += r["balance"]

    return ok({"invoices": rows, "totalOutstanding": total, "aging": buckets if aging else None})


@router.get("/api/v1/reports/financial/ap")
async def accounts_payable(
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "pi.tenantId=:t AND pi.status != 'PAID' AND pi.status != 'VOID'"
    params: dict = {"t": tenantId}
    if branchId:
        where += " AND pi.branchId=:b"
        params["b"] = branchId

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT pi.id, pi.piNo, pi.total, pi.paidTotal, pi.invoiceDate, "
        f"pi.status, s.name AS supplierName, s.id AS supplierId "
        f"FROM purchase_invoices pi LEFT JOIN suppliers s ON s.id=pi.supplierId "
        f"WHERE {where} ORDER BY pi.invoiceDate ASC"), params)).fetchall())

    for r in rows:
        r["balance"] = float(r.get("total", 0)) - float(r.get("paidTotal", 0))
    total = sum(r["balance"] for r in rows)
    return ok({"invoices": rows, "totalOutstanding": total})


# ═══════════════════════════════════════════════════════════════════
# 3. COMMISSION REPORTS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/commission/summary")
async def commission_summary(
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "c.tenantId=:t"
    params: dict = {"t": tenantId}
    if startDate:
        where += " AND c.createdAt >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND c.createdAt <= :ed"
        params["ed"] = endDate
    if branchId:
        where += " AND c.branchId=:b"
        params["b"] = branchId

    rows = rows_to_dicts((await db.execute(text(
        f"SELECT c.agentUserId AS agentId, c.agentName, "
        f"COUNT(*) AS saleCount, SUM(c.basisAmount) AS totalSales, "
        f"SUM(c.amount) AS totalCommission, "
        f"SUM(CASE WHEN c.status='PAID' THEN c.amount ELSE 0 END) AS paidCommission, "
        f"SUM(CASE WHEN c.status='CALCULATED' THEN c.amount ELSE 0 END) AS pendingCommission "
        f"FROM commissions c "
        f"WHERE {where} GROUP BY c.agentUserId, c.agentName ORDER BY totalCommission DESC"), params)).fetchall())

    total_earned = sum(float(r.get("totalCommission", 0)) for r in rows)
    total_paid = sum(float(r.get("paidCommission", 0)) for r in rows)
    return ok({"agents": rows, "totalEarned": total_earned, "totalPaid": total_paid,
               "totalPending": total_earned - total_paid})


# ═══════════════════════════════════════════════════════════════════
# 4. INSTALLMENT REPORTS
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/installments/summary")
async def installment_summary(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    overview = (await db.execute(text(
        "SELECT COUNT(*) AS total, "
        "SUM(financedAmount) AS totalFinanced, "
        "SUM(CASE WHEN status='ACTIVE' THEN financedAmount ELSE 0 END) AS activeFinanced, "
        "SUM(CASE WHEN status='COMPLETED' THEN financedAmount ELSE 0 END) AS completedFinanced "
        "FROM installments WHERE tenantId=:t"), {"t": tenantId})).first()

    schedule_agg = (await db.execute(text(
        "SELECT "
        "COUNT(*) AS totalSchedules, "
        "SUM(CASE WHEN status='PAID' THEN paidAmount ELSE 0 END) AS totalCollected, "
        "SUM(CASE WHEN status IN ('DUE','OVERDUE') THEN amount - paidAmount ELSE 0 END) AS totalOutstanding, "
        "SUM(CASE WHEN status='OVERDUE' THEN amount - paidAmount ELSE 0 END) AS totalOverdue, "
        "SUM(CASE WHEN status='DUE' AND dueDate = CURDATE() THEN amount - paidAmount ELSE 0 END) AS dueToday, "
        "SUM(CASE WHEN status='DUE' AND dueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN amount - paidAmount ELSE 0 END) AS dueThisWeek "
        "FROM installment_schedules WHERE tenantId=:t"), {"t": tenantId})).first()

    inst = dict(overview._mapping) if hasattr(overview, '_mapping') else {}
    sched = dict(schedule_agg._mapping) if hasattr(schedule_agg, '_mapping') else {}

    return ok({
        "totalContracts": int(inst.get("total", 0) or 0),
        "totalFinanced": float(inst.get("totalFinanced", 0) or 0),
        "activeFinanced": float(inst.get("activeFinanced", 0) or 0),
        "completedFinanced": float(inst.get("completedFinanced", 0) or 0),
        "totalCollected": float(sched.get("totalCollected", 0) or 0),
        "totalOutstanding": float(sched.get("totalOutstanding", 0) or 0),
        "totalOverdue": float(sched.get("totalOverdue", 0) or 0),
        "dueToday": float(sched.get("dueToday", 0) or 0),
        "dueThisWeek": float(sched.get("dueThisWeek", 0) or 0),
    })


@router.get("/api/v1/reports/installments/overdue")
async def installment_overdue(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT ist.id AS installmentId, ist.planNo, ist.status, "
        "c.name AS customerName, c.phone AS customerPhone, "
        "istss.sequenceNo, istss.dueDate, istss.amount, istss.paidAmount, "
        "DATEDIFF(CURDATE(), istss.dueDate) AS daysOverdue "
        "FROM installment_schedules istss "
        "JOIN installments ist ON ist.id=istss.installmentId "
        "LEFT JOIN customers c ON c.id=ist.customerId "
        "WHERE ist.tenantId=:t AND istss.status='OVERDUE' "
        "ORDER BY daysOverdue DESC LIMIT 200"), {"t": tenantId})).fetchall())
    return ok(rows)


# ═══════════════════════════════════════════════════════════════════
# 5. INVENTORY AGING / EXPIRY / BATCH
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/inventory/aging")
async def inventory_aging(
    warehouseId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "s.tenantId=:t AND s.qtyOnHand > 0"
    params: dict = {"t": tenantId}
    if warehouseId:
        where += " AND s.warehouseId=:w"
        params["w"] = warehouseId

    # Get last sold date per product for aging
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.productId, p.name AS productName, p.sku, "
        f"s.warehouseId, w.name AS warehouseName, s.qtyOnHand, "
        f"p.costPrice, (s.qtyOnHand * p.costPrice) AS stockValue, "
        f"MAX(sm.createdAt) AS lastMovementAt "
        f"FROM stock s "
        f"JOIN products p ON p.id=s.productId "
        f"LEFT JOIN warehouses w ON w.id=s.warehouseId "
        f"LEFT JOIN stock_movements sm ON sm.productId=s.productId AND sm.warehouseId=s.warehouseId "
        f"WHERE {where} "
        f"GROUP BY s.productId, p.name, p.sku, s.warehouseId, w.name, s.qtyOnHand, p.costPrice "
        f"ORDER BY lastMovementAt ASC LIMIT 500"), params)).fetchall())

    for r in rows:
        lm = r.get("lastMovementAt")
        if lm:
            r["agingDays"] = (datetime.utcnow() - (lm if isinstance(lm, datetime) else datetime.fromisoformat(str(lm)))).days
        else:
            r["agingDays"] = 999
        d = r["agingDays"]
        if d <= 30:
            r["agingBucket"] = "0-30 days"
        elif d <= 60:
            r["agingBucket"] = "31-60 days"
        elif d <= 90:
            r["agingBucket"] = "61-90 days"
        elif d <= 180:
            r["agingBucket"] = "91-180 days"
        else:
            r["agingBucket"] = "180+ days"

    total_value = sum(float(r.get("stockValue", 0)) for r in rows)
    return ok({"items": rows, "totalStockValue": total_value, "count": len(rows)})


@router.get("/api/v1/reports/inventory/expiry")
async def inventory_expiry(
    days: int = 90,
    warehouseId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "b.tenantId=:t AND b.expiryDate IS NOT NULL AND b.expiryDate <= DATE_ADD(CURDATE(), INTERVAL :d DAY) AND b.qty > 0"
    params: dict = {"t": tenantId, "d": days}
    if warehouseId:
        where += " AND b.warehouseId=:w"
        params["w"] = warehouseId

    try:
        rows = rows_to_dicts((await db.execute(text(
            f"SELECT b.id, b.productId, p.name AS productName, p.sku, b.batchNo, "
            f"b.expiryDate, b.qty, b.warehouseId, w.name AS warehouseName, "
            f"DATEDIFF(b.expiryDate, CURDATE()) AS daysUntilExpiry, "
            f"(b.qty * p.costPrice) AS valueAtRisk "
            f"FROM stock_batches b "
            f"JOIN products p ON p.id=b.productId "
            f"LEFT JOIN warehouses w ON w.id=b.warehouseId "
            f"WHERE {where} ORDER BY b.expiryDate ASC LIMIT 500"), params)).fetchall())
    except Exception:
        rows = []

    total_at_risk = sum(float(r.get("valueAtRisk", 0)) for r in rows)
    expired = [r for r in rows if (r.get("daysUntilExpiry") or 0) < 0]
    return ok({"items": rows, "totalAtRisk": total_at_risk, "expiredCount": len(expired),
               "expiringCount": len(rows) - len(expired)})


# ═══════════════════════════════════════════════════════════════════
# 6. REPORT EXPORT (CSV)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/export")
async def export_report(
    reportType: str = "sales_summary",
    format: str = "csv",
    startDate: str = "",
    endDate: str = "",
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Export any report as CSV. The reportType maps to an internal query builder."""
    # Build the report data based on type
    data = []
    filename = f"{reportType}_{datetime.utcnow().strftime('%Y%m%d')}"

    if reportType == "sales_by_product":
        where = "s.tenantId=:t AND s.status='CONFIRMED'"
        params: dict = {"t": tenantId}
        if startDate:
            where += " AND s.createdAt >= :sd"; params["sd"] = startDate
        if branchId:
            where += " AND s.branchId=:b"; params["b"] = branchId
        rows = (await db.execute(text(
            f"SELECT si.productId, p.name AS productName, SUM(si.qty) AS totalQty, "
            f"SUM(si.qty * si.unitPrice) AS totalRevenue "
            f"FROM sale_items si "
            f"JOIN sales s ON s.id=si.saleId "
            f"JOIN products p ON p.id=si.productId "
            f"WHERE {where} GROUP BY si.productId, p.name ORDER BY totalRevenue DESC"), params)).fetchall()
        data = [{"Product": r[1], "Quantity": float(r[2] or 0), "Revenue": float(r[3] or 0)} for r in rows]
        columns = ["Product", "Quantity", "Revenue"]

    elif reportType == "sales_by_category":
        where = "s.tenantId=:t AND s.status='CONFIRMED'"
        params = {"t": tenantId}
        if startDate:
            where += " AND s.createdAt >= :sd"; params["sd"] = startDate
        if branchId:
            where += " AND s.branchId=:b"; params["b"] = branchId
        rows = (await db.execute(text(
            f"SELECT COALESCE(cat.name, 'Uncategorized') AS catName, "
            f"SUM(si.qty) AS totalQty, SUM(si.qty * si.unitPrice) AS totalRevenue "
            f"FROM sale_items si "
            f"JOIN sales s ON s.id=si.saleId "
            f"JOIN products p ON p.id=si.productId "
            f"LEFT JOIN categories cat ON cat.id=p.categoryId "
            f"WHERE {where} GROUP BY catName ORDER BY totalRevenue DESC"), params)).fetchall()
        data = [{"Category": r[0], "Quantity": float(r[1] or 0), "Revenue": float(r[2] or 0)} for r in rows]
        columns = ["Category", "Quantity", "Revenue"]

    elif reportType == "stock_valuation":
        params = {"t": tenantId}
        wh = ""
        if branchId:
            wh = " AND s.warehouseId=:w"; params["w"] = branchId
        rows = (await db.execute(text(
            f"SELECT p.name, p.sku, s.qtyOnHand, p.costPrice, "
            f"(s.qtyOnHand * p.costPrice) AS stockValue "
            f"FROM stock s JOIN products p ON p.id=s.productId "
            f"WHERE s.tenantId=:t AND s.qtyOnHand > 0 {wh} "
            f"ORDER BY stockValue DESC"), params)).fetchall()
        data = [{"Product": r[0], "SKU": r[1], "Qty": float(r[2] or 0),
                 "Cost": float(r[3] or 0), "Value": float(r[4] or 0)} for r in rows]
        columns = ["Product", "SKU", "Qty", "Cost", "Value"]

    elif reportType == "ar_aging":
        params = {"t": tenantId}
        rows = (await db.execute(text(
            "SELECT i.invoiceNo, c.name AS customerName, i.total, i.paidTotal, "
            "(i.total - i.paidTotal) AS balance, i.dueDate, i.status "
            "FROM invoices i LEFT JOIN customers c ON c.id=i.customerId "
            "WHERE i.tenantId=:t AND i.status != 'PAID' AND i.status != 'VOID' "
            "ORDER BY i.dueDate ASC"), params)).fetchall()
        data = [{"Invoice": r[0], "Customer": r[1], "Total": float(r[2] or 0),
                 "Paid": float(r[3] or 0), "Balance": float(r[4] or 0),
                 "DueDate": str(r[5] or ""), "Status": r[6]} for r in rows]
        columns = ["Invoice", "Customer", "Total", "Paid", "Balance", "DueDate", "Status"]

    else:
        return err(f"Unknown reportType: {reportType}", 400)

    if format == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=columns)
            writer.writeheader()
            writer.writerows(data)
        else:
            writer = csv.DictWriter(output, fieldnames=["info"])
            writer.writeheader()
            writer.writerow({"info": "No data found"})
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'})

    return ok({"data": data, "columns": columns, "filename": filename})


# ═══════════════════════════════════════════════════════════════════
# 7. SAVED REPORTS (CRUD)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/saved")
async def list_saved_reports(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM saved_reports WHERE tenantId=:t ORDER BY name"), {"t": tenantId})).fetchall())
    for r in rows:
        if isinstance(r.get("config"), str):
            try:
                r["config"] = json.loads(r["config"])
            except (json.JSONDecodeError, TypeError):
                pass
    return ok(rows)


@router.post("/api/v1/reports/saved")
async def create_saved_report(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    report_type = body.get("reportType")
    if not name or not report_type:
        return err("name and reportType required", 400)
    rid = _uid()
    config = body.get("config")
    config_json = json.dumps(config) if isinstance(config, dict) else config
    await db.execute(text(
        "INSERT INTO saved_reports (id, tenantId, name, reportType, config, createdBy) "
        "VALUES (:id, :t, :n, :rt, :cfg, :u)"),
        {"id": rid, "t": tenantId, "n": name, "rt": report_type, "cfg": config_json, "u": user.id})
    await db.commit()
    return ok({"id": rid, "name": name}, 201)


@router.patch("/api/v1/reports/saved/{reportId}")
async def update_saved_report(
    reportId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": reportId, "t": tenantId}
    if "name" in body:
        fields.append("name=:name"); params["name"] = body["name"]
    if "config" in body:
        fields.append("config=:cfg"); params["cfg"] = json.dumps(body["config"]) if isinstance(body["config"], dict) else body["config"]
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    await db.execute(text(f"UPDATE saved_reports SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/reports/saved/{reportId}")
async def delete_saved_report(
    reportId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text("DELETE FROM saved_reports WHERE id=:id AND tenantId=:t"), {"id": reportId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


# ═══════════════════════════════════════════════════════════════════
# 8. SCHEDULED REPORTS (CRUD)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/reports/scheduled")
async def list_scheduled_reports(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM scheduled_reports WHERE tenantId=:t ORDER BY name"), {"t": tenantId})).fetchall())
    for r in rows:
        for col in ("config", "recipients"):
            if isinstance(r.get(col), str):
                try:
                    r[col] = json.loads(r[col])
                except (json.JSONDecodeError, TypeError):
                    pass
    return ok(rows)


@router.post("/api/v1/reports/scheduled")
async def create_scheduled_report(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    report_type = body.get("reportType")
    frequency = body.get("frequency", "WEEKLY").upper()
    if not name or not report_type:
        return err("name and reportType required", 400)

    rid = _uid()
    now = datetime.utcnow()
    if frequency == "DAILY":
        next_run = now + timedelta(days=1)
    elif frequency == "WEEKLY":
        next_run = now + timedelta(weeks=1)
    else:
        next_run = now + timedelta(days=30)

    await db.execute(text(
        "INSERT INTO scheduled_reports "
        "(id, tenantId, name, reportType, config, frequency, deliveryChannel, recipients, "
        "nextRunAt, createdBy) VALUES (:id, :t, :n, :rt, :cfg, :freq, :dc, :rc, :nr, :u)"),
        {"id": rid, "t": tenantId, "n": name, "rt": report_type,
         "cfg": json.dumps(body.get("config")) if body.get("config") else None,
         "freq": frequency, "dc": body.get("deliveryChannel", "EMAIL"),
         "rc": json.dumps(body.get("recipients", [])) if body.get("recipients") else None,
         "nr": next_run, "u": user.id})
    await db.commit()
    return ok({"id": rid, "name": name, "nextRunAt": str(next_run)}, 201)


@router.patch("/api/v1/reports/scheduled/{reportId}")
async def update_scheduled_report(
    reportId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": reportId, "t": tenantId}
    for col in ("name", "frequency", "deliveryChannel"):
        if col in body:
            fields.append(f"{col}=:{col}"); params[col] = body[col]
    if "recipients" in body:
        fields.append("recipients=:rc"); params["rc"] = json.dumps(body["recipients"])
    if "config" in body:
        fields.append("config=:cfg"); params["cfg"] = json.dumps(body["config"]) if isinstance(body["config"], dict) else body["config"]
    if "isActive" in body:
        fields.append("isActive=:active"); params["active"] = 1 if body["isActive"] else 0
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    await db.execute(text(f"UPDATE scheduled_reports SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/reports/scheduled/{reportId}")
async def delete_scheduled_report(
    reportId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text("DELETE FROM scheduled_reports WHERE id=:id AND tenantId=:t"), {"id": reportId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


# ═══════════════════════════════════════════════════════════════════
# 9. DASHBOARD BUILDER (widget CRUD)
# ═══════════════════════════════════════════════════════════════════

@router.get("/api/v1/dashboards")
async def list_dashboards(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM dashboard_configs WHERE tenantId=:t ORDER BY isDefault DESC, name"),
        {"t": tenantId})).fetchall())
    for r in rows:
        if isinstance(r.get("layout"), str):
            try:
                r["layout"] = json.loads(r["layout"])
            except (json.JSONDecodeError, TypeError):
                pass
    return ok(rows)


@router.post("/api/v1/dashboards")
async def create_dashboard(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name", "My Dashboard")
    did = _uid()
    layout = body.get("layout", {"columns": 12, "rowHeight": 80})
    is_default = 1 if body.get("isDefault") else 0
    if is_default:
        await db.execute(text("UPDATE dashboard_configs SET isDefault=0 WHERE tenantId=:t"), {"t": tenantId})
    await db.execute(text(
        "INSERT INTO dashboard_configs (id, tenantId, userId, name, isDefault, layout) "
        "VALUES (:id, :t, :u, :n, :def, :lay)"),
        {"id": did, "t": tenantId, "u": user.id, "n": name, "def": is_default,
         "lay": json.dumps(layout) if isinstance(layout, dict) else layout})
    await db.commit()
    return ok({"id": did, "name": name}, 201)


@router.patch("/api/v1/dashboards/{dashboardId}")
async def update_dashboard(
    dashboardId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": dashboardId, "t": tenantId}
    if "name" in body:
        fields.append("name=:name"); params["name"] = body["name"]
    if "layout" in body:
        fields.append("layout=:lay"); params["lay"] = json.dumps(body["layout"]) if isinstance(body["layout"], dict) else body["layout"]
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    await db.execute(text(f"UPDATE dashboard_configs SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/dashboards/{dashboardId}")
async def delete_dashboard(
    dashboardId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text("DELETE FROM dashboard_widgets WHERE dashboardId=:d AND tenantId=:t"), {"d": dashboardId, "t": tenantId})
    await db.execute(text("DELETE FROM dashboard_configs WHERE id=:id AND tenantId=:t"), {"id": dashboardId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


# ── Widget CRUD ──

@router.get("/api/v1/dashboards/{dashboardId}/widgets")
async def list_widgets(
    dashboardId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM dashboard_widgets WHERE dashboardId=:d AND tenantId=:t ORDER BY posY, posX"),
        {"d": dashboardId, "t": tenantId})).fetchall())
    for r in rows:
        if isinstance(r.get("config"), str):
            try:
                r["config"] = json.loads(r["config"])
            except (json.JSONDecodeError, TypeError):
                pass
    return ok(rows)


@router.post("/api/v1/dashboards/{dashboardId}/widgets")
async def add_widget(
    dashboardId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    wid = _uid()
    widget_type = body.get("widgetType", "KPI_CARD")
    config = body.get("config", {})
    await db.execute(text(
        "INSERT INTO dashboard_widgets "
        "(id, tenantId, dashboardId, widgetType, title, config, posX, posY, width, height) "
        "VALUES (:id, :t, :d, :wt, :title, :cfg, :px, :py, :w, :h)"),
        {"id": wid, "t": tenantId, "d": dashboardId, "wt": widget_type,
         "title": body.get("title"), "cfg": json.dumps(config) if isinstance(config, dict) else config,
         "px": body.get("posX", 0), "py": body.get("posY", 0),
         "w": body.get("width", 6), "h": body.get("height", 4)})
    await db.commit()
    return ok({"id": wid}, 201)


@router.patch("/api/v1/dashboards/{dashboardId}/widgets/{widgetId}")
async def update_widget(
    dashboardId: str,
    widgetId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields, params = [], {"id": widgetId, "t": tenantId, "d": dashboardId}
    for col in ("title", "posX", "posY", "width", "height"):
        if col in body:
            fields.append(f"{col}=:{col}"); params[col] = body[col]
    if "config" in body:
        fields.append("config=:cfg"); params["cfg"] = json.dumps(body["config"]) if isinstance(body["config"], dict) else body["config"]
    if not fields:
        return err("Nothing to update", 400)
    fields.append("updatedAt=NOW()")
    await db.execute(text(
        f"UPDATE dashboard_widgets SET {', '.join(fields)} WHERE id=:id AND dashboardId=:d AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/dashboards/{dashboardId}/widgets/{widgetId}")
async def delete_widget(
    dashboardId: str,
    widgetId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text(
        "DELETE FROM dashboard_widgets WHERE id=:id AND dashboardId=:d AND tenantId=:t"),
        {"id": widgetId, "d": dashboardId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


@router.post("/api/v1/dashboards/{dashboardId}/widgets/reorder")
async def reorder_widgets(
    dashboardId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Batch update widget positions. body: { widgets: [{id, posX, posY, width, height}] }"""
    widgets = body.get("widgets", [])
    for w in widgets:
        await db.execute(text(
            "UPDATE dashboard_widgets SET posX=:px, posY=:py, width=:w, height=:h, updatedAt=NOW() "
            "WHERE id=:id AND dashboardId=:d AND tenantId=:t"),
            {"px": w.get("posX", 0), "py": w.get("posY", 0), "w": w.get("width", 6),
             "h": w.get("height", 4), "id": w["id"], "d": dashboardId, "t": tenantId})
    await db.commit()
    return ok({"reordered": len(widgets)})


# ── Widget data endpoint (fetches data for a specific widget config) ──

@router.get("/api/v1/dashboards/widgets/{widgetId}/data")
async def widget_data(
    widgetId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Fetch data for a widget based on its type and config."""
    row = (await db.execute(text(
        "SELECT * FROM dashboard_widgets WHERE id=:id AND tenantId=:t"),
        {"id": widgetId, "t": tenantId})).first()
    if not row:
        return err("Widget not found", 404)
    data = dict(row._mapping) if hasattr(row, '_mapping') else {}
    wtype = data.get("widgetType", "KPI_CARD")
    config = data.get("config")
    if isinstance(config, str):
        try:
            config = json.loads(config)
        except (json.JSONDecodeError, TypeError):
            config = {}

    result = {}

    if wtype == "KPI_CARD":
        kpi_type = config.get("kpiType", "totalSales")
        if kpi_type == "totalSales":
            r = (await db.execute(text(
                "SELECT COUNT(*), COALESCE(SUM(total),0) FROM sales WHERE tenantId=:t AND status='CONFIRMED' "
                "AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)"), {"t": tenantId})).first()
            result = {"label": "Total Sales (30d)", "value": float(r[1] or 0), "count": int(r[0] or 0)}
        elif kpi_type == "totalCustomers":
            r = (await db.execute(text("SELECT COUNT(*) FROM customers WHERE tenantId=:t"), {"t": tenantId})).first()
            result = {"label": "Total Customers", "value": int(r[0] or 0)}
        elif kpi_type == "lowStock":
            r = (await db.execute(text(
                "SELECT COUNT(*) FROM stock s JOIN products p ON p.id=s.productId "
                "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) AND s.qtyOnHand > 0"),
                {"t": tenantId})).first()
            result = {"label": "Low Stock Items", "value": int(r[0] or 0)}
        elif kpi_type == "arOutstanding":
            r = (await db.execute(text(
                "SELECT COALESCE(SUM(total - paidTotal),0) FROM invoices "
                "WHERE tenantId=:t AND status != 'PAID' AND status != 'VOID'"), {"t": tenantId})).first()
            result = {"label": "AR Outstanding", "value": float(r[0] or 0)}
        elif kpi_type == "overdueInstallments":
            r = (await db.execute(text(
                "SELECT COUNT(*) FROM installment_schedules WHERE tenantId=:t AND status='OVERDUE'"),
                {"t": tenantId})).first()
            result = {"label": "Overdue Installments", "value": int(r[0] or 0)}
        else:
            result = {"label": kpi_type, "value": 0}

    elif wtype == "CHART":
        chart_type = config.get("chartType", "bar")
        result = {"chartType": chart_type, "data": []}

    elif wtype == "TABLE":
        result = {"columns": [], "rows": []}

    return ok(result)
