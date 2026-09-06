"""End-to-End Test for Prompt 25 — HRM extensions + Task Management (§10.24 / §10.31).

Definition-of-Done coverage:
  1. Task Management: full status lifecycle (PENDING → IN_PROGRESS → BLOCKED →
     resume → COMPLETED → reopen → COMPLETED → APPROVED), invalid transitions
     rejected, cancel with reason, comments + attachments, update, delete, and
     a task attached to a real entity (invoice) resolves its label.
  2. Sales targets (Prompt 26-extensible scopeType): EMPLOYEE target with live
     "achieved" computed from confirmed sales in the period + progress %.
  3. Performance reviews: create / update / list for an employee.
  4. Employee commissions: employee linked to a login user, Prompt-13 engine
     run for the employee creates CALCULATED commission rows from confirmed
     sales; per-employee stats (earned/approved/paid) served.
  5. HRM core sanity (attendance clock-in/out) still functional alongside.

The test is self-cleaning: every row it creates is tagged with a STABLE marker
("P25E2E…") and removed at start + end, so the DB returns to baseline and other
module E2Es (p20/p22/p23/p24 + smoke) stay green no matter how often it runs,
even if an earlier run crashed mid-way.
"""
from __future__ import annotations

import json
import uuid
import urllib.request
import urllib.error

BASE_URL = "http://localhost:4000"
PASSED = []

MARK = "P25E2E"                      # stable marker → cleanup finds leftovers of any run
EMP_EMAIL = "p25-e2e@test.local"
EMP2_EMAIL = "p25-e2e2@test.local"
EMP_PHONE = "+8801711000250"

# Seeded directly below with known ids so we can assert on exact figures.
SALE_ID = str(uuid.uuid4())
INV_ID = str(uuid.uuid4())
# Use a far-future window no other test touches → deterministic achieved figures.
PERIOD_START, PERIOD_END = "2099-01-01", "2099-01-31"
SALE_DATE = "2099-01-15"
SALE_TOTAL = 5000.0
COMMISSION_RATE = 10  # %


def call(method: str, path: str, body: dict | None = None, hdrs: dict | None = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if hdrs:
        headers.update(hdrs)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw) if raw else {"error": str(e)}
        except Exception:
            return e.code, {"error": raw or str(e)}


def check(name: str, cond: bool, detail: str = ""):
    if cond:
        PASSED.append(name)
        print(f"  PASS  {name}")
    else:
        print(f"  FAIL  {name}  {detail}")
        raise AssertionError(f"Check failed: {name} — {detail}")


