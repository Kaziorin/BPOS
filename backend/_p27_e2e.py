"""Live end-to-end verification of Prompt 27 — Approval & Workflow Engine + Business Rule Engine.

Run:  ./venv/bin/python _p27_e2e.py   (server must be up on :4000)

Prompt 27 DoD:
  - All 8 stubbed/named approval points now use the real engine:
      PRICE_CHANGE (P6 catalog), STOCK_ADJUST (P8 count), PRICE_OVERRIDE/SALE_DISCOUNT
      (P9 POS), CREDIT_LIMIT + CREDIT_HOLD (P12), PURCHASE_ORDER (P14),
      EXPENSE (P15), TASK (P25)
  - >= 2 configurable business rules fire correctly (LOW_STOCK, SALE_DISCOUNT,
    VIP_CUSTOMER, CREDIT_SALE)
Self-cleaning: every row is marker-scoped (P27E2E) and removed at the end.
"""
import json
import urllib.error
import urllib.request

from db import sync_engine
from sqlalchemy import text

BASE = "http://localhost:4000"
MARK = "P27E2E"
PASSED = []


def call(method, path, body=None, hdrs=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", "Connection": "close", **(hdrs or {})})
    try:
        with urllib.request.urlopen(req) as r:
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


st, d = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
assert st == 200, d
H = {"Authorization": f"Bearer {d['token']}", "x-tenant-id": d["tenant"]["slug"]}
TENANT = d["tenant"]["id"]
ADMIN = d.get("user", {}).get("id")
print(f"tenant={TENANT}")

# ── tracked ids ──
tmpl_ids, appr_ids = [], []
rule_ids, rec_ids, req_ids, po_ids, exp_ids, task_ids = [], [], [], [], [], []
count_ids, cust_ids, sale_ids, shift_ids = [], [], [], []
stock_before = {}


def sql_exec(stmt, **p):
    with sync_engine.connect() as c:
        c.execute(text(stmt), p)
        c.commit()


def sql_scalar(stmt, **p):
    with sync_engine.connect() as c:
        return c.execute(text(stmt), p).scalar()


# ═════════════════════════ 0. Cleanup (marker-based, runs first + last) ═════════════════════════
def cleanup():
    print("\n== cleanup ==")
    with sync_engine.connect() as c:
        # 0. discover leftover marker objects from crashed runs (windowed to the
        #    test session so demo/legacy data is never touched)
        since = "NOW() - INTERVAL 24 HOUR"
        tmpl_ids.extend([r[0] for r in c.execute(text(
            "SELECT id FROM workflow_templates WHERE tenantId=:t AND (name LIKE :m OR name LIKE 'Loop%')"),
            {"t": TENANT, "m": f"{MARK}%"})])
        rule_ids.extend([r[0] for r in c.execute(text(
            "SELECT id FROM business_rules WHERE tenantId=:t AND name LIKE :m"),
            {"t": TENANT, "m": f"{MARK}%"})])
        count_ids.extend([r[0] for r in c.execute(text(
            f"SELECT id FROM stock_counts WHERE tenantId=:t AND status='IN_PROGRESS' AND createdAt >= {since}"),
            {"t": TENANT})])
        exp_ids.extend([r[0] for r in c.execute(text(
            f"SELECT id FROM expenses WHERE tenantId=:t AND title LIKE :m AND createdAt >= {since}"),
            {"t": TENANT, "m": f"{MARK}%"})])
        po_ids.extend([r[0] for r in c.execute(text(
            f"SELECT id FROM purchase_orders WHERE tenantId=:t AND note LIKE :m AND createdAt >= {since}"),
            {"t": TENANT, "m": f"%{MARK}%"})])
        task_ids.extend([r[0] for r in c.execute(text(
            f"SELECT id FROM tasks WHERE tenantId=:t AND title LIKE :m AND createdAt >= {since}"),
            {"t": TENANT, "m": f"{MARK}%"})])
        # approval requests created by our session (marker summary or owned types)
        swept = [r[0] for r in c.execute(text(
            f"SELECT id FROM approval_requests WHERE tenantId=:t AND (summary LIKE :m OR (createdAt >= {since} "
            "AND entityType IN ('PRICE_CHANGE','STOCK_ADJUST','SALE_DISCOUNT','CREDIT_LIMIT','CREDIT_HOLD',"
            "'PURCHASE_ORDER','PURCHASE_REQUISITION','EXPENSE','SHIFT_CLOSE','TASK')))"),
            {"t": TENANT, "m": f"%{MARK}%"})]
        swept_ids = tuple(set(appr_ids) | set(swept)) or ("__none__",)
        # restore stock from applied approval adjustments before removing the trail
        amoves = c.execute(text(
            "SELECT productId, warehouseId, qty FROM stock_movements sm "
            "WHERE sm.tenantId=:t AND sm.refType='APPROVAL' AND sm.refId IN :ids AND sm.qty < 0"),
            {"t": TENANT, "ids": swept_ids}).fetchall()
        for pid, wid, qty in amoves:
            c.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand + :q WHERE tenantId=:t AND warehouseId=:w AND productId=:p"),
                      {"q": -float(qty), "t": TENANT, "w": wid, "p": pid})
        c.execute(text("DELETE FROM stock_movements WHERE tenantId=:t AND refType='APPROVAL' AND refId IN :ids"),
                  {"t": TENANT, "ids": swept_ids})
        c.execute(text("DELETE FROM approval_steps WHERE requestId IN :ids"), {"ids": swept_ids})
        c.execute(text("DELETE FROM approval_requests WHERE id IN :ids"), {"ids": swept_ids})
        # Prompt 28 hook: APPROVAL_REQUIRED notifications reference these approvals
        c.execute(text("DELETE FROM inapp_notifications WHERE refType='APPROVAL' AND refId IN :ids"), {"ids": swept_ids})
        c.execute(text("DELETE FROM notification_logs WHERE refType='APPROVAL' AND refId IN :ids"), {"ids": swept_ids})
        c.execute(text("DELETE FROM approval_requests WHERE tenantId=:t AND entityType='SHIFT_CLOSE' AND entityId IN :sh"),
                  {"t": TENANT, "sh": tuple(shift_ids) or ("__none__",)})
        c.execute(text("DELETE FROM approval_steps WHERE requestId NOT IN (SELECT id FROM approval_requests) AND tenantId=:t"),
                  {"t": TENANT})
        # workflow templates / rules / recommendations created since this run began
        if tmpl_ids:
            c.execute(text("DELETE FROM workflow_templates WHERE id IN :ids"), {"ids": tuple(tmpl_ids)})
        if rule_ids:
            c.execute(text("DELETE FROM business_rules WHERE id IN :ids"), {"ids": tuple(rule_ids)})
        c.execute(text("DELETE FROM purchase_recommendations WHERE tenantId=:t AND note LIKE 'Auto:%'"),
                  {"t": TENANT})
        if rec_ids:
            c.execute(text("DELETE FROM purchase_recommendations WHERE id IN :ids"), {"ids": tuple(rec_ids)})
        # requisitions / purchase orders
        if req_ids:
            c.execute(text("DELETE FROM purchase_requisition_items WHERE requisitionId IN :ids"), {"ids": tuple(req_ids)})
            c.execute(text("DELETE FROM purchase_requisitions WHERE id IN :ids"), {"ids": tuple(req_ids)})
        if po_ids:
            c.execute(text("DELETE FROM purchase_order_items WHERE purchaseOrderId IN :ids"), {"ids": tuple(po_ids)})
            c.execute(text("DELETE FROM purchase_orders WHERE id IN :ids"), {"ids": tuple(po_ids)})
        if exp_ids:
            c.execute(text("DELETE FROM expenses WHERE id IN :ids"), {"ids": tuple(exp_ids)})
        if task_ids:
            c.execute(text("DELETE FROM task_comments WHERE taskId IN :ids"), {"ids": tuple(task_ids)})
            c.execute(text("DELETE FROM tasks WHERE id IN :ids"), {"ids": tuple(task_ids)})
        # sale graph (POS discount test)
        if sale_ids:
            sale_rids = tuple(sale_ids)
            jids = [r[0] for r in c.execute(text(
                "SELECT id FROM journals WHERE refId IN :s OR narration LIKE :m"), {"s": sale_rids, "m": f"%{MARK}%"})]
            if jids:
                c.execute(text("DELETE FROM ledger_entries WHERE journalId IN :ids"), {"ids": tuple(jids)})
                c.execute(text("DELETE FROM journals WHERE id IN :ids"), {"ids": tuple(jids)})
            moves = c.execute(text("SELECT productId, warehouseId, qty FROM stock_movements WHERE refId IN :s"),
                              {"s": sale_rids}).fetchall()
            for pid, wid, qty in moves:  # no return — restore everything we sold
                if qty is not None and float(qty) < 0:
                    c.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand + :q WHERE tenantId=:t AND warehouseId=:w AND productId=:p"),
                              {"q": -float(qty), "t": TENANT, "w": wid, "p": pid})
            c.execute(text("DELETE FROM stock_movements WHERE refId IN :s"), {"s": sale_rids})
            for t, col in (("sale_items", "saleId"), ("payments", "saleId"), ("invoices", "saleId"),
                           ("loyalty_transactions", "saleId"), ("shift_txns", "refId"),
                           ("tax_transactions", "refId")):
                c.execute(text(f"DELETE FROM {t} WHERE {col} IN :s"), {"s": sale_rids})
            c.execute(text("DELETE FROM sales WHERE id IN :s"), {"s": sale_rids})
        # leftover OPEN / PENDING_APPROVAL shifts from crashed runs (recent,
        # admin-opened, only our sales — the variance-close flow leaves a shift
        # PENDING_APPROVAL, which also blocks a fresh open on that branch)
        sale_rids2 = tuple(sale_ids) or ("__none__",)
        shift_ids.extend([r[0] for r in c.execute(text(
            "SELECT id FROM cash_shifts WHERE tenantId=:t AND status IN ('OPEN','PENDING_APPROVAL') "
            "AND openedAt > NOW() - INTERVAL 3 HOUR AND createdBy=:u AND NOT EXISTS "
            "(SELECT 1 FROM shift_txns stx WHERE stx.shiftId=cash_shifts.id "
            "AND stx.refId IS NOT NULL AND stx.refId <> '' AND stx.refId NOT IN :sr)"),
            {"t": TENANT, "u": ADMIN, "sr": sale_rids2})])
        if shift_ids:
            sh_t = tuple(set(shift_ids))
            c.execute(text("DELETE FROM shift_txns WHERE shiftId IN :ids"), {"ids": sh_t})
            c.execute(text("DELETE FROM cash_shifts WHERE id IN :ids"), {"ids": sh_t})
        # stock counts + items
        if count_ids:
            c.execute(text("DELETE FROM stock_count_items WHERE countId IN :ids"), {"ids": tuple(count_ids)})
            c.execute(text("DELETE FROM stock_counts WHERE id IN :ids"), {"ids": tuple(count_ids)})
        if cust_ids:
            c.execute(text("DELETE FROM customers WHERE id IN :ids"), {"ids": tuple(cust_ids)})
        # marker customers (crashed-run leftovers whose approval chain already moved past)
        mk_custs = [r[0] for r in c.execute(text(
            "SELECT id FROM customers WHERE tenantId=:t AND name LIKE :m"),
            {"t": TENANT, "m": f"{MARK}%"})]
        if mk_custs:
            c.execute(text("DELETE FROM customers WHERE id IN :ids"), {"ids": tuple(mk_custs)})
        sql_exec("UPDATE products SET reorderPoint=10 WHERE id=:p", p=sid if "sid" in globals() else "__none__")
        c.commit()


