"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
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
  Printer
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import {
  UniversalInvoiceModal,
  type InvoiceData
} from "@/components/invoices/UniversalInvoiceModal";

interface OrderItem {
  id: string;
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
  } | null;
  items: OrderItem[];
}

const ORDER_TABS = [
  { id: "ALL", label: "All Sales Orders", icon: Layers },
  { id: "POS", label: "POS / Retail", icon: Store },
  { id: "B2B", label: "B2B / Corporate", icon: Building2 },
  { id: "ONLINE", label: "Online & Delivery", icon: Globe },
];

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  STOCK_RESERVED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PICKING: "bg-purple-50 text-purple-700 border-purple-200",
  PARTIALLY_DELIVERED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  DRAFT: "bg-slate-50 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  BACKORDERED: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function SalesOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Order for Line Items / Invoice Modal
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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

  // Tab counts & summary metrics
  const metrics = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const paidRev = orders.reduce((sum, o) => sum + (Number(o.paidTotal) || 0), 0);
    const dueRev = orders.reduce((sum, o) => sum + (Number(o.dueTotal) || 0), 0);
    return {
      totalRevenue: totalRev,
      paidRevenue: paidRev,
      dueRevenue: dueRev,
      orderCount: total || orders.length,
    };
  }, [orders, total]);

  const handleOpenDetails = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handlePrintInvoice = (order: SalesOrder) => {
    const invoice: InvoiceData = {
      id: order.id,
      invoiceNo: order.orderNo,
      date: order.createdAt || order.orderDate || new Date().toISOString(),
      customer: {
        name: order.customer?.name || "Walk-in Customer",
        phone: order.customer?.phone || "",
        email: order.customer?.email || "",
      },
      items: order.items?.map((it) => ({
        name: it.name || "Item",
        sku: it.sku || "",
        qty: Number(it.qtyOrdered || 1),
        unitPrice: Number(it.unitPrice || 0),
        discountAmount: 0,
        taxAmount: 0,
        lineTotal: Number(it.lineTotal || (Number(it.qtyOrdered || 1) * Number(it.unitPrice || 0))),
      })) || [],
      subTotal: Number(order.subtotal || order.total),
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: Number(order.total),
      paidTotal: Number(order.paidTotal),
      dueTotal: Number(order.dueTotal),
      status: order.status,
      paymentMethod: "CASH",
      cashier: {
        id: order.cashierId || "",
        name: order.cashierName || user?.name || "Cashier",
      },
    };
    setActiveInvoice(invoice);
  };

  return (
    <div className="w-full max-w-full space-y-5 p-4 sm:p-6 bg-slate-50/50 min-h-screen">
      {/* Custom Breadcrumb Header */}
      <CustomBreadcrumb
        title="Sales & Order Management"
        icon={<ShoppingCart size={20} />}
        items={[{ label: "Sales", href: "/sales" }, { label: "Sales Orders" }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/pos">
              <CustomButton size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                <Store size={14} className="mr-1.5" /> Open POS
              </CustomButton>
            </Link>
            <Link href="/sales/quotations">
              <CustomButton size="sm" variant="outline" className="text-xs">
                <Plus size={14} className="mr-1.5" /> New B2B Order
              </CustomButton>
            </Link>
          </div>
        }
      />

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <ShoppingCart size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{metrics.orderCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all integrated channels</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gross Sales Value</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">৳{metrics.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total booked order amount</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Collected Total</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">৳{metrics.paidRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payments cleared & settled</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Outstanding Due</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">৳{metrics.dueRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pending collection / credit</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 pt-3 overflow-x-auto bg-slate-50/40">
          {ORDER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-teal-600 text-teal-700 bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-lg"
                }`}
              >
                <Icon size={14} className={isActive ? "text-teal-600" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order/Invoice #, Customer name, Phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Reset Filters */}
            {(search || statusFilter || activeTab !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setActiveTab("ALL");
                  setPage(1);
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 hover:border-teal-300 transition"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Rows per page:
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Order / Invoice No</th>
                  <th className="px-5 py-3.5">Source</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5 text-right">Total Amount</th>
                  <th className="px-5 py-3.5 text-right">Paid</th>
                  <th className="px-5 py-3.5 text-center">Payment Status</th>
                  <th className="px-5 py-3.5 text-center">Order Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isPaid = Number(order.dueTotal || 0) <= 0 && Number(order.paidTotal || 0) > 0;
                  const isPartial = Number(order.dueTotal || 0) > 0 && Number(order.paidTotal || 0) > 0;
                  
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetails(order)}
                    >
                      {/* Order No */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-teal-700">
                            {order.orderNo}
                          </span>
                        </div>
                        {order.branchName && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {order.branchName}
                          </span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.source === "POS"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : order.source === "B2B"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {order.source}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        <div>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {order.customer?.name || "Walk-in Retail Customer"}
                        </div>
                        {order.customer?.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <Phone size={10} />
                            <span>{order.customer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <Package size={12} className="text-slate-400" />
                          {order.items?.length || 0} {order.items?.length === 1 ? "Item" : "Items"}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right font-bold text-slate-900 tabular-nums">
                        ৳{Number(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Paid */}
                      <td className="px-5 py-4 text-right font-bold text-emerald-600 tabular-nums">
                        ৳{Number(order.paidTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Payment Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isPartial
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isPaid ? "PAID" : isPartial ? "PARTIAL" : "UNPAID"}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            STATUS_COLOR[order.status] || "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {order.status || "CONFIRMED"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title="View / Print Invoice"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Order Details"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center text-slate-500">
                      <ShoppingCart size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No sales orders found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {search ? "No orders match your search criteria." : "Create sales via POS or B2B quotations to view orders here."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{orders.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{" "}
            <strong className="text-slate-800">{Math.min(page * limit, total)}</strong> of{" "}
            <strong className="text-slate-800">{total}</strong> total orders
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition cursor-pointer"
            >
              Previous
            </button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pNum = i + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`h-7 w-7 rounded-lg font-bold text-xs transition cursor-pointer ${
                      page === pNum
                        ? "bg-teal-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Order Item Details Modal */}
      <CustomModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details — ${selectedOrder?.orderNo || ""}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block">Customer</span>
                <span className="font-bold text-slate-800">{selectedOrder.customer?.name || "Walk-in"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Source</span>
                <span className="font-bold text-slate-800">{selectedOrder.source}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Amount</span>
                <span className="font-bold text-slate-900">৳{Number(selectedOrder.total).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-bold text-teal-700">{selectedOrder.status}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Ordered Items</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          {it.name || "Item"}
                          {it.sku && <span className="text-[10px] text-slate-400 block">{it.sku}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                          {it.qtyOrdered}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                          ৳{Number(it.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                          ৳{Number(it.lineTotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
              <CustomButton
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handlePrintInvoice(selectedOrder);
                }}
              >
                <Printer size={14} className="mr-1.5" /> Print Invoice
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Universal Invoice Modal Preview */}
      {activeInvoice && (
        <UniversalInvoiceModal
          open={!!activeInvoice}
          onClose={() => setActiveInvoice(null)}
          invoice={activeInvoice}
          verticalType="retail"
        />
      )}
    </div>
  );
}
