"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  Users, UserPlus, Phone, Mail, MapPin, DollarSign, Award, 
  Search, ArrowUpDown, Download, LayoutGrid, 
  LayoutList, Eye, Edit3, Trash2, CheckCircle2, AlertTriangle, 
  Sparkles, X, ChevronLeft, ChevronRight, Layers, ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api";
import { 
  CustomBreadcrumb, 
  CustomButton, 
  CustomDropdownSelect, 
  CustomTable, 
  type CustomTableColumn, 
  CustomStatCard, 
  ConfirmModal 
} from "@/components/custom";
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

  // Delete confirmation state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleConfirmDelete() {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await api.del(`/v1/customers/${customerToDelete.id}`);
      setCustomerToDelete(null);
      loadCustomers();
      loadStats();
    } catch (err: any) {
      alert(err.message || "Failed to delete customer");
    } finally {
      setIsDeleting(false);
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
    WHOLESALE: { bg: "bg-sky-50 text-[#0284C7] border-sky-200/60", text: "text-[#0284C7]", label: "Wholesale" },
    CORPORATE: { bg: "bg-purple-50 text-purple-700 border-purple-200/60", text: "text-purple-700", label: "Corporate" },
    NEW: { bg: "bg-sky-50 text-[#0369A1] border-sky-200/60", text: "text-[#0369A1]", label: "New" },
    REGULAR: { bg: "bg-slate-50 text-gray-600 border-slate-200/80", text: "text-gray-600", label: "Regular" },
    AT_RISK: { bg: "bg-rose-50 text-rose-700 border-rose-200/60", text: "text-rose-700", label: "At Risk" },
    INACTIVE: { bg: "bg-rose-50/60 text-rose-600 border-rose-200/50", text: "text-rose-600", label: "Inactive" },
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

  // CustomTable Column Configuration
  const tableColumns: CustomTableColumn<Customer>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Customer",
        sortable: true,
        getSortValue: (c) => c.name,
        render: (c) => (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenDrawer(c.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
            >
              {getInitials(c.name)}
            </button>
            <div className="min-w-0">
              <button
                onClick={() => handleOpenDrawer(c.id)}
                className="font-semibold text-gray-600 hover:text-[#0284C7] text-left transition truncate max-w-[170px] block cursor-pointer"
              >
                {c.name}
              </button>
              {c.city && (
                <p className="text-[11px] text-gray-400 truncate max-w-[170px] flex items-center gap-0.5 mt-0.5">
                  <MapPin size={10} /> {c.city}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Contact",
        render: (c) =>
          c.phone ? (
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <a href={`tel:${c.phone}`} className="hover:text-[#0284C7] transition">
                {c.phone}
              </a>
              <a
                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-sm hover:bg-emerald-100 transition"
                title="WhatsApp"
              >
                WA
              </a>
            </div>
          ) : (
            <span className="text-gray-400 italic text-[11px]">—</span>
          ),
      },
      {
        key: "segmentation",
        header: "Segment",
        render: (c) => {
          const seg = segBadgeMap[c.segmentation || "REGULAR"] || segBadgeMap.REGULAR;
          return (
            <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold ${seg.bg}`}>
              {seg.label}
            </span>
          );
        },
      },
      {
        key: "group",
        header: "Group",
        getSortValue: (c) => c.group?.name || "",
        render: (c) => (
          <span className="text-xs text-gray-600 font-medium">
            {c.group?.name || <span className="text-gray-400">—</span>}
          </span>
        ),
      },
      {
        key: "currentDue",
        header: "Outstanding Due",
        align: "right",
        sortable: true,
        getSortValue: (c) => Number(c.currentDue || 0),
        render: (c) => {
          const due = Number(c.currentDue || 0);
          const isDue = due > 0;
          return (
            <div className="inline-flex flex-col items-end">
              <span className={`font-mono text-xs ${isDue ? "font-bold text-rose-600" : "font-semibold text-gray-600"}`}>
                ৳{due.toLocaleString()}
              </span>
              {isDue && (
                <button
                  onClick={() => handleOpenCollectDue(c)}
                  className="mt-0.5 text-[10px] font-semibold text-rose-700 hover:text-rose-800 underline cursor-pointer"
                >
                  Collect
                </button>
              )}
            </div>
          );
        },
      },
      {
        key: "salesCount",
        header: "Orders",
        align: "center",
        sortable: true,
        getSortValue: (c) => c._count?.sales || 0,
        render: (c) => <span className="text-xs font-semibold text-gray-600 tabular-nums">{c._count?.sales || 0}</span>,
      },
      {
        key: "loyaltyPoints",
        header: "Points",
        align: "center",
        sortable: true,
        getSortValue: (c) => c.loyaltyPoints || 0,
        render: (c) => <span className="text-xs font-bold text-amber-700 tabular-nums">{c.loyaltyPoints || 0}</span>,
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        sortable: true,
        render: (c) => {
          const isActive = c.status === "ACTIVE";
          return (
            <span
              className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80"
                  : "bg-rose-50 text-rose-700 border border-rose-200/80"
              }`}
            >
              {c.status || "ACTIVE"}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (c) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleOpenDrawer(c.id)}
              className="rounded-sm p-1 text-gray-400 hover:bg-sky-50 hover:text-[#0284C7] transition cursor-pointer"
              title="Quick Drawer"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => handleOpenEdit(c)}
              className="rounded-sm p-1 text-gray-400 hover:bg-sky-50 hover:text-[#0284C7] transition cursor-pointer"
              title="Edit"
            >
              <Edit3 size={14} />
            </button>
            <Link
              href={`/customers/${c.id}`}
              className="rounded-sm p-1 text-gray-400 hover:bg-sky-50 hover:text-[#0284C7] transition cursor-pointer"
              title="Full Details"
            >
              <ArrowUpRight size={14} />
            </Link>
            <button
              onClick={() => setCustomerToDelete(c)}
              className="rounded-sm p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Deactivate"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="w-full space-y-5 pb-12">
      
      {/* ── Page Header ── */}
      <CustomBreadcrumb
        title="Customer Management"
        icon={<Users size={20} />}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Customers" }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <CustomButton
              variant="primary"
              size="sm"
              onClick={() => setIsGroupsModalOpen(true)}
            >
              <Layers size={14} />
              Groups ({groups.length})
            </CustomButton>

            <CustomButton
              variant="primary"
              size="sm"
              onClick={exportCSV}
            >
              <Download size={14} />
              Export CSV
            </CustomButton>

            <CustomButton
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
            >
              <UserPlus size={15} />
              Add Customer
            </CustomButton>
          </div>
        }
      />

      {/* ── Unified CustomStatCard Analytics Grid ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Customers */}
        <CustomStatCard
          label="Total Customers"
          value={statsLoading ? "—" : (stats?.total || 0).toLocaleString()}
          subtitle={`${stats?.active || 0} active · ৳${stats ? Math.round(stats.totalSalesValue).toLocaleString() : 0} volume`}
          icon={Users}
          tone="blue"
        />

        {/* Outstanding Receivables (Dues) */}
        <CustomStatCard
          label="Outstanding Due"
          value={statsLoading ? "—" : `৳${Math.round(stats?.totalDue || 0).toLocaleString()}`}
          subtitle={`${stats?.customersWithDue || 0} accounts pending`}
          icon={DollarSign}
          tone="red"
        />

        {/* VIP & High-Value */}
        <CustomStatCard
          label="VIP & Top Tier"
          value={statsLoading ? "—" : (stats?.vipCount || 0).toLocaleString()}
          subtitle={`(${stats?.wholesaleCount || 0} wholesale) · Top CRM tier`}
          icon={Award}
          tone="amber"
        />

        {/* Loyalty Points */}
        <CustomStatCard
          label="Loyalty Points"
          value={statsLoading ? "—" : (stats?.totalPoints || 0).toLocaleString()}
          subtitle="Redeemable at POS checkout"
          icon={Sparkles}
          tone="primary"
        />
      </div>

      {/* ── Segment Navigation Bar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-sky-100/90 pb-2 scrollbar-none">
        {segmentTabs.map((tab) => {
          const isActive = activeSegmentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSegmentTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 shrink-0 rounded-sm px-3 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${
                isActive
                  ? "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-xs font-bold"
                  : "bg-white text-gray-600 border border-sky-100/90 hover:bg-sky-50/60 hover:text-[#0284C7]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`rounded-sm px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : tab.isDue ? "bg-rose-100 text-rose-700" : "bg-sky-50 text-[#0284C7] border border-sky-200/60"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filter & Search Toolbar (CustomDropdownSelect & Theme Controls) ── */}
      <div className="rounded-sm border border-sky-100/90 bg-white p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
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
            className="w-full rounded-sm border border-sky-200/90 py-1.5 pl-9 pr-8 text-xs text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] focus:outline-none transition shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Custom Dropdowns & Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          {/* Groups Custom Dropdown */}
          <div className="w-36">
            <CustomDropdownSelect
              value={filterGroup}
              onChange={(val) => {
                setFilterGroup(val);
                setPage(1);
              }}
              options={[
                { label: "All Groups", value: "" },
                ...groups.map((g) => ({ label: g.name, value: g.id })),
              ]}
            />
          </div>

          {/* Status Custom Dropdown */}
          <div className="w-32">
            <CustomDropdownSelect
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setPage(1);
              }}
              options={[
                { label: "All Statuses", value: "" },
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
              ]}
            />
          </div>

          {/* Sort By Custom Dropdown */}
          <div className="w-36">
            <CustomDropdownSelect
              value={sortBy}
              onChange={(val) => {
                setSortBy(val);
                setPage(1);
              }}
              options={[
                { label: "Newest First", value: "createdAt" },
                { label: "Name (A-Z)", value: "name" },
                { label: "Highest Due", value: "currentDue" },
                { label: "Most Orders", value: "salesCount" },
                { label: "Loyalty Points", value: "loyaltyPoints" },
              ]}
            />
          </div>

          {/* Sort Direction Toggle */}
          <button
            onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-sm border border-sky-200/90 p-2 text-[#0369A1] hover:bg-sky-50 transition cursor-pointer shadow-2xs"
            title={`Sort Direction: ${sortDir.toUpperCase()}`}
          >
            <ArrowUpDown size={14} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-sm border border-sky-200/90 p-0.5 bg-sky-50/40 shadow-2xs">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-xs p-1 transition cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#0284C7] shadow-xs font-bold" : "text-gray-400 hover:text-gray-600"
              }`}
              title="Table View"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-xs p-1 transition cursor-pointer ${
                viewMode === "grid" ? "bg-white text-[#0284C7] shadow-xs font-bold" : "text-gray-400 hover:text-gray-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-sm border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
          <button onClick={loadCustomers} className="font-semibold underline hover:text-rose-900 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Customers Data View: Table or Grid ── */}
      {viewMode === "table" ? (
        <CustomTable
          columns={tableColumns}
          data={customers}
          loading={loading}
          emptyMessage={
            search || activeSegmentTab !== "ALL" || filterGroup || filterStatus
              ? "No customers matched your filter criteria."
              : "No customer records found. Start by adding your first customer."
          }
          showPagination={true}
          totalItems={pagination.total}
          currentPage={page}
          pageSize={perPage}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPerPage(newSize);
            setPage(1);
          }}
        />
      ) : (
        /* ── CLEAN CARD GRID VIEW ── */
        <div className="space-y-4">
          {customers.length === 0 && !loading ? (
            <div className="rounded-sm border-2 border-dashed border-sky-200/70 bg-white p-12 text-center shadow-xs">
              <Users size={32} className="mx-auto text-sky-300 mb-3" />
              <h3 className="text-sm font-bold text-gray-600">No Customers Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {search || activeSegmentTab !== "ALL" || filterGroup || filterStatus
                  ? "No customers matched your filter criteria."
                  : "Start by creating your first customer record."}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {(search || activeSegmentTab !== "ALL" || filterGroup || filterStatus) && (
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setActiveSegmentTab("ALL");
                      setFilterGroup("");
                      setFilterStatus("");
                      setPage(1);
                    }}
                    className="border-sky-200/90 text-[#0369A1]"
                  >
                    Clear Filters
                  </CustomButton>
                )}
                <CustomButton
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAdd}
                >
                  <UserPlus size={14} /> Add Customer
                </CustomButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {customers.map((c) => {
                const seg = segBadgeMap[c.segmentation || "REGULAR"] || segBadgeMap.REGULAR;
                const due = Number(c.currentDue || 0);
                const isDue = due > 0;

                return (
                  <div
                    key={c.id}
                    className="rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs hover:border-sky-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenDrawer(c.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 text-xs font-bold cursor-pointer hover:bg-sky-100 transition"
                          >
                            {getInitials(c.name)}
                          </button>
                          <div className="min-w-0">
                            <h3
                              onClick={() => handleOpenDrawer(c.id)}
                              className="font-bold text-gray-600 hover:text-[#0284C7] cursor-pointer transition text-xs truncate max-w-[150px]"
                            >
                              {c.name}
                            </h3>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              {c.phone || c.email || "No contact"}
                            </p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold ${seg.bg}`}>
                          {seg.label}
                        </span>
                      </div>

                      {/* Single-line metric pills */}
                      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-sky-100/90 pt-2.5">
                        <div className="flex items-center justify-between gap-1 rounded-sm border border-slate-200/80 bg-slate-50/70 px-2 py-1.5 shadow-2xs">
                          <span className="text-[11px] font-semibold text-gray-500">Due</span>
                          <span className={`text-[11px] font-bold tabular-nums ${isDue ? "text-rose-600" : "text-gray-600"}`}>
                            ৳{due.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 rounded-sm border border-sky-100/90 bg-sky-50/50 px-2 py-1.5 shadow-2xs">
                          <span className="text-[11px] font-semibold text-[#0369A1]">Orders</span>
                          <span className="text-[11px] font-bold text-[#0284C7] tabular-nums">{c._count?.sales || 0}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 rounded-sm border border-amber-200/80 bg-amber-50/50 px-2 py-1.5 shadow-2xs">
                          <span className="text-[11px] font-semibold text-amber-700">Points</span>
                          <span className="text-[11px] font-bold text-amber-700 tabular-nums">{c.loyaltyPoints || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-sky-100/90 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {c.phone && (
                          <a
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-1 text-[11px] font-bold hover:bg-emerald-100 transition shadow-2xs"
                            title="Chat on WhatsApp"
                          >
                            WhatsApp
                          </a>
                        )}
                        {isDue && (
                          <button
                            onClick={() => handleOpenCollectDue(c)}
                            className="rounded-sm bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-1 text-[11px] font-bold hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                          >
                            Collect Due
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDrawer(c.id)}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-sky-50 hover:text-[#0284C7] transition cursor-pointer"
                          title="Quick Drawer"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-sky-50 hover:text-[#0284C7] transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <Link
                          href={`/customers/${c.id}`}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-sky-50 hover:text-[#0284C7] transition cursor-pointer"
                          title="Full Details"
                        >
                          <ArrowUpRight size={14} />
                        </Link>
                        <button
                          onClick={() => setCustomerToDelete(c)}
                          className="rounded-sm p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Deactivate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid View Pagination Bar */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-sm border border-sky-100/90 bg-white p-3 shadow-2xs">
              <p className="text-xs text-gray-600 font-medium">
                Showing <strong className="font-bold text-[#0284C7]">{(page - 1) * perPage + 1}</strong> -{" "}
                <strong className="font-bold text-[#0284C7]">
                  {Math.min(page * perPage, pagination.total)}
                </strong>{" "}
                of <strong className="font-bold text-[#0284C7]">{pagination.total}</strong> customers
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-sm border border-sky-200/90 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-sky-50 hover:text-[#0284C7] disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft size={13} /> Prev
                </button>

                <span className="text-xs text-[#0284C7] font-bold px-1">
                  Page {page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1 rounded-sm border border-sky-200/90 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-sky-50 hover:text-[#0284C7] disabled:opacity-40 transition cursor-pointer"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
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

      {/* ── Standard ConfirmModal for Customer Deletion ── */}
      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate customer "${customerToDelete?.name}"? You can re-activate them anytime.`}
        confirmText="Deactivate"
        confirmVariant="danger"
        type="DANGER"
        loading={isDeleting}
      />

    </div>
  );
}
