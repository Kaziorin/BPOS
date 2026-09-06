"""Prompt 28 — Notification Engine + Customer Communication (§10.29/§10.40).

Central dispatch that every module calls instead of checking consent itself:
  - channel enabled?  (notification_channels)
  - customer opted out on this channel?  (customer_consents)  → SKIPPED_OPTOUT
  - template override?  (notification_templates) else built-in default
  - outbound attempt recorded on notification_logs; in-app rows on inapp_notifications

Real carriers (Twilio-style SMS, SMTP, WhatsApp Business API) are intentionally
swappable behind ``_carrier_send`` — the demo marks attempts SENT with a carrier
note so every flow is testable end-to-end without external credentials.
"""

from __future__ import annotations

import json as _json
import uuid as _uuid

from sqlalchemy import text

IN_APP = "IN_APP"
PUSH = "PUSH"
EMAIL = "EMAIL"
SMS = "SMS"
WHATSAPP = "WHATSAPP"
CHANNELS = [IN_APP, PUSH, EMAIL, SMS, WHATSAPP]

# ── Event catalog: default channels + default wording per channel ──────────────
# Each event carries the audience that needs the message: CUSTOMER (goes through
# consent gate) or USER/STAFF (in-app/push, no customer consent needed).
EVENTS: dict[str, dict] = {
    "LOW_STOCK": {"label": "Low stock", "audience": "USER",
                  "channels": [IN_APP, PUSH],
                  "text": {"IN_APP": "Low stock alert", "PUSH": "Low stock alert"}},
    "EXPIRY": {"label": "Product expiry", "audience": "USER",
               "channels": [IN_APP, PUSH],
               "text": {"IN_APP": "Stock expiring soon", "PUSH": "Stock expiring soon"}},
    "INSTALLMENT_DUE": {"label": "Installment due", "audience": "CUSTOMER",
                        "channels": [SMS, EMAIL, WHATSAPP, IN_APP],
                        "text": {"SMS": "Installment due", "EMAIL": "Installment payment due",
                                 "WHATSAPP": "Installment due", "IN_APP": "Installment due today"}},
    "OVERDUE": {"label": "Overdue balance", "audience": "CUSTOMER",
                "channels": [SMS, EMAIL, WHATSAPP],
                "text": {"SMS": "Payment overdue", "EMAIL": "Payment overdue", "WHATSAPP": "Payment overdue"}},
    "QUOTATION_EXPIRY": {"label": "Quotation expiring", "audience": "CUSTOMER",
                         "channels": [SMS, EMAIL, WHATSAPP],
                         "text": {"SMS": "Your quotation is expiring", "EMAIL": "Quotation expiring",
                                  "WHATSAPP": "Quotation expiring"}},
    "APPROVAL_REQUIRED": {"label": "Approval required", "audience": "USER",
                          "channels": [IN_APP, PUSH],
                          "text": {"IN_APP": "Approval required", "PUSH": "Approval required"}},
    "PAYMENT": {"label": "Payment receipt", "audience": "CUSTOMER",
                "channels": [SMS, EMAIL, WHATSAPP, IN_APP],
                "text": {"SMS": "Payment received", "EMAIL": "Payment receipt",
                         "WHATSAPP": "Payment receipt", "IN_APP": "Payment received"}},
    "DIGITAL_RECEIPT": {"label": "Digital receipt", "audience": "CUSTOMER",
                        "channels": [EMAIL, SMS, WHATSAPP],
                        "text": {"EMAIL": "Your receipt", "SMS": "Your receipt",
                                 "WHATSAPP": "Receipt via WhatsApp"}},
    "WHATSAPP_INVOICE": {"label": "WhatsApp invoice", "audience": "CUSTOMER",
                         "channels": [WHATSAPP],
                         "text": {"WHATSAPP": "Invoice from our store"}},
    "COMMISSION": {"label": "Commission paid", "audience": "USER",
                   "channels": [IN_APP, PUSH],
                   "text": {"IN_APP": "Commission processed", "PUSH": "Commission processed"}},
    "SYNC_FAILURE": {"label": "Sync failure", "audience": "USER",
                     "channels": [IN_APP, PUSH],
                     "text": {"IN_APP": "Sync failed", "PUSH": "Sync failed"}},
    "BRANCH_OFFLINE": {"label": "Branch offline", "audience": "USER",
                       "channels": [IN_APP, PUSH],
                       "text": {"IN_APP": "Branch went offline", "PUSH": "Branch offline"}},
    "SALES_TARGET": {"label": "Sales target", "audience": "USER",
                     "channels": [IN_APP, PUSH],
                     "text": {"IN_APP": "Sales target update", "PUSH": "Sales target update"}},
    "SUSPICIOUS_TRANSACTION": {"label": "Suspicious transaction", "audience": "USER",
                               "channels": [IN_APP, PUSH],
                               "text": {"IN_APP": "Suspicious transaction", "PUSH": "Suspicious transaction"}},
    "NEW_ORDER": {"label": "New order", "audience": "CUSTOMER",
                  "channels": [SMS, EMAIL, WHATSAPP, IN_APP],
                  "text": {"SMS": "Order confirmed", "EMAIL": "New order", "WHATSAPP": "Order confirmed",
                           "IN_APP": "New order"}},
    "DELIVERY_UPDATE": {"label": "Delivery update", "audience": "CUSTOMER",
                        "channels": [SMS, EMAIL, WHATSAPP, IN_APP],
                        "text": {"SMS": "Delivery update", "EMAIL": "Delivery status",
                                 "WHATSAPP": "Delivery update", "IN_APP": "Delivery update"}},
    "PROMOTION": {"label": "Promotion / campaign", "audience": "CUSTOMER",
                  "channels": [SMS, EMAIL, WHATSAPP],
                  "text": {"SMS": "Special offer", "EMAIL": "Special offer", "WHATSAPP": "Special offer"}},
    "LOYALTY": {"label": "Loyalty update", "audience": "CUSTOMER",
                "channels": [SMS, EMAIL, WHATSAPP, IN_APP],
                "text": {"SMS": "Loyalty update", "EMAIL": "Loyalty update",
                         "WHATSAPP": "Loyalty update", "IN_APP": "Loyalty update"}},
}

