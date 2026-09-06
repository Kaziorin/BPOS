"""Live end-to-end verification of Prompt 28 — Notification Engine + Customer Communication.

Run:  ./venv/bin/python _p28_e2e.py   (server must be up on :4000)

Covers the Prompt 28 DoD:
  1. Every catalogued event triggers a notification through >= 1 channel
     (USER events → in-app rows + SENT logs; CUSTOMER events → SENT logs)
  2. Opt-out centrally suppresses that customer/channel (SKIPPED_OPTOUT log)
     and re-opting-in restores sends
  3. Channel toggle off → dispatch reports CHANNEL_OFF
  4. Per-tenant template override renders {placeholders} into the outbound body
  5. Module wiring: real POS sale → digital receipt (EMAIL) + WhatsApp invoice;
     marketing campaign run → grant SENT via engine; installment create/pay →
     INSTALLMENT_DUE + PAYMENT; sync failure → SYNC_FAILURE in-app
  6. Scheduled checks fire LOW_STOCK when a product is under its reorder point
Self-cleaning: every row carries the P28E2E marker or belongs to a tracked id,
and cleanup runs first + last so the DB returns to its baseline.
"""
import json
import urllib.error
import urllib.request
from datetime import datetime, timedelta

from db import sync_engine
from sqlalchemy import text

BASE = "http://localhost:4000"
MARK = "P28E2E"
PASSED = []


