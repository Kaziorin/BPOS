"""Remaining routers — expenses, commission, purchasing, credit, installments, sales-orders, invoices, pricing, inventory."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import accounting as acc
import tax as tax_engine
import workflow as wf
from db import get_db, txn
from security import require_auth, require_permission, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, paginate_params, gen_no

router = APIRouter()


def _uuid():
    import uuid as u
    return str(u.uuid4())


# ═════════════════════════ EXPENSES (§10.18) ═════════════════════════

@router.get("/api/v1/expenses")
async def list_expenses(status: str = "", categoryId: str = "", page: int = Query(1), limit: int = Query(20),
                        user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                        db: AsyncSession = Depends(get_db)):
    where = "e.tenantId=:t"; params: dict = {"t": tenantId}
    if status: where += " AND e.status=:st"; params["st"] = status
    if categoryId: where += " AND e.categoryId=:c"; params["c"] = categoryId
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT e.*, c.name AS categoryName FROM expenses e LEFT JOIN expense_categories c ON c.id=e.categoryId "
        f"WHERE {where} ORDER BY e.expenseDate DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    for r in rows: r["category"] = {"id": r.pop("categoryId"), "name": r.pop("categoryName")} if r.get("categoryName") else None
    total = (await db.execute(text(f"SELECT COUNT(*) FROM expenses e WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.post("/api/v1/expenses")
async def create_expense(body: dict, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    title, amount = body.get("title"), float(body.get("amount", 0) or 0)
    if not title or amount <= 0: return err("Title and positive amount are required", 400)
    method = body.get("paymentMethod", "CASH")
    shiftId = None
    branchId = body.get("branchId")
    async with txn(db):
        if branchId and method in ("CASH", "PETTY_CASH"):
            sh = (await db.execute(text(
                "SELECT id FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status IN ('OPEN','PENDING_APPROVAL') LIMIT 1"),
                {"t": tenantId, "b": branchId})).first()
            shiftId = sh[0] if sh else None
        if method == "PETTY_CASH" and branchId:
            fund = (await db.execute(text("SELECT balance FROM petty_cash_funds WHERE tenantId=:t AND branchId=:b"),
                                     {"t": tenantId, "b": branchId})).first()
            bal = float(fund[0]) if fund else 0.0
            if bal < amount: return err(f"Petty cash insufficient: ৳{bal:,.0f} available", 400)
            new_bal = bal - amount
            await db.execute(text(
                "UPDATE petty_cash_funds SET balance=:b WHERE tenantId=:t AND branchId=:br"),
                {"b": new_bal, "t": tenantId, "br": branchId})
            await db.execute(text(
                "INSERT INTO petty_cash_txns (id, tenantId, branchId, type, amount, balanceAfter, note, userId) "
                "VALUES (UUID(), :t, :br, 'EXPENSE', :a, :b, :n, :u)"),
                {"t": tenantId, "br": branchId, "a": amount, "b": new_bal, "n": title, "u": user.id})
        eid = _uuid()
        await db.execute(text(
            "INSERT INTO expenses (id, tenantId, branchId, categoryId, title, description, amount, expenseDate, "
            "paymentMethod, status, shiftId, note, createdBy) "
            "VALUES (:id, :t, :br, :c, :ti, :d, :a, COALESCE(:dt, NOW()), :m, 'PENDING', :sh, :n, :u)"),
            {"id": eid, "t": tenantId, "br": branchId, "c": body.get("categoryId"), "ti": title,
             "d": body.get("description"), "a": amount, "dt": body.get("expenseDate"), "m": method,
             "sh": shiftId, "n": body.get("note"), "u": user.id})
        if shiftId and method == "CASH":
            await db.execute(text(
                "INSERT INTO shift_txns (id, tenantId, shiftId, type, amount, refType, refId, note, userId) "
                "VALUES (UUID(), :t, :sh, 'CASH_EXPENSE', :a, 'EXPENSE', :rid, :n, :u)"),
                {"t": tenantId, "sh": shiftId, "a": amount, "rid": eid, "n": f"Expense: {title}", "u": user.id})
    return ok({"id": eid, "title": title, "amount": amount}, 201)


@router.post("/api/v1/expenses/{expenseId}/approve")
async def approve_expense(expenseId: str, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    e = (await db.execute(text("SELECT status, title, amount FROM expenses WHERE id=:id AND tenantId=:t"),
                          {"id": expenseId, "t": tenantId})).first()
    if not e: return err("Expense not found", 404)
    if e[0] != "PENDING": return err(f"Expense is {e[0]} — cannot approve", 400)
    # ── Prompt 27: expense above the configured amount needs engine approval ──
    apr = await wf.create_approval(db, tenantId, "EXPENSE", expenseId, expenseId[:8],
                                   f"Expense approval: {e[1]}", float(e[2] or 0),
                                   {"expenseId": expenseId}, user.id)
    if apr:
        await db.commit()
        return ok({"approved": False, "needsApproval": True, "approval": apr}, 202)
    await db.execute(text(
        "UPDATE expenses SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), updatedBy=:u WHERE id=:id"),
        {"u": user.id, "id": expenseId})
    await db.commit()
    return ok({"approved": True})


@router.post("/api/v1/expenses/{expenseId}/pay")
async def pay_expense(expenseId: str, user: AuthUser = Depends(require_auth),
                      tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    e = (await db.execute(text("SELECT status, amount, title, paymentMethod FROM expenses WHERE id=:id AND tenantId=:t"),
                          {"id": expenseId, "t": tenantId})).first()
    if not e: return err("Expense not found", 404)
    if e[0] != "APPROVED": return err("Expense must be APPROVED before paying", 400)
    amount = float(e[1]); method = e[3] or "CASH"
    async with txn(db):
        await db.execute(text("UPDATE expenses SET status='PAID', updatedBy=:u WHERE id=:id"),
                         {"u": user.id, "id": expenseId})
        # Accounting (§10.20): EXPENSE_PAID journal — Debit expense account, Credit cash/bank
        await acc.post_journal(db, tenantId, refType="EXPENSE", refId=expenseId,
                               narration=f"Expense paid: {e[2]}", lines=[
                                   ("5400", amount, 0.0, f"Expense: {e[2]}"),
                                   (acc.METHOD_ACCOUNT.get(method, "1000"), 0.0, amount, f"Paid via {method}"),
                               ], userId=user.id)
    return ok({"paid": True})


@router.get("/api/v1/expenses/categories")
async def expense_categories(user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT c.*, (SELECT COUNT(*) FROM expenses e WHERE e.categoryId = c.id) expenseCount "
        "FROM expense_categories c WHERE c.tenantId=:t ORDER BY c.group, c.name"), {"t": tenantId})).fetchall())
    for r in rows: r["_count"] = {"expenses": r.pop("expenseCount")}
    return ok(rows)


@router.post("/api/v1/expenses/categories")
async def create_expense_category(body: dict, user: AuthUser = Depends(require_auth),
                                  tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name = body.get("name")
    if not name: return err("Name is required", 400)
    dup = (await db.execute(text("SELECT id FROM expense_categories WHERE tenantId=:t AND name=:n"),
                            {"t": tenantId, "n": name})).first()
    if dup: return err("Category already exists", 409)
    await db.execute(text(
        "INSERT INTO expense_categories (id, tenantId, name, `group`, description, createdBy) VALUES (UUID(), :t, :n, :g, :d, :u)"),
        {"t": tenantId, "n": name, "g": body.get("group", "OPERATING"), "d": body.get("description"), "u": user.id},)
    await db.commit()
    return ok({"created": True}, 201)


@router.get("/api/v1/expenses/recurring")
async def recurring_expenses(user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT r.*, c.name AS categoryName, (SELECT COUNT(*) FROM expenses e WHERE e.recurringExpenseId = r.id) generatedCount "
        "FROM recurring_expenses r LEFT JOIN expense_categories c ON c.id=r.categoryId "
        "WHERE r.tenantId=:t ORDER BY r.nextRunDate"), {"t": tenantId})).fetchall())
    for r in rows:
        r["category"] = {"id": r.pop("categoryId"), "name": r.pop("categoryName")} if r.get("categoryName") else None
        r["_count"] = {"expenses": r.pop("generatedCount")}
    return ok(rows)


@router.post("/api/v1/expenses/recurring")
async def create_recurring(body: dict, user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name, amount = body.get("name"), float(body.get("amount", 0) or 0)
    if not name or amount <= 0: return err("Name and positive amount are required", 400)
    await db.execute(text(
        "INSERT INTO recurring_expenses (id, tenantId, branchId, categoryId, name, amount, frequency, nextRunDate, endDate, createdBy, updatedAt) "
        "VALUES (UUID(), :t, :b, :c, :n, :a, :f, COALESCE(:nr, NOW()), :ed, :u, NOW())"),
        {"t": tenantId, "b": body.get("branchId"), "c": body.get("categoryId"), "n": name, "a": amount,
         "f": body.get("frequency", "MONTHLY"), "nr": body.get("nextRunDate"), "ed": body.get("endDate"), "u": user.id})
    await db.commit()
    return ok({"created": True}, 201)


@router.post("/api/v1/expenses/recurring/run")
async def run_recurring_scheduler(user: AuthUser = Depends(require_auth),
                                  tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Manual 'run now' — Prompt 39: the stub scheduler is replaced by the real
    background job queue. This enqueues a ``recurring_expenses`` job and runs it
    inline through the exact handler the worker uses; the automatic scheduled
    pass (due templates → job, every scheduler tick) lives in jobs.py."""
    from jobs import enqueue_and_run
    job = await enqueue_and_run(db, tenantId, "recurring_expenses", {"tenantId": tenantId},
                                created_by=user.id)
    result = job.get("result") or {}
    return ok({"generated": result.get("generated", 0), "templates": result.get("templates", 0),
               "jobId": job.get("id"), "jobStatus": job.get("status")})