# Built-in default bodies (placeholders replaced per event).
DEFAULT_BODY: dict[str, str] = {
    "LOW_STOCK": "{product} is below its reorder point ({stock}/{reorder}) — reorder soon.",
    "EXPIRY": "{product} (batch {batchNo}) expires on {expiryDate}. Consider discounting or writing off.",
    "INSTALLMENT_DUE": "Dear {name}, your installment of {amount} on plan {planNo} is due on {dueDate}.",
    "OVERDUE": "Dear {name}, your overdue balance is {amount}. Please arrange payment at your earliest.",
    "QUOTATION_EXPIRY": "Dear {name}, quotation {quotationNo} (৳{total}) expires on {validUntil}.",
    "APPROVAL_REQUIRED": "{summary} needs your approval (level {level} · {role}).",
    "PAYMENT": "Dear {name}, we received {amount} for {invoiceNo}. Thank you!",
    "DIGITAL_RECEIPT": "Dear {name}, here is your receipt {invoiceNo} — total ৳{total}. Thank you for shopping with us.",
    "WHATSAPP_INVOICE": "Dear {name}, invoice {invoiceNo} (৳{total}) is attached.",
    "COMMISSION": "Commission of {amount} for {period} has been processed.",
    "SYNC_FAILURE": "Sync failed for {device} ({reason}). Check the connection and retry.",
    "BRANCH_OFFLINE": "Branch {branch} is offline since {since}. Last sync {lastSync}.",
    "SALES_TARGET": "Sales target for {scope}: {achieved} achieved ({pct}%).",
    "SUSPICIOUS_TRANSACTION": "Transaction {invoiceNo} ({amount}) flagged as suspicious — review it.",
    "NEW_ORDER": "Dear {name}, order {orderNo} (৳{total}) is confirmed.",
    "DELIVERY_UPDATE": "Dear {name}, delivery {deliveryNo} is now {status}.",
    "PROMOTION": "Dear {name}, exclusive offer: {offer}{coupon}",
    "LOYALTY": "Dear {name}, your loyalty points are now {points} ({tier} tier).",
}

