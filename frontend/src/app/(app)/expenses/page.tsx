"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, Receipt, Plus, CheckCircle, XCircle, DollarSign, Repeat,
  Wallet, BarChart3, ChevronRight, Clock, CreditCard,
} from "lucide-react";
import { api } from "@/lib/api";

interface Category { id: string; name: string; group: string; _count?: { expenses: number } }
interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  expenseDate: string;
  paymentMethod: string;
  status: string;
  branchId: string | null;
  category?: { id: string; name: string } | null;
  recurring?: { name: string } | null;
  createdAt: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  REJECTED: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const METHOD_ICON: Record<string, string> = {
  CASH: "💵", BANK: "🏦", MOBILE_BANKING: "📱", PETTY_CASH: "🪙",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [report, setReport] = useState<{ total: number; count: number; byCategory: { categoryName: string; total: number; count: number }[] } | null>(null);
  const [pettyBalance, setPettyBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", amount: "", categoryId: "", paymentMethod: "CASH", expenseDate: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const [expRes, catRes, repRes, pettyRes] = await Promise.all([
        api.get<{ data: Expense[] }>(`/expenses?${params}`),
        api.get<{ data: Category[] }>("/expenses/categories"),
        api.get<{ data: any }>("/expenses/report"),
        api.get<{ data: { funds: { balance: string }[] } }>("/expenses/petty-cash").catch(() => null),
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
      setReport(repRes.data);
      setPettyBalance(pettyRes ? Number(pettyRes.data.funds[0]?.balance ?? 0) : null);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "approve" | "pay", label: string) {
    setBusy(id + action);
    try {
      await api.post(`/expenses/${id}/${action}`, {});
      setToast({ ok: true, text: label });
      await load();
    } catch (err: any) {
      setToast({ ok: false, text: err.response?.data?.error || err.message });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      await api.post("/expenses", {
        title: form.title,
        amount: Number(form.amount),
        categoryId: form.categoryId || undefined,
        paymentMethod: form.paymentMethod,
        expenseDate: form.expenseDate || undefined,
        description: form.description || undefined,
      });
      setShowModal(false);
      setForm({ title: "", amount: "", categoryId: "", paymentMethod: "CASH", expenseDate: "", description: "" });
      await load();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const inputCls = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expense Management</h1>
          <p className="mt-1 text-sm text-gray-500">Categories, entries, recurring, petty cash, reports (§10.18)</p>
        </div>
        <div className="flex gap-2">
          <Link href="/expenses/recurring" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Repeat size={16} className="text-violet-600" /> Recurring
          </Link>
          <Link href="/expenses/petty-cash" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Wallet size={16} className="text-amber-600" /> Petty Cash
          </Link>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
            <Plus size={16} /> New Expense
          </button>
        </div>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.text}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error} <button onClick={load} className="ml-2 font-medium underline">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total (30 days)", value: report ? fmt(report.total) : "—", icon: BarChart3, accent: "text-primary-600", bg: "bg-primary-50" },
          { label: "Entries", value: report?.count ?? "—", icon: Receipt, accent: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending Approval", value: expenses.filter((e) => e.status === "PENDING").length, icon: Clock, accent: "text-amber-600", bg: "bg-amber-50" },
          { label: "Petty Cash Balance", value: pettyBalance != null ? fmt(pettyBalance) : "—", icon: Wallet, accent: "text-amber-600", bg: "bg-amber-50" },
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

      {/* Category breakdown */}
      {report && report.byCategory.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><BarChart3 size={17} className="text-primary-600" /> By Category (30 days)</h2>
            <Link href="/expenses/report" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">Full report <ChevronRight size={12} /></Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {report.byCategory
              .sort((a, b) => b.total - a.total)
              .map((c) => {
                const pct = report.total > 0 ? Math.round((c.total / report.total) * 100) : 0;
                return (
                  <div key={c.categoryName}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700">{c.categoryName} <span className="text-gray-400">({c.count})</span></span>
                      <span className="tabular-nums font-semibold text-gray-900">{fmt(c.total)} · {pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {["", "PENDING", "APPROVED", "PAID", "REJECTED"].map((s) => (
          <button key={s || "all"} onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              statusFilter === s ? "border-primary-600 bg-primary-600 text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}>
            {s ? STATUS[s].label : "All"}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : expenses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <Receipt size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No expenses recorded</p>
          <p className="mt-1 text-sm text-gray-400">Track rent, utilities, marketing and day-to-day spending here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5">Expense</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((exp) => {
                  const meta = STATUS[exp.status] ?? STATUS.PENDING;
                  return (
                    <tr key={exp.id} className="group transition hover:bg-primary-50/30">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{exp.title}</p>
                        {exp.recurring && <p className="flex items-center gap-1 text-[11px] text-violet-500"><Repeat size={10} /> from {exp.recurring.name}</p>}
                      </td>
                      <td className="px-5 py-4"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">{exp.category?.name ?? "—"}</span></td>
                      <td className="px-5 py-4 text-xs text-gray-500">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-xs">{METHOD_ICON[exp.paymentMethod] ?? "💳"} <span className="text-gray-500">{exp.paymentMethod.replace("_", " ")}</span></td>
                      <td className="px-5 py-4 text-right font-bold tabular-nums text-gray-900">{fmt(Number(exp.amount))}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 transition group-hover:opacity-100">
                          {exp.status === "PENDING" && (
                            <button onClick={() => act(exp.id, "approve", "Expense approved")} disabled={busy === exp.id + "approve"}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                              {busy === exp.id + "approve" ? <Loader2 size={11} className="animate-spin" /> : "Approve"}
                            </button>
                          )}
                          {exp.status === "APPROVED" && (
                            <button onClick={() => act(exp.id, "pay", "Expense paid")} disabled={busy === exp.id + "pay"}
                              className="rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50">
                              Mark Paid
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

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">New Expense</h2>
            {modalError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{modalError}</div>}
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="e.g. Electricity bill" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount (৳) *</label>
                  <input type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</label>
                  <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                    <option value="">—</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
                    <option value="CASH">💵 Cash</option>
                    <option value="BANK">🏦 Bank</option>
                    <option value="MOBILE_BANKING">📱 Mobile Banking</option>
                    <option value="PETTY_CASH">🪙 Petty Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} />
              </div>
              <p className="rounded-lg bg-primary-50/60 p-3 text-xs text-gray-500">Cash expenses inside an open shift automatically post a CASH_EXPENSE movement to the shift ledger.</p>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving && <Loader2 size={15} className="animate-spin" />} Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
