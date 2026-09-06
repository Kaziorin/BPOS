"""Live end-to-end verification of Prompt 26 — Loyalty / Wallet / Gift Card / Marketing Automation / Budget.

Run:  ./venv/bin/python _p26_e2e.py   (server must be up on :4000)

Covers the Prompt 26 DoD:
  1. Loyalty earn/redeem/adjust with tier multipliers + full ledger (engine API)
  2. Earn on a REAL POS sale + reversal on return (real /api/v1/returns call)
  3. Wallet ledger (credit/debit/cashback/overdraw-reject) — never a bare balance
  4. Gift card issue/redeem partial/reload/disable/expiry + ledger chain
  5. >= 2 marketing automation triggers fire (INACTIVE_30D + HIGH_VALUE) against
     seeded customers → coupon grants
  6. Branch budget vs actual variance report
Self-cleaning: all rows carry the P26E2E marker and are removed at the end, so a
successful or failed run always restores the DB to its baseline.
"""
import json
import urllib.error
import urllib.request
from datetime import date, timedelta

from db import sync_engine
from sqlalchemy import text

BASE = "http://localhost:4000"
MARK = "P26E2E"
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


# ── Auth ──
st, d = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
assert st == 200, d
H = {"Authorization": f"Bearer {d['token']}", "x-tenant-id": d["tenant"]["slug"]}
TENANT = d["tenant"]["id"]
ADMIN = d.get("user", {}).get("id") if isinstance(d.get("user"), dict) else None

print(f"tenant={TENANT} slug={d['tenant']['slug']}")

# ── tracked ids (self-cleaning) ──
cust_ids, sale_ids, shift_ids = [], [], []
wallet_ids, gift_ids, camp_ids, coupon_ids, budget_ids = [], [], [], [], []
loyalty_account_ids = []


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


def new_customer(tag, dob=None, old=False):
    """Create a marker customer via API and return its id."""
    phone = "017" + str(abs(hash(tag + str(len(cust_ids)))) % 10**8).zfill(8)
    st, r = call("POST", "/api/v1/customers", {
        "name": tag, "phone": phone, "email": tag.lower().replace(" ", "") + "@e2e.test",
        "dateOfBirth": dob}, hdrs=H)
    assert st in (200, 201), (st, r)
    cid = sql_scalar("SELECT id FROM customers WHERE tenantId=:t AND phone=:p", t=TENANT, p=phone)
    if old:  # make it look like an old customer (inactive trigger)
        sql_exec("UPDATE customers SET createdAt = DATE_SUB(NOW(), INTERVAL 90 DAY), "
                 "lastPurchaseAt = DATE_SUB(NOW(), INTERVAL 45 DAY), updatedAt=NOW() WHERE id=:c", c=cid)
    cust_ids.append(cid)
    return cid