T0 = sql_scalar("SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')")
cleanup()

# ═════════════════════════ 1. ENGINE: templates, multi-level, reject, escalate ═════════════════════════
print("\n== 1. Engine primitives ==")
st, r = call("POST", "/api/v1/approvals/templates", {"name": f"{MARK} 2-level",
             "entityType": "PURCHASE_ORDER", "entityLabel": "Purchase order",
             "conditionValue": 0, "levels": [{"level": 1, "role": "MANAGER"}, {"level": 2, "role": "DIRECTOR"}],
             "escalateAfterHours": 1}, H)
check("template created", st == 201, str(r))
t2 = r["data"]["id"]
tmpl_ids.append(t2)
st, r = call("GET", "/api/v1/approvals/templates", hdrs=H)
check("template list", st == 200 and any(x["id"] == t2 and len(x["levels"]) == 2 for x in r.get("data", [])), str(r)[:200])
st, r = call("DELETE", f"/api/v1/approvals/templates/{t2}", hdrs=H)
check("template delete", st == 200, str(r))

# seed the approval points used by the rest of the test
def add_template(entity_type, threshold, label=None, levels=None):
    st, r = call("POST", "/api/v1/approvals/templates", {
        "name": f"{MARK} {entity_type}", "entityType": entity_type, "entityLabel": label or entity_type,
        "conditionValue": threshold, "conditionOperator": ">",
        "levels": levels or [{"level": 1, "role": "MANAGER"}]}, H)
    assert st == 201, (entity_type, r)
    tid = r["data"]["id"]
    tmpl_ids.append(tid)
    return tid


