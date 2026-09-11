"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  FileText,
  TrendingUp,
  Eye,
  Printer,
  Search,
  RefreshCw,
  Store,
  Scale,
  Truck,
  UtensilsCrossed,
  Pill,
  Scissors,
  Wrench,
  DollarSign,
  AlertTriangle,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  MessageSquare,
  Phone,
  Building2,
  CheckCircle2,
  CreditCard,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api";
import {
  UniversalInvoiceModal,
  type InvoiceData,
  type InvoiceVerticalType,
} from "@/components/invoices/UniversalInvoiceModal";
import { CollectDueModal } from "@/components/customers/CollectDueModal";

interface SaleSummary {
  id: string;
  invoiceNo: string;
  saleDate: string;
  createdAt?: string;
  total: number;
  subTotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  paidTotal: number;
  dueTotal: number;
  paymentStatus: string;
  status: string;
  paymentMethod?: string;
  vertical?: InvoiceVerticalType;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    currentDue?: number;
  } | null;
  items?: any[];
  tableNo?: string;
  serverName?: string;
  doctorName?: string;
  deviceModel?: string;
  challanNo?: string;
  notes?: string;
}

const VERTICAL_TABS = [
  { key: "ALL", label: "All Channels", icon: Layers },
  { key: "WITH_DUE", label: "With Due", icon: AlertTriangle, isDue: true },
  { key: "retail", label: "Retail POS", icon: Store },
  { key: "grocery", label: "Grocery", icon: Scale },
  { key: "wholesale", label: "Wholesale & B2B", icon: Truck },
  { key: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { key: "pharmacy", label: "Pharmacy", icon: Pill },
  { key: "salon", label: "Salon & Spa", icon: Scissors },
  { key: "repair", label: "Repair & Service", icon: Wrench },
];

export default function SalesPage() {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);
  const [selectedCustomerForDue, setSelectedCustomerForDue] = useState<any | null>(null);
  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: perPage,
        sortBy,
        sortDir,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (selectedVertical === "WITH_DUE") params.hasDue = "true";

      const res: any = await api.get("/pos/sales", { params });

      const items: SaleSummary[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];

      const total = typeof res?.pagination?.total === "number"
        ? res.pagination.total
        : typeof res?.data?.total === "number"
        ? res.data.total
        : items.length;

      const pages = typeof res?.pagination?.totalPages === "number"
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(total / perPage));

      setSales(items);
      setTotalItems(total);
      setTotalPages(pages);
    } catch (e) {
      console.error("Failed to load sales:", e);
      setSales([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchQuery, paymentStatusFilter, selectedVertical, sortBy, sortDir]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Helper to infer or return vertical
  const getSaleVertical = (s: SaleSummary): InvoiceVerticalType => {
    if (s.vertical) return s.vertical;
    if (s.tableNo || s.serverName) return "restaurant";
    if (s.doctorName) return "pharmacy";
    if (s.deviceModel) return "repair";
    if (s.challanNo) return "wholesale";
    if (s.invoiceNo?.startsWith("GRO") || s.invoiceNo?.startsWith("SUP")) return "grocery";
    if (s.invoiceNo?.startsWith("WS") || s.invoiceNo?.startsWith("B2B")) return "wholesale";
    if (s.invoiceNo?.startsWith("RES") || s.invoiceNo?.startsWith("KOT")) return "restaurant";
    if (s.invoiceNo?.startsWith("RX") || s.invoiceNo?.startsWith("PHAR")) return "pharmacy";
    if (s.invoiceNo?.startsWith("SAL")) return "salon";
    if (s.invoiceNo?.startsWith("REP") || s.invoiceNo?.startsWith("JOB")) return "repair";
    return "retail";
  };

  const getVerticalBadge = (vert: InvoiceVerticalType) => {
    switch (vert) {
      case "restaurant": return { label: "Restaurant", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "pharmacy": return { label: "Pharmacy", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "grocery": return { label: "Grocery", bg: "bg-lime-50 text-lime-700 border-lime-200" };
      case "wholesale": return { label: "Wholesale", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "salon": return { label: "Salon", bg: "bg-pink-50 text-pink-700 border-pink-200" };
      case "repair": return { label: "Repair", bg: "bg-sky-50 text-sky-700 border-sky-200" };
      default: return { label: "Retail POS", bg: "bg-primary-50 text-primary-700 border-primary-200" };
    }
  };

  // Filtered & Sorted Sales for display
  const paginatedSales = useMemo(() => {
    if (selectedVertical !== "ALL" && selectedVertical !== "WITH_DUE") {
      return sales.filter((s) => getSaleVertical(s) === selectedVertical);
    }
    return sales;
  }, [sales, selectedVertical]);

  const filteredSales = paginatedSales;

  // Overall KPI Metrics for current view
  const totalRevenue = sales.reduce((s, x) => s + Number(x.total || (x as any).grandTotal || 0), 0);
  const totalPaid = sales.reduce((s, x) => s + Number(x.paidTotal || 0), 0);
  const totalDue = sales.reduce((s, x) => s + Number(x.dueTotal || 0), 0);
  const totalWithDueCount = sales.filter((s) => Number(s.dueTotal || 0) > 0).length;

  // Open Invoice Preview
  function handleOpenInvoice(s: SaleSummary) {
    const vert = getSaleVertical(s);
    setActiveInvoice({
      id: s.id || s.invoiceNo,
      invoiceNo: s.invoiceNo,
      date: s.saleDate || s.createdAt || new Date().toISOString(),
      customer: {
        name: s.customer?.name || "Walk-in Customer",
        phone: s.customer?.phone || undefined,
        address: s.customer?.address || undefined,
      },
      items: s.items && s.items.length > 0 ? s.items.map((it) => ({
        name: it.name || it.productName || it.product?.name || "Item",
        qty: Number(it.quantity || it.qty || 1),
        unitPrice: Number(it.unitPrice || it.price || 0),
        total: Number((it.quantity || it.qty || 1) * (it.unitPrice || it.price || 0)),
        discount: Number(it.discount || 0),
      })) : [
        {
          name: "POS Items Summary",
          qty: 1,
          unitPrice: Number(s.total || 0),
          total: Number(s.total || 0),
        }
      ],
      subTotal: Number(s.subTotal || s.total || 0),
      discountTotal: Number(s.discountTotal || 0),
      taxTotal: Number(s.taxTotal || 0),
      grandTotal: Number(s.total || 0),
      paidTotal: Number(s.paidTotal || 0),
      dueTotal: Number(s.dueTotal || 0),
      paymentMethod: s.paymentMethod || "CASH",
      vertical: vert,
      notes: s.notes || undefined,
      tableNo: s.tableNo,
      serverName: s.serverName,
      doctorName: s.doctorName,
      deviceModel: s.deviceModel,
      challanNo: s.challanNo,
    });
  }

  function handleOpenCollectDue(s: SaleSummary) {
    if (s.customer) {
      setSelectedCustomerForDue({
        id: s.customer.id || s.id,
        name: s.customer.name || "Customer",
        currentDue: s.dueTotal || s.customer.currentDue || 0,
      });
      setIsCollectDueOpen(true);
    }
  }

  function exportCSV() {
    if (filteredSales.length === 0) {
      alert("No sales records to export");
      return;
    }

    const headers = [
      "Invoice No", "Date", "Channel", "Customer Name", "Customer Phone",
      "Total Amount (Tk)", "Paid Amount (Tk)", "Due Amount (Tk)", 
      "Payment Status", "Payment Method", "Order Status"
    ];

    const rows = filteredSales.map((s) => [
      `"${s.invoiceNo || ""}"`,
      `"${s.saleDate || s.createdAt || ""}"`,
      `"${getSaleVertical(s).toUpperCase()}"`,
      `"${(s.customer?.name || "Walk-in").replace(/"/g, '""')}"`,
      `"${s.customer?.phone || ""}"`,
      Number(s.total || 0).toFixed(2),
      Number(s.paidTotal || 0).toFixed(2),
      Number(s.dueTotal || 0).toFixed(2),
      s.paymentStatus || "PAID",
      s.paymentMethod || "CASH",
      s.status || "COMPLETED",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingCart size={22} className="text-primary-600" />
            Sales & Invoice Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Centralized sales transactions, omnichannel invoices, cash collection & receivables directory.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/sales/quotations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <FileText size={14} className="text-gray-500" />
            Quotations
          </Link>

          <Link
            href="/invoices/collection"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <CreditCard size={14} className="text-gray-500" />
            Due Collection
          </Link>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Download size={14} className="text-gray-500" />
            Export CSV
          </button>

          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition"
          >
            <Store size={14} />
            Open POS
          </Link>
        </div>
      </div>

      {/* ── KPI Analytics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Sales Revenue */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Sales Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ৳{Math.round(totalRevenue).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {sales.length} orders
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Across all POS terminals & B2B channels
          </p>
        </div>

        {/* Collected Revenue */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Collected Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              ৳{Math.round(totalPaid).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {totalRevenue > 0 ? `${Math.round((totalPaid / totalRevenue) * 100)}%` : "100%"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Real-time cash, card & digital payments
          </p>
        </div>

        {/* Outstanding Receivables (Dues) - Clickable Filter */}
        <div 
          onClick={() => {
            setSelectedVertical(selectedVertical === "WITH_DUE" ? "ALL" : "WITH_DUE");
            setPage(1);
          }}
          className={`rounded-xl border p-4 shadow-xs transition cursor-pointer ${
            selectedVertical === "WITH_DUE"
              ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20"
              : "border-gray-200 bg-white hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <AlertTriangle size={13} /> Outstanding Due
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">
              ৳{Math.round(totalDue).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600/80 font-medium">
            {totalWithDueCount} customer dues &bull; Click to filter
          </p>
        </div>

        {/* Average Order Value */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Avg Order Value (AOV)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ৳{sales.length > 0 ? Math.round(totalRevenue / sales.length).toLocaleString() : "0"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Per transaction basket average
          </p>
        </div>
      </div>

      {/* ── Channel Segment Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none">
        {VERTICAL_TABS.map((tab) => {
          const isActive = selectedVertical === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedVertical(tab.key);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-primary-600 text-white shadow-xs font-semibold"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={13} className={isActive ? "text-white" : "text-gray-400"} />
              <span>{tab.label}</span>
              {tab.isDue && totalWithDueCount > 0 && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
                }`}>
                  {totalWithDueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer, phone, payment..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-8 text-xs text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="">All Payment Status</option>
            <option value="PAID">Paid in Full</option>
            <option value="PARTIAL">Partial Payment</option>
            <option value="UNPAID">Unpaid / Due</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="date">Date & Time</option>
            <option value="total">Total Amount</option>
            <option value="due">Highest Due</option>
            <option value="invoiceNo">Invoice No</option>
          </select>

          <button
            onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 transition"
            title={`Sort Direction: ${sortDir.toUpperCase()}`}
          >
            <ArrowUpDown size={14} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded p-1 transition ${viewMode === "table" ? "bg-white text-primary-600 shadow-2xs font-bold" : "text-gray-400 hover:text-gray-700"}`}
              title="Table View"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1 transition ${viewMode === "grid" ? "bg-white text-primary-600 shadow-2xs font-bold" : "text-gray-400 hover:text-gray-700"}`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          <button
            onClick={loadSales}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
          </button>
        </div>
      </div>

      {/* ── Sales Transactions Data List ── */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <RefreshCw size={24} className="mx-auto animate-spin text-primary-600 mb-2" />
          <p className="text-xs font-semibold text-gray-700">Loading sales transactions...</p>
        </div>
      ) : paginatedSales.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
          <ShoppingCart size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-sm font-bold text-gray-900">No Sales Invoices Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchQuery || selectedVertical !== "ALL" || paymentStatusFilter
              ? "No transactions matched your search or filter criteria."
              : "Completed sales transactions and invoices will appear here."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(searchQuery || selectedVertical !== "ALL" || paymentStatusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedVertical("ALL");
                  setPaymentStatusFilter("");
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
            >
              <Store size={14} /> Open POS Checkout
            </Link>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* ── CLEAN ENTERPRISE TABLE VIEW ── */
        <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  <th className="px-4 py-3">Invoice & Channel</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Date & Time</th>
                  <th className="px-3 py-3 text-right">Total Amount</th>
                  <th className="px-3 py-3 text-right">Paid Amount</th>
                  <th className="px-3 py-3 text-right">Due Amount</th>
                  <th className="px-3 py-3 text-center">Payment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSales.map((s) => {
                  const vert = getSaleVertical(s);
                  const vertBadge = getVerticalBadge(vert);
                  const due = Number(s.dueTotal || 0);
                  const paid = Number(s.paidTotal || 0);
                  const total = Number(s.total || 0);
                  const isDue = due > 0;

                  return (
                    <tr key={s.id || s.invoiceNo} className="hover:bg-gray-50/70 transition-colors">
                      {/* Invoice No & Channel */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenInvoice(s)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-200/50 text-xs font-bold hover:bg-primary-100 transition"
                          >
                            <FileText size={14} />
                          </button>
                          <div>
                            <button
                              onClick={() => handleOpenInvoice(s)}
                              className="font-bold text-gray-900 hover:text-primary-600 text-left transition block"
                            >
                              {s.invoiceNo}
                            </button>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[9px] font-semibold mt-0.5 ${vertBadge.bg}`}>
                              {vertBadge.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-semibold text-gray-800">{s.customer?.name || "Walk-in Customer"}</p>
                          {s.customer?.phone ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                              <a href={`tel:${s.customer.phone}`} className="hover:text-primary-600 transition">
                                {s.customer.phone}
                              </a>
                              <a
                                href={`https://wa.me/${s.customer.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded hover:bg-emerald-100 transition"
                                title="WhatsApp"
                              >
                                WA
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-3 py-3 text-gray-600 text-[11px]">
                        <div>
                          <span className="font-medium text-gray-800">
                            {s.saleDate ? new Date(s.saleDate).toLocaleDateString() : s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Today"}
                          </span>
                          <p className="text-gray-400">
                            {s.saleDate ? new Date(s.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </p>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-gray-900 text-xs">
                          ৳{total.toLocaleString()}
                        </span>
                      </td>

                      {/* Paid Amount */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-semibold text-emerald-600 text-xs">
                          ৳{paid.toLocaleString()}
                        </span>
                        {s.paymentMethod && (
                          <span className="block text-[10px] text-gray-400 uppercase">
                            {s.paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Due Amount */}
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={`font-semibold ${isDue ? "text-rose-600 font-bold" : "text-gray-500"}`}>
                            ৳{due.toLocaleString()}
                          </span>
                          {isDue && s.customer && (
                            <button
                              onClick={() => handleOpenCollectDue(s)}
                              className="mt-0.5 text-[10px] font-semibold text-rose-700 hover:text-rose-800 underline"
                            >
                              Collect
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          s.paymentStatus === "PARTIAL" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            s.paymentStatus === "PAID" ? "bg-emerald-500" :
                            s.paymentStatus === "PARTIAL" ? "bg-amber-500" : "bg-rose-500"
                          }`} />
                          {s.paymentStatus || "PAID"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenInvoice(s)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                            title="Preview Invoice"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenInvoice(s)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition"
                            title="Print Invoice"
                          >
                            <Printer size={14} />
                          </button>

                          {s.customer?.phone && (
                            <a
                              href={`https://wa.me/${s.customer.phone.replace(/[^0-9]/g, "")}?text=Dear%20${encodeURIComponent(s.customer.name || "Customer")},%20your%20invoice%20${s.invoiceNo}%20total%20is%20Tk%20${s.total}.%20Thank%20you.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                              title="Share on WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── CLEAN CARD GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedSales.map((s) => {
            const vert = getSaleVertical(s);
            const vertBadge = getVerticalBadge(vert);
            const due = Number(s.dueTotal || 0);
            const paid = Number(s.paidTotal || 0);
            const total = Number(s.total || 0);
            const isDue = due > 0;

            return (
              <div
                key={s.id || s.invoiceNo}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        onClick={() => handleOpenInvoice(s)}
                        className="font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition text-xs"
                      >
                        {s.invoiceNo}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {s.saleDate ? new Date(s.saleDate).toLocaleDateString() : "Today"} &bull; {s.customer?.name || "Walk-in"}
                      </p>
                    </div>

                    <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[9px] font-semibold ${vertBadge.bg}`}>
                      {vertBadge.label}
                    </span>
                  </div>

                  {/* 3-Col Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-gray-100 text-center">
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Total</p>
                      <p className="text-xs font-bold text-gray-900">৳{total.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Paid</p>
                      <p className="text-xs font-bold text-emerald-600">৳{paid.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Due</p>
                      <p className={`text-xs font-bold ${isDue ? "text-rose-600" : "text-gray-600"}`}>
                        ৳{due.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    s.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700" :
                    s.paymentStatus === "PARTIAL" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {s.paymentStatus || "PAID"}
                  </span>

                  <div className="flex items-center gap-1">
                    {isDue && s.customer && (
                      <button
                        onClick={() => handleOpenCollectDue(s)}
                        className="rounded bg-rose-50 text-rose-700 px-2 py-0.5 text-[11px] font-semibold hover:bg-rose-100"
                      >
                        Collect Due
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenInvoice(s)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="View Invoice"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination Footer ── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-xs">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{(page - 1) * perPage + 1}</span> -{" "}
            <span className="font-semibold text-gray-800">
              {Math.min(page * perPage, totalItems)}
            </span>{" "}
            of <span className="font-semibold text-gray-800">{totalItems}</span> transactions
          </p>

          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={13} /> Prev
            </button>

            <span className="text-xs text-gray-600 font-medium px-1">
              Page {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Universal Invoice Print & Thermal Modal ── */}
      <UniversalInvoiceModal
        open={Boolean(activeInvoice)}
        onClose={() => setActiveInvoice(null)}
        invoice={activeInvoice || undefined}
      />

      {/* ── Due Collection Modal ── */}
      <CollectDueModal
        isOpen={isCollectDueOpen}
        onClose={() => setIsCollectDueOpen(false)}
        onSuccess={() => {
          loadSales();
        }}
        customer={selectedCustomerForDue}
      />

    </div>
  );
}
