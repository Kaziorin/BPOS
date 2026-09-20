"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  FileText,
  XCircle,
  CheckCircle2,
  Clock,
  Store,
  Building2,
  Globe,
  RotateCcw,
  Eye,
  DollarSign,
  ShoppingCart,
  Calendar,
  Layers,
  Phone,
  User,
  CreditCard,
  Printer,
  Download,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  MessageSquare,
  PackageCheck,
  ShieldAlert
} from "lucide-react";
import { api } from "@/lib/api";
import { SaleReceiptViewModal, type ReceiptViewData } from "@/components/pos/SaleReceiptViewModal";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomCard,
  CustomTable,
  CustomTabs,
  CustomInput,
  CustomStatCard,
  type CustomTableColumn,
  type TabItem,
} from "@/components/custom";

interface OrderItem {
  id?: string;
  productId: string;
  name?: string;
  sku?: string;
  qty?: number;
  qtyOrdered: number;
  qtyReserved?: number;
  qtyDelivered?: number;
  qtyBackordered?: number;
  unitPrice: number;
  lineTotal: number;
}

interface SalesOrder {
  id: string;
  orderNo: string;
  source: string;
  status: string;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  serviceCharge?: number;
  total: number;
  paidTotal: number;
  dueTotal: number;
  changeReturn?: number;
  change?: number;
  returnAmount?: number;
  orderDate: string;
  createdAt: string;
  branchName?: string;
  paymentStatus?: string;
  cashierId?: string;
  cashierName?: string;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  items: OrderItem[];
}