@router.get("/api/v1/expenses/petty-cash")
async def petty_cash(branchId: str = "", user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    fw = "tenantId=:t"; params: dict = {"t": tenantId}
    if branchId: fw += " AND branchId=:b"; params["b"] = branchId
    funds = rows_to_dicts((await db.execute(text(f"SELECT * FROM petty_cash_funds WHERE {fw}"), params)).fetchall())
    txns = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM petty_cash_txns WHERE {fw} ORDER BY createdAt DESC LIMIT 50"), params)).fetchall())
    return ok({"funds": funds, "recentTxns": txns})


@router.post("/api/v1/expenses/petty-cash/fund")
async def fund_petty(body: dict, user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    branchId, amount = body.get("branchId"), float(body.get("amount", 0) or 0)
    if not branchId or amount <= 0: return err("branchId and positive amount required", 400)
    fund = (await db.execute(text("SELECT id, balance FROM petty_cash_funds WHERE tenantId=:t AND branchId=:b FOR UPDATE"),
                             {"t": tenantId, "b": branchId})).first()
    new_bal = amount + (float(fund[1]) if fund else 0)
    async with txn(db):
        if fund:
            await db.execute(text("UPDATE petty_cash_funds SET balance=:b WHERE id=:id"), {"b": new_bal, "id": fund[0]})
        else:
            await db.execute(text(
                "INSERT INTO petty_cash_funds (id, tenantId, branchId, balance) VALUES (UUID(), :t, :b, :bal)"),
                {"t": tenantId, "b": branchId, "bal": new_bal},)
        await db.execute(text(
            "INSERT INTO petty_cash_txns (id, tenantId, branchId, type, amount, balanceAfter, note, userId) "
            "VALUES (UUID(), :t, :b, 'FUND', :a, :bal, :n, :u)"),
            {"t": tenantId, "b": branchId, "a": amount, "bal": new_bal,
             "n": body.get("note", "Petty cash funded"), "u": user.id})
    return ok({"balance": new_bal}, 201)


@router.post("/api/v1/expenses/petty-cash/reimburse")
async def reimburse_petty(body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    branchId, amount = body.get("branchId"), float(body.get("amount", 0) or 0)
    if not branchId or amount <= 0: return err("branchId and positive amount required", 400)
    fund = (await db.execute(text("SELECT id, balance FROM petty_cash_funds WHERE tenantId=:t AND branchId=:b FOR UPDATE"),
                             {"t": tenantId, "b": branchId})).first()
    if not fund: return err("No petty cash fund for this branch", 404)
    new_bal = float(fund[1]) - amount
    if new_bal < 0: return err(f"Insufficient petty cash: ৳{float(fund[1]):,.0f} available", 400)
    async with txn(db):
        await db.execute(text("UPDATE petty_cash_funds SET balance=:b WHERE id=:id"), {"b": new_bal, "id": fund[0]})
        await db.execute(text(
            "INSERT INTO petty_cash_txns (id, tenantId, branchId, type, amount, balanceAfter, note, userId) "
            "VALUES (UUID(), :t, :b, 'REIMBURSE', :a, :bal, :n, :u)"),
            {"t": tenantId, "b": branchId, "a": amount, "bal": new_bal,
             "n": body.get("note", "Petty cash reimbursed"), "u": user.id})
    return ok({"balance": new_bal}, 201)


@router.get("/api/v1/expenses/report")
async def expense_report(user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT e.*, c.name AS categoryName FROM expenses e LEFT JOIN expense_categories c ON c.id=e.categoryId "
        "WHERE e.tenantId=:t AND e.status != 'REJECTED' AND e.expenseDate >= NOW() - INTERVAL 30 DAY "
        "ORDER BY e.expenseDate DESC"), {"t": tenantId})).fetchall())
    total = sum(float(r["amount"]) for r in rows)
    by_cat: dict[str, dict] = {}
    for r in rows:
        k = r.get("categoryName") or "Uncategorized"
        b = by_cat.setdefault(k, {"categoryName": k, "total": 0.0, "count": 0})
        b["total"] += float(r["amount"]); b["count"] += 1
    return ok({"total": total, "count": len(rows), "byCategory": list(by_cat.values()), "expenses": rows})


# ═════════════════════════ COMMISSION (§10.15) ═════════════════════════

@router.get("/api/v1/commission")
async def list_commissions(status: str = "", agentUserId: str = "", page: int = Query(1), limit: int = Query(20),
                           user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                           db: AsyncSession = Depends(get_db)):
    where = "c.tenantId=:t"; params: dict = {"t": tenantId}
    if status: where += " AND c.status=:st"; params["st"] = status
    if agentUserId: where += " AND c.agentUserId=:a"; params["a"] = agentUserId
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT c.*, u.name AS agentName, s.invoiceNo AS saleNo FROM commissions c "
        f"LEFT JOIN users u ON u.id=c.agentUserId LEFT JOIN sales s ON s.id=c.saleId "
        f"WHERE {where} ORDER BY c.createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM commissions c WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.get("/api/v1/commission/pending")
