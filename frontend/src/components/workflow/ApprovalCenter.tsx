"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Ban,
  RefreshCw,
  Search,
  Loader2,
  GitMerge,
  Layers,
  Inbox,
  FileCheck2,
  Clock,
  Settings,
  AlertTriangle,
  ChevronRight,
  User,
  Shield,
  FileText,
  DollarSign,
  Tag,
  Package,
  Calendar,
  Building2,
  ArrowRight,
  Eye,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomBadge } from "@/components/custom/CustomBadge";

export interface ApprovalRow {
  id: string;
  requestNo: string;
  entityType: string;
  entityLabel?: string;
  entityId?: string;
  entityNo?: string | null;
  summary?: string | null;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | "CANCELLED" | "EXPIRED" | string;
  currentLevel: number;
  currentRole?: string | null;
  totalLevels?: number;
  approvedLevels?: number;
  submittedBy?: string | null;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string | null;
  payload?: any;
  steps?: StepRow[];
}

export interface StepRow {
  id: string;
  level: number;
  role?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | string;
  comment?: string | null;
  actedBy?: string | null;
  actedAt?: string | null;
}

export const ENTITIES: { type: string; label: string; icon: string; category: string }[] = [
  { type: "EXPENSE", label: "Expense Claim / Payout", icon: "DollarSign", category: "Finance" },
  { type: "PURCHASE_ORDER", label: "Purchase Order (PO)", icon: "Package", category: "Procurement" },
  { type: "PURCHASE_REQUISITION", label: "Purchase Requisition (PR)", icon: "FileText", category: "Procurement" },
  { type: "STOCK_ADJUST", label: "Stock Adjustment / Write-off", icon: "Layers", category: "Inventory" },
  { type: "PRICE_CHANGE", label: "Catalog Price Modification", icon: "Tag", category: "Catalog" },
  { type: "PRICE_OVERRIDE", label: "POS Price Override", icon: "DollarSign", category: "POS" },
  { type: "SALE_DISCOUNT", label: "High Value / Custom Discount", icon: "Percent", category: "POS" },
  { type: "CREDIT_LIMIT", label: "Customer Credit Limit Increase", icon: "Building2", category: "Sales" },
  { type: "CREDIT_HOLD", label: "Customer Credit Hold / Unhold", icon: "Shield", category: "Sales" },
  { type: "SHIFT_CLOSE", label: "Cash Shift Close Variance", icon: "Clock", category: "POS" },
  { type: "TASK", label: "Staff Task Completion", icon: "FileCheck2", category: "Operations" },
  { type: "REFUND", label: "Customer Refund", icon: "DollarSign", category: "Sales" },
  { type: "WRITE_OFF", label: "Asset / Inventory Write-Off", icon: "Ban", category: "Accounting" },
];

export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string; borderCls: string; dotCls: string; icon: any }
> = {
  PENDING: {
    label: "Pending Review",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-500/10",
    borderCls: "border-amber-300",
    dotCls: "bg-amber-500",
    icon: Clock,
  },
  APPROVED: {
    label: "Fully Approved",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10",
    borderCls: "border-emerald-300",
    dotCls: "bg-emerald-500",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10",
    borderCls: "border-rose-300",
    dotCls: "bg-rose-500",
    icon: XCircle,
  },
  ESCALATED: {
    label: "Escalated",
    badgeCls: "bg-sky-50 text-sky-700 border-sky-200/80 ring-1 ring-sky-500/10",
    borderCls: "border-sky-300",
    dotCls: "bg-sky-500",
    icon: ArrowUpRight,
  },
  CANCELLED: {
    label: "Cancelled / Withdrawn",
    badgeCls: "bg-slate-100 text-slate-600 border-slate-200",
    borderCls: "border-slate-300",
    dotCls: "bg-slate-400",
    icon: Ban,
  },
  EXPIRED: {
    label: "SLA Expired",
    badgeCls: "bg-purple-50 text-purple-700 border-purple-200/80 ring-1 ring-purple-500/10",
    borderCls: "border-purple-300",
    dotCls: "bg-purple-500",
    icon: AlertTriangle,
  },
};

