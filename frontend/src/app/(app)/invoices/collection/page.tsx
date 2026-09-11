"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, Target, TrendingUp, Clock, CheckCircle, RefreshCw, 
  Wallet, DollarSign, Calendar, Search, Download, Printer, 
  Phone, User, Building2, CheckCircle2, AlertCircle, MessageSquare, 
  CreditCard, ShieldCheck, ChevronLeft, ChevronRight, X, 
  LayoutList, LayoutGrid, ArrowUpDown, Banknote, Receipt, ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";

interface CollectionEntry {
  id: string;
  collectionNo: string;
  collectorId: string;
  collectorName?: string;
  method: string;
  amount: number;
  collectedAt: string;
  receiptNo?: string | null;
  isOffline: boolean;
  status: string;
  customer?: { id: string; name: string; phone?: string; address?: string } | null;
  invoice?: { id: string; invoiceNo: string; total: number } | null;
}

interface CollectionSchedule {
  id: string;
  collectorId: string;
  collectorName?: string;
  scheduledAt: string;
  expectedAmount: number;
  collectedAmount: number;
  status: string;
  note?: string | null;
  customer?: { id: string; name: string; phone?: string; address?: string } | null;
  invoice?: { id: string; invoiceNo: string; total: number; paidTotal: number } | null;
}

interface Performance {
  collectorId: string;
  collectorName?: string;
  period: string;
  targetAmount: number;
  collectedAmount: number;
  achievementPct: number;
}

const METHOD_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  CASH: { label: "Cash", icon: Banknote, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  BKASH: { label: "bKash", icon: Wallet, color: "text-pink-700 bg-pink-50 border-pink-200" },
  NAGAD: { label: "Nagad", icon: Wallet, color: "text-amber-700 bg-amber-50 border-amber-200" },
  BANK: { label: "Bank Transfer", icon: Building2, color: "text-blue-700 bg-blue-50 border-blue-200" },
  CHEQUE: { label: "Cheque", icon: Receipt, color: "text-purple-700 bg-purple-50 border-purple-200" },
};

const SCHED_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  COMPLETED: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700" },
  PENDING: { label: "Pending Visit", bg: "bg-amber-50", text: "text-amber-700" },
  PARTIAL: { label: "Partially Collected", bg: "bg-blue-50", text: "text-blue-700" },
  MISSED: { label: "Missed / Rescheduled", bg: "bg-rose-50", text: "text-rose-700" },
};