async def commission_pending(user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT c.*, u.name AS agentName, s.invoiceNo AS saleNo FROM commissions c "
        "LEFT JOIN users u ON u.id=c.agentUserId LEFT JOIN sales s ON s.id=c.saleId "
        "WHERE c.tenantId=:t AND c.status IN ('CALCULATED','PENDING') ORDER BY c.createdAt"),
        {"t": tenantId})).fetchall())
    return ok(rows)


@router.get("/api/v1/commission/rules")
async def commission_rules(user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT * FROM commission_rules WHERE tenantId=:t ORDER BY priority DESC, createdAt"), {"t": tenantId})).fetchall())
    agents = rows_to_dicts((await db.execute(text(
        "SELECT id, name, email FROM users WHERE tenantId=:t AND id IN "
        "(SELECT agentUserId FROM commission_rules WHERE tenantId=:t AND agentUserId IS NOT NULL)"), {"t": tenantId})).fetchall())
    amap = {a["id"]: a for a in agents}
    for r in rows:
        r["agent"] = amap.get(r.get("agentUserId"))
    return ok(rows)


@router.post("/api/v1/commission/rules")
async def create_commission_rule(body: dict, user: AuthUser = Depends(require_auth),
                                 tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    name, ctype = body.get("name"), body.get("commissionType")
    if not name or not ctype: return err("Name and commissionType are required", 400)
    import json as _json
    slab = body.get("slabConfig")
    await db.execute(text(
        "INSERT INTO commission_rules (id, tenantId, name, agentUserId, agentType, commissionType, rate, fixedAmount, "
        "productId, categoryId, targetAmount, slabConfig, collectionRate, priority, createdBy) "
        "VALUES (UUID(), :t, :n, :au, :at, :ct, :r, :fa, :p, :cat, :ta, :slab, :cr, :pr, :u)"),
        {"t": tenantId, "n": name, "au": body.get("agentUserId"), "at": body.get("agentType", "SALES_AGENT"),
         "ct": ctype, "r": body.get("rate"), "fa": body.get("fixedAmount"), "p": body.get("productId"),
         "cat": body.get("categoryId"), "ta": body.get("targetAmount"),
         "slab": _json.dumps(slab) if slab else None, "cr": body.get("collectionRate"),
         "pr": body.get("priority", 0), "u": user.id})
    await db.commit()
    return ok({"created": True}, 201)


@router.post("/api/v1/commission/{commission_id}/approve")
async def approve_commission(commission_id: str, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    c = (await db.execute(text("SELECT status FROM commissions WHERE id=:id AND tenantId=:t"),
                          {"id": commission_id, "t": tenantId})).first()
    if not c: return err("Commission not found", 404)
    if c[0] not in ("CALCULATED", "PENDING"): return err(f"Cannot approve from status {c[0]}", 400)
    await db.execute(text(
        "UPDATE commissions SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), updatedBy=:u WHERE id=:id"),
        {"u": user.id, "id": commission_id})
    await db.commit()
    return ok({"approved": True})


@router.post("/api/v1/commission/{commission_id}/payable")
async def mark_payable(commission_id: str, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    c = (await db.execute(text("SELECT status FROM commissions WHERE id=:id AND tenantId=:t"),
                          {"id": commission_id, "t": tenantId})).first()
    if not c: return err("Commission not found", 404)
    if c[0] != "APPROVED": return err(f"Cannot mark payable from status {c[0]}", 400)
    await db.execute(text(
        "UPDATE commissions SET status='PAYABLE', payableAt=NOW(), updatedBy=:u WHERE id=:id"),
        {"u": user.id, "id": commission_id})
    await db.commit()
    return ok({"payable": True})


@router.post("/api/v1/commission/{commission_id}/pay")
async def pay_commission(commission_id: str, user: AuthUser = Depends(require_auth),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    c = (await db.execute(text("SELECT status, amount, agentName FROM commissions WHERE id=:id AND tenantId=:t"),
                          {"id": commission_id, "t": tenantId})).first()
    if not c: return err("Commission not found", 404)
    if c[0] != "PAYABLE": return err(f"Cannot pay from status {c[0]} — must be PAYABLE", 400)
    amount = float(c[1])
    async with txn(db):
        await db.execute(text(
            "UPDATE commissions SET status='PAID', paidAt=NOW(), paidBy=:u, updatedBy=:u WHERE id=:id"),
            {"u": user.id, "id": commission_id})
        # Accounting (§10.20): COMMISSION_PAID journal — Debit Commission Expense, Credit Cash
        await acc.post_journal(db, tenantId, refType="COMMISSION_PAID", refId=commission_id,
                               narration=f"Commission paid to {c[2]}", lines=[
                                   ("5500", amount, 0.0, f"Commission to {c[2]}"),
                                   ("1000", 0.0, amount, "Commission payout"),
                               ], userId=user.id)
    return ok({"paid": True})


@router.get("/api/v1/commission/agents")
async def commission_agents(user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT ua.id, ua.name, ua.email, ua.phone, ua.status FROM users ua "
        "WHERE ua.tenantId=:t AND (ua.id IN (SELECT agentUserId FROM commissions WHERE tenantId=:t AND agentUserId IS NOT NULL) "
        "OR ua.id IN (SELECT agentUserId FROM commission_rules WHERE tenantId=:t AND agentUserId IS NOT NULL))"),
        {"t": tenantId})).fetchall())
    for a in rows:
        stats = (await db.execute(text(
            "SELECT status, COALESCE(SUM(amount),0) FROM commissions WHERE tenantId=:t AND agentUserId=:a GROUP BY status"),
            {"t": tenantId, "a": a["id"]})).fetchall()
        m = {r[0]: float(r[1]) for r in stats}
        earned = m.get("CALCULATED", 0) + m.get("PENDING", 0) + m.get("APPROVED", 0) + m.get("PAYABLE", 0) + m.get("PAID", 0)
        a["stats"] = {"totalEarned": earned, "totalPayable": m.get("APPROVED", 0) + m.get("PAYABLE", 0),
                      "totalPaid": m.get("PAID", 0), "totalReversed": abs(m.get("REVERSED", 0)),
                      "pendingCount": 0}
    return ok(rows)


# ═════════════════════════ PURCHASING (§10.17) ═════════════════════════

@router.get("/api/v1/purchasing/summary")
async def purchasing_summary(user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    pr = (await db.execute(text(
        "SELECT COUNT(*) FROM purchase_requisitions WHERE tenantId=:t AND status='SUBMITTED'"), {"t": tenantId})).first()
    po = (await db.execute(text(
        "SELECT COUNT(*) FROM purchase_orders WHERE tenantId=:t AND status IN ('SUBMITTED','APPROVED','PARTIALLY_RECEIVED')"),
        {"t": tenantId})).first()
    inv = (await db.execute(text(
        "SELECT COUNT(*), COALESCE(SUM(total),0) FROM purchase_invoices WHERE tenantId=:t AND status IN ('UNPAID','PARTIALLY_PAID')"),
        {"t": tenantId})).first()
    grn = (await db.execute(text(
        "SELECT COUNT(*) FROM goods_receipts WHERE tenantId=:t AND receivedDate >= NOW() - INTERVAL 30 DAY"), {"t": tenantId})).first()
    ret = (await db.execute(text(
        "SELECT COUNT(*) FROM purchase_returns WHERE tenantId=:t AND returnDate >= NOW() - INTERVAL 30 DAY"), {"t": tenantId})).first()
    return ok({"pendingRequisitions": pr[0], "activeOrders": po[0], "unpaidInvoices": inv[0],
               "totalPayable": float(inv[1] or 0), "grnsLast30Days": grn[0], "returnsLast30Days": ret[0]})


@router.get("/api/v1/purchasing/requisitions")
async def list_requisitions(status: str = "", page: int = Query(1), limit: int = Query(20),
                           user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                           db: AsyncSession = Depends(get_db)):
    where = "tenantId=:t"; params: dict = {"t": tenantId}
    if status: where += " AND status=:st"; params["st"] = status
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT * FROM purchase_requisitions WHERE {where} ORDER BY createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    for r in rows:
        items = rows_to_dicts((await db.execute(text(
            "SELECT pri.*, p.name AS productName, p.sku FROM purchase_requisition_items pri "
            "JOIN products p ON p.id=pri.productId WHERE pri.requisitionId=:id"), {"id": r["id"]})).fetchall())
        r["items"] = items
    total = (await db.execute(text(f"SELECT COUNT(*) FROM purchase_requisitions WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.post("/api/v1/purchasing/requisitions")
async def create_requisition(body: dict, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Requisition needs at least one item", 400)
    prNo = gen_no("PR")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO purchase_requisitions (id, tenantId, branchId, warehouseId, requestedBy, prNo, requestDate, "
            "expectedDate, status, note, createdBy) VALUES (UUID(), :t, :b, :w, :u, :pr, NOW(), :ed, 'DRAFT', :n, :u)"),
            {"t": tenantId, "b": body.get("branchId"), "w": body.get("warehouseId"), "u": user.id,
             "pr": prNo, "ed": body.get("expectedDate"), "n": body.get("note")},)
        pr_id = (await db.execute(text("SELECT id FROM purchase_requisitions WHERE tenantId=:t AND prNo=:pr"),
                                  {"t": tenantId, "pr": prNo})).first()[0]
        for it in items:
            await db.execute(text(
                "INSERT INTO purchase_requisition_items (id, tenantId, requisitionId, productId, qty, estUnitPrice, note) "
                "VALUES (UUID(), :t, :r, :p, :q, :up, :n)"),
                {"t": tenantId, "r": pr_id, "p": it["productId"], "q": it["qty"],
                 "up": it.get("estUnitPrice", 0), "n": it.get("note")})
    return ok({"prNo": prNo, "id": pr_id}, 201)


@router.post("/api/v1/purchasing/requisitions/{req_id}/submit")
async def submit_requisition(req_id: str, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text("SELECT status FROM purchase_requisitions WHERE id=:id AND tenantId=:t"),
                          {"id": req_id, "t": tenantId})).first()
    if not r: return err("Requisition not found", 404)
    if r[0] != "DRAFT": return err(f"Cannot submit in status {r[0]}", 400)
    await db.execute(text("UPDATE purchase_requisitions SET status='SUBMITTED', updatedBy=:u WHERE id=:id"),
                     {"u": user.id, "id": req_id})
    await db.commit()
    return ok({"submitted": True})


@router.post("/api/v1/purchasing/requisitions/{req_id}/approve")
async def approve_requisition(req_id: str, user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text("SELECT status, prNo FROM purchase_requisitions WHERE id=:id AND tenantId=:t"),
                          {"id": req_id, "t": tenantId})).first()
    if not r: return err("Requisition not found", 404)
    if r[0] != "SUBMITTED": return err(f"Cannot approve in status {r[0]}", 400)
    # ── Prompt 27: estimated requisition value routes through the engine ──
    est = (await db.execute(text(
        "SELECT COALESCE(SUM(qty * COALESCE(estUnitPrice, 0)), 0) FROM purchase_requisition_items WHERE requisitionId=:id"),
        {"id": req_id})).first()
    apr = await wf.create_approval(db, tenantId, "PURCHASE_REQUISITION", req_id, r[1],
                                   f"Requisition {r[1]} approval", float(est[0] or 0),
                                   {"reqId": req_id}, user.id)
    if apr:
        await db.commit()
        return ok({"approved": False, "needsApproval": True, "approval": apr}, 202)
    await db.execute(text(
        "UPDATE purchase_requisitions SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), updatedBy=:u WHERE id=:id"),
        {"u": user.id, "id": req_id})
    await db.commit()
    return ok({"approved": True})


@router.post("/api/v1/purchasing/requisitions/{req_id}/reject")
async def reject_requisition(req_id: str, body: Optional[dict] = None, user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text("SELECT status FROM purchase_requisitions WHERE id=:id AND tenantId=:t"),
                          {"id": req_id, "t": tenantId})).first()
    if not r: return err("Requisition not found", 404)
    if r[0] not in ("DRAFT", "SUBMITTED"): return err(f"Cannot reject in status {r[0]}", 400)
    b = body or {}
    reason = b.get("reason", "Rejected by manager")
    await db.execute(text(
        "UPDATE purchase_requisitions SET status='REJECTED', note=COALESCE(:r, note), updatedBy=:u WHERE id=:id"),
        {"r": f"Rejected: {reason}", "u": user.id, "id": req_id})
    await db.commit()
    return ok({"rejected": True})


@router.get("/api/v1/purchasing/orders")
async def list_purchase_orders(status: str = "", supplierId: str = "", page: int = Query(1), limit: int = Query(20),
                               user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    where = "po.tenantId=:t"; params: dict = {"t": tenantId}
    if status: where += " AND po.status=:st"; params["st"] = status
    if supplierId: where += " AND po.supplierId=:s"; params["s"] = supplierId
    off, lim = paginate_params(page, limit)
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT po.*, s.name AS supplierName FROM purchase_orders po "
        f"JOIN suppliers s ON s.id=po.supplierId WHERE {where} ORDER BY po.createdAt DESC LIMIT :lim OFFSET :off"),
        {**params, "lim": lim, "off": off})).fetchall())
    for r in rows:
        r["supplier"] = {"id": r.pop("supplierId"), "name": r.pop("supplierName")}
        items = rows_to_dicts((await db.execute(text(
            "SELECT poi.*, p.name AS productName, p.sku AS productSku, p.barcode AS productBarcode FROM purchase_order_items poi "
            "JOIN products p ON p.id=poi.productId WHERE poi.purchaseOrderId=:id"), {"id": r["id"]})).fetchall())
        r["items"] = items
        r["goodsReceipts"] = rows_to_dicts((await db.execute(text(
            "SELECT id, grnNo FROM goods_receipts WHERE purchaseOrderId=:id"), {"id": r["id"]})).fetchall())
        r["purchaseInvoices"] = rows_to_dicts((await db.execute(text(
            "SELECT id, piNo, total, paidTotal, status FROM purchase_invoices WHERE purchaseOrderId=:id"), {"id": r["id"]})).fetchall())
    total = (await db.execute(text(f"SELECT COUNT(*) FROM purchase_orders po WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": lim, "total": total, "totalPages": (total + lim - 1) // lim}})


@router.post("/api/v1/purchasing/orders")
async def create_purchase_order(body: dict, user: AuthUser = Depends(require_auth),
                                tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Purchase order needs at least one item", 400)
    supplierId = body.get("supplierId")
    if not supplierId: return err("supplierId is required", 400)
    poNo = gen_no("PO")
    subtotal = sum(float(i["qty"]) * float(i["unitPrice"]) for i in items)
    rebate = float(body.get("rebatePercent", 0) or 0)
    rebate_amt = round((subtotal) * rebate / 100, 2)
    total = max(subtotal - rebate_amt, 0)
    async with txn(db):
        await db.execute(text(
            "INSERT INTO purchase_orders (id, tenantId, branchId, warehouseId, supplierId, poNo, orderDate, expectedDate, "
            "subtotal, discountTotal, taxTotal, total, rebatePercent, status, createdBy) "
            "VALUES (UUID(), :t, :b, :w, :s, :po, NOW(), :ed, :sub, :disc, 0, :total, :rb, 'SUBMITTED', :u)"),
            {"t": tenantId, "b": body.get("branchId"), "w": body.get("warehouseId"), "s": supplierId,
             "po": poNo, "ed": body.get("expectedDate"), "sub": subtotal, "disc": rebate_amt,
             "total": total, "rb": rebate if rebate is not None else 0, "u": user.id})
        po_id = (await db.execute(text("SELECT id FROM purchase_orders WHERE tenantId=:t AND poNo=:po"),
                                  {"t": tenantId, "po": poNo})).first()[0]
        for i in items:
            line = float(i["qty"]) * float(i["unitPrice"])
            await db.execute(text(
                "INSERT INTO purchase_order_items (id, tenantId, purchaseOrderId, productId, variantId, qty, unitPrice, lineTotal, updatedAt) "
                "VALUES (UUID(), :t, :po, :p, :v, :q, :up, :lt, NOW())"),
                {"t": tenantId, "po": po_id, "p": i["productId"], "v": i.get("variantId"),
                 "q": i["qty"], "up": i["unitPrice"], "lt": line})
        if body.get("requisitionId"):
            await db.execute(text("UPDATE purchase_requisitions SET status='CONVERTED' WHERE id=:id"),
                             {"id": body["requisitionId"]})
    return ok({"poNo": poNo, "id": po_id, "total": total}, 201)


@router.post("/api/v1/purchasing/orders/{po_id}/approve")
async def approve_po(po_id: str, user: AuthUser = Depends(require_auth),
                     tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text("SELECT status, poNo, total FROM purchase_orders WHERE id=:id AND tenantId=:t"),
                          {"id": po_id, "t": tenantId})).first()
    if not r: return err("Purchase order not found", 404)
    if r[0] != "SUBMITTED": return err(f"Cannot approve in status {r[0]}", 400)
    # ── Prompt 27: purchase orders above the configured amount need engine approval ──
    apr = await wf.create_approval(db, tenantId, "PURCHASE_ORDER", po_id, r[1],
                                   f"Purchase order {r[1]} approval", float(r[2] or 0),
                                   {"poId": po_id}, user.id)
    if apr:
        await db.commit()
        return ok({"approved": False, "needsApproval": True, "approval": apr}, 202)
    await db.execute(text(
        "UPDATE purchase_orders SET status='APPROVED', approvedBy=:u, approvedAt=NOW(), updatedBy=:u WHERE id=:id"),
        {"u": user.id, "id": po_id})
    await db.commit()
    return ok({"approved": True})


@router.post("/api/v1/purchasing/orders/{po_id}/cancel")
async def cancel_po(po_id: str, user: AuthUser = Depends(require_auth),
                    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(text("SELECT status FROM purchase_orders WHERE id=:id AND tenantId=:t"),
                          {"id": po_id, "t": tenantId})).first()
    if not r: return err("Purchase order not found", 404)
    if r[0] not in ("DRAFT", "SUBMITTED", "APPROVED"):
        return err(f"Cannot cancel PO with receipts (status: {r[0]})", 400)
    await db.execute(text("UPDATE purchase_orders SET status='CANCELLED', updatedBy=:u WHERE id=:id"),
                     {"u": user.id, "id": po_id})
    await db.commit()
    return ok({"cancelled": True})


@router.post("/api/v1/purchasing/grns")
async def receive_goods(body: dict, user: AuthUser = Depends(require_auth),
                        tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """GRN — partial receiving + Inventory stock increase (movement recorded)."""
    items = body.get("items") or []
    if not items: return err("GRN needs at least one item", 400)
    po = None
    po_id = body.get("purchaseOrderId")
    if po_id:
        po = (await db.execute(text("SELECT id, status, supplierId, warehouseId, branchId FROM purchase_orders WHERE id=:id AND tenantId=:t"),
                               {"id": po_id, "t": tenantId})).first()
        if not po: return err("Purchase order not found", 404)
        if po[1] not in ("APPROVED", "PARTIALLY_RECEIVED"):
            return err(f"PO must be APPROVED before receiving (status: {po[1]})", 400)
    supplierId = body.get("supplierId") or (po[2] if po else None)
    warehouseId = body.get("warehouseId") or (po[3] if po else None)
    if not warehouseId: return err("warehouseId required", 400)
    wh = (await db.execute(text("SELECT branchId FROM warehouses WHERE id=:w"), {"w": warehouseId})).first()
    branchId = body.get("branchId") or (wh[0] if wh else None)
    grnNo = gen_no("GRN")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO goods_receipts (id, tenantId, branchId, warehouseId, supplierId, purchaseOrderId, grnNo, "
            "receivedDate, status, note, createdBy) VALUES (UUID(), :t, :b, :w, :s, :po, :grn, NOW(), 'RECEIVED', :n, :u)"),
            {"t": tenantId, "b": branchId, "w": warehouseId, "s": supplierId, "po": po_id,
             "grn": grnNo, "n": body.get("note"), "u": user.id},)
        grn_id = (await db.execute(text("SELECT id FROM goods_receipts WHERE tenantId=:t AND grnNo=:g"),
                                   {"t": tenantId, "g": grnNo})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO goods_receipt_items (id, tenantId, goodsReceiptId, productId, variantId, qty, qtyRejected, costPrice, batchNo, updatedAt) "
                "VALUES (UUID(), :t, :g, :p, :v, :q, :rj, :cp, :b, NOW())"),
                {"t": tenantId, "g": grn_id, "p": i["productId"], "v": i.get("variantId"), "q": i["qty"],
                 "rj": i.get("qtyRejected", 0), "cp": i["costPrice"], "b": i.get("batchNo")})
            # stock increase with movement record
            qty, cost = float(i["qty"]), float(i["costPrice"])
            st = (await db.execute(text(
                "SELECT id, qtyOnHand, COALESCE(avgCost,0) FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId")})).first()
            if st:
                before = float(st[1]); after = before + qty
                await db.execute(text("UPDATE stock SET qtyOnHand=:a, avgCost=:c WHERE id=:id"),
                                 {"a": after, "c": round(((float(st[2]) * before) + (cost * qty)) / after, 2) if after > 0 else cost, "id": st[0]})
            else:
                await db.execute(text(
                    "INSERT INTO stock (id, tenantId, warehouseId, productId, variantId, qtyOnHand, qtyReserved, avgCost, updatedAt) "
                    "VALUES (UUID(), :t, :w, :p, :v, :q, 0, :c, NOW())"),
                    {"t": tenantId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId"), "q": qty, "c": cost})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, "
                "qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (UUID(), :t, :b, :w, :p, :v, 'PURCHASE_IN', :q, :qb, :qa, 'PURCHASE', :rid, :note, :u, :u)"),
                {"t": tenantId, "b": branchId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId"),
                 "q": qty, "qb": float(st[1]) if st else 0, "qa": (float(st[1]) + qty) if st else qty,
                 "rid": grn_id, "note": f"GRN {grnNo}", "u": user.id})
            if i.get("batchNo"):
                await db.execute(text(
                    "INSERT INTO batches (id, tenantId, productId, warehouseId, batchNo, qty, costPrice, expiryDate, createdBy) "
                    "VALUES (UUID(), :t, :p, :w, :b, :q, :c, :e, :u) ON DUPLICATE KEY UPDATE qty = qty + :q2"),
                    {"t": tenantId, "p": i["productId"], "w": warehouseId, "b": i["batchNo"], "q": qty,
                     "q2": qty, "c": cost, "e": i.get("expiryDate"), "u": user.id})
                # Mirror into stock_batches so the expiry/FEFO reports (§10.17 pharmacy)
                # see the batch — the two tables must never drift.
                await db.execute(text(
                    "INSERT INTO stock_batches (id, tenantId, productId, warehouseId, batchNo, qty, expiryDate, costPrice, createdAt, updatedAt) "
                    "VALUES (UUID(), :t, :p, :w, :b, :q, :e, :c, NOW(), NOW()) "
                    "ON DUPLICATE KEY UPDATE qty = qty + :q2, expiryDate = COALESCE(:e2, expiryDate), "
                    "costPrice = :c2, updatedAt = NOW()"),
                    {"t": tenantId, "p": i["productId"], "w": warehouseId, "b": i["batchNo"], "q": qty,
                     "q2": qty, "c": cost, "e": i.get("expiryDate"), "e2": i.get("expiryDate"), "c2": cost})
        # PO receipt progress
        if po:
            fully = True
            for i in items:
                poi = (await db.execute(text(
                    "SELECT id, qty, qtyReceived FROM purchase_order_items WHERE purchaseOrderId=:po AND productId=:p AND (variantId IS NULL OR variantId=:v)"),
                    {"po": po_id, "p": i["productId"], "v": i.get("variantId")})).first()
                if poi:
                    new_recv = float(poi[2]) + float(i["qty"])
                    await db.execute(text("UPDATE purchase_order_items SET qtyReceived=:r WHERE id=:id"),
                                     {"r": new_recv, "id": poi[0]})
                    if new_recv < float(poi[1]): fully = False
            await db.execute(text("UPDATE purchase_orders SET status=:s WHERE id=:id"),
                             {"s": "RECEIVED" if fully else "PARTIALLY_RECEIVED", "id": po_id})
        # Accounting (§10.20): GRN journal — Debit Inventory, Credit AP, Debit Input VAT
        grn_cost = sum(float(i["qty"]) * float(i["costPrice"]) for i in items)
        # §10.21 — Calculate purchase VAT
        purchase_tax_rule = await tax_engine.resolve_tax_rate(db, tenantId, appliesTo="PURCHASE")
        purchase_tax = 0.0
        if purchase_tax_rule and purchase_tax_rule["rate"] > 0:
            for i in items:
                line_cost = float(i["qty"]) * float(i["costPrice"])
                tc = tax_engine.calculate_tax(line_cost, purchase_tax_rule["rate"],
                                             tax_inclusive=purchase_tax_rule["taxInclusive"])
                purchase_tax += tc["taxAmount"]
            purchase_tax = round(purchase_tax, 2)
            # Record tax transaction
            await tax_engine.record_tax_transaction(
                db, tenantId, branchId=branchId,
                refType="GRN", refId=grn_id, refNo=grnNo,
                taxRuleId=purchase_tax_rule["ruleId"], taxRateId=purchase_tax_rule["rateId"],
                taxRate=purchase_tax_rule["rate"],
                taxableAmount=grn_cost,
                taxAmount=purchase_tax,
                isTaxInclusive=purchase_tax_rule["taxInclusive"],
                userId=user.id,
            )
        grn_lines: list[tuple[str, float, float, str]] = []
        if purchase_tax > 0:
            grn_lines.append(("1200", grn_cost, 0.0, f"Inventory from GRN {grnNo}"))
            grn_lines.append(("2110", purchase_tax, 0.0, f"Input VAT on GRN {grnNo}"))
            grn_lines.append(("2000", 0.0, grn_cost + purchase_tax, f"AP for GRN {grnNo}"))
        elif grn_cost > 0:
            grn_lines.append(("1200", grn_cost, 0.0, f"Inventory from GRN {grnNo}"))
            grn_lines.append(("2000", 0.0, grn_cost, f"AP for GRN {grnNo}"))
        if grn_lines:
            await acc.post_journal(db, tenantId, refType="GRN", refId=grn_id,
                                   narration=f"Goods received {grnNo}", lines=grn_lines, userId=user.id)
        # Accounts payable: a GRN against a PO or direct supplier creates the supplier invoice and
        # increments the supplier's currentDue — stock in, payable owed (§10.17).
        if supplierId:
            piNo = gen_no("PI")
            pi_subtotal = grn_cost
            pi_total = round(grn_cost + purchase_tax, 2)
            await db.execute(text(
                "INSERT INTO purchase_invoices (id, tenantId, branchId, supplierId, purchaseOrderId, goodsReceiptId, "
                "piNo, invoiceDate, subtotal, discountTotal, taxTotal, total, paidTotal, status, createdBy) "
                "VALUES (UUID(), :t, :b, :s, :po, :grn, :pi, NOW(), :sub, 0, :tax, :total, 0, 'UNPAID', :u)"),
                {"t": tenantId, "b": branchId, "s": supplierId, "po": po_id, "grn": grn_id, "pi": piNo,
                 "sub": pi_subtotal, "tax": purchase_tax, "total": pi_total, "u": user.id})
            await db.execute(text("UPDATE suppliers SET currentDue = currentDue + :a WHERE id=:s"),
                             {"a": pi_total, "s": supplierId})
    return ok({"grnNo": grnNo, "id": grn_id}, 201)


@router.get("/api/v1/purchasing/grns")
async def list_grns(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                    db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT g.*, s.name AS supplierName, w.name AS warehouseName, po.poNo FROM goods_receipts g "
        "JOIN suppliers s ON s.id=g.supplierId JOIN warehouses w ON w.id=g.warehouseId "
        "LEFT JOIN purchase_orders po ON po.id=g.purchaseOrderId WHERE g.tenantId=:t ORDER BY g.createdAt DESC LIMIT 50"),
        {"t": tenantId})).fetchall())
    for r in rows:
        r["supplier"] = {"id": r.pop("supplierId"), "name": r.pop("supplierName")}
        r["warehouse"] = {"id": r.pop("warehouseId"), "name": r.pop("warehouseName")}
        r["purchaseOrder"] = {"id": r.pop("purchaseOrderId"), "poNo": r.pop("poNo")} if r.get("poNo") else None
        r["items"] = rows_to_dicts((await db.execute(text(
            "SELECT gi.*, p.name AS productName FROM goods_receipt_items gi JOIN products p ON p.id=gi.productId WHERE gi.goodsReceiptId=:id"),
            {"id": r["id"]})).fetchall())
    return ok(rows)


