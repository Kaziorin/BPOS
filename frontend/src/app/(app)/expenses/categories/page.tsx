"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Tags, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  group: string;
  description: string | null;
  _count?: { expenses: number };
}

const GROUPS: Record<string, string> = {
  OPERATING: "Operating", PAYROLL: "Payroll", FACILITY: "Facility", MARKETING: "Marketing", MISC: "Misc",
};

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", group: "OPERATING", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Category[] }>("/expenses/categories");
      setCategories(res.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      await api.post("/expenses/categories", { ...form, description: form.description || undefined });
      setShowModal(false);
      setForm({ name: "", group: "OPERATING", description: "" });
      await load();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await api.del(`/expenses/categories/${id}`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  }

  const inputCls = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/expenses" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expense Categories</h1>
            <p className="mt-0.5 text-sm text-gray-500">Organize spending by group (§10.18)</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus size={16} /> New Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <div key={c.id} className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50"><Tags size={16} className="text-primary-600" /></div>
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {GROUPS[c.group] ?? c.group}{c._count?.expenses != null ? ` · ${c._count.expenses} expense${c._count.expenses === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id, c.name)}
                className="rounded p-1.5 text-gray-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Category</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {modalError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{modalError}</div>}
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Maintenance" required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Group</label>
                <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className={inputCls}>
                  {Object.entries(GROUPS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="optional" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving && <Loader2 size={15} className="animate-spin" />} Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
