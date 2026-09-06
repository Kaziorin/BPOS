# Blue Oceans POS (OmniPOS)

A full-featured, **offline-first** point-of-sale + ERP for small & medium businesses —
retail, restaurant, pharmacy, wholesale, salon, repair, manufacturing and more.
One codebase serves all industries through a modular engine design.

> Functional source of truth: [`OmniPOS-Master-Specification.md`](./OmniPOS-Master-Specification.md)
> Architecture decisions: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> Backup & DR runbook: [`DISASTER-RECOVERY.md`](./DISASTER-RECOVERY.md)

---

## 1. Architecture summary

| Layer | Tech | Where |
|---|---|---|
| Frontend | **Next.js 16 (App Router) + React 19 + Tailwind 4** | [`frontend/`](./frontend) — serves on `:3000` |
| Backend | **Python FastAPI + SQLAlchemy 2 (async)** — full conversion of the original TS backend, same endpoints & response shapes | [`backend/`](./backend) — serves on `:4000` |
| Database | **MySQL 8** (`blue_ocean_pos`) — 195+ reflected tables, raw-SQL routers, no ORM drift | shared schema, configurable via `DATABASE_URL` |
| Offline | PWA + IndexedDB outbox (Dexie) → idempotent server sync | [`frontend/src/lib/offline`](./frontend/src/lib/offline) + `backend/routers_sync.py` |
| Queue / cache / backups | In-process job scheduler (Prompt 39), MySQL-backed, plus automated mysqldump backups (Prompt 40) | `backend/jobs.py`, `backend/routers_system.py` |

**Multi-tenancy:** every router resolves the tenant from the JWT (`x-tenant-id` header
or slug) and every query is tenant-scoped — row-level isolation enforced at the query
layer. One MySQL database serves any number of tenants.

**Repo layout**

```
backend/            FastAPI app (main.py = composition root), db.py, security.py,
                    routers_*.py, *_e2e.py E2E suites, seed_demo.py
frontend/           Next.js app — (app) pages per module, components/, lib/
deploy/             systemd units + staging deploy script
OmniPOS-*.md        Master specification + development prompts
ARCHITECTURE.md     Architecture & decisions (per-prompt)
DISASTER-RECOVERY.md
```

---

## 2. Module map

Each spec module → built across the prompt sequence. The master spec is the functional
source of truth; the **backend routers** and **frontend pages** below are the live implementation.

