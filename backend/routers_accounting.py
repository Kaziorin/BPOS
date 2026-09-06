"""Accounting router (Prompt 16) — Chart of Accounts, Journals, Ledger,
Trial Balance, P&L, Balance Sheet, Credit/Debit Notes.

Reports are computed live from ledger_entries (append-only), so the Trial
Balance always reflects the exact posted state of every module's journals.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import accounting as acc
from db import get_db, txn
from security import require_permission, resolve_tenant
from util import err, gen_no, ok, rows_to_dicts

router = APIRouter()

# Normal-balance sign per account type: +1 = debit increases, -1 = credit increases.
NORMAL_SIDE = {"ASSET": 1, "EXPENSE": 1, "LIABILITY": -1, "EQUITY": -1, "REVENUE": -1}


@router.get("/api/v1/accounting/accounts")
async def list_accounts(
    user=Depends(require_permission("accounting.accounts.view")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    await acc.ensure_chart_of_accounts(db, tenantId, user.id)
    await db.commit()  # persist the COA seed (GET handlers close without commit → rollback otherwise)
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT a.*, parent.code AS parentCode, parent.name AS parentName "
                    "FROM accounts a LEFT JOIN accounts parent ON parent.id = a.parentAccountId "
                    "WHERE a.tenantId = :t ORDER BY a.code"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    balances = {
        r["accountId"]: float(r["debit"] or 0) - float(r["credit"] or 0)
        for r in rows_to_dicts(
            (
                await db.execute(
                    text(
                        # All entries — append-only ledger: a REVERSED journal and
                        # its posted reversal net to zero together.
                        "SELECT le.accountId, SUM(le.debit) debit, SUM(le.credit) credit "
                        "FROM ledger_entries le "
                        "WHERE le.tenantId = :t GROUP BY le.accountId"
                    ),
                    {"t": tenantId},
                )
            ).fetchall()
        )
    }
    out = []
    for a in rows:
        a["parent"] = {"id": a.pop("parentAccountId"), "code": a.pop("parentCode"), "name": a.pop("parentName")} if a.get("parentCode") else None
        movement = balances.get(a["id"], 0.0)
        signed = (float(a.pop("openingBalance") or 0) + movement) * NORMAL_SIDE.get(a["accountType"], 1)
        a["balance"] = round(signed, 2)
        out.append(a)
    return ok(out)


@router.post("/api/v1/accounting/accounts")
async def create_account(body: dict, user=Depends(require_permission("accounting.accounts.create")),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    code = (body.get("code") or "").strip()
    name = (body.get("name") or "").strip()
    atype = (body.get("accountType") or "").strip().upper()
    if not code or not name:
        return err("code and name are required", 400)
    if atype not in ("ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"):
        return err("accountType must be ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE", 400)
    dupe = (await db.execute(text("SELECT id FROM accounts WHERE tenantId=:t AND code=:c"), {"t": tenantId, "c": code})).first()
    if dupe:
        return err(f"Account code {code} already exists", 400)
    async with txn(db):
        acc_id = acc._uuid()
        await db.execute(text(
            "INSERT INTO accounts (id, tenantId, code, name, accountType, parentAccountId, isGroup, openingBalance, status, createdBy, updatedBy) "
            "VALUES (:id, :t, :c, :n, :ty, :p, :g, :ob, 'ACTIVE', :u, :u)"
        ), {"id": acc_id, "t": tenantId, "c": code, "n": name, "ty": atype,
            "p": body.get("parentAccountId"), "g": 1 if body.get("isGroup") else 0,
            "ob": float(body.get("openingBalance", 0) or 0), "u": user.id})
    return ok({"id": acc_id, "code": code, "name": name, "accountType": atype}, 201)


@router.get("/api/v1/accounting/journals")
async def list_journals(
    refType: str = "", limit: int = Query(50, le=200),
    user=Depends(require_permission("accounting.journals.view")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    where = "WHERE j.tenantId = :t" + (" AND j.refType = :rt" if refType else "")
    params: dict = {"t": tenantId, "lim": limit}
    if refType:
        params["rt"] = refType
    heads = rows_to_dicts(
        (
            await db.execute(
                text(
                    f"SELECT j.* FROM journals j {where} ORDER BY j.createdAt DESC LIMIT :lim"
                ),
                params,
            )
        ).fetchall()
    )
    for h in heads:
        h["entries"] = rows_to_dicts(
            (
                await db.execute(
                    text(
                        "SELECT le.debit, le.credit, le.memo, a.code AS accountCode, a.name AS accountName, a.accountType "
                        "FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
                        "WHERE le.journalId = :j ORDER BY le.debit DESC, le.credit DESC"
                    ),
                    {"j": h["id"]},
                )
            ).fetchall()
        )
        h["totalDebit"] = round(sum(float(e["debit"] or 0) for e in h["entries"]), 2)
    return ok(heads)


@router.post("/api/v1/accounting/journals")
async def create_journal(body: dict, user=Depends(require_permission("accounting.journals.create")),
                         tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    lines_raw = body.get("lines") or []
    if len(lines_raw) < 2:
        return err("A journal needs at least two lines (debit + credit)", 400)
    lines = []
    for l in lines_raw:
        code = (l.get("accountCode") or "").strip()
        if not code:
            return err("Every line needs accountCode", 400)
        lines.append((code, float(l.get("debit", 0) or 0), float(l.get("credit", 0) or 0), l.get("memo")))
    async with txn(db):
        try:
            journal_id = await acc.post_journal(
                db, tenantId,
                refType=body.get("refType") or "MANUAL",
                refId=body.get("refId") or acc._uuid(),
                narration=body.get("narration") or "Manual journal",
                lines=lines, userId=user.id, journalDate=body.get("journalDate"),
            )
        except Exception as e:
            return err(str(e), 400)
    return ok({"id": journal_id}, 201)


@router.post("/api/v1/accounting/journals/{journalId}/reverse")
async def reverse_journal(journalId: str, body: dict, user=Depends(require_permission("accounting.journals.create")),
                          tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    async with txn(db):
        try:
            new_id = await acc.reverse_journal(db, tenantId, journalId, body.get("reason") or "Manual reversal", user.id)
        except Exception as e:
            return err(str(e), 400)
    return ok({"reversedBy": new_id}, 201)


@router.get("/api/v1/accounting/ledger")
async def general_ledger(
    accountId: str = "", limit: int = Query(200, le=500),
    user=Depends(require_permission("accounting.ledger.view")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """General ledger — posted entries with per-account running balance."""
    if accountId:
        acct = (await db.execute(text("SELECT id, code, name, accountType FROM accounts WHERE id=:id AND tenantId=:t"),
                                 {"id": accountId, "t": tenantId})).first()
        if not acct:
            return err("Account not found", 404)
        rows = rows_to_dicts((await db.execute(text(
            "SELECT le.entryDate, le.debit, le.credit, le.memo, j.journalNo, j.refType, j.refId, j.status AS journalStatus "
            "FROM ledger_entries le JOIN journals j ON j.id = le.journalId "
            "WHERE le.tenantId=:t AND le.accountId=:a "
            "ORDER BY le.entryDate, le.createdAt LIMIT :lim"
        ), {"t": tenantId, "a": accountId, "lim": limit})).fetchall())
        running = 0.0
        for r in rows:
            running += (float(r["debit"] or 0) - float(r["credit"] or 0)) * NORMAL_SIDE.get(acct[3], 1)
            r["runningBalance"] = round(running, 2)
        return ok({"account": {"id": acct[0], "code": acct[1], "name": acct[2], "accountType": acct[3]}, "entries": rows})
    rows = rows_to_dicts((await db.execute(text(
        "SELECT le.entryDate, le.debit, le.credit, le.memo, a.code AS accountCode, a.name AS accountName, "
        "j.journalNo, j.refType, j.status AS journalStatus FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
        "JOIN journals j ON j.id = le.journalId WHERE le.tenantId=:t "
        "ORDER BY le.createdAt DESC LIMIT :lim"
    ), {"t": tenantId, "lim": limit})).fetchall())
    return ok(rows)


@router.get("/api/v1/accounting/trial-balance")
async def trial_balance(
    user=Depends(require_permission("accounting.trialbalance.view")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    await acc.ensure_chart_of_accounts(db, tenantId, user.id)
    await db.commit()  # persist the COA seed
    rows = rows_to_dicts(
        (
            await db.execute(
                text(
                    "SELECT a.id, a.code, a.name, a.accountType, a.openingBalance, "
                    "COALESCE(SUM(le.debit),0) AS debit, COALESCE(SUM(le.credit),0) AS credit "
                    "FROM accounts a LEFT JOIN ledger_entries le ON le.accountId = a.id "
                    "LEFT JOIN journals j ON j.id = le.journalId AND j.status = 'POSTED' "
                    "WHERE a.tenantId = :t GROUP BY a.id ORDER BY a.code"
                ),
                {"t": tenantId},
            )
        ).fetchall()
    )
    out, tot_d, tot_c = [], 0.0, 0.0
    for r in rows:
        d, c = float(r.pop("debit")), float(r.pop("credit"))
        opening = float(r.pop("openingBalance") or 0)
        net = d - c
        if abs(net) < 0.005 and abs(opening) < 0.005:
            continue
        # Express each account on its normal side so the trial balance footing works:
        #   signed > 0 → balance sits on the account's normal side.
        signed = net * NORMAL_SIDE.get(r["accountType"], 1)
        bal = opening + signed
        normal_debit = NORMAL_SIDE.get(r["accountType"], 1) == 1
        if bal >= 0:
            r["debit"], r["credit"] = (round(bal, 2), 0.0) if normal_debit else (0.0, round(bal, 2))
        else:
            r["debit"], r["credit"] = (0.0, round(-bal, 2)) if normal_debit else (round(-bal, 2), 0.0)
        tot_d += r["debit"]; tot_c += r["credit"]
        out.append(r)
    return ok({"accounts": out, "totalDebit": round(tot_d, 2), "totalCredit": round(tot_c, 2),
               "balanced": abs(tot_d - tot_c) < 0.01})


@router.get("/api/v1/accounting/profit-loss")
async def profit_loss(
    user=Depends(require_permission("accounting.pnl.view")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT a.code, a.name, a.accountType, COALESCE(SUM(le.debit),0) AS debit, COALESCE(SUM(le.credit),0) AS credit "
        "FROM accounts a LEFT JOIN ledger_entries le ON le.accountId = a.id "
        "LEFT JOIN journals j ON j.id = le.journalId AND j.status='POSTED' "
        "WHERE a.tenantId = :t AND a.accountType IN ('REVENUE','EXPENSE') GROUP BY a.id ORDER BY a.code"
    ), {"t": tenantId})).fetchall())
    revenue: list = []; expenses: list = []
    for r in rows:
        # debit-normal accounts (expense): debit > credit → positive; credit-normal (revenue) → invert.
        net = (float(r["debit"]) - float(r["credit"])) * NORMAL_SIDE.get(r["accountType"], 1)
        item = {"code": r["code"], "name": r["name"], "amount": round(net, 2)}
        (revenue if r["accountType"] == "REVENUE" else expenses).append(item)
    total_rev = round(sum(i["amount"] for i in revenue), 2)
    total_exp = round(sum(i["amount"] for i in expenses), 2)
    return ok({"revenue": revenue, "expenses": expenses,
               "totalRevenue": total_rev, "totalExpenses": total_exp,
               "netProfit": round(total_rev - total_exp, 2)})


@router.get("/api/v1/accounting/balance-sheet")
async def balance_sheet(
    user=Depends(require_permission("accounting.balancesheet.view")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT a.id, a.code, a.name, a.accountType, a.openingBalance, "
        "COALESCE(SUM(le.debit),0) AS debit, COALESCE(SUM(le.credit),0) AS credit "
        "FROM accounts a LEFT JOIN ledger_entries le ON le.accountId = a.id "
        "LEFT JOIN journals j ON j.id = le.journalId AND j.status='POSTED' "
        "WHERE a.tenantId = :t AND a.accountType IN ('ASSET','LIABILITY','EQUITY') GROUP BY a.id ORDER BY a.code"
    ), {"t": tenantId})).fetchall())
    assets: list = []; liabilities: list = []; equity: list = []
    for r in rows:
        balance = (float(r["openingBalance"] or 0) + float(r["debit"]) - float(r["credit"])) * NORMAL_SIDE.get(r["accountType"], 1)
        item = {"id": r["id"], "code": r["code"], "name": r["name"], "balance": round(balance, 2)}
        {"ASSET": assets, "LIABILITY": liabilities, "EQUITY": equity}.get(r["accountType"], []).append(item)
    # Net profit: revenue (credit-normal) minus expenses (debit-normal).
    # Counts ALL ledger entries — the ledger is append-only, so a reversed
    # journal plus its offsetting reversal always net to zero. Filtering to
    # status='POSTED' would include the reversal but drop its original,
    # double-counting the reversal's effect.
    pnl = (await db.execute(text(
        "SELECT COALESCE(SUM(CASE WHEN a.accountType='REVENUE' THEN le.credit - le.debit ELSE 0 END),0) "
        "     - COALESCE(SUM(CASE WHEN a.accountType='EXPENSE' THEN le.debit - le.credit ELSE 0 END),0) "
        "FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
        "WHERE le.tenantId = :t AND a.accountType IN ('REVENUE','EXPENSE')"
    ), {"t": tenantId})).first()
    net_profit = round(float(pnl[0] or 0), 2)
    total_assets = round(sum(i["balance"] for i in assets), 2)
    total_liab = round(sum(i["balance"] for i in liabilities), 2)
    total_eq = round(sum(i["balance"] for i in equity) + net_profit, 2)
    return ok({"assets": assets, "liabilities": liabilities, "equity": equity,
               "retainedEarnings": {"code": "NP", "name": "Current Period Net Profit", "balance": net_profit},
               "totalAssets": total_assets, "totalLiabilities": total_liab, "totalEquity": total_eq,
                "balanced": abs(total_assets - (total_liab + total_eq)) < 0.01})


@router.get("/api/v1/accounting/cash-flow")
async def cash_flow(
    user=Depends(require_permission("accounting.cashflow.view")),
    tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db),
):
    """Cash Flow report — cash/bank inflows and outflows grouped by journal category."""
    await acc.ensure_chart_of_accounts(db, tenantId, user.id)
    await db.commit()  # persist the COA seed
    rows = rows_to_dicts((await db.execute(text(
        "SELECT j.refType, COALESCE(SUM(le.debit),0) AS debit, COALESCE(SUM(le.credit),0) AS credit "
        "FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
        "JOIN journals j ON j.id = le.journalId "
        "WHERE le.tenantId=:t "
        "AND a.code IN ('1000','1010') GROUP BY j.refType"
    ), {"t": tenantId})).fetchall())
    # Cash movement per refType: net inflow = credits - debits on cash/bank accounts.
    # All entries counted — a REVERSED journal and its posted reversal net to zero.
    operating_in = ["SALE", "SALE_RETURN", "INSTALLMENT_PAID", "CREDIT_NOTE", "DEBIT_NOTE_CUSTOMER", "REVERSAL"]
    operating_out = ["EXPENSE", "COMMISSION_PAID", "SUPPLIER_PAYMENT", "PURCHASE_RETURN", "GRN", "REVERSAL"]
    inflow, outflow = 0.0, 0.0
    categories: dict[str, float] = {}
    for r in rows:
        net = float(r["credit"] or 0) - float(r["debit"] or 0)
        categories[r["refType"]] = round(net, 2)
        if r["refType"] in operating_in and net > 0:
            inflow += net
        elif r["refType"] in operating_out and net < 0:
            outflow += abs(net)
    total_cash = (await db.execute(text(
        "SELECT COALESCE(SUM(CASE WHEN a.code='1000' THEN le.debit - le.credit ELSE le.credit - le.debit END),0) "
        "FROM ledger_entries le JOIN accounts a ON a.id = le.accountId "
        "WHERE le.tenantId=:t AND a.code IN ('1000','1010')"
    ), {"t": tenantId})).first()
    return ok({
        "categories": categories,
        "operating": {
            "cashInflow": round(inflow, 2), "cashOutflow": round(outflow, 2),
            "netOperatingCash": round(inflow - outflow, 2),
        },
        "cashOnHand": round(float(total_cash[0] or 0), 2),
    })


@router.post("/api/v1/accounting/credit-notes")
async def create_credit_note(body: dict, user=Depends(require_permission("accounting.journals.create")),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Credit Note (§10.20) — reduces a customer's receivable (AR).

    First-class transaction type (not a manual journal): records its own
    CREDIT_NOTE journal, reduces the customer's currentDue, and is traceable
    back to this note via refId. Debit Sales Returns, Credit Accounts Receivable.
    """
    customerId = body.get("customerId")
    amount = round(float(body.get("amount", 0) or 0), 2)
    if not customerId:
        return err("customerId is required", 400)
    if amount <= 0:
        return err("amount must be > 0", 400)
    cust = (await db.execute(text(
        "SELECT id, name, currentDue FROM customers WHERE id=:c AND tenantId=:t"),
        {"c": customerId, "t": tenantId})).first()
    if not cust:
        return err("Customer not found", 404)
    note_no = gen_no("CN")
    async with txn(db):
        new_due = max(float(cust[2] or 0) - amount, 0.0)
        await db.execute(text(
            "UPDATE customers SET currentDue=:d, updatedBy=:u WHERE id=:c"),
            {"d": new_due, "u": user.id, "c": customerId})
        note_id = acc._uuid()
        await acc.post_journal(db, tenantId,
                               refType="CREDIT_NOTE", refId=note_id,
                               narration=f"Credit note {note_no} for {cust[1]} — {body.get('reason', '')}",
                               lines=[
                                   ("4100", amount, 0.0, f"Credit note {note_no}"),
                                   ("1100", 0.0, amount, f"AR reduction for {cust[1]}"),
                               ], userId=user.id, journalDate=body.get("noteDate"))
    return ok({"id": note_id, "noteNo": note_no, "customerId": customerId,
               "amount": amount, "newDue": round(new_due, 2)}, 201)


