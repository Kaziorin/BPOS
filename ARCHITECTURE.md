# Blue Oceans POS — Architecture (Prompt 0 + 1 + 2 output)

> Functional source of truth: [`OmniPOS-Master-Specification.md`](./OmniPOS-Master-Specification.md).
> **Product name: Blue Oceans POS.** This file captures **decisions** so future prompts
> never re-derive them. Update it whenever a decision changes — stale architecture docs
> are worse than none.

## 1. Tech Stack Decision (fills Master Spec §36 gap #9)

**The existing project setup IS the stack** — decided by the codebase itself and kept:

| Layer | Decision | Why |
|---|---|---|
| Language | **TypeScript** (backend + frontend) | One language, shared contracts possible later. |
| Backend | **Node.js 22 + Express 4** (modular monolith, spec §25) | Already in place and working (routes, auth, Prisma). Express is boring and fully understood; module discipline is enforced by folder conventions + tests instead of a framework. Engines are plain classes — liftable into services later. |
| Database | **MySQL 8** | Matches the operator's infrastructure. Trade-off: no native Row-Level Security (PostgreSQL alternative was considered) → isolation enforced at the **query layer via a Prisma client extension** + **DB-layer compound constraints** (see §3). Deliberate, documented, revisit-able. |
| ORM + migrations | **Prisma 5** | `prisma migrate` tooling already proven (`prisma/migrations/20260823080829_init`). |
| Frontend | **Next.js 16 (App Router) + React 19 + Tailwind 4** | Already in place (login, dashboard, POS page shell). |
| POS offline client | **Deferred — PWA + IndexedDB outbox (Dexie) planned** (spec §10.39, §13) | Foundation first; the event/tenant design already shapes the sync contract. |
| Queue / cache | **Deferred — BullMQ + Redis planned** (spec §25) | Not needed for Prompt 0–1. The `EventBus` interface is transport-agnostic; a durable backend slots in later without touching publishers/subscribers. |
| Testing | **Jest + ts-jest** | Standard; unit + integration ready; e2e (Supertest) comes with the first real endpoints. |
| CI | **GitLab CI** | Repo is hosted on GitLab; pipeline lints + tests `backend/**` and `frontend/**` changes. |
| Hosting | **Deferred — single VPS + managed MySQL first** | Spec §25 scalability path (1 → 10 → 1,000 tenants). |

## 2. Backend Layout (existing structure + new core)

```
backend/src/
├── server.ts                 # composition root: middleware order, route mounts, graceful shutdown
├── config/env.ts             # zod-validated env contract (fail fast at boot)
├── lib/
│   ├── prisma.ts             # base PrismaClient (UNTOUCHED — legacy routes depend on it)
│   └── logger.ts             # pino structured logging + secret redaction, LogFn type
├── middleware/
│   ├── auth.ts               # legacy requireAuth/requireRole (Prompt 3 evolves it)
│   └── error-handler.ts      # central handler: Zod→400, HttpError→status, else logged 500
├── core/
│   ├── events/               # §18 backbone: DomainEvent, EventBus interface, InMemoryEventBus, catalog
│   ├── tenancy/              # §18 isolation: ALS context, middleware, pure filter logic,
│   │                         #   tenantPrisma ($extends enforcement), TENANT_SCOPED_MODELS registry
│   └── extensions/           # §6 extension host: interfaces, sandboxed registry, loader
├── extensions/
│   └── restaurant/           # industry extension stub — proves core/extension separation
├── engines/                  # the 15 core reusable engines (§8), all instantiated in index.ts
└── routes/
    ├── health.ts             # GET /health — liveness + MySQL readiness (503 when degraded)
    ├── v1.ts                 # /api/v1 — NEW OmniPOS namespace, behind tenant middleware (§19)
    └── (legacy routes)       # auth/dashboard/categories/... keep running unchanged (§34)
```

### The 15 Core Engines (§8) — registered in `src/engines/index.ts`

transaction(1) · inventory(2) · pricing(3) · tax(4) · payment(5) · accounting(6) ·
commission(7) · loyalty(8) · promotion(9) · workflow(10) · notification(11) ·
audit(12, **already subscribed to SALE_COMPLETED**) · sync(13) · reporting(14) · ai(15).

