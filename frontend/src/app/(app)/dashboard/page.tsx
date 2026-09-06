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
      api.get<DashboardSummary>("/dashboard/summary"),
      api.get<TrendPoint[]>("/dashboard/trend"),
    ])
      .then(([s, t]) => {
        setSummary(s);
        setTrend(t);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-ink-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-primary-400/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-300">
            {greeting}
          </span>
          <h1 className="mt-2.5 text-xl font-semibold">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {user?.roleName ? `Role: ${user.roleName}` : ""}
          </p>
          <p className="mt-1 text-sm text-ink-400">Here&apos;s what&apos;s happening in your store today.</p>
        </div>
        <Link
          href="/pos"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          New Sale
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/builder" className="text-sm text-primary-600 hover:underline">Dashboard Builder →</Link>
        <Link href="/reports" className="text-sm text-gray-500 hover:text-primary-600 hover:underline">Reports →</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CustomStatCard label="Today's Sales" value={money(summary.todaySalesTotal)} icon={DollarSign} tone="primary" />
        <CustomStatCard label="Today's Orders" value={String(summary.todaySalesCount)} icon={Package} tone="blue" />
        <CustomStatCard label="Low Stock Items" value={String(summary.lowStockCount)} icon={AlertTriangle} tone="amber" />
        <CustomStatCard label="Total Customers" value={String(summary.totalCustomers)} icon={Users} tone="violet" />
        <CustomStatCard label="Total Due" value={money(summary.totalDue)} icon={Wallet} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-2">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">Sales trend</h2>
          <p className="mb-2 text-xs text-gray-400">Last 7 days</p>
          <SalesTrendChart data={trend} />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Recent sales</h2>
          <div className="space-y-3">
            {summary.recentSales.length === 0 && (
              <p className="text-sm text-gray-400">No sales yet.</p>
            )}
            {summary.recentSales.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{s.invoiceNo}</p>
                  <p className="text-xs text-gray-400">
                    {s.customer} • {dateTime(s.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800 [font-variant-numeric:tabular-nums]">
                    {money(s.total)}
                  </p>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/sales"
            className="mt-4 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all sales →
          </Link>
        </div>
      </div>
    </div>
  );
}
