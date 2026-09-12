"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Zap,
  Phone,
  Mail,
  UserCheck,
  Check,
  Printer,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  ConfirmModal,
} from "@/components/custom";
import { money } from "@/lib/format";

type TabType =
  | "employees"
  | "attendance"
  | "leave"
  | "payroll"
  | "shifts"
  | "departments"
  | "targets"
  | "performance"
  | "commissions";

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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  INACTIVE: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  TERMINATED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  ON_LEAVE: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  PRESENT: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  ABSENT: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  HALF_DAY: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  LATE: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  DRAFT: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  PROCESSED: { bg: "bg-primary-50", text: "text-primary-700", border: "border-primary-200" },
  PAID: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function HRMPage() {
  const [activeTab, setActiveTab] = useState<TabType>("employees");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Global KPIs summary state
  const [summaryStats, setSummaryStats] = useState({
    activeEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSummary = useCallback(async () => {
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        api.get<{ data: Employee[] }>("/hrm/employees?status=ACTIVE&limit=100").catch(() => ({ data: [] })),
        api.get<{ data: Attendance[] }>(`/hrm/attendance?date=${new Date().toISOString().slice(0, 10)}`).catch(() => ({ data: [] })),
        api.get<{ data: LeaveRequest[] }>("/hrm/leaves?status=PENDING").catch(() => ({ data: [] })),
      ]);

      const activeEmp = empRes.data?.length || 0;
      const presentCount = (attRes.data || []).filter((a) => a.status === "PRESENT" || a.clockIn).length;
      const pendingCount = (leaveRes.data || []).filter((l) => l.status === "PENDING").length;

      setSummaryStats({
        activeEmployees: activeEmp,
        presentToday: presentCount,
        pendingLeaves: pendingCount,
        monthlyPayroll: empRes.data?.reduce((sum, e) => sum + (e.basicSalary || 0), 0) || 0,
      });
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border border-slate-700"
              : "bg-red-600 text-white border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-white" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Reusable Application Breadcrumb Header */}
      <CustomBreadcrumb
        title="Human Resource Management (HRM)"
        icon={<Users size={20} />}
        items={[{ label: "HRM", href: "/hrm" }, { label: "Overview" }]}
        description="Employee staff directory, punch clock attendance, leave approvals, shifts, and payroll ledger."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSummary()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh HRM Data"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        }
      />

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomStatCard
          label="Active Employees"
          value={String(summaryStats.activeEmployees)}
          icon={Users}
          tone="primary"
        />
        <CustomStatCard
          label="Today's Attendance"
          value={`${summaryStats.presentToday} Clocked In`}
          icon={Clock}
          tone="green"
        />
        <CustomStatCard
          label="Pending Leave Requests"
          value={String(summaryStats.pendingLeaves)}
          icon={Calendar}
          tone={summaryStats.pendingLeaves > 0 ? "amber" : "primary"}
        />
        <CustomStatCard
          label="Est. Monthly Payroll"
          value={money(summaryStats.monthlyPayroll)}
          icon={Wallet}
          tone="primary"
        />
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-md border border-slate-200 shadow-2xs overflow-x-auto">
        {[
          { id: "employees", label: "Employees", icon: Users },
          { id: "attendance", label: "Attendance & Punch", icon: Clock },
          { id: "leave", label: "Leave Requests", icon: Calendar },
          { id: "payroll", label: "Payroll Ledger", icon: Wallet },
          { id: "shifts", label: "Shifts & Schedule", icon: Briefcase },
          { id: "departments", label: "Departments", icon: Building2 },
          { id: "targets", label: "Sales Targets", icon: Target },
          { id: "performance", label: "Performance", icon: Star },
          { id: "commissions", label: "Staff Commissions", icon: CircleDollarSign },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-teal-50 text-teal-700 border border-teal-200 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Icon size={14} className={isActive ? "text-teal-600" : "text-slate-400"} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "employees" && <EmployeesTab onNotify={showToast} />}
      {activeTab === "attendance" && <AttendanceTab onNotify={showToast} />}
      {activeTab === "leave" && <LeaveTab onNotify={showToast} />}
      {activeTab === "payroll" && <PayrollTab onNotify={showToast} />}
      {activeTab === "shifts" && <ShiftsTab onNotify={showToast} />}
      {activeTab === "departments" && <DepartmentsTab onNotify={showToast} />}
      {activeTab === "targets" && <SalesTargetsTab onNotify={showToast} />}
      {activeTab === "performance" && <PerformanceTab onNotify={showToast} />}
      {activeTab === "commissions" && <EmployeeCommissionsTab onNotify={showToast} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 1. EMPLOYEES DIRECTORY
// ────────────────────────────────────────────────────────────

function EmployeesTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resEmp, resDept, resDesig] = await Promise.all([
        api.get<{ data: Employee[] }>("/hrm/employees?limit=100"),
        api.get<{ data: Department[] }>("/hrm/departments"),
        api.get<{ data: Designation[] }>("/hrm/designations"),
      ]);
      setEmployees(resEmp.data || []);
      setDepartments(resDept.data || []);
      setDesignations(resDesig.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load employee directory", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const name = `${emp.firstName} ${emp.lastName || ""}`.toLowerCase();
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        emp.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
        (emp.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (emp.phone || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
      const matchesDept = deptFilter === "ALL" || emp.department?.id === deptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employees, search, statusFilter, deptFilter]);

  const confirmTerminate = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.del(`/hrm/employees/${deleteConfirm.id}`);
      onNotify(`Employee "${deleteConfirm.name}" terminated successfully`);
      setDeleteConfirm(null);
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to terminate employee", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <button
            onClick={() => { setEditingEmp(null); setShowAddModal(true); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700 active:scale-95 transition"
          >
            <UserPlus size={14} /> Add Employee
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CustomTable
          columns={[
            {
              key: "name",
              header: "Employee Name & ID",
              render: (emp: Employee) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 font-bold text-xs text-primary-700 border border-primary-100 uppercase shrink-0">
                    {emp.firstName.charAt(0)}{emp.lastName ? emp.lastName.charAt(0) : ""}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{emp.firstName} {emp.lastName || ""}</p>
                    <p className="font-mono text-xs text-slate-400">{emp.employeeNo}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "contact",
              header: "Contact Info",
              render: (emp: Employee) => (
                <div className="text-xs text-slate-600 space-y-0.5">
                  {emp.phone && <p className="flex items-center gap-1"><Phone size={11} className="text-slate-400" /> {emp.phone}</p>}
                  {emp.email && <p className="flex items-center gap-1 text-slate-500"><Mail size={11} className="text-slate-400" /> {emp.email}</p>}
                </div>
              ),
            },
            {
              key: "dept",
              header: "Department & Role",
              render: (emp: Employee) => (
                <div>
                  <span className="font-semibold text-slate-800 text-xs block">{emp.department?.name || "General"}</span>
                  <span className="text-[11px] text-slate-500">{emp.designation?.name || "Staff"}</span>
                </div>
              ),
            },
            {
              key: "salary",
              header: "Base Salary",
              align: "right",
              render: (emp: Employee) => (
                <span className="font-bold text-sm text-slate-900 tabular-nums">
                  {money(emp.basicSalary)}
                </span>
              ),
            },
            {
              key: "type",
              header: "Employment Type",
              render: (emp: Employee) => (
                <span className="text-xs text-slate-600 capitalize bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                  {(emp.employmentType || "FULL_TIME").replace(/_/g, " ").toLowerCase()}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (emp: Employee) => <StatusBadge status={emp.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (emp: Employee) => (
                <div className="flex items-center justify-end gap-1">
                  {emp.status !== "TERMINATED" && (
                    <button
                      onClick={() => setDeleteConfirm({ id: emp.id, name: `${emp.firstName} ${emp.lastName || ""}` })}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Terminate Employee"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filtered}
          rowKey={(emp: Employee) => emp.id}
          loading={loading}
          emptyIcon={Users}
          emptyMessage="No employees found matching criteria."
        />
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <EmployeeFormModal
          employee={editingEmp}
          departments={departments}
          designations={designations}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            onNotify("Employee profile created successfully");
            load();
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmTerminate}
        title="Terminate Employee"
        message={`Are you sure you want to terminate "${deleteConfirm?.name}"? Their account and access will be deactivated.`}
        type="DANGER"
        confirmText="Terminate Now"
        loading={deleting}
      />
    </div>
  );
}

function EmployeeFormModal({
  employee,
  departments,
  designations,
  onClose,
  onSaved,
}: {
  employee: Employee | null;
  departments: Department[];
  designations: Designation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    gender: employee?.gender || "MALE",
    joinDate: employee?.joinDate || new Date().toISOString().split("T")[0],
    departmentId: employee?.department?.id || "",
    designationId: employee?.designation?.id || "",
    employmentType: employee?.employmentType || "FULL_TIME",
    basicSalary: employee?.basicSalary?.toString() || "25000",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim()) {
      setError("First name and phone number are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/hrm/employees", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        gender: form.gender,
        joinDate: form.joinDate,
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        employmentType: form.employmentType,
        basicSalary: parseFloat(form.basicSalary) || 0,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {employee ? "Edit Employee" : "Add New Employee"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal credentials, department role, and salary setup.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Rahim"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="Uddin"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="01712345678"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-primary-500 focus:outline-none"
                placeholder="employee@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Joining Date
              </label>
              <input
                type="date"
                value={form.joinDate}
                onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contract Type
              </label>
              <select
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none font-medium"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="">— Select Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation / Position
              </label>
              <select
                value={form.designationId}
                onChange={(e) => setForm({ ...form, designationId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="">— Select Designation —</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Monthly Base Salary (৳)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.basicSalary}
              onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold focus:border-primary-500 focus:outline-none tabular-nums"
              placeholder="25000"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700 active:scale-95 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 2. ATTENDANCE & LIVE PUNCH CLOCK
// ────────────────────────────────────────────────────────────

function AttendanceTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const empParam = selectedEmp ? `&employeeId=${selectedEmp}` : "";
      const [resAtt, resEmp] = await Promise.all([
        api.get<{ data: Attendance[] }>(`/hrm/attendance?date=${selectedDate}${empParam}`),
        api.get<{ data: Employee[] }>("/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setRecords(resAtt.data || []);
      setEmployees(resEmp.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load attendance records", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedEmp, onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClockIn = async (empId: string) => {
    try {
      await api.post("/hrm/attendance/clock-in", { employeeId: empId });
      onNotify("Clock-In recorded successfully");
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to Clock In", "error");
    }
  };

  const handleClockOut = async (empId: string) => {
    try {
      await api.post("/hrm/attendance/clock-out", { employeeId: empId });
      onNotify("Clock-Out recorded successfully");
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to Clock Out", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Punch Action Grid for Today */}
      <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Today&apos;s Live Punch Clock ({new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{employees.length} active staff</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {employees.slice(0, 8).map((emp) => {
            const att = records.find((r) => r.employeeId === emp.id);
            const isClockedIn = att && att.clockIn && !att.clockOut;

            return (
              <div
                key={emp.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex flex-col justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900 text-xs truncate">{emp.firstName} {emp.lastName || ""}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{emp.employeeNo}</p>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {!att?.clockIn ? (
                    <button
                      onClick={() => handleClockIn(emp.id)}
                      className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      Clock IN
                    </button>
                  ) : isClockedIn ? (
                    <button
                      onClick={() => handleClockOut(emp.id)}
                      className="flex-1 rounded-xl bg-primary-600 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition"
                    >
                      Clock OUT
                    </button>
                  ) : (
                    <span className="flex-1 text-center py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                      Completed ({att?.totalHours}h)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & History Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-bold text-slate-900 text-sm">Attendance Logs</h4>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:outline-none"
            />
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:outline-none"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>
              ))}
            </select>
          </div>
        </div>

        <CustomTable
          columns={[
            {
              key: "employee",
              header: "Employee",
              render: (r: Attendance) => (
                <div>
                  <p className="font-bold text-slate-800 text-xs">{r.employeeName}</p>
                  <p className="font-mono text-[11px] text-slate-400">{r.employeeNo}</p>
                </div>
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (r: Attendance) => <span className="text-xs text-slate-600">{r.attendanceDate}</span>,
            },
            {
              key: "clockIn",
              header: "Clock In",
              render: (r: Attendance) => (
                <span className="text-xs font-semibold text-emerald-700 font-mono">
                  {r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
              ),
            },
            {
              key: "clockOut",
              header: "Clock Out",
              render: (r: Attendance) => (
                <span className="text-xs font-semibold text-primary-700 font-mono">
                  {r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
              ),
            },
            {
              key: "hours",
              header: "Duration",
              align: "right",
              render: (r: Attendance) => (
                <span className="font-bold text-slate-800 text-xs tabular-nums">
                  {r.totalHours ? `${r.totalHours} hrs` : "—"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r: Attendance) => <StatusBadge status={r.status || "PRESENT"} />,
            },
          ]}
          data={records}
          rowKey={(r: Attendance) => r.id}
          loading={loading}
          emptyIcon={Clock}
          emptyMessage="No attendance records found for this date."
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 3. LEAVE REQUESTS & APPROVALS
// ────────────────────────────────────────────────────────────

function LeaveTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resLeave, resTypes, resEmp] = await Promise.all([
        api.get<{ data: LeaveRequest[] }>("/hrm/leaves?limit=50"),
        api.get<{ data: any[] }>("/hrm/leave-types"),
        api.get<{ data: Employee[] }>("/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setLeaves(resLeave.data || []);
      setLeaveTypes(resTypes.data || []);
      setEmployees(resEmp.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load leave records", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/hrm/leaves/${id}/approve`);
      onNotify("Leave request approved");
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to approve leave", "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/hrm/leaves/${id}/reject`, { reason: "Rejected by Management" });
      onNotify("Leave request rejected");
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to reject leave", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Staff Leave Requests</h3>
          <p className="text-xs text-slate-500">Review pending leave applications and approve time off.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700"
        >
          <Plus size={14} /> New Leave Request
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CustomTable
          columns={[
            {
              key: "employee",
              header: "Employee",
              render: (r: LeaveRequest) => (
                <div>
                  <p className="font-bold text-slate-800 text-xs">{r.employeeName}</p>
                  <p className="font-mono text-[11px] text-slate-400">{r.employeeNo}</p>
                </div>
              ),
            },
            {
              key: "type",
              header: "Leave Type",
              render: (r: LeaveRequest) => (
                <span className="font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-xs border border-primary-200/60">
                  {r.leaveTypeName}
                </span>
              ),
            },
            {
              key: "dates",
              header: "Duration Period",
              render: (r: LeaveRequest) => (
                <div className="text-xs text-slate-600">
                  <span>{r.startDate}</span> <span className="text-slate-400">→</span> <span>{r.endDate}</span>
                  <span className="ml-1.5 font-bold text-slate-900">({r.totalDays} days)</span>
                </div>
              ),
            },
            {
              key: "reason",
              header: "Reason",
              render: (r: LeaveRequest) => (
                <p className="text-xs text-slate-500 max-w-xs line-clamp-1">{r.reason || "—"}</p>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r: LeaveRequest) => <StatusBadge status={r.status} />,
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (r: LeaveRequest) => (
                r.status === "PENDING" ? (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                ) : null
              ),
            },
          ]}
          data={leaves}
          rowKey={(r: LeaveRequest) => r.id}
          loading={loading}
          emptyIcon={Calendar}
          emptyMessage="No leave requests filed."
        />
      </div>

      {showModal && (
        <LeaveRequestModal
          employees={employees}
          leaveTypes={leaveTypes}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onNotify("Leave application submitted");
            load();
          }}
        />
      )}
    </div>
  );
}

function LeaveRequestModal({
  employees,
  leaveTypes,
  onClose,
  onSaved,
}: {
  employees: Employee[];
  leaveTypes: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || "",
    leaveTypeId: leaveTypes[0]?.id || "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.leaveTypeId) {
      setError("Please select employee and leave type.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      await api.post("/hrm/leaves", form);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to submit leave request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-1">Apply for Leave</h3>
        <p className="text-xs text-slate-500 mb-4">Submit staff time-off for administrative review.</p>

        {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employee *</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Leave Type *</label>
            <select
              value={form.leaveTypeId}
              onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name} ({lt.daysPerYear || 14} days/yr)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason</label>
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              placeholder="e.g. Family medical emergency"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 4. PAYROLL LEDGER & SLIPS
// ────────────────────────────────────────────────────────────

function PayrollTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [payrollItems, setPayrollItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Payroll[] }>("/hrm/payroll");
      setPayrolls(res.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load payroll ledger", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    try {
      const res = await api.post<{ data: Payroll }>("/hrm/payroll", { month, year });
      onNotify(`Payroll ${res.data.payrollNo} created for ${res.data.totalEmployees} employees`);
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to generate payroll", "error");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/hrm/payroll/${id}/approve`);
      onNotify("Payroll approved");
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to approve payroll", "error");
    }
  };

  const handlePay = async (id: string) => {
    try {
      await api.post(`/hrm/payroll/${id}/pay`);
      onNotify("Payroll marked as PAID. Accounting journal posted.");
      load();
    } catch (err: any) {
      onNotify(err.message || "Failed to mark payroll as paid", "error");
    }
  };

  const viewDetails = async (p: Payroll) => {
    try {
      const res = await api.get<{ data: { payroll: Payroll; items: any[] } }>(`/hrm/payroll/${p.id}`);
      setSelectedPayroll(res.data.payroll);
      setPayrollItems(res.data.items || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load pay slip details", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Monthly Payroll Ledger</h3>
          <p className="text-xs text-slate-500">Calculate salary footings, deductions, and post double-entry payroll journals.</p>
        </div>

        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700 active:scale-95 transition"
        >
          <Wallet size={14} /> Run Payroll for This Month
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {payrolls.map((p) => (
          <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-900 text-base">{p.payrollNo}</p>
                <p className="text-xs text-slate-400 font-semibold">Month {p.month} / {p.year}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-500 block">Staff Count:</span>
                <span className="font-bold text-slate-800 text-sm">{p.totalEmployees} employees</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Net Pay:</span>
                <span className="font-bold text-emerald-700 text-sm">{money(p.totalNetPay)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">Basic Salaries:</span>
                <span className="font-semibold text-slate-700">{money(p.totalBasic)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">Total Deductions:</span>
                <span className="font-semibold text-rose-600">-{money(p.totalDeductions)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => viewDetails(p)}
                className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                <Eye size={13} className="inline mr-1" /> View Pay Slips
              </button>
              {p.status === "DRAFT" && (
                <button
                  onClick={() => handleApprove(p.id)}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Approve Payroll
                </button>
              )}
              {p.status === "APPROVED" && (
                <button
                  onClick={() => handlePay(p.id)}
                  className="flex-1 rounded-xl bg-primary-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-700 transition"
                >
                  Mark Paid & Post Journal
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Pay Slips Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelectedPayroll(null)}>
          <div className="w-full max-w-3xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedPayroll.payrollNo} Pay Slips</h3>
                <p className="text-xs text-slate-500">Period: {selectedPayroll.month}/{selectedPayroll.year}</p>
              </div>
              <button onClick={() => setSelectedPayroll(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <XCircle size={20} />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold">
                    <th className="p-3 text-left">Employee</th>
                    <th className="p-3 text-right">Base Salary</th>
                    <th className="p-3 text-right">Overtime</th>
                    <th className="p-3 text-right">Deductions</th>
                    <th className="p-3 text-right">Net Payable</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{item.employeeName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{item.employeeNo}</p>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">{money(item.basicSalary)}</td>
                      <td className="p-3 text-right text-emerald-700">+{money(item.overtimePay || 0)}</td>
                      <td className="p-3 text-right text-rose-600">-{money(item.leaveDeduction || 0)}</td>
                      <td className="p-3 text-right font-bold text-slate-900 text-sm">{money(item.netPay)}</td>
                      <td className="p-3 text-center"><StatusBadge status={item.status || "DRAFT"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 5. SHIFTS & ROSTER
// ────────────────────────────────────────────────────────────

function ShiftsTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Shift[] }>("/hrm/shifts");
      setShifts(res.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load shifts", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Shift Templates & Schedules</h3>
          <p className="text-xs text-slate-500">Configure operating store shift windows and meal breaks.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700"
        >
          <Plus size={14} /> Create Shift
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((s) => (
          <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100">
                <Briefcase size={20} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
            </div>
            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
              <p className="flex justify-between"><span>Start Time:</span> <span className="font-bold text-slate-800">{s.startTime}</span></p>
              <p className="flex justify-between"><span>End Time:</span> <span className="font-bold text-slate-800">{s.endTime}</span></p>
              <p className="flex justify-between"><span>Break Window:</span> <span className="font-semibold text-slate-700">{s.breakMinutes} mins</span></p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CreateShiftModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onNotify("Shift created successfully");
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateShiftModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", startTime: "09:00", endTime: "18:00", breakMinutes: "60" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/hrm/shifts", {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: parseInt(form.breakMinutes) || 0,
      });
      onSaved();
    } catch {
      /* non-fatal */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Create Operating Shift</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shift Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border p-2.5 text-sm"
              placeholder="e.g. Morning Shift"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-xl border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-xl border p-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Break Duration (mins)</label>
            <input
              type="number"
              value={form.breakMinutes}
              onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })}
              className="w-full rounded-xl border p-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700">Create Shift</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 6. DEPARTMENTS & DESIGNATIONS
// ────────────────────────────────────────────────────────────

function DepartmentsTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resDept, resDesig] = await Promise.all([
        api.get<{ data: Department[] }>("/hrm/departments"),
        api.get<{ data: Designation[] }>("/hrm/designations"),
      ]);
      setDepartments(resDept.data || []);
      setDesignations(resDesig.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Organization Structure</h3>
          <p className="text-xs text-slate-500">Manage business units, departments, and position designations.</p>
        </div>

        <button
          onClick={() => setShowDeptModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700"
        >
          <Plus size={14} /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                <p className="font-mono text-xs text-primary-700 font-semibold">{d.code}</p>
              </div>
            </div>
            {d.description && <p className="text-xs text-slate-500 line-clamp-2">{d.description}</p>}
          </div>
        ))}
      </div>

      {/* Designations Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 text-sm">Position Designations & Pay Grades</h4>
        </div>
        <CustomTable
          columns={[
            { key: "name", header: "Designation Title", render: (d: Designation) => <span className="font-bold text-slate-800 text-xs">{d.name}</span> },
            { key: "level", header: "Hierarchy Level", render: (d: Designation) => <span className="font-semibold text-slate-600 text-xs">Level {d.level}</span> },
            { key: "salaryBand", header: "Salary Band", render: (d: Designation) => <span className="text-xs font-semibold text-slate-700">{money(d.minSalary || 0)} - {money(d.maxSalary || 0)}</span> },
          ]}
          data={designations}
          rowKey={(d: Designation) => d.id}
          loading={loading}
          emptyIcon={BadgeCheck}
          emptyMessage="No designations configured."
        />
      </div>

      {showDeptModal && (
        <CreateDeptModal
          onClose={() => setShowDeptModal(false)}
          onSaved={() => {
            setShowDeptModal(false);
            onNotify("Department created successfully");
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateDeptModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/hrm/departments", form);
      onSaved();
    } catch {
      /* non-fatal */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Add Department</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border p-2.5 text-sm"
              placeholder="e.g. Sales & Marketing"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border p-2.5 text-sm font-mono uppercase"
              placeholder="SALES"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border p-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700">Create Department</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 7. SALES TARGETS
// ────────────────────────────────────────────────────────────

function SalesTargetsTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resT, resE] = await Promise.all([
        api.get<{ data: SalesTarget[] }>("/hrm/targets"),
        api.get<{ data: Employee[] }>("/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setTargets(resT.data || []);
      setEmployees(resE.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load targets", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Staff Sales Targets & Quotas</h3>
          <p className="text-xs text-slate-500">Live achievement tracking against confirmed POS sales invoices.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700"
        >
          <Plus size={14} /> Set Target
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map((t) => (
          <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t.scopeName}</h4>
                <p className="text-xs text-slate-400 font-semibold">{t.periodType} ({t.periodStart} → {t.periodEnd})</p>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${t.pct >= 100 ? "bg-emerald-100 text-emerald-800" : "bg-primary-50 text-primary-700 border border-primary-200/60"}`}>
                {t.pct}%
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-emerald-700">{money(t.achieved)}</span>
                <span className="text-slate-500">Target: {money(t.targetAmount)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${t.pct >= 100 ? "bg-emerald-500" : "bg-primary-600"}`}
                  style={{ width: `${Math.min(t.pct, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CreateTargetModal
          employees={employees}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onNotify("Sales target created");
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateTargetModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    scopeId: employees[0]?.id || "",
    targetAmount: "100000",
    periodType: "MONTHLY",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/hrm/targets", {
        scopeType: "EMPLOYEE",
        scopeId: form.scopeId,
        targetAmount: parseFloat(form.targetAmount) || 0,
        periodType: form.periodType,
      });
      onSaved();
    } catch {
      /* non-fatal */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Set Sales Target</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Staff Member *</label>
            <select
              value={form.scopeId}
              onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
              className="w-full rounded-xl border p-2.5 text-sm"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Amount (৳) *</label>
            <input
              type="number"
              required
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              className="w-full rounded-xl border p-2.5 text-sm font-semibold"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700">Set Target</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 8. PERFORMANCE APPRAISALS
// ────────────────────────────────────────────────────────────

function PerformanceTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resP, resE] = await Promise.all([
        api.get<{ data: PerformanceReview[] }>("/hrm/performance"),
        api.get<{ data: Employee[] }>("/hrm/employees?status=ACTIVE&limit=100"),
      ]);
      setReviews(resP.data || []);
      setEmployees(resE.data || []);
    } catch (err: any) {
      onNotify(err.message || "Failed to load appraisals", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Staff Performance Appraisals</h3>
          <p className="text-xs text-slate-500">KPI evaluations, star ratings, and performance notes.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700"
        >
          <Plus size={14} /> New Review
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CustomTable
          columns={[
            {
              key: "employee",
              header: "Employee",
              render: (r: PerformanceReview) => (
                <div>
                  <p className="font-bold text-slate-900 text-xs">{r.employeeName}</p>
                  <p className="font-mono text-[11px] text-slate-400">{r.employeeNo}</p>
                </div>
              ),
            },
            {
              key: "date",
              header: "Review Date",
              render: (r: PerformanceReview) => <span className="text-xs text-slate-600">{r.reviewDate}</span>,
            },
            {
              key: "rating",
              header: "Score",
              render: (r: PerformanceReview) => (
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <span>★ {r.rating} / 5</span>
                </div>
              ),
            },
            {
              key: "strengths",
              header: "Highlights & Strengths",
              render: (r: PerformanceReview) => (
                <p className="text-xs text-slate-600 max-w-xs line-clamp-1">{r.strengths || "—"}</p>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r: PerformanceReview) => <StatusBadge status={r.status} />,
            },
          ]}
          data={reviews}
          rowKey={(r: PerformanceReview) => r.id}
          loading={loading}
          emptyIcon={Star}
          emptyMessage="No performance reviews recorded yet."
        />
      </div>

      {showModal && (
        <CreateReviewModal
          employees={employees}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onNotify("Review saved");
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateReviewModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || "",
    rating: "5",
    strengths: "",
    improvements: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/hrm/performance", {
        employeeId: form.employeeId,
        rating: parseInt(form.rating) || 5,
        strengths: form.strengths,
        improvements: form.improvements,
        status: "APPROVED",
      });
      onSaved();
    } catch {
      /* non-fatal */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Record Performance Appraisal</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employee *</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full rounded-xl border p-2.5 text-sm"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rating (1 to 5 Stars)</label>
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="w-full rounded-xl border p-2.5 text-sm font-bold text-amber-600"
            >
              <option value="5">★★★★★ 5 - Exceptional</option>
              <option value="4">★★★★☆ 4 - Exceeds Expectations</option>
              <option value="3">★★★☆☆ 3 - Meets Standard</option>
              <option value="2">★★☆☆☆ 2 - Needs Improvement</option>
              <option value="1">★☆☆☆☆ 1 - Unsatisfactory</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Key Strengths</label>
            <textarea
              rows={2}
              value={form.strengths}
              onChange={(e) => setForm({ ...form, strengths: e.target.value })}
              className="w-full rounded-xl border p-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700">Save Review</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 9. STAFF COMMISSIONS
// ────────────────────────────────────────────────────────────

function EmployeeCommissionsTab({ onNotify }: { onNotify: (msg: string, type?: "success" | "error") => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState("");
  const [payload, setPayload] = useState<{ stats: Record<string, number>; commissions: CommissionRow[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get<{ data: Employee[] }>("/hrm/employees?status=ACTIVE&limit=200");
      setEmployees(res.data || []);
      if (res.data?.length > 0) {
        setSelected(res.data[0].id);
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const load = useCallback(async (empId: string) => {
    if (!empId) return;
    setLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/hrm/employees/${empId}/commissions`);
      setPayload(res.data);
    } catch (err: any) {
      onNotify(err.message || "Failed to load commissions", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    if (selected) load(selected);
  }, [selected, load]);

  const runCalc = async () => {
    if (!selected) return;
    try {
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      const endDate = new Date().toISOString().slice(0, 10);
      const res = await api.post<{ data: any }>(`/hrm/employees/${selected}/commissions/calculate`, { startDate, endDate });
      onNotify(`Scanned ${res.data.salesScanned} sales → Created ${res.data.commissionsCreated} commissions (${money(res.data.totalAmount)})`);
      load(selected);
    } catch (err: any) {
      onNotify(err.message || "Failed to calculate commissions", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNo})</option>
            ))}
          </select>
        </div>

        <button
          onClick={runCalc}
          disabled={!selected || loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-xs shadow-primary-500/25 hover:bg-primary-700 disabled:opacity-50 transition"
        >
          <TrendingUp size={14} /> Re-Calculate Commissions
        </button>
      </div>

      {payload && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CustomStatCard label="Total Earned" value={money(payload.stats?.totalEarned || 0)} icon={CircleDollarSign} tone="green" />
          <CustomStatCard label="Approved Commissions" value={money(payload.stats?.totalApproved || 0)} icon={BadgeCheck} tone="primary" />
          <CustomStatCard label="Paid Out" value={money(payload.stats?.totalPaid || 0)} icon={Wallet} tone="amber" />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "sale", header: "Invoice #", render: (c: CommissionRow) => <span className="font-bold text-slate-800 text-xs">{c.saleNo || "POS-SALE"}</span> },
            { key: "date", header: "Sale Date", render: (c: CommissionRow) => <span className="text-xs text-slate-600">{c.saleDate ? String(c.saleDate).slice(0, 10) : "—"}</span> },
            { key: "basis", header: "Basis Sale Amount", align: "right", render: (c: CommissionRow) => <span className="text-xs font-semibold text-slate-700">{money(c.basisAmount)}</span> },
            { key: "amount", header: "Commission Earned", align: "right", render: (c: CommissionRow) => <span className="font-bold text-emerald-700 text-sm">{money(c.amount)}</span> },
            { key: "status", header: "Status", render: (c: CommissionRow) => <StatusBadge status={c.status} /> },
          ]}
          data={payload?.commissions || []}
          rowKey={(c: CommissionRow) => c.id}
          loading={loading}
          emptyIcon={CircleDollarSign}
          emptyMessage="No commissions recorded for this employee."
        />
      </div>
    </div>
  );
}
