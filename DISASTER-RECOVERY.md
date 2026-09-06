# Blue Oceans POS — Disaster Recovery & Backup Runbook (Prompt 40, §26)

> Companion to `ARCHITECTURE.md` §10. Every procedure below is *executable today*
> against the running system (`blue_ocean_pos`, admin user, mysqldump 8). All
> Backup & DR admin actions are also available in the UI:
> **Platform → System Performance → Backup & DR**.

## 1. Objectives

| | |
|---|---|
| **RPO (Recovery Point Objective)** | ≤ 24 h out of the box (automated daily FULL backup). Enabling MySQL binary logging moves this to point-in-time (see §5). |
| **RTO (Recovery Time Objective)** | ≤ 30 min for the demo/single-VPS deployment: full restore is a `mysql < dump.sql` + service start (≈ seconds to minutes depending on size). |
| **Verification** | Every backup is *restorable* — the verify step restores into a scratch DB and compares 195 tables + 20 core tables row-for-row with live. |

## 2. What is backed up automatically

- **Frequency:** one FULL `mysqldump --single-transaction --routines --triggers`
  per 24 h window, enqueued by the background-job scheduler (`backup_full` job —
  the same queue as Prompt 39). No duplicates: a `backup_full` that is
  QUEUED/RUNNING/SUCCEEDED inside the window suppresses the next one.
- **Manual:** `POST /api/v1/system/backups` (UI: **Create backup now**) runs the
  exact same job inline.
- **Location:** `backend/backups/` (`BACKUP_DIR` env overrides).
- **Retention:** newest 30 kept (`BACKUP_RETENTION`); older files deleted.
  Retention is also triggerable in the UI.
- **Metadata:** `system_backups` rows: kind, file, size, **SHA-256 checksum**,
  table count, status (`RUNNING/COMPLETED/FAILED/VERIFIED/RESTORED`), trigger.

## 3. Backup verification (do this weekly, or after any schema change)

1. UI: **Backup & DR → Verify** on the latest backup — or
   `POST /api/v1/system/backups/{id}/verify`.
2. What happens: the dump is restored into a throwaway DB
   (`verify_<timestamp>`), the full table list (195) plus the row counts of the
   20 core tables (tenants, users, products, sales, invoices, stock, journal,
   …) are compared against the live DB, and the scratch DB is dropped.
3. `matches: true` → the backup is known-good. Status flips to `VERIFIED`.
4. A verify failure means: **stop trusting backups, fix root cause (usually a
   disk/checksum/schema issue), then take a fresh backup and verify again.**

## 4. Full restore to a working system (DR drill / real disaster)

**Targets a NEW database name — the live DB is never overwritten by the API.**

1. `POST /api/v1/system/backups/{id}/restore` with `{"targetDb": "recovery_db"}`
   — restores and reports table count + tenant/user rows.
2. Prove it is a *working system*:
   ```bash
   mysql -u admin recovery_db -e "SELECT COUNT(*) FROM tenants; SELECT COUNT(*) FROM users;"
   # point the app at it for a drill:  DATABASE_URL=mysql://admin@localhost:3306/recovery_db
   cd backend && DATABASE_URL="mysql://admin@localhost:3306/recovery_db" python3 -m uvicorn main:app --port 4001
   curl http://localhost:4001/health          # → {"status":"ok"}
   ```
   `db.py` runs all `CREATE TABLE IF NOT EXISTS` migrations at boot, so a
   restored database is automatically brought up to the current schema.
3. Production disaster: stop the app → restore over the live DB with the CLI
   (`mysql -u admin blue_ocean_pos < backend/backups/<file>.sql`) → start the
   app → run `_p39_e2e.py`/`smoke_test.py` to confirm.
4. CLI restore is the *only* path that touches the live DB — run it with care.

## 5. Point-in-time recovery (PITR) — enable when RPO < 24 h is required

1. Enable binary logging on the MySQL server (`log_bin`, `binlog_format=ROW`).
2. Take a full backup as a base, then replay the binlog up to the failure
   point:
   ```bash
   mysqlbinlog --stop-datetime="YYYY-MM-DD HH:MM:SS" /var/lib/mysql/binlog.000123 | mysql -u admin recovery_db
   ```
3. Database replication (spec §26): point a read replica at the primary
   (`CHANGE REPLICATION SOURCE TO …; START REPLICA;`) — gives warm standby +
   offloads the heavy report/BI reads (§25 split point #1).

## 6. Tenant / branch restoration procedure

Whole-tenant restore from a full backup:

1. Restore the dump into a scratch DB (`verify`-style) — §4 step 1.
2. Export just that tenant:
   ```bash
   mysqldump -u admin recovery_db \
     --where="tenantId='<tenant-uuid>'" \
     tenants users branches warehouses ... 2>/dev/null | mysql -u admin blue_ocean_pos
   ```
   (Every tenant-scoped table carries `tenantId`; restore rows table-by-table
   with the same `--where` filter. `roles`, `permissions`, `modules` and other
   shared catalogs use `INSERT IGNORE`.)
3. Single-branch loss: repeat step 2 filtered by `branchId`.
4. Verify: login as the restored tenant, check dashboard + recent sales, then
   mark the incident resolved.

## 7. Offline device durability (spec §26)

- **Device-local strategy:** the PWA keeps its outbox in IndexedDB
  (`frontend/src/lib/offline/*`). A transaction is written to the durable
  outbox *before* it is considered complete — a crash mid-sale cannot lose it,
  and the outbox replays on the next launch (Prompt 19/40 E2E: re-upload after
  a simulated crash yields zero duplicates, zero lost).
- **Server-side:** the sync engine records every transaction in
  `sync_transactions` keyed by `idempotencyKey` (`ON DUPLICATE KEY`) and tracks
  per-device `pendingCount/failedCount` in `device_sync_status` — the persistent
  sync queue survives restarts of both sides.
- **Observability:** stale devices (> 5 min), pending/failed counts and
  conflicts are visible on the Observability tab and `device_sync_status` rows
  are the source of truth for the "Sync" indicator.

## 8. RTO/RPO cheat sheet

| Situation | Procedure | Target |
|---|---|---|
| Corrupted row/table (no data loss) | Restore single table from latest verified backup (§6) | minutes |
| Tenant deleted / data corrupted | §6 tenant restore | < 30 min |
| Full DB lost | §4 full restore → boot → smoke | ≤ 30 min |
| Mistake within last hours | §5 PITR (once binlog is on) | minutes |
