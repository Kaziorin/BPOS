"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plug,
  Webhook,
  Key,
  Code,
  Check,
  X,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  Copy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Send,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Zap,
  Radio,
  Sliders,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Mail,
  Truck,
  Building,
  Monitor,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface IntegrationItem {
  code: string;
  name: string;
  category: "PAYMENT" | "SMS" | "EMAIL" | "ACCOUNTING" | "MARKETPLACE" | "LOGISTICS" | "POS";
  description: string;
  icon: string;
  docsUrl: string;
  isEnabled?: boolean;
  config?: Record<string, any>;
}

interface WebhookSub {
  id: string;
  url: string;
  description?: string | null;
  events: string[];
  secret?: string;
  isActive: boolean;
  timeoutMs?: number;
  createdAt?: string;
}

interface WebhookEventLog {
  id: string;
  eventType: string;
  status: "SUCCESS" | "FAILED" | "RETRYING" | "PENDING";
  attemptCount: number;
  maxAttempts: number;
  createdAt: string;
  lastError?: string | null;
  payload?: any;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  revokeReason?: string | null;
  createdAt: string;
}

// ─── Metadata ────────────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { label: string; icon: any }> = {
  ALL: { label: "All Integrations", icon: Layers },
  PAYMENT: { label: "Payment & MFS", icon: CreditCard },
  SMS: { label: "SMS & Telephony", icon: MessageSquare },
  EMAIL: { label: "Email Dispatchers", icon: Mail },
  ACCOUNTING: { label: "ERP & Accounting", icon: Building },
  MARKETPLACE: { label: "E-Commerce", icon: Layers },
  LOGISTICS: { label: "Courier & Delivery", icon: Truck },
  POS: { label: "POS Hardware", icon: Monitor },
};

const WEBHOOK_EVENTS_LIST = [
  { code: "invoice.created", label: "Invoice Issued", category: "Sales" },
  { code: "invoice.paid", label: "Invoice Paid in Full", category: "Sales" },
  { code: "order.created", label: "New Order Placed", category: "Sales" },
  { code: "order.completed", label: "Order Fulfilled", category: "Sales" },
  { code: "payment.received", label: "Payment Tender Recorded", category: "Finance" },
  { code: "stock.low", label: "Low Stock Alert (Reorder Trigger)", category: "Inventory" },
  { code: "customer.created", label: "Customer Registered", category: "CRM" },
  { code: "installment.due", label: "EMI Installment Overdue", category: "Finance" },
  { code: "commission.generated", label: "Sales Agent Commission", category: "Finance" },
  { code: "delivery.completed", label: "Courier Delivery Completed", category: "Logistics" },
  { code: "sync.failed", label: "Offline Sync Conflict (§13)", category: "System" },
];