| Master Spec module/engine | Backend router | Frontend page(s) | Built in |
|---|---|---|---|
| §10.1 Platform & SaaS | `routers_saas.py` | `/saas` | Prompt 32 |
| §10.2 Tenant/Company, §6 Auth | `routers_core.py`, `routers_auth` (in core) | `/settings`, `/login`, `/onboarding` | Prompt 3 |
| §5 RBAC | `routers_rbac.py` | `/rbac`, `/audit-security` | Prompt 4 |
| §10.3 Branch/Warehouse/Device, §10.32 Settings, §10.33 Onboarding | `routers_extra.py`, `routers_core.py` | `/branches`, `/warehouses`, `/devices`, `/settings`, `/onboarding` | Prompt 5 |
| §10.4 Products, §10.5 Pricing/Promotion, §38.3–4 Labels | `routers_catalog.py`, `routers_extra.py` | `/products`, `/price-lists`, `/promotions` | Prompt 6 |
| §10.6 Customer/CRM, §10.7 Supplier | `routers_catalog.py` | `/customers`, `/suppliers` | Prompt 7 |
| §10.16 Inventory, Landed Cost, Consignment | `routers_extra.py`, `routers_business.py` | `/inventory/*` | Prompt 8 |
| §10.8 POS, §10.9 Payment, §38.5/38.7 Price Checker & Self Checkout | `routers_pos.py` | `/pos`, `/pos/self-checkout`, `/pos/price-checker` | Prompt 9 |
| §10.10 Sales, §10.11 Quotation/Sales Order | `routers_extra.py` | `/sales`, `/sales/orders`, `/sales/quotations` | Prompt 10 |
| §10.12 Invoice/Payment allocation | `routers_extra.py` | `/invoices`, `/payments` | Prompt 11 |
| §10.13 Credit, §10.14 Installment | `routers_extra.py` | `/credit`, `/installments` | Prompt 12 |
| §10.15 Commission | `routers_business.py` | `/commission` | Prompt 13 |
| §10.17 Purchasing | `routers_business.py` | `/purchasing/*` | Prompt 14 |
| §10.18 Expense, §10.19 Cash Register & Shift | `routers_business.py`, `routers_pos.py` | `/expenses/*`, `/cash-register` | Prompt 15 |
| §10.20 Accounting | `routers_accounting.py` | `/accounting/*` | Prompt 16 |
| §10.21 VAT/Tax (Bangladesh NBR) | `routers_tax.py`, `tax.py` | `/tax`, Settings → Tax | Prompt 17 |
| §10.22 Return/RMA/Warranty | `routers_return.py`, `returns.py` | `/returns`, `/rma`, `/warranty` | Prompt 18 |
| §13 Offline-First & Sync | `routers_sync.py` | offline lib + `/settings` | Prompt 19 |
| §11.1 Restaurant | `routers_restaurant.py` | `/restaurant` (floor, KOT, KDS, recipes) | Prompt 20 |
| §11.2 Pharmacy | (POS batch/FEFO flow) | `/pharmacy` (register, batch select, FEFO) | Prompt 21 (register UI Prompt 42) |
| §11.3–11.5 Retail/Grocery/Wholesale | `routers_industry.py` | `/omnichannel` | Prompt 22 |
| §11.6–11.8 Manufacturing/Salon/Repair, §10.30 Franchise | `routers_industry.py` | `/manufacturing`, `/salon`, `/repair`, `/franchise` | Prompt 23 |
| §10.23 Loyalty/Wallet/Gift, §10.34 Marketing, §10.35 Targets | `routers_loyalty.py` | `/loyalty`, `/marketing`, `/targets` | Prompt 26 |
| §10.24 HRM, §10.31 Tasks | `routers_hrm.py`, `routers_tasks.py` | `/hrm`, `/tasks` | Prompt 25 |
| §10.26 Workflow/Approval, §10.27 Business Rules | `routers_workflow.py`, `workflow.py` | `/workflow`, `/business-rules` | Prompt 27 |
| §10.28 Docs, §38.26 Templates | `routers_documents.py`, `routers_doc_templates.py` | `/data` | Prompt 29 |
| §10.29 Notification, §10.40 Customer Comms | `routers_notify.py` | notifications console | Prompt 28 |
| §15 Reporting & BI | `routers_reports.py`, `routers_reporting.py` | `/reports` | Prompt 30 |
| §16 AI Copilot | `routers_ai.py` | `/ai` | Prompt 31 |
| §12 Omnichannel/E-commerce | `routers_omnichannel.py` | `/omnichannel` | Prompt 33 |
| §19 API/Webhooks/Integrations | `routers_webhooks.py`, `routers_api_keys.py`, `routers_integrations.py` | `/integrations` | Prompt 34 |
| §14 Hardware, §10.38 Real-time, §10.39 PWA | `routers_hardware.py`, `routers_realtime.py` | `/hardware`, `/devices` | Prompt 35 |
| §20 Search, §21 Import/Export | `routers_search.py`, `routers_import_export.py` | `/search`, import/export | Prompt 36 |
| §22 Multi-currency/Localization | `routers_extra.py`, `routers_system.py` | `/settings` | Prompt 37 |
| §17 Audit, §24 Security | `routers_system.py`, `security.py` | `/audit-security` | Prompt 38 |
| §25 Performance/Cache/Queue | `routers_system.py`, `jobs.py` | `/system/performance` | Prompt 39 |
| §26 Backup/DR/Observability | `routers_system.py`, `jobs.py` | `/system/performance` → Backup & DR | Prompt 40 |
| §27 UI/UX (full pass) | — | all pages + mobile nav + customer display | Prompt 42 |
| §31 E2E testing | `smoke_test.py`, `_p*_e2e.py` | — | Prompt 41 |
| Delivery & Logistics | `routers_delivery.py` | `/delivery` | Prompt 24 |
| Appointment/Queue | `routers_extra.py` (appointments) | `/appointments` | Prompt 23 |

---

## 3. Run locally

Prerequisites: MySQL 8 (the DB `blue_ocean_pos`), Python 3.12+, Node 22+.

### Backend (`:4000`)