@router.post("/api/v1/purchasing/invoices")
async def create_purchase_invoice(body: dict, user: AuthUser = Depends(require_auth),
                                  tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    items = body.get("items") or []
    if not items: return err("Invoice needs items", 400)
    supplierId = body.get("supplierId")
    branchId = body.get("branchId")
    if not branchId:
        b = (await db.execute(text("SELECT id FROM branches WHERE tenantId=:t LIMIT 1"), {"t": tenantId})).first()
        branchId = b[0]
    piNo = gen_no("PI")
    subtotal = sum(float(i["qty"]) * float(i["costPrice"]) for i in items)
    # §10.21 — Calculate purchase VAT server-side
    purchase_tax_rule = await tax_engine.resolve_tax_rate(db, tenantId, appliesTo="PURCHASE")
    taxTotal = 0.0
    if purchase_tax_rule and purchase_tax_rule["rate"] > 0:
        for i in items:
            line_cost = float(i["qty"]) * float(i["costPrice"])
            tc = tax_engine.calculate_tax(line_cost, purchase_tax_rule["rate"],
                                         tax_inclusive=purchase_tax_rule["taxInclusive"])
            taxTotal += tc["taxAmount"]
        taxTotal = round(taxTotal, 2)
    else:
        taxTotal = float(body.get("taxTotal", 0) or 0)
    total = max(subtotal - float(body.get("discountTotal", 0) or 0) + taxTotal, 0)
    async with txn(db):
        await db.execute(text(
            "INSERT INTO purchase_invoices (id, tenantId, branchId, supplierId, purchaseOrderId, goodsReceiptId, "
            "piNo, invoiceDate, subtotal, discountTotal, taxTotal, total, paidTotal, status, createdBy) "
            "VALUES (UUID(), :t, :b, :s, :po, :grn, :pi, NOW(), :sub, :d, :tax, :total, 0, 'UNPAID', :u)"),
            {"t": tenantId, "b": branchId, "s": supplierId, "po": body.get("purchaseOrderId"),
             "grn": body.get("goodsReceiptId"), "pi": piNo, "sub": subtotal,
             "d": body.get("discountTotal", 0), "tax": taxTotal, "total": total, "u": user.id})
        pi_id = (await db.execute(text("SELECT id FROM purchase_invoices WHERE tenantId=:t AND piNo=:pi"),
                                  {"t": tenantId, "pi": piNo})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO purchase_invoice_items (id, tenantId, purchaseInvoiceId, productId, qty, costPrice, lineTotal, updatedAt) "
                "VALUES (UUID(), :t, :pi, :p, :q, :cp, :lt, NOW())"),
                {"t": tenantId, "pi": pi_id, "p": i["productId"], "q": i["qty"], "cp": i["costPrice"],
                 "lt": float(i["qty"]) * float(i["costPrice"])})
        await db.execute(text("UPDATE suppliers SET currentDue = currentDue + :total WHERE id=:s"),
                         {"total": total, "s": supplierId})
    return ok({"piNo": piNo, "id": pi_id, "total": total}, 201)


