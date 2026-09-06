"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckSquare, Plus, RefreshCw, Loader2, AlertCircle, Clock, Flag,
  User, Link2, MessageSquare, Paperclip, Play, CheckCircle2, XCircle,
  ShieldCheck, RotateCcw, Calendar, Layers, Search, Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

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

interface Comment { id: string; authorName: string; comment: string; createdAt: string; }
interface Attachment { id: string; fileName: string; fileUrl: string | null; fileType: string | null; createdAt: string; }
interface TaskDetail extends Task { comments?: Comment[]; attachments?: Attachment[]; }
interface EmployeeOption { id: string; label: string; }
interface UserOption { id: string; label: string; }

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING: { label: "Pending", badge: "bg-slate-500/15 text-slate-700 border-slate-500/25", dot: "bg-slate-400" },
  IN_PROGRESS: { label: "In Progress", badge: "bg-sky-500/15 text-sky-700 border-sky-500/25", dot: "bg-sky-500" },
  BLOCKED: { label: "Blocked", badge: "bg-rose-500/15 text-rose-700 border-rose-500/25", dot: "bg-rose-500" },
  COMPLETED: { label: "Completed", badge: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25", dot: "bg-emerald-500" },
  APPROVED: { label: "Approved", badge: "bg-indigo-500/15 text-indigo-700 border-indigo-500/25", dot: "bg-indigo-500" },
  CANCELLED: { label: "Cancelled", badge: "bg-gray-500/15 text-gray-500 border-gray-500/25", dot: "bg-gray-400" },
};

const PRIORITY_META: Record<string, { label: string; chip: string; icon: any }> = {
  URGENT: { label: "Urgent", chip: "bg-red-50 text-red-700 border-red-200", icon: Flag },
  HIGH: { label: "High", chip: "bg-amber-50 text-amber-700 border-amber-200", icon: Flag },
  NORMAL: { label: "Normal", chip: "bg-sky-50 text-sky-700 border-sky-200", icon: Flag },
  LOW: { label: "Low", chip: "bg-gray-100 text-gray-600 border-gray-200", icon: Flag },
};

const BOARD_COLS = ["PENDING", "IN_PROGRESS", "BLOCKED", "COMPLETED", "APPROVED"];