const STEP_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300" },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300" },
  ESCALATED: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-300" },
};

export const taka = (v: any) =>
  `৳${(Number(v) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDt = (v?: string | null) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
};

export const timeAgo = (v?: string | null) => {
  if (!v) return "";
  const diff = Date.now() - new Date(v).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function ApprovalCenter({
  mine = false,
  defaultStatus = "",
  onNeedRules,
}: {
  mine?: boolean;
  defaultStatus?: string;
  onNeedRules?: () => void;
}) {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(defaultStatus);
  const [entity, setEntity] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Detail Drawer / Modal
  const [detail, setDetail] = useState<ApprovalRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Actions
  const [act, setAct] = useState<{
    kind: "approve" | "reject" | "escalate" | "cancel";
    row: ApprovalRow;
  } | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (mine) q.set("mine", "1");
      const res = await api.get<{ data: ApprovalRow[] }>(`/v1/approvals?${q.toString()}`);
      setRows(res.data || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load approval requests", "error");
    } finally {
      setLoading(false);
    }
  }, [mine]);

  useEffect(() => {
    load();
  }, [load]);

  // Filtered List
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (entity && r.entityType !== entity) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${r.requestNo} ${r.entityLabel ?? ""} ${r.entityType} ${r.summary ?? ""} ${r.entityNo ?? ""} ${r.submittedBy ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, status, entity, search]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      ESCALATED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };
    let pendingValue = 0;
    let totalValue = 0;

    for (const r of rows) {
      counts[r.status] = (counts[r.status] || 0) + 1;
      const amt = Number(r.amount || 0);
      totalValue += amt;
      if (r.status === "PENDING") {
        pendingValue += amt;
      }
    }

    const total = rows.length;
    const approvalRate = total > 0 ? Math.round((counts.APPROVED / total) * 100) : 100;

    return { counts, pendingValue, totalValue, total, approvalRate };
  }, [rows]);

  async function openDetail(row: ApprovalRow) {
    setDetail(row);
    setDetailLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/v1/approvals/${row.id}`);
      setDetail(res.data);
    } catch (err: any) {
      showToast(err?.message || "Failed to load details", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runAction() {
    if (!act) return;
    if (act.kind === "reject" && !comment.trim()) {
      showToast("A rejection comment is required explaining the reason.", "error");
      return;
    }
    if (act.kind === "cancel" && !comment.trim()) {
      showToast("A withdrawal reason is required.", "error");
      return;
    }

    setBusyId(act.row.id);
    try {
      const ep = `/v1/approvals/${act.row.id}/${act.kind}`;
      const body = act.kind === "cancel" ? { reason: comment } : { comment };
      const res = await api.post<{ data: any }>(ep, body);
      showToast(
        `Request #${act.row.requestNo} has been ${act.kind === "approve" ? "approved" : act.kind === "reject" ? "rejected" : act.kind === "escalate" ? "escalated" : "withdrawn"}.`,
        "success"
      );
      setAct(null);
      setComment("");
      if (detail?.id === act.row.id) {
        setDetail(null);
      }
      load();
    } catch (err: any) {
      showToast(err?.message || "Action execution failed", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function sweepTimeouts() {
    setSweeping(true);
    try {
      const res = await api.post<{ data: any }>("/v1/approvals/sweep-timeouts", {});
      const data = res.data || {};
      showToast(
        `SLA Timeout Sweep Completed: ${data.timeoutsFound ?? 0} evaluated, ${data.escalated ?? 0} escalated, ${data.final ?? 0} auto-finalized.`,
        "info"
      );
      load();
    } catch (err: any) {
      showToast(err?.message || "Timeout sweep failed", "error");
    } finally {
      setSweeping(false);
    }
  }

  // Quick Action Buttons
  const ActionCell = ({ row }: { row: ApprovalRow }) => (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => openDetail(row)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-primary-700 transition"
      >
        <Eye size={12} /> View
      </button>
      {row.status === "PENDING" && (
        <>
          <button
            onClick={() => {
              setAct({ kind: "approve", row });
              setComment("");
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100 transition"
          >
            <Check size={12} /> Approve
          </button>
          <button
            onClick={() => {
              setAct({ kind: "reject", row });
              setComment("");
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-100 transition"
          >
            <X size={12} /> Reject
          </button>
          <button
            onClick={() => {
              setAct({ kind: "escalate", row });
              setComment("");
            }}
            title="Escalate to next level"
            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50/80 px-2 py-1 text-xs font-semibold text-sky-700 shadow-xs hover:bg-sky-100 transition"
          >
            <ArrowUpRight size={12} />
          </button>
          <button
            onClick={() => {
              setAct({ kind: "cancel", row });
              setComment("");
            }}
            title="Cancel / Withdraw"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500 shadow-xs hover:bg-slate-200 transition"
          >
            <Ban size={12} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {message && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm font-medium shadow-sm transition-all animate-in fade-in-50 duration-200 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : message.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : message.type === "error" ? (
              <XCircle size={18} className="text-rose-600" />
            ) : (
              <AlertTriangle size={18} className="text-sky-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-500/20 shadow-xs">
              <GitMerge size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {mine ? "My Submitted Approvals" : "Approval Center & Action Queue"}
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                Single unified approval gateway governing all commercial price overrides, expenses, purchases, credit limits, and adjustments.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <CustomButton
            variant="outline"
            size="sm"
            onClick={sweepTimeouts}
            disabled={sweeping}
            className="border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
          >
            {sweeping ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} className="text-amber-600" />}
            <span>Sweep Timeouts</span>
          </CustomButton>

          <CustomButton
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </CustomButton>

          {onNeedRules && (
            <CustomButton
              size="sm"
              onClick={onNeedRules}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
            >
              <Settings size={13} />
              <span>Workflow Rules</span>
            </CustomButton>
          )}
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Card */}
        <div
          onClick={() => setStatus(status === "PENDING" ? "" : "PENDING")}
          className={`group cursor-pointer rounded-2xl border p-4.5 transition-all shadow-xs hover:shadow-md ${
            status === "PENDING"
              ? "border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20"
              : "border-slate-200/80 bg-white hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Decision</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight">{metrics.counts.PENDING}</span>
            <span className="text-xs text-slate-400 font-medium">pending items</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Pending volume:</span>
            <span className="font-bold text-slate-800">{taka(metrics.pendingValue)}</span>
          </div>
        </div>

        {/* Total Requests Card */}
        <div
          onClick={() => setStatus("")}
          className={`group cursor-pointer rounded-2xl border p-4.5 transition-all shadow-xs hover:shadow-md ${
            status === ""
              ? "border-primary-400 bg-primary-50/30 ring-2 ring-primary-400/20"
              : "border-slate-200/80 bg-white hover:border-primary-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Workflow Volume</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <Layers size={16} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.total}</span>
            <span className="text-xs text-slate-400 font-medium">total requests</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Total processed value:</span>
            <span className="font-bold text-slate-800">{taka(metrics.totalValue)}</span>
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setStatus(status === "APPROVED" ? "" : "APPROVED")}
          className={`group cursor-pointer rounded-2xl border p-4.5 transition-all shadow-xs hover:shadow-md ${
            status === "APPROVED"
              ? "border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-400/20"
              : "border-slate-200/80 bg-white hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Requests</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FileCheck2 size={16} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">{metrics.counts.APPROVED}</span>
            <span className="text-xs text-slate-400 font-medium">{metrics.approvalRate}% pass rate</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Escalated cases:</span>
            <span className="font-bold text-sky-700">{metrics.counts.ESCALATED}</span>
          </div>
        </div>

        {/* Rejected & Expired Card */}
        <div
          onClick={() => setStatus(status === "REJECTED" ? "" : "REJECTED")}
          className={`group cursor-pointer rounded-2xl border p-4.5 transition-all shadow-xs hover:shadow-md ${
            status === "REJECTED"
              ? "border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/20"
              : "border-slate-200/80 bg-white hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected & Expired</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <XCircle size={16} />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {metrics.counts.REJECTED + metrics.counts.EXPIRED}
            </span>
            <span className="text-xs text-slate-400 font-medium">declined / timeout</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Cancelled requests:</span>
            <span className="font-bold text-slate-700">{metrics.counts.CANCELLED}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "", label: "All Items", count: rows.length },
              { id: "PENDING", label: "Pending", count: metrics.counts.PENDING },
              { id: "APPROVED", label: "Approved", count: metrics.counts.APPROVED },
              { id: "REJECTED", label: "Rejected", count: metrics.counts.REJECTED },
              { id: "ESCALATED", label: "Escalated", count: metrics.counts.ESCALATED },
              { id: "CANCELLED", label: "Cancelled", count: metrics.counts.CANCELLED },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatus(st.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  status === st.id
                    ? "bg-primary-600 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    status === st.id ? "bg-white/25 text-white" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Entity Type selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search request #, submitter, item…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <CustomSelect
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              options={[
                { value: "", label: "All Entity Types" },
                ...ENTITIES.map((e) => ({ value: e.type, label: `${e.category}: ${e.label}` })),
              ]}
              containerClassName="w-56"
            />
          </div>
        </div>
      </div>

      {/* Approval Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-4 pr-3">Request Details</th>
                <th className="px-3 py-3.5">Category & Entity</th>
                <th className="px-3 py-3.5">Amount / Value</th>
                <th className="px-3 py-3.5">Workflow Progression</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-3 py-3.5">Submitted</th>
                <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 size={24} className="mx-auto animate-spin text-primary-500" />
                    <p className="mt-2 text-xs font-medium text-slate-500">Loading approval queue…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Inbox size={22} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">No approval requests found</p>
                    <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                      {status || entity || search
                        ? "Try clearing filters to view more approval transactions."
                        : "Operations below threshold levels execute automatically without requiring manual review."}
                    </p>
                    {(status || entity || search) && (
                      <button
                        onClick={() => {
                          setStatus("");
                          setEntity("");
                          setSearch("");
                        }}
                        className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                  const Icon = cfg.icon;
                  const pct = r.totalLevels ? Math.min(((r.approvedLevels || 0) / r.totalLevels) * 100, 100) : 0;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => openDetail(r)}
                      className="group cursor-pointer hover:bg-slate-50/70 transition"
                    >
                      {/* Request Details */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-primary-600 transition">
                            #{r.requestNo}
                          </span>
                        </div>
                        <p className="mt-0.5 max-w-[280px] truncate text-xs text-slate-600" title={r.summary || ""}>
                          {r.summary || "No summary provided"}
                        </p>
                        {r.submittedBy && (
                          <p className="mt-0.5 text-[11px] text-slate-400 flex items-center gap-1">
                            <User size={10} /> By: {r.submittedBy}
                          </p>
                        )}
                      </td>

                      {/* Entity & Type */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {r.entityLabel ?? r.entityType}
                          </span>
                        </div>
                        {r.entityNo && (
                          <p className="mt-0.5 text-[11px] font-mono text-slate-400">Ref: #{r.entityNo}</p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3.5">
                        <span className="text-xs font-bold text-slate-900">{taka(r.amount)}</span>
                      </td>

                      {/* Workflow Progression */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                            <span>Level {r.currentLevel}</span>
                            {r.totalLevels && <span className="text-slate-400">of {r.totalLevels}</span>}
                          </div>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                            {r.currentRole || "ANY"}
                          </span>
                        </div>
                        {r.totalLevels ? (
                          <div className="mt-1.5 flex h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="bg-primary-500 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.badgeCls}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotCls}`} />
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-3 py-3.5">
                        <p className="text-xs font-medium text-slate-700">{fmtDt(r.createdAt)}</p>
                        <p className="text-[11px] text-slate-400">{timeAgo(r.createdAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right">
                        <ActionCell row={r} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Detail Drawer / Modal ─── */}
      <CustomModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Approval Request #${detail?.requestNo ?? ""}`}
      >
        {detailLoading ? (
          <div className="py-12 text-center">
            <Loader2 size={24} className="mx-auto animate-spin text-primary-500" />
            <p className="mt-2 text-xs font-medium text-slate-500">Retrieving approval ledger & history…</p>
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {/* Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Target Entity</p>
                <p className="mt-1 font-bold text-xs text-slate-800">{detail.entityLabel ?? detail.entityType}</p>
                {detail.entityNo && <p className="text-[11px] font-mono text-slate-500">#{detail.entityNo}</p>}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Evaluated Value</p>
                <p className="mt-1 font-extrabold text-sm text-slate-900">{taka(detail.amount)}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current Stage</p>
                <p className="mt-1 font-bold text-xs text-slate-800">
                  Tier {detail.currentLevel} · {detail.currentRole || "ANY"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      (STATUS_CONFIG[detail.status] || STATUS_CONFIG.PENDING).badgeCls
                    }`}
                  >
                    <span>{detail.status}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Summary description */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Change Description</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{detail.summary || "No description provided"}</p>
            </div>

            {/* Visual Step-by-Step Approval Chain */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GitMerge size={14} className="text-primary-600" />
                  Approval Audit Trail & Chain of Custody
                </p>
                {detail.expiresAt && detail.status === "PENDING" && (
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 flex items-center gap-1">
                    <Clock size={11} /> Auto-escalate at: {fmtDt(detail.expiresAt)}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {(detail.steps || []).map((s: StepRow, idx: number) => {
                  const isCurrent = s.level === detail.currentLevel && detail.status === "PENDING";
                  const sCfg = STEP_STATUS_CONFIG[s.status] || STEP_STATUS_CONFIG.PENDING;

                  return (
                    <div
                      key={s.id || idx}
                      className={`relative flex items-start gap-3 rounded-xl border p-3 transition ${
                        isCurrent
                          ? "border-amber-300 bg-amber-50/40 ring-2 ring-amber-300/20"
                          : s.status === "APPROVED"
                          ? "border-emerald-200 bg-emerald-50/20"
                          : s.status === "REJECTED"
                          ? "border-rose-200 bg-rose-50/20"
                          : "border-slate-100 bg-slate-50/50"
                      }`}
                    >
                      {/* Step index badge */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          s.status === "APPROVED"
                            ? "bg-emerald-600 text-white"
                            : s.status === "REJECTED"
                            ? "bg-rose-600 text-white"
                            : s.status === "ESCALATED"
                            ? "bg-sky-600 text-white"
                            : isCurrent
                            ? "bg-amber-500 text-white animate-pulse"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {s.status === "APPROVED" ? (
                          <Check size={14} />
                        ) : s.status === "REJECTED" ? (
                          <X size={14} />
                        ) : (
                          s.level
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              Level {s.level}: Role {s.role || "AUTHORITY"}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-bold border ${sCfg.bg} ${sCfg.text} ${sCfg.border}`}
                            >
                              {s.status}
                            </span>
                          </div>
                          {s.actedAt && (
                            <span className="text-[11px] text-slate-400">{fmtDt(s.actedAt)}</span>
                          )}
                        </div>

                        {s.actedBy && (
                          <p className="mt-0.5 text-xs text-slate-600">
                            Acted by: <span className="font-semibold text-slate-800">{s.actedBy}</span>
                          </p>
                        )}

                        {s.comment && (
                          <div className="mt-1.5 rounded-lg bg-white p-2 border border-slate-100 text-xs text-slate-700 italic">
                            “{s.comment}”
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(!detail.steps || detail.steps.length === 0) && (
                  <p className="text-xs text-slate-400 py-3 text-center">No explicit step chain recorded</p>
                )}
              </div>
            </div>

            {/* Proposed Payload Inspection */}
            {detail.payload && Object.keys(detail.payload).length > 0 && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-primary-600" />
                  Proposed Commercial Change Payload
                </p>
                <div className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-slate-100">
                  <pre className="font-mono text-[11px] leading-relaxed">
                    {JSON.stringify(detail.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons inside Drawer */}
            {detail.status === "PENDING" && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAct({ kind: "cancel", row: detail });
                    setComment("");
                  }}
                  className="text-slate-600"
                >
                  <Ban size={13} /> Withdraw
                </CustomButton>

                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAct({ kind: "escalate", row: detail });
                    setComment("");
                  }}
                  className="text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100"
                >
                  <ArrowUpRight size={13} /> Escalate Level
                </CustomButton>

                <CustomButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setAct({ kind: "reject", row: detail });
                    setComment("");
                  }}
                >
                  <XCircle size={13} /> Reject Request
                </CustomButton>

                <CustomButton
                  size="sm"
                  onClick={() => {
                    setAct({ kind: "approve", row: detail });
                    setComment("");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle2 size={13} /> Approve Request
                </CustomButton>
              </div>
            )}
          </div>
        ) : null}
      </CustomModal>

      {/* ─── Action Confirmation Modal ─── */}
      <CustomModal
        open={!!act}
        onClose={() => setAct(null)}
        title={`${
          act?.kind === "approve"
            ? "Approve Request"
            : act?.kind === "reject"
            ? "Reject Request"
            : act?.kind === "escalate"
            ? "Escalate to Next Level"
            : "Withdraw / Cancel Request"
        } — #${act?.row.requestNo ?? ""}`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-700">
            <p className="font-bold text-slate-900">{act?.row.entityLabel ?? act?.row.entityType}</p>
            <p className="mt-0.5 text-slate-600">{act?.row.summary}</p>
            <p className="mt-1 font-semibold text-slate-800">Evaluated Value: {taka(act?.row.amount)}</p>
          </div>

          {act?.kind === "reject" ? (
            <CustomInput
              label="Rejection Reason (Required) *"
              value={comment}
              onChange={(e: any) => setComment(e.target.value)}
              placeholder="e.g. Price variance exceeds maximum allowed threshold of 5%."
            />
          ) : act?.kind === "cancel" ? (
            <CustomInput
              label="Reason for Withdrawal (Required) *"
              value={comment}
              onChange={(e: any) => setComment(e.target.value)}
              placeholder="e.g. Quotation revised by client."
            />
          ) : (
            <CustomInput
              label="Approval / Escalation Note (Optional)"
              value={comment}
              onChange={(e: any) => setComment(e.target.value)}
              placeholder="Add an audit note for subsequent tiers…"
            />
          )}

          {act?.kind === "escalate" && (
            <p className="text-xs text-slate-500 bg-sky-50 border border-sky-100 rounded-lg p-2.5">
              Escalating will mark the current tier as bypassed and immediately promote the approval request to Tier{" "}
              {(act?.row.currentLevel || 1) + 1}.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setAct(null)}>
              Cancel
            </CustomButton>
            <CustomButton
              variant={act?.kind === "reject" || act?.kind === "cancel" ? "danger" : "primary"}
              disabled={busyId === act?.row.id}
              onClick={runAction}
              className={act?.kind === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            >
              {busyId === act?.row.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  {act?.kind === "approve" ? (
                    <CheckCircle2 size={14} />
                  ) : act?.kind === "reject" ? (
                    <XCircle size={14} />
                  ) : act?.kind === "escalate" ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <Ban size={14} />
                  )}
                  <span>
                    Confirm {act?.kind[0].toUpperCase()}
                    {act?.kind.slice(1)}
                  </span>
                </>
              )}
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
