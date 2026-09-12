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
  Plus,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";

interface Schedule {
  id: string;
  sequenceNo: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidAt?: string | null;
  status: string;
  isOverdue?: number | boolean;
}

interface Plan {
  id: string;
  planNo: string;
  financedAmount: number;
  downPayment: number;
  installmentCount: number;
  frequency: string;
  installmentAmount: number;
  totalPayable: number;
  paidTotal: number;
  startDate: string;
  status: string;
  note?: string | null;
  createdAt: string;
  customer?: {
    id?: string;
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  schedules: Schedule[];
  hasOverdueSchedules?: boolean;
}

interface InstallmentStats {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  defaultedPlans: number;
  totalFinanced: number;
  totalPayable: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueScheduleCount: number;
  overdueAmount: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  creditLimit?: number;
  currentDue?: number;
}

export default function InstallmentsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<InstallmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedForDrawer, setSelectedForDrawer] = useState<Plan | null>(null);

  // Create Form State
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [createCustomerSearch, setCreateCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [createSaleAmount, setCreateSaleAmount] = useState("");
  const [createDownPayment, setCreateDownPayment] = useState("0");
  const [createCount, setCreateCount] = useState("6");
  const [createFrequency, setCreateFrequency] = useState("MONTHLY");
  const [createNote, setCreateNote] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Pay Form State
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);

  // Settlement Form State
  const [settleDiscount, setSettleDiscount] = useState("0");
  const [submittingSettle, setSubmittingSettle] = useState(false);

  // Reschedule Form State
  const [rescheduleCount, setRescheduleCount] = useState("6");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Reminder Form State
  const [reminderChannel, setReminderChannel] = useState<"SMS" | "WHATSAPP" | "EMAIL">("SMS");
  const [reminderTone, setReminderTone] = useState("polite");
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res: any = await api.get("/api/v1/installments/stats");
      setStats(res?.data ?? null);
    } catch (err) {
      console.error("Failed to load installment stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (activeTab !== "ALL") params.set("status", activeTab);

      const res: any = await api.get(`/api/v1/installments?${params.toString()}`);
      const dataList: Plan[] = res?.data ?? [];
      setPlans(dataList);

      const pag = res?.pagination || res?.extra?.pagination;
      if (pag) {
        setTotalPages(pag.totalPages || 1);
        setTotalRecords(pag.total || dataList.length);
      } else {
        setTotalPages(1);
        setTotalRecords(dataList.length);
      }
    } catch (err: any) {
      console.error("Failed to load installment plans:", err);
      showToast("Error loading installment plans", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, activeTab]);

  const loadCustomers = useCallback(async () => {
    try {
      const res: any = await api.get("/api/v1/customers?limit=100");
      const list = res?.data?.data || res?.data || [];
      setCustomers(list);
    } catch (e) {
      console.error("Failed to load customers for plan creation:", e);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadCustomers();
  }, [loadStats, loadCustomers]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadPlans();
    }, 200);
    return () => clearTimeout(t);
  }, [loadPlans]);

  // Client-side sorting
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === "date") {
        valA = new Date(a.createdAt || a.startDate).getTime();
        valB = new Date(b.createdAt || b.startDate).getTime();
      } else if (sortBy === "financed") {
        valA = Number(a.financedAmount || 0);
        valB = Number(b.financedAmount || 0);
      } else if (sortBy === "remaining") {
        valA = Number(a.totalPayable || 0) - Number(a.paidTotal || 0);
        valB = Number(b.totalPayable || 0) - Number(b.paidTotal || 0);
      } else if (sortBy === "customer") {
        valA = (a.customer?.name || "").toLowerCase();
        valB = (b.customer?.name || "").toLowerCase();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [plans, sortBy, sortDir]);

  const fmt = (n: number) =>
    `৳${(Number(n) || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  // EMI Calculator Helper for Create Plan Modal
  const calculatedEmi = useMemo(() => {
    const sale = parseFloat(createSaleAmount) || 0;
    const down = parseFloat(createDownPayment) || 0;
    const count = parseInt(createCount) || 1;
    const financed = Math.max(0, sale - down);
    const perEmi = count > 0 ? financed / count : 0;
    return {
      financed,
      perEmi: Math.round(perEmi * 100) / 100,
      totalPayable: financed,
    };
  }, [createSaleAmount, createDownPayment, createCount]);

  // Handle Create Plan Submit
  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast("Please select a customer for this plan", "error");
      return;
    }
    const sale = parseFloat(createSaleAmount);
    const count = parseInt(createCount);
    if (!sale || sale <= 0 || !count || count <= 0) {
      showToast("Please enter a valid sale amount and installment count", "error");
      return;
    }

    setSubmittingCreate(true);
    try {
      await api.post("/api/v1/installments", {
        customerId: selectedCustomerId,
        totalAmount: sale,
        downPayment: parseFloat(createDownPayment) || 0,
        installmentCount: count,
        frequency: createFrequency,
        note: createNote,
      });
      showToast("Installment contract created successfully with generated EMI schedules! ✨");
      setShowCreateModal(false);
      setSelectedCustomerId("");
      setCreateSaleAmount("");
      setCreateDownPayment("0");
      setCreateCount("6");
      setCreateNote("");
      loadPlans();
      loadStats();
    } catch (err: any) {
      showToast(err?.message || "Failed to create installment plan", "error");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Open Pay Modal
  const openPayModal = (plan: Plan, schedule?: Schedule) => {
    setSelectedPlan(plan);
    const target = schedule || plan.schedules.find((s) => s.status !== "PAID") || plan.schedules[0];
    setSelectedSchedule(target || null);
    setPayAmount(target ? String(Number(target.amount) - Number(target.paidAmount || 0)) : String(plan.installmentAmount));
    setPayMethod("CASH");
    setPayRef("");
    setPayNote("");
    setShowPayModal(true);
  };

  // Submit Payment
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !selectedSchedule) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      showToast("Please enter a valid payment amount", "error");
      return;
    }

    setSubmittingPay(true);
    try {
      await api.post(`/api/v1/installments/${selectedPlan.id}/pay`, {
        scheduleId: selectedSchedule.id,
        amount: amt,
        paymentMethod: payMethod,
        referenceNo: payRef,
        note: payNote,
      });
      showToast(`EMI payment of ৳${amt.toLocaleString()} recorded successfully!`);
      setShowPayModal(false);
      setSelectedPlan(null);
      setSelectedSchedule(null);
      loadPlans();
      loadStats();
    } catch (err: any) {
      showToast(err?.message || "Failed to record installment payment", "error");
    } finally {
      setSubmittingPay(false);
    }
  };

  // Early Settle Submit
  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmittingSettle(true);
    try {
      const disc = parseFloat(settleDiscount) || 0;
      await api.post(`/api/v1/installments/${selectedPlan.id}/settle`, {
        discountAmount: disc,
      });
      showToast("Contract marked as FULLY SETTLED and completed!");
      setShowSettleModal(false);
      setSelectedPlan(null);
      loadPlans();
      loadStats();
    } catch (err: any) {
      showToast(err?.message || "Failed to settle installment plan", "error");
    } finally {
      setSubmittingSettle(false);
    }
  };

  // Reschedule Submit
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const count = parseInt(rescheduleCount);
    if (!count || count <= 0) {
      showToast("Please enter valid revised installment count", "error");
      return;
    }

    setSubmittingReschedule(true);
    try {
      await api.post(`/api/v1/installments/${selectedPlan.id}/reschedule`, {
        installmentCount: count,
      });
      showToast("Plan rescheduled with updated EMI schedule!");
      setShowRescheduleModal(false);
      setSelectedPlan(null);
      loadPlans();
      loadStats();
    } catch (err: any) {
      showToast(err?.message || "Failed to reschedule plan", "error");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Reminder message
  const reminderMessage = useMemo(() => {
    if (!selectedPlan) return "";
    const name = selectedPlan.customer?.name || "Customer";
    const nextSched = selectedPlan.schedules.find((s) => s.status !== "PAID");
    const emiAmt = fmt(nextSched ? nextSched.amount : selectedPlan.installmentAmount);
    const dueDate = nextSched ? new Date(nextSched.dueDate).toLocaleDateString("en-BD") : "soon";

    if (reminderTone === "urgent" || selectedPlan.hasOverdueSchedules) {
      return `URGENT NOTICE: Dear ${name}, your EMI installment of ${emiAmt} for Plan ${selectedPlan.planNo} is overdue (Due date: ${dueDate}). Please make your payment immediately to keep your account active and avoid penalty fees. Thank you.`;
    }
    return `Dear ${name}, this is a gentle reminder that your upcoming EMI of ${emiAmt} for Plan ${selectedPlan.planNo} is due on ${dueDate}. Thank you for your continued business!`;
  }, [selectedPlan, reminderTone]);

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopiedReminder(true);
    showToast("Reminder copied to clipboard!");
    setTimeout(() => setCopiedReminder(false), 2000);
  };

  const handleSendReminderAction = () => {
    if (!selectedPlan) return;
    const phone = selectedPlan.customer?.phone;
    if (reminderChannel === "WHATSAPP" && phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderMessage)}`;
      window.open(url, "_blank");
    } else if (reminderChannel === "EMAIL" && selectedPlan.customer?.email) {
      const url = `mailto:${selectedPlan.customer.email}?subject=${encodeURIComponent(
        `EMI Installment Reminder - ${selectedPlan.planNo}`
      )}&body=${encodeURIComponent(reminderMessage)}`;
      window.open(url, "_blank");
    } else {
      handleCopyReminder();
    }
    setShowReminderModal(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (plans.length === 0) {
      showToast("No installment records to export", "error");
      return;
    }
    const headers = [
      "Plan No",
      "Customer Name",
      "Phone",
      "Financed Amount",
      "Down Payment",
      "Installment Count",
      "Frequency",
      "EMI Amount",
      "Total Payable",
      "Paid Total",
      "Remaining",
      "Status",
      "Created Date",
    ];

    const csvRows = plans.map((p) => [
      `"${p.planNo}"`,
      `"${(p.customer?.name || "").replace(/"/g, '""')}"`,
      `"${p.customer?.phone || ""}"`,
      p.financedAmount,
      p.downPayment,
      p.installmentCount,
      `"${p.frequency}"`,
      p.installmentAmount,
      p.totalPayable,
      p.paidTotal,
      Number(p.totalPayable || 0) - Number(p.paidTotal || 0),
      `"${p.status}"`,
      `"${p.createdAt?.slice(0, 10)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Installment_Plans_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${plans.length} installment contracts to CSV!`);
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
                <CreditCard size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    Installment Management & BNPL Engine
                  </h1>
                  <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary-700 ring-1 ring-primary-200">
                    Hire Purchase & EMI
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Customer installment contracts · EMI schedule management · Automated collections · Early settlement & restructuring
                </p>
              </div>
            </div>
          </div>

          {/* Navigation & Action Links */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-xs shadow-primary-500/25 transition hover:bg-primary-700 active:scale-95"
            >
              <Plus size={15} />
              Create Installment Plan
            </button>

            <Link
              href="/credit"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              Credit Limits
            </Link>

            <Link
              href="/credit/aging"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              <Calendar size={14} className="text-primary-600" />
              AR Aging
            </Link>

            <Link
              href="/payments"
              className="flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50/70 px-3.5 py-2 text-xs font-semibold text-primary-700 shadow-xs transition hover:bg-primary-100/80 active:scale-95"
            >
              <Wallet size={14} />
              Payments Hub
            </Link>

            <button
              onClick={() => {
                loadPlans();
                loadStats();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
              title="Refresh Data"
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
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-5 space-y-5">
        {/* ── EXECUTIVE KPI SCORECARDS (THEMED TOKENS) ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Total Financed Portfolio */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Financed</span>
              <div className="rounded-lg bg-primary-50 p-1.5 text-primary-600">
                <CreditCard size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {statsLoading ? "—" : fmt(stats?.totalFinanced || 0)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>{stats?.totalPlans || plans.length} Contracts</span>
              <span className="text-primary-600">{stats?.activePlans || 0} Active</span>
            </div>
          </div>

          {/* 2. Total Collected Principal */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Collected</span>
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-emerald-700">
              {statsLoading ? "—" : fmt(stats?.totalCollected || 0)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
              <span>Recovered EMI</span>
              <span>
                {stats?.totalPayable && stats.totalPayable > 0
                  ? `${((stats.totalCollected / stats.totalPayable) * 100).toFixed(0)}%`
                  : "0%"}
              </span>
            </div>
          </div>

          {/* 3. Outstanding Due Balance */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Outstanding Principal</span>
              <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-amber-700">
              {statsLoading ? "—" : fmt(stats?.totalOutstanding || 0)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-amber-600">
              <span>Awaiting maturity</span>
            </div>
          </div>

          {/* 4. Active Contracts */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Active Contracts</span>
              <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-indigo-700">
              {statsLoading ? "—" : `${stats?.activePlans || 0} Plans`}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-indigo-600">
              <span>{stats?.completedPlans || 0} completed</span>
            </div>
          </div>

          {/* 5. Overdue EMI Count */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Overdue EMIs</span>
              <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                <ShieldAlert size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-rose-700">
              {statsLoading ? "—" : `${stats?.overdueScheduleCount || 0} EMIs`}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-rose-600">
              <span>Needs follow-up</span>
            </div>
          </div>

          {/* 6. Overdue Amount Due */}
          <div className="rounded-2xl border border-red-200/80 bg-red-50/40 p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-red-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Overdue Total</span>
              <div className="rounded-lg bg-red-100 p-1.5 text-red-700">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-red-700">
              {statsLoading ? "—" : fmt(stats?.overdueAmount || 0)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-red-700">
              <span>Default Risk</span>
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
                placeholder="Search plan #, customer name, phone, or email..."
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

            {/* Sort & View Mode */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="date">Contract Date</option>
                  <option value="financed">Financed Amount</option>
                  <option value="remaining">Remaining Due</option>
                  <option value="customer">Customer Name</option>
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
            {[
              { id: "ALL", label: "All Contracts", count: stats?.totalPlans || totalRecords },
              { id: "ACTIVE", label: "Active Plans", count: stats?.activePlans },
              { id: "OVERDUE", label: "Overdue / Default Risk", count: stats?.overdueScheduleCount },
              { id: "COMPLETED", label: "Fully Settled", count: stats?.completedPlans },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

        {/* ── INSTALLMENTS TABLE / GRID VIEW ── */}
        {viewMode === "table" ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Plan # & Contract</th>
                    <th className="py-3.5 px-4">Customer & Contact</th>
                    <th className="py-3.5 px-3 text-right">Financed (৳)</th>
                    <th className="py-3.5 px-3 text-right">EMI Amount</th>
                    <th className="py-3.5 px-3 text-center">Tenure / Frequency</th>
                    <th className="py-3.5 px-3 text-right text-emerald-700">Paid Total</th>
                    <th className="py-3.5 px-3 text-right font-bold text-amber-700">Remaining Due</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                        Loading installment plans...
                      </td>
                    </tr>
                  ) : sortedPlans.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        No installment plans matching selected criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedPlans.map((p) => {
                      const remaining = Math.max(0, Number(p.totalPayable || 0) - Number(p.paidTotal || 0));
                      const isComplete = p.status === "COMPLETED" || remaining === 0;
                      const hasOverdue = p.hasOverdueSchedules;

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            hasOverdue ? "bg-red-50/30" : ""
                          }`}
                        >
                          {/* Plan # */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => setSelectedForDrawer(p)}
                              className="font-mono font-bold text-slate-900 hover:text-primary-600 block text-left"
                            >
                              {p.planNo}
                            </button>
                            <div className="text-[11px] text-slate-400">
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-BD") : "—"}
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">
                              {p.customer?.name || "Unknown Customer"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {p.customer?.phone || "No phone registered"}
                            </div>
                          </td>

                          {/* Financed */}
                          <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                            {fmt(p.financedAmount)}
                          </td>

                          {/* EMI */}
                          <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                            {fmt(p.installmentAmount)}
                          </td>

                          {/* Tenure */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {p.installmentCount} × {p.frequency}
                            </span>
                          </td>

                          {/* Paid Total */}
                          <td className="py-3.5 px-3 text-right text-emerald-700 font-semibold">
                            {fmt(p.paidTotal)}
                          </td>

                          {/* Remaining Due */}
                          <td className="py-3.5 px-3 text-right font-bold text-amber-700">
                            {fmt(remaining)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 text-center">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Completed
                              </span>
                            ) : hasOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700 border border-primary-200">
                                Active
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isComplete && (
                                <button
                                  onClick={() => openPayModal(p)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Record EMI Payment"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedPlan(p);
                                  setShowReminderModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors"
                                title="Send EMI Reminder"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedForDrawer(p)}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                                title="View Contract & Schedules"
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
              </table>
            </div>
          </div>
        ) : (
          /* ── GRID / CARD VIEW ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                Loading installment cards...
              </div>
            ) : sortedPlans.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                No installment plans found.
              </div>
            ) : (
              sortedPlans.map((p) => {
                const total = Number(p.totalPayable || p.financedAmount || 1);
                const paid = Number(p.paidTotal || 0);
                const remaining = Math.max(0, total - paid);
                const progressPct = Math.min(100, Math.round((paid / total) * 100));

                return (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 hover:border-primary-300 transition-all ${
                      p.hasOverdueSchedules ? "border-red-300 bg-red-50/15" : "border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          {p.planNo}
                        </span>
                        <div className="text-xs font-semibold text-slate-700 mt-0.5">
                          {p.customer?.name || "Unknown Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400">{p.customer?.phone || "No phone"}</div>
                      </div>
                      {p.status === "COMPLETED" || remaining === 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Settled
                        </span>
                      ) : p.hasOverdueSchedules ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          Overdue
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700 border border-primary-200">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Financed</span>
                        <div className="font-bold text-slate-900 mt-0.5">{fmt(p.financedAmount)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">EMI Amount</span>
                        <div className="font-bold text-slate-900 mt-0.5">{fmt(p.installmentAmount)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Remaining</span>
                        <div className="font-bold text-amber-700 mt-0.5">{fmt(remaining)}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Recovery Progress</span>
                        <span className="text-slate-900 font-bold">{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${progressPct}%` }}
                          className={`h-full transition-all ${
                            progressPct === 100 ? "bg-emerald-500" : "bg-primary-600"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {remaining > 0 && (
                        <button
                          onClick={() => openPayModal(p)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Pay EMI
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPlan(p);
                          setShowReminderModal(true);
                        }}
                        className="p-2 text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all"
                        title="Send Reminder"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedForDrawer(p)}
                        className="p-2 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                        title="View Schedule"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── CREATE NEW INSTALLMENT PLAN MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">New Installment / Hire Purchase Plan</h3>
                  <p className="text-xs text-slate-400">Generate installment contract with automated EMI schedule</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Commercial Client *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Down Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Sale Value (৳) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={createSaleAmount}
                    onChange={(e) => setCreateSaleAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Down Payment (৳)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={createDownPayment}
                    onChange={(e) => setCreateDownPayment(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* Installment Count & Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Installment Count (EMIs) *
                  </label>
                  <select
                    value={createCount}
                    onChange={(e) => setCreateCount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-semibold"
                  >
                    <option value="3">3 Installments</option>
                    <option value="6">6 Installments</option>
                    <option value="9">9 Installments</option>
                    <option value="12">12 Installments (1 Year)</option>
                    <option value="18">18 Installments</option>
                    <option value="24">24 Installments (2 Years)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Frequency *
                  </label>
                  <select
                    value={createFrequency}
                    onChange={(e) => setCreateFrequency(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-semibold"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-Weekly (Fortnightly)</option>
                  </select>
                </div>
              </div>

              {/* Calculated EMI Preview Box */}
              <div className="bg-primary-50/70 border border-primary-200/80 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">
                  Contract Simulation Preview
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px]">Net Financed</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {fmt(calculatedEmi.financed)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Installment EMI</span>
                    <div className="font-black text-primary-700 text-sm">
                      {fmt(calculatedEmi.perEmi)} / {createFrequency.toLowerCase()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Total Payable</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {fmt(calculatedEmi.totalPayable)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contract Remarks / Product Description
                </label>
                <input
                  type="text"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="e.g. Financed Electronics / Commercial Equipment"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-xs shadow-primary-500/25 disabled:opacity-50"
                >
                  {submittingCreate ? "Creating Contract..." : "Confirm & Generate Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAY EMI SCHEDULE MODAL ── */}
      {showPayModal && selectedPlan && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Pay Installment #{selectedSchedule.sequenceNo}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Plan {selectedPlan.planNo} · {selectedPlan.customer?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Scheduled Due Date</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {new Date(selectedSchedule.dueDate).toLocaleDateString("en-BD")}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">EMI Target</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {fmt(selectedSchedule.amount)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (৳) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction / Ref #
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. TR-88319"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {submittingPay ? "Processing..." : "Confirm & Post EMI Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EARLY SETTLEMENT MODAL ── */}
      {showSettleModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Early Settlement & Payoff</h3>
              <button
                onClick={() => setShowSettleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-slate-900">
                    {fmt(Math.max(0, Number(selectedPlan.totalPayable || 0) - Number(selectedPlan.paidTotal || 0)))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Early Settlement Discount / Waiver (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settleDiscount}
                  onChange={(e) => setSettleDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSettle}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {submittingSettle ? "Settling..." : "Confirm Full Payoff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SEND REMINDER MODAL ── */}
      {showReminderModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Send EMI Reminder</h3>
                  <p className="text-xs text-slate-400">
                    Plan {selectedPlan.planNo} · {selectedPlan.customer?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Message Text</label>
                  <button
                    onClick={handleCopyReminder}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                  >
                    {copiedReminder ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedReminder ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono leading-relaxed">
                  {reminderMessage}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminderAction}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs shadow-primary-500/25"
                >
                  {reminderChannel === "WHATSAPP"
                    ? "Open WhatsApp"
                    : reminderChannel === "EMAIL"
                    ? "Open Email Client"
                    : "Send / Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTRACT DETAILS & SCHEDULE SLIDE-OVER DRAWER ── */}
      {selectedForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center border border-primary-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Contract {selectedForDrawer.planNo}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedForDrawer.customer?.name} · {selectedForDrawer.frequency}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedForDrawer(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Financed</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {fmt(selectedForDrawer.financedAmount)}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold">Paid Total</span>
                <div className="text-base font-bold text-emerald-800 mt-0.5">
                  {fmt(selectedForDrawer.paidTotal)}
                </div>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                <span className="text-[10px] text-amber-700 uppercase font-semibold">Remaining</span>
                <div className="text-base font-bold text-amber-800 mt-0.5">
                  {fmt(Math.max(0, Number(selectedForDrawer.totalPayable || 0) - Number(selectedForDrawer.paidTotal || 0)))}
                </div>
              </div>
            </div>

            {/* Schedules Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  EMI Installment Schedule ({selectedForDrawer.schedules?.length || 0} Terms)
                </h4>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Target EMI</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedForDrawer.schedules?.map((sc) => (
                      <tr key={sc.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-700">#{sc.sequenceNo}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(sc.dueDate).toLocaleDateString("en-BD")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {fmt(sc.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                          {sc.paidAmount > 0 ? fmt(sc.paidAmount) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {sc.status === "PAID" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Paid
                            </span>
                          ) : sc.isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {sc.status !== "PAID" && (
                            <button
                              onClick={() => {
                                setSelectedPlan(selectedForDrawer);
                                setSelectedSchedule(sc);
                                setPayAmount(String(Number(sc.amount) - Number(sc.paidAmount || 0)));
                                setShowPayModal(true);
                              }}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Drawer Actions */}
            {selectedForDrawer.status === "ACTIVE" && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedPlan(selectedForDrawer);
                    setShowSettleModal(true);
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                >
                  Early Settlement / Payoff
                </button>
                <button
                  onClick={() => {
                    setSelectedPlan(selectedForDrawer);
                    setShowReminderModal(true);
                  }}
                  className="py-2.5 px-4 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all"
                >
                  Send Reminder
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