const ENTITY_TYPES = [
  "CUSTOMER", "INVOICE", "SALE", "SALES_ORDER", "REPAIR_TICKET",
  "PURCHASE_ORDER", "PURCHASE_REQUISITION", "EMPLOYEE", "LEAD", "DELIVERY",
];

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";
const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function TasksPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", description: "", priority: "NORMAL", dueAt: "",
    assigneeType: "EMPLOYEE", assigneeId: "",
    entityType: "", entityId: "", entityLabel: "",
  });
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");
  const [cancelModal, setCancelModal] = useState<Task | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [deleteModal, setDeleteModal] = useState<Task | null>(null);

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/v1/tasks?limit=200";
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await api.get<{ data: Task[] }>(url);
      setTasks(res.data);
    } catch (err: any) { console.error(err); } finally { setLoading(false); }
  }, [statusFilter, search]);

  const loadAssignees = useCallback(async () => {
    try {
      const [e, u] = await Promise.all([
        api.get<{ data: any[] }>("/v1/hrm/employees?limit=200"),
        api.get<{ data: any[] }>("/v1/rbac/users?limit=100"),
      ]);
      setEmployees((e.data || []).map((r: any) => ({
        id: r.id,
        label: `${r.employeeNo || ""} — ${r.firstName || ""} ${r.lastName || ""}`.trim().replace(/^—\s*/, "") || r.email || r.id,
      })));
      setUsers((u.data || []).map((r: any) => ({ id: r.id, label: r.name || r.email || r.id })));
    } catch (err: any) { console.error(err); }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { loadAssignees(); }, [loadAssignees]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: tasks.length };
    for (const t of tasks) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tasks]);

  const assigneeOptions = form.assigneeType === "USER"
    ? users.map((u) => ({ value: u.id, label: u.label }))
    : form.assigneeType === "ROLE"
      ? [{ value: "", label: "No roles available" }]
      : employees.map((e) => ({ value: e.id, label: e.label }));

  function openCreate() {
    loadAssignees();
    setForm({ title: "", description: "", priority: "NORMAL", dueAt: "", assigneeType: "EMPLOYEE", assigneeId: "", entityType: "", entityId: "", entityLabel: "" });
    setShowCreate(true);
  }

  async function createTask() {
    if (!form.title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      const body: any = { title: form.title.trim(), priority: form.priority };
      if (form.description) body.description = form.description;
      if (form.dueAt) body.dueAt = new Date(form.dueAt).toISOString().slice(0, 19).replace("T", " ");
      if (form.assigneeId) { body.assigneeType = form.assigneeType; body.assigneeId = form.assigneeId; }
      if (form.entityType) {
        body.entityType = form.entityType;
        if (form.entityId) body.entityId = form.entityId;
        else if (form.entityLabel) body.entityLabel = form.entityLabel;
      }
      const res = await api.post<{ data: any }>("/v1/tasks", body);
      setShowCreate(false);
      showMessage(`Task ${res.data?.taskNo || ""} created`);
      loadTasks();
    } catch (err: any) {
      alert(err?.message || "Failed to create task");
    } finally { setSaving(false); }
  }

  async function openDetail(task: Task) {
    setDetail(task);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get<{ data: TaskDetail }>(`/v1/tasks/${task.id}`);
      setDetail(res.data);
    } catch (err: any) { console.error(err); } finally { setDetailLoading(false); }
  }

  async function runTransition(status: string, extra?: any) {
    if (!detail) return;
    setSaving(true);
    try {
      await api.post(`/v1/tasks/${detail.id}/status`, { status, ...(extra || {}) });
      showMessage(`Task ${status === "CANCELLED" ? "cancelled" : `moved to ${STATUS_META[status]?.label || status}`}`);
      setDetailOpen(false);
      setCancelModal(null);
      setCancelReason("");
      loadTasks();
    } catch (err: any) { alert(err?.message || "Transition failed"); } finally { setSaving(false); }
  }

  async function addComment() {
    if (!detail || !newComment.trim()) return;
    try {
      await api.post(`/v1/tasks/${detail.id}/comments`, { comment: newComment.trim() });
      setNewComment("");
      openDetail(detail);
    } catch (err: any) { alert(err?.message || "Failed to add comment"); }
  }

  async function addAttachment() {
    if (!detail || !attachName.trim()) return;
    try {
      await api.post(`/v1/tasks/${detail.id}/attachments`, { fileName: attachName.trim(), fileUrl: attachUrl.trim() || null, fileType: attachName.includes(".") ? attachName.split(".").pop() : null });
      setAttachName(""); setAttachUrl("");
      openDetail(detail);
    } catch (err: any) { alert(err?.message || "Failed to add attachment"); }
  }

  async function removeTask() {
    if (!deleteModal) return;
    try {
      await api.del(`/v1/tasks/${deleteModal.id}`);
      setDeleteModal(null);
      showMessage("Task deleted");
      loadTasks();
    } catch (err: any) { alert(err?.message || "Delete failed"); }
  }

  function ActionButtons({ t, compact }: { t: Task; compact?: boolean }) {
    const st = t.status;
    const cls = compact
      ? "rounded-md px-2 py-1 text-[11px] font-medium transition "
      : "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ";
    const btns: { status: string; label: string; icon: any; color: string; reason?: boolean }[] = [];
    if (st === "PENDING") {
      btns.push({ status: "IN_PROGRESS", label: "Start", icon: Play, color: "bg-sky-50 text-sky-700 hover:bg-sky-100" });
      btns.push({ status: "BLOCKED", label: "Block", icon: AlertCircle, color: "bg-rose-50 text-rose-700 hover:bg-rose-100" });
      btns.push({ status: "CANCELLED", label: "Cancel", icon: XCircle, color: "bg-gray-100 text-gray-500 hover:bg-gray-200", reason: true });
    } else if (st === "IN_PROGRESS") {
      btns.push({ status: "COMPLETED", label: "Complete", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" });
      btns.push({ status: "BLOCKED", label: "Block", icon: AlertCircle, color: "bg-rose-50 text-rose-700 hover:bg-rose-100" });
      btns.push({ status: "CANCELLED", label: "Cancel", icon: XCircle, color: "bg-gray-100 text-gray-500 hover:bg-gray-200", reason: true });
    } else if (st === "BLOCKED") {
      btns.push({ status: "IN_PROGRESS", label: "Resume", icon: Play, color: "bg-sky-50 text-sky-700 hover:bg-sky-100" });
      btns.push({ status: "CANCELLED", label: "Cancel", icon: XCircle, color: "bg-gray-100 text-gray-500 hover:bg-gray-200", reason: true });
    } else if (st === "COMPLETED") {
      btns.push({ status: "APPROVED", label: "Approve", icon: ShieldCheck, color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" });
      btns.push({ status: "IN_PROGRESS", label: "Reopen", icon: RotateCcw, color: "bg-gray-100 text-gray-600 hover:bg-gray-200" });
    }
    if (btns.length === 0) return null;
    return (
      <div className={compact ? "flex flex-wrap gap-1" : "flex flex-wrap gap-1.5"}>
        {btns.map((b) => (
          <button key={b.status} onClick={() => (b.reason ? (openDetail(t), setCancelModal(t)) : runQuick(t, b.status))} className={`${cls}${b.color}`}>
            {!compact && <b.icon size={12} />}{b.label}
          </button>
        ))}
      </div>
    );
  }

  async function runQuick(t: Task, status: string) {
    try {
      await api.post(`/v1/tasks/${t.id}/status`, { status });
      showMessage(`Task ${t.taskNo} → ${STATUS_META[status]?.label || status}`);
      loadTasks();
    } catch (err: any) { alert(err?.message || "Transition failed"); }
  }

  const filtered = tasks.filter((t) => t.status !== "CANCELLED" || statusFilter === "CANCELLED");

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CheckSquare size={22} className="text-primary-600" /> Task Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">Plan, assign and track work items across every module</p>
        </div>
        <CustomButton onClick={openCreate}><Plus size={15} /> New Task</CustomButton>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {([["ALL", "Total", CheckSquare], ["PENDING", "Pending", Clock], ["IN_PROGRESS", "In Progress", Play], ["BLOCKED", "Blocked", AlertCircle], ["COMPLETED", "Completed", CheckCircle2], ["APPROVED", "Approved", ShieldCheck]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setStatusFilter(key === "ALL" ? "" : key === statusFilter ? "" : key)}
            className={`rounded-xl border p-4 text-left shadow-sm transition ${key === "ALL" || statusFilter === key ? "border-primary-200 bg-white ring-1 ring-primary-100" : "border-gray-100 bg-white hover:border-gray-200"}`}>
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Icon size={13} /> {label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{counts[key] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <button onClick={() => { loadTasks(); }} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
          <RefreshCw size={13} /> Refresh
        </button>
        <div className="ml-auto hidden text-xs text-gray-400 sm:block">
          Drag cards between columns, or use the quick actions below each card
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <CheckSquare size={28} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No tasks found</p>
          <p className="mt-1 text-xs text-gray-400">Create a task to start tracking work</p>
          <CustomButton className="mt-4" size="sm" onClick={openCreate}><Plus size={14} /> New Task</CustomButton>
        </div>
      ) : (
        <>
          {/* Kanban board */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {BOARD_COLS.map((col) => {
              const meta = STATUS_META[col];
              const colTasks = filtered.filter((t) => t.status === col);
              return (
                <div key={col} className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-gray-500 shadow-sm">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((t) => {
                      const p = PRIORITY_META[t.priority] ?? PRIORITY_META.NORMAL;
                      const overdue = t.dueAt && t.status !== "COMPLETED" && t.status !== "APPROVED" && t.status !== "CANCELLED" && new Date(t.dueAt).getTime() < Date.now();
                      return (
                        <div key={t.id} className="cursor-grab rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md" onClick={() => openDetail(t)}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[10px] font-semibold text-gray-400">{t.taskNo}</p>
                            <span className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${p.chip}`}>
                              <p.icon size={10} />{p.label}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">{t.title}</p>
                          {t.entityLabel && (
                            <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] text-primary-600">
                              <Link2 size={11} /> {t.entityLabel}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                            {t.assigneeName ? <span className="flex items-center gap-1"><User size={11} /> {t.assigneeName}</span> : <span className="flex items-center gap-1 text-gray-400"><User size={11} /> Unassigned</span>}
                            {t.dueAt && <span className={`flex items-center gap-1 ${overdue ? "font-semibold text-rose-600" : ""}`}><Calendar size={11} /> {fmtDate(t.dueAt)}</span>}
                          </div>
                          <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                            <ActionButtons t={t} compact />
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-[11px] text-gray-400">No tasks</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table view (all incl. cancelled) */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Linked to</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const meta = STATUS_META[t.status] ?? STATUS_META.PENDING;
                  const p = PRIORITY_META[t.priority] ?? PRIORITY_META.NORMAL;
                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="max-w-[280px] px-4 py-3">
                        <button onClick={() => openDetail(t)} className="block text-left">
                          <p className="font-semibold text-gray-900 hover:text-primary-600">{t.title}</p>
                          <p className="text-[11px] text-gray-400">{t.taskNo} · {fmtDateTime(t.createdAt)}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${p.chip}`}>
                          <p.icon size={11} />{p.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700">{t.assigneeName || "Unassigned"}</p>
                        {t.assigneeType && t.assigneeType !== "EMPLOYEE" && <p className="text-[10px] text-gray-400">{t.assigneeType}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {t.entityLabel ? (
                          <span className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                            <Link2 size={11} /> {t.entityLabel}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(t.dueAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDetail(t)} className="text-xs font-medium text-primary-600 hover:text-primary-700">Open</button>
                          <button onClick={() => { setDeleteModal(t); }} className="text-xs text-gray-400 hover:text-rose-600"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── New Task modal ── */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New Task">
        <div className="space-y-3">
          <CustomInput label="Title *" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Follow up invoice INV-1042" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="What needs to be done?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Priority" value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
              options={["URGENT", "HIGH", "NORMAL", "LOW"].map((v) => ({ value: v, label: PRIORITY_META[v].label }))} />
            <CustomInput label="Due date" type="date" value={form.dueAt} onChange={(e: any) => setForm({ ...form, dueAt: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Assign to" value={form.assigneeType} onChange={(e: any) => setForm({ ...form, assigneeType: e.target.value, assigneeId: "" })}
              options={[{ value: "EMPLOYEE", label: "Employee" }, { value: "USER", label: "User" }, { value: "ROLE", label: "Role" }]} />
            <CustomSelect label={form.assigneeType === "USER" ? "User" : form.assigneeType === "ROLE" ? "Role" : "Employee"}
              value={form.assigneeId} onChange={(e: any) => setForm({ ...form, assigneeId: e.target.value })} options={assigneeOptions} placeholder="Unassigned" />
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500"><Link2 size={13} /> Link to a record (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect label="Type" value={form.entityType} onChange={(e: any) => setForm({ ...form, entityType: e.target.value })}
                options={[{ value: "", label: "None" }, ...ENTITY_TYPES.map((v) => ({ value: v, label: v.replace(/_/g, " ") }))]} />
              {form.entityType ? (
                <CustomInput label="Record ID / label" value={form.entityLabel} onChange={(e: any) => setForm({ ...form, entityLabel: e.target.value })} placeholder="e.g. CUST-001 or id" />
              ) : <div />}
            </div>
            {form.entityType && !form.entityId && (
              <p className="mt-2 text-[11px] text-gray-400">Paste a record id to auto-resolve its name, or type a reference label.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton onClick={createTask} loading={saving}><Plus size={15} /> Create Task</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Detail modal ── */}
      <CustomModal open={detailOpen} onClose={() => setDetailOpen(false)} title={detail ? `${detail.taskNo} · Details` : "Task"}>
        {detailLoading && !detail?.comments ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[detail.status]?.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[detail.status]?.dot}`} />{STATUS_META[detail.status]?.label}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${(PRIORITY_META[detail.priority] ?? PRIORITY_META.NORMAL).chip}`}>
                  <Flag size={10} />{PRIORITY_META[detail.priority]?.label}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-gray-900">{detail.title}</h3>
              <p className="mt-0.5 text-xs text-gray-400">Created by {detail.creatorName || "—"} · {fmtDateTime(detail.createdAt)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-gray-50 p-2.5">
                <p className="text-gray-400">Assignee</p>
                <p className="mt-0.5 font-medium text-gray-800">{detail.assigneeName || "Unassigned"}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2.5">
                <p className="text-gray-400">Due</p>
                <p className="mt-0.5 font-medium text-gray-800">{fmtDate(detail.dueAt)}</p>
              </div>
              {detail.entityLabel && (
                <div className="col-span-2 rounded-lg bg-primary-50 p-2.5">
                  <p className="text-primary-400">Linked to {detail.entityType}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-medium text-primary-700"><Link2 size={12} /> {detail.entityLabel}{detail.entityId ? ` (${detail.entityId.slice(0, 8)}…)` : ""}</p>
                </div>
              )}
              {detail.cancelReason && (
                <div className="col-span-2 rounded-lg bg-rose-50 p-2.5">
                  <p className="text-rose-400">Cancellation reason</p>
                  <p className="mt-0.5 font-medium text-rose-700">{detail.cancelReason}</p>
                </div>
              )}
            </div>

            {detail.description && (
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-500">Description</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{detail.description}</p>
              </div>
            )}

            {detail.completedAt && <p className="text-[11px] text-emerald-600">Completed {fmtDateTime(detail.completedAt)}</p>}
            {detail.approvedAt && <p className="text-[11px] text-indigo-600">Approved {fmtDateTime(detail.approvedAt)}</p>}

            {/* Actions */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-500">Actions</p>
              <ActionButtons t={detail} />
              {detail.status === "PENDING" || detail.status === "IN_PROGRESS" || detail.status === "BLOCKED" ? (
                <button onClick={() => { setCancelModal(detail as Task); }} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-rose-600">
                  <XCircle size={13} /> Cancel task…
                </button>
              ) : null}
            </div>

            {/* Comments */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500"><MessageSquare size={13} /> Comments ({detail.comments?.length || 0})</p>
              <div className="space-y-2">
                {(detail.comments || []).map((c) => (
                  <div key={c.id} className="rounded-lg border border-gray-100 bg-gray-50/60 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-700">{c.authorName}</p>
                      <p className="text-[10px] text-gray-400">{fmtDateTime(c.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{c.comment}</p>
                  </div>
                ))}
                {(detail.comments || []).length === 0 && <p className="text-xs text-gray-400">No comments yet</p>}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Add a comment…"
                  className="h-9 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <CustomButton size="sm" onClick={addComment}>Post</CustomButton>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500"><Paperclip size={13} /> Attachments ({detail.attachments?.length || 0})</p>
              {(detail.attachments || []).length > 0 && (
                <div className="space-y-1.5">
                  {(detail.attachments || []).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Paperclip size={13} className="text-gray-400" />
                        <p className="text-xs font-medium text-gray-700">{a.fileName}</p>
                        {a.fileUrl && <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary-600 hover:underline">open</a>}
                      </div>
                      <p className="text-[10px] text-gray-400">{fmtDateTime(a.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input
                  value={attachName}
                  onChange={(e) => setAttachName(e.target.value)}
                  placeholder="File name"
                  className="col-span-1 h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <input
                  value={attachUrl}
                  onChange={(e) => setAttachUrl(e.target.value)}
                  placeholder="URL (optional)"
                  className="col-span-1 h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <CustomButton size="sm" variant="outline" onClick={addAttachment}><Plus size={13} /> Add</CustomButton>
              </div>
            </div>
          </div>
        ) : null}
      </CustomModal>

      {/* ── Cancel modal ── */}
      <CustomModal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel task">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Provide a reason for cancelling <b>{cancelModal?.taskNo}</b>:</p>
          <CustomInput label="Reason" value={cancelReason} onChange={(e: any) => setCancelReason(e.target.value)} placeholder="e.g. No longer needed" />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setCancelModal(null)}>Back</CustomButton>
            <CustomButton variant="danger" loading={saving} onClick={() => cancelReason.trim() ? runTransition("CANCELLED", { reason: cancelReason.trim() }) : alert("Reason is required")}>
              <XCircle size={15} /> Cancel Task
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Delete confirm ── */}
      <CustomModal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete task">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Delete <b>{deleteModal?.taskNo}</b>? Its comments and attachments will also be removed. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setDeleteModal(null)}>Keep</CustomButton>
            <CustomButton variant="danger" onClick={removeTask}><Trash2 size={14} /> Delete</CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
