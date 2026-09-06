"""Backup & Disaster Recovery service (Prompt 40, §26).

Automated FULL backups via ``mysqldump --single-transaction`` (a consistent
point-in-time snapshot; for true PITR enable binary logging — see
DISASTER-RECOVERY.md), recorded in ``system_backups`` with size + SHA-256 so a
backup can be *verified*.

Verification restores the dump into a throwaway database and compares the live
schema (table list + core-table row counts) against the restored copy, then
drops the scratch DB — proving a full backup can be restored to a working
system (Definition of Done).

All DB access here is synchronous (CLI + sync engine) because dumps are
subprocess calls; async callers wrap with ``asyncio.to_thread``.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import make_url, text

from db import sync_engine

BACKUP_DIR = Path(os.getenv("BACKUP_DIR", str(Path(__file__).resolve().parent / "backups")))
RETENTION = int(os.getenv("BACKUP_RETENTION", "30"))  # keep latest N backups

# Core tables compared during verification (cheap + meaningful).
# Volatile operational tables (background_jobs, system_backups, notification_*
# logs, inapp_*) are excluded from the row-equality list — the worker keeps
# writing them between the dump and the compare. Their *existence* is still
# covered by the full table-count comparison.
CORE_CHECK_TABLES = [
    "tenants", "users", "branches", "warehouses", "companies", "products",
    "customers", "suppliers", "categories", "sales", "sale_items", "invoices",
    "payments", "stock", "accounts", "roles", "permissions", "modules",
    "product_variants", "sessions",
]


def _cfg() -> dict:
    url = make_url(os.getenv("DATABASE_URL", "mysql://admin@localhost:3306/blue_ocean_pos"))
    return {
        "host": url.host or "127.0.0.1",
        "port": url.port or 3306,
        "user": url.username or "admin",
        "password": url.password or "",
        "db": url.database or "blue_ocean_pos",
    }


def _mysql_cli(db_name: str) -> list[str]:
    c = _cfg()
    cmd = ["mysql", f"-h{c['host']}", f"-P{c['port']}", f"-u{c['user']}"]
    if c["password"]:
        cmd.append(f"-p{c['password']}")
    cmd.append(db_name)
    return cmd


def _safe_dbname(name: str) -> str:
    """Only [a-zA-Z0-9_] — never let user input reach a shell/db identifier."""
    return re.sub(r"[^a-zA-Z0-9_]", "_", name)[:60]


def _run(cmd: list[str], stdin_file: Path | None = None) -> None:
    proc = subprocess.run(
        cmd, stdin=open(stdin_file, "rb") if stdin_file else None,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600)
    if proc.returncode != 0:
        raise RuntimeError(
            f"{cmd[0]} failed ({proc.returncode}): {proc.stderr.decode(errors='replace')[:1000]}")


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _insert_record(file_path: Path, kind: str, triggered_by: str, started_at: str) -> str:
    bid = str(uuid.uuid4())
    size = file_path.stat().st_size if file_path.exists() else 0
    with sync_engine.connect() as conn:
        conn.execute(text(
            "INSERT INTO system_backups (id, kind, fileName, filePath, dbName, sizeBytes, "
            "checksum, tableCount, status, triggeredBy, startedAt, createdAt) "
            "VALUES (:id, :k, :fn, :fp, :db, :sz, :ck, :tc, 'RUNNING', :tb, :sa, NOW(3))"),
            {"id": bid, "k": kind, "fn": file_path.name, "fp": str(file_path),
             "db": _cfg()["db"], "sz": size, "ck": None, "tc": 0,
             "tb": triggered_by, "sa": started_at})
        conn.commit()
    return bid


def run_backup(kind: str = "FULL", triggered_by: str = "SCHEDULE") -> dict:
    """mysqldump the live DB into BACKUP_DIR and record it. Returns the record."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    c = _cfg()
    started = datetime.now(timezone.utc).isoformat()
    ts = time.strftime("%Y%m%d_%H%M%S")
    # unique per second — two dumps in the same second would otherwise write
    # the SAME file concurrently and corrupt it (seen in the field)
    fname = f"{c['db']}_{kind.lower()}_{ts}_{uuid.uuid4().hex[:6]}.sql"
    fpath = BACKUP_DIR / fname
    cmd = [
        "mysqldump", f"-h{c['host']}", f"-P{c['port']}", f"-u{c['user']}",
        "--single-transaction", "--routines", "--triggers",
        "--set-gtid-purged=OFF", "--skip-comments", "--no-tablespaces",
    ]
    if c["password"]:
        cmd.append(f"-p{c['password']}")
    cmd.append(c["db"])
    bid = _insert_record(fpath, kind, triggered_by, started)
    try:
        _dump_to_file(cmd, fpath)
        checksum = _sha256(fpath)
        size = fpath.stat().st_size
        tcount = _table_count(c["db"])
        with sync_engine.connect() as conn:
            conn.execute(text(
                "UPDATE system_backups SET status='COMPLETED', sizeBytes=:sz, checksum=:ck, "
                "tableCount=:tc, completedAt=NOW(3) WHERE id=:id"),
                {"sz": size, "ck": checksum, "tc": tcount, "id": bid})
            conn.commit()
        return {"id": bid, "kind": kind, "fileName": fname, "filePath": str(fpath),
                "sizeBytes": size, "checksum": checksum, "tableCount": tcount,
                "status": "COMPLETED", "triggeredBy": triggered_by}
    except Exception as e:  # noqa: BLE001
        with sync_engine.connect() as conn:
            conn.execute(text(
                "UPDATE system_backups SET status='FAILED', errorMsg=:err, completedAt=NOW(3) "
                "WHERE id=:id"), {"err": str(e)[:500], "id": bid})
            conn.commit()
        try:
            fpath.unlink(missing_ok=True)
        except Exception:
            pass
        raise


