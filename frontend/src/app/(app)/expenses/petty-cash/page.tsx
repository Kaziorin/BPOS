"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Wallet, Plus, ArrowDownToLine, ArrowUpFromLine, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Fund { branchId: string; balance: string }
interface Txn { id: string; type: string; amount: string; balanceAfter: string; note: string | null; createdAt: string }

const TXN_META: Record<string, { label: string; cls: string; icon: any }> = {
  FUND: { label: "Fund", cls: "text-emerald-600 bg-emerald-50", icon: ArrowDownToLine },
  EXPENSE: { label: "Expense", cls: "text-rose-600 bg-rose-50", icon: Wallet },
  REIMBURSE: { label: "Reimburse", cls: "text-indigo-600 bg-indigo-50", icon: ArrowUpFromLine },
  RESETTLE: { label: "Resettle", cls: "text-blue-600 bg-blue-50", icon: ArrowDownToLine },
};

export default function PettyCashPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState<"fund" | "reimburse" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = branchId ? `?branchId=${branchId}` : "";
      const res = await api.get<{ data: { funds: Fund[]; recentTxns: Txn[] } }>(`/expenses/petty-cash${params}`);
      setFunds(res.data.funds);
      setTxns(res.data.recentTxns);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    (async () => {
      try {
        const brRes = await api.get<{ data: any }>("/branches");
        const brs = (brRes.data as any)?.data ?? [];
        setBranches(brs.map((b: any) => ({ id: b.id, name: b.name })));
        if (brs.length > 0) setBranchId(brs[0].id);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(e: React.FormEvent) {
    e.preventDefault();
    if (!showModal || !branchId) return;
    setBusy(true);
    try {
      await api.post(`/expenses/petty-cash/${showModal === "fund" ? "fund" : "reimburse"}`, {
        branchId, amount: Number(amount), note: note || undefined,
      });
      setShowModal(null);
      setAmount(""); setNote("");
      setToast({ ok: true, text: showModal === "fund" ? "Petty cash funded" : "Petty cash reimbursed" });
      setTimeout(() => setToast(null), 3500);
      await load();
    } catch (err: any) {
      setToast({ ok: false, text: err.response?.data?.error || err.message });
      setTimeout(() => setToast(null), 3500);
    } finally { setBusy(false); }
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const fund = funds.find((f) => f.branchId === branchId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/expenses" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Petty Cash</h1>
            <p className="mt-0.5 text-sm text-gray-500">Full ledger — every movement recorded (§10.18)</p>
          </div>
        </div>
        {branches.length > 0 && (
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.text}
        </div>
      )}

      {/* Balance hero */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-100">Petty Cash Balance</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">{fmt(fund ? Number(fund.balance) : 0)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowModal("fund")}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30">
              <ArrowDownToLine size={15} /> Fund
            </button>
            <button onClick={() => setShowModal("reimburse")}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30">
              <ArrowUpFromLine size={15} /> Reimburse
            </button>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-4">
          <Wallet size={17} className="text-amber-600" />
          <h2 className="font-semibold text-gray-900">Recent Movements</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
        ) : txns.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">No petty cash movements yet — fund the float to begin.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {txns.map((t) => {
              const meta = TXN_META[t.type] ?? TXN_META.FUND;
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.cls}`}><meta.icon size={15} /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{meta.label}{t.note ? ` — ${t.note}` : ""}</p>
                      <p className="text-[11px] text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${t.type === "EXPENSE" || t.type === "REIMBURSE" ? "text-rose-600" : "text-emerald-600"}`}>
                      {t.type === "EXPENSE" || t.type === "REIMBURSE" ? "−" : "+"}{fmt(Number(t.amount))}
                    </p>
                    <p className="text-[10px] text-gray-400">bal {fmt(Number(t.balanceAfter))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(null)}>
          <form onSubmit={handleAction} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              {showModal === "fund" ? <ArrowDownToLine size={20} className="text-emerald-600" /> : <ArrowUpFromLine size={20} className="text-indigo-600" />}
              {showModal === "fund" ? "Fund Petty Cash" : "Reimburse Petty Cash"}
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount (৳) *</label>
                <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" required autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="optional" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />} Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
