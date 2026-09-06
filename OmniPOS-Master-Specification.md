# OmniPOS — Master Product & Technical Specification (Consolidated v4.1)

**Product Type:** Cloud, Offline-First, Multi-Tenant SaaS — POS + ERP + CRM + Accounting + Inventory + AI
**Primary Market:** Bangladesh (globally extensible architecture)
**Target:** Small Business → SME → Enterprise → Franchise
**Business Model:** SaaS Subscription

> This document consolidates and supersedes the 4 prior drafts in this folder
> (`New Microsoft Word Document.DOCX` v1.0, `f3.txt` v2.0, `f4.txt` v2.0, `f2.txt` v3.0).
> All unique content from every draft has been merged here. Use **only this file**
> as the source of truth going forward.
>
> **v4.1 changelog:** re-audited all 4 source files line-by-line against v4.0 and restored
> 10 modules + ~15 granular features that were missed in the first pass (Task Management,
> System Settings, Tenant Onboarding, Marketing Automation, Sales Target/Budget, SaaS Admin
> Panel, Real-Time Engine, PWA architecture, Customer Communication, Data Migration, Example
> Industry Configuration, and the full §38 checklist). See §38 for the full trace table.

---

## 0. How To Read This Document

```
Requirement → Architecture → Database → API → Business Logic → UI → Tests → Security → Documentation
```

Every module below follows, where applicable: **Purpose → Key Features → Workflow/Lifecycle →
Business Rules → Accounting Impact → Offline Behavior → Audit → Notifications**.

Section 36 lists what is *still* missing before an AI coding agent can implement this without
inventing its own architecture (DB field-level schema, API payloads, permission matrix, etc.).

---

## 1. Product Definition & Vision

OmniPOS is **not** a simple cashier/billing app. It is a complete **Business Operating System**:

> **OmniPOS — Offline-First POS & Business Management SaaS**
> *(alt: "One Platform. Every Business." / "POS, ERP, CRM & AI Business Operating System")*

A business can manage: POS, Sales, Customers, Suppliers, Products, Inventory, Warehouses,
Purchasing, Accounting, VAT, Credit, Installments, Commission, CRM, Loyalty, Promotions,
Delivery, HR, Restaurant ops, Pharmacy ops, Retail ops, Wholesale ops, Manufacturing,
Service/Repair, Franchise, E-commerce, Omnichannel sales, BI, and AI assistance — **all on one core platform**.

Usage scales by business type:

| Business | Uses |
|---|---|
| Small food cart | POS + Inventory + Cash |
| Restaurant | POS + Tables + KOT + KDS + Recipe + Delivery |
| Pharmacy | POS + Batch + Expiry + FEFO + Prescription |
| Wholesaler | Sales Order + Warehouse + Credit + Commission + Delivery |
| Enterprise | Multi-Branch + Central Warehouse + Accounting + HR + BI + AI + Franchise |

### Modern POS Data Flow (what "modern" means here)

A POS is not `Product → Cart → Payment → Receipt`. It is:

```
Customer → Product → Pricing → Promotion → Inventory → Tax → Sale → Payment →
Accounting → Commission → Loyalty → Delivery → Reporting → AI Intelligence
```

One ৳10,000 sale, in a single atomic transaction, must:
Create Sale → Create Invoice → Decrease Stock → Calculate VAT → Record Payment →
Update Customer Ledger → Calculate Profit → Calculate Commission (if any) → Create Loyalty
Points → Create Accounting Journal → Create Audit Log → Update Reporting/Analytics data.

---

## 2. Core Product Principles

1. **Offline First** — POS never depends on internet. Cashier must sell, return, search
   products, create customers, take payment, print receipts, create restaurant orders/KOT
   without connectivity. Device syncs automatically when internet returns.
2. **Multi-Tenant** — thousands of businesses on one platform; Tenant A can never access Tenant B's data.
3. **Multi-Company / Multi-Branch / Multi-Warehouse / Multi-Device / Multi-Currency / Multi-Language.**
4. **Industry Flexible** — one core system, industry-specific extensions bolt on top.
5. **API-First** — every important module reachable via API.
6. **Modular Architecture** — reusable core engines, never duplicate business logic per industry.
7. **Full Audit Trail** — no financial/stock-critical action without an audit record.
8. **Permission First** — every user only accesses authorized data/actions (incl. AI).
9. **Financial data is immutable/auditable** — never silently modify or delete; use reversal/correction.
10. **Never hard-code industry-specific rules into the core.**
11. **Never assume internet connectivity.**
12. **Never allow cross-tenant data access.**
13. **Idempotent transactions** everywhere (payments, offline sync).
14. **Configurable Tax/Pricing/Workflow engines** — never hard-coded.
15. **AI must respect the same permission system as the app (RBAC), never bypass it.**
16. **Do not break existing modules when adding new features (backward compatibility).**
17. Design for Bangladesh first, but keep architecture internationally extensible.

---

## 3. Target Industries

**Food & Hospitality:** Restaurant, Cafe, QSR, Food Cart, Bakery, Cloud Kitchen
**Retail:** General Retail, Clothing, Footwear, Cosmetics, Electronics, Mobile Shop, Computer Shop, Furniture, Hardware, Book Store
**Grocery:** Grocery, Super Shop, Supermarket
**Healthcare:** Pharmacy
**B2B:** Wholesale, Distribution
**Service:** Salon, Spa, Repair Shop, Service Center
**Production:** Bakery Production, Light Manufacturing
**Enterprise:** Franchise, Multi-outlet Enterprise

---

## 4. System Architecture — SaaS Hierarchy

```
Platform
 ├── Platform Super Admin
 ├── Tenant / Company
 │   ├── Head Office
 │   ├── Branch
 │   │   ├── Warehouse
 │   │   ├── POS Terminal
 │   │   ├── Kiosk
 │   │   └── KDS
 │   ├── Employees
 │   ├── Customers
 │   ├── Suppliers
 │   └── Products
 └── SaaS Subscription
```

A tenant can have: multiple branches, warehouses, POS, users, currencies, price lists, tax configurations.

### Core Architecture Philosophy — Core Engines + Industry Extensions (never separate apps)

```
CORE ENGINES                         INDUSTRY EXTENSIONS
 ├── POS                              ├── Restaurant
 ├── Sales                            ├── Pharmacy
 ├── Inventory                        ├── Retail
 ├── Product                    →     ├── Grocery
 ├── Customer                         ├── Wholesale
 ├── Payment                          ├── Manufacturing
 ├── Accounting                       ├── Salon
 ├── Tax                              └── Repair
 ├── Workflow
 ├── Notification
 ├── Reporting
 └── AI
```

### High-Level Data Architecture

```
                    OmniPOS SaaS
                         │
                ┌────────┴────────┐
                │  Web/POS/Mobile │
                └────────┬────────┘
                         │
                     API Layer
                         │
              ┌──────────┴──────────┐
              │                     │
        Core Services          AI Services
              │                     │
        Business DB           AI/Analytics
              │
        Event System
              │
 ┌────────────┼─────────────┐
 │            │             │
Inventory   Accounting   Notification
```

---

## 5. User Roles & Permission Model

**Platform Roles:** Super Admin, SaaS Admin, Support Admin, Finance Admin, Technical Admin, Auditor.

**Business Roles:** Owner, CEO, Director, Head Office Manager, Branch Manager, Accountant,
Sales Manager, Salesperson, Commission Agent, Cashier, Inventory Manager, Purchase Manager,
Warehouse Manager, Waiter, Kitchen Staff, Pharmacist, Delivery Rider, HR Manager, Auditor.

**Custom Roles** — tenants can create their own, e.g.:

```
Role: Senior Cashier
✓ Create Sale   ✓ Hold Sale   ✓ Receive Payment   ✓ Print Invoice
✗ Refund        ✗ Void Invoice   ✗ Change Product Price   ✗ Stock Adjustment
```

Permission granularity is **action-level, not just module-level**:

```
Sales
 ├── View   ├── Create   ├── Edit   ├── Delete
 ├── Discount   ├── Refund   ├── Void   ├── Export   └── Approve
```

---

## 6. Authentication & Security

**Login:** Email, Phone, Password, OTP, 2FA, Google login, session management.

