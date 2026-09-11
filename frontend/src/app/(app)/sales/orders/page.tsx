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
import {
  UniversalInvoiceModal,
  type InvoiceData
} from "@/components/invoices/UniversalInvoiceModal";

interface OrderItem {
  id?: string;
  productId: string;
  name?: string;
  sku?: string;
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
  total: number;
  paidTotal: number;
  dueTotal: number;
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

const ORDER_TABS = [
  { id: "ALL", label: "All Sales Orders", icon: Layers },
  { id: "POS", label: "POS / Retail", icon: Store },
  { id: "B2B", label: "B2B / Corporate", icon: Building2 },
  { id: "ONLINE", label: "Online & Delivery", icon: Globe },
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
  DRAFT: { label: "Draft", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
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
  const [totalPages, setTotalPages] = useState(1);

  // Selected Order for Line Items / Invoice Modal
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<SalesOrder | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) params.set("search", search.trim());
      if (activeTab !== "ALL") params.set("source", activeTab);
      if (statusFilter) params.set("status", statusFilter);

      const res: any = await api.get(`/v1/sales/orders?${params.toString()}`);
      
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      
      const totalRecords = typeof res?.pagination?.total === "number"
        ? res.pagination.total
        : typeof res?.data?.total === "number"
        ? res.data.total
        : list.length;
      
      const totalPageCount = typeof res?.pagination?.totalPages === "number"
        ? res.pagination.totalPages
        : Math.max(1, Math.ceil(totalRecords / limit));

      setOrders(list);
      setTotal(totalRecords);
      setTotalPages(totalPageCount);
    } catch (err) {
      console.error("Failed to load sales orders:", err);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeTab, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Overall KPI Metrics
  const totalOrdersCount = total || orders.length;
  const totalOrderValue = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const fulfilledOrders = orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED");
  const fulfillmentRate = orders.length > 0 ? Math.round((fulfilledOrders.length / orders.length) * 100) : 94;
  const pendingPickingCount = orders.filter((o) => o.status === "PICKING" || o.status === "STOCK_RESERVED" || o.status === "CONFIRMED").length;

  function handleOpenInvoice(order: SalesOrder) {
    setActiveInvoice({
      id: order.id || order.orderNo,
      invoiceNo: order.orderNo,
      date: order.orderDate || order.createdAt || new Date().toISOString(),
      customer: {
        name: order.customer?.name || "Customer",
        phone: order.customer?.phone || undefined,
        address: order.customer?.address || undefined,
      },
      items: order.items && order.items.length > 0 ? order.items.map((it) => ({
        name: it.name || "Item",
        qty: it.qtyOrdered || 1,
        unitPrice: it.unitPrice || 0,
        total: it.lineTotal || ((it.qtyOrdered || 1) * (it.unitPrice || 0)),
      })) : [
        {
          name: "Sales Order Summary",
          qty: 1,
          unitPrice: Number(order.total || 0),
          total: Number(order.total || 0),
        }
      ],
      subTotal: Number(order.subtotal || order.total || 0),
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: Number(order.total || 0),
      paidTotal: Number(order.paidTotal || 0),
      dueTotal: Number(order.dueTotal || 0),
      paymentMethod: order.paymentStatus || "CASH",
      vertical: order.source === "B2B" ? "wholesale" : "retail",
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

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <PackageCheck size={22} className="text-primary-600" />
            Sales Orders & Fulfillment
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage corporate sales orders, stock reservations, order picking, delivery tracking & dispatch logistics.
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
            New POS Order
          </Link>
        </div>
      </div>

      {/* ── KPI Analytics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Sales Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {totalOrdersCount}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              active stream
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Omnichannel order fulfillments
          </p>
        </div>

        {/* Total Order Value */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Order Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              ৳{Math.round(totalOrderValue).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Cumulative sales order value
          </p>
        </div>

        {/* Fulfillment Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wider text-teal-700">Fulfillment Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {fulfillmentRate}%
            </span>
            <span className="text-xs font-medium text-teal-600">delivered</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            On-time delivery performance
          </p>
        </div>

        {/* Pending Picking & Dispatch */}
        <div 
          onClick={() => {
            setStatusFilter(statusFilter === "PICKING" ? "" : "PICKING");
            setPage(1);
          }}
          className={`rounded-xl border p-4 shadow-xs transition cursor-pointer ${
            statusFilter === "PICKING"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20"
              : "border-gray-200 bg-white hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700">Pending Dispatch</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {pendingPickingCount}
            </span>
            <span className="text-xs font-medium text-amber-600">in warehouse</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600/80 font-medium">
            Picking & stock reservations queued
          </p>
        </div>
      </div>

      {/* ── Source Segment Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none">
        {ORDER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
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
              <Icon size={13} className={isActive ? "text-white" : "text-gray-400"} />
              <span>{tab.label}</span>
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
            placeholder="Search order #, customer, cashier..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="STOCK_RESERVED">Stock Reserved</option>
            <option value="PICKING">Picking / Packing</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

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
            onClick={fetchOrders}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 transition"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
          </button>
        </div>
      </div>

      {/* ── Orders Data View ── */}
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-xs">
          <RefreshCw size={24} className="mx-auto animate-spin text-primary-600 mb-2" />
          <p className="text-xs font-semibold text-gray-700">Loading sales orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-xs">
          <Package size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-sm font-bold text-gray-900">No Sales Orders Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {search || activeTab !== "ALL" || statusFilter
              ? "No orders matched your filter criteria."
              : "Sales orders from POS, Wholesale, and online checkouts will appear here."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
            >
              <Store size={14} /> Create Order via POS
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
                  <th className="px-4 py-3">Order # & Source</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Order Date</th>
                  <th className="px-3 py-3">Line Items</th>
                  <th className="px-3 py-3 text-right">Order Total</th>
                  <th className="px-3 py-3 text-right">Paid / Due</th>
                  <th className="px-3 py-3 text-center">Fulfillment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.CONFIRMED;
                  const total = Number(o.total || 0);
                  const paid = Number(o.paidTotal || 0);
                  const due = Number(o.dueTotal || 0);

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Order No & Source */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setSelectedOrderForDrawer(o)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-200/50 text-xs font-bold hover:bg-primary-100 transition"
                          >
                            <Package size={14} />
                          </button>
                          <div>
                            <button
                              onClick={() => setSelectedOrderForDrawer(o)}
                              className="font-bold text-gray-900 hover:text-primary-600 text-left transition block"
                            >
                              {o.orderNo}
                            </button>
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.2 text-[9px] font-bold text-gray-600 mt-0.5">
                              {o.source || "POS"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-3 py-3">
                        <div>
                          <p className="font-semibold text-gray-800">{o.customer?.name || "Walk-in Customer"}</p>
                          {o.customer?.phone ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                              <a href={`tel:${o.customer.phone}`} className="hover:text-primary-600 transition">
                                {o.customer.phone}
                              </a>
                              <a
                                href={`https://wa.me/${o.customer.phone.replace(/[^0-9]/g, "")}`}
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

                      {/* Order Date */}
                      <td className="px-3 py-3 text-gray-600 text-[11px]">
                        {new Date(o.orderDate || o.createdAt).toLocaleDateString()}
                      </td>

                      {/* Line Items */}
                      <td className="px-3 py-3 text-gray-700">
                        <span className="font-medium">{o.items?.length || 1} items</span>
                      </td>

                      {/* Total */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-gray-900 text-xs">
                          ৳{total.toLocaleString()}
                        </span>
                      </td>

                      {/* Paid / Due */}
                      <td className="px-3 py-3 text-right">
                        <div>
                          <span className="font-semibold text-emerald-600 text-xs">
                            ৳{paid.toLocaleString()}
                          </span>
                          {due > 0 && (
                            <p className="text-[10px] text-rose-600 font-bold">
                              Due: ৳{due.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedOrderForDrawer(o)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            title="Order Line Items"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenInvoice(o)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                            title="Print Invoice"
                          >
                            <Printer size={14} />
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
          {orders.map((o) => {
            const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.CONFIRMED;
            const total = Number(o.total || 0);
            const paid = Number(o.paidTotal || 0);
            const due = Number(o.dueTotal || 0);

            return (
              <div
                key={o.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-gray-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        onClick={() => setSelectedOrderForDrawer(o)}
                        className="font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition text-xs"
                      >
                        {o.orderNo}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {o.customer?.name || "Walk-in"} &bull; {o.source || "POS"}
                      </p>
                    </div>

                    <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[9px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-gray-100 text-center">
                    <div className="rounded bg-gray-50 p-2">
                      <span className="text-[10px] text-gray-400 font-medium block">Total Value</span>
                      <span className="text-xs font-bold text-gray-900">৳{total.toLocaleString()}</span>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <span className="text-[10px] text-gray-400 font-medium block">Paid</span>
                      <span className="text-xs font-bold text-emerald-600">৳{paid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {o.items?.length || 1} items
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenInvoice(o)}
                      className="rounded bg-primary-50 text-primary-700 px-2 py-0.5 text-[11px] font-semibold hover:bg-primary-100"
                    >
                      Invoice
                    </button>
                    <button
                      onClick={() => setSelectedOrderForDrawer(o)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
            Showing <span className="font-semibold text-gray-800">{(page - 1) * limit + 1}</span> -{" "}
            <span className="font-semibold text-gray-800">
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span className="font-semibold text-gray-800">{total}</span> orders
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
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 transition"
                >
                  <X size={18} />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-200 font-bold">
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{selectedOrderForDrawer.orderNo}</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Source: {selectedOrderForDrawer.source || "POS"} &bull; {new Date(selectedOrderForDrawer.createdAt || selectedOrderForDrawer.orderDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_CONFIG[selectedOrderForDrawer.status]?.bg || "bg-gray-50"
                  } ${STATUS_CONFIG[selectedOrderForDrawer.status]?.text || "text-gray-700"}`}>
                    {STATUS_CONFIG[selectedOrderForDrawer.status]?.label || selectedOrderForDrawer.status}
                  </span>

                  <span className="text-xs font-bold text-gray-900">
                    ৳{Number(selectedOrderForDrawer.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* Customer Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Customer Details</span>
                  <p className="font-bold text-sm text-gray-900">{selectedOrderForDrawer.customer?.name || "Walk-in Customer"}</p>
                  {selectedOrderForDrawer.customer?.phone && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${selectedOrderForDrawer.customer.phone}`}
                        className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-gray-700 hover:bg-gray-50"
                      >
                        <Phone size={10} /> Call
                      </a>
                      <a
                        href={`https://wa.me/${selectedOrderForDrawer.customer.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 font-semibold hover:bg-emerald-100"
                      >
                        <MessageSquare size={10} /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Fulfillment Breakdown Table */}
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Ordered Line Items</span>
                  <div className="divide-y divide-gray-100">
                    {(selectedOrderForDrawer.items || []).map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{it.name || `Item #${idx + 1}`}</p>
                          <p className="text-[11px] text-gray-400">
                            Ordered: {it.qtyOrdered || 1} &times; ৳{Number(it.unitPrice || 0).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-bold text-gray-900">
                          ৳{Number(it.lineTotal || ((it.qtyOrdered || 1) * (it.unitPrice || 0))).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Financial Settlement</span>
                  <div className="flex justify-between text-gray-600">
                    <span>Order Total:</span>
                    <span className="font-bold text-gray-900">৳{Number(selectedOrderForDrawer.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Paid Amount:</span>
                    <span className="font-bold">৳{Number(selectedOrderForDrawer.paidTotal || 0).toLocaleString()}</span>
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
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
                >
                  <Printer size={13} /> Print Order Invoice
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Universal Invoice Print Modal ── */}
      <UniversalInvoiceModal
        open={Boolean(activeInvoice)}
        onClose={() => setActiveInvoice(null)}
        invoice={activeInvoice || undefined}
      />

    </div>
  );
}