def call(method, path, body=None, hdrs=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", **(hdrs or {})})
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
ADMIN = d.get("user", {}).get("id") if isinstance(d.get("user"), dict) else None
print(f"tenant={TENANT} slug={d['tenant']['slug']}")

cust_ids, sale_ids, shift_ids, camp_ids, coupon_ids, ins_ids, sched_ids = [], [], [], [], [], [], []
grant_ids, tmpl_ids, rec_ids = [], [], []


def sql_exec(stmt, **p):
    with sync_engine.connect() as c:
        c.execute(text(stmt), p)
        c.commit()


def sql_fetch(stmt, **p):
    with sync_engine.connect() as c:
        return c.execute(text(stmt), p).fetchall()


def sql_scalar(stmt, **p):
    with sync_engine.connect() as c:
        return c.execute(text(stmt), p).scalar()


def new_customer(tag, email=None):
    phone = f"018{tag[-6:]}0001"
    body = {"name": f"{MARK} {tag}", "phone": phone}
    if email:
        body["email"] = email
    st, r = call("POST", "/api/v1/customers", body, hdrs=H)
    assert st in (200, 201), r
    cid = sql_scalar("SELECT id FROM customers WHERE tenantId=:t AND phone=:p", t=TENANT, p=phone)
    cust_ids.append(cid)
    return cid


# ── Cleanup (marker-sweeping + tracked, runs first & last) ─────────────────
def cleanup():
    with sync_engine.connect() as c:
        # 1. discover every marker customer first (crashed runs included)
        mk = [r[0] for r in c.execute(text("SELECT id FROM customers WHERE tenantId=:t AND name LIKE :m"),
                                      {"t": TENANT, "m": f"{MARK}%"})]
        cust_ids.extend(mk)
        ids = tuple(set(cust_ids)) or ("__none__",)
        # campaigns / coupons by marker name
        mk_camps = [r[0] for r in c.execute(text("SELECT id FROM marketing_campaigns WHERE tenantId=:t AND name LIKE :m"),
                                            {"t": TENANT, "m": f"%{MARK}%"})]
        camp_ids.extend(mk_camps)
        if mk_camps:
            c.execute(text("DELETE FROM marketing_grants WHERE campaignId IN :cs"), {"cs": tuple(mk_camps)})
            c.execute(text("DELETE FROM marketing_campaigns WHERE id IN :cs"), {"cs": tuple(mk_camps)})
        mk_coupons = [r[0] for r in c.execute(text(
            "SELECT id FROM coupons WHERE tenantId=:t AND code LIKE :p"),
            {"t": TENANT, "p": "P28%"})]
        coupon_ids.extend(mk_coupons)
        if mk_coupons:
            c.execute(text("DELETE FROM coupons WHERE id IN :cs"), {"cs": tuple(mk_coupons)})
        # installments of marker customers
        if ids != ("__none__",):
            c.execute(text("DELETE FROM installment_schedules WHERE tenantId=:t AND installmentId IN "
                           "(SELECT id FROM installments WHERE customerId IN :ids)"), {"t": TENANT, "ids": ids})
            c.execute(text("DELETE FROM installments WHERE customerId IN :ids"), {"ids": ids})
            # loyalty (earn-created accounts/txns of the milestone campaign customer)
            c.execute(text("DELETE FROM loyalty_transactions WHERE tenantId=:t AND customerId IN :ids"),
                      {"t": TENANT, "ids": ids})
            c.execute(text("DELETE FROM loyalty_accounts WHERE tenantId=:t AND customerId IN :ids"),
                      {"t": TENANT, "ids": ids})
        # consents
        c.execute(text("DELETE FROM customer_consents WHERE tenantId=:t AND customerId IN :ids"),
                  {"t": TENANT, "ids": ids})
        # notification artifacts referencing our flows or marker text
        c.execute(text("DELETE FROM notification_logs WHERE tenantId=:t AND (body LIKE :m OR recipientName LIKE :m OR recipientId IN :ids)"),
                  {"t": TENANT, "m": f"%{MARK}%", "ids": ids})
        c.execute(text("DELETE FROM inapp_notifications WHERE tenantId=:t AND (body LIKE :m OR title LIKE :m OR userId IN :ids)"),
                  {"t": TENANT, "m": f"%{MARK}%", "ids": ids})
        # leftover user-event in-app rows fired by this session (windowed)
        c.execute(text("DELETE FROM inapp_notifications WHERE tenantId=:t AND createdAt > NOW() - INTERVAL 2 HOUR AND "
                       "(eventType IN ('APPROVAL_REQUIRED','SYNC_FAILURE','LOW_STOCK','EXPIRY','BRANCH_OFFLINE','COMMISSION','SALES_TARGET','SUSPICIOUS_TRANSACTION') OR refType IN ('PRODUCT','DEVICE'))"),
                  {"t": TENANT})
        # our templates
        if tmpl_ids:
            c.execute(text("DELETE FROM notification_templates WHERE id IN :ids"), {"ids": tuple(tmpl_ids)})
        # sale graph of our receipt flow
        if sale_ids:
            srids = tuple(sale_ids)
            jids = [r[0] for r in c.execute(text(
                "SELECT id FROM journals WHERE refId IN :s OR narration LIKE :m"), {"s": srids, "m": f"%{MARK}%"})]
            if jids:
                c.execute(text("DELETE FROM ledger_entries WHERE journalId IN :ids"), {"ids": tuple(jids)})
                c.execute(text("DELETE FROM journals WHERE id IN :ids"), {"ids": tuple(jids)})
            moves = c.execute(text("SELECT productId, warehouseId, qty FROM stock_movements WHERE refId IN :s AND qty < 0"),
                              {"s": srids}).fetchall()
            for pid, wid, qty in moves:
                c.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand + :q WHERE tenantId=:t AND warehouseId=:w AND productId=:p"),
                          {"q": -float(qty), "t": TENANT, "w": wid, "p": pid})
            c.execute(text("DELETE FROM stock_movements WHERE refId IN :s"), {"s": srids})
            for t, col in (("sale_items", "saleId"), ("payments", "saleId"), ("invoices", "saleId"),
                           ("loyalty_transactions", "saleId"), ("shift_txns", "refId"), ("tax_transactions", "refId")):
                c.execute(text(f"DELETE FROM {t} WHERE {col} IN :s"), {"s": srids})
            c.execute(text("DELETE FROM sales WHERE id IN :s"), {"s": srids})
        # our low-stock probe product stock restore
        if rec_ids:
            for pid, qty in rec_ids:
                c.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand + :q WHERE tenantId=:t AND productId=:p"),
                          {"q": qty, "t": TENANT, "p": pid})
        # device sync probe
        c.execute(text("DELETE FROM device_sync_status WHERE tenantId=:t AND deviceId LIKE :m"), {"t": TENANT, "m": f"%{MARK}%"})
        # shifts we opened
        if shift_ids:
            sh_t = tuple(set(shift_ids))
            c.execute(text("DELETE FROM shift_txns WHERE shiftId IN :ids"), {"ids": sh_t})
            c.execute(text("DELETE FROM cash_shifts WHERE id IN :ids"), {"ids": sh_t})
        if ids != ("__none__",):
            c.execute(text("DELETE FROM customers WHERE id IN :ids"), {"ids": ids})
        c.commit()


cleanup()