**Device Registration:** every POS/device gets a unique identity (Device ID, Tenant, Branch,
User, OS, App version, Last Sync, Last IP, Status).

**Security controls:** login history, failed-login detection, IP/device tracking, session
revoke, password policy, account lock, suspicious-login detection, rate limiting, input
validation, secure password hashing, secure file uploads, encryption where appropriate,
tenant isolation, full audit logging, RBAC, API authorization.

---

## 7. Dashboard System (Role-Based)

**Owner Dashboard:** Today's sales/profit, net sales, gross profit, expenses, purchases,
receivables, payables, inventory value, low-stock, expiring products, branch comparison,
sales/profit trend, cash position, AI insights.

**Branch Manager Dashboard:** Branch sales, cash position, employees, inventory, low stock,
expenses, customer activity, sales targets, performance.

**Accountant Dashboard:** AR, AP, Cash, Bank, Expenses, P&L, Trial Balance, VAT, Outstanding.

**Head Office Dashboard:** All-branch sales, branch ranking, product performance, stock,
purchase, VAT, employee performance, commission, outstanding, cash, profit.

**AI Dashboard insight examples:**
> "Sales dropped 14% this week." · "Product X may run out in 3 days." · "Branch B has unusually high refunds."

---

## 8. Core Reusable Engines (build these once, reuse everywhere)

1. **Transaction Engine** — sale, purchase, return, etc.
2. **Inventory Engine** — stock movement across all industries.
3. **Pricing Engine** — retail/wholesale/dealer/VIP pricing.
4. **Tax Engine** — VAT/tax calculation, versioned rules.
5. **Payment Engine** — cash/card/mobile/gateway/credit, abstraction layer.
6. **Accounting Engine** — double-entry.
7. **Commission Engine** — agent/salesperson.
8. **Loyalty Engine** — points/membership.
9. **Promotion Engine** — discount/coupon/combo, priority-conflict resolution.
10. **Workflow/Approval Engine** — configurable approval chains.
11. **Notification Engine** — all channels (in-app, push, email, SMS, WhatsApp).
12. **Audit Engine** — critical-activity trail.
13. **Sync Engine** — offline → cloud, idempotent, conflict-resolving.
14. **Reporting Engine** — reusable report framework.
15. **AI Engine** — forecasting + business assistant, RBAC-scoped.

---

## 9. Complete Module Directory

| # | Module | # | Module |
|---|---|---|---|
| 01 | Platform & SaaS Management | 21 | VAT / Tax Engine |
| 02 | Tenant / Company Management | 22 | Restaurant |
| 03 | Authentication & Security | 23 | Pharmacy |
| 04 | User / Role / Permission (RBAC) | 24 | Retail / Grocery / Wholesale |
| 05 | Branch / Warehouse / Device | 25 | Manufacturing / Bakery |
| 06 | Product & Catalog | 26 | Service / Repair / Warranty / RMA |
| 07 | Pricing & Promotion Engine | 27 | Delivery & Logistics |
| 08 | Customer & CRM | 28 | HRM |
| 09 | Supplier Management | 29 | Loyalty / Membership / Wallet / Gift Card |
| 10 | POS & Checkout Engine | 30 | Appointment/Booking & Queue Management |
| 11 | Sales Management | 31 | Approval & Workflow Engine |
| 12 | Quotation & Sales Order | 32 | Business Rule Engine |
| 13 | Invoice Engine | 33 | Document Management & Digital Signature |
| 14 | Payment & Collection | 34 | Notification Engine |
| 15 | Credit Management | 35 | Franchise Management |
| 16 | Installment Management | 36 | Reporting / BI / AI |
| 17 | Commission Engine | 37 | Offline Sync Engine |
| 18 | Inventory & Warehouse | 38 | Hardware Integration |
| 19 | Purchasing | 39 | API / Webhooks / Integrations |
| 20 | Accounting Engine | 40 | SaaS Billing / Feature Flags |
| 41 | Task Management | 46 | SaaS Admin Panel & Platform Monitoring |
| 42 | System / Global Settings Engine | 47 | Real-Time Engine |
| 43 | Tenant Onboarding & Setup Wizard | 48 | PWA / Client Architecture |
| 44 | Marketing Automation | 49 | Customer Communication |
| 45 | Sales Target & Budget Management | 50 | Data Migration Toolkit |

Plus cross-cutting shared infrastructure: Audit, Search, Import/Export, Multi-Currency,
Localization, Backup/DR, Observability, Security.

**Total building blocks: 50 major modules + 15 core reusable engines (§8) = 65**, plus the
~30 granular POS/SaaS features itemized in §38 (checklist) that ride on top of these
modules rather than being modules themselves (e.g. Barcode Label Designer rides on
Product & Catalog + Hardware Integration).

---

## 10. Platform & Core Module Specifications

### 10.1 Platform & SaaS Management
Platform Admin sees: total/active/trial/suspended tenants, total users/branches/POS, daily
transactions, monthly/subscription revenue, system health. Plans (Starter/Business/Enterprise)
gate: user limit, branch limit, warehouse limit, POS limit, storage, API limit, AI usage,
reports, industry modules.

Subscription lifecycle: `Trial → Active → Renewal → Past Due → Grace Period → Suspended → Cancelled`

### 10.2 Tenant / Company Management
Tenant info: company name, logo, business type, address, phone, email, website, country,
currency, timezone, language, tax config, subscription plan. Multi-company support for
enterprise accounts. Business-type selection at onboarding auto-enables relevant modules.

### 10.3 Branch / Warehouse / Device
```
Company → Branch → Warehouse → Bin/Rack → POS
```
Branch: address, contact, manager, warehouse, POS, employees, working hours, currency,
tax config, invoice numbering. Head office can: monitor sales/inventory, control pricing,
compare branches, control purchase, monitor employees.

### 10.4 Product & Catalog
**Fields:** name, SKU, barcode, category, subcategory, brand, manufacturer, unit, purchase
price, cost price, selling/wholesale/dealer/distributor price, min/max price, tax, supplier,
images, description, variants, batch, expiry, serial number, warranty.

**Product types:** Simple, Variable, Service, Bundle, Kit, Recipe, Batch-controlled, Serialized, Weighted.

**Variants example:**
```
T-Shirt → Size: S/M/L/XL × Color: Red/Blue/Black
```
Each variant can have its own SKU/barcode/price/stock.

### 10.5 Pricing & Promotion Engine
**Price lists:** Retail, Wholesale, Dealer, Distributor, Branch-specific, Customer-specific,
Customer-group, Quantity, Time-based, Promotional, Minimum selling, Cost-plus, Currency-specific.

```
Retail = ৳100 | VIP = ৳95 | Wholesale 10+ = ৳90 | Distributor 100+ = ৳85
```

**Promotions:** percentage, fixed, Buy X Get Y, bundle, combo, category/product/branch/
customer-group discount, time-based, happy hour, coupon/promo code. Conflicting rules resolved
via a priority engine.

### 10.6 Customer & CRM
**Profile:** name, phone, email, address, customer group, credit limit/period, opening
balance, current due, loyalty points, membership, wallet, store credit, purchase history,
complaints, notes.

**Segmentation:** VIP, Regular, Wholesale, Corporate, New, Inactive, High-value, At-risk.

**Customer Intelligence (AI-assisted):** lifetime value, average order value, purchase
frequency, last purchase, churn probability, preferred products/branch.

### 10.7 Supplier Management
**Profile:** company, contact, phone, email, address, VAT info, payment terms, credit limit,
opening balance. **Tracked:** purchase history, ledger, outstanding, payments, returns,
rebate, delivery performance, quality, defect rate. AI supplier scoring (price, delivery,
quality, defect rate, return rate, reliability, payment terms) — e.g. `Supplier Score: 87/100`.

### 10.8 POS & Checkout Engine
```
┌───────────────────────────────────┐
│ Search / Barcode                  │
├──────────────┬────────────────────┤
│ Categories   │ Cart               │
│ Products     │ Items / Discount   │
│ Quick Items  │ Tax / Total        │
├──────────────┴────────────────────┤
│ Hold | Customer | Pay | Print     │
└───────────────────────────────────┘
```
**Product selection:** barcode scan, search, quick/category buttons, favorites, variants,
weight/serial/batch products. **Cart:** quantity, discount, tax, service charge, delivery
fee, tips, round-off, price override (with approval), customer assignment.
**Transaction ops:** hold, resume, draft, suspend, cancel, void, return, refund, exchange, partial refund.

