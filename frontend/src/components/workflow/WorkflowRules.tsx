"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus, RefreshCw, Trash2, Loader2, GitBranch, ChevronDown, ChevronRight,
  CircleDot, Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";

interface TmplLevel { level: number; role: string; }
interface WorkflowTemplate {
  id: string; name: string; entityType: string; entityLabel?: string | null;
  conditionField?: string; conditionOperator?: string; conditionValue: number;
  levels: TmplLevel[]; escalateAfterHours: number; isActive: number; createdAt: string;
}

const ENTITIES: [string, string][] = [
  ["PRICE_CHANGE", "Catalog price change"],
  ["STOCK_ADJUST", "Stock adjustment"],
  ["PRICE_OVERRIDE", "POS price override"],
  ["CREDIT_LIMIT", "Customer credit limit"],
  ["CREDIT_HOLD", "Customer credit hold"],
  ["PURCHASE_ORDER", "Purchase order"],
  ["PURCHASE_REQUISITION", "Purchase requisition"],
  ["EXPENSE", "Expense"],
  ["SHIFT_CLOSE", "Shift close variance"],
  ["TASK", "Task approval"],
  ["SALE_DISCOUNT", "Discount / price override"],
];
const ROLES = ["MANAGER", "DIRECTOR", "OWNER", "FINANCE", "SUPERVISOR", "ADMIN"];

const emptyLevels = (n = 1): TmplLevel[] => Array.from({ length: n }, (_, i) => ({ level: i + 1, role: "MANAGER" }));

