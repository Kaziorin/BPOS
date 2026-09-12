"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Wallet,
  Clock,
  ArrowUpDown,
  Lock,
  Unlock,
  Eye,
  X,
  CheckCircle2,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  FileText,
  TrendingUp,
  Percent,
  Copy,
  Check,
  Building2,
  Banknote,
  RotateCcw,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { api } from "@/lib/api";

interface AgingBucket {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90plus: number;
  total: number;
}

interface AgingCustomer {
  customerId: string;
  customerName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  currentDue: number;
  availableCredit: number;
  utilizationPct: number;
  isOnCreditHold: boolean;
  creditPeriodDays?: number | null;
  openInvoices: number;
  aging: AgingBucket;
  status: string;
  isHighRisk: boolean;
}

interface AgingStats {
  totalCustomers: number;
  totalOutstanding: number;
  currentAmount: number;
  overdueTotal: number;
  highRiskCount: number;
  onHoldCount: number;
}

export default function AgingReportPage() {
  const [rows, setRows] = useState<AgingCustomer[]>([]);
  const [totals, setTotals] = useState<AgingBucket>({
    current: 0,
    days1_30: 0,
    days31_60: 0,
    days61_90: 0,
    days90plus: 0,
    total: 0,
  });
  const [stats, setStats] = useState<AgingStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBucket, setActiveBucket] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals & Drawers
  const [selectedCustomer, setSelectedCustomer] = useState<AgingCustomer | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedForDrawer, setSelectedForDrawer] = useState<AgingCustomer | null>(null);

  // Quick Collect Form State
  const [collectAmount, setCollectAmount] = useState<string>("");
  const [collectMethod, setCollectMethod] = useState<string>("CASH");
  const [collectRef, setCollectRef] = useState<string>("");
  const [collectNote, setCollectNote] = useState<string>("");
  const [submittingCollect, setSubmittingCollect] = useState(false);

  // Reminder Form State
  const [reminderChannel, setReminderChannel] = useState<"SMS" | "WHATSAPP" | "EMAIL">("SMS");
  const [reminderTemplate, setReminderTemplate] = useState<string>("polite");
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAgingData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (activeBucket !== "ALL") params.set("bucket", activeBucket);

      const res: any = await api.get(`/api/v1/credit/aging?${params.toString()}`);
      const data: AgingCustomer[] = res?.data ?? [];
      const summary: AgingBucket = res?.summary ?? {
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90plus: 0,
        total: 0,
      };
      const apiStats: AgingStats = res?.stats ?? {
        totalCustomers: data.length,
        totalOutstanding: summary.total,
        currentAmount: summary.current,
        overdueTotal: summary.days1_30 + summary.days31_60 + summary.days61_90 + summary.days90plus,
        highRiskCount: data.filter((d) => d.isHighRisk).length,
        onHoldCount: data.filter((d) => d.isOnCreditHold).length,
      };

      setRows(data);
      setTotals(summary);
      setStats(apiStats);
    } catch (err) {
      console.error("Failed to load AR aging data:", err);
      showToast("Failed to load AR aging data", "error");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeBucket]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgingData();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchAgingData]);

  // Client-side sorting
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === "total") {
        valA = a.aging.total;
        valB = b.aging.total;
      } else if (sortBy === "days90plus") {
        valA = a.aging.days90plus;
        valB = b.aging.days90plus;
      } else if (sortBy === "current") {
        valA = a.aging.current;
        valB = b.aging.current;
      } else if (sortBy === "creditLimit") {
        valA = a.creditLimit;
        valB = b.creditLimit;
      } else if (sortBy === "name") {
        valA = a.customerName.toLowerCase();
        valB = b.customerName.toLowerCase();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortBy, sortDir]);

  const fmt = (n: number) =>
    `৳${(n || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const pct = (n: number) =>
    totals.total > 0 ? `${(((n || 0) / totals.total) * 100).toFixed(1)}%` : "0%";

  // Toggle Credit Hold Action
  const handleToggleHold = async (customer: AgingCustomer) => {
    const nextHold = !customer.isOnCreditHold;
    const actionName = nextHold ? "freeze credit for" : "release credit hold for";
    if (!confirm(`Are you sure you want to ${actionName} "${customer.customerName}"?`)) return;

    try {
      await api.post(`/api/v1/credit/${customer.customerId}/hold`, { onHold: nextHold });
      showToast(`Credit ${nextHold ? "frozen" : "reactivated"} for ${customer.customerName}`);
      fetchAgingData();
    } catch (err: any) {
      showToast(err?.message || "Failed to update credit hold status", "error");
    }
  };

  // Submit Quick Collect
  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      showToast("Please enter a valid collection amount", "error");
      return;
    }

    setSubmittingCollect(true);
    try {
      await api.post("/api/v1/payments", {
        customerId: selectedCustomer.customerId,
        amount: amt,
        paymentMethod: collectMethod,
        referenceNo: collectRef || `COL-${Date.now().toString().slice(-6)}`,
        note: collectNote || "Collected via AR Aging Management",
      });
      showToast(`Payment of ৳${amt.toLocaleString()} recorded successfully!`);
      setShowCollectModal(false);
      setSelectedCustomer(null);
      setCollectAmount("");
      setCollectRef("");
      setCollectNote("");
      fetchAgingData();
    } catch (err: any) {
      showToast(err?.message || "Failed to record payment", "error");
    } finally {
      setSubmittingCollect(false);
    }
  };

  // Reminder Message Generator
  const reminderMessage = useMemo(() => {
    if (!selectedCustomer) return "";
    const name = selectedCustomer.customerName;
    const due = fmt(selectedCustomer.currentDue || selectedCustomer.aging.total);
    const overdue90 = selectedCustomer.aging.days90plus > 0 ? fmt(selectedCustomer.aging.days90plus) : null;

    if (reminderTemplate === "urgent" || overdue90) {
      return `Dear ${name}, this is an urgent reminder from our Accounts Dept. You have an overdue balance of ${due}${
        overdue90 ? ` (with ${overdue90} overdue beyond 90 days)` : ""
      }. Please settle this balance immediately to avoid disruption in services or credit hold. Thank you.`;
    }
    if (reminderTemplate === "firm") {
      return `Dear ${name}, reminder that your outstanding account balance is ${due}. Kindly arrange payment at your earliest convenience to keep your credit limit active. Thank you.`;
    }
    return `Dear ${name}, greeting from our team. We would like to remind you that your current outstanding balance is ${due}. Thank you for your valued business.`;
  }, [selectedCustomer, reminderTemplate]);

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopiedReminder(true);
    showToast("Reminder message copied to clipboard!");
    setTimeout(() => setCopiedReminder(false), 2000);
  };

  const handleSendReminderAction = () => {
    if (!selectedCustomer) return;
    if (reminderChannel === "WHATSAPP" && selectedCustomer.phone) {
      const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, "");
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMessage)}`;
      window.open(url, "_blank");
    } else if (reminderChannel === "EMAIL" && selectedCustomer.email) {
      const url = `mailto:${selectedCustomer.email}?subject=${encodeURIComponent(
        "Outstanding Statement Reminder"
      )}&body=${encodeURIComponent(reminderMessage)}`;
      window.open(url, "_blank");
    } else {
      handleCopyReminder();
    }
    setShowReminderModal(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (rows.length === 0) {
      showToast("No records to export", "error");
      return;
    }
    const headers = [
      "Customer ID",
      "Customer Name",
      "Phone",
      "Email",
      "Credit Limit",
      "Current Balance",
      "Current (0-30d)",
      "1-30 Days",
      "31-60 Days",
      "61-90 Days",
      "90+ Days",
      "Total Outstanding",
      "Status",
      "Credit Hold",
    ];

    const csvRows = rows.map((r) => [
      `"${r.customerId}"`,
      `"${r.customerName.replace(/"/g, '""')}"`,
      `"${r.phone || ""}"`,
      `"${r.email || ""}"`,
      r.creditLimit,
      r.currentDue,
      r.aging.current,
      r.aging.days1_30,
      r.aging.days31_60,
      r.aging.days61_90,
      r.aging.days90plus,
      r.aging.total,
      `"${r.status}"`,
      r.isOnCreditHold ? "YES" : "NO",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AR_Aging_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${rows.length} accounts to CSV!`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
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

      {/* ── TOP BANNER / HEADER (THEME COMPLIANT) ── */}
      <div className="border-b border-slate-200/80 bg-white px-4 sm:px-6 py-5 shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/25">
                <Calendar size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    AR Aging Report & Overdue Recovery
                  </h1>
                  <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-700 ring-1 ring-primary-200">
                    Risk & Collections
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Accounts receivable aging analysis · Default risk scorecards · Multi-channel overdue recovery
                </p>
              </div>
            </div>
          </div>

          {/* Navigation & Action Links */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/credit"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              <ChevronLeft size={14} className="text-slate-500" />
              Credit Overview
            </Link>

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

            <button
              onClick={() => fetchAgingData()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
              title="Refresh Aging Data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : "text-slate-500"} />
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
            >
              <Download size={14} className="text-slate-500" />
              Export
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs shadow-primary-500/25 transition hover:bg-primary-700 active:scale-95"
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-5 space-y-5">
        {/* ── AGING SUMMARY SCORECARD CARDS (THEME TOKEN COMPLIANT) ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Total Outstanding AR */}
          <div className="rounded-2xl border border-primary-200/80 bg-gradient-to-br from-primary-50/80 via-white to-sky-50/40 p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-primary-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600">Total Outstanding</span>
              <div className="rounded-lg bg-primary-100/80 p-1.5 text-primary-700">
                <DollarSign size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {loading ? "—" : fmt(totals.total)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>{rows.length} Accounts</span>
              <span className="text-primary-700">100% AR</span>
            </div>
          </div>

          {/* 2. Current / 0-30 Days */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Current (0–30d)</span>
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-emerald-700">
              {loading ? "—" : fmt(totals.current)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
              <span>Within terms</span>
              <span>{pct(totals.current)}</span>
            </div>
          </div>

          {/* 3. 1-30 Days Overdue */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">1–30 Days</span>
              <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-amber-700">
              {loading ? "—" : fmt(totals.days1_30)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-amber-600">
              <span>Mild Risk</span>
              <span>{pct(totals.days1_30)}</span>
            </div>
          </div>

          {/* 4. 31-60 Days Overdue */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">31–60 Days</span>
              <div className="rounded-lg bg-orange-50 p-1.5 text-orange-600">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-orange-700">
              {loading ? "—" : fmt(totals.days31_60)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-orange-600">
              <span>Moderate</span>
              <span>{pct(totals.days31_60)}</span>
            </div>
          </div>

          {/* 5. 61-90 Days Overdue */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">61–90 Days</span>
              <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                <ShieldAlert size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-rose-700">
              {loading ? "—" : fmt(totals.days61_90)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-rose-600">
              <span>High Risk</span>
              <span>{pct(totals.days61_90)}</span>
            </div>
          </div>

          {/* 6. 90+ Days Overdue */}
          <div className="rounded-2xl border border-red-200/80 bg-red-50/40 p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-red-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">90+ Days Critical</span>
              <div className="rounded-lg bg-red-100 p-1.5 text-red-700">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-red-700">
              {loading ? "—" : fmt(totals.days90plus)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-red-700">
              <span>Bad Debt Alert</span>
              <span>{pct(totals.days90plus)}</span>
            </div>
          </div>
        </div>

        {/* ── FILTER TABS, SEARCH & CONTROLS ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort & View Toggle */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="total">Total AR Balance</option>
                  <option value="days90plus">90+ Days Overdue</option>
                  <option value="current">Current Balance</option>
                  <option value="creditLimit">Credit Limit</option>
                  <option value="name">Customer Name</option>
                </select>
                <button
                  onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                  className="ml-1 text-slate-500 hover:text-primary-600 font-bold"
                  title="Toggle Sort Direction"
                >
                  {sortDir === "desc" ? "↓" : "↑"}
                </button>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === "table"
                      ? "bg-white text-primary-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Table View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-primary-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bucket filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
            {[
              { id: "ALL", label: "All Accounts", count: rows.length },
              { id: "CURRENT", label: "Current (0-30d)" },
              { id: "1_30", label: "1–30 Days" },
              { id: "31_60", label: "31–60 Days" },
              { id: "61_90", label: "61–90 Days" },
              { id: "90_PLUS", label: "90+ Days Critical" },
              { id: "OVERDUE", label: "All Overdue (>0d)" },
              { id: "HIGH_RISK", label: "High Risk", count: stats?.highRiskCount },
              { id: "HOLD", label: "Credit Frozen", count: stats?.onHoldCount },
            ].map((tab) => {
              const isActive = activeBucket === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBucket(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary-600 text-white shadow-xs shadow-primary-500/20"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── AGING TABLE OR GRID VIEW ── */}
        {viewMode === "table" ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer & Account</th>
                    <th className="py-3.5 px-3 text-right">Credit Limit</th>
                    <th className="py-3.5 px-3 text-right text-emerald-700">Current (0–30)</th>
                    <th className="py-3.5 px-3 text-right text-amber-700">1–30 Days</th>
                    <th className="py-3.5 px-3 text-right text-orange-700">31–60 Days</th>
                    <th className="py-3.5 px-3 text-right text-rose-700">61–90 Days</th>
                    <th className="py-3.5 px-3 text-right font-bold text-red-700">90+ Days</th>
                    <th className="py-3.5 px-4 text-right font-bold text-slate-900">Total Outstanding</th>
                    <th className="py-3.5 px-3 text-center">Status / Hold</th>
                    <th className="py-3.5 px-4 text-center">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                        Loading AR aging records...
                      </td>
                    </tr>
                  ) : sortedRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No customer accounts matching current aging filters.
                      </td>
                    </tr>
                  ) : (
                    sortedRows.map((r) => {
                      const has90Plus = r.aging.days90plus > 0;
                      const has61_90 = r.aging.days61_90 > 0;

                      return (
                        <tr
                          key={r.customerId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            r.isOnCreditHold ? "bg-rose-50/30" : ""
                          }`}
                        >
                          {/* Customer & Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => setSelectedForDrawer(r)}
                                className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 font-bold text-xs flex items-center justify-center border border-primary-100 shrink-0 hover:bg-primary-100 transition-colors"
                                title="Open Customer Statement"
                              >
                                {r.customerName.charAt(0).toUpperCase()}
                              </button>
                              <div className="min-w-0">
                                <button
                                  onClick={() => setSelectedForDrawer(r)}
                                  className="font-semibold text-slate-900 hover:text-primary-600 text-left block truncate max-w-[180px] sm:max-w-[220px]"
                                >
                                  {r.customerName}
                                </button>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                                  {r.phone && <span>{r.phone}</span>}
                                  {r.creditPeriodDays && (
                                    <span className="text-slate-400">
                                      • {r.creditPeriodDays}d term
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Credit Limit */}
                          <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                            {fmt(r.creditLimit)}
                          </td>

                          {/* Current 0-30 */}
                          <td className="py-3.5 px-3 text-right text-emerald-700 font-medium">
                            {r.aging.current > 0 ? fmt(r.aging.current) : "—"}
                          </td>

                          {/* 1-30 */}
                          <td className="py-3.5 px-3 text-right text-amber-700 font-medium">
                            {r.aging.days1_30 > 0 ? fmt(r.aging.days1_30) : "—"}
                          </td>

                          {/* 31-60 */}
                          <td className="py-3.5 px-3 text-right text-orange-700 font-medium">
                            {r.aging.days31_60 > 0 ? fmt(r.aging.days31_60) : "—"}
                          </td>

                          {/* 61-90 */}
                          <td className="py-3.5 px-3 text-right text-rose-700 font-medium">
                            {r.aging.days61_90 > 0 ? fmt(r.aging.days61_90) : "—"}
                          </td>

                          {/* 90+ Days */}
                          <td className="py-3.5 px-3 text-right font-bold text-red-700 bg-red-50/40">
                            {r.aging.days90plus > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                {fmt(r.aging.days90plus)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Total Due */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-bold text-slate-900 text-sm">
                              {fmt(r.aging.total)}
                            </div>
                            {r.aging.total > 0 && totals.total > 0 && (
                              <div className="text-[10px] text-slate-400">
                                {((r.aging.total / totals.total) * 100).toFixed(1)}% of AR
                              </div>
                            )}
                          </td>

                          {/* Status / Hold */}
                          <td className="py-3.5 px-3 text-center">
                            {r.isOnCreditHold ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                <Lock className="w-2.5 h-2.5" /> Hold
                              </span>
                            ) : has90Plus ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                Critical
                              </span>
                            ) : has61_90 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Risk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(r);
                                  setCollectAmount(r.currentDue ? String(r.currentDue) : String(r.aging.total));
                                  setShowCollectModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                title="Collect Payment"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(r);
                                  setShowReminderModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors"
                                title="Send Reminder"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleHold(r)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  r.isOnCreditHold
                                    ? "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                                title={r.isOnCreditHold ? "Release Credit Hold" : "Freeze Credit"}
                              >
                                {r.isOnCreditHold ? (
                                  <Unlock className="w-3.5 h-3.5" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setSelectedForDrawer(r)}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                                title="View Statement & History"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer with Overall Totals */}
                {sortedRows.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-xs sm:text-sm text-slate-900">
                    <tr>
                      <td className="py-4 px-4 uppercase tracking-wider">PORTFOLIO TOTAL</td>
                      <td className="py-4 px-3 text-right">
                        {fmt(sortedRows.reduce((sum, r) => sum + r.creditLimit, 0))}
                      </td>
                      <td className="py-4 px-3 text-right text-emerald-700">
                        {fmt(totals.current)}
                      </td>
                      <td className="py-4 px-3 text-right text-amber-700">
                        {fmt(totals.days1_30)}
                      </td>
                      <td className="py-4 px-3 text-right text-orange-700">
                        {fmt(totals.days31_60)}
                      </td>
                      <td className="py-4 px-3 text-right text-rose-700">
                        {fmt(totals.days61_90)}
                      </td>
                      <td className="py-4 px-3 text-right text-red-700 bg-red-50/60">
                        {fmt(totals.days90plus)}
                      </td>
                      <td className="py-4 px-4 text-right text-primary-700 text-base font-black">
                        {fmt(totals.total)}
                      </td>
                      <td colSpan={2} className="py-4 px-4 text-center text-xs text-slate-500">
                        {sortedRows.length} Accounts Included
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          /* ── GRID / CARD VIEW ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                Loading AR aging cards...
              </div>
            ) : sortedRows.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                No customer accounts matching current aging filters.
              </div>
            ) : (
              sortedRows.map((r) => {
                const total = r.aging.total || 1;
                const curPct = (r.aging.current / total) * 100;
                const d30Pct = (r.aging.days1_30 / total) * 100;
                const d60Pct = (r.aging.days31_60 / total) * 100;
                const d90Pct = (r.aging.days61_90 / total) * 100;
                const d90PlusPct = (r.aging.days90plus / total) * 100;

                return (
                  <div
                    key={r.customerId}
                    className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 hover:border-primary-300 transition-all ${
                      r.isOnCreditHold ? "border-rose-300 bg-rose-50/20" : "border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 font-bold text-sm flex items-center justify-center border border-primary-100">
                          {r.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{r.customerName}</h3>
                          <p className="text-xs text-slate-400">{r.phone || "No phone registered"}</p>
                        </div>
                      </div>
                      {r.isOnCreditHold ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Hold
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Total & Limit */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Total Outstanding</span>
                        <div className="font-bold text-slate-900 text-base">{fmt(r.aging.total)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Credit Limit</span>
                        <div className="font-semibold text-slate-700 mt-0.5">{fmt(r.creditLimit)}</div>
                      </div>
                    </div>

                    {/* Multi-color Aging Distribution Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Aging Distribution</span>
                        <span className="font-medium text-slate-700">
                          {r.aging.days90plus > 0
                            ? `৳${r.aging.days90plus.toLocaleString()} in 90+`
                            : "No 90+ Default"}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {curPct > 0 && <div style={{ width: `${curPct}%` }} className="bg-emerald-500 h-full" />}
                        {d30Pct > 0 && <div style={{ width: `${d30Pct}%` }} className="bg-amber-400 h-full" />}
                        {d60Pct > 0 && <div style={{ width: `${d60Pct}%` }} className="bg-orange-500 h-full" />}
                        {d90Pct > 0 && <div style={{ width: `${d90Pct}%` }} className="bg-rose-500 h-full" />}
                        {d90PlusPct > 0 && <div style={{ width: `${d90PlusPct}%` }} className="bg-red-600 h-full" />}
                      </div>
                    </div>

                    {/* Aging Bucket Grid */}
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px] pt-1 border-t border-slate-100">
                      <div className="p-1.5 bg-emerald-50/60 rounded-lg text-emerald-800">
                        <div className="opacity-70">0–30</div>
                        <div className="font-bold mt-0.5">{r.aging.current > 0 ? fmt(r.aging.current) : "0"}</div>
                      </div>
                      <div className="p-1.5 bg-amber-50/60 rounded-lg text-amber-800">
                        <div className="opacity-70">1–30</div>
                        <div className="font-bold mt-0.5">{r.aging.days1_30 > 0 ? fmt(r.aging.days1_30) : "0"}</div>
                      </div>
                      <div className="p-1.5 bg-orange-50/60 rounded-lg text-orange-800">
                        <div className="opacity-70">31–60</div>
                        <div className="font-bold mt-0.5">{r.aging.days31_60 > 0 ? fmt(r.aging.days31_60) : "0"}</div>
                      </div>
                      <div className="p-1.5 bg-rose-50/60 rounded-lg text-rose-800">
                        <div className="opacity-70">61–90</div>
                        <div className="font-bold mt-0.5">{r.aging.days61_90 > 0 ? fmt(r.aging.days61_90) : "0"}</div>
                      </div>
                      <div className="p-1.5 bg-red-100/70 rounded-lg text-red-800 font-bold">
                        <div className="opacity-70">90+</div>
                        <div className="mt-0.5">{r.aging.days90plus > 0 ? fmt(r.aging.days90plus) : "0"}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(r);
                          setCollectAmount(r.currentDue ? String(r.currentDue) : String(r.aging.total));
                          setShowCollectModal(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Collect Due
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(r);
                          setShowReminderModal(true);
                        }}
                        className="p-2 text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all"
                        title="Send Reminder"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedForDrawer(r)}
                        className="p-2 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                        title="View Customer Statement"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── QUICK COLLECT PAYMENT MODAL ── */}
      {showCollectModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Collect Due Payment</h3>
                  <p className="text-xs text-slate-400">{selectedCustomer.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Total Outstanding AR</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {fmt(selectedCustomer.aging.total || selectedCustomer.currentDue)}
                  </div>
                </div>
                {selectedCustomer.aging.days90plus > 0 && (
                  <div className="text-right">
                    <span className="text-red-500 font-semibold">90+ Critical Due</span>
                    <div className="font-bold text-red-700 text-sm">
                      {fmt(selectedCustomer.aging.days90plus)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collection Amount (৳) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-900"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reference / Slip No
                  </label>
                  <input
                    type="text"
                    value={collectRef}
                    onChange={(e) => setCollectRef(e.target.value)}
                    placeholder="e.g. TR-994102"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collection Notes
                </label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  placeholder="e.g. Cleared via AR Aging settlement"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCollect}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {submittingCollect ? "Processing..." : "Confirm & Post Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SEND REMINDER MODAL ── */}
      {showReminderModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Send Payment Reminder</h3>
                  <p className="text-xs text-slate-400">{selectedCustomer.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notification Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "SMS", label: "SMS Gateway", icon: MessageSquare },
                    { id: "WHATSAPP", label: "WhatsApp", icon: Phone },
                    { id: "EMAIL", label: "Email Notice", icon: Mail },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setReminderChannel(ch.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        reminderChannel === ch.id
                          ? "bg-primary-50 border-primary-300 text-primary-700 shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <ch.icon className="w-3.5 h-3.5" />
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reminder Template
                </label>
                <select
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="polite">Friendly Reminder (Gentle)</option>
                  <option value="firm">Standard Statement (Firm)</option>
                  <option value="urgent">Critical Overdue Notice (Urgent)</option>
                </select>
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Message Preview</label>
                  <button
                    onClick={handleCopyReminder}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                  >
                    {copiedReminder ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Text
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-mono">
                  {reminderMessage}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminderAction}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-xs shadow-primary-500/20"
                >
                  {reminderChannel === "WHATSAPP"
                    ? "Open WhatsApp"
                    : reminderChannel === "EMAIL"
                    ? "Open Email Client"
                    : "Send / Copy Reminder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER STATEMENT SLIDE-OVER DRAWER ── */}
      {selectedForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center border border-primary-100">
                  {selectedForDrawer.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedForDrawer.customerName}</h3>
                  <p className="text-xs text-slate-400">{selectedForDrawer.phone || "No phone"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedForDrawer(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats in Drawer */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-primary-50/70 border border-primary-100 rounded-xl">
                <span className="text-xs text-primary-700 font-semibold">Total Outstanding</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {fmt(selectedForDrawer.aging.total)}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs text-slate-500 font-semibold">Credit Limit</span>
                <div className="text-xl font-bold text-slate-800 mt-1">
                  {fmt(selectedForDrawer.creditLimit)}
                </div>
              </div>
            </div>

            {/* Aging Distribution */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Aging Breakdown
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-emerald-50 rounded-xl text-emerald-900">
                  <span>Current (0–30 Days)</span>
                  <span className="font-bold">{fmt(selectedForDrawer.aging.current)}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-amber-50 rounded-xl text-amber-900">
                  <span>1–30 Days Overdue</span>
                  <span className="font-bold">{fmt(selectedForDrawer.aging.days1_30)}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-orange-50 rounded-xl text-orange-900">
                  <span>31–60 Days Overdue</span>
                  <span className="font-bold">{fmt(selectedForDrawer.aging.days31_60)}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-rose-50 rounded-xl text-rose-900">
                  <span>61–90 Days Overdue</span>
                  <span className="font-bold">{fmt(selectedForDrawer.aging.days61_90)}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-red-100 rounded-xl text-red-900 font-bold">
                  <span>90+ Days Critical</span>
                  <span>{fmt(selectedForDrawer.aging.days90plus)}</span>
                </div>
              </div>
            </div>

            {/* Customer Contact details */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Customer Profile
              </h4>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedForDrawer.email || "No email on record"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Standard terms: {selectedForDrawer.creditPeriodDays || 30} days</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>Status: {selectedForDrawer.isOnCreditHold ? "Credit Frozen" : "Good Standing"}</span>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  setSelectedCustomer(selectedForDrawer);
                  setCollectAmount(
                    selectedForDrawer.currentDue
                      ? String(selectedForDrawer.currentDue)
                      : String(selectedForDrawer.aging.total)
                  );
                  setShowCollectModal(true);
                }}
                className="w-full py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Collect Payment for this Account
              </button>
              <button
                onClick={() => {
                  setSelectedCustomer(selectedForDrawer);
                  setShowReminderModal(true);
                }}
                className="w-full py-2.5 text-xs sm:text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Overdue Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