# ════════════════════ 0. Cleanup helpers (run first + last) ════════════════════
def cleanup():
    print("\n== cleanup ==")
    with sync_engine.connect() as c:
        # discover leftover marker rows from crashed runs (id lists are populated
        # during this run — when empty, sweep the DB by the P26E2E marker)
        if not cust_ids:
            cust_ids.extend([r[0] for r in c.execute(text(
                "SELECT id FROM customers WHERE tenantId=:t AND name LIKE :m"),
                {"t": TENANT, "m": f"{MARK}%"})])
        if not sale_ids:
            sale_ids.extend([r[0] for r in c.execute(text(
                "SELECT id FROM sales WHERE tenantId=:t AND (customerId IN :cs OR note LIKE :m OR invoiceNo LIKE :m)"),
                {"t": TENANT, "cs": tuple(cust_ids) or ("__none__",), "m": f"%{MARK}%"})])
        if not camp_ids:
            camp_ids.extend([r[0] for r in c.execute(text(
                "SELECT id FROM marketing_campaigns WHERE tenantId=:t AND name LIKE :m"),
                {"t": TENANT, "m": f"{MARK}%"})])
        if not budget_ids:
            budget_ids.extend([r[0] for r in c.execute(text(
                "SELECT id FROM budgets WHERE tenantId=:t AND name LIKE :m"),
                {"t": TENANT, "m": f"{MARK}%"})])
        if not gift_ids:
            gift_ids.extend([r[0] for r in c.execute(text(
                "SELECT id FROM gift_cards WHERE tenantId=:t AND issuedToName LIKE :m"),
                {"t": TENANT, "m": f"{MARK}%"})])
        # leftover OPEN shifts from crashed runs (recent, opened by our admin,
        # and only ever referencing our own sales) get removed too
        if not shift_ids:
            sale_rids_pre = tuple(sale_ids) or ("__none__",)
            shift_ids.extend([r[0] for r in c.execute(text(
                "SELECT id FROM cash_shifts WHERE tenantId=:t AND status='OPEN' "
                "AND openedAt > NOW() - INTERVAL 3 HOUR AND createdBy=:u AND NOT EXISTS "
                "(SELECT 1 FROM shift_txns stx WHERE stx.shiftId=cash_shifts.id "
                "AND stx.refId IS NOT NULL AND stx.refId <> '' AND stx.refId NOT IN :sr)"),
                {"t": TENANT, "u": ADMIN, "sr": sale_rids_pre})])
        # journals + ledger entries of our sales/returns
        sale_rids = tuple(sale_ids) or ("__none__",)
        jids = [r[0] for r in c.execute(
            text("SELECT DISTINCT j.id FROM journals j WHERE j.refId IN :sr OR j.refId IN "
                 "(SELECT r.id FROM returns r WHERE r.saleId IN :sr) OR j.narration LIKE :m"),
            {"sr": sale_rids, "m": f"%{MARK}%"})]
        if jids:
            jt = tuple(jids)
            c.execute(text(f"DELETE FROM ledger_entries WHERE journalId IN {jt}"))
            c.execute(text(f"DELETE FROM journals WHERE id IN {jt}"))
        # stock: SALE_OUT is already balanced by the return's SALE_RETURN_IN, so
        # only restore true leftovers (recipe ingredient consumption) before
        # dropping the movement history of our sales.
        moves = c.execute(text("SELECT productId, warehouseId, qty FROM stock_movements "
                               "WHERE tenantId=:t AND refId IN :sr AND movementType='RECIPE_CONSUMPTION' AND qty < 0"),
                          {"t": TENANT, "sr": sale_rids}).fetchall()
        for pid, wid, qty in moves:
            c.execute(text("UPDATE stock SET qtyOnHand = qtyOnHand + :q WHERE tenantId=:t AND warehouseId=:w AND productId=:p"),
                      {"q": -float(qty), "t": TENANT, "w": wid, "p": pid})
        c.execute(text("DELETE FROM stock_movements WHERE tenantId=:t AND refId IN :sr"), {"t": TENANT, "sr": sale_rids})
        c.execute(text("DELETE FROM return_items WHERE returnId IN "
                       "(SELECT id FROM returns WHERE tenantId=:t AND saleId IN :sr)"), {"t": TENANT, "sr": sale_rids})
        c.execute(text("DELETE FROM returns WHERE tenantId=:t AND saleId IN :sr"), {"t": TENANT, "sr": sale_rids})
        # per-table children by tracked ids
        if sale_ids:
            st_ids = tuple(sale_ids)
            for t, col in (("sale_items", "saleId"), ("payments", "saleId"), ("invoices", "saleId"),
                           ("loyalty_transactions", "saleId"), ("shift_txns", "refId"),
                           ("commissions", "saleId"), ("tax_transactions", "refId")):
                c.execute(text(f"DELETE FROM {t} WHERE {col} IN :ids"), {"ids": st_ids})
            c.execute(text("DELETE FROM sales WHERE id IN :ids"), {"ids": st_ids})
        for t, col in (("wallet_transactions", "customerId"), ("loyalty_transactions", "customerId"),
                       ("loyalty_accounts", "customerId"), ("wallet_accounts", "customerId")):
            if cust_ids:
                c.execute(text(f"DELETE FROM {t} WHERE {col} IN :ids"), {"ids": tuple(cust_ids)})
        for t, col in (("gift_card_transactions", "cardId"), ("gift_cards", "id")):
            if gift_ids:
                c.execute(text(f"DELETE FROM {t} WHERE {col} IN :ids"), {"ids": tuple(gift_ids)})
        if camp_ids:
            # campaign-created coupons must die with their grants
            gcoupons = [r[0] for r in c.execute(text(
                "SELECT DISTINCT couponId FROM marketing_grants WHERE campaignId IN :ids AND couponId IS NOT NULL"),
                {"ids": tuple(camp_ids)})]
            if gcoupons:
                c.execute(text("DELETE FROM coupons WHERE id IN :ids"), {"ids": tuple(gcoupons)})
            c.execute(text("DELETE FROM marketing_grants WHERE campaignId IN :ids"), {"ids": tuple(camp_ids)})
            c.execute(text("DELETE FROM marketing_campaigns WHERE id IN :ids"), {"ids": tuple(camp_ids)})
        if coupon_ids:
            c.execute(text("DELETE FROM coupons WHERE id IN :ids"), {"ids": tuple(coupon_ids)})
        if budget_ids:
            c.execute(text("DELETE FROM budgets WHERE id IN :ids"), {"ids": tuple(budget_ids)})
        if shift_ids:
            c.execute(text("DELETE FROM shift_txns WHERE shiftId IN :ids"), {"ids": tuple(shift_ids)})
            c.execute(text("DELETE FROM cash_shifts WHERE id IN :ids"), {"ids": tuple(shift_ids)})
        if cust_ids:
            c.execute(text("DELETE FROM customers WHERE id IN :ids"), {"ids": tuple(cust_ids)})
        c.commit()