**Checkout flow:**
```
Scan Product → Add Cart → Customer (optional) → Apply Promotion → Calculate VAT →
Calculate Discount → Select Payment → Confirm Sale → Create Invoice → Update Inventory →
Create Accounting Entry → Print/Send Receipt
```
All of the above happens inside **one atomic transaction**.

### 10.9 Payment & Collection Engine
**Methods:** Cash, Card, Bank, bKash, Nagad, Rocket, Payment Gateway, Customer Credit,
Gift Card, Wallet, Store Credit.

**Interface (provider-agnostic):**
```
createPayment() / verifyPayment() / getPaymentStatus() / refundPayment() / cancelPayment()
```

**Split payment** — one invoice, multiple methods, all linked to the same invoice:
```
Invoice = ৳10,000 → Cash ৳3,000 + Card ৳4,000 + bKash ৳3,000
```

**Payment allocation** — one payment can apply against multiple invoices:
```
Payment ৳50,000 → Invoice A 20,000 + Invoice B 15,000 + Invoice C 15,000
```

**Collection module** (field collections, separate from POS payment): collection target,
collector, customer, invoice, method, receipt, schedule, partial collection, outstanding,
collector performance. Offline collection should be supported.

### 10.10 Sales Management
Sources: POS, Online, Sales Order, Quotation, Delivery, Wholesale, Marketplace.

Status: `Draft → Confirmed → Partially Paid → Paid → Partially Delivered → Completed → Cancelled → Returned`

### 10.11 Quotation & Sales Order
**Quotation lifecycle:**
```
Draft → Sent → Customer Review → Accepted/Rejected → Sales Order → Invoice → Payment
```
Features: quotation #, customer, product/service, qty, price, discount, VAT, terms,
validity, notes, attachments, approval, revision/version history, PDF/Email/Print,
convert-to-order/invoice.

**Sales Order lifecycle:**
```
Quotation → Sales Order → Stock Reservation → Picking → Delivery → Invoice → Payment
```
Supports: partial fulfillment, backorder, delivery schedule, approval, cancellation.

### 10.12 Invoice Engine
Types: Tax, Standard, Proforma, Recurring, Credit, Export, Wholesale, Installment.
Output: A4, Thermal, PDF, QR, digital signature, custom template, logo, terms & conditions.
Invoice template configurable per tenant.

### 10.13 Credit & Collection Management
```
Credit Limit / Credit Period / Opening Due / Current Due / Overdue / Aging / Payment History / Credit Hold
```
**Aging buckets:** Current · 1–30 · 31–60 · 61–90 · 90+ days.
Every new credit sale checks: `Available Credit = Credit Limit − Current Due`.

### 10.14 Installment Management
```
Down Payment / Finance Amount / Installment Count / Weekly/Monthly/Custom Frequency /
Interest / Processing Fee / Late Fee / Grace Period / Due Date / Partial Payment /
Advance Payment / Early Settlement / Rescheduling / Waiver / Overdue
```
**Example:**
```
Sale = ৳120,000 | Down Payment = ৳20,000 | Financed = ৳100,000
10 Installments = ৳10,000/month → system auto-generates the schedule
```
Must integrate automatically with: customer ledger, AR, payments, accounting, notifications.

### 10.15 Commission Engine
**Agent types:** Sales agent, Sales rep, Commission agent, Referral partner, Distributor.
**Commission types:** Percentage, Fixed, Product, Category, Profit-based, Target-based,
Slab-based, Collection-based.
```
0–100,000 → 2% | 100,001–300,000 → 3% | 300,001+ → 5%
```
**Lifecycle:** `Sale → Calculated → Pending → Approved → Payable → Paid`
If a sale is returned/cancelled, commission **must be reversed**.

### 10.16 Inventory & Warehouse Engine
**Operations:** opening stock, receiving, issue, adjustment, transfer, stock count,
reservation, reconciliation, write-off.
**Stock statuses:** On Hand, Reserved, Available, In Transit, Damaged, Expired, Consignment.
**Costing:** FIFO, FEFO, Weighted Average, Standard Cost where applicable (configurable per industry).
**Advanced:** min/max stock, reorder point, safety stock, stock aging, dead stock,
slow/fast-moving, expiry risk, overstock detection.

**Stock movement is source-traceable**, e.g. `SALE-INV-1001 → stock -2`. Every movement
records: product, warehouse, quantity, before/after quantity, source, reference, user, timestamp.

**Warehouse:** multiple/central/branch warehouses, rack/bin/shelf, inter-branch transfer:
```
Warehouse A → Transfer Request → Approval → Shipment → Receive → Warehouse B
```

**Batch/Expiry/Serial:** batch number, mfg/expiry date, cost, selling price, quantity;
FEFO (First Expiry First Out); serial/IMEI tracking for electronics with full purchase→sale→warranty→repair→return history.

**Landed Cost** (imports/wholesale):
```
Purchase Cost + Shipping + Customs + Insurance + Handling + Transport + Other = Landed Cost
```
Allocatable across products.

**Consignment Inventory** — supplier-owned stock physically stored at the business;
track owner, quantity, sale, remaining stock, supplier settlement, commission, return.

### 10.17 Purchasing
```
Purchase Requisition → Approval → Purchase Order → Goods Received (GRN) →
Purchase Invoice → Supplier Payment
```
Supports: partial receiving, purchase return, supplier discount/rebate, supplier comparison, purchase history.

### 10.18 Expense Management
Expense category, entry, recurring expense, branch expense, petty cash, approval,
receipt attachment, expense report.

### 10.19 Cash Register & Shift
```
Open Shift → Opening Cash → Sales → Cash In → Cash Out → Expenses → Refunds →
Close Shift → Expected Cash vs Actual Cash → Variance → Approval
```
Cash variance must always be recorded and auditable (manager approval if it exceeds threshold).

### 10.20 Accounting Engine (Double-Entry)
Modules: Chart of Accounts, Journal, Ledger, General Ledger, AR, AP, Cash, Bank, Revenue,
Expense, COGS, Inventory, Trial Balance, P&L, Balance Sheet, Cash Flow.

**Automatic accounting from business events:**
```
Sale:      Debit Cash/Receivable | Credit Sales Revenue | Credit VAT Payable
COGS:      Debit COGS | Credit Inventory
Purchase:  Debit Inventory + Input VAT | Credit Supplier Payable
```
Every financial entry must be traceable to its source transaction. POS/ERP transactions
generate journal entries **automatically** — never require manual bookkeeping for standard flows.

**Credit Note / Debit Note** — credit note reduces customer payable; debit note is a
supplier/customer accounting adjustment. Neither replaces the reversal/audit requirement.

### 10.21 VAT / Tax Engine (Bangladesh NBR)
Configurable, **version-controlled** tax engine. Supports: VAT-inclusive/exclusive, VAT
rates, tax rules, customer/supplier VAT info, sales/purchase VAT, branch/consolidated VAT,
VAT reports, Mushak workflows (incl. Mushak 6.3 where applicable).

```
VAT Rule v1 → Effective Date → VAT Rule v2   (old transactions keep their original rule)
```

> ⚠️ **All production VAT/NBR workflows and Mushak forms must be reviewed against the
> currently applicable regulations by a qualified Bangladesh VAT professional before
> production deployment.** Tax rules must never be hard-coded into core business logic.

### 10.22 Return / Refund / RMA / Warranty
Return is its **own transaction type**, never a simple invoice delete:
```
Original Invoice → Return Request → Validation → Return Stock → Refund →
Accounting Reversal → Commission Reversal → Loyalty Reversal
```
**RMA:** RMA number, return reason, inspection, defect classification, warranty validation,
repair/replacement/refund/store credit, restocking, warranty history.
**Warranty:** warranty start/end/type, linked to serial/IMEI; claim flow:
`Claim → Inspection → Approved → Repair/Replace → Complete`.

