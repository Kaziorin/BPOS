"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Scale,
  Barcode,
  Receipt,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export default function GroceryHubPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes] = await Promise.all([
        api.get("/sales", { params: { limit: 50 } }),
        api.get("/products", { params: { limit: 100 } }),
      ]);
      const sData = (salesRes.data as any)?.data ?? salesRes.data ?? [];
      const pData = (prodRes.data as any)?.data ?? prodRes.data ?? [];
      setSales(Array.isArray(sData) ? sData : []);
      setProducts(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error("Failed to load grocery data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalGrocerySales = sales.reduce((acc, s) => acc + Number(s.grandTotal || s.totalAmount || 0), 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + (s.items || []).length, 0);
  const weightedProducts = products.filter(
    (p) =>
      p.uom?.toLowerCase().includes("kg") ||
      p.uom?.toLowerCase().includes("gm") ||
      p.name?.toLowerCase().includes("kg") ||
      p.category?.name?.toLowerCase().includes("produce") ||
      p.category?.name?.toLowerCase().includes("vegetable") ||
      p.category?.name?.toLowerCase().includes("fruit") ||
      p.category?.name?.toLowerCase().includes("meat") ||
      p.category?.name?.toLowerCase().includes("fish")
  );

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(q)) ||
      (s.cashier?.name && s.cashier.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Scale size={15} /> Industry Vertical 4 · Grocery & Supermarket
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Supermarket Lane Hub & POS</h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl">
            High-speed lane checkout with weighing scale (Kg/g) tare calculation, rapid barcode scanner, express cashier lanes & produce PLU lookup.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/grocery/pos"
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5"
          >
            <ShoppingCart size={18} /> Launch Supermarket POS Lane
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Lane Revenue</span>
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{fmt(totalGrocerySales)}</p>
          <span className="text-[11px] text-slate-400">Total checkout volume</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Transactions</span>
            <Receipt size={18} className="text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{sales.length}</p>
          <span className="text-[11px] text-slate-400">Completed lane receipts</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Items Scanned</span>
            <Barcode size={18} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalItemsSold}</p>
          <span className="text-[11px] text-slate-400">Products checked out</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Scale PLU Items</span>
            <Scale size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{weightedProducts.length || products.length}</p>
          <span className="text-[11px] text-slate-400">Produce / Weight-based items</span>
        </div>
      </div>

      {/* Main Content: Lane Transactions & Produce Quick PLU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Supermarket Lane Transactions */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Recent Supermarket Lane Transactions</h3>
              <p className="text-xs text-slate-500">Real-time receipt history with item breakdowns</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice or cashier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:bg-white"
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
            <div className="py-16 text-center text-xs text-slate-400">Loading lane transactions...</div>
          ) : filteredSales.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Receipt size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No supermarket transactions found</p>
              <p className="text-xs">Launch the Supermarket POS Lane to start checking out customer baskets.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Time / Date</th>
                    <th className="py-3 px-3">Customer / Lane</th>
                    <th className="py-3 px-3 text-center">Items</th>
                    <th className="py-3 px-3 text-right">Total (৳)</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {s.invoiceNo || `INV-${s.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className="block text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800">{s.customer?.name || "Walk-in Customer"}</span>
                        <span className="block text-[10px] text-slate-400">{s.paymentMethod || "CASH"}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {(s.items || []).length}
                      </td>
                      <td className="py-3 px-3 text-right font-black tabular-nums text-slate-900">
                        {fmt(Number(s.grandTotal || s.totalAmount || 0))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedSale(s)}
                          className="rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-2.5 py-1 text-xs font-bold text-slate-700 transition"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Quick Produce / Scale PLU Price List */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Scale size={16} className="text-emerald-600" /> Produce & Scale PLU
              </h3>
              <p className="text-xs text-slate-500">Current weight-based items rate (৳/kg)</p>
            </div>
            <Link
              href="/products/create"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <PlusCircle size={13} /> Add PLU
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {products.slice(0, 15).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-emerald-200 transition"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-slate-800 truncate text-xs">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    SKU: {p.sku || "N/A"} · Unit: {p.uom || "KG"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-700">{fmt(Number(p.sellingPrice || 0))}</span>
                  <span className="block text-[9px] text-slate-400">per {p.uom || "kg"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/grocery/pos"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 p-2.5 text-xs font-black text-emerald-800 transition"
            >
              Open Scale Register <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Supermarket Slip Details Modal */}
      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b border-dashed border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Supermarket Lane Receipt</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Invoice: {selectedSale.invoiceNo || selectedSale.id}</p>
              <p className="text-[11px] text-slate-400">{new Date(selectedSale.createdAt).toLocaleString()}</p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(selectedSale.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.productName || item.product?.name || "Item"}</span>
                    <span className="block text-[10px] text-slate-400">
                      {item.qty} × {fmt(Number(item.unitPrice || 0))}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 tabular-nums">
                    {fmt(Number(item.qty || 1) * Number(item.unitPrice || 0))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-slate-600">
                <span>Subtotal:</span>
                <span>{fmt(Number(selectedSale.subTotal || selectedSale.grandTotal || 0))}</span>
              </div>
              <div className="flex justify-between font-black text-base text-emerald-700 pt-1">
                <span>Grand Total:</span>
                <span>{fmt(Number(selectedSale.grandTotal || selectedSale.totalAmount || 0))}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 p-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
