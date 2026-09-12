"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  RefreshCw,
  Printer,
  Eye,
  Ban,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building2,
  DollarSign,
  TrendingUp,
  X,
  LayoutList,
  LayoutGrid,
  ShieldCheck,
  Phone,
  Trash2,
  Copy,
  Check,
  Receipt,
  PlusCircle,
  Sparkles,
  UserPlus,
  Send,
  MessageSquare,
  RotateCcw,
  CheckSquare,
  Square,
  AlertCircle,
  Wallet,
  Banknote,
} from "lucide-react";
import { api } from "@/lib/api";
import { UniversalInvoiceModal, InvoiceData, InvoiceItem, InvoiceVerticalType } from "@/components/invoices/UniversalInvoiceModal";

interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceType: "TAX" | "STANDARD" | "CREDIT_NOTE" | "DEBIT_NOTE" | "PROFORMA" | string;
  status: "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID" | string;
  issueDate: string;
  dueDate?: string | null;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  total: number;
  paidTotal: number;
  dueTotal?: number;
  note?: string | null;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  customer?: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    binVatNo?: string;
  } | null;
  _count?: { items: number };
  items?: Array<{
    id?: string;
    productId?: string;
    description: string;
    qty: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
  }>;
  payments?: Array<{
    id: string;
    method: string;
    amount: number;
    reference?: string;
    status: string;
    createdAt: string;
  }>;
}

interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paidCount: number;
  partiallyPaidCount: number;
  issuedCount: number;
  voidCount: number;
  taxCount: number;
  overdueCount: number;
  overdueAmount: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  binVatNo?: string;
  currentDue?: number;
}

interface ProductOption {
  id: string;
  name: string;
  sku?: string;
  retailPrice?: number;
  vatPercent?: number;
}

interface BranchOption {
  id: string;
  name: string;
  code?: string;
}

