"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Users, Wallet, TrendingUp, CheckCircle, Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

interface AgentStats {
  totalEarned: number;
  totalPayable: number;
  totalPaid: number;
  totalReversed: number;
  pendingCount: number;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  stats: AgentStats;
}

export default function CommissionAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingOut, setPayingOut] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Agent[] }>("/commission/agents");
      setAgents(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function payout(agentId: string) {
    if (!confirm("Pay out all PAYABLE commissions for this agent?")) return;
    setPayingOut(agentId);
    try {
      const res = await api.post<{ data: { paidCount: number } }>(`/commission/agents/${agentId}/payout`, {});
      setToast({ ok: true, text: `Paid ${res.data.paidCount} commission(s)` });
      await load();
    } catch (err: any) {
      setToast({ ok: false, text: err.response?.data?.error || err.message });
    } finally {
      setPayingOut(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/commission" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Commission Agents</h1>
          <p className="mt-0.5 text-sm text-gray-500">Sales agents, reps, referral partners & distributors with their earnings</p>
        </div>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <Clock size={16} />} {toast.text}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error} <button onClick={load} className="ml-2 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <Users size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No agents with commissions yet</p>
          <p className="mt-1 text-sm text-gray-400">Agents appear here once they earn their first commission from a completed sale.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => {
            const s = agent.stats;
            const hasPayable = s.totalPayable > 0;
            return (
              <div key={agent.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-base font-bold text-white">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight text-gray-900">{agent.name}</h3>
                      <p className="text-xs text-gray-400">{agent.email}{agent.phone ? ` · ${agent.phone}` : ""}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${agent.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {agent.status}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-gradient-to-br from-primary-50 to-white p-3">
                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      <TrendingUp size={10} /> Earned
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{fmt(s.totalEarned)}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-violet-50 to-white p-3">
                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      <Wallet size={10} /> Payable
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-violet-700">{fmt(s.totalPayable)}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white p-3">
                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      <CheckCircle size={10} /> Paid
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{fmt(s.totalPaid)}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3.5">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {s.pendingCount > 0 && (
                      <span className="flex items-center gap-1"><Clock size={12} className="text-amber-500" /> {s.pendingCount} pending</span>
                    )}
                    {s.totalReversed > 0 && (
                      <span className="text-rose-500">↩ {fmt(s.totalReversed)} reversed</span>
                    )}
                  </div>
                  <button
                    onClick={() => payout(agent.id)}
                    disabled={!hasPayable || payingOut === agent.id}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      hasPayable
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "cursor-not-allowed bg-gray-100 text-gray-400"
                    }`}
                  >
                    {payingOut === agent.id ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                    {hasPayable ? `Pay ${fmt(s.totalPayable)}` : "Nothing to pay"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