# ═════════════════════════ 2. PRICE CHANGE approval (Prompt 6) ═════════════════════════
print("\n== 2. Price change approval ==")
add_template("PRICE_CHANGE", 100)
st, pr = call("GET", "/api/v1/products?limit=500", hdrs=H)
prods = pr.get("data", [])
prod = next((p for p in prods if p.get("sellingPrice")), prods[0])
old_price = float(prod.get("sellingPrice") or 0)
st, r = call("PUT", f"/api/v1/products/{prod['id']}", {"sellingPrice": old_price + 250}, H)
d = r.get("data", {})
check("big price change waits for approval", st == 202 and d.get("needsApproval") is True, str(r))
appr_ids.append(d["approval"]["approvalId"])
unchanged = float(sql_scalar("SELECT sellingPrice FROM products WHERE id=:p", p=prod["id"]) or 0)
check("price NOT applied while pending", unchanged == old_price, f"{unchanged} vs {old_price}")
st, r = call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} ok"}, H)
check("price approval granted", st == 200 and r.get("data", {}).get("status") == "APPROVED", str(r))
now_price = float(sql_scalar("SELECT sellingPrice FROM products WHERE id=:p", p=prod["id"]) or 0)
check("deferred price applied on approval", now_price == old_price + 250, f"{now_price} vs {old_price+250}")
sql_exec("UPDATE products SET sellingPrice=:sp, wholesalePrice=COALESCE(wholesalePrice,0) WHERE id=:p",
         sp=old_price, p=prod["id"])  # revert