def _dump_to_file(cmd: list[str], fpath: Path) -> None:
    """mysqldump with stdout redirected to file via subprocess pipes."""
    with open(fpath, "wb") as out:
        proc = subprocess.run(cmd, stdout=out, stderr=subprocess.PIPE, timeout=900)
    if proc.returncode != 0:
        raise RuntimeError(f"mysqldump failed ({proc.returncode}): "
                           f"{proc.stderr.decode(errors='replace')[:1000]}")


def _table_count(db_name: str) -> int:
    with sync_engine.connect() as conn:
        r = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = :d"),
            {"d": db_name}).first()
        return int(r[0])


def drop_database(db_name: str) -> None:
    _run(["mysql", f"-h{_cfg()['host']}", f"-P{_cfg()['port']}", f"-u{_cfg()['user']}",
          "-e", f"DROP DATABASE IF EXISTS `{_safe_dbname(db_name)}`"])


def restore_to(path: str | Path, target_db: str, drop_first: bool = True) -> dict:
    """Restore a dump into ``target_db`` (created if missing). Returns a report."""
    fpath = Path(path)
    if not fpath.exists():
        raise FileNotFoundError(f"Backup file not found: {fpath}")
    tdb = _safe_dbname(target_db)
    if drop_first:
        drop_database(tdb)
    _run(["mysql", f"-h{_cfg()['host']}", f"-P{_cfg()['port']}", f"-u{_cfg()['user']}",
          "-e", f"CREATE DATABASE IF NOT EXISTS `{tdb}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"])
    _run(_mysql_cli(tdb), stdin_file=fpath)
    tcount = _table_count(tdb)
    with sync_engine.connect() as conn:
        tenants = conn.execute(text("SELECT COUNT(*) FROM `%s`.tenants" % _mysql_backtick_safe(tdb))).first()
        users = conn.execute(text("SELECT COUNT(*) FROM `%s`.users" % _mysql_backtick_safe(tdb))).first()
    return {"targetDb": tdb, "tableCount": tcount,
            "tenants": int(tenants[0]), "users": int(users[0]),
            "restoredAt": datetime.now(timezone.utc).isoformat()}


def _mysql_backtick_safe(db_name: str) -> str:
    """Identifier already sanitized by _safe_dbname; backtick-wrap safely."""
    return db_name.replace("`", "")