cleanup()  # remove leftovers from any previous crashed run

# ════════════════════ 1. LOYALTY ENGINE (earn/redeem/adjust/tier) ════════════════════
print("\n== 1. Loyalty engine ==")
st, s_ = call("GET", "/api/v1/loyalty/settings", hdrs=H)
sdata = s_.get("data", {})
check("loyalty settings defaults", st == 200 and float(sdata.get("pointsPerAmount") or 0) == 100
      and int(sdata.get("earnEnabled") or 0) == 1, str(sdata))
# earn disabled toggle round-trip
st, _ = call("PUT", "/api/v1/loyalty/settings", {"earnEnabled": 0}, hdrs=H)
st, r = call("POST", "/api/v1/loyalty/earn", {"customerId": "__x__", "amount": 1000}, hdrs=H)
check("earn blocked when disabled", st == 400, str(r))
call("PUT", "/api/v1/loyalty/settings", {"earnEnabled": 1}, hdrs=H)

L = new_customer(f"{MARK} Loyal")
# Earn A: 60,000 spend → 600 base pts at Bronze (1.0x)
st, r = call("POST", "/api/v1/loyalty/earn", {"customerId": L, "amount": 60000,
             "note": f"{MARK} earn-A"}, hdrs=H)
e = r.get("data", {})
check("earn 60000 → 600 pts, bronze 1.0x", st == 201 and e.get("pointsEarned") == 600
      and e.get("multiplier") == 1.0 and e.get("pointsBalance") == 600, str(r))
check("tier upgraded to SILVER", e.get("tier") == "SILVER", str(e))
# Earn B: multiplier now 1.2 → 120 pts
st, r = call("POST", "/api/v1/loyalty/earn", {"customerId": L, "amount": 10000,
             "note": f"{MARK} earn-B"}, hdrs=H)
e = r.get("data", {})
check("earn uses SILVER 1.2x → 120 pts", st == 201 and e.get("pointsEarned") == 120
      and e.get("multiplier") == 1.2 and e.get("pointsBalance") == 720, str(r))
# Redeem 300 → ৳300 discount
st, r = call("POST", "/api/v1/loyalty/redeem", {"customerId": L, "points": 300,
             "note": f"{MARK} redeem"}, hdrs=H)
e = r.get("data", {})
check("redeem 300 pts → ৳300", st == 201 and e.get("discountValue") == 300.0
      and e.get("pointsBalance") == 420, str(r))
# Earn C: 120,000 → 1,200 base * 1.2 = 1,440 → crosses GOLD
st, r = call("POST", "/api/v1/loyalty/earn", {"customerId": L, "amount": 120000,
             "note": f"{MARK} earn-C"}, hdrs=H)