@router.get("/api/v1/purchasing/invoices")
async def list_purchase_invoices(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                                 db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT pi.*, s.name AS supplierName FROM purchase_invoices pi JOIN suppliers s ON s.id=pi.supplierId "
        "WHERE pi.tenantId=:t ORDER BY pi.createdAt DESC LIMIT 50"), {"t": tenantId})).fetchall())
    for r in rows: r["supplier"] = {"id": r.pop("supplierId"), "name": r.pop("supplierName")}
    return ok(rows)


@router.post("/api/v1/purchasing/payments")
async def pay_supplier(body: dict, user: AuthUser = Depends(require_auth),
                       tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    amount = float(body.get("amount", 0) or 0)
    allocs = body.get("allocations") or []
    alloc_sum = sum(float(a["amount"]) for a in allocs)
    if not allocs: return err("Payment must allocate to at least one invoice", 400)
    if abs(alloc_sum - amount) > 0.01: return err(f"Allocation mismatch: {alloc_sum} vs {amount}", 400)
    supplierId = body.get("supplierId")
    pay_no = gen_no("SPAY")
    async with txn(db):
        await db.execute(text(
            "INSERT INTO supplier_payments (id, tenantId, branchId, supplierId, paymentNo, paymentDate, amount, method, reference, note, createdBy, updatedAt) "
            "VALUES (UUID(), :t, :b, :s, :p, NOW(), :a, :m, :r, :n, :u, NOW())"),
            {"t": tenantId, "b": body.get("branchId"), "s": supplierId, "p": pay_no, "a": amount,
             "m": body.get("method", "CASH"), "r": body.get("reference"), "n": body.get("note"), "u": user.id})
        pay_id = (await db.execute(text("SELECT id FROM supplier_payments WHERE tenantId=:t AND paymentNo=:p"),
                                   {"t": tenantId, "p": pay_no})).first()[0]
        for a in allocs:
            await db.execute(text(
                "INSERT INTO supplier_payment_allocations (id, tenantId, supplierPaymentId, purchaseInvoiceId, amount) "
                "VALUES (UUID(), :t, :pay, :inv, :a)"),
                {"t": tenantId, "pay": pay_id, "inv": a["purchaseInvoiceId"], "a": a["amount"]})
            inv = (await db.execute(text("SELECT total, paidTotal, status FROM purchase_invoices WHERE id=:id FOR UPDATE"),
                                    {"id": a["purchaseInvoiceId"]})).first()
            if not inv: raise Exception("Purchase invoice not found")
            new_paid = float(inv[1]) + float(a["amount"])
            new_due = float(inv[0]) - new_paid
            await db.execute(text(
                "UPDATE purchase_invoices SET paidTotal=:p, status=:s WHERE id=:id"),
                {"p": new_paid, "s": "PAID" if new_due <= 0.01 else "PARTIALLY_PAID", "id": a["purchaseInvoiceId"]})
        await db.execute(text("UPDATE suppliers SET currentDue = currentDue - :a WHERE id=:s"),
                         {"a": amount, "s": supplierId})
        # Accounting (§10.20): SUPPLIER_PAYMENT journal — Debit AP, Credit cash/bank
        await acc.post_journal(db, tenantId, refType="SUPPLIER_PAYMENT", refId=pay_id,
                               narration=f"Supplier payment {pay_no}", lines=[
                                   ("2000", amount, 0.0, f"AP reduction {pay_no}"),
                                   (acc.METHOD_ACCOUNT.get(body.get("method", "CASH"), "1000"),
                                    0.0, amount, f"Paid via {body.get('method', 'CASH')}"),
                               ], userId=user.id)
    return ok({"paymentNo": pay_no, "amount": amount}, 201)


@router.get("/api/v1/purchasing/payments")
async def list_supplier_payments(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                                 db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT sp.*, s.name AS supplierName FROM supplier_payments sp JOIN suppliers s ON s.id=sp.supplierId "
        "WHERE sp.tenantId=:t ORDER BY sp.createdAt DESC LIMIT 100"), {"t": tenantId})).fetchall())
    for r in rows: r["supplier"] = {"id": r.pop("supplierId"), "name": r.pop("supplierName")}
    return ok(rows)


