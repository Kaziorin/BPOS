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
      {/* ── Hero Welcome Banner ── Ocean Breeze Light gradient matching design spec */}
      <div
        className="relative flex flex-col gap-4 overflow-hidden rounded-2xl p-6 text-white sm:flex-row sm:items-center sm:justify-between"
        style={{
          background:
            "linear-gradient(to right, #BAE6FD 0%, #7DD3FC 30%, #38BDF8 65%, #0EA5E9 100%)",
        }}
      >
        {/* Soft white ambient glow top-left */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 10% 20%, rgba(255,255,255,0.45) 0%, transparent 55%)",
          }}
        />
        {/* Wave blob decoration — right side */}
        <div
          className="pointer-events-none absolute -right-8 -bottom-10 h-56 w-64 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 70%, transparent 100%)",
            filter: "blur(16px)",
          }}
        />
        <div
          className="pointer-events-none absolute right-8 top-2 h-32 w-48 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full bg-white/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0369A1]">
            {greeting}
          </span>
          <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-[#0C4A6E]">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[#075985]">
            {user?.roleName ? `Role: ${user.roleName}` : ""}
          </p>
          <p className="mt-1 text-sm text-[#0369A1]/80">Here&apos;s what&apos;s happening in your store today.</p>
        </div>
        <Link
          href="/retail-pos"
          className="relative z-10 inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0284C7] shadow-lg shadow-sky-700/20 transition hover:bg-sky-50 hover:scale-105 active:scale-100"
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