def cleanup(tenant_uuid: str):
    """Remove every artifact this test (or any previous/crashed run) created.
    Employees are matched by stable email / name marker so re-runs always start
    clean; tasks by title marker; targets/reviews by note marker; commissions by
    rule-name marker; the seeded sale + invoice by note marker. FK checks are
    disabled so child rows never block the sweep."""
    from sqlalchemy import text
    import db as dbmod

    with dbmod.sync_engine.begin() as c:
        c.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        # Tasks + children first (task rows have no FK but keep ordering tidy).
        c.execute(text(
            "DELETE FROM task_comments WHERE taskId IN "
            "(SELECT id FROM tasks WHERE tenantId=:t AND (title LIKE :n OR description LIKE :n))"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(
            "DELETE FROM task_attachments WHERE taskId IN "
            "(SELECT id FROM tasks WHERE tenantId=:t AND (title LIKE :n OR description LIKE :n))"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(
            "DELETE FROM tasks WHERE tenantId=:t AND (title LIKE :n OR description LIKE :n)"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        # Employee-scoped children before employees: attendance/leaves/shift-rows
        # match on employeeId; performance reviews carry employeeId + marker notes;
        # sales targets use scopeId (= employee id) + marker targetNote.
        emp_sel = ("(SELECT id FROM hrm_employees WHERE tenantId=:t AND "
                   "(firstName LIKE :n OR email LIKE :e))")
        for tbl in ("hrm_attendance", "hrm_leave_requests", "hrm_shift_assignments"):
            c.execute(text(f"DELETE FROM {tbl} WHERE employeeId IN {emp_sel}"),
                      {"t": tenant_uuid, "n": f"%{MARK}%", "e": "p25-e2e%"})
        c.execute(text(f"DELETE FROM hrm_performance_reviews WHERE tenantId=:t AND notes LIKE :n"),
                  {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(f"DELETE FROM hrm_performance_reviews WHERE employeeId IN {emp_sel}"),
                  {"t": tenant_uuid, "n": f"%{MARK}%", "e": "p25-e2e%"})
        c.execute(text(f"DELETE FROM sales_targets WHERE tenantId=:t AND targetNote LIKE :n"),
                  {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(f"DELETE FROM sales_targets WHERE scopeId IN {emp_sel}"),
                  {"t": tenant_uuid, "n": f"%{MARK}%", "e": "p25-e2e%"})
        # Commission engine rows: our rule + commissions referencing it or our sale.
        c.execute(text(
            "DELETE FROM commissions WHERE saleId=:s OR commissionRuleId IN "
            "(SELECT id FROM commission_rules WHERE tenantId=:t AND name LIKE :n)"),
            {"s": SALE_ID, "t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(
            "DELETE FROM commission_rules WHERE tenantId=:t AND name LIKE :n"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(
            "DELETE FROM hrm_departments WHERE tenantId=:t AND (name LIKE :n OR description LIKE :n)"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(
            "DELETE FROM hrm_employees WHERE tenantId=:t AND "
            "(firstName LIKE :n OR email LIKE :e)"),
            {"t": tenant_uuid, "n": f"%{MARK}%", "e": "p25-e2e%"})
        # Seeded sale + invoice (+ any payments) by marker notes.
        c.execute(text(
            "DELETE FROM payments WHERE saleId IN "
            "(SELECT id FROM sales WHERE tenantId=:t AND note LIKE :n)"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(
            "DELETE FROM invoices WHERE tenantId=:t AND (note LIKE :n OR invoiceNo LIKE :n)"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text(
            "DELETE FROM sales WHERE tenantId=:t AND (note LIKE :n OR invoiceNo LIKE :n)"),
            {"t": tenant_uuid, "n": f"%{MARK}%"})
        c.execute(text("SET FOREIGN_KEY_CHECKS=1"))


def _run():
    print("=" * 72)
    print("Prompt 25 E2E — HRM extensions + Task Management")
    print("=" * 72)

    st, resp = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
    check("login", st == 200 and "token" in resp, str(resp))
    token = resp["token"]
    H = {"Authorization": f"Bearer {token}", "x-tenant-id": "demo-shop"}

    from sqlalchemy import text
    import db as dbmod

    def q1(sql: str, **params):
        with dbmod.sync_engine.connect() as c:
            return c.execute(text(sql), params or None).first()

    tenant_uuid = q1("SELECT id FROM tenants WHERE slug='demo-shop'")[0]
    admin_user_id = q1("SELECT id FROM users WHERE email='admin@blueoceanspos.com'")[0]
    branch_id = q1("SELECT id FROM branches WHERE tenantId=:t LIMIT 1", t=tenant_uuid)[0]

    emp_ids: list = []
    emp2_id = ""
    dept_id = ""
    rule_id = ""

    try:
        # ═══════════ 0. HRM master data — department + employee (linked to admin user) ═══════════
        print("\n== 0. Department + employee (userId-linked, for targets & commissions) ==")
        st, dept = call("POST", "/api/v1/hrm/departments", {
            "name": f"{MARK} Ops", "code": "P25OP", "description": MARK,
        }, hdrs=H)
        check("department created", st in (200, 201) and dept.get("data", {}).get("id"), str(dept))
        dept_id = dept["data"]["id"]

        st, emp = call("POST", "/api/v1/hrm/employees", {
            "firstName": f"{MARK} Rep", "lastName": "Sales",
            "email": EMP_EMAIL, "phone": EMP_PHONE,
            "gender": "MALE", "joinDate": "2025-01-01", "departmentId": dept_id,
            "employmentType": "FULL_TIME", "basicSalary": 40000,
            "userId": admin_user_id, "status": "ACTIVE",
        }, hdrs=H)
        check("employee created (linked to login user)", st in (200, 201) and emp.get("data", {}).get("id"), str(emp))
        emp_id = emp["data"]["id"]
        emp_no = emp["data"]["employeeNo"]
        emp_ids.append(emp_id)

        st, emp_list = call("GET", f"/api/v1/hrm/employees?search={MARK}", hdrs=H)
        check("employee searchable by marker", st == 200 and any(e["id"] == emp_id for e in emp_list.get("data", [])))

        # Attendance sanity (clock-in → duplicate rejected → clock-out)
        st, ci = call("POST", "/api/v1/hrm/attendance/clock-in", {"employeeId": emp_id}, hdrs=H)
        check("attendance clock-in", st in (200, 201), str(ci))
        st, ci2 = call("POST", "/api/v1/hrm/attendance/clock-in", {"employeeId": emp_id}, hdrs=H)
        check("duplicate clock-in rejected", str(ci2.get("error", "")).lower().find("already") >= 0, str(ci2))
        st, co = call("POST", "/api/v1/hrm/attendance/clock-out", {"employeeId": emp_id}, hdrs=H)
        check("attendance clock-out records time", st == 200 and co.get("data", {}).get("clockOut"), str(co))

        # ═══════════ 1. SALES TARGET — EMPLOYEE scope with live achieved ═══════════
        print("\n== 1. Sales target (EMPLOYEE scope, achieved from confirmed sales) ==")
        # Seed one CONFIRMED sale of 5,000 by this employee's user inside the window.
        with dbmod.sync_engine.begin() as c:
            c.execute(text(
                "INSERT INTO sales (id, tenantId, branchId, userId, customerId, invoiceNo, saleDate, "
                "subtotal, discountTotal, taxTotal, total, paidTotal, dueTotal, paymentStatus, status, note, createdBy) "
                "VALUES (:id, :t, :b, :u, NULL, :inv, :sd, 5000, 0, 0, 5000, 5000, 0, 'PAID', 'CONFIRMED', :n, :u)"),
                {"id": SALE_ID, "t": tenant_uuid, "b": branch_id, "u": admin_user_id,
                 "inv": f"{MARK}-SALE", "sd": SALE_DATE, "n": f"{MARK} sale", "u": admin_user_id})
            c.execute(text(
                "INSERT INTO invoices (id, tenantId, branchId, saleId, customerId, invoiceNo, invoiceType, issueDate, "
                "subtotal, taxTotal, total, paidTotal, status, note, createdBy) "
                "VALUES (:id, :t, :b, :s, NULL, :inv, 'STANDARD', :sd, 5000, 0, 5000, 5000, 'PAID', :n, :u)"),
                {"id": INV_ID, "t": tenant_uuid, "b": branch_id, "s": SALE_ID, "inv": f"{MARK}-INV",
                 "sd": SALE_DATE, "n": f"{MARK} invoice", "u": admin_user_id})

        st, tgt = call("POST", "/api/v1/hrm/targets", {
            "scopeType": "EMPLOYEE", "scopeId": emp_id, "periodType": "MONTHLY",
            "periodStart": PERIOD_START, "periodEnd": PERIOD_END,
            "targetAmount": 100000, "metric": "SALES_AMOUNT",
            "targetNote": f"{MARK} target", "branchId": branch_id,
        }, hdrs=H)
        check("sales target created", st in (200, 201) and tgt.get("data", {}).get("id"), str(tgt))
        target_id = tgt["data"]["id"]

        st, tgt_list = call("GET", "/api/v1/hrm/targets?scopeType=EMPLOYEE", hdrs=H)
        mine = next((t for t in tgt_list.get("data", []) if t["id"] == target_id), None)
        check("target listed with scopeName + achieved",
              st == 200 and mine is not None and mine.get("scopeName")
              and float(mine.get("achieved") or 0) >= SALE_TOTAL,
              json.dumps(mine)[:300] if mine else str(tgt_list)[:300])
        check("target progress % = 5% (5,000 / 100,000)",
              mine is not None and abs(float(mine.get("pct") or 0) - 5.0) < 0.01,
              json.dumps(mine)[:300] if mine else "")

        st, bad_tgt = call("POST", "/api/v1/hrm/targets", {"scopeType": "EMPLOYEE", "scopeId": emp_id,
                                                          "targetAmount": 0, "periodStart": PERIOD_START}, hdrs=H)
        check("zero-amount target rejected", st == 400, str(bad_tgt))

        # ═══════════ 2. PERFORMANCE REVIEWS ═══════════
        print("\n== 2. Performance reviews ==")
        st, rev = call("POST", "/api/v1/hrm/performance", {
            "employeeId": emp_id, "reviewDate": "2099-01-20", "rating": 4.5,
            "strengths": "Reliable", "improvements": "Cross-train",
            "goals": "Hit 120% of target", "status": "DRAFT", "notes": f"{MARK} review",
        }, hdrs=H)
        check("performance review created", st in (200, 201) and rev.get("data", {}).get("id"), str(rev))
        review_id = rev["data"]["id"]

        st, rev_upd = call("PATCH", f"/api/v1/hrm/performance/{review_id}", {"rating": 4.8, "status": "SUBMITTED"}, hdrs=H)
        check("review updated", st == 200, str(rev_upd))

        st, rev_list = call("GET", f"/api/v1/hrm/performance?employeeId={emp_id}", hdrs=H)
        mine = next((r for r in rev_list.get("data", []) if r["id"] == review_id), None)
        check("review listed with employee name + updated rating",
              st == 200 and mine is not None and float(mine["rating"]) == 4.8
              and mine.get("employeeName") == f"{MARK} Rep Sales", json.dumps(mine)[:250])

        # ═══════════ 3. EMPLOYEE COMMISSIONS (Prompt 13 engine reuse) ═══════════
        print("\n== 3. Employee commission via shared Prompt-13 engine ==")
        st, rule = call("POST", "/api/v1/commission/rules", {
            "name": f"{MARK} 10pct", "agentUserId": admin_user_id,
            "commissionType": "PERCENTAGE", "rate": COMMISSION_RATE,
        }, hdrs=H)
        check("commission rule created for employee's user", st in (200, 201), str(rule)[:300])
        st, rules = call("GET", "/api/v1/commission/rules", hdrs=H)
        mine = next((x for x in rules.get("data", []) if x.get("name") == f"{MARK} 10pct"), None)
        rule_id = mine.get("id") if mine else ""
        check("commission rule listed with id (active by default)",
              st == 200 and rule_id and mine.get("isActive") in (1, True), str(rules)[:300])

        st, calc = call("POST", f"/api/v1/hrm/employees/{emp_id}/commissions/calculate", {
            "startDate": PERIOD_START, "endDate": PERIOD_END,
        }, hdrs=H)
        check("engine run for employee scanned the seeded sale",
              st == 200 and int(calc.get("data", {}).get("salesScanned") or 0) >= 1
              and int(calc.get("data", {}).get("commissionsCreated") or 0) >= 1, str(calc)[:300])
        expected = round(SALE_TOTAL * COMMISSION_RATE / 100, 2)
        check("commission amount = 10% of 5,000 sale",
              float(calc.get("data", {}).get("totalAmount") or 0) >= expected, str(calc)[:300])

        st, emp_comm = call("GET", f"/api/v1/hrm/employees/{emp_id}/commissions", hdrs=H)
        data = emp_comm.get("data", {})
        has_our_sale = any(cr.get("saleId") == SALE_ID for cr in data.get("commissions", []))
        check("employee commissions endpoint lists our CALCULATED row + stats",
              st == 200 and data.get("employeeName") == f"{MARK} Rep Sales"
              and has_our_sale and float(data.get("stats", {}).get("totalEarned") or 0) >= expected,
              json.dumps(data)[:400])

        # ═══════════ 4. TASK MANAGEMENT — full lifecycle + entity link ═══════════
        print("\n== 4. Task Management ==")
        st, t = call("POST", "/api/v1/tasks", {
            "title": f"{MARK} Follow up invoice", "description": "Call customer & confirm",
            "priority": "HIGH", "dueAt": "2099-02-01 12:00:00",
            "assigneeType": "EMPLOYEE", "assigneeId": emp_id,
            "entityType": "INVOICE", "entityId": INV_ID,
        }, hdrs=H)
        check("task created (PENDING)", st in (200, 201) and t.get("data", {}).get("taskNo", "").startswith("TSK")
              and t["data"]["status"] == "PENDING", str(t))
        t1 = t["data"]["id"]
        check("entity label auto-resolved from invoice", t["data"].get("entityLabel") == f"{MARK}-INV", str(t)[:250])
        check("assignee name resolved", t["data"].get("assigneeName") == f"{MARK} Rep Sales", str(t)[:250])

        st, t2 = call("POST", "/api/v1/tasks", {"title": f"{MARK} Reopen/approve path",
                                                "description": "second task", "priority": "NORMAL"}, hdrs=H)
        check("second task created (unlinked, unassigned)", st in (200, 201), str(t2))
        t2_id = t2["data"]["id"]

        st, tl = call("GET", f"/api/v1/tasks?search={MARK}", hdrs=H)
        check("task list searchable", st == 200 and len(tl.get("data", [])) >= 2, str(tl)[:200])
        st, tl = call("GET", f"/api/v1/tasks?entityType=INVOICE&entityId={INV_ID}", hdrs=H)
        check("tasks filter by attached entity", st == 200 and any(x["id"] == t1 for x in tl.get("data", [])), str(tl)[:200])
        st, tl = call("GET", f"/api/v1/tasks?assigneeId={emp_id}", hdrs=H)
        check("tasks filter by assignee", st == 200 and any(x["id"] == t1 for x in tl.get("data", [])), str(tl)[:200])

        # Lifecycle on t1: start → block → resume → complete → reopen → complete → approve
        st, r = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "IN_PROGRESS"}, hdrs=H)
        check("PENDING → IN_PROGRESS", st == 200 and r["data"]["status"] == "IN_PROGRESS", str(r))
        st, r = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "BLOCKED"}, hdrs=H)
        check("IN_PROGRESS → BLOCKED", st == 200 and r["data"]["status"] == "BLOCKED", str(r))
        st, r = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "IN_PROGRESS"}, hdrs=H)
        check("BLOCKED → IN_PROGRESS (resume)", st == 200 and r["data"]["status"] == "IN_PROGRESS", str(r))
        st, r = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "COMPLETED"}, hdrs=H)
        check("IN_PROGRESS → COMPLETED (completedAt set)", st == 200 and r["data"].get("completedAt"), str(r))
        st, r = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "IN_PROGRESS"}, hdrs=H)
        check("COMPLETED → IN_PROGRESS (reopen)", st == 200, str(r))
        st, r = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "COMPLETED"}, hdrs=H)
        check("re-completed", st == 200, str(r))
        st, r = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "APPROVED"}, hdrs=H)
        check("COMPLETED → APPROVED", st == 200 and r["data"]["status"] == "APPROVED", str(r))

        # Invalid transitions
        st, bad = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "CANCELLED"}, hdrs=H)
        check("APPROVED → CANCELLED rejected (terminal)", st == 400, str(bad))
        st, bad = call("POST", f"/api/v1/tasks/{t1}/status", {"status": "BLOCKED"}, hdrs=H)
        check("APPROVED → BLOCKED rejected (invalid move)", st == 400, str(bad))

        # Comments + attachments
        st, cm = call("POST", f"/api/v1/tasks/{t1}/comments", {"comment": f"{MARK} called customer — all good"}, hdrs=H)
        check("comment added", st in (200, 201) and cm.get("data", {}).get("comment"), str(cm))
        st, att = call("POST", f"/api/v1/tasks/{t1}/attachments", {
            "fileName": f"{MARK}-receipt.pdf", "fileUrl": "https://files.local/receipt.pdf",
            "fileType": "pdf", "sizeBytes": 1024,
        }, hdrs=H)
        check("attachment added", st in (200, 201) and att.get("data", {}).get("id"), str(att))

        st, det = call("GET", f"/api/v1/tasks/{t1}", hdrs=H)
        check("task detail serves comments + attachments + timestamps",
              st == 200 and len(det["data"].get("comments", [])) == 1
              and len(det["data"].get("attachments", [])) == 1
              and det["data"]["status"] == "APPROVED" and det["data"].get("approvedAt"), str(det)[:300])

        # Update task (title/priority/due)
        st, upd = call("PATCH", f"/api/v1/tasks/{t1}", {"title": f"{MARK} Follow up invoice (done)", "priority": "URGENT"}, hdrs=H)
        check("task updated", st == 200, str(upd))

        # Cancel flow with reason on t2
        st, r = call("POST", f"/api/v1/tasks/{t2_id}/status", {"status": "CANCELLED", "reason": "No longer needed"}, hdrs=H)
        check("task cancelled with reason", st == 200, str(r))
        st, det2 = call("GET", f"/api/v1/tasks/{t2_id}", hdrs=H)
        check("cancel reason persisted", st == 200 and det2["data"]["status"] == "CANCELLED"
              and det2["data"].get("cancelReason") == "No longer needed", str(det2)[:250])

        # Delete path
        st, t3 = call("POST", "/api/v1/tasks", {"title": f"{MARK} delete me", "priority": "LOW"}, hdrs=H)
        check("third task created for delete test", st in (200, 201), str(t3))
        t3_id = t3["data"]["id"]
        st, r = call("DELETE", f"/api/v1/tasks/{t3_id}", hdrs=H)
        check("task deleted", st == 200, str(r))
        st, gone = call("GET", f"/api/v1/tasks/{t3_id}", hdrs=H)
        check("deleted task returns 404", st == 404, str(gone))

        # ═══════════ 5. Guard rails ═══════════
        print("\n== 5. Guard rails ==")
        st, emp2 = call("POST", "/api/v1/hrm/employees", {
            "firstName": f"{MARK} Plain", "lastName": "Worker", "email": EMP2_EMAIL,
            "departmentId": dept_id, "joinDate": "2025-01-01",
        }, hdrs=H)
        check("second employee (no userId) created", st in (200, 201), str(emp2))
        emp2_id = emp2["data"]["id"]
        emp_ids.append(emp2_id)
        st, calc2 = call("POST", f"/api/v1/hrm/employees/{emp2_id}/commissions/calculate",
                         {"startDate": PERIOD_START, "endDate": PERIOD_END}, hdrs=H)
        check("commission calc requires userId link", st == 400, str(calc2))

        # Missing title task
        st, no_title = call("POST", "/api/v1/tasks", {"title": "  "}, hdrs=H)
        check("task without title rejected", st == 400, str(no_title))

        print("\n" + "=" * 72)
        print(f"Prompt 25 E2E: {len(PASSED)} checks passed ✅")
        print("=" * 72)
    finally:
        cleanup(tenant_uuid)


def main():
    from sqlalchemy import text
    import db as dbmod
    with dbmod.sync_engine.connect() as c:
        tenant_uuid = c.execute(text("SELECT id FROM tenants WHERE slug='demo-shop'")).first()[0]
    cleanup(tenant_uuid)          # clean leftovers of any earlier run before testing
    _run()


if __name__ == "__main__":
    main()