### 10.23 Loyalty / Membership / Wallet / Gift Card
**Loyalty:** points (e.g. ৳100 = 1 point), earn/redeem/expiry, tiers (Bronze/Silver/Gold/VIP), referral, coupon, cashback.
**Wallet:** add money, deduct, cashback, refund, store credit, promotional credit — always with a transaction ledger.
**Gift Card:** physical/digital, barcode/QR, balance, expiry, partial redemption, reload, disable, transaction history.

### 10.24 HRM
Employee, department, designation, attendance (present/absent/late/leave/overtime), shift,
leave, payroll, commission integration, sales target, performance. Payroll integration is future-ready.

### 10.25 Appointment/Booking & Queue Management
Generic booking engine for Salon/Spa/Service center/Repair/Consultant:
```
Service → Staff → Calendar → Available Slot → Booking → Payment
```
Queue management: token, queue, counter, staff, service status, display screen, estimated wait time.

### 10.26 Approval & Workflow Engine (reusable, configurable)
```
Discount > 10% → Manager Approval
Refund > ৳50,000 → Owner Approval
Purchase > ৳500,000 → Director Approval
Credit Limit > ৳1,000,000 → Finance Approval
```
Supports: conditions, roles, approval levels, rejection, comments, escalation, timeout, notifications.

### 10.27 Business Rule Engine
```
IF stock < reorder_point THEN create purchase recommendation
IF discount > 20% THEN manager approval
IF customer tier = VIP THEN discount = 5%
IF customer due > credit limit THEN credit sale blocked
```

### 10.28 Document Management & Digital Signature
Attach documents to: customer, supplier, invoice, purchase, employee, warranty,
prescription, delivery, expense. Support upload, preview, versioning, access control,
expiry, audit. Digital signature for: customer signature, delivery signature, service
completion, purchase approval, contract, invoice confirmation.

### 10.29 Notification Engine
**Channels:** in-app, push, email, SMS, WhatsApp.
**Events:** low stock, expiry, installment due, overdue, quotation expiry, approval
required, payment, commission, sync failure, branch offline, sales target, suspicious
transaction, new order.

### 10.30 Franchise Management
Franchise, franchise branch, franchise fee, royalty, central pricing/menu, central
inventory, sales, settlement, commission, franchise reporting.

### 10.31 Task Management
Businesses can create tasks, assignments, deadlines, priorities, comments, attachments,
status, approval — e.g. *"Check all products expiring within 30 days."* Tasks can attach
to any entity (customer, invoice, repair ticket, purchase order) and be assigned to a role/user.

### 10.32 System / Global Settings Engine
Central, tenant-scoped configuration — **never hard-coded**. Organized into: Company,
Branch, POS, Tax, Currency, Invoice, Payment, Inventory, Notifications, Users, Roles,
Integrations, AI, Subscription. Every business rule that can plausibly change — discount
limit, default credit limit, invoice numbering pattern, rounding rule, stock policy,
return policy, default commission rule, approval thresholds — lives here, not in code.

### 10.33 Tenant Onboarding & Setup Wizard
```
Register → Verify Email/Phone → Choose Business Type → Company Setup → Branch Setup →
Warehouse Setup → Tax Setup → Payment Setup → Import Products → Opening Stock →
Create Users → Assign Permissions → Configure POS → Open Shift → Start Selling
```
Business-type selection during onboarding auto-enables the matching industry extension
and feature flags — see §11.9 Example Industry Configuration.

### 10.34 Marketing Automation
Trigger-based campaigns, distinct from the core Notification Engine (§10.29):
```
Customer inactive 30 days → Marketing Trigger → Coupon → SMS / Email / WhatsApp / Push
```
Other triggers: birthday, anniversary, first purchase, high-value purchase, abandoned
cart, expiry reminder, loyalty milestone. Feeds into the Promotion Engine (§10.5).

### 10.35 Sales Target & Budget Management
**Sales Target** — per employee/agent/branch, e.g. `Monthly Target ৳1,000,000, Achieved
৳750,000 → 75% achieved` on dashboard; integrates with the Commission Engine (§10.15).
**Budget** — per branch/department/category/period, actual-vs-budget variance, e.g.
`Budget ৳500K, Actual ৳620K → Variance +120K`. Enterprise-tier feature.

### 10.36 SaaS Admin Panel & Platform/Tenant Monitoring
Platform administrators need: tenant list & status, subscription, revenue, usage, active
users/devices, storage, API usage, support tickets, system health, feature flags,
billing, audit. **Per-tenant usage monitoring:** users, branches, POS, transactions,
storage, API calls, AI usage, active devices. Support admins get **audited, controlled**
access to investigate tenant-specific issues — never unrestricted cross-tenant access.

### 10.37 Remote POS Management (Head Office → Device)
Head office may: force logout, lock POS, disable device, force sync, push
configuration/pricing/promotion, monitor sync status, check device health. Builds
directly on the Device Management data captured in §13 (Offline Sync).

### 10.38 Real-Time Engine
Where a workflow needs live updates, use WebSocket/SSE/event streaming instead of polling:
```
Restaurant: KOT → KDS   |   POS: Order → Kitchen   |   Management: New Order → Dashboard
```

### 10.39 PWA / Client Architecture
POS clients should be offline-capable by design. Desktop/tablet: PWA or dedicated POS
client. Mobile: separate lightweight apps for Manager, Sales, Delivery use cases. KDS:
dedicated browser/tablet interface.

### 10.40 Customer Communication
Invoice SMS, payment receipt, due reminder, installment reminder, promotion, loyalty
notification, delivery update — routed through the Notification Engine (§10.29), but
with mandatory **consent/opt-out tracking per customer per channel**.

### 10.41 Data Migration Toolkit
For businesses switching from an existing POS: `Upload (CSV/Excel/API/DB dump) → Map
Columns → Validate → Preview → Import → Error Report`. Distinct from routine Import/Export
(§21) — one-time, guided, higher tolerance for manual correction.

---

## 11. Industry Extension Modules

### 11.1 Restaurant
Dine-in, takeaway, delivery, tables, floors, seats, waiters, split/merge/transfer table,
modifiers, add-ons, combo, KOT, KDS, kitchen/bar printer, QR menu, self-order, kiosk, recipe, food cost.

**Table states:** `Available → Reserved → Occupied → Ordering → Preparing → Bill Requested → Payment Pending → Cleaning`

**KOT/KDS routing:**
```
POS → Order Router → Kitchen / Grill / Bar / Dessert
KDS status: New → Accepted → Preparing → Ready → Served
```

**Recipe & Food Costing:** e.g. Burger = Bun + Beef + Cheese + Sauce + Vegetables. Selling
one burger auto-consumes ingredients per recipe; food cost/margin calculated automatically.

### 11.2 Pharmacy
Medicine master (generic, brand, manufacturer, strength, dosage), batch, expiry, MRP,
purchase price, prescription, doctor, patient/customer, FEFO, expiry alerts, near-expiry
reporting, medicine return. Pharmacy workflows stay configurable and must **not** be used
to infer clinical advice.

### 11.3 Retail
Barcode, size, color, variants, brand, promotions, loyalty, gift card, return, exchange,
customer credit, sales target, commission.

### 11.4 Grocery / Supermarket
Weight products, PLU, variable barcode, weighing-scale integration, carton/box/pack/piece,
unit conversion, expiry, batch, promotions, loyalty, shelf labels.

### 11.5 Wholesale & Distribution
B2B customer, dealer/distributor pricing, price lists, credit limit, sales order, delivery,
sales representative, territory, agent commission, collection, route sales, bulk discount.

### 11.6 Manufacturing / Bakery
BOM, recipe, raw materials, production order, batch production, yield, wastage, finished
goods, production costing, production inventory:
```
Raw Materials → Production Order → Consumption → Finished Product → Finished Stock
```

### 11.7 Salon & Spa
Appointment, calendar, staff schedule, services, packages, membership, customer history,
commission, chair/room, product sales, service sales, loyalty.

### 11.8 Repair & Service Center
Service ticket, customer device, serial/IMEI, problem, estimate, technician, spare parts,
labor, repair status, warranty, payment:
```
Received → Inspection → Estimate → Approved → Repairing → Quality Check → Ready → Delivered
```