Route mapping to prompts: engines expose routers inside `routes/v1.ts` as their
dedicated prompts implement them (POS 9–10, Inventory 8, Pricing 6, VAT 17, …).

## 3. Tenant Isolation (spec §18) — two layers, fail-closed (MySQL has no RLS)

1. **Schema layer (DB constraints — Prompt 2 convention):** every tenant-scoped table
   carries `tenant_id CHAR(36) NOT NULL`; uniques/indexes are compound and tenant-leading
   (`UNIQUE(tenant_id, sku)`). A cross-tenant write collides at the DB itself.
2. **Query layer (implemented in Prompt 1):**
   `requireTenant` (resolves `x-tenant-id`, 401 if absent) → `withTenantContext`
   (binds AsyncLocalStorage) → `tenantPrisma.$extends` auto-injects `tenant_id` into
   reads/writes for every model in `TENANT_SCOPED_MODELS`. No context →
   `TenantContextMissingError` (fails closed). `runAsSystem()` = single audited escape hatch.
3. **Registry discipline:** `TENANT_SCOPED_MODELS` (`core/tenancy/tenant-filter.ts`) is the
   single source of truth. Prompt 2 must register every tenant-scoped model it creates —
   a missing registration silently removes isolation. Treat as a release blocker.
4. **Namespace rule:** legacy `/api/*` routes run unchanged (prototype, single-tenant).
   ALL new OmniPOS routes mount under `/api/v1` behind the tenant middleware.
   Prompt 3 replaces header-lookup with the verified JWT claim in `requireTenant` only.

## 4. Core ↔ Industry Extension Separation (spec §6)

- Core defines `OmniPosExtension` + `ExtensionRegistryApi` (`core/extensions/extension.interface.ts`):
  extensions may **subscribe to domain events** and **contribute POS panels** — nothing else.
- Extensions live in `backend/src/extensions/<industry>/` and import only core interfaces +
  the event catalog. Core files have zero imports of any industry (proven by tests).
- Boot: `INDUSTRY_EXTENSIONS=restaurant` → `setupExtensions()` instantiates the factory with
  a sandboxed registry; a throwing extension handler is logged and contained — it can never
  break the sale pipeline (§2 rule 16). `GET /api/v1/extensions/panels` (tenant-guarded)
  serves the panel list to clients.
- Shipped example: `restaurant` (Floor Plan + KDS panels, SALE_COMPLETED hook stub for Prompt 20).

## 5. Event Backbone (spec §18)

- `core/events/`: `DomainEvent { name, eventId (UUID = consumer idempotency key), tenantId,
  occurredAt, payload }`, `EventBus` interface, `InMemoryEventBus`, catalog with
  `SALE_COMPLETED`, `SALE_RETURNED`, `PAYMENT_RECEIVED`, `STOCK_LOW` (grows per prompt).
- `setupEngines(eventBus)` wires engines; `AuditEngine` subscribes to `SALE_COMPLETED`
  on boot (working proof: `engines.spec.ts`). Publishing is the only coupling between modules.
- Planned flow once the Transaction Engine lands (atomic in ONE db transaction, §18):
  `SALE_COMPLETED → EVENT BUS → Inventory, Accounting, Commission, Loyalty, Notification,
  Analytics, AI`.

## 6. Conventions (load-bearing)

- **DB:** lowercase `snake_case` table names via `@@map` (portable across
  `lower_case_table_names=0/1` servers), UUID PKs, `tenant_id` per §3, createdAt/updatedAt.
  **Money in integer minor units (paisa)** — never floats.
- **Business rules** (pricing/tax/workflow thresholds) live in engines as configuration —
  never hard-coded (§2 rule 10).
- **Events:** names only in `core/events/catalog.ts`; payloads versioned additively.
- **Env:** through `config/env.ts` (zod) — no scattered `process.env` in new code.
- **Imports:** engines/extensions depend on the `EventBus` interface, never the InMemory impl.

## 7. Deliberately Deferred (with triggers)

