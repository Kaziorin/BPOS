"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown, ChevronUp, Package, Truck, FileText, XCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface OrderItem {
  id: string;
  productId: string;
  name?: string;
  qtyOrdered: number;
  qtyReserved: number;
  qtyDelivered: number;
  qtyBackordered: number;
  unitPrice: number;
  lineTotal: number;
}

interface SalesOrder {
  id: string;
  orderNo: string;
  source: string;
  status: string;
  total: number;
  paidTotal: number;
  orderDate: string;
  expectedDate?: string | null;
  createdAt: string;
  customer?: { id: string; name: string; phone?: string } | null;
  quotation?: { id: string; quotationNo: string } | null;
  items: OrderItem[];
  deliveries?: { id: string; deliveryNo: string; deliveredAt: string; items: any[] }[];
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  CONFIRMED: "bg-blue-50 text-blue-700",
  STOCK_RESERVED: "bg-indigo-50 text-indigo-700",
  PICKING: "bg-purple-50 text-purple-700",
  PARTIALLY_DELIVERED: "bg-yellow-50 text-yellow-700",
  DELIVERED: "bg-green-50 text-green-700",
  INVOICED: "bg-teal-50 text-teal-700",
  PARTIALLY_PAID: "bg-orange-50 text-orange-700",
  PAID: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-50 text-red-600",
  BACKORDERED: "bg-orange-50 text-orange-700",
};

// Which action buttons to show per status
const ACTIONS: Record<string, string[]> = {
  DRAFT: ["confirm", "cancel"],
  CONFIRMED: ["reserve", "cancel"],
  STOCK_RESERVED: ["pick", "cancel"],
  BACKORDERED: ["pick", "cancel"],
  PICKING: ["deliver", "invoice"],
  PARTIALLY_DELIVERED: ["deliver", "invoice"],
  DELIVERED: ["invoice"],
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r: any = await api.get("/v1/sales/orders");
      setOrders(r.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function doAction(order: SalesOrder, action: string) {
    setActionLoading(`${order.id}-${action}`);
    try {
      if (action === "confirm") {
        await api.post(`/v1/sales/orders/${order.id}/confirm`);
      } else if (action === "reserve") {
        const warehouseId = "default";
        await api.post(`/v1/sales/orders/${order.id}/reserve-stock`, { warehouseId });
      } else if (action === "pick") {
        await api.post(`/v1/sales/orders/${order.id}/start-picking`);
      } else if (action === "deliver") {
        const warehouseId = "default";
        const items = order.items
          .filter((i) => Number(i.qtyOrdered) - Number(i.qtyDelivered) > 0)
          .map((i) => ({
            salesOrderItemId: i.id,
            productId: i.productId,
            qtyDelivered: Number(i.qtyOrdered) - Number(i.qtyDelivered),
          }));
        if (items.length === 0) return;
        await api.post(`/v1/sales/orders/${order.id}/deliver`, { warehouseId, items });
      } else if (action === "invoice") {
        const branchId = "default";
        await api.post(`/v1/sales/orders/${order.id}/invoice`, { branchId });
      } else if (action === "cancel") {
        const warehouseId = "default";
        const reason = "Order Cancelled";
        await api.post(`/v1/sales/orders/${order.id}/cancel`, { warehouseId, reason });
      }
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error ?? e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const actionIcon: Record<string, React.ReactNode> = {
    confirm: <CheckCircle size={11} />,
    reserve: <Package size={11} />,
    pick: <Package size={11} />,
    deliver: <Truck size={11} />,
    invoice: <FileText size={11} />,
    cancel: <XCircle size={11} />,
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-500">Confirmed → Reserved → Picking → Delivery → Invoice</p>
        </div>
        <Link href="/sales/quotations" className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
          <Plus size={15} /> New from Quotation
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
          No sales orders yet. Convert a quotation to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-800">{order.orderNo}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{order.source}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {order.customer?.name ?? "No customer"}
                    {order.quotation && ` · from ${order.quotation.quotationNo}`}
                    {" · "}{new Date(order.orderDate).toLocaleDateString()}
                    {order.expectedDate && ` · Expected ${new Date(order.expectedDate).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">৳{Number(order.total).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{order.items.length} items</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {(ACTIONS[order.status] ?? []).map((action) => (
                    <button
                      key={action}
                      onClick={() => doAction(order, action)}
                      disabled={actionLoading === `${order.id}-${action}`}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                        action === "cancel"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {actionIcon[action]}
                      {action}
                    </button>
                  ))}
                </div>

                <button onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="text-gray-400 hover:text-gray-600">
                  {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Line items with fulfillment progress */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Order Lines</h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-400">
                            <th className="pb-1">Product</th>
                            <th className="pb-1 text-right">Ordered</th>
                            <th className="pb-1 text-right">Reserved</th>
                            <th className="pb-1 text-right">Delivered</th>
                            <th className="pb-1 text-right">Backorder</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {order.items.map((item) => {
                            const pct = Number(item.qtyOrdered) > 0
                              ? Math.round((Number(item.qtyDelivered) / Number(item.qtyOrdered)) * 100)
                              : 0;
                            return (
                              <tr key={item.id}>
                                <td className="py-1.5 text-gray-700">{item.name || item.productId}</td>
                                <td className="py-1.5 text-right text-gray-600">{Number(item.qtyOrdered)}</td>
                                <td className="py-1.5 text-right text-indigo-600">{Number(item.qtyReserved)}</td>
                                <td className="py-1.5 text-right">
                                  <span className={Number(item.qtyDelivered) >= Number(item.qtyOrdered) ? "text-green-600 font-medium" : "text-gray-600"}>
                                    {Number(item.qtyDelivered)}
                                  </span>
                                  <span className="ml-1 text-gray-400">({pct}%)</span>
                                </td>
                                <td className="py-1.5 text-right">
                                  {Number(item.qtyBackordered) > 0 ? (
                                    <span className="font-medium text-orange-600">{Number(item.qtyBackordered)}</span>
                                  ) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Delivery history */}
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <Truck size={11} className="mr-1 inline" />Delivery History
                      </h3>
                      {order.deliveries && order.deliveries.length > 0 ? (
                        <div className="space-y-1.5">
                          {order.deliveries.map((d) => (
                            <div key={d.id} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">{d.deliveryNo}</span>
                                <span className="text-gray-400">{new Date(d.deliveredAt).toLocaleDateString()}</span>
                              </div>
                              <div className="mt-0.5 text-gray-500">{d.items.length} items delivered</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No deliveries yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
