"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Plus,
  Download,
  Printer,
  X,
  CheckCircle2,
  RotateCcw,
  Building2,
  Phone,
  Wallet,
  Banknote,
  Receipt,
  FileText,
  Eye,
  CheckSquare,
  Square,
  Copy,
  Check,
  Sparkles,
  Clock,
  LayoutList,
  LayoutGrid,
  Zap,
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

interface Payment {
  id: string;
  amount: number;
  tenderedAmount?: number;
  changeAmount?: number;
  paymentType?: "POS_SALE" | "DUE_COLLECTION" | string;
  saleId?: string | null;
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
  dueCollectedAmount?: number;
  dueCollectedCount?: number;
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
  CARD: { label: "Card / POS", bg: "bg-brand-50", text: "text-brand-primary", ring: "ring-brand-border", icon: CreditCard },
  POS: { label: "POS Terminal", bg: "bg-brand-50", text: "text-brand-primary", ring: "ring-brand-border", icon: CreditCard },
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
  FAILED: { label: "Failed / Declined", bg: "bg-slate-100 border-slate-200", text: "text-gray-500", dot: "bg-slate-400" },
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy] = useState("createdAt");
  const [sortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection & Batch
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
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
  const [allocRows, setAllocRows] = useState<
    Array<{ invoiceId: string; invoiceNo: string; total: number; paidTotal: number; due: number; allocated: number }>
  >([]);
  const [allocSubmitting, setAllocSubmitting] = useState(false);

  // Feedback notifications
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Load Reference Data
  useEffect(() => {
    async function loadAux() {
      try {
        const [cRes, bRes, iRes]: any = await Promise.all([
          api.get("/v1/customers?limit=250").catch(() => ({ data: [] })),
          api.get("/v1/branches?limit=50").catch(() => ({ data: [] })),
          api.get("/v1/invoices?status=UNPAID&limit=100").catch(() => ({ data: [] })),
        ]);
        const cList = Array.isArray(cRes?.data) ? cRes.data : (Array.isArray(cRes) ? cRes : (cRes?.data?.data ?? []));
        setCustomers(Array.isArray(cList) ? cList : []);
        const bList = Array.isArray(bRes?.data) ? bRes.data : (Array.isArray(bRes) ? bRes : (bRes?.data?.data ?? []));
        setBranches(Array.isArray(bList) ? bList : []);
        const iList = Array.isArray(iRes?.data) ? iRes.data : (Array.isArray(iRes) ? iRes : (iRes?.data?.data ?? []));
        setOpenInvoices(Array.isArray(iList) ? iList : []);
        if (Array.isArray(bList) && bList.length > 0 && !recordForm.branchId) {
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
      const statsData = res?.data?.data ?? res?.data ?? res ?? null;
      setStats(statsData);
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
      if (activeTab === "DUE_COLLECTION") params.set("paymentType", "DUE_COLLECTION");
      else if (activeTab === "POS_SALE") params.set("paymentType", "POS_SALE");
      else if (activeTab === "COMPLETED") params.set("status", "COMPLETED");
      else if (activeTab === "REFUNDED") params.set("status", "REFUNDED");
      else if (activeTab === "CASH") params.set("method", "CASH");
      else if (activeTab === "MFS") params.set("method", "BKASH");
      else if (activeTab === "CARD") params.set("method", "CARD");
      else if (activeTab === "BANK") params.set("method", "BANK_TRANSFER");

      // Dates
      if (startDate) params.set("dateFrom", startDate);
      if (endDate) params.set("dateTo", endDate);

      const res: any = await api.get(`/v1/payments?${params.toString()}`);
      const dataList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : (res?.data?.data ?? []);
      setPayments(dataList);

      const pagination = res?.extra?.pagination || res?.pagination || res?.data?.pagination || res?.data?.extra?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalRecords(pagination.total || dataList.length);
      } else {
        setTotalPages(1);
        setTotalRecords(dataList.length);
      }
    } catch (err: any) {
      console.error("Failed to load payments", err);
      toast.error(err.response?.data?.error ?? err.message ?? "Error loading payments");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, searchQuery, filterMethod, filterBranch, activeTab, startDate, endDate]);

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
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setRecordSubmitting(true);
    try {
      await api.post("/v1/payments", {
        amount: numAmount,
        method: recordForm.method,
        reference: recordForm.reference || undefined,
        customerId: recordForm.customerId || undefined,
        invoiceId: recordForm.invoiceId || undefined,
        branchId: recordForm.branchId || undefined,
        note: recordForm.note || undefined,
      });

      toast.success(`Payment of ৳${numAmount.toLocaleString()} recorded successfully!`);
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
      toast.error(err.response?.data?.error ?? "Failed to record payment");
    } finally {
      setRecordSubmitting(false);
    }
  };

  // Handle Refund Payment
  const handleConfirmRefund = async () => {
    if (!selectedPaymentForRefund) return;
    try {
      await api.post(`/v1/payments/${selectedPaymentForRefund.id}/refund`);
      toast.success(
        `Payment ${selectedPaymentForRefund.reference || selectedPaymentForRefund.id} refunded successfully!`
      );
      setShowRefundModal(false);
      setSelectedPaymentForRefund(null);
      if (selectedPaymentForDrawer?.id === selectedPaymentForRefund.id) {
        setSelectedPaymentForDrawer(null);
      }
      loadPayments();
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to refund payment");
    }
  };

  // Handle Customer Selection for Allocation
  const handleCustomerSelectForAlloc = async (cid: string) => {
    setAllocCustId(cid);
    if (!cid) {
      setAllocRows([]);
      setAllocAmount(0);
      return;
    }
    try {
      const res: any = await api.get(`/v1/invoices?customerId=${cid}&status=UNPAID&limit=50`);
      const unpaids = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (res?.data?.data ?? []));
      const rows = unpaids.map((inv: any) => {
        const total = Number(inv.total) || 0;
        const paidTotal = Number(inv.paidTotal) || 0;
        const due = Math.max(0, total - paidTotal);
        return {
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          total,
          paidTotal,
          due,
          allocated: due, // Auto-allocate full due by default for 1-click settlement
        };
      });
      const totalDue = rows.reduce((s: number, r: any) => s + r.due, 0);
      setAllocRows(rows);
      setAllocAmount(totalDue);
    } catch (err) {
      console.error("Failed to load customer unpaid invoices", err);
    }
  };

  const handleSettlementAmountChange = (valStr: string) => {
    const newAmt = Math.max(0, Number(valStr) || 0);
    setAllocAmount(newAmt);
    let remaining = newAmt;
    const updated = allocRows.map((r) => {
      const allocateForThis = Math.min(remaining, r.due);
      remaining -= allocateForThis;
      return { ...r, allocated: allocateForThis };
    });
    setAllocRows(updated);
  };

  const handleAutoDistributeAlloc = () => {
    let remaining = Number(allocAmount) || 0;
    if (remaining <= 0) {
      remaining = allocRows.reduce((s, r) => s + r.due, 0);
      setAllocAmount(remaining);
    }
    const updated = allocRows.map((r) => {
      const allocateForThis = Math.min(remaining, r.due);
      remaining -= allocateForThis;
      return { ...r, allocated: allocateForThis };
    });
    setAllocRows(updated);
  };

  const handleSetRowAllocated = (idx: number, val: number) => {
    const updated = [...allocRows];
    const clamped = Math.max(0, Math.min(updated[idx].due, val));
    updated[idx].allocated = clamped;
    setAllocRows(updated);
    const newTotal = updated.reduce((s, r) => s + (Number(r.allocated) || 0), 0);
    setAllocAmount(newTotal);
  };

  const handleSettleAllFull = () => {
    const updated = allocRows.map((r) => ({ ...r, allocated: r.due }));
    const totalDue = updated.reduce((s, r) => s + r.due, 0);
    setAllocRows(updated);
    setAllocAmount(totalDue);
  };

  const handleClearAllAlloc = () => {
    const updated = allocRows.map((r) => ({ ...r, allocated: 0 }));
    setAllocRows(updated);
    setAllocAmount(0);
  };

  const handleSubmitAllocation = async () => {
    if (allocRows.length === 0) {
      toast.error("No unpaid invoices found for this customer");
      return;
    }

    let totalAllocated = allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0);

    // If totalAllocated is 0 but user entered an allocAmount, auto-distribute it now
    if (totalAllocated === 0 && Number(allocAmount) > 0) {
      let rem = Number(allocAmount);
      const autoRows = allocRows.map((r) => {
        const amt = Math.min(rem, r.due);
        rem -= amt;
        return { ...r, allocated: amt };
      });
      setAllocRows(autoRows);
      totalAllocated = autoRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0);
    }

    if (totalAllocated <= 0) {
      toast.error("Please allocate amounts to at least one invoice or click 'Settle Full Due'");
      return;
    }

    const activeAllocations = allocRows
      .filter((r) => (Number(r.allocated) || 0) > 0)
      .map((r) => ({ invoiceId: r.invoiceId, amount: Number(r.allocated) }));

    setAllocSubmitting(true);
    try {
      await api.post("/v1/invoices/payments/allocate", {
        customerId: allocCustId || undefined,
        branchId: recordForm.branchId || undefined,
        method: allocMethod,
        amount: totalAllocated,
        totalAmount: totalAllocated,
        reference: allocRef || undefined,
        allocations: activeAllocations,
      });
      toast.success(
        `Successfully settled ৳${totalAllocated.toLocaleString()} across ${activeAllocations.length} invoices!`
      );
      setShowAllocateModal(false);
      loadPayments();
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to allocate payment");
    } finally {
      setAllocSubmitting(false);
    }
  };

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === payments.length && payments.length > 0) {
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
      toast.error("No payment records to export");
      return;
    }
    const headers = [
      "Receipt / Trx ID",
      "Method",
      "Amount",
      "Status",
      "Customer",
      "Customer Phone",
      "Invoice No",
      "Date",
      "Branch",
    ];
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
    toast.success(`Exported ${listToExport.length} payment records!`);
  };

  // Selected customer due helper in create modal
  const selectedCustObj = useMemo(() => {
    return customers.find((c) => c.id === recordForm.customerId);
  }, [customers, recordForm.customerId]);

  const selectedInvObj = useMemo(() => {
    return openInvoices.find((i) => i.id === recordForm.invoiceId);
  }, [openInvoices, recordForm.invoiceId]);

  const selectedInvDue = useMemo(() => {
    if (!selectedInvObj) return 0;
    return Math.max(0, Number(selectedInvObj.total || 0) - Number(selectedInvObj.paidTotal || 0));
  }, [selectedInvObj]);

  // Dropdown Options
  const methodFilterOptions = [
    { label: "All Payment Methods", value: "" },
    { label: "Cash Drawer", value: "CASH" },
    { label: "bKash Merchant", value: "BKASH" },
    { label: "Nagad", value: "NAGAD" },
    { label: "Rocket", value: "ROCKET" },
    { label: "Card / POS", value: "CARD" },
    { label: "Bank Wire Transfer", value: "BANK_TRANSFER" },
    { label: "Bank Cheque", value: "CHEQUE" },
  ];

  const branchFilterOptions = [
    { label: "All Outlets / Branches", value: "" },
    ...branches.map((b) => ({ label: b.name, value: b.id })),
  ];

  const customerModalOptions = [
    { label: "Walk-in Customer (General Public)", value: "" },
    ...customers.map((c) => {
      const custInvs = openInvoices.filter((i) => i.customerId === c.id);
      const invDue = custInvs.reduce(
        (sum, inv) => sum + Math.max(0, Number(inv.total || 0) - Number(inv.paidTotal || 0)),
        0
      );
      const effectiveDue = Math.max(Number(c.currentDue || 0), invDue);
      return {
        label: `${c.name}${c.phone ? ` (${c.phone})` : ""}${
          effectiveDue > 0 ? ` [Due: ৳${effectiveDue.toLocaleString()}]` : ""
        }`,
        value: c.id,
      };
    }),
  ];

  const branchModalOptions = branches.map((b) => ({
    label: b.name,
    value: b.id,
  }));

  const invoiceModalOptions = useMemo(() => {
    const list = recordForm.customerId
      ? openInvoices.filter((inv) => inv.customerId === recordForm.customerId)
      : openInvoices;
    return [
      { label: "-- Standalone / General Credit --", value: "" },
      ...list.map((inv) => ({
        label: `${inv.invoiceNo} [Due: ৳${Math.max(0, Number(inv.total) - Number(inv.paidTotal)).toLocaleString()}]`,
        value: inv.id,
      })),
    ];
  }, [openInvoices, recordForm.customerId]);

  const allocCustomerOptions = [
    { label: "-- Choose Customer --", value: "" },
    ...customers.map((c) => ({
      label: `${c.name}${c.phone ? ` (${c.phone})` : ""}`,
      value: c.id,
    })),
  ];

  const allocMethodOptions = [
    { label: "Cash Drawer", value: "CASH" },
    { label: "bKash", value: "BKASH" },
    { label: "Nagad", value: "NAGAD" },
    { label: "Card / POS", value: "CARD" },
    { label: "Bank Wire Transfer", value: "BANK_TRANSFER" },
  ];

  // Custom Table Columns
  const tableColumns: CustomTableColumn<Payment>[] = [
    {
      key: "select",
      header: "",
      width: "40px",
      render: (p) => {
        const isSelected = selectedIds.includes(p.id);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelectRow(p.id);
            }}
            className="text-slate-400 hover:text-brand-primary transition cursor-pointer"
          >
            {isSelected ? <CheckSquare size={16} className="text-brand-primary" /> : <Square size={16} />}
          </button>
        );
      },
    },
    {
      key: "reference",
      header: "Receipt / Trx ID",
      render: (p) => {
        const isDueCollection =
          p.paymentType === "DUE_COLLECTION" ||
          Boolean(p.reference?.startsWith("RCP-")) ||
          Boolean(p.invoice?.total && Number(p.invoice.total) > Number(p.amount) + 0.01 && !p.saleId);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(p.reference || p.id, p.id);
                }}
                className="cursor-pointer font-mono font-bold text-gray-700 hover:text-brand-primary transition"
                title="Click to copy receipt #"
              >
                {p.reference || `PAY-${p.id.slice(0, 8)}`}
              </span>
              {copiedId === p.id ? (
                <Check size={12} className="text-emerald-600" />
              ) : (
                <Copy size={12} className="text-slate-300 opacity-60 hover:opacity-100 transition cursor-pointer" />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isDueCollection ? (
                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-black text-indigo-700 tracking-tight uppercase shadow-2xs">
                  <Receipt size={10} className="text-indigo-600" />
                  Due Collection
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-medium text-slate-500">
                  POS Sale
                </span>
              )}
              {p.branchName && (
                <span className="text-[10px] text-gray-400 truncate max-w-[110px] font-medium">
                  • {p.branchName}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "customer",
      header: "Customer",
      render: (p) =>
        p.customer ? (
          <div className="flex flex-col">
            <span className="font-bold text-gray-600">{p.customer.name}</span>
            {p.customer.phone && <span className="text-[11px] text-gray-500">{p.customer.phone}</span>}
          </div>
        ) : (
          <span className="text-gray-500 italic font-medium">Walk-in Customer</span>
        ),
    },
    {
      key: "method",
      header: "Payment Method",
      render: (p) => {
        const methodCfg = METHOD_CONFIG[p.method] || METHOD_CONFIG.CASH;
        const MethodIcon = methodCfg.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-bold ${methodCfg.bg} ${methodCfg.text} border border-slate-200`}
          >
            <MethodIcon size={13} />
            {methodCfg.label}
          </span>
        );
      },
    },
    {
      key: "invoice",
      header: "Linked Invoice",
      render: (p) => {
        const isDueCollection =
          p.paymentType === "DUE_COLLECTION" ||
          Boolean(p.reference?.startsWith("RCP-")) ||
          Boolean(p.invoice?.total && Number(p.invoice.total) > Number(p.amount) + 0.01 && !p.saleId);
        const invoiceDue = Math.max(0, Number(p.invoice?.total || 0) - Number(p.invoice?.paidTotal || 0));
        const hasDue = Boolean(p.invoice?.invoiceNo && invoiceDue > 0.01);
        return p.invoice?.invoiceNo ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono font-bold text-gray-700">{p.invoice.invoiceNo}</span>
            <div className="flex items-center gap-1.5 text-[10px] flex-wrap mt-0.5">
              <span className="text-gray-500 font-medium">
                Total: ৳{Number(p.invoice.total || 0).toLocaleString()}
              </span>
              {hasDue ? (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Due Left: ৳{invoiceDue.toLocaleString()}
                </span>
              ) : isDueCollection ? (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Due Fully Cleared ✓
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-gray-500 italic">Direct Receipt</span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount (৳)",
      align: "right",
      render: (p) => {
        const isRefunded = p.status === "REFUNDED";
        const isDueCollection =
          p.paymentType === "DUE_COLLECTION" ||
          Boolean(p.reference?.startsWith("RCP-")) ||
          Boolean(p.invoice?.total && Number(p.invoice.total) > Number(p.amount) + 0.01 && !p.saleId);
        const hasTenderChange =
          (Number(p.tenderedAmount || 0) > Number(p.amount) && Number(p.tenderedAmount || 0) > 0) ||
          Number(p.changeAmount || 0) > 0;
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span
              className={`font-black tabular-nums text-xs sm:text-sm ${
                isRefunded ? "text-rose-600 line-through" : isDueCollection ? "text-indigo-700 font-black" : "text-emerald-700"
              }`}
            >
              ৳{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {isDueCollection ? (
              <span className="text-[10px] font-bold text-indigo-600 font-sans">
                Due Collected
              </span>
            ) : hasTenderChange ? (
              <span className="text-[10px] text-slate-500 font-mono font-medium">
                Tendered: ৳{Number(p.tenderedAmount).toLocaleString()} • Change: ৳{Number(p.changeAmount || 0).toLocaleString()}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (p) => {
        const isRefunded = p.status === "REFUNDED";
        const isDueCollection =
          p.paymentType === "DUE_COLLECTION" ||
          Boolean(p.reference?.startsWith("RCP-")) ||
          Boolean(p.invoice?.total && Number(p.invoice.total) > Number(p.amount) + 0.01 && !p.saleId);
        const invoiceDue = Math.max(0, Number(p.invoice?.total || 0) - Number(p.invoice?.paidTotal || 0));
        const hasDue = Boolean(p.invoice?.invoiceNo && invoiceDue > 0.01);
        const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.COMPLETED;

        if (isRefunded) {
          return (
            <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-rose-50 border-rose-200 text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Refunded / Void
            </span>
          );
        }

        if (isDueCollection && !hasDue) {
          return (
            <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-indigo-50 border-indigo-200 text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Due Settled
            </span>
          );
        }

        if (hasDue) {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-amber-50 border-amber-300 text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Partial Due Paid
              </span>
              <span className="text-[10px] font-bold text-amber-600">
                Due Left: ৳{invoiceDue.toLocaleString()}
              </span>
            </div>
          );
        }

        return (
          <span
            className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
            Settled / Paid
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date & Time",
      render: (p) => (
        <span className="text-gray-500 font-medium text-xs">
          {new Date(p.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (p) => {
        const isRefunded = p.status === "REFUNDED";
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <CustomButton
              size="xs"
              variant="outline"
              leftIcon={Eye}
              onClick={() => setSelectedPaymentForDrawer(p)}
              title="View Receipt & Audit Details"
            >
              Receipt
            </CustomButton>
            {!isRefunded && (
              <CustomButton
                size="xs"
                variant="danger"
                leftIcon={RotateCcw}
                onClick={() => {
                  setSelectedPaymentForRefund(p);
                  setShowRefundModal(true);
                }}
                title="Refund / Void Payment"
              >
                Refund
              </CustomButton>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* 1. TOP BREADCRUMB WITH 3 DISTINCT COLOR ACTIONS */}
      <CustomBreadcrumb
        title="Payment & Collection Hub"
        breadcrumbs={[
          { label: "Finance", href: "/invoices" },
          { label: "Payments" },
        ]}
        icon={<Wallet size={16} className="text-brand-primary" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Button 1: Distinct Indigo Gradient */}
            <Link href="/invoices">
              <CustomButton
                variant="primary"
                themeColor="indigo"
                size="sm"
                leftIcon={FileText}
              >
                Invoices Engine
              </CustomButton>
            </Link>

            {/* Button 2: Light Sky Secondary */}
            <CustomButton
              variant="secondary"
              size="sm"
              leftIcon={CreditCard}
              onClick={() => setShowAllocateModal(true)}
            >
              Bulk Settle
            </CustomButton>

            {/* Button 3: Theme Primary Sky Gradient */}
            <CustomButton
              variant="primary"
              themeColor="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setShowRecordModal(true)}
            >
              Record Payment
            </CustomButton>
          </div>
        }
      />

      {/* 2. EXECUTIVE KPI STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CustomStatCard
          label="Total Collected"
          value={statsLoading ? "—" : `৳${Number(stats?.totalAmount || 0).toLocaleString()}`}
          icon={CheckCircle2}
          tone="green"
        />
        <CustomStatCard
          label="Today's Inflow"
          value={statsLoading ? "—" : `৳${Number(stats?.todayAmount || 0).toLocaleString()}`}
          icon={Clock}
          tone="primary"
        />
        <CustomStatCard
          label="Cash Drawer"
          value={statsLoading ? "—" : `৳${Number(stats?.cashAmount || 0).toLocaleString()}`}
          icon={Banknote}
          tone="blue"
        />
        <CustomStatCard
          label="Mobile MFS"
          value={statsLoading ? "—" : `৳${Number(stats?.mfsAmount || 0).toLocaleString()}`}
          icon={Wallet}
          tone="violet"
        />
        <CustomStatCard
          label="Cards / POS"
          value={statsLoading ? "—" : `৳${Number(stats?.cardAmount || 0).toLocaleString()}`}
          icon={CreditCard}
          tone="primary"
        />
        <CustomStatCard
          label="Refunds"
          value={statsLoading ? "—" : `৳${Number(stats?.refundAmount || 0).toLocaleString()}`}
          icon={RotateCcw}
          tone="red"
        />
      </div>

      {/* 3. CHANNEL BREAKDOWN INTELLIGENCE BAR */}
      {stats?.byMethod && stats.byMethod.length > 0 && (
        <div className="rounded-sm border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                Payment Channels & Settlement Share
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">Live breakdown of received revenues across payment gateways</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {stats.byMethod.map((bm) => {
                const cfg = METHOD_CONFIG[bm.method] || METHOD_CONFIG.CASH;
                const Icon = cfg.icon;
                const pct = stats.totalAmount > 0 ? Math.round((bm.totalAmount / stats.totalAmount) * 100) : 0;
                return (
                  <div
                    key={bm.method}
                    className={`flex items-center gap-2 rounded-sm px-3 py-1.5 border border-slate-200 ${cfg.bg}`}
                  >
                    <Icon size={14} className={cfg.text} />
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}:</span>
                      <span className="font-black text-gray-600 text-xs">৳{bm.totalAmount.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-gray-500">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. BATCH OPERATIONS FLOATING BAR */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-brand-gradient px-5 py-3 text-xs text-white shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-white" />
            <span className="font-bold">{selectedIds.length} payment records selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1 rounded-sm bg-white/20 px-3 py-1.5 font-bold hover:bg-white/30 transition cursor-pointer text-white"
            >
              <Download size={13} />
              Export Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-sm px-2.5 py-1.5 text-white/80 hover:text-white transition cursor-pointer font-semibold"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* 5. MAIN UNIFIED CARD: TABS, SEARCH & FILTER TOOLBAR, TABLE (Like Invoices Page) */}
      <div className="rounded-sm border border-brand-border bg-white shadow-2xs overflow-hidden">
        {/* Card Header Toolbar: Tabs, Search, View Switcher & Export */}
        <div className="border-b border-slate-100 p-4 space-y-3 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tab sits on left, scrollable if too many */}
            <div className="overflow-x-auto min-w-0 shrink">
              <CustomTabs
                tabs={[
                  { id: "ALL", label: "All Receipts" },
                  { id: "DUE_COLLECTION", label: "Due Collected" },
                  { id: "POS_SALE", label: "POS Sales" },
                  { id: "COMPLETED", label: "Settled" },
                  { id: "CASH", label: "Cash" },
                  { id: "MFS", label: "Mobile MFS" },
                  { id: "CARD", label: "Card / POS" },
                  { id: "BANK", label: "Bank Transfer" },
                  { id: "REFUNDED", label: "Refunds / Void" },
                ]}
                activeTab={activeTab}
                onChange={(tabId) => {
                  setActiveTab(tabId);
                  setPage(1);
                }}
                themeColor="primary"
                className="w-auto border border-slate-200 bg-white shadow-2xs"
              />
            </div>

            {/* Action Controls aligned strictly on the right */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {/* Custom Search Input */}
              <CustomInput
                leftIcon={<Search size={14} />}
                rightIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setPage(1);
                      }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  ) : null
                }
                placeholder="Search receipt #, customer, phone, invoice..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                containerClassName="w-48 sm:w-64 md:w-72"
                className="h-[34px] text-xs font-medium text-gray-600 placeholder:text-gray-500 shadow-2xs"
              />

              {/* Table / Grid Switcher */}
              <div className="flex items-center rounded-sm border border-brand-border bg-white p-0.5 h-[34px] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`rounded-sm p-1.5 h-[28px] flex items-center transition cursor-pointer ${
                    viewMode === "table"
                      ? "bg-brand-50 text-brand-primary shadow-2xs font-bold"
                      : "text-gray-500 hover:text-gray-600"
                  }`}
                  title="Table View"
                >
                  <LayoutList size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-sm p-1.5 h-[28px] flex items-center transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-brand-50 text-brand-primary shadow-2xs font-bold"
                      : "text-gray-500 hover:text-gray-600"
                  }`}
                  title="Grid Card View"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              {/* Export CSV Button */}
              <CustomButton
                variant="primary"
                size="xs"
                leftIcon={Download}
                onClick={handleExportCSV}
                className="h-[34px]"
                title="Export filtered records to CSV"
              >
                Export CSV
              </CustomButton>
            </div>
          </div>

          {/* Equal Width Filters Row: Method, Branch, Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-0.5 w-full">
            {/* 1. Payment Method */}
            <CustomDropdownSelect
              options={methodFilterOptions}
              value={filterMethod}
              onChange={(val) => {
                setFilterMethod(val);
                setPage(1);
              }}
              placeholder="All Payment Methods"
              containerClassName="w-full"
              className="h-[38px] text-xs font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
            />

            {/* 2. Outlet / Branch */}
            <CustomDropdownSelect
              options={branchFilterOptions}
              value={filterBranch}
              onChange={(val) => {
                setFilterBranch(val);
                setPage(1);
              }}
              placeholder="All Outlets / Branches"
              containerClassName="w-full"
              className="h-[38px] text-xs font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
            />

            {/* 3. Date Range Filter with CustomDatePicker */}
            <div className="flex items-center gap-1.5 w-full">
              <div className="flex-1 min-w-0">
                <CustomDatePicker
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    setPage(1);
                  }}
                  compact={true}
                  placeholder="From Date"
                  title="From Date"
                  clearable={true}
                  className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
                />
              </div>
              <span className="text-xs font-bold text-gray-500 shrink-0">to</span>
              <div className="flex-1 min-w-0">
                <CustomDatePicker
                  value={endDate}
                  onChange={(val) => {
                    setEndDate(val);
                    setPage(1);
                  }}
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
        </div>

        {/* Payment Records Content (Inside the same card) */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
            <p className="mt-3 text-xs font-semibold text-gray-500">Loading payment records...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center p-8 text-center bg-white">
            <div className="rounded-sm bg-brand-50 p-4 text-brand-primary border border-brand-border">
              <Receipt size={36} />
            </div>
            <h3 className="mt-3 text-sm font-bold text-gray-600">No payment records found</h3>
            <p className="mt-1 max-w-sm text-xs text-gray-500 font-medium">
              No payments matched your criteria. Record a customer payment or adjust your search filters.
            </p>
            <div className="mt-4">
              <CustomButton
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={() => setShowRecordModal(true)}
              >
                Record First Payment
              </CustomButton>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* Table View: seamlessly integrated into this card, no double borders */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-slate-50 text-xs font-bold capitalize text-gray-600">
                    <th className="py-3.5 pl-4 pr-2 w-8">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        {selectedIds.length === payments.length && payments.length > 0 ? (
                          <CheckSquare size={16} className="text-brand-primary" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 pl-2 pr-3">Receipt / Trx ID</th>
                    <th className="px-3 py-3.5">Customer</th>
                    <th className="px-3 py-3.5">Payment Method</th>
                    <th className="px-3 py-3.5">Linked Invoice</th>
                    <th className="px-3 py-3.5 text-right">Amount (৳)</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="px-3 py-3.5">Date & Time</th>
                    <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    const isRefunded = p.status === "REFUNDED";
                    const methodCfg = METHOD_CONFIG[p.method] || METHOD_CONFIG.CASH;
                    const MethodIcon = methodCfg.icon;
                    const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.COMPLETED;
                    const invoiceDue = Math.max(0, Number(p.invoice?.total || 0) - Number(p.invoice?.paidTotal || 0));
                    const hasDue = Boolean(p.invoice?.invoiceNo && invoiceDue > 0.01);
                    const hasTenderChange =
                      (Number(p.tenderedAmount || 0) > Number(p.amount) && Number(p.tenderedAmount || 0) > 0) ||
                      Number(p.changeAmount || 0) > 0;
                    const isDueCollection =
                      p.paymentType === "DUE_COLLECTION" ||
                      Boolean(p.reference?.startsWith("RCP-")) ||
                      Boolean(p.invoice?.total && Number(p.invoice.total) > Number(p.amount) + 0.01 && !p.saleId);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPaymentForDrawer(p)}
                        className={`group transition cursor-pointer ${
                          isSelected ? "bg-brand-50/30" : "hover:bg-slate-50/70"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(p.id)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {isSelected ? <CheckSquare size={16} className="text-brand-primary" /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Receipt / Trx ID */}
                        <td className="py-3.5 pl-2 pr-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(p.reference || p.id, p.id);
                                }}
                                className="cursor-pointer font-mono font-bold text-gray-700 hover:text-brand-primary transition"
                                title="Click to copy receipt #"
                              >
                                {p.reference || `PAY-${p.id.slice(0, 8)}`}
                              </span>
                              {copiedId === p.id ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition cursor-pointer" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isDueCollection ? (
                                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-black text-indigo-700 tracking-tight uppercase shadow-2xs">
                                  <Receipt size={10} className="text-indigo-600" />
                                  Due Collection
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-medium text-slate-500">
                                  POS Sale
                                </span>
                              )}
                              {p.branchName && (
                                <span className="text-[10px] text-gray-400 truncate max-w-[110px] font-medium">
                                  • {p.branchName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-3 py-3.5">
                          {p.customer ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-600">{p.customer.name}</span>
                              {p.customer.phone && <span className="text-[11px] text-gray-500">{p.customer.phone}</span>}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic font-medium">Walk-in Customer</span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-bold ${methodCfg.bg} ${methodCfg.text} border border-slate-200`}
                          >
                            <MethodIcon size={13} />
                            {methodCfg.label}
                          </span>
                        </td>

                        {/* Linked Invoice */}
                        <td className="px-3 py-3.5">
                          {p.invoice?.invoiceNo ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono font-bold text-gray-700">{p.invoice.invoiceNo}</span>
                              <div className="flex items-center gap-1.5 text-[10px] flex-wrap mt-0.5">
                                <span className="text-gray-500 font-medium">
                                  Total: ৳{Number(p.invoice.total || 0).toLocaleString()}
                                </span>
                                {hasDue ? (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                    Due Left: ৳{invoiceDue.toLocaleString()}
                                  </span>
                                ) : isDueCollection ? (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Due Fully Cleared ✓
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-500 italic">Direct Receipt</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-3.5 text-right font-black tabular-nums text-xs sm:text-sm">
                          <div className="flex flex-col items-end gap-0.5">
                            <span
                              className={`font-black tabular-nums text-xs sm:text-sm ${
                                isRefunded ? "text-rose-600 line-through" : isDueCollection ? "text-indigo-700 font-black" : "text-emerald-700"
                              }`}
                            >
                              ৳{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {isDueCollection ? (
                              <span className="text-[10px] font-bold text-indigo-600 font-sans">
                                Due Collected
                              </span>
                            ) : hasTenderChange ? (
                              <span className="text-[10px] text-slate-500 font-mono font-medium">
                                Tendered: ৳{Number(p.tenderedAmount).toLocaleString()} • Change: ৳{Number(p.changeAmount || 0).toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center">
                          {isRefunded ? (
                            <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-rose-50 border-rose-200 text-rose-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Refunded / Void
                            </span>
                          ) : isDueCollection && !hasDue ? (
                            <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-indigo-50 border-indigo-200 text-indigo-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                              Due Settled
                            </span>
                          ) : hasDue ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-amber-50 border-amber-300 text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Partial Due Paid
                              </span>
                              <span className="text-[10px] font-bold text-amber-600">
                                Due Left: ৳{invoiceDue.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                              Settled / Paid
                            </span>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="px-3 py-3.5 text-gray-600 font-medium text-xs">
                          {new Date(p.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <CustomButton
                              size="xs"
                              variant="outline"
                              leftIcon={Eye}
                              onClick={() => setSelectedPaymentForDrawer(p)}
                              title="View Receipt & Audit Details"
                            >
                              Receipt
                            </CustomButton>
                            {!isRefunded && (
                              <CustomButton
                                size="xs"
                                variant="danger"
                                leftIcon={RotateCcw}
                                onClick={() => {
                                  setSelectedPaymentForRefund(p);
                                  setShowRefundModal(true);
                                }}
                                title="Refund / Void Payment"
                              >
                                Refund
                              </CustomButton>
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 bg-slate-50/40 text-xs text-gray-600 font-medium">
              <span>
                Showing Page {page} of {totalPages} ({totalRecords} total records)
              </span>
              <div className="flex items-center gap-1.5">
                <CustomButton
                  variant="outline"
                  size="xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </CustomButton>
                <CustomButton
                  variant="outline"
                  size="xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </CustomButton>
              </div>
            </div>
          </div>
        ) : (
          /* Grid View inside the same card */
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {payments.map((p) => {
                const methodCfg = METHOD_CONFIG[p.method] || METHOD_CONFIG.CASH;
                const MethodIcon = methodCfg.icon;
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.COMPLETED;
                const isRefunded = p.status === "REFUNDED";
                const invoiceDue = Math.max(0, Number(p.invoice?.total || 0) - Number(p.invoice?.paidTotal || 0));
                const hasDue = Boolean(p.invoice?.invoiceNo && invoiceDue > 0.01);
                const hasTenderChange =
                  (Number(p.tenderedAmount || 0) > Number(p.amount) && Number(p.tenderedAmount || 0) > 0) ||
                  Number(p.changeAmount || 0) > 0;
                const isDueCollection =
                  p.paymentType === "DUE_COLLECTION" ||
                  Boolean(p.reference?.startsWith("RCP-")) ||
                  Boolean(p.invoice?.total && Number(p.invoice.total) > Number(p.amount) + 0.01 && !p.saleId);

                return (
                  <div
                    key={p.id}
                    className="group flex flex-col justify-between rounded-sm border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-brand-primary hover:shadow-md"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-sm font-bold text-brand-dark">
                            {p.reference || `PAY-${p.id.slice(0, 8)}`}
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold ${methodCfg.bg} ${methodCfg.text} border border-slate-200`}
                            >
                              <MethodIcon size={12} />
                              {methodCfg.label}
                            </span>
                            {isDueCollection && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black bg-indigo-50 border border-indigo-200 text-indigo-700 tracking-tight uppercase shadow-2xs">
                                <Receipt size={10} className="text-indigo-600" />
                                Due
                              </span>
                            )}
                          </div>
                        </div>
                        {isRefunded ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-rose-50 border-rose-200 text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Refunded
                          </span>
                        ) : isDueCollection && !hasDue ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-indigo-50 border-indigo-200 text-indigo-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            Due Settled
                          </span>
                        ) : hasDue ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold bg-amber-50 border-amber-300 text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Partial Due (Left: ৳{invoiceDue.toLocaleString()})
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="mt-3.5 rounded-sm bg-slate-50 p-2.5 border border-slate-100">
                        <p className="text-[10px] font-bold text-gray-500 capitalize">Customer</p>
                        <p className="text-xs font-bold text-gray-600 mt-0.5">{p.customer?.name || "Walk-in Customer"}</p>
                        {p.customer?.phone && <p className="text-[11px] text-gray-500">{p.customer.phone}</p>}
                      </div>

                      {/* Invoice Info */}
                      {p.invoice?.invoiceNo && (
                        <div className="mt-2 rounded-sm bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 block">Invoice</span>
                            <span className="font-mono font-bold text-gray-700">{p.invoice.invoiceNo}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block">Total: ৳{Number(p.invoice.total || 0).toLocaleString()}</span>
                            {hasDue ? (
                              <span className="text-[10px] font-bold text-amber-600">
                                Due Left: ৳{invoiceDue.toLocaleString()}
                              </span>
                            ) : isDueCollection ? (
                              <span className="text-[10px] font-bold text-emerald-600">
                                Due Cleared ✓
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Financial Amount */}
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-gray-500 block">
                            {isDueCollection ? "Due Collected" : "Collected Amount"}
                          </span>
                          {isDueCollection ? (
                            <span className="text-[10px] text-indigo-600 font-bold">
                              Due Settlement
                            </span>
                          ) : hasTenderChange ? (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Tender: ৳{Number(p.tenderedAmount).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={`text-base font-black tabular-nums ${
                            isRefunded ? "text-rose-600 line-through" : isDueCollection ? "text-indigo-700 font-black" : "text-emerald-700"
                          }`}
                        >
                          ৳{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                      <span className="text-[11px] text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <CustomButton
                          size="xs"
                          variant="outline"
                          leftIcon={Eye}
                          onClick={() => setSelectedPaymentForDrawer(p)}
                        >
                          Receipt
                        </CustomButton>
                        {!isRefunded && (
                          <CustomButton
                            size="xs"
                            variant="danger"
                            leftIcon={RotateCcw}
                            onClick={() => {
                              setSelectedPaymentForRefund(p);
                              setShowRefundModal(true);
                            }}
                          >
                            Refund
                          </CustomButton>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination footer for Grid */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-slate-200 bg-white px-4 py-2.5 text-xs text-gray-600 shadow-2xs font-medium">
              <span>
                Showing Page {page} of {totalPages} ({totalRecords} total records)
              </span>
              <div className="flex items-center gap-1.5">
                <CustomButton
                  variant="outline"
                  size="xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </CustomButton>
                <CustomButton
                  variant="outline"
                  size="xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. RECORD PAYMENT MODAL (Spacious 2xl, Portal Selects)    */}
      {/* ========================================================= */}
      <CustomModal
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Customer Payment"
        size="2xl"
      >
        <div className="space-y-4 text-xs text-gray-600">
          {/* Branch and Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block font-bold text-gray-600">Outlet / Branch *</label>
              <CustomDropdownSelect
                options={branchModalOptions}
                value={recordForm.branchId}
                onChange={(val) => setRecordForm((p) => ({ ...p, branchId: val }))}
                placeholder="Select Outlet / Branch"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-gray-600">Customer (Optional)</label>
              <CustomDropdownSelect
                options={customerModalOptions}
                value={recordForm.customerId}
                onChange={(val) => {
                  const custInvs = openInvoices.filter((i) => i.customerId === val);
                  setRecordForm((p) => {
                    const currentInvValid = custInvs.some((i) => i.id === p.invoiceId);
                    const nextInvId = currentInvValid ? p.invoiceId : (custInvs.length === 1 ? custInvs[0].id : "");
                    let nextAmount = p.amount;
                    if (nextInvId) {
                      const inv = custInvs.find((i) => i.id === nextInvId);
                      const due = inv ? Math.max(0, Number(inv.total) - Number(inv.paidTotal)) : 0;
                      if (due > 0 && (!p.amount || p.amount === "0")) {
                        nextAmount = String(due);
                      }
                    }
                    return {
                      ...p,
                      customerId: val,
                      invoiceId: nextInvId,
                      amount: nextAmount,
                    };
                  });
                }}
                placeholder="Walk-in Customer (General Public)"
              />
            </div>
          </div>

          {/* Customer Current Due Callout if selected */}
          {(() => {
            const custDueFromRecord = Number(selectedCustObj?.currentDue || 0);
            const custInvoices = openInvoices.filter((i) => i.customerId === recordForm.customerId);
            const invoicesDue = custInvoices.reduce(
              (sum, inv) => sum + Math.max(0, Number(inv.total || 0) - Number(inv.paidTotal || 0)),
              0
            );
            const totalDue = Math.max(custDueFromRecord, invoicesDue);

            if (!recordForm.customerId || totalDue <= 0) return null;

            return (
              <div className="rounded-sm bg-amber-50/80 border border-amber-200 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Customer Current Outstanding
                  </span>
                  <p className="font-black text-amber-900 text-sm mt-0.5">
                    ৳{totalDue.toLocaleString()}
                    {custInvoices.length > 0 && (
                      <span className="text-xs font-normal text-amber-700 ml-2">
                        ({custInvoices.length} unpaid invoice{custInvoices.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </p>
                </div>
                <CustomButton
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setRecordForm((p) => ({ ...p, amount: String(totalDue) }))}
                >
                  Fill Full Due
                </CustomButton>
              </div>
            );
          })()}

          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-gray-600">Payment Amount (৳) *</label>
              {selectedInvObj && selectedInvDue > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-gray-500">Invoice Due:</span>
                  <span className="font-bold text-amber-700">৳{selectedInvDue.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => setRecordForm((p) => ({ ...p, amount: String(selectedInvDue) }))}
                    className="font-bold text-brand-primary hover:underline ml-1 cursor-pointer"
                  >
                    (Fill Full Due)
                  </button>
                </div>
              )}
            </div>
            <input
              type="number"
              step="any"
              min={0.01}
              placeholder="Enter payment amount (e.g. 187.50)"
              value={recordForm.amount}
              onChange={(e) => setRecordForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full rounded-sm border border-brand-border p-3 text-base font-black text-brand-dark focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border/20 placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="mb-1.5 block font-bold text-gray-600">Payment Channel *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "CASH", label: "Cash Drawer", icon: Banknote },
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
                    className={`flex items-center gap-2 rounded-sm p-2.5 text-xs font-bold border transition cursor-pointer ${
                      active
                        ? "bg-brand-gradient text-white border-brand-primary shadow-xs"
                        : "bg-white border-slate-200 text-gray-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={15} className={active ? "text-white" : "text-brand-primary"} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference and Target Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block font-bold text-gray-600">Receipt / Transaction ID</label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={recordForm.reference}
                onChange={(e) => setRecordForm((p) => ({ ...p, reference: e.target.value }))}
                className="w-full rounded-sm border border-brand-border p-2.5 text-xs text-gray-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border/20"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-gray-600">Optional Target Invoice</label>
              <CustomDropdownSelect
                options={invoiceModalOptions}
                value={recordForm.invoiceId}
                onChange={(val) => {
                  const inv = openInvoices.find((i) => i.id === val);
                  const due = inv ? Math.max(0, Number(inv.total) - Number(inv.paidTotal)) : 0;
                  setRecordForm((p) => ({
                    ...p,
                    invoiceId: val,
                    amount: due > 0 ? String(due) : p.amount,
                    customerId: inv?.customerId || p.customerId,
                  }));
                }}
                placeholder="-- Standalone / General Credit --"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="mb-1 block font-bold text-gray-600">Payment Remarks / Notes</label>
            <textarea
              rows={2}
              value={recordForm.note}
              onChange={(e) => setRecordForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Additional settlement remarks..."
              className="w-full rounded-sm border border-brand-border p-2 text-xs text-gray-600 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border/20"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <CustomButton
              type="button"
              variant="danger"
              onClick={() => setShowRecordModal(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="button"
              variant="primary"
              disabled={recordSubmitting}
              loading={recordSubmitting}
              onClick={handleRecordPayment}
              leftIcon={CheckCircle2}
            >
              Confirm & Save Payment
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ========================================================= */}
      {/* 2. REFUND PAYMENT MODAL (Enlarged md size)                 */}
      {/* ========================================================= */}
      {selectedPaymentForRefund && (
        <CustomModal
          open={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedPaymentForRefund(null);
          }}
          title="Confirm Payment Refund"
          size="md"
        >
          <div className="space-y-4 text-xs text-gray-600">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-rose-50 border border-rose-200">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-dark">Reverse Transaction & Balance</h3>
                <p className="text-[11px] text-gray-500">Restores customer balance and voids this receipt.</p>
              </div>
            </div>

            <div className="rounded-sm bg-slate-50 p-3.5 space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Receipt Ref:</span>
                <span className="font-mono font-bold text-gray-600">
                  {selectedPaymentForRefund.reference || selectedPaymentForRefund.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Customer:</span>
                <span className="font-bold text-gray-600">
                  {selectedPaymentForRefund.customer?.name || "Walk-in"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Refund Amount:</span>
                <span className="font-black text-rose-600 text-sm">
                  ৳{Number(selectedPaymentForRefund.amount).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              This action will mark the receipt as <span className="font-bold text-rose-600">REFUNDED</span> and re-add ৳
              {Number(selectedPaymentForRefund.amount).toLocaleString()} to the customer's open due balance.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <CustomButton
                type="button"
                variant="outline"
                onClick={() => setShowRefundModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="button"
                variant="danger"
                leftIcon={RotateCcw}
                onClick={handleConfirmRefund}
              >
                Confirm Refund
              </CustomButton>
            </div>
          </div>
        </CustomModal>
      )}

      {/* ========================================================= */}
      {/* 3. MULTI-INVOICE PAYMENT ALLOCATION MODAL (Spacious 4xl)  */}
      {/* ========================================================= */}
      <CustomModal
        open={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        title="Bulk Allocate Payment Across Invoices"
        size="4xl"
        themeColor="primary"
      >
        <div className="space-y-4 text-xs text-gray-600">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-gray-600">Select Customer *</label>
              <CustomDropdownSelect
                options={allocCustomerOptions}
                value={allocCustId}
                onChange={(val) => handleCustomerSelectForAlloc(val)}
                placeholder="-- Choose Customer --"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-gray-600">Total Settlement Amount (৳) *</label>
              <input
                type="number"
                min={0}
                value={allocAmount === 0 ? "" : allocAmount}
                onChange={(e) => handleSettlementAmountChange(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-sm border border-brand-border p-2 text-xs font-black text-brand-dark focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-gray-600">Payment Channel</label>
              <CustomDropdownSelect
                options={allocMethodOptions}
                value={allocMethod}
                onChange={(val) => setAllocMethod(val)}
                placeholder="Select Channel"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-gray-600">Reference / Notes</label>
              <input
                type="text"
                value={allocRef}
                onChange={(e) => setAllocRef(e.target.value)}
                placeholder="Transaction ID or Cheque #"
                className="w-full rounded-sm border border-brand-border p-2 text-xs text-gray-600 focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Customer Summary & Quick Actions */}
          {allocRows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-sm bg-brand-50/60 border border-brand-primary/20">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Total Customer Due:</span>{" "}
                  <span className="font-bold text-rose-600">
                    ৳{allocRows.reduce((s, r) => s + r.due, 0).toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-200" />
                <div>
                  <span className="text-gray-500 font-medium">Unpaid Invoices:</span>{" "}
                  <span className="font-bold text-slate-800">{allocRows.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSettleAllFull}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold bg-brand-primary text-white hover:bg-brand-primary/90 transition shadow-2xs cursor-pointer"
                >
                  <Zap size={11} />
                  Settle Full Due (৳{allocRows.reduce((s, r) => s + r.due, 0).toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={handleAutoDistributeAlloc}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                >
                  <Sparkles size={11} className="text-brand-primary" />
                  Auto-Distribute (FIFO)
                </button>
                <button
                  type="button"
                  onClick={handleClearAllAlloc}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition shadow-2xs cursor-pointer"
                >
                  <RotateCcw size={11} />
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Invoices to allocate table */}
          <div className="mt-2">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <span className="font-bold text-brand-dark">Unpaid Invoices for Allocation</span>
              {allocRows.length > 0 && (
                <span className="text-[11px] text-gray-500">
                  Allocated: <b>৳{allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0).toLocaleString()}</b>
                </span>
              )}
            </div>

            {allocRows.length === 0 ? (
              <div className="rounded-sm border border-dashed border-brand-border py-8 text-center text-gray-500 font-medium">
                {allocCustId ? "No unpaid invoices found for this customer" : "Select a customer to view open invoices"}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-sm border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-gray-500">
                      <th className="py-2 pl-3">Invoice #</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-right">Paid</th>
                      <th className="py-2 text-right">Due</th>
                      <th className="py-2 pr-3 text-right w-36">Allocate (৳)</th>
                      <th className="py-2 pr-3 text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allocRows.map((r, idx) => (
                      <tr key={r.invoiceId} className="bg-white hover:bg-brand-50/30 transition">
                        <td className="py-2 pl-3 font-mono font-bold text-gray-600">{r.invoiceNo}</td>
                        <td className="py-2 text-right text-gray-600">৳{r.total.toLocaleString()}</td>
                        <td className="py-2 text-right text-emerald-600">৳{r.paidTotal.toLocaleString()}</td>
                        <td className="py-2 text-right font-bold text-rose-600">৳{r.due.toLocaleString()}</td>
                        <td className="py-2 pr-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min={0}
                              max={r.due}
                              value={r.allocated === 0 ? "" : r.allocated}
                              onChange={(e) => handleSetRowAllocated(idx, Number(e.target.value) || 0)}
                              placeholder="0"
                              className="w-20 rounded-sm border border-brand-border p-1 text-right text-xs font-bold text-brand-primary focus:border-brand-primary focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetRowAllocated(idx, r.due)}
                              title="Allocate full due"
                              className="rounded bg-slate-100 border border-slate-200 px-1.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-brand-50 hover:border-brand-primary hover:text-brand-primary transition cursor-pointer"
                            >
                              Max
                            </button>
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-center">
                          {r.allocated >= r.due ? (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                              <Check size={9} /> Paid
                            </span>
                          ) : r.allocated > 0 ? (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                              Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-slate-50 border border-slate-200 text-slate-400">
                              Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 rounded-sm border border-brand-border bg-white px-3 py-1.5 shadow-2xs">
              <span className="text-xs font-bold capitalize text-gray-600">Total Allocated:</span>
              <span className="text-xs font-black text-brand-dark">
                ৳{allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0).toLocaleString()}
              </span>
              <span className="text-gray-300 font-bold">/</span>
              <span className="text-xs font-bold capitalize text-gray-600">Target:</span>
              <span className="text-xs font-bold text-gray-600">
                ৳{Number(allocAmount || 0).toLocaleString()}
              </span>
              {Math.abs(allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0) - Number(allocAmount || 0)) < 0.01 && allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0) > 0 && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 size={12} /> Matched
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CustomButton
                type="button"
                variant="danger"
                size="sm"
                className="h-[36px]"
                onClick={() => setShowAllocateModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="button"
                variant="primary"
                size="sm"
                className="h-[36px]"
                disabled={allocSubmitting || allocRows.length === 0}
                loading={allocSubmitting}
                onClick={handleSubmitAllocation}
              >
                Settle Invoices
              </CustomButton>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* ========================================================= */}
      {/* 4. PAYMENT RECEIPT & AUDIT MODAL (Spacious 2xl)           */}
      {/* ========================================================= */}
      {selectedPaymentForDrawer && (
        <CustomModal
          open={!!selectedPaymentForDrawer}
          onClose={() => setSelectedPaymentForDrawer(null)}
          title="Payment Receipt & Audit Details"
          size="2xl"
        >
          <div className="space-y-4 text-xs text-gray-600">
            {/* Receipt Amount Hero */}
            {(() => {
              const isDueCol =
                selectedPaymentForDrawer.paymentType === "DUE_COLLECTION" ||
                Boolean(selectedPaymentForDrawer.reference?.startsWith("RCP-")) ||
                Boolean(
                  selectedPaymentForDrawer.invoice?.total &&
                  Number(selectedPaymentForDrawer.invoice.total) > Number(selectedPaymentForDrawer.amount) + 0.01 &&
                  !selectedPaymentForDrawer.saleId
                );

              return (
                <div className="rounded-sm border border-brand-border bg-gradient-to-br from-brand-50 via-white to-brand-50/50 p-5 text-center shadow-2xs">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {isDueCol ? "Due Collected Amount" : "Collected Amount"}
                    </span>
                    {isDueCol && (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-black text-indigo-700 tracking-tight uppercase shadow-2xs">
                        <Receipt size={10} className="text-indigo-600" />
                        Due Collection
                      </span>
                    )}
                  </div>
                  <div className={`mt-1 text-3xl font-black ${isDueCol ? "text-indigo-800" : "text-brand-dark"}`}>
                    ৳{Number(selectedPaymentForDrawer.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {selectedPaymentForDrawer.tenderedAmount && Number(selectedPaymentForDrawer.tenderedAmount) > Number(selectedPaymentForDrawer.amount) && (
                    <div className="mt-1 text-xs text-gray-500 font-mono">
                      Tendered: ৳{Number(selectedPaymentForDrawer.tenderedAmount).toLocaleString()} • Change: ৳{Number(selectedPaymentForDrawer.changeAmount || 0).toLocaleString()}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                    {(() => {
                      const invTotal = Number(selectedPaymentForDrawer.invoice?.total || 0);
                      const invPaid = Number(selectedPaymentForDrawer.invoice?.paidTotal || 0);
                      const invDue = Math.max(0, invTotal - invPaid);
                      const hasDue = Boolean(selectedPaymentForDrawer.invoice?.invoiceNo && invDue > 0.01);
                      if (selectedPaymentForDrawer.status === "REFUNDED") {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 border-rose-200 text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Refunded / Void
                          </span>
                        );
                      }
                      if (isDueCol && !hasDue) {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-[10px] font-bold bg-indigo-50 border-indigo-200 text-indigo-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            Due Settled
                          </span>
                        );
                      }
                      if (hasDue) {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 border-amber-300 text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Partial Due (Left: ৳{invDue.toLocaleString()})
                          </span>
                        );
                      }
                      return (
                        <span
                          className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-[10px] font-bold ${
                            STATUS_CONFIG[selectedPaymentForDrawer.status]?.bg || ""
                          } ${STATUS_CONFIG[selectedPaymentForDrawer.status]?.text || ""}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              STATUS_CONFIG[selectedPaymentForDrawer.status]?.dot || ""
                            }`}
                          />
                          Settled / Paid
                        </span>
                      );
                    })()}
                    <span className="text-[11px] font-semibold text-gray-500">
                      • {selectedPaymentForDrawer.method}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">
                      • {selectedPaymentForDrawer.reference || `PAY-${selectedPaymentForDrawer.id.slice(0, 8)}`}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Client Details */}
            <div className="rounded-sm bg-white p-4 space-y-2 border border-slate-200 shadow-2xs">
              <span className="font-bold text-brand-dark uppercase text-[10px] tracking-wider">
                Client / Payer Details
              </span>
              <p className="text-sm font-bold text-gray-600">
                {selectedPaymentForDrawer.customer?.name || "Walk-in Customer"}
              </p>
              {selectedPaymentForDrawer.customer?.phone && (
                <p className="flex items-center gap-1 text-gray-500">
                  <Phone size={13} className="text-brand-primary" /> {selectedPaymentForDrawer.customer.phone}
                </p>
              )}
              {selectedPaymentForDrawer.customer?.address && (
                <p className="text-gray-500">{selectedPaymentForDrawer.customer.address}</p>
              )}
            </div>

            {/* Target Invoice */}
            {selectedPaymentForDrawer.invoice && (() => {
              const invTotal = Number(selectedPaymentForDrawer.invoice.total || 0);
              const invPaid = Number(selectedPaymentForDrawer.invoice.paidTotal || 0);
              const invDue = Math.max(0, invTotal - invPaid);
              const isDueCol =
                selectedPaymentForDrawer.paymentType === "DUE_COLLECTION" ||
                Boolean(selectedPaymentForDrawer.reference?.startsWith("RCP-")) ||
                Boolean(invTotal > Number(selectedPaymentForDrawer.amount) + 0.01 && !selectedPaymentForDrawer.saleId);
              return (
                <div className="rounded-sm bg-white p-4 space-y-2 border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-dark uppercase text-[10px] tracking-wider">Target Invoice</span>
                    {invDue > 0.01 ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Partially Paid (Remaining Due: ৳{invDue.toLocaleString()})
                      </span>
                    ) : isDueCol ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Invoice Due Fully Cleared ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Fully Settled
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-gray-600">
                      {selectedPaymentForDrawer.invoice.invoiceNo}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-primary">
                        Total: ৳{invTotal.toLocaleString()}
                      </span>
                      {invDue > 0.01 && (
                        <span className="font-bold text-rose-600">
                          Due: ৳{invDue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Audit & Trace */}
            <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
              <span className="font-bold text-brand-dark uppercase text-[10px] tracking-wider">Audit & Trace</span>
              <div className="flex justify-between text-gray-600">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="font-mono">{selectedPaymentForDrawer.id}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="text-gray-500">Date & Time:</span>
                <span>{new Date(selectedPaymentForDrawer.createdAt).toLocaleString()}</span>
              </div>
              {selectedPaymentForDrawer.branchName && (
                <div className="flex justify-between text-gray-600">
                  <span className="text-gray-500">Outlet:</span>
                  <span>{selectedPaymentForDrawer.branchName}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <CustomButton
                type="button"
                variant="outline"
                leftIcon={Printer}
                onClick={() => window.print()}
              >
                Print Receipt
              </CustomButton>

              <div className="flex items-center gap-2">
                {selectedPaymentForDrawer.status !== "REFUNDED" && (
                  <CustomButton
                    type="button"
                    variant="danger"
                    leftIcon={RotateCcw}
                    onClick={() => {
                      setSelectedPaymentForRefund(selectedPaymentForDrawer);
                      setShowRefundModal(true);
                    }}
                  >
                    Refund Payment
                  </CustomButton>
                )}
                <CustomButton
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPaymentForDrawer(null)}
                >
                  Close
                </CustomButton>
              </div>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
}
