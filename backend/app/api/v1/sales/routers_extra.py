"""Remaining routers — credit, installments, sales orders, invoices, pricing, inventory queries, branches/settings."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import math
from datetime import datetime
import accounting as acc
import workflow as wf
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params, gen_no

router = APIRouter()


def _uuid():
    import uuid as u
    return str(u.uuid4())


# ═════════════════════════ CREDIT (§10.13) ═════════════════════════

@router.get("/api/v1/credit/stats")
async def get_credit_stats(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Executive KPI stats for credit management & receivables risk."""
    row = (await db.execute(text("""
        SELECT 
            COUNT(*) AS totalCustomers,
            COALESCE(SUM(creditLimit), 0) AS totalCreditLimit,
            COALESCE(SUM(currentDue), 0) AS totalUtilizedDue,
            COALESCE(SUM(GREATEST(0, creditLimit - currentDue)), 0) AS totalAvailableCredit,
            COALESCE(SUM(CASE WHEN currentDue > creditLimit THEN 1 ELSE 0 END), 0) AS overLimitCount,
            COALESCE(SUM(CASE WHEN currentDue > creditLimit THEN currentDue - creditLimit ELSE 0 END), 0) AS overLimitAmount,
            COALESCE(SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END), 0) AS onHoldCount,
            COALESCE(SUM(CASE WHEN currentDue >= (creditLimit * 0.9) AND creditLimit > 0 THEN 1 ELSE 0 END), 0) AS highRiskCount
        FROM customers
        WHERE tenantId = :t AND creditLimit > 0
    """), {"t": tenantId})).first()

    return ok({
        "totalCustomers": int(row[0] or 0),
        "totalCreditLimit": float(row[1] or 0),
        "totalUtilizedDue": float(row[2] or 0),
        "totalAvailableCredit": float(row[3] or 0),
        "overLimitCount": int(row[4] or 0),
        "overLimitAmount": float(row[5] or 0),
        "onHoldCount": int(row[6] or 0),
        "highRiskCount": int(row[7] or 0),
    })


@router.get("/api/v1/credit")
async def list_credit(
    search: str = "",
    filterType: str = "ALL",
    onHoldOnly: bool = False,
    overLimitOnly: bool = False,
    sortBy: str = "currentDue",
    sortDir: str = "desc",
    page: int = Query(1),
    limit: int = Query(20),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "tenantId = :t AND creditLimit > 0"
    params: dict = {"t": tenantId}

    if search:
        where += " AND (name LIKE :s OR phone LIKE :s OR email LIKE :s)"
        params["s"] = f"%{search}%"

    if filterType == "HOLD" or onHoldOnly:
        where += " AND status = 'INACTIVE'"
    elif filterType == "OVERLIMIT" or overLimitOnly:
        where += " AND currentDue > creditLimit"
    elif filterType == "WITH_DUE":
        where += " AND currentDue > 0"
    elif filterType == "HEALTHY":
        where += " AND currentDue <= creditLimit AND status = 'ACTIVE'"

    allowed_sort = {
        "currentDue": "currentDue",
        "creditLimit": "creditLimit",
        "name": "name",
        "creditPeriodDays": "creditPeriodDays",
    }
    col = allowed_sort.get(sortBy, "currentDue")
    dir_str = "ASC" if sortDir.lower() == "asc" else "DESC"

    off, lim = paginate_params(page, limit)
    total = (await db.execute(text(f"SELECT COUNT(*) FROM customers WHERE {where}"), params)).first()[0]
    
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT id, name, phone, email, address, creditLimit, currentDue, creditPeriodDays, status FROM customers WHERE {where} "
        f"ORDER BY {col} {dir_str} LIMIT :lim OFFSET :off"), {**params, "lim": lim, "off": off})).fetchall())

    out = []
    for r in rows:
        c_limit = float(r.get("creditLimit") or 0)
        c_due = float(r.get("currentDue") or 0)
        isOnHold = r.get("status") == "INACTIVE"
        isOverLimit = c_due > c_limit
        avail = max(0.0, c_limit - c_due)
        utilizationPct = min(100, round((c_due / c_limit) * 100)) if c_limit > 0 else 0

        item = {
            **r,
            "creditLimit": c_limit,
            "currentDue": c_due,
            "availableCredit": avail,
            "utilizationPct": utilizationPct,
            "isOnCreditHold": isOnHold,
            "isOverLimit": isOverLimit,
        }
        out.append(item)

    return ok(out, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})


@router.get("/api/v1/credit/aging")
async def credit_aging(search: str = "", bucket: str = "ALL", user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    # 1. Fetch all customers with credit limit or current due in this tenant
    cust_rows = (await db.execute(text(
        "SELECT id, name, phone, email, address, creditLimit, currentDue, status, creditPeriodDays "
        "FROM customers WHERE tenantId=:t AND (currentDue > 0 OR creditLimit > 0) "
        "ORDER BY currentDue DESC"), {"t": tenantId})).fetchall()
    
    # 2. Fetch all unpaid invoices grouped by customer
    inv_rows = (await db.execute(text(
        "SELECT customerId, "
        "SUM(CASE WHEN DATEDIFF(CURDATE(), COALESCE(dueDate, issueDate)) <= 0 THEN (total - paidTotal) ELSE 0 END) AS b_current, "
        "SUM(CASE WHEN DATEDIFF(CURDATE(), COALESCE(dueDate, issueDate)) BETWEEN 1 AND 30 THEN (total - paidTotal) ELSE 0 END) AS b_1_30, "
        "SUM(CASE WHEN DATEDIFF(CURDATE(), COALESCE(dueDate, issueDate)) BETWEEN 31 AND 60 THEN (total - paidTotal) ELSE 0 END) AS b_31_60, "
        "SUM(CASE WHEN DATEDIFF(CURDATE(), COALESCE(dueDate, issueDate)) BETWEEN 61 AND 90 THEN (total - paidTotal) ELSE 0 END) AS b_61_90, "
        "SUM(CASE WHEN DATEDIFF(CURDATE(), COALESCE(dueDate, issueDate)) > 90 THEN (total - paidTotal) ELSE 0 END) AS b_90_plus, "
        "SUM(total - paidTotal) AS b_total, "
        "COUNT(id) AS openInvoiceCount "
        "FROM invoices "
        "WHERE tenantId=:t AND status IN ('ISSUED','PARTIALLY_PAID') AND (total - paidTotal) > 0 AND customerId IS NOT NULL "
        "GROUP BY customerId"), {"t": tenantId})).fetchall()
    
    inv_map = {r[0]: {
        "current": max(0.0, float(r[1] or 0)),
        "days1_30": max(0.0, float(r[2] or 0)),
        "days31_60": max(0.0, float(r[3] or 0)),
        "days61_90": max(0.0, float(r[4] or 0)),
        "days90plus": max(0.0, float(r[5] or 0)),
        "total": max(0.0, float(r[6] or 0)),
        "openInvoices": int(r[7] or 0)
    } for r in inv_rows}
    
    out = []
    total_summary = {"current": 0.0, "days1_30": 0.0, "days31_60": 0.0, "days61_90": 0.0, "days90plus": 0.0, "total": 0.0}
    high_risk_count = 0
    on_hold_count = 0
    
    for c in cust_rows:
        cid = c[0]
        cname = c[1] or "Unknown"
        phone = c[2]
        email = c[3]
        address = c[4]
        limit = float(c[5] or 0)
        due = float(c[6] or 0)
        status = c[7] or "ACTIVE"
        period = int(c[8] or 30)
        is_on_hold = (status.upper() in ["INACTIVE", "HOLD", "FROZEN"])
        if is_on_hold:
            on_hold_count += 1
            
        aging = inv_map.get(cid, {
            "current": 0.0,
            "days1_30": 0.0,
            "days31_60": 0.0,
            "days61_90": 0.0,
            "days90plus": 0.0,
            "total": 0.0,
            "openInvoices": 0
        })
        
        # If customer has recorded currentDue but no individual invoice breakdown, allocate into aging
        if due > 0 and aging["total"] == 0:
            aging["days1_30"] = due
            aging["total"] = due
        elif due > aging["total"] and aging["total"] > 0:
            diff = due - aging["total"]
            aging["days1_30"] += diff
            aging["total"] = due
        elif due == 0 and aging["total"] > 0:
            due = aging["total"]
            
        available = max(0.0, limit - due) if limit > 0 else 0.0
        utilization = (due / limit * 100.0) if limit > 0 else (100.0 if due > 0 else 0.0)
        is_high_risk = (aging["days61_90"] > 0 or aging["days90plus"] > 0 or due > limit and limit > 0)
        if is_high_risk:
            high_risk_count += 1
            
        row = {
            "customerId": cid,
            "customerName": cname,
            "phone": phone,
            "email": email,
            "address": address,
            "creditLimit": limit,
            "currentDue": due,
            "availableCredit": available,
            "utilizationPct": round(utilization, 1),
            "isOnCreditHold": is_on_hold,
            "creditPeriodDays": period,
            "openInvoices": aging["openInvoices"],
            "aging": {
                "current": round(aging["current"], 2),
                "days1_30": round(aging["days1_30"], 2),
                "days31_60": round(aging["days31_60"], 2),
                "days61_90": round(aging["days61_90"], 2),
                "days90plus": round(aging["days90plus"], 2),
                "total": round(aging["total"], 2),
            },
            # Flat accessors for legacy/table convenience
            "current": round(aging["current"], 2),
            "d1_30": round(aging["days1_30"], 2),
            "d31_60": round(aging["days31_60"], 2),
            "d61_90": round(aging["days61_90"], 2),
            "d90_plus": round(aging["days90plus"], 2),
            "total": round(aging["total"], 2),
            "status": status,
            "isHighRisk": is_high_risk
        }
        
        # Apply search filter
        if search:
            q = search.lower()
            if q not in cname.lower() and (not phone or q not in phone.lower()) and (not email or q not in email.lower()):
                continue
                
        # Apply bucket filter
        b = bucket.upper()
        if b == "CURRENT" and row["aging"]["current"] <= 0:
            continue
        elif b == "1_30" and row["aging"]["days1_30"] <= 0:
            continue
        elif b == "31_60" and row["aging"]["days31_60"] <= 0:
            continue
        elif b == "61_90" and row["aging"]["days61_90"] <= 0:
            continue
        elif b == "90_PLUS" and row["aging"]["days90plus"] <= 0:
            continue
        elif b == "OVERDUE" and (row["aging"]["days1_30"] + row["aging"]["days31_60"] + row["aging"]["days61_90"] + row["aging"]["days90plus"]) <= 0:
            continue
        elif b == "HOLD" and not is_on_hold:
            continue
        elif b == "HIGH_RISK" and not is_high_risk:
            continue
            
        total_summary["current"] += row["aging"]["current"]
        total_summary["days1_30"] += row["aging"]["days1_30"]
        total_summary["days31_60"] += row["aging"]["days31_60"]
        total_summary["days61_90"] += row["aging"]["days61_90"]
        total_summary["days90plus"] += row["aging"]["days90plus"]
        total_summary["total"] += row["aging"]["total"]
        
        out.append(row)
        
    for k in total_summary:
        total_summary[k] = round(total_summary[k], 2)
        
    stats = {
        "totalCustomers": len(out),
        "totalOutstanding": total_summary["total"],
        "currentAmount": total_summary["current"],
        "overdueTotal": round(total_summary["days1_30"] + total_summary["days31_60"] + total_summary["days61_90"] + total_summary["days90plus"], 2),
        "highRiskCount": high_risk_count,
        "onHoldCount": on_hold_count
    }
    
    return ok(out, extra={"summary": total_summary, "stats": stats})


@router.patch("/api/v1/credit/{customerId}/limit")
async def set_credit_limit(customerId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    limit = body.get("creditLimit")
    if limit is None: return err("creditLimit is required", 400)
    cur = (await db.execute(text("SELECT name, creditLimit FROM customers WHERE id=:id AND tenantId=:t"),
                            {"id": customerId, "t": tenantId})).first()
    if not cur: return err("Customer not found", 404)
    # ── Prompt 27 credit approval: raising the limit past the configured threshold ──
    increase = float(limit) - float(cur[1] or 0)
    if increase > 0:
        apr = await wf.create_approval(
            db, tenantId, "CREDIT_LIMIT", customerId, cur[0],
            f"Credit limit increase for {cur[0]} (+৳{increase:,.0f})", increase,
            {"customerId": customerId, "creditLimit": float(limit),
             "creditPeriodDays": body.get("creditPeriodDays")}, user.id)
        if apr:
            await db.commit()
            return ok({"updated": False, "needsApproval": True, "approval": apr}, 202)
    res = await db.execute(text(
        "UPDATE customers SET creditLimit=:c, creditPeriodDays=COALESCE(:p, creditPeriodDays), updatedBy=:u WHERE id=:id AND tenantId=:t"),
        {"c": limit, "p": body.get("creditPeriodDays"), "u": user.id, "id": customerId, "t": tenantId})
    await db.commit()
    return ok({"updated": True})


@router.post("/api/v1/credit/{customerId}/hold")
async def credit_hold(customerId: str, body: dict, user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    hold = 1 if body.get("onHold", True) else 0
    cur = (await db.execute(text("SELECT name FROM customers WHERE id=:id AND tenantId=:t"),
                            {"id": customerId, "t": tenantId})).first()
    if not cur: return err("Customer not found", 404)
    # ── Prompt 27 credit approval: placing/removing a hold needs sign-off ──
    apr = await wf.create_approval(
        db, tenantId, "CREDIT_HOLD", customerId, cur[0],
        f"{'Place' if hold else 'Release'} credit hold on {cur[0]}", 1,
        {"customerId": customerId, "onHold": bool(hold)}, user.id)
    if apr:
        await db.commit()
        return ok({"onHold": False, "needsApproval": True, "approval": apr}, 202)
    res = await db.execute(text(
        "UPDATE customers SET status = CASE WHEN :h=1 THEN 'INACTIVE' ELSE 'ACTIVE' END, updatedBy=:u WHERE id=:id AND tenantId=:t"),
        {"h": hold, "u": user.id, "id": customerId, "t": tenantId})
    await db.commit()
    return ok({"onHold": bool(hold)})


# ═════════════════════════ INSTALLMENTS (§10.14) ═════════════════════════

@router.get("/api/v1/installments/stats")
async def installment_stats(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    # Calculate portfolio KPIs
    plan_stats = (await db.execute(text(
        "SELECT "
        "COUNT(*) AS totalPlans, "
        "SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS activePlans, "
        "SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedPlans, "
        "SUM(CASE WHEN status = 'DEFAULTED' THEN 1 ELSE 0 END) AS defaultedPlans, "
        "COALESCE(SUM(financedAmount), 0) AS totalFinanced, "
        "COALESCE(SUM(totalPayable), 0) AS totalPayable, "
        "COALESCE(SUM(paidTotal), 0) AS totalCollected, "
        "COALESCE(SUM(totalPayable - paidTotal), 0) AS totalOutstanding "
        "FROM installments WHERE tenantId=:t"), {"t": tenantId})).first()
    
    # Overdue schedules count and amount
    sched_stats = (await db.execute(text(
        "SELECT "
        "COUNT(*) AS overdueCount, "
        "COALESCE(SUM(amount - paidAmount), 0) AS overdueAmount "
        "FROM installment_schedules "
        "WHERE tenantId=:t AND status != 'PAID' AND dueDate < CURDATE()"), {"t": tenantId})).first()
    
    return ok({
        "totalPlans": int(plan_stats[0] or 0),
        "activePlans": int(plan_stats[1] or 0),
        "completedPlans": int(plan_stats[2] or 0),
        "defaultedPlans": int(plan_stats[3] or 0),
        "totalFinanced": float(plan_stats[4] or 0),
        "totalPayable": float(plan_stats[5] or 0),
        "totalCollected": float(plan_stats[6] or 0),
        "totalOutstanding": max(0.0, float(plan_stats[7] or 0)),
        "overdueScheduleCount": int(sched_stats[0] or 0),
        "overdueAmount": float(sched_stats[1] or 0),
    })


@router.get("/api/v1/installments")
async def list_installments(search: str = "", status: str = "",
                            page: int = Query(1), limit: int = Query(20),
                            user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    where = "i.tenantId=:t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (i.planNo LIKE :s OR c.name LIKE :s OR c.phone LIKE :s OR c.email LIKE :s)"
        params["s"] = f"%{search}%"
    if status and status.upper() != "ALL":
        if status.upper() == "OVERDUE":
            where += " AND i.id IN (SELECT DISTINCT installmentId FROM installment_schedules WHERE tenantId=:t AND status != 'PAID' AND dueDate < CURDATE())"
        else:
            where += " AND i.status = :st"
            params["st"] = status.upper()

    off, lim = paginate_params(page, limit)
    total = (await db.execute(text(
        f"SELECT COUNT(*) FROM installments i LEFT JOIN customers c ON c.id=i.customerId WHERE {where}"), params)).first()[0]
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT i.*, c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail, c.address AS customerAddress "
        f"FROM installments i LEFT JOIN customers c ON c.id=i.customerId "
        f"WHERE {where} ORDER BY i.createdAt DESC LIMIT :lim OFFSET :off"), {**params, "lim": lim, "off": off})).fetchall())
    
    for r in rows:
        cid = r.pop("customerId", None)
        cname = r.pop("customerName", None)
        cphone = r.pop("customerPhone", None)
        cemail = r.pop("customerEmail", None)
        caddr = r.pop("customerAddress", None)
        r["customer"] = {
            "id": cid,
            "name": cname or "Unknown Customer",
            "phone": cphone,
            "email": cemail,
            "address": caddr
        }
        
        schedules = rows_to_dicts((await db.execute(text(
            "SELECT id, sequenceNo, dueDate, amount, paidAmount, status, paidAt, "
            "CASE WHEN status != 'PAID' AND dueDate < CURDATE() THEN 1 ELSE 0 END AS isOverdue "
            "FROM installment_schedules WHERE installmentId=:id ORDER BY sequenceNo, dueDate"), {"id": r["id"]})).fetchall())
        
        # Calculate real-time paid amount and overdue status
        paid_calc = sum(float(s.get("paidAmount") or 0) for s in schedules)
        if paid_calc > float(r.get("paidTotal") or 0):
            r["paidTotal"] = paid_calc
            
        r["hasOverdueSchedules"] = any(s.get("isOverdue") == 1 for s in schedules)
        r["schedules"] = schedules
        
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})


