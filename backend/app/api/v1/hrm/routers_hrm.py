"""HRM (Human Resource Management) Router (Prompt 22).

Covers:
- Department & Designation management
- Employee CRUD with full profile
- Attendance tracking (clock in/out, daily status)
- Leave management (types, requests, approval workflow)
- Payroll processing (monthly runs, salary breakdown)
- Shift scheduling & assignment
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db, txn
from security import require_auth, resolve_tenant, AuthUser
from util import ok, err, rows_to_dicts, gen_no

router = APIRouter()


def _uuid() -> str:
    return str(uuid.uuid4())


# ═════════════════════════ DEPARTMENTS ═════════════════════════

@router.get("/api/v1/hrm/departments")
async def list_departments(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(
        text("SELECT * FROM hrm_departments WHERE tenantId = :t ORDER BY name"),
        {"t": tenantId},
    )).fetchall())
    return ok(rows)


@router.post("/api/v1/hrm/departments")
async def create_department(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    if not name:
        return err("Name is required", 400)
    dept_id = _uuid()
    await db.execute(
        text(
            "INSERT INTO hrm_departments (id, tenantId, name, code, description, managerId, parentId) "
            "VALUES (:id, :t, :n, :c, :d, :m, :p)"
        ),
        {"id": dept_id, "t": tenantId, "n": name, "c": body.get("code"),
         "d": body.get("description"), "m": body.get("managerId"), "p": body.get("parentId")},
    )
    await db.commit()
    return ok({"id": dept_id, "name": name}, 201)


@router.patch("/api/v1/hrm/departments/{deptId}")
async def update_department(
    deptId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields = []
    params: dict = {"id": deptId, "t": tenantId}
    for key in ("name", "code", "description", "managerId", "parentId", "isActive"):
        if key in body:
            fields.append(f"{key} = :{key}")
            params[key] = body[key]
    if not fields:
        return err("No fields to update", 400)
    await db.execute(text(f"UPDATE hrm_departments SET {', '.join(fields)} WHERE id = :id AND tenantId = :t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/hrm/departments/{deptId}")
async def delete_department(
    deptId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(text("DELETE FROM hrm_departments WHERE id = :id AND tenantId = :t"), {"id": deptId, "t": tenantId})
    await db.commit()
    return ok({"deleted": True})


# ═════════════════════════ DESIGNATIONS ═════════════════════════

@router.get("/api/v1/hrm/designations")
async def list_designations(
    departmentId: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId = :t"
    params: dict = {"t": tenantId}
    if departmentId:
        where += " AND departmentId = :d"
        params["d"] = departmentId
    rows = rows_to_dicts((await db.execute(
        text(f"SELECT * FROM hrm_designations WHERE {where} ORDER BY level, name"), params
    )).fetchall())
    return ok(rows)


@router.post("/api/v1/hrm/designations")
async def create_designation(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    if not name:
        return err("Name is required", 400)
    did = _uuid()
    await db.execute(
        text("INSERT INTO hrm_designations (id, tenantId, name, departmentId, level, minSalary, maxSalary) "
             "VALUES (:id, :t, :n, :d, :l, :min, :max)"),
        {"id": did, "t": tenantId, "n": name, "d": body.get("departmentId"),
         "l": body.get("level", 0), "min": body.get("minSalary"), "max": body.get("maxSalary")},
    )
    await db.commit()
    return ok({"id": did, "name": name}, 201)


# ═════════════════════════ EMPLOYEES ═════════════════════════

@router.get("/api/v1/hrm/employees")
async def list_employees(
    status: str = "",
    departmentId: str = "",
    branchId: str = "",
    search: str = "",
    page: int = Query(1),
    limit: int = Query(50),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "e.tenantId = :t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND e.status = :st"
        params["st"] = status
    if departmentId:
        where += " AND e.departmentId = :d"
        params["d"] = departmentId
    if branchId:
        where += " AND e.branchId = :b"
        params["b"] = branchId
    if search:
        where += " AND (e.firstName LIKE :q OR e.lastName LIKE :q OR e.employeeNo LIKE :q)"
        params["q"] = f"%{search}%"

    off = max(page - 1, 0) * limit
    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT e.*, d.name AS departmentName, ds.name AS designationName, "
            f"b.name AS branchName "
            f"FROM hrm_employees e "
            f"LEFT JOIN hrm_departments d ON d.id = e.departmentId "
            f"LEFT JOIN hrm_designations ds ON ds.id = e.designationId "
            f"LEFT JOIN branches b ON b.id = e.branchId "
            f"WHERE {where} ORDER BY e.employeeNo LIMIT :lim OFFSET :off"
        ),
        {**params, "lim": limit, "off": off},
    )).fetchall())

    for r in rows:
        r["department"] = {"id": r.pop("departmentId"), "name": r.pop("departmentName")} if r.get("departmentName") else None
        r["designation"] = {"id": r.pop("designationId"), "name": r.pop("designationName")} if r.get("designationName") else None
        r["branch"] = {"id": r.pop("branchId"), "name": r.pop("branchName")} if r.get("branchName") else None

    total = (await db.execute(text(f"SELECT COUNT(*) FROM hrm_employees e WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.get("/api/v1/hrm/employees/{empId}")
async def get_employee(
    empId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(
        text(
            "SELECT e.*, d.name AS departmentName, ds.name AS designationName, b.name AS branchName "
            "FROM hrm_employees e "
            "LEFT JOIN hrm_departments d ON d.id = e.departmentId "
            "LEFT JOIN hrm_designations ds ON ds.id = e.designationId "
            "LEFT JOIN branches b ON b.id = e.branchId "
            "WHERE e.id = :id AND e.tenantId = :t"
        ),
        {"id": empId, "t": tenantId},
    )).first()
    if not r:
        return err("Employee not found", 404)
    d = dict(r._mapping)
    d["department"] = {"id": d.pop("departmentId"), "name": d.pop("departmentName")} if d.get("departmentName") else None
    d["designation"] = {"id": d.pop("designationId"), "name": d.pop("designationName")} if d.get("designationName") else None
    d["branch"] = {"id": d.pop("branchId"), "name": d.pop("branchName")} if d.get("branchName") else None
    return ok(d)


@router.post("/api/v1/hrm/employees")
async def create_employee(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    firstName = body.get("firstName")
    if not firstName:
        return err("firstName is required", 400)

    # Auto-generate employee number
    count = (await db.execute(text("SELECT COUNT(*) FROM hrm_employees WHERE tenantId = :t"), {"t": tenantId})).first()[0]
    emp_no = body.get("employeeNo") or f"EMP-{(count + 1):04d}"

    emp_id = _uuid()
    await db.execute(
        text(
            "INSERT INTO hrm_employees "
            "(id, tenantId, userId, employeeNo, firstName, lastName, email, phone, gender, dateOfBirth, "
            "joinDate, departmentId, designationId, branchId, reportingToId, employmentType, status, "
            "basicSalary, bankName, bankAccount, address, emergencyContact, emergencyPhone) "
            "VALUES (:id, :t, :u, :eno, :fn, :ln, :em, :ph, :g, :dob, :jd, :dept, :des, :br, :rt, "
            ":et, :st, :bs, :bn, :ba, :addr, :ec, :ep)"
        ),
        {
            "id": emp_id, "t": tenantId, "u": body.get("userId"),
            "eno": emp_no, "fn": firstName, "ln": body.get("lastName"),
            "em": body.get("email"), "ph": body.get("phone"),
            "g": body.get("gender"), "dob": body.get("dateOfBirth"),
            "jd": body.get("joinDate") or str(date.today()),
            "dept": body.get("departmentId"), "des": body.get("designationId"),
            "br": body.get("branchId"), "rt": body.get("reportingToId"),
            "et": body.get("employmentType", "FULL_TIME"),
            "st": body.get("status", "ACTIVE"),
            "bs": body.get("basicSalary", 0), "bn": body.get("bankName"),
            "ba": body.get("bankAccount"), "addr": body.get("address"),
            "ec": body.get("emergencyContact"), "ep": body.get("emergencyPhone"),
        },
    )
    await db.commit()
    return ok({"id": emp_id, "employeeNo": emp_no, "firstName": firstName}, 201)


@router.patch("/api/v1/hrm/employees/{empId}")
async def update_employee(
    empId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    fields = []
    params: dict = {"id": empId, "t": tenantId}
    allowed = [
        "firstName", "lastName", "email", "phone", "gender", "dateOfBirth",
        "departmentId", "designationId", "branchId", "reportingToId",
        "employmentType", "status", "basicSalary", "bankName", "bankAccount",
        "address", "emergencyContact", "emergencyPhone",
    ]
    for key in allowed:
        if key in body:
            fields.append(f"{key} = :{key}")
            params[key] = body[key]
    if not fields:
        return err("No fields to update", 400)
    await db.execute(text(f"UPDATE hrm_employees SET {', '.join(fields)}, updatedAt = NOW() WHERE id = :id AND tenantId = :t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/hrm/employees/{empId}")
async def delete_employee(
    empId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("UPDATE hrm_employees SET status = 'TERMINATED', updatedAt = NOW() WHERE id = :id AND tenantId = :t"),
        {"id": empId, "t": tenantId},
    )
    await db.commit()
    return ok({"terminated": True})


# ═════════════════════════ ATTENDANCE ═════════════════════════

@router.get("/api/v1/hrm/attendance")
async def list_attendance(
    employeeId: str = "",
    startDate: str = "",
    endDate: str = "",
    status: str = "",
    page: int = Query(1),
    limit: int = Query(50),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "a.tenantId = :t"
    params: dict = {"t": tenantId}
    if employeeId:
        where += " AND a.employeeId = :e"
        params["e"] = employeeId
    if startDate:
        where += " AND a.attendanceDate >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND a.attendanceDate <= :ed"
        params["ed"] = endDate
    if status:
        where += " AND a.status = :st"
        params["st"] = status

    off = max(page - 1, 0) * limit
    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT a.*, e.firstName, e.lastName, e.employeeNo "
            f"FROM hrm_attendance a "
            f"JOIN hrm_employees e ON e.id = a.employeeId "
            f"WHERE {where} ORDER BY a.attendanceDate DESC, a.clockIn DESC LIMIT :lim OFFSET :off"
        ),
        {**params, "lim": limit, "off": off},
    )).fetchall())

    for r in rows:
        r["employeeName"] = f"{r.pop('firstName', '')} {r.pop('lastName', '')}".strip()

    total = (await db.execute(text(f"SELECT COUNT(*) FROM hrm_attendance a WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.post("/api/v1/hrm/attendance/clock-in")
async def clock_in(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    employeeId = body.get("employeeId")
    if not employeeId:
        return err("employeeId is required", 400)

    today = date.today()
    existing = (await db.execute(
        text("SELECT id FROM hrm_attendance WHERE tenantId = :t AND employeeId = :e AND attendanceDate = :d"),
        {"t": tenantId, "e": employeeId, "d": today},
    )).first()
    if existing:
        return err("Already clocked in today", 400)

    att_id = _uuid()
    now = datetime.now()
    await db.execute(
        text(
            "INSERT INTO hrm_attendance (id, tenantId, employeeId, attendanceDate, clockIn, status, createdBy) "
            "VALUES (:id, :t, :e, :d, :ci, 'PRESENT', :u)"
        ),
        {"id": att_id, "t": tenantId, "e": employeeId, "d": today, "ci": now, "u": user.id},
    )
    await db.commit()
    return ok({"id": att_id, "clockIn": now.isoformat(), "status": "PRESENT"}, 201)


@router.post("/api/v1/hrm/attendance/clock-out")
async def clock_out(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    employeeId = body.get("employeeId")
    if not employeeId:
        return err("employeeId is required", 400)

    today = date.today()
    row = (await db.execute(
        text("SELECT id, clockIn FROM hrm_attendance WHERE tenantId = :t AND employeeId = :e AND attendanceDate = :d"),
        {"t": tenantId, "e": employeeId, "d": today},
    )).first()
    if not row:
        return err("No clock-in found for today", 400)
    if row[1] is None:
        return err("Already clocked out", 400)

    now = datetime.now()
    clock_in_time = row[1]
    total_hours = round((now - clock_in_time).total_seconds() / 3600, 2)

    await db.execute(
        text("UPDATE hrm_attendance SET clockOut = :co, totalHours = :th WHERE id = :id"),
        {"co": now, "th": total_hours, "id": row[0]},
    )
    await db.commit()
    return ok({"clockOut": now.isoformat(), "totalHours": total_hours})


@router.post("/api/v1/hrm/attendance")
async def mark_attendance(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Admin: manually mark attendance for an employee."""
    employeeId = body.get("employeeId")
    attDate = body.get("date") or str(date.today())
    status = body.get("status", "PRESENT")
    if not employeeId:
        return err("employeeId is required", 400)

    valid = ["PRESENT", "ABSENT", "HALF_DAY", "LATE", "ON_LEAVE", "HOLIDAY"]
    if status not in valid:
        return err(f"Status must be one of: {', '.join(valid)}", 400)

    att_id = _uuid()
    await db.execute(
        text(
            "INSERT INTO hrm_attendance (id, tenantId, employeeId, attendanceDate, status, note, createdBy) "
            "VALUES (:id, :t, :e, :d, :st, :n, :u) "
            "ON DUPLICATE KEY UPDATE status = :st2, note = :n2, updatedAt = NOW()"
        ),
        {"id": att_id, "t": tenantId, "e": employeeId, "d": attDate,
         "st": status, "st2": status, "n": body.get("note"), "n2": body.get("note"), "u": user.id},
    )
    await db.commit()
    return ok({"marked": True, "status": status}, 201)


