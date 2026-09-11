"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, Send, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, 
  FileText, ArrowRight, Download, Search, AlertCircle, Eye, Printer, 
  Trash2, Edit3, MessageSquare, Calendar, Building2, User, DollarSign,
  TrendingUp, Clock, CheckCircle2, ShoppingCart, Layers, ArrowUpDown,
  LayoutList, LayoutGrid, X, FileSpreadsheet, ShieldCheck, Phone,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";

interface QuotationItem {
  id?: string;
  productId: string;
  name?: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

interface Quotation {
  id: string;
  quotationNo: string;
  version: number;
  status: string;
  total: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  validUntil?: string | null;
  note?: string | null;
  createdAt: string;
  customer?: { id: string; name: string; phone?: string; email?: string } | null;
  items: QuotationItem[];
  revisions?: { version: number; changeNote?: string; createdAt: string }[];
  salesOrders?: { id: string; orderNo: string; status: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: { label: "Draft", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  SENT: { label: "Sent to Client", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  CUSTOMER_REVIEW: { label: "Under Review", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  ACCEPTED: { label: "Accepted", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  REJECTED: { label: "Rejected", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  CONVERTED: { label: "Converted to Order", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  EXPIRED: { label: "Expired", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  CANCELLED: { label: "Cancelled", bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuoteForDrawer, setSelectedQuoteForDrawer] = useState<Quotation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Create quotation form state
  const [form, setForm] = useState({
    branchId: "default",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    validUntil: "",
    note: "",
    items: [
      { productId: "PROD-1", name: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }
    ],
  });

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: perPage,
        sortBy,
        sortDir,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeTab !== "ALL") params.status = activeTab;

      const r: any = await api.get("/v1/sales/quotations", { params });
      const list = Array.isArray(r?.data)
        ? r.data
        : Array.isArray(r?.data?.data)
        ? r.data.data
        : Array.isArray(r)
        ? r
        : [];

      const total = typeof r?.pagination?.total === "number"
        ? r.pagination.total
        : typeof r?.data?.total === "number"
        ? r.data.total
        : list.length;

      const pages = typeof r?.pagination?.totalPages === "number"
        ? r.pagination.totalPages
        : Math.max(1, Math.ceil(total / perPage));

      setQuotations(list);
      setTotalItems(total);
      setTotalPages(pages);
    } catch (e) {
      console.error("Failed to load quotations:", e);
      setQuotations([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchQuery, activeTab, sortBy, sortDir]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Handle Lifecycle Actions (Send, Accept, Reject, Convert)
  async function doAction(id: string, action: string, extra?: Record<string, any>) {
    setActionLoading(`${id}-${action}`);
    try {
      if (action === "send") {
        await api.post(`/v1/sales/quotations/${id}/send`);
      } else if (action === "accept") {
        await api.post(`/v1/sales/quotations/${id}/accept`);
      } else if (action === "reject") {
        const reason = prompt("Enter rejection reason (optional):") || "Customer requested changes";
        await api.post(`/v1/sales/quotations/${id}/reject`, { reason });
      } else if (action === "convert") {
        await api.post(`/v1/sales/quotations/${id}/convert`, { warehouseId: "default" });
      }
      await loadQuotations();
      if (selectedQuoteForDrawer && selectedQuoteForDrawer.id === id) {
        // Refresh drawer state if open
        const updated = (quotations || []).find((q) => q.id === id);
        if (updated) setSelectedQuoteForDrawer(updated);
      }
    } catch (e: any) {
      alert(e.response?.data?.error ?? e.message ?? "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  // Create new quotation
  async function createQuotation(e: React.FormEvent) {
    e.preventDefault();
    if (form.items.length === 0 || !form.items[0].name.trim()) {
      alert("Please enter at least one line item name and price");
      return;
    }

    try {
      const payload = {
        branchId: form.branchId || "default",
        customerName: form.customerName || null,
        customerPhone: form.customerPhone || null,
        validUntil: form.validUntil || null,
        note: form.note || null,
        items: form.items.map((i, idx) => ({
          productId: i.productId || `ITEM-${idx + 1}`,
          name: i.name || "Item",
          qty: Number(i.qty) || 1,
          unitPrice: Number(i.unitPrice) || 0,
          discountAmount: Number(i.discountAmount) || 0,
          taxAmount: Number(i.taxAmount) || 0,
          lineTotal: (Number(i.qty) || 1) * (Number(i.unitPrice) || 0) - (Number(i.discountAmount) || 0) + (Number(i.taxAmount) || 0),
        })),
      };

      await api.post("/v1/sales/quotations", payload);
      setShowCreateModal(false);
      setForm({
        branchId: "default",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        validUntil: "",
        note: "",
        items: [{ productId: "PROD-1", name: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }],
      });
      await loadQuotations();
    } catch (e: any) {
      alert(e.response?.data?.error ?? e.message ?? "Failed to create quotation");
    }
  }

  function addItem() {
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: `PROD-${f.items.length + 1}`, name: "", qty: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }],
    }));
  }

  function removeItem(idx: number) {
    if (form.items.length <= 1) return;
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  function updateItem(idx: number, field: string, value: any) {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  }

  // Calculate Subtotals for Form
  const formSubtotal = form.items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  const formDiscount = form.items.reduce((acc, it) => acc + (Number(it.discountAmount) || 0), 0);
  const formTax = form.items.reduce((acc, it) => acc + (Number(it.taxAmount) || 0), 0);
  const formGrandTotal = Math.max(0, formSubtotal - formDiscount + formTax);

  // Overall KPI Analytics
  const totalCount = quotations.length;
  const acceptedOrConverted = quotations.filter((q) => q.status === "ACCEPTED" || q.status === "CONVERTED");
  const acceptedVolume = acceptedOrConverted.reduce((acc, q) => acc + Number(q.total || 0), 0);
  const pendingReviewCount = quotations.filter((q) => q.status === "SENT" || q.status === "CUSTOMER_REVIEW" || q.status === "DRAFT").length;
  const conversionRate = totalCount > 0 ? Math.round((acceptedOrConverted.length / totalCount) * 100) : 0;

  // Filtered & Sorted Quotations
  // Server-side filtered and paginated quotations
  const paginatedQuotations = quotations;
  const filteredQuotations = quotations;

  function exportCSV() {
    if (filteredQuotations.length === 0) {
      alert("No quotation records to export");
      return;
    }

    const headers = ["Quote No", "Version", "Customer Name", "Customer Phone", "Valid Until", "Subtotal (Tk)", "Grand Total (Tk)", "Status", "Date"];
    const rows = filteredQuotations.map((q) => [
      `"${q.quotationNo || ""}"`,
      `"v${q.version || 1}"`,
      `"${(q.customer?.name || "Customer").replace(/"/g, '""')}"`,
      `"${q.customer?.phone || ""}"`,
      `"${q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "No Expiry"}"`,
      Number(q.subtotal || q.total || 0).toFixed(2),
      Number(q.total || 0).toFixed(2),
      q.status || "DRAFT",
      `"${new Date(q.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quotations_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <FileSpreadsheet size={22} className="text-primary-600" />
            Quotations & Estimates
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage B2B proforma invoices, price estimates, client approvals & convert to sales orders in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Download size={14} className="text-gray-500" />
            Export CSV
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition"
          >
            <Plus size={15} />
            New Quotation
          </button>
        </div>
      </div>

      {/* ── KPI Analytics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Quotes */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Quotations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {totalCount}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {acceptedOrConverted.length} accepted
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Active quotes & estimates issued
          </p>
        </div>

        {/* Accepted & Converted Volume */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Converted Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              ৳{Math.round(acceptedVolume).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Total value transitioned to live orders
          </p>
        </div>

        {/* Pending Review */}
        <div 
          onClick={() => {
            setActiveTab(activeTab === "SENT" ? "ALL" : "SENT");
            setPage(1);
          }}
          className={`rounded-xl border p-4 shadow-xs transition cursor-pointer ${
            activeTab === "SENT"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20"
              : "border-gray-200 bg-white hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {pendingReviewCount}
            </span>
            <span className="text-xs font-medium text-amber-600">waiting reply</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600/80 font-medium">
            Click to filter awaiting response
          </p>
        </div>

        {/* Win / Conversion Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Conversion Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {conversionRate}%
            </span>
            <span className="text-xs font-medium text-teal-600">win rate</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Quote-to-Order success benchmark
          </p>
        </div>
      </div>

      {/* ── Status Segment Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none">
        {[
          { id: "ALL", label: "All Quotations", count: totalCount },
          { id: "DRAFT", label: "Drafts" },
          { id: "SENT", label: "Sent to Client", count: pendingReviewCount },
          { id: "ACCEPTED", label: "Accepted" },
          { id: "CONVERTED", label: "Converted to Order", count: acceptedOrConverted.length },
          { id: "REJECTED", label: "Rejected" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-primary-600 text-white shadow-xs font-semibold"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
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
            placeholder="Search quote #, customer, phone..."
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
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="date">Date Created</option>
            <option value="total">Total Value</option>
            <option value="quotationNo">Quote Number</option>
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
            onClick={loadQuotations}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
          </button>
        </div>
      </div>

      {/* ── Quotations List Data View ── */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <RefreshCw size={24} className="mx-auto animate-spin text-primary-600 mb-2" />
          <p className="text-xs font-semibold text-gray-700">Loading quotations...</p>
        </div>
      ) : paginatedQuotations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
          <FileText size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-sm font-bold text-gray-900">No Quotations Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchQuery || activeTab !== "ALL"
              ? "No quotations matched your filter criteria."
              : "Create your first sales quotation / proforma estimate to send to clients."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
            >
              <Plus size={14} /> New Quotation
            </button>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* ── CLEAN ENTERPRISE TABLE VIEW ── */
        <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  <th className="px-4 py-3">Quote # & Version</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Items & Validity</th>
                  <th className="px-3 py-3 text-right">Grand Total</th>
                  <th className="px-3 py-3 text-center">Lifecycle Status</th>
                  <th className="px-4 py-3 text-right">Actions & Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedQuotations.map((q) => {
                  const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.DRAFT;
                  const isActionBusy = actionLoading?.startsWith(q.id);

                  return (
                    <tr key={q.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Quote No & Version */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setSelectedQuoteForDrawer(q)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-200/50 text-xs font-bold hover:bg-primary-100 transition"
                          >
                            <FileText size={14} />
                          </button>
                          <div>
                            <button
                              onClick={() => setSelectedQuoteForDrawer(q)}
                              className="font-bold text-gray-900 hover:text-primary-600 text-left transition block"
                            >
                              {q.quotationNo}
                            </button>
                            <span className="text-[10px] text-gray-400 font-medium">
                              v{q.version || 1} &bull; {new Date(q.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-semibold text-gray-800">{q.customer?.name || "Prospective Client"}</p>
                          {q.customer?.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                              <Phone size={10} /> {q.customer.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Items & Validity */}
                      <td className="px-3 py-3">
                        <div>
                          <span className="font-medium text-gray-700">
                            {q.items?.length || 1} line {q.items?.length === 1 ? "item" : "items"}
                          </span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Valid until: {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "30 days"}
                          </p>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-gray-900 text-xs">
                          ৳{Number(q.total || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions & Lifecycle conversion */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {q.status === "DRAFT" && (
                            <button
                              disabled={Boolean(isActionBusy)}
                              onClick={() => doAction(q.id, "send")}
                              className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 text-[11px] font-semibold hover:bg-blue-100 transition"
                              title="Send to client"
                            >
                              <Send size={11} /> Send
                            </button>
                          )}

                          {(q.status === "SENT" || q.status === "CUSTOMER_REVIEW") && (
                            <>
                              <button
                                disabled={Boolean(isActionBusy)}
                                onClick={() => doAction(q.id, "accept")}
                                className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 text-[11px] font-semibold hover:bg-emerald-100 transition"
                                title="Mark Accepted"
                              >
                                <CheckCircle size={11} /> Accept
                              </button>
                              <button
                                disabled={Boolean(isActionBusy)}
                                onClick={() => doAction(q.id, "reject")}
                                className="inline-flex items-center gap-1 rounded bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 text-[11px] font-semibold hover:bg-rose-100 transition"
                                title="Mark Rejected"
                              >
                                <XCircle size={11} /> Reject
                              </button>
                            </>
                          )}

                          {q.status === "ACCEPTED" && (
                            <button
                              disabled={Boolean(isActionBusy)}
                              onClick={() => doAction(q.id, "convert")}
                              className="inline-flex items-center gap-1 rounded bg-teal-600 text-white px-2.5 py-1 text-[11px] font-semibold shadow-2xs hover:bg-teal-700 transition"
                              title="Convert to Live Sales Order"
                            >
                              <ShoppingCart size={11} /> Convert to Order
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedQuoteForDrawer(q)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
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
          {paginatedQuotations.map((q) => {
            const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.DRAFT;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        onClick={() => setSelectedQuoteForDrawer(q)}
                        className="font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition text-xs"
                      >
                        {q.quotationNo}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {q.customer?.name || "Prospective Client"}
                      </p>
                    </div>

                    <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[9px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-gray-100">
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <span className="text-[10px] text-gray-400 font-medium block">Total Value</span>
                      <span className="text-xs font-bold text-gray-900">৳{Number(q.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="rounded bg-gray-50 p-2 text-center">
                      <span className="text-[10px] text-gray-400 font-medium block">Validity</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "30 days"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {q.items?.length || 1} items
                  </span>

                  <div className="flex items-center gap-1.5">
                    {q.status === "ACCEPTED" ? (
                      <button
                        onClick={() => doAction(q.id, "convert")}
                        className="rounded bg-teal-600 text-white px-2 py-0.5 text-[11px] font-semibold hover:bg-teal-700"
                      >
                        Convert to Order
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedQuoteForDrawer(q)}
                        className="rounded bg-primary-50 text-primary-700 px-2 py-0.5 text-[11px] font-semibold hover:bg-primary-100"
                      >
                        View Quote
                      </button>
                    )}
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
            of <span className="font-semibold text-gray-800">{totalItems}</span> quotations
          </p>

          <div className="flex items-center gap-2">
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

      {/* ── CREATE QUOTATION MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-200/60 font-bold">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Create Sales Quotation / Estimate</h2>
                  <p className="text-[11px] text-gray-500">Draft customized pricing, discounts, and itemized proforma estimates.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={createQuotation} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Customer / Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Corporation"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1711-000000"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Line Items Dynamic Builder */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Itemized Line Products</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition"
                  >
                    <Plus size={12} /> Add Item Row
                  </button>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, idx) => {
                    const lineTotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discountAmount) || 0);
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 items-center text-xs">
                        <div className="col-span-5">
                          <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Product / Service Description</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Enterprise Software License"
                            value={item.name}
                            onChange={(e) => updateItem(idx, "name", e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateItem(idx, "qty", e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Unit Price (৳)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Total</label>
                          <span className="block font-bold text-gray-900 py-1">৳{lineTotal.toLocaleString()}</span>
                        </div>

                        <div className="col-span-1 text-right pt-4">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={form.items.length <= 1}
                            className="rounded p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Totals Card */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Notes & Terms</label>
                  <input
                    type="text"
                    placeholder="Payment terms, delivery schedules, warranty conditions..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="w-full sm:w-56 text-right space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-800">৳{formSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold text-sm pt-1 border-t border-gray-200">
                    <span>Grand Total:</span>
                    <span className="text-primary-600">৳{formGrandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUOTATION DETAILS SLIDE-OVER DRAWER ── */}
      {selectedQuoteForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-100">
          <div
            onClick={() => setSelectedQuoteForDrawer(null)}
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-150">
              
              {/* Drawer Header */}
              <div className="border-b border-gray-200 bg-gray-50/80 p-5 relative">
                <button
                  onClick={() => setSelectedQuoteForDrawer(null)}
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 transition"
                >
                  <X size={18} />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-200 font-bold">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{selectedQuoteForDrawer.quotationNo}</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Created: {new Date(selectedQuoteForDrawer.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_CONFIG[selectedQuoteForDrawer.status]?.bg || "bg-gray-50"
                  } ${STATUS_CONFIG[selectedQuoteForDrawer.status]?.text || "text-gray-700"}`}>
                    {STATUS_CONFIG[selectedQuoteForDrawer.status]?.label || selectedQuoteForDrawer.status}
                  </span>

                  <span className="text-xs font-bold text-gray-900">
                    Grand Total: ৳{Number(selectedQuoteForDrawer.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* Customer Details */}
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Customer Details</span>
                  <p className="font-bold text-sm text-gray-900">{selectedQuoteForDrawer.customer?.name || "Client"}</p>
                  {selectedQuoteForDrawer.customer?.phone && (
                    <p className="text-gray-600 flex items-center gap-1.5">
                      <Phone size={12} className="text-gray-400" />
                      <a href={`tel:${selectedQuoteForDrawer.customer.phone}`} className="hover:text-primary-600">
                        {selectedQuoteForDrawer.customer.phone}
                      </a>
                    </p>
                  )}
                </div>

                {/* Line Items */}
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Itemized Products</span>
                  <div className="divide-y divide-gray-100">
                    {(selectedQuoteForDrawer.items || []).map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{it.name || `Item #${idx + 1}`}</p>
                          <p className="text-[11px] text-gray-400">
                            {it.qty} &times; ৳{Number(it.unitPrice || 0).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-bold text-gray-900">
                          ৳{Number(it.lineTotal || (it.qty * it.unitPrice)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedQuoteForDrawer.note && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Notes & Conditions</span>
                    <p className="text-gray-700">{selectedQuoteForDrawer.note}</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-gray-200 bg-gray-50/80 p-4 flex items-center justify-between gap-2">
                {selectedQuoteForDrawer.status === "ACCEPTED" ? (
                  <button
                    onClick={() => doAction(selectedQuoteForDrawer.id, "convert")}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                  >
                    <ShoppingCart size={13} /> Convert to Live Order
                  </button>
                ) : selectedQuoteForDrawer.status === "DRAFT" ? (
                  <button
                    onClick={() => doAction(selectedQuoteForDrawer.id, "send")}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
                  >
                    <Send size={13} /> Send Quotation to Client
                  </button>
                ) : (
                  <button
                    onClick={() => window.print()}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Printer size={13} /> Print Quotation Slip
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