| Deferred | Trigger to add |
|---|---|
| Redis + BullMQ (queue/cache) | first background job (reports/SMS/webhook delivery) |
| Docker / docker-compose | deployment dry-run or collaborator onboarding |
| PWA offline POS client | Prompt 35 (client architecture) |
| JWT tenant claim (header today, guarded) | Prompt 3 changes `requireTenant` lookup only |

## 8. Prompt Progress

- [x] **Prompt 0** — existing repo inspected (no duplication), stack documented (this file),
      DB connection + migration tooling verified, lint/format/CI skeleton, pino logging,
      central error handler, `/health` with DB readiness, env contract.
- [x] **Prompt 1** — 15 engine skeletons wired, event bus + pub/sub tests, tenant isolation
      enforced (middleware + Prisma extension) with tests, extension mechanism + Restaurant
      proof, `/api/v1` namespace.
- [x] **Prompt 2** — Core Database Schema applied as additive migration
      `20260831073419_prompt2_core_schema` on `blue_oceans_pos`. **47 new tenant-scoped
      tables** across Identity / Organization / Catalog / Sales / Inventory / Purchase /
      Finance / CRM / Operations / Audit. Every table: UUID PK, `tenant_id` + index,
      `created_at/updated_at/created_by/updated_by`, status, FKs, tenant-leading compound
      uniques. Legacy prototype tables **unchanged** (data intact, proved: users=1, sales=9,
      products=4). All 47 tenant-owned models registered in `TENANT_SCOPED_MODELS`
      (`core/tenancy/tenant-filter.ts`) so the tenant-aware client scopes them automatically.
      Seeder: `npm run seed` creates demo tenant `demo-shop` + company + branch `DHK-01` +
      warehouse `WH-DHK-01` + Owner/Cashier roles + permissions + tenant admin
      `admin@blueoceanspos.com / Admin@123` (legacy `seed.ts` kept for the old prototype UI).
  - Style note: legacy models were renamed `User`→kept, `Category`→`LegacyCategory`, ...
      (`@@map` preserves the original table names), so the legacy routes keep working
      through `prisma.legacyX` — migrated to the core schema module by module later.
- [ ] **Prompt 3** → Authentication & Tenant system (JWT replaces the `x-tenant-id` header
      lookup; sessions + device registration go live).

## 9. Prompt 39 — Performance, Caching, Background Jobs & Scalability (§25)

> NOTE: the runtime today is the **Python FastAPI backend** (`backend/*.py`, MySQL
> `blue_ocean_pos`), which superseded the original TS/Prisma prototype. This section
> records the decisions made in Prompt 39 against the live system.

### 9.1 Background jobs — DB-backed queue, in-process worker (no Redis yet)

| Concern | Decision |
|---|---|
| Queue storage | `background_jobs` table (MySQL) — survives restarts, tenant-scoped, observable, zero new infra |
| Worker | one asyncio task started in the FastAPI lifespan (`main.py` → `jobs.worker_main`) |
| Claim | `SELECT … FOR UPDATE SKIP LOCKED` ordered by `priority, createdAt` (MySQL 8) |
| Retry | per-job `attempts`/`maxAttempts` + exponential backoff (`runAt`); exhausted → FAILED |
| Swap-out path | handlers live behind one dict (`jobs._HANDLERS`); replacing the table with Redis/BullMQ later only changes `enqueue`/`claim` — handler semantics stay |

**Migrated onto the queue (previously stubbed/inline):** webhook delivery
(`routers_webhooks` fire/retry → `webhook_deliver` jobs; the worker also auto-requeues
`RETRYING` events whose backoff elapsed — the old code never retried automatically),
recurring expenses (scheduler pass + manual “run now” both go through the same
`recurring_expenses` handler), scheduled reports (`report_generate`), per-tenant
notification scans (`scheduled_check` → `notify.run_scheduled_checks`), and outbound
email/SMS/WhatsApp attempts (`notification_logs` via the demo carrier).

**Guardrail honored:** POS checkout remains fully synchronous/locally transactional —
no sale-path code calls the queue. Endpoints that used to do async work inline now call
`jobs.enqueue_and_run`, i.e. the request triggers the *same handler the worker uses*, so
the queue row is the single source of truth while latency stays identical and the worker
is never a dependency of a request.

