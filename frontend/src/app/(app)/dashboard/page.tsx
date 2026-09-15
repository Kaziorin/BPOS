"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Package, AlertTriangle, Users, Wallet, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DashboardSummary, TrendPoint } from "@/lib/types";
import { CustomStatCard } from "@/components/custom/CustomStatCard";
import { StatusBadge } from "@/components/custom/CustomBadge";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Hero Welcome Banner ── Pure CSS Gradient & SVG Ocean Waves (Center to Right) ── */}
      <div
        className="relative flex flex-col gap-4 overflow-hidden rounded-2xl p-6 text-white sm:flex-row sm:items-center sm:justify-between shadow-md select-none"
        style={{
          background:
            "linear-gradient(115deg, #0284C7 0%, #0396E6 28%, #0EA5E9 48%, #38BDF8 70%, #7DD3FC 88%, #BAE6FD 100%)",
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
            d="M 380,200 C 440,160 480,95 560,95 C 660,95 720,150 820,120 C 900,95 950,55 1000,45 L 1000,200 L 380,200 Z"
            fill="url(#waveCenterRight1)"
          />
          {/* Wave 2: Overlapping silky layer flowing across center-right */}
          <path
            d="M 430,200 C 490,140 540,75 620,80 C 720,85 780,140 880,105 C 940,85 980,60 1000,75 L 1000,200 L 430,200 Z"
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
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white border border-white/25">
            {greeting}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-white/90">
            {user?.roleName ? `Role: ${user.roleName}` : "Role: Owner"}
          </p>
          <p className="mt-1 text-xs text-white/80">Here&apos;s what&apos;s happening in your store today.</p>
        </div>
        <Link
          href="/retail-pos"
          className="relative z-10 inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-[#0284C7] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-900/20 transition hover:bg-[#0369A1] hover:scale-105 active:scale-100"
        >
          New Sale
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Quick links */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/builder" className="text-sm text-[#0284C7] hover:underline font-medium">Dashboard Builder →</Link>
        <Link href="/reports" className="text-sm text-slate-500 hover:text-[#0284C7] hover:underline">Reports →</Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CustomStatCard label="Today's Sales" value={money(summary.todaySalesTotal)} icon={DollarSign} tone="primary" />
        <CustomStatCard label="Today's Orders" value={String(summary.todaySalesCount ?? 0)} icon={Package} tone="blue" />
        <CustomStatCard label="Low Stock Items" value={String(summary.lowStockCount ?? 0)} icon={AlertTriangle} tone="amber" />
        <CustomStatCard label="Total Customers" value={String(summary.totalCustomers ?? 0)} icon={Users} tone="violet" />
        <CustomStatCard label="Total Due" value={money(summary.totalDue)} icon={Wallet} tone="red" />
      </div>

      {/* ── Charts & Recent Sales ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-1 text-sm font-bold text-slate-800">Sales trend</h2>
          <p className="mb-3 text-xs text-slate-400">Last 7 days</p>
          <SalesTrendChart data={trend ?? []} />
        </div>

        <div className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Recent sales</h2>
            <Link href="/sales" className="text-xs font-semibold text-[#0284C7] hover:text-[#0369A1]">
              View all sales →
            </Link>
          </div>
          <div className="space-y-3">
            {(summary.recentSales ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No sales yet.</p>
            )}
            {(summary.recentSales ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{s.invoiceNo}</p>
                  <p className="text-xs text-slate-400">
                    {s.customer} • {dateTime(s.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800 [font-variant-numeric:tabular-nums]">
                    {money(s.total)}
                  </p>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