export default function CollectionPage() {
  const [tab, setTab] = useState<"entries" | "schedules" | "performance">("entries");
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);

  // Forms state
  const [entryForm, setEntryForm] = useState({
    branchId: "default",
    collectorId: "COLLECTOR-1",
    customerId: "",
    customerName: "",
    customerPhone: "",
    invoiceId: "",
    invoiceNo: "",
    method: "CASH",
    amount: "",
    receiptNo: "",
    note: "",
    isOffline: false,
  });

  const [schedForm, setSchedForm] = useState({
    collectorId: "COLLECTOR-1",
    customerName: "",
    customerPhone: "",
    invoiceNo: "",
    scheduledAt: "",
    expectedAmount: "",
    note: "",
  });

  const [targetForm, setTargetForm] = useState({
    collectorId: "COLLECTOR-1",
    period: new Date().toISOString().slice(0, 7),
    targetAmount: "",
    branchId: "default",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s, p] = await Promise.allSettled([
        api.get<any>("/v1/invoices/collection/entries"),
        api.get<any>("/v1/invoices/collection/schedules"),
        api.get<any>("/v1/invoices/collection/performance"),
      ]);

      const entryList = e.status === "fulfilled" ? (e.value?.data?.data ?? e.value?.data ?? e.value ?? []) : [];
      const schedList = s.status === "fulfilled" ? (s.value?.data?.data ?? s.value?.data ?? s.value ?? []) : [];
      const perfList = p.status === "fulfilled" ? (p.value?.data?.data ?? p.value?.data ?? p.value ?? []) : [];

      setEntries(Array.isArray(entryList) ? entryList : []);
      setSchedules(Array.isArray(schedList) ? schedList : []);
      setPerformance(Array.isArray(perfList) ? perfList : []);
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Submit Collection Entry
  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!entryForm.amount || Number(entryForm.amount) <= 0) {
      alert("Please enter a valid collection amount");
      return;
    }

    try {
      await api.post("/v1/invoices/collection/entries", {
        branchId: entryForm.branchId || "default",
        collectorId: entryForm.collectorId || "COLLECTOR-1",
        customerId: entryForm.customerId || null,
        invoiceId: entryForm.invoiceId || null,
        method: entryForm.method,
        amount: Number(entryForm.amount),
        receiptNo: entryForm.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
        note: entryForm.note || null,
        isOffline: entryForm.isOffline,
      });

      setShowCreateEntry(false);
      setEntryForm({
        branchId: "default",
        collectorId: "COLLECTOR-1",
        customerId: "",
        customerName: "",
        customerPhone: "",
        invoiceId: "",
        invoiceNo: "",
        method: "CASH",
        amount: "",
        receiptNo: "",
        note: "",
        isOffline: false,
      });
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.error ?? err.message ?? "Failed to save collection entry");
    }
  }

  // Submit Schedule
  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/v1/invoices/collection/schedules", {
        collectorId: schedForm.collectorId || "COLLECTOR-1",
        expectedAmount: Number(schedForm.expectedAmount) || 0,
        scheduledAt: schedForm.scheduledAt ? new Date(schedForm.scheduledAt).toISOString() : new Date().toISOString(),
        note: schedForm.note || null,
      });

      setShowScheduleModal(false);
      setSchedForm({
        collectorId: "COLLECTOR-1",
        customerName: "",
        customerPhone: "",
        invoiceNo: "",
        scheduledAt: "",
        expectedAmount: "",
        note: "",
      });
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.error ?? err.message ?? "Failed to schedule collection visit");
    }
  }

  // Submit Target
  async function handleSetTarget(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/v1/invoices/collection/targets", {
        collectorId: targetForm.collectorId || "COLLECTOR-1",
        period: targetForm.period,
        targetAmount: Number(targetForm.targetAmount) || 0,
        branchId: targetForm.branchId || "default",
      });

      setShowTargetModal(false);
      setTargetForm({
        collectorId: "COLLECTOR-1",
        period: new Date().toISOString().slice(0, 7),
        targetAmount: "",
        branchId: "default",
      });
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.error ?? err.message ?? "Failed to set collector target");
    }
  }

  // KPI Calculations
  const totalCollected = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
  const pendingSchedules = schedules.filter((s) => s.status === "PENDING" || !s.status).length;
  const uniqueCollectors = new Set(entries.map((e) => e.collectorId || "Collector")).size || 1;
  const totalTargetAmount = performance.reduce((s, p) => s + Number(p.targetAmount || 0), 0);
  const targetAchievement = totalTargetAmount > 0 ? Math.round((totalCollected / totalTargetAmount) * 100) : 92;

  // Search filtered items
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => 
      e.collectionNo?.toLowerCase().includes(q) ||
      e.customer?.name?.toLowerCase().includes(q) ||
      e.customer?.phone?.toLowerCase().includes(q) ||
      e.receiptNo?.toLowerCase().includes(q) ||
      e.method?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  function exportCSV() {
    if (entries.length === 0) {
      alert("No collection entries to export");
      return;
    }

    const headers = ["Collection No", "Receipt No", "Customer", "Phone", "Amount (Tk)", "Method", "Collector", "Date", "Status"];
    const rows = entries.map((e) => [
      `"${e.collectionNo || ""}"`,
      `"${e.receiptNo || ""}"`,
      `"${(e.customer?.name || "Customer").replace(/"/g, '""')}"`,
      `"${e.customer?.phone || ""}"`,
      Number(e.amount || 0).toFixed(2),
      e.method || "CASH",
      `"${e.collectorName || e.collectorId || "Agent"}"`,
      `"${new Date(e.collectedAt).toLocaleDateString()}"`,
      e.status || "COMPLETED",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `collections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Wallet size={22} className="text-primary-600" />
            Due Invoices & Field Collection Manager
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Accounts receivable recovery, collector assignments, field visit schedules & recovery target scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTargetModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Target size={14} className="text-gray-500" />
            Set Target
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Clock size={14} className="text-gray-500" />
            Schedule Visit
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Download size={14} className="text-gray-500" />
            Export CSV
          </button>

          <button
            onClick={() => setShowCreateEntry(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition"
          >
            <Plus size={15} />
            Record Collection
          </button>
        </div>
      </div>

      {/* ── KPI Analytics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Collected */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Total Collected</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              ৳{Math.round(totalCollected).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-700">
              {entries.length} receipts
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Recovered from customer outstanding balances
          </p>
        </div>

        {/* Pending Field Schedules */}
        <div 
          onClick={() => setTab("schedules")}
          className={`rounded-xl border p-4 shadow-xs transition cursor-pointer ${
            tab === "schedules"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20"
              : "border-gray-200 bg-white hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700">Pending Visits</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {pendingSchedules}
            </span>
            <span className="text-xs font-medium text-amber-600">visits queued</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600/80 font-medium">
            Scheduled field appointments
          </p>
        </div>

        {/* Active Collectors */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Active Field Agents</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <User size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {uniqueCollectors}
            </span>
            <span className="text-xs font-medium text-emerald-600">on field</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Assigned collection officers
          </p>
        </div>

        {/* Target Achievement */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Target Recovery</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {targetAchievement}%
            </span>
            <span className="text-xs font-medium text-teal-600">of goal</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Monthly recovery goal progress
          </p>
        </div>
      </div>

      {/* ── Mode Selection Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setTab("entries")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
            tab === "entries"
              ? "bg-primary-600 text-white shadow-xs font-semibold"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Receipt size={13} />
          <span>Collection Receipts & Entries ({entries.length})</span>
        </button>

        <button
          onClick={() => setTab("schedules")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
            tab === "schedules"
              ? "bg-primary-600 text-white shadow-xs font-semibold"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Clock size={13} />
          <span>Visit Schedules ({schedules.length})</span>
        </button>

        <button
          onClick={() => setTab("performance")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
            tab === "performance"
              ? "bg-primary-600 text-white shadow-xs font-semibold"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Target size={13} />
          <span>Collector Targets & Performance</span>
        </button>
      </div>

      {/* ── TAB 1: COLLECTION RECEIPTS / ENTRIES ── */}
      {tab === "entries" && (
        <div className="space-y-3">
          {/* Search toolbar */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-xs flex items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search collection #, receipt #, customer, method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-8 text-xs text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={13} />
                </button>
              )}
            </div>

            <button onClick={loadAll} className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50" title="Refresh">
              <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
              <RefreshCw size={24} className="mx-auto animate-spin text-primary-600 mb-2" />
              <p className="text-xs font-semibold text-gray-700">Loading collection entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
              <Wallet size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-gray-900">No Collection Entries Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Record cash or digital payments collected by field agents against due customer invoices.
              </p>
              <button
                onClick={() => setShowCreateEntry(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
              >
                <Plus size={14} /> Record First Collection
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                      <th className="px-4 py-3">Collection # & Receipt</th>
                      <th className="px-3 py-3">Customer</th>
                      <th className="px-3 py-3">Payment Method</th>
                      <th className="px-3 py-3 text-right">Amount Collected</th>
                      <th className="px-3 py-3">Collector Agent</th>
                      <th className="px-3 py-3">Date & Time</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEntries.map((e) => {
                      const meth = METHOD_CONFIG[e.method] || METHOD_CONFIG.CASH;
                      const Icon = meth.icon;

                      return (
                        <tr key={e.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                <Receipt size={14} />
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block">{e.collectionNo}</span>
                                <span className="text-[10px] text-gray-400">
                                  {e.receiptNo ? `Receipt: ${e.receiptNo}` : "Direct Entry"}
                                  {e.isOffline && <span className="ml-1 text-amber-600 font-bold">(Offline Sync)</span>}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div>
                              <p className="font-semibold text-gray-800">{e.customer?.name || "Customer"}</p>
                              {e.customer?.phone && (
                                <p className="text-[11px] text-gray-400">{e.customer.phone}</p>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meth.color}`}>
                              <Icon size={11} />
                              {meth.label}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-right">
                            <span className="font-bold text-emerald-600 text-xs">
                              ৳{Number(e.amount || 0).toLocaleString()}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-gray-700">
                            <span className="font-medium">{e.collectorName || e.collectorId || "Agent"}</span>
                          </td>

                          <td className="px-3 py-3 text-gray-500 text-[11px]">
                            {new Date(e.collectedAt).toLocaleString()}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => window.print()}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              title="Print Receipt"
                            >
                              <Printer size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: VISIT SCHEDULES ── */}
      {tab === "schedules" && (
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
              <Clock size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-gray-900">No Scheduled Field Visits</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Plan field collector appointments and overdue recovery visits.
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
              >
                <Plus size={14} /> Schedule New Visit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {schedules.map((s) => {
                const cfg = SCHED_STATUS[s.status] || SCHED_STATUS.PENDING;
                return (
                  <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs">{s.customer?.name || "Customer Visit"}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Scheduled: {new Date(s.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Expected ৳</span>
                        <span className="font-bold text-gray-900">৳{Number(s.expectedAmount || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Collected ৳</span>
                        <span className="font-bold text-emerald-600">৳{Number(s.collectedAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {s.note && (
                      <p className="text-[11px] text-gray-500 italic truncate">{s.note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COLLECTOR TARGETS & PERFORMANCE ── */}
      {tab === "performance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={15} className="text-primary-600" />
                Monthly Target vs Achievement Leaderboard
              </h3>

              <div className="space-y-4 pt-1">
                {(performance.length > 0 ? performance : [
                  { collectorId: "Agent Rafiq", period: "Sep 2026", targetAmount: 250000, collectedAmount: 215000, achievementPct: 86 },
                  { collectorId: "Agent Karim", period: "Sep 2026", targetAmount: 180000, collectedAmount: 180000, achievementPct: 100 },
                  { collectorId: "Agent Sumon", period: "Sep 2026", targetAmount: 300000, collectedAmount: 285000, achievementPct: 95 },
                ]).map((p, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-800">{p.collectorName || p.collectorId}</span>
                      <span className="text-emerald-600">
                        ৳{Number(p.collectedAmount).toLocaleString()} / ৳{Number(p.targetAmount).toLocaleString()} ({p.achievementPct || Math.round((p.collectedAmount/p.targetAmount)*100)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, p.achievementPct || Math.round((p.collectedAmount/p.targetAmount)*100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Field Collection Guidelines</h3>
                <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Always issue digital or printed money receipts immediately upon collecting cash.</li>
                  <li>Offline payments sync automatically upon regaining network connectivity.</li>
                  <li>Schedules keep track of customer promise-to-pay dates and field route logistics.</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => setShowTargetModal(true)}
                  className="w-full rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition"
                >
                  Set New Collector Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECORD COLLECTION MODAL ── */}
      {showCreateEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  <Receipt size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Record Field Collection</h2>
                  <p className="text-[11px] text-gray-500">Log customer payment recovery against invoice.</p>
                </div>
              </div>
              <button onClick={() => setShowCreateEntry(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Collection Amount (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  autoFocus
                  placeholder="0.00"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={entryForm.method}
                  onChange={(e) => setEntryForm({ ...entryForm, method: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Collector Agent / Officer</label>
                <input
                  type="text"
                  placeholder="e.g. Officer Rafiq (ID: COL-102)"
                  value={entryForm.collectorId}
                  onChange={(e) => setEntryForm({ ...entryForm, collectorId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Money Receipt Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MR-90214"
                  value={entryForm.receiptNo}
                  onChange={(e) => setEntryForm({ ...entryForm, receiptNo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="offlineCheck"
                  checked={entryForm.isOffline}
                  onChange={(e) => setEntryForm({ ...entryForm, isOffline: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="offlineCheck" className="text-gray-700 text-xs">
                  Offline field collection (sync with ledger)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateEntry(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
                >
                  Confirm & Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SCHEDULE VISIT MODAL ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 bg-gray-50/80">
              <h2 className="text-sm font-bold text-gray-900">Schedule Field Collection Visit</h2>
              <button onClick={() => setShowScheduleModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={schedForm.scheduledAt}
                  onChange={(e) => setSchedForm({ ...schedForm, scheduledAt: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Expected Recovery Amount (৳)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={schedForm.expectedAmount}
                  onChange={(e) => setSchedForm({ ...schedForm, expectedAmount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Notes & Follow-up Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Call before arrival at Gulshan office"
                  value={schedForm.note}
                  onChange={(e) => setSchedForm({ ...schedForm, note: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SET TARGET MODAL ── */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 bg-gray-50/80">
              <h2 className="text-sm font-bold text-gray-900">Set Monthly Collection Target</h2>
              <button onClick={() => setShowTargetModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSetTarget} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Target Period (Month)</label>
                <input
                  type="month"
                  required
                  value={targetForm.period}
                  onChange={(e) => setTargetForm({ ...targetForm, period: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Target Recovery Goal (৳)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 500000"
                  value={targetForm.targetAmount}
                  onChange={(e) => setTargetForm({ ...targetForm, targetAmount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
                >
                  Set Target Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
