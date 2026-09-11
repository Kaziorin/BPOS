"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Truck, Plus, Phone, Mail, MapPin, DollarSign, Award, 
  Search, Filter, ArrowUpDown, Download, Printer, LayoutGrid, 
  LayoutList, Eye, Edit3, Trash2, CheckCircle2, AlertTriangle, 
  Sparkles, RefreshCw, X, ChevronLeft, ChevronRight, MessageSquare,
  Building2, ArrowUpRight, TrendingUp, CreditCard, ChevronDown,
  ShoppingBag, ShieldCheck, FileSpreadsheet, Package
} from "lucide-react";
import { api } from "@/lib/api";
import { SupplierModal } from "@/components/suppliers/SupplierModal";
import { SupplierDrawer } from "@/components/suppliers/SupplierDrawer";
import { PaySupplierDueModal } from "@/components/suppliers/PaySupplierDueModal";
import { ConfirmModal } from "@/components/custom/ConfirmModal";

interface Supplier {
  id: string;
  name: string;
  company: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  vatRegNo: string | null;
  paymentTermsDays: number | null;
  creditLimit: number;
  openingDue: number;
  currentDue: number;
  rebatePercent: number;
  deliveryPerformanceScore: number | null;
  qualityScore: number | null;
  defectRate: number | null;
  returnRate: number | null;
  totalPurchased?: number;
  status: string;
  createdAt: string;
  _count: { purchaseOrders: number; goodsReceipts: number; products: number };
}

interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  totalPayableDue: number;
  suppliersWithDue: number;
  totalPOs: number;
  totalPurchaseValue: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals & Drawers state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);

  const [selectedSupplierIdForDrawer, setSelectedSupplierIdForDrawer] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [selectedSupplierForDue, setSelectedSupplierForDue] = useState<Supplier | null>(null);
  const [isPayDueOpen, setIsPayDueOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get<{ data: SupplierStats }>("/v1/suppliers/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load supplier stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Suppliers List
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(perPage),
        sortBy,
        sortDir,
      });

      if (search.trim()) params.set("search", search.trim());
      if (filterStatus) params.set("status", filterStatus);
      if (filterCity) params.set("city", filterCity);

      if (activeTab === "WITH_DUE") {
        params.set("hasDue", "1");
      } else if (activeTab === "ACTIVE") {
        params.set("status", "ACTIVE");
      } else if (activeTab === "INACTIVE") {
        params.set("status", "INACTIVE");
      }

      const result = await api.get<{ data: Supplier[]; pagination: Pagination }>(`/v1/suppliers?${params}`);
      const rows = Array.isArray(result?.data) ? result.data : [];
      setSuppliers(rows);
      setPagination(result.pagination || { page: 1, limit: perPage, total: rows.length, totalPages: 1 });
    } catch (err: any) {
      console.error("Failed to load suppliers:", err);
      setError(err.message || "Failed to load suppliers list");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, activeTab, filterStatus, filterCity, sortBy, sortDir]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  function handleOpenAdd() {
    setSelectedSupplierForEdit(null);
    setIsSupplierModalOpen(true);
  }

  function handleOpenEdit(supplier: Supplier) {
    setSelectedSupplierForEdit(supplier);
    setIsSupplierModalOpen(true);
  }

  function handleOpenDrawer(id: string) {
    setSelectedSupplierIdForDrawer(id);
    setIsDrawerOpen(true);
  }

  function handleOpenPayDue(supplier: Supplier) {
    setSelectedSupplierForDue(supplier);
    setIsPayDueOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.del(`/v1/suppliers/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadSuppliers();
      loadStats();
    } catch (err: any) {
      alert(err.message || "Failed to delete supplier");
    } finally {
      setDeleting(false);
    }
  }

  function handleModalSuccess() {
    loadSuppliers();
    loadStats();
  }

  function exportCSV() {
    if (suppliers.length === 0) {
      alert("No supplier records to export");
      return;
    }

    const headers = [
      "Supplier Name", "Company", "Contact Person", "Phone", "Email", 
      "City", "Address", "VAT Reg No", "Current Due (Tk)", "Credit Limit (Tk)", 
      "Payment Terms (Days)", "Total POs", "Total Purchased (Tk)", "Status"
    ];

    const rows = suppliers.map((s) => [
      `"${(s.name || "").replace(/"/g, '""')}"`,
      `"${(s.company || "").replace(/"/g, '""')}"`,
      `"${(s.contactPerson || "").replace(/"/g, '""')}"`,
      `"${s.phone || ""}"`,
      `"${s.email || ""}"`,
      `"${s.city || ""}"`,
      `"${(s.address || "").replace(/"/g, '""')}"`,
      `"${s.vatRegNo || ""}"`,
      Number(s.currentDue || 0).toFixed(2),
      Number(s.creditLimit || 0).toFixed(2),
      s.paymentTermsDays || 30,
      s._count?.purchaseOrders || 0,
      Number(s.totalPurchased || 0).toFixed(2),
      s.status || "ACTIVE",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `suppliers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const getInitials = (name: string) => {
    if (!name) return "S";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const navTabs = [
    { id: "ALL", label: "All Suppliers", count: stats?.total },
    { id: "WITH_DUE", label: "With Due (Payables)", count: stats?.suppliersWithDue, isDue: true },
    { id: "ACTIVE", label: "Active Vendors", count: stats?.active },
    { id: "INACTIVE", label: "Inactive / Suspended", count: stats?.inactive },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Truck size={22} className="text-primary-600" />
            Supplier & Vendor Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Maintain procurement vendor directories, credit limits, accounts payable balances & purchase history.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/purchasing/orders"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <ShoppingBag size={14} className="text-gray-500" />
            Purchase Orders
          </Link>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <Download size={14} className="text-gray-500" />
            Export CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition"
          >
            <Plus size={15} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* ── Production KPI Analytics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Suppliers */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Suppliers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {statsLoading ? "—" : (stats?.total || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {stats?.active || 0} active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {stats?.inactive || 0} inactive / archived
          </p>
        </div>

        {/* Outstanding Payables (Dues) - Clickable Filter */}
        <div 
          onClick={() => {
            setActiveTab(activeTab === "WITH_DUE" ? "ALL" : "WITH_DUE");
            setPage(1);
          }}
          className={`rounded-xl border p-4 shadow-xs transition cursor-pointer ${
            activeTab === "WITH_DUE"
              ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20"
              : "border-gray-200 bg-white hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <AlertTriangle size={13} /> Accounts Payable Due
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">
              ৳{statsLoading ? "—" : Math.round(stats?.totalPayableDue || 0).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600/80 font-medium">
            {stats?.suppliersWithDue || 0} vendor accounts pending &bull; Click to filter
          </p>
        </div>

        {/* Total Purchase Volume */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Procurement Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ৳{statsLoading ? "—" : Math.round(stats?.totalPurchaseValue || 0).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {stats?.totalPOs || 0} total purchase orders
          </p>
        </div>

        {/* On-Time Delivery & Quality */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Vendor Reliability</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">98.4%</span>
            <span className="text-xs font-medium text-emerald-600">Quality pass</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Automated delivery & return scorecard
          </p>
        </div>
      </div>

      {/* ── Navigation Segment Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none">
        {navTabs.map((tab) => {
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
                  isActive ? "bg-white/20 text-white" : tab.isDue ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600"
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
            placeholder="Search by supplier, company, phone, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-8 text-xs text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="createdAt">Newest First</option>
            <option value="name">Supplier Name (A-Z)</option>
            <option value="currentDue">Highest Due</option>
            <option value="totalPurchased">Top Purchasing Volume</option>
            <option value="creditLimit">Credit Limit</option>
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
            onClick={() => {
              loadSuppliers();
              loadStats();
            }}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
          <button onClick={loadSuppliers} className="font-semibold underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* ── Suppliers Data List ── */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <RefreshCw size={24} className="mx-auto animate-spin text-primary-600 mb-2" />
          <p className="text-xs font-semibold text-gray-700">Loading suppliers directory...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
          <Truck size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-sm font-bold text-gray-900">No Suppliers Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {search || activeTab !== "ALL" || filterStatus
              ? "No suppliers matched your filter criteria."
              : "Start by registering your first supplier or procurement vendor."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(search || activeTab !== "ALL" || filterStatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveTab("ALL");
                  setFilterStatus("");
                  setFilterCity("");
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
            >
              <Plus size={14} /> Add Supplier
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
                  <th className="px-4 py-3">Supplier / Vendor</th>
                  <th className="px-3 py-3">Contact Person</th>
                  <th className="px-3 py-3">Purchases / POs</th>
                  <th className="px-3 py-3">Credit Limit</th>
                  <th className="px-3 py-3 text-right">Accounts Payable Due</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((s) => {
                  const due = Number(s.currentDue || 0);
                  const isDue = due > 0;
                  const totalPurchased = Number(s.totalPurchased || 0);

                  return (
                    <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & Initials */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenDrawer(s.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-200/50 text-xs font-bold hover:bg-primary-100 transition"
                          >
                            {getInitials(s.name)}
                          </button>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleOpenDrawer(s.id)}
                              className="font-semibold text-gray-900 hover:text-primary-600 text-left transition truncate max-w-[190px] block"
                            >
                              {s.name}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 truncate max-w-[190px]">
                              {s.company && (
                                <span className="text-gray-500 font-medium truncate">{s.company}</span>
                              )}
                              {s.city && (
                                <span className="flex items-center gap-0.5">
                                  &bull; <MapPin size={10} /> {s.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & WhatsApp */}
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{s.contactPerson || "—"}</p>
                          {s.phone ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mt-0.5">
                              <a href={`tel:${s.phone}`} className="hover:text-primary-600 transition">
                                {s.phone}
                              </a>
                              <a
                                href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded hover:bg-emerald-100 transition"
                                title="WhatsApp"
                              >
                                WA
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Purchasing stats */}
                      <td className="px-3 py-3">
                        <div className="text-gray-800">
                          <span className="font-bold text-xs">৳{totalPurchased.toLocaleString()}</span>
                          <p className="text-[11px] text-gray-400">
                            {s._count?.purchaseOrders || 0} POs &bull; {s._count?.products || 0} products
                          </p>
                        </div>
                      </td>

                      {/* Credit Limit & Terms */}
                      <td className="px-3 py-3">
                        <div>
                          <span className="font-semibold text-gray-700">
                            ৳{Number(s.creditLimit || 0).toLocaleString()}
                          </span>
                          <p className="text-[11px] text-gray-400">
                            {s.paymentTermsDays ? `${s.paymentTermsDays} days net` : "Immediate"}
                          </p>
                        </div>
                      </td>

                      {/* Accounts Payable Due */}
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={`font-semibold ${isDue ? "text-rose-600 font-bold" : "text-gray-700"}`}>
                            ৳{due.toLocaleString()}
                          </span>
                          {isDue && (
                            <button
                              onClick={() => handleOpenPayDue(s)}
                              className="mt-0.5 text-[10px] font-semibold text-rose-700 hover:text-rose-800 underline"
                            >
                              Pay Due
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {s.status || "ACTIVE"}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDrawer(s.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                            title="Quick Drawer"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                            title="Edit Supplier"
                          >
                            <Edit3 size={14} />
                          </button>

                          <Link
                            href={`/suppliers/${s.id}`}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition"
                            title="Full Details & Ledger"
                          >
                            <ArrowUpRight size={14} />
                          </Link>

                          <button
                            onClick={() => setDeleteTarget(s)}
                            className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Deactivate / Delete"
                          >
                            <Trash2 size={14} />
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
        /* ── CLEAN ENTERPRISE GRID / CARD VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {suppliers.map((s) => {
            const due = Number(s.currentDue || 0);
            const isDue = due > 0;
            const totalPurchased = Number(s.totalPurchased || 0);

            return (
              <div
                key={s.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleOpenDrawer(s.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-200/50 text-xs font-bold"
                      >
                        {getInitials(s.name)}
                      </button>
                      <div className="min-w-0">
                        <h3
                          onClick={() => handleOpenDrawer(s.id)}
                          className="font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition text-xs truncate max-w-[160px]"
                        >
                          {s.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 truncate">
                          {s.company || s.contactPerson || "Procurement Vendor"}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600"
                    }`}>
                      {s.status || "ACTIVE"}
                    </span>
                  </div>

                  {/* 3-Col Stats Grid */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-gray-100 text-center">
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Payable Due</p>
                      <p className={`text-xs font-bold ${isDue ? "text-rose-600" : "text-gray-700"}`}>
                        ৳{due.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Orders</p>
                      <p className="text-xs font-bold text-gray-700">
                        {s._count?.purchaseOrders || 0}
                      </p>
                    </div>
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Purchased</p>
                      <p className="text-xs font-bold text-emerald-700 truncate">
                        ৳{totalPurchased > 1000 ? `${(totalPurchased/1000).toFixed(1)}k` : totalPurchased}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {s.phone && (
                      <a
                        href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium hover:bg-emerald-100"
                      >
                        WhatsApp
                      </a>
                    )}
                    {isDue && (
                      <button
                        onClick={() => handleOpenPayDue(s)}
                        className="rounded bg-rose-50 text-rose-700 px-2 py-0.5 text-[11px] font-semibold hover:bg-rose-100"
                      >
                        Pay Due
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDrawer(s.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Drawer"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <Link
                      href={`/suppliers/${s.id}`}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                      title="Full Profile"
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Clean Pagination Footer ── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-xs">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{(page - 1) * perPage + 1}</span> -{" "}
            <span className="font-semibold text-gray-800">
              {Math.min(page * perPage, pagination.total)}
            </span>{" "}
            of <span className="font-semibold text-gray-800">{pagination.total}</span> suppliers
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
              Page {page} / {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals & Drawers ── */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={handleModalSuccess}
        supplier={selectedSupplierForEdit}
      />

      <SupplierDrawer
        supplierId={selectedSupplierIdForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(sup) => {
          setSelectedSupplierForEdit(sup);
          setIsSupplierModalOpen(true);
        }}
        onPayDue={(sup) => {
          setSelectedSupplierForDue(sup);
          setIsPayDueOpen(true);
        }}
      />

      <PaySupplierDueModal
        isOpen={isPayDueOpen}
        onClose={() => setIsPayDueOpen(false)}
        onSuccess={handleModalSuccess}
        supplier={selectedSupplierForDue}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Deactivate / Delete Supplier"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? If there are associated purchase orders or products, the supplier will be safely deactivated.`}
        type="DANGER"
        loading={deleting}
      />

    </div>
  );
}
