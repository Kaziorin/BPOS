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

import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";

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
    { icon: ClipboardList, label: "Requisition", count: summary?.pendingRequisitions ?? 0, href: "/purchasing/requisitions", color: "text-[#0284C7]", bg: "bg-sky-50", pending: true },
    { icon: ShoppingCart, label: "Purchase Order", count: summary?.activeOrders ?? 0, href: "/purchasing/orders", color: "text-[#0369A1]", bg: "bg-sky-50" },
    { icon: PackageCheck, label: "GRN Receive", count: summary?.grnsLast30Days ?? 0, href: "/purchasing/grns", color: "text-[#0284C7]", bg: "bg-sky-50" },
    { icon: FileText, label: "Invoice", count: summary?.unpaidInvoices ?? 0, href: "/purchasing/orders", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: CreditCard, label: "Payment", count: 0, href: "/purchasing/orders", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Undo2, label: "Return", count: summary?.returnsLast30Days ?? 0, href: "/purchasing/returns", color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header via CustomBreadcrumb */}
      <CustomBreadcrumb
        title="Purchasing & Procurement"
        subtitle="End-to-end Procurement Lifecycle: PR → Multi-tier Approval → PO → GRN → Invoice & Payments"
        icon={<ShoppingCart size={20} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-sm border border-sky-200 bg-white p-2 text-slate-600 shadow-2xs transition hover:bg-sky-50 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[#0284C7]" : ""} />
            </button>
            <Link href="/purchasing/requisitions">
              <CustomButton
                variant="outline"
                size="sm"
                className="rounded-sm"
                leftIcon={<ClipboardList size={14} className="text-[#0284C7]" />}
              >
                New PR
              </CustomButton>
            </Link>
            <Link href="/purchasing/orders">
              <CustomButton
                variant="primary"
                size="sm"
                className="rounded-sm font-semibold"
                leftIcon={<ShoppingCart size={14} />}
              >
                New PO
              </CustomButton>
            </Link>
          </div>
        }
      />

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-sm border border-sky-100/90 bg-white p-1.5 shadow-2xs">
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
            className={`flex items-center gap-2 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              tab.active
                ? "bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-2xs"
                : "text-slate-600 hover:bg-sky-50 hover:text-[#0284C7]"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-sm border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error} <button onClick={load} className="ml-2 font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* Lifecycle pipeline */}
      <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Procurement Lifecycle</p>
        <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((step, i) => (
            <Link
              key={step.label}
              href={step.href}
              className="group relative rounded-sm border border-sky-100/80 bg-white p-3.5 shadow-2xs transition hover:border-sky-300 hover:shadow-xs"
            >
              {i < steps.length - 1 && (
                <ChevronRight size={15} className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-sky-300 lg:block" />
              )}
              <div className={`flex h-9 w-9 items-center justify-center rounded-sm ${step.bg} border border-sky-100 transition group-hover:scale-105`}>
                <step.icon size={17} className={step.color} />
              </div>
              <p className="mt-2.5 text-xs font-semibold text-slate-800">{step.label}</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">
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
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          { label: "Payable to Suppliers", value: summary ? fmt(summary.totalPayable) : "—", icon: CreditCard, accent: "text-amber-600", bg: "bg-amber-50" },
          { label: "Active Orders", value: summary?.activeOrders ?? "—", icon: Truck, accent: "text-[#0284C7]", bg: "bg-sky-50" },
          { label: "GRNs (30 days)", value: summary?.grnsLast30Days ?? "—", icon: PackageCheck, accent: "text-[#0369A1]", bg: "bg-sky-50" },
          { label: "Returns (30 days)", value: summary?.returnsLast30Days ?? "—", icon: Undo2, accent: "text-rose-600", bg: "bg-rose-50" },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs hover:border-sky-300 transition">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{s.label}</p>
              <p className="mt-1.5 text-xl font-bold text-slate-900">{s.value}</p>
            </div>
            <div className={`rounded-sm p-2.5 ${s.bg} border border-sky-100/60`}><s.icon size={20} className={s.accent} /></div>
          </div>
        ))}
      </div>

      {/* Recent POs */}
      <div className="overflow-hidden rounded-sm border border-sky-100/90 bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-sky-100 px-5 py-3.5 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50">
          <h2 className="flex items-center gap-2 font-bold text-sm text-[#0369A1]">
            <Boxes size={16} className="text-[#0284C7]" /> Recent Purchase Orders
          </h2>
          <Link href="/purchasing/orders" className="flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1]">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#0284C7]" /></div>
        ) : recentPos.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart size={36} className="mx-auto text-sky-200" />
            <p className="mt-2.5 font-bold text-xs text-slate-700">No purchase orders yet</p>
            <p className="mt-1 text-xs text-gray-400">Create a requisition or a direct PO to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-[#0369A1]">
                  <th className="px-5 py-3">PO No</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3 text-center">Received</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Expected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/70">
                {recentPos.map((po) => {
                  const meta = PO_STATUS[po.status] ?? PO_STATUS.DRAFT;
                  const ordered = po.items.reduce((s, i) => s + Number(i.qty), 0);
                  const received = po.items.reduce((s, i) => s + Number(i.qtyReceived), 0);
                  const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
                  return (
                    <tr key={po.id} className="transition hover:bg-sky-50/40">
                      <td className="px-5 py-3.5">
                        <Link href="/purchasing/orders" className="font-mono text-xs font-bold text-[#0284C7] hover:underline">{po.poNo}</Link>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{po.supplier?.name ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="mx-auto w-28">
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>{received}/{ordered}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 overflow-hidden rounded-sm bg-sky-100">
                            <div className={`h-full rounded-sm ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-sky-200"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold tabular-nums text-slate-900">{fmt(Number(po.total))}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
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
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/purchasing/requisitions", icon: ClipboardList, title: "Requisitions", desc: "Internal requests awaiting approval", color: "from-[#0284C7] to-[#38BDF8]" },
          { href: "/purchasing/orders", icon: ShoppingCart, title: "Purchase Orders", desc: "Order + partial receiving tracking", color: "from-[#0369A1] to-[#0EA5E9]" },
          { href: "/purchasing/grns", icon: PackageCheck, title: "Goods Received", desc: "Receive stock into warehouse", color: "from-[#0284C7] to-[#0EA5E9]" },
          { href: "/purchasing/returns", icon: Undo2, title: "Purchase Returns", desc: "Reverse stock + supplier payable", color: "from-rose-500 to-rose-600" },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className="group relative overflow-hidden rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs transition hover:border-sky-300 hover:shadow-xs">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${l.color}`} />
            <l.icon size={20} className="text-gray-400 transition group-hover:text-[#0284C7]" />
            <p className="mt-2.5 font-bold text-xs text-slate-900">{l.title}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
