"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import {
  ShoppingCart,
  Pill,
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
  Users,
  Layers,
  Zap,
  LayoutDashboard,
  History,
  Activity,
  Monitor,
  HeartPulse,
  Stethoscope,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { ReceiptModal } from "../pos/ReceiptModal";

function getCustomerTier(pts: number) {
  if (pts >= 4000) return { name: "VIP", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-100" };
  if (pts >= 1500) return { name: "Gold", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" };
  if (pts >= 500) return { name: "Silver", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-100" };
  return { name: "Bronze", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100" };
}

export default function PharmacyHubPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes] = await Promise.allSettled([
        api.get("/pos/sales", { params: { limit: 50 } }),
        api.get("/products?productType=PHARMACY", { params: { limit: 100 } }),
      ]);
      const sData = salesRes.status === "fulfilled" ? ((salesRes.value as any)?.data ?? salesRes.value ?? []) : [];
      const pData = prodRes.status === "fulfilled" ? ((prodRes.value as any)?.data ?? prodRes.value ?? []) : [];
      setSales(Array.isArray(sData) ? sData : []);
      setProducts(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error("Failed to load pharmacy data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalSales = sales.reduce((acc, s) => acc + Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0), 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + (s.items || []).reduce((sum: number, it: any) => sum + Number(it.qty || 1), 0), 0);

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const custName = s.customer?.name || s.customerName || "";
    return (
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
      (custName && custName.toLowerCase().includes(q)) ||
      (s.cashier?.name && s.cashier.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative w-full min-h-screen overflow-hidden p-6 space-y-8" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>

      {/* ══ POS-Style Background Waves (Pharmacy Cyan/Teal Theme) ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <svg className="absolute top-0 left-0 w-full h-[300px] opacity-[0.15]" viewBox="0 0 1200 300" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1200 0 L 1200 150 C 900 280, 400 100, 0 200 Z" fill="url(#hub-cyan-wave)" />
          <defs>
            <linearGradient id="hub-cyan-wave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 1)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header Banner: Glassmorphic & Curved */}
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.15)]">
        <div className={`absolute -left-20 -top-20 w-64 h-64 blur-3xl opacity-20 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform duration-700`} />

        <div className="relative flex items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
            <HeartPulse size={40} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pharmacy Hub</h1>
              <span className="px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-full shadow-sm">
                Rx Control
              </span>
            </div>
            <p className="text-slate-500 font-medium max-w-xl mt-2 leading-relaxed">
              Clinical-grade dispense monitoring. Manage prescription batches, track medicine expiry dates, and oversee pharmacy lane throughput with real-time stock sync.
            </p>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-3 z-10">
          <Link
            href="/pharmacy/pos"
            className="group/btn flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-black bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-cyan-600 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            <Zap size={18} className="text-cyan-400 group-hover/btn:animate-pulse" />
            Open Rx Register
            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/customer-display"
            target="_blank"
            className="group/cd flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-black bg-white text-slate-700 border border-slate-200 shadow-lg shadow-slate-200/20 hover:bg-slate-50 hover:border-cyan-300 hover:text-cyan-700 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            <Monitor size={18} className="text-slate-400 group-hover/cd:text-cyan-500" />
            Patient Display
          </Link>
        </div>
      </div>

      {/* KPI Stats: Tactile Premium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Daily Revenue", val: fmt(totalSales), sub: "Rx checkout volume", icon: TrendingUp, color: "cyan", iconColor: "text-cyan-600", bg: "bg-cyan-50" },
          { label: "Prescriptions", val: sales.length, sub: "Completed dispenses", icon: Receipt, color: "teal", iconColor: "text-teal-600", bg: "bg-teal-50" },
          { label: "Units Dispensed", val: totalItemsSold, sub: "Medicine units sold", icon: Pill, color: "indigo", iconColor: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Active Medicines", val: products.length, sub: "FEFO tracked stock", icon: Activity, color: "amber", iconColor: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-1">
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-2xl opacity-[0.05] rounded-full ${stat.bg}`} />
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.iconColor} shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} strokeWidth={2.5} />
              </div>
              <div className="px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-100">
                Live
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
            <div className="flex flex-col mt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.label}</span>
              <span className="text-[10px] text-slate-400 font-medium">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Rx Transactions & Medicine Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">

        {/* Left 2 Cols: Recent Pharmacy Transactions */}
        <div className="lg:col-span-2 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <History className="text-cyan-500" size={24} /> Rx Activity
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Dispense & Sales Stream</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Rx #, patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-xs font-bold focus:border-cyan-500 focus:outline-none focus:bg-white transition-all w-64 shadow-inner"
                />
              </div>
              <button
                onClick={loadData}
                className="rounded-2xl border border-slate-100 p-2.5 text-slate-500 hover:bg-cyan-50 hover:text-cyan-600 transition-all shadow-sm active:scale-90"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Rx data...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="py-32 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Receipt size={40} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-600">No Rx Activity</p>
                  <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto mt-1 uppercase tracking-wide">Launch a pharmacy register to start dispensing</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      <th className="py-5 px-6">Invoice / Rx</th>
                      <th className="py-5 px-6">Patient & Tier</th>
                      <th className="py-5 px-6">Time</th>
                      <th className="py-5 px-6 text-center">Items</th>
                      <th className="py-5 px-6 text-right">Total</th>
                      <th className="py-5 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSales.map((s) => {
                      const points = s.customer?.loyaltyPoints || s.customerPoints || 0;
                      const tier = getCustomerTier(points);
                      const custName = s.customer?.name || s.customerName || "Walk-in Patient";
                      const itemCount = Array.isArray(s.items) && s.items.length > 0 ? s.items.length : (s.itemsCount || 0);
                      const totalAmt = Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0);
                      return (
                        <tr key={s.id} className="group hover:bg-cyan-50/40 transition-colors">
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-mono font-black text-[10px] border border-cyan-100">
                                Rx
                              </div>
                              <span className="font-mono font-black text-xs text-slate-700">{s.invoiceNo || s.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 tracking-tight">{custName}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${tier.color} ${tier.bg} ${tier.border}`}>
                                  {tier.name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">{s.paymentMethod || "CASH"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-700">{new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                              <span className="text-[10px] font-bold text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
                              {itemCount}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right font-black tabular-nums text-slate-900 text-sm">
                            {fmt(totalAmt)}
                          </td>
                          <td className="py-5 px-6 text-center">
                            <button
                              onClick={() => setSelectedSale(s)}
                              className="rounded-xl bg-slate-900 text-white hover:bg-cyan-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                            >
                              Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Medicine Inventory & Expiry Alerts */}
        <div className="rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="text-cyan-500" size={24} /> Inventory
              </h3>
              <Link
                href="/products/create"
                className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 transition shadow-lg shadow-cyan-500/20 active:scale-90"
              >
                <PlusCircle size={18} />
              </Link>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Stock Control</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {products.slice(0, 15).map((p) => {
              const outOfStock = (p.stockQty ?? 0) <= 0;
              return (
                <div
                  key={p.id}
                  className="group flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-100 hover:border-cyan-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors shrink-0 font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 truncate text-xs tracking-tight">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase font-mono">{p.sku || "NO-SKU"}</span>
                        {outOfStock ? (
                           <span className="text-[8px] font-black bg-rose-100 text-rose-700 px-1 rounded uppercase">Out</span>
                        ) : (
                           <span className="text-[8px] font-black bg-cyan-100 text-cyan-700 px-1 rounded uppercase">In Stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 tracking-tighter block">{fmt(Number(p.sellingPrice || 0))}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Qty: {p.stockQty ?? 0}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-slate-50/50">
            <Link
              href="/pharmacy/pos"
              className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 p-4 text-xs font-black text-white hover:bg-cyan-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
            >
              Dispatch Register
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>


      {/* Same Receipt Modal as POS screen */}
      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-md w-full my-auto shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <ReceiptModal
              result={{
                saleId: selectedSale.id || crypto.randomUUID(),
                invoiceId: selectedSale.id || crypto.randomUUID(),
                invoiceNo: selectedSale.invoiceNo || `INV-${(selectedSale.id || "").slice(0, 8).toUpperCase()}`,
                total: Number(selectedSale.grandTotal ?? selectedSale.totalAmount ?? selectedSale.total ?? 0),
                paidTotal: selectedSale.paymentMethod !== "CREDIT"
                  ? Math.max(Number(selectedSale.paidTotal ?? 0), Number(selectedSale.grandTotal ?? selectedSale.totalAmount ?? selectedSale.total ?? 0))
                  : Number(selectedSale.paidTotal ?? 0),
                dueTotal: selectedSale.paymentMethod !== "CREDIT" ? 0 : Number(selectedSale.dueTotal || 0),
                paymentIds: [],
              }}
              cart={(selectedSale.items || []).map((it: any) => ({
                name: it.productName || it.name || it.product?.name || "Item",
                qty: Number(it.qty || 1),
                unitPrice: Number(it.unitPrice || 0),
                lineTotal: Number(it.unitPrice || 0) * Number(it.qty || 1),
                sku: it.sku,
              }))}
              payments={[{ method: selectedSale.paymentMethod || "CASH", amount: Number(selectedSale.grandTotal ?? selectedSale.total ?? 0) }]}
              cashierName={selectedSale.cashier?.name || user?.name || "Cashier"}
              customerName={selectedSale.customer?.name || selectedSale.customerName || "Walk-in Retail Customer"}
              onNewSale={() => setSelectedSale(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