e = r.get("data", {})
check("earn 120000 → 1440 pts (1.2x)", st == 201 and e.get("pointsEarned") == 1440, str(r))
check("tier upgraded to GOLD", e.get("tier") == "GOLD", str(e))
# adjust +40
st, r = call("POST", "/api/v1/loyalty/adjust", {"customerId": L, "points": 40,
             "note": f"{MARK} adjust"}, hdrs=H)
check("adjust +40 → 1900", st == 200 and r.get("data", {}).get("pointsBalance") == 1900, str(r))
# redeem below minimum rejected
st, r = call("POST", "/api/v1/loyalty/redeem", {"customerId": L, "points": 50}, hdrs=H)
check("redeem below min rejected", st == 400, str(r))
# redeem 100
st, r = call("POST", "/api/v1/loyalty/redeem", {"customerId": L, "points": 100}, hdrs=H)
check("redeem 100 → balance 1800", st == 201 and r.get("data", {}).get("pointsBalance") == 1800, str(r))
# ledger integrity
st, r = call("GET", f"/api/v1/loyalty/transactions?customerId={L}", hdrs=H)
txns = r.get("data", [])
types = {}
for x in txns:
    types[x["type"]] = types.get(x["type"], 0) + 1
check("ledger: 3 EARN + 2 REDEEM + 1 ADJUST", types.get("EARN") == 3 and types.get("REDEEM") == 2
      and types.get("ADJUST") == 1, str(types))
# account detail + tier
st, r = call("GET", f"/api/v1/loyalty/accounts/{L}", hdrs=H)
acc = r.get("data", {}).get("account", {})
check("account GOLD, balance 1800", acc.get("tier") == "GOLD" and acc.get("pointsBalance") == 1800, str(acc))
# customers.loyaltyPoints kept in sync
lp = sql_scalar("SELECT loyaltyPoints FROM customers WHERE id=:c", c=L)
check("customers.loyaltyPoints in sync = 1800", int(lp or 0) == 1800, str(lp))

# ════════════════════ 2. REAL SALE EARN + RETURN REVERSAL ════════════════════
print("\n== 2. Real POS sale → earn → return reversal ==")
C2 = new_customer(f"{MARK} Sale")
# fetch branch/warehouse + a stocked product
st, bs = call("GET", "/api/v1/branches", hdrs=H)
branch = bs.get("data", [])[0]
st, ws = call("GET", "/api/v1/warehouses", hdrs=H)
wh = ws.get("data", [])[0]
st, pr = call("GET", "/api/v1/products?limit=500", hdrs=H)
prods = pr.get("data", [])
prod = None
with sync_engine.connect() as c:
    for p in prods:
        q = c.execute(text("SELECT qtyOnHand FROM stock WHERE tenantId=:t AND warehouseId=:w AND productId=:p"),
                      {"t": TENANT, "w": wh["id"], "p": p["id"]}).scalar()
        if q and float(q) >= 20:
            prod = p
            break
check("found stocked product", prod is not None)
# open a shift only if none is open on this branch
sh0 = sql_fetch("SELECT id FROM cash_shifts WHERE tenantId=:t AND branchId=:b AND status='OPEN' LIMIT 1",
                t=TENANT, b=branch["id"])
if not sh0:
    st, so = call("POST", "/api/v1/cash-register/open", {"branchId": branch["id"], "openingCash": 10000}, hdrs=H)
    check("shift opened", st in (200, 201), str(so))
    shift_ids.append(so.get("data", {}).get("id"))
sale_total = 500.0
st, sale = call("POST", "/api/v1/pos/confirm", {
    "branchId": branch["id"], "warehouseId": wh["id"],
    "items": [{"productId": prod["id"], "qty": 5, "unitPrice": 100}],
    "payments": [{"method": "CASH", "amount": sale_total}],
    "customerId": C2, "note": f"{MARK} sale"}, hdrs=H)
