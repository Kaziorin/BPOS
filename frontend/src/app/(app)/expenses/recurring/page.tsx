"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Repeat, Plus, Power, PlayCircle, CheckCircle, XCircle, X } from "lucide-react";
import { api } from "@/lib/api";

interface Recurring {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  nextRunDate: string;
  endDate: string | null;
  isActive: boolean;
  lastGeneratedAt: string | null;
  category?: { id: string; name: string } | null;
  _count?: { expenses: number };
}

const FREQ_LABEL: Record<string, string> = {
  DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", QUARTERLY: "Quarterly", YEARLY: "Yearly",
};

export default function RecurringExpensesPage() {
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", categoryId: "", frequency: "MONTHLY", nextRunDate: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, catRes] = await Promise.all([
        api.get<{ data: Recurring[] }>("/expenses/recurring"),
        api.get<{ data: { id: string; name: string }[] }>("/expenses/categories"),
      ]);
      setRecurring(recRes.data);
      setCategories(catRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      await api.post("/expenses/recurring", {
        name: form.name,
        amount: Number(form.amount),
        categoryId: form.categoryId || undefined,
        frequency: form.frequency,
        nextRunDate: form.nextRunDate || new Date().toISOString(),
      });
      setShowModal(false);
      setForm({ name: "", amount: "", categoryId: "", frequency: "MONTHLY", nextRunDate: "" });
      setToast({ ok: true, text: "Recurring expense created" });
      setTimeout(() => setToast(null), 3500);
      await load();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false); }
  }

  async function toggle(r: Recurring) {
    try {
      await api.post(`/expenses/recurring/${r.id}/toggle`, { isActive: !r.isActive });
      await load();
    } catch (err: any) {
      setToast({ ok: false, text: err.response?.data?.error || err.message });
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function runScheduler() {
    setRunning(true);
    try {
      const res = await api.post<{ data: { generated: number } }>("/expenses/recurring/run", {});
      setToast({ ok: true, text: `Scheduler generated ${res.data.generated} expense(s)` });
      setTimeout(() => setToast(null), 4000);
      await load();
    } catch (err: any) {
      setToast({ ok: false, text: err.response?.data?.error || err.message });
      setTimeout(() => setToast(null), 4000);
    } finally { setRunning(false); }
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const inputCls = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/expenses" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Recurring Expenses</h1>
            <p className="mt-0.5 text-sm text-gray-500">Templates generate entries on schedule (§10.18)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={runScheduler} disabled={running}
            className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50">
            {running ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />} Run Scheduler
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
            <Plus size={16} /> New Template
          </button>
        </div>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.text}
        </div>
      )}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} <button onClick={load} className="font-medium underline">Retry</button></div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : recurring.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <Repeat size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No recurring templates</p>
          <p className="mt-1 text-sm text-gray-400">Automate rent, internet, subscriptions — entries generate as PENDING for approval.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recurring.map((r) => (
            <div key={r.id} className={`rounded-2xl border p-5 shadow-sm transition ${r.isActive ? "border-gray-100 bg-white hover:shadow-md" : "border-gray-100 bg-gray-50 opacity-70"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50"><Repeat size={18} className="text-violet-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{r.name}</h3>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      {FREQ_LABEL[r.frequency] ?? r.frequency}{r.category ? ` · ${r.category.name}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => toggle(r)} title={r.isActive ? "Pause" : "Activate"}
                  className={`rounded-lg p-1.5 ${r.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}>
                  <Power size={14} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                <p className="text-xl font-bold tabular-nums text-gray-900">{fmt(Number(r.amount))}<span className="text-xs font-normal text-gray-400"> /{r.frequency.toLowerCase()}</span></p>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-gray-400">Next run</p>
                  <p className="text-xs font-medium text-gray-700">{new Date(r.nextRunDate).toLocaleDateString()}</p>
                </div>
              </div>
              {(r as any)._count?.expenses != null && (
                <p className="mt-2 text-[11px] text-gray-400">Generated {r._count!.expenses} entr{r._count!.expenses === 1 ? "y" : "ies"} so far</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Recurring Expense</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {modalError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{modalError}</div>}
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Monthly Office Rent" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount (৳) *</label>
                  <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className={inputCls}>
                    {Object.entries(FREQ_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">First Run Date</label>
                  <input type="date" value={form.nextRunDate} onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })} className={inputCls} />
                </div>
              </div>
              <p className="rounded-lg bg-violet-50/60 p-3 text-xs text-gray-500">Generated entries enter PENDING status — approve them from the expenses list.</p>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving && <Loader2 size={15} className="animate-spin" />} Create Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
