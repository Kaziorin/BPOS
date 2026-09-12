"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  GitBranch,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  Settings,
  Shield,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  Package,
  FileText,
  Building2,
  Check,
  X,
  Copy,
  Edit3,
  SlidersHorizontal,
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";

export interface TmplLevel {
  level: number;
  role: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  entityType: string;
  entityLabel?: string | null;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue: number;
  levels: TmplLevel[];
  escalateAfterHours: number;
  isActive: number;
  createdAt: string;
}

export const ENTITIES: { type: string; label: string; icon: string; category: string; defaultField: string }[] = [
  { type: "PURCHASE_ORDER", label: "Purchase Order (PO)", icon: "Package", category: "Procurement", defaultField: "amount" },
  { type: "PURCHASE_REQUISITION", label: "Purchase Requisition (PR)", icon: "FileText", category: "Procurement", defaultField: "amount" },
  { type: "EXPENSE", label: "Expense Claim & Payout", icon: "DollarSign", category: "Finance", defaultField: "amount" },
  { type: "STOCK_ADJUST", label: "Stock Adjustment / Write-Off", icon: "Layers", category: "Inventory", defaultField: "amount" },
  { type: "PRICE_CHANGE", label: "Catalog Price Change", icon: "Tag", category: "Catalog", defaultField: "amount" },
  { type: "PRICE_OVERRIDE", label: "POS Price Override", icon: "DollarSign", category: "POS", defaultField: "amount" },
  { type: "SALE_DISCOUNT", label: "POS Sale Discount %", icon: "Tag", category: "POS", defaultField: "discountPct" },
  { type: "CREDIT_LIMIT", label: "Customer Credit Limit Increase", icon: "Building2", category: "Sales", defaultField: "amount" },
  { type: "CREDIT_HOLD", label: "Customer Credit Hold", icon: "Shield", category: "Sales", defaultField: "amount" },
  { type: "SHIFT_CLOSE", label: "Cash Shift Close Variance", icon: "Clock", category: "POS", defaultField: "amount" },
  { type: "TASK", label: "Task Approval", icon: "FileText", category: "Operations", defaultField: "amount" },
  { type: "REFUND", label: "Customer Refund", icon: "DollarSign", category: "Sales", defaultField: "amount" },
];

export const ROLES = [
  { value: "MANAGER", label: "Store / Branch Manager" },
  { value: "SUPERVISOR", label: "Floor Supervisor" },
  { value: "FINANCE", label: "Finance / Accounts Officer" },
  { value: "DIRECTOR", label: "Operations Director" },
  { value: "OWNER", label: "Business Owner / Executive" },
  { value: "ADMIN", label: "System Administrator" },
];

const PRESETS = [
  {
    name: "High Value Purchase Order (> ৳500,000)",
    entityType: "PURCHASE_ORDER",
    conditionField: "amount",
    conditionOperator: ">",
    conditionValue: "500000",
    escalateAfterHours: "24",
    levels: [
      { level: 1, role: "MANAGER" },
      { level: 2, role: "DIRECTOR" },
    ],
    desc: "Route large procurement through dual Manager and Director checks.",
  },
  {
    name: "POS Custom Discount (> 10%)",
    entityType: "SALE_DISCOUNT",
    conditionField: "discountPct",
    conditionOperator: ">",
    conditionValue: "10",
    escalateAfterHours: "4",
    levels: [{ level: 1, role: "MANAGER" }],
    desc: "Requires store manager authorization before cashier can apply heavy discount.",
  },
  {
    name: "Substantial Stock Adjustment (> ৳50,000)",
    entityType: "STOCK_ADJUST",
    conditionField: "amount",
    conditionOperator: ">",
    conditionValue: "50000",
    escalateAfterHours: "24",
    levels: [
      { level: 1, role: "SUPERVISOR" },
      { level: 2, role: "FINANCE" },
    ],
    desc: "Warehouse write-offs and quantity adjustments above ৳50k require finance approval.",
  },
  {
    name: "Elevated Customer Credit Limit (> ৳100,000)",
    entityType: "CREDIT_LIMIT",
    conditionField: "amount",
    conditionOperator: ">",
    conditionValue: "100000",
    escalateAfterHours: "48",
    levels: [
      { level: 1, role: "FINANCE" },
      { level: 2, role: "DIRECTOR" },
    ],
    desc: "B2B client credit expansion requires financial solvency review.",
  },
  {
    name: "Branch Expense Outflow (> ৳25,000)",
    entityType: "EXPENSE",
    conditionField: "amount",
    conditionOperator: ">",
    conditionValue: "25000",
    escalateAfterHours: "24",
    levels: [
      { level: 1, role: "MANAGER" },
      { level: 2, role: "FINANCE" },
    ],
    desc: "Petty cash and operational payouts over ৳25,000 route to HQ finance.",
  },
];