check("real POS sale confirmed", st in (200, 201), str(sale))
sale_id = sale["data"]["saleId"]
sale_ids.append(sale_id)
inv_no = sale["data"]["invoiceNo"]
# POS mirror created the loyalty account + EARN ledger
earn_row = sql_fetch("SELECT pointsEarned FROM loyalty_transactions WHERE tenantId=:t AND saleId=:s AND type='EARN'",
                     t=TENANT, s=sale_id)
check("POS sale earned points (EARN ledger)", len(earn_row) == 1 and int(earn_row[0][0]) >= 5, str(earn_row))
acc_row = sql_fetch("SELECT pointsBalance, lifetimeEarned FROM loyalty_accounts WHERE tenantId=:t AND customerId=:c",
                    t=TENANT, c=C2)
check("loyalty_accounts mirror created", len(acc_row) == 1 and int(acc_row[0][0]) >= 5, str(acc_row))
loyalty_account_ids.append(sql_scalar("SELECT id FROM loyalty_accounts WHERE tenantId=:t AND customerId=:c", t=TENANT, c=C2))

# return the same sale through the real endpoint
st, ret = call("POST", "/api/v1/returns", {
    "saleId": sale_id, "branchId": branch["id"], "returnType": "REFUND",
    "returnReason": "DEFECTIVE", "refundMethod": "CASH",
    "reason": f"{MARK} return"}, hdrs=H)
check("return processed", st in (200, 201), str(ret))
ret_data = ret.get("data", {})
check("refund amount = sale total", float(ret_data.get("refundAmount") or 0) == sale_total, str(ret_data))
rev_row = sql_fetch("SELECT pointsRedeemed FROM loyalty_transactions WHERE tenantId=:t AND saleId=:s AND type='REVERSAL'",
                    t=TENANT, s=sale_id)
check("return reversal ledger row created", len(rev_row) == 1 and int(rev_row[0][0]) >= 5, str(rev_row))
acc_after = sql_fetch("SELECT pointsBalance, lifetimeEarned FROM loyalty_accounts WHERE tenantId=:t AND customerId=:c",
                      t=TENANT, c=C2)
check("loyalty account fully reversed to 0", len(acc_after) == 1
      and int(acc_after[0][0]) == 0 and int(acc_after[0][1]) == 0, str(acc_after))
lp = sql_scalar("SELECT loyaltyPoints FROM customers WHERE id=:c", c=C2)
check("customers.loyaltyPoints back to baseline", int(lp or 0) == 0, str(lp))

# ════════════════════ 3. WALLET LEDGER ════════════════════
print("\n== 3. Wallet ==")
W = new_customer(f"{MARK} Wallet")
st, r = call("POST", "/api/v1/wallet/credit", {"customerId": W, "amount": 1000, "type": "ADD",
             "note": f"{MARK} add"}, hdrs=H)
check("wallet ADD 1000 → 1000", st == 201 and r.get("data", {}).get("balance") == 1000.0, str(r))
st, r = call("POST", "/api/v1/wallet/credit", {"customerId": W, "amount": 200, "type": "CASHBACK",
             "note": f"{MARK} cashback"}, hdrs=H)
check("wallet CASHBACK 200 → 1200", st == 201 and r.get("data", {}).get("balance") == 1200.0, str(r))
st, r = call("POST", "/api/v1/wallet/debit", {"customerId": W, "amount": 300,
             "note": f"{MARK} pay"}, hdrs=H)
check("wallet DEDUCT 300 → 900", st == 201 and r.get("data", {}).get("balance") == 900.0, str(r))
st, r = call("POST", "/api/v1/wallet/debit", {"customerId": W, "amount": 99999}, hdrs=H)
check("overdraw rejected", st == 400 and "Insufficient" in r.get("error", ""), str(r))
st, r = call("GET", f"/api/v1/wallet/accounts/{W}", hdrs=H)
w = r.get("data", {}).get("wallet", {})
check("wallet ledger totals", st == 200 and float(w.get("balance")) == 900.0
      and float(w.get("lifetimeCredited")) == 1200.0 and float(w.get("lifetimeDebited")) == 300.0, str(w))