# ═══════════════ 1. CATALOG + EVENT FIRING (all events ≥ 1 channel) ═══════════════
print("\n== 1. Catalog & event firing ==")
st, r = call("GET", "/api/v1/notify/events", hdrs=H)
events = {e["code"]: e for e in r.get("data", [])}
check("event catalog lists ≥ 10 events", len(events) >= 10, str(r)[:300])
for code in ("LOW_STOCK", "EXPIRY", "INSTALLMENT_DUE", "OVERDUE", "QUOTATION_EXPIRY",
             "APPROVAL_REQUIRED", "PAYMENT", "DIGITAL_RECEIPT", "WHATSAPP_INVOICE",
             "COMMISSION", "SYNC_FAILURE", "BRANCH_OFFLINE", "SALES_TARGET",
             "SUSPICIOUS_TRANSACTION", "NEW_ORDER", "DELIVERY_UPDATE", "PROMOTION", "LOYALTY"):
    check(f"event {code} catalogued", code in events)

st, r = call("GET", "/api/v1/notify/channels", hdrs=H)
chans = {c["code"]: c for c in r.get("data", [])}
check("5 channels registered", len(chans) >= 5 and all(x in chans for x in ("IN_APP", "PUSH", "EMAIL", "SMS", "WHATSAPP")), str(chans))

# user events → in-app SENT
for code in ("LOW_STOCK", "EXPIRY", "APPROVAL_REQUIRED", "COMMISSION", "SYNC_FAILURE",
             "BRANCH_OFFLINE", "SALES_TARGET", "SUSPICIOUS_TRANSACTION"):
    st, r = call("POST", "/api/v1/notify/send", {
        "eventType": code,
        "params": {"product": "Test Item", "stock": 2, "reorder": 10, "batchNo": "B1",
                   "expiryDate": "2026-09-20", "summary": f"{MARK} approval", "level": 1,
                   "role": "MANAGER", "amount": "৳500", "period": "Aug 2026",
                   "device": f"{MARK} device", "reason": "offline", "branch": "Main",
                   "since": "now", "lastSync": "—", "scope": "Branch", "achieved": "৳50k",
                   "pct": "50%", "invoiceNo": f"{MARK}-INV", "receivedByName": "R"},
    }, hdrs=H)
    d0 = r.get("data", {})
    ok_res = any(x.get("status") in ("SENT",) for x in d0.get("results", []))
    check(f"USER event {code} fired (in-app SENT)", st == 200 and ok_res, str(r)[:200])

cust = new_customer("Comm", email="customer@example.com")
sql_exec("UPDATE customers SET email='customer@example.com' WHERE id=:c", c=cust)

# customer events → SENT with address
for code in ("PAYMENT", "DIGITAL_RECEIPT", "WHATSAPP_INVOICE", "NEW_ORDER",
             "DELIVERY_UPDATE", "INSTALLMENT_DUE", "OVERDUE", "QUOTATION_EXPIRY", "PROMOTION", "LOYALTY"):
    st, r = call("POST", "/api/v1/notify/send", {
        "eventType": code, "customerId": cust,
        "params": {"name": f"{MARK} Comm", "amount": 500, "invoiceNo": f"{MARK}-INV",
                   "planNo": f"{MARK}-PLAN", "dueDate": "2026-09-10", "total": 5000,
                   "quotationNo": f"{MARK}-Q", "validUntil": "2026-09-05", "deliveryNo": f"{MARK}-D1",
                   "status": "OUT FOR DELIVERY", "orderNo": f"{MARK}-ORD",
                   "offer": "20% off", "coupon": f"{MARK}COUPON", "points": 1000, "tier": "GOLD"},
    }, hdrs=H)
    d0 = r.get("data", {})
    ok_res = any(x.get("status") == "SENT" for x in d0.get("results", []))
    check(f"CUSTOMER event {code} fired (SENT)", st == 200 and ok_res, str(r)[:220])

# an actual outbound log row exists for an SMS customer event
n = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND eventType='PAYMENT' AND status='SENT' AND recipientAddress IS NOT NULL",
               t=TENANT)
check("SMS/EMAIL log rows carry recipient address", int(n or 0) >= 1, str(n))

# ═══════════════ 2. OPT-OUT SUPPRESSION (central) ═══════════════
print("\n== 2. Consent / opt-out ==")
st, r = call("PUT", f"/api/v1/customers/{cust}/consents", {"channel": "SMS", "status": "OPTED_OUT"}, hdrs=H)
check("opt-out SMS saved", st == 200 and r.get("data", {}).get("status") == "OPTED_OUT", str(r))
st, r = call("GET", f"/api/v1/customers/{cust}/consents", hdrs=H)
con = r.get("data", {})
check("consent map defaults others to OPTED_IN", con.get("SMS", {}).get("status") == "OPTED_OUT" and con.get("EMAIL", {}).get("status") == "OPTED_IN", str(con))

