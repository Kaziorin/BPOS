"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Package, AlertTriangle, Users, Wallet, ArrowRight, ShoppingCart, ChevronDown, BarChart3, Clock, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DashboardSummary, TrendPoint } from "@/lib/types";
import { CustomStatCard } from "@/components/custom/CustomStatCard";
import { StatusBadge } from "@/components/custom/CustomBadge";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { PosTerminalModal } from "@/components/layout/PosTerminalModal";
import { money, dateTime } from "@/lib/format";

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = useGreeting();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [posModalOpen, setPosModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>("/dashboard/summary"),
      api.get<any>("/dashboard/trend"),
    ])
      .then(([s, t]) => {
        const summaryData = s?.data ? s.data : s;
        const trendData = Array.isArray(t) ? t : (Array.isArray(t?.data) ? t.data : []);
        setSummary(summaryData);
        setTrend(trendData);
      })
      .catch((err) => {
        console.error("Dashboard load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-200 border-t-[#0284C7]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Hero Welcome Banner ── Pure CSS Gradient & SVG Ocean Waves (Center to Right) ── */}
      <div
        className="relative flex flex-col gap-4 overflow-hidden rounded-sm p-6 text-white sm:flex-row sm:items-center sm:justify-between shadow-md select-none border-0"
        style={{
          background:
            "linear-gradient(115deg, #0284C7 0%, #0396E6 28%, #0EA5E9 48%, #38BDF8 70%, #7DD3FC 92%, #A0E1FD 100%)",
        }}
      >
        {/* Ambient luminous glow on the left & top-right */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 12% 25%, rgba(255, 255, 255, 0.25) 0%, transparent 55%), radial-gradient(ellipse at 88% 30%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)",
          }}
        />

        {/* Silky Wave Ribbons Flowing from Center to Right */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
        >
          <defs>
            <linearGradient id="waveCenterRight1" x1="30%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="35%" stopColor="#7DD3FC" stopOpacity="0.30" />
              <stop offset="70%" stopColor="#BAE6FD" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.60" />
            </linearGradient>
            <linearGradient id="waveCenterRight2" x1="45%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.40" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.50" />
            </linearGradient>
          </defs>
          {/* Wave 1: Flowing smooth organic wave rising from center toward right */}
          <path
            d="M 380,200 C 440,160 480,95 560,95 C 660,95 720,150 820,120 C 900,95 950,55 1020,45 L 1020,200 L 380,200 Z"
            fill="url(#waveCenterRight1)"
          />
          {/* Wave 2: Overlapping silky layer flowing across center-right */}
          <path
            d="M 430,200 C 490,140 540,75 620,80 C 720,85 780,140 880,105 C 940,85 980,60 1020,75 L 1020,200 L 430,200 Z"
            fill="url(#waveCenterRight2)"
          />
          {/* Crest shimmer curve */}
          <path
            d="M 490,115 C 540,82 590,80 640,85 C 720,95 790,135 870,110"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Specular shimmer highlight near center wave peak */}
        <div
          className="pointer-events-none absolute left-[51%] top-[40%] h-1.5 w-1.5 rounded-full bg-white opacity-85"
          style={{
            boxShadow: "0 0 10px 3px rgba(255, 255, 255, 0.95)",
          }}
        />

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-sm bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white border border-white/25">
            {greeting}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
        </div>

        {/* Action buttons: All sharing the exact same POS Terminals gradient background, icon size, font styling and padding */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 self-start sm:self-center flex-wrap">
          <Link
            href="/dashboard/builder"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-sky-950/25 transition hover:brightness-110 active:scale-98 cursor-pointer select-none"
          >
            <BarChart3 size={15} className="shrink-0 text-white" />
            <span>Dashboard Builder</span>
          </Link>
          <Link
            href="/reports"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-sky-950/25 transition hover:brightness-110 active:scale-98 cursor-pointer select-none"
          >
            <TrendingUp size={15} className="shrink-0 text-white" />
            <span>Reports & Analytics</span>
          </Link>
          <button
            onClick={() => setPosModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-sky-950/25 transition hover:brightness-110 active:scale-98 cursor-pointer select-none"
          >
            <ShoppingCart size={15} className="shrink-0 text-white" />
            <span>POS Terminals</span>
            <ChevronDown size={14} className="opacity-80 shrink-0" />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── Uniform Height Grid with Blue Ocean Theme Gradient Accent ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-stretch">
        <CustomStatCard label="Today's Sales" value={money(summary.todaySalesTotal)} icon={DollarSign} tone="primary" />
        <CustomStatCard label="Today's Orders" value={String(summary.todaySalesCount ?? 0)} icon={Package} tone="blue" />
        <CustomStatCard label="Low Stock Items" value={String(summary.lowStockCount ?? 0)} icon={AlertTriangle} tone="amber" />
        <CustomStatCard label="Total Customers" value={String(summary.totalCustomers ?? 0)} icon={Users} tone="violet" />
        <CustomStatCard label="Total Due" value={money(summary.totalDue)} icon={Wallet} tone="red" />
      </div>

      {/* ── Charts & Recent Sales ── Uniform Height & Standard Layout ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">
        {/* Sales Trend Chart Card */}
        <div className="flex flex-col justify-between overflow-hidden rounded-sm border border-sky-200/80 bg-white shadow-xs lg:col-span-2 min-h-[390px]">
          <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 px-5 py-3.5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0369A1]">Sales Trend</h2>
              <p className="text-[11px] text-[#0284C7] font-medium">Last 7 days performance</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-sm bg-sky-100/80 px-2 py-0.5 text-[10px] font-bold text-[#0284C7] border border-sky-200">
              <BarChart3 size={10} /> Live Revenue
            </span>
          </div>
          <div className="flex-1 w-full p-4 flex items-end">
            <SalesTrendChart data={trend ?? []} />
          </div>
        </div>

        {/* Recent Sales List Card */}
        <div className="flex flex-col justify-between overflow-hidden rounded-sm border border-sky-200/80 bg-white shadow-xs min-h-[390px]">
          <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/40 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#0284C7]" />
              <h2 className="text-sm font-bold text-[#0369A1]">Recent Live Sales</h2>
            </div>
            <Link href="/sales" className="flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:text-[#0369A1] transition">
              <span>View all</span>
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex-1 p-3.5 space-y-2 overflow-y-auto custom-scrollbar">
            {(summary.recentSales ?? []).length === 0 && (
              <p className="text-xs font-medium text-slate-400 py-12 text-center">No sales recorded yet.</p>
            )}
            {(summary.recentSales ?? []).slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="group flex items-center justify-between p-2.5 rounded-sm border border-sky-100/90 bg-white hover:bg-sky-50/40 hover:border-sky-300/80 transition-all duration-150 shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-xs text-slate-900 group-hover:text-[#0284C7] transition-colors truncate">
                    {s.invoiceNo}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs truncate">
                    <span className="font-semibold text-slate-700 truncate">
                      {s.customer || "Walk-in Customer"}
                    </span>
                    <span className="text-slate-300 font-normal shrink-0">•</span>
                    <span className="text-slate-500 font-medium shrink-0 text-[11px]">
                      {dateTime(s.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 [font-variant-numeric:tabular-nums]">
                    {money(s.total)}
                  </p>
                  <div className="mt-0.5">
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POS Terminals Modal */}
      <PosTerminalModal isOpen={posModalOpen} onClose={() => setPosModalOpen(false)} />
    </div>
  );
}