const ORDER_TABS: TabItem[] = [
  { id: "ALL", label: "All Sales Orders", icon: <Layers size={14} /> },
  { id: "B2B", label: "Wholesale & B2B", icon: <Truck size={14} /> },
  { id: "POS", label: "Retail POS", icon: <Store size={14} /> },
  { id: "RESTAURANT", label: "Restaurant Orders", icon: <ShoppingCart size={14} /> },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  PAID: { label: "Paid", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  PARTIALLY_PAID: { label: "Partial Paid", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  STOCK_RESERVED: { label: "Stock Reserved", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  PICKING: { label: "Picking / Packing", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  PARTIALLY_DELIVERED: { label: "Partially Delivered", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  DRAFT: { label: "Draft", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  BACKORDERED: { label: "Backordered", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Order for Invoice Modal
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<SalesOrder | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<ReceiptViewData | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (activeTab && activeTab !== "ALL") params.set("source", activeTab);
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res: any = await api.get(`/v1/sales/orders?${params.toString()}`);
      
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      
      const pagination = res?.pagination || res?.extra?.pagination || res?.data?.pagination;

      const totalRecords = typeof pagination?.total === "number"
        ? pagination.total
        : list.length;
      
      const totalPageCount = typeof pagination?.totalPages === "number"
        ? pagination.totalPages
        : Math.max(1, Math.ceil(totalRecords / limit));

      const vol = typeof pagination?.totalVolume === "number" ? pagination.totalVolume : 0;

      setOrders(list);
      setTotal(totalRecords);
      setTotalPages(totalPageCount);
      setTotalVolume(vol);
    } catch (err) {
      console.error("Failed to load sales orders:", err);
      setOrders([]);
      setTotal(0);
      setTotalVolume(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Overall KPI Metrics
  const totalOrdersCount = total || orders.length;
  const totalOrderValue = totalVolume || orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const fulfilledOrders = orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED");
  const fulfillmentRate = orders.length > 0 ? Math.round((fulfilledOrders.length / orders.length) * 100) : 94;
  const pendingPickingCount = orders.filter((o) => o.status === "PICKING" || o.status === "STOCK_RESERVED" || o.status === "CONFIRMED").length;

  function handleOpenInvoice(order: SalesOrder) {
    const rawPaid = Number(order.paidTotal ?? (order as any).paidAmount ?? order.total ?? 0);
    const orderTotal = Number(order.total || 0);
    const rawChange = Math.max(
      0,
      Number(
        order.changeReturn ??
        order.change ??
        order.returnAmount ??
        (order as any).change_return ??
        (rawPaid > orderTotal ? rawPaid - orderTotal : 0)
      )
    );

    setActiveInvoice({
      invoiceNo: order.orderNo,
      createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
      customerName: order.customer?.name || "Customer",
      cashierName: order.cashierName || "Admin",
      items: order.items && order.items.length > 0
        ? order.items.map((it) => ({
            id: it.id,
            name: it.name || "Item",
            sku: it.sku,
            productId: it.productId,
            qty: Number(it.qtyOrdered || it.qty || 1),
            unitPrice: Number(it.unitPrice || 0),
            lineTotal: Number(it.lineTotal || ((Number(it.qtyOrdered || 1)) * Number(it.unitPrice || 0))),
          }))
        : [{
            name: "Sales Order Summary",
            qty: 1,
            unitPrice: Number(order.total || 0),
            lineTotal: Number(order.total || 0),
          }],
      subtotal: order.subtotal !== undefined ? Number(order.subtotal) : undefined,
      discountTotal: order.discountTotal !== undefined ? Number(order.discountTotal) : Number((order as any).discount || 0),
      taxTotal: order.taxTotal !== undefined ? Number(order.taxTotal) : Number((order as any).tax || 0),
      serviceCharge: order.serviceCharge !== undefined ? Number(order.serviceCharge) : Number((order as any).service_charge || 0),
      total: orderTotal,
      paidTotal: rawPaid,
      dueTotal: Number(order.dueTotal || 0),
      changeReturn: rawChange,
      paymentMethod: (order as any).paymentMethod || "CASH",
    });
  }

  function exportCSV() {
    if (orders.length === 0) {
      alert("No sales orders to export");
      return;
    }

    const headers = ["Order No", "Source", "Customer", "Phone", "Total (Tk)", "Paid (Tk)", "Due (Tk)", "Status", "Date"];
    const rows = orders.map((o) => [
      `"${o.orderNo || ""}"`,
      `"${o.source || "POS"}"`,
      `"${(o.customer?.name || "Customer").replace(/"/g, '""')}"`,
      `"${o.customer?.phone || ""}"`,
      Number(o.total || 0).toFixed(2),
      Number(o.paidTotal || 0).toFixed(2),
      Number(o.dueTotal || 0).toFixed(2),
      o.status || "CONFIRMED",
      `"${new Date(o.createdAt || o.orderDate).toLocaleDateString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const columns: CustomTableColumn<SalesOrder>[] = [
    {
      key: "orderNo",
      header: "Order # & Source",
      sortable: true,
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedOrderForDrawer(o)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-brand-primary border border-brand-border text-xs font-bold hover:bg-brand-100 transition cursor-pointer"
          >
            <Package size={14} />
          </button>
          <div>
            <button
              type="button"
              onClick={() => setSelectedOrderForDrawer(o)}
              className="font-bold text-gray-600 hover:text-brand-primary text-left transition block cursor-pointer"
            >
              {o.orderNo}
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              {o.customer?.name && o.customer.name !== "Walk-in" ? o.customer.name : "Walk-in"} • {o.source || "POS"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "orderDate",
      header: "Order Date",
      sortable: true,
      render: (o) => (
        <span className="text-slate-600 text-xs font-medium">
          {new Date(o.orderDate || o.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "items",
      header: "Line Items",
      render: (o) => (
        <span className="font-semibold text-slate-600 text-xs">
          {o.items?.length || 1} items
        </span>
      ),
    },
    {
      key: "total",
      header: "Order Total",
      align: "right",
      sortable: true,
      render: (o) => (
        <span className="font-bold text-gray-600 text-xs tabular-nums">
          ৳{Number(o.total || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "paidTotal",
      header: "Paid / Due",
      align: "right",
      render: (o) => {
        const paid = Number(o.paidTotal || 0);
        const due = Number(o.dueTotal || 0);
        return (
          <div className="text-right">
            <span className="font-semibold text-emerald-600 text-xs tabular-nums block">
              ৳{paid.toLocaleString()}
            </span>
            {due > 0 && (
              <span className="text-[10px] text-rose-600 font-bold tabular-nums block">
                Due: ৳{due.toLocaleString()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Fulfillment Status",
      align: "center",
      render: (o) => {
        const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.CONFIRMED;
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedOrderForDrawer(o)}
            className="rounded-sm p-1.5 text-slate-400 hover:bg-slate-100 hover:text-gray-600 transition cursor-pointer"
            title="Order Line Items"
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenInvoice(o)}
            className="rounded-sm p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-primary transition cursor-pointer"
            title="Print Invoice"
          >
            <Printer size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 w-full max-w-full pb-12">
      
      <CustomBreadcrumb
        title="Sales Orders"
        subtitle="View and manage all restaurant dine-in, takeaway and delivery orders."
        icon={<PackageCheck size={20} />}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Sales", href: "/sales" },
          { label: "Orders" },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/sales/quotations">
              <CustomButton variant="outline" leftIcon={<FileText size={14} />}>Quotations</CustomButton>
            </Link>
            <CustomButton variant="outline" leftIcon={<Download size={14} />} onClick={exportCSV}>Export CSV</CustomButton>
            <Link href="/retail-pos">
              <CustomButton leftIcon={<Store size={14} />}>New POS Order</CustomButton>
            </Link>
          </div>
        }
      />

      {/* ── KPI Analytics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <CustomStatCard
          label="Total Sales Orders"
          value={String(totalOrdersCount)}
          icon={Package}
          tone="primary"
          subtitle="Active order stream"
        />
        <CustomStatCard
          label="Order Volume"
          value={`৳${Math.round(totalOrderValue).toLocaleString()}`}
          icon={DollarSign}
          tone="green"
          subtitle="Cumulative sales value"
        />
        <CustomStatCard
          label="Fulfillment Rate"
          value={`${fulfillmentRate}%`}
          icon={CheckCircle2}
          tone="blue"
          subtitle="On-time delivery"
        />
        <div
          onClick={() => {
            setStatusFilter(statusFilter === "PICKING" ? "" : "PICKING");
            setPage(1);
          }}
          className="cursor-pointer"
        >
          <CustomStatCard
            label="Pending Dispatch"
            value={String(pendingPickingCount)}
            icon={Truck}
            tone="amber"
            subtitle="Queued in warehouse"
            className={statusFilter === "PICKING" ? "ring-2 ring-amber-500 shadow-md" : ""}
          />
        </div>
      </div>

      {/* ── Source Segment Navigation Tabs ── */}
      <CustomTabs
        tabs={ORDER_TABS}
        activeTab={activeTab}
        onChange={(tabId) => {
          setActiveTab(tabId);
          setPage(1);
        }}
        themeColor="primary"
      />

      {/* ── Main Unified Card: Search, Filter, Table & Pagination in ONE Card ── */}
      <CustomCard
        title="Sales Orders Directory"
        subtitle="View, track and manage omnichannel sales orders and invoices"
        icon={<PackageCheck size={18} className="text-brand-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-primary border border-brand-border">
              {total} Orders
            </span>
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-sm border border-brand-border p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-sm p-1 transition cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-brand-primary shadow-2xs font-bold"
                    : "text-slate-400 hover:text-gray-600"
                }`}
                title="Table View"
              >
                <LayoutList size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-sm p-1 transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-brand-primary shadow-2xs font-bold"
                    : "text-slate-400 hover:text-gray-600"
                }`}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="rounded-sm border border-brand-border bg-white p-1.5 text-slate-600 hover:bg-brand-50 hover:text-brand-primary transition shadow-2xs cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-brand-primary" : ""} />
            </button>
          </div>
        }
        bodyClassName="p-0"
      >
        {/* ── Toolbar: Search & Filter inside the Card ── */}
        <div className="border-b border-brand-light p-3.5 bg-brand-50/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input using CustomInput */}
          <div className="w-full sm:w-80">
            <CustomInput
              placeholder="Search order #, customer, cashier..."
              leftIcon={<Search size={14} className="text-slate-400" />}
              rightIcon={
                search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="text-slate-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                ) : null
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-slate-600 focus:border-brand-primary focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="STOCK_RESERVED">Stock Reserved</option>
              <option value="PICKING">Picking / Packing</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ── Table View or Grid View inside the same Card ── */}
        {viewMode === "table" ? (
          <CustomTable<SalesOrder>
            columns={columns}
            data={orders}
            loading={loading}
            totalItems={total}
            currentPage={page}
            pageSize={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setLimit(newSize);
              setPage(1);
            }}
            showPagination={true}
            emptyMessage={
              search || statusFilter
                ? "No sales orders matched your filter criteria."
                : "Restaurant and POS orders will appear here after placing an order."
            }
          />
        ) : (
          <div className="p-4 sm:p-5 space-y-4">
            {loading ? (
              <div className="flex h-36 items-center justify-center p-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
                  <span className="text-xs font-semibold text-slate-500">Loading records...</span>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-500">
                  {search || statusFilter
                    ? "No sales orders matched your filter criteria."
                    : "No sales orders found."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                {orders.map((o) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.CONFIRMED;
                  const totalAmt = Number(o.total || 0);
                  const paid = Number(o.paidTotal || 0);
                  return (
                    <div
                      key={o.id}
                      className="rounded-sm border border-brand-border bg-white p-4 shadow-2xs hover:border-brand-primary/40 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              onClick={() => setSelectedOrderForDrawer(o)}
                              className="font-bold text-gray-600 hover:text-brand-primary cursor-pointer transition text-xs"
                            >
                              {o.orderNo}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {o.customer?.name && o.customer.name !== "Walk-in" ? o.customer.name : "—"} • {o.source || "POS"}
                            </p>
                          </div>

                          <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[9px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-center">
                          <div className="rounded-sm bg-slate-50 p-2">
                            <span className="text-[10px] text-slate-400 font-medium block">Total Value</span>
                            <span className="text-xs font-bold text-gray-600 tabular-nums">৳{totalAmt.toLocaleString()}</span>
                          </div>
                          <div className="rounded-sm bg-slate-50 p-2">
                            <span className="text-[10px] text-slate-400 font-medium block">Paid</span>
                            <span className="text-xs font-bold text-emerald-600 tabular-nums">৳{paid.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {o.items?.length || 1} items
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(o)}
                            className="rounded-sm bg-brand-50 text-brand-primary px-2 py-0.5 text-[11px] font-semibold hover:bg-brand-100 cursor-pointer"
                          >
                            Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDrawer(o)}
                            className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-gray-600 cursor-pointer"
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

            {/* Pagination for Grid View */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-brand-border text-xs text-slate-600 font-medium">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-gray-600">{(page - 1) * limit + 1}</span>–
                  <span className="font-semibold text-gray-600">{Math.min(page * limit, total)}</span> of{" "}
                  <span className="font-semibold text-gray-600">{total}</span> orders
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-sm border border-brand-border px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-brand-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span className="text-xs text-slate-600 font-medium px-1">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 rounded-sm border border-brand-border px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-brand-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CustomCard>

      {/* ── ORDER LINE ITEMS SLIDE-OVER DRAWER ── */}
      {selectedOrderForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-100">
          <div
            onClick={() => setSelectedOrderForDrawer(null)}
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-150">
              
              {/* Drawer Header */}
              <div className="border-b border-gray-200 bg-gray-50/80 p-5 relative">
                <button
                  onClick={() => setSelectedOrderForDrawer(null)}
                  className="absolute right-4 top-4 rounded-sm p-1.5 text-gray-400 hover:bg-gray-200/60 transition"
                >
                  <X size={18} />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary-50 text-primary-700 border border-primary-200 font-bold">
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-600">{selectedOrderForDrawer.orderNo}</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Source: {selectedOrderForDrawer.source || "POS"} &bull; {new Date(selectedOrderForDrawer.createdAt || selectedOrderForDrawer.orderDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_CONFIG[selectedOrderForDrawer.status]?.bg || "bg-gray-50"
                  } ${STATUS_CONFIG[selectedOrderForDrawer.status]?.text || "text-gray-600"}`}>
                    {STATUS_CONFIG[selectedOrderForDrawer.status]?.label || selectedOrderForDrawer.status}
                  </span>

                  <span className="text-xs font-bold text-gray-600">
                    ৳{Number(selectedOrderForDrawer.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* Customer Card */}
                <div className="rounded-sm border border-gray-200 bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-gray-500 block">Customer Details</span>
                  <p className="font-bold text-sm text-gray-600">{selectedOrderForDrawer.customer?.name && selectedOrderForDrawer.customer.name !== "Walk-in" ? selectedOrderForDrawer.customer.name : "—"}</p>
                  {selectedOrderForDrawer.customer?.phone && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${selectedOrderForDrawer.customer.phone}`}
                        className="inline-flex items-center gap-1 rounded-sm border border-gray-200 px-2 py-0.5 text-gray-600 hover:bg-gray-50"
                      >
                        <Phone size={10} /> Call
                      </a>
                      <a
                        href={`https://wa.me/${selectedOrderForDrawer.customer.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 text-emerald-700 px-2 py-0.5 font-semibold hover:bg-emerald-100"
                      >
                        <MessageSquare size={10} /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Fulfillment Breakdown Table */}
                <div className="rounded-sm border border-gray-200 bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-gray-500 block">Ordered Line Items</span>
                  <div className="divide-y divide-gray-100">
                    {(selectedOrderForDrawer.items || []).map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-600">{it.name || `Item #${idx + 1}`}</p>
                          <p className="text-[11px] text-gray-400">
                            Ordered: {it.qtyOrdered || 1} &times; ৳{Number(it.unitPrice || 0).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-bold text-gray-600">
                          ৳{Number(it.lineTotal || ((it.qtyOrdered || 1) * (it.unitPrice || 0))).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="rounded-sm border border-gray-200 bg-gray-50/50 p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">Financial Settlement</span>
                  <div className="flex justify-between text-gray-600">
                    <span>Order Total:</span>
                    <span className="font-bold text-gray-600">৳{Number(selectedOrderForDrawer.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Paid Amount:</span>
                    <span className="font-bold">৳{Number(selectedOrderForDrawer.paidTotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-primary">
                    <span>Return Amount:</span>
                    <span className="font-bold">
                      ৳{Number(
                        selectedOrderForDrawer.changeReturn ??
                        selectedOrderForDrawer.change ??
                        (Number(selectedOrderForDrawer.paidTotal || 0) > Number(selectedOrderForDrawer.total || 0)
                          ? Number(selectedOrderForDrawer.paidTotal || 0) - Number(selectedOrderForDrawer.total || 0)
                          : 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-600 pt-1 border-t border-gray-200">
                    <span>Remaining Due:</span>
                    <span className="font-bold">৳{Number(selectedOrderForDrawer.dueTotal || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-gray-200 bg-gray-50/80 p-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenInvoice(selectedOrderForDrawer)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-primary-600 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
                >
                  <Printer size={13} /> Print Order Invoice
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── POS-style Receipt View Modal ── */}
      <SaleReceiptViewModal
        open={Boolean(activeInvoice)}
        data={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />

    </div>
  );
}
