"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Users, UserPlus, Phone, Mail, MapPin, DollarSign, Award, 
  Search, Filter, ArrowUpDown, Download, Printer, LayoutGrid, 
  LayoutList, Eye, Edit3, Trash2, CheckCircle2, AlertTriangle, 
  Sparkles, RefreshCw, X, ChevronLeft, ChevronRight, MessageSquare,
  Layers, ArrowUpRight, TrendingUp, CreditCard, ChevronDown
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

  function exportCSV() {
    if (customers.length === 0) {
      alert("No customer records to export");
      return;
    }

    const headers = ["Name", "Phone", "Email", "City", "Address", "Segment", "Group", "Current Due (Tk)", "Loyalty Points", "Total Orders", "Status"];
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
    link.setAttribute("download", `customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const segBadgeMap: Record<string, { bg: string; text: string; label: string }> = {
    VIP: { bg: "bg-amber-50 text-amber-700 border-amber-200/60", text: "text-amber-700", label: "VIP" },
    HIGH_VALUE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", text: "text-emerald-700", label: "High Value" },
    WHOLESALE: { bg: "bg-primary-50 text-primary-700 border-primary-200/60", text: "text-primary-700", label: "Wholesale" },
    CORPORATE: { bg: "bg-purple-50 text-purple-700 border-purple-200/60", text: "text-purple-700", label: "Corporate" },
    NEW: { bg: "bg-sky-50 text-sky-700 border-sky-200/60", text: "text-sky-700", label: "New" },
    REGULAR: { bg: "bg-gray-50 text-gray-700 border-gray-200", text: "text-gray-700", label: "Regular" },
    AT_RISK: { bg: "bg-rose-50 text-rose-700 border-rose-200/60", text: "text-rose-700", label: "At Risk" },
    INACTIVE: { bg: "bg-gray-100 text-gray-500 border-gray-200", text: "text-gray-500", label: "Inactive" },
  };

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const segmentTabs = [
    { id: "ALL", label: "All Customers", count: stats?.total },
    { id: "WITH_DUE", label: "With Due", count: stats?.customersWithDue, isDue: true },
    { id: "VIP", label: "VIP & High Value", count: stats?.vipCount },
    { id: "WHOLESALE", label: "Wholesale", count: stats?.wholesaleCount },
    { id: "NEW", label: "New Customers" },
    { id: "INACTIVE", label: "Inactive", count: stats?.inactive },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-primary-600" />
            Customer Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Maintain customer directories, credit limits, outstanding balances & CRM loyalty.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGroupsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <Layers size={14} className="text-gray-500" />
            Groups ({groups.length})
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <Download size={14} className="text-gray-500" />
            Export CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
          >
            <UserPlus size={15} />
            Add Customer
          </button>
        </div>
      </div>

      {/* ── Clean KPI Analytics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Customers */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Customers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Users size={16} />
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
            Total sales volume: ৳{stats ? Math.round(stats.totalSalesValue).toLocaleString() : 0}
          </p>
        </div>

        {/* Outstanding Receivables (Dues) */}
        <div 
          onClick={() => {
            setActiveSegmentTab(activeSegmentTab === "WITH_DUE" ? "ALL" : "WITH_DUE");
            setPage(1);
          }}
          className={`rounded-xl border p-4 shadow-sm transition cursor-pointer ${
            activeSegmentTab === "WITH_DUE"
              ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20"
              : "border-gray-200 bg-white hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <AlertTriangle size={13} /> Outstanding Due
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">
              ৳{statsLoading ? "—" : Math.round(stats?.totalDue || 0).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600/80 font-medium">
            {stats?.customersWithDue || 0} accounts pending &bull; Click to filter
          </p>
        </div>

        {/* VIP & High-Value */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">VIP & Top Tier</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {statsLoading ? "—" : (stats?.vipCount || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-gray-500">
              ({stats?.wholesaleCount || 0} wholesale)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            High loyalty & custom credit terms
          </p>
        </div>

        {/* Loyalty Points */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Loyalty Points</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {statsLoading ? "—" : (stats?.totalPoints || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-primary-600">points</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Redeemable in POS checkouts
          </p>
        </div>
      </div>

      {/* ── Segment Navigation Bar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none">
        {segmentTabs.map((tab) => {
          const isActive = activeSegmentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSegmentTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
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
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email, address..."
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

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <select
            value={filterGroup}
            onChange={(e) => {
              setFilterGroup(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

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
            <option value="name">Name (A-Z)</option>
            <option value="currentDue">Highest Due</option>
            <option value="salesCount">Most Orders</option>
            <option value="loyaltyPoints">Loyalty Points</option>
          </select>

          <button
            onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 transition"
            title={`Sort: ${sortDir.toUpperCase()}`}
          >
            <ArrowUpDown size={14} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded p-1 transition ${viewMode === "table" ? "bg-white text-primary-600 shadow-xs font-bold" : "text-gray-400 hover:text-gray-700"}`}
              title="Table View"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1 transition ${viewMode === "grid" ? "bg-white text-primary-600 shadow-xs font-bold" : "text-gray-400 hover:text-gray-700"}`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          <button
            onClick={() => {
              loadCustomers();
              loadStats();
            }}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh"
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
          <button onClick={loadCustomers} className="font-semibold underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* ── Customers List Data View ── */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <RefreshCw size={24} className="mx-auto animate-spin text-primary-600 mb-2" />
          <p className="text-xs font-semibold text-gray-700">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
          <Users size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-sm font-bold text-gray-900">No Customers Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {search || activeSegmentTab !== "ALL" || filterGroup || filterStatus
              ? "No customers matched your filter criteria."
              : "Start by creating your first customer record."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(search || activeSegmentTab !== "ALL" || filterGroup || filterStatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveSegmentTab("ALL");
                  setFilterGroup("");
                  setFilterStatus("");
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
              <UserPlus size={14} /> Add Customer
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
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Segment</th>
                  <th className="px-3 py-3">Group</th>
                  <th className="px-3 py-3 text-right">Outstanding Due</th>
                  <th className="px-3 py-3 text-center">Orders</th>
                  <th className="px-3 py-3 text-center">Points</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => {
                  const seg = segBadgeMap[c.segmentation || "REGULAR"] || segBadgeMap.REGULAR;
                  const due = Number(c.currentDue || 0);
                  const isDue = due > 0;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & Initials */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenDrawer(c.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-200/50 text-xs font-bold hover:bg-primary-100 transition"
                          >
                            {getInitials(c.name)}
                          </button>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleOpenDrawer(c.id)}
                              className="font-semibold text-gray-900 hover:text-primary-600 text-left transition truncate max-w-[170px] block"
                            >
                              {c.name}
                            </button>
                            {c.city && (
                              <p className="text-[11px] text-gray-400 truncate max-w-[170px] flex items-center gap-0.5">
                                <MapPin size={10} /> {c.city}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone & WhatsApp */}
                      <td className="px-3 py-3">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                            <a href={`tel:${c.phone}`} className="hover:text-primary-600 transition">
                              {c.phone}
                            </a>
                            <a
                              href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded hover:bg-emerald-100 transition"
                              title="WhatsApp"
                            >
                              WA
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Segment */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${seg.bg}`}>
                          {seg.label}
                        </span>
                      </td>

                      {/* Group */}
                      <td className="px-3 py-3 text-gray-600">
                        {c.group?.name || <span className="text-gray-400">—</span>}
                      </td>

                      {/* Outstanding Due */}
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={`font-semibold ${isDue ? "text-rose-600 font-bold" : "text-gray-700"}`}>
                            ৳{due.toLocaleString()}
                          </span>
                          {isDue && (
                            <button
                              onClick={() => handleOpenCollectDue(c)}
                              className="mt-0.5 text-[10px] font-semibold text-rose-700 hover:text-rose-800 underline"
                            >
                              Collect
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-3 py-3 text-center text-gray-700">
                        <span className="font-medium">{c._count?.sales || 0}</span>
                      </td>

                      {/* Loyalty Points */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-amber-700 font-medium text-xs">
                          {c.loyaltyPoints || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {c.status || "ACTIVE"}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDrawer(c.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                            title="Quick Drawer"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>

                          <Link
                            href={`/customers/${c.id}`}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition"
                            title="Full Details"
                          >
                            <ArrowUpRight size={14} />
                          </Link>

                          <button
                            onClick={() => handleDelete(c)}
                            className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Deactivate"
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
        /* ── CLEAN CARD GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {customers.map((c) => {
            const seg = segBadgeMap[c.segmentation || "REGULAR"] || segBadgeMap.REGULAR;
            const due = Number(c.currentDue || 0);
            const isDue = due > 0;

            return (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleOpenDrawer(c.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-200/50 text-xs font-bold"
                      >
                        {getInitials(c.name)}
                      </button>
                      <div className="min-w-0">
                        <h3
                          onClick={() => handleOpenDrawer(c.id)}
                          className="font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition text-xs truncate max-w-[150px]"
                        >
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 truncate">
                          {c.phone || c.email || "No contact"}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${seg.bg}`}>
                      {seg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-gray-100 text-center">
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Due</p>
                      <p className={`text-xs font-bold ${isDue ? "text-rose-600" : "text-gray-700"}`}>
                        ৳{due.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Orders</p>
                      <p className="text-xs font-bold text-gray-700">
                        {c._count?.sales || 0}
                      </p>
                    </div>
                    <div className="rounded bg-gray-50 p-1.5">
                      <p className="text-[10px] text-gray-400 font-medium">Points</p>
                      <p className="text-xs font-bold text-amber-700">
                        {c.loyaltyPoints || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {c.phone && (
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium hover:bg-emerald-100"
                      >
                        WhatsApp
                      </a>
                    )}
                    {isDue && (
                      <button
                        onClick={() => handleOpenCollectDue(c)}
                        className="rounded bg-rose-50 text-rose-700 px-2 py-0.5 text-[11px] font-semibold hover:bg-rose-100"
                      >
                        Collect Due
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDrawer(c.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Drawer"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
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
            of <span className="font-semibold text-gray-800">{pagination.total}</span> customers
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
