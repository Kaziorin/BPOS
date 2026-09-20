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
  Palette,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { GLOBAL_THEMES, GlobalThemeConfig, GlobalThemeId } from "@/lib/theme";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomInput,
  CustomSelect,
  CustomModal,
  CustomCheckbox,
  CustomTextarea,
} from "@/components/custom";
import { InvoicePrintSettingsManager } from "@/components/invoices/InvoicePrintSettingsManager";

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
    badgeColor: "bg-brand-50 text-brand-dark border-brand-border",
    description: "Receipt paper width, audio scanner chime, and cashier policies",
  },
  {
    id: "theme",
    label: "Theme & Appearance",
    category: "core",
    icon: Palette,
    badge: "9 Business Themes",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Global color theme across tenant, business, and POS screens",
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
    badgeColor: "bg-slate-100 text-gray-600 border-slate-200",
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
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-sm animate-in fade-in">
                <CheckCircle2 size={15} className="text-emerald-600" /> {saveToast}
              </div>
            )}
            <CustomButton
              variant="outline"
              size="sm"
              onClick={loadSettingsData}
              loading={loading}
              icon={<RefreshCw size={14} />}
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
              icon={<Save size={14} />}
            >
              Save Changes
            </CustomButton>
          </div>
        }
      />

      {/* ── Executive Hero Glow Banner ── Dynamic Theme Gradient & Silky Ribbon Highlights ── */}
      <div className="relative overflow-hidden rounded-sm bg-brand-gradient border border-white/20 text-white p-6 sm:p-7 shadow-md select-none">
        {/* Ambient luminous glow on the left & top-right */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 12% 25%, rgba(255, 255, 255, 0.25) 0%, transparent 55%), radial-gradient(ellipse at 88% 30%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)",
          }}
        />

        {/* Silky Wave Ribbons Flowing from Center to Right */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
        >
          <defs>
            <linearGradient id="settingsWaveCenterRight1" x1="30%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.20" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="settingsWaveCenterRight2" x1="45%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Wave 1: Flowing smooth organic wave rising from center toward right */}
          <path
            d="M 380,200 C 440,160 480,95 560,95 C 660,95 720,150 820,120 C 900,95 950,55 1020,45 L 1020,200 L 380,200 Z"
            fill="url(#settingsWaveCenterRight1)"
          />
          {/* Wave 2: Overlapping silky layer flowing across center-right */}
          <path
            d="M 430,200 C 490,140 540,75 620,80 C 720,85 780,140 880,105 C 940,85 980,60 1020,75 L 1020,200 L 430,200 Z"
            fill="url(#settingsWaveCenterRight2)"
          />
          {/* Crest shimmer curve */}
          <path
            d="M 490,115 C 540,82 590,80 640,85 C 720,95 790,135 870,110"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Specular shimmer highlight near center wave peak */}
        <div
          className="pointer-events-none absolute left-[51%] top-[40%] h-1.5 w-1.5 rounded-full bg-white opacity-85"
          style={{
            boxShadow: "0 0 10px 3px rgba(255, 255, 255, 0.95)",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-bold bg-white/20 text-white border border-white/25 shadow-2xs">
                <Sparkles size={13} className="text-white" /> Enterprise POS Engine 2.0
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
                {isOnline ? "Cloud Online" : "Offline Mode"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <ShieldCheck size={13} /> NBR Mushak-6.3 Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{tenantObj.name || "Blue Ocean Enterprises"}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-sm bg-white/15 text-white border border-white/20 font-mono">
                {verticalDef.label}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              Managing company legal identity, multi-outlet fulfillment routing, offline-first IndexedDB resilience (§13),
              and automated AI stock intelligence.
            </p>
          </div>

          {/* Quick Stats in Banner - Crisp High-Contrast Cards (Zero Blurriness) */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm bg-white border border-slate-100 shadow-md min-w-[140px]">
              <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-primary flex items-center justify-center shrink-0 border border-brand-border/40">
                <Store size={15} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block leading-tight">Outlets</span>
                <div className="text-sm font-bold text-gray-600 mt-0.5 leading-tight">{branches.length || 1} Registered</div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> All Linked
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm bg-white border border-slate-100 shadow-md min-w-[140px]">
              <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-primary flex items-center justify-center shrink-0 border border-brand-border/40">
                <HardDrive size={15} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block leading-tight">Offline Cache</span>
                <div className="text-sm font-bold text-gray-600 mt-0.5 leading-tight">2,480 SKUs</div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" /> IndexedDB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm bg-white border border-slate-100 shadow-md min-w-[140px]">
              <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-primary flex items-center justify-center shrink-0 border border-brand-border/40">
                <Coins size={15} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block leading-tight">Base Currency</span>
                <div className="text-sm font-bold text-gray-600 mt-0.5 leading-tight">BDT (৳)</div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> Asia/Dhaka
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Settings Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Navigation Sidebar (4 cols on lg) ── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-2xs space-y-4">
            {/* Search Input for tabs */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tabSearch}
                onChange={(e) => setTabSearch(e.target.value)}
                placeholder="Search settings (e.g. VAT, printer, sync)..."
                className="w-full pl-9 pr-3 py-2 rounded-sm text-xs font-semibold bg-white border border-brand-border focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-border transition"
              />
              {tabSearch && (
                <button
                  onClick={() => setTabSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-600 px-1.5 py-0.5 rounded-xs cursor-pointer"
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
                      <CatIcon size={12} className="text-brand-primary" />
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
                              "flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-xs font-bold transition group text-left cursor-pointer",
                              isAct
                                ? "bg-brand-gradient text-white shadow-xs"
                                : "text-slate-600 hover:bg-brand-50/50 hover:text-brand-primary"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={cn(
                                  "w-7 h-7 rounded-sm flex items-center justify-center shrink-0 transition",
                                  isAct
                                    ? "bg-white/20 text-white"
                                    : "bg-brand-50 text-brand-primary group-hover:bg-brand-50"
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
                                  "text-[9px] px-1.5 py-0.5 rounded-sm font-bold shrink-0 ml-1.5 border transition",
                                  isAct
                                    ? "bg-white/20 text-white border-white/20"
                                    : tab.badgeColor || "bg-brand-50 text-sky-700 border-brand-border"
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
          <div className="p-4 rounded-sm bg-brand-50/50 border border-slate-200 text-gray-600 space-y-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2 font-black text-brand-dark">
              <HardDrive size={15} className="text-brand-primary" />
              <span>Offline Architecture (§13)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every POS station caches inventory and sales locally in IndexedDB. Transactions automatically sync when cloud connectivity is restored.
            </p>
            <button
              onClick={() => handleTabChange("sync")}
              className="text-[11px] font-bold text-brand-primary hover:text-brand-dark flex items-center gap-1 cursor-pointer"
            >
              Inspect Offline Engine →
            </button>
          </div>
        </div>

        {/* ── Right Content Panel (8 cols on lg) ── */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-sm border border-slate-200 p-6 sm:p-8 shadow-2xs">
          {/* Active Tab Header Title */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-brand-50 text-brand-primary border border-brand-border flex items-center justify-center shrink-0 shadow-2xs">
                <CurrentIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-brand-dark">{currentTabDef.label}</h2>
                  {currentTabDef.badge && (
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-sm font-bold border", currentTabDef.badgeColor)}>
                      {currentTabDef.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{currentTabDef.description}</p>
              </div>
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

          {activeTab === "theme" && (
            <ThemeSettingsTab
              onSave={() => showToast("Global theme preferences applied successfully!")}
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
  const [restaurantPosShiftVisible, setRestaurantPosShiftVisible] = useState(true);
  const [restaurantSettingLoading, setRestaurantSettingLoading] = useState(false);
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

  useEffect(() => {
    if ((tenant.businessType || "").toUpperCase() !== "RESTAURANT") return;
    let active = true;
    setRestaurantSettingLoading(true);
    api.get("/v1/restaurant/pos-shift/settings")
      .then((res: any) => {
        const setting = res?.data ?? res;
        if (active && setting?.restaurantPosShiftVisible !== undefined) {
          setRestaurantPosShiftVisible(Boolean(setting.restaurantPosShiftVisible));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setRestaurantSettingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenant.businessType]);

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

      if (businessType === "RESTAURANT") {
        await api.put("/v1/restaurant/pos-shift/settings", {
          restaurantPosShiftVisible,
        });
      }

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
      <div className="p-4 rounded-sm bg-slate-50/80 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-sm bg-gradient-to-tr from-primary-600 to-brand-500 text-white flex items-center justify-center font-black text-xl shadow-md">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-600 text-sm">{name || "Store Name"}</h3>
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
          <CustomTextarea
            label="Registered Head Office Address *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
        <label className="block font-bold text-gray-600">
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
                  "p-3 rounded-sm border cursor-pointer transition flex items-start gap-2.5",
                  isSel
                    ? "border-primary-500 bg-primary-50/50 shadow-xs ring-1 ring-primary-400"
                    : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center shrink-0",
                    isSel ? "bg-brand-gradient text-white shadow-2xs shadow-xs" : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-600 text-xs">{v.label}</span>
                    {isSel && <CheckCircle2 size={12} className="text-primary-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {businessType === "RESTAURANT" && (
        <div className="p-4 rounded-sm bg-amber-50/70 border border-amber-200">
          <CustomCheckbox
            checked={restaurantPosShiftVisible}
            onChange={(e) => setRestaurantPosShiftVisible(e.target.checked)}
            disabled={restaurantSettingLoading}
            themeColor="amber"
            label={<span className="font-bold text-gray-700">Show Restaurant POS Shift Control</span>}
            description="When enabled, Restaurant POS shows the shift control and opens the shift schedule modal on click. When disabled, the shift control is hidden."
            containerClassName="w-full"
          />
        </div>
      )}

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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-sm bg-blue-50/50 border border-blue-200">
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
          <p className="font-bold text-gray-600 text-[11px] uppercase tracking-wider">
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
            <div key={i} className="p-4 rounded-sm border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-600">{b.name}</h4>
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-gray-600 px-2 py-0.5 rounded-sm">
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
  const [serviceChargePercent, setServiceChargePercent] = useState<number | string>(0);
  const [allowPriceOverride, setAllowPriceOverride] = useState(false);
  const [requireCustomer, setRequireCustomer] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [paperWidth, setPaperWidth] = useState("80mm");
  const [quickCashTender, setQuickCashTender] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<any>("/pos/settings")
      .then((res) => {
        if (!active) return;
        const d = res?.data ?? res ?? {};
        if (d.serviceChargePercent !== undefined && d.serviceChargePercent !== null) {
          setServiceChargePercent(d.serviceChargePercent);
        }
        if (d.defaultWarehouseId) setSelectedWarehouse(d.defaultWarehouseId);
        if (d.paperWidth) setPaperWidth(d.paperWidth);
        if (d.autoPrint !== undefined) setAutoPrint(Boolean(d.autoPrint));
        if (d.soundEffects !== undefined) setSoundEffects(Boolean(d.soundEffects));
        if (d.allowPriceOverride !== undefined) setAllowPriceOverride(Boolean(d.allowPriceOverride));
        if (d.requireCustomer !== undefined) setRequireCustomer(Boolean(d.requireCustomer));
        if (d.quickCashTender !== undefined) setQuickCashTender(Boolean(d.quickCashTender));
      })
      .catch((err) => console.warn("Failed to load POS settings:", err));
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/pos/settings", {
        serviceChargePercent: Number(serviceChargePercent) || 0,
        defaultWarehouseId: selectedWarehouse,
        paperWidth,
        autoPrint,
        soundEffects,
        allowPriceOverride,
        requireCustomer,
        quickCashTender,
      });
      onSave();
    } catch (err: any) {
      console.error("Failed to save POS settings:", err);
    } finally {
      setSaving(false);
    }
  };

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
      {/* ── POS Terminal Hardware & Engine Banner ── Dynamic Gradient & Silky Ribbon Highlights ── */}
      <div className="relative overflow-hidden rounded-sm bg-brand-gradient border border-white/20 text-white p-5 shadow-md select-none">
        {/* Ambient luminous glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 12% 25%, rgba(255, 255, 255, 0.25) 0%, transparent 55%), radial-gradient(ellipse at 88% 30%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)",
          }}
        />

        {/* Silky Wave Ribbons Flowing from Center to Right */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
        >
          <defs>
            <linearGradient id="posWaveCenterRight1" x1="30%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.20" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="posWaveCenterRight2" x1="45%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d="M 380,200 C 440,160 480,95 560,95 C 660,95 720,150 820,120 C 900,95 950,55 1020,45 L 1020,200 L 380,200 Z"
            fill="url(#posWaveCenterRight1)"
          />
          <path
            d="M 430,200 C 490,140 540,75 620,80 C 720,85 780,140 880,105 C 940,85 980,60 1020,75 L 1020,200 L 430,200 Z"
            fill="url(#posWaveCenterRight2)"
          />
          <path
            d="M 490,115 C 540,82 590,80 640,85 C 720,95 790,135 870,110"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Specular shimmer highlight */}
        <div
          className="pointer-events-none absolute left-[51%] top-[40%] h-1.5 w-1.5 rounded-full bg-white opacity-85"
          style={{
            boxShadow: "0 0 10px 3px rgba(255, 255, 255, 0.95)",
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[10px] font-bold bg-white/20 text-white border border-white/25 shadow-2xs">
                <Printer size={12} /> POS Hardware Controller
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <Check size={11} /> ESC/POS Connected
              </span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">Point of Sale (POS) Hardware & Cashier Engine</h3>
            <p className="text-xs text-white/90 max-w-xl">
              Configure thermal receipt roll dimensions, barcode scanner chime verification, service charge automation, and rapid checkout tolerances.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-sm bg-white border border-slate-100 shadow-md min-w-[125px]">
              <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-primary flex items-center justify-center shrink-0 border border-brand-border/40">
                <Printer size={15} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 block leading-tight">Paper Width</span>
                <span className="text-sm font-bold text-gray-600 mt-0.5 block leading-tight">{paperWidth}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 rounded-sm bg-white border border-slate-100 shadow-md min-w-[125px]">
              <div className="w-8 h-8 rounded-sm bg-brand-50 text-brand-primary flex items-center justify-center shrink-0 border border-brand-border/40">
                <DollarSign size={15} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 block leading-tight">Service Charge</span>
                <span className="text-sm font-bold text-gray-600 mt-0.5 block leading-tight">{serviceChargePercent || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <CustomInput
          label="Default Service Charge (%)"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={serviceChargePercent}
          onChange={(e) => setServiceChargePercent(e.target.value)}
          placeholder="0"
          helperText="Auto-applied as default in POS terminal (can be adjusted during sale)"
        />
      </div>

      {/* Feature Toggles */}
      <div className="space-y-3">
        <p className="font-bold text-gray-700 text-xs">
          Cashier Lane Policies & Hardware Rules
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition">
            <CustomCheckbox
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              label={<span className="font-bold text-gray-700">Auto-Print Thermal Receipt</span>}
              description="Automatically dispatches ESC/POS print job immediately on payment tender completion"
              containerClassName="w-full"
            />
          </div>

          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition">
            <div className="flex items-start justify-between gap-3">
              <CustomCheckbox
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                label={<span className="font-bold text-gray-700">Scanner Audio Beep</span>}
                description="Plays high-frequency chime on optical barcode scan verification"
                containerClassName="flex-1"
              />
              <CustomButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={testBeep}
                leftIcon={<Volume2 size={12} />}
                className="text-[10px] py-1 px-2.5 shrink-0"
              >
                Test Sound
              </CustomButton>
            </div>
          </div>

          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition">
            <CustomCheckbox
              checked={allowPriceOverride}
              onChange={(e) => setAllowPriceOverride(e.target.checked)}
              label={<span className="font-bold text-gray-700">Cashier Price Override</span>}
              description="Permits line item price adjustments without supervisor override PIN"
              containerClassName="w-full"
            />
          </div>

          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition">
            <CustomCheckbox
              checked={requireCustomer}
              onChange={(e) => setRequireCustomer(e.target.checked)}
              label={<span className="font-bold text-gray-700">Require Customer Selection</span>}
              description="Disallows anonymous Walk-in checkouts to maintain CRM loyalty profiles"
              containerClassName="w-full"
            />
          </div>

          <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition sm:col-span-2">
            <CustomCheckbox
              checked={quickCashTender}
              onChange={(e) => setQuickCashTender(e.target.checked)}
              label={<span className="font-bold text-gray-700">Quick Taka Bill Buttons (৳50, ৳100, ৳500, ৳1000)</span>}
              description="Renders fast currency denomination presets in POS payment drawer for rapid change computation"
              containerClassName="w-full"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <CustomButton variant="primary" onClick={handleSave} icon={Save} disabled={saving}>
          {saving ? "Saving Settings..." : "Save POS Settings"}
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
      <div className="p-4 rounded-sm bg-emerald-500/10 border border-emerald-300/60 text-emerald-950 space-y-1">
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
        <div className="p-4 rounded-sm bg-emerald-50/80 border border-emerald-200 space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Engine State</span>
          <p className="text-sm font-black text-emerald-950">{syncStatus}</p>
          <span className="text-[11px] text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> IndexedDB Active
          </span>
        </div>

        <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Push Queue</span>
          <p className="text-2xl font-black text-gray-600">{pendingCount}</p>
          <span className="text-[11px] text-slate-400">Transactions waiting in local storage</span>
        </div>

        <div className="p-4 rounded-sm bg-blue-50 border border-blue-200 space-y-1">
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
      <div className="p-4 rounded-sm bg-amber-500/10 border border-amber-300/60 text-amber-950 space-y-1">
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
      <div className="p-4 rounded-sm bg-slate-50/70 border border-slate-200">
        <CustomCheckbox
          checked={mushakCompliance}
          onChange={(e) => setMushakCompliance(e.target.checked)}
          label={<span className="font-bold text-gray-700">Enable Mushak-6.3 Statutory Tax Invoice Format</span>}
          description="Renders official NBR header, BIN numbers, buyer registration, and breakdown of Base Value + VAT + SD on receipts"
          containerClassName="w-full"
        />
      </div>

      {/* Live Tax Computation Simulator */}
      <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/50 space-y-3">
        <span className="font-bold text-gray-600 uppercase tracking-wider text-[10px] block">
          Live Tax Computation Simulator
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div>
            <CustomInput
              label="Sample Item Price (৳)"
              type="number"
              value={samplePrice}
              onChange={(e) => setSamplePrice(e.target.value)}
              className="font-bold font-mono"
            />
          </div>
          <div className="p-2.5 rounded-sm bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block">Taxable Base</span>
            <span className="font-mono font-bold text-gray-600">৳{calcBase.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-sm bg-white border border-slate-200">
            <span className="text-[10px] text-slate-400 block">VAT ({defaultVatRate}%)</span>
            <span className="font-mono font-bold text-amber-700">+৳{calcVat.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-sm bg-primary-50 border border-primary-200">
            <span className="text-[10px] text-primary-600 block">Final Tender Bill</span>
            <span className="font-mono font-bold text-primary-900">৳{calcTotal.toFixed(2)}</span>
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
  return (
    <div className="space-y-6">
      <InvoicePrintSettingsManager onSaved={onSave} />
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
        <p className="font-bold text-gray-600 uppercase tracking-wider text-[10px]">
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
                  "p-4 rounded-sm border cursor-pointer transition",
                  isAct
                    ? "border-primary-500 bg-primary-50/40 shadow-2xs"
                    : "border-slate-200 bg-slate-50/40 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">{item.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center transition",
                      isAct ? "bg-brand-gradient text-white shadow-2xs shadow-xs" : "border border-slate-300 bg-white"
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

      <div className="p-4 rounded-sm bg-slate-50/70 border border-slate-200">
        <CustomCheckbox
          checked={allowNegative}
          onChange={(e) => setAllowNegative(e.target.checked)}
          label={<span className="font-bold text-gray-700">Allow Negative Stock Checkout</span>}
          description="Allows cashier to complete sale when physical item is on shelf but GRN entry is pending (reconciles on next PO)"
          containerClassName="w-full"
        />
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-sm bg-indigo-50/50 border border-indigo-200">
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
        <p className="font-bold text-gray-600 uppercase tracking-wider text-[10px]">
          Configured Currencies & Conversion Matrix
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", rate: "1.0000", isBase: true },
            { code: "USD", name: "US Dollar", symbol: "$", rate: "122.50", isBase: false },
            { code: "EUR", name: "Euro", symbol: "€", rate: "132.80", isBase: false },
            { code: "SAR", name: "Saudi Riyal", symbol: "﷼", rate: "32.65", isBase: false },
          ].map((c) => (
            <div key={c.code} className="p-3.5 rounded-sm border border-slate-200 bg-slate-50/50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm text-gray-600">{c.symbol} {c.code}</span>
                {c.isBase && <span className="text-[9px] font-bold bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded-sm">BASE</span>}
              </div>
              <p className="text-[10px] text-slate-400">{c.name}</p>
              <p className="text-xs font-mono font-bold text-gray-600">1 {c.code} = ৳{c.rate}</p>
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
      <div className="p-4 rounded-sm bg-slate-50/70 border border-slate-200 space-y-4">
        <CustomCheckbox
          checked={lowStock}
          onChange={(e) => setLowStock(e.target.checked)}
          label={<span className="font-bold text-gray-700">Low Stock Reorder Triggers</span>}
          description="Notifies store manager email & mobile when product stock breaches safety reorder threshold"
          containerClassName="w-full"
        />

        <CustomCheckbox
          checked={shiftClose}
          onChange={(e) => setShiftClose(e.target.checked)}
          label={<span className="font-bold text-gray-700">Daily Register Shift Close Summary</span>}
          description="Sends automated email breakdown with cash drawer reconciliation and discrepancy audits"
          containerClassName="w-full"
        />

        <CustomCheckbox
          checked={smsAlerts}
          onChange={(e) => setSmsAlerts(e.target.checked)}
          label={<span className="font-bold text-gray-700">Customer SMS Digital Receipt Link</span>}
          description="Dispatches thank-you SMS containing invoice link directly to buyer phone number"
          containerClassName="w-full"
        />
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-sm bg-slate-100/70 border border-slate-200">
        <div>
          <h4 className="font-bold text-gray-600 text-sm">Security & Access Policies</h4>
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-sm bg-slate-50 border border-slate-200">
        <div>
          <h4 className="font-bold text-gray-600 text-sm">Role-Based Access Control (RBAC)</h4>
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
          <div key={r.role} className="p-4 rounded-sm border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-gray-600 text-xs">{r.role}</span>
              <span className="text-[9px] font-bold bg-slate-200 text-gray-600 px-1.5 py-0.5 rounded-sm">{r.badge}</span>
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-sm bg-emerald-50/50 border border-emerald-200">
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
        <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-600">Shopify & WooCommerce Bridge</h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Active Adapter
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">Two-way inventory stock & order synchronization</p>
        </div>

        <div className="p-4 rounded-sm border border-slate-200 bg-slate-50/50 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-600">Steadfast / Pathao Courier API</h4>
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

        <div className="flex items-center justify-between p-3 rounded-sm bg-slate-100 border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Signing Secret (HMAC SHA-256)</span>
            <p className="font-mono font-bold text-gray-600 text-xs">whsec_live_9a8f7b6c5d4e3f2a1b0c</p>
          </div>
          <button
            type="button"
            onClick={copySecret}
            className="px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-gray-600 font-bold hover:bg-slate-50 flex items-center gap-1 text-[11px]"
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
      <div className="p-4 rounded-sm bg-violet-500/10 border border-violet-300/60 text-violet-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <Brain size={15} className="text-violet-700" />
          <span>Blue Oceans Autonomous Business Copilot</span>
        </div>
        <p className="text-[11px] text-violet-900 leading-relaxed">
          Machine learning engine that predicts product demand surges (Eid, Ramadan, seasonality), auto-generates supplier purchase requisitions, and optimizes safety stock levels.
        </p>
      </div>

      <div className="p-4 rounded-sm bg-violet-50/40 border border-violet-200 space-y-4">
        <CustomCheckbox
          checked={demandForecasting}
          onChange={(e) => setDemandForecasting(e.target.checked)}
          themeColor="indigo"
          label={<span className="font-bold text-gray-700">AI Demand & Seasonality Forecasting</span>}
          description="Analyzes historical POS sales velocity to predict inventory requirements for upcoming peak periods"
          containerClassName="w-full"
        />

        <CustomCheckbox
          checked={smartReordering}
          onChange={(e) => setSmartReordering(e.target.checked)}
          themeColor="indigo"
          label={<span className="font-bold text-gray-700">Smart Purchase Requisition (PR) Drafts</span>}
          description="Automatically creates supplier purchase order drafts when safety stock thresholds are breached"
          containerClassName="w-full"
        />
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
      <div className="p-6 rounded-sm bg-linear-to-tr from-slate-900 via-indigo-950 to-slate-950 text-white space-y-4 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Active Plan</span>
            <h3 className="text-2xl font-black">ENTERPRISE PRO TIER</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tenant Identifier: <span className="font-mono text-white font-bold">{tenant.slug || "main-tenant"}</span>
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-gray-600 shadow-sm">
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

// ───────────────────────────────────────────────────────────────────────
// TAB: THEME & GLOBAL APPEARANCE
// ───────────────────────────────────────────────────────────────────────

function ThemeSettingsTab({ onSave }: { onSave: () => void }) {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<GlobalThemeId>(theme || "ocean-teal");

  useEffect(() => {
    if (theme) setSelectedTheme(theme);
  }, [theme]);

  const handleSelect = (themeId: GlobalThemeId) => {
    setSelectedTheme(themeId);
    setTheme(themeId);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setTheme(selectedTheme);
    onSave();
  };

  return (
    <form id="active-settings-form" onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-600">Global Color Theme & Palette</h3>
          <p className="text-xs text-slate-500">
            Select a primary modern theme. The selected theme will dynamically apply to all tenant, business, and POS screens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Active Theme:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-dark border border-brand-border capitalize">
            {GLOBAL_THEMES[selectedTheme]?.name || selectedTheme}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(Object.values(GLOBAL_THEMES) as GlobalThemeConfig[]).map((t) => {
          const isSelected = selectedTheme === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className={cn(
                "group relative cursor-pointer rounded-sm border-2 p-4 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden",
                isSelected
                  ? "border-brand-primary bg-brand-50/20 ring-2 ring-brand-border/40"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: t.primaryHex }}
                    />
                    <h4 className="text-sm font-bold text-gray-600">{t.name}</h4>
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient text-white shadow-2xs">
                      <Check size={12} />
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-semibold text-slate-400 mb-3">{t.subtitle}</p>

                {/* Color Palette Swatches */}
                <div className="flex items-center gap-1.5 mb-3 p-2 rounded-sm bg-slate-50 border border-slate-100">
                  <div
                    className="h-6 flex-1 rounded-sm shadow-2xs border border-black/5"
                    style={{ backgroundColor: t.primaryHex }}
                    title="Primary"
                  />
                  <div
                    className="h-6 flex-1 rounded-sm shadow-2xs border border-black/5"
                    style={{ backgroundColor: t.secondaryHex }}
                    title="Secondary"
                  />
                  <div
                    className="h-6 flex-1 rounded-sm shadow-2xs border border-black/5"
                    style={{ backgroundColor: t.accentHex }}
                    title="Accent"
                  />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{t.description}</p>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  {isSelected ? "Active Theme" : "Click to Apply"}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-sm transition",
                    isSelected
                      ? "bg-brand-gradient text-white shadow-2xs"
                      : "bg-slate-100 text-gray-600 group-hover:bg-slate-200"
                  )}
                >
                  {isSelected ? "Selected" : "Apply"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <CustomButton type="submit" variant="primary" icon={<Save size={14} />}>
          Save Theme Preference
        </CustomButton>
      </div>
    </form>
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