"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, ClipboardList, ShoppingCart, PackageCheck, FileText, CreditCard,
  Undo2, ChevronRight, CheckCircle, Clock, AlertTriangle, TrendingUp, Boxes, Truck,
  Layers, Plus, RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

interface Summary {
  pendingRequisitions: number;
  activeOrders: number;
  unpaidInvoices: number;
  totalPayable: number;
  grnsLast30Days: number;
  returnsLast30Days: number;
}

interface RecentPO {
  id: string;
  poNo: string;
  status: string;
  total: string;
  expectedDate: string | null;
  supplier: { id: string; name: string };
  items: { qty: string; qtyReceived: string }[];
}

const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const PO_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-50 text-blue-700" },
  APPROVED: { label: "Approved", cls: "bg-indigo-50 text-indigo-700" },
  PARTIALLY_RECEIVED: { label: "Partial", cls: "bg-amber-50 text-amber-700" },
  RECEIVED: { label: "Received", cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-700" },
};

export default function PurchasingPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentPos, setRecentPos] = useState<RecentPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, poRes] = await Promise.all([
        api.get<{ data: Summary }>("/purchasing/summary"),
        api.get<{ data: RecentPO[] }>("/purchasing/orders?limit=6"),
      ]);
      setSummary(sumRes.data);
      setRecentPos(poRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load purchasing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Lifecycle pipeline steps
  const steps = [
    { icon: ClipboardList, label: "Requisition", count: summary?.pendingRequisitions ?? 0, href: "/purchasing/requisitions", color: "text-blue-600", bg: "bg-blue-50", pending: true },
    { icon: ShoppingCart, label: "Purchase Order", count: summary?.activeOrders ?? 0, href: "/purchasing/orders", color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: PackageCheck, label: "GRN Receive", count: summary?.grnsLast30Days ?? 0, href: "/purchasing/grns", color: "text-violet-600", bg: "bg-violet-50" },
    { icon: FileText, label: "Invoice", count: summary?.unpaidInvoices ?? 0, href: "/purchasing/orders", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: CreditCard, label: "Payment", count: 0, href: "/purchasing/orders", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Undo2, label: "Return", count: summary?.returnsLast30Days ?? 0, href: "/purchasing/returns", color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span className="text-gray-900 font-bold">Purchasing Hub</span>
            <ChevronRight size={13} className="text-gray-400" />
            <span>Overview</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Purchasing & Procurement</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
            End-to-end Procurement Lifecycle: PR → Multi-tier Approval → PO → GRN → Invoice & Payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-primary-600" : ""} />
          </button>
          <Link href="/purchasing/requisitions" className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <ClipboardList size={16} className="text-blue-600" /> New PR
          </Link>
          <Link href="/purchasing/orders" className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 active:scale-[0.98]">
            <ShoppingCart size={16} /> New PO
          </Link>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-1.5 shadow-sm">
        {[
          { href: "/purchasing", label: "Overview", icon: Layers, active: true },
          { href: "/purchasing/requisitions", label: "Requisitions (PR)", icon: ClipboardList },
          { href: "/purchasing/orders", label: "Purchase Orders (PO)", icon: ShoppingCart },
          { href: "/purchasing/grns", label: "Goods Received (GRN)", icon: PackageCheck },
          { href: "/purchasing/returns", label: "Returns & Debit Notes", icon: Undo2 },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              tab.active
                ? "bg-primary-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error} <button onClick={load} className="ml-2 font-medium underline">Retry</button>
        </div>
      )}

      {/* Lifecycle pipeline */}
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-white to-primary-50/40 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Procurement Lifecycle</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((step, i) => (
            <Link
              key={step.label}
              href={step.href}
              className="group relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {i < steps.length - 1 && (
                <ChevronRight size={16} className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-gray-300 lg:block" />
              )}
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.bg} transition group-hover:scale-110`}>
                <step.icon size={18} className={step.color} />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-800">{step.label}</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900">
                {loading ? "—" : step.count}
                {step.pending && !loading && step.count > 0 && (
                  <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500 align-middle" />
                )}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Payable to Suppliers", value: summary ? fmt(summary.totalPayable) : "—", icon: CreditCard, accent: "text-amber-600", bg: "bg-amber-50" },
          { label: "Active Orders", value: summary?.activeOrders ?? "—", icon: Truck, accent: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "GRNs (30 days)", value: summary?.grnsLast30Days ?? "—", icon: PackageCheck, accent: "text-violet-600", bg: "bg-violet-50" },
          { label: "Returns (30 days)", value: summary?.returnsLast30Days ?? "—", icon: Undo2, accent: "text-rose-600", bg: "bg-rose-50" },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{s.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
            <div className={`rounded-xl p-3 ${s.bg}`}><s.icon size={22} className={s.accent} /></div>
          </div>
        ))}
      </div>

      {/* Recent POs */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Boxes size={17} className="text-primary-600" /> Recent Purchase Orders
          </h2>
          <Link href="/purchasing/orders" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
        ) : recentPos.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 font-medium text-gray-500">No purchase orders yet</p>
            <p className="mt-1 text-sm text-gray-400">Create a requisition or a direct PO to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">PO No</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3 text-center">Received</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Expected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPos.map((po) => {
                  const meta = PO_STATUS[po.status] ?? PO_STATUS.DRAFT;
                  const ordered = po.items.reduce((s, i) => s + Number(i.qty), 0);
                  const received = po.items.reduce((s, i) => s + Number(i.qtyReceived), 0);
                  const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
                  return (
                    <tr key={po.id} className="transition hover:bg-primary-50/30">
                      <td className="px-5 py-4">
                        <Link href="/purchasing/orders" className="font-mono text-xs font-semibold text-primary-700 hover:underline">{po.poNo}</Link>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{po.supplier?.name ?? "—"}</td>
                      <td className="px-5 py-4">
                        <div className="mx-auto w-28">
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>{received}/{ordered}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-gray-200"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-bold tabular-nums text-gray-900">{fmt(Number(po.total))}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/purchasing/requisitions", icon: ClipboardList, title: "Requisitions", desc: "Internal requests awaiting approval", color: "from-blue-500 to-blue-600" },
          { href: "/purchasing/orders", icon: ShoppingCart, title: "Purchase Orders", desc: "Order + partial receiving tracking", color: "from-indigo-500 to-indigo-600" },
          { href: "/purchasing/grns", icon: PackageCheck, title: "Goods Received", desc: "Receive stock into warehouse", color: "from-violet-500 to-violet-600" },
          { href: "/purchasing/returns", icon: Undo2, title: "Purchase Returns", desc: "Reverse stock + supplier payable", color: "from-rose-500 to-rose-600" },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${l.color}`} />
            <l.icon size={22} className="text-gray-400 transition group-hover:text-primary-600" />
            <p className="mt-3 font-semibold text-gray-900">{l.title}</p>
            <p className="mt-0.5 text-xs text-gray-400">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
