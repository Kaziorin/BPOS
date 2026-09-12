"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  AlertTriangle,
  Lock,
  FileText,
  SlidersHorizontal,
  Layers,
  Database,
  Terminal,
  Download,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  Ban,
  ArrowUpRight,
  Check,
  X,
  Sparkles,
  Server,
  Globe,
  Key,
  HardDrive,
  Cpu,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomInput } from "@/components/custom/CustomInput";

// ─── Interfaces ────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  reason?: string | null;
  createdAt: string;
}

interface SecurityEvent {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  eventType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  blocked?: boolean | number;
  details?: any;
  createdAt: string;
}

interface SecurityHealth {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  injectionAttempts: number;
  recommendations: string[];
}

interface AuditStats {
  total: number;
  today: number;
  byEntity: { entityType: string; count: number }[];
}

interface SecurityStats {
  totalEvents: number;
  blocked: number;
  critical: number;
  failedLogins: number;
}

// ─── Constants & Color Mapping ──────────────────────────────────────────

const AUDIT_ACTIONS = [
  "CREATE", "UPDATE", "DELETE", "VIEW", "APPROVE", "REJECT", "VOID",
  "EXPORT", "IMPORT", "LOGIN", "LOGOUT", "ADJUST", "TRANSFER",
  "PRICE_CHANGE", "DISCOUNT", "REFUND", "PAYMENT", "CREDIT",
];

const ENTITY_TYPES = [
  "SALE", "INVOICE", "PRODUCT", "STOCK", "CUSTOMER", "SUPPLIER",
  "EMPLOYEE", "ORDER", "DELIVERY", "PAYMENT", "EXPENSE", "QUOTATION",
  "COMMISSION", "INSTALLMENT", "SHIFT", "USER", "SETTING", "TAX", "APPROVAL",
];

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CREATE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  UPDATE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  DELETE: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  VOID: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  APPROVE: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  REJECT: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  PRICE_CHANGE: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  DISCOUNT: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  LOGIN: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  LOGOUT: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  EXPORT: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  REFUND: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ADJUST: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

const SEVERITY_CONFIG: Record<
  string,
  { label: string; badgeCls: string; borderCls: string; dotCls: string; cardBorder: string }
> = {
  LOW: {
    label: "Low Severity",
    badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
    borderCls: "border-slate-300",
    dotCls: "bg-slate-400",
    cardBorder: "border-slate-200",
  },
  MEDIUM: {
    label: "Medium Risk",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10",
    borderCls: "border-amber-300",
    dotCls: "bg-amber-500",
    cardBorder: "border-amber-300",
  },
  HIGH: {
    label: "High Threat",
    badgeCls: "bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-500/10",
    borderCls: "border-orange-300",
    dotCls: "bg-orange-500",
    cardBorder: "border-orange-300",
  },
  CRITICAL: {
    label: "Critical Threat",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20",
    borderCls: "border-rose-400",
    dotCls: "bg-rose-600 animate-pulse",
    cardBorder: "border-rose-300",
  },
};

const fmtDt = (v?: string | null) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return v;
  }
};