# ═════════════════════════ LEAVE TYPES ═════════════════════════

@router.get("/api/v1/hrm/leave-types")
async def list_leave_types(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(
        text("SELECT * FROM hrm_leave_types WHERE tenantId = :t ORDER BY name"), {"t": tenantId}
    )).fetchall())
    return ok(rows)


@router.post("/api/v1/hrm/leave-types")
async def create_leave_type(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    if not name:
        return err("Name is required", 400)
    lt_id = _uuid()
    await db.execute(
        text("INSERT INTO hrm_leave_types (id, tenantId, name, daysPerYear, isPaid, carryForward, maxCarryDays) "
             "VALUES (:id, :t, :n, :d, :ip, :cf, :mc)"),
        {"id": lt_id, "t": tenantId, "n": name, "d": body.get("daysPerYear", 0),
         "ip": 1 if body.get("isPaid", True) else 0,
         "cf": 1 if body.get("carryForward", False) else 0,
         "mc": body.get("maxCarryDays", 0)},
    )
    await db.commit()
    return ok({"id": lt_id, "name": name}, 201)


# ═════════════════════════ LEAVE REQUESTS ═════════════════════════

@router.get("/api/v1/hrm/leaves")
async def list_leave_requests(
    employeeId: str = "",
    status: str = "",
    page: int = Query(1),
    limit: int = Query(50),
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "lr.tenantId = :t"
    params: dict = {"t": tenantId}
    if employeeId:
        where += " AND lr.employeeId = :e"
        params["e"] = employeeId
    if status:
        where += " AND lr.status = :st"
        params["st"] = status

    off = max(page - 1, 0) * limit
    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT lr.*, e.firstName, e.lastName, e.employeeNo, lt.name AS leaveTypeName "
            f"FROM hrm_leave_requests lr "
            f"JOIN hrm_employees e ON e.id = lr.employeeId "
            f"JOIN hrm_leave_types lt ON lt.id = lr.leaveTypeId "
            f"WHERE {where} ORDER BY lr.createdAt DESC LIMIT :lim OFFSET :off"
        ),
        {**params, "lim": limit, "off": off},
    )).fetchall())

    for r in rows:
        r["employeeName"] = f"{r.pop('firstName', '')} {r.pop('lastName', '')}".strip()

    total = (await db.execute(text(f"SELECT COUNT(*) FROM hrm_leave_requests lr WHERE {where}"), params)).first()[0]
    return ok(rows, extra={"pagination": {"page": page, "limit": limit, "total": total}})


