"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Zap,
  Users,
  Play,
  Pause,
  Trash2,
  Ticket,
  Send,
  Eye,
  Calendar,
  Clock,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Gift,
  Cake,
  HeartHandshake,
  ShoppingBag,
  Award,
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  Tag,
  DollarSign,
  TrendingUp,
  Percent,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  CustomModal,
  ConfirmModal,
} from "@/components/custom";
import { money, dateTime, dateOnly } from "@/lib/format";

interface TriggerDef {
  code: string;
  label: string;
  description: string;
}

interface Campaign {
  id: string;
  name: string;
  triggerType: string;
  status: string;
  channels: string[] | null;
  conditions: any | null;
  couponTemplate: any | null;
  startDate: string | null;
  endDate: string | null;
  lastRunAt: string | null;
  totalMatched: number;
  totalSent: number;
  createdAt: string;
}

interface Grant {
  id: string;
  customerName: string;
  customerId: string;
  phone: string | null;
  email: string | null;
  channel: string;
  couponCode: string | null;
  status: string;
  reason: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  DRAFT: { label: "Draft", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  ACTIVE: { label: "Active", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-600" },
  PAUSED: { label: "Paused", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-600" },
  ARCHIVED: { label: "Archived", badge: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" },
};

const TRIGGER_ICONS: Record<string, any> = {
  INACTIVE_30D: Clock,
  BIRTHDAY: Cake,
  ANNIVERSARY: HeartHandshake,
  FIRST_PURCHASE: ShoppingBag,
  HIGH_VALUE: Award,
  ABANDONED_CART: Tag,
  EXPIRY_REMINDER: BellRing,
  LOYALTY_MILESTONE: Gift,
};

const TRIGGER_DEFAULTS: Record<string, any> = {
  INACTIVE_30D: { name: "Win-back Inactive Customers (30 Days)", daysInactive: 30 },
  BIRTHDAY: { name: "Special Birthday Surprise Discount" },
  ANNIVERSARY: { name: "Membership Anniversary Reward" },
  FIRST_PURCHASE: { name: "First Purchase Thank-you & Next Order Offer", lookbackDays: 7 },
  HIGH_VALUE: { name: "VIP High-Value Buyer Privilege Reward", minAmount: 10000, lookbackDays: 30 },
  ABANDONED_CART: { name: "Abandoned Cart Recovery Nudge", daysInactive: 1 },
  EXPIRY_REMINDER: { name: "Gift Card & Wallet Expiry Reminder", daysInactive: 7 },
  LOYALTY_MILESTONE: { name: "Tier Advancement & Milestone Congrats", milestonePoints: 500 },
};

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [triggers, setTriggers] = useState<TriggerDef[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"campaigns" | "triggers" | "grants">("campaigns");

  // Detail Modal
  const [detail, setDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Create Campaign Modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({
    name: "",
    triggerType: "INACTIVE_30D",
    status: "ACTIVE",
    channels: ["SMS"],
    discountType: "PERCENTAGE",
    discountValue: "10",
    minAmount: "",
    maxDiscount: "",
    validDays: "14",
    conditions: {},
  });
  const [running, setRunning] = useState(false);

  // Confirm delete modal
  const [deleteModalCampaign, setDeleteModalCampaign] = useState<Campaign | null>(null);

  // Toast
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    else setLoading(true);
    try {
      const [campRes, trigRes, grantRes] = await Promise.all([
        api.get<any>("/api/v1/marketing/campaigns"),
        api.get<any>("/api/v1/marketing/triggers"),
        api.get<any>("/api/v1/marketing/grants"),
      ]);
      setCampaigns(campRes.data?.data || campRes.data || []);
      setTriggers(trigRes.data?.data || trigRes.data || []);
      setGrants(grantRes.data?.data || grantRes.data || []);
    } catch (err: any) {
      notify(false, err.message || "Failed to load marketing data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate summary metrics
  const summaryStats = useMemo(() => {
    const totalMatched = campaigns.reduce((sum, c) => sum + (Number(c.totalMatched) || 0), 0);
    const totalSent = campaigns.reduce((sum, c) => sum + (Number(c.totalSent) || 0), 0);
    const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;
    return {
      activeCount,
      totalCampaigns: campaigns.length,
      triggersCount: triggers.length,
      totalMatched,
      totalSent,
    };
  }, [campaigns, triggers]);

  function openCreateWithTrigger(triggerCode: string = "INACTIVE_30D") {
    const def = TRIGGER_DEFAULTS[triggerCode] || {};
    setForm({
      name: def.name || "",
      triggerType: triggerCode,
      status: "ACTIVE",
      channels: ["SMS"],
      discountType: "PERCENTAGE",
      discountValue: "10",
      minAmount: "",
      maxDiscount: "",
      validDays: "14",
      conditions: { ...def },
    });
    setShowCreate(true);
  }

  function changeTrigger(t: string) {
    const def = TRIGGER_DEFAULTS[t] || {};
    setForm((f: any) => ({
      ...f,
      triggerType: t,
      name: def.name || f.name,
      conditions: { ...def },
    }));
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      notify(false, "Campaign name is required");
      return;
    }
    const conditions: any = {};
    if (form.conditions?.daysInactive) conditions.daysInactive = Number(form.conditions.daysInactive);
    if (form.conditions?.lookbackDays) conditions.lookbackDays = Number(form.conditions.lookbackDays);
    if (form.conditions?.minAmount) conditions.minAmount = Number(form.conditions.minAmount);
    if (form.conditions?.milestonePoints) conditions.milestonePoints = Number(form.conditions.milestonePoints);

    const couponTemplate = {
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      minAmount: form.minAmount ? Number(form.minAmount) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      validDays: Number(form.validDays) || 14,
      codePrefix: form.triggerType.slice(0, 3),
    };

    setRunning(true);
    try {
      await api.post("/api/v1/marketing/campaigns", {
        name: form.name.trim(),
        triggerType: form.triggerType,
        status: form.status,
        channels: form.channels,
        conditions,
        couponTemplate,
      });
      setShowCreate(false);
      notify(true, `Campaign "${form.name.trim()}" created successfully`);
      loadData(true);
    } catch (err: any) {
      notify(false, err?.message || "Failed to create campaign");
    } finally {
      setRunning(false);
    }
  }

  async function toggleStatus(c: Campaign) {
    const isActivating = c.status !== "ACTIVE";
    try {
      await api.post(`/api/v1/marketing/campaigns/${c.id}/${isActivating ? "activate" : "pause"}`);
      notify(true, `Campaign ${isActivating ? "activated" : "paused"}`);
      loadData(true);
    } catch (err: any) {
      notify(false, err?.message || "Failed to update status");
    }
  }

  async function runCampaign(c: Campaign) {
    setRunning(true);
    try {
      const res = await api.post<any>(`/api/v1/marketing/campaigns/${c.id}/run`, {});
      const matched = res.data?.data?.matched ?? res.data?.matched ?? 0;
      const queued = res.data?.data?.couponsCreated ?? res.data?.couponsCreated ?? 0;
      notify(true, `Target audience evaluated: Matched ${matched} customer(s) · ${queued} coupon(s) generated`);
      loadData(true);
    } catch (err: any) {
      notify(false, err?.message || "Campaign run failed");
    } finally {
      setRunning(false);
    }
  }

  async function openAudienceDetail(c: Campaign) {
    try {
      const res = await api.get<any>(`/api/v1/marketing/campaigns/${c.id}`);
      setDetail(res.data?.data || res.data);
      setDetailOpen(true);
    } catch (err: any) {
      notify(false, err.message || "Failed to fetch audience details");
    }
  }

  async function deleteCampaign() {
    if (!deleteModalCampaign) return;
    try {
      await api.del(`/api/v1/marketing/campaigns/${deleteModalCampaign.id}`);
      notify(true, "Campaign deleted successfully");
      setDeleteModalCampaign(null);
      loadData(true);
    } catch (err: any) {
      notify(false, err?.message || "Delete failed");
    }
  }

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-in slide-in-from-top duration-200 ${
            toast.ok
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-teal-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          {toast.text}
        </div>
      )}

      {/* ── Header ── */}
      <CustomBreadcrumb
        title="Marketing Automation & Campaigns"
        subtitle="Trigger-Based Lifecycle Marketing, Dynamic Coupon Generation & Multi-Channel Audience Delivery"
        icon={<Megaphone className="w-5 h-5" />}
        items={[
          { label: "Growth", href: "/promotions" },
          { label: "Marketing Automation" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              Refresh
            </CustomButton>

            <CustomButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => openCreateWithTrigger("INACTIVE_30D")}
            >
              New Campaign
            </CustomButton>
          </div>
        }
      />

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CustomStatCard
          label="Active Automations"
          value={summaryStats.activeCount.toString()}
          icon={Megaphone}
          tone="primary"
        />

        <CustomStatCard
          label="Catalog Triggers"
          value={summaryStats.triggersCount.toString()}
          icon={Zap}
          tone="violet"
        />

        <CustomStatCard
          label="Matched Customers"
          value={summaryStats.totalMatched.toLocaleString()}
          icon={Users}
          tone="green"
        />

        <CustomStatCard
          label="Queued Offers & SMS"
          value={summaryStats.totalSent.toLocaleString()}
          icon={Send}
          tone="blue"
        />
      </div>

      {/* ── Tab Navigation Bar ── */}
      <div className="flex border-b border-slate-200 bg-white px-3 pt-2 rounded-t-xl shadow-2xs overflow-x-auto gap-1">
        {[
          { key: "campaigns", label: "Automated Campaigns", icon: Megaphone, count: campaigns.length },
          { key: "triggers", label: "Trigger Catalog & Recipes", icon: Zap, count: triggers.length },
          { key: "grants", label: "Audience Delivery Ledger", icon: Ticket, count: grants.length },
        ].map(({ key, label, icon: Icon, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "border-teal-600 text-teal-700 bg-teal-50/40 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-teal-600" : "text-slate-400"}`} />
              <span>{label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  active ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-5 shadow-2xs">
        {activeTab === "campaigns" && (
          /* ── CAMPAIGNS TABLE ── */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Trigger-Based Campaigns</h4>
                <p className="text-xs text-slate-500">
                  Event-driven and schedule-evaluated rules that generate targeted coupons and queue notifications.
                </p>
              </div>
              <CustomButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => openCreateWithTrigger("INACTIVE_30D")}
              >
                Create Campaign
              </CustomButton>
            </div>

            <CustomTable<Campaign>
              columns={[
                {
                  key: "name",
                  header: "Campaign Name & Last Run",
                  render: (row) => (
                    <div className="space-y-0.5">
                      <button
                        onClick={() => openAudienceDetail(row)}
                        className="font-bold text-xs text-slate-900 hover:text-teal-700 text-left transition"
                      >
                        {row.name}
                      </button>
                      <p className="text-[10px] text-slate-400">
                        {row.lastRunAt ? `Last run: ${dateTime(row.lastRunAt)}` : "Never run"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "triggerType",
                  header: "Trigger Rule",
                  render: (row) => {
                    const TriggerIcon = TRIGGER_ICONS[row.triggerType] || Zap;
                    return (
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                        <TriggerIcon className="w-3.5 h-3.5 text-teal-600" />
                        {row.triggerType.replace(/_/g, " ")}
                      </span>
                    );
                  },
                },
                {
                  key: "couponTemplate",
                  header: "Offer / Discount",
                  render: (row) => {
                    const tpl = row.couponTemplate || {};
                    if (!tpl?.discountValue) {
                      return <span className="text-xs text-slate-400 italic">Notification only</span>;
                    }
                    return (
                      <div className="text-xs">
                        <span className="font-bold font-mono text-teal-700">
                          {tpl.discountValue}
                          {tpl.discountType === "PERCENTAGE" ? "%" : " Tk"} OFF
                        </span>
                        {tpl.validDays && (
                          <span className="text-[11px] text-slate-500 block">Valid: {tpl.validDays} days</span>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: "channels",
                  header: "Delivery Channels",
                  render: (row) => (
                    <div className="flex flex-wrap gap-1">
                      {(row.channels || ["SMS"]).map((ch) => (
                        <span
                          key={ch}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "totalMatched",
                  header: "Audience Matched",
                  render: (row) => (
                    <div className="text-xs">
                      <span className="font-bold font-mono text-slate-800">{row.totalMatched || 0}</span>
                      <span className="text-[10px] text-slate-400 block">{row.totalSent || 0} queued</span>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => {
                    const sm = STATUS_META[row.status] ?? STATUS_META.DRAFT;
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sm.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                        {sm.label}
                      </span>
                    );
                  },
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => runCampaign(row)}
                        disabled={running}
                        className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3" /> Run
                      </button>

                      <button
                        onClick={() => toggleStatus(row)}
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        {row.status === "ACTIVE" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>

                      <button
                        onClick={() => openAudienceDetail(row)}
                        className="inline-flex items-center rounded-md p-1 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteModalCampaign(row)}
                        className="inline-flex items-center rounded-md p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={campaigns}
              pageSize={10}
              emptyMessage="No marketing campaigns configured yet."
            />
          </div>
        )}

        {activeTab === "triggers" && (
          /* ── TRIGGER CATALOG ── */
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800">Trigger Recipe Catalog</h4>
              <p className="text-xs text-slate-500">
                Pre-configured lifecycle hooks that detect specific customer behaviors and trigger automatic rewards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {triggers.map((t) => {
                const Icon = TRIGGER_ICONS[t.code] || Zap;
                const activeForTrigger = campaigns.filter((c) => c.triggerType === t.code && c.status === "ACTIVE").length;

                return (
                  <div
                    key={t.code}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md transition hover:-translate-y-0.5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {activeForTrigger} Active
                        </span>
                      </div>

                      <h5 className="font-bold text-sm text-slate-900">{t.label}</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <CustomButton
                        variant="outline"
                        size="sm"
                        className="w-full justify-center"
                        icon={<Sparkles className="w-3.5 h-3.5 text-teal-600" />}
                        onClick={() => openCreateWithTrigger(t.code)}
                      >
                        Use This Trigger
                      </CustomButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "grants" && (
          /* ── GRANTED COUPONS & AUDIENCE LOG ── */
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800">Coupon Grants & Delivery Ledger</h4>
              <p className="text-xs text-slate-500">
                Audit history of all unique discount coupons generated for evaluated customers across campaigns.
              </p>
            </div>

            <CustomTable<Grant>
              columns={[
                {
                  key: "customerName",
                  header: "Target Customer",
                  render: (row) => (
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-900">{row.customerName}</p>
                      <p className="text-[10px] text-slate-500">
                        {row.phone ? `📞 ${row.phone}` : ""} {row.email ? `✉️ ${row.email}` : ""}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "couponCode",
                  header: "Generated Coupon",
                  render: (row) =>
                    row.couponCode ? (
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        {row.couponCode}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    ),
                },
                {
                  key: "channel",
                  header: "Channel",
                  render: (row) => (
                    <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {row.channel}
                    </span>
                  ),
                },
                {
                  key: "reason",
                  header: "Trigger Reason",
                  render: (row) => <span className="text-xs text-slate-600">{row.reason || "Automated trigger"}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.status === "SENT" || row.status === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {row.status === "SENT" ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {row.status}
                    </span>
                  ),
                },
                {
                  key: "createdAt",
                  header: "Granted Date",
                  render: (row) => <span className="text-xs text-slate-500">{dateTime(row.createdAt)}</span>,
                },
              ]}
              data={grants}
              pageSize={15}
              emptyMessage="No customer grants recorded yet."
            />
          </div>
        )}
      </div>

      {/* ─── MODAL: CREATE CAMPAIGN ─── */}
      <CustomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Automated Marketing Campaign"
        size="lg"
      >
        <form onSubmit={createCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Inactive Customer 30-Day Win-Back Offer"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Trigger Event
              </label>
              <select
                value={form.triggerType}
                onChange={(e) => changeTrigger(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                {triggers.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Notification Channel
              </label>
              <select
                value={(form.channels || ["SMS"])[0]}
                onChange={(e) => setForm({ ...form, channels: [e.target.value] })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="SMS">📱 SMS Notification</option>
                <option value="EMAIL">✉️ Email Campaign</option>
                <option value="WHATSAPP">💬 WhatsApp Message</option>
                <option value="PUSH">🔔 App Push Notification</option>
              </select>
            </div>
          </div>

          {/* Coupon Offer Engine Section */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-teal-900 uppercase tracking-wider">
              <Ticket className="w-4 h-4 text-teal-600" /> Automated Coupon Generation
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                >
                  <option value="PERCENTAGE">% Percentage</option>
                  <option value="FIXED">Tk Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Value ({form.discountType === "PERCENTAGE" ? "%" : "Tk"})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Spend (Tk)</label>
                <input
                  type="number"
                  min="0"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={form.validDays}
                  onChange={(e) => setForm({ ...form, validDays: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Trigger Condition Parameters */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Trigger Threshold Conditions</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {form.triggerType === "INACTIVE_30D" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Inactive Period (Days)</label>
                  <input
                    type="number"
                    value={form.conditions?.daysInactive ?? 30}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        conditions: { ...form.conditions, daysInactive: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                  />
                </div>
              )}

              {form.triggerType === "HIGH_VALUE" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Minimum Order Total (Tk)</label>
                  <input
                    type="number"
                    value={form.conditions?.minAmount ?? 10000}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        conditions: { ...form.conditions, minAmount: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                  />
                </div>
              )}

              {form.triggerType === "LOYALTY_MILESTONE" && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Milestone Points Threshold</label>
                  <input
                    type="number"
                    value={form.conditions?.milestonePoints ?? 500}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        conditions: { ...form.conditions, milestonePoints: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              When triggered, personalized single-use coupons are generated and queued for instant SMS/Email delivery.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setShowCreate(false)} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" size="sm" icon={<Check className="w-4 h-4" />} type="submit" disabled={running}>
              {running ? "Creating..." : "Create Campaign"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ─── MODAL: AUDIENCE DETAIL ─── */}
      <CustomModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail ? `${detail.name} · Audience & Grants` : "Campaign Audience"}
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-teal-50 border border-teal-100 p-3">
                <span className="text-[10px] font-bold uppercase text-teal-600">Matched Customers</span>
                <p className="text-xl font-bold font-mono text-teal-900 mt-0.5">{detail.totalMatched || 0}</p>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <span className="text-[10px] font-bold uppercase text-blue-600">Messages Queued</span>
                <p className="text-xl font-bold font-mono text-blue-900 mt-0.5">{detail.totalSent || 0}</p>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Coupons Granted</span>
                <p className="text-xl font-bold font-mono text-emerald-900 mt-0.5">{(detail.grants || []).length}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Audience Recipients</span>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                {(detail.grants || []).map((g: any) => (
                  <div key={g.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">
                        {g.customerName} <span className="text-[10px] text-slate-400">({g.channel})</span>
                      </p>
                      <p className="text-[11px] text-slate-500">{g.phone || g.email || "No contact info"}</p>
                    </div>
                    <div className="text-right">
                      {g.couponCode && (
                        <span className="font-mono text-[11px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                          {g.couponCode}
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{g.status}</p>
                    </div>
                  </div>
                ))}
                {(detail.grants || []).length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No recipients recorded yet. Press &ldquo;Run Now&rdquo; to evaluate the campaign trigger.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <CustomButton variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
                Close
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ─── MODAL: DELETE CONFIRMATION ─── */}
      <ConfirmModal
        open={deleteModalCampaign !== null}
        onClose={() => setDeleteModalCampaign(null)}
        onConfirm={deleteCampaign}
        title="Delete Marketing Campaign"
        message={`Are you sure you want to delete campaign "${deleteModalCampaign?.name}"? All associated trigger rules and grant history will be removed.`}
        confirmText="Delete Campaign"
        variant="danger"
      />
    </div>
  );
}