st, r = call("POST", "/api/v1/notify/send", {
    "eventType": "PAYMENT", "customerId": cust, "channels": ["SMS", "EMAIL"],
    "params": {"name": f"{MARK} Comm", "amount": 100, "invoiceNo": f"{MARK}-INV"}}, hdrs=H)
res = r.get("data", {}).get("results", [])
by_ch = {x["channel"]: x["status"] for x in res}
check("opted-out SMS suppressed centrally", by_ch.get("SMS") == "SKIPPED_OPTOUT", str(res))
check("EMAIL still sent while SMS suppressed", by_ch.get("EMAIL") == "SENT", str(res))
sk = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND eventType='PAYMENT' AND status='SKIPPED_OPTOUT' AND channel='SMS'",
                t=TENANT)
check("SKIPPED_OPTOUT logged in outbox", int(sk or 0) >= 1, str(sk))

# re-opt-in restores sends
st, r = call("PUT", f"/api/v1/customers/{cust}/consents", {"channel": "SMS", "status": "OPTED_IN"}, hdrs=H)
st, r = call("POST", "/api/v1/notify/send", {
    "eventType": "PAYMENT", "customerId": cust, "channels": ["SMS"],
    "params": {"name": f"{MARK} Comm", "amount": 50, "invoiceNo": f"{MARK}-INV"}}, hdrs=H)
res = r.get("data", {}).get("results", [])
check("re-opt-in restores SMS send", st == 200 and res[0].get("status") == "SENT", str(r)[:220])

# channel off → CHANNEL_OFF reported
st, r = call("PATCH", "/api/v1/notify/channels/SMS", {"isEnabled": False}, hdrs=H)
st, r = call("POST", "/api/v1/notify/send", {
    "eventType": "PROMOTION", "customerId": cust, "channels": ["SMS"],
    "params": {"name": f"{MARK} Comm", "offer": "test", "coupon": ""}}, hdrs=H)
res = r.get("data", {}).get("results", [])
check("disabled channel reports CHANNEL_OFF", st == 200 and res[0].get("status") == "CHANNEL_OFF", str(r)[:220])
call("PATCH", "/api/v1/notify/channels/SMS", {"isEnabled": True}, hdrs=H)

# ═══════════════ 3. TEMPLATE OVERRIDE ═══════════════
print("\n== 3. Template override ==")
st, r = call("POST", "/api/v1/notify/templates", {
    "eventType": "PAYMENT", "channel": "EMAIL", "name": f"{MARK} tpl",
    "subject": "Receipt {invoiceNo}", "body": f"{MARK} custom body — total {{amount}} for {{name}}"}, hdrs=H)
check("template created", st == 201, str(r))
tmpl_ids.append(r["data"]["id"])
st, r = call("POST", "/api/v1/notify/send", {
    "eventType": "PAYMENT", "customerId": cust, "channels": ["EMAIL"],
    "params": {"name": f"{MARK} Comm", "amount": 123, "invoiceNo": f"{MARK}-X"}}, hdrs=H)
res = r.get("data", {}).get("results", [])
check("override template rendered", st == 200 and res[0].get("status") == "SENT", str(r)[:200])
row = sql_fetch("SELECT subject, body FROM notification_logs WHERE tenantId=:t AND eventType='PAYMENT' AND channel='EMAIL' "
                "AND body LIKE :m ORDER BY createdAt DESC LIMIT 1", t=TENANT, m=f"%{MARK} custom body%")
check("outbound body contains rendered placeholders",
      len(row) == 1 and "123" in (row[0][1] or "") and f"{MARK} Comm" in (row[0][1] or ""), str(row))

# ═══════════════ 4. REAL MODULE WIRING ═══════════════
print("\n== 4. Module wiring ==")
# 4a — real POS sale → digital receipt (EMAIL) + WhatsApp invoice
st, bs = call("GET", "/api/v1/branches", hdrs=H)
branch = bs.get("data", [])[0]
st, ws = call("GET", "/api/v1/warehouses", hdrs=H)
wh = ws.get("data", [])[0]
st, pr = call("GET", "/api/v1/products?limit=500", hdrs=H)
prod = None
with sync_engine.connect() as c:
    for p in pr.get("data", []):
        q = c.execute(text("SELECT qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p"),
                      {"t": TENANT, "w": wh["id"], "p": p["id"]}).scalar()
        if q and float(q) >= 20:
            prod = p
            break