### 11.9 Example Industry Configuration (Feature-Flag Presets)

At onboarding (§10.33), the selected business type pre-sets these feature flags — all
remain individually toggleable afterward via §10.32 System Settings:

| Feature | Restaurant | Pharmacy | Wholesale |
|---|---|---|---|
| POS | ✓ | ✓ | ✓ |
| Inventory | ✓ | ✓ | ✓ |
| Recipe / Food Cost | ✓ | ✗ | ✗ |
| KOT / KDS / Tables | ✓ | ✗ | ✗ |
| Batch / Expiry / FEFO | optional | ✓ | optional |
| Prescription Workflow | ✗ | ✓ | ✗ |
| Sales Order / B2B Pricing | ✗ | ✗ | ✓ |
| Credit / Commission / Delivery | optional | optional | ✓ |
| Accounting | ✓ | ✓ | ✓ |

---

## 12. Omnichannel & E-commerce

OmniPOS connects: POS, Website, Mobile App, Kiosk, QR Ordering, Marketplace, Social
Commerce, Phone Orders — all channels share Product, Price, Customer, Inventory, Order,
Payment, Delivery as one source of truth.

```
Online Order → OmniPOS → Inventory Reservation → Payment → Delivery → Accounting
```

**Marketplace Integration** — adapter architecture; connectors for Shopify, WooCommerce,
eBay, Amazon, Facebook Commerce, custom marketplaces. **Never** hard-code marketplace logic into core modules.

**Kiosk Mode:** `Customer → Browse → Cart → Payment → Order → Receipt` (routes to Kitchen/KDS for restaurants).

---

## 13. Offline-First Architecture & Sync Engine — **P0 requirement**

```
POS Application → Local Database → Offline Transaction Queue → Internet Available →
Sync Engine → API → Validation → Central Database → ACK → Local Sync Confirmation
```

**Cached locally:** products, prices, customers, tax config, promotions, branch config, POS config.

**Every offline transaction has:** UUID, Tenant ID, Device ID, Branch ID, Created At, Local
Sequence, Idempotency Key, Sync Status (`PENDING → SYNCING → SYNCED / FAILED / CONFLICT`).

**Idempotency:** duplicate submission of the same transaction must be ignored server-side —
no duplicate invoice or stock movement is ever created.

**Sync Conflict Resolution** — strategy defined **per entity type**:
- Simple attribute edits (e.g. customer name) → last-write-wins is acceptable.
- Stock → **never** overwritten; aggregate movement deltas (`Sale A -2, Sale B -3` → server sums).
- Financial transactions → **never** silently overwritten.

**Device Management:** track device ID/type, POS, branch, user, OS, app version, last
online/sync, IP, status. Head office can remotely force-logout, lock device, disable
device, force sync, push config/pricing/promotion, monitor sync/device health.

---

## 14. Hardware Integration (abstraction layer, never coupled to business logic)

Barcode scanner, thermal printer, A4 printer, cash drawer, customer display, weighing
scale, label printer, KDS, kiosk, QR scanner.

```
OmniPOS → Hardware Service → Printer/Scanner/Cash Drawer/Scale/Customer Display Drivers
```

---

## 15. Reporting & Business Intelligence

**Sales:** daily/monthly, product, category, branch, employee, agent, payment method, customer.
**Inventory:** stock, valuation, movement, aging, dead stock, low stock, expiry, batch, serial.
**Finance:** P&L, Balance Sheet, Cash Flow, AR, AP, Expense.
**Commission:** agent sales, earned, payable, paid.
**Installment:** financed, collected, outstanding, overdue, due today/this week.

**BI must be architecturally separate from operational reporting** so heavy reports never
slow down POS operations:
```
Transactional Database → Event Stream → Analytics Pipeline → Data Warehouse → BI → AI
```

---

## 16. AI Intelligence Layer (separate platform layer, permission-scoped)

- **Demand Forecasting** — product/branch/ingredient/seasonal demand.
- **Inventory AI** — reorder recommendation, overstock/dead-stock/expiry-risk detection.
- **Sales AI** — forecasting, best/slow products, customer trends, branch performance.
- **Profit AI** — margin analysis, cost increase, discount impact, profit leakage
  (e.g. *"Revenue +4%, COGS +11%, Discount +7% → gross margin declined"*).
- **Fraud AI** — suspicious refunds/discounts, cash variance, stock manipulation, unusual
  employee behavior (alert only, never automatic punishment).
- **Customer AI** — high-value customers, churn risk, purchase patterns, cross-sell, LTV.
- **Supplier AI** — supplier scoring (price/delivery/quality/defect/return/reliability).
- **Procurement AI** — explainable purchase recommendations, e.g.:
  ```
  Milk 1L: avg daily sales 25, current stock 80, lead time 7d, safety stock 50
  → Recommended purchase: 145 units
  ```
- **AI Business Copilot** — natural-language Q&A: "What were today's sales?", "Which
  branch is performing worst?", "Which products should I purchase tomorrow?", "Show
  overdue customers.", "Why is profit down?", "Which agent earned the highest commission?"
- **AI Action System** — AI suggests actions requiring human confirmation, e.g.
  `[Create Purchase Requisition]`, `[Send Reminder]`. Financial actions always require authorization.
- **AI Permission Model** — AI queries flow through the *same* permission check as the
  app user; a cashier without profit-visibility permission cannot get profit data from AI, ever.
  ```
  User → Permission Check → Tenant Scope → Branch Scope → Data Retrieval → AI → Response
  ```

---

## 17. Audit System

Every critical action stores: Tenant, User, Device, Branch, Timestamp, Entity, Action, Old
Value, New Value, IP, Metadata/Reason.

**Must be audited:** invoice edit, price change, discount, refund, void, stock adjustment,
payment, credit limit change, commission, installment, VAT, permission change.

Financial records are **never deleted silently** — use reversal/correction workflows.

---

## 18. Database Architecture

**Core entity domains:**
```
Identity: tenants, users, roles, permissions, sessions, devices
Organization: companies, branches, warehouses, terminals
Catalog: products, categories, brands, variants, units, price_lists
Sales: sales, sale_items, invoices, invoice_items, payments, returns
Inventory: stock, stock_movements, batches, serials, transfers
Purchase: purchase_orders, goods_receipts, purchase_invoices
Finance: accounts, journals, ledger_entries
CRM: customers, customer_groups, loyalty
Operations: deliveries, commissions, installments
Audit: audit_logs
```

**Every important table must have:** primary key, tenant_id, branch_id (where applicable),
created_at/updated_at, created_by/updated_by, status, proper indexes, foreign keys, unique
constraints. Use UUIDs for distributed/offline-safe identifiers where appropriate.

**Tenant isolation** must be enforced at the database/index/constraint/query layer, not
just application-level filtering.

**Transaction integrity** — a confirmed sale must atomically create: Sale + Sale Items +
Stock movement/reservation + Invoice + Payment + Accounting Journal + Customer Ledger +
Commission + Loyalty + Audit, inside `BEGIN...COMMIT`, with rollback/compensation on failure
unless a workflow is explicitly designed as asynchronous and recoverable.

**Event-Driven Architecture** — keeps modules loosely coupled:
```
SALE_COMPLETED → EVENT BUS → Inventory, Accounting, Commission, Loyalty, Notification, Analytics, AI
```

---

## 19. API Architecture & Webhooks

**Core API domains:**
```
/auth /tenants /users /roles /branches /warehouses /products /customers /suppliers
/sales /orders /quotations /invoices /payments /inventory /purchases /installments
/commission /accounting /tax /reports /delivery /notifications /ai
```
API versioning: `/api/v1`, `/api/v2`.

**Webhook events:** `invoice.created, invoice.paid, order.created, order.completed,
payment.received, stock.low, customer.created, installment.due, commission.generated,
sync.failed, delivery.completed`. Webhook system supports retry, signature verification,
event logs, failure monitoring, idempotency.

---

## 20. Search Architecture

Global search across: product (SKU/barcode/name/brand/category), customer (phone/name),
supplier, invoice #, order, quotation, payment, serial, batch, employee, repair ticket.
Must stay fast at large catalog/dataset scale (e.g. searching `INV-2026-000102` surfaces
invoice, customer, payment, stock movement, accounting, and audit records together).