DEFAULT_TITLES: dict[str, str] = {
    "LOW_STOCK": "Low stock: {product}",
    "EXPIRY": "Expiring: {product}",
    "INSTALLMENT_DUE": "Installment due {dueDate}",
    "OVERDUE": "Overdue balance",
    "QUOTATION_EXPIRY": "Quotation {quotationNo} expiring",
    "APPROVAL_REQUIRED": "Approval needed",
    "PAYMENT": "Payment received {invoiceNo}",
    "DIGITAL_RECEIPT": "Receipt {invoiceNo}",
    "WHATSAPP_INVOICE": "Invoice {invoiceNo}",
    "COMMISSION": "Commission {period}",
    "SYNC_FAILURE": "Sync failed — {device}",
    "BRANCH_OFFLINE": "Branch offline — {branch}",
    "SALES_TARGET": "Sales target {scope}",
    "SUSPICIOUS_TRANSACTION": "Suspicious: {invoiceNo}",
    "NEW_ORDER": "Order confirmed {orderNo}",
    "DELIVERY_UPDATE": "Delivery {deliveryNo} {status}",
    "PROMOTION": "Special offer for you",
    "LOYALTY": "Loyalty update",
}

# events that target staff/user inbox (no customer consent gate)
USER_EVENTS = {k for k, v in EVENTS.items() if v["audience"] == "USER"}
# events that may be sent per-customer (consent gate applies)
CUSTOMER_EVENTS = {k for k, v in EVENTS.items() if v["audience"] == "CUSTOMER"}

CUSTOMER_COMMUNICATION_TYPES = [
    "INVOICE_SMS", "PAYMENT_RECEIPT", "DUE_REMINDER", "INSTALLMENT_REMINDER",
    "PROMOTION", "LOYALTY_NOTIFICATION", "DELIVERY_UPDATE",
]


def _uid() -> str:
    return str(_uuid.uuid4())


def _j(v):
    if v is None:
        return None
    if isinstance(v, (dict, list)):
        return v
    try:
        return _json.loads(v)
    except Exception:
        return {}


def _render(tpl: str, params: dict) -> str:
    """Replace {key} placeholders, silently keeping unknown ones."""
    out = tpl or ""
    for k, v in (params or {}).items():
        out = out.replace("{" + k + "}", "" if v is None else str(v))
    return out


async def _channel_enabled(db, tenant_id: str, channel: str) -> bool:
    row = (await db.execute(text(
        "SELECT isEnabled FROM notification_channels WHERE tenantId=:t AND code=:c"),
        {"t": tenant_id, "c": channel})).first()
    # default on if not explicitly configured
    return bool(row[0]) if row else True


async def _opted_out(db, tenant_id: str, customer_id: str, channel: str) -> bool:
    """Central consent gate — every customer-facing send goes through here."""
    row = (await db.execute(text(
        "SELECT status FROM customer_consents WHERE tenantId=:t AND customerId=:c AND channel=:ch"),
        {"t": tenant_id, "c": customer_id, "ch": channel})).first()
    return bool(row) and row[0] == "OPTED_OUT"


async def _load_template(db, tenant_id: str, event: str, channel: str):
    row = (await db.execute(text(
        "SELECT subject, body FROM notification_templates WHERE tenantId=:t AND eventType=:e "
        "AND channel=:c AND isActive=1 ORDER BY createdAt DESC LIMIT 1"),
        {"t": tenant_id, "e": event, "c": channel})).first()
    return dict(row._mapping) if row else None


async def _carrier_send(db, log_id: str, channel: str, address: str, subject: str, body: str):
    """Swappable carrier stub. Demo marks the attempt SENT with carrier metadata."""
    await db.execute(text(
        "UPDATE notification_logs SET status='SENT', sentAt=NOW(), "
        "errorMsg=CONCAT('carrier=', :car) WHERE id=:id"),
        {"car": {"SMS": "sms-gateway", "EMAIL": "smtp", "WHATSAPP": "whatsapp-api", "PUSH": "fcm"}.get(channel, "in-app"),
         "id": log_id})


