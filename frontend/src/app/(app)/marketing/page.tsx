"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Megaphone, Plus, RefreshCw, Loader2, Zap, Users, Play, Pause, Trash2,
  Ticket, Send, Eye, Calendar, Clock, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

interface TriggerDef { code: string; label: string; description: string; }
interface Campaign {
  id: string; name: string; triggerType: string; status: string;
  channels: string[] | null; conditions: any | null; couponTemplate: any | null;
  startDate: string | null; endDate: string | null; lastRunAt: string | null;
  totalMatched: number; totalSent: number; createdAt: string;
}
interface Grant {
  id: string; customerName: string; customerId: string; phone: string | null;
  email: string | null; channel: string; couponCode: string | null;
  status: string; reason: string | null; createdAt: string;
}

const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  DRAFT: { label: "Draft", chip: "bg-gray-500/15 text-gray-600 border-gray-500/25", dot: "bg-gray-400" },
  ACTIVE: { label: "Active", chip: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25", dot: "bg-emerald-500" },
  PAUSED: { label: "Paused", chip: "bg-amber-500/15 text-amber-700 border-amber-500/25", dot: "bg-amber-500" },
  ARCHIVED: { label: "Archived", chip: "bg-slate-500/15 text-slate-500 border-slate-500/25", dot: "bg-slate-400" },
};

const TRIGGER_DEFAULTS: Record<string, any> = {
  INACTIVE_30D: { name: "Win-back inactive customers", daysInactive: 30 },
  BIRTHDAY: { name: "Birthday offer" },
  ANNIVERSARY: { name: "Membership anniversary" },
  FIRST_PURCHASE: { name: "Welcome after first purchase", lookbackDays: 7 },
  HIGH_VALUE: { name: "High-value buyer reward", minAmount: 10000, lookbackDays: 30 },
  ABANDONED_CART: { name: "Abandoned cart nudge", daysInactive: 1 },
  EXPIRY_REMINDER: { name: "Gift-card expiry reminder", daysInactive: 7 },
  LOYALTY_MILESTONE: { name: "Loyalty milestone congrats", milestonePoints: 500 },
};