const TYPE_CONFIG: Record<string, { label: string; badge: string; border: string; icon: any }> = {
  TAX: { label: "Mushak 6.3 Tax", badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", border: "border-indigo-200", icon: ShieldCheck },
  STANDARD: { label: "Commercial Standard", badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", border: "border-slate-200", icon: FileText },
  CREDIT_NOTE: { label: "Credit Note (Refund)", badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", border: "border-rose-200", icon: RotateCcw },
  DEBIT_NOTE: { label: "Debit Note (Adj.)", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", border: "border-amber-200", icon: AlertCircle },
  PROFORMA: { label: "Proforma Estimate", badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-200", border: "border-purple-200", icon: Sparkles },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PAID: { label: "Paid in Full", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  PARTIALLY_PAID: { label: "Partially Paid", bg: "bg-sky-50 border-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
  ISSUED: { label: "Unpaid / Issued", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  VOID: { label: "Voided", bg: "bg-slate-100 border-slate-200", text: "text-slate-500", dot: "bg-slate-400" },
  OVERDUE: { label: "Overdue", bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Sub-Navigation Section
  const [subSection, setSubSection] = useState<"all" | "aging" | "tax_mushak" | "credit_notes">("all");

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [filterType, setFilterType] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection for Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // References Data
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<Invoice | null>(null);

  const [selectedInvoiceForCollect, setSelectedInvoiceForCollect] = useState<Invoice | null>(null);
  const [selectedInvoiceForDrawer, setSelectedInvoiceForDrawer] = useState<Invoice | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Universal Invoice Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState<InvoiceData | null>(null);

  // Notifications / Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Quick Customer Creation inline state
  const [showQuickAddCust, setShowQuickAddCust] = useState(false);
  const [quickCustName, setQuickCustName] = useState("");
  const [quickCustPhone, setQuickCustPhone] = useState("");
  const [quickCustBin, setQuickCustBin] = useState("");
  const [quickCustAddress, setQuickCustAddress] = useState("");
  const [quickCustSaving, setQuickCustSaving] = useState(false);

  // Create Form State
  const [form, setForm] = useState({
    branchId: "",
    customerId: "",
    invoiceType: "TAX",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    note: "",
    paymentTerms: "Due on Receipt",
    initialPayment: 0,
    paymentMethod: "CASH",
    items: [
      { productId: "", description: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0, lineTotal: 0 },
    ],
  });

  // Single Collect Payment Form State
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectRef, setCollectRef] = useState("");
  const [collectSubmitting, setCollectSubmitting] = useState(false);

  // Allocate Multi-Payment Form State
  const [allocCustId, setAllocCustId] = useState("");
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocMethod, setAllocMethod] = useState("CASH");
  const [allocRef, setAllocRef] = useState("");
  const [allocRows, setAllocRows] = useState<Array<{ invoiceId: string; invoiceNo: string; total: number; paidTotal: number; due: number; allocated: number }>>([]);
  const [allocSubmitting, setAllocSubmitting] = useState(false);

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

  // Load auxiliary reference data (Customers, Products, Branches)
  useEffect(() => {
    async function loadAux() {
      try {
        const [cRes, pRes, bRes]: any = await Promise.all([
          api.get("/v1/customers?limit=250").catch(() => ({ data: { data: [] } })),
          api.get("/v1/products?limit=250").catch(() => ({ data: { data: [] } })),
          api.get("/v1/branches?limit=50").catch(() => ({ data: { data: [] } })),
        ]);
        setCustomers(cRes.data?.data ?? []);
        setProducts(pRes.data?.data ?? []);
        const brList = bRes.data?.data ?? [];
        setBranches(brList);
        if (brList.length > 0 && !form.branchId) {
          setForm((prev) => ({ ...prev, branchId: brList[0].id }));
        }
      } catch (err) {
        console.error("Failed to load reference data", err);
      }
    }
    loadAux();
  }, []);

  // Load Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res: any = await api.get("/v1/invoices/stats");
      setStats(res.data?.data ?? null);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Invoices with Filters
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);

      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (filterType) params.set("invoiceType", filterType);
      if (filterBranch) params.set("branchId", filterBranch);

      // Handle Sub-section or Tab Selection
      if (subSection === "tax_mushak") {
        params.set("invoiceType", "TAX");
      } else if (subSection === "credit_notes") {
        params.set("invoiceType", "CREDIT_NOTE");
      } else if (subSection === "aging") {
        params.set("status", "UNPAID");
      } else {
        if (activeTab === "UNPAID") {
          params.set("status", "UNPAID");
        } else if (activeTab === "OVERDUE") {
          params.set("status", "OVERDUE");
        } else if (activeTab === "PAID") {
          params.set("status", "PAID");
        } else if (activeTab === "TAX") {
          params.set("invoiceType", "TAX");
        } else if (activeTab === "NOTES") {
          params.set("invoiceType", "CREDIT_NOTE");
        } else if (activeTab === "VOID") {
          params.set("status", "VOID");
        }
      }

      // Date Filters
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

      const res: any = await api.get(`/v1/invoices?${params.toString()}`);
      const dataList = res.data?.data ?? [];
      setInvoices(dataList);

      const pagination = res.data?.pagination || res.data?.extra?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalRecords(pagination.total || dataList.length);
      } else {
        setTotalPages(1);
        setTotalRecords(dataList.length);
      }
    } catch (err: any) {
      console.error("Failed to load invoices", err);
      showToast(err.response?.data?.error ?? "Error loading invoices", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, searchQuery, filterType, filterBranch, activeTab, subSection, dateRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // View Invoice in Drawer
  const openInvoiceDrawer = async (id: string) => {
    setDrawerLoading(true);
    setSelectedInvoiceForDrawer(null);
    try {
      const res: any = await api.get(`/v1/invoices/${id}`);
      setSelectedInvoiceForDrawer(res.data?.data ?? null);
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to fetch invoice details", "error");
    } finally {
      setDrawerLoading(false);
    }
  };

  // Launch Universal Invoice Print Modal
  const launchPrintModal = async (inv: Invoice, overrideVertical?: InvoiceVerticalType) => {
    try {
      let fullInv = inv;
      if (!inv.items || inv.items.length === 0) {
        const r: any = await api.get(`/v1/invoices/${inv.id}`);
        fullInv = r.data?.data ?? inv;
      }

      const mappedItems: InvoiceItem[] = (fullInv.items && fullInv.items.length > 0)
        ? fullInv.items.map((i) => ({
            id: i.id,
            productName: i.description,
            name: i.description,
            qty: Number(i.qty),
            unitPrice: Number(i.unitPrice),
            discount: Number(i.discountAmount),
            total: Number(i.lineTotal),
          }))
        : [
            {
              productName: `Invoice Ref: ${fullInv.invoiceNo}`,
              name: `Invoice Ref: ${fullInv.invoiceNo}`,
              qty: 1,
              unitPrice: Number(fullInv.total),
              total: Number(fullInv.total),
            },
          ];

      const invoiceDataForPrint: InvoiceData = {
        id: fullInv.id,
        invoiceNo: fullInv.invoiceNo,
        createdAt: fullInv.createdAt || fullInv.issueDate,
        date: fullInv.issueDate,
        customer: fullInv.customer
          ? {
              id: fullInv.customer.id,
              name: fullInv.customer.name,
              phone: fullInv.customer.phone,
              email: fullInv.customer.email,
              address: fullInv.customer.address,
              binVatNo: fullInv.customer.binVatNo,
            }
          : null,
        items: mappedItems,
        subTotal: Number(fullInv.subtotal ?? fullInv.total),
        discountTotal: Number(fullInv.discountTotal ?? 0),
        taxTotal: Number(fullInv.taxTotal ?? 0),
        grandTotal: Number(fullInv.total),
        paidTotal: Number(fullInv.paidTotal),
        dueTotal: Math.max(0, Number(fullInv.total) - Number(fullInv.paidTotal)),
        notes: fullInv.note || undefined,
        branchName: fullInv.branchName || "Main Headquarters",
        vertical: overrideVertical || (fullInv.invoiceType === "TAX" ? "retail" : "wholesale"),
      };

      setPrintInvoiceData(invoiceDataForPrint);
      setPrintModalOpen(true);
    } catch (err: any) {
      showToast("Unable to prepare print layout", "error");
    }
  };

  // Void Invoice Action
  const handleVoidInvoice = async (id: string, invoiceNo: string) => {
    if (!confirm(`Are you sure you want to VOID invoice ${invoiceNo}? This action is irreversible and reverses customer due balance.`)) {
      return;
    }
    try {
      await api.post(`/v1/invoices/${id}/void`);
      showToast(`Invoice ${invoiceNo} marked as VOID`, "success");
      loadInvoices();
      loadStats();
      if (selectedInvoiceForDrawer?.id === id) {
        openInvoiceDrawer(id);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to void invoice", "error");
    }
  };

  // Open Single Payment Modal
  const openCollectPaymentModal = (inv: Invoice) => {
    setSelectedInvoiceForCollect(inv);
    const remaining = Math.max(0, Number(inv.total) - Number(inv.paidTotal));
    setCollectAmount(remaining);
    setCollectMethod("CASH");
    setCollectRef("");
    setShowCollectModal(true);
  };

  // Open Payment Reminder Modal
  const openReminderModal = (inv: Invoice) => {
    setSelectedInvoiceForReminder(inv);
    setShowReminderModal(true);
  };

  // Submit Single Payment
  const handleCollectPayment = async () => {
    if (!selectedInvoiceForCollect) return;
    if (collectAmount <= 0) {
      showToast("Payment amount must be greater than 0", "error");
      return;
    }
    setCollectSubmitting(true);
    try {
      await api.post(`/v1/invoices/${selectedInvoiceForCollect.id}/payments`, {
        amount: Number(collectAmount),
        method: collectMethod,
        reference: collectRef || `Payment for ${selectedInvoiceForCollect.invoiceNo}`,
        branchId: selectedInvoiceForCollect.branchId,
      });
      showToast(`Payment of ৳${Number(collectAmount).toLocaleString()} recorded successfully!`, "success");
      setShowCollectModal(false);
      loadInvoices();
      loadStats();
      if (selectedInvoiceForDrawer?.id === selectedInvoiceForCollect.id) {
        openInvoiceDrawer(selectedInvoiceForCollect.id);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to record payment", "error");
    } finally {
      setCollectSubmitting(false);
    }
  };

  // Load unpaid invoices for a specific customer in Allocate Modal
  const handleCustomerSelectForAlloc = async (cid: string) => {
    setAllocCustId(cid);
    if (!cid) {
      setAllocRows([]);
      return;
    }
    try {
      const res: any = await api.get(`/v1/invoices?customerId=${cid}&status=UNPAID&limit=50`);
      const unpaids: Invoice[] = res.data?.data ?? [];
      setAllocRows(
        unpaids.map((inv) => ({
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

  // Auto-distribute (FIFO) payment across invoices in Allocate Modal
  const handleAutoDistributeAlloc = () => {
    let remaining = Number(allocAmount) || 0;
    const updated = allocRows.map((r) => {
      const allocateForThis = Math.min(remaining, r.due);
      remaining -= allocateForThis;
      return { ...r, allocated: allocateForThis };
    });
    setAllocRows(updated);
  };

  // Submit Multi-Allocation Payment
  const handleSubmitAllocation = async () => {
    const totalAllocated = allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0);
    if (Math.abs(totalAllocated - Number(allocAmount)) > 0.01) {
      showToast(`Total allocated (৳${totalAllocated.toLocaleString()}) must match payment amount (৳${Number(allocAmount).toLocaleString()})`, "error");
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
        branchId: form.branchId || undefined,
        method: allocMethod,
        totalAmount: Number(allocAmount),
        reference: allocRef || "Multi-invoice allocation settlement",
        allocations: activeAllocations,
      });
      showToast(`Settled payment of ৳${Number(allocAmount).toLocaleString()} across ${activeAllocations.length} invoices!`, "success");
      setShowAllocateModal(false);
      loadInvoices();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to allocate payment", "error");
    } finally {
      setAllocSubmitting(false);
    }
  };

  // Quick Customer Creation inline
  const handleCreateQuickCustomer = async () => {
    if (!quickCustName.trim()) {
      showToast("Customer name is required", "error");
      return;
    }
    setQuickCustSaving(true);
    try {
      const res: any = await api.post("/v1/customers", {
        name: quickCustName.trim(),
        phone: quickCustPhone.trim() || undefined,
        address: quickCustAddress.trim() || undefined,
        binVatNo: quickCustBin.trim() || undefined,
      });
      const newCust = res.data?.data;
      if (newCust) {
        setCustomers((prev) => [newCust, ...prev]);
        setForm((prev) => ({ ...prev, customerId: newCust.id }));
        showToast(`Customer "${newCust.name}" added successfully!`);
      }
      setShowQuickAddCust(false);
      setQuickCustName("");
      setQuickCustPhone("");
      setQuickCustBin("");
      setQuickCustAddress("");
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to create customer", "error");
    } finally {
      setQuickCustSaving(false);
    }
  };

  // Line Item Math for Create Form
  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...form.items];
    const item: any = { ...updated[index], [field]: value };

    const qty = Number(item.qty) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discountAmount) || 0;
    const tax = Number(item.taxAmount) || 0;
    item.lineTotal = Math.max(0, qty * price - disc + tax);

    updated[index] = item;
    setForm((prev) => ({ ...prev, items: updated }));
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const updated = [...form.items];
    const unitPrice = Number(prod.retailPrice || 0);
    const taxRate = Number(prod.vatPercent || 0);
    const taxAmount = (unitPrice * taxRate) / 100;
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      description: prod.name,
      unitPrice,
      taxAmount,
      lineTotal: unitPrice + taxAmount,
    };
    setForm((prev) => ({ ...prev, items: updated }));
  };

  const addLineItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: "", description: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0, lineTotal: 0 },
      ],
    }));
  };

  const removeLineItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Computed Totals for Create Form
  const formSubtotal = form.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const formDiscountTotal = form.items.reduce((s, i) => s + (Number(i.discountAmount) || 0), 0);
  const formTaxTotal = form.items.reduce((s, i) => s + (Number(i.taxAmount) || 0), 0);
  const formGrandTotal = Math.max(0, formSubtotal - formDiscountTotal + formTaxTotal);

  // Submit New Invoice
  const handleCreateInvoice = async () => {
    if (form.items.some((i) => !i.description.trim() || Number(i.qty) <= 0)) {
      showToast("Please provide valid descriptions and quantities for all lines", "error");
      return;
    }
    try {
      const res: any = await api.post("/v1/invoices", {
        ...form,
        subtotal: formSubtotal,
        discountTotal: formDiscountTotal,
        taxTotal: formTaxTotal,
        total: formGrandTotal,
        paidTotal: Number(form.initialPayment),
        items: form.items.map((i) => ({
          productId: i.productId || undefined,
          description: i.description,
          qty: Number(i.qty),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount),
          taxAmount: Number(i.taxAmount),
          lineTotal: Number(i.lineTotal),
        })),
      });

      showToast(`Invoice ${res.data?.data?.invoiceNo || "created"} issued successfully!`);
      setShowCreateModal(false);
      // Reset form
      setForm({
        branchId: branches[0]?.id || "",
        customerId: "",
        invoiceType: "TAX",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        note: "",
        paymentTerms: "Due on Receipt",
        initialPayment: 0,
        paymentMethod: "CASH",
        items: [{ productId: "", description: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0, lineTotal: 0 }],
      });
      loadInvoices();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.error ?? "Failed to create invoice", "error");
    }
  };

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map((i) => i.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export Invoices as CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0 ? invoices.filter((i) => selectedIds.includes(i.id)) : invoices;
    if (listToExport.length === 0) {
      showToast("No invoices to export", "error");
      return;
    }
    const headers = ["Invoice No", "Type", "Status", "Customer", "Phone", "BIN/VAT", "Issue Date", "Due Date", "Subtotal", "Tax", "Discount", "Total", "Paid", "Due"];
    const rows = listToExport.map((i) => [
      i.invoiceNo,
      i.invoiceType,
      i.status,
      `"${i.customer?.name || "Walk-in"}"`,
      i.customer?.phone || "",
      i.customer?.binVatNo || "",
      i.issueDate,
      i.dueDate || "",
      i.subtotal ?? i.total,
      i.taxTotal ?? 0,
      i.discountTotal ?? 0,
      i.total,
      i.paidTotal,
      Math.max(0, Number(i.total) - Number(i.paidTotal)),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} invoices to CSV!`);
  };

  // Helper check for overdue
  const isOverdue = (inv: Invoice) => {
    if (inv.status === "PAID" || inv.status === "VOID" || !inv.dueDate) return false;
    const due = new Date(inv.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Calculate Aging Buckets for Intelligence Widget
  const agingBuckets = useMemo(() => {
    let notDue = 0;
    let b1_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90_plus = 0;
    const now = new Date().getTime();

    invoices.forEach((inv) => {
      if (inv.status === "PAID" || inv.status === "VOID") return;
      const due = Math.max(0, Number(inv.total) - Number(inv.paidTotal));
      if (due <= 0) return;

      if (!inv.dueDate) {
        notDue += due;
        return;
      }
      const dueDate = new Date(inv.dueDate).getTime();
      const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) notDue += due;
      else if (diffDays <= 30) b1_30 += due;
      else if (diffDays <= 60) b31_60 += due;
      else if (diffDays <= 90) b61_90 += due;
      else b90_plus += due;
    });

    return { notDue, b1_30, b31_60, b61_90, b90_plus };
  }, [invoices]);

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
                <Receipt size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Invoice Engine & Billing</h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-emerald-200">
                    NBR 6.3 Compliant
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Mushak 6.3 Tax Invoices · Multi-Vertical Commercial Challans · Smart Aging & Credit Ledger
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/invoices/collection"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
            >
              <Wallet size={14} className="text-primary-600" />
              Collections Hub
            </Link>

            <button
              onClick={() => setShowAllocateModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50/70 px-3.5 py-2 text-xs font-semibold text-primary-700 shadow-xs transition hover:bg-primary-100/80 active:scale-95"
            >
              <CreditCard size={14} />
              Bulk Settle
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-500/25 transition hover:brightness-110 active:scale-95"
            >
              <Plus size={16} className="stroke-[2.5]" />
              New Invoice
            </button>
          </div>
        </div>

        {/* Module Sub-Navigation Bar */}
        <div className="mx-auto mt-5 flex max-w-7xl items-center gap-2 overflow-x-auto border-t border-slate-100 pt-3 pb-1 no-scrollbar">
          {[
            { id: "all", label: "Invoice Management", icon: FileText },
            { id: "aging", label: "Aging & Due Intelligence", icon: Clock },
            { id: "tax_mushak", label: "Mushak 6.3 Tax Invoices", icon: ShieldCheck },
            { id: "credit_notes", label: "Credit & Debit Notes", icon: RotateCcw },
          ].map((s) => {
            const Icon = s.icon;
            const active = subSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSubSection(s.id as any);
                  setActiveTab("ALL");
                  setPage(1);
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={14} className={active ? "text-white" : "text-slate-400"} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-5">
        {/* Executive KPI Stats Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Total Invoiced */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</span>
              <div className="rounded-lg bg-primary-50 p-1.5 text-primary-600">
                <FileText size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {statsLoading ? "—" : `৳${Number(stats?.totalAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>{stats?.totalInvoices || invoices.length} total issued</span>
            </div>
          </div>

          {/* 2. Total Paid / Collections */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Collected</span>
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-emerald-700">
              {statsLoading ? "—" : `৳${Number(stats?.paidAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <span>{stats?.paidCount || 0} fully settled</span>
            </div>
          </div>

          {/* 3. Outstanding Receivables */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">Outstanding</span>
              <div className="rounded-lg bg-sky-50 p-1.5 text-sky-600">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-sky-700">
              {statsLoading ? "—" : `৳${Number(stats?.outstandingAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sky-600">
              <span>{stats?.partiallyPaidCount || 0} partial balances</span>
            </div>
          </div>

          {/* 4. Overdue Invoices */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Overdue Alert</span>
              <div className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-rose-700">
              {statsLoading ? "—" : `৳${Number(stats?.overdueAmount || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600">
              <span>{stats?.overdueCount || 0} past due date</span>
            </div>
          </div>

          {/* 5. Mushak 6.3 Tax Invoices */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700">Mushak 6.3</span>
              <div className="rounded-lg bg-primary-50 p-1.5 text-primary-700">
                <ShieldCheck size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {statsLoading ? "—" : stats?.taxCount ?? 0}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary-700">
              <span>Govt NBR Registered</span>
            </div>
          </div>

          {/* 6. Collection Recovery Rate */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recovery Rate</span>
              <div className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="mt-2 text-lg sm:text-xl font-black text-slate-900">
              {stats && stats.totalAmount > 0
                ? `${Math.min(100, Math.round((Number(stats.paidAmount) / Number(stats.totalAmount)) * 100))}%`
                : "100%"}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <span>Health benchmark 95%+</span>
            </div>
          </div>
        </div>

        {/* Executive Aging Intelligence Bar */}
        <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Receivables Aging & Recovery Timeline
              </h3>
              <p className="text-[11px] text-slate-500">Cash-flow distribution across overdue aging buckets</p>
            </div>

            {/* Buckets grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <span className="text-[10px] font-bold text-slate-500">Current (Not Due)</span>
                <p className="font-black text-slate-800">৳{agingBuckets.notDue.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-amber-50/70 p-2.5 text-center border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700">1 - 30 Days</span>
                <p className="font-black text-amber-800">৳{agingBuckets.b1_30.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-orange-50/70 p-2.5 text-center border border-orange-100">
                <span className="text-[10px] font-bold text-orange-700">31 - 60 Days</span>
                <p className="font-black text-orange-800">৳{agingBuckets.b31_60.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-rose-50/70 p-2.5 text-center border border-rose-100">
                <span className="text-[10px] font-bold text-rose-700">61 - 90 Days</span>
                <p className="font-black text-rose-800">৳{agingBuckets.b61_90.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-rose-100 p-2.5 text-center border border-rose-200">
                <span className="text-[10px] font-black text-rose-800">90+ Days Critical</span>
                <p className="font-black text-rose-900">৳{agingBuckets.b90_plus.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Operations Floating Bar (When rows are checked) */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary-800 via-primary-700 to-indigo-800 px-5 py-3 text-xs text-white shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-primary-200" />
              <span className="font-bold">{selectedIds.length} invoices selected</span>
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
                { id: "ALL", label: "All Records" },
                { id: "UNPAID", label: "Due / Unpaid" },
                { id: "OVERDUE", label: "Overdue Alerts" },
                { id: "PAID", label: "Paid in Full" },
                { id: "TAX", label: "Mushak 6.3 Tax" },
                { id: "NOTES", label: "Credit Notes" },
                { id: "VOID", label: "Voided" },
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
                  loadInvoices();
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
                placeholder="Search invoice #, customer, phone, BIN..."
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

            {/* Invoice Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">All Invoice Types</option>
                <option value="TAX">Mushak 6.3 Tax Invoice</option>
                <option value="STANDARD">Commercial Invoice</option>
                <option value="CREDIT_NOTE">Credit Note</option>
                <option value="DEBIT_NOTE">Debit Note</option>
                <option value="PROFORMA">Proforma Invoice</option>
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

        {/* Invoices List Content */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xs">
            <RefreshCw size={28} className="animate-spin text-primary-600" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Loading invoice engine data...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
            <div className="rounded-2xl bg-primary-50 p-4 text-primary-600">
              <FileText size={36} />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">No invoices found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              No invoice records matched your criteria. Create a new invoice or adjust your search filters.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-500/25 hover:bg-primary-700"
            >
              <Plus size={15} />
              Create First Invoice
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
                        {selectedIds.length === invoices.length && invoices.length > 0 ? (
                          <CheckSquare size={16} className="text-primary-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 pl-2 pr-3">Invoice Details</th>
                    <th className="px-3 py-3.5">Customer & BIN</th>
                    <th className="px-3 py-3.5">Issue & Due Date</th>
                    <th className="px-3 py-3.5 text-right">Total (৳)</th>
                    <th className="px-3 py-3.5 text-right">Paid (৳)</th>
                    <th className="px-3 py-3.5 text-right">Balance Due (৳)</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const dueAmt = Math.max(0, Number(inv.total) - Number(inv.paidTotal));
                    const overdue = isOverdue(inv);
                    const percentPaid = inv.total > 0 ? Math.min(100, Math.round((Number(inv.paidTotal) / Number(inv.total)) * 100)) : 0;
                    const typeCfg = TYPE_CONFIG[inv.invoiceType] || TYPE_CONFIG.STANDARD;
                    const statusCfg = overdue ? STATUS_CONFIG.OVERDUE : (STATUS_CONFIG[inv.status] || STATUS_CONFIG.ISSUED);
                    const isSelected = selectedIds.includes(inv.id);

                    return (
                      <tr key={inv.id} className={`group transition ${isSelected ? "bg-primary-50/30" : "hover:bg-slate-50/70"}`}>
                        {/* Checkbox */}
                        <td className="py-3.5 pl-4 pr-2">
                          <button onClick={() => toggleSelectRow(inv.id)} className="text-slate-400 hover:text-slate-700">
                            {isSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Invoice Details */}
                        <td className="py-3.5 pl-2 pr-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => copyToClipboard(inv.invoiceNo, inv.id)}
                                className="cursor-pointer font-mono font-bold text-slate-900 transition hover:text-primary-600"
                                title="Click to copy invoice number"
                              >
                                {inv.invoiceNo}
                              </span>
                              {copiedId === inv.id ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} className="text-slate-300 opacity-0 transition group-hover:opacity-100" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${typeCfg.badge}`}>
                                {typeCfg.label}
                              </span>
                              {inv.branchName && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                  • {inv.branchName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-3 py-3.5">
                          {inv.customer ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{inv.customer.name}</span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                {inv.customer.phone && <span>{inv.customer.phone}</span>}
                                {inv.customer.binVatNo && (
                                  <span className="font-mono text-[10px] text-primary-700 font-semibold">BIN: {inv.customer.binVatNo}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="font-medium italic text-slate-400">Walk-in Customer</span>
                          )}
                        </td>

                        {/* Issue & Due Date */}
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-700">
                              {new Date(inv.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {inv.dueDate && (
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-[11px] ${
                                    overdue ? "font-bold text-rose-600" : "text-slate-400"
                                  }`}
                                >
                                  Due: {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                                {overdue && (
                                  <span className="rounded bg-rose-100 px-1 py-0.2 text-[9px] font-black text-rose-700">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-3 py-3.5 text-right font-black text-slate-900 tabular-nums">
                          ৳{Number(inv.total).toLocaleString()}
                        </td>

                        {/* Paid Amount */}
                        <td className="px-3 py-3.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-700 tabular-nums">
                              ৳{Number(inv.paidTotal).toLocaleString()}
                            </span>
                            {/* Mini progress gauge */}
                            <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  percentPaid >= 100 ? "bg-emerald-500" : percentPaid > 0 ? "bg-sky-500" : "bg-transparent"
                                }`}
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Due Amount */}
                        <td className="px-3 py-3.5 text-right">
                          <span
                            className={`font-black tabular-nums ${
                              dueAmt > 0 ? (overdue ? "text-rose-600 font-black" : "text-slate-800") : "text-slate-400"
                            }`}
                          >
                            {dueAmt > 0 ? `৳${dueAmt.toLocaleString()}` : "—"}
                          </span>
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

                        {/* Actions */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Print / View layout */}
                            <button
                              onClick={() => launchPrintModal(inv)}
                              title="Print Layouts (Thermal / A4 / Mushak 6.3)"
                              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-primary-50 hover:text-primary-700 active:scale-95"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Details Drawer */}
                            <button
                              onClick={() => openInvoiceDrawer(inv.id)}
                              title="Invoice Breakdown & Ledger"
                              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Collect Payment (if due) */}
                            {inv.status !== "PAID" && inv.status !== "VOID" && dueAmt > 0 && (
                              <button
                                onClick={() => openCollectPaymentModal(inv)}
                                title="Collect Due Payment"
                                className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                              >
                                <CreditCard size={15} />
                              </button>
                            )}

                            {/* Send Reminder */}
                            {dueAmt > 0 && inv.status !== "VOID" && (
                              <button
                                onClick={() => openReminderModal(inv)}
                                title="Send Payment Reminder (SMS / WhatsApp)"
                                className="rounded-lg p-1.5 text-primary-600 transition hover:bg-primary-50 hover:text-primary-700 active:scale-95"
                              >
                                <MessageSquare size={15} />
                              </button>
                            )}

                            {/* Void Button */}
                            {inv.status !== "VOID" && (
                              <button
                                onClick={() => handleVoidInvoice(inv.id, inv.invoiceNo)}
                                title="Void Invoice"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                              >
                                <Ban size={15} />
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
                Showing {invoices.length} of {totalRecords} invoices (Page {page} of {totalPages})
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
              {invoices.map((inv) => {
                const dueAmt = Math.max(0, Number(inv.total) - Number(inv.paidTotal));
                const overdue = isOverdue(inv);
                const percentPaid = inv.total > 0 ? Math.min(100, Math.round((Number(inv.paidTotal) / Number(inv.total)) * 100)) : 0;
                const typeCfg = TYPE_CONFIG[inv.invoiceType] || TYPE_CONFIG.STANDARD;
                const statusCfg = overdue ? STATUS_CONFIG.OVERDUE : (STATUS_CONFIG[inv.status] || STATUS_CONFIG.ISSUED);

                return (
                  <div
                    key={inv.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-slate-900">
                            {inv.invoiceNo}
                          </div>
                          <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${typeCfg.badge}`}>
                            {typeCfg.label}
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
                        <p className="text-xs font-bold text-slate-800">{inv.customer?.name || "Walk-in Customer"}</p>
                        {inv.customer?.phone && <p className="text-[11px] text-slate-500">{inv.customer.phone}</p>}
                      </div>

                      {/* Financials & Dates */}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400">Total Invoiced</span>
                          <p className="font-black text-slate-900">৳{Number(inv.total).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400">Due Balance</span>
                          <p className={`font-black ${dueAmt > 0 ? "text-rose-600" : "text-slate-400"}`}>
                            ৳{dueAmt.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Paid: ৳{Number(inv.paidTotal).toLocaleString()}</span>
                          <span>{percentPaid}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentPaid >= 100 ? "bg-emerald-500" : percentPaid > 0 ? "bg-sky-500" : "bg-transparent"
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => launchPrintModal(inv)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Printer size={13} />
                          Print
                        </button>
                        <button
                          onClick={() => openInvoiceDrawer(inv.id)}
                          className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 font-bold text-white shadow-xs hover:bg-primary-700"
                        >
                          <Eye size={13} />
                          Details
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
                Page {page} of {totalPages} ({totalRecords} total invoices)
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
      {/* 1. CREATE NEW INVOICE MODAL / BUILDER (Device Friendly)   */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95">
            {/* Sticky Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">Create & Issue Invoice</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Government Mushak 6.3 or Commercial invoice with itemized tax</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">
              {/* Metadata row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Branch */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Outlet / Branch *</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice Type */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Invoice Type *</label>
                  <select
                    value={form.invoiceType}
                    onChange={(e) => setForm((p) => ({ ...p, invoiceType: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="TAX">Mushak 6.3 Tax Invoice (VAT Registered)</option>
                    <option value="STANDARD">Standard Commercial Invoice</option>
                    <option value="CREDIT_NOTE">Credit Note (Sales Return / Rebate)</option>
                    <option value="DEBIT_NOTE">Debit Note (Price Adjustment)</option>
                    <option value="PROFORMA">Proforma Invoice</option>
                  </select>
                </div>

                {/* Issue Date */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Issue Date *</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* Customer Row */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <label className="text-xs font-bold text-slate-800">Customer & Tax Identity</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCust(!showQuickAddCust)}
                    className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                  >
                    <UserPlus size={14} />
                    {showQuickAddCust ? "Choose Existing Customer" : "+ Register New Customer"}
                  </button>
                </div>

                {showQuickAddCust ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                    <input
                      type="text"
                      placeholder="Company / Client Name *"
                      value={quickCustName}
                      onChange={(e) => setQuickCustName(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-primary-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={quickCustPhone}
                      onChange={(e) => setQuickCustPhone(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-primary-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="BIN / VAT No (Optional)"
                      value={quickCustBin}
                      onChange={(e) => setQuickCustBin(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-primary-500 focus:outline-none font-mono"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Address"
                        value={quickCustAddress}
                        onChange={(e) => setQuickCustAddress(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:border-primary-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={quickCustSaving}
                        onClick={handleCreateQuickCustomer}
                        className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Walk-in Customer (General Public)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""} {c.binVatNo ? `[BIN: ${c.binVatNo}]` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Line Items Builder (Fully Device-Friendly) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized Line Items</span>
                  <span className="text-xs text-slate-400">{form.items.length} lines</span>
                </div>

                {/* Desktop View Table (md and up) */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 pl-4 pr-2 w-44">Product Autocomplete</th>
                        <th className="px-2 py-2.5">Description *</th>
                        <th className="px-2 py-2.5 w-20 text-center">Qty</th>
                        <th className="px-2 py-2.5 w-28 text-right">Price (৳)</th>
                        <th className="px-2 py-2.5 w-24 text-right">Disc (৳)</th>
                        <th className="px-2 py-2.5 w-24 text-right">VAT (৳)</th>
                        <th className="px-2 py-2.5 w-28 text-right">Line Total (৳)</th>
                        <th className="py-2.5 pl-2 pr-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form.items.map((item, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/50">
                          {/* Product select */}
                          <td className="py-2 pl-4 pr-2">
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-[11px] focus:bg-white focus:outline-none"
                            >
                              <option value="">-- Custom item --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Description */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              placeholder="Item description *"
                              value={item.description}
                              onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium focus:border-primary-500 focus:outline-none"
                            />
                          </td>

                          {/* Qty */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => updateLineItem(idx, "qty", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-bold focus:border-primary-500 focus:outline-none"
                            />
                          </td>

                          {/* Price */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-xs font-bold focus:border-primary-500 focus:outline-none"
                            />
                          </td>

                          {/* Discount */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.discountAmount}
                              onChange={(e) => updateLineItem(idx, "discountAmount", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-xs text-rose-600 focus:border-primary-500 focus:outline-none"
                            />
                          </td>

                          {/* Tax */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.taxAmount}
                              onChange={(e) => updateLineItem(idx, "taxAmount", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-xs text-primary-700 font-semibold focus:border-primary-500 focus:outline-none"
                            />
                          </td>

                          {/* Total */}
                          <td className="px-2 py-2 text-right font-black text-slate-800 tabular-nums">
                            ৳{Number(item.lineTotal || 0).toLocaleString()}
                          </td>

                          {/* Delete Line */}
                          <td className="py-2 pl-2 pr-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              disabled={form.items.length <= 1}
                              className="rounded p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Friendly Card View (Screen < md) */}
                <div className="block md:hidden space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">
                          Item #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          disabled={form.items.length <= 1}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Product select & Description */}
                      <div className="space-y-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-xs font-semibold focus:bg-white focus:outline-none"
                        >
                          <option value="">-- Choose from inventory --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Item Description *"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium focus:border-primary-500 focus:outline-none"
                        />
                      </div>

                      {/* 2x2 Numeric Inputs */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateLineItem(idx, "qty", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2 text-center text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Unit Price (৳)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2 text-right text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-rose-500 block mb-0.5">Discount (৳)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.discountAmount}
                            onChange={(e) => updateLineItem(idx, "discountAmount", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2 text-right text-xs font-semibold text-rose-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-primary-600 block mb-0.5">Tax/VAT (৳)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.taxAmount}
                            onChange={(e) => updateLineItem(idx, "taxAmount", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 p-2 text-right text-xs font-semibold text-primary-700 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Card Total */}
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs border border-slate-100">
                        <span className="font-semibold text-slate-500">Line Subtotal:</span>
                        <span className="font-black text-slate-900">৳{Number(item.lineTotal || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addLineItem}
                  className="mt-3 flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50/60 px-3.5 py-2 text-xs font-bold text-primary-700 hover:bg-primary-100/80 transition"
                >
                  <Plus size={14} />
                  Add another item line
                </button>
              </div>

              {/* Summary and Payment row */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Notes & Immediate Payment */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 sm:p-4">
                  <h4 className="text-xs font-bold text-slate-800">Payment Terms & Initial Settlement</h4>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Immediate Deposit / Initial Payment (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formGrandTotal}
                      value={form.initialPayment}
                      onChange={(e) => setForm((p) => ({ ...p, initialPayment: Number(e.target.value) }))}
                      placeholder="0.00 (Leave 0 for full credit)"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-emerald-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {form.initialPayment > 0 && (
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">Payment Channel</label>
                      <select
                        value={form.paymentMethod}
                        onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold focus:outline-none"
                      >
                        <option value="CASH">Cash Drawer</option>
                        <option value="BKASH">bKash Merchant</option>
                        <option value="NAGAD">Nagad</option>
                        <option value="CARD">POS / Card Gateway</option>
                        <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">Payment Terms</label>
                    <select
                      value={form.paymentTerms}
                      onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Due on Receipt">Due on Receipt (Standard)</option>
                      <option value="Net 7 Days">Net 7 Days</option>
                      <option value="Net 15 Days">Net 15 Days</option>
                      <option value="Net 30 Days">Net 30 Days</option>
                      <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">Note / Instructions</label>
                    <textarea
                      rows={2}
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="Delivery remarks, transport challan details, bank account info..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Themed Calculated Invoice Breakdown */}
                <div className="flex flex-col justify-between rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/40 p-4 sm:p-5 shadow-xs">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Financial Calculation</h4>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-bold tabular-nums text-slate-800">৳{formSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-rose-600">
                      <span>Total Discounts</span>
                      <span className="font-bold tabular-nums">- ৳{formDiscountTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-primary-700 font-semibold">
                      <span>Total Tax / Mushak VAT</span>
                      <span className="font-bold tabular-nums">+ ৳{formTaxTotal.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200/80 pt-2.5 flex justify-between text-base font-black text-slate-900">
                      <span>Grand Total</span>
                      <span className="tabular-nums text-primary-700">৳{formGrandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-white border border-slate-200/80 p-3 text-xs flex justify-between items-center shadow-2xs">
                    <span className="text-slate-500 font-medium">Due Balance After Deposit:</span>
                    <span className="font-black text-rose-600 tabular-nums text-sm">
                      ৳{Math.max(0, formGrandTotal - form.initialPayment).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="shrink-0 flex flex-wrap items-center justify-between sm:justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateInvoice}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-500/25 hover:brightness-110 active:scale-95"
              >
                <CheckCircle2 size={16} />
                Confirm & Issue Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SINGLE INVOICE PAYMENT COLLECTION MODAL                */}
      {/* ========================================================= */}
      {showCollectModal && selectedInvoiceForCollect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 font-bold">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Payment</h3>
                  <p className="text-[11px] text-slate-500">{selectedInvoiceForCollect.invoiceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Invoice snapshot */}
              <div className="rounded-2xl bg-slate-50 p-3.5 space-y-1.5 border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForCollect.customer?.name || "Walk-in"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-900">৳{Number(selectedInvoiceForCollect.total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-bold text-emerald-700">৳{Number(selectedInvoiceForCollect.paidTotal).toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900">
                  <span>Current Due:</span>
                  <span className="text-rose-600">
                    ৳{Math.max(0, Number(selectedInvoiceForCollect.total) - Number(selectedInvoiceForCollect.paidTotal)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment inputs */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Payment Amount (৳) *</label>
                  <button
                    type="button"
                    onClick={() =>
                      setCollectAmount(Math.max(0, Number(selectedInvoiceForCollect.total) - Number(selectedInvoiceForCollect.paidTotal)))
                    }
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
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-black text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                <label className="mb-1 block font-bold text-slate-700">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="Slip # / Trx ID / Check ref"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
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
                {collectSubmitting ? "Recording..." : "Record Payment"}
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
            {/* Header */}
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Customer and Amount */}
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

            {/* Footer */}
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
      {/* 4. PAYMENT REMINDER (SMS / WHATSAPP) MODAL                */}
      {/* ========================================================= */}
      {showReminderModal && selectedInvoiceForReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-bold border border-primary-200/60">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payment Reminder</h3>
                  <p className="text-[11px] text-slate-500">{selectedInvoiceForReminder.invoiceNo}</p>
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
                <p className="font-bold text-slate-800">{selectedInvoiceForReminder.customer?.name || "Customer"}</p>
                <p className="font-mono text-slate-600">{selectedInvoiceForReminder.customer?.phone || "No phone provided"}</p>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Reminder Message Preview</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 font-mono text-[11px] text-slate-700">
                  Dear {selectedInvoiceForReminder.customer?.name || "Customer"}, your invoice{" "}
                  <strong>{selectedInvoiceForReminder.invoiceNo}</strong> has an outstanding balance of ৳
                  {Math.max(
                    0,
                    Number(selectedInvoiceForReminder.total) - Number(selectedInvoiceForReminder.paidTotal)
                  ).toLocaleString()}
                  . Please settle at your earliest convenience. Thank you!
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {selectedInvoiceForReminder.customer?.phone && (
                  <a
                    href={`https://wa.me/${selectedInvoiceForReminder.customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Dear ${selectedInvoiceForReminder.customer?.name || "Customer"}, your invoice ${selectedInvoiceForReminder.invoiceNo} has an outstanding balance of ৳${Math.max(
                        0,
                        Number(selectedInvoiceForReminder.total) - Number(selectedInvoiceForReminder.paidTotal)
                      ).toLocaleString()}. Thank you!`
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
      {/* 5. INVOICE DETAILS SLIDE-OVER DRAWER                      */}
      {/* ========================================================= */}
      {selectedInvoiceForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="h-full w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden transition-all animate-in slide-in-from-right duration-200">
            {/* Drawer Sticky Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoice Ledger View</span>
                <h3 className="font-mono text-lg font-black text-slate-900">{selectedInvoiceForDrawer.invoiceNo}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => launchPrintModal(selectedInvoiceForDrawer)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  onClick={() => setSelectedInvoiceForDrawer(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Customer & Info Cards */}
              <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Client / Buyer Info</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      TYPE_CONFIG[selectedInvoiceForDrawer.invoiceType]?.badge || ""
                    }`}
                  >
                    {selectedInvoiceForDrawer.invoiceType}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedInvoiceForDrawer.customer?.name || "Walk-in Customer"}
                </p>
                {selectedInvoiceForDrawer.customer?.phone && (
                  <p className="flex items-center gap-1 text-slate-500">
                    <Phone size={13} /> {selectedInvoiceForDrawer.customer.phone}
                  </p>
                )}
                {selectedInvoiceForDrawer.customer?.binVatNo && (
                  <p className="flex items-center gap-1 font-mono text-primary-700 font-semibold">
                    <ShieldCheck size={13} /> BIN/VAT: {selectedInvoiceForDrawer.customer.binVatNo}
                  </p>
                )}
                {selectedInvoiceForDrawer.customer?.address && (
                  <p className="text-slate-500">{selectedInvoiceForDrawer.customer.address}</p>
                )}
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <span className="text-[10px] text-slate-400">Issue Date</span>
                  <p className="font-bold text-slate-800">{new Date(selectedInvoiceForDrawer.issueDate).toLocaleDateString()}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <span className="text-[10px] text-slate-400">Due Date</span>
                  <p className="font-bold text-slate-800">
                    {selectedInvoiceForDrawer.dueDate
                      ? new Date(selectedInvoiceForDrawer.dueDate).toLocaleDateString()
                      : "Immediate"}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <span className="font-bold text-slate-800 uppercase text-[11px]">Itemized Lines</span>
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                        <th className="py-2 pl-3">Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 pr-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedInvoiceForDrawer.items || []).map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="py-2 pl-3 font-medium text-slate-800">{item.description}</td>
                          <td className="py-2 text-center text-slate-600">{item.qty}</td>
                          <td className="py-2 text-right text-slate-600">৳{Number(item.unitPrice).toLocaleString()}</td>
                          <td className="py-2 pr-3 text-right font-bold text-slate-900">৳{Number(item.lineTotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Themed Financial Totals */}
              <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/40 p-4 text-slate-800 space-y-2 shadow-2xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold">৳{Number(selectedInvoiceForDrawer.subtotal ?? selectedInvoiceForDrawer.total).toLocaleString()}</span>
                </div>
                {Number(selectedInvoiceForDrawer.discountTotal || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>- ৳{Number(selectedInvoiceForDrawer.discountTotal).toLocaleString()}</span>
                  </div>
                )}
                {Number(selectedInvoiceForDrawer.taxTotal || 0) > 0 && (
                  <div className="flex justify-between text-primary-700 font-semibold">
                    <span>Tax / VAT (Mushak):</span>
                    <span>+ ৳{Number(selectedInvoiceForDrawer.taxTotal).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-primary-700">৳{Number(selectedInvoiceForDrawer.total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Paid Total:</span>
                  <span className="font-bold">৳{Number(selectedInvoiceForDrawer.paidTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-600">
                  <span>Due Balance:</span>
                  <span>৳{Math.max(0, Number(selectedInvoiceForDrawer.total) - Number(selectedInvoiceForDrawer.paidTotal)).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment History Timeline */}
              {selectedInvoiceForDrawer.payments && selectedInvoiceForDrawer.payments.length > 0 && (
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[11px]">Payment Transaction History</span>
                  <div className="mt-2 space-y-2">
                    {selectedInvoiceForDrawer.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                        <div>
                          <p className="font-bold text-slate-800">{p.method}</p>
                          <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleString()}</p>
                          {p.reference && <p className="text-[10px] text-slate-500 font-mono">Ref: {p.reference}</p>}
                        </div>
                        <span className="font-black text-emerald-600">৳{Number(p.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50/80">
              {selectedInvoiceForDrawer.status !== "PAID" && selectedInvoiceForDrawer.status !== "VOID" && (
                <button
                  onClick={() => openCollectPaymentModal(selectedInvoiceForDrawer)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  <CreditCard size={14} />
                  Collect Due
                </button>
              )}
              {selectedInvoiceForDrawer.status !== "VOID" && (
                <button
                  onClick={() => handleVoidInvoice(selectedInvoiceForDrawer.id, selectedInvoiceForDrawer.invoiceNo)}
                  className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  Void
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. UNIVERSAL INVOICE MODAL (Multi-Vertical Print Layout)  */}
      {/* ========================================================= */}
      {printModalOpen && printInvoiceData && (
        <UniversalInvoiceModal
          open={printModalOpen}
          data={printInvoiceData}
          onClose={() => setPrintModalOpen(false)}
        />
      )}
    </div>
  );
}
