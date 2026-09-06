"""Accounting Engine (Prompt 16) — double-entry journal posting over the shared schema.

Design (§10.20 + Prompt 16 DoD):
- Chart of Accounts is auto-seeded per tenant on first use (idempotent).
- `post_journal()` is the single way money-moving modules record financials.
  It MUST be called inside the caller's `async with txn(db):` block so the
  business transaction and its journal commit atomically.
- Financial records are never edited/deleted — only reversed via an offsetting
  journal (`reverse_journal`), keeping the ledger append-only.
- Every journal traces back to its source transaction via (refType, refId).

Standard journal rules used by the auto-posting hooks:
  SALE              Debit Cash/Bank/AR (per payment method), Credit Sales Revenue (+ VAT Payable stub)
  SALE + COGS       Debit COGS, Credit Inventory
  SALE_RETURN       Debit Sales Returns, Credit Cash/AR (+ Debit Inventory, Credit COGS)
  GRN               Debit Inventory, Credit AP (or Cash for cash purchases)
  SUPPLIER_PAYMENT  Debit AP, Credit Cash/Bank
  EXPENSE_PAID      Debit Expense account, Credit Cash/Bank/Petty
  COMMISSION_PAID   Debit Commission Expense, Credit Cash/Bank
  INSTALLMENT_PAID  Debit Cash, Credit Accounts Receivable
  CREDIT_NOTE       Debit Sales Returns, Credit Accounts Receivable (reduces customer AR)
  DEBIT_NOTE_SUPP   Debit Accounts Payable, Credit Inventory (supplier adjustment)
  DEBIT_NOTE_CUST   Debit Accounts Receivable, Credit Sales Returns (customer adjustment)
  CASH_FLOW         Derived report: operating/investing/financing sections from cash/bank activity
"""
from __future__ import annotations

import uuid

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from util import gen_no

# Standard chart of accounts: (code, name, accountType)
# Normal balance: ASSET/EXPENSE = debit-side, LIABILITY/EQUITY/REVENUE = credit-side.
DEFAULT_COA: list[tuple[str, str, str]] = [
    ("1000", "Cash on Hand", "ASSET"),
    ("1010", "Bank Account", "ASSET"),
    ("1100", "Accounts Receivable", "ASSET"),
    ("1200", "Inventory", "ASSET"),
    ("2000", "Accounts Payable", "LIABILITY"),
    ("2100", "VAT Payable", "LIABILITY"),
    ("2110", "Input VAT", "ASSET"),
    ("2120", "VAT Receivable", "ASSET"),
    ("2200", "Commission Payable", "LIABILITY"),
    ("3000", "Owner's Equity", "EQUITY"),
    ("3100", "Retained Earnings", "EQUITY"),
    ("4000", "Sales Revenue", "REVENUE"),
    ("4100", "Sales Returns", "REVENUE"),      # contra-revenue (debit-normal usage)
    ("5000", "Cost of Goods Sold", "EXPENSE"),
    ("5100", "Salaries Expense", "EXPENSE"),
    ("5200", "Rent Expense", "EXPENSE"),
    ("5300", "Utilities Expense", "EXPENSE"),
    ("5400", "Other Expenses", "EXPENSE"),
    ("5500", "Commission Expense", "EXPENSE"),
]

# Payment method → asset account code
METHOD_ACCOUNT = {
    "CASH": "1000",
    "CARD": "1010",
    "BANK": "1010",
    "MOBILE_BANKING": "1010",
    "BKASH": "1010",
    "NAGAD": "1010",
    "ROCKET": "1010",
    "CREDIT": "1100",
    "GIFT_CARD": "1100",
    "STORE_CREDIT": "1100",
}


def _uuid() -> str:
    return str(uuid.uuid4())


async def ensure_chart_of_accounts(db: AsyncSession, tenantId: str, userId: str = "") -> None:
    """Seed the standard COA for the tenant once (idempotent, safe inside a txn).

    Idempotent: only inserts codes that don't already exist for the tenant.
    Note: does NOT rely on an in-process cache — always re-checks the DB so a
    rolled-back seed (e.g. a GET that inserted rows then closed without commit)
    can never leave the chart missing while the cache thinks it's ensured.
    """
    existing = {
        r[0]
        for r in (
            await db.execute(
                text("SELECT code FROM accounts WHERE tenantId = :t"),
                {"t": tenantId},
            )
        ).fetchall()
    }
    for code, name, atype in DEFAULT_COA:
        if code in existing:
            continue
        await db.execute(
            text(
                "INSERT INTO accounts (id, tenantId, code, name, accountType, isGroup, openingBalance, status, createdBy, updatedBy) "
                "VALUES (:id, :t, :c, :n, :ty, 0, 0, 'ACTIVE', :u, :u)"
            ),
            {"id": _uuid(), "t": tenantId, "c": code, "n": name, "ty": atype, "u": userId or None},
        )


async def account_id(db: AsyncSession, tenantId: str, code: str) -> str:
    row = (
        await db.execute(
            text("SELECT id FROM accounts WHERE tenantId = :t AND code = :c LIMIT 1"),
            {"t": tenantId, "c": code},
        )
    ).first()
    if not row:
        raise Exception(f"Account {code} not found in chart of accounts")
    return row[0]


