"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, Percent, Clock, CheckCircle, DollarSign, XCircle,
  TrendingUp, Users, Settings, ChevronRight, BadgeCheck, Undo2, AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";

interface Commission {
  id: string;
  saleId: string | null;
  agentName: string | null;
  agentType: string;
  commissionType: string;
  basisAmount: string;
  rate: string | null;
  amount: string;
  status: string;
  note: string | null;
  createdAt: string;
  agent?: { id: string; name: string; email: string } | null;
  sale?: { id: string; invoiceNo: string; total: string; saleDate: string } | null;
}

const STATUS_META: Record<string, { label: string; cls: string; dot: string; icon: any }> = {
  CALCULATED: { label: "Calculated", cls: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", icon: Percent },
  PENDING: { label: "Pending Review", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: Clock },
  APPROVED: { label: "Approved", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", icon: BadgeCheck },
  PAYABLE: { label: "Payable", cls: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500", icon: DollarSign },
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle },
  REVERSED: { label: "Reversed", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "% of Sale",
  FIXED: "Flat Fee",
  PRODUCT: "Per Product",
  CATEGORY: "Per Category",
  PROFIT: "Profit Share",
  TARGET: "Target Bonus",
  SLAB: "Slab Tiered",
  COLLECTION: "Collection Based",
};

export default function CommissionPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pending, setPending] = useState<Commission[]>([]);
  const [stats, setStats] = useState({ totalEarned: 0, totalPayable: 0, totalPaid: 0, totalReversed: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const [listRes, pendingRes] = await Promise.all([
        api.get<{ data: Commission[] }>(`/commission?${params}`),
        api.get<{ data: Commission[] }>("/commission/pending"),
      ]);
      setCommissions(listRes.data);
      setPending(pendingRes.data);

      // Aggregate stats client-side from the full list
      const all = listRes.data;
      let earned = 0, payable = 0, paid = 0, reversed = 0, pendingCount = 0;
      for (const c of all) {
        const amt = Number(c.amount);
        if (["CALCULATED", "PENDING"].includes(c.status)) { earned += amt; pendingCount++; }
        else if (["APPROVED", "PAYABLE"].includes(c.status)) { earned += amt; payable += amt; }
        else if (c.status === "PAID") { paid += amt; earned += amt; }
        else if (c.status === "REVERSED" && amt < 0) reversed += Math.abs(amt);
      }
      setStats({ totalEarned: earned, totalPayable: payable, totalPaid: paid, totalReversed: reversed, pendingCount });
    } catch (err: any) {
      setError(err.message || "Failed to load commissions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: string, label: string) {
    setBusy(id + action);
    try {
      await api.post(`/commission/${id}/${action}`, {});
      setToast({ ok: true, text: label });
      await load();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setToast({ ok: false, text: msg });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Commission Engine</h1>
          <p className="mt-1 text-sm text-gray-500">
            Agent commissions — auto-calculated on every sale, reversed on return (§10.15)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/commission/agents" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
            <Users size={16} className="text-primary-600" /> Agents
          </Link>
          <Link href="/commission/rules" className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700">
            <Settings size={16} /> Rules
          </Link>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.text}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Earned", value: fmt(stats.totalEarned), icon: TrendingUp, accent: "text-primary-600", bg: "bg-primary-50" },
          { label: "Payable Now", value: fmt(stats.totalPayable), icon: DollarSign, accent: "text-violet-600", bg: "bg-violet-50" },
          { label: "Paid Out", value: fmt(stats.totalPaid), icon: CheckCircle, accent: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Reversed", value: fmt(stats.totalReversed), icon: Undo2, accent: "text-rose-600", bg: "bg-rose-50" },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{s.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
            <div className={`rounded-xl p-3 ${s.bg}`}>
              <s.icon size={22} className={s.accent} />
            </div>
          </div>
        ))}
      </div>

      {/* Approval queue */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <h2 className="font-semibold text-gray-900">Approval Queue</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {pending.length} waiting
            </span>
          </div>
          {statusFilter && (
            <button onClick={() => setStatusFilter("")} className="text-xs font-medium text-gray-500 hover:text-gray-800">
              Clear filter ×
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle size={14} className="text-emerald-500" /> No commissions awaiting review — all caught up.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-amber-100">
            {pending.slice(0, 5).map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {(c.agent?.name || c.agentName || "?").charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.agent?.name || c.agentName || "Unknown agent"}
                      <span className="ml-2 text-xs font-normal text-gray-400">{TYPE_LABELS[c.commissionType] ?? c.commissionType}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.sale?.invoiceNo ? `Sale ${c.sale.invoiceNo}` : "Manual entry"} · basis {fmt(Number(c.basisAmount))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-gray-900">{fmt(Number(c.amount))}</span>
                  <button
                    onClick={() => act(c.id, "approve", "Commission approved")}
                    disabled={busy === c.id + "approve"}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy === c.id + "approve" ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />}
                    Approve
                  </button>
                </div>
              </div>
            ))}
            {pending.length > 5 && (
              <button onClick={() => setStatusFilter("PENDING")} className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                View all {pending.length} pending <ChevronRight size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["", "CALCULATED", "PENDING", "APPROVED", "PAYABLE", "PAID", "REVERSED"].map((s) => {
          const meta = s ? STATUS_META[s] : null;
          const active = statusFilter === s;
          return (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                  : meta
                    ? `${meta.cls} hover:shadow-sm`
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {meta ? meta.label : "All"}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-medium">Failed to load</p>
          <p className="mt-1">{error}</p>
          <button onClick={load} className="mt-2 text-sm font-medium text-rose-600 underline">Retry</button>
        </div>
      )}

      {/* Commissions table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : commissions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <Percent size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No commissions yet</p>
          <p className="mt-1 text-sm text-gray-400">Commissions calculate automatically when a sale completes and a rule matches the agent.</p>
          <Link href="/commission/rules" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
            <Settings size={14} /> Create a commission rule
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5">Agent</th>
                  <th className="px-5 py-3.5">Sale</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5 text-right">Basis</th>
                  <th className="px-5 py-3.5 text-right">Rate</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissions.map((c) => {
                  const meta = STATUS_META[c.status] ?? STATUS_META.CALCULATED;
                  const canApprove = ["CALCULATED", "PENDING"].includes(c.status);
                  const canPayable = c.status === "APPROVED";
                  const canPay = c.status === "PAYABLE";
                  return (
                    <tr key={c.id} className="group transition hover:bg-primary-50/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                            {(c.agent?.name || c.agentName || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.agent?.name || c.agentName || "—"}</p>
                            <p className="text-[11px] uppercase tracking-wide text-gray-400">{c.agentType.replace("_", " ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {c.sale ? (
                          <span className="font-mono text-xs text-gray-600">{c.sale.invoiceNo}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                          {TYPE_LABELS[c.commissionType] ?? c.commissionType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums text-gray-600">{fmt(Number(c.basisAmount))}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-gray-600">
                        {c.rate ? `${(Number(c.rate) * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className={`px-5 py-4 text-right font-bold tabular-nums ${Number(c.amount) < 0 ? "text-rose-600" : "text-gray-900"}`}>
                        {fmt(Number(c.amount))}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 transition group-hover:opacity-100">
                          {canApprove && (
                            <button onClick={() => act(c.id, "approve", "Approved")} disabled={busy === c.id + "approve"}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                              {busy === c.id + "approve" ? <Loader2 size={11} className="animate-spin" /> : "Approve"}
                            </button>
                          )}
                          {canPayable && (
                            <button onClick={() => act(c.id, "payable", "Marked payable")} disabled={busy === c.id + "payable"}
                              className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                              Mark Payable
                            </button>
                          )}
                          {canPay && (
                            <button onClick={() => act(c.id, "pay", "Payment recorded")} disabled={busy === c.id + "pay"}
                              className="rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50">
                              {busy === c.id + "pay" ? <Loader2 size={11} className="animate-spin" /> : "Pay"}
                            </button>
                          )}
                          {["CALCULATED", "PENDING"].includes(c.status) && (
                            <button onClick={() => act(c.id, "reverse", "Commission reversed")} disabled={busy === c.id + "reverse"}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                              Reverse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lifecycle legend */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Lifecycle</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-600">
          {["CALCULATED", "PENDING", "APPROVED", "PAYABLE", "PAID"].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`rounded-full border px-3 py-1 ${STATUS_META[s].cls}`}>{STATUS_META[s].label}</span>
              {i < 4 && <ChevronRight size={13} className="text-gray-300" />}
            </span>
          ))}
          <span className="ml-2 text-gray-400">· sale return → <span className={`rounded-full border px-3 py-1 ${STATUS_META.REVERSED.cls}`}>Reversed</span> (automatic)</span>
        </div>
      </div>
    </div>
  );
}