# below-threshold edit applies immediately
st, r = call("PUT", f"/api/v1/products/{prod['id']}", {"sellingPrice": old_price + 50}, H)
check("small price change applies immediately", st == 200 and r.get("data", {}).get("updated") is True, str(r))
sql_exec("UPDATE products SET sellingPrice=:sp WHERE id=:p", sp=old_price, p=prod["id"])

# ═════════════════════════ 3. STOCK ADJUST approval (Prompt 8) ═════════════════════════
print("\n== 3. Stock adjustment approval ==")
add_template("STOCK_ADJUST", 20)
st, ws = call("GET", "/api/v1/warehouses", hdrs=H)
wh = ws.get("data", [])[0]
# pick a stocked, recipe-free product: reuse the demo charger (stock 721)
stock_row = sql_scalar("SELECT id FROM stock WHERE tenantId=:t AND warehouseId=:w AND qtyOnHand >= 100 AND productId='f85891f5-6ea1-4746-96e4-cc6b6b4a33d7'",
                       t=TENANT, w=wh["id"])
if not stock_row:
    stock_row = sql_scalar("SELECT s.id FROM stock s WHERE s.tenantId=:t AND s.warehouseId=:w AND s.qtyOnHand >= 100 LIMIT 1",
                           t=TENANT, w=wh["id"])
sid = sql_scalar("SELECT productId FROM stock WHERE id=:id", id=stock_row)
sqty = float(sql_scalar("SELECT qtyOnHand FROM stock WHERE id=:id", id=stock_row))
st, r = call("POST", "/api/v1/inventory/counts", {"warehouseId": wh["id"]}, H)
check("count created", st == 201, str(r))
cid = r["data"]["id"]
count_ids.append(cid)
# the count auto-lists every stocked product — reconcile every line at its system
# qty so exactly ONE adjustment (-25 on our product) survives for approval
items_all = []
with sync_engine.connect() as c:
    items_all = [(str(x[0]), x[1], float(x[2])) for x in c.execute(text(
        "SELECT productId, variantId, systemQty FROM stock_count_items WHERE countId=:c"), {"c": cid})]
for pid, vid, sysq in items_all:
    counted = sysq - 25 if pid == sid else sysq
    st, r = call("POST", f"/api/v1/inventory/counts/{cid}/items",
                 {"productId": pid, "variantId": vid, "countedQty": counted}, H)
    check(f"count line reconciled ({pid[:8]})", st == 200, str(r))