---

## 21. Import/Export, Bulk Operations & Data Migration

**Import:** products, customers, suppliers, opening stock, price lists, employees, opening
balances (CSV/Excel), with a validation → preview-errors → confirm → import flow. Large
imports run asynchronously.

**Export:** Excel, CSV, PDF (sales, inventory, customers, accounting, reports).

**Bulk operations:** bulk edit product/price, bulk import, bulk category assignment, bulk
stock adjustment, bulk customer update, bulk export.

**Migration wizard** (from an existing POS): `Upload → Map Columns → Validate → Preview → Import → Error Report`.

---

## 22. Multi-Currency & Localization

**Multi-currency:** base currency, transaction currency, exchange rate + history, FX
gain/loss, currency-specific pricing, multi-currency payment. Historical transactions keep
an **immutable** exchange rate.

**Localization:** English, বাংলা, Arabic (+ more later); covers currency, number format,
date format, timezone, fiscal year, tax format. UI translation and business-data
translation are separate concerns.

---

## 23. SaaS Subscription, Feature Flags & Customization

**SaaS Billing:** Trial, Plan, Subscription, billing cycle, branch/user/POS limits, feature
limits, usage tracking, invoice, payment, renewal, suspension, upgrade, downgrade.

**Feature Flags** — per-tenant module toggles:
```
Tenant A: Restaurant ON | Pharmacy OFF | Accounting ON | AI ON | Manufacturing OFF
```

**Custom Fields** (text/number/date/boolean/dropdown/multi-select/file/currency) applicable
to Customer, Product, Supplier, Employee, Invoice, Repair Ticket.

**Custom Form Builder** — e.g. a Repair Intake form (Device Type, IMEI, Problem, Condition,
Accessories, Customer Signature).

---

## 24. Security Architecture & Testing

**Priority order:** Tenant isolation → Authentication → Authorization → Data validation →
API security → Audit → Encryption → Rate limiting → Secure file uploads → Backup security.

**Security testing checklist:** authentication testing, authorization testing, tenant
isolation testing, SQL injection, XSS, CSRF (where applicable), API abuse, file upload
vulnerabilities, session hijacking/security, IDOR, JWT/session issues, privilege escalation.

---

## 25. Performance, Caching, Background Jobs & Scalability

**Performance targets:** near-instant product search, instant cart ops, fast payment/
receipt, immediate offline sale, background sync. Heavy reports must **not** query the
live transactional DB directly at scale — use read models/aggregates/analytics storage.

**Background/async jobs:** email, SMS, WhatsApp, report generation, PDF generation, AI
processing/forecasting, notifications, sync processing, webhook delivery, large
import/export, marketplace sync. **POS sale itself is never queue-dependent** — the core
transaction is synchronous/locally transactional.

**Caching:** product catalog, price, tax config, permissions, branch settings, customer
quick-lookup. **Financial source-of-truth is never cached.**

**Scalability path:** design for 1 → 10 → 1,000 → 10,000+ tenants. A **modular monolith +
background workers** is a practical starting architecture; microservices are not mandatory day one.

---

## 26. Backup, Disaster Recovery & Observability

**Backup/DR:** automated backups, point-in-time recovery, database replication, backup
verification, disaster recovery plan, tenant/branch restoration. Offline devices need a
local backup strategy + persistent sync queue.

**Observability:** API latency, error rate, DB health, queue health, sync health,
notification failures, CPU/memory/storage, uptime — shown on an admin health dashboard
(API/DB/Queue/Sync/Notifications/Storage indicators).

---

## 27. UI/UX Principles

Clean, modern, fast, responsive, accessible, consistent, keyboard-friendly, touch-friendly.
Avoid unnecessary animation; every screen must map to a real business workflow.

**Desktop:** Sidebar → Top Nav → Page Header → Filters → Data Table/Dashboard. Prioritizes productivity.

**POS:** prioritizes speed — barcode-first, touch-first (large buttons), minimal clicks.
Configurable keyboard shortcuts, e.g.:
```
F1 Search | F2 Customer | F3 Discount | F4 Payment | F5 Hold | F6 Resume | F7 Return
```

**Offline UI:** persistent, non-intrusive status indicator — `ONLINE / OFFLINE / SYNCING /
SYNC ERROR` — plus a pending-transaction counter, e.g. "7 transactions pending synchronization."

**Mobile:** dashboard, sales monitoring, inventory, orders, customers, notifications,
approvals, AI assistant — prioritizes management/quick actions.

**Restaurant UI:** visual floor plan, table status, waiter assignment, order panel,
modifier selection, KOT status, KDS.

**Pharmacy UI:** fast medicine search, batch selection, expiry visibility, FEFO
recommendation, customer/patient info, prescription workflow.

**Customer-facing display:** product/qty/price/discount/VAT/total live view + QR payment at checkout.

---

## 28. Real-World Sale Walkthroughs

### 28.1 General Retail Sale
```
Barcode Scan → Product Info → Pricing Engine → Promotion Check → VAT Calculation →
Inventory Validation → Cart → Customer Select → Payment → Sale Created → Invoice Created →
Inventory Decreased → Accounting Journal → Customer Ledger Updated → Loyalty Points →
Commission Calculated → Audit Log → Analytics Event → Receipt Printed
```

### 28.2 Restaurant Sale
```
Table 12 → Waiter → Order → KOT → Kitchen → KDS → Food Ready → Serve → Bill → Payment
```
Simultaneously: Ingredient Stock ↓, Food Cost ↑, Revenue ↑, Accounting ↑, Table → Available.

### 28.3 Pharmacy Sale
```
Medicine Search → Prescription → Patient → Batch Selection → FEFO → Price → VAT →
Payment → Invoice
```
Then: Batch Stock ↓, Expiry Tracking, Accounting, Audit, Customer History updated.

### 28.4 Wholesale/Dealer Order
```
Quotation → Dealer Price → Sales Order → Credit Validation → Stock Reservation →
Approval → Picking → Delivery → Invoice → Credit Ledger → Collection
```

---

## 29. Development Priority

**P0 — Foundation (must exist before anything else):** Multi-tenancy, Authentication,
RBAC, Branch, Warehouse, Product, Customer, Supplier, POS, Sales, Invoice, Payment,
Inventory, Offline POS, Sync, Cash Register, Audit, API, Device Management, Basic Accounting.

**P1 — Commercial Core:** Purchase, Quotation, Sales Order, Credit, Collection,
Installment, Commission, Accounting (full), VAT, Return/RMA, Pricing, Promotion, Loyalty,
Delivery, Approval.

**P2 — Industry:** Restaurant, Pharmacy, Grocery, Retail, Wholesale, Manufacturing, Salon,
Repair, Franchise, HR, Warranty, Serial/IMEI, Consignment, Landed Cost.

**P3 — Omnichannel:** E-commerce, Mobile, Kiosk, QR ordering, Marketplace, Social
Commerce, Payment orchestration, Marketing automation.

**P4 — Intelligence:** AI Copilot, Forecasting, Procurement AI, Customer AI, Supplier AI,
Fraud AI, Advanced BI, Data warehouse, Natural language actions, Advanced automation.

---

## 30. Development Phases (sequential — never skip ahead)

```
1  Architecture            10 Purchase                 19 Notifications
2  Database                11 Accounting                20 AI
3  Authentication           12 VAT                        21 SaaS Billing
4  RBAC                     13 Restaurant                 22 Omnichannel
5  Master Data              14 Pharmacy                   23 QA / Testing
6  Inventory                15 Retail/Grocery/Wholesale   24 Production Deployment
7  POS                      16 Offline Sync
8  Sales                    17 Reporting
9  Credit & Installment     18 Commission (settlement)
```

**After every phase:** explain architecture → identify dependencies → create files/modules
→ implement production-quality code → run tests → fix errors → update documentation →
verify existing modules still work → never replace real logic with mocks → maintain
backward compatibility.

---

## 31. Testing Strategy & Critical E2E Scenarios

**Test types per module:** Unit (business logic) → Integration (module-to-module) → API
(request/response) → E2E (full workflow) → Offline → Security → Performance.

