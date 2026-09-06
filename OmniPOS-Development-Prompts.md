# OmniPOS — Sequential Development Prompts (v1.0)

**Companion to:** `OmniPOS-Master-Specification.md` (read that file first — this document
does not repeat its content, it only tells an AI coding agent *when* and *what slice* to build).

## How To Use This Document

1. Give the coding agent (Claude Code / Cursor / Codex) **Prompt 0** first, in an empty or
   near-empty repo.
2. Wait for it to finish, review the output, run the tests it wrote.
3. Only then paste **Prompt 1**, then **Prompt 2**, and so on — **in order, one at a time.**
4. Never paste two prompts at once. Never skip ahead. Each prompt assumes every earlier
   prompt is done and working — that is what keeps the architecture from collapsing under
   its own scope (44 modules is too much for one shot; see `OmniPOS-Master-Specification.md §36/§92`).
5. If a prompt's output seems to be missing something, check the **Coverage Map** at the
   end of this file before assuming it's wrong — every module has exactly one home.

Every prompt below is self-contained (copy the whole fenced block, including guardrails,
into the agent). They deliberately repeat the guardrails/DoD so each one works even in a
brand-new chat/session with no memory of earlier prompts.

---

## Prompt 0 — Foundation & Tech Stack Decision

**Builds:** repo scaffold, tech stack decision (fills the gap flagged in Master Spec §36 item 9)
**Depends on:** nothing — this is the first prompt