@router.post("/api/v1/installments")
async def create_installment(body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    customerId, total = body.get("customerId"), float(body.get("totalAmount", 0) or 0)
    count = int(body.get("installmentCount", 0) or 0)
    if not customerId or total <= 0 or count <= 0:
        return err("customerId, totalAmount, installmentCount required", 400)
    cust = (await db.execute(text("SELECT name, phone, email FROM customers WHERE id=:c AND tenantId=:t"),
                             {"c": customerId, "t": tenantId})).first()
    if not cust:
        return err("Customer not found", 404)
    cust_name = cust[0]
    freq = body.get("frequency", "MONTHLY")
    down = float(body.get("downPayment", 0) or 0)
    finance = max(total - down, 0)
    per = round(finance / count, 2)
    from datetime import datetime, timedelta
    step = {"WEEKLY": timedelta(weeks=1), "MONTHLY": timedelta(days=30)}.get(freq, timedelta(days=30))
    async with txn(db):
        ins_id = _uuid()
        await db.execute(text(
            "INSERT INTO installments (id, tenantId, customerId, saleId, planNo, financedAmount, downPayment, "
            "installmentCount, installmentAmount, frequency, startDate, totalPayable, status, createdBy) "
            "VALUES (:id, :t, :c, :s, :no, :fin, :dp, :cnt, :per, :f, NOW(), :tp, 'ACTIVE', :u)"),
            {"id": ins_id, "t": tenantId, "c": customerId, "s": body.get("saleId"), "no": gen_no("INS"),
             "fin": finance, "dp": down, "cnt": count, "per": per, "f": freq,
             "tp": round(per * count, 2), "u": user.id})
        for n in range(1, count + 1):
            await db.execute(text(
                "INSERT INTO installment_schedules (id, tenantId, installmentId, sequenceNo, dueDate, amount, paidAmount, status) "
                "VALUES (UUID(), :t, :ins, :n, :due, :amt, 0, 'DUE')"),
                {"t": tenantId, "ins": ins_id, "n": n, "due": datetime.now() + step * n, "amt": per})
        # Prompt 28 — welcome/reminder notification (consent-aware engine)
        try:
            import notify as _nt
            plan = (await db.execute(text("SELECT planNo FROM installments WHERE id=:i"), {"i": ins_id})).first()
            await _nt.dispatch(
                db, tenantId, "INSTALLMENT_DUE", customer_id=customerId, name=cust_name,
                ref_type="INSTALLMENT", ref_id=ins_id,
                params={"name": cust_name, "planNo": plan[0] if plan else "",
                        "amount": per, "dueDate": (datetime.now() + step).strftime("%Y-%m-%d")})
        except Exception:
            pass
    return ok({"id": ins_id, "perInstallment": per, "count": count}, 201)


@router.post("/api/v1/installments/{installmentId}/pay")
async def pay_installment(installmentId: str, body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    sched_id = body.get("scheduleId"); amount = float(body.get("amount", 0) or 0)
    if not sched_id or amount <= 0: return err("scheduleId and positive amount required", 400)
    async with txn(db):
        s = (await db.execute(text("SELECT id, amount, paidAmount, status FROM installment_schedules WHERE id=:id AND tenantId=:t FOR UPDATE"),
                              {"id": sched_id, "t": tenantId})).first()
        if not s: return err("Schedule not found", 404)
        if s[3] == "PAID": return err("Installment schedule already fully paid", 400)
        new_paid = float(s[2]) + amount
        new_status = "PAID" if new_paid >= float(s[1]) else "PARTIAL"
        await db.execute(text(
            "UPDATE installment_schedules SET paidAmount=:p, status=:st, paidAt=CASE WHEN :st='PAID' THEN NOW() ELSE paidAt END WHERE id=:id"),
            {"p": new_paid, "st": new_status, "id": sched_id})
        
        # Update parent installment paid total
        await db.execute(text(
            "UPDATE installments SET paidTotal = COALESCE(paidTotal, 0) + :amt, updatedAt = NOW() WHERE id=:id AND tenantId=:t"),
            {"amt": amount, "id": installmentId, "t": tenantId})
            
        remaining = (await db.execute(text(
            "SELECT COUNT(*) FROM installment_schedules WHERE installmentId=:ins AND status != 'PAID'"),
            {"ins": installmentId})).first()[0]
        if remaining == 0:
            await db.execute(text("UPDATE installments SET status='COMPLETED', updatedAt=NOW() WHERE id=:id"), {"id": installmentId})
        
        # Accounting (§10.20): INSTALLMENT_PAID journal — Debit Cash, Credit Accounts Receivable
        try:
            await acc.post_journal(db, tenantId, refType="INSTALLMENT_PAID", refId=installmentId,
                                   narration=f"Installment {installmentId} paid", lines=[
                                       ("1000", amount, 0.0, "Installment receipt"),
                                       ("1100", 0.0, amount, "AR settlement"),
                                   ], userId=user.id)
        except Exception:
            pass
            
        # Prompt 28 — payment receipt to the customer (consent-aware)
        try:
            import notify as _nt
            ins_row = (await db.execute(text(
                "SELECT ip.customerId, c.name, ip.planNo FROM installments ip "
                "JOIN customers c ON c.id=ip.customerId WHERE ip.id=:i AND ip.tenantId=:t"),
                {"i": installmentId, "t": tenantId})).first()
            if ins_row:
                await _nt.dispatch(
                    db, tenantId, "PAYMENT", customer_id=ins_row[0], name=ins_row[1],
                    ref_type="INSTALLMENT", ref_id=installmentId,
                    params={"name": ins_row[1], "amount": amount,
                            "invoiceNo": f"plan {ins_row[2]}"})
        except Exception:
            pass
    return ok({"paid": amount, "completed": remaining == 0})


@router.post("/api/v1/installments/{installmentId}/settle")
async def settle_installment(installmentId: str, body: dict, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    discount = float(body.get("discountAmount", 0) or 0)
    async with txn(db):
        ins = (await db.execute(text(
            "SELECT totalPayable, paidTotal FROM installments WHERE id=:id AND tenantId=:t"),
            {"id": installmentId, "t": tenantId})).first()
        if not ins: return err("Installment plan not found", 404)
        total_p = float(ins[0] or 0)
        paid_p = float(ins[1] or 0)
        remaining = max(0.0, total_p - paid_p - discount)
        
        await db.execute(text(
            "UPDATE installment_schedules SET status='PAID', paidAmount=amount, paidAt=NOW() WHERE installmentId=:id AND status != 'PAID'"),
            {"id": installmentId})
        await db.execute(text(
            "UPDATE installments SET status='COMPLETED', paidTotal=totalPayable, updatedAt=NOW() WHERE id=:id AND tenantId=:t"),
            {"id": installmentId, "t": tenantId})
    return ok({"settled": True, "settlementAmount": remaining, "discountAmount": discount})


@router.post("/api/v1/installments/{installmentId}/reschedule")
async def reschedule_installment(installmentId: str, body: dict, user: AuthUser = Depends(require_auth),
                                 tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    count = int(body.get("installmentCount", 0) or 0)
    if count <= 0: return err("installmentCount required", 400)
    async with txn(db):
        ins = (await db.execute(text(
            "SELECT financedAmount, paidTotal FROM installments WHERE id=:id AND tenantId=:t"),
            {"id": installmentId, "t": tenantId})).first()
        if not ins: raise Exception("Installment not found")
        remaining = float(ins[0]) - float(ins[1] or 0)
        await db.execute(text("DELETE FROM installment_schedules WHERE installmentId=:id AND status='DUE'"), {"id": installmentId})
        per = round(remaining / count, 2)
        from datetime import datetime, timedelta
        for n in range(1, count + 1):
            await db.execute(text(
                "INSERT INTO installment_schedules (id, tenantId, installmentId, installmentNo, dueDate, amount, paidAmount, status) "
                "VALUES (UUID(), :t, :ins, :n, :due, :amt, 0, 'DUE')"),
                {"t": tenantId, "ins": installmentId, "n": n, "due": datetime.now() + timedelta(days=30 * n), "amt": per})
        await db.execute(text("UPDATE installments SET installmentCount=:c WHERE id=:id"),
                         {"c": count, "id": installmentId})
    return ok({"rescheduled": True, "perInstallment": per})


# ═════════════════════════ SALES ORDERS / QUOTATIONS (§10.10-10.11) ═════════════════════════

@router.get("/api/v1/sales/orders")
async def list_sales_orders(
    search: str = "", source: str = "", status: str = "",
    page: int = Query(1), limit: int = Query(15),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    off, lim = paginate_params(page, limit)
    src_norm = (source or "").strip().upper()

    b2b_where = "so.tenantId = :t"
    pos_where = "s.tenantId = :t"
    params: dict = {"t": tenantId}
    if search:
        b2b_where += " AND (so.orderNo LIKE :s OR c.name LIKE :s OR c.phone LIKE :s)"
        pos_where += " AND (s.invoiceNo LIKE :s OR c.name LIKE :s OR c.phone LIKE :s)"
        params["s"] = f"%{search}%"
    if status:
        b2b_where += " AND so.status = :st"
        pos_where += " AND s.status = :st"
        params["st"] = status

    if src_norm in ("B2B", "CORPORATE"):
        total = (await db.execute(text(f"SELECT COUNT(*) FROM sales_orders so LEFT JOIN customers c ON c.id = so.customerId WHERE {b2b_where}"), params)).scalar() or 0
        total_vol = (await db.execute(text(f"SELECT COALESCE(SUM(so.total), 0) FROM sales_orders so LEFT JOIN customers c ON c.id = so.customerId WHERE {b2b_where}"), params)).scalar() or 0
        rows = rows_to_dicts((await db.execute(text(f"""
            SELECT so.id, so.orderNo, 'B2B' AS source, so.status, so.subtotal, so.total,
                   so.discountTotal, so.taxTotal,
                   0.00 AS paidTotal, so.total AS dueTotal, so.createdAt AS orderDate, so.createdAt, so.customerId,
                   c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail,
                   b.name AS branchName, 'PENDING' AS paymentStatus, NULL AS cashierId, NULL AS cashierName,
                   NULL AS paymentMethod
            FROM sales_orders so
            LEFT JOIN customers c ON c.id = so.customerId
            LEFT JOIN branches b ON b.id = so.branchId
            WHERE {b2b_where}
            ORDER BY so.createdAt DESC LIMIT :lim OFFSET :off
        """), {**params, "lim": lim, "off": off})).fetchall())
    elif src_norm in ("POS", "RETAIL"):
        total = (await db.execute(text(f"SELECT COUNT(*) FROM sales s LEFT JOIN customers c ON c.id = s.customerId WHERE {pos_where}"), params)).scalar() or 0
        total_vol = (await db.execute(text(f"SELECT COALESCE(SUM(s.total), 0) FROM sales s LEFT JOIN customers c ON c.id = s.customerId WHERE {pos_where}"), params)).scalar() or 0
        rows = rows_to_dicts((await db.execute(text(f"""
            SELECT s.id, s.invoiceNo AS orderNo, 'POS' AS source, s.status, s.subtotal, s.total,
                   s.discountTotal, s.taxTotal,
                   s.paidTotal, s.dueTotal, s.createdAt AS orderDate, s.createdAt, s.customerId,
                   s.paymentStatus, c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail,
                   b.name AS branchName,
                   s.userId AS cashierId, u.name AS cashierName,
                   (SELECT method FROM payments WHERE saleId = s.id LIMIT 1) AS paymentMethod
            FROM sales s
            LEFT JOIN customers c ON c.id = s.customerId
            LEFT JOIN branches b ON b.id = s.branchId
            LEFT JOIN users u ON u.id = s.userId
            WHERE {pos_where}
            ORDER BY s.createdAt DESC LIMIT :lim OFFSET :off
        """), {**params, "lim": lim, "off": off})).fetchall())
    else:
        b2b_cnt = (await db.execute(text(f"SELECT COUNT(*) FROM sales_orders so LEFT JOIN customers c ON c.id = so.customerId WHERE {b2b_where}"), params)).scalar() or 0
        pos_cnt = (await db.execute(text(f"SELECT COUNT(*) FROM sales s LEFT JOIN customers c ON c.id = s.customerId WHERE {pos_where}"), params)).scalar() or 0
        total = b2b_cnt + pos_cnt

        b2b_sum = (await db.execute(text(f"SELECT COALESCE(SUM(so.total), 0) FROM sales_orders so LEFT JOIN customers c ON c.id = so.customerId WHERE {b2b_where}"), params)).scalar() or 0
        pos_sum = (await db.execute(text(f"SELECT COALESCE(SUM(s.total), 0) FROM sales s LEFT JOIN customers c ON c.id = s.customerId WHERE {pos_where}"), params)).scalar() or 0
        total_vol = float(b2b_sum or 0) + float(pos_sum or 0)

        rows = rows_to_dicts((await db.execute(text(f"""
            SELECT * FROM (
                SELECT so.id, so.orderNo, 'B2B' AS source, so.status, so.subtotal, so.total,
                       so.discountTotal, so.taxTotal,
                       0.00 AS paidTotal, so.total AS dueTotal, so.createdAt AS orderDate, so.createdAt, so.customerId,
                       c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail,
                       b.name AS branchName, 'PENDING' AS paymentStatus, NULL AS cashierId, NULL AS cashierName,
                       NULL AS paymentMethod
                FROM sales_orders so
                LEFT JOIN customers c ON c.id = so.customerId
                LEFT JOIN branches b ON b.id = so.branchId
                WHERE {b2b_where}

                UNION ALL

                SELECT s.id, s.invoiceNo AS orderNo, 'POS' AS source, s.status, s.subtotal, s.total,
                       s.discountTotal, s.taxTotal,
                       s.paidTotal, s.dueTotal, s.createdAt AS orderDate, s.createdAt, s.customerId,
                       c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail,
                       b.name AS branchName, s.paymentStatus, s.userId AS cashierId, u.name AS cashierName,
                       (SELECT method FROM payments WHERE saleId = s.id LIMIT 1) AS paymentMethod
                FROM sales s
                LEFT JOIN customers c ON c.id = s.customerId
                LEFT JOIN branches b ON b.id = s.branchId
                LEFT JOIN users u ON u.id = s.userId
                WHERE {pos_where}
            ) AS combined_orders
            ORDER BY createdAt DESC LIMIT :lim OFFSET :off
        """), {**params, "lim": lim, "off": off})).fetchall())

    for r in rows:
        r["total"] = float(r.get("total", 0) or 0)
        is_pos = (r.get("source") == "POS")
        if is_pos:
            r["paidTotal"] = max(float(r.get("paidTotal", 0) or 0), r["total"])
            r["dueTotal"] = 0.0
            r["paymentStatus"] = "PAID"
            r["changeReturn"] = max(r["paidTotal"] - r["total"], 0.0)
            r["customer"] = {
                "id": r.get("customerId"),
                "name": r.pop("customerName", None) or "Walk-in Retail Customer",
                "phone": r.pop("customerPhone", None),
                "email": r.pop("customerEmail", None),
            }
            items = rows_to_dicts((await db.execute(text("""
                SELECT si.id, si.productId, si.name, p.sku, si.qty AS qtyOrdered, si.qty AS qtyDelivered,
                       0 AS qtyReserved, 0 AS qtyBackordered, si.unitPrice, si.lineTotal
                FROM sale_items si
                LEFT JOIN products p ON p.id = si.productId
                WHERE si.saleId = :id
            """), {"id": r["id"]})).fetchall())
            for it in items:
                it["qtyOrdered"] = float(it.get("qtyOrdered", 0) or 0)
                it["qtyDelivered"] = float(it.get("qtyDelivered", 0) or 0)
                it["qtyReserved"] = 0
                it["qtyBackordered"] = 0
                it["unitPrice"] = float(it.get("unitPrice", 0) or 0)
                it["lineTotal"] = float(it.get("lineTotal", 0) or 0)
            r["items"] = items
        else:
            r["paidTotal"] = float(r.get("paidTotal", 0) or 0)
            r["dueTotal"] = float(r.get("dueTotal", 0) or r["total"])
            r["customer"] = {
                "id": r.get("customerId"),
                "name": r.pop("customerName", None) or "Corporate Client",
                "phone": r.pop("customerPhone", None),
                "email": r.pop("customerEmail", None),
            }
            items = rows_to_dicts((await db.execute(text("""
                SELECT soi.id, soi.productId, p.name, p.sku, soi.qtyOrdered, 0 AS qtyDelivered,
                       0 AS qtyReserved, 0 AS qtyBackordered, soi.unitPrice, soi.lineTotal
                FROM sales_order_items soi
                LEFT JOIN products p ON p.id = soi.productId
                WHERE soi.salesOrderId = :id
            """), {"id": r["id"]})).fetchall())
            for it in items:
                it["name"] = it.pop("name", None) or it.get("productName") or "Item"
                it["qtyOrdered"] = float(it.get("qtyOrdered", 0) or 0)
                it["qtyDelivered"] = float(it.get("qtyDelivered", 0) or 0)
                it["qtyReserved"] = float(it.get("qtyReserved", 0) or 0)
                it["qtyBackordered"] = float(it.get("qtyBackordered", 0) or 0)
                it["unitPrice"] = float(it.get("unitPrice", 0) or 0)
                it["lineTotal"] = float(it.get("lineTotal", 0) or 0)
            r["items"] = items

    return ok(rows, extra={
        "pagination": {
            "page": page,
            "limit": lim,
            "total": total,
            "totalPages": max(1, math.ceil(total / lim)) if lim else 1
        }
    })


@router.get("/api/v1/sales/quotations")
async def list_quotations(
    search: str = "", status: str = "",
    page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "q.tenantId = :t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (q.quotationNo LIKE :s OR c.name LIKE :s OR c.phone LIKE :s OR c.email LIKE :s)"
        params["s"] = f"%{search}%"
    if status and status.upper() != "ALL":
        where += " AND q.status = :st"
        params["st"] = status.upper()

    off, lim = paginate_params(page, limit)
    total = (await db.execute(text(
        f"SELECT COUNT(*) FROM quotations q LEFT JOIN customers c ON c.id=q.customerId WHERE {where}"), params)).first()[0]

    rows = rows_to_dicts((await db.execute(text(f"""
        SELECT q.*, c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail
        FROM quotations q
        LEFT JOIN customers c ON c.id = q.customerId
        WHERE {where}
        ORDER BY q.createdAt DESC
        LIMIT :lim OFFSET :off
    """), {**params, "lim": lim, "off": off})).fetchall())

    if rows:
        q_ids = [r["id"] for r in rows]
        if len(q_ids) == 1:
            items = rows_to_dicts((await db.execute(text(
                "SELECT qi.*, p.name AS productName, p.sku FROM quotation_items qi "
                "LEFT JOIN products p ON p.id = qi.productId "
                "WHERE qi.quotationId = :qid"
            ), {"qid": q_ids[0]})).fetchall())
        else:
            items = rows_to_dicts((await db.execute(text(
                "SELECT qi.*, p.name AS productName, p.sku FROM quotation_items qi "
                "LEFT JOIN products p ON p.id = qi.productId "
                "WHERE qi.quotationId IN :qids"
            ), {"qids": tuple(q_ids)})).fetchall())

        items_by_q = {}
        for it in items:
            it["name"] = it.get("productName") or "Item"
            it["qty"] = float(it.get("qty", 0) or 0)
            it["unitPrice"] = float(it.get("unitPrice", 0) or 0)
            it["discountAmount"] = float(it.get("discountAmount", 0) or 0)
            it["taxAmount"] = float(it.get("taxAmount", 0) or 0)
            it["lineTotal"] = float(it.get("lineTotal", 0) or (it["qty"] * it["unitPrice"]))
            items_by_q.setdefault(it["quotationId"], []).append(it)

        for r in rows:
            r["customer"] = {
                "id": r.get("customerId"),
                "name": r.pop("customerName", None) or "Client",
                "phone": r.pop("customerPhone", None),
                "email": r.pop("customerEmail", None),
            } if r.get("customerId") or r.get("customerName") else None
            r["items"] = items_by_q.get(r["id"], [])
            r["total"] = float(r.get("total", 0) or 0)
            r["subtotal"] = float(r.get("subtotal", 0) or r["total"])

    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})


@router.post("/api/v1/sales/quotations")
async def create_quotation(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Quotation needs items", 400)
    total = sum(float(i.get("qty", 0)) * float(i.get("unitPrice", 0)) for i in items)
    qno = gen_no("QUO")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO quotations (id, tenantId, branchId, customerId, quotationNo, quotationDate, validUntil, subtotal, total, "
            "status, note, createdBy) VALUES (UUID(), :t, :b, :c, :q, NOW(), :valid, :sub, :total, 'DRAFT', :n, :u)"),
            {"t": tenantId, "b": body.get("branchId"), "c": body.get("customerId"), "q": qno,
             "valid": body.get("validUntil"), "sub": total, "total": total, "n": body.get("note"), "u": user.id})
        qid = (await db.execute(text("SELECT id FROM quotations WHERE tenantId=:t AND quotationNo=:q"),
                               {"t": tenantId, "q": qno})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO quotation_items (id, tenantId, quotationId, productId, qty, unitPrice, lineTotal) "
                "VALUES (UUID(), :t, :q, :p, :qty, :up, :lt)"),
                {"t": tenantId, "q": qid, "p": i["productId"], "qty": i.get("qty", 0), "up": i.get("unitPrice", 0),
                 "lt": float(i.get("qty", 0)) * float(i.get("unitPrice", 0))})
    return ok({"quoteNo": qno, "id": qid, "total": total}, 201)


# ═════════════════════════ INVOICES (§10.12) ═════════════════════════

@router.get("/api/v1/invoices/stats")
async def get_invoice_stats(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    """Executive KPI statistics for Invoice Engine."""
    row = (await db.execute(text("""
        SELECT 
            COUNT(*) AS totalInvoices,
            COALESCE(SUM(total), 0) AS totalAmount,
            COALESCE(SUM(paidTotal), 0) AS paidAmount,
            COALESCE(SUM(CASE WHEN status != 'VOID' THEN (total - paidTotal) ELSE 0 END), 0) AS outstandingAmount,
            COUNT(CASE WHEN status = 'PAID' THEN 1 END) AS paidCount,
            COUNT(CASE WHEN status = 'PARTIALLY_PAID' THEN 1 END) AS partiallyPaidCount,
            COUNT(CASE WHEN status = 'ISSUED' THEN 1 END) AS issuedCount,
            COUNT(CASE WHEN status = 'VOID' THEN 1 END) AS voidCount,
            COUNT(CASE WHEN invoiceType = 'TAX' THEN 1 END) AS taxCount,
            COUNT(CASE WHEN status NOT IN ('PAID', 'VOID') AND dueDate IS NOT NULL AND dueDate < CURDATE() THEN 1 END) AS overdueCount,
            COALESCE(SUM(CASE WHEN status NOT IN ('PAID', 'VOID') AND dueDate IS NOT NULL AND dueDate < CURDATE() THEN (total - paidTotal) ELSE 0 END), 0) AS overdueAmount
        FROM invoices WHERE tenantId = :t
    """), {"t": tenantId})).first()
    return ok(dict(row._mapping) if row else {})


@router.get("/api/v1/invoices")
async def list_invoices(
    search: str = "", status: str = "", invoiceType: str = "", customerId: str = "", branchId: str = "",
    overdue: bool = False, dateFrom: str = "", dateTo: str = "", sortBy: str = "createdAt", sortDir: str = "desc",
    page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "i.tenantId = :t"
    params: dict = {"t": tenantId}

    if status:
        if status == "OVERDUE":
            where += " AND i.status NOT IN ('PAID', 'VOID') AND i.dueDate IS NOT NULL AND i.dueDate < CURDATE()"
        elif status == "UNPAID":
            where += " AND i.status IN ('ISSUED', 'PARTIALLY_PAID')"
        else:
            where += " AND i.status = :st"
            params["st"] = status

    if invoiceType:
        where += " AND i.invoiceType = :it"
        params["it"] = invoiceType

    if customerId:
        where += " AND i.customerId = :cid"
        params["cid"] = customerId

    if branchId:
        where += " AND i.branchId = :bid"
        params["bid"] = branchId

    if overdue:
        where += " AND i.status NOT IN ('PAID', 'VOID') AND i.dueDate IS NOT NULL AND i.dueDate < CURDATE()"

    if dateFrom:
        where += " AND i.issueDate >= :df"
        params["df"] = dateFrom

    if dateTo:
        where += " AND i.issueDate <= :dt"
        params["dt"] = dateTo

    if search:
        where += " AND (i.invoiceNo LIKE :s OR c.name LIKE :s OR c.phone LIKE :s OR i.note LIKE :s)"
        params["s"] = f"%{search}%"

    allowed_sorts = {
        "createdAt": "i.createdAt",
        "issueDate": "i.issueDate",
        "dueDate": "i.dueDate",
        "total": "i.total",
        "paidTotal": "i.paidTotal",
        "invoiceNo": "i.invoiceNo",
        "customerName": "c.name",
    }
    sort_col = allowed_sorts.get(sortBy, "i.createdAt")
    direction = "ASC" if sortDir.lower() == "asc" else "DESC"

    off, lim = paginate_params(page, limit)

    query = f"""
        SELECT i.*, c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail,
               b.name AS branchName,
               (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoiceId = i.id) AS itemCount
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customerId
        LEFT JOIN branches b ON b.id = i.branchId
        WHERE {where}
        ORDER BY {sort_col} {direction}
        LIMIT :lim OFFSET :off
    """
    rows = rows_to_dicts((await db.execute(text(query), {**params, "lim": lim, "off": off})).fetchall())

    for r in rows:
        cust_name = r.pop("customerName", None)
        cust_phone = r.pop("customerPhone", None)
        cust_email = r.pop("customerEmail", None)
        cust_id = r.get("customerId")
        r["customer"] = {"id": cust_id, "name": cust_name, "phone": cust_phone, "email": cust_email} if cust_name or cust_id else None
        r["dueTotal"] = max(0.0, float(r.get("total", 0)) - float(r.get("paidTotal", 0)))
        r["_count"] = {"items": int(r.pop("itemCount", 0) or 0)}

    count_query = f"SELECT COUNT(*) FROM invoices i LEFT JOIN customers c ON c.id = i.customerId WHERE {where}"
    total = (await db.execute(text(count_query), params)).first()[0]

    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})


@router.post("/api/v1/invoices")
async def create_invoice(body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Create a new invoice with itemized line breakdown and optional immediate settlement."""
    branchId = body.get("branchId")
    if not branchId:
        br = (await db.execute(text("SELECT id FROM branches WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
        branchId = br[0] if br else _uuid()

    invoiceNo = body.get("invoiceNo") or gen_no("INV")
    invoiceType = body.get("invoiceType", "STANDARD")
    issueDate = body.get("issueDate") or None
    dueDate = body.get("dueDate") or None
    note = body.get("note") or None
    customerId = body.get("customerId") or None
    saleId = body.get("saleId") or None

    items = body.get("items") or []
    if not items:
        return err("At least one line item is required", 400)

    subtotal = 0.0
    discountTotal = 0.0
    taxTotal = 0.0
    total = 0.0

    calculated_items = []
    for item in items:
        desc = item.get("description") or item.get("name") or "Item"
        qty = float(item.get("qty", 1) or 1)
        unitPrice = float(item.get("unitPrice", 0) or 0)
        disc = float(item.get("discountAmount", 0) or 0)
        tax = float(item.get("taxAmount", 0) or 0)
        lineTot = (qty * unitPrice) - disc + tax

        subtotal += (qty * unitPrice)
        discountTotal += disc
        taxTotal += tax
        total += lineTot

        calculated_items.append({
            "id": _uuid(),
            "productId": item.get("productId") or None,
            "description": desc,
            "qty": qty,
            "unitPrice": unitPrice,
            "discountAmount": disc,
            "taxAmount": tax,
            "lineTotal": lineTot
        })

    initialPayment = float(body.get("paidTotal", 0) or body.get("initialPayment", 0) or 0)
    paidTotal = min(total, max(0.0, initialPayment))
    status = "PAID" if paidTotal >= total and total > 0 else ("PARTIALLY_PAID" if paidTotal > 0 else "ISSUED")

    inv_id = _uuid()
    async with txn(db):
        await db.execute(text("""
            INSERT INTO invoices (id, tenantId, branchId, saleId, customerId, invoiceNo, invoiceType,
                                 issueDate, dueDate, subtotal, discountTotal, taxTotal, total, paidTotal,
                                 status, note, createdBy, createdAt, updatedAt)
            VALUES (:id, :t, :b, :sid, :cid, :no, :itype, COALESCE(:idate, CURDATE()), :ddate,
                    :sub, :disc, :tax, :tot, :paid, :st, :note, :u, NOW(), NOW())
        """), {
            "id": inv_id, "t": tenantId, "b": branchId, "sid": saleId, "cid": customerId,
            "no": invoiceNo, "itype": invoiceType, "idate": issueDate, "ddate": dueDate,
            "sub": subtotal, "disc": discountTotal, "tax": taxTotal, "tot": total, "paid": paidTotal,
            "st": status, "note": note, "u": user.id
        })

        for ci in calculated_items:
            await db.execute(text("""
                INSERT INTO invoice_items (id, tenantId, invoiceId, productId, description, qty,
                                          unitPrice, discountAmount, taxAmount, lineTotal, status,
                                          createdBy, createdAt, updatedAt)
                VALUES (:id, :t, :inv, :pid, :desc, :qty, :up, :disc, :tax, :lt, 'ACTIVE', :u, NOW(), NOW())
            """), {
                "id": ci["id"], "t": tenantId, "inv": inv_id, "pid": ci["productId"],
                "desc": ci["description"], "qty": ci["qty"], "up": ci["unitPrice"],
                "disc": ci["discountAmount"], "tax": ci["taxAmount"], "lt": ci["lineTotal"], "u": user.id
            })

        if paidTotal > 0:
            await db.execute(text("""
                INSERT INTO payments (id, tenantId, branchId, invoiceId, customerId, method, amount,
                                     reference, status, createdBy, updatedAt)
                VALUES (UUID(), :t, :b, :inv, :c, :m, :amt, :ref, 'COMPLETED', :u, NOW())
            """), {
                "t": tenantId, "b": branchId, "inv": inv_id, "c": customerId,
                "m": body.get("paymentMethod", "CASH"), "amt": paidTotal,
                "ref": body.get("paymentReference", f"Initial payment for {invoiceNo}"), "u": user.id
            })

        unpaid = total - paidTotal
        if customerId and unpaid > 0:
            await db.execute(text("UPDATE customers SET currentDue = currentDue + :amt WHERE id = :c"),
                             {"amt": unpaid, "c": customerId})

    return ok({"id": inv_id, "invoiceNo": invoiceNo, "total": total, "paidTotal": paidTotal, "status": status}, 201)


@router.get("/api/v1/invoices/{invoiceId}")
async def get_invoice(invoiceId: str, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text(
        "SELECT i.*, c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail, b.name AS branchName "
        "FROM invoices i LEFT JOIN customers c ON c.id=i.customerId LEFT JOIN branches b ON b.id=i.branchId "
        "WHERE i.id=:id AND i.tenantId=:t"), {"id": invoiceId, "t": tenantId})).first()
    if not r: return err("Invoice not found", 404)
    d = dict(r._mapping)
    cust_name = d.pop("customerName", None)
    cust_phone = d.pop("customerPhone", None)
    cust_email = d.pop("customerEmail", None)
    cust_id = d.get("customerId")
    d["customer"] = {"id": cust_id, "name": cust_name, "phone": cust_phone, "email": cust_email} if cust_name or cust_id else None
    d["dueTotal"] = max(0.0, float(d.get("total", 0)) - float(d.get("paidTotal", 0)))
    d["items"] = rows_to_dicts((await db.execute(text(
        "SELECT * FROM invoice_items WHERE invoiceId=:id"), {"id": invoiceId})).fetchall())
    d["payments"] = rows_to_dicts((await db.execute(text(
        "SELECT id, method, amount, reference, status, createdAt FROM payments WHERE invoiceId=:id ORDER BY createdAt DESC"),
        {"id": invoiceId})).fetchall())
    return ok(d)


@router.post("/api/v1/invoices/{invoiceId}/void")
async def void_invoice(invoiceId: str, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    inv = (await db.execute(text("SELECT id, total, paidTotal, status, customerId FROM invoices WHERE id=:id AND tenantId=:t"),
                            {"id": invoiceId, "t": tenantId})).first()
    if not inv: return err("Invoice not found", 404)
    if inv[3] == "VOID": return err("Invoice is already void", 400)

    unpaid = float(inv[1]) - float(inv[2])
    async with txn(db):
        await db.execute(text("UPDATE invoices SET status='VOID', updatedAt=NOW() WHERE id=:id"), {"id": invoiceId})
        if inv[4] and unpaid > 0:
            await db.execute(text("UPDATE customers SET currentDue = GREATEST(0, currentDue - :amt) WHERE id=:c"),
                             {"amt": unpaid, "c": inv[4]})
    return ok({"id": invoiceId, "status": "VOID"})


@router.post("/api/v1/invoices/{invoiceId}/payments")
async def record_invoice_payment(invoiceId: str, body: dict, user: AuthUser = Depends(require_auth),
                                 tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    amount = float(body.get("amount", 0) or 0)
    if amount <= 0: return err("Payment amount must be greater than 0", 400)

    inv = (await db.execute(text("SELECT id, branchId, customerId, total, paidTotal, status, invoiceNo FROM invoices WHERE id=:id AND tenantId=:t FOR UPDATE"),
                            {"id": invoiceId, "t": tenantId})).first()
    if not inv: return err("Invoice not found", 404)
    if inv[5] == "VOID": return err("Cannot accept payment for a void invoice", 400)
    if inv[5] == "PAID": return err("Invoice is already fully paid", 400)

    tot = float(inv[3])
    prev_paid = float(inv[4])
    new_paid = prev_paid + amount
    new_status = "PAID" if new_paid >= tot - 0.01 else "PARTIALLY_PAID"

    branchId = body.get("branchId") or inv[1]
    customerId = inv[2]

    async with txn(db):
        await db.execute(text("""
            INSERT INTO payments (id, tenantId, branchId, invoiceId, customerId, method, amount,
                                 reference, status, createdBy, updatedAt)
            VALUES (UUID(), :t, :b, :inv, :c, :m, :amt, :ref, 'COMPLETED', :u, NOW())
        """), {
            "t": tenantId, "b": branchId, "inv": invoiceId, "c": customerId,
            "m": body.get("method", "CASH"), "amt": amount,
            "ref": body.get("reference", f"Payment for {inv[6]}"), "u": user.id
        })

        await db.execute(text("UPDATE invoices SET paidTotal=:p, status=:s, updatedAt=NOW() WHERE id=:id"),
                         {"p": new_paid, "s": new_status, "id": invoiceId})

        if customerId:
            await db.execute(text("UPDATE customers SET currentDue = GREATEST(0, currentDue - :amt) WHERE id=:c"),
                             {"amt": amount, "c": customerId})

    return ok({"invoiceId": invoiceId, "paidTotal": new_paid, "status": new_status, "allocated": amount}, 201)


@router.post("/api/v1/invoices/payments/allocate")
async def allocate_payment(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """One payment across multiple invoices (§10.12)."""
    allocations = body.get("allocations") or []
    amount = float(body.get("amount", 0) or 0)
    alloc_sum = sum(float(a["amount"]) for a in allocations)
    if not allocations: return err("allocations required", 400)
    if abs(alloc_sum - amount) > 0.01: return err(f"Allocation mismatch: {alloc_sum} vs {amount}", 400)
    customerId = body.get("customerId")
    async with txn(db):
        for a in allocations:
            await db.execute(text(
                "INSERT INTO payments (id, tenantId, branchId, invoiceId, customerId, method, amount, reference, status, createdBy, updatedAt) "
                "VALUES (UUID(), :t, :b, :inv, :c, :m, :amt, :ref, 'COMPLETED', :u, NOW())"),
                {"t": tenantId, "b": body.get("branchId"), "inv": a["invoiceId"], "c": customerId,
                 "m": body.get("method", "CASH"), "amt": a["amount"], "ref": body.get("reference"), "u": user.id})
            inv = (await db.execute(text("SELECT total, paidTotal FROM invoices WHERE id=:id FOR UPDATE"),
                                    {"id": a["invoiceId"]})).first()
            new_paid = float(inv[1]) + float(a["amount"])
            due = float(inv[0]) - new_paid
            await db.execute(text("UPDATE invoices SET paidTotal=:p, status=:s WHERE id=:id"),
                             {"p": new_paid, "s": "PAID" if due <= 0.01 else "PARTIALLY_PAID", "id": a["invoiceId"]})
        if customerId:
            await db.execute(text("UPDATE customers SET currentDue = currentDue - :amt WHERE id=:c"),
                             {"amt": amount, "c": customerId})
    return ok({"allocated": amount, "invoices": len(allocations)}, 201)


# ═════════════════════════ PAYMENT & COLLECTION MANAGEMENT ═════════════════════════

@router.get("/api/v1/payments/stats")
async def get_payment_stats(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Executive KPI stats for all payments & collections."""
    total_row = (await db.execute(text("""
        SELECT 
            COUNT(*) AS totalCount,
            COALESCE(SUM(CASE WHEN status != 'REFUNDED' THEN amount ELSE 0 END), 0) AS totalAmount,
            COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount ELSE 0 END), 0) AS refundAmount,
            COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END), 0) AS refundCount,
            COALESCE(SUM(CASE WHEN DATE(createdAt) = CURDATE() AND status != 'REFUNDED' THEN amount ELSE 0 END), 0) AS todayAmount,
            COALESCE(SUM(CASE WHEN DATE(createdAt) = CURDATE() THEN 1 ELSE 0 END), 0) AS todayCount,
            COALESCE(SUM(CASE WHEN method = 'CASH' AND status != 'REFUNDED' THEN amount ELSE 0 END), 0) AS cashAmount,
            COALESCE(SUM(CASE WHEN method IN ('BKASH', 'NAGAD', 'ROCKET', 'UPAY') AND status != 'REFUNDED' THEN amount ELSE 0 END), 0) AS mfsAmount,
            COALESCE(SUM(CASE WHEN method IN ('CARD', 'POS', 'VISA', 'MASTERCARD') AND status != 'REFUNDED' THEN amount ELSE 0 END), 0) AS cardAmount,
            COALESCE(SUM(CASE WHEN method IN ('BANK_TRANSFER', 'BANK', 'CHEQUE') AND status != 'REFUNDED' THEN amount ELSE 0 END), 0) AS bankAmount
        FROM payments
        WHERE tenantId = :t
    """), {"t": tenantId})).first()

    method_rows = rows_to_dicts((await db.execute(text("""
        SELECT method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS totalAmount
        FROM payments
        WHERE tenantId = :t AND status != 'REFUNDED'
        GROUP BY method
        ORDER BY totalAmount DESC
    """), {"t": tenantId})).fetchall())

    return ok({
        "totalCount": int(total_row[0] or 0),
        "totalAmount": float(total_row[1] or 0),
        "refundAmount": float(total_row[2] or 0),
        "refundCount": int(total_row[3] or 0),
        "todayAmount": float(total_row[4] or 0),
        "todayCount": int(total_row[5] or 0),
        "cashAmount": float(total_row[6] or 0),
        "mfsAmount": float(total_row[7] or 0),
        "cardAmount": float(total_row[8] or 0),
        "bankAmount": float(total_row[9] or 0),
        "byMethod": method_rows,
    })


@router.get("/api/v1/payments")
async def list_payments(
    search: str = "",
    method: str = "",
    status: str = "",
    customerId: str = "",
    branchId: str = "",
    invoiceId: str = "",
    dateFrom: str = "",
    dateTo: str = "",
    sortBy: str = "createdAt",
    sortDir: str = "desc",
    page: int = Query(1),
    limit: int = Query(20),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    """List paginated payments with filtering by method, status, customer, branch, invoice, and date."""
    where = "p.tenantId = :t"
    params: dict = {"t": tenantId}

    if method:
        where += " AND p.method = :m"
        params["m"] = method
    if status:
        where += " AND p.status = :st"
        params["st"] = status
    if customerId:
        where += " AND p.customerId = :cid"
        params["cid"] = customerId
    if branchId:
        where += " AND p.branchId = :bid"
        params["bid"] = branchId
    if invoiceId:
        where += " AND p.invoiceId = :invid"
        params["invid"] = invoiceId
    if dateFrom:
        where += " AND p.createdAt >= :df"
        params["df"] = f"{dateFrom} 00:00:00"
    if dateTo:
        where += " AND p.createdAt <= :dt"
        params["dt"] = f"{dateTo} 23:59:59"
    if search:
        where += " AND (p.reference LIKE :s OR c.name LIKE :s OR c.phone LIKE :s OR inv.invoiceNo LIKE :s OR s.invoiceNo LIKE :s)"
        params["s"] = f"%{search}%"

    allowed_sort = {
        "createdAt": "p.createdAt",
        "amount": "p.amount",
        "method": "p.method",
        "status": "p.status",
    }
    col = allowed_sort.get(sortBy, "p.createdAt")
    dir_str = "ASC" if sortDir.lower() == "asc" else "DESC"

    off, lim = paginate_params(page, limit)

    count_q = text(f"""
        SELECT COUNT(*)
        FROM payments p
        LEFT JOIN customers c ON c.id = p.customerId
        LEFT JOIN invoices inv ON inv.id = p.invoiceId
        LEFT JOIN sales s ON s.id = p.saleId
        WHERE {where}
    """)
    total = (await db.execute(count_q, params)).first()[0]

    select_q = text(f"""
        SELECT 
            p.id, p.tenantId, p.branchId, p.saleId, p.invoiceId, p.customerId,
            p.method, p.amount, p.reference, p.status, p.createdBy, p.createdAt, p.updatedAt,
            c.name AS customerName, c.phone AS customerPhone, c.email AS customerEmail, c.address AS customerAddress,
            inv.invoiceNo AS invoiceNo, inv.total AS invoiceTotal, inv.paidTotal AS invoicePaidTotal, inv.status AS invoiceStatus,
            s.invoiceNo AS saleInvoiceNo, s.total AS saleTotal,
            b.name AS branchName
        FROM payments p
        LEFT JOIN customers c ON c.id = p.customerId
        LEFT JOIN invoices inv ON inv.id = p.invoiceId
        LEFT JOIN sales s ON s.id = p.saleId
        LEFT JOIN branches b ON b.id = p.branchId
        WHERE {where}
        ORDER BY {col} {dir_str}
        LIMIT :lim OFFSET :off
    """)
    rows = rows_to_dicts((await db.execute(select_q, {**params, "lim": lim, "off": off})).fetchall())

    data = []
    for r in rows:
        cid = r.get("customerId")
        cname = r.pop("customerName", None)
        cphone = r.pop("customerPhone", None)
        cemail = r.pop("customerEmail", None)
        caddr = r.pop("customerAddress", None)
        r["customer"] = {"id": cid, "name": cname or "Walk-in Customer", "phone": cphone, "email": cemail, "address": caddr} if cid or cname else None

        inv_id = r.get("invoiceId")
        inv_no = r.pop("invoiceNo", None)
        inv_tot = r.pop("invoiceTotal", None)
        inv_paid = r.pop("invoicePaidTotal", None)
        inv_st = r.pop("invoiceStatus", None)
        if inv_id or inv_no:
            r["invoice"] = {"id": inv_id, "invoiceNo": inv_no, "total": float(inv_tot or 0), "paidTotal": float(inv_paid or 0), "status": inv_st}
        else:
            sale_inv = r.pop("saleInvoiceNo", None)
            sale_tot = r.pop("saleTotal", None)
            if sale_inv:
                r["invoice"] = {"id": r.get("saleId"), "invoiceNo": sale_inv, "total": float(sale_tot or 0), "paidTotal": float(sale_tot or 0), "status": "PAID"}
            else:
                r["invoice"] = None

        r["amount"] = float(r.get("amount") or 0)
        data.append(r)

    return ok(data, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})


@router.post("/api/v1/payments")
async def create_payment(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Record a direct customer payment, advance, or due collection."""
    amount = float(body.get("amount", 0) or 0)
    if amount <= 0:
        return err("Payment amount must be greater than 0", 400)

    pid = _uuid()
    method = str(body.get("method", "CASH")).upper()
    reference = body.get("reference") or f"RCP-{datetime.utcnow().strftime('%y%m')}-{_uuid()[:6].upper()}"
    customerId = body.get("customerId") or None
    invoiceId = body.get("invoiceId") or None
    branchId = body.get("branchId") or user.branchId or None
    if not branchId:
        b_row = (await db.execute(text("SELECT id FROM branches WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
        branchId = b_row[0] if b_row else "default"

    async with txn(db):
        await db.execute(text("""
            INSERT INTO payments (id, tenantId, branchId, invoiceId, customerId, method, amount, reference, status, createdBy, updatedAt)
            VALUES (:id, :t, :b, :inv, :c, :m, :amt, :ref, 'COMPLETED', :u, NOW())
        """), {
            "id": pid, "t": tenantId, "b": branchId, "inv": invoiceId, "c": customerId,
            "m": method, "amt": amount, "ref": reference, "u": user.id
        })

        if customerId:
            await db.execute(text("""
                UPDATE customers SET currentDue = GREATEST(0, currentDue - :amt) WHERE id = :c AND tenantId = :t
            """), {"amt": amount, "c": customerId, "t": tenantId})

        if invoiceId:
            inv = (await db.execute(text("""
                SELECT total, paidTotal FROM invoices WHERE id = :id AND tenantId = :t FOR UPDATE
            """), {"id": invoiceId, "t": tenantId})).first()
            if inv:
                new_paid = float(inv[1] or 0) + amount
                tot = float(inv[0] or 0)
                new_st = "PAID" if new_paid >= tot - 0.01 else "PARTIALLY_PAID"
                await db.execute(text("""
                    UPDATE invoices SET paidTotal = :p, status = :s, updatedAt = NOW() WHERE id = :id
                """), {"p": new_paid, "s": new_st, "id": invoiceId})

    return ok({
        "id": pid,
        "amount": amount,
        "method": method,
        "reference": reference,
        "status": "COMPLETED",
        "customerId": customerId,
        "invoiceId": invoiceId,
        "branchId": branchId,
    }, 201)


@router.post("/api/v1/payments/{paymentId}/refund")
async def refund_payment(
    paymentId: str,
    body: dict = {},
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    """Refund or void a payment transaction."""
    p = (await db.execute(text("""
        SELECT id, amount, status, customerId, invoiceId, method, reference FROM payments WHERE id = :id AND tenantId = :t FOR UPDATE
    """), {"id": paymentId, "t": tenantId})).first()
    if not p:
        return err("Payment transaction not found", 404)
    if p[2] == "REFUNDED":
        return err("Payment is already refunded", 400)

    amount = float(p[1])
    customerId = p[3]
    invoiceId = p[4]

    async with txn(db):
        await db.execute(text("""
            UPDATE payments SET status = 'REFUNDED', updatedAt = NOW() WHERE id = :id
        """), {"id": paymentId})

        if customerId:
            await db.execute(text("""
                UPDATE customers SET currentDue = currentDue + :amt WHERE id = :c AND tenantId = :t
            """), {"amt": amount, "c": customerId, "t": tenantId})

        if invoiceId:
            inv = (await db.execute(text("""
                SELECT total, paidTotal FROM invoices WHERE id = :id AND tenantId = :t FOR UPDATE
            """), {"id": invoiceId, "t": tenantId})).first()
            if inv:
                new_paid = max(0.0, float(inv[1] or 0) - amount)
                tot = float(inv[0] or 0)
                new_st = "ISSUED" if new_paid <= 0.01 else ("PAID" if new_paid >= tot - 0.01 else "PARTIALLY_PAID")
                await db.execute(text("""
                    UPDATE invoices SET paidTotal = :p, status = :s, updatedAt = NOW() WHERE id = :id
                """), {"p": new_paid, "s": new_st, "id": invoiceId})

    return ok({"id": paymentId, "status": "REFUNDED", "refundedAmount": amount})


# ═════════════════════════ INVOICE COLLECTIONS ═════════════════════════

@router.get("/api/v1/invoices/collection/entries")
async def list_collection_entries(
    search: str = "", page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "ce.tenantId = :t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (ce.collectionNo LIKE :s OR c.name LIKE :s OR c.phone LIKE :s OR i.invoiceNo LIKE :s)"
        params["s"] = f"%{search}%"

    off, lim = paginate_params(page, limit)
    total = (await db.execute(text(f"""
        SELECT COUNT(*) FROM collection_entries ce
        LEFT JOIN customers c ON c.id = ce.customerId
        LEFT JOIN invoices i ON i.id = ce.invoiceId
        WHERE {where}
    """), params)).first()[0]

    rows = rows_to_dicts((await db.execute(text(f"""
        SELECT ce.*, c.name AS customerName, c.phone AS customerPhone, i.invoiceNo, i.total AS invoiceTotal
        FROM collection_entries ce
        LEFT JOIN customers c ON c.id = ce.customerId
        LEFT JOIN invoices i ON i.id = ce.invoiceId
        WHERE {where} ORDER BY ce.collectedAt DESC LIMIT :lim OFFSET :off
    """), {**params, "lim": lim, "off": off})).fetchall())
    for r in rows:
        r["isOffline"] = bool(r.get("isOffline"))
        r["amount"] = float(r.get("amount") or 0)
        if r.get("customerName"):
            r["customer"] = {"id": r.get("customerId"), "name": r.get("customerName"), "phone": r.get("customerPhone")}
        if r.get("invoiceNo"):
            r["invoice"] = {"id": r.get("invoiceId"), "invoiceNo": r.get("invoiceNo"), "total": float(r.get("invoiceTotal") or 0)}
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})

@router.post("/api/v1/invoices/collection/entries")
async def create_collection_entry(body: dict, user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    cid = _uuid()
    no = f"COL-{int(datetime.now().timestamp())}"
    amt = float(body.get("amount") or 0)
    async with txn(db):
        await db.execute(text(
            "INSERT INTO collection_entries (id, tenantId, branchId, collectionNo, collectorId, customerId, invoiceId, method, amount, receiptNo, note, isOffline, status, collectedAt, createdAt) "
            "VALUES (:id, :t, :b, :no, :col, :c, :inv, :m, :amt, :rec, :note, :off, 'COMPLETED', NOW(), NOW())"
        ), {
            "id": cid, "t": tenantId, "b": body.get("branchId"), "no": no, "col": body.get("collectorId") or user.id,
            "c": body.get("customerId"), "inv": body.get("invoiceId"), "m": body.get("method") or "CASH",
            "amt": amt, "rec": body.get("receiptNo"), "note": body.get("note"), "off": 1 if body.get("isOffline") else 0
        })
        if body.get("invoiceId") and amt > 0:
            inv = (await db.execute(text("SELECT total, paidTotal FROM invoices WHERE id = :id"), {"id": body.get("invoiceId")})).first()
            if inv:
                new_paid = float(inv[1] or 0) + amt
                due = float(inv[0] or 0) - new_paid
                await db.execute(text("UPDATE invoices SET paidTotal = :p, status = :s WHERE id = :id"),
                                 {"p": new_paid, "s": "PAID" if due <= 0.01 else "PARTIALLY_PAID", "id": body.get("invoiceId")})
        if body.get("customerId") and amt > 0:
            await db.execute(text("UPDATE customers SET currentDue = GREATEST(0, currentDue - :amt) WHERE id = :c"),
                             {"amt": amt, "c": body.get("customerId")})
    return ok({"id": cid, "collectionNo": no}, 201)

@router.get("/api/v1/invoices/collection/schedules")
async def list_collection_schedules(
    status: str = "", page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "cs.tenantId = :t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND cs.status = :st"
        params["st"] = status

    off, lim = paginate_params(page, limit)
    total = (await db.execute(text(f"""
        SELECT COUNT(*) FROM collection_schedules cs
        LEFT JOIN customers c ON c.id = cs.customerId
        LEFT JOIN invoices i ON i.id = cs.invoiceId
        WHERE {where}
    """), params)).first()[0]

    rows = rows_to_dicts((await db.execute(text(f"""
        SELECT cs.*, c.name AS customerName, c.phone AS customerPhone, i.invoiceNo, i.total AS invoiceTotal, i.paidTotal AS invoicePaidTotal
        FROM collection_schedules cs
        LEFT JOIN customers c ON c.id = cs.customerId
        LEFT JOIN invoices i ON i.id = cs.invoiceId
        WHERE {where} ORDER BY cs.scheduledAt ASC LIMIT :lim OFFSET :off
    """), {**params, "lim": lim, "off": off})).fetchall())
    for r in rows:
        r["expectedAmount"] = float(r.get("expectedAmount") or 0)
        r["collectedAmount"] = float(r.get("collectedAmount") or 0)
        if r.get("customerName"):
            r["customer"] = {"id": r.get("customerId"), "name": r.get("customerName"), "phone": r.get("customerPhone")}
        if r.get("invoiceNo"):
            r["invoice"] = {"id": r.get("invoiceId"), "invoiceNo": r.get("invoiceNo"), "total": float(r.get("invoiceTotal") or 0), "paidTotal": float(r.get("invoicePaidTotal") or 0)}
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})

@router.post("/api/v1/invoices/collection/schedules")
async def create_collection_schedule(body: dict, user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    sid = _uuid()
    sched_at = body.get("scheduledAt") or datetime.now().isoformat()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO collection_schedules (id, tenantId, collectorId, customerId, invoiceId, scheduledAt, expectedAmount, collectedAmount, status, note, createdAt) "
            "VALUES (:id, :t, :col, :c, :inv, :sat, :exp, 0.00, 'PENDING', :note, NOW())"
        ), {
            "id": sid, "t": tenantId, "col": body.get("collectorId") or user.id, "c": body.get("customerId"),
            "inv": body.get("invoiceId"), "sat": sched_at, "exp": float(body.get("expectedAmount") or 0),
            "note": body.get("note")
        })
    return ok({"id": sid}, 201)

@router.get("/api/v1/invoices/collection/performance")
async def get_collection_performance(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    targets = rows_to_dicts((await db.execute(text(
        "SELECT ct.* FROM collection_targets ct WHERE ct.tenantId = :t"
    ), {"t": tenantId})).fetchall())
    res = []
    for t in targets:
        collected = (await db.execute(text(
            "SELECT COALESCE(SUM(amount), 0) FROM collection_entries "
            "WHERE tenantId = :t AND collectorId = :col AND DATE_FORMAT(collectedAt, '%Y-%m') = :p"
        ), {"t": tenantId, "col": t["collectorId"], "p": t["period"]})).first()[0]
        t_amt = float(t.get("targetAmount") or 0)
        c_amt = float(collected or 0)
        pct = round((c_amt / t_amt * 100), 1) if t_amt > 0 else 0.0
        res.append({
            "collectorId": t["collectorId"],
            "period": t["period"],
            "targetAmount": t_amt,
            "collectedAmount": c_amt,
            "achievementPct": pct
        })
    return ok(res)

@router.post("/api/v1/invoices/collection/targets")
async def set_collection_target(body: dict, user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    tid = _uuid()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO collection_targets (id, tenantId, branchId, collectorId, period, targetAmount, createdAt) "
            "VALUES (:id, :t, :b, :col, :p, :tamt, NOW())"
        ), {
            "id": tid, "t": tenantId, "b": body.get("branchId"), "col": body.get("collectorId") or user.id,
            "p": body.get("period") or datetime.now().strftime("%Y-%m"), "tamt": float(body.get("targetAmount") or 0)
        })
    return ok({"id": tid}, 201)


# ═════════════════════════ PRICING (§10.5) ═════════════════════════

@router.get("/api/v1/price-lists")
async def list_price_lists(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                           db: AsyncSession = Depends(get_db)):
    # Prompt 39: price config cached 60s per tenant; invalidated on writes below.
    import cache as cache_mod
    from util import ApiJSONResponse
    cache_key = f"price_lists:{tenantId}:list"
    hit = cache_mod.get(cache_key)
    if hit is not None:
        return ApiJSONResponse(hit)
    rows = rows_to_dicts((await db.execute(text(
        "SELECT pl.*, (SELECT COUNT(*) FROM price_list_items x WHERE x.priceListId = pl.id) itemCount "
        "FROM price_lists pl WHERE pl.tenantId=:t ORDER BY pl.createdAt DESC"), {"t": tenantId})).fetchall())
    for r in rows: r["_count"] = {"items": r.pop("itemCount")}
    body = {"data": rows}
    cache_mod.set(cache_key, body, ttl=60)
    return ApiJSONResponse(body)


@router.post("/api/v1/price-lists")
async def create_price_list(body: dict, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    import uuid
    pl_id = str(uuid.uuid4())
    await db.execute(text(
        "INSERT INTO price_lists (id, tenantId, name, currency, isDefault, createdBy) VALUES (:id, :t, :n, :c, :d, :u)"),
        {"id": pl_id, "t": tenantId, "n": name, "c": body.get("currency", "BDT"), "d": 1 if body.get("isDefault") else 0, "u": user.id})
    await db.commit()
    import cache as cache_mod
    cache_mod.invalidate_namespace("price_lists", tenantId)
    return ok({"created": True, "id": pl_id}, 201)

@router.delete("/api/v1/price-lists/{id}")
async def delete_price_list(id: str, user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    async with txn(db):
        await db.execute(text("DELETE FROM price_list_items WHERE priceListId = :id AND tenantId = :t"), {"id": id, "t": tenantId})
        await db.execute(text("DELETE FROM price_lists WHERE id = :id AND tenantId = :t"), {"id": id, "t": tenantId})
    import cache as cache_mod
    cache_mod.invalidate_namespace("price_lists", tenantId)
    return ok({"deleted": True})

@router.get("/api/v1/price-lists/{id}/items")
async def list_price_list_items(id: str, user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT pli.*, p.name AS productName, p.sku AS productSku, p.sellingPrice AS defaultSellingPrice "
        "FROM price_list_items pli "
        "JOIN products p ON p.id = pli.productId "
        "WHERE pli.priceListId = :id AND pli.tenantId = :t ORDER BY pli.createdAt DESC"
    ), {"id": id, "t": tenantId})).fetchall())
    for r in rows:
        r["price"] = float(r.get("price") or 0)
        r["defaultSellingPrice"] = float(r.get("defaultSellingPrice") or 0)
    return ok(rows)

@router.post("/api/v1/price-lists/{id}/items")
async def add_price_list_item(id: str, body: dict, user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    import uuid
    productId = body.get("productId")
    price = float(body.get("price") or 0)
    minQty = int(body.get("minQty") or 1)
    if not productId:
        return err("productId is required", 400)
    item_id = str(uuid.uuid4())
    async with txn(db):
        existing = (await db.execute(text("SELECT id FROM price_list_items WHERE priceListId = :id AND productId = :p AND tenantId = :t"), {"id": id, "p": productId, "t": tenantId})).first()
        if existing:
            await db.execute(text("UPDATE price_list_items SET price = :pr, minQty = :mq, updatedAt = NOW() WHERE id = :item_id"), {"pr": price, "mq": minQty, "item_id": existing[0]})
        else:
            await db.execute(text(
                "INSERT INTO price_list_items (id, tenantId, priceListId, productId, minQty, price, status, createdAt, updatedAt) "
                "VALUES (:id, :t, :plid, :pid, :mq, :pr, 'ACTIVE', NOW(), NOW())"
            ), {"id": item_id, "t": tenantId, "plid": id, "pid": productId, "mq": minQty, "pr": price})
    import cache as cache_mod
    cache_mod.invalidate_namespace("price_lists", tenantId)
    return ok({"saved": True}, 201)


@router.get("/api/v1/promotions")
async def list_promotions(
    search: str = "", page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (name LIKE :s OR description LIKE :s)"
        params["s"] = f"%{search}%"

    off, lim = paginate_params(page, limit)
    total = (await db.execute(text(f"SELECT COUNT(*) FROM promotions WHERE {where}"), params)).first()[0]
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM promotions WHERE {where} ORDER BY createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})


@router.post("/api/v1/promotions")
async def create_promotion(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name, ptype = body.get("name"), body.get("type")
    if not name or not ptype: return err("Name and type are required", 400)
    await db.execute(text(
        "INSERT INTO promotions (id, tenantId, name, description, type, value, min_qty, minAmount, maxDiscount, "
        "validFrom, validTo, priority, isActive, createdBy) "
        "VALUES (UUID(), :t, :n, :d, :ty, :v, :mq, :ma, :md, :vf, :vt, :pr, 1, :u)"),
        {"t": tenantId, "n": name, "d": body.get("description"), "ty": ptype, "v": body.get("value", 0),
         "mq": body.get("minQty"), "ma": body.get("minAmount"), "md": body.get("maxDiscount"),
         "vf": body.get("validFrom"), "vt": body.get("validTo"), "pr": body.get("priority", 0), "u": user.id})
    await db.commit()
    return ok({"created": True}, 201)


@router.get("/api/v1/coupons")
async def list_coupons(
    search: str = "", page: int = Query(1), limit: int = Query(20),
    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db)
):
    where = "tenantId=:t"
    params: dict = {"t": tenantId}
    if search:
        where += " AND (code LIKE :s OR description LIKE :s)"
        params["s"] = f"%{search}%"

    off, lim = paginate_params(page, limit)
    total = (await db.execute(text(f"SELECT COUNT(*) FROM coupons WHERE {where}"), params)).first()[0]
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM coupons WHERE {where} ORDER BY createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": math.ceil(total / lim) if lim else 1}})


@router.post("/api/v1/coupons")
async def create_coupon(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    code = body.get("code")
    if not code: return err("Code is required", 400)
    dup = (await db.execute(text("SELECT id FROM coupons WHERE tenantId=:t AND code=:c"), {"t": tenantId, "c": code})).first()
    if dup: return err("Coupon code already exists", 409)
    await db.execute(text(
        "INSERT INTO coupons (id, tenantId, code, description, discountType, discountValue, minAmount, maxDiscount, "
        "usageLimit, validFrom, validTo, isActive, createdBy) "
        "VALUES (UUID(), :t, :c, :d, :dt, :dv, :ma, :md, :ul, :vf, :vt, 1, :u)"),
        {"t": tenantId, "c": code, "d": body.get("description"), "dt": body.get("discountType", "PERCENTAGE"),
         "dv": body.get("discountValue", 0), "ma": body.get("minAmount"), "md": body.get("maxDiscount"),
         "ul": body.get("usageLimit"), "vf": body.get("validFrom"), "vt": body.get("validTo"), "u": user.id})
    await db.commit()
    return ok({"created": True}, 201)


# ═════════════════════════ INVENTORY QUERIES (§10.16) ═════════════════════════

@router.get("/api/v1/inventory/stock/{warehouseId}")
async def stock_by_warehouse(warehouseId: str, search: str = "", user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    where = "s.tenantId=:t AND s.warehouseId=:w"
    params: dict = {"t": tenantId, "w": warehouseId}
    if search: where += " AND p.name LIKE :q"; params["q"] = f"%{search}%"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT s.*, p.name AS productName, p.sku FROM stock s JOIN products p ON p.id=s.productId "
        f"WHERE {where} ORDER BY p.name"), params)).fetchall())
    for r in rows:
        r["product"] = {"id": r.pop("productId"), "name": r.pop("productName"), "sku": r.pop("sku")}
        r["warehouse"] = {"id": r.pop("warehouseId")}
        r["qtyAvailable"] = float(r["qtyOnHand"]) - float(r["qtyReserved"])
    return ok(rows)


@router.get("/api/v1/inventory/movements")
async def stock_movements(productId: str = "", warehouseId: str = "", movementType: str = "", limit: int = Query(50),
                          user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                          db: AsyncSession = Depends(get_db)):
    where = "sm.tenantId=:t"; params: dict = {"t": tenantId}
    if productId: where += " AND sm.productId=:p"; params["p"] = productId
    if warehouseId: where += " AND sm.warehouseId=:w"; params["w"] = warehouseId
    if movementType: where += " AND sm.movementType=:mt"; params["mt"] = movementType
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT sm.*, p.name AS productName, p.sku AS productSku, w.name AS warehouseName, w.code AS warehouseCode FROM stock_movements sm "
        f"LEFT JOIN products p ON p.id=sm.productId LEFT JOIN warehouses w ON w.id=sm.warehouseId "
        f"WHERE {where} ORDER BY sm.createdAt DESC LIMIT :lim"),
        {**params, "lim": min(limit, 200)})).fetchall())
    for r in rows:
        p_name = r.pop("productName", None) or "Unknown Product"
        p_sku = r.pop("productSku", None) or "—"
        w_name = r.pop("warehouseName", None) or "Main Warehouse"
        w_code = r.pop("warehouseCode", None) or "MAIN"
        r["product"] = {"id": r.get("productId") or "", "name": p_name, "sku": p_sku}
        r["warehouse"] = {"id": r.get("warehouseId") or "", "name": w_name, "code": w_code}
    return ok(rows)


@router.get("/api/v1/inventory/batches")
async def list_batches(expiringSoon: bool = False, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    extra = "AND b.expiryDate IS NOT NULL AND b.expiryDate <= NOW() + INTERVAL 30 DAY" if expiringSoon else ""
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT b.*, p.name AS productName FROM batches b JOIN products p ON p.id=b.productId "
        f"WHERE b.tenantId=:t AND b.qty > 0 {extra} ORDER BY b.expiryDate"),
        {"t": tenantId})).fetchall())
    for r in rows: r["product"] = {"id": r.pop("productId"), "name": r.pop("productName")}
    return ok(rows)


@router.get("/api/v1/inventory/serials")
async def list_serials(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                       db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT s.*, p.name AS productName FROM serials s JOIN products p ON p.id=s.productId "
        "WHERE s.tenantId=:t ORDER BY s.createdAt DESC LIMIT 200"), {"t": tenantId})).fetchall())
    for r in rows: r["product"] = {"id": r.pop("productId"), "name": r.pop("productName")}
    return ok(rows)


@router.get("/api/v1/inventory/transfers")
async def list_transfers(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                         db: AsyncSession = Depends(get_db)):
    t_rows = (await db.execute(text("""
        SELECT st.id, st.transferNo, st.status, st.note, st.createdAt,
               wf.id AS from_id, wf.name AS from_name, wf.code AS from_code,
               wt.id AS to_id, wt.name AS to_name, wt.code AS to_code
        FROM stock_transfers st
        LEFT JOIN warehouses wf ON wf.id = st.fromWarehouseId
        LEFT JOIN warehouses wt ON wt.id = st.toWarehouseId
        WHERE st.tenantId = :t
        ORDER BY st.createdAt DESC LIMIT 100
    """), {"t": tenantId})).fetchall()

    if not t_rows:
        return ok([])

    t_ids = [r[0] for r in t_rows]
    items_by_transfer = {}
    if t_ids:
        placeholders = ", ".join(f":t_{i}" for i in range(len(t_ids)))
        params = {"t": tenantId, **{f"t_{i}": tid for i, tid in enumerate(t_ids)}}
        item_rows = (await db.execute(text(f"""
            SELECT sti.id, sti.transferId, sti.qty, sti.productId,
                   COALESCE(p.name, sti.productId) AS product_name,
                   COALESCE(p.sku, '') AS product_sku
            FROM stock_transfer_items sti
            LEFT JOIN products p ON p.id = sti.productId
            WHERE sti.tenantId = :t AND sti.transferId IN ({placeholders})
        """), params)).fetchall()

        for ir in item_rows:
            tr_id = ir[1]
            if tr_id not in items_by_transfer:
                items_by_transfer[tr_id] = []
            items_by_transfer[tr_id].append({
                "id": ir[0],
                "qty": float(ir[2]),
                "productId": ir[3],
                "product": {
                    "name": ir[4],
                    "sku": ir[5]
                }
            })

    result = []
    for r in t_rows:
        tid = r[0]
        result.append({
            "id": tid,
            "transferNo": r[1],
            "status": r[2],
            "note": r[3],
            "createdAt": r[4].isoformat() if hasattr(r[4], "isoformat") else str(r[4]),
            "fromWarehouse": {
                "id": r[5] or "",
                "name": r[6] or "Unknown Source",
                "code": r[7] or "SRC"
            },
            "toWarehouse": {
                "id": r[8] or "",
                "name": r[9] or "Unknown Destination",
                "code": r[10] or "DST"
            },
            "items": items_by_transfer.get(tid, [])
        })

    return ok(result)


@router.post("/api/v1/inventory/transfers")
async def create_transfer(body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Transfer needs items", 400)
    from_, to_ = body.get("fromWarehouseId"), body.get("toWarehouseId")
    if not from_ or not to_: return err("fromWarehouseId and toWarehouseId required", 400)
    if from_ == to_: return err("Source and destination must differ", 400)
    trf_no = gen_no("TRF")
    trf_id = _uuid()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO stock_transfers (id, tenantId, transferNo, fromWarehouseId, toWarehouseId, transferDate, status, note, createdBy, updatedAt) "
            "VALUES (:id, :t, :no, :f, :to, NOW(), 'REQUESTED', :n, :u, NOW())"),
            {"id": trf_id, "t": tenantId, "no": trf_no, "f": from_, "to": to_, "n": body.get("note"), "u": user.id})
        for i in items:
            await db.execute(text(
                "INSERT INTO stock_transfer_items (id, tenantId, transferId, productId, variantId, qty, toWarehouseId, updatedAt) "
                "VALUES (UUID(), :t, :trf, :p, :v, :q, :to, NOW())"),
                {"t": tenantId, "trf": trf_id, "p": i["productId"], "v": i.get("variantId"), "q": float(i["qty"]), "to": to_})
    return ok({"transferNo": trf_no, "id": trf_id, "status": "REQUESTED"}, 201)


@router.post("/api/v1/inventory/transfers/{transfer_id}/approve")
async def approve_transfer(transfer_id: str, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    trf = (await db.execute(text(
        "SELECT id, status FROM stock_transfers WHERE id=:id AND tenantId=:t"),
        {"id": transfer_id, "t": tenantId})).first()
    if not trf: return err("Transfer not found", 404)
    if trf[1] not in ("DRAFT", "REQUESTED"):
        return err(f"Cannot approve transfer with status {trf[1]}", 400)

    async with txn(db):
        await db.execute(text(
            "UPDATE stock_transfers SET status='APPROVED', updatedBy=:u, updatedAt=NOW() WHERE id=:id AND tenantId=:t"),
            {"id": transfer_id, "t": tenantId, "u": user.id})
    return ok({"id": transfer_id, "status": "APPROVED", "message": "Transfer approved"})


@router.post("/api/v1/inventory/transfers/{transfer_id}/ship")
async def ship_transfer(transfer_id: str, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    trf = (await db.execute(text(
        "SELECT id, status, fromWarehouseId, toWarehouseId, transferNo FROM stock_transfers WHERE id=:id AND tenantId=:t"),
        {"id": transfer_id, "t": tenantId})).first()
    if not trf: return err("Transfer not found", 404)
    if trf[1] not in ("APPROVED", "REQUESTED", "DRAFT"):
        return err(f"Cannot ship transfer with status {trf[1]}", 400)

    from_wh, to_wh, trf_no = trf[2], trf[3], trf[4]
    items = (await db.execute(text(
        "SELECT productId, variantId, qty FROM stock_transfer_items WHERE transferId=:id AND tenantId=:t"),
        {"id": transfer_id, "t": tenantId})).fetchall()
    if not items: return err("Transfer has no items", 400)

    # Check allow negative stock config
    cfg = (await db.execute(text("SELECT allowNegativeStock FROM tenant_inventory_configs WHERE tenantId=:t"), {"t": tenantId})).first()
    allow_neg = bool(cfg[0]) if cfg else False

    async with txn(db):
        for it in items:
            pid, vid, qty = it[0], it[1], float(it[2])
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": from_wh, "p": pid, "v": vid})).first()
            curr_qty = float(st[1]) if st else 0.0
            if not allow_neg and curr_qty < qty:
                return err(f"Insufficient stock at source warehouse for product {pid}: available {curr_qty}, need {qty}", 400)

            if st:
                await db.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand - :q, updatedAt=NOW() WHERE id=:id"),
                                 {"q": qty, "id": st[0]})
            else:
                await db.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, updatedAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, :q, 0, NOW())"),
                    {"t": tenantId, "w": from_wh, "p": pid, "v": vid, "q": -qty})

            # Record stock movement TRANSFER_OUT
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy, createdAt) "
                "VALUES (UUID(), :t, :w, :p, :v, 'TRANSFER_OUT', :q, :qb, :qa, 'TRANSFER', :rid, :note, :u, :u, NOW())"),
                {"t": tenantId, "w": from_wh, "p": pid, "v": vid, "q": -qty, "qb": curr_qty, "qa": curr_qty - qty,
                 "rid": transfer_id, "note": f"Transfer Ship {trf_no}", "u": user.id})

        await db.execute(text(
            "UPDATE stock_transfers SET status='IN_TRANSIT', updatedBy=:u, updatedAt=NOW() WHERE id=:id AND tenantId=:t"),
            {"id": transfer_id, "t": tenantId, "u": user.id})

    return ok({"id": transfer_id, "status": "IN_TRANSIT", "message": "Transfer marked as in-transit"})


@router.post("/api/v1/inventory/transfers/{transfer_id}/receive")
async def receive_transfer(transfer_id: str, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    trf = (await db.execute(text(
        "SELECT id, status, fromWarehouseId, toWarehouseId, transferNo FROM stock_transfers WHERE id=:id AND tenantId=:t"),
        {"id": transfer_id, "t": tenantId})).first()
    if not trf: return err("Transfer not found", 404)
    if trf[1] in ("RECEIVED", "CANCELLED"):
        return err(f"Transfer already {trf[1]}", 400)

    from_wh, to_wh, trf_no, prev_status = trf[2], trf[3], trf[4], trf[1]
    items = (await db.execute(text(
        "SELECT productId, variantId, qty FROM stock_transfer_items WHERE transferId=:id AND tenantId=:t"),
        {"id": transfer_id, "t": tenantId})).fetchall()
    if not items: return err("Transfer has no items", 400)

    async with txn(db):
        # If not shipped yet, deduct source warehouse first
        if prev_status != "IN_TRANSIT":
            for it in items:
                pid, vid, qty = it[0], it[1], float(it[2])
                st_src = (await db.execute(text(
                    "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                    {"t": tenantId, "w": from_wh, "p": pid, "v": vid})).first()
                curr_src = float(st_src[1]) if st_src else 0.0
                if st_src:
                    await db.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand - :q, updatedAt=NOW() WHERE id=:id"),
                                     {"q": qty, "id": st_src[0]})
                else:
                    await db.execute(text(
                        "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, updatedAt) "
                        "VALUES (UUID(), :t, :w, :p, :v, :q, 0, NOW())"),
                        {"t": tenantId, "w": from_wh, "p": pid, "v": vid, "q": -qty})
                await db.execute(text(
                    "INSERT INTO stock_movements (id, tenantId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy, createdAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, 'TRANSFER_OUT', :q, :qb, :qa, 'TRANSFER', :rid, :note, :u, :u, NOW())"),
                    {"t": tenantId, "w": from_wh, "p": pid, "v": vid, "q": -qty, "qb": curr_src, "qa": curr_src - qty,
                     "rid": transfer_id, "note": f"Transfer Direct Receive {trf_no}", "u": user.id})

        # Add to destination warehouse
        for it in items:
            pid, vid, qty = it[0], it[1], float(it[2])
            st_dst = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": to_wh, "p": pid, "v": vid})).first()
            curr_dst = float(st_dst[1]) if st_dst else 0.0
            if st_dst:
                await db.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand + :q, updatedAt=NOW() WHERE id=:id"),
                                 {"q": qty, "id": st_dst[0]})
            else:
                await db.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, updatedAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, :q, 0, NOW())"),
                    {"t": tenantId, "w": to_wh, "p": pid, "v": vid, "q": qty})

            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy, createdAt) "
                "VALUES (UUID(), :t, :w, :p, :v, 'TRANSFER_IN', :q, :qb, :qa, 'TRANSFER', :rid, :note, :u, :u, NOW())"),
                {"t": tenantId, "w": to_wh, "p": pid, "v": vid, "q": qty, "qb": curr_dst, "qa": curr_dst + qty,
                 "rid": transfer_id, "note": f"Transfer Received {trf_no}", "u": user.id})

        await db.execute(text(
            "UPDATE stock_transfers SET status='RECEIVED', updatedBy=:u, updatedAt=NOW() WHERE id=:id AND tenantId=:t"),
            {"id": transfer_id, "t": tenantId, "u": user.id})

    return ok({"id": transfer_id, "status": "RECEIVED", "message": "Transfer successfully received and stock added"})


@router.post("/api/v1/inventory/transfers/{transfer_id}/cancel")
async def cancel_transfer(transfer_id: str, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    trf = (await db.execute(text(
        "SELECT id, status, fromWarehouseId, transferNo FROM stock_transfers WHERE id=:id AND tenantId=:t"),
        {"id": transfer_id, "t": tenantId})).first()
    if not trf: return err("Transfer not found", 404)
    if trf[1] in ("RECEIVED", "CANCELLED"):
        return err(f"Cannot cancel transfer in status {trf[1]}", 400)

    from_wh, trf_no, prev_status = trf[2], trf[3], trf[1]
    items = (await db.execute(text(
        "SELECT productId, variantId, qty FROM stock_transfer_items WHERE transferId=:id AND tenantId=:t"),
        {"id": transfer_id, "t": tenantId})).fetchall()

    async with txn(db):
        # If was in-transit, restore stock back to source warehouse
        if prev_status == "IN_TRANSIT":
            for it in items:
                pid, vid, qty = it[0], it[1], float(it[2])
                st = (await db.execute(text(
                    "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                    {"t": tenantId, "w": from_wh, "p": pid, "v": vid})).first()
                curr_qty = float(st[1]) if st else 0.0
                if st:
                    await db.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand + :q, updatedAt=NOW() WHERE id=:id"),
                                     {"q": qty, "id": st[0]})
                else:
                    await db.execute(text(
                        "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, updatedAt) "
                        "VALUES (UUID(), :t, :w, :p, :v, :q, 0, NOW())"),
                        {"t": tenantId, "w": from_wh, "p": pid, "v": vid, "q": qty})

                await db.execute(text(
                    "INSERT INTO stock_movements (id, tenantId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy, createdAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, 'ADJUSTMENT_IN', :q, :qb, :qa, 'TRANSFER_CANCEL', :rid, :note, :u, :u, NOW())"),
                    {"t": tenantId, "w": from_wh, "p": pid, "v": vid, "q": qty, "qb": curr_qty, "qa": curr_qty + qty,
                     "rid": transfer_id, "note": f"Transfer Cancelled Restock {trf_no}", "u": user.id})

        await db.execute(text(
            "UPDATE stock_transfers SET status='CANCELLED', updatedBy=:u, updatedAt=NOW() WHERE id=:id AND tenantId=:t"),
            {"id": transfer_id, "t": tenantId, "u": user.id})

    return ok({"id": transfer_id, "status": "CANCELLED", "message": "Transfer cancelled"})


@router.get("/api/v1/inventory/counts")
async def list_counts(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                      db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT sc.*, w.name AS warehouseName FROM stock_counts sc JOIN warehouses w ON w.id=sc.warehouseId "
        "WHERE sc.tenantId=:t ORDER BY sc.createdAt DESC"), {"t": tenantId})).fetchall())
    for r in rows: r["warehouse"] = {"id": r.pop("warehouseId"), "name": r.pop("warehouseName")}
    return ok(rows)


@router.post("/api/v1/inventory/counts")
async def create_count(body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    warehouseId = body.get("warehouseId")
    if not warehouseId: return err("warehouseId required", 400)
    countNo = gen_no("SC")
    stocks = (await db.execute(text(
        "SELECT productId, variantId, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND qtyOnHand > 0"),
        {"t": tenantId, "w": warehouseId})).fetchall()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO stock_counts (id, tenantId, warehouseId, countNo, countDate, countType, status, createdBy, updatedAt) "
            "VALUES (UUID(), :t, :w, :no, NOW(), 'PHYSICAL', 'IN_PROGRESS', :u, NOW())"),
            {"t": tenantId, "w": warehouseId, "no": countNo, "u": user.id})
        cid = (await db.execute(text("SELECT id FROM stock_counts WHERE tenantId=:t AND countNo=:no"),
                                {"t": tenantId, "no": countNo})).first()[0]
        for s in stocks:
            await db.execute(text(
                "INSERT INTO stock_count_items (id, tenantId, countId, productId, variantId, systemQty, countedQty, diffQty) "
                "VALUES (UUID(), :t, :c, :p, :v, :sq, 0, -:sq)"),
                {"t": tenantId, "c": cid, "p": s[0], "v": s[1], "sq": float(s[2])})
    return ok({"countNo": countNo, "id": cid, "items": len(stocks)}, 201)


@router.post("/api/v1/inventory/counts/{countId}/items")
async def submit_count_item(countId: str, body: dict, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    counted = float(body.get("countedQty", 0) or 0)
    r = (await db.execute(text(
        "SELECT sci.id, sci.systemQty FROM stock_count_items sci WHERE sci.countId=:c AND sci.tenantId=:t "
        "AND sci.productId=:p AND (sci.variantId IS NULL OR sci.variantId=:v)"),
        {"c": countId, "t": tenantId, "p": body.get("productId"), "v": body.get("variantId")})).first()
    if not r: return err("Count item not found", 404)
    await db.execute(text("UPDATE stock_count_items SET countedQty=:cq, diffQty=:dq WHERE id=:id"),
                     {"cq": counted, "dq": counted - float(r[1]), "id": r[0]})
    await db.commit()
    return ok({"updated": True})


@router.post("/api/v1/inventory/counts/{countId}/complete")
async def complete_count(countId: str, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    c = (await db.execute(text("SELECT status, warehouseId FROM stock_counts WHERE id=:id AND tenantId=:t"),
                          {"id": countId, "t": tenantId})).first()
    if not c: return err("Stock count not found", 404)
    if c[0] != "IN_PROGRESS": return err(f"Cannot complete in status {c[0]}", 400)
    items = (await db.execute(text(
        "SELECT productId, variantId, diffQty FROM stock_count_items WHERE countId=:c AND diffQty != 0"),
        {"c": countId})).fetchall()
    # ── Prompt 27 stock approval: adjustments beyond the threshold need sign-off ──
    if items:
        largest = max((abs(float(i[2])) for i in items), default=0)
        cno = (await db.execute(text("SELECT countNo FROM stock_counts WHERE id=:id"), {"id": countId})).first()
        count_no = cno[0] if cno else ""
        apr = await wf.create_approval(
            db, tenantId, "STOCK_ADJUST", countId, count_no,
            f"Stock count {count_no}: {len(items)} line(s) adjusted (largest {largest:,.1f})", largest,
            {"countId": countId, "warehouseId": c[1],
             "items": [{"productId": str(i[0]), "variantId": i[1], "diff": float(i[2])} for i in items]},
            user.id)
        if apr:
            await db.commit()
            return ok({"completed": False, "needsApproval": True, "approval": apr}, 202)
    async with txn(db):
        for it in items:
            diff = float(it[2])
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": c[1], "p": it[0], "v": it[1]})).first()
            before = float(st[1]) if st else 0
            after = before + diff
            if st: await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": after, "id": st[0]})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (UUID(), :t, :w, :p, :v, :mt, :q, :qb, :qa, 'STOCK_COUNT', :rid, :note, :u, :u)"),
                {"t": tenantId, "w": c[1], "p": it[0], "v": it[1],
                 "mt": "ADJUSTMENT_IN" if diff > 0 else "ADJUSTMENT_OUT", "q": diff, "qb": before, "qa": after,
                 "rid": countId, "note": f"Stock count adjustment ({diff})", "u": user.id})
        await db.execute(text("UPDATE stock_counts SET status='COMPLETED', updatedBy=:u WHERE id=:id"),
                         {"u": user.id, "id": countId})
    return ok({"completed": True, "adjusted": len(items)})


@router.get("/api/v1/inventory/landed-costs")
async def list_landed_costs(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM landed_costs WHERE tenantId=:t ORDER BY createdAt DESC LIMIT 50"), {"t": tenantId})).fetchall())
    return ok(rows)


@router.post("/api/v1/inventory/landed-costs")
async def create_landed_cost(body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Landed cost needs items", 400)
    additional = sum(float(body.get(k, 0) or 0) for k in
                     ("shippingCost", "customsCost", "insuranceCost", "handlingCost", "transportCost", "otherCost"))
    purchase = float(body.get("purchaseCost", 0) or 0)
    basis = body.get("allocationBasis", "VALUE")
    totalValue = sum(float(i.get("baseCost", 0)) * float(i.get("qty", 0)) for i in items)
    totalQty = sum(float(i.get("qty", 0)) for i in items)
    lc_no = gen_no("LC")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO landed_costs (id, tenantId, goodsReceiptId, supplierId, landedCostNo, purchaseCost, shippingCost, "
            "customsCost, insuranceCost, handlingCost, transportCost, otherCost, totalLandedCost, allocationBasis, createdBy) "
            "VALUES (UUID(), :t, :g, :s, :no, :pc, :sc, :cc, :ic, :hc, :tc, :oc, :tt, :ab, :u)"),
            {"t": tenantId, "g": body.get("goodsReceiptId"), "s": body.get("supplierId"), "no": lc_no,
             "pc": purchase, "sc": body.get("shippingCost", 0), "cc": body.get("customsCost", 0),
             "ic": body.get("insuranceCost", 0), "hc": body.get("handlingCost", 0),
             "tc": body.get("transportCost", 0), "oc": body.get("otherCost", 0),
             "tt": purchase + additional, "ab": basis, "u": user.id})
        lc_id = (await db.execute(text("SELECT id FROM landed_costs WHERE tenantId=:t AND landedCostNo=:no"),
                                  {"t": tenantId, "no": lc_no})).first()[0]
        for idx, i in enumerate(items):
            if basis == "QTY":
                allocated = round((additional * float(i.get("qty", 0)) / totalQty), 2) if totalQty else 0
            else:
                value = float(i.get("baseCost", 0)) * float(i.get("qty", 0))
                allocated = round((additional * value / totalValue), 2) if totalValue else 0
            if idx == len(items) - 1:
                allocated = round(additional - sum(
                    round((additional * (float(j.get("qty", 0)) / totalQty if basis == "QTY" else (float(j.get("baseCost", 0)) * float(j.get("qty", 0)) / totalValue))), 2)
                    for j in items[:-1]), 2)
            adjusted = float(i.get("baseCost", 0)) + (allocated / float(i.get("qty", 1)))
            await db.execute(text(
                "INSERT INTO landed_cost_items (id, tenantId, landedCostId, productId, variantId, allocatedCost, adjustedCost) "
                "VALUES (UUID(), :t, :lc, :p, :v, :ac, :adj)"),
                {"t": tenantId, "lc": lc_id, "p": i["productId"], "v": i.get("variantId"),
                 "ac": allocated, "adj": round(adjusted, 2)})
    return ok({"landedCostNo": lc_no, "totalLandedCost": purchase + additional}, 201)


@router.get("/api/v1/inventory/consignments")
async def list_consignments(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                            db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT c.*, s.name AS supplierName, w.name AS warehouseName FROM consignments c "
        "JOIN suppliers s ON s.id=c.supplierId JOIN warehouses w ON w.id=c.warehouseId "
        "WHERE c.tenantId=:t ORDER BY c.createdAt DESC LIMIT 50"), {"t": tenantId})).fetchall())
    for r in rows:
        r["supplier"] = {"id": r.pop("supplierId"), "name": r.pop("supplierName")}
        r["warehouse"] = {"id": r.pop("warehouseId"), "name": r.pop("warehouseName")}
        r["items"] = rows_to_dicts((await db.execute(text(
            "SELECT ci.*, p.name AS productName FROM consignment_items ci JOIN products p ON p.id=ci.productId WHERE ci.consignmentId=:id"),
            {"id": r["id"]})).fetchall())
    return ok(rows)


@router.post("/api/v1/inventory/consignments")
async def create_consignment(body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Consignment needs items", 400)
    supplierId, warehouseId = body.get("supplierId"), body.get("warehouseId")
    if not supplierId or not warehouseId: return err("supplierId and warehouseId required", 400)
    totalQty = sum(float(i.get("qtyReceived", 0)) for i in items)
    total_val = sum(float(i.get("qtyReceived", 0)) * float(i.get("unitCost", 0)) for i in items)
    con_no = gen_no("CON")
    wh = (await db.execute(text("SELECT branchId FROM warehouses WHERE id=:w"), {"w": warehouseId})).first()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO consignments (id, tenantId, supplierId, warehouseId, consignmentNo, status, totalQty, totalValue, commissionPct, note, createdBy, updatedAt) "
            "VALUES (UUID(), :t, :s, :w, :no, 'ACTIVE', :tq, :tv, :cp, :n, :u, NOW())"),
            {"t": tenantId, "s": supplierId, "w": warehouseId, "no": con_no, "tq": totalQty,
             "tv": total_val, "cp": body.get("commissionPct", 0), "n": body.get("note"), "u": user.id})
        con_id = (await db.execute(text("SELECT id FROM consignments WHERE tenantId=:t AND consignmentNo=:no"),
                                   {"t": tenantId, "no": con_no})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO consignment_items (id, tenantId, consignmentId, productId, variantId, qtyReceived, unitCost, sellingPrice) "
                "VALUES (UUID(), :t, :c, :p, :v, :q, :uc, :sp)"),
                {"t": tenantId, "c": con_id, "p": i["productId"], "v": i.get("variantId"),
                 "q": i.get("qtyReceived", 0), "uc": i.get("unitCost", 0), "sp": i.get("sellingPrice", 0)})
            # stock in (consignment)
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId")})).first()
            before = float(st[1]) if st else 0
            qty = float(i.get("qtyReceived", 0))
            if st: await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": before + qty, "id": st[0]})
            else: await db.execute(text(
                "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved) VALUES (UUID(), :t, :w, :p, :v, :q, 0)"),
                {"t": tenantId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId"), "q": qty})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (UUID(), :t, :b, :w, :p, :v, 'ADJUSTMENT_IN', :q, :qb, :qa, 'CONSIGNMENT', :rid, :note, :u, :u)"),
                {"t": tenantId, "b": wh[0] if wh else None, "w": warehouseId, "p": i["productId"], "v": i.get("variantId"),
                 "q": qty, "qb": before, "qa": before + qty, "rid": con_id, "note": f"Consignment {con_no}", "u": user.id})
    return ok({"consignmentNo": con_no, "id": con_id}, 201)


@router.post("/api/v1/inventory/consignments/{con_id}/settle")
async def settle_consignment(con_id: str, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    async with txn(db):
        items = (await db.execute(text(
            "SELECT qtySold, qtyReturned, sellingPrice FROM consignment_items WHERE consignmentId=:c"), {"c": con_id})).fetchall()
        totalSold = sum(float(r[0]) for r in items)
        total_ret = sum(float(r[1]) for r in items)
        sale_value = sum(float(r[0]) * float(r[2]) for r in items)
        con = (await db.execute(text("SELECT commissionPct FROM consignments WHERE id=:c"), {"c": con_id})).first()
        rate = float(con[0] or 0) / 100
        commission = round(sale_value * rate, 2)
        await db.execute(text(
            "INSERT INTO consignment_settlements (id, tenantId, consignmentId, totalSold, totalReturned, totalCommission, totalPayable, createdBy) "
            "VALUES (UUID(), :t, :c, :ts, :tr, :tc, :tp, :u)"),
            {"t": tenantId, "c": con_id, "ts": totalSold, "tr": total_ret, "tc": commission,
             "tp": sale_value - commission, "u": user.id})
        await db.execute(text("UPDATE consignments SET status='SETTLED' WHERE id=:c"), {"c": con_id})
    return ok({"totalSold": totalSold, "totalReturned": total_ret, "commission": commission, "payable": sale_value - commission})


# ═════════════════════════ BRANCHES / WAREHOUSES / SETTINGS ═════════════════════════

@router.get("/api/v1/branches")
async def list_branches(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                        db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text("""
        SELECT b.*, c.name AS company_name,
               (SELECT COUNT(*) FROM warehouses w WHERE w.branchId = b.id) AS warehouse_count,
               (SELECT COUNT(*) FROM users u WHERE u.branchId = b.id) AS user_count,
               (SELECT COUNT(*) FROM terminals t WHERE t.branchId = b.id) AS device_count
        FROM branches b
        LEFT JOIN companies c ON c.id = b.companyId
        WHERE b.tenantId = :t
        ORDER BY b.name
    """), {"t": tenantId})).fetchall())
    for r in rows:
        company_name = r.pop("company_name", None)
        r["company"] = {"id": r.get("companyId"), "name": company_name or "Main Company"}
        r["_count"] = {
            "warehouses": int(r.pop("warehouse_count", 0) or 0),
            "userAccounts": int(r.pop("user_count", 0) or 0),
            "devices": int(r.pop("device_count", 0) or 0),
        }
        r["warehouses"] = rows_to_dicts((await db.execute(text(
            "SELECT * FROM warehouses WHERE branchId=:b"), {"b": r["id"]})).fetchall())
    return ok(rows)


@router.post("/api/v1/branches")
async def create_branch(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    company_id = body.get("companyId")
    if not company_id:
        row = (await db.execute(text("SELECT id FROM companies WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
        company_id = row[0] if row else None
    branch_id = _uuid()
    await db.execute(text(
        "INSERT INTO branches (id, tenantId, companyId, code, name, phone, email, address, createdBy, updatedAt) "
        "VALUES (:id, :t, :c, :code, :n, :p, :e, :a, :u, NOW())"),
        {"id": branch_id, "t": tenantId, "c": company_id, "code": body.get("code", name[:8].upper()),
         "n": name, "p": body.get("phone"), "e": body.get("email"), "a": body.get("address"), "u": user.id})
    await db.commit()
    return ok({"id": branch_id, "name": name, "created": True}, 201)


@router.put("/api/v1/branches/{branchId}")
@router.patch("/api/v1/branches/{branchId}")
async def update_branch(branchId: str, body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(text("SELECT id FROM branches WHERE id = :id AND tenantId = :t"),
                                {"id": branchId, "t": tenantId})).first()
    if not existing:
        return err("Branch not found", 404)
    
    name = body.get("name")
    code = body.get("code")
    phone = body.get("phone")
    email = body.get("email")
    address = body.get("address")
    status = body.get("status")

    await db.execute(text("""
        UPDATE branches 
        SET name = COALESCE(:n, name),
            code = COALESCE(:c, code),
            phone = :p,
            email = :e,
            address = :a,
            status = COALESCE(:st, status),
            updatedAt = NOW()
        WHERE id = :id AND tenantId = :t
    """), {
        "id": branchId, "t": tenantId,
        "n": name, "c": code, "p": phone, "e": email, "a": address, "st": status
    })
    await db.commit()
    return ok({"id": branchId, "updated": True, "message": "Branch updated successfully"})


@router.delete("/api/v1/branches/{branchId}")
async def delete_branch(branchId: str, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(text("SELECT id FROM branches WHERE id = :id AND tenantId = :t"),
                                {"id": branchId, "t": tenantId})).first()
    if not existing:
        return err("Branch not found", 404)
    
    wh_count = (await db.execute(text("SELECT COUNT(*) FROM warehouses WHERE branchId = :id"), {"id": branchId})).first()[0]
    sales_count = (await db.execute(text("SELECT COUNT(*) FROM sales WHERE branchId = :id"), {"id": branchId})).first()[0]
    if wh_count > 0 or sales_count > 0:
        await db.execute(text("UPDATE branches SET status = 'INACTIVE', updatedAt = NOW() WHERE id = :id AND tenantId = :t"),
                        {"id": branchId, "t": tenantId})
        await db.commit()
        return ok({"id": branchId, "deleted": False, "status": "INACTIVE", "message": "Branch marked inactive due to linked transactions"})
    
    await db.execute(text("DELETE FROM branches WHERE id = :id AND tenantId = :t"), {"id": branchId, "t": tenantId})
    await db.commit()
    return ok({"id": branchId, "deleted": True, "message": "Branch deleted successfully"})


@router.get("/api/v1/warehouses")
async def list_warehouses(
    branchId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    target_branch = branchId.strip()
    # If not explicitly specified, staff/cashier roles automatically default to their assigned branch
    if not target_branch and user and getattr(user, "branchId", None):
        role_name = (getattr(user, "roleName", "") or "").lower()
        if role_name not in ("owner", "super administrator", "superadmin", "tenant admin"):
            target_branch = user.branchId

    where = "b.tenantId = :t"
    params: dict = {"t": tenantId}
    if target_branch:
        where += " AND w.branchId = :b"
        params["b"] = target_branch

    rows = rows_to_dicts((await db.execute(text(f"""
        SELECT w.*, b.name AS branch_name, b.code AS branch_code,
               (SELECT COUNT(*) FROM stock s WHERE s.warehouseId = w.id AND s.tenantId = :t) AS stock_count,
               (SELECT COUNT(*) FROM terminals pt WHERE pt.branchId = w.branchId AND pt.tenantId = :t) AS terminal_count,
               (SELECT COUNT(*) FROM warehouse_locations wl WHERE wl.warehouseId = w.id AND wl.tenantId = :t) AS bin_count
        FROM warehouses w 
        JOIN branches b ON b.id = w.branchId 
        WHERE {where}
        ORDER BY w.createdAt DESC
    """), params)).fetchall())

    out = []
    for r in rows:
        out.append({
            "id": r["id"],
            "code": r["code"],
            "name": r["name"],
            "type": r.get("type"),
            "status": r.get("status", "ACTIVE"),
            "isLocationBased": bool(r.get("isLocationBased", 0)),
            "branchId": r["branchId"],
            "branch": {
                "id": r["branchId"],
                "name": r.pop("branch_name", ""),
                "code": r.pop("branch_code", "")
            },
            "_count": {
                "stockRows": int(r.pop("stock_count", 0) or 0),
                "terminals": int(r.pop("terminal_count", 0) or 0),
                "binCount": int(r.pop("bin_count", 0) or 0)
            }
        })
    return ok(out)


@router.post("/api/v1/warehouses")
@router.post("/api/v1/branches/{branchId}/warehouses")
async def create_warehouse(body: dict, branchId: Optional[str] = None, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    branch_id = branchId or body.get("branchId")
    if not branch_id:
        row = (await db.execute(text("SELECT id FROM branches WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
        if not row: return err("No branch configured", 400)
        branch_id = row[0]

    name = body.get("name")
    if not name: return err("Name is required", 400)
    code = body.get("code") or name[:8].upper()
    is_location_based = 1 if body.get("isLocationBased") else 0
    wh_type = body.get("type") or "BRANCH"
    wh_id = _uuid()

    async with txn(db):
        await db.execute(text("""
            INSERT INTO warehouses (id, tenantId, branchId, code, name, type, isLocationBased, createdBy, createdAt, updatedAt)
            VALUES (:id, :t, :b, :c, :n, :ty, :loc, :u, NOW(), NOW())
        """), {
            "id": wh_id, "t": tenantId, "b": branch_id, "c": code,
            "n": name, "ty": wh_type, "loc": is_location_based, "u": user.id
        })

    return ok({"id": wh_id, "code": code, "name": name, "isLocationBased": bool(is_location_based), "created": True}, 201)


@router.get("/api/v1/warehouses/{warehouseId}/locations")
async def list_warehouse_locations(warehouseId: str, user: AuthUser = Depends(require_auth),
                                   tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    wh = (await db.execute(text("SELECT id, name, code, isLocationBased FROM warehouses WHERE id=:id AND tenantId=:t"),
                           {"id": warehouseId, "t": tenantId})).first()
    if not wh: return err("Warehouse not found", 404)

    bins = rows_to_dicts((await db.execute(text("""
        SELECT wl.*,
               COALESCE((SELECT SUM(wbs.qtyOnHand) FROM warehouse_bin_stocks wbs WHERE wbs.binId = wl.id AND wbs.tenantId = :t), 0) AS totalQty,
               COALESCE((SELECT COUNT(DISTINCT wbs.productId) FROM warehouse_bin_stocks wbs WHERE wbs.binId = wl.id AND wbs.tenantId = :t AND wbs.qtyOnHand > 0), 0) AS productCount
        FROM warehouse_locations wl
        WHERE wl.warehouseId = :w AND wl.tenantId = :t
        ORDER BY wl.rowCode, wl.colCode, wl.rackCode, wl.binCode
    """), {"w": warehouseId, "t": tenantId})).fetchall())

    tree: dict = {}
    for b in bins:
        r_code = b["rowCode"]
        c_code = b["colCode"]
        rk_code = b["rackCode"]
        
        if r_code not in tree:
            tree[r_code] = {"rowCode": r_code, "cols": {}}
        if c_code not in tree[r_code]["cols"]:
            tree[r_code]["cols"][c_code] = {"colCode": c_code, "racks": {}}
        if rk_code not in tree[r_code]["cols"][c_code]["racks"]:
            tree[r_code]["cols"][c_code]["racks"][rk_code] = {"rackCode": rk_code, "bins": []}
        
        tree[r_code]["cols"][c_code]["racks"][rk_code]["bins"].append(b)

    hierarchy = []
    for r_k, r_v in tree.items():
        cols_arr = []
        for c_k, c_v in r_v["cols"].items():
            racks_arr = []
            for rk_k, rk_v in c_v["racks"].items():
                racks_arr.append({
                    "rackCode": rk_k,
                    "bins": rk_v["bins"]
                })
            cols_arr.append({
                "colCode": c_k,
                "racks": racks_arr
            })
        hierarchy.append({
            "rowCode": r_k,
            "cols": cols_arr
        })

    return ok({
        "warehouse": {
            "id": wh[0],
            "name": wh[1],
            "code": wh[2],
            "isLocationBased": bool(wh[3])
        },
        "totalBins": len(bins),
        "locations": bins,
        "hierarchy": hierarchy
    })


@router.post("/api/v1/warehouses/{warehouseId}/locations")
async def create_warehouse_location(warehouseId: str, body: dict, user: AuthUser = Depends(require_auth),
                                    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    row_code = (body.get("rowCode") or "R01").strip().upper()
    col_code = (body.get("colCode") or "C01").strip().upper()
    rack_code = (body.get("rackCode") or "RK01").strip().upper()
    bin_code = (body.get("binCode") or "B01").strip().upper()
    full_code = (body.get("fullCode") or f"{row_code}-{col_code}-{rack_code}-{bin_code}").strip().upper()
    name = body.get("name") or full_code
    loc_type = body.get("type") or "STANDARD"
    max_cap = body.get("maxCapacity")
    bin_id = _uuid()

    async with txn(db):
        await db.execute(text("""
            INSERT INTO warehouse_locations (id, tenantId, warehouseId, rowCode, colCode, rackCode, binCode, fullCode, name, type, maxCapacity, status, createdBy, createdAt, updatedAt)
            VALUES (:id, :t, :w, :row, :col, :rack, :bin, :full, :name, :ty, :cap, 'ACTIVE', :u, NOW(), NOW())
        """), {
            "id": bin_id, "t": tenantId, "w": warehouseId, "row": row_code, "col": col_code,
            "rack": rack_code, "bin": bin_code, "full": full_code, "name": name, "ty": loc_type,
            "cap": max_cap, "u": user.id
        })

    return ok({"id": bin_id, "fullCode": full_code, "name": name, "created": True}, 201)


@router.post("/api/v1/warehouses/{warehouseId}/locations/bulk-generate")
async def bulk_generate_locations(warehouseId: str, body: dict, user: AuthUser = Depends(require_auth),
                                  tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    def expand_tier(tier_input, default_prefix: str, default_count: int = 1):
        if isinstance(tier_input, list):
            return [str(x).strip().upper() for x in tier_input if str(x).strip()]
        if isinstance(tier_input, dict):
            prefix = str(tier_input.get("prefix", default_prefix)).strip().upper()
            count = max(int(tier_input.get("count", default_count)), 1)
            pad = int(tier_input.get("pad", 2))
            return [f"{prefix}{str(i).zfill(pad)}" for i in range(1, count + 1)]
        if isinstance(tier_input, int):
            return [f"{default_prefix}{str(i).zfill(2)}" for i in range(1, max(tier_input, 1) + 1)]
        return [f"{default_prefix}01"]

    row_list = expand_tier(body.get("rows"), "R", 2)
    col_list = expand_tier(body.get("cols"), "C", 2)
    rack_list = expand_tier(body.get("racks"), "RK", 2)
    bin_list = expand_tier(body.get("bins"), "B", 2)

    loc_type = body.get("type") or "STANDARD"
    max_cap = body.get("maxCapacity")

    created_count = 0
    async with txn(db):
        for r in row_list:
            for c in col_list:
                for rk in rack_list:
                    for b in bin_list:
                        full_code = f"{r}-{c}-{rk}-{b}"
                        exists = (await db.execute(text(
                            "SELECT id FROM warehouse_locations WHERE tenantId=:t AND warehouseId=:w AND fullCode=:fc"),
                            {"t": tenantId, "w": warehouseId, "fc": full_code})).first()
                        if not exists:
                            await db.execute(text("""
                                INSERT INTO warehouse_locations (id, tenantId, warehouseId, rowCode, colCode, rackCode, binCode, fullCode, name, type, maxCapacity, status, createdBy, createdAt, updatedAt)
                                VALUES (UUID(), :t, :w, :row, :col, :rack, :bin, :full, :name, :ty, :cap, 'ACTIVE', :u, NOW(), NOW())
                            """), {
                                "t": tenantId, "w": warehouseId, "row": r, "col": c, "rack": rk, "bin": b,
                                "full": full_code, "name": full_code, "ty": loc_type, "cap": max_cap, "u": user.id
                            })
                            created_count += 1

    return ok({
        "success": True,
        "totalGenerated": created_count,
        "message": f"Successfully generated {created_count} bin locations across {len(row_list)} rows, {len(col_list)} cols, {len(rack_list)} racks."
    }, 201)


@router.delete("/api/v1/warehouses/{warehouseId}/locations/{binId}")
async def delete_warehouse_location(warehouseId: str, binId: str, user: AuthUser = Depends(require_auth),
                                    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    stock_exists = (await db.execute(text(
        "SELECT SUM(qtyOnHand) FROM warehouse_bin_stocks WHERE binId=:b AND tenantId=:t AND qtyOnHand > 0"),
        {"b": binId, "t": tenantId})).first()
    if stock_exists and stock_exists[0] and float(stock_exists[0]) > 0:
        return err(f"Cannot delete bin — it currently holds {float(stock_exists[0])} units of stock. Move stock first.", 400)

    async with txn(db):
        await db.execute(text("DELETE FROM warehouse_bin_stocks WHERE binId=:b AND tenantId=:t"), {"b": binId, "t": tenantId})
        await db.execute(text("DELETE FROM warehouse_locations WHERE id=:b AND warehouseId=:w AND tenantId=:t"),
                         {"b": binId, "w": warehouseId, "t": tenantId})
    return ok({"deleted": True})


@router.get("/api/v1/warehouses/{warehouseId}/bin-stocks")
async def list_warehouse_bin_stocks(warehouseId: str, productId: Optional[str] = None, binId: Optional[str] = None,
                                    user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                                    db: AsyncSession = Depends(get_db)):
    where = "wbs.tenantId=:t AND wbs.warehouseId=:w"
    params: dict = {"t": tenantId, "w": warehouseId}
    if productId:
        where += " AND wbs.productId = :p"
        params["p"] = productId
    if binId:
        where += " AND wbs.binId = :b"
        params["b"] = binId

    rows = rows_to_dicts((await db.execute(text(f"""
        SELECT wbs.*, wl.fullCode AS binCode, wl.name AS binName, wl.rowCode, wl.colCode, wl.rackCode,
               p.name AS productName, p.sku AS productSku, p.barcode AS productBarcode
        FROM warehouse_bin_stocks wbs
        JOIN warehouse_locations wl ON wl.id = wbs.binId
        JOIN products p ON p.id = wbs.productId
        WHERE {where} AND wbs.qtyOnHand > 0
        ORDER BY wl.fullCode, p.name
    """), params)).fetchall())

    return ok(rows)


@router.post("/api/v1/warehouses/{warehouseId}/bin-stocks/assign")
async def assign_bin_stock(warehouseId: str, body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    bin_id = body.get("binId")
    product_id = body.get("productId")
    variant_id = body.get("variantId")
    batch_no = body.get("batchNo")
    qty = float(body.get("qty", 0))
    if not bin_id or not product_id or qty <= 0:
        return err("binId, productId, and positive qty required", 400)

    async with txn(db):
        st = (await db.execute(text("""
            SELECT id, qtyOnHand FROM warehouse_bin_stocks 
            WHERE tenantId=:t AND warehouseId=:w AND binId=:b AND productId=:p 
              AND (variantId IS NULL OR variantId=:v) AND (batchNo IS NULL OR batchNo=:bn)
        """), {"t": tenantId, "w": warehouseId, "b": bin_id, "p": product_id, "v": variant_id, "bn": batch_no})).first()

        if st:
            await db.execute(text("UPDATE warehouse_bin_stocks SET qtyOnHand = qtyOnHand + :q, updatedAt=NOW() WHERE id=:id"),
                             {"q": qty, "id": st[0]})
        else:
            await db.execute(text("""
                INSERT INTO warehouse_bin_stocks (id, tenantId, warehouseId, binId, productId, variantId, batchNo, qtyOnHand, qtyReserved, updatedAt)
                VALUES (UUID(), :t, :w, :b, :p, :v, :bn, :q, 0, NOW())
            """), {"t": tenantId, "w": warehouseId, "b": bin_id, "p": product_id, "v": variant_id, "bn": batch_no, "q": qty})

    return ok({"assigned": True, "qty": qty})


@router.post("/api/v1/warehouses/{warehouseId}/bin-stocks/transfer")
async def transfer_bin_stock(warehouseId: str, body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    from_bin = body.get("fromBinId")
    to_bin = body.get("toBinId")
    product_id = body.get("productId")
    variant_id = body.get("variantId")
    batch_no = body.get("batchNo")
    qty = float(body.get("qty", 0))

    if not from_bin or not to_bin or not product_id or qty <= 0:
        return err("fromBinId, toBinId, productId, and positive qty required", 400)
    if from_bin == to_bin:
        return err("Source and destination bins must differ", 400)

    async with txn(db):
        st_src = (await db.execute(text("""
            SELECT id, qtyOnHand FROM warehouse_bin_stocks 
            WHERE tenantId=:t AND warehouseId=:w AND binId=:b AND productId=:p 
              AND (variantId IS NULL OR variantId=:v) AND (batchNo IS NULL OR batchNo=:bn) FOR UPDATE
        """), {"t": tenantId, "w": warehouseId, "b": from_bin, "p": product_id, "v": variant_id, "bn": batch_no})).first()

        curr_src = float(st_src[1]) if st_src else 0.0
        if curr_src < qty:
            return err(f"Insufficient stock in source bin (available: {curr_src}, requested: {qty})", 400)

        await db.execute(text("UPDATE warehouse_bin_stocks SET qtyOnHand = qtyOnHand - :q, updatedAt=NOW() WHERE id=:id"),
                         {"q": qty, "id": st_src[0]})

        st_dst = (await db.execute(text("""
            SELECT id, qtyOnHand FROM warehouse_bin_stocks 
            WHERE tenantId=:t AND warehouseId=:w AND binId=:b AND productId=:p 
              AND (variantId IS NULL OR variantId=:v) AND (batchNo IS NULL OR batchNo=:bn) FOR UPDATE
        """), {"t": tenantId, "w": warehouseId, "b": to_bin, "p": product_id, "v": variant_id, "bn": batch_no})).first()

        if st_dst:
            await db.execute(text("UPDATE warehouse_bin_stocks SET qtyOnHand = qtyOnHand + :q, updatedAt=NOW() WHERE id=:id"),
                             {"q": qty, "id": st_dst[0]})
        else:
            await db.execute(text("""
                INSERT INTO warehouse_bin_stocks (id, tenantId, warehouseId, binId, productId, variantId, batchNo, qtyOnHand, qtyReserved, updatedAt)
                VALUES (UUID(), :t, :w, :b, :p, :v, :bn, :q, 0, NOW())
            """), {"t": tenantId, "w": warehouseId, "b": to_bin, "p": product_id, "v": variant_id, "bn": batch_no, "q": qty})

    return ok({"moved": True, "qty": qty})




@router.get("/api/v1/settings/{group}")
async def get_settings(group: str, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT `key`, value FROM settings WHERE tenantId=:t AND `group`=:g"),
        {"t": tenantId, "g": group})).fetchall())
    return ok({r["key"]: r["value"] for r in rows})


@router.put("/api/v1/settings/{group}")
async def put_settings(group: str, body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    for k, v in (body or {}).items():
        await db.execute(text(
            "INSERT INTO settings (id, tenantId, `group`, `key`, value) VALUES (UUID(), :t, :g, :k, :v) "
            "ON DUPLICATE KEY UPDATE value=:v2"),
            {"t": tenantId, "g": group, "k": k, "v": str(v), "v2": str(v)})
    await db.commit()
    return ok({"saved": True})