const ALL_API_SCOPES = [
  { code: "sales.read", label: "Read Sales Invoices & History" },
  { code: "sales.write", label: "Create & Modify Sales Invoices" },
  { code: "products.read", label: "View Product Catalog & Prices" },
  { code: "products.write", label: "Create & Update Products" },
  { code: "inventory.read", label: "Read Warehouse Stock Levels" },
  { code: "inventory.write", label: "Adjust Stock & Post Transfers" },
  { code: "customers.read", label: "Read Customer CRM Records" },
  { code: "customers.write", label: "Create & Edit Customers" },
  { code: "payments.read", label: "View Payment Transactions" },
  { code: "payments.write", label: "Record POS Payments & Refunds" },
  { code: "accounting.read", label: "Read Chart of Accounts & P&L" },
  { code: "delivery.read", label: "Track Delivery Shipments" },
  { code: "delivery.write", label: "Dispatch Courier Orders" },
  { code: "webhooks.manage", label: "Manage Webhook Subscriptions" },
  { code: "admin.full", label: "Full Administrator Access" },
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "webhooks" | "api-keys" | "developer">("marketplace");
  const [loading, setLoading] = useState(true);

  // Marketplace State
  const [catalog, setCatalog] = useState<IntegrationItem[]>([]);
  const [enabledIntegrations, setEnabledIntegrations] = useState<any[]>([]);
  const [catFilter, setCatFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  // Config Modal
  const [configTarget, setConfigTarget] = useState<IntegrationItem | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookSub[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookEventLog[]>([]);
  const [webhookStats, setWebhookStats] = useState<any>({});
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [whUrl, setWhUrl] = useState("");
  const [whDesc, setWhDesc] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [whSecret, setWhSecret] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWhId, setTestingWhId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyExpiryDays, setKeyExpiryDays] = useState(365);
  const [keyScopes, setKeyScopes] = useState<string[]>(["sales.read", "products.read"]);
  const [newlyCreatedSecretKey, setNewlyCreatedSecretKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [catRes, enRes, whRes, whEventsRes, whStatsRes, keysRes] = await Promise.all([
        api.get<any>("/api/v1/integrations/catalog").catch(() => ({ data: [] })),
        api.get<any>("/api/v1/integrations").catch(() => ({ data: [] })),
        api.get<any>("/api/v1/webhooks").catch(() => ({ data: [] })),
        api.get<any>("/api/v1/webhooks/events").catch(() => ({ data: [] })),
        api.get<any>("/api/v1/webhooks/stats").catch(() => ({ data: {} })),
        api.get<any>("/api/v1/api-keys").catch(() => ({ data: [] })),
      ]);

      setCatalog(catRes?.data || catRes || []);
      setEnabledIntegrations(enRes?.data || enRes || []);
      setWebhooks(whRes?.data || whRes || []);
      setWebhookLogs(whEventsRes?.data || whEventsRes || []);
      setWebhookStats(whStatsRes?.data || whStatsRes || {});
      setApiKeys(keysRes?.data || keysRes || []);
    } catch (err: any) {
      console.error("Failed to load integrations data:", err);
      notify(err?.message || "Failed to load integrations data", "error");
    } finally {
      setLoading(false);
    }
  }

  const enabledMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of enabledIntegrations) {
      const isAct = item.isEnabled === true || item.isEnabled === 1 || item.status === "ENABLED";
      if (isAct) {
        map.set(item.code, item);
      }
    }
    return map;
  }, [enabledIntegrations]);

  async function toggleIntegration(item: IntegrationItem) {
    const isCurrentlyEnabled = enabledMap.has(item.code);
    setTogglingCode(item.code);
    try {
      if (isCurrentlyEnabled) {
        await api.post(`/api/v1/integrations/${item.code}/disable`);
        notify(`Integration "${item.name}" deactivated.`);
      } else {
        await api.post(`/api/v1/integrations/${item.code}/enable`, { config: {} });
        notify(`Integration "${item.name}" enabled successfully!`);
      }
      const enRes = await api.get<any>("/api/v1/integrations");
      setEnabledIntegrations(enRes?.data || enRes || []);
    } catch (err: any) {
      notify(err?.message || "Failed to toggle integration", "error");
    } finally {
      setTogglingCode(null);
    }
  }

  function openConfigModal(item: IntegrationItem) {
    const existing = enabledIntegrations.find((x) => x.code === item.code);
    setConfigTarget(item);
    setConfigForm(existing?.config || { apiKey: "", secretKey: "", environment: "sandbox" });
  }

  async function saveIntegrationConfig() {
    if (!configTarget) return;
    setSavingConfig(true);
    try {
      await api.post(`/api/v1/integrations/${configTarget.code}/enable`, {
        config: configForm,
      });
      notify(`Configuration saved for ${configTarget.name}!`);
      setConfigTarget(null);
      const enRes = await api.get<any>("/api/v1/integrations");
      setEnabledIntegrations(enRes?.data || enRes || []);
    } catch (err: any) {
      notify(err?.message || "Failed to save integration config", "error");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleCreateWebhook() {
    if (!whUrl.trim() || whEvents.length === 0) return;
    setSavingWebhook(true);
    try {
      await api.post("/api/v1/webhooks", {
        url: whUrl.trim(),
        description: whDesc.trim() || undefined,
        events: whEvents,
        secret: whSecret.trim() || undefined,
      });
      setShowWebhookModal(false);
      setWhUrl("");
      setWhDesc("");
      setWhEvents([]);
      setWhSecret("");
      notify("Webhook subscription registered successfully!");
      loadAllData();
    } catch (err: any) {
      notify(err?.message || "Failed to create webhook", "error");
    } finally {
      setSavingWebhook(false);
    }
  }

  async function testWebhookPing(id: string) {
    setTestingWhId(id);
    try {
      await api.post(`/api/v1/webhooks/${id}/test`);
      notify("Test ping event dispatched successfully!");
      loadAllData();
    } catch (err: any) {
      notify(err?.message || "Test ping failed", "error");
    } finally {
      setTestingWhId(null);
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;
    try {
      await api.del(`/api/v1/webhooks/${id}`);
      notify("Webhook subscription deleted.");
      loadAllData();
    } catch (err: any) {
      notify(err?.message || "Failed to delete webhook", "error");
    }
  }

  async function handleCreateApiKey() {
    if (!keyName.trim() || keyScopes.length === 0) return;
    setCreatingKey(true);
    try {
      const res = await api.post<any>("/api/v1/api-keys", {
        name: keyName.trim(),
        scopes: keyScopes,
        expiresInDays: keyExpiryDays > 0 ? keyExpiryDays : undefined,
      });
      const data = res?.data || res;
      setNewlyCreatedSecretKey(data.secretKey || data.key || "omni_live_created");
      setShowKeyModal(false);
      setKeyName("");
      setKeyScopes(["sales.read", "products.read"]);
      notify("API Key provisioned successfully!");
      loadAllData();
    } catch (err: any) {
      notify(err?.message || "Failed to create API key", "error");
    } finally {
      setCreatingKey(false);
    }
  }

  async function revokeApiKey(id: string) {
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will be blocked immediately.")) return;
    try {
      await api.post(`/api/v1/api-keys/${id}/revoke`, { reason: "Revoked by store admin" });
      notify("API key revoked.");
      loadAllData();
    } catch (err: any) {
      notify(err?.message || "Failed to revoke API key", "error");
    }
  }

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchCat = catFilter === "ALL" || item.category === catFilter;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalog, catFilter, searchQuery]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Breadcrumb & Top Executive Header ── */}
      <CustomBreadcrumb
        title="Connectors, Webhooks & API Ecosystem"
        description="Marketplace integrations (bKASH, Nagad, Daraz, Pathao, QuickBooks), real-time webhook event streams (§19), and scoped REST API keys"
        icon={<Plug size={16} />}
        items={[
          { label: "Administration", href: "/dashboard" },
          { label: "Configuration", href: "/settings" },
          { label: "Integrations & API", href: "/integrations" },
        ]}
      />

      {/* ── Toast Alert Banner ── */}
      {toastMsg && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border shadow-lg animate-in slide-in-from-top duration-300 ${
            toastMsg.type === "success"
              ? "bg-primary-50 border-primary-200 text-primary-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMsg.type === "success" ? <CheckCircle2 size={18} className="text-primary-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
            <span className="text-sm font-semibold">{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 rounded hover:bg-black/5 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── One-Time API Key Reveal Modal ── */}
      {newlyCreatedSecretKey && (
        <div className="rounded-2xl border-2 border-primary-300 bg-primary-50 p-5 shadow-lg animate-in zoom-in-95 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-900 font-black text-sm">
              <Key size={18} className="text-primary-600" />
              <span>Copy Your New API Secret Key</span>
            </div>
            <button
              onClick={() => setNewlyCreatedSecretKey(null)}
              className="text-xs font-bold text-primary-800 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-primary-800">
            For security reasons, this secret key will <strong>never be shown again</strong>. Please copy and store it securely in your environment variables.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl bg-white p-3 border border-primary-200 font-mono text-xs font-bold text-slate-900 select-all break-all">
              {newlyCreatedSecretKey}
            </code>
            <CustomButton
              variant="primary"
              size="sm"
              leftIcon={<Copy size={14} />}
              onClick={() => {
                navigator.clipboard.writeText(newlyCreatedSecretKey);
                notify("API Key copied to clipboard!");
              }}
            >
              Copy
            </CustomButton>
          </div>
        </div>
      )}

      {/* ── Executive KPI Cards (Light Application Theme) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Connectors</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Plug size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{enabledMap.size}</span>
            <span className="text-xs text-slate-500">of {catalog.length} available</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <CheckCircle2 size={13} />
            <span>Marketplace Ready</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Webhooks Subscriptions</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Webhook size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{webhooks.length}</span>
            <span className="text-xs text-slate-500">endpoints registered</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <Radio size={13} />
            <span>HMAC-SHA256 Signed</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">API Tokens</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Key size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {apiKeys.filter((k) => k.isActive && !k.revokedAt).length}
            </span>
            <span className="text-xs text-slate-500">active keys</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <ShieldCheck size={13} />
            <span>Scoped Access Control</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Reliability</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {webhookStats?.successRate ?? (webhookLogs.length > 0 ? "100" : "100")}%
            </span>
            <span className="text-xs text-slate-500">success rate</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600">
            <Zap size={13} />
            <span>Automatic Backoff Retry</span>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          {[
            { id: "marketplace", label: "Connectors Marketplace", icon: Plug, badge: catalog.length },
            { id: "webhooks", label: "Webhooks & Telemetry (§19)", icon: Webhook, badge: webhooks.length },
            { id: "api-keys", label: "API Keys & Scopes", icon: Key, badge: apiKeys.length },
            { id: "developer", label: "API Sandbox & Docs", icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "webhooks" && (
          <CustomButton
            variant="primary"
            size="md"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowWebhookModal(true)}
          >
            Register Webhook
          </CustomButton>
        )}

        {activeTab === "api-keys" && (
          <CustomButton
            variant="primary"
            size="md"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowKeyModal(true)}
          >
            Generate API Key
          </CustomButton>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CONNECTORS & APP MARKETPLACE                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "marketplace" && (
        <div className="space-y-5">
          {/* Category Filter Pills & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CATEGORY_MAP).map(([catKey, meta]) => {
                const Icon = meta.icon;
                const active = catFilter === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setCatFilter(catKey)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      active
                        ? "bg-primary-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search connectors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Connectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((item) => {
              const isEnabled = enabledMap.has(item.code);
              const isToggling = togglingCode === item.code;

              return (
                <div
                  key={item.code}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition bg-white shadow-sm hover:shadow-md ${
                    isEnabled
                      ? "border-primary-300 bg-primary-50/20"
                      : "border-slate-200"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-xs ${
                            isEnabled
                              ? "bg-primary-100 border-primary-200 text-primary-600"
                              : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          <Plug size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900">{item.name}</h3>
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border bg-primary-50 text-primary-700 border-primary-200"
                          >
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Enable Switch */}
                      <button
                        onClick={() => toggleIntegration(item)}
                        disabled={isToggling}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? "bg-primary-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions & Status */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {isEnabled ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary-600">
                          <CheckCircle2 size={13} />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <XCircle size={13} />
                          <span>Not Configured</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEnabled && (
                        <button
                          onClick={() => openConfigModal(item)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                        >
                          Configure
                        </button>
                      )}
                      {item.docsUrl && item.docsUrl !== "#" && (
                        <a
                          href={item.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:underline"
                        >
                          <span>Docs</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: WEBHOOKS SUBSCRIPTIONS & EVENT TELEMETRY (§19)                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          {/* Subscriptions Table Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Active Webhook Subscriptions</h3>
                <p className="text-xs text-slate-500">
                  HTTP POST event callbacks signed with <code className="font-mono text-primary-600 font-bold">X-Webhook-Signature</code>
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">{webhooks.length} Active Endpoints</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Endpoint URL</th>
                    <th className="px-4 py-3">Subscribed Events</th>
                    <th className="px-4 py-3">Signing Secret</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {webhooks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                        No webhook endpoints configured. Click &quot;Register Webhook&quot; to begin streaming events.
                      </td>
                    </tr>
                  ) : (
                    webhooks.map((sub) => {
                      const isRevealed = !!revealedSecrets[sub.id];

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="font-mono font-bold text-slate-900 block max-w-sm truncate">{sub.url}</span>
                              <span className="text-[10px] text-slate-400">{sub.description || "No description"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(Array.isArray(sub.events) ? sub.events : []).map((ev) => (
                                <span
                                  key={ev}
                                  className="rounded bg-primary-50 text-primary-700 px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                                >
                                  {ev}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                              <span>{isRevealed ? sub.secret || "Default HMAC" : "••••••••••••••••"}</span>
                              <button
                                onClick={() => setRevealedSecrets((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                sub.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {sub.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <CustomButton
                                variant="outline"
                                size="sm"
                                leftIcon={<Send size={11} className={testingWhId === sub.id ? "animate-spin" : ""} />}
                                disabled={testingWhId === sub.id}
                                onClick={() => testWebhookPing(sub.id)}
                              >
                                {testingWhId === sub.id ? "Pinging..." : "Test Ping"}
                              </CustomButton>
                              <button
                                onClick={() => deleteWebhook(sub.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                title="Delete Webhook"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Event Dispatch Telemetry & Logs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Recent Event Deliveries & Telemetry</h3>
                  <span className="text-[11px] text-slate-500">Real-time audit log of outbound webhook dispatches</span>
                </div>
              </div>
              <CustomButton
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
                onClick={loadAllData}
              >
                Refresh Logs
              </CustomButton>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Event Type</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Attempts</th>
                    <th className="px-4 py-2.5">Dispatched At</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {webhookLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No recent webhook deliveries recorded.
                      </td>
                    </tr>
                  ) : (
                    webhookLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                          {log.eventType}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-100 text-emerald-700"
                                : log.status === "FAILED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                          {log.attemptCount} / {log.maxAttempts}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                          {new Date(log.createdAt).toLocaleTimeString()} · {new Date(log.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {log.status !== "SUCCESS" && (
                            <button
                              onClick={async () => {
                                await api.post(`/api/v1/webhooks/events/${log.id}/retry`);
                                notify("Event queued for redelivery!");
                                loadAllData();
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:underline cursor-pointer"
                            >
                              <RotateCcw size={11} />
                              <span>Retry</span>
                            </button>
                          )}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: API KEYS & SCOPES MANAGEMENT                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "api-keys" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Authorized REST API Access Keys</h3>
              <p className="text-xs text-slate-500">
                Grant external programs, ERP systems, or mobile POS terminals programmatic access to your store.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{apiKeys.length} Keys Provisioned</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Key Label</th>
                  <th className="px-4 py-3">Key Prefix</th>
                  <th className="px-4 py-3">Granted Scopes</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      No API keys generated yet. Click &quot;Generate API Key&quot; to connect external systems.
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((keyItem) => {
                    const isRevoked = !!keyItem.revokedAt;

                    return (
                      <tr key={keyItem.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                              <Key size={14} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{keyItem.name}</span>
                              {keyItem.expiresAt && (
                                <span className="text-[10px] text-slate-400">
                                  Expires {new Date(keyItem.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                          {keyItem.keyPrefix}••••••••
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(Array.isArray(keyItem.scopes) ? keyItem.scopes : []).map((s) => (
                              <span
                                key={s}
                                className="rounded bg-primary-50 text-primary-700 px-1.5 py-0.5 text-[9px] font-bold"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isRevoked
                                ? "bg-rose-100 text-rose-700"
                                : keyItem.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {isRevoked ? "Revoked" : keyItem.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {new Date(keyItem.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {!isRevoked && (
                            <button
                              onClick={() => revokeApiKey(keyItem.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: DEVELOPER SANDBOX & API SPECIFICATION                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "developer" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick cURL Example */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-primary-600" />
                <h4 className="text-sm font-bold text-slate-900">REST API Request Example</h4>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold">cURL</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto leading-relaxed">
{`curl -X POST https://api.blueoceanspos.com/api/v1/sales \\
  -H "Authorization: Bearer omni_live_YOUR_KEY_HERE" \\
  -H "X-Tenant-Id: demo-shop" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "productId": "prod_01", "quantity": 2, "unitPrice": 450.00 }
    ],
    "paymentMethod": "bKASH",
    "receivedAmount": 900.00
  }'`}
            </pre>

            <p className="text-xs text-slate-500">
              All API requests must include the <code className="text-primary-700 font-bold">Authorization: Bearer &lt;key&gt;</code> header.
            </p>
          </div>

          {/* Webhook Signature Verification Guide */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-primary-600" />
                <h4 className="text-sm font-bold text-slate-900">HMAC-SHA256 Webhook Verification</h4>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold">Node.js</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto leading-relaxed">
{`const crypto = require("crypto");

function verifyWebhook(rawPayload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawPayload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
            </pre>

            <p className="text-xs text-slate-500">
              Verify the incoming payload against the <code className="text-primary-700 font-bold">X-Webhook-Signature</code> header to ensure data integrity.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: REGISTER WEBHOOK SUBSCRIPTION                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Webhook size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900">Register Webhook Endpoint</h3>
              </div>
              <button onClick={() => setShowWebhookModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Endpoint URL *</label>
                <input
                  type="url"
                  placeholder="https://api.yourdomain.com/webhooks/blueoceans"
                  value={whUrl}
                  onChange={(e) => setWhUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Production ERP Syncer"
                  value={whDesc}
                  onChange={(e) => setWhDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Select Subscribed Events *</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {WEBHOOK_EVENTS_LIST.map((ev) => {
                    const checked = whEvents.includes(ev.code);
                    return (
                      <label
                        key={ev.code}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer select-none ${
                          checked
                            ? "border-primary-400 bg-primary-50/40"
                            : "border-slate-100 bg-slate-50/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setWhEvents((prev) =>
                              prev.includes(ev.code) ? prev.filter((x) => x !== ev.code) : [...prev, ev.code]
                            );
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block text-[11px]">{ev.label}</span>
                          <span className="font-mono text-[9px] text-slate-400">{ev.code}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setShowWebhookModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                loading={savingWebhook}
                disabled={savingWebhook || !whUrl.trim() || whEvents.length === 0}
                onClick={handleCreateWebhook}
              >
                Register Subscription
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: GENERATE API KEY                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Key size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900">Provision New API Key</h3>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Name / Client Identifier *</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile Android POS Node #04"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Expiration Period</label>
                <select
                  value={keyExpiryDays}
                  onChange={(e) => setKeyExpiryDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days (Quarterly)</option>
                  <option value={365}>1 Year (Recommended)</option>
                  <option value={0}>Never Expire</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Granted Scopes *</label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {ALL_API_SCOPES.map((scope) => {
                    const checked = keyScopes.includes(scope.code);
                    return (
                      <label
                        key={scope.code}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer select-none ${
                          checked
                            ? "border-primary-400 bg-primary-50/40"
                            : "border-slate-100 bg-slate-50/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setKeyScopes((prev) =>
                              prev.includes(scope.code) ? prev.filter((x) => x !== scope.code) : [...prev, scope.code]
                            );
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block text-[11px]">{scope.label}</span>
                          <span className="font-mono text-[9px] text-slate-400">{scope.code}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setShowKeyModal(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                loading={creatingKey}
                disabled={creatingKey || !keyName.trim() || keyScopes.length === 0}
                onClick={handleCreateApiKey}
              >
                Generate API Key
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CONFIGURE INTEGRATION CONNECTOR                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {configTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Configure {configTarget.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400">{configTarget.code}</span>
                </div>
              </div>
              <button onClick={() => setConfigTarget(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">API Public Key / Client ID</label>
                <input
                  type="text"
                  placeholder="e.g. pk_live_..."
                  value={configForm.apiKey || ""}
                  onChange={(e) => setConfigForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">API Secret Key / Token</label>
                <input
                  type="password"
                  placeholder="e.g. sk_live_..."
                  value={configForm.secretKey || ""}
                  onChange={(e) => setConfigForm((prev) => ({ ...prev, secretKey: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Environment Mode</label>
                <select
                  value={configForm.environment || "sandbox"}
                  onChange={(e) => setConfigForm((prev) => ({ ...prev, environment: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="sandbox">Sandbox / Test Mode</option>
                  <option value="production">Production Live Mode</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setConfigTarget(null)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                loading={savingConfig}
                disabled={savingConfig}
                onClick={saveIntegrationConfig}
              >
                Save Configuration
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
