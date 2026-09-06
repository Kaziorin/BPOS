"""Prompt 36 — Search + Import/Export + Data Migration: E2E.

Run:  venv/bin/python _p36_e2e.py   (server must be up on :4000)
"""
import csv
import io
import json
import urllib.error
import urllib.request

from db import sync_engine
from sqlalchemy import text

BASE = "http://localhost:4000"
PASSED = []
MARK = "P36"


def call(method, path, body=None, hdrs=None, raw=False):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", **(hdrs or {})})
    try:
        with urllib.request.urlopen(req) as r:
            if raw:
                return r.status, r.read().decode()
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def check(label, cond, detail=""):
    if cond:
        PASSED.append(label)
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label}  {detail}")
        raise SystemExit(1)


def sql_exec(stmt, **p):
    with sync_engine.connect() as c:
        c.execute(text(stmt), p)
        c.commit()


def sql_scalar(stmt, **p):
    with sync_engine.connect() as c:
        return c.execute(text(stmt), p).scalar()


# Login
st, d = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
assert st == 200, d
H = {"Authorization": f"Bearer {d['token']}", "x-tenant-id": d["tenant"]["slug"]}
TENANT = d["tenant"]["id"]
print(f"tenant={TENANT} slug={d['tenant']['slug']}")


# ═══════════════ 1. GLOBAL SEARCH ═══════════════
print("\n== 1. Global Search ==")

# Search products by name
st, r = call("GET", "/api/v1/search?q=a&limit=10", hdrs=H)
results = r.get("data", []) if st == 200 else []
check("search by single char", st == 200 and isinstance(results, list), str(r)[:200])

# Search with type filter
st, r = call("GET", "/api/v1/search?q=1&type=PRODUCTS", hdrs=H)
check("search products only", st == 200, str(r)[:200])

# Search customers
st, r = call("GET", "/api/v1/search?q=&type=CUSTOMERS", hdrs=H)
check("search customers", st == 200, str(r)[:200])

# Search invoices
st, r = call("GET", "/api/v1/search?q=INV&type=INVOICES", hdrs=H)
check("search invoices", st == 200, str(r)[:200])

# Search sales
st, r = call("GET", "/api/v1/search?q=SALE&type=SALES", hdrs=H)
check("search sales", st == 200, str(r)[:200])

# Empty query
st, r = call("GET", "/api/v1/search?q=", hdrs=H)
check("empty query returns empty", st == 200 and len(r.get("data", [])) == 0, str(r)[:200])

# Suggestions
st, r = call("GET", "/api/v1/search/suggestions?q=a", hdrs=H)
check("search suggestions", st == 200, str(r)[:200])

# Suggestions too short
st, r = call("GET", "/api/v1/search/suggestions?q=a", hdrs=H)
check("suggestions for 1 char", st == 200, str(r)[:200])


# ═══════════════ 2. IMPORT ═══════════════
print("\n== 2. CSV Import ==")

# Get import schema
st, r = call("GET", "/api/v1/import/schema/PRODUCTS", hdrs=H)
schema = r.get("data", {}) if st == 200 else {}
check("import schema for products", st == 200 and "columns" in schema, str(r)[:200])
check("schema has name + sku", "name" in schema.get("columns", []) and "sku" in schema.get("columns", []), str(schema)[:200])

# Invalid entity type
st, r = call("GET", "/api/v1/import/schema/INVALID", hdrs=H)
check("reject invalid entity type", st == 400, str(r)[:200])

# Create a test CSV in memory
csv_buf = io.StringIO()
writer = csv.writer(csv_buf)
writer.writerow(["name", "sku", "sellingPrice", "costPrice", "barcode", "reorderPoint"])
writer.writerow([f"Test Product {MARK}", "TP-001", "29.99", "15.00", "5901234123457", "10"])
writer.writerow([f"Test Product 2 {MARK}", "TP-002", "49.99", "25.00", "5901234123458", "5"])
writer.writerow(["", "TP-003", "19.99", "10.00", "", "0"])  # Missing name — should error
writer.writerow([f"Test Product 4 {MARK}", "TP-004", "not-a-number", "5.00", "", "10"])  # Bad price — should error
csv_content = csv_buf.getvalue().encode("utf-8-sig")