txs = r.get("data", {}).get("transactions", [])
wb_t = {t.get("type"): t for t in txs}
check("wallet ledger rows w/ balanceBefore/After", len(txs) >= 3
      and float(wb_t["ADD"].get("balanceBefore") or 0) == 0.0 and float(wb_t["ADD"].get("balanceAfter") or 0) == 1000.0
      and float(wb_t["CASHBACK"].get("balanceAfter") or 0) == 1200.0
      and float(wb_t["DEDUCT"].get("balanceBefore") or 0) == 1200.0
      and float(wb_t["DEDUCT"].get("balanceAfter") or 0) == 900.0,
      str([(t.get("type"), t.get("balanceBefore"), t.get("balanceAfter")) for t in txs]))
wb = sql_scalar("SELECT walletBalance FROM customers WHERE id=:c", c=W)
check("customers.walletBalance in sync = 900", float(wb or 0) == 900.0, str(wb))

# ════════════════════ 4. GIFT CARDS ════════════════════
print("\n== 4. Gift cards ==")
G = new_customer(f"{MARK} Gift")
st, r = call("POST", "/api/v1/gift-cards", {"initialAmount": 5000, "issuedToCustomerId": G,
             "cardType": "DIGITAL", "note": f"{MARK} issue",
             "expiryDate": (date.today() + timedelta(days=180)).isoformat()}, hdrs=H)
check("gift card issued 5000", st == 201 and float(r.get("data", {}).get("balance")) == 5000.0, str(r))
gcard = r.get("data", {})
gid, gno = gcard["id"], gcard["cardNo"]
gift_ids.append(gid)
st, r = call("GET", f"/api/v1/gift-cards/lookup?cardNo={gno}", hdrs=H)
check("gift card lookup by cardNo", st == 200 and r.get("data", {}).get("id") == gid, str(r))
st, r = call("POST", f"/api/v1/gift-cards/{gid}/redeem", {"amount": 1200, "note": f"{MARK} redeem"}, hdrs=H)
check("partial redeem 1200 → 3800", st == 200 and float(r.get("data", {}).get("balance")) == 3800.0, str(r))
st, r = call("POST", f"/api/v1/gift-cards/{gid}/reload", {"amount": 1000, "note": f"{MARK} reload"}, hdrs=H)
check("reload 1000 → 4800", st == 200 and float(r.get("data", {}).get("balance")) == 4800.0, str(r))
st, r = call("POST", f"/api/v1/gift-cards/{gid}/redeem", {"amount": 99999}, hdrs=H)
check("redeem over balance rejected", st == 400, str(r))
st, r = call("POST", f"/api/v1/gift-cards/{gid}/disable", {"reason": f"{MARK} disable"}, hdrs=H)
check("card disabled", st == 200 and r.get("data", {}).get("status") == "DISABLED", str(r))
st, r = call("POST", f"/api/v1/gift-cards/{gid}/redeem", {"amount": 100}, hdrs=H)
check("disabled card cannot redeem", st == 400, str(r))
st, r = call("GET", f"/api/v1/gift-cards/{gid}", hdrs=H)
gx = r.get("data", {})
txns = gx.get("transactions", [])
by_type = {t.get("type"): t for t in txns}
check("gift ledger chain ISSUE/REDEEM/RELOAD/DISABLE", len(txns) == 4
      and float(by_type["ISSUE"].get("balanceAfter") or 0) == 5000.0
      and float(by_type["REDEEM"].get("balanceAfter") or 0) == 3800.0
      and float(by_type["RELOAD"].get("balanceAfter") or 0) == 4800.0
      and float(by_type["DISABLE"].get("balanceAfter") or 0) == 4800.0, str([(t.get("type"), t.get("balanceAfter")) for t in txns]))
# expired card cannot redeem
st, r = call("POST", "/api/v1/gift-cards", {"initialAmount": 1000, "note": f"{MARK} expired",
             "expiryDate": (date.today() - timedelta(days=5)).isoformat()}, hdrs=H)
gid2 = r.get("data", {}).get("id")
gift_ids.append(gid2)
st, r = call("POST", f"/api/v1/gift-cards/{gid2}/redeem", {"amount": 100}, hdrs=H)
check("expired card rejected at redeem", st == 400, str(r))

