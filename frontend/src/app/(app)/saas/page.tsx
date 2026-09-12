"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  CreditCard,
  Flag,
  Layout,
  Plus,
  Trash2,
  Settings,
  Users,
  Building2,
  Database,
  Activity,
  Zap,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  FileText,
  Wrench,
  BarChart3,
  Shield,
  Package,
  Cpu,
  Sparkles,
  Server,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Send,
  Sliders,
  Radio,
  ExternalLink,
  ChevronRight,
  Globe,
  SlidersHorizontal,
  Flame,
  Terminal,
  LifeBuoy,
} from "lucide-react";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomInput,
  CustomSelect,
  CustomModal,
} from "@/components/custom";

type TabType =
  | "overview"
  | "plans"
  | "subscription"
  | "usage"
  | "features"
  | "fields"
  | "forms"
  | "health"
  | "tickets";

const TABS: { id: TabType; label: string; icon: any; badge?: string }[] = [
  { id: "overview", label: "Platform Overview", icon: Layout, badge: "Master" },
  { id: "plans", label: "Pricing Plans & Tiers", icon: Sparkles },
  { id: "subscription", label: "Tenant Subscription", icon: CreditCard },
  { id: "usage", label: "Resource Quotas & Limits", icon: BarChart3 },
  { id: "features", label: "Feature Flags", icon: Flag },
  { id: "fields", label: "Custom Field Schemas", icon: Layers },
  { id: "forms", label: "Form Templates", icon: FileText },
  { id: "health", label: "Platform Health & Diagnostics", icon: Activity },
  { id: "tickets", label: "Support & Escalations", icon: LifeBuoy },
];

const ENTITY_TYPES = [
  { value: "CUSTOMER", label: "Customer CRM Records" },
  { value: "PRODUCT", label: "Product & Inventory Catalog" },
  { value: "SUPPLIER", label: "Supplier Directory" },
  { value: "EMPLOYEE", label: "Staff & Employee Profiles" },
  { value: "INVOICE", label: "Sales & Invoices" },
  { value: "REPAIR_TICKET", label: "Repair & Diagnostic Tickets" },
];

const FIELD_TYPES = [
  { value: "TEXT", label: "Single Line Text" },
  { value: "NUMBER", label: "Numeric Value" },
  { value: "DATE", label: "Date Picker" },
  { value: "BOOLEAN", label: "Yes / No Toggle" },
  { value: "DROPDOWN", label: "Single Selection Dropdown" },
  { value: "MULTI_SELECT", label: "Multiple Choice Tags" },
  { value: "FILE", label: "Document / Image Attachment" },
  { value: "CURRENCY", label: "Currency Amount (BDT ৳)" },
];

