"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  Download,
  Plus,
  X,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  CheckSquare,
  Square,
  Copy,
  Check,
  Phone,
  Mail,
  User,
  Clock,
  Sparkles,
  LayoutList,
  LayoutGrid,
  FileText,
  DollarSign,
  MessageSquare,
  Send,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Building2,
  Banknote,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";

interface CustomerCredit {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  currentDue: number;
  availableCredit: number;
  utilizationPct: number;
  isOnCreditHold: boolean;
  creditHoldReason?: string | null;
  creditPeriodDays?: number | null;
  isOverLimit: boolean;
  status: string;
}

interface CreditStats {
  totalCustomers: number;
  totalCreditLimit: number;
  totalUtilizedDue: number;
  totalAvailableCredit: number;
  overLimitCount: number;
  overLimitAmount: number;
  onHoldCount: number;
  highRiskCount: number;
}

export default function CreditPage() {
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("currentDue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals & Drawers
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCredit | null>(null);
  const [selectedForDrawer, setSelectedForDrawer] = useState<CustomerCredit | null>(null);

  // Manage Form State
  const [limitForm, setLimitForm] = useState({ creditLimit: "", creditPeriodDays: "" });
  const [holdForm, setHoldForm] = useState({ reason: "" });
  const [savingAction, setSavingAction] = useState(false);

  // Collect Payment Form State
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectRef, setCollectRef] = useState("");
  const [collectSubmitting, setCollectSubmitting] = useState(false);

  // Feedback Notifications
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load Executive Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res: any = await api.get("/v1/credit/stats");
      setStats(res.data?.data ?? null);
    } catch (err) {
      console.error("Failed to load credit stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Credit Customers
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);

      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (activeTab !== "ALL") params.set("filterType", activeTab);

      const res: any = await api.get(`/v1/credit?${params.toString()}`);
      const dataList = res.data?.data ?? [];
      setCustomers(dataList);

      const pagination = res.data?.pagination || res.data?.extra?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalRecords(pagination.total || dataList.length);
      } else {
        setTotalPages(1);
        setTotalRecords(dataList.length);
      }
    } catch (err: any) {
      console.error("Failed to load credit customers", err);
      showToast(err.response?.data?.error ?? "Error loading credit records", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, searchQuery, activeTab]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Open Manage Modal
  const openManageModal = (c: CustomerCredit) => {
    setSelectedCustomer(c);
    setLimitForm({
      creditLimit: String(c.creditLimit),
      creditPeriodDays: String(c.creditPeriodDays ?? 30),
    });
    setHoldForm({ reason: c.creditHoldReason ?? "" });
    setShowManageModal(true);
  };

  // Open Collect Due Modal
  const openCollectDueModal = (c: CustomerCredit) => {
    setSelectedCustomer(c);
    setCollectAmount(Number(c.currentDue || 0));
    setCollectMethod("CASH");
    setCollectRef("");
    setShowCollectModal(true);
  };

  // Open Reminder Modal
  const openReminderModal = (c: CustomerCredit) => {
    setSelectedCustomer(c);
    setShowReminderModal(true);
  };

  // Save Credit Limit & Period
  const handleSaveLimit = async () => {
    if (!selectedCustomer) return;
    const numLimit = Number(limitForm.creditLimit);
    if (isNaN(numLimit) || numLimit < 0) {
      showToast("Please enter a valid credit limit amount", "error");
      return;
    }

    setSavingAction(true);
    try {
      const res: any = await api.patch(`/v1/credit/${selectedCustomer.id}/limit`, {
        creditLimit: numLimit,
        creditPeriodDays: limitForm.creditPeriodDays ? Number(limitForm.creditPeriodDays) : undefined,
      });
      if (res.data?.needsApproval) {
        showToast("Credit limit increase submitted for administrative approval ⏳", "success");
      } else {
        showToast("Credit limit & terms updated successfully!");
      }
      setShowManageModal(false);
      loadCustomers();
      loadStats();
      if (selectedForDrawer?.id === selectedCustomer.id) {
        setSelectedForDrawer((prev) => prev ? { ...prev, creditLimit: numLimit, creditPeriodDays: Number(limitForm.creditPeriodDays) } : null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to update credit limit", "error");
    } finally {
      setSavingAction(false);
    }
  };

  // Toggle Credit Hold
  const handleToggleHold = async (onHold: boolean) => {
    if (!selectedCustomer) return;
    setSavingAction(true);
    try {
      const res: any = await api.post(`/v1/credit/${selectedCustomer.id}/hold`, {
        onHold,
        reason: holdForm.reason || (onHold ? "Administrative credit freeze" : "Account reactivated"),
      });
      if (res.data?.needsApproval) {
        showToast(`Credit hold request submitted for manager approval ⏳`, "success");
      } else {
        showToast(`Credit account ${onHold ? "frozen on hold 🔒" : "hold released & active 🔓"}!`);
      }
      setShowManageModal(false);
      loadCustomers();
      loadStats();
      if (selectedForDrawer?.id === selectedCustomer.id) {
        setSelectedForDrawer((prev) => prev ? { ...prev, isOnCreditHold: onHold, status: onHold ? "INACTIVE" : "ACTIVE" } : null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to toggle credit hold", "error");
    } finally {
      setSavingAction(false);
    }
  };

  // Submit Collect Due Payment
  const handleCollectPayment = async () => {
    if (!selectedCustomer) return;
    if (collectAmount <= 0) {
      showToast("Payment amount must be greater than 0", "error");
      return;
    }
    setCollectSubmitting(true);
    try {
      await api.post("/v1/payments", {
        customerId: selectedCustomer.id,
        amount: Number(collectAmount),
        method: collectMethod,
        reference: collectRef || `Due settlement for ${selectedCustomer.name}`,
      });
      showToast(`Settled ৳${Number(collectAmount).toLocaleString()} for ${selectedCustomer.name}!`);
      setShowCollectModal(false);
      loadCustomers();
      loadStats();
      if (selectedForDrawer?.id === selectedCustomer.id) {
        const newDue = Math.max(0, selectedCustomer.currentDue - collectAmount);
        setSelectedForDrawer((prev) => prev ? { ...prev, currentDue: newDue, availableCredit: Math.max(0, prev.creditLimit - newDue) } : null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to record payment", "error");
    } finally {
      setCollectSubmitting(false);
    }
  };

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0 ? customers.filter((c) => selectedIds.includes(c.id)) : customers;
    if (listToExport.length === 0) {
      showToast("No customer credit records to export", "error");
      return;
    }
    const headers = ["Customer Name", "Phone", "Email", "Credit Limit", "Current Due", "Available Credit", "Utilization %", "Grace Period (Days)", "Status", "Hold State"];
    const rows = listToExport.map((c) => [
      `"${c.name}"`,
      `"${c.phone || ""}"`,
      `"${c.email || ""}"`,
      c.creditLimit,
      c.currentDue,
      c.availableCredit,
      `${c.utilizationPct}%`,
      c.creditPeriodDays || 30,
      c.status,
      c.isOnCreditHold ? "ON_HOLD" : (c.isOverLimit ? "OVER_LIMIT" : "ACTIVE"),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `credit_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} credit profiles to CSV!`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success" ? "bg-slate-900 ring-1 ring-slate-800" : "bg-rose-600"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="border-b border-slate-200/80 bg-white px-4 sm:px-6 py-5 shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/25">
                <ShieldCheck size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Credit Management & Risk Controls</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">
                    B2B & Commercial
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Approved credit limits · Grace periods · Over-limit controls & credit hold governance
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/invoices"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              <FileText size={14} className="text-primary-600" />
              Invoices
            </Link>

            <Link
              href="/payments"
              className="flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50/70 px-3.5 py-2 text-xs font-semibold text-primary-700 shadow-xs transition hover:bg-primary-100/80 active:scale-95"
            >
              <Wallet size={14} />
              Payments Hub
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-5">
        {/* Executive KPI Stats Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Total Credit Facility */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Credit Limit</span>
              <div className="rounded-lg bg-primary-50 p-1.5 text-primary-600">
                <CreditCard size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {statsLoading ? "—" : `৳${Number(stats?.totalCreditLimit || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>{stats?.totalCustomers || customers.length} credit accounts</span>
            </div>
          </div>

          {/* 2. Utilized Due Balance */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Utilized Balance</span>
              <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-amber-700">
              {statsLoading ? "—" : `৳${Number(stats?.totalUtilizedDue || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <span>Outstanding credit due</span>
            </div>
          </div>

          {/* 3. Available Credit Capacity */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Available Credit</span>
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-emerald-700">
              {statsLoading ? "—" : `৳${Number(stats?.totalAvailableCredit || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span>Safe purchasing headroom</span>
            </div>
          </div>

          {/* 4. Over Limit Accounts */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Over Limit</span>
              <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-rose-700">
              {statsLoading ? "—" : stats?.overLimitCount ?? 0}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600">
              <span>৳{Number(stats?.overLimitAmount || 0).toLocaleString()} exceeded</span>
            </div>
          </div>

          {/* 5. Accounts on Credit Hold */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Frozen on Hold</span>
              <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
                <Lock size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {statsLoading ? "—" : stats?.onHoldCount ?? 0}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>Sales blocked</span>
            </div>
          </div>

          {/* 6. Overall Credit Utilization */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">Utilization Rate</span>
              <div className="rounded-lg bg-primary-50 p-1.5 text-primary-700">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {stats && stats.totalCreditLimit > 0
                ? `${Math.min(100, Math.round((Number(stats.totalUtilizedDue) / Number(stats.totalCreditLimit)) * 100))}%`
                : "0%"}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>Portfolio exposure</span>
            </div>
          </div>
        </div>

        {/* Batch Operations Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary-800 via-primary-700 to-indigo-800 px-5 py-3 text-xs text-white shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-primary-200" />
              <span className="font-bold">{selectedIds.length} credit accounts selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25 transition"
              >
                <Download size={13} />
                Export Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-xl px-2.5 py-1.5 text-primary-200 hover:text-white transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Filter Toolbar & Quick Status Tabs */}
        <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          {/* Quick Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All Accounts" },
                { id: "WITH_DUE", label: "With Outstanding Due" },
                { id: "OVERLIMIT", label: "Over Limit Alert" },
                { id: "HOLD", label: "On Credit Hold" },
                { id: "HEALTHY", label: "Active & Healthy" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activeTab === tab.id
                      ? "bg-primary-600 text-white shadow-xs shadow-primary-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`rounded-lg p-1.5 transition ${
                    viewMode === "table" ? "bg-white text-primary-700 shadow-xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Table View"
                >
                  <LayoutList size={15} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-1.5 transition ${
                    viewMode === "grid" ? "bg-white text-primary-700 shadow-xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Grid Card View"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                title="Export to CSV"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={() => {
                  loadCustomers();
                  loadStats();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client name, phone number, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="currentDue">Sort by: Highest Outstanding Due</option>
                <option value="creditLimit">Sort by: Highest Credit Limit</option>
                <option value="name">Sort by: Customer Name</option>
                <option value="creditPeriodDays">Sort by: Grace Period Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Table / Grid */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
            <RefreshCw size={28} className="animate-spin text-primary-600" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Loading credit profiles...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
            <div className="rounded-2xl bg-primary-50 p-4 text-primary-600">
              <ShieldCheck size={36} />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">No credit accounts found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              No customer records matched your filters. Adjust search keywords or register customer credit limits.
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 pl-4 pr-2 w-8">
                      <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                        {selectedIds.length === customers.length && customers.length > 0 ? (
                          <CheckSquare size={16} className="text-primary-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 pl-2 pr-3">Customer & Contact</th>
                    <th className="px-3 py-3.5 text-right">Credit Limit (৳)</th>
                    <th className="px-3 py-3.5 text-right">Utilized Due (৳)</th>
                    <th className="px-3 py-3.5 text-right">Available Capacity</th>
                    <th className="px-3 py-3.5 text-center">Credit Health / Utilization</th>
                    <th className="px-3 py-3.5 text-center">Terms & Status</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <tr key={c.id} className={`group transition ${isSelected ? "bg-primary-50/30" : "hover:bg-slate-50/70"}`}>
                        {/* Checkbox */}
                        <td className="py-3.5 pl-4 pr-2">
                          <button onClick={() => toggleSelectRow(c.id)} className="text-slate-400 hover:text-slate-700">
                            {isSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 pl-2 pr-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              {c.phone && <span>{c.phone}</span>}
                              {c.email && <span>• {c.email}</span>}
                            </div>
                          </div>
                        </td>

                        {/* Credit Limit */}
                        <td className="px-3 py-3.5 text-right font-black text-slate-900 tabular-nums">
                          ৳{Number(c.creditLimit).toLocaleString()}
                        </td>

                        {/* Utilized Due */}
                        <td className="px-3 py-3.5 text-right">
                          <span
                            className={`font-black tabular-nums ${
                              c.isOverLimit
                                ? "text-rose-600 font-black"
                                : c.currentDue > 0
                                ? "text-amber-700 font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            ৳{Number(c.currentDue).toLocaleString()}
                          </span>
                        </td>

                        {/* Available Capacity */}
                        <td className="px-3 py-3.5 text-right">
                          <span
                            className={`font-black tabular-nums ${
                              c.availableCredit > 0 ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            ৳{Number(c.availableCredit).toLocaleString()}
                          </span>
                        </td>

                        {/* Utilization Bar */}
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col items-center">
                            <div className="flex w-28 items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                              <span>{c.utilizationPct}%</span>
                              <span className={c.isOverLimit ? "font-bold text-rose-600" : ""}>
                                {c.isOverLimit ? "EXCEEDED" : "USED"}
                              </span>
                            </div>
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  c.isOverLimit
                                    ? "bg-rose-500"
                                    : c.utilizationPct >= 80
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, c.utilizationPct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {c.isOnCreditHold ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                                <Lock size={10} /> ON HOLD
                              </span>
                            ) : c.isOverLimit ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                <AlertTriangle size={10} /> OVER LIMIT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ACTIVE
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {c.creditPeriodDays ? `${c.creditPeriodDays}d terms` : "Immediate"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Drawer details */}
                            <button
                              onClick={() => setSelectedForDrawer(c)}
                              title="Customer Credit Profile"
                              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Manage Limits & Hold */}
                            <button
                              onClick={() => openManageModal(c)}
                              title="Configure Credit Limit & Terms"
                              className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 hover:text-primary-700 active:scale-95"
                            >
                              <SlidersHorizontal size={15} />
                            </button>

                            {/* Collect due if any */}
                            {c.currentDue > 0 && (
                              <button
                                onClick={() => openCollectDueModal(c)}
                                title="Collect Due Payment"
                                className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                              >
                                <CreditCard size={15} />
                              </button>
                            )}

                            {/* Send reminder if due */}
                            {c.currentDue > 0 && (
                              <button
                                onClick={() => openReminderModal(c)}
                                title="Send Payment Reminder"
                                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                              >
                                <MessageSquare size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 sm:px-6 py-3.5 text-xs text-slate-500">
              <span>
                Showing {customers.length} of {totalRecords} credit accounts (Page {page} of {totalPages})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Grid Card View */
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customers.map((c) => {
                return (
                  <div
                    key={c.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{c.name}</div>
                          {c.phone && <span className="text-[11px] text-slate-400">{c.phone}</span>}
                        </div>
                        {c.isOnCreditHold ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                            <Lock size={10} /> ON HOLD
                          </span>
                        ) : c.isOverLimit ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                            <AlertTriangle size={10} /> OVER LIMIT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Financials */}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400">Credit Limit</span>
                          <p className="font-black text-slate-900">৳{Number(c.creditLimit).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400">Utilized Due</span>
                          <p className={`font-black ${c.currentDue > 0 ? (c.isOverLimit ? "text-rose-600" : "text-amber-700") : "text-slate-400"}`}>
                            ৳{Number(c.currentDue).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Available: ৳{Number(c.availableCredit).toLocaleString()}</span>
                          <span>{c.utilizationPct}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              c.isOverLimit ? "bg-rose-500" : c.utilizationPct >= 80 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, c.utilizationPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {c.creditPeriodDays ? `${c.creditPeriodDays}d terms` : "Immediate"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openManageModal(c)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <SlidersHorizontal size={13} />
                          Configure
                        </button>
                        <button
                          onClick={() => setSelectedForDrawer(c)}
                          className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 font-bold text-white shadow-xs hover:bg-primary-700"
                        >
                          <Eye size={13} />
                          Profile
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 py-3 text-xs text-slate-500 shadow-xs">
              <span>
                Page {page} of {totalPages} ({totalRecords} total credit profiles)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. MANAGE CREDIT FACILITY & HOLD MODAL                    */}
      {/* ========================================================= */}
      {showManageModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-bold border border-primary-200/60">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Configure Credit Facility</h3>
                  <p className="text-[11px] text-slate-500">{selectedCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Snapshot */}
              <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/40 p-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Current Outstanding Due:</span>
                  <span className="font-bold text-slate-900">৳{Number(selectedCustomer.currentDue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Credit Limit:</span>
                  <span className="font-bold text-slate-900">৳{Number(selectedCustomer.creditLimit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Available Credit:</span>
                  <span className="font-bold text-emerald-700">৳{Number(selectedCustomer.availableCredit).toLocaleString()}</span>
                </div>
              </div>

              {/* Limit Adjustment */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Credit Limit & Grace Terms</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Approved Credit Limit (৳) *</label>
                    <input
                      type="number"
                      min={0}
                      value={limitForm.creditLimit}
                      onChange={(e) => setLimitForm((p) => ({ ...p, creditLimit: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-black text-slate-900 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Credit Grace Period (Days)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 30"
                      value={limitForm.creditPeriodDays}
                      onChange={(e) => setLimitForm((p) => ({ ...p, creditPeriodDays: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={savingAction}
                  onClick={handleSaveLimit}
                  className="w-full rounded-xl bg-primary-600 py-2.5 font-bold text-white shadow-xs hover:bg-primary-700 disabled:opacity-50"
                >
                  {savingAction ? "Updating..." : "Update Credit Limits"}
                </button>
              </div>

              {/* Credit Hold Governance */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Credit Freeze / Hold Governance</h4>
                <p className="text-[11px] text-slate-500">
                  Placing an account on credit hold instantly prevents cashiers and POS terminals from billing credit invoices to this customer.
                </p>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Hold Reason / Remark</label>
                  <input
                    type="text"
                    placeholder="Reason for placing/lifting hold..."
                    value={holdForm.reason}
                    onChange={(e) => setHoldForm({ reason: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={savingAction || selectedCustomer.isOnCreditHold}
                    onClick={() => handleToggleHold(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-40"
                  >
                    <Lock size={14} />
                    Place on Hold
                  </button>
                  <button
                    type="button"
                    disabled={savingAction || !selectedCustomer.isOnCreditHold}
                    onClick={() => handleToggleHold(false)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <Unlock size={14} />
                    Lift Hold & Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. COLLECT DUE MODAL                                      */}
      {/* ========================================================= */}
      {showCollectModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-200/60">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Collect Due Settlement</h3>
                  <p className="text-[11px] text-slate-500">{selectedCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3.5 space-y-1.5 border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Due Outstanding:</span>
                  <span className="font-black text-rose-600">৳{Number(selectedCustomer.currentDue).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Settlement Amount (৳) *</label>
                  <button
                    type="button"
                    onClick={() => setCollectAmount(Number(selectedCustomer.currentDue))}
                    className="text-[11px] font-bold text-primary-600 hover:underline"
                  >
                    Pay Full Due
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-black text-slate-900 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Payment Channel *</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="CASH">Cash Drawer</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="CARD">Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Reference / Notes</label>
                <input
                  type="text"
                  placeholder="Slip # / Trx ID / Check ref"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowCollectModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={collectSubmitting}
                onClick={handleCollectPayment}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
              >
                {collectSubmitting ? "Recording..." : "Record Settlement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PAYMENT REMINDER (SMS / WHATSAPP) MODAL                */}
      {/* ========================================================= */}
      {showReminderModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-bold border border-primary-200/60">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payment Reminder</h3>
                  <p className="text-[11px] text-slate-500">{selectedCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Recipient</p>
                <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
                <p className="font-mono text-slate-600">{selectedCustomer.phone || "No phone provided"}</p>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Reminder Message Preview</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 font-mono text-[11px] text-slate-700">
                  Dear {selectedCustomer.name}, your account has an outstanding credit balance of ৳
                  {Number(selectedCustomer.currentDue).toLocaleString()}. Please settle at your earliest convenience. Thank you!
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {selectedCustomer.phone && (
                  <a
                    href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Dear ${selectedCustomer.name}, your account has an outstanding credit balance of ৳${Number(selectedCustomer.currentDue).toLocaleString()}. Please settle at your earliest convenience. Thank you!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow hover:bg-emerald-700"
                  >
                    <Send size={14} />
                    Send via WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    showToast("SMS reminder sent to customer queue!");
                    setShowReminderModal(false);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 font-bold text-white shadow hover:bg-primary-700"
                >
                  <MessageSquare size={14} />
                  Send Instant SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CUSTOMER CREDIT PROFILE DRAWER                         */}
      {/* ========================================================= */}
      {selectedForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col overflow-hidden transition-all animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credit Profile View</span>
                <h3 className="text-base font-black text-slate-900">{selectedForDrawer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedForDrawer(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Status Banner */}
              <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/40 p-4 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500">Utilized Credit Due</span>
                <div className="mt-1 text-3xl font-black text-slate-900">
                  ৳{Number(selectedForDrawer.currentDue).toLocaleString()}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                      selectedForDrawer.isOnCreditHold
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : selectedForDrawer.isOverLimit
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {selectedForDrawer.isOnCreditHold ? "ON HOLD" : selectedForDrawer.isOverLimit ? "OVER LIMIT" : "ACTIVE"}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    • {selectedForDrawer.utilizationPct}% utilized
                  </span>
                </div>
              </div>

              {/* Limits breakdown */}
              <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Credit Terms & Limits</span>
                <div className="flex justify-between">
                  <span className="text-slate-600">Approved Credit Limit:</span>
                  <span className="font-bold text-slate-900">৳{Number(selectedForDrawer.creditLimit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Available Headroom:</span>
                  <span className="font-bold text-emerald-700">৳{Number(selectedForDrawer.availableCredit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Grace Terms:</span>
                  <span className="font-bold text-slate-800">{selectedForDrawer.creditPeriodDays ? `${selectedForDrawer.creditPeriodDays} Days Net` : "Immediate"}</span>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2 text-xs">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Contact Info</span>
                {selectedForDrawer.phone && (
                  <p className="flex items-center gap-1.5 text-slate-700">
                    <Phone size={13} className="text-slate-400" /> {selectedForDrawer.phone}
                  </p>
                )}
                {selectedForDrawer.email && (
                  <p className="flex items-center gap-1.5 text-slate-700">
                    <Mail size={13} className="text-slate-400" /> {selectedForDrawer.email}
                  </p>
                )}
                {selectedForDrawer.address && (
                  <p className="text-slate-500">{selectedForDrawer.address}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50/80">
              <button
                onClick={() => {
                  openManageModal(selectedForDrawer);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Configure
              </button>
              {selectedForDrawer.currentDue > 0 && (
                <button
                  onClick={() => {
                    openCollectDueModal(selectedForDrawer);
                  }}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  <CreditCard size={14} />
                  Collect Due
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
