# BlueOceans POS API — Python (FastAPI)

The FastAPI backend of BlueOceans POS, living directly in `backend/`.
**Same MySQL database, same endpoints, same JSON response shapes** — the
Next.js frontend (`../frontend`) works unchanged against this backend.

## Stack
- **FastAPI** + **Uvicorn** (async)
- **SQLAlchemy 2.0 async** (`asyncmy` driver) — raw SQL over the shared MySQL schema
- **PyJWT** + **bcrypt** (same `JWT_SECRET`, same token payload as the original TS backend)
- RBAC permission cache (60s TTL)
- Config via `backend/.env` (`DATABASE_URL`, `JWT_SECRET`, …) — loaded with python-dotenv

## Structure
```
main.py            — app + CORS + routers
db.py              — async engine, reflection, get_db, txn() helper
security.py        — JWT auth, tenant resolve (slug|uuid), require_permission
util.py            — response helpers (ok/err), pagination, gen_no
routers_core.py    — auth/login, tenant, menu, dashboard, modules
routers_rbac.py    — roles, permissions, user-role assignment
routers_catalog.py — products, categories, brands, customers, suppliers
routers_pos.py     — POS checkout (atomic), void/return, holds, cash register/shifts
routers_business.py— expenses, petty cash, recurring, commission, purchasing chain
routers_extra.py   — credit, aging, installments, sales orders, quotations,
                     invoices, pricing, promotions, coupons, inventory,
                     transfers, counts, landed costs, consignments, branches,
                     warehouses, devices, settings
smoke_test.py      — 50-check end-to-end suite
start.sh           — durable background start on :4000
```

## Run
```bash
cd backend
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt   # first time only
./venv/bin/uvicorn main:app --port 4000 --reload                     # dev
bash start.sh                                                        # background (port 4000)
./venv/bin/python smoke_test.py                                      # verify
```

## Business rules preserved (Prompts 8–15)
- §10.19: POS sale **blocked** without an open shift; CASH_SALE/CASH_REFUND/
  CASH_EXPENSE post to the immutable shift ledger; close computes
  expected-vs-counted **variance**; over-threshold (৳500) parks in
  PENDING_APPROVAL until a manager approves.
- §10.16: every stock change writes a source-traceable `stock_movements` row
  (qty/qtyBefore/qtyAfter/refType/refId) — never a bare quantity edit.
- §10.17: GRN → partial receiving updates PO lines; purchase return reverses
  **both** stock and supplier payable; supplier payments allocate across
  multiple invoices.
- §10.18: expenses PENDING→APPROVED→PAID; petty-cash fund/expense/reimburse
  ledger with balance-after; recurring scheduler stub generates due entries.
- §10.13/§10.14: credit checks in POS checkout; ৳120,000/10-month installment
  schedule auto-generation with pay/settle/reschedule.
- Multi-tenant: every request carries `x-tenant-id` (slug or UUID → id).

## Verified
- `smoke_test.py`: **50/50 ALL PASSED** (auth, menu, all module reads, POS
  shift gate)
- Full business E2E: **14/14 ALL PASSED** (GRN→shift→atomic sale→variance
  close→approval→PI→payment→return→expense→installment→sale return)
- Frontend data-flow simulation: **40/40 OK**