check("found stocked product", prod is not None)
sh0 = sql_fetch("SELECT id FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status='OPEN' LIMIT 1", t=TENANT, b=branch["id"])
if not sh0:
    st, so = call("POST", "/api/v1/cash-register/open", {"branchId": branch["id"], "openingCash": 10000}, hdrs=H)
    shift_ids.append(so.get("data", {}).get("id"))
sale_total = 500.0
cust_b = new_customer("Receipt", email="receipt@example.com")
st, sale = call("POST", "/api/v1/pos/confirm", {
    "branchId": branch["id"], "warehouseId": wh["id"],
    "items": [{"productId": prod["id"], "qty": 2, "unitPrice": 250}],
    "payments": [{"method": "CASH", "amount": sale_total}],
    "customerId": cust_b, "note": f"{MARK} sale",
    "sendReceipt": True, "receiptChannels": ["EMAIL", "WHATSAPP"]}, hdrs=H)
check("real POS sale with sendReceipt confirmed", st in (200, 201), str(sale))
sale_id = sale["data"]["saleId"]
sale_ids.append(sale_id)
dl = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND eventType='DIGITAL_RECEIPT' AND status='SENT' AND refId=:s",
                t=TENANT, s=sale_id)
check("digital receipt log for the sale", int(dl or 0) >= 1, str(dl))
wa = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND eventType='WHATSAPP_INVOICE' AND status='SENT' AND refId=:s",
                t=TENANT, s=sale_id)
check("WhatsApp invoice log for the sale", int(wa or 0) >= 1, str(wa))

# 4b — marketing campaign run → grant now SENT (engine dispatch replaced stub)
cust_m = new_customer("Campaign", email="campaign@example.com")
sql_exec("UPDATE customers SET phone='01877777777' WHERE id=:c", c=cust_m)
st, r = call("POST", "/api/v1/loyalty/earn", {"customerId": cust_m, "amount": 60000}, hdrs=H)  # 600 lifetime pts
check("seed loyalty lifetime for milestone", st in (200, 201), str(r))
st, r = call("POST", "/api/v1/marketing/campaigns", {
    "name": f"{MARK} campaign", "triggerType": "LOYALTY_MILESTONE", "status": "ACTIVE",
    "channels": ["SMS", "EMAIL"],
    "conditions": {"milestonePoints": 500},
    "couponTemplate": {"codePrefix": "P28", "discountType": "PERCENTAGE", "discountValue": 10, "validDays": 14}}, hdrs=H)
check("campaign created", st == 201, str(r))
campaign_id = r["data"]["id"]
camp_ids.append(campaign_id)
st, r = call("POST", f"/api/v1/marketing/campaigns/{campaign_id}/run", {}, hdrs=H)
check("campaign run returned", st == 200, str(r))
run = r.get("data", {})
check("campaign run matched the milestone customer", run.get("matched", 0) >= 1, str(run))
check("run no longer a stub", run.get("sendStub") is not True and run.get("sent") is True, str(run))
grant_st = sql_scalar("SELECT status FROM marketing_grants WHERE tenantId=:t AND campaignId=:c AND customerId=:u",
                      t=TENANT, c=campaign_id, u=cust_m)
check("marketing grant status moved PENDING → SENT by engine", grant_st == "SENT", str(grant_st))
pl = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND eventType='PROMOTION' AND refType='MARKETING_CAMPAIGN' AND refId=:c AND status='SENT'",
                t=TENANT, c=campaign_id)
check("PROMOTION dispatch logged for the grant", int(pl or 0) >= 1, str(pl))

# 4c — installment create (INSTALLMENT_DUE head-up) + pay (PAYMENT receipt)
cust_i = new_customer("Install", email="install@example.com")
st, r = call("POST", "/api/v1/installments", {
    "customerId": cust_i, "totalAmount": 3000, "installmentCount": 3, "downPayment": 0,
    "frequency": "WEEKLY"}, hdrs=H)
check("installment created", st == 201, str(r))
ins_id = r["data"]["id"]
ins_ids.append(ins_id)
il = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND eventType='INSTALLMENT_DUE' AND status='SENT' AND refType='INSTALLMENT' AND refId=:i",
                t=TENANT, i=ins_id)