@router.post("/api/v1/hrm/leaves")
async def create_leave_request(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    employeeId = body.get("employeeId")
    leaveTypeId = body.get("leaveTypeId")
    startDate = body.get("startDate")
    endDate = body.get("endDate")
    if not all([employeeId, leaveTypeId, startDate, endDate]):
        return err("employeeId, leaveTypeId, startDate, endDate are required", 400)

    # Calculate total days
    d1 = datetime.strptime(startDate, "%Y-%m-%d").date()
    d2 = datetime.strptime(endDate, "%Y-%m-%d").date()
    total_days = (d2 - d1).days + 1
    if total_days <= 0:
        return err("endDate must be after startDate", 400)

    lr_id = _uuid()
    await db.execute(
        text(
            "INSERT INTO hrm_leave_requests (id, tenantId, employeeId, leaveTypeId, startDate, endDate, totalDays, reason) "
            "VALUES (:id, :t, :e, :lt, :sd, :ed, :td, :r)"
        ),
        {"id": lr_id, "t": tenantId, "e": employeeId, "lt": leaveTypeId,
         "sd": startDate, "ed": endDate, "td": total_days, "r": body.get("reason")},
    )
    await db.commit()
    return ok({"id": lr_id, "totalDays": total_days, "status": "PENDING"}, 201)


@router.post("/api/v1/hrm/leaves/{leaveId}/approve")
async def approve_leave(
    leaveId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    lr = (await db.execute(
        text("SELECT id, status, employeeId, startDate, endDate FROM hrm_leave_requests WHERE id = :id AND tenantId = :t"),
        {"id": leaveId, "t": tenantId},
    )).first()
    if not lr:
        return err("Leave request not found", 404)
    if lr[1] != "PENDING":
        return err(f"Cannot approve — current status is {lr[1]}", 400)

    async with txn(db):
        await db.execute(
            text("UPDATE hrm_leave_requests SET status = 'APPROVED', approvedBy = :u, approvedAt = NOW() WHERE id = :id"),
            {"u": user.id, "id": leaveId},
        )
        # Mark attendance as ON_LEAVE for the period
        d1 = lr[3]
        d2 = lr[4]
        current = d1
        while current <= d2:
            await db.execute(
                text(
                    "INSERT INTO hrm_attendance (id, tenantId, employeeId, attendanceDate, status, createdBy) "
                    "VALUES (UUID(), :t, :e, :d, 'ON_LEAVE', :u) "
                    "ON DUPLICATE KEY UPDATE status = 'ON_LEAVE'"
                ),
                {"t": tenantId, "e": lr[2], "d": current, "u": user.id},
            )
            current += timedelta(days=1)

    return ok({"approved": True})


@router.post("/api/v1/hrm/leaves/{leaveId}/reject")
async def reject_leave(
    leaveId: str,
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    lr = (await db.execute(
        text("SELECT id, status FROM hrm_leave_requests WHERE id = :id AND tenantId = :t"),
        {"id": leaveId, "t": tenantId},
    )).first()
    if not lr:
        return err("Leave request not found", 404)
    if lr[1] != "PENDING":
        return err(f"Cannot reject — current status is {lr[1]}", 400)

    await db.execute(
        text("UPDATE hrm_leave_requests SET status = 'REJECTED', approvedBy = :u, approvedAt = NOW(), rejectionReason = :rr WHERE id = :id"),
        {"u": user.id, "rr": body.get("reason", ""), "id": leaveId},
    )
    await db.commit()
    return ok({"rejected": True})


# ═════════════════════════ PAYROLL ═════════════════════════

@router.get("/api/v1/hrm/payroll")
async def list_payroll(
    status: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "tenantId = :t"
    params: dict = {"t": tenantId}
    if status:
        where += " AND status = :st"
        params["st"] = status
    rows = rows_to_dicts((await db.execute(
        text(f"SELECT * FROM hrm_payroll WHERE {where} ORDER BY year DESC, month DESC"), params
    )).fetchall())
    return ok(rows)


@router.get("/api/v1/hrm/payroll/{payrollId}")
async def get_payroll(
    payrollId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(
        text("SELECT * FROM hrm_payroll WHERE id = :id AND tenantId = :t"),
        {"id": payrollId, "t": tenantId},
    )).first()
    if not r:
        return err("Payroll not found", 404)

    items = rows_to_dicts((await db.execute(
        text(
            "SELECT pi.*, e.firstName, e.lastName, e.employeeNo "
            "FROM hrm_payroll_items pi JOIN hrm_employees e ON e.id = pi.employeeId "
            "WHERE pi.payrollId = :pid ORDER BY e.employeeNo"
        ),
        {"pid": payrollId},
    )).fetchall())

    for item in items:
        item["employeeName"] = f"{item.pop('firstName', '')} {item.pop('lastName', '')}".strip()

    return ok({"payroll": dict(r._mapping), "items": items})


@router.post("/api/v1/hrm/payroll")
async def create_payroll(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    month = body.get("month")
    year = body.get("year")
    if not month or not year:
        return err("month and year are required", 400)

    existing = (await db.execute(
        text("SELECT id FROM hrm_payroll WHERE tenantId = :t AND month = :m AND year = :y"),
        {"t": tenantId, "m": month, "y": year},
    )).first()
    if existing:
        return err("Payroll already exists for this month/year", 409)

    payroll_no = gen_no("PAY")
    payroll_id = _uuid()

    # Get all active employees
    employees = rows_to_dicts((await db.execute(
        text("SELECT * FROM hrm_employees WHERE tenantId = :t AND status = 'ACTIVE'"),
        {"t": tenantId},
    )).fetchall())

    total_basic = 0
    total_allowances = 0
    total_deductions = 0
    total_net = 0

    async with txn(db):
        # Calculate attendance-based deductions/adjustments
        for emp in employees:
            basic = float(emp.get("basicSalary", 0) or 0)
            per_day = basic / 30  # Simplified

            # Count leave days (deduction)
            leave_days = (await db.execute(
                text("SELECT COUNT(*) FROM hrm_attendance WHERE tenantId = :t AND employeeId = :e "
                     "AND MONTH(attendanceDate) = :m AND YEAR(attendanceDate) = :y AND status = 'ON_LEAVE'"),
                {"t": tenantId, "e": emp["id"], "m": month, "y": year},
            )).first()[0]

            # Count overtime hours
            ot_row = (await db.execute(
                text("SELECT COALESCE(SUM(overtimeHours), 0) FROM hrm_attendance WHERE tenantId = :t AND employeeId = :e "
                     "AND MONTH(attendanceDate) = :m AND YEAR(attendanceDate) = :y"),
                {"t": tenantId, "e": emp["id"], "m": month, "y": year},
            )).first()[0]

            ot_hours = float(ot_row or 0)
            ot_pay = round(ot_hours * per_day / 8 * 1.5, 2)  # 1.5x hourly rate
            leave_ded = round(float(leave_days) * per_day, 2)

            net = basic + ot_pay - leave_ded

            await db.execute(
                text(
                    "INSERT INTO hrm_payroll_items (id, tenantId, payrollId, employeeId, basicSalary, "
                    "overtimePay, leaveDeduction, netPay) "
                    "VALUES (:id, :t, :pid, :e, :bs, :op, :ld, :np)"
                ),
                {"id": _uuid(), "t": tenantId, "pid": payroll_id,
                 "e": emp["id"], "bs": basic, "op": ot_pay, "ld": leave_ded, "np": net},
            )

            total_basic += basic
            total_deductions += leave_ded
            total_allowances += ot_pay
            total_net += net

        await db.execute(
            text(
                "INSERT INTO hrm_payroll (id, tenantId, payrollNo, month, year, totalEmployees, "
                "totalBasic, totalAllowances, totalDeductions, totalNetPay, status, processedBy, processedAt) "
                "VALUES (:id, :t, :pn, :m, :y, :te, :tb, :ta, :td, :tnp, 'DRAFT', :u, NOW())"
            ),
            {"id": payroll_id, "t": tenantId, "pn": payroll_no, "m": month, "y": year,
             "te": len(employees), "tb": total_basic, "ta": total_allowances,
             "td": total_deductions, "tnp": total_net, "u": user.id},
        )

    return ok({
        "id": payroll_id, "payrollNo": payroll_no,
        "totalEmployees": len(employees), "totalNetPay": total_net,
    }, 201)


@router.post("/api/v1/hrm/payroll/{payrollId}/approve")
async def approve_payroll(
    payrollId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(
        text("SELECT id, status FROM hrm_payroll WHERE id = :id AND tenantId = :t"),
        {"id": payrollId, "t": tenantId},
    )).first()
    if not r:
        return err("Payroll not found", 404)
    if r[1] not in ("DRAFT", "PROCESSED"):
        return err(f"Cannot approve — status is {r[1]}", 400)

    await db.execute(
        text("UPDATE hrm_payroll SET status = 'APPROVED', approvedBy = :u, approvedAt = NOW() WHERE id = :id"),
        {"u": user.id, "id": payrollId},
    )
    await db.commit()
    return ok({"approved": True})


@router.post("/api/v1/hrm/payroll/{payrollId}/pay")
async def mark_payroll_paid(
    payrollId: str,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(
        text("SELECT id, status FROM hrm_payroll WHERE id = :id AND tenantId = :t"),
        {"id": payrollId, "t": tenantId},
    )).first()
    if not r:
        return err("Payroll not found", 404)
    if r[1] != "APPROVED":
        return err(f"Cannot mark paid — status is {r[1]}. Must be APPROVED first.", 400)

    async with txn(db):
        await db.execute(
            text("UPDATE hrm_payroll SET status = 'PAID' WHERE id = :id"), {"id": payrollId}
        )
        await db.execute(
            text("UPDATE hrm_payroll_items SET status = 'PAID', paidAt = NOW() WHERE payrollId = :pid"),
            {"pid": payrollId},
        )
    return ok({"paid": True})


# ═════════════════════════ SHIFTS ═════════════════════════

@router.get("/api/v1/hrm/shifts")
async def list_shifts(
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    rows = rows_to_dicts((await db.execute(
        text("SELECT * FROM hrm_shifts WHERE tenantId = :t ORDER BY startTime"), {"t": tenantId}
    )).fetchall())
    return ok(rows)


@router.post("/api/v1/hrm/shifts")
async def create_shift(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    name = body.get("name")
    start = body.get("startTime")
    end = body.get("endTime")
    if not all([name, start, end]):
        return err("name, startTime, endTime are required", 400)

    shift_id = _uuid()
    await db.execute(
        text("INSERT INTO hrm_shifts (id, tenantId, name, startTime, endTime, breakMinutes) "
             "VALUES (:id, :t, :n, :st, :et, :bm)"),
        {"id": shift_id, "t": tenantId, "n": name, "st": start, "et": end,
         "bm": body.get("breakMinutes", 0)},
    )
    await db.commit()
    return ok({"id": shift_id, "name": name}, 201)


@router.post("/api/v1/hrm/shifts/assign")
async def assign_shift(
    body: dict,
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    shiftId = body.get("shiftId")
    employeeId = body.get("employeeId")
    assignDate = body.get("date")
    if not all([shiftId, employeeId, assignDate]):
        return err("shiftId, employeeId, date are required", 400)

    sa_id = _uuid()
    await db.execute(
        text(
            "INSERT INTO hrm_shift_assignments (id, tenantId, shiftId, employeeId, assignmentDate) "
            "VALUES (:id, :t, :s, :e, :d) "
            "ON DUPLICATE KEY UPDATE shiftId = :s2"
        ),
        {"id": sa_id, "t": tenantId, "s": shiftId, "s2": shiftId, "e": employeeId, "d": assignDate},
    )
    await db.commit()
    return ok({"assigned": True}, 201)


@router.get("/api/v1/hrm/shifts/schedule")
async def shift_schedule(
    startDate: str = "",
    endDate: str = "",
    user: AuthUser = Depends(require_auth),
    tenantId: str = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
):
    where = "sa.tenantId = :t"
    params: dict = {"t": tenantId}
    if startDate:
        where += " AND sa.assignmentDate >= :sd"
        params["sd"] = startDate
    if endDate:
        where += " AND sa.assignmentDate <= :ed"
        params["ed"] = endDate

    rows = rows_to_dicts((await db.execute(
        text(
            f"SELECT sa.*, s.name AS shiftName, s.startTime, s.endTime, "
            f"e.firstName, e.lastName, e.employeeNo "
            f"FROM hrm_shift_assignments sa "
            f"JOIN hrm_shifts s ON s.id = sa.shiftId "
            f"JOIN hrm_employees e ON e.id = sa.employeeId "
            f"WHERE {where} ORDER BY sa.assignmentDate, s.startTime"
        ),
        params,
    )).fetchall())

    for r in rows:
        r["employeeName"] = f"{r.pop('firstName', '')} {r.pop('lastName', '')}".strip()

    return ok(rows)


# ═════════════════════════ SALES TARGETS (§10.35-ready / Prompt 25) ═════════════════════════
# One generic model keyed by scopeType (EMPLOYEE/AGENT/BRANCH/DEPARTMENT/CATEGORY) so
# Prompt 26 (§10.35 budgets) extends it instead of building a parallel system.

async def _target_achieved(db: AsyncSession, tenant_id: str, t: dict) -> float:
    """Live achieved amount for a target from confirmed/completed sales (or
    collections) within the target's own period, scoped to its scopeType."""
    try:
        ps, pe = t["periodStart"], t["periodEnd"]
        if t.get("metric") == "COLLECTION":
            base = ("p.tenantId=:t AND p.status='COMPLETED' "
                    "AND DATE(p.updatedAt) BETWEEN :ps AND :pe")
            sel = "COALESCE(SUM(p.amount),0)"
            fr = "payments p"
        else:
            base = ("s.tenantId=:t AND s.status IN ('CONFIRMED','COMPLETED') "
                    "AND DATE(s.saleDate) BETWEEN :ps AND :pe")
            sel = "COALESCE(SUM(s.total),0)"
            fr = "sales s"
        extra = ""
        params: dict = {"t": tenant_id, "ps": ps, "pe": pe}
        if t["scopeType"] == "EMPLOYEE":
            emp = (await db.execute(text(
                "SELECT userId FROM hrm_employees WHERE id=:id AND tenantId=:t"),
                {"id": t["scopeId"], "t": tenant_id})).first()
            uid = emp[0] if emp else None
            if not uid:
                return 0.0
            extra = " AND p.userId=:uid" if t.get("metric") == "COLLECTION" else " AND s.userId=:uid"
            params["uid"] = uid
        elif t["scopeType"] == "AGENT":
            extra = " AND p.userId=:uid" if t.get("metric") == "COLLECTION" else " AND s.userId=:uid"
            params["uid"] = t["scopeId"]
        elif t["scopeType"] == "BRANCH":
            extra = " AND p.branchId=:bid" if t.get("metric") == "COLLECTION" else " AND s.branchId=:bid"
            params["bid"] = t["scopeId"]
        elif t["scopeType"] == "DEPARTMENT":
            # User-ids of every employee in the department, then their sales.
            user_ids = [r[0] for r in (await db.execute(text(
                "SELECT userId FROM hrm_employees WHERE tenantId=:t AND departmentId=:d "
                "AND userId IS NOT NULL"),
                {"t": tenant_id, "d": t["scopeId"]})).fetchall()]
            if not user_ids:
                return 0.0
            if t.get("metric") == "COLLECTION":
                extra = " AND p.userId IN :uids"
            else:
                extra = " AND s.userId IN :uids"
            params["uids"] = tuple(user_ids)
        else:
            extra = " AND 1=0"
        row = (await db.execute(text(f"SELECT {sel} FROM {fr} WHERE {base}{extra}"), params)).first()
        return round(float(row[0] or 0), 2)
    except Exception:
        return 0.0


@router.get("/api/v1/hrm/targets")
async def list_sales_targets(scopeType: str = "", scopeId: str = "", period: str = "",
                             user: AuthUser = Depends(require_auth),
                             tenantId: str = Depends(resolve_tenant),
                             db: AsyncSession = Depends(get_db)):
    where = "t.tenantId=:t"
    params: dict = {"t": tenantId}
    if scopeType:
        where += " AND t.scopeType=:st"; params["st"] = scopeType.upper()
    if scopeId:
        where += " AND t.scopeId=:sid"; params["sid"] = scopeId
    if period:
        where += " AND t.periodStart <= :pe AND t.periodEnd >= :ps"
        params["pe"], params["ps"] = f"{period}-12-31", f"{period}-01-01"
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT t.*, e.firstName, e.lastName, e.employeeNo, b.name AS branchName "
        f"FROM sales_targets t "
        f"LEFT JOIN hrm_employees e ON e.id=t.scopeId AND t.scopeType='EMPLOYEE' "
        f"LEFT JOIN branches b ON b.id=t.scopeId AND t.scopeType='BRANCH' "
        f"WHERE {where} ORDER BY t.periodStart DESC, t.createdAt DESC"), params)).fetchall())
    for r in rows:
        r["scopeName"] = f"{r.pop('firstName', '') or ''} {r.pop('lastName', '') or ''}".strip() or r.pop("employeeNo", None) or r.pop("branchName", None) or ""
        r["achieved"] = await _target_achieved(db, tenantId, r)
        r["targetAmount"] = float(r.get("targetAmount") or 0)
        r["pct"] = round(r["achieved"] / r["targetAmount"] * 100, 1) if float(r["targetAmount"] or 0) > 0 else 0
    return ok(rows)


@router.post("/api/v1/hrm/targets")
async def create_sales_target(body: dict, user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant),
                              db: AsyncSession = Depends(get_db)):
    scope_type = (body.get("scopeType") or "EMPLOYEE").upper()
    scope_id = body.get("scopeId")
    if not scope_id:
        return err("scopeId is required (employee/branch/agent id)", 400)
    if scope_type not in ("EMPLOYEE", "AGENT", "BRANCH", "DEPARTMENT", "CATEGORY"):
        return err("Invalid scopeType", 400)
    target_amount = float(body.get("targetAmount") or 0)
    if target_amount <= 0:
        return err("targetAmount must be > 0", 400)
    period_start = body.get("periodStart")
    period_end = body.get("periodEnd")
    period_type = (body.get("periodType") or "MONTHLY").upper()
    if not period_start and not period_end:
        # Default to the current month.
        import calendar as _cal
        from datetime import date as _date
        today = _date.today()
        period_start = today.replace(day=1).isoformat()
        last = _cal.monthrange(today.year, today.month)[1]
        period_end = today.replace(day=last).isoformat()
    tid = _uuid()
    await db.execute(text(
        "INSERT INTO sales_targets (id, tenantId, branchId, scopeType, scopeId, periodType, periodStart, "
        "periodEnd, targetAmount, metric, targetNote, createdBy) "
        "VALUES (:id, :t, :b, :st, :sid, :pt, :ps, :pe, :ta, :m, :n, :u)"),
        {"id": tid, "t": tenantId, "b": body.get("branchId") or (scope_id if scope_type == "BRANCH" else None),
         "st": scope_type, "sid": scope_id, "pt": period_type, "ps": period_start, "pe": period_end,
         "ta": target_amount, "m": body.get("metric", "SALES_AMOUNT").upper(),
         "n": body.get("targetNote"), "u": user.id})
    await db.commit()
    return ok({"id": tid, "scopeType": scope_type, "scopeId": scope_id, "targetAmount": target_amount}, 201)


@router.patch("/api/v1/hrm/targets/{targetId}")
async def update_sales_target(targetId: str, body: dict, user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant),
                              db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM sales_targets WHERE id=:id AND tenantId=:t"),
                            {"id": targetId, "t": tenantId})).first()
    if not row:
        return err("Target not found", 404)
    fields, params = [], {"id": targetId, "t": tenantId}
    for key in ("targetAmount", "periodStart", "periodEnd", "metric", "targetNote", "isActive", "scopeId", "scopeType"):
        if key in body and body[key] is not None:
            fields.append(f"{key}=:{key}")
            params[key] = body[key]
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE sales_targets SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


@router.delete("/api/v1/hrm/targets/{targetId}")
async def delete_sales_target(targetId: str, user: AuthUser = Depends(require_auth),
                              tenantId: str = Depends(resolve_tenant),
                              db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM sales_targets WHERE id=:id AND tenantId=:t"),
                            {"id": targetId, "t": tenantId})).first()
    if not row:
        return err("Target not found", 404)
    await db.execute(text("UPDATE sales_targets SET isActive=0 WHERE id=:id"), {"id": targetId})
    await db.commit()
    return ok({"deleted": True})