async def _log_outbound(db, tenant_id, event, channel, recipient, *, status="PENDING",
                        subject=None, body=None, error=None, ref_type=None, ref_id=None):
    """Insert an outbound row; returns its id."""
    lid = _uid()
    await db.execute(text(
        "INSERT INTO notification_logs (id, tenantId, eventType, channel, recipientType, recipientId, "
        "recipientName, recipientAddress, subject, body, status, errorMsg, refType, refId) "
        "VALUES (:id, :t, :e, :c, :rt, :rid, :rn, :ra, :s, :b, :st, :er, :rf, :ri)"),
        {"id": lid, "t": tenant_id, "e": event, "c": channel, "rt": recipient.get("type", "CUSTOMER"),
         "rid": recipient.get("id"), "rn": recipient.get("name"), "ra": recipient.get("address"),
         "s": subject, "b": body, "st": status, "er": error,
         "rf": ref_type, "ri": ref_id})
    return lid


async def dispatch(db, tenant_id: str, event: str, *, customer_id: str | None = None,
                   user_id: str | None = None, channels: list[str] | None = None,
                   params: dict | None = None, name: str | None = None,
                   address: str | None = None, ref_type: str | None = None,
                   ref_id: str | None = None, force: bool = False) -> dict:
    """Fire one notification event.

    Consent is enforced HERE, centrally — callers never check opt-out themselves.
    Returns {event, channel, status} — one entry per attempted channel.
    """
    ev = EVENTS.get(event)
    if not ev:
        return {"event": event, "status": "UNKNOWN_EVENT", "results": []}
    params = params or {}
    results = []
    channels = channels or ev["channels"]
    audience = ev["audience"]

    for ch in channels:
        if ch not in CHANNELS:
            continue
        # 1. channel enabled?
        if not force and not await _channel_enabled(db, tenant_id, ch):
            results.append({"channel": ch, "status": "CHANNEL_OFF"})
            continue
        subject_t = _render((ev["text"].get(ch) or event).replace("_", " "), params)
        body_t = DEFAULT_BODY.get(event, "")
        body = _render(body_t, params)

        # per-tenant override template
        ov = await _load_template(db, tenant_id, event, ch)
        if ov:
            subject_t = _render(ov.get("subject") or subject_t, params)
            body = _render(ov.get("body") or body, params)

        # 2. consent gate for customer-facing channels
        if audience == "CUSTOMER":
            if customer_id and not force and await _opted_out(db, tenant_id, customer_id, ch):
                await _log_outbound(db, tenant_id, event, ch, {
                    "type": "CUSTOMER", "id": customer_id, "name": name, "address": address},
                    status="SKIPPED_OPTOUT", subject=subject_t, body=body,
                    ref_type=ref_type, ref_id=ref_id)
                results.append({"channel": ch, "status": "SKIPPED_OPTOUT"})
                continue
            address = address or (await _customer_address(db, tenant_id, customer_id)).get(ch if ch != IN_APP else "EMAIL")
        elif ch == IN_APP or ch == PUSH:
            # staff notifications: recipient = acting user or broadcast
            await db.execute(text(
                "INSERT INTO inapp_notifications (id, tenantId, userId, eventType, title, body, refType, refId) "
                "VALUES (:id, :t, :u, :e, :title, :body, :rf, :ri)"),
                {"id": _uid(), "t": tenant_id, "u": user_id, "e": event,
                 "title": _render(DEFAULT_TITLES.get(event, event), params), "body": body,
                 "rf": ref_type, "ri": ref_id})
            lid = await _log_outbound(db, tenant_id, event, ch, {
                "type": "USER", "id": user_id, "name": name, "address": None},
                subject=subject_t, body=body, ref_type=ref_type, ref_id=ref_id)
            await _carrier_send(db, lid, ch, "", subject_t, body)
            results.append({"channel": ch, "status": "SENT", "address": None})
            continue

        # customer-facing outbound carrier (email/sms/whatsapp)
        lid = await _log_outbound(db, tenant_id, event, ch, {
            "type": "CUSTOMER", "id": customer_id, "name": name, "address": address},
            subject=subject_t, body=body, ref_type=ref_type, ref_id=ref_id)
        if not address:
            await db.execute(text("UPDATE notification_logs SET status='FAILED', errorMsg=:e WHERE id=:id"),
                             {"e": "No contact address on file", "id": lid})
            results.append({"channel": ch, "status": "FAILED", "reason": "no address"})
            continue
        await _carrier_send(db, lid, ch, address, subject_t, body)
        results.append({"channel": ch, "status": "SENT", "address": address})

    return {"event": event, "status": "OK", "results": results}