check("installment head-up INSTALLMENT_DUE logged", int(il or 0) >= 1, str(il))
sched = sql_scalar("SELECT id FROM installment_schedules WHERE installmentId=:i ORDER BY dueDate LIMIT 1", i=ins_id)
sched_ids.append(sched)
st, r = call("POST", f"/api/v1/installments/{ins_id}/pay", {"scheduleId": sched, "amount": 1000}, hdrs=H)
check("installment payment processed", st == 200, str(r))
pl = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND eventType='PAYMENT' AND status='SENT' AND refType='INSTALLMENT' AND refId=:i",
                t=TENANT, i=ins_id)
check("PAYMENT receipt logged on installment pay", int(pl or 0) >= 1, str(pl))

# 4d — sync failure → SYNC_FAILURE in-app
st, r = call("POST", "/api/v1/sync/upload", {
    "deviceId": f"{MARK}-device",
    "transactions": [{"entityType": "sale", "idempotencyKey": None}]}, hdrs=H)
up = r.get("data", {})
check("sync upload reports failed tx", st == 200 and up.get("failed", 0) >= 1, str(up)[:200])
sf = sql_scalar("SELECT COUNT(*) FROM inapp_notifications WHERE tenantId=:t AND eventType='SYNC_FAILURE' AND body LIKE :m",
                t=TENANT, m=f"%{MARK}-device%")
check("SYNC_FAILURE surfaced in-app", int(sf or 0) >= 1, str(sf))

# ═══════════════ 5. SCHEDULED CHECKS (LOW_STOCK scan) ═══════════════
print("\n== 5. Scheduled checks ==")
# temporarily drive the probe product under its reorder point
rp0 = sql_scalar("SELECT COALESCE(reorderPoint,10) FROM products WHERE id=:p", p=prod["id"])
q0 = sql_scalar("SELECT qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p", t=TENANT, w=wh["id"], p=prod["id"])
sql_exec("UPDATE stock SET qtyOnHand=2 WHERE tenantId=:t AND warehouseId=:w AND productId=:p", t=TENANT, w=wh["id"], p=prod["id"])
rec_ids.append((prod["id"], float(q0) - 2.0))
st, r = call("POST", "/api/v1/notify/check", {}, hdrs=H)
fired = r.get("data", {}).get("fired", {})
check("scheduled check ran", st == 200 and isinstance(fired, dict), str(r)[:200])
check("LOW_STOCK fired for under-reorder product", int(fired.get("LOW_STOCK") or 0) >= 1, str(fired))
sql_exec("UPDATE stock SET qtyOnHand=:q WHERE tenantId=:t AND warehouseId=:w AND productId=:p",
         q=q0, t=TENANT, w=wh["id"], p=prod["id"])

# inbox + mark-read
st, r = call("GET", "/api/v1/notifications?limit=5", hdrs=H)
inb = r.get("data", {})
check("in-app inbox lists notifications", len(inb.get("items", [])) >= 1 and int(inb.get("unread", 0)) >= 1, str(r)[:200])
nid = inb["items"][0]["id"]
st, r = call("PATCH", f"/api/v1/notifications/{nid}/read", {}, hdrs=H)
check("mark notification read", st == 200, str(r))
st, r = call("POST", "/api/v1/notifications/read-all", {}, hdrs=H)
check("read-all works", st == 200, str(r))

# ═══════════════ 6. CLEANUP + NEUTRALITY ═══════════════
print("\n== cleanup ==")
cleanup()
left = sql_scalar("SELECT COUNT(*) FROM notification_logs WHERE tenantId=:t AND body LIKE :m", t=TENANT, m=f"%{MARK}%")
check("no leftover marker notification logs", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM marketing_campaigns WHERE tenantId=:t AND name LIKE :m", t=TENANT, m=f"%{MARK}%")
check("no leftover campaigns", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM customers WHERE tenantId=:t AND name LIKE :m", t=TENANT, m=f"%{MARK}%")
check("no leftover customers", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM installments WHERE tenantId=:t AND customerId NOT IN (SELECT id FROM customers)", t=TENANT)
check("no orphan installments", int(left or 0) == 0, str(left))
left = sql_scalar("SELECT COUNT(*) FROM notification_templates WHERE tenantId=:t AND name LIKE :m", t=TENANT, m=f"%{MARK}%")
check("no leftover templates", int(left or 0) == 0, str(left))

print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 28 — Notification Engine + Customer Communication: VERIFIED")
print(f"{'='*60}")