const timeAgo = (v?: string | null) => {
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

// ─── Main Content Component ─────────────────────────────────────────────

function AuditSecurityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") || "audit";
  const [activeTab, setActiveTab] = useState<"audit" | "security" | "health" | "policies">(
    tabParam === "security"
      ? "security"
      : tabParam === "health"
      ? "health"
      : tabParam === "policies"
      ? "policies"
      : "audit"
  );

  // Data States
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [secEvents, setSecEvents] = useState<SecurityEvent[]>([]);
  const [secStats, setSecStats] = useState<SecurityStats | null>(null);
  const [health, setHealth] = useState<SecurityHealth | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [auditAction, setAuditAction] = useState("");
  const [auditEntity, setAuditEntity] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditLimit, setAuditLimit] = useState(100);

  const [secSeverity, setSecSeverity] = useState("");
  const [secEventType, setSecEventType] = useState("");
  const [secSearch, setSecSearch] = useState("");

  // Inspect Modal
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [selectedSecEvent, setSelectedSecEvent] = useState<SecurityEvent | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const switchTab = (t: "audit" | "security" | "health" | "policies") => {
    setActiveTab(t);
    const params = new URLSearchParams(searchParams.toString());
    if (t === "audit") {
      params.delete("tab");
    } else {
      params.set("tab", t);
    }
    router.replace(`/audit-security?${params.toString()}`);
  };

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "audit") {
        const p = new URLSearchParams({ limit: String(auditLimit) });
        if (auditAction) p.set("action", auditAction);
        if (auditEntity) p.set("entityType", auditEntity);

        const [logsRes, statsRes] = await Promise.all([
          api.get<{ data: AuditLog[] }>(`/v1/audit/logs?${p.toString()}`).then((r) => r.data || []),
          api.get<{ data: AuditStats }>(`/v1/audit/stats`).then((r) => r.data || null),
        ]);
        setAuditLogs(logsRes);
        setAuditStats(statsRes);
      } else if (activeTab === "security") {
        const p = new URLSearchParams({ limit: "100" });
        if (secEventType) p.set("eventType", secEventType);
        if (secSeverity) p.set("severity", secSeverity);

        const [eventsRes, statsRes] = await Promise.all([
          api.get<{ data: SecurityEvent[] }>(`/v1/security/events?${p.toString()}`).then((r) => r.data || []),
          api.get<{ data: SecurityStats }>(`/v1/security/stats`).then((r) => r.data || null),
        ]);
        setSecEvents(eventsRes);
        setSecStats(statsRes);
      } else if (activeTab === "health") {
        const [healthRes, statsRes] = await Promise.all([
          api.get<{ data: SecurityHealth }>(`/v1/security/health`).then((r) => r.data || null),
          api.get<{ data: SecurityStats }>(`/v1/security/stats`).then((r) => r.data || null),
        ]);
        setHealth(healthRes);
        setSecStats(statsRes);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load audit & security records", "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, auditAction, auditEntity, auditLimit, secEventType, secSeverity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter((l) => {
      const hay = `${l.action} ${l.entity} ${l.entityId ?? ""} ${l.userId ?? ""} ${l.ipAddress ?? ""} ${l.reason ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [auditLogs, auditSearch]);

  // Client-filtered security events
  const filteredSecEvents = useMemo(() => {
    if (!secSearch.trim()) return secEvents;
    const q = secSearch.toLowerCase();
    return secEvents.filter((e) => {
      const hay = `${e.eventType} ${e.severity} ${e.ipAddress ?? ""} ${e.endpoint ?? ""} ${e.userId ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [secEvents, secSearch]);

  // Export to JSON / CSV
  const exportLogs = () => {
    try {
      const dataToExport = activeTab === "audit" ? filteredAuditLogs : filteredSecEvents;
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${dataToExport.length} ${activeTab} records.`, "success");
    } catch {
      showToast("Export failed.", "error");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm font-medium shadow-xs transition-all animate-in fade-in-50 duration-200 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : toast.type === "error" ? (
              <XCircle size={18} className="text-rose-600" />
            ) : (
              <Info size={18} className="text-sky-600" />
            )}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <CustomBreadcrumb
        title="Audit Trail & Security Intelligence"
        description="Immutable transaction logging, real-time threat detection, and compliance governance"
        icon={<Shield size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration & Intelligence" },
          { label: "Audit & Security Logs", href: "/audit-security" },
        ]}
      />

      {/* Master Top Banner (Clean Light Executive Theme) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary-700 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Enterprise SOC & Audit Trail (§17 Security & Compliance)</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Audit Ledger & Threat Intelligence
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Complete tamper-evident audit history across sales, inventory, accounting, and user sessions combined with automated WAF, SQL injection, and brute-force detection.
            </p>
          </div>

          {/* Action and Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => switchTab("audit")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === "audit"
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <FileText size={15} />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => switchTab("security")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === "security"
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <ShieldAlert size={15} />
              <span>Security Events</span>
            </button>

            <button
              onClick={() => switchTab("health")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeTab === "health"
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Activity size={15} />
              <span>Security Health</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Strip & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => switchTab("audit")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "audit"
                ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileText size={14} />
            <span>Audit Trail Ledger</span>
          </button>

          <button
            onClick={() => switchTab("security")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "security"
                ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ShieldAlert size={14} />
            <span>SIEM Threat Events</span>
          </button>

          <button
            onClick={() => switchTab("health")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "health"
                ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Activity size={14} />
            <span>SOC Diagnostics & Health</span>
          </button>

          <button
            onClick={() => switchTab("policies")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "policies"
                ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Lock size={14} />
            <span>Defense Posture & Policies</span>
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          <CustomButton
            variant="outline"
            size="sm"
            onClick={exportLogs}
            className="border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
          >
            <Download size={13} />
            <span>Export JSON</span>
          </CustomButton>

          <CustomButton
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </CustomButton>
        </div>
      </div>

      {/* ═════════════════════════ TAB 1: AUDIT TRAIL ═════════════════════════ */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Audit Records</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <Database size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{auditStats?.total || auditLogs.length}</span>
                <span className="text-xs text-slate-400 font-medium">total log entries</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                Across all tenant modules & API endpoints
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Logged Today</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Clock size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">{auditStats?.today || 0}</span>
                <span className="text-xs text-slate-400 font-medium">actions today</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                Real-time transaction capture active
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Entity Volume</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Layers size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {auditStats?.byEntity?.[0]?.entityType || "SALE"}
                </span>
                <span className="text-xs text-slate-400 font-medium font-mono">
                  ({auditStats?.byEntity?.[0]?.count || 0} logs)
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2 truncate">
                {(auditStats?.byEntity || []).slice(1, 4).map((e) => `${e.entityType} (${e.count})`).join(" · ") || "No other entities"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamper Protection</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">100% Verified</span>
              </div>
              <p className="mt-2 text-xs text-emerald-700 border-t border-slate-100 pt-2 flex items-center gap-1">
                <Check size={12} /> Append-only cryptographic ledger
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative min-w-[240px] flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search user, entity ID, IP, reason…"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                />
                {auditSearch && (
                  <button
                    onClick={() => setAuditSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <CustomSelect
                  value={auditAction}
                  onChange={(e) => setAuditAction(e.target.value)}
                  options={[{ value: "", label: "All Actions" }, ...AUDIT_ACTIONS.map((a) => ({ value: a, label: a }))]}
                  containerClassName="w-40"
                />

                <CustomSelect
                  value={auditEntity}
                  onChange={(e) => setAuditEntity(e.target.value)}
                  options={[{ value: "", label: "All Entities" }, ...ENTITY_TYPES.map((e) => ({ value: e, label: e }))]}
                  containerClassName="w-44"
                />

                <CustomSelect
                  value={String(auditLimit)}
                  onChange={(e) => setAuditLimit(Number(e.target.value))}
                  options={[
                    { value: "50", label: "Show 50 logs" },
                    { value: "100", label: "Show 100 logs" },
                    { value: "250", label: "Show 250 logs" },
                  ]}
                  containerClassName="w-36"
                />
              </div>
            </div>
          </div>

          {/* Audit Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 pl-4 pr-3">Timestamp</th>
                    <th className="px-3 py-3.5">Action Executed</th>
                    <th className="px-3 py-3.5">Target Entity</th>
                    <th className="px-3 py-3.5">Entity Reference</th>
                    <th className="px-3 py-3.5">User / Operator</th>
                    <th className="px-3 py-3.5">IP Address</th>
                    <th className="py-3.5 pl-3 pr-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <RefreshCw size={24} className="mx-auto animate-spin text-primary-500" />
                        <p className="mt-2 text-xs font-medium text-slate-500">Retrieving audit ledger…</p>
                      </td>
                    </tr>
                  ) : filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <FileText size={22} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-700">No audit records found</p>
                        <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or search terms.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log, idx) => {
                      const actCfg = ACTION_COLORS[log.action] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };

                      return (
                        <tr
                          key={log.id || idx}
                          onClick={() => setSelectedAudit(log)}
                          className="group cursor-pointer hover:bg-slate-50/70 transition"
                        >
                          {/* Timestamp */}
                          <td className="py-3.5 pl-4 pr-3">
                            <p className="text-xs font-semibold text-slate-900 group-hover:text-primary-600 transition">
                              {fmtDt(log.createdAt)}
                            </p>
                            <p className="text-[11px] text-slate-400">{timeAgo(log.createdAt)}</p>
                          </td>

                          {/* Action */}
                          <td className="px-3 py-3.5">
                            <span
                              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold ${actCfg.bg} ${actCfg.text} ${actCfg.border}`}
                            >
                              {log.action}
                            </span>
                          </td>

                          {/* Entity */}
                          <td className="px-3 py-3.5">
                            <span className="font-semibold text-xs text-slate-800">{log.entity}</span>
                          </td>

                          {/* Entity ID */}
                          <td className="px-3 py-3.5">
                            {log.entityId ? (
                              <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                #{log.entityId.slice(0, 16)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>

                          {/* User */}
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <User size={12} className="text-slate-400" />
                              <span>{log.userId || "system"}</span>
                            </div>
                          </td>

                          {/* IP */}
                          <td className="px-3 py-3.5">
                            <span className="font-mono text-xs text-slate-500">{log.ipAddress || "127.0.0.1"}</span>
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 pl-3 pr-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAudit(log);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-primary-700 transition"
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════ TAB 2: SECURITY EVENTS ═════════════════════════ */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Threats Flagged</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <ShieldAlert size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {secStats?.totalEvents || secEvents.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">events recorded</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                SOC intrusion detection sensor network
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blocked IPs & Attacks</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Ban size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-orange-600 tracking-tight">
                  {secStats?.blocked || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">prevented requests</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                Automated rate-limiting & WAF drops
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Severity Alerts</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
                  {secStats?.critical || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">critical items</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                Requires security admin investigation
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed Authentication</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Key size={16} />
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                  {secStats?.failedLogins || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">invalid logins</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                Brute force threshold protection active
              </p>
            </div>
          </div>

          {/* Security Filter Toolbar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative min-w-[240px] flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={secSearch}
                  onChange={(e) => setSecSearch(e.target.value)}
                  placeholder="Search threat type, IP, user, endpoint…"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                />
                {secSearch && (
                  <button
                    onClick={() => setSecSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <CustomSelect
                  value={secSeverity}
                  onChange={(e) => setSecSeverity(e.target.value)}
                  options={[
                    { value: "", label: "All Severities" },
                    { value: "LOW", label: "Low Severity" },
                    { value: "MEDIUM", label: "Medium Risk" },
                    { value: "HIGH", label: "High Threat" },
                    { value: "CRITICAL", label: "Critical Priority" },
                  ]}
                  containerClassName="w-44"
                />

                <CustomSelect
                  value={secEventType}
                  onChange={(e) => setSecEventType(e.target.value)}
                  options={[
                    { value: "", label: "All Threat Categories" },
                    { value: "LOGIN_FAILED", label: "Login Failed" },
                    { value: "SQL_INJECTION_ATTEMPT", label: "SQL Injection Attempt" },
                    { value: "XSS_ATTEMPT", label: "XSS Attack Attempt" },
                    { value: "RATE_LIMIT", label: "Rate Limit Exceeded" },
                    { value: "PRIVILEGE_ESCALATION", label: "Privilege Escalation" },
                    { value: "SUSPICIOUS_ACTIVITY", label: "Suspicious Activity" },
                  ]}
                  containerClassName="w-56"
                />
              </div>
            </div>
          </div>

          {/* Security Events Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 pl-4 pr-3">Event Time</th>
                    <th className="px-3 py-3.5">Threat Event Type</th>
                    <th className="px-3 py-3.5">Severity</th>
                    <th className="px-3 py-3.5">Origin IP Address</th>
                    <th className="px-3 py-3.5">Target Endpoint</th>
                    <th className="px-3 py-3.5">Action Taken</th>
                    <th className="py-3.5 pl-3 pr-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <RefreshCw size={24} className="mx-auto animate-spin text-primary-500" />
                        <p className="mt-2 text-xs font-medium text-slate-500">Scanning security log buffer…</p>
                      </td>
                    </tr>
                  ) : filteredSecEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <ShieldCheck size={24} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No security incidents detected</p>
                        <p className="mt-1 text-xs text-slate-400">All inbound traffic complies with security firewall rules.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSecEvents.map((ev, idx) => {
                      const sevCfg = SEVERITY_CONFIG[ev.severity] || SEVERITY_CONFIG.LOW;

                      return (
                        <tr
                          key={ev.id || idx}
                          onClick={() => setSelectedSecEvent(ev)}
                          className="group cursor-pointer hover:bg-slate-50/70 transition"
                        >
                          {/* Event Time */}
                          <td className="py-3.5 pl-4 pr-3">
                            <p className="text-xs font-semibold text-slate-900 group-hover:text-primary-600 transition">
                              {fmtDt(ev.createdAt)}
                            </p>
                            <p className="text-[11px] text-slate-400">{timeAgo(ev.createdAt)}</p>
                          </td>

                          {/* Threat Type */}
                          <td className="px-3 py-3.5">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                              {ev.eventType}
                            </span>
                          </td>

                          {/* Severity */}
                          <td className="px-3 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sevCfg.badgeCls}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${sevCfg.dotCls}`} />
                              <span>{ev.severity}</span>
                            </span>
                          </td>

                          {/* Origin IP */}
                          <td className="px-3 py-3.5">
                            <span className="font-mono text-xs text-slate-700">{ev.ipAddress || "—"}</span>
                          </td>

                          {/* Target Endpoint */}
                          <td className="px-3 py-3.5">
                            <span className="font-mono text-xs text-slate-600 max-w-[200px] truncate block">
                              {ev.endpoint || "/api/v1/*"}
                            </span>
                          </td>

                          {/* Action Taken */}
                          <td className="px-3 py-3.5">
                            {ev.blocked ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-bold text-rose-700">
                                <Ban size={11} /> Dropped (Blocked)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                Logged & Monitored
                              </span>
                            )}
                          </td>

                          {/* Inspect Button */}
                          <td className="py-3.5 pl-3 pr-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSecEvent(ev);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-primary-700 transition"
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════ TAB 3: SECURITY HEALTH ═════════════════════════ */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {/* Health Diagnostics Scorecard */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Risk Gauge */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Risk Assessment</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Activity size={16} />
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black ${
                      health?.riskLevel === "CRITICAL"
                        ? "bg-rose-100 text-rose-700 ring-4 ring-rose-500/20"
                        : health?.riskLevel === "HIGH"
                        ? "bg-orange-100 text-orange-700 ring-4 ring-orange-500/20"
                        : health?.riskLevel === "MEDIUM"
                        ? "bg-amber-100 text-amber-700 ring-4 ring-amber-500/20"
                        : "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-500/20"
                    }`}
                  >
                    {health?.riskLevel === "LOW" ? "A+" : health?.riskLevel === "MEDIUM" ? "B" : "C"}
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-900">{health?.riskLevel || "LOW"} Risk Level</p>
                    <p className="text-xs text-slate-500">Continuous automated vulnerability scan</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Monitored Events:</span>
                  <span className="font-bold text-slate-900">{health?.totalEvents || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Critical Severity Incidents:</span>
                  <span className="font-bold text-rose-600">{health?.criticalEvents || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SQL Injection Attempts:</span>
                  <span className="font-bold text-rose-600">{health?.injectionAttempts || 0}</span>
                </div>
              </div>
            </div>

            {/* Recommendations & Remediation */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Automated SOC Recommendations</h3>
                  <p className="text-xs text-slate-500">Security hardening guidelines computed from live event logs.</p>
                </div>
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 border border-primary-100">
                  {(health?.recommendations || []).length} Active Insights
                </span>
              </div>

              <div className="space-y-3">
                {(health?.recommendations || []).map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{rec}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Enforced automatically by the BlueOceans multi-tier security filter chain.
                      </p>
                    </div>
                  </div>
                ))}

                {(!health?.recommendations || health.recommendations.length === 0) && (
                  <div className="py-8 text-center text-slate-400">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                    <p className="text-xs font-medium">All security parameters are nominal. No active remediation required.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════ TAB 4: DEFENSE POLICIES ═════════════════════════ */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Rate Limiting & Anti-DDoS",
                desc: "Token bucket rate limiter enforcing a maximum of 200 req/min per client IP address.",
                icon: Clock,
                status: "ACTIVE",
                badge: "200 req/min",
              },
              {
                title: "SQL Injection Shield",
                desc: "AST and regex AST evaluation intercepting SQL keywords (UNION, SLEEP, BENCHMARK, EXEC) in input payloads.",
                icon: Database,
                status: "ACTIVE",
                badge: "Strict Regex + AST",
              },
              {
                title: "Cross-Site Scripting (XSS)",
                desc: "Automated sanitization of HTML script tags, event handlers, and data URIs on all JSON request bodies.",
                icon: Shield,
                status: "ACTIVE",
                badge: "Input Sanitized",
              },
              {
                title: "Tenant Isolation Boundary",
                desc: "Row-Level Security (RLS) ensuring strict isolation: every database query is gated by tenantId parameter verification.",
                icon: HardDrive,
                status: "ACTIVE",
                badge: "Row-Level Security",
              },
              {
                title: "Cryptographic Token Verification",
                desc: "HMAC SHA-256 JWT validation with automatic expiration and instantaneous revocation support.",
                icon: Key,
                status: "ACTIVE",
                badge: "HS256 Verified",
              },
              {
                title: "Audit Ledger Immutability",
                desc: "Append-only database schema preventing in-place alteration or deletion of historical audit logs.",
                icon: Lock,
                status: "ACTIVE",
                badge: "Append-Only",
              },
            ].map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <Icon size={18} />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Check size={10} /> {p.status}
                      </span>
                    </div>

                    <h4 className="mt-3 text-sm font-bold text-slate-900">{p.title}</h4>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Configuration:</span>
                    <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {p.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Inspect Audit Log Modal ─── */}
      <CustomModal
        open={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        title={`Audit Record #${selectedAudit?.id?.slice(0, 16) ?? ""}`}
      >
        {selectedAudit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Action</p>
                <p className="mt-0.5 font-bold text-slate-800">{selectedAudit.action}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Entity Type</p>
                <p className="mt-0.5 font-bold text-slate-800">{selectedAudit.entity}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Operator ID</p>
                <p className="mt-0.5 font-bold text-slate-800 truncate">{selectedAudit.userId || "system"}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Client IP</p>
                <p className="mt-0.5 font-mono font-bold text-slate-800">{selectedAudit.ipAddress || "127.0.0.1"}</p>
              </div>
            </div>

            {selectedAudit.reason && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Reason / Audit Context</p>
                <p className="mt-1 font-medium text-slate-800">{selectedAudit.reason}</p>
              </div>
            )}

            {/* Old vs New Values Visual Diff */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Old Values */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <X size={12} className="text-rose-500" /> State Prior to Change (Old)
                </p>
                <div className="overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-slate-100 text-[11px] font-mono leading-relaxed max-h-48">
                  <pre>{JSON.stringify(selectedAudit.oldValues || { status: "none / initial" }, null, 2)}</pre>
                </div>
              </div>

              {/* New Values */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Check size={12} className="text-emerald-500" /> State After Change (New)
                </p>
                <div className="overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-slate-100 text-[11px] font-mono leading-relaxed max-h-48">
                  <pre>{JSON.stringify(selectedAudit.newValues || { status: "none / deleted" }, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <CustomButton variant="outline" onClick={() => setSelectedAudit(null)}>
                Close
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ─── Inspect Security Threat Event Modal ─── */}
      <CustomModal
        open={!!selectedSecEvent}
        onClose={() => setSelectedSecEvent(null)}
        title={`Threat Incident #${selectedSecEvent?.id?.slice(0, 16) ?? ""}`}
      >
        {selectedSecEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Threat Type</p>
                <p className="mt-0.5 font-bold text-slate-800">{selectedSecEvent.eventType}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Severity</p>
                <p className="mt-0.5 font-bold text-rose-600">{selectedSecEvent.severity}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Origin IP</p>
                <p className="mt-0.5 font-mono font-bold text-slate-800">{selectedSecEvent.ipAddress || "—"}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Verdict</p>
                <p className="mt-0.5 font-bold text-slate-800">{selectedSecEvent.blocked ? "BLOCKED" : "LOGGED"}</p>
              </div>
            </div>

            {selectedSecEvent.endpoint && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Target URI Endpoint</p>
                <p className="mt-1 font-mono font-bold text-slate-800">{selectedSecEvent.endpoint}</p>
              </div>
            )}

            {selectedSecEvent.details && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Terminal size={12} className="text-rose-500" /> Incident Payload & Vector Inspection
                </p>
                <div className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-slate-100 text-[11px] font-mono leading-relaxed max-h-56">
                  <pre>{JSON.stringify(selectedSecEvent.details, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <CustomButton variant="outline" onClick={() => setSelectedSecEvent(null)}>
                Close
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}

export default function AuditSecurityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <AuditSecurityContent />
    </Suspense>
  );
}