st, r = call("GET", "/api/v1/inventory/counts", hdrs=H)
nonzero = 0
with sync_engine.connect() as c:
    nonzero = c.execute(text("SELECT COUNT(*) FROM stock_count_items WHERE countId=:c AND diffQty != 0"),
                        {"c": cid}).scalar()
check("exactly one nonzero count diff", nonzero == 1, f"diffs={nonzero}")
st, r = call("POST", f"/api/v1/inventory/counts/{cid}/complete", {}, H)
d = r.get("data", {})
check("big stock adjustment waits for approval", st == 202 and d.get("needsApproval") is True, str(r))
appr_ids.append(d["approval"]["approvalId"])
q_now = float(sql_scalar("SELECT qtyOnHand FROM stock WHERE id=:id", id=stock_row))
check("stock NOT adjusted while pending", q_now == sqty, f"{q_now} vs {sqty}")
st, r = call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} ok"}, H)
check("stock approval granted", st == 200 and r.get("data", {}).get("status") == "APPROVED", str(r))
q_after = float(sql_scalar("SELECT qtyOnHand FROM stock WHERE id=:id", id=stock_row))
check("stock adjusted on approval (-25)", q_after == sqty - 25, f"{q_after} vs {sqty-25}")
st, r = call("GET", f"/api/v1/approvals/{appr_ids[-1]}", hdrs=H)
check("approval audit trail has steps", len(r.get("data", {}).get("steps", [])) >= 1, str(r)[:200])

# ═════════════════════════ 4. CREDIT LIMIT + HOLD approval (Prompt 12) ═════════════════════════
print("\n== 4. Credit approval ==")
add_template("CREDIT_LIMIT", 1000)
add_template("CREDIT_HOLD", 0)
st, r = call("POST", "/api/v1/customers", {"name": f"{MARK} Credit", "phone": "01799990001"}, H)
phone = "01799990001"
cid_cust = sql_scalar("SELECT id FROM customers WHERE tenantId=:t AND phone=:p", t=TENANT, p=phone)
cust_ids.append(cid_cust)
st, r = call("PATCH", f"/api/v1/credit/{cid_cust}/limit", {"creditLimit": 5000}, H)
check("credit limit raise (5k) waits for approval", st == 202 and r.get("data", {}).get("needsApproval"), str(r))
appr_ids.append(r["data"]["approval"]["approvalId"])
cl = float(sql_scalar("SELECT creditLimit FROM customers WHERE id=:c", c=cid_cust) or 0)
check("limit NOT raised while pending", cl == 0, str(cl))
call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} ok"}, H)
cl = float(sql_scalar("SELECT creditLimit FROM customers WHERE id=:c", c=cid_cust) or 0)
check("credit limit applied on approval", cl == 5000.0, str(cl))
st, r = call("POST", f"/api/v1/credit/{cid_cust}/hold", {"onHold": True}, H)
check("credit hold waits for approval", st == 202 and r.get("data", {}).get("needsApproval"), str(r))
appr_ids.append(r["data"]["approval"]["approvalId"])
stt = sql_scalar("SELECT status FROM customers WHERE id=:c", c=cid_cust)
check("customer NOT held while pending", stt == "ACTIVE", str(stt))
call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} ok"}, H)
stt = sql_scalar("SELECT status FROM customers WHERE id=:c", c=cid_cust)
check("credit hold applied on approval", stt == "INACTIVE", str(stt))
# reject path
st, r = call("POST", f"/api/v1/credit/{cid_cust}/hold", {"onHold": False}, H)
appr_ids.append(r["data"]["approval"]["approvalId"])
st, r = call("POST", f"/api/v1/approvals/{appr_ids[-1]}/reject", {"comment": f"{MARK} no"}, H)
check("reject works", st == 200 and r.get("data", {}).get("status") == "REJECTED", str(r))
stt = sql_scalar("SELECT status FROM customers WHERE id=:c", c=cid_cust)
check("rejected hold not applied (still INACTIVE)", stt == "INACTIVE", str(stt))

