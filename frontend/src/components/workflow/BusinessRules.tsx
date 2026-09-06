"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, RefreshCw, Trash2, Loader2, Zap, Settings2, ShoppingCart,
  TestTube2, CheckCircle2, ArrowRight, X,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";

interface BusinessRule {
  id: string; name: string; triggerType: string;
  conditions: Record<string, any>; actions: any[];
  priority: number; isActive: number; lastFiredAt?: string | null; createdAt: string;
}
interface Recommendation {
  id: string; productName?: string | null; currentStock: number; reorderPoint: number;
  suggestedQty: number; status: string; note?: string | null; createdAt: string;
}

const TRIGGERS: [string, string][] = [
  ["LOW_STOCK", "Low stock (stock < reorder point)"],
  ["SALE_DISCOUNT", "Sale discount"],
  ["VIP_CUSTOMER", "VIP customer"],
  ["CREDIT_SALE", "Credit sale risk"],
];

const TRIGGER_DESC: Record<string, string> = {
  LOW_STOCK: "Fires when any product's on-hand stock drops below its reorder point.",
  SALE_DISCOUNT: "Fires when a POS/quote discount is applied at or above the configured level.",
  VIP_CUSTOMER: "Fires when the customer on the transaction is in the VIP tier.",
  CREDIT_SALE: "Fires when a customer tries a credit sale while their due balance exceeds their limit.",
};

const ACTION_TYPES: [string, string][] = [
  ["CREATE_PURCHASE_RECOMMENDATION", "Create purchase recommendation"],
  ["CREATE_APPROVAL", "Route to approval engine"],
  ["SET_DISCOUNT", "Auto-apply discount"],
  ["BLOCK", "Block the action"],
  ["LOG", "Log event only"],
];

const COND_OPS = [
  ["eq", "equals"], ["ne", "not equals"], ["gt", ">"], ["gte", "≥"], ["lt", "<"],
];

