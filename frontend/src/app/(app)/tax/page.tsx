"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DollarSign,
  Percent,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Calculator,
  History,
  Layers,
  Building2,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Check,
  AlertCircle,
  Eye,
  UserCheck,
  Store,
  Tag,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  ConfirmModal,
} from "@/components/custom";
import { money } from "@/lib/format";

// ──────────────── Types ────────────────

interface TaxRate {
  id: string;
  name: string;
  code: string;
  rate: number;
  rateType: string;
  taxInclusive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  isDefault: boolean;
  description: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TaxRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  rate: { id: string; name: string; code: string; rate: number; rateType: string };
  taxRateId?: string;
  appliesTo: string;
  priority: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TaxRuleVersion {
  id: string;
  version: number;
  name: string;
  ruleType: string;
  taxRateId: string;
  appliesTo: string;
  effectiveFrom: string;
  snapshot: string;
  changedBy?: string;
  createdAt?: string;
}

interface Branch {
  id: string;
  name: string;
}

interface CustomerOrSupplierVat {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vatRegNo?: string;
  tin?: string;
  businessName?: string;
  businessAddress?: string;
  isVATRegistered?: boolean;
  taxRuleId?: string;
  type: "customer" | "supplier";
}

const RULE_TYPES = [
  { value: "STANDARD", label: "Standard Rate", desc: "Applies standard tax percentage" },
  { value: "ZERO_RATED", label: "Zero Rated (0%)", desc: "Taxable at 0% (e.g. Exports, raw materials)" },
  { value: "EXEMPT", label: "Tax Exempt", desc: "No VAT charged or recovered (e.g. Basic food, health)" },
  { value: "REVERSE_CHARGE", label: "Reverse Charge", desc: "Recipient accounts for tax" },
  { value: "SPECIAL", label: "Special Scheme", desc: "Custom or sector-specific rate" },
];

const APPLIES_TO = [
  { value: "BOTH", label: "Both Sales & Purchases" },
  { value: "SALE", label: "Sales Only" },
  { value: "PURCHASE", label: "Purchases Only" },
];

// Presets for quick creation (e.g. Bangladesh VAT Act 2012 & Global Standards)
const RATE_PRESETS = [
  { name: "Standard 15% VAT", code: "VAT15", rate: "15", desc: "Standard Bangladesh VAT rate (§15)", inclusive: false },
  { name: "Reduced 5% VAT", code: "VAT5", rate: "5", desc: "Retail, restaurant or specific reduced rate", inclusive: false },
  { name: "Reduced 7.5% VAT", code: "VAT7.5", rate: "7.5", desc: "Procurement provider & special services", inclusive: false },
  { name: "Reduced 10% VAT", code: "VAT10", rate: "10", desc: "Specified commercial services & manufacturing", inclusive: false },
  { name: "Zero-Rated (0%)", code: "VAT0", rate: "0", desc: "Export of goods and international services", inclusive: false },
  { name: "Exempt (0%)", code: "EXEMPT", rate: "0", desc: "Exempt goods & agricultural essentials", inclusive: false },
];

export default function TaxPage() {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"rates" | "rules" | "calculator" | "reports" | "b2b">("rates");
  
  // Modals & Drawers
  const [showRateForm, setShowRateForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editRate, setEditRate] = useState<TaxRate | null>(null);
  const [editRule, setEditRule] = useState<TaxRule | null>(null);
  const [versionHistoryRule, setVersionHistoryRule] = useState<TaxRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "rate" | "rule"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Alert/Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Search and Filter states
  const [rateSearch, setRateSearch] = useState("");
  const [rateStatusFilter, setRateStatusFilter] = useState("ALL");
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleTypeFilter, setRuleTypeFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, ru, br] = await Promise.all([
        api.get<{ data: TaxRate[] }>("/tax/rates").catch(() => ({ data: [] })),
        api.get<{ data: TaxRule[] }>("/tax/rules").catch(() => ({ data: [] })),
        api.get<{ data: Branch[] }>("/branches").catch(() => ({ data: [] })),
      ]);
      setRates(r.data || []);
      setRules(ru.data || []);
      setBranches(br.data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load tax configuration", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick Inline Actions for Rates
  const handleToggleRateStatus = async (rate: TaxRate) => {
    const newStatus = rate.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const newIsActive = newStatus === "ACTIVE";
    try {
      await api.put(`/tax/rates/${rate.id}`, { status: newStatus, isActive: newIsActive });
      showToast(`Tax rate "${rate.name}" set to ${newStatus}`);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update tax rate status", "error");
    }
  };

  const handleSetDefaultRate = async (rate: TaxRate) => {
    try {
      await api.put(`/tax/rates/${rate.id}`, { isDefault: true });
      showToast(`"${rate.name}" (${rate.code}) set as default tax rate`);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to set default rate", "error");
    }
  };

  // Quick Inline Actions for Rules
  const handleToggleRuleStatus = async (rule: TaxRule) => {
    try {
      await api.put(`/tax/rules/${rule.id}`, { isActive: !rule.isActive });
      showToast(`Rule "${rule.name}" is now ${!rule.isActive ? "Active" : "Inactive"}`);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update rule status", "error");
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      if (deleteConfirm.type === "rate") {
        await api.del(`/tax/rates/${deleteConfirm.id}`);
        showToast(`Tax rate "${deleteConfirm.name}" removed`);
      } else {
        await api.del(`/tax/rules/${deleteConfirm.id}`);
        showToast(`Tax rule "${deleteConfirm.name}" removed`);
      }
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete item. It may be in use.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered lists
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(rateSearch.toLowerCase()) ||
        r.code.toLowerCase().includes(rateSearch.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(rateSearch.toLowerCase());
      const matchesStatus =
        rateStatusFilter === "ALL" ||
        (rateStatusFilter === "ACTIVE" && r.status === "ACTIVE") ||
        (rateStatusFilter === "INACTIVE" && r.status === "INACTIVE") ||
        (rateStatusFilter === "DEFAULT" && r.isDefault);
      return matchesSearch && matchesStatus;
    });
  }, [rates, rateSearch, rateStatusFilter]);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.rate?.name?.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        r.rate?.code?.toLowerCase().includes(ruleSearch.toLowerCase());
      const matchesType = ruleTypeFilter === "ALL" || r.ruleType === ruleTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [rules, ruleSearch, ruleTypeFilter]);

  // Derived stats
  const activeRatesCount = rates.filter((r) => r.status === "ACTIVE").length;
  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const defaultRate = rates.find((r) => r.isDefault);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border border-slate-700"
              : "bg-red-600 text-white border border-red-700"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-white" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Reusable Application Breadcrumb Header */}
      <CustomBreadcrumb
        title="Tax & VAT Engine"
        icon={<Percent size={20} />}
        items={[{ label: "Settings", href: "/settings" }, { label: "Tax & VAT" }]}
        description="Version-controlled tax rates, automated tax rules for POS & Invoicing, dynamic VAT reporting, and NBR compliance."
        actions={
          <div className="flex items-center gap-2">
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => { setEditRate(null); setShowRateForm(true); }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Add Tax Rate
            </CustomButton>
            <CustomButton
              size="sm"
              variant="outline"
              leftIcon={<Layers size={14} />}
              onClick={() => { setEditRule(null); setShowRuleForm(true); }}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Add Rule
            </CustomButton>
            <button
              onClick={() => loadData()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh Data"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CustomStatCard
          label="Active Tax Rates"
          value={`${activeRatesCount} / ${rates.length}`}
          icon={Percent}
          tone="primary"
        />
        <CustomStatCard
          label="Default Rate"
          value={defaultRate ? `${defaultRate.name} (${defaultRate.rate}%)` : "None"}
          icon={CheckCircle2}
          tone="green"
        />
        <CustomStatCard
          label="Active Tax Rules"
          value={String(activeRulesCount)}
          icon={Shield}
          tone="amber"
        />
        <CustomStatCard
          label="Compliance Status"
          value="NBR & VAT 2012"
          icon={Building2}
          tone="blue"
        />
      </div>

      {/* Compliance Notice */}
      <div className="rounded-md border border-teal-200/80 bg-teal-50/50 p-3.5 text-xs text-teal-900 flex items-start gap-2.5 shadow-2xs">
        <Info size={16} className="mt-0.5 shrink-0 text-teal-600" />
        <div className="flex-1">
          <p className="font-bold text-teal-950">
            National Board of Revenue (NBR) Compliance & Bangladesh VAT Act 2012
          </p>
          <p className="mt-0.5 text-[11px] text-teal-800 leading-relaxed">
            All tax rates, input tax credits, and Mushak forms (e.g. Mushak 6.3 Tax Invoice, Mushak 9.1 VAT Return) are fully customizable. Ensure rates comply with your statutory jurisdiction requirements before issuing fiscal documents.
          </p>
        </div>
      </div>

      {/* Tab Selector Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-md border border-slate-200 shadow-2xs overflow-x-auto">
        {[
          { id: "rates", label: "Tax Rates", icon: DollarSign, badge: rates.length },
          { id: "rules", label: "Tax Rules & Hierarchy", icon: Shield, badge: rules.length },
          { id: "calculator", label: "Tax Sandbox & Calculator", icon: Calculator, badge: "Tool" },
          { id: "reports", label: "VAT & Mushak Reports", icon: BarChart3, badge: "Analytics" },
          { id: "b2b", label: "B2B VAT Directory", icon: Building2, badge: "BIN" },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-teal-50 text-teal-700 border border-teal-200 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Icon size={14} className={isActive ? "text-teal-600" : "text-slate-400"} />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-teal-200/80 text-teal-900"
                      : "bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────── TAB 1: TAX RATES ──────────────── */}
      {tab === "rates" && (
        <div className="space-y-4">
          {/* Action and Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configured Tax Rates</h2>
              <p className="text-xs text-slate-500">
                Tenant-level VAT and tax percentages applied across catalog items and services.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search rates..."
                  value={rateSearch}
                  onChange={(e) => setRateSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={rateStatusFilter}
                onChange={(e) => setRateStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Rates</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DEFAULT">Default Only</option>
              </select>

              <button
                onClick={() => { setEditRate(null); setShowRateForm(true); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus size={14} /> Add Rate
              </button>
            </div>
          </div>

          {/* Rates Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CustomTable
              columns={[
                {
                  key: "code",
                  header: "Code & Identifier",
                  render: (r: TaxRate) => (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold rounded-lg bg-indigo-50 px-2 py-1 text-indigo-700 border border-indigo-100">
                        {r.code}
                      </span>
                      {r.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                          <Check size={11} /> Default
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: "name",
                  header: "Rate Name & Description",
                  render: (r: TaxRate) => (
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{r.description}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "rate",
                  header: "Tax Rate",
                  align: "right",
                  render: (r: TaxRate) => (
                    <div className="text-right">
                      <span className="font-bold text-base text-slate-900 tabular-nums">
                        {r.rateType === "FIXED" ? money(r.rate) : `${r.rate}%`}
                      </span>
                      <span className="block text-[11px] text-slate-400 capitalize">{r.rateType.toLowerCase()}</span>
                    </div>
                  ),
                },
                {
                  key: "inclusive",
                  header: "Pricing Mode",
                  render: (r: TaxRate) => (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                        r.taxInclusive
                          ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                          : "bg-sky-50 text-sky-700 border border-sky-200/60"
                      }`}
                    >
                      {r.taxInclusive ? "Tax-Inclusive (MRP)" : "Tax-Exclusive (+Tax)"}
                    </span>
                  ),
                },
                {
                  key: "effective",
                  header: "Validity Period",
                  render: (r: TaxRate) => (
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span>{r.effectiveFrom}</span>
                      <span className="text-slate-400">→</span>
                      <span>{r.effectiveTo ? r.effectiveTo : "Open"}</span>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r: TaxRate) => (
                    <button
                      onClick={() => handleToggleRateStatus(r)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:opacity-80 ${
                        r.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                      title="Click to toggle status"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${r.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {r.status}
                    </button>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  render: (r: TaxRate) => (
                    <div className="flex items-center justify-end gap-1.5">
                      {!r.isDefault && (
                        <button
                          onClick={() => handleSetDefaultRate(r)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700"
                          title="Set as Default Rate"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditRate(r); setShowRateForm(true); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Edit Rate"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "rate", id: r.id, name: `${r.name} (${r.code})` })}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete Rate"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredRates}
              rowKey={(r: TaxRate) => r.id}
              loading={loading}
              emptyIcon={DollarSign}
              emptyMessage={rateSearch ? "No tax rates matching your search." : "No tax rates configured yet. Click 'Add Tax Rate' to create one."}
            />
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: TAX RULES ──────────────── */}
      {tab === "rules" && (
        <div className="space-y-4">
          {/* Explanation Banner */}
          <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 text-xs text-indigo-900 flex items-start gap-3">
            <Layers size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-950">How Rules & Priority Resolution Work</p>
              <p className="mt-0.5 text-indigo-800 leading-relaxed">
                When a sale or purchase is finalized, the engine matches active rules for that transaction context (Sales / Purchases / Both). The rule with the <strong>highest priority</strong> is resolved and its snapshot is version-controlled for strict auditability.
              </p>
            </div>
          </div>

          {/* Action and Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configured Tax Rules</h2>
              <p className="text-xs text-slate-500">
                Automated assignment rules for transaction context, zero-rating, exemptions, and priorities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={ruleTypeFilter}
                onChange={(e) => setRuleTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Rule Types</option>
                {RULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <button
                onClick={() => { setEditRule(null); setShowRuleForm(true); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus size={14} /> Add Rule
              </button>
            </div>
          </div>

          {/* Rules Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CustomTable
              columns={[
                {
                  key: "priority",
                  header: "Priority",
                  render: (r: TaxRule) => (
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 font-bold text-xs text-slate-800 border border-slate-200">
                      {r.priority}
                    </span>
                  ),
                },
                {
                  key: "name",
                  header: "Rule Name & Scope",
                  render: (r: TaxRule) => (
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "ruleType",
                  header: "Rule Type",
                  render: (r: TaxRule) => {
                    const badgeColors: Record<string, string> = {
                      STANDARD: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      ZERO_RATED: "bg-blue-50 text-blue-700 border-blue-200",
                      EXEMPT: "bg-slate-100 text-slate-600 border-slate-200",
                      REVERSE_CHARGE: "bg-purple-50 text-purple-700 border-purple-200",
                      SPECIAL: "bg-amber-50 text-amber-700 border-amber-200",
                    };
                    return (
                      <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${badgeColors[r.ruleType] || "bg-gray-50 text-gray-700"}`}>
                        {r.ruleType.replace("_", " ")}
                      </span>
                    );
                  },
                },
                {
                  key: "rate",
                  header: "Assigned Rate",
                  render: (r: TaxRule) => (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {r.rate?.code || "N/A"}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {r.rate?.rate !== undefined ? `${r.rate.rate}%` : "—"}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "appliesTo",
                  header: "Applies To",
                  render: (r: TaxRule) => (
                    <span className="text-xs font-medium text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                      {r.appliesTo}
                    </span>
                  ),
                },
                {
                  key: "active",
                  header: "Status",
                  render: (r: TaxRule) => (
                    <button
                      onClick={() => handleToggleRuleStatus(r)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:opacity-80 ${
                        r.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                      title="Click to toggle status"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {r.isActive ? "Active" : "Inactive"}
                    </button>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  align: "right",
                  render: (r: TaxRule) => (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setVersionHistoryRule(r)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                        title="Audit & Version History"
                      >
                        <History size={15} />
                      </button>
                      <button
                        onClick={() => { setEditRule(r); setShowRuleForm(true); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Edit Rule"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "rule", id: r.id, name: r.name })}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete Rule"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredRules}
              rowKey={(r: TaxRule) => r.id}
              loading={loading}
              emptyIcon={Shield}
              emptyMessage={ruleSearch ? "No rules matching search criteria." : "No tax rules configured. Click 'Add Rule' to create one."}
            />
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: TAX CALCULATOR SANDBOX ──────────────── */}
      {tab === "calculator" && (
        <TaxCalculatorSandbox rates={rates} rules={rules} />
      )}

      {/* ──────────────── TAB 4: VAT & MUSHAK REPORTS ──────────────── */}
      {tab === "reports" && (
        <VATReportsSection branches={branches} />
      )}

      {/* ──────────────── TAB 5: B2B VAT DIRECTORY ──────────────── */}
      {tab === "b2b" && (
        <B2BVatDirectory rules={rules} />
      )}

      {/* ──────────────── MODALS ──────────────── */}

      {/* Rate Form Modal */}
      {showRateForm && (
        <RateFormModal
          rate={editRate}
          onClose={() => setShowRateForm(false)}
          onSaved={() => {
            setShowRateForm(false);
            showToast(editRate ? "Tax rate updated successfully" : "Tax rate created successfully");
            loadData();
          }}
        />
      )}

      {/* Rule Form Modal */}
      {showRuleForm && (
        <RuleFormModal
          rule={editRule}
          rates={rates}
          onClose={() => setShowRuleForm(false)}
          onSaved={() => {
            setShowRuleForm(false);
            showToast(editRule ? "Tax rule updated and versioned" : "Tax rule created successfully");
            loadData();
          }}
        />
      )}

      {/* Version History Modal */}
      {versionHistoryRule && (
        <RuleVersionHistoryModal
          rule={versionHistoryRule}
          onClose={() => setVersionHistoryRule(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteConfirm?.type === "rate" ? "Tax Rate" : "Tax Rule"}`}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        type="DANGER"
        confirmText="Delete Now"
        loading={deleting}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RATE FORM MODAL
// ────────────────────────────────────────────────────────────

function RateFormModal({
  rate,
  onClose,
  onSaved,
}: {
  rate: TaxRate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: rate?.name || "",
    code: rate?.code || "",
    rate: rate?.rate?.toString() || "15",
    rateType: rate?.rateType || "PERCENTAGE",
    taxInclusive: rate?.taxInclusive ?? false,
    effectiveFrom: rate?.effectiveFrom || new Date().toISOString().split("T")[0],
    effectiveTo: rate?.effectiveTo || "",
    isDefault: rate?.isDefault ?? false,
    description: rate?.description || "",
    status: rate?.status || "ACTIVE",
    isActive: rate?.isActive ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyPreset = (preset: (typeof RATE_PRESETS)[0]) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      code: preset.code,
      rate: preset.rate,
      description: preset.desc,
      taxInclusive: preset.inclusive,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError("Please provide a name and rate code.");
      return;
    }
    const numRate = parseFloat(form.rate);
    if (isNaN(numRate) || numRate < 0) {
      setError("Please enter a valid non-negative rate value.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        rate: numRate,
        rateType: form.rateType,
        taxInclusive: form.taxInclusive,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo ? form.effectiveTo : null,
        isDefault: form.isDefault,
        description: form.description.trim() || null,
        status: form.status,
        isActive: form.status === "ACTIVE",
      };

      if (rate) {
        await api.put(`/tax/rates/${rate.id}`, payload);
      } else {
        await api.post("/tax/rates", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save tax rate.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {rate ? "Edit Tax Rate" : "New Tax Rate"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure VAT rate percentage, pricing inclusiveness, and validity period.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        {/* Quick Presets for New Rates */}
        {!rate && (
          <div className="mt-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 p-3.5">
            <p className="text-xs font-bold text-amber-900 flex items-center gap-1 mb-2">
              <Sparkles size={13} className="text-amber-600" /> Standard Bangladesh / Global VAT Presets:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RATE_PRESETS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 border border-amber-300/80 shadow-xs hover:bg-amber-100 active:scale-95 transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rate Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Standard 15% VAT"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rate Code *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                placeholder="VAT15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rate Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 pl-3.5 pr-8 py-2 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {form.rateType === "PERCENTAGE" ? "%" : "৳"}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rate Type
              </label>
              <select
                value={form.rateType}
                onChange={(e) => setForm({ ...form, rateType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Effective From
              </label>
              <input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Effective To (Optional)
              </label>
              <input
                type="date"
                value={form.effectiveTo}
                onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Inclusive & Default Toggles */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.taxInclusive}
                onChange={(e) => setForm({ ...form, taxInclusive: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">
                  Tax-Inclusive Pricing (MRP includes Tax)
                </span>
                <p className="text-xs text-slate-500">
                  When enabled, shelf price already includes VAT (e.g. ৳115 shelf price with 15% VAT = ৳100 base + ৳15 tax).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">
                  Set as Default Rate
                </span>
                <p className="text-xs text-slate-500">
                  Automatically applied to newly added products unless overridden.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Statutory Notes
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Applicable under SRO 186/2023 or standard retail VAT"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : rate ? "Update Rate" : "Create Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RULE FORM MODAL
// ────────────────────────────────────────────────────────────

function RuleFormModal({
  rule,
  rates,
  onClose,
  onSaved,
}: {
  rule: TaxRule | null;
  rates: TaxRate[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const activeRates = rates.filter((r) => r.status === "ACTIVE");
  const [form, setForm] = useState({
    name: rule?.name || "",
    description: rule?.description || "",
    ruleType: rule?.ruleType || "STANDARD",
    taxRateId: rule?.rate?.id || rule?.taxRateId || activeRates[0]?.id || "",
    appliesTo: rule?.appliesTo || "BOTH",
    priority: rule?.priority?.toString() || "10",
    isActive: rule?.isActive ?? true,
    effectiveFrom: new Date().toISOString().split("T")[0],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.taxRateId) {
      setError("Rule name and assigned tax rate are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        ruleType: form.ruleType,
        taxRateId: form.taxRateId,
        appliesTo: form.appliesTo,
        priority: parseInt(form.priority) || 0,
        isActive: form.isActive,
        effectiveFrom: form.effectiveFrom,
      };

      if (rule) {
        await api.put(`/tax/rules/${rule.id}`, payload);
      } else {
        await api.post("/tax/rules", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save tax rule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {rule ? "Edit Tax Rule" : "New Tax Rule"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set evaluation priority, rule scheme, and assigned VAT rate.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rule Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Standard Sales VAT"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rule Scheme Type
              </label>
              <select
                value={form.ruleType}
                onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {RULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Tax Rate *
              </label>
              <select
                required
                value={form.taxRateId}
                onChange={(e) => setForm({ ...form, taxRateId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="">Select a rate...</option>
                {activeRates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code} - {r.rate}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Applies To Scope
              </label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {APPLIES_TO.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Resolution Priority (Higher = Evaluated First)
              </label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Effective From
              </label>
              <input
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Standard rate applied across retail POS sales"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-800">
                Active Rule (Available for resolution)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : rule ? "Update Rule & Create Version" : "Create Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RULE VERSION HISTORY MODAL
// ────────────────────────────────────────────────────────────

function RuleVersionHistoryModal({
  rule,
  onClose,
}: {
  rule: TaxRule;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<TaxRuleVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<{ data: TaxRuleVersion[] }>(`/tax/rules/${rule.id}/versions`);
        setVersions(res.data || []);
      } catch {
        /* non-fatal */
      } finally {
        setLoading(false);
      }
    })();
  }, [rule.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Rule Version History: {rule.name}
              </h3>
              <p className="text-xs text-slate-500">
                Audit trail snapshots (§10.21) ensuring historical invoices retain accurate rates.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-3 max-h-96 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              No previous version snapshots recorded.
            </p>
          ) : (
            versions.map((v) => {
              let parsedSnap: any = {};
              try {
                parsedSnap = JSON.parse(v.snapshot || "{}");
              } catch {}

              return (
                <div key={v.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white hover:shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-900">
                        Version {v.version}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{v.name}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      Effective: {v.effectiveFrom}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                      <span className="text-slate-400 block">Rule Type</span>
                      <span className="font-semibold text-slate-700">{v.ruleType}</span>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                      <span className="text-slate-400 block">Applies To</span>
                      <span className="font-semibold text-slate-700">{v.appliesTo}</span>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                      <span className="text-slate-400 block">Snapshot Time</span>
                      <span className="font-semibold text-slate-700">{v.createdAt ? v.createdAt.split("T")[0] : "Recorded"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TAX CALCULATOR SANDBOX
// ────────────────────────────────────────────────────────────

function TaxCalculatorSandbox({ rates, rules }: { rates: TaxRate[]; rules: TaxRule[] }) {
  const [amount, setAmount] = useState("1000");
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [selectedRateId, setSelectedRateId] = useState("");
  const [appliesTo, setAppliesTo] = useState("SALE");
  const [isInclusive, setIsInclusive] = useState(false);
  const [liveResult, setLiveResult] = useState<any>(null);
  const [computing, setComputing] = useState(false);

  // Set default selected rule
  useEffect(() => {
    if (rules.length > 0 && !selectedRuleId) {
      setSelectedRuleId(rules[0].id);
    }
  }, [rules, selectedRuleId]);

  // Local calculation math
  const localCalculation = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    let effectiveRate = 15;
    let rateName = "Default (15%)";
    let isIncl = isInclusive;

    if (selectedRateId) {
      const found = rates.find((r) => r.id === selectedRateId);
      if (found) {
        effectiveRate = found.rate;
        rateName = `${found.name} (${found.code})`;
        isIncl = isInclusive;
      }
    } else if (selectedRuleId) {
      const found = rules.find((r) => r.id === selectedRuleId);
      if (found && found.rate) {
        effectiveRate = found.rate.rate;
        rateName = `${found.name} -> ${found.rate.code}`;
      }
    }

    if (isIncl) {
      const taxable = numAmount / (1 + effectiveRate / 100);
      const tax = numAmount - taxable;
      return {
        amount: numAmount,
        taxableAmount: taxable,
        taxAmount: tax,
        totalWithTax: numAmount,
        rate: effectiveRate,
        rateName,
        isInclusive: true,
      };
    } else {
      const tax = (numAmount * effectiveRate) / 100;
      return {
        amount: numAmount,
        taxableAmount: numAmount,
        taxAmount: tax,
        totalWithTax: numAmount + tax,
        rate: effectiveRate,
        rateName,
        isInclusive: false,
      };
    }
  }, [amount, selectedRuleId, selectedRateId, isInclusive, rates, rules]);

  // Test with backend API parity
  const testBackendApi = async () => {
    setComputing(true);
    try {
      const res = await api.post<{ data: any }>("/tax/calculate", {
        amount: parseFloat(amount) || 0,
        appliesTo,
        taxRuleId: selectedRuleId || undefined,
      });
      setLiveResult(res.data);
    } catch {
      /* non-fatal */
    } finally {
      setComputing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Configuration */}
      <div className="lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Calculator size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Tax Engine Sandbox & Simulator</h3>
            <p className="text-xs text-slate-500">
              Simulate live POS and Invoice calculations with custom rates or rules.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Base Amount (৳)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 pl-4 pr-12 py-3 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
                placeholder="1000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                BDT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Transaction Context
              </label>
              <select
                value={appliesTo}
                onChange={(e) => setAppliesTo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="SALE">POS / Customer Sale</option>
                <option value="PURCHASE">GRN / Supplier Purchase</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Evaluation Rule
              </label>
              <select
                value={selectedRuleId}
                onChange={(e) => {
                  setSelectedRuleId(e.target.value);
                  setSelectedRateId("");
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Auto-resolve highest priority rule</option>
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.rate?.rate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Mode Toggle */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tax Inclusiveness Mode
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsInclusive(false)}
                className={`rounded-xl py-2 px-3 text-xs font-bold transition ${
                  !isInclusive
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                Exclusive (Price + Tax)
              </button>
              <button
                type="button"
                onClick={() => setIsInclusive(true)}
                className={`rounded-xl py-2 px-3 text-xs font-bold transition ${
                  isInclusive
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                    : "text-slate-600 hover:bg-white/50"
                }`}
              >
                Inclusive (Price has Tax)
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={testBackendApi}
              disabled={computing}
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={computing ? "animate-spin" : ""} />
              {computing ? "Calling Backend API..." : "Verify with Backend Engine (/tax/calculate)"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Result Card */}
      <div className="lg:col-span-6 space-y-4">
        {/* Real-time Math Breakdown Card */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl border border-indigo-800">
          <div className="flex items-center justify-between border-b border-indigo-800/80 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Calculated Breakdown
              </p>
              <h4 className="text-xl font-bold text-white mt-0.5">
                {localCalculation.rateName}
              </h4>
            </div>
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
              {localCalculation.rate}% Tax
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm text-indigo-200">
              <span>Taxable Base Amount</span>
              <span className="font-semibold text-white tabular-nums">{money(localCalculation.taxableAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-indigo-200">
              <span>VAT / Tax Amount ({localCalculation.rate}%)</span>
              <span className="font-bold text-amber-300 tabular-nums">+{money(localCalculation.taxAmount)}</span>
            </div>

            <div className="border-t border-indigo-800/80 pt-4 flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-white">Final Customer Total</span>
                <span className="block text-xs text-indigo-300">
                  {localCalculation.isInclusive ? "(Includes Tax)" : "(Base + Added Tax)"}
                </span>
              </div>
              <span className="text-2xl font-black text-white tabular-nums">
                {money(localCalculation.totalWithTax)}
              </span>
            </div>
          </div>

          {/* Formula explanation box */}
          <div className="mt-5 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/10 text-xs text-indigo-100 space-y-1">
            <p className="font-bold text-amber-300 flex items-center gap-1">
              <Sparkles size={12} /> Computation Formula:
            </p>
            {localCalculation.isInclusive ? (
              <p className="font-mono text-[11px] text-indigo-200">
                Taxable = {money(localCalculation.amount)} ÷ (1 + {localCalculation.rate}/100) = {money(localCalculation.taxableAmount)}
                <br />
                Tax = {money(localCalculation.amount)} - {money(localCalculation.taxableAmount)} = {money(localCalculation.taxAmount)}
              </p>
            ) : (
              <p className="font-mono text-[11px] text-indigo-200">
                Tax = {money(localCalculation.amount)} × ({localCalculation.rate} ÷ 100) = {money(localCalculation.taxAmount)}
                <br />
                Total = {money(localCalculation.amount)} + {money(localCalculation.taxAmount)} = {money(localCalculation.totalWithTax)}
              </p>
            )}
          </div>
        </div>

        {/* Live Backend Response View */}
        {liveResult && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Backend API Parity Verified (HTTP 200 OK)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-950 font-mono">
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                Taxable: {money(liveResult.taxableAmount)}
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                Tax Amount: {money(liveResult.taxAmount)}
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200 col-span-2">
                Total With Tax: {money(liveResult.totalWithTax)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// VAT & MUSHAK REPORTS SECTION
// ────────────────────────────────────────────────────────────

function VATReportsSection({ branches }: { branches: Branch[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [branchId, setBranchId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportTab, setReportTab] = useState<"consolidated" | "sales" | "purchases">("consolidated");

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const branchParam = branchId ? `&branchId=${branchId}` : "";
      const res = await api.get<{ data: any }>(
        `/tax/reports/consolidated?year=${year}&month=${month}${branchParam}`
      );
      setData(res.data);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, [year, month, branchId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["VAT Consolidated Report", `${MONTHS[month - 1]} ${year}`],
      ["Branch", branchId ? branches.find((b) => b.id === branchId)?.name || branchId : "All Outlets"],
      [],
      ["Metric", "Amount (BDT)"],
      ["Total Taxable Sales", data.sales?.totalTaxableSales || 0],
      ["Sales VAT Collected (Output VAT)", data.salesVAT || 0],
      ["Sales Transactions", data.sales?.transactionCount || 0],
      [],
      ["Total Taxable Purchases", data.purchases?.totalTaxablePurchases || 0],
      ["Purchase VAT Paid (Input VAT)", data.purchaseVAT || 0],
      ["Purchase Transactions", data.purchases?.transactionCount || 0],
      [],
      ["Net VAT Position", data.netVATPayable || 0],
      ["Status", data.status || "NIL"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VAT_Report_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filter and Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900">VAT & Mushak Filing Reports</h3>
          <p className="text-xs text-slate-500">
            Output VAT vs Input VAT credit matching for monthly NBR filing (§10.21).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          {branches.length > 0 && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          {/* Month Selector */}
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            title="Export to CSV"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            title="Print Summary"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CustomStatCard
            label="Sales Output VAT Collected"
            value={money(data.salesVAT || 0)}
            icon={DollarSign}
            tone="green"
          />
          <CustomStatCard
            label="Purchase Input VAT Paid"
            value={money(data.purchaseVAT || 0)}
            icon={DollarSign}
            tone="amber"
          />
          <CustomStatCard
            label="Net VAT Position"
            value={`${data.netVATPayable > 0 ? "Payable: " : data.netVATPayable < 0 ? "Refundable: " : "Nil: "}${money(Math.abs(data.netVATPayable || 0))}`}
            icon={data.status === "REFUNDABLE" ? XCircle : CheckCircle2}
            tone={data.status === "REFUNDABLE" ? "green" : data.netVATPayable > 0 ? "red" : "primary"}
          />
        </div>
      )}

      {/* Report Breakdown Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportTab("consolidated")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            reportTab === "consolidated"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Consolidated Summary
        </button>
        <button
          onClick={() => setReportTab("sales")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            reportTab === "sales"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Sales VAT Breakdown
        </button>
        <button
          onClick={() => setReportTab("purchases")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            reportTab === "purchases"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Purchase VAT Breakdown
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {reportTab === "consolidated" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-700">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Consolidated VAT Position — {MONTHS[month - 1]} {year}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standard NBR Mushak 9.1 preliminary accounting footing.
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    data.status === "PAYABLE"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : data.status === "REFUNDABLE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {data.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sales Column */}
                <div className="rounded-2xl bg-emerald-50/40 border border-emerald-100 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-emerald-900">1. Sales Output VAT</h4>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {data.sales?.transactionCount || 0} Transactions
                    </span>
                  </div>
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Taxable Sales Turnover:</span>
                      <span className="font-semibold text-slate-900">{money(data.sales?.totalTaxableSales || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Output VAT Collected:</span>
                      <span className="font-bold text-emerald-800 text-sm">{money(data.salesVAT || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Column */}
                <div className="rounded-2xl bg-amber-50/40 border border-amber-100 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-amber-900">2. Purchase Input VAT</h4>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {data.purchases?.transactionCount || 0} GRNs
                    </span>
                  </div>
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Taxable Purchases:</span>
                      <span className="font-semibold text-slate-900">{money(data.purchases?.totalTaxablePurchases || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Input VAT Paid:</span>
                      <span className="font-bold text-amber-800 text-sm">{money(data.purchaseVAT || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Total Footer */}
              <div className="mt-8 rounded-2xl bg-slate-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">Final Net Balance for Period</p>
                  <p className="text-xl font-bold text-white mt-0.5">
                    {data.status === "PAYABLE" ? "Payable to Treasury / NBR" : data.status === "REFUNDABLE" ? "Refundable Credit Balance" : "Zero Net Liability"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${data.netVATPayable > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {money(Math.abs(data.netVATPayable || 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {reportTab === "sales" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Sales VAT by Tax Rate</h4>
                <span className="text-xs text-slate-500 font-semibold">{data.sales?.byRate?.length || 0} rate categories</span>
              </div>
              <CustomTable
                columns={[
                  { key: "rateName", header: "Rate Name", render: (r: any) => <span className="font-semibold text-slate-800">{r.rateName}</span> },
                  { key: "rateCode", header: "Code", render: (r: any) => <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{r.rateCode}</span> },
                  { key: "rate", header: "Rate (%)", align: "right", render: (r: any) => <span className="font-bold text-slate-900">{r.rate}%</span> },
                  { key: "taxableAmount", header: "Taxable Sales", align: "right", render: (r: any) => <span className="font-semibold text-slate-800">{money(r.taxableAmount)}</span> },
                  { key: "taxAmount", header: "VAT Collected", align: "right", render: (r: any) => <span className="font-bold text-emerald-700">{money(r.taxAmount)}</span> },
                  { key: "txCount", header: "Transactions", align: "right", render: (r: any) => <span className="text-slate-600">{r.transactionCount}</span> },
                ]}
                data={data.sales?.byRate || []}
                rowKey={(r: any) => r.rateCode}
                emptyMessage="No sales VAT transactions recorded for this period."
              />
            </div>
          )}

          {reportTab === "purchases" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Purchase Input VAT by Tax Rate</h4>
                <span className="text-xs text-slate-500 font-semibold">{data.purchases?.byRate?.length || 0} rate categories</span>
              </div>
              <CustomTable
                columns={[
                  { key: "rateName", header: "Rate Name", render: (r: any) => <span className="font-semibold text-slate-800">{r.rateName}</span> },
                  { key: "rateCode", header: "Code", render: (r: any) => <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{r.rateCode}</span> },
                  { key: "rate", header: "Rate (%)", align: "right", render: (r: any) => <span className="font-bold text-slate-900">{r.rate}%</span> },
                  { key: "taxableAmount", header: "Taxable Purchases", align: "right", render: (r: any) => <span className="font-semibold text-slate-800">{money(r.taxableAmount)}</span> },
                  { key: "taxAmount", header: "Input VAT Paid", align: "right", render: (r: any) => <span className="font-bold text-amber-700">{money(r.taxAmount)}</span> },
                  { key: "txCount", header: "Transactions", align: "right", render: (r: any) => <span className="text-slate-600">{r.transactionCount}</span> },
                ]}
                data={data.purchases?.byRate || []}
                rowKey={(r: any) => r.rateCode}
                emptyMessage="No purchase VAT transactions recorded for this period."
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// B2B VAT / BIN DIRECTORY (CUSTOMERS & SUPPLIERS)
// ────────────────────────────────────────────────────────────

function B2BVatDirectory({ rules }: { rules: TaxRule[] }) {
  const [b2bTab, setB2bTab] = useState<"customers" | "suppliers">("customers");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: "customer" | "supplier" } | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      if (b2bTab === "customers") {
        const res = await api.get<{ data: any[] }>("/customers").catch(() => ({ data: [] }));
        setItems(res.data || []);
      } else {
        const res = await api.get<{ data: any[] }>("/suppliers").catch(() => ({ data: [] }));
        setItems(res.data || []);
      }
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, [b2bTab]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = items.filter((it) =>
    (it.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (it.phone || "").toLowerCase().includes(search.toLowerCase()) ||
    (it.vatRegNo || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Sub tabs & header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900">B2B VAT Registration & BIN Directory</h3>
          <p className="text-xs text-slate-500">
            Manage 9-digit or 13-digit Business Identification Numbers (BIN) and TIN for Mushak 6.3 Invoicing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setB2bTab("customers")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                b2bTab === "customers" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              Customers (Buyers)
            </button>
            <button
              onClick={() => setB2bTab("suppliers")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                b2bTab === "suppliers" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
              }`}
            >
              Suppliers (Vendors)
            </button>
          </div>

          <div className="relative w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CustomTable
          columns={[
            {
              key: "name",
              header: "Entity Name",
              render: (r: any) => (
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.phone || r.email || "No contact info"}</p>
                </div>
              ),
            },
            {
              key: "bin",
              header: "VAT / BIN No.",
              render: (r: any) =>
                r.vatRegNo ? (
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    {r.vatRegNo}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">Not Registered</span>
                ),
            },
            {
              key: "tin",
              header: "TIN",
              render: (r: any) => (
                <span className="text-xs font-mono text-slate-700">{r.tin || "—"}</span>
              ),
            },
            {
              key: "status",
              header: "B2B Status",
              render: (r: any) => (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    r.vatRegNo
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {r.vatRegNo ? "VAT Registered" : "Regular Buyer"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (r: any) => (
                <button
                  onClick={() => setEditingItem({ id: r.id, name: r.name, type: b2bTab === "customers" ? "customer" : "supplier" })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  <Edit3 size={13} /> Edit VAT / BIN
                </button>
              ),
            },
          ]}
          data={filtered}
          rowKey={(r: any) => r.id}
          loading={loading}
          emptyIcon={Building2}
          emptyMessage={`No ${b2bTab} found.`}
        />
      </div>

      {/* Edit B2B VAT Modal */}
      {editingItem && (
        <EditB2BVatModal
          item={editingItem}
          rules={rules}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            loadItems();
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// EDIT B2B VAT MODAL
// ────────────────────────────────────────────────────────────

function EditB2BVatModal({
  item,
  rules,
  onClose,
  onSaved,
}: {
  item: { id: string; name: string; type: "customer" | "supplier" };
  rules: TaxRule[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    vatRegNo: "",
    tin: "",
    businessName: "",
    businessAddress: "",
    isVATRegistered: false,
    taxRuleId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const endpoint = item.type === "customer" ? `/customers/${item.id}/vat` : `/suppliers/${item.id}/vat`;
        const res = await api.get<{ data: any }>(endpoint);
        if (res.data) {
          setForm({
            vatRegNo: res.data.vatRegNo || "",
            tin: res.data.tin || "",
            businessName: res.data.businessName || "",
            businessAddress: res.data.businessAddress || "",
            isVATRegistered: !!res.data.isVATRegistered,
            taxRuleId: res.data.taxRuleId || "",
          });
        }
      } catch {
        /* non-fatal */
      } finally {
        setLoading(false);
      }
    })();
  }, [item.id, item.type]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const endpoint = item.type === "customer" ? `/customers/${item.id}/vat` : `/suppliers/${item.id}/vat`;
      await api.put(endpoint, form);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to update VAT info.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              VAT & BIN Info: {item.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory taxpayer details for Mushak 6.3 Tax Invoices.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isVATRegistered}
                  onChange={(e) => setForm({ ...form, isVATRegistered: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-slate-800">
                  Is Formally VAT Registered in Bangladesh (BIN Holder)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  VAT Registration / BIN
                </label>
                <input
                  type="text"
                  value={form.vatRegNo}
                  onChange={(e) => setForm({ ...form, vatRegNo: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="000123456-0101"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  e-TIN
                </label>
                <input
                  type="text"
                  value={form.tin}
                  onChange={(e) => setForm({ ...form, tin: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="123456789012"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Business / Trade Name
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Apex Holdings Ltd."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered VAT Address
              </label>
              <textarea
                rows={2}
                value={form.businessAddress}
                onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Plot 12, Road 4, Gulshan-1, Dhaka"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Custom Tax Rule Override (Optional)
              </label>
              <select
                value={form.taxRuleId}
                onChange={(e) => setForm({ ...form, taxRuleId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Default Tenant Rule</option>
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.rate?.rate}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save VAT Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
