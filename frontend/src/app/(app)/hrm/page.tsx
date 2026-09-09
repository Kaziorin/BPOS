"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  Wallet,
  Building2,
  BadgeCheck,
  RefreshCw,
  Plus,
  Search,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  FileText,
  Save,
  Trash2,
  Eye,
  BarChart3,
  Target,
  Star,
  CircleDollarSign,
  TrendingUp,
  MessageSquarePlus,
} from "lucide-react";

type TabType = "employees" | "attendance" | "leave" | "payroll" | "shifts" | "departments"
  | "targets" | "performance" | "commissions";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: number;
}

interface Designation {
  id: string;
  name: string;
  departmentId: string;
  level: number;
  minSalary?: number;
  maxSalary?: number;
}

interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  joinDate: string;
  status: string;
  employmentType: string;
  basicSalary: number;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
}

interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  attendanceDate: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number | null;
  status: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
}

interface Payroll {
  id: string;
  payrollNo: string;
  month: number;
  year: number;
  totalEmployees: number;
  totalBasic: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetPay: number;
  status: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

const currency = (v: number) => `৳${v.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  INACTIVE: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  TERMINATED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  ON_LEAVE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  PRESENT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ABSENT: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  HALF_DAY: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  LATE: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  PENDING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  REJECTED: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  DRAFT: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  PROCESSED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  PAID: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${STATUS_BADGES[status] || STATUS_BADGES.ACTIVE}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function HRMPage() {
  const [activeTab, setActiveTab] = useState<TabType>("employees");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-r from-cyan-900/40 via-blue-900/20 to-slate-900 border border-cyan-500/20 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-2xl shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Human Resource Management</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Active (Prompt 22)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Employee management, attendance tracking, leave, payroll & shift scheduling
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {([
          { id: "employees", label: "Employees", icon: Users },
          { id: "attendance", label: "Attendance", icon: Clock },
          { id: "leave", label: "Leave", icon: Calendar },
          { id: "payroll", label: "Payroll", icon: Wallet },
          { id: "shifts", label: "Shifts", icon: Briefcase },
          { id: "departments", label: "Departments", icon: Building2 },
          { id: "targets", label: "Targets", icon: Target },
          { id: "performance", label: "Performance", icon: Star },
          { id: "commissions", label: "Commissions", icon: CircleDollarSign },
        ] as { id: TabType; label: string; icon: React.ElementType }[]).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "employees" && <EmployeesTab />}
      {activeTab === "attendance" && <AttendanceTab />}
      {activeTab === "leave" && <LeaveTab />}
      {activeTab === "payroll" && <PayrollTab />}
      {activeTab === "shifts" && <ShiftsTab />}
      {activeTab === "departments" && <DepartmentsTab />}
      {activeTab === "targets" && <SalesTargetsTab />}
      {activeTab === "performance" && <PerformanceTab />}
      {activeTab === "commissions" && <EmployeeCommissionsTab />}
    </div>
  );
}

// ═════════════════════════ EMPLOYEES ═════════════════════════
function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resEmp, resDept, resDesig] = await Promise.all([
        api.get<{ data: Employee[] }>(`/v1/hrm/employees?limit=100${search ? `&search=${search}` : ""}`),
        api.get<{ data: Department[] }>("/v1/hrm/departments"),
        api.get<{ data: Designation[] }>("/v1/hrm/designations"),
      ]);
      setEmployees(resEmp.data || []);
      setDepartments(resDept.data || []);
      setDesignations(resDesig.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      await api.post("/v1/hrm/employees", {
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        gender: fd.get("gender"),
        joinDate: fd.get("joinDate"),
        departmentId: fd.get("departmentId") || undefined,
        designationId: fd.get("designationId") || undefined,
        employmentType: fd.get("employmentType"),
        basicSalary: Number(fd.get("basicSalary") || 0),
      });
      setShowAddModal(false);
      load();
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  const handleTerminate = async (empId: string) => {
    if (!confirm("Are you sure you want to terminate this employee?")) return;
    try {
      await api.del(`/v1/hrm/employees/${empId}`);
      load();
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 w-64 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="text-left p-3 font-semibold">Employee</th>
              <th className="text-left p-3 font-semibold">Department</th>
              <th className="text-left p-3 font-semibold">Designation</th>
              <th className="text-right p-3 font-semibold">Salary</th>
              <th className="text-center p-3 font-semibold">Type</th>
              <th className="text-center p-3 font-semibold">Status</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="p-3">
                  <div>
                    <p className="text-white font-medium">{emp.firstName} {emp.lastName || ""}</p>
                    <p className="text-[10px] text-slate-500">{emp.employeeNo} · {emp.email || emp.phone || ""}</p>
                  </div>
                </td>
                <td className="p-3 text-slate-300">{emp.department?.name || "—"}</td>
                <td className="p-3 text-slate-300">{emp.designation?.name || "—"}</td>
                <td className="p-3 text-right text-white font-medium">{currency(emp.basicSalary)}</td>
                <td className="p-3 text-center text-slate-400">{emp.employmentType?.replace("_", " ")}</td>
                <td className="p-3 text-center"><Badge status={emp.status} /></td>
                <td className="p-3 text-right">
                  {emp.status !== "TERMINATED" && (
                    <button
                      onClick={() => handleTerminate(emp.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                      title="Terminate"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No employees found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" /> Add New Employee
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">First Name *</label>
                <input name="firstName" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Last Name</label>
                <input name="lastName" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Email</label>
                <input name="email" type="email" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Phone</label>
                <input name="phone" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Gender</label>
                <select name="gender" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="">—</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Join Date *</label>
                <input name="joinDate" type="date" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Type</label>
                <select name="employmentType" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Department</label>
                <select name="departmentId" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="">— None —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Designation</label>
                <select name="designationId" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="">— None —</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Basic Salary (৳)</label>
              <input name="basicSalary" type="number" min="0" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 rounded-lg hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 shadow-md">Create Employee</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ ATTENDANCE ═════════════════════════
function AttendanceTab() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [todayDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resAtt, resEmp] = await Promise.all([
        api.get<{ data: Attendance[] }>(`/v1/hrm/attendance?limit=50${selectedEmp ? `&employeeId=${selectedEmp}` : ""}`),
        api.get<{ data: Employee[] }>("/v1/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setRecords(resAtt.data || []);
      setEmployees(resEmp.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedEmp]);

  useEffect(() => { load(); }, [load]);

  const handleClockIn = async (empId: string) => {
    try {
      await api.post("/v1/hrm/attendance/clock-in", { employeeId: empId });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClockOut = async (empId: string) => {
    try {
      await api.post("/v1/hrm/attendance/clock-out", { employeeId: empId });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkAbsent = async (empId: string) => {
    try {
      await api.post("/v1/hrm/attendance", { employeeId: empId, date: todayDate, status: "ABSENT" });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" /> Quick Actions — {todayDate}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {employees.slice(0, 8).map((emp) => (
            <div key={emp.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-[11px] text-white font-medium truncate">{emp.firstName} {emp.lastName || ""}</p>
              <p className="text-[10px] text-slate-500 mb-2">{emp.employeeNo}</p>
              <div className="flex gap-1.5">
                <button onClick={() => handleClockIn(emp.id)} className="flex-1 px-2 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded">IN</button>
                <button onClick={() => handleClockOut(emp.id)} className="flex-1 px-2 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded">OUT</button>
                <button onClick={() => handleMarkAbsent(emp.id)} className="px-2 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded">ABS</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-semibold">Filter:</span>
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>
            ))}
          </select>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="text-left p-3 font-semibold">Employee</th>
              <th className="text-left p-3 font-semibold">Date</th>
              <th className="text-center p-3 font-semibold">Clock In</th>
              <th className="text-center p-3 font-semibold">Clock Out</th>
              <th className="text-right p-3 font-semibold">Hours</th>
              <th className="text-center p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="p-3 text-white">{r.employeeName} <span className="text-[10px] text-slate-500">({r.employeeNo})</span></td>
                <td className="p-3 text-slate-300">{r.attendanceDate}</td>
                <td className="p-3 text-center text-emerald-400">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : "—"}</td>
                <td className="p-3 text-center text-blue-400">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : "—"}</td>
                <td className="p-3 text-right text-slate-300">{r.totalHours ? `${r.totalHours}h` : "—"}</td>
                <td className="p-3 text-center"><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═════════════════════════ LEAVE ═════════════════════════
function LeaveTab() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resLeave, resTypes, resEmp] = await Promise.all([
        api.get<{ data: LeaveRequest[] }>("/v1/hrm/leaves?limit=50"),
        api.get<{ data: any[] }>("/v1/hrm/leave-types"),
        api.get<{ data: Employee[] }>("/v1/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setLeaves(resLeave.data || []);
      setLeaveTypes(resTypes.data || []);
      setEmployees(resEmp.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    try { await api.post(`/v1/hrm/leaves/${id}/approve`); load(); } catch (err: any) { alert(err.message); }
  };

  const handleReject = async (id: string) => {
    const reason = "Rejected by HR";
    try { await api.post(`/v1/hrm/leaves/${id}/reject`, { reason }); load(); } catch (err: any) { alert(err.message); }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      await api.post("/v1/hrm/leaves", {
        employeeId: fd.get("employeeId"),
        leaveTypeId: fd.get("leaveTypeId"),
        startDate: fd.get("startDate"),
        endDate: fd.get("endDate"),
        reason: fd.get("reason"),
      });
      setShowRequestModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 font-semibold">{leaves.length} leave requests</span>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowRequestModal(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="text-left p-3 font-semibold">Employee</th>
              <th className="text-left p-3 font-semibold">Leave Type</th>
              <th className="text-left p-3 font-semibold">Period</th>
              <th className="text-center p-3 font-semibold">Days</th>
              <th className="text-left p-3 font-semibold">Reason</th>
              <th className="text-center p-3 font-semibold">Status</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((lr) => (
              <tr key={lr.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="p-3 text-white">{lr.employeeName}</td>
                <td className="p-3 text-slate-300">{lr.leaveTypeName}</td>
                <td className="p-3 text-slate-400">{lr.startDate} → {lr.endDate}</td>
                <td className="p-3 text-center text-white font-bold">{lr.totalDays}</td>
                <td className="p-3 text-slate-400 max-w-[200px] truncate">{lr.reason || "—"}</td>
                <td className="p-3 text-center"><Badge status={lr.status} /></td>
                <td className="p-3 text-right">
                  {lr.status === "PENDING" && (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleApprove(lr.id)} className="px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500">
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />Approve
                      </button>
                      <button onClick={() => handleReject(lr.id)} className="px-2 py-1 text-[10px] font-bold bg-rose-600 text-white rounded hover:bg-rose-500">
                        <XCircle className="w-3 h-3 inline mr-1" />Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleRequest} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">New Leave Request</h3>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Employee</label>
              <select name="employeeId" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                <option value="">Select...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Leave Type</label>
              <select name="leaveTypeId" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                <option value="">Select...</option>
                {leaveTypes.map((lt: any) => <option key={lt.id} value={lt.id}>{lt.name} ({lt.daysPerYear}d/yr)</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Start Date</label>
                <input name="startDate" type="date" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">End Date</label>
                <input name="endDate" type="date" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Reason</label>
              <textarea name="reason" rows={3} className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-lg hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ PAYROLL ═════════════════════════
function PayrollTab() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [payrollItems, setPayrollItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Payroll[] }>("/v1/hrm/payroll");
      setPayrolls(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    if (!confirm(`Create payroll for ${month}/${year}?`)) return;
    try {
      const res = await api.post<{ data: Payroll }>("/v1/hrm/payroll", { month, year });
      alert(`Payroll ${res.data.payrollNo} created with ${res.data.totalEmployees} employees`);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    try { await api.post(`/v1/hrm/payroll/${id}/approve`); load(); } catch (err: any) { alert(err.message); }
  };

  const handlePay = async (id: string) => {
    if (!confirm("Mark all items as paid?")) return;
    try { await api.post(`/v1/hrm/payroll/${id}/pay`); load(); } catch (err: any) { alert(err.message); }
  };

  const viewDetails = async (p: Payroll) => {
    try {
      const res = await api.get<{ data: { payroll: Payroll; items: any[] } }>(`/v1/hrm/payroll/${p.id}`);
      setSelectedPayroll(res.data.payroll);
      setPayrollItems(res.data.items || []);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 font-semibold">{payrolls.length} payroll runs</span>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
            <Wallet className="w-4 h-4" /> Generate Payroll
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {payrolls.map((p) => (
          <div key={p.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-white">{p.payrollNo}</p>
                <p className="text-[10px] text-slate-500">Month {p.month}/{p.year}</p>
              </div>
              <Badge status={p.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div><span className="text-slate-500">Employees:</span> <span className="text-white font-bold">{p.totalEmployees}</span></div>
              <div><span className="text-slate-500">Net Pay:</span> <span className="text-emerald-400 font-bold">{currency(p.totalNetPay)}</span></div>
              <div><span className="text-slate-500">Basic:</span> <span className="text-slate-300">{currency(p.totalBasic)}</span></div>
              <div><span className="text-slate-500">Deductions:</span> <span className="text-rose-400">{currency(p.totalDeductions)}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => viewDetails(p)} className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                <Eye className="w-3 h-3 inline mr-1" /> Details
              </button>
              {p.status === "DRAFT" && (
                <button onClick={() => handleApprove(p.id)} className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" /> Approve
                </button>
              )}
              {p.status === "APPROVED" && (
                <button onClick={() => handlePay(p.id)} className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
                  <Wallet className="w-3 h-3 inline mr-1" /> Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payroll Details Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{selectedPayroll.payrollNo} — {selectedPayroll.month}/{selectedPayroll.year}</h3>
              <button onClick={() => setSelectedPayroll(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-right p-2">Basic</th>
                  <th className="text-right p-2">OT Pay</th>
                  <th className="text-right p-2">Leave Ded.</th>
                  <th className="text-right p-2">Net Pay</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollItems.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-800/50">
                    <td className="p-2 text-white">{item.employeeName} <span className="text-[10px] text-slate-500">({item.employeeNo})</span></td>
                    <td className="p-2 text-right text-slate-300">{currency(item.basicSalary)}</td>
                    <td className="p-2 text-right text-emerald-400">{currency(item.overtimePay)}</td>
                    <td className="p-2 text-right text-rose-400">{currency(item.leaveDeduction)}</td>
                    <td className="p-2 text-right text-white font-bold">{currency(item.netPay)}</td>
                    <td className="p-2 text-center"><Badge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ SHIFTS ═════════════════════════
function ShiftsTab() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resShifts, resEmp] = await Promise.all([
        api.get<{ data: Shift[] }>("/v1/hrm/shifts"),
        api.get<{ data: Employee[] }>("/v1/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setShifts(resShifts.data || []);
      setEmployees(resEmp.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      await api.post("/v1/hrm/shifts", {
        name: fd.get("name"),
        startTime: fd.get("startTime"),
        endTime: fd.get("endTime"),
        breakMinutes: Number(fd.get("breakMinutes") || 0),
      });
      setShowCreateModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 font-semibold">{shifts.length} shifts defined</span>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
            <Plus className="w-4 h-4" /> New Shift
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((s) => (
          <div key={s.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" /> {s.name}
            </h4>
            <div className="mt-3 space-y-1 text-xs">
              <p className="text-slate-300"><span className="text-slate-500">Start:</span> {s.startTime}</p>
              <p className="text-slate-300"><span className="text-slate-500">End:</span> {s.endTime}</p>
              <p className="text-slate-300"><span className="text-slate-500">Break:</span> {s.breakMinutes} min</p>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateShift} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create New Shift</h3>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Shift Name</label>
              <input name="name" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" placeholder="e.g. Morning Shift" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Start Time</label>
                <input name="startTime" type="time" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">End Time</label>
                <input name="endTime" type="time" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Break (minutes)</label>
              <input name="breakMinutes" type="number" min="0" defaultValue="60" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-lg hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ DEPARTMENTS ═════════════════════════
function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDesigModal, setShowDesigModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resDept, resDesig] = await Promise.all([
        api.get<{ data: Department[] }>("/v1/hrm/departments"),
        api.get<{ data: Designation[] }>("/v1/hrm/designations"),
      ]);
      setDepartments(resDept.data || []);
      setDesignations(resDesig.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      await api.post("/v1/hrm/departments", {
        name: fd.get("name"),
        code: fd.get("code"),
        description: fd.get("description"),
      });
      setShowDeptModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      await api.post("/v1/hrm/designations", {
        name: fd.get("name"),
        departmentId: fd.get("departmentId") || undefined,
        level: Number(fd.get("level") || 0),
        minSalary: Number(fd.get("minSalary") || 0),
        maxSalary: Number(fd.get("maxSalary") || 0),
      });
      setShowDesigModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    try { await api.del(`/v1/hrm/departments/${id}`); load(); } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      {/* Departments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" /> Departments ({departments.length})
          </h3>
          <button onClick={() => setShowDeptModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
            <Plus className="w-3 h-3" /> Add Department
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{d.name}</p>
                  {d.code && <p className="text-[10px] text-slate-500">{d.code}</p>}
                  {d.description && <p className="text-[11px] text-slate-400 mt-1">{d.description}</p>}
                </div>
                <button onClick={() => handleDeleteDept(d.id)} className="p-1 text-rose-400 hover:text-rose-300 rounded"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Designations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-cyan-400" /> Designations ({designations.length})
          </h3>
          <button onClick={() => setShowDesigModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
            <Plus className="w-3 h-3" /> Add Designation
          </button>
        </div>
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Level</th>
                <th className="text-right p-3 font-semibold">Min Salary</th>
                <th className="text-right p-3 font-semibold">Max Salary</th>
              </tr>
            </thead>
            <tbody>
              {designations.map((d) => (
                <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-3 text-white font-medium">{d.name}</td>
                  <td className="p-3 text-slate-300">Level {d.level}</td>
                  <td className="p-3 text-right text-slate-300">{d.minSalary ? currency(d.minSalary) : "—"}</td>
                  <td className="p-3 text-right text-slate-300">{d.maxSalary ? currency(d.maxSalary) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateDept} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">New Department</h3>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Name *</label>
              <input name="name" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Code</label>
              <input name="code" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" placeholder="e.g. SALES" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-lg hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Designation Modal */}
      {showDesigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateDesig} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">New Designation</h3>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Name *</label>
              <input name="name" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Department</label>
              <select name="departmentId" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                <option value="">— None —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Level</label>
                <input name="level" type="number" min="0" defaultValue="0" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Min Salary</label>
                <input name="minSalary" type="number" min="0" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Max Salary</label>
                <input name="maxSalary" type="number" min="0" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowDesigModal(false)} className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-lg hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ SALES TARGETS (Prompt 25 / §10.35-ready) ═════════════════════════
interface SalesTarget {
  id: string;
  scopeType: string;
  scopeId: string;
  scopeName: string;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  targetAmount: number;
  achieved: number;
  pct: number;
  metric: string;
  targetNote?: string;
  isActive: number;
}

function SalesTargetsTab() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resT, resE, resB] = await Promise.all([
        api.get<{ data: SalesTarget[] }>("/v1/hrm/targets"),
        api.get<{ data: Employee[] }>("/v1/hrm/employees?status=ACTIVE&limit=100"),
        api.get<{ data: any[] }>("/v1/branches"),
      ]);
      setTargets(resT.data || []);
      setEmployees(resE.data || []);
      setBranches(resB.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const scopeType = String(fd.get("scopeType") || "EMPLOYEE");
    const scopeId = String(fd.get("scopeId") || "");
    if (!scopeId) { alert("Choose the employee / branch the target is for"); return; }
    try {
      await api.post("/v1/hrm/targets", {
        scopeType, scopeId,
        periodStart: fd.get("periodStart") || undefined,
        periodEnd: fd.get("periodEnd") || undefined,
        periodType: String(fd.get("periodType") || "MONTHLY").toUpperCase(),
        targetAmount: Number(fd.get("targetAmount") || 0),
        metric: String(fd.get("metric") || "SALES_AMOUNT").toUpperCase(),
        targetNote: fd.get("targetNote") || undefined,
      });
      setShowModal(false);
      load();
      setMsg("Sales target created");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) { alert("Failed: " + err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this target?")) return;
    try { await api.del(`/v1/hrm/targets/${id}`); load(); } catch (err: any) { alert("Failed: " + err.message); }
  };

  return (
    <div className="space-y-4">
      {msg && <div className="px-4 py-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">{msg}</div>}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" /> {targets.length} targets — achieved computed live from confirmed sales
        </span>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
            <Plus className="w-4 h-4" /> New Target
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {targets.map((t) => (
          <div key={t.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-bold text-white">{t.scopeName || "—"}</p>
                <p className="text-[10px] text-slate-500">{t.scopeType} · {t.periodType} · {t.periodStart} → {t.periodEnd}</p>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${t.pct >= 100 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : t.pct >= 50 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-slate-600/20 text-slate-300 border-slate-500/30"}`}>{t.pct}%</span>
            </div>
            <div className="mt-2 mb-1 flex items-end justify-between">
              <span className="text-xl font-bold text-emerald-400">{currency(t.achieved)}</span>
              <span className="text-[11px] text-slate-400">of {currency(t.targetAmount)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className={`h-full ${t.pct >= 100 ? "bg-emerald-500" : t.pct >= 50 ? "bg-amber-400" : "bg-cyan-500"}`} style={{ width: `${Math.min(t.pct, 100)}%` }} />
            </div>
            {t.targetNote && <p className="text-[10px] text-slate-500 mt-2">{t.targetNote}</p>}
            <div className="flex justify-end mt-2">
              <button onClick={() => handleDelete(t.id)} className="p-1 text-rose-400 hover:text-rose-300 rounded" title="Deactivate"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        {targets.length === 0 && !loading && (
          <div className="col-span-full p-10 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700 text-xs">
            No targets yet — create a monthly sales target for an employee, agent or branch
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400" /> New Sales Target</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Scope</label>
                <select name="scopeType" defaultValue="EMPLOYEE" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="EMPLOYEE">Employee</option>
                  <option value="AGENT">Agent (login user)</option>
                  <option value="BRANCH">Branch</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Scope target</label>
                <select name="scopeId" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="">Select…</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Period type</label>
                <select name="periodType" defaultValue="MONTHLY" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">From</label>
                <input name="periodStart" type="date" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">To</label>
                <input name="periodEnd" type="date" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Target amount (৳) *</label>
                <input name="targetAmount" type="number" min="1" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Metric</label>
                <select name="metric" defaultValue="SALES_AMOUNT" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="SALES_AMOUNT">Sales amount</option>
                  <option value="UNITS">Units</option>
                  <option value="COLLECTION">Collections</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Note</label>
              <input name="targetNote" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" placeholder="optional" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-lg hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">Create Target</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ PERFORMANCE REVIEWS (Prompt 25) ═════════════════════════
interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  reviewDate: string;
  rating: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
  status: string;
  notes?: string;
}

function PerformanceTab() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resP, resE] = await Promise.all([
        api.get<{ data: PerformanceReview[] }>("/v1/hrm/performance"),
        api.get<{ data: Employee[] }>("/v1/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setReviews(resP.data || []);
      setEmployees(resE.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await api.post("/v1/hrm/performance", {
        employeeId: fd.get("employeeId"),
        reviewDate: fd.get("reviewDate") || new Date().toISOString().slice(0, 10),
        rating: Number(fd.get("rating") || 0),
        strengths: fd.get("strengths") || undefined,
        improvements: fd.get("improvements") || undefined,
        goals: fd.get("goals") || undefined,
        status: String(fd.get("status") || "DRAFT").toUpperCase(),
      });
      setShowModal(false);
      load();
    } catch (err: any) { alert("Failed: " + err.message); }
  };

  const setStatus = async (id: string, status: string) => {
    try { await api.patch(`/v1/hrm/performance/${id}`, { status }); load(); } catch (err: any) { alert("Failed: " + err.message); }
  };

  const stars = (r: number) => (
    <span className="text-amber-400 tracking-tight">
      {"★".repeat(Math.round(r || 0))}<span className="text-slate-700">{"★".repeat(5 - Math.round(r || 0))}</span>
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-2">
          <Star className="w-4 h-4 text-cyan-400" /> {reviews.length} performance reviews
        </span>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
            <Plus className="w-4 h-4" /> New Review
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="text-left p-3 font-semibold">Employee</th>
              <th className="text-left p-3 font-semibold">Review date</th>
              <th className="text-center p-3 font-semibold">Rating</th>
              <th className="text-left p-3 font-semibold">Highlights</th>
              <th className="text-center p-3 font-semibold">Status</th>
              <th className="text-right p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((p) => (
              <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="p-3">
                  <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-left">
                    <p className="text-white font-medium hover:text-cyan-300">{p.employeeName}</p>
                    <p className="text-[10px] text-slate-500">{p.employeeNo}</p>
                  </button>
                </td>
                <td className="p-3 text-slate-300">{p.reviewDate}</td>
                <td className="p-3 text-center">{stars(p.rating)} <span className="text-slate-400 text-[10px] ml-1">{p.rating}/5</span></td>
                <td className="p-3 text-slate-400 max-w-[220px] truncate">{p.strengths || "—"}</td>
                <td className="p-3 text-center"><Badge status={p.status} /></td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {p.status !== "APPROVED" && (
                      <button onClick={() => setStatus(p.id, "APPROVED")} className="px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500">Approve</button>
                    )}
                    {p.status === "DRAFT" && (
                      <button onClick={() => setStatus(p.id, "SUBMITTED")} className="px-2 py-1 text-[10px] font-bold bg-slate-700 text-slate-200 rounded hover:bg-slate-600">Submit</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && !loading && (
              <tr><td colSpan={6} className="p-10 text-center text-slate-500">No performance reviews yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {expanded && (() => {
        const p = reviews.find((x) => x.id === expanded);
        if (!p) return null;
        return (
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700">
            <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-cyan-400" /> {p.employeeName} — {p.reviewDate}
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p className="text-emerald-400 font-bold text-[10px] uppercase mb-1">Strengths</p>
                <p className="text-slate-300 whitespace-pre-wrap">{p.strengths || "—"}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p className="text-amber-400 font-bold text-[10px] uppercase mb-1">Improvements</p>
                <p className="text-slate-300 whitespace-pre-wrap">{p.improvements || "—"}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p className="text-cyan-400 font-bold text-[10px] uppercase mb-1">Goals</p>
                <p className="text-slate-300 whitespace-pre-wrap">{p.goals || "—"}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Star className="w-5 h-5 text-cyan-400" /> New Performance Review</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Employee *</label>
                <select name="employeeId" required className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="">Select…</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Review date</label>
                <input name="reviewDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Rating (1-5) *</label>
                <select name="rating" required defaultValue="4" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} — {"★".repeat(n)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Status</label>
                <select name="status" defaultValue="DRAFT" className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2">
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Strengths</label>
              <textarea name="strengths" rows={2} className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" placeholder="What the employee does well" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Areas to improve</label>
              <textarea name="improvements" rows={2} className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">Goals for next period</label>
              <textarea name="goals" rows={2} className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2" />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs text-slate-400 bg-slate-800 rounded-lg hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500">Save Review</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ EMPLOYEE COMMISSIONS (Prompt 25 / Prompt 13 reuse) ═════════════════════════
interface CommissionRow {
  id: string;
  saleNo?: string;
  saleDate?: string;
  commissionType: string;
  basisAmount: number;
  rate: number;
  amount: number;
  status: string;
  note?: string;
}

function EmployeeCommissionsTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState("");
  const [payload, setPayload] = useState<{ stats: Record<string, number>; commissions: CommissionRow[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [calcMsg, setCalcMsg] = useState("");
  const [startDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [endDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get<{ data: Employee[] }>("/v1/hrm/employees?status=ACTIVE&limit=200");
      setEmployees(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const load = useCallback(async (empId: string) => {
    setLoading(true);
    setPayload(null);
    try {
      const res = await api.get<{ data: any }>(`/v1/hrm/employees/${empId}/commissions`);
      setPayload(res.data);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (selected) load(selected); }, [selected, load]);

  const runCalc = async () => {
    if (!selected) return;
    if (!confirm("Run Prompt 13's commission engine over confirmed sales for this period?")) return;
    setCalcMsg("");
    try {
      const res = await api.post<{ data: any }>(`/v1/hrm/employees/${selected}/commissions/calculate`, { startDate, endDate });
      setCalcMsg(`Engine scanned ${res.data.salesScanned} sales with ${res.data.rulesUsed} rule(s) → ${res.data.commissionsCreated} commission(s) worth ${currency(res.data.totalAmount)}`);
      load(selected);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <CircleDollarSign className="w-4 h-4 text-cyan-400" />
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 min-w-[220px]"
          >
            <option value="">Select employee…</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>)}
          </select>
          <span className="text-[10px] text-slate-500">Period: {startDate} → {endDate}</span>
        </div>
        <button onClick={runCalc} disabled={!selected || loading} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg">
          <TrendingUp className="w-4 h-4" /> Run Commission Engine
        </button>
      </div>

      {calcMsg && <div className="px-4 py-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">{calcMsg}</div>}

      {!selected && (
        <div className="p-10 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700 text-xs">
          Pick an employee to see their commissions (earned via Prompt 13's engine — rules are managed in the Commission module) and run a re-calculation.
        </div>
      )}

      {selected && payload && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Total earned", currency(payload.stats.totalEarned || 0), "text-emerald-400"],
              ["Approved", currency(payload.stats.totalApproved || 0), "text-sky-400"],
              ["Paid out", currency(payload.stats.totalPaid || 0), "text-cyan-400"],
              ["Awaiting approval", String(payload.stats.pendingCount || 0), "text-amber-400"],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-semibold">{label}</p>
                <p className={`text-lg font-bold ${cls}`}>{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="text-left p-3 font-semibold">Sale</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-center p-3 font-semibold">Type</th>
                  <th className="text-right p-3 font-semibold">Basis</th>
                  <th className="text-right p-3 font-semibold">Rate</th>
                  <th className="text-right p-3 font-semibold">Amount</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payload.commissions.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-3 text-white font-medium">{c.saleNo || "—"}</td>
                    <td className="p-3 text-slate-400">{c.saleDate ? String(c.saleDate).slice(0, 10) : "—"}</td>
                    <td className="p-3 text-center text-slate-300">{c.commissionType}</td>
                    <td className="p-3 text-right text-slate-300">{currency(c.basisAmount)}</td>
                    <td className="p-3 text-right text-slate-300">{c.commissionType === "PERCENTAGE" ? `${c.rate}%` : c.commissionType === "FIXED" ? "fixed" : "—"}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">{currency(c.amount)}</td>
                    <td className="p-3 text-center"><Badge status={c.status} /></td>
                  </tr>
                ))}
                {payload.commissions.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No commission rows yet — run the engine above (rules from the Commission module apply).</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