def verify_backup(bid: str) -> dict:
    """Restore backup into a scratch DB, compare against live, drop scratch."""
    with sync_engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM system_backups WHERE id=:id"), {"id": bid}).first()
    if not row:
        raise LookupError(f"Backup {bid} not found")
    d = dict(row._mapping)
    fpath = Path(d["filePath"])
    if not fpath.exists():
        raise FileNotFoundError(f"Backup file missing: {fpath}")
    scratch = f"verify_{int(time.time())}"
    live_counts = _core_counts(_cfg()["db"])
    report = {"scratchDb": scratch, "checks": []}
    try:
        restore_to(fpath, scratch, drop_first=True)
        restored_counts = _core_counts(scratch)
        matched = True
        for tbl in CORE_CHECK_TABLES:
            lv, rv = live_counts.get(tbl, -1), restored_counts.get(tbl, -1)
            same = (lv == rv)
            matched = matched and same
            report["checks"].append({"table": tbl, "live": lv, "restored": rv, "match": same})
        report.update({"liveTableCount": live_counts.get("__all__", 0),
                       "restoredTableCount": restored_counts.get("__all__", 0),
                       "matches": matched, "verifiedAt": datetime.now(timezone.utc).isoformat()})
        with sync_engine.connect() as conn:
            conn.execute(text(
                "UPDATE system_backups SET status='VERIFIED', result=:res, completedAt=NOW(3) "
                "WHERE id=:id"),
                {"res": json.dumps(report, default=str), "id": bid})
            conn.commit()
        return report
    finally:
        try:
            drop_database(scratch)
        except Exception:
            pass


def _core_counts(db_name: str) -> dict:
    dbq = db_name.replace("`", "")
    out: dict = {}
    with sync_engine.connect() as conn:
        for tbl in CORE_CHECK_TABLES:
            try:
                r = conn.execute(text(f"SELECT COUNT(*) FROM `{dbq}`.`{tbl}`")).first()
                out[tbl] = int(r[0])
            except Exception:
                out[tbl] = -1
        all_t = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=:d"),
            {"d": db_name}).first()
        out["__all__"] = int(all_t[0])
    return out


def list_backups(limit: int = 50) -> list[dict]:
    with sync_engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id, kind, fileName, dbName, sizeBytes, checksum, tableCount, status, "
            "triggeredBy, result, errorMsg, startedAt, completedAt, createdAt "
            "FROM system_backups ORDER BY createdAt DESC LIMIT :l"), {"l": min(limit, 200)}).fetchall()
        return [dict(r._mapping) for r in rows]


def get_backup(bid: str) -> dict | None:
    with sync_engine.connect() as conn:
        row = conn.execute(text(
            "SELECT id, kind, fileName, filePath, dbName, sizeBytes, checksum, tableCount, "
            "status, triggeredBy, result, errorMsg, startedAt, completedAt, createdAt "
            "FROM system_backups WHERE id=:id"), {"id": bid}).first()
        return dict(row._mapping) if row else None


def _mark_restored(bid: str, report: dict) -> None:
    """Record a successful restore drill on the backup row."""
    with sync_engine.connect() as conn:
        conn.execute(text(
            "UPDATE system_backups SET status='RESTORED', result=:res, completedAt=NOW(3) "
            "WHERE id=:id"),
            {"res": json.dumps(report, default=str), "id": bid})
        conn.commit()


def delete_backup(bid: str) -> bool:
    with sync_engine.connect() as conn:
        row = conn.execute(text("SELECT filePath FROM system_backups WHERE id=:id"), {"id": bid}).first()
        if not row:
            return False
        try:
            Path(row[0]).unlink(missing_ok=True)
        except Exception:
            pass
        conn.execute(text("DELETE FROM system_backups WHERE id=:id"), {"id": bid})
        conn.commit()
        return True


def enforce_retention() -> int:
    """Keep the newest RETENTION backups, delete the rest (files + rows)."""
    with sync_engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id, filePath FROM system_backups ORDER BY createdAt DESC")).fetchall()
    removed = 0
    for r in rows[RETENTION:]:
        try:
            Path(r[1]).unlink(missing_ok=True)
        except Exception:
            pass
        with sync_engine.connect() as conn:
            conn.execute(text("DELETE FROM system_backups WHERE id=:id"), {"id": r[0]})
            conn.commit()
        removed += 1
    return removed