**Standard E2E chain:**
```
Product → Purchase → Stock → Sale → Payment → Accounting → Commission → Loyalty → Report
```

**Mandatory critical E2E tests:**
1. Offline sale → reconnect → sync → **no duplicate**.
2. Sale → return → inventory/accounting reversal correctness.
3. Credit sale → payment → customer due updates correctly.
4. Installment → partial payment → overdue detection.
5. Commission → sale return → commission reversal.
6. Restaurant order → KOT → KDS → payment.
7. Pharmacy batch → FEFO selection → expiry handling.
8. Purchase → GRN → stock → supplier due.
9. Multi-tenant isolation — Tenant A can never see Tenant B's data.
10. Cashier permission restriction (cannot refund/void without permission).

**Offline stress test:**
```
Online → Disconnect → Create 100 sales offline → Reconnect → Sync → Verify server state
(no duplication, no data loss)
```

**Security test suite:** SQL injection, XSS, CSRF (where applicable), broken access
control, IDOR, tenant escape, JWT/session issues, rate limiting, file upload
vulnerabilities, privilege escalation.

---

## 32. Definition of Done / Acceptance Criteria Template

A feature is **not complete** until: UI implemented · API implemented · DB implemented ·
Validation implemented · Permissions implemented · Audit implemented where required ·
Error handling implemented · Tests written · Offline behavior considered · Documentation
updated · Existing features re-verified.

**Acceptance-criteria example (Inventory Transfer):**

> **Given** Dhaka warehouse has 100 units.
> **When** a user transfers 20 units to Chittagong warehouse.
> **Then** source stock = 80, destination stock = +20 *after receipt confirmation*, a
> transfer record exists with user + timestamp, any accounting impact is posted, a
> notification is sent, and — if performed offline — the transfer is queued and syncs
> without creating a duplicate.

Every module in Section 10–11 should get its own Given/When/Then set before implementation.

---

## 33. AI Coding Agent — Master Development Prompt

```
You are a senior software architect, product engineer, database architect, DevOps
engineer, security engineer, QA engineer, UI/UX designer and AI systems engineer.

Your task is to design and build OmniPOS, a production-grade multi-tenant SaaS platform
for POS, ERP, CRM, inventory, accounting, VAT, installment, commission, delivery,
business intelligence and AI.

Do NOT build a simple demo POS. Do NOT create mock business logic.
Build a scalable long-term SaaS architecture capable of supporting thousands of tenants,
branches, warehouses, users, POS devices and transactions.

CORE RULES:
1. Multi-tenant from day one.               13. Full audit trail.
2. Strict tenant isolation.                  14. Double-entry accounting.
3. Offline-first POS.                        15. Configurable tax engine.
4. Automatic synchronization.                16. Configurable pricing engine.
5. Idempotent transactions.                  17. Configurable workflow engine.
6. Multi-company.                            18. AI must respect permissions.
7. Multi-branch.                             19. Financial records must be auditable.
8. Multi-warehouse.                          20. Never hard-code industry rules into core.
9. Multi-device.                             21. Never assume internet availability.
10. API-first.                               22. Never allow cross-tenant data access.
11. Modular architecture.                    23. Never silently modify financial transactions.
12. Industry extensions.                     24. Do not break existing modules when adding features.

DO NOT IMPLEMENT THE ENTIRE OMNIPOS SYSTEM IN ONE STEP.
First analyze architecture and dependencies. Then implement one module at a time.
Before starting each module, inspect the existing codebase and database schema.
Never recreate existing functionality. Never replace working production logic with mocks.
Never create duplicate entities, services, controllers, repositories or tables.
Every new feature must integrate with the existing architecture.
Before modifying a financial, inventory, authentication or synchronization module,
explain the impact and run regression tests.
```

**Required Core Modules to build:** Authentication, Tenant Management, Users, RBAC,
Branch, Warehouse, Device Management, Product, Pricing, Customer, Supplier, POS, Sales,
Quotation, Sales Order, Invoice, Payment, Credit, Collection, Installment, Commission,
Inventory, Purchasing, Expense, Cash Register, Accounting, VAT, CRM, Loyalty, Wallet, Gift
Card, Promotion, Delivery, HRM, Appointment, Workflow, Business Rules, Notifications,
Documents, Audit, Reporting, BI, Offline Sync, Integrations, SaaS Billing, AI.

**Industry Modules to build:** Restaurant, Cafe, QSR, Bakery, Cloud Kitchen, Pharmacy,
Retail, Grocery, Supermarket, Wholesale, Distribution, Electronics, Mobile, Computer,
Clothing, Footwear, Cosmetics, Furniture, Hardware, Book Store, Salon, Spa, Repair,
Service Center, Manufacturing, Franchise.

**Implementation process (never skip order):**
```
Architecture → Database → Authentication → RBAC → Master Data → Inventory → POS → Sales →
Payments → Credit → Installment → Commission → Purchase → Accounting → VAT →
Industry Extensions → Offline Sync → Reporting → AI → SaaS Billing → Testing → Security →
Performance → Deployment
```

---

## 34. AI Coding Agent — Behaviour Guidelines

**Before coding:** inspect the existing repository, understand architecture, identify
existing technologies/dependencies/database/authentication/modules. Do not overwrite
working code blindly.

**When implementing:** follow existing conventions, create reusable services, avoid
duplication, validate input, handle errors, add authorization, add audit where necessary,
add tests, add DB constraints/indexes, document APIs.

**When uncertain:** inspect the existing implementation first; do not invent incompatible
architecture; do not create unnecessary dependencies.

---

## 35. Project Story / Context Prompt (for onboarding an AI agent)

```
We are building OmniPOS, a Bangladesh-focused but globally extensible multi-industry
SaaS business management platform. The goal is not another simple cashier application —
it is a complete business operating system.

A small food cart uses a lightweight tablet POS. A restaurant uses tables, waiters, KOT,
KDS, QR ordering, kiosk. A pharmacy manages batch, expiry, FEFO, prescription workflows.
A retail store manages barcode products, variants, inventory, loyalty, credit. A grocery
store sells weight-based products with PLU and unit conversion. A wholesale distributor
manages quotations, sales orders, credit limits, sales reps, commission agents,
collections, deliveries. A large enterprise manages hundreds of branches from one
centralized dashboard. All of this runs from ONE SaaS platform.

The most important technical characteristic is OFFLINE-FIRST operation: if a POS device
loses connectivity, the business keeps selling; when connectivity returns, transactions
sync automatically without duplication or data loss.

The platform is multi-tenant with strict data isolation per company. Each company may
have unlimited branches/warehouses/users/POS depending on subscription limits.

The system supports quotations, sales orders, invoices, payments, credit sales,
installments, commission agents, sales representatives, inventory, purchasing,
accounting, VAT, CRM, loyalty, delivery, and reporting — plus Bangladesh VAT/NBR
workflows with configurable, versioned tax rules (regulations change over time).

The platform should eventually become an AI-powered business intelligence system:
forecasting demand, flagging slow-moving stock, recommending purchases, detecting
anomalies, analyzing profitability, and answering natural-language business questions.

The system must be modular: reusable core engines + industry-specific extensions —
never separate applications per industry. Every feature must be enable/disable-able per
tenant subscription and business type.

The product must be easy enough for a small shop owner but powerful enough for an
enterprise. The UI is modern, fast, clean, responsive. POS prioritizes speed over visual
complexity. The owner dashboard prioritizes business intelligence.

Never sacrifice data integrity for convenience. Never allow cross-tenant data access.
Never assume internet connectivity. Never hard-code business rules that may change.
Build this as a long-term SaaS product, not a prototype.
```

---

## 36. Known Gaps — Fill Before Coding Starts

The four source drafts (feature inventory level) are thorough and internally consistent,
but they stop short of a fully coding-ready spec. Before an AI agent (or dev team) starts
Phase 1, produce these **per module**:

1. **Screen-by-screen UI spec** (wireframe-level, not just layout ASCII art).
2. **Database ERD + exact table/field definitions** (types, nullability, defaults, FK/unique constraints).
3. **API request/response schemas** (not just endpoint paths — actual payload contracts).
4. **Full permission matrix** — every role × every module × every action (View/Create/Edit/Delete/Approve/Export/etc.), not just illustrative examples.
5. **Workflow state machines** in formal notation for: Sale, Invoice, Quotation, Sales
   Order, Purchase, Installment, Commission, Delivery, RMA, Repair Ticket.