@router.get("/api/v1/accounting/credit-notes")
async def list_credit_notes(refId: str = "", user=Depends(require_permission("accounting.journals.view")),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT j.* FROM journals j WHERE j.tenantId=:t AND j.refType='CREDIT_NOTE' "
        "AND j.status='POSTED'" + (" AND j.refId=:r" if refId else "") + " ORDER BY j.createdAt DESC LIMIT 200"),
        {"t": tenantId, **({"r": refId} if refId else {})})).fetchall())
    return ok(rows)


@router.post("/api/v1/accounting/debit-notes")
async def create_debit_note(body: dict, user=Depends(require_permission("accounting.journals.create")),
                            tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    """Debit Note (§10.20) — accounting adjustment against a supplier or a customer.

    - supplier: reduces what we owe (Debit AP, Credit Inventory) — e.g. damaged goods allowance.
    - customer: increases their receivable (Debit AR, Credit Sales Returns) — e.g. undercharge correction.
    """
    party = (body.get("party") or "supplier").lower()
    amount = round(float(body.get("amount", 0) or 0), 2)
    if amount <= 0:
        return err("amount must be > 0", 400)
    if party not in ("supplier", "customer"):
        return err("party must be 'supplier' or 'customer'", 400)
    note_no = gen_no("DN")
    if party == "supplier":
        supplierId = body.get("supplierId")
        if not supplierId:
            return err("supplierId is required for a supplier debit note", 400)
        sup = (await db.execute(text(
            "SELECT id, name, currentDue FROM suppliers WHERE id=:s AND tenantId=:t"),
            {"s": supplierId, "t": tenantId})).first()
        if not sup:
            return err("Supplier not found", 404)
        new_due = max(float(sup[2] or 0) - amount, 0.0)
        async with txn(db):
            await db.execute(text("UPDATE suppliers SET currentDue=:d, updatedBy=:u WHERE id=:s"),
                             {"d": new_due, "u": user.id, "s": supplierId})
            note_id = acc._uuid()
            await acc.post_journal(db, tenantId,
                                   refType="DEBIT_NOTE_SUPPLIER", refId=note_id,
                                   narration=f"Debit note {note_no} for supplier {sup[1]} — {body.get('reason', '')}",
                                   lines=[
                                       ("2000", amount, 0.0, f"AP reduction {note_no}"),
                                       ("1200", 0.0, amount, f"Inventory allowance {note_no}"),
                                   ], userId=user.id, journalDate=body.get("noteDate"))
        return ok({"id": note_id, "noteNo": note_no, "party": "supplier", "supplierId": supplierId,
                   "amount": amount, "newDue": round(new_due, 2)}, 201)
    # customer debit note
    customerId = body.get("customerId")
    if not customerId:
        return err("customerId is required for a customer debit note", 400)
    cust = (await db.execute(text(
        "SELECT id, name, currentDue FROM customers WHERE id=:c AND tenantId=:t"),
        {"c": customerId, "t": tenantId})).first()
    if not cust:
        return err("Customer not found", 404)
    new_due = float(cust[2] or 0) + amount
    async with txn(db):
        await db.execute(text("UPDATE customers SET currentDue=:d, updatedBy=:u WHERE id=:c"),
                         {"d": new_due, "u": user.id, "c": customerId})
        note_id = acc._uuid()
        await acc.post_journal(db, tenantId,
                               refType="DEBIT_NOTE_CUSTOMER", refId=note_id,
                               narration=f"Debit note {note_no} for {cust[1]} — {body.get('reason', '')}",
                               lines=[
                                   ("1100", amount, 0.0, f"AR increase {note_no}"),
                                   ("4100", 0.0, amount, f"Adjustment {note_no}"),
                               ], userId=user.id, journalDate=body.get("noteDate"))
    return ok({"id": note_id, "noteNo": note_no, "party": "customer", "customerId": customerId,
               "amount": amount, "newDue": round(new_due, 2)}, 201)


@router.get("/api/v1/accounting/debit-notes")
async def list_debit_notes(user=Depends(require_permission("accounting.journals.view")),
                           tenantId: str = Depends(resolve_tenant), db: AsyncSession = Depends(get_db)):
    rows = rows_to_dicts((await db.execute(text(
        "SELECT j.* FROM journals j WHERE j.tenantId=:t "
        "AND j.refType IN ('DEBIT_NOTE_SUPPLIER','DEBIT_NOTE_CUSTOMER') AND j.status='POSTED' "
        "ORDER BY j.createdAt DESC LIMIT 200"), {"t": tenantId})).fetchall())
    return ok(rows)