export default function MarketingPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [triggers, setTriggers] = useState<TriggerDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({ name: "", triggerType: "INACTIVE_30D", status: "ACTIVE", channels: ["SMS"], discountType: "PERCENTAGE", discountValue: "10", minAmount: "", maxDiscount: "", validDays: "14", conditions: {} });
  const [running, setRunning] = useState(false);

  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 4000); };

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Campaign[] }>("/v1/marketing/campaigns");
      setCampaigns(res.data);
    } catch (err: any) { console.error(err); } finally { setLoading(false); }
  }, []);

  const loadTriggers = useCallback(async () => {
    try {
      const res = await api.get<{ data: TriggerDef[] }>("/v1/marketing/triggers");
      setTriggers(res.data);
    } catch (err: any) { console.error(err); }
  }, []);

  useEffect(() => { loadCampaigns(); loadTriggers(); }, [loadCampaigns, loadTriggers]);

  function openCreate() {
    const def = TRIGGER_DEFAULTS[form.triggerType] || {};
    setForm({ name: def.name || "", triggerType: form.triggerType, status: "ACTIVE", channels: ["SMS"], discountType: "PERCENTAGE", discountValue: "10", minAmount: "", maxDiscount: "", validDays: "14", conditions: { ...def } });
    setShowCreate(true);
  }
  function changeTrigger(t: string) {
    const def = TRIGGER_DEFAULTS[t] || {};
    setForm((f: any) => ({ ...f, triggerType: t, name: def.name || f.name, conditions: { ...def } }));
  }

  async function createCampaign() {
    if (!form.name.trim()) { alert("Campaign name required"); return; }
    const conditions: any = {};
    if (form.conditions?.daysInactive) conditions.daysInactive = Number(form.conditions.daysInactive);
    if (form.conditions?.lookbackDays) conditions.lookbackDays = Number(form.conditions.lookbackDays);
    if (form.conditions?.minAmount) conditions.minAmount = Number(form.conditions.minAmount);
    if (form.conditions?.milestonePoints) conditions.milestonePoints = Number(form.conditions.milestonePoints);
    const couponTemplate = { discountType: form.discountType, discountValue: Number(form.discountValue) || 0, minAmount: form.minAmount ? Number(form.minAmount) : null, maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, validDays: Number(form.validDays) || 14, codePrefix: form.triggerType.slice(0, 3) };
    setRunning(true);
    try {
      await api.post("/v1/marketing/campaigns", {
        name: form.name.trim(), triggerType: form.triggerType, status: form.status,
        channels: form.channels, conditions, couponTemplate,
      });
      setShowCreate(false); showMessage("Campaign created"); loadCampaigns();
    } catch (err: any) { alert(err?.message || "Failed to create"); } finally { setRunning(false); }
  }

  async function setStatus(c: Campaign, status: string) {
    try {
      await api.post(`/v1/marketing/campaigns/${c.id}/${status.toLowerCase() === "active" ? "activate" : "pause"}`);
      showMessage(`Campaign ${status.toLowerCase()}`);
      loadCampaigns();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }

  async function runCampaign(c: Campaign) {
    setRunning(true);
    try {
      const res = await api.post<{ data: any }>(`/v1/marketing/campaigns/${c.id}/run`, {});
      showMessage(`Matched ${res.data?.matched} customer(s) · ${res.data?.couponsCreated} coupon(s) queued`);
      loadCampaigns();
    } catch (err: any) { alert(err?.message || "Run failed"); } finally { setRunning(false); }
  }

  async function openDetail(c: Campaign) {
    try {
      const res = await api.get<{ data: any }>(`/v1/marketing/campaigns/${c.id}`);
      setDetail(res.data);
    } catch (err: any) { console.error(err); }
  }

  async function deleteCampaign(c: Campaign) {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    try {
      await api.del(`/v1/marketing/campaigns/${c.id}`);
      showMessage("Campaign deleted"); loadCampaigns(); if (detail?.id === c.id) setDetail(null);
    } catch (err: any) { alert(err?.message || "Delete failed"); }
  }

  return (
    <div className="space-y-6">
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Megaphone size={22} className="text-primary-600" /> Marketing Automation
          </h1>
          <p className="mt-1 text-sm text-gray-500">Trigger-based campaigns with per-customer coupons — delivery queued for the notification engine</p>
        </div>
        <CustomButton onClick={openCreate}><Plus size={15} /> New Campaign</CustomButton>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Megaphone size={13} /> Campaigns</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{campaigns.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Zap size={13} /> Triggers available</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{triggers.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Users size={13} /> Customers matched</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{campaigns.reduce((s, c) => s + Number(c.totalMatched || 0), 0)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Send size={13} /> Messages queued</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{campaigns.reduce((s, c) => s + Number(c.totalSent || 0), 0)}</p>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Trigger</th>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Matched / Queued</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const sm = STATUS_META[c.status] ?? STATUS_META.DRAFT;
              const tpl = c.couponTemplate || {};
              return (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <button onClick={() => openDetail(c)} className="block text-left">
                      <p className="font-semibold text-gray-900 hover:text-primary-600">{c.name}</p>
                      <p className="text-[11px] text-gray-400">{c.lastRunAt ? `Last run ${new Date(c.lastRunAt).toLocaleString("en-GB")}` : "Never run"}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700"><Zap size={11} /> {c.triggerType.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {tpl?.discountValue ? `${tpl.discountValue}${tpl.discountType === "PERCENTAGE" ? "%" : "৳"} off${tpl.minAmount ? ` ≥ ${tpl.minAmount}` : ""}${tpl.validDays ? ` · ${tpl.validDays}d` : ""}` : "No coupon"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(c.channels || ["SMS"]).map((ch) => <span key={ch} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">{ch}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">{c.totalMatched}</p>
                    <p className="text-[11px] text-gray-400">{c.totalSent} queued</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${sm.chip}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />{sm.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status === "DRAFT" && <button onClick={() => setStatus(c, "ACTIVE")} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">Activate</button>}
                      {c.status === "ACTIVE" && <button onClick={() => setStatus(c, "PAUSED")} className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100">Pause</button>}
                      {c.status === "PAUSED" && <button onClick={() => setStatus(c, "ACTIVE")} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">Resume</button>}
                      <button onClick={() => runCampaign(c)} disabled={running} className="flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"><Play size={11} /> Run now</button>
                      <button onClick={() => openDetail(c)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200"><Eye size={11} /> Audience</button>
                      <button onClick={() => deleteCampaign(c)} className="rounded-md px-1.5 py-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {campaigns.length === 0 && !loading && (
              <tr><td colSpan={7} className="px-4 py-12 text-center">
                <Megaphone size={26} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-500">No campaigns yet</p>
                <p className="mt-1 text-xs text-gray-400">Create a trigger-based campaign to reward your customers automatically</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Trigger catalog */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Trigger catalog</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {triggers.map((t) => (
            <button key={t.code} onClick={() => { changeTrigger(t.code); openCreate(); }}
              className="rounded-xl border border-gray-100 bg-white p-3.5 text-left shadow-sm transition hover:border-primary-200 hover:shadow">
              <p className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span className="flex items-center gap-1.5"><Zap size={12} className="text-indigo-500" /> {t.label}</span>
                <ChevronRight size={13} className="text-gray-300" />
              </p>
              <p className="mt-1.5 line-clamp-2 text-[11px] text-gray-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Create campaign modal ── */}
      <CustomModal open={showCreate} onClose={() => setShowCreate(false)} title="New marketing campaign">
        <div className="space-y-3">
          <CustomInput label="Campaign name *" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
          <CustomSelect label="Trigger" value={form.triggerType} onChange={(e: any) => changeTrigger(e.target.value)}
            options={triggers.map((t) => ({ value: t.code, label: t.label }))} />
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Channel" value={(form.channels || ["SMS"])[0]} onChange={(e: any) => setForm({ ...form, channels: [e.target.value] })}
              options={[{ value: "SMS", label: "SMS" }, { value: "EMAIL", label: "Email" }, { value: "WHATSAPP", label: "WhatsApp" }, { value: "PUSH", label: "Push" }]} />
            <CustomInput label="Offer valid (days)" type="number" value={form.validDays} onChange={(e: any) => setForm({ ...form, validDays: e.target.value })} />
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-500"><Ticket size={12} className="mr-1 inline" /> Coupon offer</p>
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect label="Type" value={form.discountType} onChange={(e: any) => setForm({ ...form, discountType: e.target.value })}
                options={[{ value: "PERCENTAGE", label: "% off" }, { value: "FIXED", label: "৳ off" }]} />
              <CustomInput label={form.discountType === "PERCENTAGE" ? "Percent off" : "Amount off (৳)"} type="number" value={form.discountValue} onChange={(e: any) => setForm({ ...form, discountValue: e.target.value })} />
              <CustomInput label="Min basket (৳, optional)" type="number" value={form.minAmount} onChange={(e: any) => setForm({ ...form, minAmount: e.target.value })} />
              <CustomInput label="Max discount (৳, optional)" type="number" value={form.maxDiscount} onChange={(e: any) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-500">Trigger conditions</p>
            <div className="grid grid-cols-2 gap-3">
              {form.triggerType === "INACTIVE_30D" && <CustomInput label="Inactive days" type="number" value={form.conditions?.daysInactive ?? 30} onChange={(e: any) => setForm({ ...form, conditions: { ...form.conditions, daysInactive: e.target.value } })} />}
              {form.triggerType === "ABANDONED_CART" && <CustomInput label="Cart age (days)" type="number" value={form.conditions?.daysInactive ?? 1} onChange={(e: any) => setForm({ ...form, conditions: { ...form.conditions, daysInactive: e.target.value } })} />}
              {form.triggerType === "EXPIRY_REMINDER" && <CustomInput label="Expiring within (days)" type="number" value={form.conditions?.daysInactive ?? 7} onChange={(e: any) => setForm({ ...form, conditions: { ...form.conditions, daysInactive: e.target.value } })} />}
              {(form.triggerType === "FIRST_PURCHASE" || form.triggerType === "HIGH_VALUE") && <CustomInput label="Lookback (days)" type="number" value={form.conditions?.lookbackDays ?? 30} onChange={(e: any) => setForm({ ...form, conditions: { ...form.conditions, lookbackDays: e.target.value } })} />}
              {form.triggerType === "HIGH_VALUE" && <CustomInput label="Min order (৳)" type="number" value={form.conditions?.minAmount ?? 10000} onChange={(e: any) => setForm({ ...form, conditions: { ...form.conditions, minAmount: e.target.value } })} />}
              {form.triggerType === "LOYALTY_MILESTONE" && <CustomInput label="Milestone points" type="number" value={form.conditions?.milestonePoints ?? 500} onChange={(e: any) => setForm({ ...form, conditions: { ...form.conditions, milestonePoints: e.target.value } })} />}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">Evaluation happens when you press “Run now” — delivery is queued PENDING for the notification engine.</p>
          </div>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowCreate(false)}>Cancel</CustomButton>
            <CustomButton onClick={createCampaign} loading={running}><Plus size={15} /> Create campaign</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Audience/detail modal ── */}
      <CustomModal open={!!detail} onClose={() => setDetail(null)} title={`${detail?.name || ""} — audience`}>
        {detail && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-indigo-50 p-2">
                <p className="text-lg font-bold text-indigo-700">{detail.totalMatched}</p>
                <p className="text-[10px] text-indigo-400">Matched</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <p className="text-lg font-bold text-amber-700">{detail.totalSent}</p>
                <p className="text-[10px] text-amber-400">Queued</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2">
                <p className="text-lg font-bold text-emerald-700">{(detail.grants || []).length}</p>
                <p className="text-[10px] text-emerald-400">Grants</p>
              </div>
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto">
              {(detail.grants || []).map((g: any) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{g.customerName} <span className="text-[10px] text-gray-400">{g.channel}</span></p>
                    <p className="truncate text-[11px] text-gray-400">{g.reason} · {g.phone || g.email || ""}</p>
                  </div>
                  <div className="text-right">
                    {g.couponCode ? <span className="rounded bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-700">{g.couponCode}</span> : <span className="text-[10px] text-gray-300">—</span>}
                    <p className="mt-0.5 text-[10px] text-gray-400">{g.status}</p>
                  </div>
                </div>
              ))}
              {(detail.grants || []).length === 0 && <p className="py-8 text-center text-sm text-gray-400">No grants yet — press “Run now” on the campaign.</p>}
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}