export default function BusinessRules({ autoCreate = false }: { autoCreate?: boolean }) {
  const [tab, setTab] = useState<"rules" | "recommendations" | "test">("rules");
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(autoCreate);
  const [editing, setEditing] = useState<BusinessRule | null>(null);
  const [trigger, setTrigger] = useState("LOW_STOCK");
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const show = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  const loadRules = useCallback(async () => {
    try {
      const res = await api.get<{ data: BusinessRule[] }>("/v1/business-rules");
      setRules(res.data);
    } catch (err: any) { console.error(err); }
  }, []);
  const loadRecs = useCallback(async () => {
    try {
      const res = await api.get<{ data: Recommendation[] }>("/v1/purchase-recommendations?status=PENDING");
      setRecs(res.data);
    } catch (err: any) { console.error(err); }
  }, []);

  useEffect(() => { (async () => { await Promise.all([loadRules(), loadRecs()]); setLoading(false); })(); }, [loadRules, loadRecs]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rules) c[r.triggerType] = (c[r.triggerType] || 0) + 1;
    return c;
  }, [rules]);
  const activeCount = rules.filter((r) => r.isActive).length;

  function freshForm(triggerType = trigger) {
    return {
      name: "", triggerType,
      conds: [{ field: "stock", op: "lt", value: "" }],
      actions: [{ type: triggerType === "LOW_STOCK" ? "CREATE_PURCHASE_RECOMMENDATION" : triggerType === "VIP_CUSTOMER" ? "SET_DISCOUNT" : "CREATE_APPROVAL", reason: "", discountPct: "", entityType: "SALE_DISCOUNT" }],
      priority: 0,
    };
  }
  function openNew() {
    setEditing(null);
    setForm(freshForm());
    setShowForm(true);
  }
  function openEdit(r: BusinessRule) {
    setEditing(r);
    const conds = Object.entries(r.conditions || {}).map(([field, spec]) => ({
      field, op: typeof spec === "object" ? spec.op || "eq" : "eq",
      value: typeof spec === "object" ? String(spec.value ?? "") : String(spec),
    }));
    setForm({
      name: r.name, triggerType: r.triggerType, priority: r.priority,
      conds: conds.length ? conds : [{ field: "amount", op: "gt", value: "" }],
      actions: (r.actions || []).map((a) => ({ type: a.type, reason: a.reason || "", discountPct: a.discountPct ?? "", entityType: a.entityType || "SALE_DISCOUNT" })),
    });
    setShowForm(true);
  }
  function setCond(i: number, patch: any) {
    setForm((f: any) => ({ ...f, conds: f.conds.map((c: any, idx: number) => idx === i ? { ...c, ...patch } : c) }));
  }
  function setAct(i: number, patch: any) {
    setForm((f: any) => ({ ...f, actions: f.actions.map((a: any, idx: number) => idx === i ? { ...a, ...patch } : a) }));
  }

  function buildConditions() {
    const out: Record<string, any> = {};
    for (const c of form.conds || []) {
      if (!c.field) continue;
      if (c.op === "eq" || c.op === "ne") out[c.field] = { op: c.op, value: c.value };
      else out[c.field] = { op: c.op, value: Number(c.value) || 0 };
    }
    return out;
  }
  function buildActions() {
    return (form.actions || []).map((a: any) => {
      const base: any = { type: a.type };
      if (a.type === "BLOCK") base.reason = a.reason || "Blocked by business rule";
      if (a.type === "SET_DISCOUNT") base.discountPct = Number(a.discountPct) || 0;
      if (a.type === "CREATE_APPROVAL") {
        base.entityType = a.entityType || "SALE_DISCOUNT";
        base.summary = `Business rule: ${form.name || "rule"}`;
      }
      return base;
    });
  }

  async function save() {
    if (!form.name.trim()) { alert("Rule name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, triggerType: form.triggerType,
        conditions: buildConditions(), actions: buildActions(),
        priority: Number(form.priority) || 0,
      };
      if (editing) {
        await api.patch(`/v1/business-rules/${editing.id}`, payload);
        show("Rule updated");
      } else {
        await api.post("/v1/business-rules", payload);
        show("Rule created — it fires on the next matching trigger");
      }
      setShowForm(false); setEditing(null); loadRules(); loadRecs();
    } catch (err: any) { alert(err?.message || "Save failed"); }
    finally { setSaving(false); }
  }
  async function toggleRule(r: BusinessRule) {
    try { await api.patch(`/v1/business-rules/${r.id}`, { isActive: r.isActive ? 0 : 1 }); loadRules(); }
    catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function deleteRule(r: BusinessRule) {
    if (!confirm(`Delete rule “${r.name}”?`)) return;
    try { await api.del(`/v1/business-rules/${r.id}`); show("Rule deleted"); loadRules(); }
    catch (err: any) { alert(err?.message || "Delete failed"); }
  }
  async function convertRec(r: Recommendation) {
    if (!confirm(`Convert ${r.productName} recommendation into a purchase requisition?`)) return;
    try {
      await api.post(`/v1/purchase-recommendations/${r.id}/convert`, {});
      show("Converted to purchase requisition"); loadRecs();
    } catch (err: any) { alert(err?.message || "Convert failed"); }
  }
  async function dismissRec(r: Recommendation) {
    try { await api.post(`/v1/purchase-recommendations/${r.id}/dismiss`, {}); loadRecs(); }
    catch (err: any) { alert(err?.message || "Failed"); }
  }

  function humanCond(conds: Record<string, any>) {
    const parts = Object.entries(conds || {}).map(([f, spec]) => {
      const op = typeof spec === "object" ? spec.op : "eq";
      const v = typeof spec === "object" ? spec.value : spec;
      const opTxt: Record<string, string> = { eq: "=", ne: "≠", gt: ">", gte: "≥", lt: "<" };
      return `${f} ${opTxt[op] || op} ${v}`;
    });
    return parts.join(" AND ") || "always";
  }
  const actionLabel = (a: any): string => {
    const map: Record<string, string> = {
      CREATE_PURCHASE_RECOMMENDATION: "purchase recommendation",
      CREATE_APPROVAL: `approval → ${a.entityType || "SALE_DISCOUNT"}`,
      SET_DISCOUNT: `${a.discountPct ?? 0}% discount`,
      BLOCK: "block",
      LOG: "log",
    };
    return map[a.type] || a.type;
  };
  function humanActions(actions: any[]) {
    return (actions || []).map(actionLabel).join(", ");
  }

  // ── test console ──
  const [testTrigger, setTestTrigger] = useState("SALE_DISCOUNT");
  const [testCtx, setTestCtx] = useState('{\n  "amount": 2500,\n  "discountPct": 25\n}');
  const [testOut, setTestOut] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  async function runTest() {
    setTestLoading(true);
    setTestOut(null);
    try {
      let ctx = {};
      try { ctx = JSON.parse(testCtx); } catch { alert("Context must be valid JSON"); return; }
      const res = await api.post<{ data: any }>("/v1/business-rules/evaluate", { triggerType: testTrigger, context: ctx });
      setTestOut(res.data);
    } catch (err: any) { alert(err?.message || "Evaluate failed"); }
    finally { setTestLoading(false); }
  }

  return (
    <div className="space-y-6">
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Settings2 size={22} className="text-primary-600" /> Business Rule Engine
          </h1>
          <p className="mt-1 text-sm text-gray-500">IF condition THEN action — configurable rules that fire on stock, discount, VIP and credit events</p>
        </div>
        <CustomButton onClick={openNew}><Plus size={15} /> New rule</CustomButton>
      </div>

      {/* KPI + trigger catalog */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400">Active rules</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}<span className="ml-1 text-sm font-medium text-gray-400">/ {rules.length}</span></p>
        </div>
        {TRIGGERS.map(([code, label]) => (
          <button key={code} onClick={() => { setTrigger(code); setForm(freshForm(code)); setShowForm(true); }}
            className="group rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-primary-300 hover:shadow-md">
            <p className="flex items-center justify-between text-xs font-semibold text-gray-700"><Zap size={12} className="text-primary-500" /> {label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{counts[code] || 0}<span className="ml-1 text-[11px] font-normal text-gray-400">rule{counts[code] === 1 ? "" : "s"}</span></p>
            <p className="mt-1 text-[10px] leading-snug text-gray-400 group-hover:text-primary-600">+ configure new</p>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-2">
        {([["rules", "Rules", Settings2], ["recommendations", `Purchase suggestions${recs.length ? ` (${recs.length})` : ""}`, ShoppingCart], ["test", "Test console", TestTube2]] as [any, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === id ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
        <button onClick={() => { loadRules(); loadRecs(); }} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"><RefreshCw size={13} /> Refresh</button>
      </div>

      {/* ═══ RULES TAB ═══ */}
      {tab === "rules" && (
        <div className="space-y-3">
          {loading && <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-300" /></div>}
          {!loading && rules.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-400">No business rules yet. Start with a trigger card above.</p>
            </div>
          )}
          {rules.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><Zap size={16} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{r.name}</p>
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{r.triggerType}</span>
                  {r.lastFiredAt && <span className="text-[10px] text-gray-400">fired {new Date(r.lastFiredAt).toLocaleString("en-GB")}</span>}
                </div>
                <p className="mt-0.5 font-mono text-xs text-gray-600">
                  IF <span className="rounded bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">{humanCond(r.conditions)}</span>
                  <ArrowRight size={11} className="mx-1 inline text-gray-300" />
                  THEN <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">{humanActions(r.actions)}</span>
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-200 text-gray-400"}`}>{r.isActive ? "ACTIVE" : "OFF"}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => toggleRule(r)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">{r.isActive ? "Pause" : "Enable"}</button>
                <button onClick={() => openEdit(r)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">Edit</button>
                <button onClick={() => deleteRule(r)} className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-100"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ RECOMMENDATIONS TAB ═══ */}
      {tab === "recommendations" && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Product</th><th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Reorder point</th><th className="px-4 py-3">Suggested qty</th>
                <th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{r.productName || "—"}</p>
                    <p className="text-[11px] text-gray-400">{r.note}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-rose-600">{r.currentStock}</td>
                  <td className="px-4 py-3 text-gray-700">{r.reorderPoint}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">+{r.suggestedQty}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => convertRec(r)} className="rounded-md bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-100">Convert to requisition</button>
                      <button onClick={() => dismissRec(r)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-200">Dismiss</button>
                    </div>
                  </td>
                </tr>
              ))}
              {recs.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">No pending suggestions — rules like “stock &lt; reorder point → recommend purchase” populate this list.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TEST TAB ═══ */}
      {tab === "test" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800"><TestTube2 size={15} className="text-primary-600" /> Fire a trigger against test context</p>
            <CustomSelect label="Trigger" value={testTrigger} onChange={(e) => setTestTrigger(e.target.value)}
              options={TRIGGERS.map(([v, l]) => ({ value: v, label: l }))} />
            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">Context (JSON)</p>
              <textarea value={testCtx} onChange={(e) => setTestCtx(e.target.value)} rows={9} spellCheck={false}
                className="w-full rounded-lg border border-gray-200 bg-gray-900 p-3 font-mono text-[12px] text-gray-100 outline-none focus:border-primary-400" />
            </div>
            <div className="flex justify-end"><CustomButton onClick={runTest} disabled={testLoading}>{testLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Evaluate</CustomButton></div>
            <p className="rounded-lg bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-500">{TRIGGER_DESC[testTrigger]}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800">Result</p>
            {testOut === null && !testLoading && <p className="mt-8 text-center text-sm text-gray-400">Run an evaluation to see which rules fire.</p>}
            {testOut && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">Trigger <b>{testOut.trigger}</b> matched <b>{testOut.matched}</b> rule{testOut.matched === 1 ? "" : "s"}</p>
                {(testOut.results || []).map((res: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-800">{res.rule}</p>
                      <p className="font-mono text-[11px] text-gray-500">{res.action}</p>
                    </div>
                    <span className="ml-2 shrink-0">
                      {res.blocked ? <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600">BLOCKED</span>
                        : res.approval ? <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600">Approval needed</span>
                        : res.created !== undefined ? <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600">{res.created > 0 ? `${res.created} created` : "none"}</span>
                        : res.discountPct !== undefined ? <span className="rounded-md bg-primary-500/10 px-2 py-0.5 text-[11px] font-bold text-primary-600">{res.discountPct}%</span>
                        : <CheckCircle2 size={15} className="text-emerald-500" />}
                    </span>
                  </div>
                ))}
                {(testOut.results || []).length === 0 && <p className="rounded-lg bg-gray-50 p-4 text-center text-xs text-gray-400">No active rule matched this context.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Rule form modal ── */}
      <CustomModal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Edit business rule" : "New business rule"}>
        {form && (
          <div className="space-y-3">
            <CustomInput label="Rule name *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Block credit sale over limit" />
            <CustomSelect label="Trigger *" value={form.triggerType} onChange={(e: any) => setForm({ ...form, triggerType: e.target.value })}
              options={TRIGGERS.map(([v, l]) => ({ value: v, label: l }))} />
            <p className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500">{TRIGGER_DESC[form.triggerType]}</p>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">Conditions (all must hold)</p>
              <div className="space-y-2">
                {(form.conds || []).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <CustomInput value={c.field} onChange={(e: any) => setCond(i, { field: e.target.value })} placeholder="field" containerClassName="flex-1" />
                    <CustomSelect value={c.op} onChange={(e: any) => setCond(i, { op: e.target.value })}
                      options={COND_OPS.map(([v, l]) => ({ value: v, label: l }))} containerClassName="w-28" />
                    <CustomInput value={c.value} onChange={(e: any) => setCond(i, { value: e.target.value })} placeholder="value" containerClassName="flex-1" />
                    {(form.conds || []).length > 1 && (
                      <button onClick={() => setForm((f: any) => ({ ...f, conds: f.conds.filter((_: any, idx: number) => idx !== i) }))} className="text-gray-300 hover:text-rose-500"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setForm((f: any) => ({ ...f, conds: [...f.conds, { field: "amount", op: "gt", value: "" }] }))} className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700">+ Add condition</button>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">Actions</p>
              <div className="space-y-2">
                {(form.actions || []).map((a: any, i: number) => (
                  <div key={i} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2">
                      <CustomSelect value={a.type} onChange={(e: any) => setAct(i, { type: e.target.value })}
                        options={ACTION_TYPES.map(([v, l]) => ({ value: v, label: l }))} containerClassName="flex-1" />
                      {(form.actions || []).length > 1 && (
                        <button onClick={() => setForm((f: any) => ({ ...f, actions: f.actions.filter((_: any, idx: number) => idx !== i) }))} className="text-gray-300 hover:text-rose-500"><X size={14} /></button>
                      )}
                    </div>
                    {a.type === "BLOCK" && <CustomInput label="Block reason" value={a.reason} onChange={(e: any) => setAct(i, { reason: e.target.value })} />}
                    {a.type === "SET_DISCOUNT" && <CustomInput label="Discount %" type="number" value={a.discountPct} onChange={(e: any) => setAct(i, { discountPct: e.target.value })} />}
                    {a.type === "CREATE_APPROVAL" && (
                      <CustomSelect label="Approval entity type" value={a.entityType} onChange={(e: any) => setAct(i, { entityType: e.target.value })}
                        options={[["SALE_DISCOUNT", "Sale discount"], ["PURCHASE_ORDER", "Purchase order"], ["EXPENSE", "Expense"], ["CREDIT_LIMIT", "Credit limit"], ["STOCK_ADJUST", "Stock adjustment"]].map(([v, l]) => ({ value: v, label: l }))} />
                    )}
                    {a.type === "CREATE_PURCHASE_RECOMMENDATION" && <p className="text-[11px] text-gray-400">Creates purchase suggestions for every product below its reorder point.</p>}
                    {a.type === "LOG" && <p className="text-[11px] text-gray-400">Records the event in the audit log only.</p>}
                  </div>
                ))}
              </div>
              <button onClick={() => setForm((f: any) => ({ ...f, actions: [...f.actions, { type: "LOG", reason: "", discountPct: "", entityType: "SALE_DISCOUNT" }] }))} className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700">+ Add action</button>
            </div>

            <CustomInput label="Priority (higher fires first)" type="number" value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })} />
            <div className="flex justify-end gap-2 pt-1">
              <CustomButton variant="outline" onClick={() => setShowForm(false)}>Cancel</CustomButton>
              <CustomButton onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {editing ? "Save changes" : "Create rule"}</CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}
