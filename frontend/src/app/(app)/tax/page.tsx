"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign, Percent, Plus, Trash2, Edit3, CheckCircle2, XCircle,
  Calendar, FileText, BarChart3, Shield, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomStatCard } from "@/components/custom";
import { money } from "@/lib/format";

interface TaxRate {
  id: string; name: string; code: string; rate: number; rateType: string;
  taxInclusive: boolean; effectiveFrom: string; effectiveTo: string | null;
  isActive: boolean; isDefault: boolean; description: string; status: string;
}

interface TaxRule {
  id: string; name: string; description: string; ruleType: string;
  rate: { id: string; name: string; code: string; rate: number; rateType: string };
  appliesTo: string; priority: number; isActive: boolean;
}

const RULE_TYPES = ["STANDARD", "ZERO_RATED", "EXEMPT", "REVERSE_CHARGE", "SPECIAL"];
const APPLIES_TO = ["SALE", "PURCHASE", "BOTH"];

export default function TaxPage() {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"rates" | "rules" | "reports">("rates");
  const [showRateForm, setShowRateForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editRate, setEditRate] = useState<TaxRate | null>(null);
  const [editRule, setEditRule] = useState<TaxRule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, ru] = await Promise.all([
        api.get<{ data: TaxRate[] }>("/tax/rates"),
        api.get<{ data: TaxRule[] }>("/tax/rules"),
      ]);
      setRates(r.data); setRules(ru.data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 text-white shadow-md">
        <div>
          <p className="flex items-center gap-2 text-sm text-amber-100"><DollarSign size={15} /> VAT / Tax Engine</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Configurable Tax Management</h1>
          <p className="mt-1 text-sm text-amber-200">
            §10.21 — Data-driven, version-controlled. Never hard-coded.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          <strong>Disclaimer:</strong> All production VAT/NBR workflows and Mushak forms must be
          reviewed by a qualified Bangladesh VAT professional before production deployment.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {(["rates", "rules", "reports"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "rates" ? "Tax Rates" : t === "rules" ? "Tax Rules" : "VAT Reports"}
          </button>
        ))}
      </div>

      {tab === "rates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tax Rates</h2>
            <button onClick={() => { setEditRate(null); setShowRateForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              <Plus size={15} /> Add Rate
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <CustomTable
              columns={[
                { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-primary-700">{r.code}</span> },
                { key: "name", header: "Name", render: (r) => <span className="text-sm font-medium text-gray-800">{r.name}</span> },
                { key: "rate", header: "Rate", align: "right", render: (r) => (
                  <span className="font-semibold tabular-nums text-gray-900">{r.rate}%</span>
                )},
                { key: "type", header: "Type", render: (r) => <span className="text-xs uppercase text-gray-400">{r.rateType}</span> },
                { key: "inclusive", header: "Incl.", render: (r) => (
                  r.taxInclusive ? <CheckCircle2 size={15} className="text-emerald-500" /> : <XCircle size={15} className="text-gray-300" />
                )},
                { key: "effective", header: "Effective", render: (r) => (
                  <span className="text-xs text-gray-500">{r.effectiveFrom}{r.effectiveTo ? ` → ${r.effectiveTo}` : " → ∞"}</span>
                )},
                { key: "default", header: "Default", render: (r) => (
                  r.isDefault ? <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">Default</span> : null
                )},
                { key: "status", header: "Status", render: (r) => (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>{r.status}</span>
                )},
                { key: "actions", header: "", align: "right", render: (r) => (
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditRate(r); setShowRateForm(true); }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={async () => { if (confirm("Delete this rate?")) { await api.del(`/tax/rates/${r.id}`); load(); } }}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )},
              ]}
              data={rates}
              rowKey={(r) => r.id}
              loading={loading}
              emptyIcon={DollarSign}
              emptyMessage="No tax rates configured. Add one to enable VAT calculation."
            />
          </div>
        </div>
      )}

      {tab === "rules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tax Rules</h2>
            <button onClick={() => { setEditRule(null); setShowRuleForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              <Plus size={15} /> Add Rule
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <CustomTable
              columns={[
                { key: "name", header: "Rule Name", render: (r) => <span className="text-sm font-medium text-gray-800">{r.name}</span> },
                { key: "type", header: "Type", render: (r) => (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.ruleType === "STANDARD" ? "bg-emerald-50 text-emerald-700" :
                    r.ruleType === "ZERO_RATED" ? "bg-blue-50 text-blue-700" :
                    r.ruleType === "EXEMPT" ? "bg-gray-100 text-gray-600" :
                    "bg-amber-50 text-amber-700"
                  }`}>{r.ruleType}</span>
                )},
                { key: "rate", header: "Rate", align: "right", render: (r) => (
                  <span className="font-semibold tabular-nums text-gray-900">{r.rate?.rate ?? 0}%</span>
                )},
                { key: "appliesTo", header: "Applies To", render: (r) => (
                  <span className="text-xs uppercase text-gray-400">{r.appliesTo}</span>
                )},
                { key: "priority", header: "Priority", align: "right", render: (r) => (
                  <span className="text-sm text-gray-600">{r.priority}</span>
                )},
                { key: "active", header: "Active", render: (r) => (
                  r.isActive ? <CheckCircle2 size={15} className="text-emerald-500" /> : <XCircle size={15} className="text-gray-300" />
                )},
                { key: "actions", header: "", align: "right", render: (r) => (
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditRule(r); setShowRuleForm(true); }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={async () => { if (confirm("Delete this rule?")) { await api.del(`/tax/rules/${r.id}`); load(); } }}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )},
              ]}
              data={rules}
              rowKey={(r) => r.id}
              loading={loading}
              emptyIcon={Shield}
              emptyMessage="No tax rules configured. Add one to enable tax calculation."
            />
          </div>
        </div>
      )}

      {tab === "reports" && <VATReports />}

      {/* Rate Form Modal */}
      {showRateForm && (
        <RateForm rate={editRate} rates={rates} onClose={() => setShowRateForm(false)} onSaved={() => { setShowRateForm(false); load(); }} />
      )}

      {/* Rule Form Modal */}
      {showRuleForm && (
        <RuleForm rule={editRule} rates={rates} onClose={() => setShowRuleForm(false)} onSaved={() => { setShowRuleForm(false); load(); }} />
      )}
    </div>
  );
}


// ──────────────── Rate Form ────────────────

function RateForm({ rate, rates, onClose, onSaved }: {
  rate: TaxRate | null; rates: TaxRate[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: rate?.name || "", code: rate?.code || "", rate: rate?.rate?.toString() || "15",
    rateType: rate?.rateType || "PERCENTAGE", taxInclusive: rate?.taxInclusive || false,
    effectiveFrom: rate?.effectiveFrom || new Date().toISOString().split("T")[0],
    effectiveTo: rate?.effectiveTo || "", isDefault: rate?.isDefault || false,
    description: rate?.description || "", status: rate?.status || "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name || !form.code) { setError("Name and code required"); return; }
    setSaving(true); setError("");
    try {
      const body = { ...form, rate: parseFloat(form.rate), effectiveTo: form.effectiveTo || null };
      if (rate) { await api.put(`/tax/rates/${rate.id}`, body); }
      else { await api.post("/tax/rates", body); }
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{rate ? "Edit" : "New"} Tax Rate</h3>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Standard VAT" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" placeholder="VAT15" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
              <input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
              <select value={form.rateType} onChange={(e) => setForm({ ...form, rateType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
              <input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective To (optional)</label>
              <input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.taxInclusive} onChange={(e) => setForm({ ...form, taxInclusive: e.target.checked })} className="rounded" />
              Tax Inclusive (price includes tax)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded" />
              Default Rate
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Saving..." : rate ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ──────────────── Rule Form ────────────────

function RuleForm({ rule, rates, onClose, onSaved }: {
  rule: TaxRule | null; rates: TaxRate[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: rule?.name || "", description: rule?.description || "",
    ruleType: rule?.ruleType || "STANDARD", taxRateId: rule?.rate?.id || rates[0]?.id || "",
    appliesTo: rule?.appliesTo || "BOTH", priority: rule?.priority?.toString() || "0",
    isActive: rule?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name || !form.taxRateId) { setError("Name and rate required"); return; }
    setSaving(true); setError("");
    try {
      const body = { ...form, priority: parseInt(form.priority) || 0 };
      if (rule) { await api.put(`/tax/rules/${rule.id}`, body); }
      else { await api.post("/tax/rules", body); }
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{rule ? "Edit" : "New"} Tax Rule</h3>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Standard 15% VAT" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
              <select value={form.ruleType} onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {RULE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate *</label>
              <select value={form.taxRateId} onChange={(e) => setForm({ ...form, taxRateId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select rate</option>
                {rates.filter((r) => r.status === "ACTIVE").map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.rate}%)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
              <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {APPLIES_TO.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (higher = first)</label>
              <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                Active
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2}></textarea>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Saving..." : rule ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ──────────────── VAT Reports ────────────────

function VATReports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/tax/reports/consolidated?year=${year}&month=${month}`);
      setData(res.data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">VAT Reports</h2>
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <CustomStatCard label="Sales VAT Collected" value={money(data.salesVAT)} icon={DollarSign} tone="green" />
          <CustomStatCard label="Purchase VAT (Input)" value={money(data.purchaseVAT)} icon={DollarSign} tone="amber" />
          <CustomStatCard label="Net VAT Payable" value={money(data.netVATPayable)}
            icon={data.status === "REFUNDABLE" ? XCircle : CheckCircle2}
            tone={data.status === "REFUNDABLE" ? "red" : "primary"} />
        </div>
      )}

      {data && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 size={20} className="text-primary-600" />
            <h3 className="font-semibold text-gray-900">Consolidated VAT Summary — {MONTHS[month - 1]} {year}</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-emerald-700 mb-3">Sales VAT</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Total Taxable Sales</span><span className="font-medium">{money(data.sales?.totalTaxableSales || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">VAT Collected</span><span className="font-semibold text-emerald-700">{money(data.salesVAT)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Transactions</span><span className="font-medium">{data.sales?.transactionCount || 0}</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-3">Purchase VAT</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Total Taxable Purchases</span><span className="font-medium">{money(data.purchases?.totalTaxablePurchases || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Input VAT Paid</span><span className="font-semibold text-amber-700">{money(data.purchaseVAT)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Transactions</span><span className="font-medium">{data.purchases?.transactionCount || 0}</span></div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Net VAT Position</span>
              <span className={`text-lg font-bold ${data.netVATPayable > 0 ? "text-red-600" : data.netVATPayable < 0 ? "text-emerald-600" : "text-gray-900"}`}>
                {data.status === "REFUNDABLE" ? "+" : ""}{money(data.netVATPayable)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {data.status === "PAYABLE" ? "Amount payable to NBR" : data.status === "REFUNDABLE" ? "Refundable from NBR" : "No net VAT position"}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
        </div>
      )}
    </div>
  );
}