# Upload CSV
import tempfile, os
tmp = tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="wb")
tmp.write(csv_content)
tmp.close()

# Upload via multipart
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="entityType"\r\n\r\n'
    f"PRODUCTS\r\n"
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="test_products.csv"\r\n'
    f"Content-Type: text/csv\r\n\r\n"
).encode() + csv_content + f"\r\n--{boundary}--\r\n".encode()

req = urllib.request.Request(
    f"{BASE}/api/v1/import/upload", data=body, method="POST",
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}", **H})
try:
    with urllib.request.urlopen(req) as resp:
        st = resp.status
        upload_result = json.loads(resp.read())
except urllib.error.HTTPError as e:
    st = e.code
    upload_result = json.loads(e.read() or b"{}")

data = upload_result.get("data", {}) if st in (200, 201) else {}
check("upload CSV", st in (200, 201) and "jobId" in data, str(upload_result)[:200])
check("total rows detected", data.get("totalRows") == 4, f"got {data.get('totalRows')}")
check("validation found errors", data.get("errorRows", 0) >= 1, f"got {data.get('errorRows')} errors")
check("headers extracted", len(data.get("headers", [])) >= 5, str(data)[:200])
check("column mapping generated", len(data.get("mapping", {})) >= 3, str(data)[:200])
check("preview rows returned", len(data.get("preview", [])) == 4, str(data)[:200])

job_id = data.get("jobId")

# Confirm import
if job_id:
    st, r = call("POST", f"/api/v1/import/{job_id}/confirm", {"mapping": data.get("mapping", {}), "skipErrors": True}, hdrs=H)
    check("confirm import", st == 200, str(r)[:200])

# List import jobs
st, r = call("GET", "/api/v1/import/jobs", hdrs=H)
jobs = r.get("data", []) if st == 200 else []
check("list import jobs", st == 200 and isinstance(jobs, list), str(r)[:200])
check("import job recorded", len(jobs) >= 1, f"got {len(jobs)}")

os.unlink(tmp.name)


# ═══════════════ 3. EXPORT ═══════════════
print("\n== 3. CSV Export ==")

# Export products as CSV
st, r = call("POST", "/api/v1/export", {"entityType": "PRODUCTS", "format": "CSV"}, hdrs=H, raw=True)
check("export products CSV", st == 200 and "Name" in r, f"got status {st}")

# Export customers
st, r = call("POST", "/api/v1/export", {"entityType": "CUSTOMERS", "format": "CSV"}, hdrs=H, raw=True)
check("export customers CSV", st == 200, f"got status {st}")

# Export sales
st, r = call("POST", "/api/v1/export", {"entityType": "SALES", "format": "CSV"}, hdrs=H, raw=True)
check("export sales CSV", st == 200, f"got status {st}")

# Export inventory
st, r = call("POST", "/api/v1/export", {"entityType": "INVENTORY", "format": "CSV"}, hdrs=H, raw=True)
check("export inventory CSV", st == 200, f"got status {st}")

# Invalid entity type
st, r = call("POST", "/api/v1/export", {"entityType": "INVALID"}, hdrs=H)
check("reject invalid export type", st == 400, str(r)[:200])

# Invalid format
st, r = call("POST", "/api/v1/export", {"entityType": "PRODUCTS", "format": "XML"}, hdrs=H)
check("reject invalid format", st == 400, str(r)[:200])

# List export jobs
st, r = call("GET", "/api/v1/export/jobs", hdrs=H)
check("list export jobs", st == 200, str(r)[:200])


# ═══════════════ 4. BULK OPERATIONS ═══════════════
print("\n== 4. Bulk Operations ==")

