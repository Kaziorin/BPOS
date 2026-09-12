"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  CreditCard,
  FileText,
  RefreshCw,
  Calendar,
  Download,
  Clock,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  PieChart,
  Wallet,
  Filter,
  ChevronDown,
  Save,
  Trash2,
  Plus,
  ShoppingCart,
  Sparkles,
  Building2,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  Search,
  Tag,
  Scale,
  Printer,
  X,
  Check,
  CalendarRange,
  Info,
} from "lucide-react";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";

type TabType = "sales" | "inventory" | "financial" | "commission" | "installments" | "saved" | "scheduled";

const currency = (v: any) =>
  `৳${(Number(v) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const currencyShort = (v: any) =>
  `৳${(Number(v) || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

function ReportsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = (searchParams.get("tab") as TabType) || "sales";
  const [activeTab, setActiveTab] = useState<TabType>(
    ["sales", "inventory", "financial", "commission", "installments", "saved", "scheduled"].includes(tabParam)
      ? tabParam
      : "sales"
  );

  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [branches, setBranches] = useState<any[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sales data
  const [salesSummary, setSalesSummary] = useState<any[]>([]);
  const [salesByProduct, setSalesByProduct] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [salesByPayment, setSalesByPayment] = useState<any[]>([]);

  // Inventory data
  const [stockValuation, setStockValuation] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [aging, setAging] = useState<any>({ items: [], totalStockValue: 0 });
  const [expiry, setExpiry] = useState<any>({ items: [], totalAtRisk: 0, expiringCount: 0 });

  // Financial
  const [pnl, setPnl] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [ar, setAr] = useState<any>(null);
  const [ap, setAp] = useState<any>(null);

  // Commission
  const [commissions, setCommissions] = useState<any>(null);

  // Installments
  const [installmentSummary, setInstallmentSummary] = useState<any>(null);
  const [overdueInstallments, setOverdueInstallments] = useState<any[]>([]);

  // Saved / Scheduled
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    api.get<{ data: any[] } | any[]>("/api/v1/branches")
      .then((r) => {
        const list = Array.isArray(r) ? r : r?.data ?? [];
        setBranches(Array.isArray(list) ? list : []);
      })
      .catch(() => setBranches([]));
  }, []);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "sales") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.replace(`/reports?${params.toString()}`);
  };

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {};
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    if (branchFilter) p.branchId = branchFilter;
    return p;
  }, [startDate, endDate, branchFilter]);

  const qs = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = { ...buildParams(), ...extra };
      return Object.entries(p)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
    },
    [buildParams]
  );

  // Quick Date Preset Handlers
  const applyDatePreset = (preset: "today" | "this_week" | "this_month" | "this_year" | "clear") => {
    const now = new Date();
    if (preset === "clear") {
      setStartDate("");
      setEndDate("");
      return;
    }
    if (preset === "today") {
      const d = now.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === "this_week") {
      const first = new Date(now.setDate(now.getDate() - now.getDay()));
      const last = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else if (preset === "this_month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    } else if (preset === "this_year") {
      const first = new Date(now.getFullYear(), 0, 1);
      const last = new Date(now.getFullYear(), 11, 31);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(last.toISOString().split("T")[0]);
    }
  };

  // ── Loaders ──
  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const [sum, prod, cat, pay] = await Promise.all([
        api.get<any>(`/api/v1/reports/sales/summary?${params}`),
        api.get<any>(`/api/v1/reports/sales/by-product?${params}`),
        api.get<any>(`/api/v1/reports/sales/by-category?${params}`),
        api.get<any>(`/api/v1/reports/sales/by-payment?${params}`),
      ]);
      setSalesSummary(Array.isArray(sum) ? sum : sum?.data || []);
      setSalesByProduct(Array.isArray(prod) ? prod : prod?.data || []);
      setSalesByCategory(Array.isArray(cat) ? cat : cat?.data || []);
      setSalesByPayment(Array.isArray(pay) ? pay : pay?.data || []);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [qs]);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const [val, low, ag, ex] = await Promise.all([
        api.get<any>(`/api/v1/reports/inventory/valuation?${params}`),
        api.get<any>(`/api/v1/reports/inventory/low-stock?${params}`),
        api.get<any>(`/api/v1/reports/inventory/aging?${params}`),
        api.get<any>(`/api/v1/reports/inventory/expiry?${params}`),
      ]);
      setStockValuation(Array.isArray(val) ? val : val?.data || []);
      setLowStock(Array.isArray(low) ? low : low?.data || []);
      setAging(ag?.data || ag || { items: [] });
      setExpiry(ex?.data || ex || { items: [] });
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [qs]);

  const loadFinancial = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const [p, bs, arData, apData] = await Promise.all([
        api.get<any>(`/api/v1/reports/financial/pnl?${params}`),
        api.get<any>(`/api/v1/reports/financial/balance-sheet?${params}`),
        api.get<any>(`/api/v1/reports/financial/ar?${params}&aging=true`),
        api.get<any>(`/api/v1/reports/financial/ap?${params}`),
      ]);
      setPnl(p?.data || p);
      setBalanceSheet(bs?.data || bs);
      setAr(arData?.data || arData);
      setAp(apData?.data || apData);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [qs]);

  const loadCommission = useCallback(async () => {
    setLoading(true);
    try {
      const params = qs();
      const r = await api.get<any>(`/api/v1/reports/commission/summary?${params}`);
      setCommissions(r?.data || r);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, [qs]);

  const loadInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, over] = await Promise.all([
        api.get<any>(`/api/v1/reports/installments/summary`),
        api.get<any>(`/api/v1/reports/installments/overdue`),
      ]);
      setInstallmentSummary(sum?.data || sum);
      setOverdueInstallments(Array.isArray(over) ? over : over?.data || []);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const [saved, sched] = await Promise.all([
        api.get<any>(`/api/v1/reports/saved`),
        api.get<any>(`/api/v1/reports/scheduled`),
      ]);
      setSavedReports(Array.isArray(saved) ? saved : saved?.data || []);
      setScheduledReports(Array.isArray(sched) ? sched : sched?.data || []);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "sales") loadSales();
    else if (activeTab === "inventory") loadInventory();
    else if (activeTab === "financial") loadFinancial();
    else if (activeTab === "commission") loadCommission();
    else if (activeTab === "installments") loadInstallments();
    else if (activeTab === "saved" || activeTab === "scheduled") loadSaved();
  }, [activeTab, loadSales, loadInventory, loadFinancial, loadCommission, loadInstallments, loadSaved]);

  const handleExport = (reportType: string) => {
    const params = qs();
    window.open(`/api/v1/reports/export?reportType=${reportType}&format=csv&${params}`, "_blank");
    showToast(`Initiating CSV export for ${reportType}…`, "info");
  };

  const saveReport = async () => {
    if (!saveName.trim()) {
      showToast("Report name is required", "error");
      return;
    }
    try {
      await api.post("/api/v1/reports/saved", {
        name: saveName.trim(),
        reportType: activeTab.toUpperCase(),
        config: { startDate, endDate, branchId: branchFilter },
      });
      setShowSaveDialog(false);
      setSaveName("");
      showToast("Report view preset saved successfully.");
      loadSaved();
    } catch (err: any) {
      showToast(err?.message || "Failed to save preset", "error");
    }
  };

  const deleteSaved = async (id: string) => {
    try {
      await api.delete(`/api/v1/reports/saved/${id}`);
      showToast("Saved report removed.");
      loadSaved();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete", "error");
    }
  };

  const deleteScheduled = async (id: string) => {
    try {
      await api.delete(`/api/v1/reports/scheduled/${id}`);
      showToast("Scheduled automation removed.");
      loadSaved();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete", "error");
    }
  };

  // Sales totals computed
  const salesTotals = useMemo(() => {
    const totalRev = salesSummary.reduce((s: number, r: any) => s + Number(r.total || 0), 0);
    const totalCount = salesSummary.reduce((s: number, r: any) => s + Number(r.saleCount || 0), 0);
    const totalPaid = salesSummary.reduce((s: number, r: any) => s + Number(r.paidTotal || 0), 0);
    const totalDue = salesSummary.reduce((s: number, r: any) => s + Number(r.dueTotal || 0), 0);
    return { totalRev, totalCount, totalPaid, totalDue };
  }, [salesSummary]);

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
        title="Business Intelligence & Analytics"
        description="Enterprise multi-branch performance metrics, sales trends, inventory valuations, and financial statements"
        icon={<BarChart3 size={16} />}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration & Intelligence" },
          { label: "Reports & Analytics", href: "/reports" },
        ]}
      />

      {/* Master Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-md">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="absolute right-1/3 -bottom-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary-300 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} className="text-amber-400" />
              <span>Real-Time Business Intelligence & Financial Reporting</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Executive Analytics & Financial Reporting
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consolidated intelligence across point-of-sale registers, warehouse inventories, P&L statements, balance sheets, staff commissions, and EMI installments.
            </p>
          </div>

          {/* Quick Action Toolbar inside Banner */}
          <div className="flex flex-wrap items-center gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md"
            >
              <Save size={14} />
              <span>Save View</span>
            </CustomButton>

            <CustomButton
              size="sm"
              onClick={() => handleExport(activeTab)}
              className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700">
              <CalendarRange size={14} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1">
              {[
                { label: "Today", val: "today" },
                { label: "This Week", val: "this_week" },
                { label: "This Month", val: "this_month" },
                { label: "All Time", val: "clear" },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => applyDatePreset(p.val as any)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Branch & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { value: "", label: "All Outlets & Branches" },
                ...(Array.isArray(branches) ? branches : []).map((b) => ({ value: b.id, label: b.name })),
              ]}
              containerClassName="w-52"
            />

            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "sales") loadSales();
                else if (activeTab === "inventory") loadInventory();
                else if (activeTab === "financial") loadFinancial();
                else if (activeTab === "commission") loadCommission();
                else if (activeTab === "installments") loadInstallments();
                else if (activeTab === "saved" || activeTab === "scheduled") loadSaved();
              }}
              disabled={loading}
              className="border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Main Tab Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "sales", label: "Sales & Revenue", icon: ShoppingCart },
          { id: "inventory", label: "Inventory & Stock", icon: Package },
          { id: "financial", label: "Financial & P&L", icon: DollarSign },
          { id: "commission", label: "Staff Commissions", icon: Users },
          { id: "installments", label: "Installments & EMI", icon: CreditCard },
          { id: "saved", label: "Saved Views & Presets", icon: Save },
          { id: "scheduled", label: "Automated Schedules", icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id as TabType)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════ CONTENT AREA ═════════════════════════ */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw size={28} className="mx-auto animate-spin text-primary-500" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Generating analytics metrics…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── 1. SALES & REVENUE TAB ── */}
          {activeTab === "sales" && (
            <>
              {/* Sales KPIs */}
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales Revenue</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <DollarSign size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                      {currencyShort(salesTotals.totalRev)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    Total billing volume in period
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders Invoiced</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                      <ShoppingCart size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{salesTotals.totalCount}</span>
                    <span className="text-xs text-slate-400 font-medium">sales invoices</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    Completed POS & commercial checkouts
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled & Paid</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                      <CheckCircle2 size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-teal-600 tracking-tight">
                      {currencyShort(salesTotals.totalPaid)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    Cash, cards & mobile banking received
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Receivables (Due)</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <AlertTriangle size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                      {currencyShort(salesTotals.totalDue)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    Credit sales balance pending collection
                  </p>
                </div>
              </div>

              {/* Grid: Sales By Product & Sales By Category */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Sales by Product */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Top Performing Products</h3>
                      <p className="text-xs text-slate-500">Revenue ranking by item SKU</p>
                    </div>
                    <button
                      onClick={() => handleExport("sales_by_product")}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Export Table
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 font-bold uppercase text-slate-500 text-[10px]">
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-right">Quantity Sold</th>
                          <th className="py-2.5 px-3 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesByProduct.length === 0 ? (
                          <tr><td colSpan={3} className="py-8 text-center text-slate-400">No product sales in period</td></tr>
                        ) : (
                          salesByProduct.slice(0, 10).map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{r.productName}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">{r.totalQty}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">{currency(r.totalRevenue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sales by Category */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Sales by Category</h3>
                      <p className="text-xs text-slate-500">Departmental breakdown</p>
                    </div>
                    <button
                      onClick={() => handleExport("sales_by_category")}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Export Table
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 font-bold uppercase text-slate-500 text-[10px]">
                          <th className="py-2.5 px-3">Category Name</th>
                          <th className="py-2.5 px-3 text-right">Units Sold</th>
                          <th className="py-2.5 px-3 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesByCategory.length === 0 ? (
                          <tr><td colSpan={3} className="py-8 text-center text-slate-400">No category sales in period</td></tr>
                        ) : (
                          salesByCategory.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{r.categoryName}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">{r.totalQty}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">{currency(r.totalRevenue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Payment Method Distribution */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tender & Payment Method Breakdown</h3>
                    <p className="text-xs text-slate-500">Cash, card, mobile banking, and credit splits</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {salesByPayment.map((p: any, i: number) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.method}</span>
                      <p className="mt-1 text-lg font-bold text-slate-900">{currency(p.totalAmount)}</p>
                      <p className="mt-1 text-xs text-slate-500">{p.saleCount} transactions</p>
                    </div>
                  ))}
                  {salesByPayment.length === 0 && (
                    <p className="text-xs text-slate-400 col-span-4 text-center py-4">No payment records found.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── 2. INVENTORY & STOCK TAB ── */}
          {activeTab === "inventory" && (
            <>
              {/* Inventory KPIs */}
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Valuation</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                      <Package size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {currencyShort(aging.totalStockValue || stockValuation.reduce((s, r) => s + Number(r.costValue || 0), 0))}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    Warehouse assets at cost value
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <AlertTriangle size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-600 tracking-tight">{lowStock.length}</span>
                    <span className="text-xs text-slate-400 font-medium">SKUs below reorder point</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    Requires immediate replenishment
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Batches (30d)</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                      <Clock size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-orange-600 tracking-tight">
                      {expiry.expiringCount || (expiry.items || []).length}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">batches</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    FEFO priority liquidation
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry Value at Risk</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <AlertTriangle size={16} />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
                      {currencyShort(expiry.totalAtRisk || 0)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    Total cost of expiring items
                  </p>
                </div>
              </div>

              {/* Stock Valuation Table */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Stock Valuation Ledger</h3>
                    <p className="text-xs text-slate-500">Cost vs Retail realization by warehouse</p>
                  </div>
                  <button
                    onClick={() => handleExport("inventory_valuation")}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Export Valuation
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 font-bold uppercase text-slate-500 text-[10px]">
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Warehouse</th>
                        <th className="py-2.5 px-3 text-right">Qty On Hand</th>
                        <th className="py-2.5 px-3 text-right">Cost Valuation</th>
                        <th className="py-2.5 px-3 text-right">Retail Potential</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stockValuation.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-slate-400">No stock valuation records</td></tr>
                      ) : (
                        stockValuation.slice(0, 15).map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{r.productName}</td>
                            <td className="py-2.5 px-3 text-slate-600">{r.warehouseName || "Main HQ"}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">{r.qtyOnHand}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{currency(r.costValue)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{currency(r.retailValue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── 3. FINANCIAL & P&L TAB ── */}
          {activeTab === "financial" && (
            <>
              {/* P&L Cards */}
              {pnl && (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">{currency(pnl.revenue)}</p>
                    <p className="mt-1 text-xs text-slate-500">Total earned sales turnover</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost of Goods Sold (COGS)</span>
                    <p className="mt-2 text-3xl font-extrabold text-orange-600 tracking-tight">{currency(pnl.cogs)}</p>
                    <p className="mt-1 text-xs text-slate-500">Direct product acquisition costs</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Operating Profit</span>
                    <p className="mt-2 text-3xl font-extrabold text-blue-600 tracking-tight">{currency(pnl.grossProfit)}</p>
                    <p className="mt-1 text-xs text-slate-500">Margin prior to overhead expenses</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Bottomline Profit</span>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-600 tracking-tight">{currency(pnl.netProfit)}</p>
                    <p className="mt-1 text-xs text-slate-500">Net retained operational earnings</p>
                  </div>
                </div>
              )}

              {/* Balance Sheet Columns */}
              {balanceSheet && (
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Assets */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-emerald-700 uppercase">1. Assets</h4>
                      <span className="text-base font-extrabold text-emerald-700">{currency(balanceSheet.totalAssets)}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {(balanceSheet.assets || []).map((a: any) => (
                        <div key={a.code} className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                          <span>{a.name}</span>
                          <span className="font-semibold">{currency(a.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-rose-700 uppercase">2. Liabilities</h4>
                      <span className="text-base font-extrabold text-rose-700">{currency(balanceSheet.totalLiabilities)}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {(balanceSheet.liabilities || []).map((l: any) => (
                        <div key={l.code} className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                          <span>{l.name}</span>
                          <span className="font-semibold">{currency(l.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equity */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-blue-700 uppercase">3. Equity</h4>
                      <span className="text-base font-extrabold text-blue-700">{currency(balanceSheet.totalEquity)}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {(balanceSheet.equity || []).map((e: any) => (
                        <div key={e.code} className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                          <span>{e.name}</span>
                          <span className="font-semibold">{currency(e.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── 4. COMMISSIONS TAB ── */}
          {activeTab === "commission" && commissions && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Commission Earned</span>
                  <p className="mt-2 text-3xl font-extrabold text-emerald-600">{currency(commissions.totalEarned)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commission Paid Out</span>
                  <p className="mt-2 text-3xl font-extrabold text-blue-600">{currency(commissions.totalPaid)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Settlement</span>
                  <p className="mt-2 text-3xl font-extrabold text-amber-600">{currency(commissions.totalPending)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Commission by Sales Agent</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 font-bold uppercase text-slate-500 text-[10px]">
                        <th className="py-2.5 px-3">Agent Name</th>
                        <th className="py-2.5 px-3 text-right">Invoiced Sales</th>
                        <th className="py-2.5 px-3 text-right">Total Turnover</th>
                        <th className="py-2.5 px-3 text-right">Earned Commission</th>
                        <th className="py-2.5 px-3 text-right">Pending Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(commissions.agents || []).map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{r.agentName}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{r.saleCount}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{currency(r.totalSales)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{currency(r.totalCommission)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-600">{currency(r.pendingCommission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── 5. INSTALLMENTS & EMI TAB ── */}
          {activeTab === "installments" && installmentSummary && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Financed</span>
                  <p className="mt-2 text-2xl font-extrabold text-blue-600">{currency(installmentSummary.totalFinanced)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected</span>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-600">{currency(installmentSummary.totalCollected)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
                  <p className="mt-2 text-2xl font-extrabold text-amber-600">{currency(installmentSummary.totalOutstanding)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Balance</span>
                  <p className="mt-2 text-2xl font-extrabold text-rose-600">{currency(installmentSummary.totalOverdue)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due This Week</span>
                  <p className="mt-2 text-2xl font-extrabold text-purple-600">{currency(installmentSummary.dueThisWeek)}</p>
                </div>
              </div>

              {overdueInstallments.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-rose-700">Overdue Installment Recovery List</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 font-bold uppercase text-slate-500 text-[10px]">
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Plan #</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3 text-right">Installment Amount</th>
                          <th className="py-2.5 px-3 text-right">Days Overdue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {overdueInstallments.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{r.customerName}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{r.customerPhone}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{r.planNo}</td>
                            <td className="py-2.5 px-3 text-slate-600">{r.dueDate?.split("T")[0] || ""}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-600">{currency(r.amount)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-700">{r.daysOverdue} days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── 6. SAVED PRESETS TAB ── */}
          {activeTab === "saved" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Saved Report Views</h3>
                  <p className="text-xs text-slate-500">Custom filter presets for instant 1-click execution</p>
                </div>
                <CustomButton size="sm" onClick={() => setShowSaveDialog(true)} className="bg-primary-600 text-white">
                  <Plus size={14} /> Save Current View
                </CustomButton>
              </div>

              {savedReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Save size={24} className="mx-auto text-slate-300 mb-1" />
                  <p className="text-xs">No saved views yet. Click "Save View" at the top to bookmark your current filters.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedReports.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-50 transition"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">{r.name}</p>
                        <p className="text-xs text-slate-500">
                          {r.reportType} · {r.config?.startDate || "All time"} to {r.config?.endDate || "Now"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteSaved(r.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 7. SCHEDULED AUTOMATION TAB ── */}
          {activeTab === "scheduled" && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Automated Scheduled Reports</h3>
                  <p className="text-xs text-slate-500">Scheduled email and in-app executive summary deliveries</p>
                </div>
              </div>

              {scheduledReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock size={24} className="mx-auto text-slate-300 mb-1" />
                  <p className="text-xs">No scheduled reports active. Automated cron delivery handles daily and weekly digests.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledReports.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-50 transition"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">{r.name}</p>
                        <p className="text-xs text-slate-500">
                          {r.reportType} · Frequency: <span className="font-bold">{r.frequency}</span> via {r.deliveryChannel}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteScheduled(r.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Save View Dialog ── */}
      <CustomModal open={showSaveDialog} onClose={() => setShowSaveDialog(false)} title="Save Current Report View">
        <div className="space-y-4">
          <CustomInput
            label="Preset Name *"
            value={saveName}
            onChange={(e: any) => setSaveName(e.target.value)}
            placeholder="e.g. Monthly Revenue & High Margin SKU Report"
          />
          <p className="text-xs text-slate-500">
            Saves current tab ({activeTab.toUpperCase()}), date ranges, and branch filters for fast retrieval.
          </p>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <CustomButton variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </CustomButton>
            <CustomButton onClick={saveReport} className="bg-primary-600 hover:bg-primary-700 text-white">
              Save Preset
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