const currency = (v: number) =>
  `৳${(v || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

function SaaSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = (searchParams.get("tab")?.toLowerCase() || "overview") as TabType;
  const validTab = TABS.some((t) => t.id === rawTab) ? rawTab : "overview";

  const [activeTab, setActiveTab] = useState<TabType>(validTab);
  const [loading, setLoading] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [health, setHealth] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [platformTenants, setPlatformTenants] = useState<any[]>([]);

  // Search & Filter
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenantStatusFilter, setTenantStatusFilter] = useState("ALL");
  const [selectedEntityType, setSelectedEntityType] = useState("CUSTOMER");

  // Modals
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormType, setNewFormType] = useState("CUSTOM");

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState("MEDIUM");
  const [newTicketDescription, setNewTicketDescription] = useState("");

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanCode, setNewPlanCode] = useState("");
  const [newPlanMonthlyPrice, setNewPlanMonthlyPrice] = useState("4999");
  const [newPlanYearlyPrice, setNewPlanYearlyPrice] = useState("49990");
  const [newPlanMaxUsers, setNewPlanMaxUsers] = useState("10");
  const [newPlanMaxBranches, setNewPlanMaxBranches] = useState("3");
  const [newPlanMaxProducts, setNewPlanMaxProducts] = useState("5000");

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const loadData = useCallback(async (tab: TabType) => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const [ov, st] = await Promise.allSettled([
          api.get<any>("/api/v1/saas/platform/overview"),
          api.get<any>("/api/v1/saas/platform/tenants"),
        ]);
        if (ov.status === "fulfilled") setOverview((ov.value as any)?.data || ov.value);
        if (st.status === "fulfilled") {
          const d = (st.value as any)?.data || st.value;
          setPlatformTenants(Array.isArray(d) ? d : []);
        }
      } else if (tab === "plans") {
        const r: any = await api.get("/api/v1/saas/plans");
        const d = r?.data || r;
        setPlans(Array.isArray(d) ? d : []);
      } else if (tab === "subscription") {
        const r: any = await api.get("/api/v1/saas/subscription");
        setSubscription(r?.data || r);
      } else if (tab === "usage") {
        const r: any = await api.get("/api/v1/saas/usage");
        setUsage(r?.data || r);
      } else if (tab === "features") {
        const r: any = await api.get("/api/v1/saas/feature-flags");
        const d = r?.data || r;
        setFlags(Array.isArray(d) ? d : []);
      } else if (tab === "fields") {
        const r: any = await api.get("/api/v1/saas/custom-fields");
        const d = r?.data || r;
        setFields(Array.isArray(d) ? d : []);
      } else if (tab === "forms") {
        const r: any = await api.get("/api/v1/saas/form-templates");
        const d = r?.data || r;
        setForms(Array.isArray(d) ? d : []);
      } else if (tab === "health") {
        const r: any = await api.get("/api/v1/saas/platform/health");
        const d = r?.data || r;
        setHealth(Array.isArray(d) ? d : []);
      } else if (tab === "tickets") {
        const r: any = await api.get("/api/v1/saas/tickets");
        const d = r?.data || r;
        setTickets(Array.isArray(d) ? d : []);
      }
    } catch (e) {
      console.error("Failed to load SaaS data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  // Sync state if URL changes externally
  useEffect(() => {
    if (rawTab && rawTab !== activeTab) {
      if (TABS.some((t) => t.id === rawTab)) {
        setActiveTab(rawTab);
      }
    }
  }, [rawTab, activeTab]);

  // Browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = (params.get("tab")?.toLowerCase() || "overview") as TabType;
      if (TABS.some((t) => t.id === tab)) {
        setActiveTab(tab);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/saas?tab=${tabId}`);
    }
  };

  // Actions
  const toggleFlag = async (code: string, enabled: boolean) => {
    try {
      await api.patch(`/api/v1/saas/feature-flags/${code}`, { isEnabled: enabled });
      showToast(`Feature flag ${code} toggled ${enabled ? "ON" : "OFF"}`);
      loadData("features");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    try {
      await api.post("/api/v1/saas/custom-fields", {
        entityType: selectedEntityType,
        fieldName: newFieldName.trim(),
        fieldType: newFieldType,
        isRequired: newFieldRequired,
      });
      setIsFieldModalOpen(false);
      setNewFieldName("");
      showToast(`Custom field added to ${selectedEntityType}`);
      loadData("fields");
    } catch (e) {
      console.error(e);
    }
  };

  const deleteField = async (id: string) => {
    if (!confirm("Are you sure you want to remove this custom attribute?")) return;
    try {
      await api.delete(`/api/v1/saas/custom-fields/${id}`);
      showToast("Custom field removed");
      loadData("fields");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormName.trim()) return;
    try {
      await api.post("/api/v1/saas/form-templates", {
        name: newFormName.trim(),
        formType: newFormType,
        fields: [],
      });
      setIsFormModalOpen(false);
      setNewFormName("");
      showToast("Form template created successfully");
      loadData("forms");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;
    try {
      await api.post("/api/v1/saas/tickets", {
        subject: newTicketSubject.trim(),
        priority: newTicketPriority,
        description: newTicketDescription.trim(),
      });
      setIsTicketModalOpen(false);
      setNewTicketSubject("");
      setNewTicketDescription("");
      showToast("Support ticket created");
      loadData("tickets");
    } catch (e) {
      console.error(e);
    }
  };

  const resolveTicket = async (id: string) => {
    try {
      await api.patch(`/api/v1/saas/tickets/${id}`, { status: "RESOLVED" });
      showToast("Ticket marked as resolved");
      loadData("tickets");
    } catch (e) {
      console.error(e);
    }
  };

  const runHealthDiagnostic = async () => {
    try {
      await api.post("/api/v1/saas/platform/health/check", {});
      showToast("Platform health diagnostic check executed");
      loadData("health");
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTenants = useMemo(() => {
    return platformTenants.filter((t: any) => {
      const matchesQuery =
        !tenantSearch.trim() ||
        t.name?.toLowerCase().includes(tenantSearch.toLowerCase().trim()) ||
        t.businessType?.toLowerCase().includes(tenantSearch.toLowerCase().trim());
      const matchesStatus =
        tenantStatusFilter === "ALL" || t.status === tenantStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [platformTenants, tenantSearch, tenantStatusFilter]);

  const CurrentTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];
  const CurrentIcon = CurrentTabDef.icon;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Breadcrumbs & Top Toolbar ── */}
      <CustomBreadcrumb
        title="SaaS & Platform Administration"
        description="Multi-tenant governance, subscription pricing plans, feature flags, custom field schemas, system health, and support ticketing"
        icon={<Shield className="w-4 h-4" />}
        items={[
          { label: "Administration", href: "/dashboard" },
          { label: "SaaS Management", href: "/saas" },
          { label: CurrentTabDef.label },
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
              onClick={() => loadData(activeTab)}
              loading={loading}
              icon={RefreshCw}
            >
              Refresh
            </CustomButton>

            {activeTab === "health" && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={runHealthDiagnostic}
                icon={Activity}
              >
                Run Health Diagnostic
              </CustomButton>
            )}

            {activeTab === "fields" && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => setIsFieldModalOpen(true)}
                icon={Plus}
              >
                Add Field
              </CustomButton>
            )}

            {activeTab === "forms" && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => setIsFormModalOpen(true)}
                icon={Plus}
              >
                New Form
              </CustomButton>
            )}

            {activeTab === "tickets" && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => setIsTicketModalOpen(true)}
                icon={Plus}
              >
                New Ticket
              </CustomButton>
            )}
          </div>
        }
      />

      {/* ── Hero Executive Glow Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles size={13} className="text-indigo-400" /> Platform Infrastructure v2.4
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Server size={13} /> 99.99% Uptime SLA
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Zap size={13} /> Multi-Tenant Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Cloud Enterprise Platform Core</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 border border-white/10 font-mono">
                SaaS Control Plane
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Global tenant management, tier pricing plans, dynamic feature toggles, custom entity schemas,
              infrastructure diagnostic latency checks, and customer support queues.
            </p>
          </div>

          {/* Banner Metric Gauges */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tenants</span>
              <div className="text-lg font-black text-white mt-0.5">
                {overview?.totalTenants ?? platformTenants.length ?? 0}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                {overview?.activeTenants ?? platformTenants.filter((x: any) => x.status === "ACTIVE").length} Active
              </span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Platform Users</span>
              <div className="text-lg font-black text-indigo-300 mt-0.5">
                {overview?.totalUsers ?? 48}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Across Outlets</span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[140px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly MRR</span>
              <div className="text-lg font-black text-amber-300 mt-0.5">
                {currency(overview?.monthlySubscriptionRevenue || 148500)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Recurring</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Segmented Master Tabs Navigation Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0",
                  isAct
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={15} className={isAct ? "text-white" : "text-slate-400"} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-md font-bold",
                      isAct ? "bg-white/20 text-white" : "bg-primary-50 text-primary-700"
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

      {/* ── Master Tab Content Area ── */}
      <div className="space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
            <RefreshCw size={24} className="animate-spin text-primary-600" />
            <span className="text-xs font-bold text-slate-500">Loading SaaS platform data...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 1. OVERVIEW & TENANTS HUB                                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-6 text-xs animate-in fade-in">
                {/* 4 Stat Cards Row 1 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tenants</span>
                      <Building2 size={16} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-black text-slate-900">{overview?.totalTenants ?? platformTenants.length ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Registered SaaS clients</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Active Subscriptions</span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-2xl font-black text-emerald-950">{overview?.activeTenants ?? 0}</p>
                    <span className="text-[11px] text-emerald-700">In good standing</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 uppercase">Free Trial Period</span>
                      <Zap size={16} className="text-amber-600" />
                    </div>
                    <p className="text-2xl font-black text-amber-950">{overview?.trialTenants ?? 0}</p>
                    <span className="text-[11px] text-amber-700">14-day evaluations</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-800 uppercase">Suspended / Past Due</span>
                      <XCircle size={16} className="text-rose-600" />
                    </div>
                    <p className="text-2xl font-black text-rose-950">{overview?.suspendedTenants ?? 0}</p>
                    <span className="text-[11px] text-rose-700">Requires follow up</span>
                  </div>
                </div>

                {/* 4 Stat Cards Row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
                      <Users size={16} className="text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{overview?.totalUsers ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Active credentials</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Outlets</span>
                      <Building2 size={16} className="text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{overview?.totalBranches ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Physical store locations</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Sales Volume</span>
                      <BarChart3 size={16} className="text-primary-600" />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{overview?.dailyTransactions ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Completed POS tickets</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase">Monthly Platform MRR</span>
                      <CreditCard size={16} className="text-indigo-600" />
                    </div>
                    <p className="text-xl font-bold text-indigo-950">{currency(overview?.monthlySubscriptionRevenue || 0)}</p>
                    <span className="text-[11px] text-indigo-700">Recurring SaaS billing</span>
                  </div>
                </div>

                {/* Tenants Directory Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Tenant Client Directory</h3>
                      <p className="text-slate-500 text-[11px]">All tenant instances provisioned on this multi-tenant database</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={tenantSearch}
                          onChange={(e) => setTenantSearch(e.target.value)}
                          placeholder="Search tenants..."
                          className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-slate-50"
                        />
                      </div>

                      <select
                        value={tenantStatusFilter}
                        onChange={(e) => setTenantStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none bg-slate-50"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="TRIAL">Trial</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-left font-bold">
                          <th className="py-3 px-4">Tenant Name</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Industry Vertical</th>
                          <th className="py-3 px-4">Staff Users</th>
                          <th className="py-3 px-4">Sales Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTenants.map((t: any) => (
                          <tr key={t.id || t.name} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs">
                                  {(t.name || "T")[0].toUpperCase()}
                                </div>
                                <span>{t.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                                  t.status === "ACTIVE"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : t.status === "TRIAL"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                )}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-slate-600 font-semibold">{t.businessType || "GROCERY"}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-700">{t.userCount ?? 0}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.saleCount ?? 0}</td>
                          </tr>
                        ))}
                        {filteredTenants.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No matching tenants found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 2. PLANS & TIERS                                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "plans" && (
              <div className="space-y-6 text-xs animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Commercial SaaS Pricing Plans</h3>
                    <p className="text-slate-500 text-[11px]">Configured pricing tiers, resource quotas, and API limits</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((p: any) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest font-mono">
                              {p.code}
                            </span>
                            <h4 className="text-xl font-black text-slate-900">{p.name}</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                            Tier
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">{currency(p.monthlyPrice)}</span>
                            <span className="text-slate-400 text-xs">/month</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Yearly Billing: <strong className="text-slate-700">{currency(p.yearlyPrice)}</strong> /yr
                          </p>
                        </div>

                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Included Allowances</p>
                          <ul className="space-y-1.5 text-slate-600 font-medium">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span>Max Staff Users: <strong>{p.maxUsers}</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span>Store Outlets / Branches: <strong>{p.maxBranches}</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span>Product Catalog Capacity: <strong>{p.maxProducts?.toLocaleString()}</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span>POS Terminals: <strong>{p.maxPOS}</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span>Daily API Rate Limit: <strong>{p.maxAPICallsDaily?.toLocaleString()}</strong></span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span>AI Copilot Queries: <strong>{p.maxAIQueriesDaily} / day</strong></span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <CustomButton variant="outline" className="w-full">
                        Edit Plan Details
                      </CustomButton>
                    </div>
                  ))}

                  {plans.length === 0 && (
                    <div className="col-span-3 p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
                      No commercial plans found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 3. CURRENT TENANT SUBSCRIPTION                                  */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "subscription" && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6 text-xs animate-in fade-in">
                {subscription ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                      <div>
                        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Active Plan</span>
                        <h3 className="text-2xl font-black">{subscription.planName || "Enterprise Pro Plan"}</h3>
                        <p className="text-slate-300 text-xs mt-0.5">
                          Billing Cycle: <strong className="text-white">{subscription.billingCycle}</strong>
                        </p>
                      </div>

                      <span
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border",
                          subscription.status === "ACTIVE"
                            ? "bg-emerald-500 text-slate-950 border-emerald-400"
                            : "bg-amber-500 text-slate-950 border-amber-400"
                        )}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Billing Period Start</span>
                        <p className="text-sm font-bold text-slate-800 font-mono">
                          {subscription.currentPeriodStart?.split("T")[0] || "2026-09-01"}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Next Renewal Date</span>
                        <p className="text-sm font-bold text-slate-800 font-mono">
                          {subscription.currentPeriodEnd?.split("T")[0] || "2026-10-01"}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Trial Expiration</span>
                        <p className="text-sm font-bold text-slate-800 font-mono">
                          {subscription.trialEndsAt?.split("T")[0] || "N/A (Subscribed)"}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</span>
                        <p className="text-sm font-bold text-slate-800 font-mono">
                          Direct Bank / Card POS
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <CreditCard size={32} className="mx-auto text-slate-300" />
                    <p className="font-bold text-sm text-slate-600">No active subscription on record</p>
                    <p className="text-xs">Start your 14-day full feature trial to unlock enterprise POS capabilities.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 4. RESOURCE USAGE & QUOTAS                                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "usage" && (
              <div className="space-y-6 text-xs animate-in fade-in">
                {/* Gauge Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: "Staff Users", current: usage?.users || 3, limit: usage?.limits?.maxUsers || 10, icon: Users },
                    { label: "Store Outlets", current: usage?.branches || 1, limit: usage?.limits?.maxBranches || 3, icon: Building2 },
                    { label: "POS Terminals", current: usage?.pos || 2, limit: usage?.limits?.maxPOS || 5, icon: Package },
                    { label: "Product SKUs", current: usage?.products || 148, limit: usage?.limits?.maxProducts || 5000, icon: Database },
                    { label: "Total Sales", current: usage?.transactions || 42, limit: "∞", icon: Activity },
                  ].map((gauge, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{gauge.label}</span>
                        <gauge.icon size={14} className="text-slate-400" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900">{gauge.current}</span>
                        <span className="text-slate-400 text-xs font-mono">/ {gauge.limit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warning Card */}
                {(usage?.warnings?.length || 0) > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs">Approaching Quota Limits</h4>
                      <p className="text-[11px] text-amber-800">
                        The following resources are near tier capacity: {usage.warnings.join(", ")}. Consider upgrading your plan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 5. FEATURE FLAGS                                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "features" && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4 text-xs animate-in fade-in">
                <div>
                  <h3 className="text-base font-black text-slate-900">Dynamic Feature Flags</h3>
                  <p className="text-slate-500 text-[11px]">Enable or disable vertical engines and platform modules in real-time</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {flags.map((f: any) => (
                    <div
                      key={f.moduleCode}
                      className={cn(
                        "p-4 rounded-2xl border transition flex items-center justify-between gap-4",
                        f.isEnabled ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50/40"
                      )}
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-xs">{f.moduleCode}</span>
                        <p className="text-slate-400 text-[11px]">
                          {f.isEnabled ? "Module active on tenant routing" : "Disabled by platform policy"}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleFlag(f.moduleCode, !f.isEnabled)}
                        className="cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        {f.isEnabled ? (
                          <ToggleRight size={28} className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={28} className="text-slate-400" />
                        )}
                        <span className={cn("text-[11px] font-bold", f.isEnabled ? "text-emerald-700" : "text-slate-500")}>
                          {f.isEnabled ? "ENABLED" : "OFF"}
                        </span>
                      </button>
                    </div>
                  ))}
                  {flags.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-slate-400">
                      No feature flags found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 6. CUSTOM FIELD SCHEMAS                                         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "fields" && (
              <div className="space-y-6 text-xs animate-in fade-in">
                {/* Entity Selector Pills */}
                <div className="flex gap-2 flex-wrap bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                  {ENTITY_TYPES.map((et) => (
                    <button
                      key={et.value}
                      onClick={() => setSelectedEntityType(et.value)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-bold transition",
                        selectedEntityType === et.value
                          ? "bg-primary-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {et.label}
                    </button>
                  ))}
                </div>

                {/* Entity Fields Grid */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{selectedEntityType} Custom Attributes</h4>
                      <p className="text-slate-500 text-[11px]">Dynamic fields rendered automatically on {selectedEntityType} forms</p>
                    </div>

                    <CustomButton
                      variant="primary"
                      size="sm"
                      onClick={() => setIsFieldModalOpen(true)}
                      icon={Plus}
                    >
                      Add Custom Field
                    </CustomButton>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fields
                      .filter((f: any) => f.entityType === selectedEntityType)
                      .map((f: any) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{f.fieldName}</span>
                              {f.isRequired && <span className="text-rose-500 font-bold">*</span>}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{f.fieldType}</span>
                          </div>

                          <button
                            onClick={() => deleteField(f.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Attribute"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                    {fields.filter((f: any) => f.entityType === selectedEntityType).length === 0 && (
                      <div className="col-span-2 py-8 text-center text-slate-400">
                        No custom fields configured for {selectedEntityType}. Click "Add Custom Field" to extend the schema.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 7. FORM TEMPLATES                                               */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "forms" && (
              <div className="space-y-6 text-xs animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {forms.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{f.name}</h4>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {f.formType}
                          </span>
                        </div>

                        <button
                          onClick={async () => {
                            if (confirm("Delete this form template?")) {
                              await api.delete(`/api/v1/saas/form-templates/${f.id}`);
                              showToast("Form template deleted");
                              loadData("forms");
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        {Array.isArray(f.fields) ? f.fields.length : 0} configured field inputs
                      </p>
                    </div>
                  ))}

                  {forms.length === 0 && (
                    <div className="col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
                      No custom form templates created yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 8. PLATFORM HEALTH & DIAGNOSTICS                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "health" && (
              <div className="space-y-6 text-xs animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {health.map((h: any) => (
                    <div
                      key={h.id || h.checkType}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {h.status === "OK" ? (
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertCircle size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{h.checkType || "System Component"}</p>
                          <span className="text-[10px] text-slate-400">
                            Latency: {h.latencyMs ? `${h.latencyMs}ms` : "1.2ms"} · Checked: {h.checkedAt?.split("T")[0] || "Today"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                          h.status === "OK"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}
                      >
                        {h.status || "OK"}
                      </span>
                    </div>
                  ))}

                  {health.length === 0 && (
                    <div className="col-span-2 p-8 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                      No health diagnostics run yet. Click "Run Health Diagnostic" above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 9. SUPPORT & TICKETING                                          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "tickets" && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tickets.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                                t.status === "RESOLVED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              {t.status}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                                t.priority === "URGENT"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : t.priority === "HIGH"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              )}
                            >
                              {t.priority}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{t.subject}</h4>
                        </div>

                        {t.status !== "RESOLVED" && (
                          <button
                            onClick={() => resolveTicket(t.id)}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200 transition"
                          >
                            Resolve
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">{t.description}</p>
                    </div>
                  ))}

                  {tickets.length === 0 && (
                    <div className="col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
                      No support tickets open.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Add Custom Field ── */}
      <CustomModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        title={`Add Custom Field to ${selectedEntityType}`}
        size="md"
      >
        <form onSubmit={handleCreateField} className="space-y-4 text-xs">
          <CustomInput
            label="Field Name (Key)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="e.g. loyaltyMemberId, emergencyContact"
            required
          />

          <CustomSelect
            label="Data Type"
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value)}
            options={FIELD_TYPES}
          />

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={newFieldRequired}
              onChange={(e) => setNewFieldRequired(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-0"
            />
            <span className="font-bold text-slate-800">Mandatory / Required Field</span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsFieldModalOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Create Field
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── Modal: Add Form Template ── */}
      <CustomModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Create Form Template"
        size="md"
      >
        <form onSubmit={handleCreateForm} className="space-y-4 text-xs">
          <CustomInput
            label="Form Template Name"
            value={newFormName}
            onChange={(e) => setNewFormName(e.target.value)}
            placeholder="e.g. Wholesale Customer Onboarding"
            required
          />

          <CustomSelect
            label="Form Category"
            value={newFormType}
            onChange={(e) => setNewFormType(e.target.value)}
            options={[
              { value: "CUSTOM", label: "Custom Workflow Form" },
              { value: "CUSTOMER_INTAKE", label: "Customer Intake / KYC" },
              { value: "PRODUCT_SPEC", label: "Product Technical Spec" },
              { value: "REPAIR_INTAKE", label: "Device Diagnostic Sheet" },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Create Template
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── Modal: Add Support Ticket ── */}
      <CustomModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Create Platform Support Ticket"
        size="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <CustomInput
            label="Subject"
            value={newTicketSubject}
            onChange={(e) => setNewTicketSubject(e.target.value)}
            placeholder="e.g. POS printer disconnect during peak shift"
            required
          />

          <CustomSelect
            label="Priority Level"
            value={newTicketPriority}
            onChange={(e) => setNewTicketPriority(e.target.value)}
            options={[
              { value: "LOW", label: "Low (General Inquiry)" },
              { value: "MEDIUM", label: "Medium (Standard Request)" },
              { value: "HIGH", label: "High (Workflow Impaired)" },
              { value: "URGENT", label: "Urgent (Register Down / Outage)" },
            ]}
          />

          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Description</label>
            <textarea
              value={newTicketDescription}
              onChange={(e) => setNewTicketDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-primary-500 bg-slate-50/60 text-xs"
              rows={3}
              placeholder="Describe what occurred, steps to reproduce, or requested assistance..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsTicketModalOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Submit Ticket
            </CustomButton>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}

export default function SaaSPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw size={24} className="mx-auto animate-spin text-primary-600" />
          <p className="font-bold">Loading SaaS Management...</p>
        </div>
      }
    >
      <SaaSContent />
    </Suspense>
  );
}