# ═════════════════════════ PERFORMANCE REVIEWS (§10.24) ═════════════════════════

@router.get("/api/v1/hrm/performance")
async def list_performance(employeeId: str = "", status: str = "",
                           user: AuthUser = Depends(require_auth),
                           tenantId: str = Depends(resolve_tenant),
                           db: AsyncSession = Depends(get_db)):
    where = "p.tenantId=:t"
    params: dict = {"t": tenantId}
    if employeeId:
        where += " AND p.employeeId=:e"; params["e"] = employeeId
    if status:
        where += " AND p.status=:s"; params["s"] = status
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT p.*, e.firstName, e.lastName, e.employeeNo, e.designationId "
        f"FROM hrm_performance_reviews p JOIN hrm_employees e ON e.id=p.employeeId "
        f"WHERE {where} ORDER BY p.reviewDate DESC"), params)).fetchall())
    for r in rows:
        r["employeeName"] = f"{r.pop('firstName', '')} {r.pop('lastName', '')}".strip()
    return ok(rows)


@router.post("/api/v1/hrm/performance")
async def create_performance_review(body: dict, user: AuthUser = Depends(require_auth),
                                    tenantId: str = Depends(resolve_tenant),
                                    db: AsyncSession = Depends(get_db)):
    employeeId = body.get("employeeId")
    if not employeeId:
        return err("employeeId is required", 400)
    emp = (await db.execute(text("SELECT id FROM hrm_employees WHERE id=:id AND tenantId=:t"),
                            {"id": employeeId, "t": tenantId})).first()
    if not emp:
        return err("Employee not found", 404)
    pid = _uuid()
    await db.execute(text(
        "INSERT INTO hrm_performance_reviews (id, tenantId, employeeId, reviewDate, rating, strengths, "
        "improvements, goals, status, reviewedBy, notes, createdBy) "
        "VALUES (:id, :t, :e, :rd, :r, :s, :i, :g, :st, :rb, :n, :u)"),
        {"id": pid, "t": tenantId, "e": employeeId, "rd": body.get("reviewDate") or str(date.today()),
         "r": float(body.get("rating") or 0), "s": body.get("strengths"), "i": body.get("improvements"),
         "g": body.get("goals"), "st": (body.get("status") or "DRAFT").upper(),
         "rb": body.get("reviewedBy"), "n": body.get("notes"), "u": user.id})
    await db.commit()
    return ok({"id": pid, "employeeId": employeeId, "rating": float(body.get("rating") or 0)}, 201)


