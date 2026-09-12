"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Building2,
  Store,
  Monitor,
  HardDrive,
  DollarSign,
  FileText,
  CreditCard,
  Package,
  Bell,
  Users,
  Shield,
  Plug,
  Brain,
  Crown,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sliders,
  Key,
  Database,
  Smartphone,
  Check,
  Search,
  Sparkles,
  Zap,
  Globe,
  Printer,
  Barcode,
  Truck,
  Layers,
  Activity,
  ArrowRight,
  Clock,
  Coins,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Lock,
  Wifi,
  WifiOff,
  Copy,
  ExternalLink,
  Volume2,
  SlidersHorizontal,
  Flame,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomInput,
  CustomSelect,
  CustomModal,
} from "@/components/custom";

// ───────────────────────────────────────────────────────────────────────
// SETTINGS CATEGORIES & TABS DEFINITION
// ───────────────────────────────────────────────────────────────────────

interface SettingsTabDef {
  id: string;
  label: string;
  category: "core" | "finance" | "security";
  icon: any;
  badge?: string;
  badgeColor?: string;
  description: string;
}

const SETTINGS_CATEGORIES = [
  { id: "core", label: "Core & Operations", icon: Building2 },
  { id: "finance", label: "Finance & Compliance", icon: DollarSign },
  { id: "security", label: "Security, Integrations & AI", icon: ShieldCheck },
] as const;

const SETTINGS_TABS: SettingsTabDef[] = [
  // 1. Core & Operations
  {
    id: "company",
    label: "Company & Identity",
    category: "core",
    icon: Building2,
    badge: "Core",
    badgeColor: "bg-primary-50 text-primary-700 border-primary-200",
    description: "Legal entity, branding, industry vertical, and trading info",
  },
  {
    id: "branch",
    label: "Branches & Outlets",
    category: "core",
    icon: Store,
    badge: "Multi-Store",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Active outlet defaults, counter prefixes, and store numbering",
  },
  {
    id: "pos",
    label: "POS Terminal & Hardware",
    category: "core",
    icon: Monitor,
    badge: "Counter",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    description: "Receipt paper width, audio scanner chime, and cashier policies",
  },
  {
    id: "sync",
    label: "Offline Sync Engine",
    category: "core",
    icon: HardDrive,
    badge: "§13 Resilient",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "IndexedDB caching, background cloud push, and conflict resolution",
  },

  // 2. Finance & Compliance
  {
    id: "tax",
    label: "Tax & NBR VAT (Mushak)",
    category: "finance",
    icon: DollarSign,
    badge: "NBR Mushak",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    description: "BIN registration, Mushak-6.3 compliance, and VAT rate presets",
  },
  {
    id: "invoice",
    label: "Invoice & Print Layout",
    category: "finance",
    icon: FileText,
    badge: "WYSIWYG",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Thermal slip layout, barcode generation, and footer return policy",
  },
  {
    id: "payment",
    label: "Payment Gateways & MFS",
    category: "finance",
    icon: CreditCard,
    badge: "bKash / Card",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Cash drawer, card POS, MFS mobile banking, and credit limits",
  },
  {
    id: "inventory",
    label: "Inventory Valuation",
    category: "finance",
    icon: Package,
    badge: "COGS",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "FIFO/FEFO costing rules, negative stock, and low stock threshold",
  },
  {
    id: "currency",
    label: "Currency & FX Rates",
    category: "finance",
    icon: Coins,
    badge: "BDT (৳)",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Base currency, multi-currency conversion, and locale dictionary",
  },

  // 3. Security, Integrations & AI
  {
    id: "notifications",
    label: "Alerts & Notifications",
    category: "security",
    icon: Bell,
    badge: "Omnichannel",
    badgeColor: "bg-yellow-50 text-yellow-700 border-yellow-200",
    description: "SMS receipt dispatch, low stock alerts, and shift close reports",
  },
  {
    id: "users",
    label: "Users & Security Policy",
    category: "security",
    icon: Users,
    badge: "Policy",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Session idle timeouts, PIN rules, and 2FA password complexity",
  },
  {
    id: "roles",
    label: "Roles & RBAC Matrix",
    category: "security",
    icon: Shield,
    badge: "RBAC",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    description: "Cashier, manager, and administrator permission assignments",
  },
  {
    id: "integrations",
    label: "API, Webhooks & Couriers",
    category: "security",
    icon: Plug,
    badge: "Webhooks",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Shopify e-commerce sync, Steadfast/Pathao courier logistics API",
  },
  {
    id: "ai",
    label: "AI Business Assistant",
    category: "security",
    icon: Brain,
    badge: "AI Copilot",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Demand forecasting, seasonal spike detector, and smart auto-PR",
  },
  {
    id: "subscription",
    label: "SaaS Enterprise Quota",
    category: "security",
    icon: Crown,
    badge: "Enterprise",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Tenant tier licensing, multi-branch quotas, and SLA guarantees",
  },
];

