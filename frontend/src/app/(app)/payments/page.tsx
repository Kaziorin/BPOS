"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  RefreshCw,
  Search,
  Plus,
  Download,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building2,
  Phone,
  User,
  Wallet,
  Banknote,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  Copy,
  Check,
  Sparkles,
  ArrowUpRight,
  PlusCircle,
  ShieldCheck,
  Clock,
  LayoutList,
  LayoutGrid,
  Ban,
  DollarSign,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference?: string | null;
  status: "COMPLETED" | "REFUNDED" | "PENDING" | "FAILED" | string;
  createdAt: string;
  updatedAt?: string;
  branchId?: string;
  branchName?: string;
  customerId?: string | null;
  customer?: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  invoiceId?: string | null;
  invoice?: {
    id?: string;
    invoiceNo?: string;
    total?: number;
    paidTotal?: number;
    status?: string;
  } | null;
}

interface PaymentStats {
  totalCount: number;
  totalAmount: number;
  refundAmount: number;
  refundCount: number;
  todayAmount: number;
  todayCount: number;
  cashAmount: number;
  mfsAmount: number;
  cardAmount: number;
  bankAmount: number;
  byMethod?: Array<{ method: string; count: number; totalAmount: number }>;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  currentDue?: number;
}

interface InvoiceOption {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName?: string;
  total: number;
  paidTotal: number;
  status: string;
}

interface BranchOption {
  id: string;
  name: string;
  code?: string;
}