@router.patch("/api/v1/hrm/performance/{reviewId}")
async def update_performance_review(reviewId: str, body: dict, user: AuthUser = Depends(require_auth),
                                    tenantId: str = Depends(resolve_tenant),
                                    db: AsyncSession = Depends(get_db)):
    row = (await db.execute(text("SELECT id FROM hrm_performance_reviews WHERE id=:id AND tenantId=:t"),
                            {"id": reviewId, "t": tenantId})).first()
    if not row:
        return err("Review not found", 404)
    fields, params = [], {"id": reviewId, "t": tenantId}
    for key in ("rating", "strengths", "improvements", "goals", "status", "notes", "reviewedBy"):
        if key in body and body[key] is not None:
            fields.append(f"{key}=:{key}")
            params[key] = body[key]
    if not fields:
        return err("Nothing to update", 400)
    await db.execute(text(f"UPDATE hrm_performance_reviews SET {', '.join(fields)} WHERE id=:id AND tenantId=:t"), params)
    await db.commit()
    return ok({"updated": True})


# ═════════════════════════ EMPLOYEE COMMISSIONS (§10.24 / Prompt 13 reuse) ═════════════════════════
# Reuses the Prompt 13 commission engine: commissions rows are read/written through the
# existing lifecycle (CALCULATED → APPROVED → PAYABLE → PAID) via /api/v1/commission.