@router.post("/api/v1/purchasing/returns")
async def purchase_return(body: dict, user: AuthUser = Depends(require_auth),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Purchase return — reverses stock AND supplier payable (guardrail)."""
    items = body.get("items") or []
    if not items: return err("Return needs items", 400)
    supplierId = body.get("supplierId"); warehouseId = body.get("warehouseId")
    subtotal = sum(float(i["qty"]) * float(i["unitPrice"]) for i in items)
    ret_no = gen_no("PRET")
    wh = (await db.execute(text("SELECT branchId FROM warehouses WHERE id=:w"), {"w": warehouseId})).first()
    async with txn(db):
        await db.execute(text(
            "INSERT INTO purchase_returns (id, tenantId, branchId, warehouseId, supplierId, purchaseOrderId, goodsReceiptId, "
            "purchaseInvoiceId, returnNo, returnDate, subtotal, total, returnType, status, reason, createdBy) "
            "VALUES (UUID(), :t, :b, :w, :s, :po, :grn, :pi, :rno, NOW(), :sub, :total, :rt, 'RETURNED', :reason, :u)"),
            {"t": tenantId, "b": wh[0] if wh else None, "w": warehouseId, "s": supplierId,
             "po": body.get("purchaseOrderId"), "grn": body.get("goodsReceiptId"), "pi": body.get("purchaseInvoiceId"),
             "rno": ret_no, "sub": subtotal, "total": subtotal,
             "rt": body.get("returnType", "CREDIT_NOTE"), "reason": body.get("reason"), "u": user.id})
        ret_id = (await db.execute(text("SELECT id FROM purchase_returns WHERE tenantId=:t AND returnNo=:r"),
                                   {"t": tenantId, "r": ret_no})).first()[0]
        for i in items:
            await db.execute(text(
                "INSERT INTO purchase_return_items (id, tenantId, returnId, productId, variantId, qty, unitPrice, lineTotal) "
                "VALUES (UUID(), :t, :r, :p, :v, :q, :up, :lt)"),
                {"t": tenantId, "r": ret_id, "p": i["productId"], "v": i.get("variantId"),
                 "q": i["qty"], "up": i["unitPrice"], "lt": float(i["qty"]) * float(i["unitPrice"])})
            qty = float(i["qty"])
            st = (await db.execute(text(
                "SELECT id, qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p AND (variantId IS NULL OR variantId=:v) FOR UPDATE"),
                {"t": tenantId, "w": warehouseId, "p": i["productId"], "v": i.get("variantId")})).first()
            before = float(st[1]) if st else 0
            after = before - qty
            if st:
                await db.execute(text("UPDATE stock SET qtyOnHand=:a WHERE id=:id"), {"a": after, "id": st[0]})
            await db.execute(text(
                "INSERT INTO stock_movements (id, tenantId, branchId, warehouseId, productId, variantId, movementType, qty, "
                "qtyBefore, qtyAfter, refType, refId, note, userId, createdBy) "
                "VALUES (UUID(), :t, :b, :w, :p, :v, 'ADJUSTMENT_OUT', :q, :qb, :qa, 'PURCHASE_RETURN', :rid, :note, :u, :u)"),
                {"t": tenantId, "b": wh[0] if wh else None, "w": warehouseId, "p": i["productId"], "v": i.get("variantId"),
                 "q": -qty, "qb": before, "qa": after, "rid": ret_id, "note": f"Purchase return {ret_no}", "u": user.id})
        await db.execute(text("UPDATE suppliers SET currentDue = currentDue - :sub WHERE id=:s"),
                         {"sub": subtotal, "s": supplierId})
        # Accounting (§10.20): PURCHASE_RETURN journal — Debit AP, Credit Inventory
        if subtotal > 0:
            await acc.post_journal(db, tenantId, refType="PURCHASE_RETURN", refId=ret_id,
                                    narration=f"Purchase return {ret_no}",
                                    lines=[
                                        ("2000", subtotal, 0.0, f"AP reduction {ret_no}"),
                                        ("1200", 0.0, subtotal, f"Inventory returned {ret_no}"),
                                    ], userId=user.id)
    return ok({"returnNo": ret_no, "total": subtotal}, 201)


@router.get("/api/v1/purchasing/returns")
async def list_purchase_returns(user: AuthUser = Depends(require_auth), tenantId: str = Depends(resolve_tenant),
                                db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT pr.*, s.name AS supplierName, po.poNo, w.name AS warehouseName FROM purchase_returns pr "
        "JOIN suppliers s ON s.id=pr.supplierId "
        "LEFT JOIN warehouses w ON w.id=pr.warehouseId "
        "LEFT JOIN purchase_orders po ON po.id=pr.purchaseOrderId "
        "WHERE pr.tenantId=:t ORDER BY pr.createdAt DESC LIMIT 100"), {"t": tenantId})).fetchall())
    for r in rows:
        r["supplier"] = {"id": r.pop("supplierId"), "name": r.pop("supplierName")}
        wh_name = r.pop("warehouseName", None)
        wh_id = r.pop("warehouseId", None)
        r["warehouse"] = {"id": wh_id, "name": wh_name} if wh_name else None
        po_no = r.pop("poNo", None)
        po_id = r.pop("purchaseOrderId", None)
        r["purchaseOrder"] = {"id": po_id, "poNo": po_no} if po_no else None
        r["items"] = rows_to_dicts((await db.execute(text(
            "SELECT pri.*, p.name AS productName, p.sku AS productSku FROM purchase_return_items pri JOIN products p ON p.id=pri.productId WHERE pri.returnId=:id"),
            {"id": r["id"]})).fetchall())
    return ok(rows)


@router.get("/api/v1/purchasing/suppliers/compare")
async def compare_suppliers(productId: str = "", user: AuthUser = Depends(require_auth),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    sups = rows_to_dicts((await db.execute(text(
        "SELECT id, name, company, deliveryPerformanceScore, qualityScore, defectRate, returnRate, currentDue FROM suppliers "
        "WHERE tenantId=:t AND status='ACTIVE'"), {"t": tenantId})).fetchall())
    for s in sups:
        agg = (await db.execute(text(
            "SELECT COUNT(*), COALESCE(SUM(total),0) FROM purchase_invoices WHERE tenantId=:t AND supplierId=:s AND status != 'VOID'"),
            {"t": tenantId, "s": s["id"]})).first()
        s["totalPurchased"] = float(agg[1] or 0)
        s["invoiceCount"] = agg[0]
        s["avgUnitPrice"] = None
        if productId:
            ap = (await db.execute(text(
                "SELECT SUM(pii.qty), SUM(pii.qty * pii.costPrice) FROM purchase_invoice_items pii "
                "JOIN purchase_invoices pi ON pi.id=pii.purchaseInvoiceId "
                "WHERE pii.tenantId=:t AND pii.productId=:p AND pi.supplierId=:s AND pi.status != 'VOID'"),
                {"t": tenantId, "p": productId, "s": s["id"]})).first()
            if ap and ap[0] and float(ap[0]) > 0:
                s["avgUnitPrice"] = round(float(ap[1]) / float(ap[0]), 2)
        s["score"] = (float(s.get("deliveryPerformanceScore") or 0)) * 0.4 + (float(s.get("qualityScore") or 0)) * 0.4 \
            - (float(s.get("defectRate") or 0)) * 2 - (float(s.get("returnRate") or 0)) * 2
    sups.sort(key=lambda x: -x["score"])
    return ok(sups)