const METHOD_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; ring: string; icon: any }
> = {
  CASH: { label: "Cash Drawer", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", icon: Banknote },
  BKASH: { label: "bKash", bg: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-200", icon: Wallet },
  NAGAD: { label: "Nagad", bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", icon: Wallet },
  ROCKET: { label: "Rocket", bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200", icon: Wallet },
  CARD: { label: "Card / POS", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", icon: CreditCard },
  POS: { label: "POS Terminal", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", icon: CreditCard },
  BANK_TRANSFER: { label: "Bank Transfer", bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", icon: Building2 },
  BANK: { label: "Bank Deposit", bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", icon: Building2 },
  CHEQUE: { label: "Bank Cheque", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", icon: Receipt },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  COMPLETED: { label: "Settled / Paid", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  REFUNDED: { label: "Refunded / Void", bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  PENDING: { label: "Pending Processing", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  FAILED: { label: "Failed / Declined", bg: "bg-slate-100 border-slate-200", text: "text-slate-500", dot: "bg-slate-400" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection & Batch
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Auxiliary data
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [openInvoices, setOpenInvoices] = useState<InvoiceOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<Payment | null>(null);
  const [selectedPaymentForDrawer, setSelectedPaymentForDrawer] = useState<Payment | null>(null);

  // Record Payment Form
  const [recordForm, setRecordForm] = useState({
    customerId: "",
    invoiceId: "",
    branchId: "",
    amount: "",
    method: "CASH",
    reference: "",
    note: "",
  });
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  // Multi-Allocation Form
  const [allocCustId, setAllocCustId] = useState("");
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocMethod, setAllocMethod] = useState("CASH");
  const [allocRef, setAllocRef] = useState("");
  const [allocRows, setAllocRows] = useState<Array<{ invoiceId: string; invoiceNo: string; total: number; paidTotal: number; due: number; allocated: number }>>([]);
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  // Feedback notifications
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

  // Load Reference Data
  useEffect(() => {
    async function loadAux() {
      try {
        const [cRes, bRes, iRes]: any = await Promise.all([
          api.get("/v1/customers?limit=250").catch(() => ({ data: { data: [] } })),
          api.get("/v1/branches?limit=50").catch(() => ({ data: { data: [] } })),
          api.get("/v1/invoices?status=UNPAID&limit=100").catch(() => ({ data: { data: [] } })),
        ]);
        setCustomers(cRes.data?.data ?? []);
        const bList = bRes.data?.data ?? [];
        setBranches(bList);
        setOpenInvoices(iRes.data?.data ?? []);
        if (bList.length > 0 && !recordForm.branchId) {
          setRecordForm((p) => ({ ...p, branchId: bList[0].id }));
        }
      } catch (err) {
        console.error("Failed to load reference data", err);
      }
    }
    loadAux();
  }, []);

  // Load Executive Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res: any = await api.get("/v1/payments/stats");
      setStats(res.data?.data ?? null);
    } catch (err) {
      console.error("Failed to load payment stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Payments List
  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);

      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (filterMethod) params.set("method", filterMethod);
      if (filterBranch) params.set("branchId", filterBranch);

      // Status / Tab
      if (activeTab === "COMPLETED") params.set("status", "COMPLETED");
      else if (activeTab === "REFUNDED") params.set("status", "REFUNDED");
      else if (activeTab === "CASH") params.set("method", "CASH");
      else if (activeTab === "MFS") params.set("method", "BKASH");
      else if (activeTab === "CARD") params.set("method", "CARD");
      else if (activeTab === "BANK") params.set("method", "BANK_TRANSFER");

      // Dates
      if (dateRange === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        params.set("dateFrom", todayStr);
        params.set("dateTo", todayStr);
      } else if (dateRange === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.set("dateFrom", d.toISOString().split("T")[0]);
      } else if (dateRange === "month") {
        const d = new Date();
        d.setDate(1);
        params.set("dateFrom", d.toISOString().split("T")[0]);
      }

      const res: any = await api.get(`/v1/payments?${params.toString()}`);
      const dataList = res.data?.data ?? [];
      setPayments(dataList);

      const pagination = res.data?.pagination || res.data?.extra?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalRecords(pagination.total || dataList.length);
      } else {
        setTotalPages(1);
        setTotalRecords(dataList.length);
      }
    } catch (err: any) {
      console.error("Failed to load payments", err);
      showToast(err.response?.data?.error ?? "Error loading payments", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, searchQuery, filterMethod, filterBranch, activeTab, dateRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Handle Record Payment
  const handleRecordPayment = async () => {
    const numAmount = Number(recordForm.amount);
    if (!numAmount || numAmount <= 0) {
      showToast("Please enter a valid amount greater than 0", "error");
      return;
    }

    setRecordSubmitting(true);
    try {
      const res: any = await api.post("/v1/payments", {
        amount: numAmount,
        method: recordForm.method,
        reference: recordForm.reference || undefined,
        customerId: recordForm.customerId || undefined,
        invoiceId: recordForm.invoiceId || undefined,
        branchId: recordForm.branchId || undefined,
        note: recordForm.note || undefined,
      });

      showToast(`Payment of ৳${numAmount.toLocaleString()} recorded successfully!`);
      setShowRecordModal(false);
      setRecordForm({
        customerId: "",
        invoiceId: "",
        branchId: branches[0]?.id || "",
        amount: "",
        method: "CASH",
        reference: "",
        note: "",
      });
      loadPayments();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to record payment", "error");
    } finally {
      setRecordSubmitting(false);
    }
  };

  // Handle Refund Payment
  const handleConfirmRefund = async () => {
    if (!selectedPaymentForRefund) return;
    try {
      await api.post(`/v1/payments/${selectedPaymentForRefund.id}/refund`);
      showToast(`Payment ${selectedPaymentForRefund.reference || selectedPaymentForRefund.id} refunded successfully!`);
      setShowRefundModal(false);
      setSelectedPaymentForRefund(null);
      if (selectedPaymentForDrawer?.id === selectedPaymentForRefund.id) {
        setSelectedPaymentForDrawer(null);
      }
      loadPayments();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to refund payment", "error");
    }
  };

  // Handle Customer Selection for Allocation
  const handleCustomerSelectForAlloc = async (cid: string) => {
    setAllocCustId(cid);
    if (!cid) {
      setAllocRows([]);
      return;
    }
    try {
      const res: any = await api.get(`/v1/invoices?customerId=${cid}&status=UNPAID&limit=50`);
      const unpaids = res.data?.data ?? [];
      setAllocRows(
        unpaids.map((inv: any) => ({
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          total: Number(inv.total),
          paidTotal: Number(inv.paidTotal),
          due: Math.max(0, Number(inv.total) - Number(inv.paidTotal)),
          allocated: 0,
        }))
      );
    } catch (err) {
      console.error("Failed to load customer unpaid invoices", err);
    }
  };

  const handleAutoDistributeAlloc = () => {
    let remaining = Number(allocAmount) || 0;
    const updated = allocRows.map((r) => {
      const allocateForThis = Math.min(remaining, r.due);
      remaining -= allocateForThis;
      return { ...r, allocated: allocateForThis };
    });
    setAllocRows(updated);
  };

  const handleSubmitAllocation = async () => {
    const totalAllocated = allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0);
    if (Math.abs(totalAllocated - Number(allocAmount)) > 0.01) {
      showToast(`Total allocated (৳${totalAllocated.toLocaleString()}) must match settlement amount (৳${Number(allocAmount).toLocaleString()})`, "error");
      return;
    }
    const activeAllocations = allocRows
      .filter((r) => (Number(r.allocated) || 0) > 0)
      .map((r) => ({ invoiceId: r.invoiceId, amount: Number(r.allocated) }));

    if (activeAllocations.length === 0) {
      showToast("Please allocate amounts to at least one invoice", "error");
      return;
    }

    setAllocSubmitting(true);
    try {
      await api.post("/v1/invoices/payments/allocate", {
        customerId: allocCustId || undefined,
        branchId: recordForm.branchId || undefined,
        method: allocMethod,
        totalAmount: Number(allocAmount),
        reference: allocRef || "Consolidated payment allocation settlement",
        allocations: activeAllocations,
      });
      showToast(`Settled payment of ৳${Number(allocAmount).toLocaleString()} across ${activeAllocations.length} invoices!`, "success");
      setShowAllocateModal(false);
      loadPayments();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to allocate payment", "error");
    } finally {
      setAllocSubmitting(false);
    }
  };

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === payments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(payments.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export to CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0 ? payments.filter((p) => selectedIds.includes(p.id)) : payments;
    if (listToExport.length === 0) {
      showToast("No payment records to export", "error");
      return;
    }
    const headers = ["Receipt / Trx ID", "Method", "Amount", "Status", "Customer", "Customer Phone", "Invoice No", "Date", "Branch"];
    const rows = listToExport.map((p) => [
      `"${p.reference || p.id}"`,
      p.method,
      p.amount,
      p.status,
      `"${p.customer?.name || "Walk-in"}"`,
      `"${p.customer?.phone || ""}"`,
      `"${p.invoice?.invoiceNo || "Direct"}"`,
      p.createdAt,
      `"${p.branchName || "Main"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} payment records!`);
  };

  // Selected customer due helper in create modal
  const selectedCustObj = useMemo(() => {
    return customers.find((c) => c.id === recordForm.customerId);
  }, [customers, recordForm.customerId]);

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
                <Wallet size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Payment & Collection Hub</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">
                    Real-time Settlement
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Accounts receivable receipts · Multi-channel collections · Bulk FIFO allocation & refunds
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
              Invoices Engine
            </Link>

            <button
              onClick={() => setShowAllocateModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50/70 px-3.5 py-2 text-xs font-semibold text-primary-700 shadow-xs transition hover:bg-primary-100/80 active:scale-95"
            >
              <CreditCard size={14} />
              Bulk Settle
            </button>

            <button
              onClick={() => setShowRecordModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-500/25 transition hover:brightness-110 active:scale-95"
            >
              <Plus size={16} className="stroke-[2.5]" />
              Record Payment
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-5">
        {/* Executive KPI Stats Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Total Collections */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Collected</span>
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-emerald-700">
              {statsLoading ? "—" : `৳${Number(stats?.totalAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>{stats?.totalCount || payments.length} transactions</span>
            </div>
          </div>

          {/* 2. Today's Collections */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">Today's Inflow</span>
              <div className="rounded-lg bg-primary-50 p-1.5 text-primary-700">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {statsLoading ? "—" : `৳${Number(stats?.todayAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary-700">
              <span>{stats?.todayCount || 0} today</span>
            </div>
          </div>

          {/* 3. Cash in Hand */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cash Drawer</span>
              <div className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                <Banknote size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {statsLoading ? "—" : `৳${Number(stats?.cashAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>Physical Currency</span>
            </div>
          </div>

          {/* 4. Digital MFS (bKash/Nagad) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600">Mobile MFS</span>
              <div className="rounded-lg bg-pink-50 p-1.5 text-pink-600">
                <Wallet size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-pink-700">
              {statsLoading ? "—" : `৳${Number(stats?.mfsAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-pink-600">
              <span>bKash · Nagad · Rocket</span>
            </div>
          </div>

          {/* 5. Cards & POS */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">Cards / POS</span>
              <div className="rounded-lg bg-sky-50 p-1.5 text-sky-600">
                <CreditCard size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-sky-700">
              {statsLoading ? "—" : `৳${Number(stats?.cardAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sky-600">
              <span>Visa · Master · POS</span>
            </div>
          </div>

          {/* 6. Refunds & Voids */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Refunds</span>
              <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                <RotateCcw size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-rose-700">
              {statsLoading ? "—" : `৳${Number(stats?.refundAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
              <span>{stats?.refundCount || 0} reversed</span>
            </div>
          </div>
        </div>

        {/* Channel Breakdown Intelligence Bar */}
        {stats?.byMethod && stats.byMethod.length > 0 && (
          <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Payment Channels & Settlement Share
                </h3>
                <p className="text-[11px] text-slate-500">Live breakdown of received revenues across payment gateways</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {stats.byMethod.map((bm) => {
                  const cfg = METHOD_CONFIG[bm.method] || METHOD_CONFIG.CASH;
                  const Icon = cfg.icon;
                  const pct = stats.totalAmount > 0 ? Math.round((bm.totalAmount / stats.totalAmount) * 100) : 0;
                  return (
                    <div
                      key={bm.method}
                      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border border-slate-100 ${cfg.bg}`}
                    >
                      <Icon size={14} className={cfg.text} />
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}:</span>
                        <span className="font-black text-slate-900 text-xs">৳{bm.totalAmount.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Batch Operations Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary-800 via-primary-700 to-indigo-800 px-5 py-3 text-xs text-white shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-primary-200" />
              <span className="font-bold">{selectedIds.length} payment records selected</span>
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
                { id: "ALL", label: "All Receipts" },
                { id: "COMPLETED", label: "Settled" },
                { id: "CASH", label: "Cash" },
                { id: "MFS", label: "Mobile MFS" },
                { id: "CARD", label: "Card / POS" },
                { id: "BANK", label: "Bank Transfer" },
                { id: "REFUNDED", label: "Refunds / Void" },
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
                  loadPayments();
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

          {/* Search and Dropdown Filters */}
          <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt #, customer, phone, invoice..."
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

            {/* Payment Method Filter */}
            <div>
              <select
                value={filterMethod}
                onChange={(e) => {
                  setFilterMethod(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">All Payment Methods</option>
                <option value="CASH">Cash Drawer</option>
                <option value="BKASH">bKash Merchant</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="CARD">Card / POS</option>
                <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={filterBranch}
                onChange={(e) => {
                  setFilterBranch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">All Outlets / Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table / Grid */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
            <RefreshCw size={28} className="animate-spin text-primary-600" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Loading payment records...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
            <div className="rounded-2xl bg-primary-50 p-4 text-primary-600">
              <Receipt size={36} />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">No payment records found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              No payments matched your criteria. Record a customer payment or adjust your search filters.
            </p>
            <button
              onClick={() => setShowRecordModal(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-500/25 hover:bg-primary-700"
            >
              <Plus size={15} />
              Record First Payment
            </button>
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
                        {selectedIds.length === payments.length && payments.length > 0 ? (
                          <CheckSquare size={16} className="text-primary-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 pl-2 pr-3">Receipt / Reference</th>
                    <th className="px-3 py-3.5">Customer</th>
                    <th className="px-3 py-3.5">Payment Method</th>
                    <th className="px-3 py-3.5">Linked Invoice</th>
                    <th className="px-3 py-3.5 text-right">Amount (৳)</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="px-3 py-3.5">Date & Time</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    const methodCfg = METHOD_CONFIG[p.method] || METHOD_CONFIG.CASH;
                    const MethodIcon = methodCfg.icon;
                    const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.COMPLETED;
                    const isRefunded = p.status === "REFUNDED";

                    return (
                      <tr key={p.id} className={`group transition ${isSelected ? "bg-primary-50/30" : "hover:bg-slate-50/70"}`}>
                        {/* Checkbox */}
                        <td className="py-3.5 pl-4 pr-2">
                          <button onClick={() => toggleSelectRow(p.id)} className="text-slate-400 hover:text-slate-700">
                            {isSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Reference / ID */}
                        <td className="py-3.5 pl-2 pr-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => copyToClipboard(p.reference || p.id, p.id)}
                                className="cursor-pointer font-mono font-bold text-slate-900 transition hover:text-primary-600"
                                title="Click to copy receipt #"
                              >
                                {p.reference || `PAY-${p.id.slice(0, 8)}`}
                              </span>
                              {copiedId === p.id ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} className="text-slate-300 opacity-0 transition group-hover:opacity-100" />
                              )}
                            </div>
                            {p.branchName && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                • {p.branchName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-3 py-3.5">
                          {p.customer ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{p.customer.name}</span>
                              {p.customer.phone && <span className="text-[11px] text-slate-400">{p.customer.phone}</span>}
                            </div>
                          ) : (
                            <span className="font-medium italic text-slate-400">Walk-in Customer</span>
                          )}
                        </td>

                        {/* Method */}
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${methodCfg.bg} ${methodCfg.text}`}
                          >
                            <MethodIcon size={13} />
                            {methodCfg.label}
                          </span>
                        </td>

                        {/* Linked Invoice */}
                        <td className="px-3 py-3.5">
                          {p.invoice?.invoiceNo ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-slate-800">{p.invoice.invoiceNo}</span>
                              <span className="text-[10px] text-slate-400">Total: ৳{Number(p.invoice.total || 0).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Direct Receipt</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className={`px-3 py-3.5 text-right font-black tabular-nums text-sm ${isRefunded ? "text-rose-600 line-through" : "text-emerald-700"}`}>
                          ৳{Number(p.amount).toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-3 py-3.5 text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View / Receipt Drawer */}
                            <button
                              onClick={() => setSelectedPaymentForDrawer(p)}
                              title="Payment Receipt & Audit"
                              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Refund Action */}
                            {!isRefunded && (
                              <button
                                onClick={() => {
                                  setSelectedPaymentForRefund(p);
                                  setShowRefundModal(true);
                                }}
                                title="Refund / Void Payment"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                              >
                                <RotateCcw size={15} />
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
                Showing {payments.length} of {totalRecords} records (Page {page} of {totalPages})
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
              {payments.map((p) => {
                const methodCfg = METHOD_CONFIG[p.method] || METHOD_CONFIG.CASH;
                const MethodIcon = methodCfg.icon;
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.COMPLETED;
                const isRefunded = p.status === "REFUNDED";

                return (
                  <div
                    key={p.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-sm font-bold text-slate-900">
                            {p.reference || `PAY-${p.id.slice(0, 8)}`}
                          </div>
                          <span className={`mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${methodCfg.bg} ${methodCfg.text}`}>
                            <MethodIcon size={12} />
                            {methodCfg.label}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</p>
                        <p className="text-xs font-bold text-slate-800">{p.customer?.name || "Walk-in Customer"}</p>
                        {p.customer?.phone && <p className="text-[11px] text-slate-500">{p.customer.phone}</p>}
                      </div>

                      {/* Financial Amount */}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Collected Amount</span>
                        <span className={`text-lg font-black tabular-nums ${isRefunded ? "text-rose-600 line-through" : "text-emerald-700"}`}>
                          ৳{Number(p.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedPaymentForDrawer(p)}
                          className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-primary-700"
                        >
                          <Eye size={13} />
                          Receipt
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
                Page {page} of {totalPages} ({totalRecords} total records)
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
      {/* 1. RECORD PAYMENT MODAL (Device Friendly)                 */}
      {/* ========================================================= */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-200/60">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">Record Customer Payment</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Collect due settlement, advance receipt, or invoice payment</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Branch and Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Outlet / Branch *</label>
                  <select
                    value={recordForm.branchId}
                    onChange={(e) => setRecordForm((p) => ({ ...p, branchId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold focus:border-primary-500 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Customer (Optional)</label>
                  <select
                    value={recordForm.customerId}
                    onChange={(e) => setRecordForm((p) => ({ ...p, customerId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Walk-in Customer (General Public)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""} {c.currentDue ? `[Due: ৳${Number(c.currentDue).toLocaleString()}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Current Due Callout if selected */}
              {selectedCustObj && Number(selectedCustObj.currentDue || 0) > 0 && (
                <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-700">Customer Current Outstanding</span>
                    <p className="font-black text-amber-900 text-sm">৳{Number(selectedCustObj.currentDue).toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecordForm((p) => ({ ...p, amount: String(selectedCustObj.currentDue) }))}
                    className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700"
                  >
                    Fill Full Due
                  </button>
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <label className="mb-1 block font-bold text-slate-700">Payment Amount (৳) *</label>
                <input
                  type="number"
                  min={1}
                  placeholder="0.00"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 p-3 text-base font-black text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">Payment Channel *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "CASH", label: "Cash", icon: Banknote },
                    { id: "BKASH", label: "bKash", icon: Wallet },
                    { id: "NAGAD", label: "Nagad", icon: Wallet },
                    { id: "CARD", label: "Card / POS", icon: CreditCard },
                    { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2 },
                    { id: "CHEQUE", label: "Cheque", icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = recordForm.method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setRecordForm((p) => ({ ...p, method: m.id }))}
                        className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold border transition ${
                          active
                            ? "bg-primary-50 border-primary-500 text-primary-700 ring-2 ring-primary-500/20 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={15} className={active ? "text-primary-600" : "text-slate-400"} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference and Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Receipt / Transaction ID</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={recordForm.reference}
                    onChange={(e) => setRecordForm((p) => ({ ...p, reference: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Optional Target Invoice</label>
                  <select
                    value={recordForm.invoiceId}
                    onChange={(e) => setRecordForm((p) => ({ ...p, invoiceId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">-- Standalone / General Credit --</option>
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNo} [Due: ৳{Math.max(0, Number(inv.total) - Number(inv.paidTotal)).toLocaleString()}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Payment Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={recordForm.note}
                  onChange={(e) => setRecordForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Additional settlement remarks..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowRecordModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recordSubmitting}
                onClick={handleRecordPayment}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {recordSubmitting ? "Recording..." : "Confirm & Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. REFUND PAYMENT MODAL                                   */}
      {/* ========================================================= */}
      {showRefundModal && selectedPaymentForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Payment Refund</h3>
                <p className="text-xs text-slate-500">Reverse transaction & restore customer balance</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 space-y-1.5 text-xs border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Ref:</span>
                <span className="font-mono font-bold text-slate-800">{selectedPaymentForRefund.reference || selectedPaymentForRefund.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{selectedPaymentForRefund.customer?.name || "Walk-in"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Refund Amount:</span>
                <span className="font-black text-rose-600 text-sm">৳{Number(selectedPaymentForRefund.amount).toLocaleString()}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              This action will mark the receipt as <span className="font-bold text-rose-600">REFUNDED</span> and re-add ৳{Number(selectedPaymentForRefund.amount).toLocaleString()} to the customer's open due balance.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 active:scale-95"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MULTI-INVOICE PAYMENT ALLOCATION MODAL                 */}
      {/* ========================================================= */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-bold border border-primary-200/60">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bulk Allocate Payment</h3>
                  <p className="text-[11px] text-slate-500">Apply single consolidated settlement across customer invoices</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Select Customer *</label>
                  <select
                    value={allocCustId}
                    onChange={(e) => handleCustomerSelectForAlloc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Total Settlement Amount (৳) *</label>
                  <input
                    type="number"
                    min={1}
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(Number(e.target.value))}
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-black text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Payment Channel</label>
                  <select
                    value={allocMethod}
                    onChange={(e) => setAllocMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="CASH">Cash Drawer</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="CARD">Card / POS</option>
                    <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Reference / Notes</label>
                  <input
                    type="text"
                    value={allocRef}
                    onChange={(e) => setAllocRef(e.target.value)}
                    placeholder="Transaction ID or Cheque #"
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Invoices to allocate table */}
              <div className="mt-2">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <span className="font-bold text-slate-800">Unpaid Invoices for Allocation</span>
                  {allocRows.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoDistributeAlloc}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:underline"
                    >
                      <Sparkles size={13} />
                      Auto-Distribute (FIFO / Oldest First)
                    </button>
                  )}
                </div>

                {allocRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-400">
                    {allocCustId ? "No unpaid invoices found for this customer" : "Select a customer to view open invoices"}
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                          <th className="py-2 pl-3">Invoice #</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="py-2 text-right">Paid</th>
                          <th className="py-2 text-right">Due</th>
                          <th className="py-2 pr-3 text-right w-28">Allocate (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allocRows.map((r, idx) => (
                          <tr key={r.invoiceId} className="bg-white">
                            <td className="py-2 pl-3 font-mono font-bold text-slate-800">{r.invoiceNo}</td>
                            <td className="py-2 text-right text-slate-600">৳{r.total.toLocaleString()}</td>
                            <td className="py-2 text-right text-emerald-600">৳{r.paidTotal.toLocaleString()}</td>
                            <td className="py-2 text-right font-bold text-rose-600">৳{r.due.toLocaleString()}</td>
                            <td className="py-2 pr-3 text-right">
                              <input
                                type="number"
                                min={0}
                                max={r.due}
                                value={r.allocated}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const updated = [...allocRows];
                                  updated[idx].allocated = val;
                                  setAllocRows(updated);
                                }}
                                className="w-24 rounded-lg border border-slate-200 p-1 text-right text-xs font-bold text-primary-700 focus:border-primary-500 focus:outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5 bg-slate-50/80">
              <div className="text-xs">
                <span className="text-slate-500">Total Allocated: </span>
                <span className="font-black text-slate-900">
                  ৳{allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0).toLocaleString()}
                </span>
                <span className="text-slate-400"> / ৳{Number(allocAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={allocSubmitting || allocRows.length === 0}
                  onClick={handleSubmitAllocation}
                  className="flex items-center gap-1 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-primary-700 disabled:opacity-50"
                >
                  {allocSubmitting ? "Settling..." : "Settle Invoices"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PAYMENT RECEIPT SLIDE-OVER DRAWER                      */}
      {/* ========================================================= */}
      {selectedPaymentForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col overflow-hidden transition-all animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Receipt</span>
                <h3 className="font-mono text-lg font-black text-slate-900">
                  {selectedPaymentForDrawer.reference || `PAY-${selectedPaymentForDrawer.id.slice(0, 8)}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPaymentForDrawer(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Receipt Amount Hero */}
              <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/40 p-5 text-center shadow-2xs">
                <span className="text-[11px] font-bold uppercase text-slate-500">Collected Amount</span>
                <div className="mt-1 text-3xl font-black text-primary-700">
                  ৳{Number(selectedPaymentForDrawer.amount).toLocaleString()}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                      STATUS_CONFIG[selectedPaymentForDrawer.status]?.bg || ""
                    } ${STATUS_CONFIG[selectedPaymentForDrawer.status]?.text || ""}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedPaymentForDrawer.status]?.dot || ""}`} />
                    {selectedPaymentForDrawer.status}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">• {selectedPaymentForDrawer.method}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Client / Payer Details</span>
                <p className="text-sm font-bold text-slate-800">
                  {selectedPaymentForDrawer.customer?.name || "Walk-in Customer"}
                </p>
                {selectedPaymentForDrawer.customer?.phone && (
                  <p className="flex items-center gap-1 text-slate-500">
                    <Phone size={13} /> {selectedPaymentForDrawer.customer.phone}
                  </p>
                )}
                {selectedPaymentForDrawer.customer?.address && (
                  <p className="text-slate-500">{selectedPaymentForDrawer.customer.address}</p>
                )}
              </div>

              {/* Invoice Link */}
              {selectedPaymentForDrawer.invoice && (
                <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Target Invoice</span>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-800">{selectedPaymentForDrawer.invoice.invoiceNo}</span>
                    <span className="font-bold text-primary-700">৳{Number(selectedPaymentForDrawer.invoice.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Transaction Metadata */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2 text-xs">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Audit & Trace</span>
                <div className="flex justify-between text-slate-600">
                  <span>Transaction ID:</span>
                  <span className="font-mono">{selectedPaymentForDrawer.id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date & Time:</span>
                  <span>{new Date(selectedPaymentForDrawer.createdAt).toLocaleString()}</span>
                </div>
                {selectedPaymentForDrawer.branchName && (
                  <div className="flex justify-between text-slate-600">
                    <span>Outlet:</span>
                    <span>{selectedPaymentForDrawer.branchName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50/80">
              {selectedPaymentForDrawer.status !== "REFUNDED" && (
                <button
                  onClick={() => {
                    setSelectedPaymentForRefund(selectedPaymentForDrawer);
                    setShowRefundModal(true);
                  }}
                  className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  Refund Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
