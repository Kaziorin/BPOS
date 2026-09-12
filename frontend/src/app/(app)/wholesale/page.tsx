"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import {
  ShoppingCart,
  Truck,
  Package,
  Receipt,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Users,
  Layers,
  Zap,
  LayoutDashboard,
  History,
  Activity,
  Monitor,
  Building2,
  Boxes,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { ReceiptModal } from "../pos/ReceiptModal";
import {
  fetchAllProducts,
  fetchBatches,
  applyBatchStock,
  type RegisterProduct,
} from "@/lib/catalog";

function getCustomerTier(pts: number) {
  if (pts >= 5000) return { name: "VIP Partner", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100" };
  if (pts >= 2000) return { name: "Platinum", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" };
  return { name: "Standard", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-100" };
}

export default function WholesaleHubPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<RegisterProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, prodsRes, btsRes] = await Promise.allSettled([
        api.get("/v1/sales/orders?source=B2B&limit=50"),
        fetchAllProducts(),
        fetchBatches(),
      ]);

      const sData = salesRes.status === "fulfilled" ? ((salesRes.value as any)?.data ?? salesRes.value ?? []) : [];
      setSales(Array.isArray(sData) ? sData : []);

      let allProds: RegisterProduct[] = [];
      if (prodsRes.status === "fulfilled") {
        allProds = prodsRes.value;
        if (btsRes.status === "fulfilled") {
          allProds = applyBatchStock(allProds, btsRes.value);
        }
      }
      setProducts(allProds);
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

  const totalVolume = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);
  const activeOrders = sales.filter(s => s.status !== "COMPLETED" && s.status !== "CANCELLED").length;

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const custName = s.customer?.name || s.customerName || "";
    return (
      (s.orderNo && s.orderNo.toLowerCase().includes(q)) ||
      (custName && custName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative w-full min-h-screen overflow-hidden p-6 space-y-8" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>

      {/* ══ Background Waves (Wholesale Blue Theme) ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <svg className="absolute top-0 left-0 w-full h-[300px] opacity-[0.12]" viewBox="0 0 1200 300" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 1200 0 L 1200 150 C 900 280, 400 100, 0 200 Z" fill="url(#wholesale-blue-wave)" />
          <defs>
            <linearGradient id="wholesale-blue-wave" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(37, 99, 235, 1)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header Banner */}
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.15)]">
        <div className={`absolute -left-20 -top-20 w-64 h-64 blur-3xl opacity-20 rounded-full bg-blue-400 group-hover:scale-125 transition-transform duration-700`} />

        <div className="relative flex items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
            <Truck size={40} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wholesale & Distribution</h1>
              <span className="px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] bg-blue-100 text-blue-700 border border-blue-200 rounded-full shadow-sm">
                B2B Portal
              </span>
            </div>
            <p className="text-slate-500 font-medium max-w-xl mt-2 leading-relaxed">
              Wholesale fulfillment and bulk order monitoring. Manage commercial challans, track bulk stock movements, and oversee distribution logistics with real-time sync.
            </p>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-3 z-10">
          <Link
            href="/wholesale/pos"
            className="group/btn flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-black bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            <Zap size={18} className="text-blue-300 group-hover/btn:animate-pulse" />
            Open Wholesale Register
            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/pharmacy/patient-display"
            target="_blank"
            className="group/cd flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-black bg-white text-slate-700 border border-slate-200 shadow-lg shadow-slate-200/20 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
          >
            <Monitor size={18} className="text-slate-400 group-hover/cd:text-blue-500" />
            Client Display
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "B2B Volume", val: fmt(totalVolume), sub: "Total commercial sales", icon: TrendingUp, iconColor: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Orders", val: activeOrders, sub: "Pending fulfillment", icon: Receipt, iconColor: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Bulk Stock", val: products.reduce((s, p) => s + (p.stockQty || 0), 0), sub: "Total units on hand", icon: Boxes, iconColor: "text-cyan-600", bg: "bg-cyan-50" },
          { label: "Unique SKUs", val: products.length, sub: "Active product catalog", icon: Package, iconColor: "text-blue-500", bg: "bg-slate-50" },
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">

        {/* Recent B2B Activity */}
        <div className="lg:col-span-2 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <History className="text-blue-500" size={24} /> B2B Activity
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Distribution & Fulfillment Stream</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Order #, Client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-xs font-bold focus:border-blue-500 focus:outline-none focus:bg-white transition-all w-64 shadow-inner"
                />
              </div>
              <button
                onClick={loadData}
                className="rounded-2xl border border-slate-100 p-2.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-90"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Wholesale data...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="py-32 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Truck size={40} />
                </div>
                <p className="text-lg font-black text-slate-600">No Wholesale Activity</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      <th className="py-5 px-6">Order #</th>
                      <th className="py-5 px-6">Client & Tier</th>
                      <th className="py-5 px-6">Date</th>
                      <th className="py-5 px-6 text-center">Status</th>
                      <th className="py-5 px-6 text-right">Amount</th>
                      <th className="py-5 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSales.map((s) => {
                      const tier = getCustomerTier(s.customerPoints || 0);
                      return (
                        <tr key={s.id} className="group hover:bg-blue-50/40 transition-colors">
                          <td className="py-5 px-6">
                            <span className="font-mono font-black text-xs text-slate-700">{s.orderNo}</span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900 tracking-tight">{s.customerName || "B2B Client"}</span>
                              <span className={`w-fit mt-1 text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${tier.color} ${tier.bg} ${tier.border}`}>
                                {tier.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-[11px] font-bold text-slate-500">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-5 px-6 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase">
                              {s.status}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right font-black tabular-nums text-slate-900 text-sm">
                            {fmt(s.total)}
                          </td>
                          <td className="py-5 px-6 text-center">
                            <button
                              onClick={() => setSelectedSale(s)}
                              className="rounded-xl bg-slate-900 text-white hover:bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                            >
                              Challan
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

        {/* Wholesale Inventory */}
        <div className="rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Boxes className="text-blue-500" size={24} /> Distribution
              </h3>
              <Link href="/products/create" className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 active:scale-90">
                <PlusCircle size={18} />
              </Link>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk Stock Control</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {products.slice(0, 15).map((p) => (
              <div key={p.id} className="group flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 transition-all duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 font-bold text-sm overflow-hidden">
                    {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" /> : p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 truncate text-xs tracking-tight">{p.name}</p>
                    <span className="text-[9px] font-black text-slate-400 uppercase font-mono">{p.sku}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 block">{fmt(p.sellingPrice)}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Stock: {p.stockQty}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-50/50">
            <Link href="/inventory/stock" className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 p-4 text-xs font-black text-white hover:bg-blue-600 transition-all active:scale-95">
              Stock Ledger
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