@router.get("/api/v1/hrm/employees/{empId}/commissions")
async def employee_commissions(empId: str, status: str = "",
                               user: AuthUser = Depends(require_auth),
                               tenantId: str = Depends(resolve_tenant),
                               db: AsyncSession = Depends(get_db)):
    emp = (await db.execute(text(
        "SELECT e.id, e.userId, CONCAT_WS(' ', e.firstName, e.lastName) AS name, e.employeeNo "
        "FROM hrm_employees e WHERE e.id=:id AND e.tenantId=:t"),
        {"id": empId, "t": tenantId})).first()
    if not emp:
        return err("Employee not found", 404)
    where = "c.tenantId=:t AND c.agentUserId=:a"
    params: dict = {"t": tenantId, "a": emp[1]}
    if status:
        where += " AND c.status=:s"; params["s"] = status
    rows = rows_to_dicts((await db.execute(text(
        f"SELECT c.*, s.invoiceNo AS saleNo, s.saleDate FROM commissions c "
        f"LEFT JOIN sales s ON s.id=c.saleId WHERE {where} ORDER BY c.createdAt DESC"),
        params)).fetchall())
    stats = {"totalEarned": 0.0, "totalApproved": 0.0, "totalPaid": 0.0, "pendingCount": 0}
    for r in rows:
        amt = float(r.get("amount") or 0)
        stats["totalEarned"] += amt
        if r.get("status") in ("APPROVED", "PAYABLE", "PAID"):
            stats["totalApproved"] += amt
        if r.get("status") == "PAID":
            stats["totalPaid"] += amt
        if r.get("status") == "CALCULATED":
            stats["pendingCount"] += 1
    return ok({"employeeId": empId, "employeeName": emp[2], "employeeNo": emp[3],
               "stats": stats, "commissions": rows})


