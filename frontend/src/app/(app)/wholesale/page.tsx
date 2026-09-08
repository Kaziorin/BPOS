"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Building2,
  Receipt,
  Search,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  RefreshCw,
  Printer,
  FileText,
  DollarSign,
  Users,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { UniversalInvoiceModal } from "@/components/invoices/UniversalInvoiceModal";

export default function WholesaleHubPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, custRes] = await Promise.all([
        api.get("/sales", { params: { limit: 50 } }),
        api.get("/customers", { params: { limit: 100 } }),
      ]);
      const oData = (ordersRes.data as any)?.data ?? ordersRes.data ?? [];
      const cData = (custRes.data as any)?.data ?? custRes.data ?? [];
      setOrders(Array.isArray(oData) ? oData : []);
      setCustomers(Array.isArray(cData) ? cData : []);
    } catch (err) {
      console.error("Failed to load wholesale data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalWholesaleVolume = orders.reduce((acc, o) => acc + Number(o.grandTotal || o.totalAmount || 0), 0);
  const totalB2BCustomers = customers.length;
  const creditDuesTotal = customers.reduce((acc, c) => acc + Number(c.balance || c.creditDue || 0), 0);

  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.invoiceNo && o.invoiceNo.toLowerCase().includes(q)) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.notes && o.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
            <Truck size={15} /> Industry Vertical 5 · Wholesale & Distribution
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Wholesale B2B Distribution Hub</h1>
          <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl">
            Commercial wholesale invoicing, customer credit limit checks, carton / pallet bulk pricing tiers, dispatch delivery challans & accounts receivable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/wholesale/pos"
            className="flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3.5 text-sm font-black text-slate-950 hover:bg-blue-400 shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5"
          >
            <Truck size={18} /> New Wholesale B2B Order
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Wholesale Volume</span>
            <TrendingUp size={18} className="text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{fmt(totalWholesaleVolume)}</p>
          <span className="text-[11px] text-slate-400">Total B2B invoiced value</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">B2B Accounts</span>
            <Building2 size={18} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalB2BCustomers}</p>
          <span className="text-[11px] text-slate-400">Registered commercial clients</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Credit Accounts Due</span>
            <DollarSign size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{fmt(creditDuesTotal)}</p>
          <span className="text-[11px] text-slate-400">Receivable trade dues</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dispatch Orders</span>
            <Truck size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{orders.length}</p>
          <span className="text-[11px] text-slate-400">Processed delivery orders</span>
        </div>
      </div>

      {/* Main Content: B2B Commercial Invoices & Client Credit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Commercial Wholesale Orders List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Wholesale Commercial Invoices & Challans</h3>
              <p className="text-xs text-slate-500">Track B2B dispatch orders, payment terms and delivery receipts</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:bg-white"
                />
              </div>
              <button
                onClick={loadData}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading wholesale orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No wholesale commercial orders found</p>
              <p className="text-xs">Create a new wholesale B2B order to generate commercial invoice and delivery challan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Order / Challan #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">B2B Client Name</th>
                    <th className="py-3 px-3 text-center">Items (Qty)</th>
                    <th className="py-3 px-3 text-right">Invoice Total (৳)</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {o.invoiceNo || `WS-${o.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString()}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{o.customer?.name || "Corporate Client"}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Payment: {o.paymentMethod || "CREDIT"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {(o.items || []).length} lines
                      </td>
                      <td className="py-3 px-3 text-right font-black tabular-nums text-slate-900">
                        {fmt(Number(o.grandTotal || o.totalAmount || 0))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 text-xs font-bold text-slate-700 transition"
                        >
                          Commercial Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: B2B Client Accounts & Credit Due Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Building2 size={16} className="text-blue-600" /> B2B Client Directory
              </h3>
              <p className="text-xs text-slate-500">Credit limits & outstanding balance</p>
            </div>
            <Link
              href="/customers/create"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              + Add Client
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {customers.slice(0, 15).map((c) => {
              const due = Number(c.balance || c.creditDue || 0);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 transition"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-slate-900 truncate text-xs">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.phone || c.email || "No contact info"}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black ${due > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                      {fmt(due)}
                    </span>
                    <span className="block text-[9px] text-slate-400">Outstanding Due</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/wholesale/pos"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 p-2.5 text-xs font-black text-blue-900 transition"
            >
              Launch B2B Ordering Register <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Specialized Wholesale B2B Challan Modal */}
      {selectedOrder && (
        <UniversalInvoiceModal
          data={{
            id: selectedOrder.id,
            invoiceNo: selectedOrder.invoiceNo || `WS-${selectedOrder.id.slice(0, 8)}`,
            challanNo: `CH-${selectedOrder.invoiceNo || selectedOrder.id.slice(0, 8)}`,
            saleDate: selectedOrder.createdAt,
            vertical: "wholesale",
            customer: selectedOrder.customer,
            items: (selectedOrder.items || []).map((it: any) => ({
              name: it.productName || it.product?.name || "B2B Commercial Product",
              productName: it.productName || it.product?.name || "B2B Commercial Product",
              qty: Number(it.qty || 1),
              unitPrice: Number(it.unitPrice || 0),
              sku: it.sku || "WS-SKU",
              uom: it.uom || "units",
            })),
            subTotal: Number(selectedOrder.subTotal || selectedOrder.grandTotal || selectedOrder.totalAmount || 0),
            grandTotal: Number(selectedOrder.grandTotal || selectedOrder.totalAmount || 0),
            paidTotal: Number(selectedOrder.paidTotal || 0),
            dueTotal: Number(selectedOrder.dueTotal || selectedOrder.grandTotal || selectedOrder.totalAmount || 0),
            paymentMethod: selectedOrder.paymentMethod || "CREDIT / NET 30",
            paymentTerms: selectedOrder.paymentMethod || "Net 30 Days",
            vehicleNo: "DHAKA METRO-TA-11-9482",
            driverName: "Md. Rafiqul Islam (+880 1819-223344)",
          }}
          initialVertical="wholesale"
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
