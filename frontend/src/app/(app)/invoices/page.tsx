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
import {
  CustomBreadcrumb,
  CustomButton,
  CustomStatCard,
  CustomTabs,
  CustomDropdownSelect,
  CustomInput,
  CustomDatePicker,
} from "@/components/custom";

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
  STANDARD: { label: "Commercial Standard", badge: "bg-slate-100 text-gray-600 ring-1 ring-slate-200", border: "border-slate-200", icon: FileText },
  CREDIT_NOTE: { label: "Credit Note (Refund)", badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", border: "border-rose-200", icon: RotateCcw },
  DEBIT_NOTE: { label: "Debit Note (Adj.)", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", border: "border-amber-200", icon: AlertCircle },
  PROFORMA: { label: "Proforma Estimate", badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-200", border: "border-purple-200", icon: Sparkles },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PAID: { label: "Paid in Full", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  PARTIALLY_PAID: { label: "Partially Paid", bg: "bg-brand-50 border-brand-border", text: "text-brand-dark", dot: "bg-brand-500" },
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

      // Date Range Filters
      if (startDate) {
        params.set("dateFrom", startDate);
      }
      if (endDate) {
        params.set("dateTo", endDate);
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
  }, [page, limit, sortBy, sortDir, searchQuery, filterType, filterBranch, activeTab, subSection, startDate, endDate]);

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
    let notDue = 0, countNotDue = 0;
    let b1_30 = 0, count1_30 = 0;
    let b31_60 = 0, count31_60 = 0;
    let b61_90 = 0, count61_90 = 0;
    let b90_plus = 0, count90_plus = 0;
    const now = new Date().getTime();

    invoices.forEach((inv) => {
      if (inv.status === "PAID" || inv.status === "VOID") return;
      const due = Math.max(0, Number(inv.total) - Number(inv.paidTotal));
      if (due <= 0) return;

      if (!inv.dueDate) {
        notDue += due;
        countNotDue++;
        return;
      }
      const dueDate = new Date(inv.dueDate).getTime();
      const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        notDue += due;
        countNotDue++;
      } else if (diffDays <= 30) {
        b1_30 += due;
        count1_30++;
      } else if (diffDays <= 60) {
        b31_60 += due;
        count31_60++;
      } else if (diffDays <= 90) {
        b61_90 += due;
        count61_90++;
      } else {
        b90_plus += due;
        count90_plus++;
      }
    });

    const totalReceivables = notDue + b1_30 + b31_60 + b61_90 + b90_plus;
    const totalOverdue = b1_30 + b31_60 + b61_90 + b90_plus;
    const totalInvoicesWithDue = countNotDue + count1_30 + count31_60 + count61_90 + count90_plus;

    const pNotDue = totalReceivables > 0 ? (notDue / totalReceivables) * 100 : 0;
    const p1_30 = totalReceivables > 0 ? (b1_30 / totalReceivables) * 100 : 0;
    const p31_60 = totalReceivables > 0 ? (b31_60 / totalReceivables) * 100 : 0;
    const p61_90 = totalReceivables > 0 ? (b61_90 / totalReceivables) * 100 : 0;
    const p90_plus = totalReceivables > 0 ? (b90_plus / totalReceivables) * 100 : 0;

    return {
      notDue, countNotDue, pNotDue,
      b1_30, count1_30, p1_30,
      b31_60, count31_60, p31_60,
      b61_90, count61_90, p61_90,
      b90_plus, count90_plus, p90_plus,
      totalReceivables,
      totalOverdue,
      totalInvoicesWithDue,
    };
  }, [invoices]);

  // Section Filter Options (Converted from Top Module Tab)
  const sectionFilterOptions = [
    { label: "All Invoice Sections", value: "all" },
    { label: "Aging & Due Intelligence", value: "aging" },
    { label: "Mushak 6.3 Tax Invoices", value: "tax_mushak" },
    { label: "Credit & Debit Notes", value: "credit_notes" },
  ];

  // Invoice Type Filter Options
  const typeFilterOptions = [
    { label: "All Invoice Types", value: "" },
    { label: "Mushak 6.3 Tax Invoice", value: "TAX" },
    { label: "Commercial Invoice", value: "STANDARD" },
    { label: "Credit Note", value: "CREDIT_NOTE" },
    { label: "Debit Note", value: "DEBIT_NOTE" },
    { label: "Proforma Invoice", value: "PROFORMA" },
  ];

  // Branch Filter Options
  const branchFilterOptions = [
    { label: "All Outlets / Branches", value: "" },
    ...branches.map((b) => ({ label: b.name, value: b.id })),
  ];


  // Memoized Options for Modal Dropdown Selects
  const allocCustomerOptions = useMemo(() => [
    { label: "-- Choose Customer --", value: "" },
    ...customers.map((c) => ({
      label: `${c.name}${c.phone ? ` (${c.phone})` : ""}`,
      value: c.id,
    })),
  ], [customers]);

  const allocMethodOptions = useMemo(() => [
    { label: "Cash Drawer", value: "CASH" },
    { label: "bKash", value: "BKASH" },
    { label: "Nagad", value: "NAGAD" },
    { label: "Card / POS", value: "CARD" },
    { label: "Bank Wire Transfer", value: "BANK_TRANSFER" },
  ], []);

  const modalBranchOptions = useMemo(() => [
    ...branches.map((b) => ({ label: b.name, value: b.id })),
  ], [branches]);

  const modalInvoiceTypeOptions = useMemo(() => [
    { label: "Mushak 6.3 Tax Invoice (VAT Registered)", value: "TAX" },
    { label: "Standard Commercial Invoice", value: "STANDARD" },
    { label: "Credit Note (Sales Return / Rebate)", value: "CREDIT_NOTE" },
    { label: "Debit Note (Price Adjustment)", value: "DEBIT_NOTE" },
    { label: "Proforma Invoice", value: "PROFORMA" },
  ], []);

  const modalCustomerOptions = useMemo(() => [
    { label: "Walk-in Customer (General Public)", value: "" },
    ...customers.map((c) => ({
      label: `${c.name}${c.phone ? ` (${c.phone})` : ""}${c.binVatNo ? ` [BIN: ${c.binVatNo}]` : ""}`,
      value: c.id,
    })),
  ], [customers]);

  const modalPaymentMethodOptions = useMemo(() => [
    { label: "Cash Drawer", value: "CASH" },
    { label: "bKash Merchant", value: "BKASH" },
    { label: "Nagad", value: "NAGAD" },
    { label: "POS / Card Gateway", value: "CARD" },
    { label: "Bank Wire Transfer", value: "BANK_TRANSFER" },
  ], []);

  const modalPaymentTermsOptions = useMemo(() => [
    { label: "Due on Receipt (Standard)", value: "Due on Receipt" },
    { label: "Net 7 Days", value: "Net 7 Days" },
    { label: "Net 15 Days", value: "Net 15 Days" },
    { label: "Net 30 Days", value: "Net 30 Days" },
    { label: "50% Advance, 50% on Delivery", value: "50% Advance, 50% on Delivery" },
  ], []);

  const modalCollectMethodOptions = useMemo(() => [
    { label: "Cash Drawer", value: "CASH" },
    { label: "bKash", value: "BKASH" },
    { label: "Nagad", value: "NAGAD" },
    { label: "Card / POS", value: "CARD" },
    { label: "Bank Wire Transfer", value: "BANK_TRANSFER" },
    { label: "Bank Cheque", value: "CHEQUE" },
  ], []);

  const modalProductOptions = useMemo(() => [
    { label: "-- Custom item --", value: "" },
    ...products.map((p) => ({
      label: `${p.name}${p.retailPrice ? ` (৳${Number(p.retailPrice).toLocaleString()})` : ""}`,
      value: p.id,
    })),
  ], [products]);

  return (
    <div className="w-full space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-sm px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success" ? "bg-slate-900 ring-1 ring-slate-800" : "bg-rose-600"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumb with 3 Distinct Color Actions */}
      <CustomBreadcrumb
        title="Invoice Engine & Billing"
        breadcrumbs={[
          { label: "Finance", href: "/invoices" },
          { label: "Invoices" },
        ]}
        icon={<Receipt size={16} className="text-brand-primary" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Action 1: Indigo Gradient */}
            <Link href="/invoices/collection">
              <CustomButton
                variant="primary"
                themeColor="indigo"
                size="sm"
                leftIcon={Wallet}
              >
                Collections Hub
              </CustomButton>
            </Link>

            {/* Action 2: Secondary Light Sky */}
            <CustomButton
              variant="secondary"
              size="sm"
              leftIcon={CreditCard}
              onClick={() => setShowAllocateModal(true)}
            >
              Bulk Settle
            </CustomButton>

            {/* Action 3: Primary Sky Gradient */}
            <CustomButton
              variant="primary"
              themeColor="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              New Invoice
            </CustomButton>
          </div>
        }
      />

      {/* Executive KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CustomStatCard
          label="Total Invoiced"
          value={statsLoading ? "—" : `৳${Number(stats?.totalAmount || 0).toLocaleString()}`}
          icon={FileText}
          tone="primary"
        />
        <CustomStatCard
          label="Collected"
          value={statsLoading ? "—" : `৳${Number(stats?.paidAmount || 0).toLocaleString()}`}
          icon={CheckCircle2}
          tone="green"
        />
        <CustomStatCard
          label="Outstanding"
          value={statsLoading ? "—" : `৳${Number(stats?.outstandingAmount || 0).toLocaleString()}`}
          icon={Clock}
          tone="blue"
        />
        <CustomStatCard
          label="Overdue Alert"
          value={statsLoading ? "—" : `৳${Number(stats?.overdueAmount || 0).toLocaleString()}`}
          icon={AlertTriangle}
          tone="red"
        />
        <CustomStatCard
          label="Mushak 6.3"
          value={statsLoading ? "—" : `${stats?.taxCount ?? 0}`}
          icon={ShieldCheck}
          tone="violet"
        />
        <CustomStatCard
          label="Recovery Rate"
          value={
            stats && stats.totalAmount > 0
              ? `${Math.min(100, Math.round((Number(stats.paidAmount) / Number(stats.totalAmount)) * 100))}%`
              : "100%"
          }
          icon={TrendingUp}
          tone="amber"
        />
      </div>

      {/* Overhauled Executive Receivables Aging & Recovery Timeline */}
      <div className="rounded-sm border border-brand-border bg-gradient-to-b from-white via-brand-50/20 to-white p-4 shadow-2xs space-y-4">
        {/* Header Row: Title & Badges */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-gradient text-white shadow-xs">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-dark">
                Receivables Aging & Recovery Timeline
              </h3>
            </div>
          </div>

          {/* Right: Key Summary Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-sm border border-brand-border bg-white px-3 py-1.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-gray-500">Total Receivables:</span>
              <span className="text-xs font-black text-gray-600">
                ৳{agingBuckets.totalReceivables.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-rose-200 bg-rose-50/60 px-3 py-1.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-rose-700">Overdue Exposure:</span>
              <span className="text-xs font-black text-rose-800">
                ৳{agingBuckets.totalOverdue.toLocaleString()}
              </span>
              {agingBuckets.totalReceivables > 0 && (
                <span className="rounded-xs bg-rose-200/80 px-1.5 py-0.5 text-[10px] font-black text-rose-900">
                  {Math.round((agingBuckets.totalOverdue / agingBuckets.totalReceivables) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Segment Stacked Visual Delinquency Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
            <span>Delinquency Spread</span>
            <span>
              {agingBuckets.totalInvoicesWithDue} active unpaid invoice{agingBuckets.totalInvoicesWithDue === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-sm bg-slate-100 p-0.5 shadow-inner border border-slate-200/70">
            {agingBuckets.pNotDue > 0 && (
              <div
                style={{ width: `${agingBuckets.pNotDue}%` }}
                className="h-full bg-emerald-500 transition-all rounded-xs"
                title={`Current (Not Due): ৳${agingBuckets.notDue.toLocaleString()} (${agingBuckets.pNotDue.toFixed(1)}%)`}
              />
            )}
            {agingBuckets.p1_30 > 0 && (
              <div
                style={{ width: `${agingBuckets.p1_30}%` }}
                className="h-full bg-amber-400 transition-all rounded-xs ml-0.5"
                title={`1 - 30 Days: ৳${agingBuckets.b1_30.toLocaleString()} (${agingBuckets.p1_30.toFixed(1)}%)`}
              />
            )}
            {agingBuckets.p31_60 > 0 && (
              <div
                style={{ width: `${agingBuckets.p31_60}%` }}
                className="h-full bg-orange-500 transition-all rounded-xs ml-0.5"
                title={`31 - 60 Days: ৳${agingBuckets.b31_60.toLocaleString()} (${agingBuckets.p31_60.toFixed(1)}%)`}
              />
            )}
            {agingBuckets.p61_90 > 0 && (
              <div
                style={{ width: `${agingBuckets.p61_90}%` }}
                className="h-full bg-rose-500 transition-all rounded-xs ml-0.5"
                title={`61 - 90 Days: ৳${agingBuckets.b61_90.toLocaleString()} (${agingBuckets.p61_90.toFixed(1)}%)`}
              />
            )}
            {agingBuckets.p90_plus > 0 && (
              <div
                style={{ width: `${agingBuckets.p90_plus}%` }}
                className="h-full bg-red-700 transition-all rounded-xs ml-0.5"
                title={`90+ Days Critical: ৳${agingBuckets.b90_plus.toLocaleString()} (${agingBuckets.p90_plus.toFixed(1)}%)`}
              />
            )}
          </div>
        </div>

        {/* 5 Distinct Tone Aging Bucket Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Bucket 1: Current / Not Due */}
          <div className="relative flex flex-col justify-between rounded-sm border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 to-white p-3 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold capitalize text-emerald-800">
                Current (Not Due)
              </span>
              <span className="rounded-xs bg-emerald-100/90 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 border border-emerald-200">
                {agingBuckets.pNotDue.toFixed(0)}%
              </span>
            </div>
            <div className="my-2">
              <p className="text-base font-black text-gray-600 tracking-tight">
                ৳{agingBuckets.notDue.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-emerald-200/70">
              <span className="font-bold text-gray-600">{agingBuckets.countNotDue} invoices</span>
              <span className="font-bold text-emerald-700">On Track</span>
            </div>
          </div>

          {/* Bucket 2: 1 - 30 Days */}
          <div className="relative flex flex-col justify-between rounded-sm border border-amber-200/80 bg-gradient-to-b from-amber-50/50 to-white p-3 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold capitalize text-amber-800">
                1 - 30 Days
              </span>
              <span className="rounded-xs bg-amber-100/90 px-1.5 py-0.5 text-[9px] font-black text-amber-800 border border-amber-200">
                {agingBuckets.p1_30.toFixed(0)}%
              </span>
            </div>
            <div className="my-2">
              <p className="text-base font-black text-amber-900 tracking-tight">
                ৳{agingBuckets.b1_30.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-200/70">
              <span className="font-bold text-gray-600">{agingBuckets.count1_30} invoices</span>
              <span className="font-bold text-amber-700">Early Watch</span>
            </div>
          </div>

          {/* Bucket 3: 31 - 60 Days */}
          <div className="relative flex flex-col justify-between rounded-sm border border-orange-200/80 bg-gradient-to-b from-orange-50/50 to-white p-3 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold capitalize text-orange-800">
                31 - 60 Days
              </span>
              <span className="rounded-xs bg-orange-100/90 px-1.5 py-0.5 text-[9px] font-black text-orange-800 border border-orange-200">
                {agingBuckets.p31_60.toFixed(0)}%
              </span>
            </div>
            <div className="my-2">
              <p className="text-base font-black text-orange-900 tracking-tight">
                ৳{agingBuckets.b31_60.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-orange-200/70">
              <span className="font-bold text-gray-600">{agingBuckets.count31_60} invoices</span>
              <span className="font-bold text-orange-700">Follow-up</span>
            </div>
          </div>

          {/* Bucket 4: 61 - 90 Days */}
          <div className="relative flex flex-col justify-between rounded-sm border border-rose-200/80 bg-gradient-to-b from-rose-50/50 to-white p-3 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold capitalize text-rose-800">
                61 - 90 Days
              </span>
              <span className="rounded-xs bg-rose-100/90 px-1.5 py-0.5 text-[9px] font-black text-rose-800 border border-rose-200">
                {agingBuckets.p61_90.toFixed(0)}%
              </span>
            </div>
            <div className="my-2">
              <p className="text-base font-black text-rose-900 tracking-tight">
                ৳{agingBuckets.b61_90.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-rose-200/70">
              <span className="font-bold text-gray-600">{agingBuckets.count61_90} invoices</span>
              <span className="font-bold text-rose-700">High Risk</span>
            </div>
          </div>

          {/* Bucket 5: 90+ Days Critical */}
          <div className="relative flex flex-col justify-between rounded-sm border border-red-300 bg-gradient-to-b from-red-100/60 to-white p-3 shadow-2xs hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black capitalize text-red-800">
                90+ Days Critical
              </span>
              <span className="rounded-xs bg-red-200 px-1.5 py-0.5 text-[9px] font-black text-red-900 border border-red-300">
                {agingBuckets.p90_plus.toFixed(0)}%
              </span>
            </div>
            <div className="my-2">
              <p className="text-base font-black text-red-950 tracking-tight">
                ৳{agingBuckets.b90_plus.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-red-200">
              <span className="font-bold text-gray-600">{agingBuckets.count90_plus} invoices</span>
              <span className="font-black text-red-700">Immediate Action</span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Operations Floating Bar (When rows are checked) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-gradient-to-r from-primary-800 via-primary-700 to-indigo-800 px-5 py-3 text-xs text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-white" />
            <span className="font-bold">{selectedIds.length} invoices selected</span>
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

      {/* ========================================================= */}
      {/* UNIFIED INVOICES MASTER CARD (Tabs, Filters & Records)    */}
      {/* ========================================================= */}
      <div className="rounded-sm border border-brand-border bg-white shadow-2xs overflow-hidden">
        {/* Card Header: Tabs, Search, Actions & Dropdowns */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 space-y-3.5 bg-gradient-to-b from-white to-brand-50/20">
          {/* Quick Status Tabs (Left) & Search + View / Export Buttons (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab sits on left, takes only needed width */}
            <div className="overflow-x-auto min-w-0 shrink">
              <CustomTabs
                tabs={[
                  { id: "ALL", label: "All Records" },
                  { id: "UNPAID", label: "Due / Unpaid" },
                  { id: "OVERDUE", label: "Overdue Alerts" },
                  { id: "PAID", label: "Paid in Full" },
                  { id: "TAX", label: "Mushak 6.3 Tax" },
                  { id: "NOTES", label: "Credit Notes" },
                  { id: "VOID", label: "Voided" },
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

            {/* Action Controls & Search aligned strictly on the right */}
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto shrink-0">
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
                placeholder="Search invoice #, customer, phone, BIN..."
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

          {/* 4-Column Equal Full-Width Filters Row: 3 Selects and 1 Date Range Picker (Same Width Each) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-0.5 w-full">
            {/* 1. Module / Section Select */}
            <CustomDropdownSelect
              options={sectionFilterOptions}
              value={subSection}
              onChange={(val) => {
                setSubSection(val as any);
                setActiveTab("ALL");
                setPage(1);
              }}
              containerClassName="w-full"
              className="h-[38px] text-xs font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
              placeholder="All Invoice Sections"
            />

            {/* 2. Invoice Type Select */}
            <CustomDropdownSelect
              options={typeFilterOptions}
              value={filterType}
              onChange={(val) => {
                setFilterType(val);
                setPage(1);
              }}
              containerClassName="w-full"
              className="h-[38px] text-xs font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
              placeholder="All Invoice Types"
            />

            {/* 3. Outlet / Branch Select */}
            <CustomDropdownSelect
              options={branchFilterOptions}
              value={filterBranch}
              onChange={(val) => {
                setFilterBranch(val);
                setPage(1);
              }}
              containerClassName="w-full"
              className="h-[38px] text-xs font-semibold text-gray-600 bg-white border-brand-border shadow-2xs"
              placeholder="All Outlets / Branches"
            />

            {/* 4. Date Range Filter with CustomDatePicker (Equal 1-Col Width) */}
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

        {/* Invoices List Content (Inside the same card) */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center bg-white">
            <RefreshCw size={28} className="animate-spin text-brand-primary" />
            <p className="mt-3 text-xs font-semibold text-gray-500">Loading invoice engine data...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center p-8 text-center bg-white">
            <div className="rounded-sm bg-brand-50 p-4 text-brand-primary">
              <FileText size={36} />
            </div>
            <h3 className="mt-3 text-sm font-bold text-gray-600">No invoices found</h3>
            <p className="mt-1 max-w-sm text-xs text-gray-500">
              No invoice records matched your criteria. Create a new invoice or adjust your search filters.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 flex items-center gap-1.5 rounded-sm bg-brand-gradient px-4 py-2 text-xs font-bold text-white shadow-2xs hover:opacity-90 cursor-pointer"
            >
              <Plus size={15} />
              Create First Invoice
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View: seamlessly integrated into this card, no double borders */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border/60 bg-brand-50/40 text-xs font-bold capitalize text-gray-600">
                    <th className="py-3.5 pl-4 pr-2 w-8">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                        {selectedIds.length === invoices.length && invoices.length > 0 ? (
                          <CheckSquare size={16} className="text-brand-primary" />
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
                      <tr key={inv.id} className={`group transition ${isSelected ? "bg-brand-50/30" : "hover:bg-slate-50/70"}`}>
                        {/* Checkbox */}
                        <td className="py-3.5 pl-4 pr-2">
                          <button onClick={() => toggleSelectRow(inv.id)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                            {isSelected ? <CheckSquare size={16} className="text-brand-primary" /> : <Square size={16} />}
                          </button>
                        </td>

                        {/* Invoice Details */}
                        <td className="py-3.5 pl-2 pr-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => copyToClipboard(inv.invoiceNo, inv.id)}
                                className="cursor-pointer font-mono font-bold text-gray-600 transition hover:text-brand-primary"
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
                              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${typeCfg.badge}`}>
                                {typeCfg.label}
                              </span>
                              {inv.branchName && (
                                <span className="text-[10px] text-gray-500 font-medium truncate max-w-[120px]">
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
                              <span className="font-bold text-gray-600">{inv.customer.name}</span>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                                {inv.customer.phone && <span>{inv.customer.phone}</span>}
                                {inv.customer.binVatNo && (
                                  <span className="font-mono text-[10px] text-brand-primary font-semibold">BIN: {inv.customer.binVatNo}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="font-medium italic text-gray-500">Walk-in Customer</span>
                          )}
                        </td>

                        {/* Issue & Due Date */}
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-gray-600">
                              {new Date(inv.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {inv.dueDate && (
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-[11px] ${
                                    overdue ? "font-bold text-rose-600" : "text-gray-500 font-medium"
                                  }`}
                                >
                                  Due: {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                                {overdue && (
                                  <span className="rounded-xs bg-rose-100 px-1 py-0.2 text-[9px] font-black text-rose-700 capitalize">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-3 py-3.5 text-right font-black text-gray-600 tabular-nums">
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
                                  percentPaid >= 100 ? "bg-emerald-500" : percentPaid > 0 ? "bg-brand-500" : "bg-transparent"
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
                              dueAmt > 0 ? (overdue ? "text-rose-600 font-black" : "text-gray-600") : "text-gray-500"
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
                              className="rounded-sm p-1.5 text-gray-500 transition hover:bg-brand-50 hover:text-brand-primary cursor-pointer active:scale-95"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Details Drawer */}
                            <button
                              onClick={() => openInvoiceDrawer(inv.id)}
                              title="Invoice Breakdown & Ledger"
                              className="rounded-sm p-1.5 text-gray-500 transition hover:bg-slate-100 hover:text-gray-600 cursor-pointer active:scale-95"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Collect Payment (if due) */}
                            {inv.status !== "PAID" && inv.status !== "VOID" && dueAmt > 0 && (
                              <button
                                onClick={() => openCollectPaymentModal(inv)}
                                title="Collect Due Payment"
                                className="rounded-sm p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer active:scale-95"
                              >
                                <CreditCard size={15} />
                              </button>
                            )}

                            {/* Send Reminder */}
                            {dueAmt > 0 && inv.status !== "VOID" && (
                              <button
                                onClick={() => openReminderModal(inv)}
                                title="Send Payment Reminder (SMS / WhatsApp)"
                                className="rounded-sm p-1.5 text-brand-primary transition hover:bg-brand-50 hover:text-brand-dark cursor-pointer active:scale-95"
                              >
                                <MessageSquare size={15} />
                              </button>
                            )}

                            {/* Void Button */}
                            {inv.status !== "VOID" && (
                              <button
                                onClick={() => handleVoidInvoice(inv.id, inv.invoiceNo)}
                                title="Void Invoice"
                                className="rounded-sm p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer active:scale-95"
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 sm:px-6 py-3.5 text-xs text-gray-500 bg-white">
              <span>
                Showing {invoices.length} of {totalRecords} invoices (Page {page} of {totalPages})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-sm border border-slate-200 px-2.5 py-1 font-semibold text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-sm border border-slate-200 px-2.5 py-1 font-semibold text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Grid Card View */
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {invoices.map((inv) => {
                const dueAmt = Math.max(0, Number(inv.total) - Number(inv.paidTotal));
                const overdue = isOverdue(inv);
                const percentPaid = inv.total > 0 ? Math.min(100, Math.round((Number(inv.paidTotal) / Number(inv.total)) * 100)) : 0;
                const typeCfg = TYPE_CONFIG[inv.invoiceType] || TYPE_CONFIG.STANDARD;
                const statusCfg = overdue ? STATUS_CONFIG.OVERDUE : (STATUS_CONFIG[inv.status] || STATUS_CONFIG.ISSUED);

                return (
                  <div
                    key={inv.id}
                    className="group flex flex-col justify-between rounded-sm border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs transition hover:border-brand-border hover:shadow-xs"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-gray-600">
                            {inv.invoiceNo}
                          </div>
                          <span className={`mt-1 inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold ${typeCfg.badge}`}>
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
                      <div className="mt-4 rounded-sm bg-slate-50 p-3 border border-slate-100">
                        <p className="text-xs font-bold capitalize text-gray-600">Customer</p>
                        <p className="text-xs font-bold text-gray-600">{inv.customer?.name || "Walk-in Customer"}</p>
                        {inv.customer?.phone && <p className="text-[11px] text-gray-500">{inv.customer.phone}</p>}
                      </div>

                      {/* Financials & Dates */}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] font-medium text-gray-600">Total Invoiced</span>
                          <p className="font-black text-gray-600">৳{Number(inv.total).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-gray-600">Due Balance</span>
                          <p className={`font-black ${dueAmt > 0 ? "text-rose-600" : "text-gray-500"}`}>
                            ৳{dueAmt.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-semibold text-gray-500">
                          <span>Paid: ৳{Number(inv.paidTotal).toLocaleString()}</span>
                          <span>{percentPaid}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentPaid >= 100 ? "bg-emerald-500" : percentPaid > 0 ? "bg-brand-500" : "bg-transparent"
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-[11px] font-medium text-gray-500">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => launchPrintModal(inv)}
                          className="flex items-center gap-1 rounded-sm border border-slate-200 px-2.5 py-1.5 font-bold text-gray-600 hover:bg-slate-50 cursor-pointer"
                        >
                          <Printer size={13} />
                          Print
                        </button>
                        <button
                          onClick={() => openInvoiceDrawer(inv.id)}
                          className="flex items-center gap-1 rounded-sm bg-brand-gradient px-2.5 py-1.5 font-bold text-white shadow-2xs hover:opacity-90 cursor-pointer"
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
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-brand-border/60 bg-white px-4 sm:px-6 py-3 text-xs text-gray-500 shadow-2xs">
              <span>
                Page {page} of {totalPages} ({totalRecords} total invoices)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-sm border border-brand-border/60 px-3 py-1 font-semibold text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-sm border border-brand-border/60 px-3 py-1 font-semibold text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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
          <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-sm bg-white shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in-95">
            {/* Sticky Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-brand-border px-4 py-3.5 sm:px-6 sm:py-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-sm bg-brand-gradient text-white shadow-xs">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-brand-dark">Create & Issue Invoice</h2>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-sm p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition cursor-pointer"
                title="Close"
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
                  <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">Outlet / Branch *</label>
                  <CustomDropdownSelect
                    options={modalBranchOptions}
                    value={form.branchId}
                    onChange={(val) => setForm((p) => ({ ...p, branchId: val }))}
                    placeholder="Select Branch"
                    className="w-full text-xs font-semibold text-gray-600"
                  />
                </div>

                {/* Invoice Type */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">Invoice Type *</label>
                  <CustomDropdownSelect
                    options={modalInvoiceTypeOptions}
                    value={form.invoiceType}
                    onChange={(val) => setForm((p) => ({ ...p, invoiceType: val }))}
                    placeholder="Select Invoice Type"
                    className="w-full text-xs font-semibold text-gray-600"
                  />
                </div>

                {/* Issue Date with CustomDatePicker */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">Issue Date *</label>
                  <CustomDatePicker
                    value={form.issueDate}
                    onChange={(val) => setForm((p) => ({ ...p, issueDate: val }))}
                    className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 border-brand-border"
                  />
                </div>

                {/* Due Date with CustomDatePicker */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600 capitalize">Due Date (Optional)</label>
                  <CustomDatePicker
                    value={form.dueDate}
                    onChange={(val) => setForm((p) => ({ ...p, dueDate: val }))}
                    clearable={true}
                    min={form.issueDate || undefined}
                    placeholder="Select Due Date"
                    className="h-[38px] text-xs sm:text-[13px] font-semibold text-gray-600 border-brand-border"
                  />
                </div>
              </div>

              {/* Customer Row */}
              <div className="rounded-sm border border-brand-border bg-brand-50/30 p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <label className="text-xs font-bold text-gray-600 capitalize">Customer & Tax Identity</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCust(!showQuickAddCust)}
                    className="flex items-center gap-1 text-xs font-bold text-brand-dark hover:text-brand-primary transition"
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
                      className="rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-medium text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={quickCustPhone}
                      onChange={(e) => setQuickCustPhone(e.target.value)}
                      className="rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-medium text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                    />
                    <input
                      type="text"
                      placeholder="BIN / VAT No (Optional)"
                      value={quickCustBin}
                      onChange={(e) => setQuickCustBin(e.target.value)}
                      className="rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-medium text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none font-mono"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Address"
                        value={quickCustAddress}
                        onChange={(e) => setQuickCustAddress(e.target.value)}
                        className="flex-1 rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-medium text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                      />
                      <CustomButton
                        type="button"
                        variant="primary"
                        themeColor="primary"
                        size="sm"
                        disabled={quickCustSaving}
                        loading={quickCustSaving}
                        onClick={handleCreateQuickCustomer}
                      >
                        Save
                      </CustomButton>
                    </div>
                  </div>
                ) : (
                  <CustomDropdownSelect
                    options={modalCustomerOptions}
                    value={form.customerId}
                    onChange={(val) => setForm((p) => ({ ...p, customerId: val }))}
                    placeholder="Walk-in Customer (General Public)"
                    className="w-full text-xs font-semibold text-gray-600"
                  />
                )}
              </div>

              {/* Line Items Builder (Fully Device-Friendly) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600 capitalize">Itemized Line Items</span>
                  <span className="text-xs font-bold text-brand-dark">{form.items.length} lines</span>
                </div>

                {/* Desktop View Table (md and up) */}
                <div className="hidden md:block overflow-x-auto rounded-sm border border-brand-border">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-50/70 text-xs font-bold text-brand-dark capitalize">
                        <th className="py-2.5 pl-4 pr-2 w-64">Product Autocomplete</th>
                        <th className="px-2 py-2.5">Description *</th>
                        <th className="px-2 py-2.5 w-20 text-center">Qty</th>
                        <th className="px-2 py-2.5 w-28 text-right">Price (৳)</th>
                        <th className="px-2 py-2.5 w-24 text-right">Disc (৳)</th>
                        <th className="px-2 py-2.5 w-24 text-right">VAT (৳)</th>
                        <th className="px-2 py-2.5 w-28 text-right">Line Total (৳)</th>
                        <th className="py-2.5 pl-2 pr-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-100/70">
                      {form.items.map((item, idx) => (
                        <tr key={idx} className="bg-white hover:bg-brand-50/50/30 transition-colors">
                          {/* Product Autocomplete with CustomDropdownSelect */}
                          <td className="py-2 pl-4 pr-2 w-64">
                            <CustomDropdownSelect
                              options={modalProductOptions}
                              value={item.productId}
                              onChange={(val) => handleProductSelect(idx, val)}
                              placeholder="-- Custom item --"
                              className="w-full text-xs font-semibold text-gray-600"
                            />
                          </td>

                          {/* Description */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              placeholder="Item description *"
                              value={item.description}
                              onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                              className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-xs font-medium text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                            />
                          </td>

                          {/* Qty */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => updateLineItem(idx, "qty", e.target.value)}
                              className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-center text-xs font-bold text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                            />
                          </td>

                          {/* Price */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                              className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-right text-xs font-bold text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                            />
                          </td>

                          {/* Discount */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.discountAmount}
                              onChange={(e) => updateLineItem(idx, "discountAmount", e.target.value)}
                              className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-right text-xs font-semibold text-rose-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                            />
                          </td>

                          {/* Tax */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.taxAmount}
                              onChange={(e) => updateLineItem(idx, "taxAmount", e.target.value)}
                              className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-right text-xs text-brand-dark font-semibold focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                            />
                          </td>

                          {/* Total */}
                          <td className="px-2 py-2 text-right font-bold text-gray-600 tabular-nums">
                            ৳{Number(item.lineTotal || 0).toLocaleString()}
                          </td>

                          {/* Delete Line */}
                          <td className="py-2 pl-2 pr-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              disabled={form.items.length <= 1}
                              className="rounded-sm p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition"
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
                    <div key={idx} className="rounded-sm border border-brand-border bg-white p-3.5 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="rounded-sm bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-dark">
                          Item #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          disabled={form.items.length <= 1}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Product select & Description */}
                      <div className="space-y-2">
                        <CustomDropdownSelect
                          options={modalProductOptions}
                          value={item.productId}
                          onChange={(val) => handleProductSelect(idx, val)}
                          placeholder="-- Choose from inventory --"
                          className="w-full text-xs font-semibold text-gray-600"
                        />
                        <input
                          type="text"
                          placeholder="Item Description *"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                          className="w-full rounded-sm border border-brand-border bg-white p-2 text-xs font-medium text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                        />
                      </div>

                      {/* 2x2 Numeric Inputs */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateLineItem(idx, "qty", e.target.value)}
                            className="w-full rounded-sm border border-brand-border bg-white p-2 text-center text-xs font-bold text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 block mb-0.5">Unit Price (৳)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                            className="w-full rounded-sm border border-brand-border bg-white p-2 text-right text-xs font-bold text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-rose-600 block mb-0.5">Discount (৳)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.discountAmount}
                            onChange={(e) => updateLineItem(idx, "discountAmount", e.target.value)}
                            className="w-full rounded-sm border border-brand-border bg-white p-2 text-right text-xs font-semibold text-rose-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-brand-dark block mb-0.5">Tax/VAT (৳)</label>
                          <input
                            type="number"
                            min={0}
                            value={item.taxAmount}
                            onChange={(e) => updateLineItem(idx, "taxAmount", e.target.value)}
                            className="w-full rounded-sm border border-brand-border bg-white p-2 text-right text-xs font-semibold text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                          />
                        </div>
                      </div>

                      {/* Card Total */}
                      <div className="flex items-center justify-between rounded-sm bg-brand-50/50 p-2 text-xs border border-brand-border">
                        <span className="font-semibold text-gray-600">Line Subtotal:</span>
                        <span className="font-bold text-gray-600">৳{Number(item.lineTotal || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  leftIcon={Plus}
                  className="mt-3 text-brand-dark border-brand-border hover:bg-brand-50/50"
                >
                  Add another item line
                </CustomButton>
              </div>

              {/* Summary and Payment row */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Notes & Immediate Payment */}
                <div className="space-y-3 rounded-sm border border-brand-border bg-brand-50/30 p-3.5 sm:p-4">
                  <h4 className="text-xs font-bold text-gray-600">Payment Terms & Initial Settlement</h4>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-gray-600">
                      Immediate Deposit / Initial Payment (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formGrandTotal}
                      value={form.initialPayment}
                      onChange={(e) => setForm((p) => ({ ...p, initialPayment: Number(e.target.value) }))}
                      placeholder="0.00 (Leave 0 for full credit)"
                      className="w-full rounded-sm border border-brand-border bg-white p-2 text-xs font-bold text-emerald-700 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {form.initialPayment > 0 && (
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-gray-600">Payment Channel</label>
                      <CustomDropdownSelect
                        options={modalPaymentMethodOptions}
                        value={form.paymentMethod}
                        onChange={(val) => setForm((p) => ({ ...p, paymentMethod: val }))}
                        className="w-full text-xs font-semibold text-gray-600"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-gray-600">Payment Terms</label>
                    <CustomDropdownSelect
                      options={modalPaymentTermsOptions}
                      value={form.paymentTerms}
                      onChange={(val) => setForm((p) => ({ ...p, paymentTerms: val }))}
                      className="w-full text-xs font-semibold text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-gray-600">Note / Instructions</label>
                    <textarea
                      rows={2}
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="Delivery remarks, transport challan details, bank account info..."
                      className="w-full rounded-sm border border-brand-border bg-white p-2 text-xs text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                    />
                  </div>
                </div>

                {/* Themed Calculated Invoice Breakdown */}
                <div className="flex flex-col justify-between rounded-sm border border-brand-border bg-gradient-to-br from-brand-50/60 via-white to-brand-50/40 p-4 sm:p-5 shadow-2xs">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold capitalize text-brand-dark">Financial Calculation</h4>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-bold tabular-nums text-gray-600">৳{formSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-rose-600 font-semibold">
                      <span>Total Discounts</span>
                      <span className="font-bold tabular-nums">- ৳{formDiscountTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-brand-dark font-semibold">
                      <span>Total Tax / Mushak VAT</span>
                      <span className="font-bold tabular-nums">+ ৳{formTaxTotal.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-brand-border pt-2.5 flex justify-between text-base font-bold text-gray-600">
                      <span>Grand Total</span>
                      <span className="tabular-nums text-brand-dark font-black text-lg">৳{formGrandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-sm bg-white border border-brand-border p-3 text-xs flex justify-between items-center shadow-2xs">
                    <span className="text-gray-600 font-bold">Due Balance After Deposit:</span>
                    <span className="font-black text-rose-600 tabular-nums text-sm sm:text-base">
                      ৳{Math.max(0, formGrandTotal - form.initialPayment).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="shrink-0 flex flex-wrap items-center justify-between sm:justify-end gap-2 border-t border-brand-border px-4 py-3 sm:px-6 sm:py-4 bg-brand-50/40">
              <CustomButton
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="button"
                variant="primary"
                themeColor="primary"
                size="sm"
                onClick={handleCreateInvoice}
                leftIcon={CheckCircle2}
              >
                Confirm & Issue Invoice
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SINGLE INVOICE PAYMENT COLLECTION MODAL                */}
      {/* ========================================================= */}
      {showCollectModal && selectedInvoiceForCollect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-sm bg-white shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in-95">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-brand-border px-5 py-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-xs">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-dark">Record Payment</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedInvoiceForCollect.invoiceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectModal(false)}
                className="rounded-sm p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Invoice snapshot */}
              <div className="rounded-sm bg-brand-50/40 p-3.5 space-y-2 border border-brand-border">
                <div className="flex justify-between text-gray-600">
                  <span className="font-semibold">Customer:</span>
                  <span className="font-bold text-gray-600">{selectedInvoiceForCollect.customer?.name || "Walk-in"}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-gray-600">৳{Number(selectedInvoiceForCollect.total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="font-semibold">Already Paid:</span>
                  <span className="font-bold text-emerald-700">৳{Number(selectedInvoiceForCollect.paidTotal).toLocaleString()}</span>
                </div>
                <div className="border-t border-brand-border pt-2 flex justify-between font-bold text-gray-600">
                  <span className="font-bold text-gray-600">Current Due:</span>
                  <span className="text-rose-600 font-black text-sm">
                    ৳{Math.max(0, Number(selectedInvoiceForCollect.total) - Number(selectedInvoiceForCollect.paidTotal)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment inputs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-600">Payment Amount (৳) *</label>
                  <button
                    type="button"
                    onClick={() =>
                      setCollectAmount(Math.max(0, Number(selectedInvoiceForCollect.total) - Number(selectedInvoiceForCollect.paidTotal)))
                    }
                    className="text-[11px] font-bold text-brand-dark hover:underline"
                  >
                    Pay Full Due
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-bold text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-gray-600">Payment Channel *</label>
                <CustomDropdownSelect
                  options={modalCollectMethodOptions}
                  value={collectMethod}
                  onChange={(val) => setCollectMethod(val)}
                  placeholder="Select Payment Channel"
                  className="w-full text-xs font-semibold text-gray-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-gray-600">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="Slip # / Trx ID / Check ref"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-xs text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-brand-border px-5 py-3.5 bg-brand-50/40">
              <CustomButton
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowCollectModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="button"
                variant="primary"
                themeColor="emerald"
                size="sm"
                disabled={collectSubmitting}
                loading={collectSubmitting}
                onClick={handleCollectPayment}
                leftIcon={CheckCircle2}
              >
                Record Payment
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MULTI-INVOICE PAYMENT ALLOCATION MODAL                 */}
      {/* ========================================================= */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-sm bg-white shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in-95">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-brand-border px-5 py-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-brand-gradient text-white shadow-xs">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-dark">Bulk Allocate Payment</h3>
                  <p className="text-xs text-gray-500">Apply single consolidated settlement across customer invoices</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="rounded-sm p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* Customer and Amount */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-bold text-gray-600">Select Customer *</label>
                  <CustomDropdownSelect
                    options={allocCustomerOptions}
                    value={allocCustId}
                    onChange={(val) => handleCustomerSelectForAlloc(val)}
                    placeholder="-- Choose Customer --"
                    className="w-full text-xs font-semibold text-gray-600"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-bold text-gray-600">Total Settlement Amount (৳) *</label>
                  <input
                    type="number"
                    min={1}
                    value={allocAmount || ""}
                    onChange={(e) => setAllocAmount(Number(e.target.value))}
                    placeholder="e.g. 5000"
                    className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-bold text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-bold text-gray-600">Payment Channel</label>
                  <CustomDropdownSelect
                    options={allocMethodOptions}
                    value={allocMethod}
                    onChange={(val) => setAllocMethod(val)}
                    className="w-full text-xs font-semibold text-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-bold text-gray-600">Reference / Notes</label>
                  <input
                    type="text"
                    value={allocRef}
                    onChange={(e) => setAllocRef(e.target.value)}
                    placeholder="Transaction ID or Cheque #"
                    className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-xs text-gray-600 focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
                  />
                </div>
              </div>

              {/* Invoices to allocate table */}
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold capitalize text-gray-600">Unsettled / Partially Paid Invoices</h4>
                  <CustomButton
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleAutoDistribute}
                    disabled={!allocAmount || allocRows.length === 0}
                  >
                    Auto-Allocate (Oldest First)
                  </CustomButton>
                </div>

                {allocRows.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-gray-300 p-8 text-center text-gray-400">
                    <p className="font-semibold">No unpaid invoices available</p>
                    <p className="text-[11px] mt-0.5">Select a customer with an active outstanding balance.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-sm border border-brand-border">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-brand-border/60 bg-brand-50/40 text-[11px] font-bold capitalize text-gray-600">
                          <th className="py-2.5 pl-3 pr-2">Invoice #</th>
                          <th className="px-2 py-2.5">Date</th>
                          <th className="px-2 py-2.5 text-right">Total</th>
                          <th className="px-2 py-2.5 text-right">Paid</th>
                          <th className="px-2 py-2.5 text-right">Balance</th>
                          <th className="py-2.5 pl-2 pr-3 text-right">Allocate (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allocRows.map((row, idx) => (
                          <tr key={row.invoiceId} className="hover:bg-slate-50">
                            <td className="py-2 pl-3 pr-2 font-mono font-bold text-gray-600">{row.invoiceNo}</td>
                            <td className="px-2 py-2 text-gray-500 font-medium">{row.date}</td>
                            <td className="px-2 py-2 text-right font-medium text-gray-600">৳{row.total.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right font-medium text-emerald-600">৳{row.paidTotal.toLocaleString()}</td>
                            <td className="px-2 py-2 text-right font-bold text-rose-600">৳{row.due.toLocaleString()}</td>
                            <td className="py-2 pl-2 pr-3 text-right">
                              <input
                                type="number"
                                min={0}
                                max={row.due}
                                value={row.allocated || ""}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const updated = [...allocRows];
                                  updated[idx].allocated = val;
                                  setAllocRows(updated);
                                }}
                                className="w-28 rounded-sm border border-brand-border p-1.5 text-right text-xs font-bold text-brand-dark focus:border-brand-primary focus:ring-1 focus:ring-brand-border outline-none"
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

            {/* Footer with High-Visibility Total Allocated Section */}
            {(() => {
              const totalAllocated = allocRows.reduce((s, r) => s + (Number(r.allocated) || 0), 0);
              const targetSettlement = Number(allocAmount || 0);
              const diff = targetSettlement - totalAllocated;
              const isBalanced = targetSettlement > 0 && diff === 0;
              const isExceeded = diff < 0;

              return (
                <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-brand-border px-5 py-3.5 bg-brand-50/40">
                  {/* High-visibility Allocation Summary Bar (Matches Button Height) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="h-[36px] flex items-center gap-2 rounded-sm border border-brand-border bg-white px-3 shadow-2xs">
                      <span className="text-xs font-bold capitalize text-gray-600">Total Allocated:</span>
                      <span className="text-xs font-black text-brand-dark">
                        ৳{totalAllocated.toLocaleString()}
                      </span>
                      <span className="text-gray-300 font-bold">/</span>
                      <span className="text-xs font-bold capitalize text-gray-600">Target:</span>
                      <span className="text-xs font-bold text-gray-600">
                        ৳{targetSettlement.toLocaleString()}
                      </span>
                    </div>

                    {targetSettlement > 0 && (
                      isBalanced ? (
                        <span className="h-[36px] inline-flex items-center gap-1.5 px-3 rounded-sm text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 size={14} className="text-emerald-600" /> Balanced (100%)
                        </span>
                      ) : isExceeded ? (
                        <span className="h-[36px] inline-flex items-center gap-1.5 px-3 rounded-sm text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                          <AlertCircle size={14} className="text-rose-600" /> Exceeded by ৳{Math.abs(diff).toLocaleString()}
                        </span>
                      ) : (
                        <span className="h-[36px] inline-flex items-center gap-1.5 px-3 rounded-sm text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                          <Clock size={14} className="text-amber-600" /> Remaining: ৳{diff.toLocaleString()}
                        </span>
                      )
                    )}
                  </div>

                  {/* Action buttons (Same Height) */}
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
                      themeColor="primary"
                      size="sm"
                      className="h-[36px]"
                      disabled={allocSubmitting || allocRows.length === 0}
                      loading={allocSubmitting}
                      onClick={handleSubmitAllocation}
                      leftIcon={CheckCircle2}
                    >
                      Settle Invoices
                    </CustomButton>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PAYMENT REMINDER (SMS / WHATSAPP) MODAL                */}
      {/* ========================================================= */}
      {showReminderModal && selectedInvoiceForReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-sm bg-white shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-brand-border px-5 py-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-brand-gradient text-white font-bold shadow-xs">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-dark">Payment Reminder</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedInvoiceForReminder.invoiceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="rounded-sm p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="rounded-sm bg-brand-50/40 p-3.5 border border-brand-border space-y-1">
                <p className="text-xs font-bold capitalize text-gray-600">Recipient</p>
                <p className="font-bold text-gray-600 text-sm">{selectedInvoiceForReminder.customer?.name || "Customer"}</p>
                <p className="font-mono text-gray-600 font-semibold">{selectedInvoiceForReminder.customer?.phone || "No phone provided"}</p>
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-gray-600">Reminder Message Preview</label>
                <div className="rounded-sm border border-brand-border bg-brand-50/30 p-3.5 font-mono text-[11px] text-gray-600 leading-relaxed">
                  Dear {selectedInvoiceForReminder.customer?.name || "Customer"}, your invoice{" "}
                  <strong className="text-brand-dark">{selectedInvoiceForReminder.invoiceNo}</strong> has an outstanding balance of ৳
                  <strong className="text-rose-600">
                    {Math.max(
                      0,
                      Number(selectedInvoiceForReminder.total) - Number(selectedInvoiceForReminder.paidTotal)
                    ).toLocaleString()}
                  </strong>
                  . Please settle at your earliest convenience. Thank you!
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
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
                    className="w-full"
                  >
                    <CustomButton
                      type="button"
                      variant="primary"
                      themeColor="emerald"
                      fullWidth
                      leftIcon={Send}
                    >
                      Send via WhatsApp
                    </CustomButton>
                  </a>
                )}

                <CustomButton
                  type="button"
                  variant="primary"
                  themeColor="primary"
                  fullWidth
                  onClick={() => {
                    showToast("SMS reminder sent to customer queue!");
                    setShowReminderModal(false);
                  }}
                  leftIcon={MessageSquare}
                >
                  Send Instant SMS
                </CustomButton>
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
                <span className="text-xs font-bold capitalize text-gray-600">Invoice Ledger View</span>
                <h3 className="font-mono text-lg font-black text-brand-dark">{selectedInvoiceForDrawer.invoiceNo}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => launchPrintModal(selectedInvoiceForDrawer)}
                  className="flex items-center gap-1 rounded-sm border border-brand-border px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-brand-50/50"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  onClick={() => setSelectedInvoiceForDrawer(null)}
                  className="rounded-sm p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Customer & Info Cards */}
              <div className="rounded-sm bg-slate-50 p-4 space-y-2 border border-brand-border">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-600 capitalize text-xs">Client / Buyer Info</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      TYPE_CONFIG[selectedInvoiceForDrawer.invoiceType]?.badge || ""
                    }`}
                  >
                    {selectedInvoiceForDrawer.invoiceType}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-600">
                  {selectedInvoiceForDrawer.customer?.name || "Walk-in Customer"}
                </p>
                {selectedInvoiceForDrawer.customer?.phone && (
                  <p className="flex items-center gap-1 text-gray-500 font-medium">
                    <Phone size={13} /> {selectedInvoiceForDrawer.customer.phone}
                  </p>
                )}
                {selectedInvoiceForDrawer.customer?.binVatNo && (
                  <p className="flex items-center gap-1 font-mono text-brand-dark font-semibold">
                    <ShieldCheck size={13} /> BIN/VAT: {selectedInvoiceForDrawer.customer.binVatNo}
                  </p>
                )}
                {selectedInvoiceForDrawer.customer?.address && (
                  <p className="text-gray-500">{selectedInvoiceForDrawer.customer.address}</p>
                )}
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-sm border border-brand-border bg-white p-3">
                  <span className="text-xs font-semibold text-gray-600">Issue Date</span>
                  <p className="font-bold text-gray-600">{new Date(selectedInvoiceForDrawer.issueDate).toLocaleDateString()}</p>
                </div>
                <div className="rounded-sm border border-brand-border bg-white p-3">
                  <span className="text-xs font-semibold text-gray-600">Due Date</span>
                  <p className="font-bold text-gray-600">
                    {selectedInvoiceForDrawer.dueDate
                      ? new Date(selectedInvoiceForDrawer.dueDate).toLocaleDateString()
                      : "Immediate"}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <span className="font-bold text-gray-600 capitalize text-xs">Itemized Lines</span>
                <div className="mt-2 overflow-hidden rounded-sm border border-brand-border">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-50/70 text-xs font-bold capitalize text-brand-dark">
                        <th className="py-2 pl-3">Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 pr-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedInvoiceForDrawer.items || []).map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="py-2 pl-3 font-medium text-gray-600">{item.description}</td>
                          <td className="py-2 text-center text-gray-600">{item.qty}</td>
                          <td className="py-2 text-right text-gray-600">৳{Number(item.unitPrice).toLocaleString()}</td>
                          <td className="py-2 pr-3 text-right font-bold text-gray-600">৳{Number(item.lineTotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Themed Financial Totals */}
              <div className="rounded-sm border border-brand-border bg-gradient-to-br from-primary-50/70 via-white to-brand-50/40 p-4 text-gray-600 space-y-2 shadow-2xs">
                <div className="flex justify-between text-gray-600">
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
                  <div className="flex justify-between text-brand-dark font-semibold">
                    <span>Tax / VAT (Mushak):</span>
                    <span>+ ৳{Number(selectedInvoiceForDrawer.taxTotal).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-brand-border pt-2 flex justify-between text-sm font-bold text-gray-600">
                  <span>Grand Total:</span>
                  <span className="text-brand-dark font-black">৳{Number(selectedInvoiceForDrawer.total).toLocaleString()}</span>
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
                  <span className="font-bold text-gray-600 capitalize text-xs">Payment Transaction History</span>
                  <div className="mt-2 space-y-2">
                    {selectedInvoiceForDrawer.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-sm border border-slate-200 bg-white p-2.5 shadow-2xs">
                        <div>
                          <p className="font-bold text-gray-600">{p.method}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{new Date(p.createdAt).toLocaleString()}</p>
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
                  className="flex items-center gap-1.5 rounded-sm bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  <CreditCard size={14} />
                  Collect Due
                </button>
              )}
              {selectedInvoiceForDrawer.status !== "VOID" && (
                <button
                  onClick={() => handleVoidInvoice(selectedInvoiceForDrawer.id, selectedInvoiceForDrawer.invoiceNo)}
                  className="rounded-sm border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
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