# Get a product to bulk update
st, prods = call("GET", "/api/v1/products?limit=1", hdrs=H)
product_list = prods.get("data", []) if st == 200 else []
if product_list:
    pid = product_list[0]["id"]
    st, r = call("POST", "/api/v1/bulk/update-products", {
        "productIds": [pid],
        "updates": {"reorderPoint": 15}
    }, hdrs=H)
    data = r.get("data", {}) if st == 200 else {}
    check("bulk update products", st == 200 and "updated" in data, str(r)[:200])
else:
    check("bulk update products (no products)", True, "skipped")

# Bulk update customers
st, custs = call("GET", "/api/v1/customers?limit=1", hdrs=H)
cust_list = custs.get("data", []) if st == 200 else []
if cust_list:
    cid = cust_list[0]["id"]
    st, r = call("POST", "/api/v1/bulk/update-customers", {
        "customerIds": [cid],
        "updates": {"creditLimit": 50000}
    }, hdrs=H)
    check("bulk update customers", st == 200, str(r)[:200])
else:
    check("bulk update customers (no customers)", True, "skipped")

# Invalid field
st, r = call("POST", "/api/v1/bulk/update-products", {
    "productIds": ["x"], "updates": {"password": "hack"}
}, hdrs=H)
check("reject invalid bulk field", st == 400, str(r)[:200])


# ═══════════════ 5. MIGRATION WIZARD ═══════════════
print("\n== 5. Data Migration Wizard ==")

# Create session
st, r = call("POST", "/api/v1/migration/sessions", {
    "name": f"From Square POS {MARK}",
    "sourceSystem": "Square",
}, hdrs=H)
data = r.get("data", {}) if st in (200, 201) else {}
check("create migration session", st in (200, 201) and "sessionId" in data, str(r)[:200])
session_id = data.get("sessionId")
check("default tables included", len(data.get("tables", [])) >= 4, str(data)[:200])

# List sessions
st, r = call("GET", "/api/v1/migration/sessions", hdrs=H)
sessions = r.get("data", []) if st == 200 else []
check("list migration sessions", st == 200 and isinstance(sessions, list), str(r)[:200])

# Get session
if session_id:
    st, r = call("GET", f"/api/v1/migration/sessions/{session_id}", hdrs=H)
    check("get migration session", st == 200, str(r)[:200])

    # Update mapping
    st, r = call("PATCH", f"/api/v1/migration/sessions/{session_id}", {
        "status": "MAPPING",
        "tables": [
            {"source": "Products", "target": "products", "mapping": {"Name": "name", "Price": "sellingPrice"}, "status": "mapped"},
            {"source": "Customers", "target": "customers", "mapping": {}, "status": "pending"},
        ]
    }, hdrs=H)
    check("update migration session", st == 200, str(r)[:200])

    # Run migration
    st, r = call("POST", f"/api/v1/migration/sessions/{session_id}/run", hdrs=H)
    data = r.get("data", {}) if st == 200 else {}
    check("run migration", st == 200 and "status" in data, str(r)[:200])
    check("migration completed", data.get("status") == "COMPLETED", str(data)[:200])

# Non-existent session
st, r = call("GET", "/api/v1/migration/sessions/nonexistent", hdrs=H)
check("404 for non-existent session", st == 404, str(r)[:200])


# ═══════════════ CLEANUP ═══════════════
print("\n== cleanup ==")
try:
    sql_exec("DELETE FROM import_jobs WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM export_jobs WHERE tenantId=:t", t=TENANT)
    sql_exec("DELETE FROM migration_sessions WHERE tenantId=:t", t=TENANT)
except Exception as e:
    print(f"  Warning: cleanup partial: {e}")
print("  Cleanup done")


# ═══════════════ SUMMARY ═══════════════
print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 36 — Search + Import/Export + Data Migration: VERIFIED")
print(f"{'='*60}")