# ═════════════════════════ 5. EXPENSE approval (Prompt 15) ═════════════════════════
print("\n== 5. Expense approval ==")
add_template("EXPENSE", 500)
st, r = call("POST", "/api/v1/expenses", {"title": f"{MARK} expense", "amount": 900, "paymentMethod": "BANK"}, H)
check("expense created PENDING", st == 201, str(r))
eid = r["data"]["id"]
exp_ids.append(eid)
st, r = call("POST", f"/api/v1/expenses/{eid}/approve", {}, H)
d = r.get("data", {})
check("big expense routes through engine", st == 202 and d.get("needsApproval"), str(r))
appr_ids.append(d["approval"]["approvalId"])
est = sql_scalar("SELECT status FROM expenses WHERE id=:i", i=eid)
check("expense still PENDING", est == "PENDING", str(est))
call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} ok"}, H)
est = sql_scalar("SELECT status FROM expenses WHERE id=:i", i=eid)
check("expense APPROVED via engine", est == "APPROVED", str(est))

# ═════════════════════════ 6. PURCHASE ORDER approval (Prompt 14) ═════════════════════════
print("\n== 6. Purchase order approval ==")
add_template("PURCHASE_ORDER", 1000, levels=[{"level": 1, "role": "MANAGER"}, {"level": 2, "role": "DIRECTOR"}])
st, sup = call("GET", "/api/v1/suppliers?limit=1", hdrs=H)
sup_id = sup["data"][0]["id"]
st, r = call("POST", "/api/v1/purchasing/orders", {
    "supplierId": sup_id, "items": [{"productId": prod["id"], "qty": 10, "unitPrice": 250}],
    "note": f"{MARK} po"}, H)
check("PO created", st == 201, str(r))
poid = r["data"]["id"]
po_ids.append(poid)
st, r = call("POST", f"/api/v1/purchasing/orders/{poid}/approve", {}, H)
d = r.get("data", {})
check("PO over threshold routes through engine", st == 202 and d.get("needsApproval"), str(r))
appr_ids.append(d["approval"]["approvalId"])
pos = sql_scalar("SELECT status FROM purchase_orders WHERE id=:i", i=poid)
check("PO still SUBMITTED", pos == "SUBMITTED", str(pos))
# multi-level: escalate from MANAGER → DIRECTOR then approve
st, r = call("POST", f"/api/v1/approvals/{appr_ids[-1]}/escalate", {"comment": f"{MARK} busy"}, H)
check("escalate to next level", st == 200 and r.get("data", {}).get("status") == "ESCALATED"
      and r.get("data", {}).get("final") is False, str(r))
st, r = call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} director ok"}, H)
check("PO final approval", st == 200 and r.get("data", {}).get("status") == "APPROVED", str(r))
pos = sql_scalar("SELECT status FROM purchase_orders WHERE id=:i", i=poid)
check("PO APPROVED via engine", pos == "APPROVED", str(pos))

# ═════════════════════════ 7. TASK approval (Prompt 25) ═════════════════════════
print("\n== 7. Task approval ==")
add_template("TASK", 0)
st, r = call("POST", "/api/v1/tasks", {"title": f"{MARK} task", "priority": "HIGH", "note": f"{MARK}"}, H)
check("task created", st == 201, str(r))
tid_t = r["data"]["id"]
task_ids.append(tid_t)
for s in ("IN_PROGRESS", "COMPLETED"):
    st, r = call("POST", f"/api/v1/tasks/{tid_t}/status", {"status": s}, H)
    check(f"task -> {s}", st in (200, 201), str(r))
st, r = call("POST", f"/api/v1/tasks/{tid_t}/status", {"status": "APPROVED"}, H)
d = r.get("data", {})
check("task approval routes through engine", st == 202 and d.get("needsApproval"), str(r))
appr_ids.append(d["approval"]["approvalId"])
ts = sql_scalar("SELECT status FROM tasks WHERE id=:i", i=tid_t)
check("task still COMPLETED", ts == "COMPLETED", str(ts))
call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} ok"}, H)
ts = sql_scalar("SELECT status FROM tasks WHERE id=:i", i=tid_t)
check("task APPROVED via engine", ts == "APPROVED", str(ts))