6. **Accounting journal rule table** — exact debit/credit accounts for every transaction
   type (sale, return, purchase, purchase return, expense, payment, installment,
   commission, write-off, transfer, landed cost allocation).
7. **Offline sync rule per entity** — which entities are last-write-wins vs.
   movement-aggregated vs. never-auto-resolved-needs-manual-review.
8. **Acceptance criteria (Given/When/Then)** for every module, not just 1–2 illustrative examples.
9. **Tech stack decision** — backend framework, DB engine, frontend framework, mobile
   approach (native/PWA), infra/hosting, message queue, cache layer. (Intentionally left
   open in the source drafts — must be decided before Phase 1.)
10. **Non-functional targets** — concrete SLA/uptime numbers, expected transaction volume,
    concurrent-user targets, data-retention policy.
11. Legal/compliance items beyond VAT: data privacy handling for customer PII, e-invoicing
    specifics if/when NBR mandates them.

> **Recommendation:** treat this document as the Product/Functional spec, and produce a
> follow-up **"OmniPOS Technical Bible"** — one file per module from Section 10/11 above,
> filled out with items 1–8 — before Phase 3 (Authentication) begins. Do not let an AI
> coding agent invent these details on its own; inconsistent invention across modules is
> exactly what caused this consolidation to be necessary in the first place.

---

## 37. Final Product Architecture & Positioning

```
                         OMNIPOS
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
     PLATFORM             CORE              INDUSTRY
        │                   │                   │
    SaaS Billing          POS              Restaurant
    Tenant                Sales            Pharmacy
    Auth                  Inventory        Retail
    RBAC                  Purchase         Grocery
    Security              Accounting       Wholesale
    Audit                 CRM              Salon
    Workflow              Payment          Repair
    Notification          Delivery         Manufacturing
        │                 Credit
        │                 Installment
        │                 Commission
        │                 Loyalty
        │                 Promotion
        └────────────────────────────────────────
                         │
                    AI / BI Layer
                         │
              ┌──────────┼──────────┐
              │          │          │
          Forecasting  Analytics  AI Assistant
              │          │          │
              └──────────┼──────────┘
                         │
                    Integration
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      E-commerce       Payment          Hardware
      Marketplace      Gateway          Scanner
      Mobile App       SMS/WhatsApp     Printer/Scale
```

**Final Product Goal:**
> A complete offline-first Business Operating System for small businesses, growing
> companies and enterprises — scalable, secure, modular, offline-first, multi-tenant,
> API-first, industry-flexible, financially auditable, AI-ready, enterprise-ready,
> maintainable, testable, production-oriented.

**Positioning:**
- Primary: **OmniPOS — Offline-First POS & Business Management SaaS**
- Alternative: **OmniPOS — One Platform. Every Business.**
- Long-term: **OmniPOS — POS, ERP, CRM & AI Business Operating System**

POS is the entry point. ERP is the operational foundation. CRM manages customers. AI
provides intelligence. Together, they are the business operating system.

---

## 38. Completeness Checklist — Every Granular Feature, Traced

This section exists specifically so **no line-item from the 4 source drafts gets silently
dropped** during consolidation. ✓ = already specified in a section above. **NEW** = added
here because it had no home elsewhere (mostly small POS-adjacent tools and approval sub-types).

**POS-adjacent tools:**
1. Global Search — ✓ §20
2. Configurable keyboard shortcuts — ✓ §27
3. Barcode Label Designer — **NEW**: design & print custom barcode labels per product/variant.
4. Shelf Label — **NEW**: printable shelf-edge price labels, bulk-generated from catalog.
5. Price Checker — **NEW**: standalone scan-to-see-price kiosk mode (no cart/checkout).
6. Customer-facing Display — ✓ §27
7. Self Checkout — **NEW**: customer-operated checkout flow, reduced permission surface, still audited.
8. Kiosk Mode — ✓ §12
9. Digital Receipt — **NEW**: email/SMS/WhatsApp receipt instead of/alongside print.
10. WhatsApp Invoice — **NEW**: send invoice/receipt via WhatsApp Business API integration.
11. Gift Card — ✓ §10.23
12. Store Credit — ✓ §10.23
13. Warranty — ✓ §10.22
14. RMA — ✓ §10.22

**Approval sub-types** (all route through §10.26 Approval & Workflow Engine — do not build
separate approval systems per type):
15. Expense Approval — **NEW**: expenses above a threshold require approval before posting.
16. Stock Approval — **NEW**: stock adjustments/write-offs above a threshold require approval.
17. Price Approval — **NEW**: catalog price changes above a % threshold require approval.
18. Customer Credit Approval — **NEW**: new/increased credit limits require approval.

**Data & reporting tools:**
19. Data Import Wizard — ✓ §21
20. Data Migration — ✓ §10.41
21. Scheduled Reports — **NEW**: reports auto-generated and delivered (email/in-app) on a schedule.
22. Saved Reports — **NEW**: users save filter/parameter presets for reuse.
23. Dashboard Builder — **NEW**: drag-and-drop custom dashboard widgets, tenant-level customization.
24. Custom Fields — ✓ §23
25. Custom Form Builder — ✓ §23
26. Custom Document Template — **NEW**: tenant-editable invoice/quotation/PO templates (beyond logo/terms swap).
27. Workflow Builder — **NEW**: visual config UI for the Approval/Workflow Engine (§10.26) — admin-configurable, no code changes.
28. API Key Management — **NEW**: tenant-scoped API key issuance, rotation, scopes, revocation.
29. Webhook Management — ✓ §19 (subscription/config UI on top of the webhook system)
30. Integration Marketplace — **NEW**: UI directory for enabling connectors (marketplace, payment gateway, SMS provider, accounting export) per tenant — sits on top of the adapter architecture in §12.

**Operational flow references** (not modules, but must be demonstrable end-to-end):
- **Daily Business Flow:** `Open Business → Open Cash Shift → Check Stock → Sales →
  Purchase → Expenses → Customer Collections → Delivery → Stock Transfer → Close Shift → Daily Report`
- **Owner's End-of-Day View:** Today's Revenue, Gross Profit, Expenses, Net Profit,
  Orders, Customers, Outstanding, Low Stock, Expiry Risk, Cash Variance, plus 2–3
  AI-generated insights (§16).

**Full cross-reference table — every module from all 4 source drafts vs. where it now lives:**

| Source module/feature | Now in this document |
|---|---|
| Task Management | §10.31 |
| System Settings / Global Settings Engine | §10.32 |
| Tenant Onboarding | §10.33 |
| Marketing Automation | §10.34 |
| Sales Target | §10.35 |
| Budget Management | §10.35 |
| SaaS Admin Panel | §10.36 |
| Tenant Usage Monitoring | §10.36 |
| Platform Admin | §10.36 |
| Remote POS Management | §10.37 |
| Real-Time Engine | §10.38 |
| PWA / POS Application | §10.39 |
| Customer Communication | §10.40 |
| Data Migration | §10.41 |
| Example Industry Configuration | §11.9 |
| Smart Customer Display | §27, §38.6 |
| Price Control / Price Override | §10.8 (POS cart), §38.17 |
| Credit Note / Debit Note | §10.20 |
| Accounting Event Architecture | §18 (event-driven) |
| Searchable Global Activity | §20 |
| 30-item "modern POS extras" list | §38.1–§38.30 |

If a feature name from any of the 4 original files is not findable in the table above or
in the body text, treat that as a real gap and flag it — do not assume it was intentionally dropped.

> **Why the module count looked smaller earlier:** the first consolidated draft merged
> several source sections that described the *same* module from different angles (e.g.
> "Restaurant", "Restaurant Table Management", "KOT/KDS", "Recipe & Food Costing" in one
> source were 4 separate numbered sections but one module) — that part was intentional
> deduplication, not loss. Separately, ~10 genuinely distinct modules and ~15 granular
> features (listed above) had been missed outright. Both issues are fixed as of this
> revision: **50 major modules + 15 core engines + the §38 checklist** now trace every
> item from all 4 source files.
