"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  Zap,
  Settings2,
  ShoppingCart,
  TestTube2,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  Shield,
  Layers,
  FileText,
  AlertTriangle,
  CircleDot,
  Check,
  Edit3,
  SlidersHorizontal,
  Package,
  DollarSign,
  TrendingDown,
  ArrowUpRight,
  Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { taka, fmtDt } from "./ApprovalCenter";

export interface BusinessRule {
  id: string;
  name: string;
  triggerType: "LOW_STOCK" | "SALE_DISCOUNT" | "VIP_CUSTOMER" | "CREDIT_SALE" | string;
  conditions: Record<string, any>;
  actions: any[];
  priority: number;
  isActive: number;
  lastFiredAt?: string | null;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  productId: string;
  productName?: string | null;
  warehouseId?: string | null;
  currentStock: number;
  reorderPoint: number;
  suggestedQty: number;
  status: "PENDING" | "CONVERTED" | "DISMISSED" | string;
  note?: string | null;
  createdAt: string;
}

export const TRIGGERS: { type: string; label: string; desc: string; icon: string; tagColor: string }[] = [
  {
    type: "LOW_STOCK",
    label: "Low Stock Inventory Trigger",
    desc: "Evaluates when on-hand stock falls below product reorder threshold.",
    icon: "TrendingDown",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    type: "SALE_DISCOUNT",
    label: "POS Sale Discount Policy",
    desc: "Monitors cashier discount entries exceeding authorized percentage limits.",
    icon: "Tag",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    type: "VIP_CUSTOMER",
    label: "VIP Loyalty Automatic Perk",
    desc: "Applies loyalty rewards and pricing tiers when VIP clients are identified.",
    icon: "Sparkles",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    type: "CREDIT_SALE",
    label: "Credit Sale Risk Protection",
    desc: "Guards against credit limit overdrafts and customer balance defaults.",
    icon: "Shield",
    tagColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

export const ACTION_TYPES = [
  { value: "CREATE_PURCHASE_RECOMMENDATION", label: "Auto-Generate Purchase Recommendation" },
  { value: "CREATE_APPROVAL", label: "Route to Multi-Tier Approval Chain" },
  { value: "SET_DISCOUNT", label: "Auto-Apply Special Discount %" },
  { value: "BLOCK", label: "Block & Prevent Action from Completing" },
  { value: "LOG", label: "Audit Log Only" },
];

export const COND_OPS = [
  { value: "eq", label: "Equals (=)" },
  { value: "ne", label: "Does not equal (≠)" },
  { value: "gt", label: "Greater than (>)" },
  { value: "gte", label: "Greater or equal (≥)" },
  { value: "lt", label: "Less than (<)" },
  { value: "lte", label: "Less or equal (≤)" },
];

export default function BusinessRules({ autoCreate = false }: { autoCreate?: boolean }) {
  const [tab, setTab] = useState<"rules" | "recommendations" | "test">("rules");
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Form State
  const [showForm, setShowForm] = useState(autoCreate);
  const [editing, setEditing] = useState<BusinessRule | null>(null);
  const [trigger, setTrigger] = useState("LOW_STOCK");
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Simulator / Testbench State
  const [simTrigger, setSimTrigger] = useState("SALE_DISCOUNT");
  const [simContext, setSimContext] = useState<Record<string, any>>({
    discountPct: 15,
    amount: 75000,
    dueBalance: 120000,
    creditLimit: 100000,
  });
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const loadRules = useCallback(async () => {
    try {
      const res = await api.get<{ data: BusinessRule[] }>("/v1/business-rules");
      setRules(res.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const loadRecs = useCallback(async () => {
    try {
      const res = await api.get<{ data: Recommendation[] }>("/v1/purchase-recommendations?status=PENDING");
      setRecs(res.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadRules(), loadRecs()]);
    setLoading(false);
  }, [loadRules, loadRecs]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const activeCount = useMemo(() => rules.filter((r) => r.isActive).length, [rules]);

  function freshForm(triggerType = trigger) {
    return {
      name: "",
      triggerType,
      conds: [{ field: triggerType === "LOW_STOCK" ? "stock" : triggerType === "SALE_DISCOUNT" ? "discountPct" : "dueBalance", op: "lt", value: "" }],
      actions: [
        {
          type:
            triggerType === "LOW_STOCK"
              ? "CREATE_PURCHASE_RECOMMENDATION"
              : triggerType === "VIP_CUSTOMER"
              ? "SET_DISCOUNT"
              : triggerType === "CREDIT_SALE"
              ? "BLOCK"
              : "CREATE_APPROVAL",
          reason: "",
          discountPct: "",
          entityType: "SALE_DISCOUNT",
          reorderPoint: "",
        },
      ],
      priority: 10,
    };
  }

  function openNew(trig = trigger) {
    setEditing(null);
    setTrigger(trig);
    setForm(freshForm(trig));
    setShowForm(true);
  }

  function openEdit(r: BusinessRule) {
    setEditing(r);
    setTrigger(r.triggerType);
    const conds = Object.entries(r.conditions || {}).map(([field, spec]: [string, any]) => {
      if (typeof spec === "object" && spec !== null) {
        return { field, op: spec.op || "eq", value: String(spec.value ?? "") };
      }
      return { field, op: "eq", value: String(spec ?? "") };
    });
    setForm({
      name: r.name,
      triggerType: r.triggerType,
      conds: conds.length ? conds : [{ field: "stock", op: "lt", value: "" }],
      actions: (r.actions || []).length ? r.actions : [{ type: "CREATE_APPROVAL" }],
      priority: r.priority || 0,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) {
      showToast("Rule name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const condsObj: Record<string, any> = {};
      for (const c of form.conds || []) {
        if (!c.field.trim()) continue;
        condsObj[c.field.trim()] = { op: c.op, value: isNaN(Number(c.value)) ? c.value : Number(c.value) };
      }

      const payload = {
        name: form.name.trim(),
        triggerType: form.triggerType,
        conditions: condsObj,
        actions: form.actions || [],
        priority: Number(form.priority) || 0,
        isActive: editing ? undefined : 1,
      };

      if (editing) {
        await api.patch(`/v1/business-rules/${editing.id}`, payload);
        showToast("Business rule updated successfully.");
      } else {
        await api.post("/v1/business-rules", payload);
        showToast("New business automation rule registered.");
      }
      setShowForm(false);
      setEditing(null);
      loadRules();
    } catch (err: any) {
      showToast(err?.message || "Failed to save rule", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r: BusinessRule) {
    try {
      await api.patch(`/v1/business-rules/${r.id}`, { isActive: r.isActive ? 0 : 1 });
      showToast(`Rule "${r.name}" ${r.isActive ? "paused" : "activated"}.`);
      loadRules();
    } catch (err: any) {
      showToast(err?.message || "Failed to update rule state", "error");
    }
  }

  async function removeRule(r: BusinessRule) {
    if (!confirm(`Delete rule "${r.name}"?`)) return;
    try {
      await api.del(`/v1/business-rules/${r.id}`);
      showToast("Rule deleted.");
      loadRules();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete rule", "error");
    }
  }

  async function convertRec(rec: Recommendation) {
    try {
      const res = await api.post<{ data: any }>(`/v1/purchase-recommendations/${rec.id}/convert`, {});
      showToast(`Recommendation converted into Draft Purchase Requisition for ${rec.productName || "item"}.`);
      loadRecs();
    } catch (err: any) {
      showToast(err?.message || "Failed to convert recommendation", "error");
    }
  }

  async function dismissRec(rec: Recommendation) {
    try {
      await api.post(`/v1/purchase-recommendations/${rec.id}/dismiss`, {});
      showToast("Recommendation dismissed.");
      loadRecs();
    } catch (err: any) {
      showToast(err?.message || "Failed to dismiss recommendation", "error");
    }
  }

  async function runSimulation() {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.post<{ data: any }>("/v1/business-rules/evaluate", {
        triggerType: simTrigger,
        context: simContext,
      });
      setSimResult(res.data);
      showToast("Rule simulation evaluated.", "info");
    } catch (err: any) {
      showToast(err?.message || "Simulation failed", "error");
    } finally {
      setSimulating(false);
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
              : message.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : (
              <AlertTriangle size={18} className="text-sky-600" />
            )}
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-500/20 shadow-xs">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Rule Automation Engine</h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Event-driven policy automation (§10.27) managing real-time inventory reorders, pricing limits, and risk gates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CustomButton
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={loading}
            className="border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </CustomButton>

          <CustomButton
            size="sm"
            onClick={() => openNew()}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
          >
            <Plus size={14} />
            <span>New Business Rule</span>
          </CustomButton>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab("rules")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === "rules"
              ? "bg-primary-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Settings2 size={14} />
          <span>Automation Rules</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{rules.length}</span>
        </button>

        <button
          onClick={() => setTab("recommendations")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === "recommendations"
              ? "bg-primary-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShoppingCart size={14} />
          <span>Purchase Recommendations</span>
          {recs.length > 0 && (
            <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
              {recs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("test")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === "test"
              ? "bg-primary-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <TestTube2 size={14} />
          <span>Interactive Live Simulator</span>
        </button>
      </div>

      {/* TAB 1: RULES */}
      {tab === "rules" && (
        <div className="space-y-4">
          {/* Trigger Quick-Add Bar */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRIGGERS.map((t) => (
              <button
                key={t.type}
                onClick={() => openNew(t.type)}
                className="group flex flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:border-primary-400 hover:bg-primary-50/20 hover:shadow-sm"
              >
                <div>
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${t.tagColor}`}>
                    {t.type}
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-800 group-hover:text-primary-700">{t.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{t.desc}</p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary-600">
                  <Plus size={12} /> Add Rule
                </div>
              </button>
            ))}
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {rules.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                <Zap size={24} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No active business automation rules</p>
                <p className="text-xs text-slate-400 mt-1">Configure automated triggers above to enforce commercial logic.</p>
              </div>
            ) : (
              rules.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                        <Zap size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {r.triggerType}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {r.isActive ? "ACTIVE" : "PAUSED"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Priority: <span className="font-semibold text-slate-700">{r.priority}</span> · Fired:{" "}
                          <span className="font-semibold text-slate-700">{r.lastFiredAt ? fmtDt(r.lastFiredAt) : "Never"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleActive(r)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {r.isActive ? "Pause" : "Activate"}
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 size={12} className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => removeRule(r)}
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Conditions & Actions Strip */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Conditions:</span>
                    {Object.entries(r.conditions || {}).map(([k, v]: [string, any]) => (
                      <span key={k} className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 border border-slate-200">
                        {k} {typeof v === "object" ? `${v.op} ${v.value}` : `= ${v}`}
                      </span>
                    ))}

                    <span className="text-slate-300">→</span>

                    <span className="font-bold text-slate-400 uppercase text-[10px]">Actions:</span>
                    {(r.actions || []).map((a, i) => (
                      <span key={i} className="rounded bg-primary-50 px-2 py-0.5 font-bold text-primary-700 border border-primary-100">
                        {a.type}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE RECOMMENDATIONS */}
      {tab === "recommendations" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Inventory Reorder Queue</h3>
                <p className="text-xs text-slate-500">
                  Automated procurement suggestions fired by low-stock rules. Convert directly into draft Purchase Requisitions.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1">
                {recs.length} Pending Actions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 font-bold uppercase text-slate-500 text-[10px]">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Reorder Point</th>
                    <th className="py-2.5 px-3">Suggested Order Qty</th>
                    <th className="py-2.5 px-3">Reason / Note</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No pending purchase recommendations. Stock levels are within safe thresholds.
                      </td>
                    </tr>
                  ) : (
                    recs.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">{rec.productName || rec.productId}</td>
                        <td className="py-3 px-3 text-rose-600 font-bold">{rec.currentStock} units</td>
                        <td className="py-3 px-3 text-slate-600">{rec.reorderPoint} units</td>
                        <td className="py-3 px-3 font-bold text-primary-700">+{rec.suggestedQty} units</td>
                        <td className="py-3 px-3 text-slate-500">{rec.note || "Stock below threshold"}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => convertRec(rec)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-primary-700 shadow-xs"
                            >
                              <Check size={12} /> Convert to PR
                            </button>
                            <button
                              onClick={() => dismissRec(rec)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                            >
                              Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SIMULATOR */}
      {tab === "test" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Simulator Input Box */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <TestTube2 size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rule Simulator & Testbench</h3>
                <p className="text-xs text-slate-500">Simulate incoming module payloads against registered rules.</p>
              </div>
            </div>

            <CustomSelect
              label="Trigger Event to Test"
              value={simTrigger}
              onChange={(e) => setSimTrigger(e.target.value)}
              options={TRIGGERS.map((t) => ({ value: t.type, label: t.label }))}
            />

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Test Context Attributes</span>

              {simTrigger === "SALE_DISCOUNT" && (
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    label="Discount %"
                    type="number"
                    value={simContext.discountPct}
                    onChange={(e: any) => setSimContext({ ...simContext, discountPct: Number(e.target.value) })}
                  />
                  <CustomInput
                    label="Transaction Amount (৳)"
                    type="number"
                    value={simContext.amount}
                    onChange={(e: any) => setSimContext({ ...simContext, amount: Number(e.target.value) })}
                  />
                </div>
              )}

              {simTrigger === "CREDIT_SALE" && (
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    label="Customer Current Due (৳)"
                    type="number"
                    value={simContext.dueBalance}
                    onChange={(e: any) => setSimContext({ ...simContext, dueBalance: Number(e.target.value) })}
                  />
                  <CustomInput
                    label="Credit Limit (৳)"
                    type="number"
                    value={simContext.creditLimit}
                    onChange={(e: any) => setSimContext({ ...simContext, creditLimit: Number(e.target.value) })}
                  />
                </div>
              )}

              {simTrigger === "LOW_STOCK" && (
                <div className="grid grid-cols-2 gap-2">
                  <CustomInput
                    label="Current Stock"
                    type="number"
                    value={simContext.stock ?? 3}
                    onChange={(e: any) => setSimContext({ ...simContext, stock: Number(e.target.value) })}
                  />
                  <CustomInput
                    label="Reorder Threshold"
                    type="number"
                    value={simContext.reorderPoint ?? 10}
                    onChange={(e: any) => setSimContext({ ...simContext, reorderPoint: Number(e.target.value) })}
                  />
                </div>
              )}

              {simTrigger === "VIP_CUSTOMER" && (
                <CustomInput
                  label="Customer Tier"
                  value={simContext.tier ?? "VIP"}
                  onChange={(e: any) => setSimContext({ ...simContext, tier: e.target.value })}
                />
              )}
            </div>

            <CustomButton
              onClick={runSimulation}
              disabled={simulating}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold"
            >
              {simulating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              <span>Evaluate Rule Engine</span>
            </CustomButton>
          </div>

          {/* Simulator Output Box */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Evaluation Verdict & Action Output</h3>
              <p className="text-xs text-slate-500 mb-3">Live trace of rule matches and executed actions.</p>

              {simResult ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>
                      Trigger evaluated: <span className="font-bold">{simResult.trigger}</span> —{" "}
                      <span className="font-bold">{simResult.matched}</span> rule(s) matched.
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-slate-100">
                    <pre className="font-mono text-[11px] leading-relaxed">
                      {JSON.stringify(simResult.results, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <TestTube2 size={24} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-xs">Run a simulation on the left to inspect engine evaluation logs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Create / Edit Business Rule Modal ─── */}
      <CustomModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Edit Business Automation Rule" : "Create Business Automation Rule"}
      >
        {form && (
          <div className="space-y-4">
            <CustomInput
              label="Rule Name *"
              value={form.name}
              onChange={(e: any) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Alert and Route High Discounts > 15%"
            />

            <CustomSelect
              label="Trigger Type *"
              value={form.triggerType}
              onChange={(e: any) => {
                const tr = e.target.value;
                setForm({ ...freshForm(tr), name: form.name });
              }}
              options={TRIGGERS.map((t) => ({ value: t.type, label: t.label }))}
            />

            {/* Conditions */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trigger Conditions</span>
              {(form.conds || []).map((c: any, i: number) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <CustomInput
                    placeholder="Field name"
                    value={c.field}
                    onChange={(e: any) => {
                      const conds = [...form.conds];
                      conds[i].field = e.target.value;
                      setForm({ ...form, conds });
                    }}
                  />
                  <CustomSelect
                    value={c.op}
                    onChange={(e: any) => {
                      const conds = [...form.conds];
                      conds[i].op = e.target.value;
                      setForm({ ...form, conds });
                    }}
                    options={COND_OPS}
                  />
                  <CustomInput
                    placeholder="Threshold value"
                    value={c.value}
                    onChange={(e: any) => {
                      const conds = [...form.conds];
                      conds[i].value = e.target.value;
                      setForm({ ...form, conds });
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Executed Actions</span>
              {(form.actions || []).map((a: any, i: number) => (
                <div key={i} className="space-y-2">
                  <CustomSelect
                    value={a.type}
                    onChange={(e: any) => {
                      const actions = [...form.actions];
                      actions[i].type = e.target.value;
                      setForm({ ...form, actions });
                    }}
                    options={ACTION_TYPES}
                  />
                </div>
              ))}
            </div>

            <CustomInput
              label="Evaluation Priority (Higher fires first)"
              type="number"
              value={form.priority}
              onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
            />

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <CustomButton variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </CustomButton>
              <CustomButton onClick={save} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{editing ? "Save Rule" : "Create Rule"}</span>
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}