### 9.2 Caching — in-process TTL, namespace whitelist, never financial

- `backend/cache.py`: thread-safe dict + monotonic-clock TTL, stats (hits/misses/hit
  rate/size/invalidations), namespace invalidation, and a **hard whitelist** — a
  `cache.set` on any namespace outside `products/customers/price_lists/tax/permissions/
  branches` raises. Financial source-of-truth (sales/invoices/payments/GL/ledgers) is
  therefore structurally uncacheable, and the system endpoint proves it
  (`financialNamespacesCached: []`).
- Wired today: product list/detail (`products`, 30 s), customer quick-lookup
  (`customers`, 20 s), price lists (`price_lists`, 60 s), RBAC permission sets
  (security.py, 60 s). Every write path invalidates its namespace immediately → no stale
  catalog/prices, verified by the E2E.
- Scale-out path: same API, back the dict with Redis later; invalidation keys are
  already namespaced per tenant (`ns:tenantId:…`).

### 9.3 Scalability path 1 → 1,000+ tenants (no rewrite)

Modular monolith + background workers, per §25. The DB is the shared state; every table
carries `tenantId` with tenant-leading indexes, so a 1,000-tenant deployment is today’s
code on a bigger MySQL (or read replicas for the heavy report/BI reads). Documented
split points for future microservice extraction — each already isolated behind a module
boundary that can be lifted out without touching the rest:

1. **Reporting/BI** (heavy `SELECT` aggregation) → read-model service on a replica;
   §25 mandates reports must not hammer the live transactional DB at scale.
2. **Notification/carrier fan-out** (`notify` + `jobs` outbound handlers) → worker pool
   consuming the same `background_jobs` table (multiple uvicorn workers or a second
   process can already share it safely via SKIP LOCKED).
3. **Webhook delivery** (external I/O, retry/backoff already queue-owned) → standalone
   consumer if outbound volume grows.
4. **Sync engine** (device/offline reconciliation) → its own worker per region.
5. **AI/forecasting** (long-running, prompt 36) → dedicated workers with a GPU pool later.

The POS/sale path stays in the monolith — synchronous, locally transactional,
queue-independent (guardrail, §25). Single VPS → managed MySQL + N app workers covers
1 → 100+; read replica for reporting + queue worker autoscaling covers 100 → 1,000+.

## 10. Prompt 40 — Backup, Disaster Recovery & Observability (§26)

Full runbook: [`DISASTER-RECOVERY.md`](./DISASTER-RECOVERY.md). Decisions recorded here:

| Concern | Decision |
|---|---|
| Backup engine | `mysqldump --single-transaction --routines --triggers` (consistent snapshot; binlog PITR documented, not enabled by default) |
| Automation | one FULL backup / 24 h enqueued by the **job queue scheduler** (`backup_full` — reuses Prompt 39 infra; no dup within the window) |
| Metadata/trust | `system_backups` rows w/ size + SHA-256; **verify = restore into scratch DB + compare 195 tables & 20 core tables, then drop** — a backup is only trusted after VERIFIED |
| Restore surface | API restores into a **named target DB only** (never overwrites live); CLI restore is the documented prod path |
| Retention | newest 30 (`BACKUP_RETENTION`); `POST /system/backups/retention` enforces |
| Offline durability | client outbox (IndexedDB) written before sale completion; server `sync_transactions` (idempotencyKey unique) + `device_sync_status` pending/failed counters survive restarts — crash/restart replay = zero loss/dup |
| Observability | single `_gather_subsystems` in `routers_system.py` feeds /health + /metrics + /indicators: API p50/p95/p99 + 5xx/4xx error rate (from the timing middleware), DB ping, queue depth + worker heartbeat, sync (devices/stale/pending/failed/conflicts), notification failures (24 h), CPU/mem/RSS/load + disk (from /proc + statvfs — no psutil), uptime, latest backup — all real data, none canned |
| UI | System Performance page tabs: Observability (indicator tiles), Background Jobs, Cache, Performance, Backup & DR |

Split points for scale: backup/verify run on the worker queue → can move to a cron host or second worker pool without code change; observability counters are in-process (swap to Prometheus/OTel exporter later — same gatherer).

