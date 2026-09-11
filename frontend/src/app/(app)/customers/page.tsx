"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Users, UserPlus, Phone, Mail, MapPin, DollarSign, Award, 
  Search, Filter, ArrowUpDown, Download, Printer, LayoutGrid, 
  LayoutList, Eye, Edit3, Trash2, CheckCircle2, AlertTriangle, 
  Sparkles, RefreshCw, X, ChevronLeft, ChevronRight, MessageSquare,
  ShieldCheck, ArrowUpRight, TrendingUp, Layers
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomerModal } from "@/components/customers/CustomerModal";
import { CustomerDrawer } from "@/components/customers/CustomerDrawer";
import { CollectDueModal } from "@/components/customers/CollectDueModal";
import { CustomerGroupsModal } from "@/components/customers/CustomerGroupsModal";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  segmentation: string | null;
  creditLimit: number;
  currentDue: string | number;
  loyaltyPoints: number;
  status: string;
  createdAt: string;
  totalSpent?: number;
  group?: { id: string; name: string } | null;
  _count: { sales: number; invoices: number; complaints: number };
}

interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  totalDue: number;
  customersWithDue: number;
  totalPoints: number;
  vipCount: number;
  wholesaleCount: number;
  totalSalesValue: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [activeSegmentTab, setActiveSegmentTab] = useState<string>("ALL");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);

  const [selectedCustomerIdForDrawer, setSelectedCustomerIdForDrawer] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [selectedCustomerForDue, setSelectedCustomerForDue] = useState<Customer | null>(null);
  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);

  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get<{ data: CustomerStats }>("/v1/customers/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load customer stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Groups
  const loadGroups = useCallback(async () => {
    try {
      const res = await api.get<{ data: Array<{ id: string; name: string }> }>("/v1/customer-groups");
      setGroups(res.data || []);
    } catch (err) {
      console.error("Failed to load groups:", err);
    }
  }, []);

  // Load Customers List
  const loadCustomers = useCallback(async () => {
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
      if (filterGroup) params.set("groupId", filterGroup);
      if (filterStatus) params.set("status", filterStatus);

      // Handle Segment Tab
      if (activeSegmentTab === "WITH_DUE") {
        params.set("hasDue", "1");
      } else if (activeSegmentTab === "VIP") {
        params.set("segmentation", "VIP");
      } else if (activeSegmentTab === "WHOLESALE") {
        params.set("segmentation", "WHOLESALE");
      } else if (activeSegmentTab === "NEW") {
        params.set("segmentation", "NEW");
      } else if (activeSegmentTab === "INACTIVE") {
        params.set("status", "INACTIVE");
      } else if (activeSegmentTab !== "ALL") {
        params.set("segmentation", activeSegmentTab);
      }

      const result = await api.get<{ data: Customer[]; pagination: Pagination }>(`/v1/customers?${params}`);
      setCustomers(result.data || []);
      setPagination(result.pagination || { page: 1, limit: perPage, total: 0, totalPages: 1 });
    } catch (err: any) {
      console.error("Failed to load customers:", err);
      setError(err.message || "Failed to load customers list");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, activeSegmentTab, filterGroup, filterStatus, sortBy, sortDir]);

  useEffect(() => {
    loadStats();
    loadGroups();
  }, [loadStats, loadGroups]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Handlers
  function handleOpenAdd() {
    setSelectedCustomerForEdit(null);
    setIsCustomerModalOpen(true);
  }

  function handleOpenEdit(customer: Customer) {
    setSelectedCustomerForEdit(customer);
    setIsCustomerModalOpen(true);
  }

  function handleOpenDrawer(id: string) {
    setSelectedCustomerIdForDrawer(id);
    setIsDrawerOpen(true);
  }

  function handleOpenCollectDue(customer: Customer) {
    setSelectedCustomerForDue(customer);
    setIsCollectDueOpen(true);
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`Are you sure you want to deactivate customer "${customer.name}"?`)) return;
    try {
      await api.del(`/v1/customers/${customer.id}`);
      loadCustomers();
      loadStats();
    } catch (err: any) {
      alert(err.message || "Failed to delete customer");
    }
  }

  function handleModalSuccess() {
    loadCustomers();
    loadStats();
    loadGroups();
  }

  // Export to CSV
  function exportCSV() {
    if (customers.length === 0) {
      alert("No customer records to export");
      return;
    }

    const headers = ["Name", "Phone", "Email", "City", "Address", "Segment", "Group", "Current Due (BDT)", "Loyalty Points", "Total Orders", "Status"];
    const rows = customers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone || ""}"`,
      `"${c.email || ""}"`,
      `"${c.city || ""}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${c.segmentation || "REGULAR"}"`,
      `"${c.group?.name || "General"}"`,
      Number(c.currentDue || 0).toFixed(2),
      c.loyaltyPoints || 0,
      c._count?.sales || 0,
      c.status || "ACTIVE",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const segColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    VIP: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: "👑" },
    HIGH_VALUE: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", icon: "💎" },
    WHOLESALE: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", icon: "🏢" },
    CORPORATE: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", icon: "🏛️" },
    NEW: { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200", icon: "✨" },
    REGULAR: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "👤" },
    AT_RISK: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", icon: "⚠️" },
    INACTIVE: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", icon: "💤" },
  };

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const segmentTabs = [
    { id: "ALL", label: "All Customers", count: stats?.total },
    { id: "WITH_DUE", label: "⚠️ With Outstanding Due", count: stats?.customersWithDue, highlight: true },
    { id: "VIP", label: "👑 VIP Clients", count: stats?.vipCount },
    { id: "WHOLESALE", label: "🏢 Wholesale", count: stats?.wholesaleCount },
    { id: "NEW", label: "✨ New Registered" },
    { id: "INACTIVE", label: "💤 Inactive / Blocked", count: stats?.inactive },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── Page Header & Quick Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Management</h1>
              <p className="text-xs font-medium text-slate-500">
                CRM, Credit Control, Loyalty Points & Client Portfolios
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGroupsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Layers size={15} className="text-slate-500" />
            Manage Groups ({groups.length})
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            title="Export customer list to CSV file"
          >
            <Download size={15} className="text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            title="Print Customer Directory"
          >
            <Printer size={15} className="text-slate-500" />
            Print
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition"
          >
            <UserPlus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* ── KPI Analytics Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Customers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {statsLoading ? "—" : (stats?.total || 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <CheckCircle2 size={12} /> {stats?.active || 0} Active
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            <span>Inactive: {stats?.inactive || 0}</span>
            <span>Total Sales: ৳{stats ? Math.round(stats.totalSalesValue).toLocaleString() : 0}</span>
          </div>
        </div>

        {/* Outstanding Receivables (Dues) */}
        <div 
          onClick={() => {
            setActiveSegmentTab(activeSegmentTab === "WITH_DUE" ? "ALL" : "WITH_DUE");
            setPage(1);
          }}
          className={`relative overflow-hidden rounded-2xl border cursor-pointer p-5 shadow-sm transition hover:shadow-md ${
            activeSegmentTab === "WITH_DUE"
              ? "border-red-500 bg-red-50/40 ring-2 ring-red-500/20"
              : "border-slate-200/80 bg-gradient-to-br from-white to-rose-50/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-600" />
              Total Outstanding Due
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-700">
              ৳{statsLoading ? "—" : Math.round(stats?.totalDue || 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-red-600/80 border-t border-red-100 pt-2 font-medium">
            <span>{stats?.customersWithDue || 0} accounts have due</span>
            <span className="underline font-bold text-red-700">Filter Due &rarr;</span>
          </div>
        </div>

        {/* VIP & High-Value Clients */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              VIP & Top Clients
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {statsLoading ? "—" : (stats?.vipCount || 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-amber-700">
              Wholesale: {stats?.wholesaleCount || 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Eligible for special tier discounts
          </div>
        </div>

        {/* Loyalty Points Active */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-indigo-50/30 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Loyalty Rewards</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-950">
              {statsLoading ? "—" : (stats?.totalPoints || 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-indigo-600">pts active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Redeemable across all POS checkouts
          </div>
        </div>
      </div>

      {/* ── Segment Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {segmentTabs.map((tab) => {
          const isActive = activeSegmentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSegmentTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : tab.highlight ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search box */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
          {/* Customer Group Filter */}
          <select
            value={filterGroup}
            onChange={(e) => {
              setFilterGroup(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Customer Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="createdAt">Sort by: Recently Added</option>
            <option value="name">Sort by: Name (A-Z)</option>
            <option value="currentDue">Sort by: Highest Outstanding Due</option>
            <option value="salesCount">Sort by: Most Orders</option>
            <option value="loyaltyPoints">Sort by: Loyalty Points</option>
          </select>

          {/* Sort Direction Toggle */}
          <button
            onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
            title={`Sort direction: ${sortDir.toUpperCase()}`}
          >
            <ArrowUpDown size={15} />
          </button>

          {/* View Mode Toggle (Table / Grid) */}
          <div className="flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-100">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              title="Table View"
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          <button
            onClick={() => {
              loadCustomers();
              loadStats();
            }}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={loadCustomers} className="font-bold underline hover:text-red-900">
            Try again
          </button>
        </div>
      )}

      {/* ── Customers Content View ── */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <RefreshCw size={32} className="mx-auto animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading customer directory...</p>
          <p className="text-xs text-slate-400 mt-1">Fetching profiles, due ledgers, and CRM records</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Customers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {search || activeSegmentTab !== "ALL" || filterGroup || filterStatus
              ? "No customers matched your current filter criteria. Try resetting filters."
              : "Get started by registering your first customer to track purchases, dues, and rewards."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {(search || activeSegmentTab !== "ALL" || filterGroup || filterStatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveSegmentTab("ALL");
                  setFilterGroup("");
                  setFilterStatus("");
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <UserPlus size={15} /> Add New Customer
            </button>
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* ── TABLE VIEW ── */
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Customer Profile</th>
                  <th className="px-4 py-3.5">Contact & Location</th>
                  <th className="px-4 py-3.5">Segment & Group</th>
                  <th className="px-4 py-3.5 text-right">Outstanding Due</th>
                  <th className="px-4 py-3.5 text-center">Orders & Spend</th>
                  <th className="px-4 py-3.5 text-center">Loyalty Pts</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const seg = segColors[c.segmentation || "REGULAR"] || segColors.REGULAR;
                  const due = Number(c.currentDue || 0);
                  const isDue = due > 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Customer Name & Initials */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenDrawer(c.id)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm hover:scale-105 transition"
                          >
                            {getInitials(c.name)}
                          </button>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleOpenDrawer(c.id)}
                              className="font-bold text-slate-900 hover:text-blue-600 text-left transition truncate max-w-[180px] block"
                            >
                              {c.name}
                            </button>
                            {c.email ? (
                              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{c.email}</p>
                            ) : (
                              <p className="text-[10px] text-slate-400">ID: {c.id.slice(0, 8)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          {c.phone ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <a
                                href={`tel:${c.phone}`}
                                className="hover:text-blue-600 transition"
                                title="Call customer"
                              >
                                {c.phone}
                              </a>
                              <a
                                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-emerald-600 hover:text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 transition"
                                title="Open WhatsApp Chat"
                              >
                                WA
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No phone</span>
                          )}
                          {c.city && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin size={11} /> {c.city}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Segmentation & Group */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${seg.bg} ${seg.text} ${seg.border}`}>
                            <span>{seg.icon}</span>
                            <span>{c.segmentation || "REGULAR"}</span>
                          </span>
                          {c.group && (
                            <p className="text-[11px] font-semibold text-slate-600 truncate max-w-[120px]">
                              {c.group.name}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Outstanding Due */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={`text-sm font-black ${isDue ? "text-red-600" : "text-emerald-600"}`}>
                            ৳{due.toLocaleString()}
                          </span>
                          {isDue ? (
                            <button
                              onClick={() => handleOpenCollectDue(c)}
                              className="mt-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 px-2 py-0.5 text-[10px] font-bold transition"
                            >
                              Collect Due
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">All Clear</span>
                          )}
                        </div>
                      </td>

                      {/* Orders & Total Spent */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-800">
                            {c._count?.sales || 0} Orders
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ৳{(c.totalSpent || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Loyalty Points */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                          <Award size={13} /> {c.loyaltyPoints || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {c.status || "ACTIVE"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDrawer(c.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
                            title="Quick CRM Preview"
                          >
                            <Eye size={15} />
                          </button>
                          
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Edit Customer"
                          >
                            <Edit3 size={15} />
                          </button>

                          <Link
                            href={`/customers/${c.id}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Full Customer Dashboard"
                          >
                            <ArrowUpRight size={15} />
                          </Link>

                          <button
                            onClick={() => handleDelete(c)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Deactivate Customer"
                          >
                            <Trash2 size={15} />
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
        /* ── CARD GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => {
            const seg = segColors[c.segmentation || "REGULAR"] || segColors.REGULAR;
            const due = Number(c.currentDue || 0);
            const isDue = due > 0;

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenDrawer(c.id)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-500/20 hover:scale-105 transition"
                      >
                        {getInitials(c.name)}
                      </button>
                      <div>
                        <h3 
                          onClick={() => handleOpenDrawer(c.id)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition text-sm truncate max-w-[170px]"
                        >
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {c.phone || c.email || `ID: #${c.id.slice(0, 6)}`}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${seg.bg} ${seg.text} ${seg.border}`}>
                      <span>{seg.icon}</span> {c.segmentation || "REGULAR"}
                    </span>
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Due</p>
                      <p className={`text-xs font-black mt-0.5 ${isDue ? "text-red-600" : "text-emerald-600"}`}>
                        ৳{due.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Orders</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">
                        {c._count?.sales || 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Points</p>
                      <p className="text-xs font-black text-amber-600 mt-0.5">
                        {c.loyaltyPoints || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {c.phone && (
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 text-[11px] font-bold transition"
                      >
                        WhatsApp
                      </a>
                    )}
                    {isDue && (
                      <button
                        onClick={() => handleOpenCollectDue(c)}
                        className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition"
                      >
                        Collect Due
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDrawer(c.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Quick CRM Drawer"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit Customer"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination Bar ── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{(page - 1) * perPage + 1}</span> to{" "}
            <span className="font-bold text-slate-800">
              {Math.min(page * perPage, pagination.total)}
            </span>{" "}
            of <span className="font-bold text-slate-800">{pagination.total}</span> customers
          </p>

          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <span className="text-xs font-bold text-slate-700 px-2">
              Page {page} / {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals & Drawers ── */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={handleModalSuccess}
        customer={selectedCustomerForEdit}
        groups={groups}
      />

      <CustomerDrawer
        customerId={selectedCustomerIdForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(cust) => {
          setSelectedCustomerForEdit(cust);
          setIsCustomerModalOpen(true);
        }}
        onCollectDue={(cust) => {
          setSelectedCustomerForDue(cust);
          setIsCollectDueOpen(true);
        }}
      />

      <CollectDueModal
        isOpen={isCollectDueOpen}
        onClose={() => setIsCollectDueOpen(false)}
        onSuccess={handleModalSuccess}
        customer={selectedCustomerForDue}
      />

      <CustomerGroupsModal
        isOpen={isGroupsModalOpen}
        onClose={() => setIsGroupsModalOpen(false)}
        onSuccess={() => {
          loadGroups();
          loadCustomers();
        }}
      />

    </div>
  );
}