async def _customer_address(db, tenant_id: str, customer_id: str) -> dict:
    if not customer_id:
        return {}
    row = (await db.execute(text(
        "SELECT name, phone, email FROM customers WHERE id=:c AND tenantId=:t"),
        {"c": customer_id, "t": tenant_id})).first()
    if not row:
        return {}
    return {"name": row[0], "SMS": row[1], "WHATSAPP": row[1], "EMAIL": row[2]}


async def inbox_for(db, tenant_id: str, user_id: str, limit: int = 100) -> list[dict]:
    rows = (await db.execute(text(
        "SELECT * FROM inapp_notifications WHERE tenantId=:t AND (userId=:u OR userId IS NULL) "
        "ORDER BY createdAt DESC LIMIT :l"), {"t": tenant_id, "u": user_id, "l": min(limit, 200)})).fetchall()
    return [dict(r._mapping) for r in rows]


async def unread_count(db, tenant_id: str, user_id: str) -> int:
    row = (await db.execute(text(
        "SELECT COUNT(*) FROM inapp_notifications WHERE tenantId=:t AND (userId=:u OR userId IS NULL) AND isRead=0"),
        {"t": tenant_id, "u": user_id})).scalar()
    return int(row or 0)


# ─────────────────────────── scheduled checks ───────────────────────────
async def run_scheduled_checks(db, tenant_id: str, user_id: str | None = None) -> dict:
    """Scan for low stock / expiring batches / due & overdue installments /
    expiring quotations / offline devices and fire the matching events."""
    fired: dict[str, int] = {}

    # LOW_STOCK: products at/under their reorder point
    low = (await db.execute(text(
        "SELECT p.name, s.qtyOnHand, COALESCE(p.reorderPoint, 10) AS rp "
        "FROM stock s JOIN products p ON p.id=s.productId AND p.tenantId=s.tenantId "
        "WHERE s.tenantId=:t AND s.qtyOnHand <= COALESCE(p.reorderPoint, 10) AND s.qtyOnHand > 0 LIMIT 20"),
        {"t": tenant_id})).fetchall()
    for r in low:
        await dispatch(db, tenant_id, "LOW_STOCK", user_id=user_id, params={
            "product": r[0], "stock": r[1], "reorder": r[2]}, ref_type="PRODUCT")
        fired["LOW_STOCK"] = fired.get("LOW_STOCK", 0) + 1

    # EXPIRY: batches expiring within 30 days
    exp = (await db.execute(text(
        "SELECT p.name, b.batchNo, b.expiryDate FROM batches b JOIN products p ON p.id=b.productId "
        "AND p.tenantId=b.tenantId WHERE b.tenantId=:t AND b.status='ACTIVE' AND b.qty > 0 "
        "AND b.expiryDate IS NOT NULL AND b.expiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) "
        "LIMIT 20"), {"t": tenant_id})).fetchall()
    for r in exp:
        await dispatch(db, tenant_id, "EXPIRY", user_id=user_id, params={
            "product": r[0], "batchNo": r[1], "expiryDate": str(r[2])[:10]}, ref_type="BATCH")
        fired["EXPIRY"] = fired.get("EXPIRY", 0) + 1

    # Roll any past-due unpaid/partial schedule to OVERDUE so reports/notices see it.
    await db.execute(text(
        "UPDATE installment_schedules SET status='OVERDUE' "
        "WHERE tenantId=:t AND status IN ('DUE','PARTIAL') AND dueDate < CURDATE()"), {"t": tenant_id})

    # installments: due inside 3 days, or overdue
    due = (await db.execute(text(
        "SELECT isc.id, c.id AS cid, c.name, c.phone, c.email, ip.planNo, isc.amount, isc.dueDate "
        "FROM installment_schedules isc JOIN installments ip ON ip.id=isc.installmentId "
        "JOIN customers c ON c.id=ip.customerId "
        "WHERE isc.tenantId=:t AND isc.status IN ('DUE','PARTIAL') AND isc.dueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) "
        "LIMIT 20"), {"t": tenant_id})).fetchall()
    for r in due:
        await dispatch(db, tenant_id, "INSTALLMENT_DUE", customer_id=r[1], name=r[2],
                       params={"name": r[2], "planNo": r[4], "amount": r[6], "dueDate": str(r[7])[:10]},
                       ref_type="INSTALLMENT_SCHEDULE", ref_id=str(r[0]))
        fired["INSTALLMENT_DUE"] = fired.get("INSTALLMENT_DUE", 0) + 1
    over = (await db.execute(text(
        "SELECT isc.id, c.id AS cid, c.name, c.phone, c.email, ip.planNo, isc.amount, isc.dueDate "
        "FROM installment_schedules isc JOIN installments ip ON ip.id=isc.installmentId "
        "JOIN customers c ON c.id=ip.customerId "
        "WHERE isc.tenantId=:t AND isc.status='OVERDUE' "
        "AND isc.dueDate >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) LIMIT 20"), {"t": tenant_id})).fetchall()
    for r in over:
        await dispatch(db, tenant_id, "OVERDUE", customer_id=r[1], name=r[2],
                       params={"name": r[2], "planNo": r[4], "amount": r[6]},
                       ref_type="INSTALLMENT_SCHEDULE", ref_id=str(r[0]))
        fired["OVERDUE"] = fired.get("OVERDUE", 0) + 1

    # QUOTATION_EXPIRY: valid-until within 2 days, still OPEN
    qx = (await db.execute(text(
        "SELECT q.id, c.id AS cid, c.name, c.phone, c.email, q.quotationNo, q.total, q.validUntil "
        "FROM quotations q JOIN customers c ON c.id=q.customerId "
        "WHERE q.tenantId=:t AND q.status='OPEN' AND q.validUntil IS NOT NULL "
        "AND q.validUntil BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY) LIMIT 20"),
        {"t": tenant_id})).fetchall()
    for r in qx:
        await dispatch(db, tenant_id, "QUOTATION_EXPIRY", customer_id=r[1], name=r[2],
                       params={"name": r[2], "quotationNo": r[5], "total": r[6], "validUntil": str(r[7])[:10]},
                       ref_type="QUOTATION", ref_id=str(r[0]))
        fired["QUOTATION_EXPIRY"] = fired.get("QUOTATION_EXPIRY", 0) + 1

    # BRANCH_OFFLINE: devices not synced in 5 min
    off = (await db.execute(text(
        "SELECT d.name, d.lastSyncAt FROM devices d WHERE d.tenantId=:t AND d.status='ACTIVE' "
        "AND (d.lastSyncAt IS NULL OR d.lastSyncAt < NOW() - INTERVAL 5 MINUTE) LIMIT 10"),
        {"t": tenant_id})).fetchall()
    for r in off:
        await dispatch(db, tenant_id, "BRANCH_OFFLINE", user_id=user_id,
                       params={"device": r[0], "since": str(r[1])[:19] if r[1] else "never", "lastSync": str(r[1])[:19] if r[1] else "—"},
                       ref_type="DEVICE")
        fired["BRANCH_OFFLINE"] = fired.get("BRANCH_OFFLINE", 0) + 1

    return {"fired": fired}
