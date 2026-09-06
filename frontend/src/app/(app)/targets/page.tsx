"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Target, Plus, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus,
  GitBranch, FolderTree, Building2, Trash2, Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

const currency = (v: any) => `৳${(Number(v) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

interface BudgetRow {
  id: string; name: string; scopeType: string; scopeId: string; scopeName?: string;
  periodType: string; periodStart: string; periodEnd: string; amount: number;
  actual?: number; variance?: number; variancePct?: number; achievementPct?: number;
  onTrack?: boolean; note?: string | null; status: string;
}
interface VarianceResp { budgets: BudgetRow[]; totals: { totalBudget: number; totalActual: number; totalVariance: number }; }
interface ScopeOpt { id: string; name: string; }

export default function TargetsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<VarianceResp>({ budgets: [], totals: { totalBudget: 0, totalActual: 0, totalVariance: 0 } });
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({ name: "", scopeType: "BRANCH", scopeId: "", amount: "", periodStart: "", periodEnd: "", periodType: "CUSTOM", note: "" });
  const [branches, setBranches] = useState<ScopeOpt[]>([]);
  const [depts, setDepts] = useState<ScopeOpt[]>([]);
  const [cats, setCats] = useState<ScopeOpt[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  const loadScopes = useCallback(async () => {
    try {
      const [b, d, c] = await Promise.all([
        api.get<{ data: any[] }>("/v1/branches").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/v1/hrm/departments?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/v1/products/categories").catch(() => ({ data: [] as any[] })),
      ]);
      const bList = (b as any)?.data ?? b ?? [];
      const dList = (d as any)?.data ?? d ?? [];
      const cList = (c as any)?.data ?? c ?? [];
      setBranches(Array.isArray(bList) ? bList.map((x: any) => ({ id: x.id, name: x.name })) : []);
      setDepts(Array.isArray(dList) ? dList.map((x: any) => ({ id: x.id, name: x.name })) : []);
      setCats(Array.isArray(cList) ? cList.map((x: any) => ({ id: x.id, name: x.name })) : []);
    } catch (err: any) { console.error(err); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: VarianceResp }>("/v1/budgets/variance");
      setData(res.data);
    } catch (err: any) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadScopes(); load(); }, [loadScopes, load]);

  const scopeOptions = form.scopeType === "BRANCH" ? branches : form.scopeType === "DEPARTMENT" ? depts : cats;
  const scopeLabel = form.scopeType === "BRANCH" ? "Branch" : form.scopeType === "DEPARTMENT" ? "Department" : "Product category";

  async function createBudget() {
    if (!form.scopeId || !form.amount || !form.periodStart || !form.periodEnd) { alert("All fields required"); return; }
    try {
      await api.post("/v1/budgets", { ...form, amount: Number(form.amount), periodType: form.periodType });
      setShowCreate(false);
      showMessage("Budget created");
      load();
    } catch (err: any) { alert(err?.message || "Failed to create"); }
  }

  async function removeBudget() {
    if (!deleteId) return;
    try {
      await api.del(`/v1/budgets/${deleteId}`);
      setDeleteId(null);
      showMessage("Budget deleted");
      load();
    } catch (err: any) { alert(err?.message || "Delete failed"); }
  }

  return (
    <div className="space-y-6">
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Target size={22} className="text-primary-600" /> Budget vs Actual
          </h1>
          <p className="mt-1 text-sm text-gray-500">Branch / department / category budgets with live variance tracking (§10.35)</p>
        </div>
        <CustomButton onClick={() => { loadScopes(); setForm({ name: "", scopeType: "BRANCH", scopeId: "", amount: "", periodStart: "", periodEnd: "", periodType: "CUSTOM", note: "" }); setShowCreate(true); }}><Plus size={15} /> New Budget</CustomButton>
      </div>

      {/* KPI totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Wallet size={13} /> Total budget</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{currency(data.totals.totalBudget)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><TrendingUp size={13} /> Actual</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{currency(data.totals.totalActual)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400">Variance</p>
          <p className={`mt-1 text-2xl font-bold ${data.totals.totalVariance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {data.totals.totalVariance >= 0 ? "+" : ""}{currency(data.totals.totalVariance)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Target size={13} /> Budgets</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data.budgets.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
          <RefreshCw size={13} /> Refresh
        </button>
        <p className="ml-auto text-xs text-gray-400">Actual is computed live from CONFIRMED/COMPLETED sales in the budget period</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-400" /></div>
      ) : data.budgets.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Target size={28} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No budgets yet</p>
          <p className="mt-1 text-xs text-gray-400">Create a branch, department or category budget to start tracking variance</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Budgeted</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Variance</th>
                <th className="px-4 py-3 w-56">Achievement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.budgets.map((b) => {
                const variance = Number(b.variance || 0);
                const pct = Number(b.achievementPct || 0);
                const Icon = b.scopeType === "BRANCH" ? Building2 : b.scopeType === "DEPARTMENT" ? GitBranch : FolderTree;
                return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{b.name}</p>
                      {b.note && <p className="text-[11px] text-gray-400">{b.note}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        <Icon size={11} /> {b.scopeType}
                      </span>
                      <p className="mt-0.5 text-xs font-medium text-gray-700">{b.scopeName || b.scopeId.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p>{new Date(b.periodStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })} → {new Date(b.periodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</p>
                      <p className="text-[10px] uppercase text-gray-400">{b.periodType}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{currency(b.amount)}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">{currency(b.actual)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-semibold ${variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {variance >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {variance >= 0 ? "+" : ""}{currency(variance)}
                        <span className="text-[10px] font-normal text-gray-400">({variance >= 0 ? "+" : ""}{b.variancePct}%)</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${b.onTrack ? "bg-emerald-500" : "bg-rose-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="w-12 text-right text-xs font-semibold text-gray-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteId(b.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create budget modal ── */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New budget">
        <div className="space-y-3">
          <CustomInput label="Name *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dhanmondi branch October" />
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Scope type" value={form.scopeType} onChange={(e: any) => { setForm({ ...form, scopeType: e.target.value, scopeId: "" }); }}
              options={[{ value: "BRANCH", label: "Branch" }, { value: "DEPARTMENT", label: "Department" }, { value: "CATEGORY", label: "Category" }]} />
            <CustomSelect label={scopeLabel} value={form.scopeId} onChange={(e: any) => setForm({ ...form, scopeId: e.target.value })}
              options={scopeOptions.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select…" />
          </div>
          <CustomInput label="Budget amount (৳) *" type="number" value={form.amount} onChange={(e: any) => setForm({ ...form, amount: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Period start *" type="date" value={form.periodStart} onChange={(e: any) => setForm({ ...form, periodStart: e.target.value })} />
            <CustomInput label="Period end *" type="date" value={form.periodEnd} onChange={(e: any) => setForm({ ...form, periodEnd: e.target.value })} />
          </div>
          <CustomSelect label="Period type" value={form.periodType} onChange={(e: any) => setForm({ ...form, periodType: e.target.value })}
            options={["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"].map((v) => ({ value: v, label: v[0] + v.slice(1).toLowerCase() }))} />
          <CustomInput label="Note" value={form.note} onChange={(e: any) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton onClick={createBudget}><Plus size={15} /> Create budget</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Delete confirm ── */}
      <CustomModal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete budget">
        <p className="text-sm text-gray-600">Delete this budget? This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <CustomButton variant="outline" onClick={() => setDeleteId(null)}>Keep</CustomButton>
          <CustomButton variant="danger" onClick={removeBudget}><Trash2 size={14} /> Delete</CustomButton>
        </div>
      </CustomModal>
    </div>
  );
}