export const taka = (v: any) =>
  `৳${(Number(v) || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

export default function WorkflowRules({ autoCreate = false }: { autoCreate?: boolean }) {
  const [rows, setRows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showForm, setShowForm] = useState(autoCreate);
  const [editing, setEditing] = useState<WorkflowTemplate | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState<{
    name: string;
    entityType: string;
    conditionField: string;
    conditionOperator: string;
    conditionValue: string;
    escalateAfterHours: string;
    levels: TmplLevel[];
  }>({
    name: "",
    entityType: "PURCHASE_ORDER",
    conditionField: "amount",
    conditionOperator: ">",
    conditionValue: "50000",
    escalateAfterHours: "24",
    levels: [
      { level: 1, role: "MANAGER" },
      { level: 2, role: "DIRECTOR" },
    ],
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: WorkflowTemplate[] }>("/v1/approvals/templates");
      setRows(res.data || []);
      // auto expand first few
      const initExp: Record<string, boolean> = {};
      (res.data || []).forEach((r) => {
        initExp[r.id] = true;
      });
      setExpanded(initExp);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load approval rules", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterEntity && r.entityType !== filterEntity) return false;
      return true;
    });
  }, [rows, filterEntity]);

  function openNew() {
    setEditing(null);
    setForm({
      name: "",
      entityType: "PURCHASE_ORDER",
      conditionField: "amount",
      conditionOperator: ">",
      conditionValue: "50000",
      escalateAfterHours: "24",
      levels: [
        { level: 1, role: "MANAGER" },
        { level: 2, role: "DIRECTOR" },
      ],
    });
    setShowForm(true);
  }

  function openEdit(t: WorkflowTemplate) {
    setEditing(t);
    setForm({
      name: t.name,
      entityType: t.entityType,
      conditionField: t.conditionField || "amount",
      conditionOperator: t.conditionOperator || ">",
      conditionValue: String(t.conditionValue),
      escalateAfterHours: String(t.escalateAfterHours || 24),
      levels: (t.levels || []).length ? t.levels : [{ level: 1, role: "MANAGER" }],
    });
    setShowForm(true);
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setEditing(null);
    setForm({
      name: p.name,
      entityType: p.entityType,
      conditionField: p.conditionField,
      conditionOperator: p.conditionOperator,
      conditionValue: p.conditionValue,
      escalateAfterHours: p.escalateAfterHours,
      levels: p.levels.map((l) => ({ ...l })),
    });
    setShowForm(true);
  }

  function setLevel(i: number, role: string) {
    setForm((f) => {
      const levels = f.levels.map((l, idx) => (idx === i ? { ...l, role } : l));
      return { ...f, levels };
    });
  }

  function addLevel() {
    setForm((f) => ({
      ...f,
      levels: [...f.levels, { level: f.levels.length + 1, role: "DIRECTOR" }],
    }));
  }

  function removeLevel(idx: number) {
    if (form.levels.length <= 1) return;
    setForm((f) => ({
      ...f,
      levels: f.levels
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, level: i + 1 })),
    }));
  }

  async function save() {
    if (!form.name.trim()) {
      showToast("Rule name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        entityType: form.entityType,
        conditionField: form.conditionField,
        conditionOperator: form.conditionOperator,
        conditionValue: Number(form.conditionValue) || 0,
        levels: form.levels.map((l, i) => ({ level: i + 1, role: l.role })),
        escalateAfterHours: Number(form.escalateAfterHours) || 24,
        isActive: editing ? undefined : 1,
      };

      if (editing) {
        await api.patch(`/v1/approvals/templates/${editing.id}`, payload);
        showToast("Workflow approval rule updated successfully.");
      } else {
        await api.post("/v1/approvals/templates", payload);
        showToast("New approval rule created — changes exceeding threshold will route automatically.");
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err: any) {
      showToast(err?.message || "Failed to save approval rule", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: WorkflowTemplate) {
    try {
      await api.patch(`/v1/approvals/templates/${t.id}`, { isActive: t.isActive ? 0 : 1 });
      showToast(`Rule "${t.name}" ${t.isActive ? "paused" : "activated"}.`);
      load();
    } catch (err: any) {
      showToast(err?.message || "Failed to toggle rule state", "error");
    }
  }

  async function duplicateRule(t: WorkflowTemplate) {
    try {
      await api.post("/v1/approvals/templates", {
        name: `${t.name} (Copy)`,
        entityType: t.entityType,
        conditionField: t.conditionField,
        conditionOperator: t.conditionOperator,
        conditionValue: t.conditionValue,
        levels: t.levels,
        escalateAfterHours: t.escalateAfterHours,
        isActive: 1,
      });
      showToast(`Duplicated rule "${t.name}".`);
      load();
    } catch (err: any) {
      showToast(err?.message || "Failed to duplicate rule", "error");
    }
  }

  async function remove(t: WorkflowTemplate) {
    if (!confirm(`Are you sure you want to delete the approval rule "${t.name}"? Active in-flight requests will not be impacted.`)) return;
    try {
      await api.del(`/v1/approvals/templates/${t.id}`);
      showToast("Approval rule deleted.");
      load();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete rule", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {message && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm font-medium shadow-xs transition-all ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <Check size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-500/20 shadow-xs">
            <GitBranch size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflow Rules & Chain Builder</h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Define condition triggers, approval role tiers, and auto-escalation timeouts for business transactions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CustomButton
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </CustomButton>

          <CustomButton
            size="sm"
            onClick={openNew}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
          >
            <Plus size={14} />
            <span>New Approval Rule</span>
          </CustomButton>
        </div>
      </div>

      {/* Preset Policy Library Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            Quick Policy Presets
          </span>
          <span className="text-[11px] text-slate-400">Click to configure standard enterprise workflows</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="group flex flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:border-primary-400 hover:bg-primary-50/20 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700">
                    {p.entityType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{p.levels.length} Tier{p.levels.length > 1 ? "s" : ""}</span>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-800 group-hover:text-primary-700 line-clamp-1">{p.name}</p>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{p.desc}</p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary-600 group-hover:translate-x-0.5 transition-transform">
                <span>Use preset</span>
                <ArrowRight size={11} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <CustomSelect
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            options={[
              { value: "", label: "All Entity Categories" },
              ...ENTITIES.map((e) => ({ value: e.type, label: `${e.category}: ${e.label}` })),
            ]}
            containerClassName="w-64"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> active workflow rule{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={24} className="mx-auto animate-spin text-primary-500" />
            <p className="mt-2 text-xs font-medium text-slate-500">Loading workflow rules…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <GitBranch size={22} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">No approval rules configured</p>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Changes without a matching approval rule will be automatically approved and applied immediately.
            </p>
            <button
              onClick={openNew}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700"
            >
              <Plus size={14} /> Create Your First Rule
            </button>
          </div>
        ) : (
          filtered.map((t) => {
            const isOpen = expanded[t.id] ?? true;
            const isDiscount = t.conditionField === "discountPct";
            const condDisplay = `${t.conditionField || "amount"} ${t.conditionOperator || ">"} ${
              isDiscount ? `${t.conditionValue}%` : taka(t.conditionValue)
            }`;

            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all"
              >
                {/* Card Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [t.id]: !isOpen }))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm tracking-tight">{t.name}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {t.entityLabel ?? t.entityType}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            t.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          <CircleDot size={8} /> {t.isActive ? "ACTIVE" : "PAUSED"}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded bg-primary-50 px-2 py-0.5 font-mono text-[11px] font-bold text-primary-700 border border-primary-100">
                          IF {condDisplay}
                        </span>
                        <span>→ Requires {t.levels.length} Tier{t.levels.length > 1 ? "s" : ""}</span>
                        <span>· Auto-escalate after {t.escalateAfterHours}h</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleActive(t)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                    >
                      {t.isActive ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => duplicateRule(t)}
                      title="Duplicate rule"
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 transition"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                    >
                      <Edit3 size={12} className="inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => remove(t)}
                      className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-xs font-semibold text-rose-600 shadow-xs hover:bg-rose-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Interactive Visual Node Diagram */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:px-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Sequential Approval Chain & Authority Nodes
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Trigger Box */}
                      <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-white p-2.5 shadow-xs">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 font-bold text-xs">
                          IF
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Trigger Threshold</p>
                          <p className="text-xs font-bold text-primary-700">{condDisplay}</p>
                        </div>
                      </div>

                      <ArrowRight size={16} className="text-slate-300 shrink-0" />

                      {/* Tier Nodes */}
                      {t.levels.map((l, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 border border-slate-200">
                              L{l.level}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Tier {l.level}</p>
                              <p className="text-xs font-bold text-slate-800">{l.role}</p>
                            </div>
                          </div>

                          {i < t.levels.length - 1 && <ArrowRight size={16} className="text-slate-300 shrink-0" />}
                        </div>
                      ))}

                      <ArrowRight size={16} className="text-slate-300 shrink-0" />

                      {/* Final Apply Node */}
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 shadow-xs">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                          <Check size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Outcome</p>
                          <p className="text-xs font-bold text-emerald-900">Change Applied</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── Create / Edit Rule Modal ─── */}
      <CustomModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Approval Chain Rule" : "Create New Workflow Approval Rule"}
      >
        <div className="space-y-4">
          <CustomInput
            label="Rule Name *"
            value={form.name}
            onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Purchase Order Above ৳500,000"
          />

          <CustomSelect
            label="Target Commercial Entity *"
            value={form.entityType}
            onChange={(e: any) => {
              const et = e.target.value;
              const def = ENTITIES.find((x) => x.type === et)?.defaultField || "amount";
              setForm({ ...form, entityType: et, conditionField: def });
            }}
            options={ENTITIES.map((e) => ({ value: e.type, label: `${e.category}: ${e.label}` }))}
          />

          {/* Condition Builder */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal size={13} className="text-primary-600" />
              Evaluation Threshold Condition
            </span>

            <div className="grid grid-cols-3 gap-2">
              <CustomSelect
                label="Evaluation Field"
                value={form.conditionField}
                onChange={(e: any) => setForm({ ...form, conditionField: e.target.value })}
                options={[
                  { value: "amount", label: "Value Amount (৳)" },
                  { value: "discountPct", label: "Discount %" },
                  { value: "qty", label: "Item Quantity" },
                ]}
              />

              <CustomSelect
                label="Operator"
                value={form.conditionOperator}
                onChange={(e: any) => setForm({ ...form, conditionOperator: e.target.value })}
                options={[
                  { value: ">", label: "Greater than (>)" },
                  { value: ">=", label: "Greater or equal (≥)" },
                  { value: "<", label: "Less than (<)" },
                  { value: "<=", label: "Less or equal (≤)" },
                  { value: "=", label: "Exactly equals (=)" },
                ]}
              />

              <CustomInput
                label="Threshold Value *"
                type="number"
                value={form.conditionValue}
                onChange={(e: any) => setForm({ ...form, conditionValue: e.target.value })}
                placeholder="50000"
              />
            </div>
          </div>

          {/* Multi-Tier Chain Builder */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch size={13} className="text-primary-600" />
                Approval Tier Hierarchy ({form.levels.length} Tiers)
              </span>
              <button
                type="button"
                onClick={addLevel}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition"
              >
                <Plus size={12} /> Add Tier
              </button>
            </div>

            <div className="space-y-2">
              {form.levels.map((l, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <CustomSelect
                    value={l.role}
                    onChange={(e: any) => setLevel(i, e.target.value)}
                    options={ROLES}
                    containerClassName="flex-1"
                  />
                  {form.levels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLevel(i)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <CustomInput
            label="Auto-Escalate Timeout SLA (Hours)"
            type="number"
            value={form.escalateAfterHours}
            onChange={(e: any) => setForm({ ...form, escalateAfterHours: e.target.value })}
            hint="If the reviewer at current tier does not act within this window, the engine auto-escalates to the next tier."
            leftIcon={<Clock size={13} />}
          />

          {/* Real-Time Live Preview */}
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-700 mb-1.5">
              Live Preview of Flow
            </p>
            <p className="text-xs text-slate-700">
              When a <span className="font-bold">{form.entityType}</span> has{" "}
              <span className="font-mono font-bold text-primary-700">
                {form.conditionField} {form.conditionOperator} {form.conditionValue}
              </span>
              , it will require sequential approval across{" "}
              <span className="font-bold">{form.levels.map((l) => l.role).join(" → ")}</span>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <CustomButton variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </CustomButton>
            <CustomButton onClick={save} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>{editing ? "Save Rule Changes" : "Create Approval Rule"}</span>
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