@router.post("/api/v1/hrm/employees/{empId}/commissions/calculate")
async def calculate_employee_commission(empId: str, body: dict,
                                        user: AuthUser = Depends(require_auth),
                                        tenantId: str = Depends(resolve_tenant),
                                        db: AsyncSession = Depends(get_db)):
    """Run Prompt 13's commission engine for one employee against their confirmed sales
    in a date range, creating CALCULATED commission rows through the shared engine."""
    emp = (await db.execute(text(
        "SELECT e.id, e.userId, CONCAT_WS(' ', e.firstName, e.lastName) AS name, e.employeeNo "
        "FROM hrm_employees e WHERE e.id=:id AND e.tenantId=:t"),
        {"id": empId, "t": tenantId})).first()
    if not emp:
        return err("Employee not found", 404)
    if not emp[1]:
        return err("Employee is not linked to a login user — link userId first", 400)
    start = body.get("startDate") or (date.today().replace(day=1)).isoformat()
    end = body.get("endDate") or date.today().isoformat()
    # Prompt 13 rules matching this agent (EMPLOYEE / generic SALES_AGENT rules for the user).
    rules = rows_to_dicts((await db.execute(text(
        "SELECT * FROM commission_rules WHERE tenantId=:t AND isActive=1 "
        "AND (agentUserId=:a) ORDER BY priority DESC"), {"t": tenantId, "a": emp[1]})).fetchall())
    sales = rows_to_dicts((await db.execute(text(
        "SELECT id, invoiceNo, total, saleDate FROM sales WHERE tenantId=:t AND userId=:u "
        "AND status IN ('CONFIRMED','COMPLETED') AND DATE(saleDate) BETWEEN :sd AND :ed"),
        {"t": tenantId, "u": emp[1], "sd": start, "ed": end})).fetchall())
    created = 0
    total_amount = 0.0
    async with txn(db):
        for rule in rules:
            ctype = rule.get("commissionType") or "NONE"
            rate = float(rule.get("rate") or 0)
            fixed = float(rule.get("fixedAmount") or 0)
            for s in sales:
                amount = 0.0
                if ctype == "PERCENTAGE":
                    amount = round(float(s["total"]) * rate / 100, 2)
                elif ctype == "FIXED":
                    amount = fixed
                else:
                    continue
                if amount <= 0:
                    continue
                existing = (await db.execute(text(
                    "SELECT id FROM commissions WHERE tenantId=:t AND saleId=:s AND commissionRuleId=:r "
                    "AND status NOT IN ('REVERSED')"), {"t": tenantId, "s": s["id"], "r": rule["id"]})).first()
                if existing:
                    continue
                await db.execute(text(
                    "INSERT INTO commissions (id, tenantId, saleId, agentUserId, agentName, commissionType, "
                    "basisAmount, rate, amount, status, agentType, commissionRuleId, note, createdBy) "
                    "VALUES (:id, :t, :s, :au, :an, :ct, :ba, :r, :am, 'CALCULATED', 'EMPLOYEE', :rid, :n, :u)"),
                    {"id": _uuid(), "t": tenantId, "s": s["id"], "au": emp[1], "an": emp[2],
                     "ct": ctype, "ba": float(s["total"]), "r": rate, "am": amount,
                     "rid": rule["id"], "n": f"Auto-calc on {s['invoiceNo']} ({start}→{end})", "u": user.id})
                created += 1
                total_amount += amount
    return ok({"employeeId": empId, "rulesUsed": len(rules), "salesScanned": len(sales),
               "commissionsCreated": created, "totalAmount": round(total_amount, 2),
               "startDate": start, "endDate": end})