```
We are starting a new project called OmniPOS: an offline-first, multi-tenant SaaS
POS/ERP/CRM platform. The full functional specification is in
`OmniPOS-Master-Specification.md` in this repo — read it completely before doing anything else.

For this phase, do NOT write business features yet. Instead:

1. Propose a concrete tech stack (backend framework, database engine, frontend framework,
   mobile/offline client approach, message queue, cache layer, hosting target) suited to:
   - a modular monolith to start (per §25 of the spec), splittable into services later
   - strong support for offline-first sync, multi-tenancy, and relational transactional
     integrity (per §2, §13, §18)
   - Bangladesh-first deployment but internationally extensible
   Explain trade-offs briefly and pick ONE stack. Ask me to confirm before scaffolding if
   you are unsure between two reasonable options.
2. Scaffold the repository: project structure, linting, formatting, CI skeleton, environment
   config, base logging and error handling, health-check endpoint.
3. Set up the database connection and a migration tool (do not create business tables yet).
4. Write a short ARCHITECTURE.md capturing the stack decision and folder structure so future
   prompts don't have to re-derive it.

Guardrails (apply to every phase):
- Read `OmniPOS-Master-Specification.md` before writing any code.
- Multi-tenant isolation, RBAC, and audit logging must be first-class concerns baked into
  the base architecture, not bolted on later.
- Never hard-code business/tax/pricing rules.
- Do not implement any business module yet — foundation only.

Definition of Done for this phase:
- [ ] Repo scaffolded and runs locally
- [ ] Tech stack documented in ARCHITECTURE.md
- [ ] DB connection + migration tooling working
- [ ] CI runs lint + a placeholder test successfully
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 1 — System Architecture Blueprint

**Builds:** §4, §6 (Core Architecture Philosophy), §8 (Core Reusable Engines), §18 (Database Architecture)
**Depends on:** Prompt 0

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §4, §6, §8, and §18.

Design (as documentation + folder/module skeletons, minimal code) the system architecture:
- The Core Engine vs Industry Extension separation (§6) — show exactly how a module like
  "Restaurant" will plug into "POS" without the core POS module knowing Restaurant exists.
- Module boundaries for the 15 Core Reusable Engines listed in §8 (Transaction, Inventory,
  Pricing, Tax, Payment, Accounting, Commission, Loyalty, Promotion, Workflow, Notification,
  Audit, Sync, Reporting, AI) — one skeleton module/package per engine, empty but wired
  into the app.
- The event-driven backbone (§18 "Event-Driven Architecture") — implement a minimal event
  bus abstraction now, since almost every later module publishes/subscribes to it (e.g.
  SALE_COMPLETED → Inventory, Accounting, Commission, Loyalty, Notification, Analytics, AI).
- Tenant isolation strategy at the database layer (§18 "Important Database Rule") — decide
  and document the exact mechanism (e.g. tenant_id column + query-layer enforcement, or
  schema-per-tenant) and justify it.

Guardrails (apply to every phase):
- Inspect what Prompt 0 already created — do not duplicate or replace it.
- Do not implement business logic yet, only the architectural skeleton.
- Every decision here is load-bearing for all 43 remaining prompts — favor boring,
  well-understood patterns over clever ones.

Definition of Done for this phase:
- [ ] Module/package skeleton for all 15 core engines exists and compiles/runs
- [ ] Event bus abstraction implemented with at least one working publish/subscribe test
- [ ] Tenant isolation mechanism documented and enforced at the lowest feasible layer
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 2 — Core Database Schema

**Builds:** §18 (Core Database Domains, transaction integrity rules)
**Depends on:** Prompt 1

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §18 in full.

Implement the core database schema (migrations) for these domains — fields/relationships
only, no business logic yet:
- Identity: tenants, users, roles, permissions, sessions, devices
- Organization: companies, branches, warehouses, terminals
- Catalog: products, categories, brands, variants, units, price_lists
- Sales: sales, sale_items, invoices, invoice_items, payments, returns
- Inventory: stock, stock_movements, batches, serials, transfers
- Purchase: purchase_orders, goods_receipts, purchase_invoices
- Finance: accounts, journals, ledger_entries
- CRM: customers, customer_groups, loyalty
- Operations: deliveries, commissions, installments
- Audit: audit_logs

Every table must have: primary key, tenant_id, branch_id where applicable, created_at/
updated_at, created_by/updated_by, status, appropriate indexes, foreign keys, unique
constraints. Use UUIDs for offline-safe identifiers per §18.

Guardrails (apply to every phase):
- This is schema only — do not build API/UI/business logic in this prompt.
- Do not invent fields not implied by the spec; keep it lean, add fields when a later
  prompt's feature explicitly needs them, not speculatively.
- Every tenant-owned table needs a tenant_id index; document how you enforce isolation.

Definition of Done for this phase:
- [ ] All listed tables exist as migrations and apply cleanly
- [ ] Foreign keys and unique constraints in place
- [ ] A basic seed script for local dev (demo tenant, demo branch) exists
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 3 — Authentication & Tenant System

**Builds:** §6 (Auth & Security), §10.2 (Tenant/Company Management)
**Depends on:** Prompt 2

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §6 and §10.2.

Implement:
- Tenant registration & company setup (name, logo, business type, address, currency,
  timezone, language, tax config)
- Multi-company support for a single account (§10.2)
- Authentication: email/phone + password, OTP, 2FA, Google login, session management,
  refresh/access tokens
- Device registration for POS/devices (device ID, tenant, branch, user, OS, last sync, status)
- Security basics: password hashing, login history, failed-login detection, IP/device
  tracking, account lock, rate limiting

Guardrails (apply to every phase):
- Enforce tenant isolation from the very first query you write in this module — no
  shortcuts "to be fixed later."
- No business modules (products, sales, etc.) yet — auth and tenant only.
- Add audit logging for login, failed login, and account lock events now, since Audit
  (§17) depends on every module doing this from day one.

Definition of Done for this phase:
- [ ] Tenant + company registration flow works end-to-end
- [ ] Login (password + OTP + 2FA) works with tests
- [ ] Device registration works and is tied to tenant/branch
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 4 — RBAC (Roles, Permissions, Custom Roles)

**Builds:** §5 (User Roles & Permission Model)
**Depends on:** Prompt 3

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §5.

Implement:
- Predefined Platform Roles and Business Roles listed in §5
- Custom role creation per tenant
- Action-level permission granularity (View/Create/Edit/Delete/Discount/Refund/Void/
  Export/Approve — per module, not just module-level on/off)
- Middleware/guard that enforces permission checks on every API route
- Admin UI (or API, if UI comes later) to assign roles and edit custom-role permission matrices

Guardrails (apply to every phase):
- Every module built from Prompt 5 onward MUST use this permission system — do not let
  any later prompt invent its own ad-hoc permission check.
- AI features (built much later, §16/§31) will reuse this exact same permission layer —
  design it generically enough now, not POS-specific.

Definition of Done for this phase:
- [ ] Predefined roles seeded; custom role CRUD works
- [ ] Action-level permission checks enforced on at least one real endpoint (device/tenant
      admin endpoints from Prompt 3) as a working example
- [ ] Unauthorized access returns a proper 403 with audit log entry
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 5 — Branch/Warehouse/Device + System Settings + Onboarding Wizard

**Builds:** §10.3, §10.32 (System/Global Settings), §10.33 (Tenant Onboarding)
**Depends on:** Prompt 4

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.3, §10.32, §10.33.

Implement:
- Branch management (address, manager, warehouse, POS, hours, tax settings, invoice
  numbering) under the Company → Branch → Warehouse → Bin/Rack → POS hierarchy
- Warehouse CRUD, linked to branches
- System/Global Settings module: Company, Branch, POS, Tax, Currency, Invoice, Payment,
  Inventory, Notifications, Users, Roles, Integrations, AI, Subscription settings groups
  — all tenant-scoped and editable, never hard-coded
- The full Tenant Onboarding wizard flow from §10.33 (Register → Verify → Business Type →
  Company Setup → Branch Setup → Warehouse Setup → Tax Setup → Payment Setup → Import
  Products → Opening Stock → Create Users → Assign Permissions → Configure POS → Open
  Shift → Start Selling) — later steps (Import Products, Opening Stock) can be stubbed
  until their real modules exist, but the wizard shell and business-type selector must work

Guardrails (apply to every phase):
- Business-type selection here should set feature flags (§11.9 Example Industry
  Configuration) even though most of those modules don't exist yet — store the flags now
  so later prompts just read them.
- Reuse the RBAC from Prompt 4 for who can edit settings.

Definition of Done for this phase:
- [ ] Branch/Warehouse CRUD works, scoped to tenant
- [ ] Settings module covers all groups listed above, editable via API
- [ ] Onboarding wizard runs start-to-finish (with stubs where later modules are missing)
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 6 — Product & Catalog + Pricing & Promotion Engine

**Builds:** §10.4, §10.5
**Depends on:** Prompt 5

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.4 and §10.5.

Implement:
- Product & Catalog: name, SKU, barcode, category, subcategory, brand, manufacturer, unit,
  purchase/cost/selling/wholesale/dealer/distributor price, min/max price, tax, supplier,
  images, description, variants, batch, expiry, serial, warranty
- Product types: Simple, Variable, Service, Bundle, Kit, Recipe, Batch-controlled,
  Serialized, Weighted (Recipe/Batch/Serialized only need the data model now — their full
  workflows arrive in later prompts for Restaurant/Pharmacy/Inventory)
- Variant support (e.g. Size × Color) with per-variant SKU/barcode/price/stock
- Pricing Engine as its own reusable service: Retail/Wholesale/Dealer/Distributor/Branch-
  specific/Customer-specific/Customer-group/Quantity/Time-based/Promotional/Minimum-
  selling/Cost-plus/Currency-specific price resolution, with a defined priority order
- Promotion Engine: percentage, fixed, Buy X Get Y, bundle, combo, category/product/branch/
  customer-group discount, time-based, happy hour, coupon/promo code — with conflict
  resolution when multiple promotions could apply
- Barcode Label Designer: design and print custom barcode labels per product/variant
  (configurable layout, size, fields shown)
- Shelf Label: bulk-generate printable shelf-edge price labels straight from the catalog

Guardrails (apply to every phase):
- Pricing/Promotion must be callable as a standalone service (`resolvePrice(product,
  customer, branch, qty, date)`), because POS, Sales Order, Wholesale, and E-commerce
  (all built later) will all call it identically.
- Do not build the POS cart yet — this prompt is catalog + pricing/promotion only.

Definition of Done for this phase:
- [ ] Product CRUD incl. variants works
- [ ] Price resolution service returns correct price given product+customer+branch+qty+date
- [ ] Promotion engine applies at least 3 promotion types correctly with conflict handling
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 7 — Customer & CRM + Supplier Management

**Builds:** §10.6, §10.7
**Depends on:** Prompt 6

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.6 and §10.7.

Implement:
- Customer profile: name, phone, email, address, customer group, credit limit/period,
  opening balance, current due, loyalty points, membership, wallet, store credit, purchase
  history, complaints, notes
- Customer segmentation: VIP, Regular, Wholesale, Corporate, New, Inactive, High-value, At-risk
- Supplier profile: company, contact, phone, email, address, VAT info, payment terms,
  credit limit, opening balance; tracked purchase history, ledger, outstanding, payments,
  returns, rebate, delivery performance, quality, defect rate

Do NOT implement AI-driven customer intelligence (LTV, churn prediction) or AI supplier
scoring yet — those come in the AI phase (Prompt 31). Just make sure the underlying data
(purchase history, dates, amounts) is captured correctly now so AI can consume it later.

Guardrails (apply to every phase):
- Credit limit/current due fields exist now but the actual credit-check business logic
  belongs to Prompt 12 (Credit Management) — don't half-build it here.

Definition of Done for this phase:
- [ ] Customer CRUD + segmentation works
- [ ] Supplier CRUD + basic ledger view works
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 8 — Inventory & Warehouse Engine

**Builds:** §10.16 (Inventory & Warehouse), plus Landed Cost & Consignment from the spec's Inventory section
**Depends on:** Prompt 7

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.16 fully (it includes
Warehouse, Landed Cost, and Consignment Inventory).

Implement:
- Stock operations: opening stock, receiving, issue, adjustment, transfer, stock count,
  reservation, reconciliation, write-off
- Stock statuses: On Hand, Reserved, Available, In Transit, Damaged, Expired, Consignment
- Every stock movement is source-traceable (product, warehouse, quantity, before/after
  quantity, source reference, user, timestamp) — never a bare quantity update
- Costing: FIFO, FEFO, Weighted Average (configurable per tenant/industry)
- Batch/Expiry/Serial tracking (batch number, mfg/expiry date, cost, price, quantity; FEFO
  selection logic; serial/IMEI with full lifecycle fields)
- Warehouse transfer flow: Request → Approval → Shipment → Receive
- Landed Cost allocation (purchase cost + shipping + customs + insurance + handling +
  transport + other, allocated across received products)
- Consignment inventory (owner, quantity, sale, remaining stock, supplier settlement,
  commission, return)
- Advanced inventory intelligence fields (min/max stock, reorder point, safety stock) —
  data model only; the AI-driven recommendations arrive in Prompt 31

Guardrails (apply to every phase):
- This engine will be called by POS (next prompt), Purchasing, Restaurant, Pharmacy,
  Manufacturing — design `decreaseStock()`/`increaseStock()`/`reserveStock()` as generic,
  reusable service calls now, not POS-specific functions.
- No stock quantity may ever be edited directly without going through a movement record.

Definition of Done for this phase:
- [ ] All stock operations work with full movement audit trail
- [ ] FIFO/FEFO/Weighted Average costing is selectable per tenant and computes correctly
- [ ] Batch/serial/expiry tracked and FEFO-recommendable
- [ ] Landed cost allocates correctly across a multi-product receipt
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 9 — POS & Checkout Engine

**Builds:** §10.8, §10.9 (Payment Engine core, incl. split payment)
**Depends on:** Prompt 8

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.8 and §10.9.

Implement the core POS checkout flow:
```
Scan Product → Add Cart → Customer (optional) → Apply Promotion → Calculate VAT (stub tax
= 0% if VAT engine isn't built yet, wire it properly once Prompt 17 lands) → Calculate
Discount → Select Payment → Confirm Sale → Create Invoice → Update Inventory → Create
Accounting Entry (stub until Prompt 16) → Print/Send Receipt
```
- Cart operations: quantity, discount, tax, service charge, delivery fee, tips, round-off,
  price override (with approval hook, even if Approval Engine itself lands later), customer assignment
- Transaction controls: hold, resume, draft, suspend, cancel, void, return (basic — full
  RMA engine is Prompt 18), refund, exchange, partial refund
- Payment Engine abstraction: `createPayment()/verifyPayment()/getPaymentStatus()/
  refundPayment()/cancelPayment()`, methods = Cash, Card, Bank, bKash, Nagad, Rocket,
  Gateway (stub), Customer Credit, Gift Card, Store Credit
- Split payment: one invoice, multiple payment records, all linked to the same invoice
- **The entire confirm-sale flow must be one atomic transaction** — Sale + Sale Items +
  Stock movement + Invoice + Payment(s), rollback on any failure (per §18 Transaction Integrity)
- Price Checker mode: a standalone scan-to-see-price screen (no cart, no checkout) for
  customers/staff to quickly look up a price
- Self Checkout mode: a customer-operated variant of this same checkout flow with a
  reduced permission surface (no discount/void/price-override), still fully audited

Guardrails (apply to every phase):
- This is the highest-risk module in the whole system — treat every write as
  transactional. Write a test that forcibly fails mid-transaction and asserts nothing was
  partially committed.
- Do not build offline capability yet (that's Prompt 19) — but structure the checkout
  service as a single callable function/command so making it offline-capable later doesn't
  require a rewrite.

Definition of Done for this phase:
- [ ] Full checkout flow works online, atomically, with correct stock decrement
- [ ] Split payment across ≥2 methods on one invoice works
- [ ] Hold/resume/void/basic return all work
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 10 — Sales, Quotation & Sales Order

**Builds:** §10.10, §10.11
**Depends on:** Prompt 9

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.10 and §10.11.

Implement:
- Sales Management for non-POS sale sources (Online, Sales Order, Wholesale, Marketplace
  stubs) with status lifecycle: Draft → Confirmed → Partially Paid → Paid → Partially
  Delivered → Completed → Cancelled → Returned
- Quotation lifecycle: Draft → Sent → Customer Review → Accepted/Rejected → Sales Order →
  Invoice → Payment, with revision/version history, PDF/Email/Print, convert-to-order/invoice
- Sales Order lifecycle: Quotation → Sales Order → Stock Reservation → Picking → Delivery →
  Invoice → Payment, with partial fulfillment, backorder, delivery schedule, approval, cancellation

Guardrails (apply to every phase):
- Stock reservation here must use the same Inventory Engine reservation calls from Prompt 8
  — do not create a parallel reservation mechanism.
- Quotation → Sales Order → Invoice conversion must not duplicate line items or lose data —
  test the full chain end-to-end.

Definition of Done for this phase:
- [ ] Quotation → Sales Order → Invoice conversion chain works with version history intact
- [ ] Partial fulfillment/backorder works correctly against reserved stock
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 11 — Invoice Engine + Payment & Collection Engine

**Builds:** §10.12, §10.9 (Collection sub-module)
**Depends on:** Prompt 10

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.12 and the Collection
paragraph inside §10.9.

Implement:
- Invoice types: Tax, Standard, Proforma, Recurring, Credit, Export, Wholesale, Installment
- Invoice output: A4, Thermal, PDF, QR, digital signature (stub), custom template, logo,
  terms & conditions — template must be tenant-configurable
- Payment allocation: one payment can apply against multiple invoices (e.g. ৳50,000 split
  across Invoice A/B/C)
- Collection module: collection target, collector, customer, invoice, method, receipt,
  schedule, partial collection, outstanding tracking, collector performance — with offline
  collection support flagged for Prompt 19 to wire up

Guardrails (apply to every phase):
- Invoice numbering must be branch-scoped and configurable per §10.32 settings, not hard-coded.
- Recurring invoice generation should use the background job pattern (queue) that Prompt
  39 formalizes — stub a simple scheduled job for now if the queue infra isn't ready yet.

Definition of Done for this phase:
- [ ] All invoice types generate correctly with PDF/thermal output
- [ ] Payment allocation across multiple invoices works and updates each invoice's balance correctly
- [ ] Collection entries update customer ledger correctly
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 12 — Credit Management + Installment Management

**Builds:** §10.13, §10.14
**Depends on:** Prompt 11

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.13 and §10.14.

Implement:
- Credit Management: credit limit, credit period, opening due, current due, overdue,
  aging buckets (Current/1-30/31-60/61-90/90+), credit hold, payment history. Every new
  credit sale must check `Available Credit = Credit Limit − Current Due` before allowing the sale.
- Installment Management: down payment, finance amount, installment count, weekly/monthly/
  custom frequency, interest, processing fee, late fee, grace period, partial payment,
  advance payment, early settlement, rescheduling, waiver, overdue tracking. Auto-generate
  the full installment schedule from a single sale.
- Both must integrate automatically with: customer ledger, AR, payments, notifications
  (stub notification calls if Prompt 28 isn't built yet — leave a clear TODO hook, don't skip silently).

Guardrails (apply to every phase):
- Credit-hold and credit-limit checks must be enforced inside the POS/Sales Order checkout
  path from Prompts 9/10 — go back and wire this in, don't leave credit sales unchecked.

Definition of Done for this phase:
- [ ] Credit limit check blocks over-limit credit sales with a clear error
- [ ] Aging report computes correctly for a seeded set of overdue invoices
- [ ] Installment schedule auto-generates correctly for the ৳120,000/10-month example in the spec
- [ ] Partial payment, early settlement, and rescheduling all update the schedule correctly
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 13 — Commission Engine

**Builds:** §10.15
**Depends on:** Prompt 12

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.15.

Implement:
- Agent types: Sales agent, Sales rep, Commission agent, Referral partner, Distributor
- Commission types: Percentage, Fixed, Product, Category, Profit-based, Target-based,
  Slab-based, Collection-based (support at least slab-based with the example table in the spec)
- Lifecycle: Sale → Calculated → Pending → Approved → Payable → Paid
- **Mandatory:** if a sale tied to a commission is returned or cancelled (Prompt 9/18's
  return flow), the commission must be automatically reversed — write a test proving this specifically

Guardrails (apply to every phase):
- Hook commission calculation into the SALE_COMPLETED event from the event bus (Prompt 1),
  don't couple it directly into the POS checkout code.

Definition of Done for this phase:
- [ ] Commission calculates correctly for at least 2 commission types incl. slab-based
- [ ] Full lifecycle (Calculated→Paid) works with approval step
- [ ] Sale return correctly reverses the linked commission
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 14 — Purchasing

**Builds:** §10.17
**Depends on:** Prompt 13

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.17 (and re-check §10.16 for
how Landed Cost hooks into GRN, since you built that in Prompt 8).

Implement the full purchase lifecycle:
```
Purchase Requisition → Approval (stub if Prompt 27's Approval Engine isn't built yet —
use a simple manager-approve flag for now, then swap in the real engine later) →
Purchase Order → Goods Received (GRN) → Purchase Invoice → Supplier Payment
```
Support: partial receiving, purchase return, supplier discount/rebate, supplier comparison,
purchase history. GRN must call the Inventory Engine's `increaseStock()` from Prompt 8, and
optionally trigger Landed Cost allocation.

Guardrails (apply to every phase):
- Purchase return must correctly reverse both stock and any supplier payable already recorded.
- Do not duplicate the "Approval" concept — build it as a stub interface now so Prompt 27
  can drop in the real Approval/Workflow Engine without changing this module's code.

Definition of Done for this phase:
- [ ] Full PR→PO→GRN→Invoice→Payment chain works with partial receiving
- [ ] Purchase return correctly reverses stock and supplier ledger
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 15 — Expense Management + Cash Register & Shift

**Builds:** §10.18, §10.19
**Depends on:** Prompt 14

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.18 and §10.19.

Implement:
- Expense: category, entry, recurring expense, branch expense, petty cash, approval (stub
  hook as in Prompt 14), receipt attachment, expense report
- Cash Register & Shift: Open Shift → Opening Cash → Sales → Cash In → Cash Out →
  Expenses → Refunds → Close Shift → Expected vs Actual Cash → Variance → Approval.
  Every cash sale from Prompt 9's POS must now be tied to an open shift — go back and wire
  this in (a sale cannot be created if no shift is open).

Guardrails (apply to every phase):
- Cash variance beyond a configurable threshold (§10.32 settings) must require manager
  approval before the shift can close — stub-approve if Prompt 27 isn't ready yet.

Definition of Done for this phase:
- [ ] Shift open/close works and blocks sales when no shift is open
- [ ] Expected vs actual cash variance calculates and is recorded/audited
- [ ] Recurring expense generates on schedule (stub scheduler acceptable pre-Prompt 39)
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 16 — Accounting Engine (Double-Entry) + Credit/Debit Note

**Builds:** §10.20
**Depends on:** Prompt 15

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.20 in full.

Implement:
- Chart of Accounts, Journal, Ledger, General Ledger, AR, AP, Cash, Bank, Revenue, Expense,
  COGS, Inventory, Trial Balance, P&L, Balance Sheet, Cash Flow
- **Automatic journal generation** wired to the event bus from every module built so far:
  - Sale → Debit Cash/Receivable, Credit Sales Revenue, Credit VAT Payable (VAT = 0 stub
    until Prompt 17)
  - COGS → Debit COGS, Credit Inventory
  - Purchase → Debit Inventory + Input VAT, Credit Supplier Payable
  - Expense, Payment, Installment, Commission, Return — each needs its own journal rule;
    derive the debit/credit pairs from standard double-entry practice and document them
- Credit Note (reduces customer payable) / Debit Note (supplier/customer adjustment) as
  first-class transaction types, not manual journal hacks
- Every financial entry must be traceable back to its source transaction (§18)

Guardrails (apply to every phase):
- Go back through Prompts 9–15 and replace every "stub accounting entry" comment with a
  real call into this engine now that it exists.
- Financial records are never edited/deleted — only reversed via a new offsetting entry.

Definition of Done for this phase:
- [ ] Trial Balance always balances (debits = credits) after any transaction type
- [ ] P&L and Balance Sheet generate correctly from seeded transactions
- [ ] Every prior module's transactions now produce correct automatic journal entries
- [ ] Credit/Debit note correctly adjusts AR/AP
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 17 — VAT / Tax Engine (Bangladesh NBR)

**Builds:** §10.21
**Depends on:** Prompt 16

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.21 carefully, including the
warning about professional VAT review.

Implement a **configurable, version-controlled** tax engine:
- VAT-inclusive/exclusive, VAT rates, tax rules, customer/supplier VAT info, sales/purchase
  VAT, branch/consolidated VAT, VAT reports, Mushak workflow data structures (incl. Mushak
  6.3 fields) — data capture and calculation only; do not assume specific current rates,
  make them tenant-configurable
- Tax rule versioning: `VAT Rule v1 → Effective Date → VAT Rule v2`, where transactions
  keep the rule that was active at their creation time — never recalculate historical
  transactions when a rule changes
- Wire real VAT calculation into every module that had a "VAT = 0 stub" (POS checkout,
  Invoice, Accounting journals from Prompts 9, 11, 16)

Guardrails (apply to every phase):
- Do not hard-code any specific VAT rate or Mushak form logic as if it were current law.
  Leave rates/forms as tenant/admin-configurable data, and include the exact disclaimer
  from the spec in this module's documentation: production VAT/NBR workflows must be
  reviewed by a qualified Bangladesh VAT professional before go-live.

Definition of Done for this phase:
- [ ] Tax engine is fully data-driven — changing a rate via config changes future
      calculations, never past ones
- [ ] POS/Invoice/Accounting all now calculate real VAT instead of the 0% stub
- [ ] VAT reports (sales VAT, purchase VAT, consolidated) generate correctly
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 18 — Return / Refund / RMA / Warranty Engine

**Builds:** §10.22
**Depends on:** Prompt 17

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.22.

Implement Return as its own full transaction type (not a delete):
```
Original Invoice → Return Request → Validation → Return Stock → Refund →
Accounting Reversal → Commission Reversal → Loyalty Reversal
```
- RMA: RMA number, return reason, inspection, defect classification, warranty validation,
  repair/replacement/refund/store-credit outcome, restocking, warranty history
- Warranty: start/end/type linked to serial/IMEI (from Prompt 8); claim flow: Claim →
  Inspection → Approved → Repair/Replace → Complete

Guardrails (apply to every phase):
- Go back and replace the "basic return" you stubbed in Prompt 9's POS with a call into
  this real Return Engine.
- Every reversal (stock, accounting, commission, loyalty) must actually fire — write one
  E2E test that creates a sale with commission+loyalty, returns it, and asserts all three are reversed.

Definition of Done for this phase:
- [ ] Full return flow reverses stock, accounting, commission, and loyalty correctly
- [ ] RMA and warranty claim lifecycles work end-to-end
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 19 — Offline-First Architecture & Sync Engine

**Builds:** §13 (whole section) — the single most important technical requirement in the spec
**Depends on:** Prompt 18 (needs POS, Sales, Inventory, Payment all functioning online first)

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §13 in full — this is a P0
requirement and the most architecturally sensitive prompt so far.

Implement:
- Local database + offline transaction queue on the POS client, caching products, prices,
  customers, tax config, promotions, branch config, POS config
- Every offline transaction carries: UUID, Tenant ID, Device ID, Branch ID, Created At,
  Local Sequence, Idempotency Key, Sync Status (PENDING/SYNCING/SYNCED/FAILED/CONFLICT)
- Server-side idempotency check: submitting the same transaction twice must never create a
  duplicate invoice or stock movement
- Sync conflict resolution **defined per entity type**: simple attribute edits (e.g.
  customer name) = last-write-wins; stock = movement-aggregated (never overwritten,
  deltas summed); financial transactions = never silently overwritten, flagged for review
  if genuinely conflicting
- Device management: remote force-logout, lock device, disable device, force sync, push
  config/pricing/promotion, monitor sync/device health (§10.37 Remote POS Management)
- Make the POS checkout flow from Prompt 9 actually work fully offline now — this is the
  point of the whole exercise

Guardrails (apply to every phase):
- Test explicitly: go offline, create 20+ sales, reconnect, verify zero duplicates and
  zero data loss against the server. This test must pass before this prompt is considered done.
- Never let the sync engine silently overwrite a financial record on conflict — surface it.

Definition of Done for this phase:
- [ ] POS fully functional with no network connection (sell, return, search, print)
- [ ] Reconnect → sync → zero duplicates, zero data loss (proven by the stress test above)
- [ ] Sync conflict resolution behaves correctly per entity type
- [ ] Remote device management actions work from head office
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 20 — Restaurant Module (Tables, KOT, KDS, Recipe)

**Builds:** §11.1
**Depends on:** Prompt 19

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §11.1.

Implement the Restaurant industry extension **on top of** the existing core (POS,
Inventory, Sales) — do not modify core POS logic, extend it:
- Dine-in/takeaway/delivery, tables, floors, seats, waiters, split/merge/transfer table
- Table states: Available → Reserved → Occupied → Ordering → Preparing → Bill Requested →
  Payment Pending → Cleaning
- Modifiers, add-ons, combo
- KOT/KDS routing: POS → Order Router → Kitchen/Grill/Bar/Dessert; KDS status New →
  Accepted → Preparing → Ready → Served
- Recipe & Food Costing: selling a recipe product auto-consumes ingredient stock via the
  Inventory Engine (Prompt 8) per the BOM; food cost/margin calculated automatically
- QR menu, self-order, kiosk ordering into the same order pipeline

Guardrails (apply to every phase):
- This module must be **enable/disable-able per tenant** via the feature flags set during
  onboarding (Prompt 5) — verify a non-restaurant tenant never sees these screens/APIs.
- Recipe consumption must use Prompt 8's stock-decrease calls, not a parallel mechanism.

Definition of Done for this phase:
- [ ] Full dine-in flow: Table → Order → KOT → KDS → Serve → Bill → Payment works
- [ ] Recipe sale correctly consumes ingredient stock and computes food cost
- [ ] Feature-flagged off correctly for non-restaurant tenants
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 21 — Pharmacy Module

**Builds:** §11.2
**Depends on:** Prompt 20

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §11.2.

Implement the Pharmacy industry extension on top of the core:
- Medicine master (generic, brand, manufacturer, strength, dosage) built on the Product
  model from Prompt 6
- Batch/expiry/MRP (reuse Prompt 8's batch tracking)
- Prescription, doctor, patient/customer capture at point of sale
- FEFO batch selection at checkout (reuse Prompt 8's FEFO logic)
- Expiry alerts, near-expiry reporting
- Medicine return (reuse Prompt 18's Return Engine)

Guardrails (apply to every phase):
- Pharmacy workflows stay configurable and must not be used to infer or provide clinical
  advice — this module only manages data/workflow, not medical judgment.
- Feature-flagged per tenant like Restaurant was.

Definition of Done for this phase:
- [ ] Medicine sale at POS correctly recommends/selects FEFO batch
- [ ] Prescription/doctor/patient data captured and linked to the sale
- [ ] Expiry alert list generates correctly from seeded batch data
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 22 — Retail / Grocery / Wholesale Extensions

**Builds:** §11.3, §11.4, §11.5
**Depends on:** Prompt 21

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §11.3, §11.4, §11.5.

Implement, each as its own feature-flaggable extension:
- Retail: barcode, size/color variants (already in Prompt 6), promotions/loyalty tie-ins,
  gift card, exchange, return, customer credit, sales target
- Grocery: weight-based products, PLU, weighing-scale integration abstraction, variable
  barcode, unit conversion (carton/box/pack/piece), shelf labels
- Wholesale/Distribution: B2B customer, dealer/distributor pricing (reuse Prompt 6's
  pricing engine), price lists, credit limit (reuse Prompt 12), sales representative,
  territory, agent commission (reuse Prompt 13), collection (reuse Prompt 11), route
  sales, bulk discount

Guardrails (apply to every phase):
- Every "reuse Prompt N" reference above means literally call that existing service — do
  not reimplement pricing, credit, or commission logic inside these industry modules.

Definition of Done for this phase:
- [ ] Weight-based product sale with PLU works correctly at POS
- [ ] Wholesale sales order with dealer pricing + credit check + commission works end-to-end
- [ ] Shelf label / barcode label generation works for a batch of products
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 23 — Manufacturing/Bakery + Salon/Spa + Repair/Service + Franchise

**Builds:** §11.6, §11.7, §11.8, §10.30
**Depends on:** Prompt 22

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §11.6, §11.7, §11.8, §10.30.

Implement, each feature-flaggable:
- Manufacturing/Bakery: BOM, recipe (reuse Prompt 20's recipe model if applicable),
  production order, batch production, yield, wastage, finished goods, production costing —
  `Raw Materials → Production Order → Consumption → Finished Product → Finished Stock`,
  wired to Inventory Engine (Prompt 8)
- Salon/Spa: appointment, calendar, staff schedule, services, packages, membership,
  customer history, commission (reuse Prompt 13), chair/room, product/service sales, loyalty
- Repair/Service Center: service ticket, customer device, serial/IMEI (reuse Prompt 8),
  problem, estimate, technician, spare parts, labor, warranty (reuse Prompt 18) — lifecycle
  Received → Inspection → Estimate → Approved → Repairing → Quality Check → Ready → Delivered
- Franchise: franchise, franchise branch, franchise fee, royalty, central pricing/menu,
  central inventory, settlement, commission, franchise reporting

Guardrails (apply to every phase):
- Appointment/Booking is a generic engine (§10.25, already partly needed here for Salon)
  — if you haven't built it yet, build the generic version now and have Salon consume it,
  rather than a Salon-only booking system.

Definition of Done for this phase:
- [ ] Production order correctly consumes raw materials and produces finished stock
- [ ] Salon appointment booking + service sale + commission works end-to-end
- [ ] Repair ticket lifecycle works end-to-end with warranty linkage
- [ ] Franchise settlement calculates correctly across ≥2 franchise branches
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 24 — Delivery & Logistics

**Builds:** module 27 in §9 (Delivery & Logistics — see Master Spec's Restaurant/Wholesale
sections and §28 walkthroughs for delivery touchpoints)
**Depends on:** Prompt 23

```
Continuing OmniPOS. Read the delivery-related content across
`OmniPOS-Master-Specification.md` (referenced from POS §10.8, Wholesale §11.5, and the
walkthroughs in §28).

Implement:
- Delivery order lifecycle: Order → Packed → Assigned Rider → Out for Delivery →
  Delivered, with Failed → Reschedule/Return branch
- Rider/driver/vehicle management, zone, route
- COD handling, delivery fee, proof of delivery (signature/photo)
- Route optimization and auto rider assignment can be stubbed (simple round-robin) for now
- Delivery status must update the linked Sale/Invoice status (Prompt 10/11) and, for COD,
  create the correct payment record (Prompt 9's Payment Engine) on successful delivery

Guardrails (apply to every phase):
- Delivery is consumed by Restaurant (Prompt 20), Wholesale (Prompt 22), and later
  E-commerce (Prompt 33) — build it generic, not restaurant-specific.

Definition of Done for this phase:
- [ ] Full delivery lifecycle works incl. failed delivery → reschedule
- [ ] COD delivery correctly creates a payment record and updates invoice status
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 25 — HRM + Task Management

**Builds:** §10.24, §10.31
**Depends on:** Prompt 24

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.24 and §10.31.

Implement:
- Employee, department, designation, attendance (present/absent/late/leave/overtime),
  shift, leave, payroll (data model + basic calculation; full payroll integration is
  future-ready per spec, don't over-build), commission integration (reuse Prompt 13),
  sales target, performance
- Task Management: tasks, assignments, deadlines, priorities, comments, attachments,
  status, approval — attachable to any entity (customer, invoice, repair ticket, purchase order)

Guardrails (apply to every phase):
- Sales Target here should be the same concept as §10.35 (built in Prompt 26) — don't
  build two separate sales-target systems; if this prompt runs first, design the schema
  so Prompt 26 extends it rather than replacing it.

Definition of Done for this phase:
- [ ] Attendance/shift/leave tracking works
- [ ] Employee commission correctly reflects Prompt 13's commission engine
- [ ] Task creation/assignment/completion works and can attach to any entity type
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 26 — Loyalty/Wallet/Gift Card + Marketing Automation + Sales Target/Budget

**Builds:** §10.23, §10.34, §10.35
**Depends on:** Prompt 25

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.23, §10.34, §10.35.

Implement:
- Loyalty: points (earn/redeem/expiry), tiers (Bronze/Silver/Gold/VIP), referral, coupon,
  cashback — already partially wired via SALE_COMPLETED events since Prompt 9/16; complete
  the engine now
- Wallet: add money, deduct, cashback, refund, store credit, promotional credit — always
  with a full transaction ledger, never a bare balance field
- Gift Card: physical/digital, barcode/QR, balance, expiry, partial redemption, reload, disable
- Marketing Automation: trigger-based campaigns (inactive 30 days → coupon → SMS/Email/
  WhatsApp/Push; birthday, anniversary, first purchase, high-value purchase, abandoned
  cart, expiry reminder, loyalty milestone) — stub actual SMS/WhatsApp sending until
  Prompt 28's Notification Engine exists, but build the trigger/rule evaluation now
- Sales Target & Budget: extend Prompt 25's target model to branch/department/category/
  period budget vs. actual variance tracking

Guardrails (apply to every phase):
- Wallet/gift-card/store-credit balances must never be directly mutated — every change
  goes through a ledger entry, same principle as Inventory's stock movements.

Definition of Done for this phase:
- [ ] Loyalty points earn/redeem correctly on real sales, including reversal on return
      (go back and verify Prompt 18's reversal actually calls this)
- [ ] Wallet and gift card both maintain correct ledgers
- [ ] At least 2 marketing automation triggers fire correctly against seeded customer data
- [ ] Budget vs actual variance report works for at least one branch/period
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 27 — Approval & Workflow Engine + Business Rule Engine

**Builds:** §10.26, §10.27
**Depends on:** Prompt 26

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.26 and §10.27.

Implement the real, reusable engines that every earlier prompt stubbed:
- Approval/Workflow Engine: conditions, roles, approval levels, rejection, comments,
  escalation, timeout, notifications — configurable per tenant (e.g. "Discount > 10% →
  Manager Approval", "Refund > ৳50,000 → Owner Approval", "Purchase > ৳500,000 → Director Approval")
- Business Rule Engine: `IF stock < reorder_point THEN create purchase recommendation`,
  `IF discount > 20% THEN manager approval`, `IF customer tier = VIP THEN discount = 5%`,
  `IF customer due > credit limit THEN credit sale blocked`

Also implement these named approval sub-types as configured instances of the same engine
(never separate approval systems per type):
- **Stock Approval** — stock adjustments/write-offs (Prompt 8) above a threshold require
  manager approval before the movement posts
- **Price Approval** — catalog price changes (Prompt 6, product pricing edits — distinct
  from POS price override) above a % threshold require approval before taking effect
- **Customer Credit Approval** — new or increased customer credit limits (Prompt 12)
  require approval before the higher limit becomes active

**Go back and replace every stub approval hook** from Prompts 6 (catalog price change —
new), 8 (stock adjustment — new), 9 (price override), 12 (credit hold + credit limit
increase), 14 (purchase approval), 15 (expense/cash-variance approval), 25 (task approval)
with real calls into this engine.

Guardrails (apply to every phase):
- Do this replacement carefully with regression tests on each of the modules listed above
  — this prompt touches the most existing code of any prompt so far.

Definition of Done for this phase:
- [ ] All 8 stubbed/named approval points now use the real engine, each with a passing regression test
- [ ] At least 2 business rules are configurable and fire correctly
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 28 — Notification Engine + Customer Communication

**Builds:** §10.29, §10.40
**Depends on:** Prompt 27

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.29 and §10.40.

Implement:
- Notification Engine: channels (in-app, push, email, SMS, WhatsApp); events (low stock,
  expiry, installment due, overdue, quotation expiry, approval required, payment,
  commission, sync failure, branch offline, sales target, suspicious transaction, new order)
- Customer Communication: invoice SMS, payment receipt, due reminder, installment
  reminder, promotion, loyalty notification, delivery update — with mandatory consent/
  opt-out tracking per customer per channel
- Digital Receipt: deliver the receipt from Prompt 9's checkout via email/SMS/WhatsApp
  instead of, or alongside, print
- WhatsApp Invoice: send the invoice/receipt document via WhatsApp Business API integration

**Go back** and wire the real notification calls into every module that stubbed them
(Installment §12, Marketing Automation §26, Delivery §24, Sync failures §19, etc.)

Guardrails (apply to every phase):
- Respect opt-out at the send layer, centrally — don't make every calling module check
  consent individually.

Definition of Done for this phase:
- [ ] All listed events trigger a notification through at least one channel in tests
- [ ] Opt-out correctly suppresses sends for that customer/channel
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 29 — Document Management + Digital Signature

**Builds:** §10.28, §38 item 26 (Custom Document Template)
**Depends on:** Prompt 28

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.28.

Implement:
- Document attachment on: customer, supplier, invoice, purchase, employee, warranty,
  prescription, delivery, expense — with upload, preview, versioning, access control,
  expiry, audit
- Custom Document Template: extend Prompt 11's Invoice Engine template config into a
  tenant-editable template builder for invoice/quotation/purchase-order documents (beyond
  swapping just logo/terms — layout, fields shown, branding)
- Digital signature capture for: customer signature, delivery signature, service
  completion, purchase approval, contract, invoice confirmation

Guardrails (apply to every phase):
- Store file metadata in the transactional DB; store actual file bytes in object storage
  (or equivalent), never inline blobs in the primary DB.

Definition of Done for this phase:
- [ ] Document upload/attach/version works on at least 3 entity types
- [ ] Digital signature capture works on at least delivery proof-of-delivery
- [ ] A tenant can edit and re-save its invoice template and see it reflected on the next invoice
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 30 — Reporting & BI Engine

**Builds:** §15
**Depends on:** Prompt 29

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §15.

Implement a reusable reporting engine (filters: date range, branch, warehouse, product,
category, employee, agent, customer, supplier; export CSV/Excel/PDF) covering:
- Sales reports (daily/monthly, product, category, branch, employee, agent, payment method, customer)
- Inventory reports (stock, valuation, movement, aging, dead stock, low stock, expiry, batch)
- Finance reports (P&L, Balance Sheet, Cash Flow, AR, AP, Expense)
- Commission and Installment reports

Per §15, keep BI architecturally separate from operational queries — introduce an
analytics read-model/aggregate layer now if report queries are starting to compete with
POS transaction performance; do not query the hot transactional tables directly for heavy reports.

Guardrails (apply to every phase):
- Add Scheduled Reports, Saved Reports, and a Dashboard Builder (§38 checklist items
  21-23 — drag-and-drop custom dashboard widgets, tenant-level customization) as part of
  this engine, not as a bolt-on later.

Definition of Done for this phase:
- [ ] All listed report categories generate correctly against seeded multi-branch data
- [ ] Scheduled report delivery + saved report presets work
- [ ] Dashboard Builder lets a user add/arrange at least 3 widget types on a custom dashboard
- [ ] Report queries don't measurably slow down concurrent POS checkout in a load test
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 31 — AI Intelligence Layer + AI Business Copilot

**Builds:** §16
**Depends on:** Prompt 30

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §16 in full.

Implement, as a separate platform layer that only *reads* from Reporting/BI (Prompt 30),
never bypassing business logic:
- Demand Forecasting, Inventory AI (reorder/overstock/dead-stock/expiry-risk), Sales AI,
  Profit AI (with explainable output, e.g. "Revenue +4%, COGS +11%, Discount +7% → margin declined")
- Fraud AI (suspicious refunds/discounts, cash variance, stock manipulation — alert only,
  never automatic punishment)
- Customer AI (LTV, churn risk, cross-sell) and Supplier AI (scoring) — now that Prompts 7
  and 22 have accumulated real history data to learn from
- Procurement AI with explainable recommendations (show the inputs: avg daily sales,
  current stock, lead time, safety stock → recommended purchase quantity)
- AI Business Copilot: natural-language Q&A over authorized tenant data
- **AI Permission Model** — every AI query MUST pass through the exact same RBAC check
  (Prompt 4) as a normal API call: `User → Permission Check → Tenant Scope → Branch Scope
  → Data Retrieval → AI → Response`. Write a test proving a cashier without profit-view
  permission gets a permission-denied response from the AI, not a filtered-but-still-served answer.

Guardrails (apply to every phase):
- AI Action System suggestions (e.g. "[Create Purchase Requisition]") must route through
  Prompt 27's real Approval Engine for any financial action — AI never executes financial
  actions unilaterally.

Definition of Done for this phase:
- [ ] At least Demand Forecasting, Profit AI, and the Business Copilot work against real seeded data
- [ ] AI permission enforcement test (cashier vs owner) passes
- [ ] AI-suggested actions require human confirmation before executing
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 32 — SaaS Billing + Feature Flags + SaaS Admin Panel + Platform Monitoring

**Builds:** §10.1, §23, §10.36
**Depends on:** Prompt 31

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §10.1, §23 and §10.36.

Implement:
- Platform & SaaS Management overview (§10.1): Platform Admin view of total/active/
  trial/suspended tenants, total users/branches/POS, daily transactions, monthly/
  subscription revenue, system health — and the Starter/Business/Enterprise plan
  definitions that gate user/branch/warehouse/POS/storage/API/AI-usage/report/module limits
- SaaS Billing: Trial, Plan, Subscription, billing cycle, branch/user/POS limits, feature
  limits, usage tracking, invoice, payment, renewal, suspension, upgrade, downgrade
- Feature Flags: per-tenant module on/off (this should now retroactively gate every
  industry module built in Prompts 20-23 and every optional engine — verify this actually works)
- SaaS Admin Panel: tenant list/status, subscription, revenue, active users/devices,
  storage, API usage, support tickets, system health, billing, audit — with
  audited/controlled support-admin access into tenant data (never unrestricted)
- Tenant Usage Monitoring: per-tenant users/branches/POS/transactions/storage/API
  calls/AI usage/active devices
- Custom Fields: tenant-defined fields (text/number/date/boolean/dropdown/multi-select/
  file/currency) attachable to Customer, Product, Supplier, Employee, Invoice, Repair
  Ticket — reuse this generically, don't build per-entity custom-field systems
- Custom Form Builder: tenant-configurable forms (e.g. a Repair Intake form: Device Type,
  IMEI, Problem, Condition, Accessories, Customer Signature), built on top of Custom Fields

Guardrails (apply to every phase):
- Subscription limit breaches (e.g. branch count > plan limit) must be enforced at the
  point of creation (Branch module, Prompt 5), not just reported after the fact — go back
  and add that check.

Definition of Done for this phase:
- [ ] Subscription lifecycle (Trial→Active→Past Due→Suspended) works and enforces limits
- [ ] Custom Fields can be added to at least 2 entity types and appear correctly in their forms/UI
- [ ] Custom Form Builder can construct a working intake form (e.g. Repair Intake) without a code change
- [ ] Feature flags correctly gate every previously-built optional module
- [ ] SaaS Admin Panel shows accurate live tenant/platform data
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 33 — Omnichannel, E-commerce & Marketplace Integration

**Builds:** §12
**Depends on:** Prompt 32

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §12.

Implement:
- Shared source of truth (product, price, customer, inventory, order, payment, delivery)
  across POS, Website, Mobile App, Kiosk, QR Ordering — reuse everything already built,
  add channel-specific entry points only
- E-commerce order flow: Online Order → Stock Reservation (Prompt 8) → Payment (Prompt 9)
  → Packing → Delivery (Prompt 24) → Complete
- Marketplace adapter architecture (connectors for Shopify/WooCommerce/eBay/
  Amazon/Facebook Commerce as pluggable adapters) — implement one real adapter end-to-end
  as a reference, stub the rest behind the same interface
- Kiosk self-service ordering flow (already partly built for Restaurant in Prompt 20 —
  generalize it for retail kiosk use)

Guardrails (apply to every phase):
- Never hard-code marketplace-specific logic into core Sales/Inventory modules — it must
  go through the adapter interface only.

Definition of Done for this phase:
- [ ] An online order correctly reserves stock, takes payment, and creates a delivery,
      indistinguishable downstream from a POS sale
- [ ] One real marketplace adapter works end-to-end (order import + inventory sync)
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 34 — API Finalization, Webhooks, API Key Management, Integration Marketplace

**Builds:** §19, §38 items 27-30
**Depends on:** Prompt 33

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §19 and §38 (checklist items
27-30: Workflow Builder, API Key Management, Webhook Management, Integration Marketplace).

Implement:
- Formalize/document all API domains built across every prior prompt under a consistent
  `/api/v1` structure with request/response documentation
- Webhook system: retry, signature verification, event logs, failure monitoring,
  idempotency — for all events listed in §19 (invoice.created, invoice.paid, order.created,
  payment.received, stock.low, customer.created, installment.due, commission.generated,
  sync.failed, delivery.completed)
- API Key Management: tenant-scoped key issuance, rotation, scopes, revocation
- Integration Marketplace UI: a directory for enabling connectors (payment gateway, SMS
  provider, accounting export, marketplace adapters from Prompt 33) per tenant
- Workflow Builder: a visual/config UI on top of Prompt 27's Approval/Workflow Engine, so
  approval chains are admin-configurable without code changes

Guardrails (apply to every phase):
- API versioning must not break any existing integration — if you need to change a
  contract, add `/api/v2` rather than mutate `/v1`.

Definition of Done for this phase:
- [ ] All webhook events fire correctly with retry/idempotency verified by test
- [ ] API keys can be issued, scoped, rotated, and revoked
- [ ] Workflow Builder can create a new approval rule without a code deploy
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 35 — Hardware Integration + PWA/Client Architecture + Real-Time Engine

**Builds:** §14, §10.39, §10.38
**Depends on:** Prompt 34

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §14, §10.39, §10.38.

Implement:
- Hardware abstraction layer: barcode scanner, thermal printer, A4 printer, cash drawer,
  customer display, weighing scale, label printer, KDS, kiosk, QR scanner — each behind a
  driver interface, never coupled directly into business logic
- PWA/client architecture: make the POS client properly installable/offline-capable (PWA)
  or confirm the dedicated client approach decided in Prompt 0; ship separate lightweight
  mobile experiences for Manager/Sales/Delivery use cases; KDS as its own
  dedicated browser/tablet interface
- Real-Time Engine: WebSocket/SSE wiring for KOT→KDS (Prompt 20), new-order→dashboard,
  and sync-status updates (Prompt 19) — replace any polling used so far where it matters for UX

Guardrails (apply to every phase):
- Every hardware driver must be swappable without touching POS/Restaurant/Pharmacy
  business logic — verify by swapping the printer driver for a mock and confirming
  checkout still works.

Definition of Done for this phase:
- [ ] At least barcode scanner + thermal printer + cash drawer work through the abstraction layer
- [ ] KDS updates in real time from KOT creation, no polling
- [ ] POS installable as a PWA / confirmed dedicated client, works offline (retest Prompt 19's scenario)
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 36 — Search + Import/Export + Data Migration Toolkit

**Builds:** §20, §21, §10.41
**Depends on:** Prompt 35

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §20, §21, §10.41.

Implement:
- Global search across product/customer/supplier/invoice/order/quotation/payment/serial/
  batch/employee/repair ticket — fast at large-catalog scale (add proper indexing/search
  infra now if simple LIKE queries won't scale)
- Import: products, customers, suppliers, opening stock, price lists, employees — CSV/
  Excel, with validate → preview-errors → confirm → import, async for large files
- Export: Excel/CSV/PDF for sales, inventory, customers, accounting, reports
- Bulk operations: bulk edit product/price, bulk import, bulk category assignment, bulk
  stock adjustment, bulk customer update, bulk export
- Data Migration Toolkit: guided one-time migration wizard (Upload → Map Columns →
  Validate → Preview → Import → Error Report) for businesses switching from another POS

Guardrails (apply to every phase):
- Large imports/exports must run through the background job pattern (formalized properly
  in Prompt 39) — do not block the request thread.

Definition of Done for this phase:
- [ ] Global search returns correct results across all listed entity types within
      acceptable latency on a large seeded dataset
- [ ] Import/export works for at least Products and Customers with validation preview
- [ ] Data migration wizard completes a full CSV-to-live-data run correctly
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 37 — Multi-Currency & Localization

**Builds:** §22
**Depends on:** Prompt 36

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §22.

Implement:
- Multi-currency: base currency, transaction currency, exchange rate + history, FX
  gain/loss, currency-specific pricing, multi-currency payment — historical transactions
  must keep an **immutable** exchange rate at the time they were created
- Localization: English, বাংলা, Arabic (framework for more); covers currency, number
  format, date format, timezone, fiscal year, tax format. Keep UI translation and business-
  data translation as separate concerns.

Guardrails (apply to every phase):
- Retrofitting currency into 30+ prior modules is risky — audit every place a monetary
  amount is stored or displayed and confirm it now carries/derives its currency correctly;
  do not assume a global single-currency default silently.

Definition of Done for this phase:
- [ ] A transaction created under one exchange rate displays correctly forever, even after
      the rate changes later
- [ ] UI renders correctly in at least English and বাংলা
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 38 — Security Hardening & Audit Finalization

**Builds:** §17, §24
**Depends on:** Prompt 37

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §17 and §24 in full.

Do a full security pass across the entire system built so far:
- Audit: verify User/Tenant/Branch/Device/Timestamp/Entity/Action/Old-Value/New-Value/IP/
  Metadata is actually captured for every item in §17's audit list (invoice edit, price
  change, discount, refund, void, stock adjustment, payment, credit limit, commission,
  installment, VAT, permission change) — fill any gaps found in earlier prompts
- Run the full security test suite: SQL injection, XSS, CSRF (where applicable), broken
  access control, IDOR, tenant escape, JWT/session issues, rate limiting, file upload
  vulnerabilities, privilege escalation
- Specifically re-test tenant isolation across every module built in Prompts 1-37 — this
  is the single most important property of the whole system

Guardrails (apply to every phase):
- Any finding here is a blocker — do not proceed to Prompt 39 until tenant isolation and
  the audit trail are proven solid across the whole system, not just the modules built early on.

Definition of Done for this phase:
- [ ] Full security test suite passes
- [ ] Audit trail confirmed complete for every listed critical action, across every module
- [ ] Cross-tenant data leak test suite passes for every module
- [ ] Explain what you built/fixed before I give you the next prompt
```

---

## Prompt 39 — Performance, Caching, Background Jobs, Scalability

**Builds:** §25
**Depends on:** Prompt 38

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §25.

Formalize what earlier prompts stubbed:
- Background job/queue infrastructure for: email, SMS, WhatsApp, report generation, PDF
  generation, AI processing, notifications, sync processing, webhook delivery, large
  import/export, marketplace sync — migrate every stubbed async operation from Prompts
  11/15/26/28/30/33/36 onto this real infrastructure
- Caching for product catalog, price, tax config, permissions, branch settings, customer
  quick-lookup — never cache financial source-of-truth data
- Load-test POS checkout, product search, and cart operations against the performance
  targets in §25 (near-instant/instant); optimize indexes/queries as needed
- Confirm the modular-monolith architecture from Prompt 1 can still scale from 1 → 1,000+
  tenants without a rewrite; document the split points for future microservice extraction if needed

Guardrails (apply to every phase):
- POS checkout must remain synchronous/locally transactional — never make the core sale
  path depend on a queue being healthy.

Definition of Done for this phase:
- [ ] All previously-stubbed async operations now run through the real queue
- [ ] POS search/cart/checkout meet the performance targets under load test
- [ ] Caching is verified to never serve stale financial data
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 40 — Backup, Disaster Recovery & Observability

**Builds:** §26
**Depends on:** Prompt 39

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §26.

Implement:
- Automated backups, point-in-time recovery, database replication, backup verification,
  documented disaster recovery plan, tenant/branch restoration procedure
- Offline device local backup strategy + persistent sync queue durability (retest against
  Prompt 19's offline scenarios after a simulated device crash/restart)
- Observability: API latency, error rate, DB health, queue health, sync health,
  notification failures, CPU/memory/storage, uptime — surfaced on an admin health
  dashboard (API/DB/Queue/Sync/Notifications/Storage indicators)

Definition of Done for this phase:
- [ ] A full backup can be restored to a working system in a test run
- [ ] Device crash/restart during an offline sale does not lose the transaction
- [ ] Admin health dashboard reflects real system status
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 41 — Full Testing Pass (Critical E2E Scenarios)

**Builds:** §31 (all of it)
**Depends on:** Prompt 40

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §31 in full.

Implement/verify automated coverage for all 10 mandatory critical E2E tests listed there:
1. Offline sale → reconnect → sync → no duplicate
2. Sale → return → inventory/accounting reversal
3. Credit sale → payment → customer due update
4. Installment → partial payment → overdue
5. Commission → sale return → commission reversal
6. Restaurant order → KOT → KDS → payment
7. Pharmacy batch → FEFO → expiry
8. Purchase → GRN → stock → supplier due
9. Multi-tenant isolation
10. Cashier permission restriction

Plus the standard chain (Product → Purchase → Stock → Sale → Payment → Accounting →
Commission → Loyalty → Report) and the offline stress test (100 offline sales → reconnect
→ sync → verify).

Definition of Done for this phase:
- [ ] All 10 critical E2E tests + the standard chain + the offline stress test pass in CI
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 42 — UI/UX Polish Pass

**Builds:** §27
**Depends on:** Prompt 41

```
Continuing OmniPOS. Read `OmniPOS-Master-Specification.md` §27.

Do a full UI/UX consistency pass across every screen built in Prompts 1-41:
- Desktop: Sidebar → Top Nav → Page Header → Filters → Data Table/Dashboard consistency
- POS: barcode-first, touch-first, minimal clicks, configurable keyboard shortcuts (F1-F7
  per spec), offline status indicator with pending-transaction count
- Mobile: dashboard, sales monitoring, inventory, orders, customers, notifications,
  approvals, AI assistant
- Restaurant UI: visual floor plan, table status, waiter assignment, KOT/KDS status
- Pharmacy UI: fast medicine search, batch selection, expiry visibility, FEFO recommendation
- Customer-facing display: live product/qty/price/discount/VAT/total + QR payment

Definition of Done for this phase:
- [ ] Every module has a working, consistent UI matching these principles
- [ ] Offline indicator and keyboard shortcuts verified on the POS screen specifically
- [ ] Explain what you built before I give you the next prompt
```

---

## Prompt 43 — Production Deployment

**Builds:** final rollout
**Depends on:** Prompt 42

```
Continuing OmniPOS. This is the final prompt in the sequence.

Prepare production deployment:
- Finalize environment configs, secrets management, deployment pipeline
- Run the full test suite (unit + integration + E2E + security + performance) one more
  time as a release gate
- Verify the VAT/NBR disclaimer from §10.21 is visible in tenant onboarding/settings
  documentation before go-live
- Produce a final README covering: architecture summary, module map (link back to
  `OmniPOS-Master-Specification.md`), how to run locally, how to deploy, how to onboard a
  new tenant

Definition of Done for this phase:
- [ ] Full test suite green
- [ ] Deployment pipeline works end-to-end to a staging environment
- [ ] Final README complete
- [ ] System is ready for its first real tenant
```

---

## Coverage Map — Every Module/Engine → Its Prompt

| Master Spec module/engine | Built in |
|---|---|
| §8 Core Reusable Engines (skeletons) | Prompt 1 |
| §18 Core Database Schema | Prompt 2 |
| §10.2 Tenant/Company + §6 Auth & Security | Prompt 3 |
| §5 RBAC | Prompt 4 |
| §10.3 Branch/Warehouse/Device, §10.32 Settings, §10.33 Onboarding | Prompt 5 |
| §10.4 Product & Catalog, §10.5 Pricing & Promotion, §38.3 Barcode Label Designer, §38.4 Shelf Label | Prompt 6 |
| §10.6 Customer & CRM, §10.7 Supplier | Prompt 7 |
| §10.16 Inventory & Warehouse, Landed Cost, Consignment | Prompt 8 |
| §10.8 POS & Checkout, §10.9 Payment Engine + Split Payment, §38.5 Price Checker, §38.7 Self Checkout | Prompt 9 |
| §10.10 Sales, §10.11 Quotation & Sales Order | Prompt 10 |
| §10.12 Invoice, Payment allocation, Collection | Prompt 11 |
| §10.13 Credit, §10.14 Installment | Prompt 12 |
| §10.15 Commission | Prompt 13 |
| §10.17 Purchasing | Prompt 14 |
| §10.18 Expense, §10.19 Cash Register & Shift | Prompt 15 |
| §10.20 Accounting, Credit/Debit Note | Prompt 16 |
| §10.21 VAT/Tax Engine | Prompt 17 |
| §10.22 Return/Refund/RMA/Warranty | Prompt 18 |
| §13 Offline-First & Sync Engine | Prompt 19 |
| §11.1 Restaurant | Prompt 20 |
| §11.2 Pharmacy | Prompt 21 |
| §11.3/11.4/11.5 Retail/Grocery/Wholesale | Prompt 22 |
| §11.6/11.7/11.8 Manufacturing/Salon/Repair, §10.30 Franchise | Prompt 23 |
| Delivery & Logistics | Prompt 24 |
| §10.24 HRM, §10.31 Task Management | Prompt 25 |
| §10.23 Loyalty/Wallet/Gift Card, §10.34 Marketing Automation, §10.35 Sales Target/Budget | Prompt 26 |
| §10.26 Approval/Workflow, §10.27 Business Rule Engine, §38.15-18 Stock/Price/Expense/Credit Approval | Prompt 27 |
| §10.29 Notification, §10.40 Customer Communication, §38.9 Digital Receipt, §38.10 WhatsApp Invoice | Prompt 28 |
| §10.28 Document Management, Digital Signature, §38.26 Custom Document Template | Prompt 29 |
| §15 Reporting & BI, §38.21-23 Scheduled/Saved Reports, Dashboard Builder | Prompt 30 |
| §16 AI Intelligence Layer, AI Business Copilot | Prompt 31 |
| §10.1 Platform & SaaS Management, §23 SaaS Billing/Feature Flags/Custom Fields/Form Builder, §10.36 SaaS Admin Panel | Prompt 32 |
| §12 Omnichannel/E-commerce/Marketplace | Prompt 33 |
| §19 API/Webhooks, API Key Mgmt, Integration Marketplace, Workflow Builder | Prompt 34 |
| §14 Hardware, §10.39 PWA/Client, §10.38 Real-Time Engine | Prompt 35 |
| §20 Search, §21 Import/Export, §10.41 Data Migration | Prompt 36 |
| §22 Multi-Currency & Localization | Prompt 37 |
| §17 Audit, §24 Security | Prompt 38 |
| §25 Performance/Caching/Queue/Scalability | Prompt 39 |
| §26 Backup/DR/Observability | Prompt 40 |
| §31 Testing Strategy & Critical E2E | Prompt 41 |
| §27 UI/UX | Prompt 42 |
| Production rollout | Prompt 43 |

Every one of the 50 modules + 15 engines + 30 checklist items from
`OmniPOS-Master-Specification.md` §9/§38 has exactly one home in this table. If you ever
add a new feature to the spec later, add a row here too before writing its prompt.