# ════════════════════ 5. MARKETING AUTOMATION (2+ triggers) ════════════════════
print("\n== 5. Marketing automation ==")
st, trig = call("GET", "/api/v1/marketing/triggers", hdrs=H)
check("trigger catalog 8 types", st == 200 and len(trig.get("data", [])) == 8, str(trig)[:200])
# Trigger 1: INACTIVE_30D → win-back coupon
st, r = call("POST", "/api/v1/marketing/campaigns", {"name": f"{MARK} Winback",
             "triggerType": "INACTIVE_30D", "channels": ["SMS", "EMAIL"],
             "conditions": {"daysInactive": 30},
             "couponTemplate": {"discountType": "PERCENTAGE", "discountValue": 10,
                                "minAmount": 500, "validDays": 14, "codePrefix": "P26WIN"}}, hdrs=H)
check("campaign (INACTIVE) created DRAFT", st == 201 and r.get("data", {}).get("status") == "DRAFT", str(r))
c1 = r.get("data", {})["id"]
camp_ids.append(c1)
call("POST", f"/api/v1/marketing/campaigns/{c1}/activate", hdrs=H)
Ix = new_customer(f"{MARK} Inactive", old=True)
st, r = call("POST", f"/api/v1/marketing/campaigns/{c1}/run", {}, hdrs=H)
run = r.get("data", {})
matched_ids = []
with sync_engine.connect() as c:
    matched_ids = [x[0] for x in c.execute(text(
        "SELECT customerId FROM marketing_grants WHERE campaignId=:c1"), {"c1": c1})]
check("INACTIVE trigger fired → grant rows", st == 200 and run.get("grantsCreated", 0) >= 1
      and len(matched_ids) >= 1, str(run))
check("inactive customer matched + got P26WIN coupon", Ix in matched_ids, f"ids={matched_ids[:20]}")
coupon_row = sql_fetch("SELECT id, code FROM coupons WHERE code LIKE 'P26WIN%' LIMIT 1")
check("win-back coupon created", len(coupon_row) >= 1, str(coupon_row))
if coupon_row:
    coupon_ids.append(coupon_row[0][0])
# second run must skip the already-granted customer
st, r = call("POST", f"/api/v1/marketing/campaigns/{c1}/run", {}, hdrs=H)
check("re-run skips existing grants", st == 200 and r.get("data", {}).get("skippedExisting", 0) >= 1, str(r))
# Trigger 2: HIGH_VALUE → needs a CONFIRMED sale >= minAmount inside lookback
Hv = new_customer(f"{MARK} HighValue")
import uuid as _u
hv_sale = str(_u.uuid4())
sale_ids.append(hv_sale)
sql_exec("INSERT INTO sales (id, tenantId, branchId, userId, customerId, invoiceNo, saleDate, subtotal, "
         "discountTotal, taxTotal, total, paidTotal, dueTotal, paymentStatus, status, note, createdAt, createdBy) "
         "VALUES (:id, :t, :b, :u, :c, :no, CURDATE(), 15000, 0, 0, 15000, 15000, 0, 'PAID', 'CONFIRMED', :n, NOW(), :u)",
         id=hv_sale, t=TENANT, b=branch["id"], u=ADMIN or "", c=Hv, no=f"INV-{MARK}-{abs(hash(hv_sale)) % 999999}",
         n=f"{MARK} high-value")
st, r = call("POST", "/api/v1/marketing/campaigns", {"name": f"{MARK} HighValue",
             "triggerType": "HIGH_VALUE", "channels": ["SMS"],
             "conditions": {"minAmount": 12000, "lookbackDays": 30},
             "couponTemplate": {"discountType": "PERCENTAGE", "discountValue": 15, "validDays": 10}}, hdrs=H)
c2 = r.get("data", {}).get("id")
camp_ids.append(c2)
st, r = call("POST", f"/api/v1/marketing/campaigns/{c2}/run", {}, hdrs=H)
run2 = r.get("data", {})
hv_ids = []
with sync_engine.connect() as c:
    hv_ids = [x[0] for x in c.execute(text(
        "SELECT customerId FROM marketing_grants WHERE campaignId=:c2"), {"c2": c2})]