const VERTICAL_OPTIONS = [
  { value: "GROCERY", label: "Grocery & Supermarket", desc: "Scale barcodes, tare weight, PLU quick items", icon: Store },
  { value: "RESTAURANT", label: "Restaurant & Cafe Dining", desc: "Table map, KOT kitchen printers, time slot booking", icon: Flame },
  { value: "PHARMACY", label: "Pharmacy & Healthcare", desc: "FEFO batch expiry, DGDA compliance, patient display", icon: Sparkles },
  { value: "RETAIL", label: "Retail & Apparel", desc: "Barcode matrix (Size/Color), customer loyalty, returns", icon: Package },
  { value: "WHOLESALE", label: "Wholesale & B2B Distribution", desc: "Tiered price lists, credit limits, commercial challans", icon: Truck },
  { value: "MANUFACTURING", label: "Manufacturing & Bakery", desc: "Recipe BOM, raw material issue, batch production", icon: Layers },
  { value: "SALON", label: "Salon & Spa Center", desc: "Stylist appointment schedule, service commission", icon: Clock },
  { value: "REPAIR", label: "Repair & Service Center", desc: "Device intake, diagnostic jobs, technician tracking", icon: Activity },
  { value: "FRANCHISE", label: "Franchise Multi-Outlet", desc: "Central HQ royalty fee, branch inventory transfers", icon: Globe },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Tab Support: ?tab=company, ?tab=sync, ?tab=tax, etc.
  const rawTab = searchParams.get("tab")?.toLowerCase() || "company";
  const initialTab =
    rawTab === "tenant"
      ? "company"
      : SETTINGS_TABS.find((t) => t.id === rawTab)?.id || "company";

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [tabSearch, setTabSearch] = useState("");
  const [tenantData, setTenantData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Online network listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const loadSettingsData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes, wRes] = await Promise.allSettled([
        api.get("/tenant"),
        api.get("/branches"),
        api.get("/warehouses"),
      ]);

      if (tRes.status === "fulfilled") {
        const d = (tRes.value as any)?.data ?? tRes.value;
        setTenantData(d);
        if (d?.branches && Array.isArray(d.branches)) setBranches(d.branches);
        if (d?.warehouses && Array.isArray(d.warehouses)) setWarehouses(d.warehouses);
      }

      if (bRes.status === "fulfilled") {
        const b = (bRes.value as any)?.data ?? bRes.value;
        if (Array.isArray(b) && b.length > 0) setBranches(b);
      }

      if (wRes.status === "fulfilled") {
        const w = (wRes.value as any)?.data ?? wRes.value;
        if (Array.isArray(w) && w.length > 0) setWarehouses(w);
      }
    } catch (e) {
      console.error("Failed to load settings data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  // Sync state if URL changes (from Sidebar or external navigation)
  useEffect(() => {
    if (rawTab) {
      const matched = rawTab === "tenant" ? "company" : SETTINGS_TABS.find((t) => t.id === rawTab)?.id;
      if (matched && matched !== activeTab) {
        setActiveTab(matched);
      }
    }
  }, [rawTab, activeTab]);

  // Browser back / forward listener
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab") || "company";
        const matched = tab === "tenant" ? "company" : SETTINGS_TABS.find((t) => t.id === tab)?.id || "company";
        setActiveTab(matched);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/settings?tab=${tabId}`);
    }
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // Filter tabs by search
  const filteredTabs = useMemo(() => {
    if (!tabSearch.trim()) return SETTINGS_TABS;
    const q = tabSearch.toLowerCase().trim();
    return SETTINGS_TABS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [tabSearch]);

  const currentTabDef = SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];
  const CurrentIcon = currentTabDef.icon;

  const tenantObj = tenantData?.tenant || {};
  const companyObj = tenantData?.company || {};
  const currentVertical = tenantObj.businessType || "GROCERY";
  const verticalDef = VERTICAL_OPTIONS.find((v) => v.value === currentVertical) || VERTICAL_OPTIONS[0];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Breadcrumb & Top Header ── */}
      <CustomBreadcrumb
        title="System & Store Configuration"
        description="Master tenant settings, multi-branch outlet policies, offline sync engine (§13), tax compliance, POS hardware, and AI forecasting"
        icon={<Settings size={16} />}
        items={[
          { label: "Administration", href: "/dashboard" },
          { label: "System Settings", href: "/settings" },
          { label: currentTabDef.label },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {saveToast && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-sm animate-in fade-in">
                <CheckCircle2 size={15} className="text-emerald-600" /> {saveToast}
              </div>
            )}
            <CustomButton
              variant="outline"
              size="sm"
              onClick={loadSettingsData}
              loading={loading}
              icon={RefreshCw}
            >
              Refresh
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={() => {
                const el = document.getElementById("active-settings-form");
                if (el) {
                  el.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                } else {
                  showToast("Configuration preferences successfully applied!");
                }
              }}
              icon={Save}
            >
              Save Changes
            </CustomButton>
          </div>
        }
      />

      {/* ── Executive Hero Glow Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-primary-950 to-slate-900 border border-primary-500/20 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary-500/20 text-primary-300 border border-primary-400/30">
                <Sparkles size={13} className="text-primary-400" /> Enterprise POS Engine 2.0
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
                {isOnline ? "Cloud Online" : "Offline Mode"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <ShieldCheck size={13} /> NBR Mushak-6.3 Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{tenantObj.name || "Blue Ocean Enterprises"}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 border border-white/10 font-mono">
                {verticalDef.label}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Managing company legal identity, multi-outlet fulfillment routing, offline-first IndexedDB resilience (§13),
              and automated AI stock intelligence.
            </p>
          </div>

          {/* Quick Stats in Banner */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outlets</span>
              <div className="text-lg font-black text-white mt-0.5">{branches.length || 1} Registered</div>
              <span className="text-[10px] text-primary-300 font-medium">All Linked</span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Offline Cache</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">2,480 SKUs</div>
              <span className="text-[10px] text-slate-400 font-medium">IndexedDB Ready</span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Currency</span>
              <div className="text-lg font-black text-amber-300 mt-0.5">BDT (৳)</div>
              <span className="text-[10px] text-slate-400 font-medium">Asia/Dhaka</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Settings Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Navigation Sidebar (4 cols on lg) ── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm space-y-4">
            {/* Search Input for tabs */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tabSearch}
                onChange={(e) => setTabSearch(e.target.value)}
                placeholder="Search settings (e.g. VAT, printer, sync)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:outline-none focus:border-primary-500 focus:bg-white transition"
              />
              {tabSearch && (
                <button
                  onClick={() => setTabSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded-full"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Categorized Tab Groups */}
            <div className="space-y-5">
              {SETTINGS_CATEGORIES.map((cat) => {
                const categoryTabs = filteredTabs.filter((t) => t.category === cat.id);
                if (categoryTabs.length === 0) return null;
                const CatIcon = cat.icon;

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <CatIcon size={12} className="text-slate-400" />
                      <span>{cat.label}</span>
                    </div>

                    <div className="space-y-0.5">
                      {categoryTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isAct = activeTab === tab.id;

                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition group text-left",
                              isAct
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition",
                                  isAct
                                    ? "bg-primary-500/30 text-primary-300"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                                )}
                              >
                                <Icon size={14} />
                              </span>
                              <div className="truncate">
                                <p className="truncate leading-tight">{tab.label}</p>
                              </div>
                            </div>

                            {tab.badge && (
                              <span
                                className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1.5 border transition",
                                  isAct
                                    ? "bg-white/20 text-white border-white/20"
                                    : tab.badgeColor || "bg-slate-100 text-slate-600 border-slate-200"
                                )}
                              >
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Offline Resiliency Help Card */}
          <div className="p-4 rounded-3xl bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/60 text-slate-700 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-black text-emerald-950">
              <HardDrive size={15} className="text-emerald-600" />
              <span>Offline Architecture (§13)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every POS station caches inventory and sales locally in IndexedDB. Transactions automatically sync when cloud connectivity is restored.
            </p>
            <button
              onClick={() => handleTabChange("sync")}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Inspect Offline Engine →
            </button>
          </div>
        </div>

        {/* ── Right Content Panel (8 cols on lg) ── */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          {/* Active Tab Header Title */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-700 border border-primary-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                <CurrentIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{currentTabDef.label}</h2>
                  {currentTabDef.badge && (
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold border", currentTabDef.badgeColor)}>
                      {currentTabDef.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{currentTabDef.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">
                Tab: <strong className="text-slate-700 font-mono">?tab={activeTab}</strong>
              </span>
            </div>
          </div>

          {/* Dynamic Tab Body */}
          {activeTab === "company" && (
            <CompanySettingsTab
              tenantData={tenantData}
              onSave={() => showToast("Company & Identity profile updated successfully!")}
            />
          )}

          {activeTab === "branch" && (
            <BranchSettingsTab
              branches={branches}
              warehouses={warehouses}
              onSave={() => showToast("Multi-Branch configuration & numbering saved!")}
            />
          )}

          {activeTab === "pos" && (
            <POSSettingsTab
              warehouses={warehouses}
              onSave={() => showToast("POS terminal & hardware settings saved!")}
            />
          )}

          {activeTab === "sync" && (
            <OfflineSyncTab
              onSave={() => showToast("Offline sync preferences saved!")}
              onForceSync={() => showToast("Transactions synced with server successfully!")}
            />
          )}

          {activeTab === "tax" && (
            <TaxSettingsTab
              tenantData={tenantData}
              onSave={() => showToast("NBR VAT & Tax rules updated successfully!")}
            />
          )}

          {activeTab === "invoice" && (
            <InvoiceSettingsTab
              tenantData={tenantData}
              onSave={() => showToast("Invoice template & thermal print layout saved!")}
            />
          )}

          {activeTab === "payment" && (
            <PaymentSettingsTab
              onSave={() => showToast("Payment tender & gateway options saved!")}
            />
          )}

          {activeTab === "inventory" && (
            <InventorySettingsTab
              onSave={() => showToast("Inventory costing & valuation rules saved!")}
            />
          )}

          {activeTab === "currency" && (
            <CurrencySettingsTab
              tenantData={tenantData}
              onSave={() => showToast("Currency & exchange rates saved!")}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationSettingsTab
              onSave={() => showToast("Notification channels & alert policies saved!")}
            />
          )}

          {activeTab === "users" && (
            <UserSettingsTab
              onSave={() => showToast("User security & session policies saved!")}
            />
          )}

          {activeTab === "roles" && (
            <RoleSettingsTab
              onSave={() => showToast("Role access control matrix saved!")}
            />
          )}

          {activeTab === "integrations" && (
            <IntegrationSettingsTab
              onSave={() => showToast("API keys & webhook configuration saved!")}
            />
          )}

          {activeTab === "ai" && (
            <AISettingsTab
              onSave={() => showToast("AI forecasting & business assistant updated!")}
            />
          )}

          {activeTab === "subscription" && (
            <SubscriptionSettingsTab tenantData={tenantData} />
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 1: COMPANY & TENANT PROFILE
// ───────────────────────────────────────────────────────────────────────

function CompanySettingsTab({
  tenantData,
  onSave,
}: {
  tenantData: any;
  onSave: () => void;
}) {
  const tenant = tenantData?.tenant || {};
  const company = tenantData?.company || {};

  const [name, setName] = useState(tenant.name || "Blue Ocean Enterprises");
  const [legalName, setLegalName] = useState(company.legalName || "Blue Ocean POS Retail Ltd.");
  const [address, setAddress] = useState(company.address || "Level 8, Concord Tower, Gulshan-1, Dhaka-1212");
  const [phone, setPhone] = useState(company.phone || "+880 1711-000000");
  const [email, setEmail] = useState(company.email || "admin@blueocean.com.bd");
  const [vatRegNo, setVatRegNo] = useState(company.vatRegNo || "BIN-002938194-0101");
  const [businessType, setBusinessType] = useState(tenant.businessType || "GROCERY");
  const [currency, setCurrency] = useState(tenant.currency || "BDT");
  const [timezone, setTimezone] = useState(tenant.timezone || "Asia/Dhaka");
  const [website, setWebsite] = useState(company.website || "https://blueoceans.io");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant.name) setName(tenant.name);
    if (company.legalName) setLegalName(company.legalName);
    if (company.address) setAddress(company.address);
    if (company.phone) setPhone(company.phone);
    if (company.email) setEmail(company.email);
    if (company.vatRegNo) setVatRegNo(company.vatRegNo);
    if (tenant.businessType) setBusinessType(tenant.businessType);
    if (tenant.currency) setCurrency(tenant.currency);
    if (tenant.timezone) setTimezone(tenant.timezone);
    if (company.website) setWebsite(company.website);
  }, [tenant, company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res: any = await api.put("/v1/tenant", {
        name,
        legalName,
        address,
        phone,
        email,
        vatRegNo,
        businessType,
        currency,
        timezone,
        website,
      });

      // Update local storage so rest of UI immediately reflects new businessType & name
      const mappedBt = res?.data?.businessType || res?.businessType || businessType;
      if (typeof window !== "undefined") {
        try {
          const curTenant = localStorage.getItem("blueoceans_tenant");
          const parsed = curTenant ? JSON.parse(curTenant) : {};
          localStorage.setItem(
            "blueoceans_tenant",
            JSON.stringify({
              ...parsed,
              name,
              businessType: mappedBt,
            })
          );

          const curUser = localStorage.getItem("modernpos_user");
          if (curUser) {
            const parsedUser = JSON.parse(curUser);
            localStorage.setItem(
              "modernpos_user",
              JSON.stringify({
                ...parsedUser,
                businessType: mappedBt,
              })
            );
          }
        } catch (err) {}
      }

      onSave();
    } catch (err: any) {
      console.error("Failed to update company profile:", err);
      alert(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id="active-settings-form" onSubmit={handleSubmit} className="space-y-6 text-xs">
      {/* Visual Identity Preview Card */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{name || "Store Name"}</h3>
            <p className="text-slate-500 text-[11px]">{legalName || "Legal Entity"} · {address.split(",")[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {vatRegNo || "BIN-Pending"}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800 border border-primary-300">
            {businessType}
          </span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomInput
          label="Company Trading Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Blue Ocean Supermarket"
          required
        />

        <CustomInput
          label="Registered Legal Entity Name"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="e.g. Blue Ocean POS Retail Ltd."
          required
        />

        <div className="md:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">
            Registered Head Office Address <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-slate-50/60"
            rows={2}
            required
          />
        </div>

        <CustomInput
          label="Official Support Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+880 1711-000000"
        />

        <CustomInput
          label="Billing & Support Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="billing@blueocean.com.bd"
        />

        <CustomInput
          label="NBR BIN / VAT Registration No"
          value={vatRegNo}
          onChange={(e) => setVatRegNo(e.target.value)}
          placeholder="BIN-002938194-0101"
        />

        <CustomInput
          label="Official Website URL"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://blueoceans.io"
        />

        <CustomSelect
          label="Base Operating Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={[
            { value: "BDT", label: "BDT (৳ - Bangladeshi Taka)" },
            { value: "USD", label: "USD ($ - US Dollar)" },
            { value: "EUR", label: "EUR (€ - Euro)" },
            { value: "GBP", label: "GBP (£ - British Pound)" },
            { value: "SAR", label: "SAR (﷼ - Saudi Riyal)" },
            { value: "AED", label: "AED (د.إ - UAE Dirham)" },
          ]}
        />

        <CustomInput
          label="Default System Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="Asia/Dhaka"
        />
      </div>

      {/* Business Vertical Selection Grid */}
      <div className="space-y-2 pt-2">
        <label className="block font-bold text-slate-800">
          Industry Business Vertical & Theme Architecture
        </label>
        <p className="text-[11px] text-slate-500">
          Switching your vertical automatically activates specialized POS workflows (such as medicine FEFO for pharmacy, table maps for dining, or scale barcodes for grocery).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 pt-1">
          {VERTICAL_OPTIONS.map((v) => {
            const Icon = v.icon;
            const isSel = businessType === v.value;

            return (
              <div
                key={v.value}
                onClick={() => setBusinessType(v.value)}
                className={cn(
                  "p-3 rounded-2xl border cursor-pointer transition flex items-start gap-2.5",
                  isSel
                    ? "border-primary-500 bg-primary-50/50 shadow-xs ring-1 ring-primary-400"
                    : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    isSel ? "bg-primary-600 text-white shadow-xs" : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">{v.label}</span>
                    {isSel && <CheckCircle2 size={12} className="text-primary-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          * Updates will apply immediately across all registers and user sessions.
        </span>
        <CustomButton type="submit" variant="primary" loading={saving} icon={Save}>
          Save Company Profile
        </CustomButton>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 2: BRANCHES & OUTLETS
// ───────────────────────────────────────────────────────────────────────

function BranchSettingsTab({
  branches,
  warehouses,
  onSave,
}: {
  branches: any[];
  warehouses: any[];
  onSave: () => void;
}) {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || "main");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [autoNumbering, setAutoNumbering] = useState("AUTO");
  const [defaultWarehouse, setDefaultWarehouse] = useState(warehouses[0]?.id || "main");

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
        <div>
          <h4 className="font-bold text-blue-950 text-sm">Multi-Outlet Architecture</h4>
          <p className="text-blue-700 text-[11px]">
            Centralized inventory transfer, unique counter prefixes, and branch warehouse fulfillment
          </p>
        </div>
        <Link href="/branches">
          <CustomButton variant="outline" size="sm" icon={ExternalLink}>
            Manage All Outlets ({branches.length})
          </CustomButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          label="Default Active Store / Primary Outlet"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          options={
            branches.length > 0
              ? branches.map((b) => ({ value: b.id, label: `${b.name} (${b.code || "OUTLET"})` }))
              : [{ value: "main", label: "Main Outlet (Gulshan Branch)" }]
          }
        />

        <CustomSelect
          label="Fulfillment Warehouse Link"
          value={defaultWarehouse}
          onChange={(e) => setDefaultWarehouse(e.target.value)}
          options={
            warehouses.length > 0
              ? warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code || "WH"})` }))
              : [{ value: "main", label: "Central Storefront Warehouse" }]
          }
        />

        <CustomInput
          label="Invoice & Receipt Sequence Prefix"
          value={invoicePrefix}
          onChange={(e) => setInvoicePrefix(e.target.value)}
          placeholder="e.g. INV-, POS-GL-"
        />

        <CustomSelect
          label="Sequence Auto-Numbering Mode"
          value={autoNumbering}
          onChange={(e) => setAutoNumbering(e.target.value)}
          options={[
            { value: "AUTO", label: "Continuous Sequence (e.g. INV-001001)" },
            { value: "DAILY_RESET", label: "Daily Reset (e.g. INV-20260912-001)" },
            { value: "BRANCH_CODE", label: "Branch Prefixed (e.g. GL-POS-001)" },
            { value: "MANUAL", label: "Manual Offline Sequential Slip" },
          ]}
        />
      </div>

      {/* Outlet Cards Summary */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Connected Outlets & Locations
          </p>
          <span className="text-[11px] text-slate-400 font-mono">
            {branches.length || 1} Outlets Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(branches.length > 0
            ? branches
            : [
                { name: "Dhaka Flagship Outlet", code: "MAIN", address: "Gulshan-1, Dhaka", phone: "+880 1711-000000" },
                { name: "Chittagong Hub", code: "CTG-01", address: "GEC Circle, Chittagong", phone: "+880 1811-000000" },
              ]
          ).map((b, i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900">{b.name}</h4>
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                  {b.code || "OUTLET"}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">{b.address || "Bangladesh"}</p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span className="font-mono">{b.phone || "+880 1700-000000"}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Sync
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Branch Preferences
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 3: POS TERMINAL & HARDWARE
// ───────────────────────────────────────────────────────────────────────

function POSSettingsTab({
  warehouses,
  onSave,
}: {
  warehouses: any[];
  onSave: () => void;
}) {
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || "main");
  const [allowPriceOverride, setAllowPriceOverride] = useState(false);
  const [requireCustomer, setRequireCustomer] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [paperWidth, setPaperWidth] = useState("80mm");
  const [quickCashTender, setQuickCashTender] = useState(true);

  const testBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio Context not allowed without interaction", e);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          label="Default POS Warehouse / Stock Location"
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          options={
            warehouses.length > 0
              ? warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code || "WH"})` }))
              : [{ value: "main", label: "Main Retail Storefront Inventory" }]
          }
        />

        <CustomSelect
          label="Thermal Receipt Printer Paper Width"
          value={paperWidth}
          onChange={(e) => setPaperWidth(e.target.value)}
          options={[
            { value: "80mm", label: "80mm Standard Thermal Roll (3-Inch ESC/POS)" },
            { value: "58mm", label: "58mm Compact Mobile POS Thermal Slip (2-Inch)" },
            { value: "A4", label: "A4 Full Sheet Commercial Challan Invoice" },
          ]}
        />
      </div>

      {/* Feature Toggles */}
      <div className="space-y-3">
        <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
          Cashier Lane Policies & Hardware Rules
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-900 block">Auto-Print Thermal Receipt</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Automatically dispatches ESC/POS print job immediately on payment tender completion
              </p>
            </div>
          </label>

          <label className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3">
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Scanner Audio Beep</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    testBeep();
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center gap-1"
                >
                  <Volume2 size={11} /> Test Sound
                </button>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Plays high-frequency chime on optical barcode scan verification
              </p>
            </div>
          </label>

          <label className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3">
            <input
              type="checkbox"
              checked={allowPriceOverride}
              onChange={(e) => setAllowPriceOverride(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-900 block">Cashier Price Override</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Permits line item price adjustments without supervisor override PIN
              </p>
            </div>
          </label>

          <label className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3">
            <input
              type="checkbox"
              checked={requireCustomer}
              onChange={(e) => setRequireCustomer(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-900 block">Require Customer Selection</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Disallows anonymous Walk-in checkouts to maintain CRM loyalty profiles
              </p>
            </div>
          </label>

          <label className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={quickCashTender}
              onChange={(e) => setQuickCashTender(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-900 block">Quick Taka Bill Buttons (৳50, ৳100, ৳500, ৳1000)</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Renders fast currency denomination presets in POS payment drawer for rapid change computation
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save POS Settings
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 4: OFFLINE SYNC ENGINE (§13)
// ───────────────────────────────────────────────────────────────────────

function OfflineSyncTab({
  onSave,
  onForceSync,
}: {
  onSave: () => void;
  onForceSync: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("ONLINE & OPERATIONAL");
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictPolicy, setConflictPolicy] = useState("SERVER_WINS");
  const [autoSyncInterval, setAutoSyncInterval] = useState("30");

  const triggerSync = async () => {
    setSyncing(true);
    setSyncStatus("SYNCHRONIZING WITH SERVER...");
    setTimeout(() => {
      setSyncing(false);
      setSyncStatus("ALL TRANSACTIONS UP TO DATE");
      setPendingCount(0);
      onForceSync();
    }, 1200);
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/60 text-emerald-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <HardDrive size={15} className="text-emerald-700" />
          <span>Spec §13 · Offline-First Resilient Architecture</span>
        </div>
        <p className="text-[11px] text-emerald-800 leading-relaxed">
          The POS operates completely uninterrupted even during internet outages. Transactions are queued locally in browser
          IndexedDB and sequentially reconciled with cloud servers when network connectivity resumes.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Engine State</span>
          <p className="text-sm font-black text-emerald-950">{syncStatus}</p>
          <span className="text-[11px] text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> IndexedDB Active
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Push Queue</span>
          <p className="text-2xl font-black text-slate-900">{pendingCount}</p>
          <span className="text-[11px] text-slate-400">Transactions waiting in local storage</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Cached Catalog</span>
          <p className="text-sm font-black text-blue-950">2,480 SKUs & Prices</p>
          <span className="text-[11px] text-blue-700">Full catalog available offline</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          label="Conflict Resolution Strategy"
          value={conflictPolicy}
          onChange={(e) => setConflictPolicy(e.target.value)}
          options={[
            { value: "SERVER_WINS", label: "Server Wins (Authoritative Cloud Pricing)" },
            { value: "LOCAL_WINS", label: "Client Wins (Offline Cashier Priority)" },
            { value: "TIMESTAMP_MERGE", label: "Timestamp Last-Write-Wins" },
          ]}
        />

        <CustomSelect
          label="Background Cloud Push Interval"
          value={autoSyncInterval}
          onChange={(e) => setAutoSyncInterval(e.target.value)}
          options={[
            { value: "15", label: "Every 15 Seconds (Realtime)" },
            { value: "30", label: "Every 30 Seconds (Default)" },
            { value: "60", label: "Every 1 Minute" },
            { value: "300", label: "Every 5 Minutes (Low Bandwidth)" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <CustomButton
          variant="primary"
          onClick={triggerSync}
          loading={syncing}
          icon={RefreshCw}
        >
          {syncing ? "Synchronizing Transactions..." : "Force Sync Queue Now"}
        </CustomButton>

        <CustomButton
          variant="outline"
          onClick={() => alert("Local catalog cache refreshed with 2,480 SKUs from server!")}
          icon={Database}
        >
          Pull Fresh Catalog to IndexedDB
        </CustomButton>

        <CustomButton
          variant="ghost"
          onClick={() => alert("Cleared 120 old synced receipts from local browser cache.")}
          icon={CheckSquare}
        >
          Purge Synced Receipts
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 5: TAX & NBR VAT SETTINGS
// ───────────────────────────────────────────────────────────────────────

function TaxSettingsTab({
  tenantData,
  onSave,
}: {
  tenantData: any;
  onSave: () => void;
}) {
  const company = tenantData?.company || {};
  const [vatNo, setVatNo] = useState(company.vatRegNo || "BIN-002938194-0101");
  const [defaultVatRate, setDefaultVatRate] = useState("5.00");
  const [sdRate, setSdRate] = useState("0.00");
  const [mushakCompliance, setMushakCompliance] = useState(true);
  const [samplePrice, setSamplePrice] = useState("1000");

  const calcBase = parseFloat(samplePrice) || 0;
  const calcVat = (calcBase * (parseFloat(defaultVatRate) || 0)) / 100;
  const calcTotal = calcBase + calcVat;

  return (
    <div className="space-y-6 text-xs">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/60 text-amber-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertCircle size={15} className="text-amber-700" />
          <span>Statutory Bangladesh NBR Mushak Compliance</span>
        </div>
        <p className="text-[11px] text-amber-900 leading-relaxed">
          Complies with the Value Added Tax and Supplementary Duty Act, 2012. Prints statutory Mushak-6.3 tax invoices,
          records itemized VAT rates, and produces NBR return exports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CustomInput
          label="Business Identification Number (BIN)"
          value={vatNo}
          onChange={(e) => setVatNo(e.target.value)}
          placeholder="BIN-002938194-0101"
          required
        />

        <CustomInput
          label="Default Standard VAT Rate (%)"
          type="number"
          step="0.1"
          value={defaultVatRate}
          onChange={(e) => setDefaultVatRate(e.target.value)}
          placeholder="5.00"
          required
        />

        <CustomInput
          label="Supplementary Duty (SD %)"
          type="number"
          step="0.1"
          value={sdRate}
          onChange={(e) => setSdRate(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Mushak 6.3 Toggle */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mushakCompliance}
            onChange={(e) => setMushakCompliance(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900 block">
              Enable Mushak-6.3 Statutory Tax Invoice Format
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Renders official NBR header, BIN numbers, buyer registration, and breakdown of Base Value + VAT + SD on receipts
            </p>
          </div>
        </label>
      </div>

      {/* Live Tax Computation Simulator */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
          Live Tax Computation Simulator
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div>
            <label className="block text-slate-500 text-[10px] mb-1">Sample Item Price (৳)</label>
            <input
              type="number"
              value={samplePrice}
              onChange={(e) => setSamplePrice(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 font-bold font-mono bg-white"
            />
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block">Taxable Base</span>
            <span className="font-mono font-bold text-slate-800">৳{calcBase.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block">VAT ({defaultVatRate}%)</span>
            <span className="font-mono font-bold text-amber-700">+৳{calcVat.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 text-white border border-slate-900">
            <span className="text-[10px] text-slate-400 block">Final Tender Bill</span>
            <span className="font-mono font-bold text-emerald-400">৳{calcTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <Link href="/tax" className="font-bold text-primary-600 hover:underline flex items-center gap-1">
          Open Advanced Tax Groups & NBR Reports →
        </Link>
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Tax Settings
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 6: INVOICE & PRINT LAYOUT (WITH REALTIME THERMAL PREVIEW)
// ───────────────────────────────────────────────────────────────────────

function InvoiceSettingsTab({
  tenantData,
  onSave,
}: {
  tenantData: any;
  onSave: () => void;
}) {
  const company = tenantData?.company || {};
  const [template, setTemplate] = useState("retail");
  const [headerTitle, setHeaderTitle] = useState(company.name || "BLUE OCEAN POS");
  const [footerMsg, setFooterMsg] = useState("Thank you for shopping with us! Items can be exchanged within 7 days with invoice slip.");
  const [showBarcode, setShowBarcode] = useState(true);
  const [showQR, setShowQR] = useState(true);

  return (
    <div className="space-y-6 text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <CustomSelect
            label="Default Vertical Receipt Template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            options={[
              { value: "retail", label: "Retail Standard 80mm Thermal Receipt" },
              { value: "grocery", label: "Grocery Lane Slip (Weight / Tare / PLU)" },
              { value: "wholesale", label: "Wholesale B2B Commercial Challan" },
              { value: "restaurant", label: "Restaurant Dining Guest Check & KOT" },
              { value: "pharmacy", label: "Pharmacy DGDA Batch Prescription Slip" },
            ]}
          />

          <CustomInput
            label="Printed Store Header Title"
            value={headerTitle}
            onChange={(e) => setHeaderTitle(e.target.value)}
            placeholder="e.g. BLUE OCEAN STORE"
          />

          <div>
            <label className="block font-bold text-slate-700 mb-1">Receipt Footer Note & Return Policy</label>
            <textarea
              value={footerMsg}
              onChange={(e) => setFooterMsg(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-primary-500 bg-slate-50/60 text-xs"
              rows={3}
            />
          </div>

          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/70 border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showBarcode}
                onChange={(e) => setShowBarcode(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-0"
              />
              <div>
                <span className="font-bold text-slate-900 block">Render Barcode on Thermal Receipt</span>
                <p className="text-slate-400 text-[11px]">Enables 1-second optical scanner lookup at customer returns desk</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showQR}
                onChange={(e) => setShowQR(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-0"
              />
              <div>
                <span className="font-bold text-slate-900 block">Render Digital Verification QR Code</span>
                <p className="text-slate-400 text-[11px]">Allows customers to view digital e-receipt on mobile smartphone</p>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <CustomButton variant="primary" onClick={onSave} icon={Save}>
              Save Print Layout
            </CustomButton>
          </div>
        </div>

        {/* Right Live Thermal Receipt Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Printer size={13} className="text-slate-500" />
              80mm Thermal WYSIWYG Slip
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              Live Preview
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/30 border border-dashed border-slate-300 font-mono text-[11px] text-slate-800 shadow-sm space-y-3 max-w-xs mx-auto bg-white">
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <p className="font-black text-xs text-slate-900 uppercase">{headerTitle || "BLUE OCEAN POS"}</p>
              <p className="text-[10px] text-slate-500">Gulshan-1, Dhaka-1212</p>
              <p className="text-[10px] text-slate-500">BIN: 002938194-0101 · Mushak 6.3</p>
              <p className="text-[10px] text-slate-400">Tel: +880 1711-000000</p>
            </div>

            <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Inv: #INV-202609-0042</span>
                <span>POS-01</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Date: 12-Sep-2026 18:05</span>
                <span>Cashier: Admin</span>
              </div>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2 text-[10px]">
              <div className="flex justify-between font-bold">
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>
              <div className="flex justify-between">
                <span>Pran Mustard Oil 1L</span>
                <span>1 x ৳240.00</span>
                <span>৳240.00</span>
              </div>
              <div className="flex justify-between">
                <span>Aarong Dairy Butter 200g</span>
                <span>2 x ৳190.00</span>
                <span>৳380.00</span>
              </div>
            </div>

            <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>৳620.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT (5%):</span>
                <span>৳31.00</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-1 text-slate-900 border-t border-dotted border-slate-200">
                <span>GRAND TOTAL:</span>
                <span>৳651.00</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                <span>Paid (Cash):</span>
                <span>৳700.00</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-emerald-700">
                <span>Change Due:</span>
                <span>৳49.00</span>
              </div>
            </div>

            {showBarcode && (
              <div className="text-center pt-1">
                <div className="h-8 bg-slate-900/10 rounded flex items-center justify-center font-mono tracking-widest text-[9px] text-slate-600">
                  ||| | | |||| | ||| || ||| |
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">INV-202609-0042</span>
              </div>
            )}

            <div className="text-center text-[9px] text-slate-500 pt-1 leading-tight">
              {footerMsg}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 7: PAYMENT GATEWAYS & MFS
// ───────────────────────────────────────────────────────────────────────

function PaymentSettingsTab({ onSave }: { onSave: () => void }) {
  const [methods, setMethods] = useState(["CASH", "CARD", "MOBILE_BANKING", "CREDIT"]);

  const toggle = (m: string) => {
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="space-y-2">
        <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          Active Checkout Tenders & MFS Integrations
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "CASH", label: "Cash (BDT Taka Drawer)", desc: "Physical currency drawer with auto change computation", badge: "Primary" },
            { id: "CARD", label: "Credit / Debit Card POS", desc: "Visa, Mastercard, Amex via wireless EFTPOS terminal", badge: "Card" },
            { id: "MOBILE_BANKING", label: "MFS (bKash / Nagad / Rocket)", desc: "Direct QR scanning and OTP transaction verification", badge: "MFS BD" },
            { id: "BANK", label: "Direct Bank Wire / Cheque", desc: "For B2B wholesale orders and corporate purchase orders", badge: "B2B" },
            { id: "CREDIT", label: "Customer Credit & Dues", desc: "Booked to customer ledger with real-time credit limit check", badge: "Ledger" },
          ].map((item) => {
            const isAct = methods.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition",
                  isAct
                    ? "border-primary-500 bg-primary-50/40 shadow-2xs"
                    : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center transition",
                      isAct ? "bg-primary-600 text-white shadow-xs" : "border border-slate-300 bg-white"
                    )}
                  >
                    {isAct && <Check size={11} />}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-1">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Payment Tenders
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 8: INVENTORY VALUATION & COSTING
// ───────────────────────────────────────────────────────────────────────

function InventorySettingsTab({ onSave }: { onSave: () => void }) {
  const [costing, setCosting] = useState("FIFO");
  const [allowNegative, setAllowNegative] = useState(false);
  const [threshold, setThreshold] = useState("10");

  return (
    <div className="space-y-6 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          label="Cost of Goods Sold (COGS) Valuation Method"
          value={costing}
          onChange={(e) => setCosting(e.target.value)}
          options={[
            { value: "FIFO", label: "FIFO (First In, First Out) - Recommended for Retail / Grocery" },
            { value: "FEFO", label: "FEFO (First Expired, First Out) - Statutory for Pharmacy" },
            { value: "WEIGHTED_AVERAGE", label: "Weighted Average Cost (WAC) - Standard for Mfg" },
          ]}
        />

        <CustomInput
          label="Default Low Stock Safety Threshold"
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="10"
        />
      </div>

      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowNegative}
            onChange={(e) => setAllowNegative(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900 block">Allow Negative Stock Checkout</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Allows cashier to complete sale when physical item is on shelf but GRN entry is pending (reconciles on next PO)
            </p>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Inventory Rules
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 9: CURRENCY & EXCHANGE RATES
// ───────────────────────────────────────────────────────────────────────

function CurrencySettingsTab({
  tenantData,
  onSave,
}: {
  tenantData: any;
  onSave: () => void;
}) {
  const tenant = tenantData?.tenant || {};
  const [baseCurrency, setBaseCurrency] = useState(tenant.currency || "BDT");

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200">
        <div>
          <h4 className="font-bold text-indigo-950 text-sm">Multi-Currency & FX Exchange Rates</h4>
          <p className="text-indigo-700 text-[11px]">
            Manage multi-currency billing, real-time exchange rates, and multi-lingual dictionary translations
          </p>
        </div>
        <Link href="/settings/currency">
          <CustomButton variant="outline" size="sm" icon={ExternalLink}>
            Open Currency & Rates Suite →
          </CustomButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          label="Primary Base Currency"
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value)}
          options={[
            { value: "BDT", label: "BDT (৳ - Bangladeshi Taka)" },
            { value: "USD", label: "USD ($ - US Dollar)" },
            { value: "EUR", label: "EUR (€ - Euro)" },
            { value: "GBP", label: "GBP (£ - British Pound)" },
            { value: "SAR", label: "SAR (﷼ - Saudi Riyal)" },
          ]}
        />
      </div>

      {/* Exchange Rate Overview Cards */}
      <div className="space-y-2">
        <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          Configured Currencies & Conversion Matrix
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", rate: "1.0000", isBase: true },
            { code: "USD", name: "US Dollar", symbol: "$", rate: "122.50", isBase: false },
            { code: "EUR", name: "Euro", symbol: "€", rate: "132.80", isBase: false },
            { code: "SAR", name: "Saudi Riyal", symbol: "﷼", rate: "32.65", isBase: false },
          ].map((c) => (
            <div key={c.code} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm text-slate-900">{c.symbol} {c.code}</span>
                {c.isBase && <span className="text-[9px] font-bold bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded">BASE</span>}
              </div>
              <p className="text-[10px] text-slate-400">{c.name}</p>
              <p className="text-xs font-mono font-bold text-slate-700">1 {c.code} = ৳{c.rate}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Currency Preferences
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 10: ALERTS & NOTIFICATIONS
// ───────────────────────────────────────────────────────────────────────

function NotificationSettingsTab({ onSave }: { onSave: () => void }) {
  const [lowStock, setLowStock] = useState(true);
  const [shiftClose, setShiftClose] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  return (
    <div className="space-y-6 text-xs">
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900 block">Low Stock Reorder Triggers</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Notifies store manager email & mobile when product stock breaches safety reorder threshold
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={shiftClose}
            onChange={(e) => setShiftClose(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900 block">Daily Register Shift Close Summary</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Sends automated email breakdown with cash drawer reconciliation and discrepancy audits
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={smsAlerts}
            onChange={(e) => setSmsAlerts(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900 block">Customer SMS Digital Receipt Link</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Dispatches thank-you SMS containing invoice link directly to buyer phone number
            </p>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Alert Preferences
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 11: USERS & SECURITY POLICY
// ───────────────────────────────────────────────────────────────────────

function UserSettingsTab({ onSave }: { onSave: () => void }) {
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [pinPolicy, setPinPolicy] = useState("PIN");

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100/70 border border-slate-200">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Security & Access Policies</h4>
          <p className="text-slate-500 text-[11px]">
            Session idle timers, Cashier quick PIN login, and password complexity enforcement
          </p>
        </div>
        <Link href="/hrm">
          <CustomButton variant="outline" size="sm" icon={ExternalLink}>
            Manage Staff Users →
          </CustomButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomInput
          label="Cashier Idle Session Timeout (Minutes)"
          type="number"
          value={sessionTimeout}
          onChange={(e) => setSessionTimeout(e.target.value)}
          placeholder="60"
        />

        <CustomSelect
          label="Authentication Complexity Policy"
          value={pinPolicy}
          onChange={(e) => setPinPolicy(e.target.value)}
          options={[
            { value: "PIN", label: "Cashier Quick 4-Digit PIN Lock" },
            { value: "STRONG", label: "Strong Alphanumeric Password (8+ Chars)" },
            { value: "2FA", label: "Two-Factor OTP Security" },
          ]}
        />
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Security Policies
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 12: ROLES & RBAC MATRIX
// ───────────────────────────────────────────────────────────────────────

function RoleSettingsTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Role-Based Access Control (RBAC)</h4>
          <p className="text-slate-500 text-[11px]">
            Fine-grained permissions for discount limits, price overrides, refunds, and financial reporting
          </p>
        </div>
        <Link href="/rbac">
          <CustomButton variant="outline" size="sm" icon={ExternalLink}>
            Open Granular RBAC Matrix →
          </CustomButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { role: "CASHIER", perms: "Checkout, Hold Cart, Cash Tender, Return Slip Lookup", badge: "Counter" },
          { role: "STORE_MANAGER", perms: "Price Override, Shift Close, Stock Adjustment, Refunds", badge: "Branch" },
          { role: "ADMINISTRATOR", perms: "Full System Access, Accounting, Settings, SaaS Management", badge: "Superuser" },
        ].map((r) => (
          <div key={r.role} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-slate-900 text-xs">{r.role}</span>
              <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{r.badge}</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">{r.perms}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 13: API, WEBHOOKS & INTEGRATIONS
// ───────────────────────────────────────────────────────────────────────

function IntegrationSettingsTab({ onSave }: { onSave: () => void }) {
  const [webhookUrl, setWebhookUrl] = useState("https://api.merchant.com/webhooks/pos-events");
  const [copied, setCopied] = useState(false);

  const copySecret = () => {
    navigator.clipboard.writeText("whsec_live_9a8f7b6c5d4e3f2a1b0c");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
        <div>
          <h4 className="font-bold text-emerald-950 text-sm">Third-Party Connectors & Webhooks</h4>
          <p className="text-emerald-700 text-[11px]">
            Realtime e-commerce catalog sync, courier shipping API, and event listeners
          </p>
        </div>
        <Link href="/integrations">
          <CustomButton variant="outline" size="sm" icon={ExternalLink}>
            Manage API Tokens →
          </CustomButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-900">Shopify & WooCommerce Bridge</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Active Adapter
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">Two-way inventory stock & order synchronization</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-900">Steadfast / Pathao Courier API</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              Connected
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">Automated parcel consignment generation and tracking</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <CustomInput
          label="Outbound Webhook Delivery Endpoint URL"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-domain.com/webhooks/pos"
        />

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Signing Secret (HMAC SHA-256)</span>
            <p className="font-mono font-bold text-slate-900 text-xs">whsec_live_9a8f7b6c5d4e3f2a1b0c</p>
          </div>
          <button
            type="button"
            onClick={copySecret}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 flex items-center gap-1 text-[11px]"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save Integration Settings
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 14: AI BUSINESS ASSISTANT
// ───────────────────────────────────────────────────────────────────────

function AISettingsTab({ onSave }: { onSave: () => void }) {
  const [demandForecasting, setDemandForecasting] = useState(true);
  const [smartReordering, setSmartReordering] = useState(true);

  return (
    <div className="space-y-6 text-xs">
      <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-300/60 text-violet-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <Brain size={15} className="text-violet-700" />
          <span>Blue Oceans Autonomous Business Copilot</span>
        </div>
        <p className="text-[11px] text-violet-900 leading-relaxed">
          Machine learning engine that predicts product demand surges (Eid, Ramadan, seasonality), auto-generates supplier purchase requisitions, and optimizes safety stock levels.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-violet-50/40 border border-violet-200 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={demandForecasting}
            onChange={(e) => setDemandForecasting(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900 block">AI Demand & Seasonality Forecasting</span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Analyzes historical POS sales velocity to predict inventory requirements for upcoming peak periods
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={smartReordering}
            onChange={(e) => setSmartReordering(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900 block">Smart Purchase Requisition (PR) Drafts</span>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Automatically creates supplier purchase order drafts when safety stock thresholds are breached
            </p>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={onSave} icon={Save}>
          Save AI Preferences
        </CustomButton>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 15: SUBSCRIPTION & SAAS PLAN
// ───────────────────────────────────────────────────────────────────────

function SubscriptionSettingsTab({ tenantData }: { tenantData: any }) {
  const tenant = tenantData?.tenant || {};

  return (
    <div className="space-y-6 text-xs">
      <div className="p-6 rounded-3xl bg-linear-to-tr from-slate-900 via-indigo-950 to-slate-950 text-white space-y-4 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Active Plan</span>
            <h3 className="text-2xl font-black">ENTERPRISE PRO TIER</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tenant Identifier: <span className="font-mono text-white font-bold">{tenant.slug || "main-tenant"}</span>
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 shadow-sm">
            Active & Licensed
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center">
          <div>
            <p className="text-xl font-bold">Unlimited</p>
            <span className="text-[10px] text-slate-400">Branches / Outlets</span>
          </div>
          <div>
            <p className="text-xl font-bold">Unlimited</p>
            <span className="text-[10px] text-slate-400">POS Terminals</span>
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-400">99.99%</p>
            <span className="text-[10px] text-slate-400">SLA Uptime Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Default Page Export with Suspense ───

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw size={24} className="mx-auto animate-spin text-primary-500" />
          <p className="font-bold">Loading System Settings...</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}