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
import { SslPaymentModal, type SslPaymentSuccessData } from "@/components/payment/SslPaymentModal";

type TabType =
  | "overview"
  | "plans"
  | "subscription"
  | "trials"
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
  { id: "trials", label: "Trial Requests & Approvals", icon: Clock, badge: "Admin" },
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
  const [trialRequests, setTrialRequests] = useState<any[]>([]);
  const [loadingTrials, setLoadingTrials] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showSslModal, setShowSslModal] = useState(false);
  const [sslModalAmount, setSslModalAmount] = useState(2999);

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
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planModulesText, setPlanModulesText] = useState("");
  const [planForm, setPlanForm] = useState({
    name: "",
    code: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 5,
    maxBranches: 1,
    maxWarehouses: 1,
    maxPOS: 1,
    maxProducts: 1000,
    maxStorageMB: 500,
    maxAPICallsDaily: 10000,
    maxAIQueriesDaily: 50,
  });

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
      } else if (tab === "trials") {
        const r: any = await api.get("/api/v1/saas/trial-requests");
        const d = r?.data || r;
        setTrialRequests(Array.isArray(d) ? d : []);
      }
    } catch (e) {
      console.error("Failed to load SaaS data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrialRequests = useCallback(async () => {
    setLoadingTrials(true);
    try {
      const res = await api.get<any>("/api/v1/saas/trial-requests");
      setTrialRequests(res.data?.data || res.data || []);
    } catch {
      setTrialRequests([]);
    } finally {
      setLoadingTrials(false);
    }
  }, []);

  const handleApproveTrial = async (subId: string, days: number) => {
    setApproving(true);
    try {
      await api.post(`/api/v1/saas/trial-requests/${subId}/approve`, { trialDays: days });
      showToast(`Trial approved for ${days} days!`);
      fetchTrialRequests();
    } catch (e: any) {
      showToast(e.message || "Failed to approve trial");
    } finally {
      setApproving(false);
    }
  };

  const handleSslPaymentSuccess = async (data: SslPaymentSuccessData) => {
    try {
      await api.post("/api/v1/saas/subscription/pay", {
        subscriptionId: subscription?.id,
        transactionId: data.transactionId,
        amount: data.amount,
      });
      showToast(`Payment of ৳${data.amount} successful! Subscription activated.`);
      loadData("subscription");
    } catch (e: any) {
      showToast(e.message || "Payment recorded, reloading subscription...");
      loadData("subscription");
    }
  };

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

  const handleOpenEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || "",
      code: plan.code || "",
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice ?? 0,
      yearlyPrice: plan.yearlyPrice ?? 0,
      maxUsers: plan.maxUsers ?? 5,
      maxBranches: plan.maxBranches ?? 1,
      maxWarehouses: plan.maxWarehouses ?? 1,
      maxPOS: plan.maxPOS ?? 1,
      maxProducts: plan.maxProducts ?? 1000,
      maxStorageMB: plan.maxStorageMB ?? 500,
      maxAPICallsDaily: plan.maxAPICallsDaily ?? 10000,
      maxAIQueriesDaily: plan.maxAIQueriesDaily ?? 50,
    });
    const mods = Array.isArray(plan.includedModules)
      ? plan.includedModules.join("\n")
      : typeof plan.includedModules === "string"
      ? plan.includedModules
      : "";
    setPlanModulesText(mods);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan?.id) return;
    setSavingPlan(true);
    try {
      const includedModules = planModulesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await api.put(`/api/v1/saas/plans/${editingPlan.id}`, {
        ...planForm,
        includedModules,
      });
      showToast(`Plan "${planForm.name}" updated successfully!`);
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      await loadData("plans");
    } catch (err: any) {
      console.error("Failed to update plan:", err);
      showToast(err?.message || "Failed to update plan details");
    } finally {
      setSavingPlan(false);
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
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-sm animate-in fade-in">
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

      {/* ── Executive Clean Light Theme Metrics (Blue Oceans Theme) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-sm bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Tenants</span>
            <Building2 size={15} className="text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 tabular-nums">
            {overview?.totalTenants ?? platformTenants.length ?? 0}
          </div>
          <p className="text-[11px] font-semibold text-emerald-600">
            {overview?.activeTenants ?? platformTenants.filter((x: any) => x.status === "ACTIVE").length} Active Stores
          </p>
        </div>

        <div className="p-4 rounded-sm bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Platform Users</span>
            <Users size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 tabular-nums">
            {overview?.totalUsers ?? 48}
          </div>
          <p className="text-[11px] text-slate-500">Across All Outlets</p>
        </div>

        <div className="p-4 rounded-sm bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Monthly MRR</span>
            <CreditCard size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 tabular-nums">
            {currency(overview?.monthlySubscriptionRevenue || 148500)}
          </div>
          <p className="text-[11px] text-slate-500">Subscription Invoiced</p>
        </div>

        <div className="p-4 rounded-sm bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Trials</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 tabular-nums">
            {trialRequests.length}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold">
            {trialRequests.length > 0 ? "Awaiting Admin Review" : "All Processed"}
          </p>
        </div>
      </div>

      {/* ── Active Section Header Banner ── */}
      <div className="bg-white border border-slate-200/90 rounded-sm px-5 py-3.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shrink-0">
            <CurrentIcon size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{CurrentTabDef.label}</h2>
            <p className="text-[11px] text-slate-500">
              Manage and configure {CurrentTabDef.label.toLowerCase()} across your multi-tenant POS platform.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-mono">
          {activeTab}
        </span>
      </div>

      {/* ── Master Tab Content Area ── */}
      <div className="space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-sm border border-slate-200 shadow-2xs space-y-2">
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
                  <div className="p-4 rounded-sm bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tenants</span>
                      <Building2 size={16} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-black text-gray-600">{overview?.totalTenants ?? platformTenants.length ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Registered SaaS clients</span>
                  </div>

                  <div className="p-4 rounded-sm bg-emerald-50/60 border border-emerald-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Active Subscriptions</span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-2xl font-black text-emerald-950">{overview?.activeTenants ?? 0}</p>
                    <span className="text-[11px] text-emerald-700">In good standing</span>
                  </div>

                  <div className="p-4 rounded-sm bg-amber-50/60 border border-amber-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 uppercase">Free Trial Period</span>
                      <Zap size={16} className="text-amber-600" />
                    </div>
                    <p className="text-2xl font-black text-amber-950">{overview?.trialTenants ?? 0}</p>
                    <span className="text-[11px] text-amber-700">14-day evaluations</span>
                  </div>

                  <div className="p-4 rounded-sm bg-rose-50/60 border border-rose-200/80 shadow-2xs space-y-1">
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
                  <div className="p-4 rounded-sm bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
                      <Users size={16} className="text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-600">{overview?.totalUsers ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Active credentials</span>
                  </div>

                  <div className="p-4 rounded-sm bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Outlets</span>
                      <Building2 size={16} className="text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-600">{overview?.totalBranches ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Physical store locations</span>
                  </div>

                  <div className="p-4 rounded-sm bg-white border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Sales Volume</span>
                      <BarChart3 size={16} className="text-primary-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-600">{overview?.dailyTransactions ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Completed POS tickets</span>
                  </div>

                  <div className="p-4 rounded-sm bg-indigo-50/60 border border-indigo-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase">Monthly Platform MRR</span>
                      <CreditCard size={16} className="text-indigo-600" />
                    </div>
                    <p className="text-xl font-bold text-indigo-950">{currency(overview?.monthlySubscriptionRevenue || 0)}</p>
                    <span className="text-[11px] text-indigo-700">Recurring SaaS billing</span>
                  </div>
                </div>

                {/* Tenants Directory Table */}
                <div className="bg-white rounded-sm border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black text-gray-600">Tenant Client Directory</h3>
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
                          className="pl-8 pr-3 py-1.5 rounded-sm border border-slate-200 text-xs font-semibold focus:outline-none focus:border-primary-500 bg-slate-50"
                        />
                      </div>

                      <select
                        value={tenantStatusFilter}
                        onChange={(e) => setTenantStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-sm border border-slate-200 text-xs font-bold focus:outline-none bg-slate-50"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="TRIAL">Trial</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-sm">
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
                            <td className="py-3 px-4 font-bold text-gray-600">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-sm bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs">
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
                                    : "bg-slate-100 text-gray-600 border-slate-200"
                                )}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-slate-600 font-semibold">{t.businessType || "GROCERY"}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-600">{t.userCount ?? 0}</td>
                            <td className="py-3 px-4 font-mono font-bold text-gray-600">{t.saleCount ?? 0}</td>
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
                    <h3 className="text-base font-black text-gray-600">Commercial SaaS Pricing Plans</h3>
                    <p className="text-slate-500 text-[11px]">Configured pricing tiers, resource quotas, and API limits</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  {plans.map((p: any) => {
                    const isEnterprise = p.code === "ENTERPRISE";
                    const isBusiness = p.code === "BUSINESS";
                    const modules: string[] = Array.isArray(p.includedModules)
                      ? p.includedModules
                      : typeof p.includedModules === "string"
                      ? JSON.parse(p.includedModules || "[]")
                      : [];
                    const yearlySavings = Number(p.monthlyPrice) * 12 - Number(p.yearlyPrice);

                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "bg-white rounded-sm border transition p-6 flex flex-col justify-between shadow-2xs hover:shadow-sm space-y-6 relative",
                          isBusiness ? "border-sky-300 ring-1 ring-sky-200" : "border-slate-200"
                        )}
                      >
                        {isBusiness && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white shadow-2xs">
                            Most Popular &bull; Recommended
                          </span>
                        )}

                        <div className="space-y-5">
                          {/* Top Header */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest font-mono">
                                {p.code}
                              </span>
                              <h4 className="text-xl font-black text-slate-800">{p.name}</h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                {p.description || "Configured commercial tier for platform operations"}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                                isEnterprise
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : isBusiness
                                  ? "bg-sky-50 text-sky-700 border-sky-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              )}
                            >
                              {isEnterprise ? "Enterprise" : isBusiness ? "Pro Growth" : "Starter"}
                            </span>
                          </div>

                          {/* Pricing Box */}
                          <div className="p-4 rounded-sm bg-slate-50/80 border border-slate-100 space-y-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900 tabular-nums">
                                {currency(p.monthlyPrice)}
                              </span>
                              <span className="text-slate-400 text-xs font-semibold">/month</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                              <span>
                                Billed Annually: <strong className="text-slate-700 font-bold">{currency(p.yearlyPrice)}</strong>/yr
                              </span>
                              {yearlySavings > 0 && (
                                <span className="font-bold text-emerald-600">Save {currency(yearlySavings)}</span>
                              )}
                            </div>
                          </div>

                          {/* Resource Limits (Clear & Meaningful) */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Capacity & Quotas
                            </p>
                            <ul className="space-y-2 text-xs text-slate-600 font-medium">
                              <li className="flex items-center gap-2">
                                <Building2 size={13} className="text-sky-600 shrink-0" />
                                <span>
                                  Store Outlets / Branches:{" "}
                                  <strong className="text-slate-800">
                                    {p.maxBranches >= 500 ? "Unlimited Branches" : `${p.maxBranches} Outlets`}
                                  </strong>
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Users size={13} className="text-sky-600 shrink-0" />
                                <span>
                                  Staff User Accounts:{" "}
                                  <strong className="text-slate-800">
                                    {p.maxUsers >= 500 ? "Unlimited Accounts" : `${p.maxUsers} Users`}
                                  </strong>
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Package size={13} className="text-sky-600 shrink-0" />
                                <span>
                                  Product Catalog Capacity:{" "}
                                  <strong className="text-slate-800">
                                    {p.maxProducts >= 500000 ? "Unlimited Catalog (500k+)" : `${p.maxProducts?.toLocaleString()} Products`}
                                  </strong>
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Server size={13} className="text-sky-600 shrink-0" />
                                <span>
                                  POS Terminals:{" "}
                                  <strong className="text-slate-800">
                                    {p.maxPOS >= 500 ? "Unlimited Terminals" : `${p.maxPOS} Terminals`}
                                  </strong>
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <Sparkles size={13} className="text-amber-500 shrink-0" />
                                <span>
                                  AI Copilot:{" "}
                                  <strong className="text-slate-800">
                                    {p.maxAIQueriesDaily >= 1000 ? "Enterprise Custom AI Copilot" : `${p.maxAIQueriesDaily} Queries / day`}
                                  </strong>
                                </span>
                              </li>
                            </ul>
                          </div>

                          {/* Core Modules Breakdown */}
                          {modules.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Included Modules & Features
                              </p>
                              <ul className="space-y-1.5 text-[11px] text-slate-700">
                                {modules.map((m: string, mIdx: number) => {
                                  const isHeader = m.toLowerCase().includes("plus:") || m.toLowerCase().includes("starter,");
                                  if (isHeader) {
                                    return (
                                      <li key={mIdx} className="font-bold text-sky-700 pt-1 text-[11px]">
                                        {m}
                                      </li>
                                    );
                                  }
                                  return (
                                    <li key={mIdx} className="flex items-start gap-2">
                                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                      <span className="leading-tight">{m}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="pt-4 border-t border-slate-100">
                          <CustomButton
                            variant={isBusiness ? "primary" : "outline"}
                            className="w-full text-xs font-bold"
                            onClick={() => handleOpenEditPlan(p)}
                          >
                            Edit Plan Details & Pricing
                          </CustomButton>
                        </div>
                      </div>
                    );
                  })}

                  {plans.length === 0 && (
                    <div className="col-span-3 p-12 bg-white rounded-sm border border-slate-200 text-center text-slate-400">
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
              <div className="bg-white rounded-sm border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 text-xs animate-in fade-in">
                {subscription ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-sm bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                      <div>
                        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                          Active Plan ({subscription.planCode || "STARTER"})
                        </span>
                        <h3 className="text-2xl font-black">{subscription.planName || "Starter"} Plan</h3>
                        <p className="text-slate-300 text-xs mt-0.5">
                          Billing Cycle: <strong className="text-white">{subscription.billingCycle || "MONTHLY"}</strong>
                          {subscription.businessType ? ` • Vertical: ${subscription.businessType}` : ""}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border",
                          subscription.status === "ACTIVE"
                            ? "bg-emerald-500 text-gray-600 border-emerald-400"
                            : "bg-amber-500 text-gray-600 border-amber-400"
                        )}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Billing Period Start</span>
                        <p className="text-sm font-bold text-gray-600 font-mono">
                          {subscription.currentPeriodStart?.split("T")[0] || "2026-09-01"}
                        </p>
                      </div>

                      <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Next Renewal Date</span>
                        <p className="text-sm font-bold text-gray-600 font-mono">
                          {subscription.currentPeriodEnd?.split("T")[0] || "2026-10-01"}
                        </p>
                      </div>

                      <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Trial Expiration</span>
                        <p className="text-sm font-bold text-gray-600 font-mono">
                          {subscription.trialEndsAt?.split("T")[0] || "N/A (Subscribed)"}
                        </p>
                      </div>

                      <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</span>
                        <p className="text-sm font-bold text-gray-600 font-mono">
                          Direct Bank / Card POS
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 text-xs">Need to activate or renew subscription?</span>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = Number(subscription.monthlyPrice || 990);
                          setSslModalAmount(amt > 0 ? amt : 990);
                          setShowSslModal(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-[#e92929] hover:bg-[#d42020] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                      >
                        <CreditCard size={14} />
                        <span>Pay via SSLCommerz Gateway</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <CreditCard size={32} className="mx-auto text-slate-300" />
                    <p className="font-bold text-sm text-slate-600">No active subscription on record</p>
                    <p className="text-xs">Pay subscription or submit a free trial request to unlock enterprise POS capabilities.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSslModalAmount(2999);
                        setShowSslModal(true);
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#e92929] hover:bg-[#d42020] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                    >
                      <CreditCard size={14} />
                      <span>Activate Plan via SSLCommerz (৳2,999)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 3.1. TRIAL REQUESTS & ADMIN APPROVALS                            */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "trials" && (
              <div className="bg-white rounded-sm border border-slate-200 p-6 shadow-2xs space-y-5 text-xs animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Tenant Free Trial Requests</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Tenants with default registrations must be reviewed and approved by platform administrators. Choose trial duration to activate.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchTrialRequests}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw size={13} className={cn(loadingTrials && "animate-spin")} />
                    <span>Refresh List</span>
                  </button>
                </div>

                {loadingTrials ? (
                  <div className="py-12 text-center text-slate-400">Loading trial requests...</div>
                ) : trialRequests.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                    <p className="font-bold text-sm text-slate-700">No Pending Trial Requests</p>
                    <p className="text-xs">All tenant registrations are either active or processed.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="p-3">Tenant / Business</th>
                          <th className="p-3">Industry</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3">Requested At</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Admin Approve Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trialRequests.map((tr) => (
                          <tr key={tr.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{tr.tenantName}</p>
                              <p className="font-mono text-[10px] text-sky-600">{tr.slug}</p>
                            </td>
                            <td className="p-3 text-slate-600 font-medium">{tr.businessType}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[10px]">
                                {tr.planName}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">
                              {tr.createdAt?.split("T")[0] || tr.createdAt?.slice(0, 10)}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {tr.status === "TRIAL_REQUESTED" ? "Trial Requested" : "Pending Payment"}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                              <button
                                type="button"
                                disabled={approving}
                                onClick={() => handleApproveTrial(tr.id, 7)}
                                className="px-2.5 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold text-[11px] cursor-pointer"
                              >
                                7 Days
                              </button>
                              <button
                                type="button"
                                disabled={approving}
                                onClick={() => handleApproveTrial(tr.id, 14)}
                                className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] cursor-pointer"
                              >
                                14 Days
                              </button>
                              <button
                                type="button"
                                disabled={approving}
                                onClick={() => handleApproveTrial(tr.id, 30)}
                                className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-[11px] cursor-pointer"
                              >
                                30 Days
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                    <div key={i} className="p-4 rounded-sm bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{gauge.label}</span>
                        <gauge.icon size={14} className="text-slate-400" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-600">{gauge.current}</span>
                        <span className="text-slate-400 text-xs font-mono">/ {gauge.limit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warning Card */}
                {(usage?.warnings?.length || 0) > 0 && (
                  <div className="p-4 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
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
              <div className="bg-white rounded-sm border border-slate-200 p-6 shadow-2xs space-y-4 text-xs animate-in fade-in">
                <div>
                  <h3 className="text-base font-black text-gray-600">Dynamic Feature Flags</h3>
                  <p className="text-slate-500 text-[11px]">Enable or disable vertical engines and platform modules in real-time</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {flags.map((f: any) => (
                    <div
                      key={f.moduleCode}
                      className={cn(
                        "p-4 rounded-sm border transition flex items-center justify-between gap-4",
                        f.isEnabled ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50/40"
                      )}
                    >
                      <div>
                        <span className="font-mono font-bold text-gray-600 text-xs">{f.moduleCode}</span>
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
                <div className="flex gap-2 flex-wrap bg-white p-3 rounded-sm border border-slate-200 shadow-2xs">
                  {ENTITY_TYPES.map((et) => (
                    <button
                      key={et.value}
                      onClick={() => setSelectedEntityType(et.value)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-sm text-xs font-bold transition",
                        selectedEntityType === et.value
                          ? "bg-brand-gradient text-white shadow-2xs shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {et.label}
                    </button>
                  ))}
                </div>

                {/* Entity Fields Grid */}
                <div className="bg-white rounded-sm border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-base font-black text-gray-600">{selectedEntityType} Custom Attributes</h4>
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
                          className="p-3.5 rounded-sm border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-600">{f.fieldName}</span>
                              {f.isRequired && <span className="text-rose-500 font-bold">*</span>}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{f.fieldType}</span>
                          </div>

                          <button
                            onClick={() => deleteField(f.id)}
                            className="p-1.5 rounded-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
                      className="p-5 rounded-sm bg-white border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-black text-gray-600 text-sm">{f.name}</h4>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">
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
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-sm hover:bg-rose-50 transition"
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
                    <div className="col-span-2 p-12 bg-white rounded-sm border border-slate-200 text-center text-slate-400">
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
                      className="p-4 rounded-sm bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {h.status === "OK" ? (
                          <div className="w-8 h-8 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertCircle size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-600 text-xs">{h.checkType || "System Component"}</p>
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
                    <div className="col-span-2 p-8 text-center text-slate-400 bg-white rounded-sm border border-slate-200">
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
                      className="p-5 rounded-sm bg-white border border-slate-200 shadow-2xs space-y-3"
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
                          <h4 className="font-bold text-gray-600 text-sm">{t.subject}</h4>
                        </div>

                        {t.status !== "RESOLVED" && (
                          <button
                            onClick={() => resolveTicket(t.id)}
                            className="px-2.5 py-1 rounded-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200 transition"
                          >
                            Resolve
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">{t.description}</p>
                    </div>
                  ))}

                  {tickets.length === 0 && (
                    <div className="col-span-2 p-12 bg-white rounded-sm border border-slate-200 text-center text-slate-400">
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
              className="w-4 h-4 rounded-sm text-primary-600 focus:ring-0"
            />
            <span className="font-bold text-gray-600">Mandatory / Required Field</span>
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
            <label className="block font-bold text-gray-600 mb-1">Issue Description</label>
            <textarea
              value={newTicketDescription}
              onChange={(e) => setNewTicketDescription(e.target.value)}
              className="w-full rounded-sm border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-primary-500 bg-slate-50/60 text-xs"
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

      {/* ── Modal: Edit Plan Details ── */}
      <CustomModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setEditingPlan(null);
        }}
        title={`Edit Plan Details: ${editingPlan?.name || "Tier"}`}
        size="lg"
      >
        <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <CustomInput
              label="Plan Display Name"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Starter, Growth, Enterprise"
              required
            />
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Plan Code (Unique Key)</label>
              <input
                type="text"
                disabled
                value={planForm.code}
                className="w-full px-3 py-2 text-xs rounded-sm bg-slate-100 border border-slate-200 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <CustomInput
              label="Monthly Subscription Price (BDT ৳)"
              type="number"
              value={planForm.monthlyPrice.toString()}
              onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: parseFloat(e.target.value) || 0 })}
              required
            />
            <CustomInput
              label="Yearly Subscription Price (BDT ৳)"
              type="number"
              value={planForm.yearlyPrice.toString()}
              onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: parseFloat(e.target.value) || 0 })}
              required
            />

            <CustomInput
              label="Max Staff Users"
              type="number"
              value={planForm.maxUsers.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxUsers: parseInt(e.target.value, 10) || 1 })}
              required
            />
            <CustomInput
              label="Store Outlets / Branches"
              type="number"
              value={planForm.maxBranches.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxBranches: parseInt(e.target.value, 10) || 1 })}
              required
            />

            <CustomInput
              label="Warehouses Allowed"
              type="number"
              value={planForm.maxWarehouses.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxWarehouses: parseInt(e.target.value, 10) || 1 })}
              required
            />
            <CustomInput
              label="POS Terminals Allowed"
              type="number"
              value={planForm.maxPOS.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxPOS: parseInt(e.target.value, 10) || 1 })}
              required
            />

            <CustomInput
              label="Product Catalog Capacity"
              type="number"
              value={planForm.maxProducts.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxProducts: parseInt(e.target.value, 10) || 0 })}
              required
            />
            <CustomInput
              label="Daily API Calls Limit"
              type="number"
              value={planForm.maxAPICallsDaily.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxAPICallsDaily: parseInt(e.target.value, 10) || 0 })}
              required
            />

            <CustomInput
              label="Daily AI Copilot Queries"
              type="number"
              value={planForm.maxAIQueriesDaily.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxAIQueriesDaily: parseInt(e.target.value, 10) || 0 })}
              required
            />
            <CustomInput
              label="Storage Allocation (MB)"
              type="number"
              value={planForm.maxStorageMB.toString()}
              onChange={(e) => setPlanForm({ ...planForm, maxStorageMB: parseInt(e.target.value, 10) || 0 })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">Plan Description / Scope</label>
            <textarea
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-sm border border-slate-200 focus:outline-none focus:border-sky-500 transition resize-none text-slate-700 bg-white"
              rows={2}
              placeholder="Features, target audience, limits summary..."
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-slate-700">
                Included Features & Modules (one per line)
              </label>
              <span className="text-[10px] text-slate-400">Enter each feature on a new line</span>
            </div>
            <textarea
              value={planModulesText}
              onChange={(e) => setPlanModulesText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-sm border border-slate-200 focus:outline-none focus:border-sky-500 transition text-slate-700 bg-white font-mono leading-relaxed"
              rows={5}
              placeholder="Point of Sale (Retail & Touch)&#10;Core Inventory & Low-Stock Alerts&#10;Customer Ledger & Invoicing"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => {
                setIsPlanModalOpen(false);
                setEditingPlan(null);
              }}
            >
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={savingPlan}>
              Save Plan Details
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* SSLCommerz Dummy Payment Gateway Modal */}
      <SslPaymentModal
        open={showSslModal}
        onClose={() => setShowSslModal(false)}
        amount={sslModalAmount}
        orderId={`RENEW-${Date.now().toString().slice(-6)}`}
        customerName="Platform Administrator"
        customerEmail="admin@salepay.io"
        onSuccess={handleSslPaymentSuccess}
      />
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
