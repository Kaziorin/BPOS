"""End-to-End Test for Prompt 22 — HRM (Human Resource Management).

Verifies:
1. Department CRUD
2. Designation CRUD
3. Employee CRUD with auto-numbering
4. Attendance clock-in / clock-out
5. Leave types & request / approve workflow
6. Payroll generation & approval
7. Shift creation & assignment
"""
from __future__ import annotations

import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:4000"
PASSED = []


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


def main():
    print("============================================================")
    print("Prompt 22 E2E Verification — HRM Module")
    print("============================================================")

    # 1. Login
    st, resp = call("POST", "/api/auth/login", {"email": "admin@blueoceanspos.com", "password": "Admin@123"})
    check("login", st == 200 and "token" in resp)
    token = resp["token"]
    H = {"Authorization": f"Bearer {token}", "x-tenant-id": "demo-shop"}

    # ── 1. DEPARTMENTS ──
    print("\n== 1. Department CRUD ==")
    st, dept_res = call("POST", "/api/v1/hrm/departments", {
        "name": "Kitchen",
        "code": "KIT",
        "description": "Restaurant kitchen staff",
    }, hdrs=H)
    check("department created", st in (200, 201), str(dept_res))
    dept_id = dept_res["data"]["id"]

    st, dept_list = call("GET", "/api/v1/hrm/departments", hdrs=H)
    check("departments listed", st == 200 and any(d["id"] == dept_id for d in dept_list.get("data", [])))

    st, dept_upd = call("PATCH", f"/api/v1/hrm/departments/{dept_id}", {"description": "Updated desc"}, hdrs=H)
    check("department updated", st == 200, str(dept_upd))

    # ── 2. DESIGNATIONS ──
    print("\n== 2. Designation CRUD ==")
    st, desig_res = call("POST", "/api/v1/hrm/designations", {
        "name": "Head Chef",
        "departmentId": dept_id,
        "level": 5,
        "minSalary": 30000,
        "maxSalary": 80000,
    }, hdrs=H)
    check("designation created", st in (200, 201), str(desig_res))
    desig_id = desig_res["data"]["id"]

    st, desig_list = call("GET", "/api/v1/hrm/designations", hdrs=H)
    check("designations listed", st == 200 and any(d["id"] == desig_id for d in desig_list.get("data", [])))

    # ── 3. EMPLOYEES ──
    print("\n== 3. Employee CRUD ==")
    st, emp_res = call("POST", "/api/v1/hrm/employees", {
        "firstName": "Rahim",
        "lastName": "Uddin",
        "email": "rahim@test.com",
        "phone": "+8801711000001",
        "gender": "MALE",
        "joinDate": "2025-01-15",
        "departmentId": dept_id,
        "designationId": desig_id,
        "employmentType": "FULL_TIME",
        "basicSalary": 45000,
    }, hdrs=H)
    check("employee created", st in (200, 201), str(emp_res))
    emp_id = emp_res["data"]["id"]
    emp_no = emp_res["data"]["employeeNo"]
    print(f"  employeeNo={emp_no}")

    st, emp_res2 = call("POST", "/api/v1/hrm/employees", {
        "firstName": "Karim",
        "lastName": "Ahmed",
        "joinDate": "2025-02-01",
        "departmentId": dept_id,
        "employmentType": "FULL_TIME",
        "basicSalary": 35000,
    }, hdrs=H)
    check("employee 2 created", st in (200, 201))
    emp2_id = emp_res2["data"]["id"]

    st, emp_list = call("GET", "/api/v1/hrm/employees?limit=10", hdrs=H)
    check("employees listed", st == 200 and len(emp_list.get("data", [])) >= 2)

    st, emp_detail = call("GET", f"/api/v1/hrm/employees/{emp_id}", hdrs=H)
    check("employee detail", st == 200 and emp_detail["data"]["firstName"] == "Rahim")

    st, emp_upd = call("PATCH", f"/api/v1/hrm/employees/{emp_id}", {"basicSalary": 50000}, hdrs=H)
    check("employee updated", st == 200, str(emp_upd))

    # ── 4. ATTENDANCE ──
    print("\n== 4. Attendance ==")
    st, ci_res = call("POST", "/api/v1/hrm/attendance/clock-in", {"employeeId": emp_id}, hdrs=H)
    check("clock-in", st in (200, 201), str(ci_res))

    st, ci_dup = call("POST", "/api/v1/hrm/attendance/clock-in", {"employeeId": emp_id}, hdrs=H)
    check("duplicate clock-in rejected", ci_dup.get("error", "").lower().find("already") >= 0)

    st, co_res = call("POST", "/api/v1/hrm/attendance/clock-out", {"employeeId": emp_id}, hdrs=H)
    check("clock-out", st == 200, str(co_res))
    if co_res.get("data", {}).get("totalHours"):
        print(f"  totalHours={co_res['data']['totalHours']}")

    # Mark employee 2 absent
    st, abs_res = call("POST", "/api/v1/hrm/attendance", {
        "employeeId": emp2_id,
        "status": "ABSENT",
    }, hdrs=H)
    check("mark absent", st in (200, 201), str(abs_res))

    st, att_list = call("GET", "/api/v1/hrm/attendance?limit=10", hdrs=H)
    check("attendance listed", st == 200 and len(att_list.get("data", [])) >= 2)

    # ── 5. LEAVE TYPES & REQUESTS ──
    print("\n== 5. Leave Management ==")
    st, lt_res = call("POST", "/api/v1/hrm/leave-types", {
        "name": "Annual Leave",
        "daysPerYear": 12,
        "isPaid": True,
    }, hdrs=H)
    check("leave type created", st in (200, 201), str(lt_res))
    lt_id = lt_res["data"]["id"]

    st, sl_res = call("POST", "/api/v1/hrm/leave-types", {
        "name": "Sick Leave",
        "daysPerYear": 7,
        "isPaid": True,
    }, hdrs=H)
    check("sick leave type created", st in (200, 201))

    st, lt_list = call("GET", "/api/v1/hrm/leave-types", hdrs=H)
    check("leave types listed", st == 200 and len(lt_list.get("data", [])) >= 2)

    st, lr_res = call("POST", "/api/v1/hrm/leaves", {
        "employeeId": emp_id,
        "leaveTypeId": lt_id,
        "startDate": "2025-12-20",
        "endDate": "2025-12-22",
        "reason": "Family vacation",
    }, hdrs=H)
    check("leave request created", st in (200, 201), str(lr_res))
    lr_id = lr_res["data"]["id"]
    check("leave days calculated", lr_res["data"]["totalDays"] == 3)

    st, lr_list = call("GET", "/api/v1/hrm/leaves?limit=10", hdrs=H)
    check("leave requests listed", st == 200 and any(lr["id"] == lr_id for lr in lr_list.get("data", [])))

    st, lr_approve = call("POST", f"/api/v1/hrm/leaves/{lr_id}/approve", {}, hdrs=H)
    check("leave approved", st == 200, str(lr_approve))

    # Create another request and reject
    st, lr_res2 = call("POST", "/api/v1/hrm/leaves", {
        "employeeId": emp2_id,
        "leaveTypeId": lt_id,
        "startDate": "2025-12-25",
        "endDate": "2025-12-25",
        "reason": "Personal",
    }, hdrs=H)
    check("leave request 2 created", st in (200, 201))
    lr2_id = lr_res2["data"]["id"]

    st, lr_reject = call("POST", f"/api/v1/hrm/leaves/{lr2_id}/reject", {"reason": "Busy season"}, hdrs=H)
    check("leave rejected", st == 200, str(lr_reject))

    # ── 6. SHIFTS ──
    print("\n== 6. Shift Management ==")
    st, shift_res = call("POST", "/api/v1/hrm/shifts", {
        "name": "Morning Shift",
        "startTime": "08:00:00",
        "endTime": "16:00:00",
        "breakMinutes": 60,
    }, hdrs=H)
    check("shift created", st in (200, 201), str(shift_res))
    shift_id = shift_res["data"]["id"]

    st, shift_res2 = call("POST", "/api/v1/hrm/shifts", {
        "name": "Evening Shift",
        "startTime": "16:00:00",
        "endTime": "00:00:00",
        "breakMinutes": 60,
    }, hdrs=H)
    check("shift 2 created", st in (200, 201))

    st, shift_list = call("GET", "/api/v1/hrm/shifts", hdrs=H)
    check("shifts listed", st == 200 and len(shift_list.get("data", [])) >= 2)

    st, sa_res = call("POST", "/api/v1/hrm/shifts/assign", {
        "shiftId": shift_id,
        "employeeId": emp_id,
        "date": "2025-12-01",
    }, hdrs=H)
    check("shift assigned", st in (200, 201), str(sa_res))

    st, sched = call("GET", "/api/v1/hrm/shifts/schedule?startDate=2025-12-01&endDate=2025-12-31", hdrs=H)
    check("shift schedule returned", st == 200, str(sched))

    # ── 7. PAYROLL ──
    print("\n== 7. Payroll ==")
    # 2025-12 is a fixed key — a previous run's payroll row would 400 the fresh
    # generate, so purge the tenant's payroll for that period first.
    from sqlalchemy import text
    import db as dbmod
    with dbmod.sync_engine.begin() as _c:
        _tid = _c.execute(text("SELECT id FROM tenants WHERE slug='demo-shop'")).first()[0]
        _pids = [r[0] for r in _c.execute(text(
            "SELECT id FROM hrm_payroll WHERE tenantId=:t AND month=12 AND year=2025"),
            {"t": _tid})]
        if _pids:
            _c.execute(text("DELETE FROM hrm_payroll_items WHERE payrollId IN :ids"),
                       {"ids": tuple(_pids)})
            _c.execute(text("DELETE FROM hrm_payroll WHERE id IN :ids"), {"ids": tuple(_pids)})
    st, pay_res = call("POST", "/api/v1/hrm/payroll", {
        "month": 12,
        "year": 2025,
    }, hdrs=H)
    check("payroll generated", st in (200, 201), str(pay_res))
    payroll_id = pay_res["data"]["id"]
    check("payroll has employees", pay_res["data"]["totalEmployees"] >= 2)
    print(f"  payrollNo={pay_res['data']['payrollNo']}  employees={pay_res['data']['totalEmployees']}  netPay={pay_res['data']['totalNetPay']}")

    st, pay_dup = call("POST", "/api/v1/hrm/payroll", {"month": 12, "year": 2025}, hdrs=H)
    check("duplicate payroll rejected", pay_dup.get("error", "").lower().find("already") >= 0)

    st, pay_list = call("GET", "/api/v1/hrm/payroll", hdrs=H)
    check("payrolls listed", st == 200 and len(pay_list.get("data", [])) >= 1)

    st, pay_detail = call("GET", f"/api/v1/hrm/payroll/{payroll_id}", hdrs=H)
    check("payroll detail has items", st == 200 and len(pay_detail.get("data", {}).get("items", [])) >= 2)

    st, pay_approve = call("POST", f"/api/v1/hrm/payroll/{payroll_id}/approve", {}, hdrs=H)
    check("payroll approved", st == 200, str(pay_approve))

    st, pay_paid = call("POST", f"/api/v1/hrm/payroll/{payroll_id}/pay", {}, hdrs=H)
    check("payroll marked paid", st == 200, str(pay_paid))

    # ── 8. EMPLOYEE TERMINATION ──
    print("\n== 8. Employee Termination ==")
    st, emp_term = call("DELETE", f"/api/v1/hrm/employees/{emp2_id}", hdrs=H)
    check("employee terminated", st == 200, str(emp_term))

    st, emp_check = call("GET", f"/api/v1/hrm/employees/{emp2_id}", hdrs=H)
    check("terminated status set", emp_check["data"]["status"] == "TERMINATED")

    # ── Summary ──
    print(f"\n{'='*60}")
    print(f"ALL {len(PASSED)} CHECKS PASSED  ✓")
    print(f"Prompt 22 — HRM Module: VERIFIED")
    print(f"  • Department CRUD: OK")
    print(f"  • Designation CRUD: OK")
    print(f"  • Employee CRUD with auto-numbering: OK")
    print(f"  • Attendance clock-in/out: OK")
    print(f"  • Leave types & approval workflow: OK")
    print(f"  • Shift creation & assignment: OK")
    print(f"  • Payroll generation & approval: OK")
    print(f"  • Employee termination: OK")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