```bash
cd backend
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt   # first time
cp .env.example .env                 # set DATABASE_URL (XAMPP local dev: passwordless admin)
./venv/bin/python db.py --init       # creates all tables (see note below)
./venv/bin/python seed_demo.py       # idempotent demo tenant: demo-shop
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 4000   # dev (or: bash start.sh)
```

> The DB schema is reflected at boot; `db.py` also carries an idempotent migration list
> that runs at boot, so a fresh `blue_ocean_pos` DB is created automatically on first start.
> **Login:** `admin@blueoceanspos.com` / `Admin@123` (tenant `demo-shop`).

### Frontend (`:3000`)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000  (API default: http://localhost:4000/api)
```

`NEXT_PUBLIC_API_URL` overrides the API base at build time.

### Verifying

```bash
bash backend/_run_p43_release.sh     # FULL release-gate battery (all E2E suites + build)
# or individually:
cd backend && python3 smoke_test.py && python3 _p42_e2e.py
```

---

## 4. Deploy (staging → production)

Two long-running services (systemd) + one MySQL instance.

| Service | Port | Unit |
|---|---|---|
| API (FastAPI/uvicorn) | 4000 | [`deploy/omni-pos-api.service`](./deploy/omni-pos-api.service) |
| Web (Next.js production server) | 3000 | [`deploy/omni-pos-web.service`](./deploy/omni-pos-web.service) |

### Staging end-to-end (single host)

```bash
bash deploy/staging-deploy.sh
```

It checks `backend/.env`, seeds the demo tenant, builds the frontend, installs &
starts both systemd units, and smoke-checks `:4000` + `:3000`.

### Production (manual / your own pipeline)

1. **Secrets** — copy `backend/.env.production.example` → `/etc/omni-pos/backend.env`
   (`chmod 600`). Generate a fresh `JWT_SECRET` (`python3 -c "import secrets; print(secrets.token_urlsafe(48))"`)
   and a dedicated MySQL user with least privilege. Never commit `.env`.
2. **Database** — provision MySQL, create `blue_ocean_pos`, run the migration/seed once.
3. **Services** — copy the units from [`deploy/`](./deploy), set
   `User=`/`WorkingDirectory=`/`EnvironmentFile=` for the host, then
   `systemctl enable --now omni-pos-api omni-pos-web`.
4. **Frontend env** — set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api` in the web
   unit's environment, and `CORS_ORIGIN=https://pos.yourdomain.com,https://app.yourdomain.com`
   in the API env file.
5. **Release gate** — run `bash backend/_run_p43_release.sh` on the staging host and only
   promote when every suite clears.
6. **Backups** — enabled by default: one full mysqldump per 24 h (see
   [`DISASTER-RECOVERY.md`](./DISASTER-RECOVERY.md) for restore + verify procedures).

CI (GitLab): [`.gitlab-ci.yml`](./.gitlab-ci.yml) runs backend compile + frontend lint
when relevant folders change.

---

## 5. Onboarding a new tenant

Two paths:

1. **API (platform/admin)** — the documented flow (Prompt 3/32): create the tenant
   (`POST /api/v1/tenants` or platform onboarding endpoint), then the owner user; the
   seed/module system auto-enables the module set. Every request is tenant-scoped via
   the `x-tenant-id` header or slug.
2. **Self-serve** — the frontend onboarding wizard at `/onboarding` walks business type →
   company → branch → warehouse → **tax** → payment → users. During the Tax step, the
   §10.21 disclaimer is shown: *all production VAT/NBR workflows and Mushak forms must be
   reviewed by a qualified Bangladesh VAT professional before production deployment.*

After onboarding, the tenant logs in at `/login`, opens a **cash shift**
(`/cash-register`), and can sell immediately — POS sales are blocked until a shift is
open (§10.19), and all sales work offline and sync when connectivity returns (§13).

---

## 6. Release state (Prompt 43 gate)

- Full E2E battery: **Prompt 41 — 92/92**, **Prompt 42 — 14/14**, plus all prompt suites
  (18–40) green in the release gate.
- Frontend production build: green (legacy TS-era type debt in ~60 pages is documented
  in `frontend/next.config.ts` and ignored at build; runtime is unaffected).
- VAT/NBR disclaimer visible in **Tax page**, **Settings → Tax**, and **Onboarding → Tax Setup**.
- System is ready for its **first real tenant**.