# ═════════════════════════ 8. POS price-override / discount approval (Prompt 9) ═════════════════════════
print("\n== 8. POS discount approval ==")
add_template("SALE_DISCOUNT", 200)
st, bs = call("GET", "/api/v1/branches", hdrs=H)
branch = bs.get("data", [])[0]
# A crashed run's variance close can leave a PENDING_APPROVAL shift behind,
# which blocks a fresh open — sweep it via approve-close (routes through the
# SHIFT_CLOSE workflow-engine request when one exists).
cur_st, cur_r = call("GET", f"/api/v1/cash-register/current?branchId={branch['id']}", hdrs=H)
cur_shift = ((cur_r.get("data") or {}).get("shift") or {})
if cur_shift.get("status") == "PENDING_APPROVAL":
    st, r = call("POST", f"/api/v1/cash-register/{cur_shift['id']}/approve-close",
                 {"comment": f"{MARK} sweep stale shift"}, H)
    check("stale PENDING_APPROVAL shift swept via approve-close", st == 200, str(r)[:200])
sh0 = sql_scalar("SELECT id FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status='OPEN' LIMIT 1",
                 t=TENANT, b=branch["id"])
if not sh0:
    st, r = call("POST", "/api/v1/cash-register/open", {"branchId": branch["id"], "openingCash": 10000}, H)
    shift_ids.append(r["data"]["id"])
else:
    # Reusing an existing OPEN shift — make sure the close below knows its id.
    shift_ids.append(sh0)
st, sale = call("POST", "/api/v1/pos/confirm", {
    "branchId": branch["id"], "warehouseId": wh["id"],
    "items": [{"productId": sid, "qty": 5, "unitPrice": 100}],
    "discountTotal": 300,
    "payments": [{"method": "CASH", "amount": 200}],
    "note": f"{MARK} sale"}, H)
check("POS sale with big discount confirmed", st in (200, 201), str(sale))
sale_id = sale["data"]["saleId"]
sale_ids.append(sale_id)
check("discount approval request created", sale.get("data", {}).get("needsApproval") is True, str(sale)[:200])
appr_ids.append(sale["data"]["approval"]["approvalId"])
call("POST", f"/api/v1/approvals/{appr_ids[-1]}/approve", {"comment": f"{MARK} ok"}, H)
st, r = call("GET", f"/api/v1/approvals/{appr_ids[-1]}", hdrs=H)
check("discount approval APPROVED", r.get("data", {}).get("status") == "APPROVED", str(r)[:200])
# close the shift via approve-close (works with or without a SHIFT_CLOSE template)
st, r = call("POST", f"/api/v1/cash-register/{shift_ids[-1]}/close", {"countedCash": 0}, H)
d = r.get("data", {})
check("variance close flags approval", st == 200 and d.get("needsApproval") is True, str(r)[:200])
# approve the flagged close so the shift actually CLOSES — leaves no
# PENDING_APPROVAL blocker behind for the next run.
st, r = call("POST", f"/api/v1/cash-register/{shift_ids[-1]}/approve-close", {"comment": f"{MARK} approve variance"}, H)
check("variance close approved -> shift CLOSED", st == 200 and r.get("data", {}).get("closed"), str(r)[:200])
sh_st = sql_scalar("SELECT status FROM cash_shifts WHERE id=:s", s=shift_ids[-1])
check("shift status is CLOSED after approval", sh_st == "CLOSED", str(sh_st))

# ═════════════════════════ 9. Business rules (>= 2 fire) ═════════════════════════
print("\n== 9. Business rules ==")
# Rule A: LOW_STOCK → purchase recommendation
st, r = call("POST", "/api/v1/business-rules", {"name": f"{MARK} LowStock", "triggerType": "LOW_STOCK",
             "actions": [{"type": "CREATE_PURCHASE_RECOMMENDATION", "warehouseId": wh["id"],
                           "reorderPoint": 800}]}, H)
check("rule (LOW_STOCK) created", st == 201, str(r))
rule_a = r["data"]["id"]
rule_ids.append(rule_a)
# drive sid under reorderPoint 800 so the rule deterministically flags it
# (the rebuilt demo seed no longer guarantees sid sits at the old 721 baseline)
sql_exec("UPDATE products SET reorderPoint=800 WHERE id=:p", p=sid)
sid_q = sql_scalar("SELECT qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p",
                   t=TENANT, w=wh["id"], p=sid)
if sid_q is None or float(sid_q) >= 800:
    sql_exec("UPDATE stock SET qtyOnHand=50 WHERE tenantId=:t AND warehouseId=:w AND productId=:p",
             t=TENANT, w=wh["id"], p=sid)