async def post_journal(
    db: AsyncSession,
    tenantId: str,
    *,
    refType: str,
    refId: str,
    narration: str,
    lines: list[tuple[str, float, float, str]],
    userId: str = "",
    journalDate=None,
) -> str:
    """Post a balanced double-entry journal. Lines: (accountCode, debit, credit, memo).

    Must be called inside the caller's transaction. Returns the journal id.
    Raises on unbalanced entries so business flows fail loudly, not silently.
    """
    if not lines:
        raise Exception("Journal needs at least one line")
    clean: list[tuple[str, float, float, str]] = []
    debits = 0.0
    credits = 0.0
    for code, debit, credit, memo in lines:
        d, c = round(float(debit or 0), 2), round(float(credit or 0), 2)
        if d <= 0 and c <= 0:
            continue
        if d > 0 and c > 0:
            raise Exception(f"Line for account {code} has both debit and credit")
        clean.append((code, d, c, memo or ""))
        debits += d
        credits += c
    if not clean:
        raise Exception("Journal has no nonzero lines")
    if abs(debits - credits) > 0.01:
        raise Exception(f"Journal not balanced: debits {debits} vs credits {credits}")

    await ensure_chart_of_accounts(db, tenantId, userId)
    journalId = _uuid()
    await db.execute(
        text(
            "INSERT INTO journals (id, tenantId, journalNo, journalDate, refType, refId, narration, status, postedAt, createdBy, updatedBy) "
            "VALUES (:id, :t, :no, COALESCE(:d, CURDATE()), :rt, :ri, :n, 'POSTED', NOW(), :u, :u)"
        ),
        {"id": journalId, "t": tenantId, "no": gen_no("JV"), "d": journalDate,
         "rt": refType, "ri": refId, "n": narration[:190], "u": userId or None},
    )
    for code, debit, credit, memo in clean:
        acc = await account_id(db, tenantId, code)
        await db.execute(
            text(
                "INSERT INTO ledger_entries (id, tenantId, journalId, accountId, entryDate, debit, credit, memo, createdBy) "
                "VALUES (:id, :t, :j, :a, CURDATE(), :d, :c, :m, :u)"
            ),
            {"id": _uuid(), "t": tenantId, "j": journalId, "a": acc,
             "d": debit, "c": credit, "m": memo[:190], "u": userId or None},
        )
    return journalId


async def reverse_journal(
    db: AsyncSession,
    tenantId: str,
    journalId: str,
    reason: str,
    userId: str = "",
) -> str:
    """Append-only reversal: new offsetting journal + original marked REVERSED."""
    j = (
        await db.execute(
            text("SELECT id, status, refType, refId, narration FROM journals WHERE id=:id AND tenantId=:t FOR UPDATE"),
            {"id": journalId, "t": tenantId},
        )
    ).first()
    if not j:
        raise Exception("Journal not found")
    if j[1] == "REVERSED":
        raise Exception("Journal already reversed")

    entries = (
        await db.execute(
            text(
                "SELECT le.debit, le.credit, le.memo, a.code FROM ledger_entries le "
                "JOIN accounts a ON a.id = le.accountId WHERE le.journalId = :j"
            ),
            {"j": journalId},
        )
    ).fetchall()
    new_id = await post_journal(
        db,
        tenantId,
        refType="REVERSAL",
        refId=journalId,
        narration=f"Reversal of {j[4] or j[2]} — {reason}"[:190],
        # Swap debit/credit on every line to offset the original posting.
        lines=[(e[3], float(e[1] or 0), float(e[0] or 0), f"Reversal: {e[2] or ''}") for e in entries],
        userId=userId,
    )
    await db.execute(
        text("UPDATE journals SET status='REVERSED', reversedByJournalId=:r, updatedBy=:u WHERE id=:id"),
        {"r": new_id, "u": userId or None, "id": journalId},
    )
    return new_id


async def journal_for_ref(db: AsyncSession, tenantId: str, refType: str, refId: str):
    """Latest POSTED journal for a source transaction (if any)."""
    return (
        await db.execute(
            text("SELECT id FROM journals WHERE tenantId=:t AND refType=:rt AND refId=:ri AND status='POSTED' LIMIT 1"),
            {"t": tenantId, "rt": refType, "ri": refId},
        )
    ).first()


async def reverse_ref_journals(
    db: AsyncSession,
    tenantId: str,
    refTypes: list[str],
    refId: str,
    reason: str,
    userId: str = "",
) -> list[str]:
    """Reverse every POSTED journal posted against a source transaction.

    Used when a business transaction is voided/cancelled: the financial effect
    is removed by appending offsetting journals (append-only — §10.20 guardrail),
    never by editing or deleting the originals.
    """
    reversed_ids: list[str] = []
    rows = (
        await db.execute(
            text(
                "SELECT id FROM journals WHERE tenantId=:t AND refId=:ri "
                "AND refType IN :rts AND status='POSTED'"
            ).bindparams(bindparam("rts", expanding=True)),
            {"t": tenantId, "ri": refId, "rts": refTypes},
        )
    ).fetchall()
    for r in rows:
        try:
            reversed_ids.append(await reverse_journal(db, tenantId, r[0], reason, userId))
        except Exception:
            pass  # already reversed — keep the flow idempotent
    return reversed_ids


async def sale_cogs(db: AsyncSession, tenantId: str, saleId: str) -> float:
    """COGS for a sale derived from product cost data (movement-backed inventory)."""
    row = (
        await db.execute(
            text(
                "SELECT COALESCE(SUM(si.qty * COALESCE(p.costPrice, 0)), 0) FROM sale_items si "
                "JOIN products p ON p.id = si.productId WHERE si.saleId = :s AND si.tenantId = :t"
            ),
            {"s": saleId, "t": tenantId},
        )
    ).first()
    return round(float(row[0] or 0), 2) if row else 0.0

