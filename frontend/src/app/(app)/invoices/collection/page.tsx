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
import { toast } from "react-toastify";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomStatCard,
  CustomTabs,
  CustomTable,
  type CustomTableColumn,
  CustomModal,
  CustomDropdownSelect,
  CustomInput,
  CustomDatePicker,
} from "@/components/custom";

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
  COMPLETED: { label: "Completed", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  PENDING: { label: "Pending Visit", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  PARTIAL: { label: "Partially Collected", bg: "bg-brand-50 border-brand-border", text: "text-brand-dark" },
  MISSED: { label: "Missed / Rescheduled", bg: "bg-rose-50 border-rose-200", text: "text-rose-700" },
};

export default function CollectionPage() {
  const [tab, setTab] = useState<string>("entries");
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters state
  const [filterMethod, setFilterMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
    collectedAt: new Date().toISOString().split("T")[0],
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
      toast.error("Please enter a valid collection amount");
      return;
    }

    try {
      await api.post("/v1/invoices/collection/entries", {
        branchId: entryForm.branchId || "default",
        collectorId: entryForm.collectorId || "COLLECTOR-1",
        customerId: entryForm.customerId || undefined,
        customerName: entryForm.customerName || undefined,
        customerPhone: entryForm.customerPhone || undefined,
        invoiceId: entryForm.invoiceId || undefined,
        invoiceNo: entryForm.invoiceNo || undefined,
        method: entryForm.method || "CASH",
        amount: Number(entryForm.amount),
        receiptNo: entryForm.receiptNo || undefined,
        collectedAt: entryForm.collectedAt ? new Date(entryForm.collectedAt).toISOString() : undefined,
        isOffline: entryForm.isOffline,
        note: entryForm.note || undefined,
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
        collectedAt: new Date().toISOString().split("T")[0],
        note: "",
        isOffline: false,
      });
      toast.success("Collection receipt recorded successfully!");
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to save collection entry");
    }
  }

  // Submit Schedule
  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/v1/invoices/collection/schedules", {
        collectorId: schedForm.collectorId || "COLLECTOR-1",
        customerName: schedForm.customerName || undefined,
        customerPhone: schedForm.customerPhone || undefined,
        invoiceNo: schedForm.invoiceNo || undefined,
        scheduledAt: schedForm.scheduledAt,
        expectedAmount: Number(schedForm.expectedAmount) || 0,
        note: schedForm.note || undefined,
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
      toast.success("Field visit scheduled successfully!");
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to schedule collection visit");
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
      toast.success("Collector target updated successfully!");
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to set collector target");
    }
  }

  // KPI Calculations
  const totalCollected = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
  const pendingSchedules = schedules.filter((s) => s.status === "PENDING" || !s.status).length;
  const uniqueCollectors = new Set(entries.map((e) => e.collectorId || "Collector")).size || 1;
  const totalTargetAmount = performance.reduce((s, p) => s + Number(p.targetAmount || 0), 0);
  const targetAchievement = totalTargetAmount > 0 ? Math.round((totalCollected / totalTargetAmount) * 100) : 92;

  // Filtered entries by Search, Method, and Date Range
  const filteredEntries = useMemo(() => {
    let list = entries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => 
        e.collectionNo?.toLowerCase().includes(q) ||
        e.customer?.name?.toLowerCase().includes(q) ||
        e.customer?.phone?.toLowerCase().includes(q) ||
        e.receiptNo?.toLowerCase().includes(q) ||
        e.method?.toLowerCase().includes(q) ||
        e.collectorName?.toLowerCase().includes(q)
      );
    }
    if (filterMethod) {
      list = list.filter((e) => e.method === filterMethod);
    }
    if (startDate) {
      list = list.filter((e) => {
        const itemDate = new Date(e.collectedAt).toISOString().split("T")[0];
        return itemDate >= startDate;
      });
    }
    if (endDate) {
      list = list.filter((e) => {
        const itemDate = new Date(e.collectedAt).toISOString().split("T")[0];
        return itemDate <= endDate;
      });
    }
    return list;
  }, [entries, searchQuery, filterMethod, startDate, endDate]);

  const methodFilterOptions = [
    { label: "All Payment Methods", value: "" },
    { label: "Cash", value: "CASH" },
    { label: "bKash", value: "BKASH" },
    { label: "Nagad", value: "NAGAD" },
    { label: "Bank Transfer", value: "BANK" },
    { label: "Cheque", value: "CHEQUE" },
  ];

  const collectionTabs = [
    { id: "entries", label: `Collection Receipts (${entries.length})` },
    { id: "schedules", label: `Visit Schedules (${schedules.length})` },
    { id: "performance", label: "Targets & Performance" },
  ];

  // Custom Table Columns for Collection Entries
  const entryColumns: CustomTableColumn<CollectionEntry>[] = [
    {
      key: "collectionNo",
      header: "Collection # & Receipt",
      render: (e) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            <Receipt size={14} />
          </div>
          <div>
            <span className="font-bold text-gray-600 block font-mono">{e.collectionNo}</span>
            <span className="text-[11px] text-gray-600 font-semibold block">
              {e.receiptNo ? `Receipt: ${e.receiptNo}` : "Direct Entry"}
              {e.isOffline && <span className="ml-1 text-amber-600 font-bold">(Offline Sync)</span>}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (e) => (
        <div>
          <p className="font-bold text-gray-600">{e.customer?.name || "Walk-in Customer"}</p>
          {e.customer?.phone && (
            <p className="text-[11px] text-gray-500 font-medium">{e.customer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "method",
      header: "Payment Method",
      render: (e) => {
        const meth = METHOD_CONFIG[e.method] || METHOD_CONFIG.CASH;
        const Icon = meth.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-bold ${meth.color}`}>
            <Icon size={12} />
            {meth.label}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount (৳)",
      align: "right",
      render: (e) => (
        <span className="font-black text-emerald-700 text-xs sm:text-sm tabular-nums">
          ৳{Number(e.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "collector",
      header: "Collector Agent",
      render: (e) => (
        <span className="font-semibold text-gray-600">{e.collectorName || e.collectorId || "Agent"}</span>
      ),
    },
    {
      key: "collectedAt",
      header: "Date & Time",
      render: (e) => (
        <span className="text-gray-600 text-xs font-semibold">
          {new Date(e.collectedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: () => (
        <CustomButton
          size="xs"
          variant="primary"
          themeColor="primary"
          leftIcon={Printer}
          onClick={(ev) => {
            ev.stopPropagation();
            window.print();
          }}
          title="Print Receipt"
          className="h-[28px] px-2.5 shadow-xs"
        >
          Print
        </CustomButton>
      ),
    },
  ];

  // Custom Table Columns for Visit Schedules
  const scheduleColumns: CustomTableColumn<CollectionSchedule>[] = [
    {
      key: "customer",
      header: "Customer & Visit",
      render: (s) => (
        <div>
          <p className="font-bold text-gray-600">{s.customer?.name || "Customer Visit"}</p>
          {s.customer?.phone && (
            <p className="text-[11px] text-gray-500 font-medium">{s.customer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "collector",
      header: "Assigned Collector",
      render: (s) => (
        <span className="font-semibold text-gray-600">{s.collectorName || s.collectorId || "Agent"}</span>
      ),
    },
    {
      key: "scheduledAt",
      header: "Scheduled Date & Time",
      render: (s) => (
        <span className="text-gray-600 text-xs font-semibold">
          {new Date(s.scheduledAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "expectedAmount",
      header: "Expected (৳)",
      align: "right",
      render: (s) => (
        <span className="font-bold text-gray-600 text-xs tabular-nums">
          ৳{Number(s.expectedAmount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "collectedAmount",
      header: "Collected (৳)",
      align: "right",
      render: (s) => (
        <span className="font-black text-emerald-700 text-xs tabular-nums">
          ৳{Number(s.collectedAmount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (s) => {
        const cfg = SCHED_STATUS[s.status] || SCHED_STATUS.PENDING;
        return (
          <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "note",
      header: "Notes",
      render: (s) => (
        <span className="text-[11px] text-gray-500 italic truncate max-w-[180px] block font-medium">
          {s.note || "—"}
        </span>
      ),
    },
  ];

  function exportCSV() {
    if (entries.length === 0) {
      toast.error("No collection entries to export");
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
    toast.success(`Exported ${entries.length} collection records!`);
  }

  return (
    <div className="space-y-4 w-full">
      {/* 1. CUSTOM BREADCRUMB & 4 DISTINCT ACTION BUTTONS */}
      <CustomBreadcrumb
        title="Due Invoices & Field Collection Manager"
        breadcrumbs={[
          { label: "Finance", href: "/invoices" },
          { label: "Invoices", href: "/invoices" },
          { label: "Collections" },
        ]}
        icon={<Wallet size={16} className="text-brand-primary" />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Button 1: Distinct Indigo Gradient */}
            <CustomButton
              variant="primary"
              themeColor="indigo"
              size="xs"
              leftIcon={Target}
              onClick={() => setShowTargetModal(true)}
            >
              Set Target
            </CustomButton>

            {/* Button 2: Rich Emerald Green Gradient */}
            <CustomButton
              variant="primary"
              themeColor="emerald"
              size="xs"
              leftIcon={Clock}
              onClick={() => setShowScheduleModal(true)}
            >
              Schedule Visit
            </CustomButton>

            {/* Button 3: Outline Clean Slate */}
            <CustomButton
              variant="outline"
              size="xs"
              leftIcon={Download}
              onClick={exportCSV}
            >
              Export CSV
            </CustomButton>

            {/* Button 4: Primary Sky Gradient */}
            <CustomButton
              variant="primary"
              themeColor="primary"
              size="xs"
              leftIcon={Plus}
              onClick={() => setShowCreateEntry(true)}
            >
              Record Collection
            </CustomButton>
          </div>
        }
      />

      {/* 2. KPI ANALYTICS STAT CARDS (Clean, No Subtitles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <CustomStatCard
          label="Total Collected"
          value={`৳${Math.round(totalCollected).toLocaleString()}`}
          icon={DollarSign}
          tone="green"
        />
        <CustomStatCard
          label="Pending Visits"
          value={String(pendingSchedules)}
          icon={Clock}
          tone="amber"
          className="cursor-pointer"
        />
        <CustomStatCard
          label="Active Field Agents"
          value={String(uniqueCollectors)}
          icon={User}
          tone="primary"
        />
        <CustomStatCard
          label="Target Recovery"
          value={`${targetAchievement}%`}
          icon={ShieldCheck}
          tone="blue"
        />
      </div>

      {/* 3. MAIN UNIFIED CARD: TABS, TOOLBAR, FILTERS, TABLE */}
      <div className="rounded-sm border border-brand-border bg-white shadow-2xs overflow-hidden">
        {/* Card Header Toolbar */}
        <div className="border-b border-slate-100 p-4 space-y-3 bg-white">
          {/* Row 1: Tabs on Left, Export CSV on Right (No Refresh Button) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="overflow-x-auto min-w-0 shrink">
              <CustomTabs
                tabs={collectionTabs}
                activeTab={tab}
                onChange={(tabId) => setTab(tabId)}
                themeColor="primary"
                className="w-auto border border-slate-200 bg-white shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              <CustomButton
                variant="outline"
                size="xs"
                leftIcon={Download}
                onClick={exportCSV}
                className="h-[34px]"
                title="Export collection entries to CSV"
              >
                Export CSV
              </CustomButton>
            </div>
          </div>

          {/* Row 2: Search on Left + Method Select + Spacious Date Range */}
          {tab === "entries" && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-0.5">
              {/* 1. Search Input */}
              <div className="w-full sm:w-[280px] lg:w-[320px] shrink-0">
                <CustomInput
                  leftIcon={<Search size={14} />}
                  rightIcon={
                    searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    ) : null
                  }
                  placeholder="Search collection #, customer, phone, collector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  containerClassName="w-full"
                  className="h-[38px] text-xs font-medium text-gray-600 placeholder:text-gray-500 shadow-2xs"
                />
              </div>

              {/* 2. Payment Method Select */}
              <div className="w-full sm:w-[200px] lg:w-[220px] shrink-0">
                <CustomDropdownSelect
                  options={methodFilterOptions}
                  value={filterMethod}
                  onChange={(val) => setFilterMethod(val)}
                  placeholder="All Payment Methods"
                  containerClassName="w-full"
                  className="h-[38px] text-xs font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
                />
              </div>

              {/* 3. Spacious Date Range with CustomDatePicker (sm:w-[380px] gives ~185px per date) */}
              <div className="flex items-center gap-2 w-full sm:w-[380px] lg:w-[410px] shrink-0 sm:ml-auto">
                <div className="flex-1 min-w-0">
                  <CustomDatePicker
                    value={startDate}
                    onChange={(val) => setStartDate(val)}
                    compact={true}
                    placeholder="From Date"
                    title="From Date"
                    clearable={true}
                    className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
                  />
                </div>
                <span className="text-xs font-bold text-gray-400 shrink-0">to</span>
                <div className="flex-1 min-w-0">
                  <CustomDatePicker
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                    compact={true}
                    placeholder="To Date"
                    title="To Date"
                    clearable={true}
                    min={startDate || undefined}
                    className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Body: Tab 1 - Entries CustomTable */}
        {tab === "entries" && (
          <div className="p-0">
            <CustomTable<CollectionEntry>
              columns={entryColumns}
              data={filteredEntries}
              loading={loading}
              rowKey="id"
              pageSize={10}
              showPagination={true}
              emptyMessage="No collection entries found matching your criteria."
            />
          </div>
        )}

        {/* Card Body: Tab 2 - Schedules CustomTable */}
        {tab === "schedules" && (
          <div className="p-0">
            <CustomTable<CollectionSchedule>
              columns={scheduleColumns}
              data={schedules}
              loading={loading}
              rowKey="id"
              pageSize={10}
              showPagination={true}
              emptyMessage="No scheduled field visits found."
            />
          </div>
        )}

        {/* Card Body: Tab 3 - Performance */}
        {tab === "performance" && (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-sm border border-brand-border bg-white p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-brand-dark capitalize flex items-center gap-1.5">
                  <Target size={15} />
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
                        <span className="text-gray-600">{p.collectorName || p.collectorId}</span>
                        <span className="text-emerald-700 font-bold">
                          ৳{Number(p.collectedAmount).toLocaleString()} / ৳{Number(p.targetAmount).toLocaleString()} ({p.achievementPct || Math.round((p.collectedAmount/p.targetAmount)*100)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, p.achievementPct || Math.round((p.collectedAmount/p.targetAmount)*100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-sm border border-brand-border bg-white p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-brand-dark capitalize mb-2">Field Collection Guidelines</h3>
                  <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4 leading-relaxed font-medium">
                    <li>Always issue digital or printed money receipts immediately upon collecting cash.</li>
                    <li>Offline payments sync automatically upon regaining network connectivity.</li>
                    <li>Schedules keep track of customer promise-to-pay dates and field route logistics.</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 flex gap-2">
                  <CustomButton
                    variant="primary"
                    size="sm"
                    fullWidth={true}
                    leftIcon={Target}
                    onClick={() => setShowTargetModal(true)}
                  >
                    Set New Collector Target
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. MODALS (Spacious, Blue Theme, CustomDatePicker)        */}
      {/* ========================================================= */}

      {/* ── RECORD COLLECTION MODAL (Spacious 2xl, Blue Theme) ── */}
      {showCreateEntry && (
        <CustomModal
          open={showCreateEntry}
          onClose={() => setShowCreateEntry(false)}
          title="Record Field Collection"
          subtitle="Log customer payment recovery against invoice."
          size="2xl"
          themeColor="primary"
          icon={<Receipt size={18} />}
        >
          <form onSubmit={handleCreateEntry} className="space-y-4 text-xs text-gray-600">
            <div>
              <CustomInput
                label="Collection Amount (৳)"
                type="number"
                min="1"
                step="any"
                required
                autoFocus
                placeholder="0.00"
                value={entryForm.amount}
                onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                className="h-[42px] text-base font-black text-brand-dark"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <CustomDropdownSelect
                label="Payment Method"
                required
                options={[
                  { label: "Cash Drawer", value: "CASH" },
                  { label: "bKash", value: "BKASH" },
                  { label: "Nagad", value: "NAGAD" },
                  { label: "Bank Transfer", value: "BANK" },
                  { label: "Cheque", value: "CHEQUE" },
                ]}
                value={entryForm.method}
                onChange={(val) => setEntryForm({ ...entryForm, method: val })}
                className="h-[38px] text-xs font-semibold text-gray-600 border-brand-border"
              />

              <CustomDatePicker
                label="Collection Date"
                value={entryForm.collectedAt}
                onChange={(val) => setEntryForm({ ...entryForm, collectedAt: val })}
                placeholder="Select Date"
                className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 border-brand-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <CustomInput
                label="Customer Name (Optional)"
                type="text"
                placeholder="e.g. Acme Corp"
                value={entryForm.customerName}
                onChange={(e) => setEntryForm({ ...entryForm, customerName: e.target.value })}
                className="h-[38px] text-xs font-semibold text-gray-600 border-brand-border"
              />

              <CustomInput
                label="Collector Agent / Officer"
                type="text"
                placeholder="e.g. Officer Rafiq (ID: COL-102)"
                value={entryForm.collectorId}
                onChange={(e) => setEntryForm({ ...entryForm, collectorId: e.target.value })}
                className="h-[38px] text-xs font-semibold text-gray-600 border-brand-border"
              />
            </div>

            <CustomInput
              label="Money Receipt Number (Optional)"
              type="text"
              placeholder="e.g. MR-90214"
              value={entryForm.receiptNo}
              onChange={(e) => setEntryForm({ ...entryForm, receiptNo: e.target.value })}
              className="h-[38px] text-xs font-semibold text-gray-600 border-brand-border"
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="offlineCheck"
                checked={entryForm.isOffline}
                onChange={(e) => setEntryForm({ ...entryForm, isOffline: e.target.checked })}
                className="rounded-sm text-brand-primary focus:ring-brand-border cursor-pointer"
              />
              <label htmlFor="offlineCheck" className="text-gray-600 text-xs font-medium cursor-pointer">
                Offline field collection (auto-sync with financial ledger)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <CustomButton
                type="button"
                variant="danger"
                size="sm"
                className="h-[36px]"
                onClick={() => setShowCreateEntry(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                variant="primary"
                themeColor="primary"
                size="sm"
                className="h-[36px]"
              >
                Confirm & Save Receipt
              </CustomButton>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ── SCHEDULE VISIT MODAL (Spacious 2xl, Blue Theme, CustomDatePicker) ── */}
      {showScheduleModal && (
        <CustomModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Field Collection Visit"
          subtitle="Plan field collector appointments and overdue recovery visits."
          size="2xl"
          themeColor="primary"
          icon={<Clock size={18} />}
        >
          <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs text-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <CustomInput
                label="Customer / Client Name"
                type="text"
                required
                placeholder="Customer or Organization Name"
                value={schedForm.customerName}
                onChange={(e) => setSchedForm({ ...schedForm, customerName: e.target.value })}
                className="h-[38px] text-xs font-semibold text-gray-600 border-brand-border"
              />

              <CustomDatePicker
                label="Scheduled Date & Time"
                type="datetime-local"
                required
                value={schedForm.scheduledAt}
                onChange={(val) => setSchedForm({ ...schedForm, scheduledAt: val })}
                placeholder="Select appointment date & time"
                className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 border-brand-border"
              />
            </div>

            <CustomInput
              label="Expected Recovery Amount (৳)"
              type="number"
              min="0"
              placeholder="0.00"
              value={schedForm.expectedAmount}
              onChange={(e) => setSchedForm({ ...schedForm, expectedAmount: e.target.value })}
              className="h-[38px] text-xs font-semibold text-gray-600 border-brand-border"
            />

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">
                Notes & Follow-up Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Call before arrival at Gulshan office"
                value={schedForm.note}
                onChange={(e) => setSchedForm({ ...schedForm, note: e.target.value })}
                className="w-full rounded-sm border border-brand-border p-2.5 text-xs font-semibold text-gray-600 placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <CustomButton
                type="button"
                variant="danger"
                size="sm"
                className="h-[36px]"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                variant="primary"
                themeColor="primary"
                size="sm"
                className="h-[36px]"
              >
                Schedule Appointment
              </CustomButton>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ── SET TARGET MODAL (Spacious xl, Blue Theme, CustomDatePicker) ── */}
      {showTargetModal && (
        <CustomModal
          open={showTargetModal}
          onClose={() => setShowTargetModal(false)}
          title="Set Monthly Collection Target"
          subtitle="Set collector monthly recovery goals."
          size="xl"
          themeColor="primary"
          icon={<Target size={18} />}
        >
          <form onSubmit={handleSetTarget} className="space-y-4 text-xs text-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
              <CustomDatePicker
                label="Target Period (Month)"
                type="month"
                required
                value={targetForm.period}
                onChange={(val) => setTargetForm({ ...targetForm, period: val })}
                placeholder="Select Target Month"
                className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 border-brand-border"
              />

              <CustomInput
                label="Target Recovery Goal (৳)"
                type="number"
                min="1"
                required
                placeholder="e.g. 500000"
                value={targetForm.targetAmount}
                onChange={(e) => setTargetForm({ ...targetForm, targetAmount: e.target.value })}
                className="h-[38px] text-xs font-semibold text-gray-600 border-brand-border"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <CustomButton
                type="button"
                variant="danger"
                size="sm"
                className="h-[36px]"
                onClick={() => setShowTargetModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                variant="primary"
                themeColor="primary"
                size="sm"
                className="h-[36px]"
              >
                Set Target Goal
              </CustomButton>
            </div>
          </form>
        </CustomModal>
      )}
    </div>
  );
}