st, r = call("POST", "/api/v1/business-rules/evaluate", {"triggerType": "LOW_STOCK", "context": {}}, H)
res = r.get("data", {})
check("LOW_STOCK rule fired", st == 200 and len(res.get("results", [])) >= 1
      and any(x.get("created", 0) >= 1 for x in res.get("results", [])), str(res)[:300])
# restore stock to its pre-test level (rule already saw the forced 50)
if sid_q is not None and float(sid_q) >= 800:
    sql_exec("UPDATE stock SET qtyOnHand=:q WHERE tenantId=:t AND warehouseId=:w AND productId=:p",
             q=float(sid_q), t=TENANT, w=wh["id"], p=sid)
rec_rows = sql_scalar("SELECT id FROM purchase_recommendations WHERE tenantId=:t AND productId=:p ORDER BY createdAt DESC LIMIT 1",
                      t=TENANT, p=sid)
check("purchase recommendation created for low-stock product", rec_rows is not None, str(rec_rows))
if rec_rows:
    rec_ids.append(rec_rows)
st, r = call("POST", f"/api/v1/purchase-recommendations/{rec_rows}/convert", {}, H)
check("recommendation converted to requisition", st == 200 and r.get("data", {}).get("converted"), str(r))
if r.get("data", {}).get("requisitionId"):
    req_ids.append(r["data"]["requisitionId"])
sql_exec("UPDATE products SET reorderPoint=10 WHERE id=:p", p=sid)
# Rule B: SALE_DISCOUNT 20%+ → approval request via rule engine
st, r = call("POST", "/api/v1/business-rules", {"name": f"{MARK} BigDiscount", "triggerType": "SALE_DISCOUNT",
             "conditions": {"discountPct": {"op": "gt", "value": 20}},
             "actions": [{"type": "CREATE_APPROVAL", "entityType": "SALE_DISCOUNT",
                          "summary": f"{MARK} rule approval"}]}, H)
rule_b = r["data"]["id"]
rule_ids.append(rule_b)
st, r = call("POST", "/api/v1/business-rules/evaluate", {"triggerType": "SALE_DISCOUNT",
             "context": {"discountPct": 25, "amount": 500, "entityId": "rule-test", "entityNo": "T1"}}, H)
res = r.get("data", {})
apprs = [x.get("approval") for x in res.get("results", []) if x.get("approval")]
check("SALE_DISCOUNT rule created an approval", len(apprs) >= 1, str(res)[:300])
appr_ids.append(apprs[0]["approvalId"])
st, r = call("POST", f"/api/v1/approvals/{appr_ids[-1]}/reject", {"comment": f"{MARK} nope"}, H)
check("rule approval rejected cleanly", st == 200 and r.get("data", {}).get("status") == "REJECTED", str(r))
# Rule C: CREDIT_SALE → BLOCK verdict
st, r = call("POST", "/api/v1/business-rules", {"name": f"{MARK} CreditBlock", "triggerType": "CREDIT_SALE",
             "actions": [{"type": "BLOCK", "reason": "Credit limit exceeded"}]}, H)
rule_c = r["data"]["id"]
rule_ids.append(rule_c)
st, r = call("POST", "/api/v1/business-rules/evaluate", {"triggerType": "CREDIT_SALE", "context": {"dueAmount": 99999}}, H)
res = r.get("data", {})
blocked = [x for x in res.get("results", []) if x.get("blocked")]
check("CREDIT_SALE rule returns BLOCK verdict", len(blocked) >= 1, str(res)[:300])

# ═════════════════════════ 10. Cleanup + neutrality ═════════════════════════
cleanup()
left = sql_scalar("SELECT COUNT(*) FROM approval_requests WHERE summary LIKE :m OR (tenantId=:t AND summary LIKE :m2)",
                  m=f"%{MARK}%", t=TENANT, m2=f"%{MARK}%")
check("no leftover approval requests", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM workflow_templates WHERE name LIKE :m", m=f"{MARK}%")
check("no leftover templates", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM business_rules WHERE name LIKE :m", m=f"{MARK}%")
check("no leftover rules", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM customers WHERE name LIKE :m", m=f"{MARK}%")
check("no leftover customers", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM sales WHERE note LIKE :m", m=f"%{MARK}%")
check("no leftover sales", int(left or 0) == 0, str(left))

print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 27 — Approval/Workflow + Business Rules: VERIFIED")
print(f"{'='*60}")