check("HIGH_VALUE trigger fired → grant rows", st == 200 and run2.get("grantsCreated", 0) >= 1
      and Hv in hv_ids, f"grants={run2} hv={Hv in hv_ids}")
st, g = call("GET", f"/api/v1/marketing/grants?campaignId={c2}", hdrs=H)
grants = g.get("data", [])
check("grants list has couponCode", len(grants) >= 1 and grants[0].get("couponCode"), str(grants[:1]))

# ════════════════════ 6. BUDGET vs ACTUAL VARIANCE ════════════════════
print("\n== 6. Budget variance ==")
today = date.today().isoformat()
st, r = call("POST", "/api/v1/budgets", {"name": f"{MARK} BranchBudget", "scopeType": "BRANCH",
             "scopeId": branch["id"], "periodType": "CUSTOM", "periodStart": today, "periodEnd": today,
             "amount": 1000000, "note": f"{MARK}"}, hdrs=H)
check("branch budget created", st == 201, str(r))
bid = r.get("data", {}).get("id")
budget_ids.append(bid)
sql_actual = float(sql_scalar(
    "SELECT COALESCE(SUM(total),0) FROM sales WHERE tenantId=:t AND branchId=:b "
    "AND status IN ('CONFIRMED','COMPLETED') AND DATE(saleDate)=:d", t=TENANT, b=branch["id"], d=today) or 0)
st, r = call("GET", "/api/v1/budgets/variance", hdrs=H)
v = r.get("data", {})
ours = next((x for x in v.get("budgets", []) if x.get("id") == bid), None)
check("variance report lists our budget", ours is not None, str(v.get("budgets", []))[:300])
check("actual = live confirmed sales for branch/period", ours is not None
      and float(ours.get("actual") or 0) == sql_actual,
      f"api={ours.get('actual') if ours else '?'} sql={sql_actual}")
check("variance math correct", ours is not None and float(ours.get("variance") or 0) == sql_actual - 1000000.0,
      str(ours))
check("achievementPct computed", ours is not None and float(ours.get("achievementPct") or 0) == round(sql_actual / 1000000.0 * 100, 1),
      str(ours))
st, r = call("PATCH", f"/api/v1/budgets/{bid}", {"amount": 1}, hdrs=H)
check("budget amount updated", st == 200, str(r))
st, r = call("GET", "/api/v1/budgets/variance", hdrs=H)
ours2 = next((x for x in r.get("data", {}).get("budgets", []) if x.get("id") == bid), None)
check("over-budget flag flips (onTrack)", ours2 is not None and ours2.get("onTrack") is True
      and float(ours2.get("variance") or 0) > 0, str(ours2))

# ════════════════════ 7. CLEANUP + FINAL STATE ════════════════════
try:
    cleanup()
except Exception as e:
    print("cleanup error:", e)
    raise
# verify nothing of ours remains
res = sql_fetch("SELECT COUNT(*) FROM customers WHERE name LIKE :m", m=f"{MARK}%")
check("no leftover marker customers", int(res[0][0]) == 0, str(res))
res = sql_fetch("SELECT COUNT(*) FROM loyalty_accounts la JOIN customers c ON c.id=la.customerId WHERE c.name LIKE :m",
                m=f"{MARK}%")
check("no leftover loyalty accounts", int(res[0][0]) == 0, str(res))
res = sql_fetch("SELECT COUNT(*) FROM sales WHERE note LIKE :m OR invoiceNo LIKE :m", m=f"%{MARK}%")
check("no leftover marker sales", int(res[0][0]) == 0, str(res))
res = sql_fetch("SELECT COUNT(*) FROM marketing_campaigns WHERE name LIKE :m", m=f"{MARK}%")
check("no leftover campaigns", int(res[0][0]) == 0, str(res))
res = sql_fetch("SELECT COUNT(*) FROM budgets WHERE name LIKE :m", m=f"{MARK}%")
check("no leftover budgets", int(res[0][0]) == 0, str(res))

print(f"\n{'='*60}")
print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
print(f"Prompt 26 — Loyalty/Wallet/Gift/Marketing/Budget: VERIFIED")
print(f"{'='*60}")