export default function WorkflowRules({ autoCreate = false }: { autoCreate?: boolean }) {
  const [rows, setRows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(autoCreate);
  const [editing, setEditing] = useState<WorkflowTemplate | null>(null);
  const [form, setForm] = useState<any>({
    name: "", entityType: "PURCHASE_ORDER", conditionField: "amount",
    conditionOperator: ">", conditionValue: "50000", escalateAfterHours: "24",
    levels: emptyLevels(2),
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const show = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: WorkflowTemplate[] }>("/v1/approvals/templates");
      setRows(res.data);
    } catch (err: any) { console.error(err); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ name: "", entityType: "PURCHASE_ORDER", conditionField: "amount", conditionOperator: ">", conditionValue: "50000", escalateAfterHours: "24", levels: emptyLevels(2) });
    setShowForm(true);
  }
  function openEdit(t: WorkflowTemplate) {
    setEditing(t);
    setForm({
      name: t.name, entityType: t.entityType,
      conditionField: t.conditionField || "amount", conditionOperator: t.conditionOperator || ">",
      conditionValue: String(t.conditionValue), escalateAfterHours: String(t.escalateAfterHours),
      levels: (t.levels || []).length ? t.levels : emptyLevels(1),
    });
    setShowForm(true);
  }

  function setLevel(i: number, patch: Partial<TmplLevel>) {
    setForm((f: any) => {
      const levels = (f.levels || []).map((l: TmplLevel, idx: number) => (idx === i ? { ...l, ...patch } : l));
      return { ...f, levels };
    });
  }
  function addLevel() {
    setForm((f: any) => ({ ...f, levels: [...(f.levels || []), { level: (f.levels?.length || 0) + 1, role: "DIRECTOR" }] }));
  }
  function removeLevel() {
    setForm((f: any) => ({ ...f, levels: (f.levels || []).slice(0, -1) }));
  }

  async function save() {
    if (!form.name.trim()) { alert("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, entityType: form.entityType,
        conditionField: form.conditionField, conditionOperator: form.conditionOperator,
        conditionValue: Number(form.conditionValue) || 0,
        levels: (form.levels || []).map((l: TmplLevel) => ({ level: l.level, role: l.role })),
        escalateAfterHours: Number(form.escalateAfterHours) || 24,
        isActive: editing ? undefined : 1,
      };
      if (editing) {
        await api.patch(`/v1/approvals/templates/${editing.id}`, payload);
      } else {
        await api.post("/v1/approvals/templates", payload);
      }
      show(editing ? "Template updated" : "Template created — future changes over the threshold will route through it");
      setShowForm(false); setEditing(null); load();
    } catch (err: any) { alert(err?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function toggleActive(t: WorkflowTemplate) {
    try {
      await api.patch(`/v1/approvals/templates/${t.id}`, { isActive: t.isActive ? 0 : 1 });
      load();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function remove(t: WorkflowTemplate) {
    if (!confirm(`Delete template “${t.name}”? Active requests are not affected.`)) return;
    try {
      await api.del(`/v1/approvals/templates/${t.id}`);
      show("Template deleted"); load();
    } catch (err: any) { alert(err?.message || "Delete failed"); }
  }

  return (
    <div className="space-y-6">
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <GitBranch size={22} className="text-primary-600" /> Workflow rules
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            “If {`{change}`} is over the threshold → route through this approval chain.” Levels fire in order; escalation & timeout auto-advance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomButton variant="outline" onClick={load}><RefreshCw size={14} /> Refresh</CustomButton>
          <CustomButton onClick={openNew}><Plus size={15} /> New approval rule</CustomButton>
        </div>
      </div>

      {/* Entity preset quick-add strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Discount > 10%", "SALE_DISCOUNT", "10", 1],
          ["Purchase > ৳5L", "PURCHASE_ORDER", "500000", 2],
          ["Refund/Expense > ৳50k", "EXPENSE", "50000", 2],
          ["Credit limit > ৳1L", "CREDIT_LIMIT", "100000", 1],
        ].map(([label, et, val, lvl]) => (
          <button key={et as string + val} onClick={() => {
            setEditing(null);
            setForm({ name: label as string, entityType: et as string, conditionField: "amount", conditionOperator: ">", conditionValue: val as string, escalateAfterHours: "24", levels: emptyLevels(lvl as number) });
            setShowForm(true);
          }} className="group rounded-xl border border-dashed border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary-300 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Preset</p>
            <p className="mt-1 text-sm font-semibold text-gray-800 group-hover:text-primary-700">{label}</p>
            <p className="mt-1 text-[11px] text-gray-400">{lvl} level{lvl === 1 ? "" : "s"} · {et}</p>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-300" /></div>}
        {!loading && rows.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-400">No approval rules yet — create one, or use a preset above.</p>
          </div>
        )}
        {rows.map((t) => {
          const cond = `${t.conditionField || "amount"} ${t.conditionOperator || ">"} ${taka(t.conditionValue)}`;
          const isOpen = expanded[t.id];
          return (
            <div key={t.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button onClick={() => setExpanded((e) => ({ ...e, [t.id]: !isOpen }))} className="flex items-center gap-1 text-gray-400 hover:text-gray-600">
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{t.entityType}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-200 text-gray-400"}`}>
                      <CircleDot size={9} /> {t.isActive ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    <span className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-700">{cond}</span>
                    {` → `}{t.levels.length} level{t.levels.length > 1 ? "s" : ""} · escalate {t.escalateAfterHours}h
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(t)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">{t.isActive ? "Pause" : "Activate"}</button>
                  <button onClick={() => openEdit(t)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">Edit</button>
                  <button onClick={() => remove(t)} className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-100"><Trash2 size={11} /></button>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-gray-50 bg-gray-50/60 px-6 py-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Approval chain</p>
                  <div className="flex flex-wrap items-center gap-0">
                    {t.levels.map((l, i) => (
                      <div key={i} className="flex items-center">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs">
                          <p className="font-semibold text-gray-800">Level {l.level}</p>
                          <p className="text-gray-400">{l.role}</p>
                        </div>
                        {i < t.levels.length - 1 && <ChevronRight size={14} className="mx-1 text-gray-300" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create / edit modal ── */}
      <CustomModal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Edit approval rule" : "New approval rule"}>
        <div className="space-y-3">
          <CustomInput label="Rule name *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Purchase above ৳500,000" />
          <CustomSelect label="Entity type *" value={form.entityType} onChange={(e: any) => setForm({ ...form, entityType: e.target.value })}
            options={ENTITIES.map(([v, l]) => ({ value: v, label: l }))} />
          <div className="grid grid-cols-3 gap-3">
            <CustomSelect label="Field" value={form.conditionField} onChange={(e: any) => setForm({ ...form, conditionField: e.target.value })}
              options={[{ value: "amount", label: "Amount" }, { value: "discountPct", label: "Discount %" }, { value: "qty", label: "Quantity" }]} />
            <CustomSelect label="Operator" value={form.conditionOperator} onChange={(e: any) => setForm({ ...form, conditionOperator: e.target.value })}
              options={[{ value: ">", label: ">" }, { value: ">=", label: "≥" }, { value: "<", label: "<" }, { value: "<=", label: "≤" }, { value: "=", label: "=" }]} />
            <CustomInput label="Threshold" type="number" value={form.conditionValue} onChange={(e: any) => setForm({ ...form, conditionValue: e.target.value })} />
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-500"><GitBranch size={12} /> Approval levels</p>
            <div className="space-y-2">
              {(form.levels || []).map((l: TmplLevel, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-bold text-primary-700">{l.level}</span>
                  <CustomSelect value={l.role} onChange={(e: any) => setLevel(i, { role: e.target.value })}
                    options={ROLES.map((r) => ({ value: r, label: r }))} containerClassName="flex-1" />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <CustomButton variant="outline" size="sm" onClick={addLevel}><Plus size={12} /> Add level</CustomButton>
              {(form.levels || []).length > 1 && (
                <CustomButton variant="outline" size="sm" onClick={removeLevel}>Remove last</CustomButton>
              )}
            </div>
          </div>
          <CustomInput label="Auto-escalate after (hours)" type="number" value={form.escalateAfterHours} onChange={(e: any) => setForm({ ...form, escalateAfterHours: e.target.value })} hint="Pending requests escalate to the next level after this many hours." leftIcon={<Clock size={13} />} />
          <div className="flex justify-end gap-2 pt-1">
            <CustomButton variant="outline" onClick={() => setShowForm(false)}>Cancel</CustomButton>
            <CustomButton onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {editing ? "Save changes" : "Create rule"}</CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

function taka(v: any) {
  return `৳${(Number(v) || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}
