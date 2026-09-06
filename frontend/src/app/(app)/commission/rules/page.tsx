"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Plus, Settings, Trash2, Power, Layers, Calculator, X, Check } from "lucide-react";
import { api } from "@/lib/api";

interface Rule {
  id: string;
  name: string;
  agentUserId: string | null;
  agent?: { id: string; name: string; email: string } | null;
  agentType: string;
  commissionType: string;
  rate: string | null;
  fixedAmount: string | null;
  productId: string | null;
  targetAmount: string | null;
  slabConfig: { from: number; to: number | null; rate: number }[] | null;
  collectionRate: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

interface Agent { id: string; name: string; email: string }

const AGENT_TYPES = [
  ["SALES_AGENT", "Sales Agent"],
  ["SALES_REP", "Sales Rep"],
  ["COMMISSION_AGENT", "Commission Agent"],
  ["REFERRAL", "Referral Partner"],
  ["DISTRIBUTOR", "Distributor"],
];

const COMMISSION_TYPES = [
  ["PERCENTAGE", "Percentage — % of sale total"],
  ["FIXED", "Fixed — flat fee per sale"],
  ["SLAB", "Slab — tiered rate by amount"],
  ["PRODUCT", "Product — % on specific product"],
  ["CATEGORY", "Category — % on a category"],
  ["PROFIT", "Profit — % of sale profit"],
  ["TARGET", "Target — % when target met"],
  ["COLLECTION", "Collection — % of collected amount"],
];

export default function CommissionRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", agentUserId: "", agentType: "SALES_AGENT", commissionType: "SLAB",
    rate: "", fixedAmount: "", productId: "", targetAmount: "", collectionRate: "",
    priority: "0",
  });
  const [slabs, setSlabs] = useState([
    { from: 0, to: 100000, rate: 2 },
    { from: 100001, to: 300000, rate: 3 },
    { from: 300001, to: null as number | null, rate: 5 },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, agentsRes] = await Promise.all([
        api.get<{ data: Rule[] }>("/commission/rules"),
        api.get<{ data: Agent[] }>("/commission/agents").catch(() => ({ data: [] as Agent[] })),
      ]);
      setRules(rulesRes.data);
      setAgents(agentsRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function dryRun() {
    setPreview(null);
    try {
      const payload = buildPayload();
      const res = await api.post<{ data: { amount: number } }>("/commission/calculate", {
        rule: payload.rule,
        totalAmount: 250000,
      });
      setPreview(res.data.amount);
    } catch {
      setPreview(null);
    }
  }

  function buildPayload() {
    const rule: any = {
      id: "preview",
      commissionType: form.commissionType,
    };
    if (form.commissionType === "PERCENTAGE" || form.commissionType === "PROFIT" || form.commissionType === "TARGET" || form.commissionType === "PRODUCT" || form.commissionType === "CATEGORY") rule.rate = Number(form.rate) / 100;
    if (form.commissionType === "FIXED") rule.fixedAmount = Number(form.fixedAmount);
    if (form.commissionType === "SLAB") rule.slabConfig = slabs.map((s) => ({ from: s.from, to: s.to, rate: s.rate / 100 }));
    if (form.commissionType === "COLLECTION") rule.collectionRate = Number(form.collectionRate) / 100;
    if (form.commissionType === "PRODUCT" || form.commissionType === "CATEGORY") rule.productId = form.productId || "p-none";
    return { rule };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      const { rule } = buildPayload();
      const body: any = {
        name: form.name,
        agentUserId: form.agentUserId || null,
        agentType: form.agentType,
        commissionType: form.commissionType,
        priority: Number(form.priority),
      };
      if (form.commissionType === "SLAB") body.slabConfig = rule.slabConfig;
      if (form.rate) body.rate = rule.rate;
      if (form.fixedAmount) body.fixedAmount = Number(form.fixedAmount);
      if (form.targetAmount) body.targetAmount = Number(form.targetAmount);
      if (form.collectionRate) body.collectionRate = rule.collectionRate;
      if (form.productId && ["PRODUCT", "CATEGORY"].includes(form.commissionType)) {
        if (form.commissionType === "PRODUCT") body.productId = form.productId;
      }

      await api.post("/commission/rules", body);
      setShowModal(false);
      resetForm();
      await load();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message || "Failed to create rule");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ name: "", agentUserId: "", agentType: "SALES_AGENT", commissionType: "SLAB", rate: "", fixedAmount: "", productId: "", targetAmount: "", collectionRate: "", priority: "0" });
    setSlabs([
      { from: 0, to: 100000, rate: 2 },
      { from: 100001, to: 300000, rate: 3 },
      { from: 300001, to: null, rate: 5 },
    ]);
    setPreview(null);
  }

  async function toggleActive(rule: Rule) {
    try {
      await api.put(`/commission/rules/${rule.id}`, { isActive: !rule.isActive });
      await load();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  }

  async function deleteRule(rule: Rule) {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await api.del(`/commission/rules/${rule.id}`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  }

  const inputCls = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/commission" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Commission Rules</h1>
            <p className="mt-0.5 text-sm text-gray-500">Configure how commissions calculate per agent type (§10.15)</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700">
          <Plus size={16} /> New Rule
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error} <button onClick={load} className="ml-2 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <Settings size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No commission rules yet</p>
          <p className="mt-1 text-sm text-gray-400">Rules auto-calculate commission when matching sales complete.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((rule) => (
            <div key={rule.id} className={`group relative rounded-2xl border p-5 shadow-sm transition ${rule.isActive ? "border-gray-100 bg-white hover:shadow-md" : "border-gray-100 bg-gray-50 opacity-70"}`}>
              {/* Type badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                    <Layers size={17} className="text-primary-600" />
                  </span>
                  <div>
                    <h3 className="font-semibold leading-tight text-gray-900">{rule.name}</h3>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      {AGENT_TYPES.find(([v]) => v === rule.agentType)?.[1]} · priority {rule.priority}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => toggleActive(rule)} title={rule.isActive ? "Deactivate" : "Activate"}
                    className={`rounded-lg p-1.5 ${rule.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}>
                    <Power size={14} />
                  </button>
                  <button onClick={() => deleteRule(rule)} title="Delete"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Config detail */}
              <div className="mt-4 space-y-2">
                {rule.commissionType === "SLAB" && rule.slabConfig && (
                  <div className="space-y-1.5">
                    {(rule.slabConfig as any[]).map((tier: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-gradient-to-r from-primary-50/70 to-transparent px-3 py-1.5 text-xs">
                        <span className="tabular-nums text-gray-600">
                          ৳{Number(tier.from).toLocaleString()} {tier.to == null ? "+" : `– ৳${Number(tier.to).toLocaleString()}`}
                        </span>
                        <span className="font-bold tabular-nums text-primary-700">{(Number(tier.rate) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {rule.commissionType === "PERCENTAGE" && rule.rate && (
                  <p className="text-sm text-gray-600">{(Number(rule.rate) * 100).toFixed(1)}% of sale total</p>
                )}
                {rule.commissionType === "FIXED" && rule.fixedAmount && (
                  <p className="text-sm text-gray-600">Flat ৳{Number(rule.fixedAmount).toLocaleString()} per sale</p>
                )}
                {rule.commissionType === "PROFIT" && rule.rate && (
                  <p className="text-sm text-gray-600">{(Number(rule.rate) * 100).toFixed(1)}% of sale profit</p>
                )}
                {rule.commissionType === "COLLECTION" && rule.collectionRate && (
                  <p className="text-sm text-gray-600">{(Number(rule.collectionRate) * 100).toFixed(1)}% of collected amount</p>
                )}
                {rule.commissionType === "TARGET" && rule.targetAmount && (
                  <p className="text-sm text-gray-600">{(Number(rule.rate ?? 0) * 100).toFixed(1)}% · target ৳{Number(rule.targetAmount).toLocaleString()}</p>
                )}
                {["PRODUCT", "CATEGORY"].includes(rule.commissionType) && (
                  <p className="text-sm text-gray-600">{(Number(rule.rate ?? 0) * 100).toFixed(1)}% on matching {rule.commissionType.toLowerCase()}</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${rule.agentUserId ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {rule.agent?.name ?? "All agents"}
                </span>
                <span className={`h-2 w-2 rounded-full ${rule.isActive ? "bg-emerald-500" : "bg-gray-300"}`} title={rule.isActive ? "Active" : "Inactive"} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Commission Rule</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            {modalError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{modalError}</div>}

            <form onSubmit={handleCreate} className="mt-5 space-y-5">
              {/* Basic */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Rule Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Default Slab Commission" required />
                </div>
                <div>
                  <label className={labelCls}>Agent</label>
                  <select value={form.agentUserId} onChange={(e) => setForm({ ...form, agentUserId: e.target.value })} className={inputCls}>
                    <option value="">All agents</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Agent Type</label>
                  <select value={form.agentType} onChange={(e) => setForm({ ...form, agentType: e.target.value })} className={inputCls}>
                    {AGENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputCls} />
                </div>
              </div>

              {/* Commission type */}
              <div>
                <label className={labelCls}>Commission Type *</label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {COMMISSION_TYPES.map(([v, l]) => (
                    <button key={v} type="button" onClick={() => { setForm({ ...form, commissionType: v }); setPreview(null); }}
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                        form.commissionType === v ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}>
                      {l.split(" — ")[0]}
                      <span className="mt-0.5 block text-[10px] font-normal text-gray-400">{l.split(" — ")[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type-specific config */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                {["PERCENTAGE", "PROFIT", "TARGET", "PRODUCT", "CATEGORY"].includes(form.commissionType) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Rate (%)</label>
                      <input type="number" step="0.1" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className={inputCls} placeholder="5" />
                    </div>
                    {form.commissionType === "TARGET" && (
                      <div>
                        <label className={labelCls}>Monthly Target (৳)</label>
                        <input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} className={inputCls} placeholder="1000000" />
                      </div>
                    )}
                  </div>
                )}
                {form.commissionType === "FIXED" && (
                  <div>
                    <label className={labelCls}>Flat Amount (৳)</label>
                    <input type="number" value={form.fixedAmount} onChange={(e) => setForm({ ...form, fixedAmount: e.target.value })} className={inputCls} placeholder="500" />
                  </div>
                )}
                {form.commissionType === "COLLECTION" && (
                  <div>
                    <label className={labelCls}>Collection Rate (%)</label>
                    <input type="number" step="0.1" value={form.collectionRate} onChange={(e) => setForm({ ...form, collectionRate: e.target.value })} className={inputCls} placeholder="1.5" />
                  </div>
                )}
                {form.commissionType === "PRODUCT" && (
                  <div>
                    <label className={labelCls}>Product ID</label>
                    <input value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputCls} placeholder="UUID of the product" />
                  </div>
                )}
                {form.commissionType === "SLAB" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={labelCls}>Slab Tiers</label>
                      <button type="button" onClick={() => setSlabs([...slabs, { from: 0, to: 0, rate: 0 }])}
                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                        <Plus size={12} /> Add tier
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {slabs.map((slab, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="number" value={slab.from} onChange={(e) => setSlabs(slabs.map((s, j) => j === i ? { ...s, from: Number(e.target.value) } : s))}
                            className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs tabular-nums" placeholder="From" />
                          <span className="text-xs text-gray-400">to</span>
                          <input type="number" value={slab.to ?? ""} onChange={(e) => setSlabs(slabs.map((s, j) => j === i ? { ...s, to: e.target.value === "" ? null : Number(e.target.value) } : s))}
                            className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs tabular-nums" placeholder="∞" />
                          <span className="text-xs text-gray-400">rate %</span>
                          <input type="number" step="0.1" value={slab.rate} onChange={(e) => setSlabs(slabs.map((s, j) => j === i ? { ...s, rate: Number(e.target.value) } : s))}
                            className="w-20 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs tabular-nums" />
                          {slabs.length > 1 && (
                            <button type="button" onClick={() => setSlabs(slabs.filter((_, j) => j !== i))}
                              className="rounded p-1 text-gray-300 hover:bg-rose-50 hover:text-rose-500"><X size={12} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dry run */}
              <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-primary-50/50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calculator size={16} className="text-primary-600" />
                  {preview != null ? (
                    <span>A ৳250,000 sale earns <strong className="text-primary-700">৳{preview.toLocaleString()}</strong></span>
                  ) : (
                    <span>Preview the payout on a ৳250,000 sale</span>
                  )}
                </div>
                <button type="button" onClick={dryRun}
                  className="flex items-center gap-1.5 rounded-lg border border-primary-300 bg-white px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50">
                  <Check size={13} /> Dry Run
                </button>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
