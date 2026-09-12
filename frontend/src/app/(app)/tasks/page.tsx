"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Plus,
  RefreshCw,
  Clock,
  Flag,
  User,
  Link2,
  MessageSquare,
  Paperclip,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RotateCcw,
  Calendar,
  Layers,
  Search,
  Trash2,
  Filter,
  Check,
  AlertTriangle,
  FileText,
  Eye,
  Send,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  CustomModal,
  ConfirmModal,
} from "@/components/custom";
import { dateTime, dateOnly } from "@/lib/format";

interface Task {
  id: string;
  taskNo: string;
  title: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  entityLabel: string | null;
  assigneeType: string | null;
  assigneeId: string | null;
  assigneeName?: string | null;
  assigneeRole?: string | null;
  creatorId: string | null;
  creatorName?: string | null;
  priority: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

interface Comment {
  id: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
}

interface TaskDetail extends Task {
  comments?: Comment[];
  attachments?: Attachment[];
}

interface EmployeeOption {
  id: string;
  label: string;
}

interface UserOption {
  id: string;
  label: string;
}

const STATUS_META: Record<string, { label: string; badge: string; dot: string; bg: string }> = {
  PENDING: { label: "Pending", badge: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400", bg: "bg-slate-50/70" },
  IN_PROGRESS: { label: "In Progress", badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-600", bg: "bg-blue-50/40" },
  BLOCKED: { label: "Blocked", badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-600", bg: "bg-rose-50/40" },
  COMPLETED: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-600", bg: "bg-emerald-50/40" },
  APPROVED: { label: "Approved", badge: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-600", bg: "bg-teal-50/40" },
  CANCELLED: { label: "Cancelled", badge: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400", bg: "bg-gray-50" },
};

const PRIORITY_META: Record<string, { label: string; chip: string; icon: any }> = {
  URGENT: { label: "Urgent", chip: "bg-rose-50 text-rose-700 border-rose-200", icon: Flag },
  HIGH: { label: "High", chip: "bg-amber-50 text-amber-700 border-amber-200", icon: Flag },
  NORMAL: { label: "Normal", chip: "bg-blue-50 text-blue-700 border-blue-200", icon: Flag },
  LOW: { label: "Low", chip: "bg-slate-100 text-slate-600 border-slate-200", icon: Flag },
};

const BOARD_COLS = ["PENDING", "IN_PROGRESS", "BLOCKED", "COMPLETED", "APPROVED"];

const ENTITY_TYPES = [
  "CUSTOMER",
  "INVOICE",
  "SALE",
  "SALES_ORDER",
  "REPAIR_TICKET",
  "PURCHASE_ORDER",
  "PURCHASE_REQUISITION",
  "EMPLOYEE",
  "LEAD",
  "DELIVERY",
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Notifications
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // Modals & Task Creation
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    priority: "NORMAL",
    dueAt: "",
    assigneeType: "EMPLOYEE",
    assigneeId: "",
    entityType: "",
    entityId: "",
    entityLabel: "",
  });

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Task Details & Actions
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");

  // Confirmation Modals
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [deleteModalTask, setDeleteModalTask] = useState<Task | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTasks = useCallback(
    async (showIndicator = false) => {
      if (showIndicator) setRefreshing(true);
      else setLoading(true);
      try {
        let url = "/api/v1/tasks?limit=200";
        if (statusFilter && statusFilter !== "ALL") url += `&status=${statusFilter}`;
        if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
        const res = await api.get<any>(url);
        setTasks(res.data?.data || res.data || []);
      } catch (err: any) {
        notify(false, err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, search]
  );

  const loadAssignees = useCallback(async () => {
    try {
      const [e, u] = await Promise.all([
        api.get<any>("/api/v1/hrm/employees?limit=200"),
        api.get<any>("/api/v1/rbac/users?limit=100"),
      ]);
      const empData = e.data?.data || e.data || [];
      const usrData = u.data?.data || u.data || [];

      setEmployees(
        empData.map((r: any) => ({
          id: r.id,
          label:
            `${r.employeeNo || ""} — ${r.firstName || ""} ${r.lastName || ""}`.trim().replace(/^—\s*/, "") ||
            r.email ||
            r.id,
        }))
      );
      setUsers(usrData.map((r: any) => ({ id: r.id, label: r.name || r.email || r.id })));
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadAssignees();
  }, [loadAssignees]);

  // Dynamic status counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: tasks.length };
    for (const t of tasks) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tasks]);

  const assigneeOptions =
    form.assigneeType === "USER"
      ? users.map((u) => ({ value: u.id, label: u.label }))
      : form.assigneeType === "ROLE"
      ? [{ value: "", label: "No roles available" }]
      : employees.map((e) => ({ value: e.id, label: e.label }));

  function openCreate() {
    loadAssignees();
    setForm({
      title: "",
      description: "",
      priority: "NORMAL",
      dueAt: "",
      assigneeType: "EMPLOYEE",
      assigneeId: "",
      entityType: "",
      entityId: "",
      entityLabel: "",
    });
    setShowCreate(true);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      notify(false, "Title is required");
      return;
    }
    setSaving(true);
    try {
      const body: any = { title: form.title.trim(), priority: form.priority };
      if (form.description) body.description = form.description;
      if (form.dueAt) body.dueAt = new Date(form.dueAt).toISOString().slice(0, 19).replace("T", " ");
      if (form.assigneeId) {
        body.assigneeType = form.assigneeType;
        body.assigneeId = form.assigneeId;
      }
      if (form.entityType) {
        body.entityType = form.entityType;
        if (form.entityId) body.entityId = form.entityId;
        else if (form.entityLabel) body.entityLabel = form.entityLabel;
      }
      const res = await api.post<any>("/api/v1/tasks", body);
      setShowCreate(false);
      notify(true, `Task ${res.data?.data?.taskNo || res.data?.taskNo || ""} created successfully`);
      loadTasks(true);
    } catch (err: any) {
      notify(false, err?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(task: Task) {
    setDetail(task);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get<any>(`/api/v1/tasks/${task.id}`);
      setDetail(res.data?.data || res.data);
    } catch {
      // fallback to current task info
    } finally {
      setDetailLoading(false);
    }
  }

  async function runTransition(status: string, extra?: any) {
    if (!detail) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/tasks/${detail.id}/status`, { status, ...(extra || {}) });
      notify(true, `Task moved to ${STATUS_META[status]?.label || status}`);
      setDetailOpen(false);
      setCancelModalTask(null);
      setCancelReason("");
      loadTasks(true);
    } catch (err: any) {
      notify(false, err?.message || "Transition failed");
    } finally {
      setSaving(false);
    }
  }

  async function addComment() {
    if (!detail || !newComment.trim()) return;
    try {
      await api.post(`/api/v1/tasks/${detail.id}/comments`, { comment: newComment.trim() });
      setNewComment("");
      openDetail(detail);
      notify(true, "Comment posted");
    } catch (err: any) {
      notify(false, err?.message || "Failed to add comment");
    }
  }

  async function addAttachment() {
    if (!detail || !attachName.trim()) return;
    try {
      await api.post(`/api/v1/tasks/${detail.id}/attachments`, {
        fileName: attachName.trim(),
        fileUrl: attachUrl.trim() || null,
        fileType: attachName.includes(".") ? attachName.split(".").pop() : null,
      });
      setAttachName("");
      setAttachUrl("");
      openDetail(detail);
      notify(true, "Attachment linked");
    } catch (err: any) {
      notify(false, err?.message || "Failed to add attachment");
    }
  }

  async function removeTask() {
    if (!deleteModalTask) return;
    try {
      await api.del(`/api/v1/tasks/${deleteModalTask.id}`);
      setDeleteModalTask(null);
      notify(true, "Task deleted successfully");
      loadTasks(true);
    } catch (err: any) {
      notify(false, err?.message || "Delete failed");
    }
  }

  async function runQuick(t: Task, status: string) {
    try {
      await api.post(`/api/v1/tasks/${t.id}/status`, { status });
      notify(true, `Task ${t.taskNo} → ${STATUS_META[status]?.label || status}`);
      loadTasks(true);
    } catch (err: any) {
      notify(false, err?.message || "Transition failed");
    }
  }

  // Action Buttons on task cards
  function ActionButtons({ t, compact }: { t: Task; compact?: boolean }) {
    const st = t.status;
    const cls = compact
      ? "rounded-md px-2 py-1 text-[11px] font-semibold transition cursor-pointer "
      : "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ";
    const btns: { status: string; label: string; icon: any; color: string; reason?: boolean }[] = [];

    if (st === "PENDING") {
      btns.push({ status: "IN_PROGRESS", label: "Start", icon: Play, color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" });
      btns.push({ status: "BLOCKED", label: "Block", icon: AlertTriangle, color: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200" });
      btns.push({ status: "CANCELLED", label: "Cancel", icon: XCircle, color: "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200", reason: true });
    } else if (st === "IN_PROGRESS") {
      btns.push({ status: "COMPLETED", label: "Complete", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" });
      btns.push({ status: "BLOCKED", label: "Block", icon: AlertTriangle, color: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200" });
      btns.push({ status: "CANCELLED", label: "Cancel", icon: XCircle, color: "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200", reason: true });
    } else if (st === "BLOCKED") {
      btns.push({ status: "IN_PROGRESS", label: "Resume", icon: Play, color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" });
      btns.push({ status: "CANCELLED", label: "Cancel", icon: XCircle, color: "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200", reason: true });
    } else if (st === "COMPLETED") {
      btns.push({ status: "APPROVED", label: "Approve", icon: ShieldCheck, color: "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200" });
      btns.push({ status: "IN_PROGRESS", label: "Reopen", icon: RotateCcw, color: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200" });
    }

    if (btns.length === 0) return null;

    return (
      <div className={compact ? "flex flex-wrap gap-1" : "flex flex-wrap gap-1.5"}>
        {btns.map((b) => (
          <button
            key={b.status}
            onClick={() => (b.reason ? (openDetail(t), setCancelModalTask(t)) : runQuick(t, b.status))}
            className={`${cls}${b.color}`}
          >
            {!compact && <b.icon className="w-3.5 h-3.5" />}
            {b.label}
          </button>
        ))}
      </div>
    );
  }

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== "ALL" && t.assigneeId !== assigneeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.taskNo.toLowerCase().includes(q) &&
          !(t.entityLabel || "").toLowerCase().includes(q) &&
          !(t.assigneeName || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, search]);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-top duration-200 ${
            toast.ok
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-teal-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          {toast.text}
        </div>
      )}

      {/* ── Header ── */}
      <CustomBreadcrumb
        title="Task & Operations Board"
        subtitle="Plan, Delegate, Track and Automate Operational Tasks across Modules"
        icon={<CheckSquare className="w-5 h-5" />}
        items={[
          { label: "Operations", href: "/dashboard" },
          { label: "Tasks" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
              onClick={() => loadTasks(true)}
              disabled={refreshing}
            >
              Refresh
            </CustomButton>

            <CustomButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              New Task
            </CustomButton>
          </div>
        }
      />

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CustomStatCard
          label="Total Active Tasks"
          value={counts.ALL?.toString() || "0"}
          icon={CheckSquare}
          tone="primary"
        />

        <CustomStatCard
          label="In Progress Work"
          value={counts.IN_PROGRESS?.toString() || "0"}
          icon={Play}
          tone="blue"
        />

        <CustomStatCard
          label="Pending & Blocked"
          value={((counts.PENDING || 0) + (counts.BLOCKED || 0)).toString()}
          icon={Clock}
          tone="amber"
        />

        <CustomStatCard
          label="Completed & Approved"
          value={((counts.COMPLETED || 0) + (counts.APPROVED || 0)).toString()}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      {/* ── Filter Bar & View Mode Toggle ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task title, #, entity or assignee..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 max-w-44 truncate"
            >
              <option value="ALL">All Assignees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.label}
                </option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === "board" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === "table" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
            </div>
          </div>
        </div>

        {/* Status Pill Filter Bar */}
        <div className="flex gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          {[
            { key: "ALL", label: "All Tasks" },
            { key: "PENDING", label: "Pending" },
            { key: "IN_PROGRESS", label: "In Progress" },
            { key: "BLOCKED", label: "Blocked" },
            { key: "COMPLETED", label: "Completed" },
            { key: "APPROVED", label: "Approved" },
            { key: "CANCELLED", label: "Cancelled" },
          ].map(({ key, label }) => {
            const active = statusFilter === key;
            const count = counts[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN WORKSPACE: KANBAN BOARD OR TABLE VIEW ── */}
      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm font-medium text-slate-500">Loading task items...</p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <CheckSquare className="h-7 w-7" />
          </div>
          <h4 className="mt-4 text-base font-bold text-slate-800">No Tasks Found</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "No tasks match your current filter criteria. Clear filters or search term to see all tasks."
              : "Create your first task to plan, delegate and monitor operational activities."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <CustomButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              New Task
            </CustomButton>
          </div>
        </div>
      ) : viewMode === "board" ? (
        /* ── KANBAN BOARD VIEW ── */
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {BOARD_COLS.map((col) => {
            const meta = STATUS_META[col];
            const colTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div key={col} className={`rounded-xl border border-slate-200 p-3 space-y-3 ${meta.bg}`}>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <span className="text-xs font-bold text-slate-800">{meta.label}</span>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-2xs border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                  {colTasks.map((t) => {
                    const p = PRIORITY_META[t.priority] ?? PRIORITY_META.NORMAL;
                    const PriorityIcon = p.icon;
                    const overdue =
                      t.dueAt &&
                      t.status !== "COMPLETED" &&
                      t.status !== "APPROVED" &&
                      t.status !== "CANCELLED" &&
                      new Date(t.dueAt).getTime() < Date.now();

                    return (
                      <div
                        key={t.id}
                        onClick={() => openDetail(t)}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:shadow-md transition hover:-translate-y-0.5 cursor-pointer space-y-2.5"
                      >
                        {/* Task header */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-teal-700">{t.taskNo}</span>
                          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${p.chip}`}>
                            <PriorityIcon className="w-3 h-3" />
                            {p.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-relaxed">{t.title}</h5>

                        {/* Linked Entity */}
                        {t.entityLabel && (
                          <div className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-800 max-w-full truncate">
                            <Link2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">{t.entityLabel}</span>
                          </div>
                        )}

                        {/* Assignee & Due Date */}
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{t.assigneeName || "Unassigned"}</span>
                          </span>

                          {t.dueAt && (
                            <span
                              className={`flex items-center gap-1 font-mono text-[10px] ${
                                overdue ? "font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded" : "text-slate-500"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {dateOnly(t.dueAt)}
                            </span>
                          )}
                        </div>

                        {/* Quick action triggers */}
                        <div className="pt-1.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <ActionButtons t={t} compact />
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                      No tasks in this lane
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <CustomTable<Task>
            columns={[
              {
                key: "taskNo",
                header: "Task # & Title",
                render: (row) => (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700">{row.taskNo}</span>
                      <button
                        onClick={() => openDetail(row)}
                        className="font-semibold text-xs text-slate-900 hover:text-teal-600 text-left transition"
                      >
                        {row.title}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Created: {dateTime(row.createdAt)}</p>
                  </div>
                ),
              },
              {
                key: "priority",
                header: "Priority",
                render: (row) => {
                  const p = PRIORITY_META[row.priority] ?? PRIORITY_META.NORMAL;
                  const PriorityIcon = p.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${p.chip}`}>
                      <PriorityIcon className="w-3 h-3" />
                      {p.label}
                    </span>
                  );
                },
              },
              {
                key: "assigneeName",
                header: "Assignee",
                render: (row) => (
                  <div className="flex items-center gap-1.5 text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800">{row.assigneeName || "Unassigned"}</span>
                  </div>
                ),
              },
              {
                key: "entityLabel",
                header: "Linked Record",
                render: (row) =>
                  row.entityLabel ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                      <Link2 className="w-3 h-3" /> {row.entityLabel}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  ),
              },
              {
                key: "dueAt",
                header: "Due Date",
                render: (row) => {
                  const overdue =
                    row.dueAt &&
                    row.status !== "COMPLETED" &&
                    row.status !== "APPROVED" &&
                    row.status !== "CANCELLED" &&
                    new Date(row.dueAt).getTime() < Date.now();
                  return (
                    <span
                      className={`font-mono text-xs ${
                        overdue ? "font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" : "text-slate-600"
                      }`}
                    >
                      {row.dueAt ? dateOnly(row.dueAt) : "—"}
                    </span>
                  );
                },
              },
              {
                key: "status",
                header: "Status",
                render: (row) => {
                  const meta = STATUS_META[row.status] ?? STATUS_META.PENDING;
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  );
                },
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openDetail(row)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                    <button
                      onClick={() => setDeleteModalTask(row)}
                      className="inline-flex items-center rounded-md p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredTasks}
            pageSize={15}
            emptyMessage="No tasks found matching criteria."
          />
        </div>
      )}

      {/* ─── MODAL: CREATE TASK ─── */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Operational Task" size="lg">
        <form onSubmit={createTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Follow up with client regarding overdue invoice INV-1042"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Detailed Instructions
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Provide actionable context, expected outcomes, or specific requirements..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="URGENT">🔴 Urgent Priority</option>
                <option value="HIGH">🟠 High Priority</option>
                <option value="NORMAL">🔵 Normal Priority</option>
                <option value="LOW">⚪ Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assignee Type
              </label>
              <select
                value={form.assigneeType}
                onChange={(e) => setForm({ ...form, assigneeType: e.target.value, assigneeId: "" })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="EMPLOYEE">HRM Employee</option>
                <option value="USER">System User</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Assignee
              </label>
              <select
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="">-- Unassigned --</option>
                {assigneeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked Record section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Link2 className="w-3.5 h-3.5 text-teal-600" /> Link to Record (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="">None (General Task)</option>
                  {ENTITY_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              {form.entityType && (
                <div>
                  <input
                    type="text"
                    value={form.entityLabel}
                    onChange={(e) => setForm({ ...form, entityLabel: e.target.value })}
                    placeholder="e.g. INV-1042 or Customer #..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setShowCreate(false)} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" icon={<Check className="w-4 h-4" />} type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Task"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ─── MODAL: TASK DETAIL & DISCUSSION SLIDEOVER ─── */}
      <CustomModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail ? `${detail.taskNo} · Task Workspace` : "Task Details"}
        size="xl"
      >
        {detail && (
          <div className="space-y-5">
            {/* Header metadata */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_META[detail.status]?.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[detail.status]?.dot}`} />
                    {STATUS_META[detail.status]?.label}
                  </span>

                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${(PRIORITY_META[detail.priority] ?? PRIORITY_META.NORMAL).chip}`}>
                    <Flag className="w-3 h-3" />
                    {PRIORITY_META[detail.priority]?.label}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Created {dateTime(detail.createdAt)} by <span className="font-semibold text-slate-700">{detail.creatorName || "System"}</span>
                </p>
              </div>

              <h3 className="text-base font-bold text-slate-900">{detail.title}</h3>

              {detail.description && (
                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {detail.description}
                </p>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assignee</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detail.assigneeName || "Unassigned"}</p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Due Date</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detail.dueAt ? dateOnly(detail.dueAt) : "None"}</p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Completed At</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detail.completedAt ? dateOnly(detail.completedAt) : "—"}</p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Approved At</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detail.approvedAt ? dateOnly(detail.approvedAt) : "—"}</p>
                </div>
              </div>

              {detail.entityLabel && (
                <div className="rounded-lg bg-teal-50/70 p-2.5 border border-teal-100 text-xs flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-teal-900 font-medium">
                    Linked to <strong className="font-bold">{detail.entityType}</strong>: {detail.entityLabel}
                  </span>
                </div>
              )}

              {detail.cancelReason && (
                <div className="rounded-lg bg-rose-50 p-2.5 border border-rose-200 text-xs text-rose-800">
                  <strong>Cancellation Reason: </strong> {detail.cancelReason}
                </div>
              )}
            </div>

            {/* Transition Action Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status Workflow Actions</span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ActionButtons t={detail} />
                {(detail.status === "PENDING" || detail.status === "IN_PROGRESS" || detail.status === "BLOCKED") && (
                  <button
                    onClick={() => setCancelModalTask(detail)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel Task...
                  </button>
                )}
              </div>
            </div>

            {/* Comments Stream */}
            <div className="space-y-3">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" /> Discussion & Comments ({detail.comments?.length || 0})
              </span>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(detail.comments || []).map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{c.authorName}</span>
                      <span className="text-[10px] text-slate-400">{dateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{c.comment}</p>
                  </div>
                ))}
                {(detail.comments || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">No comments posted yet.</p>
                )}
              </div>

              {/* Comment Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Write a message or update..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
                <CustomButton variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={addComment}>
                  Post
                </CustomButton>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Paperclip className="w-3.5 h-3.5 text-teal-600" /> Files & Attachments ({detail.attachments?.length || 0})
              </span>

              {(detail.attachments || []).length > 0 && (
                <div className="space-y-1.5">
                  {(detail.attachments || []).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 bg-slate-50/50 text-xs">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{a.fileName}</span>
                        {a.fileUrl && (
                          <a
                            href={a.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-600 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                          >
                            open <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{dateTime(a.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Attachment Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={attachName}
                  onChange={(e) => setAttachName(e.target.value)}
                  placeholder="Document Name (e.g. proof.pdf)"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-teal-600"
                />
                <input
                  type="text"
                  value={attachUrl}
                  onChange={(e) => setAttachUrl(e.target.value)}
                  placeholder="Link URL (optional)"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-teal-600"
                />
                <CustomButton variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addAttachment}>
                  Add File
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ─── MODAL: CANCEL TASK ─── */}
      <CustomModal open={cancelModalTask !== null} onClose={() => setCancelModalTask(null)} title="Cancel Task" size="md">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide a cancellation reason for task <strong>{cancelModalTask?.taskNo}</strong>:
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            placeholder="e.g. Duplicate requirement, client withdrew request, or superseded by task #..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setCancelModalTask(null)}>
              Back
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              icon={<XCircle className="w-4 h-4" />}
              onClick={() => {
                if (!cancelReason.trim()) {
                  notify(false, "Reason is required");
                  return;
                }
                runTransition("CANCELLED", { reason: cancelReason.trim() });
              }}
              disabled={saving}
            >
              Confirm Cancellation
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ─── MODAL: DELETE TASK ─── */}
      <ConfirmModal
        open={deleteModalTask !== null}
        onClose={() => setDeleteModalTask(null)}
        onConfirm={removeTask}
        title="Delete Task"
        message={`Are you sure you want to permanently delete task "${deleteModalTask?.taskNo} — ${deleteModalTask?.title}"? All associated comments and attachments will also be removed.`}
        confirmText="Delete Task"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
