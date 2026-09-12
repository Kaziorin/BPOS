"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Target,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  GitBranch,
  FolderTree,
  Building2,
  Trash2,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Search,
  Scale,
  DollarSign,
  Percent,
  Check,
  Edit3,
  SlidersHorizontal,
  Sparkles,
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
import { money, dateOnly, dateTime } from "@/lib/format";

interface BudgetRow {
  id: string;
  name: string;
  scopeType: string;
  scopeId: string;
  scopeName?: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  actual?: number;
  variance?: number;
  variancePct?: number;
  achievementPct?: number;
  onTrack?: boolean;
  note?: string | null;
  status: string;
}

interface VarianceResp {
  budgets: BudgetRow[];
  totals: {
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
  };
}

interface ScopeOpt {
  id: string;
  name: string;
}

export default function TargetsPage() {
  const [data, setData] = useState<VarianceResp>({
    budgets: [],
    totals: { totalBudget: 0, totalActual: 0, totalVariance: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [scopeTypeFilter, setScopeTypeFilter] = useState("ALL");
  const [periodTypeFilter, setPeriodTypeFilter] = useState("ALL");
  const [performanceFilter, setPerformanceFilter] = useState<"ALL" | "ON_TRACK" | "BEHIND">("ALL");

  // Scopes options
  const [branches, setBranches] = useState<ScopeOpt[]>([]);
  const [depts, setDepts] = useState<ScopeOpt[]>([]);
  const [cats, setCats] = useState<ScopeOpt[]>([]);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRow | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    scopeType: "BRANCH",
    scopeId: "",
    amount: "",
    periodStart: "",
    periodEnd: "",
    periodType: "MONTHLY",
    note: "",
  });

  const [deleteModalBudget, setDeleteModalBudget] = useState<BudgetRow | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadScopes = useCallback(async () => {
    try {
      const [b, d, c] = await Promise.all([
        api.get<any>("/api/v1/branches").catch(() => ({ data: [] })),
        api.get<any>("/api/v1/hrm/departments?limit=100").catch(() => ({ data: [] })),
        api.get<any>("/api/v1/categories").catch(() => ({ data: [] })),
      ]);
      const bList = (b.data as any)?.data ?? b.data ?? [];
      const dList = (d.data as any)?.data ?? d.data ?? [];
      const cList = (c.data as any)?.data ?? c.data ?? [];

      setBranches(Array.isArray(bList) ? bList.map((x: any) => ({ id: x.id, name: x.name })) : []);
      setDepts(Array.isArray(dList) ? dList.map((x: any) => ({ id: x.id, name: x.name })) : []);
      setCats(Array.isArray(cList) ? cList.map((x: any) => ({ id: x.id, name: x.name })) : []);
    } catch {
      // fallback
    }
  }, []);

  const loadVarianceData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get<any>("/api/v1/budgets/variance");
      const respData = res.data?.data || res.data || { budgets: [], totals: { totalBudget: 0, totalActual: 0, totalVariance: 0 } };
      setData(respData);
    } catch (err: any) {
      notify(false, err.message || "Failed to load budget and variance data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadScopes();
    loadVarianceData();
  }, [loadScopes, loadVarianceData]);

  const scopeOptions = useMemo(() => {
    if (form.scopeType === "BRANCH") return branches;
    if (form.scopeType === "DEPARTMENT") return depts;
    return cats;
  }, [form.scopeType, branches, depts, cats]);

  const scopeLabel =
    form.scopeType === "BRANCH" ? "Branch" : form.scopeType === "DEPARTMENT" ? "Department" : "Product Category";

  function openCreateModal() {
    loadScopes();
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    setEditingBudget(null);
    setForm({
      name: "",
      scopeType: "BRANCH",
      scopeId: branches.length > 0 ? branches[0].id : "",
      amount: "500000",
      periodStart: firstDay,
      periodEnd: lastDay,
      periodType: "MONTHLY",
      note: "",
    });
    setShowCreate(true);
  }

  function openEditModal(budget: BudgetRow) {
    loadScopes();
    setEditingBudget(budget);
    setForm({
      name: budget.name,
      scopeType: budget.scopeType,
      scopeId: budget.scopeId,
      amount: String(budget.amount),
      periodStart: budget.periodStart.slice(0, 10),
      periodEnd: budget.periodEnd.slice(0, 10),
      periodType: budget.periodType || "CUSTOM",
      note: budget.note || "",
    });
    setShowCreate(true);
  }

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!form.scopeId || !form.amount || !form.periodStart || !form.periodEnd) {
      notify(false, "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (editingBudget) {
        await api.patch(`/api/v1/budgets/${editingBudget.id}`, {
          name: form.name.trim() || undefined,
          amount: Number(form.amount),
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          note: form.note || undefined,
          scopeType: form.scopeType,
          scopeId: form.scopeId,
        });
        notify(true, `Budget target "${form.name || editingBudget.name}" updated successfully`);
      } else {
        await api.post("/api/v1/budgets", {
          ...form,
          name: form.name.trim() || `${form.scopeType} Target`,
          amount: Number(form.amount),
          periodType: form.periodType,
        });
        notify(true, "New sales budget target registered successfully");
      }
      setShowCreate(false);
      loadVarianceData(true);
    } catch (err: any) {
      notify(false, err.response?.data?.error || err?.message || "Failed to save budget target");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget() {
    if (!deleteModalBudget) return;
    try {
      await api.del(`/api/v1/budgets/${deleteModalBudget.id}`);
      notify(true, `Budget target "${deleteModalBudget.name}" removed`);
      setDeleteModalBudget(null);
      loadVarianceData(true);
    } catch (err: any) {
      notify(false, err?.message || "Failed to delete budget");
    }
  }

  // Filtered Budgets List
  const filteredBudgets = useMemo(() => {
    return data.budgets.filter((b) => {
      if (scopeTypeFilter !== "ALL" && b.scopeType !== scopeTypeFilter) return false;
      if (periodTypeFilter !== "ALL" && b.periodType !== periodTypeFilter) return false;
      if (performanceFilter === "ON_TRACK" && !b.onTrack) return false;
      if (performanceFilter === "BEHIND" && b.onTrack) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !b.name.toLowerCase().includes(q) &&
          !(b.scopeName || "").toLowerCase().includes(q) &&
          !(b.note || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [data.budgets, scopeTypeFilter, periodTypeFilter, performanceFilter, search]);

  const overallAchievement = useMemo(() => {
    if (!data.totals.totalBudget) return 0;
    return Math.round((data.totals.totalActual / data.totals.totalBudget) * 100);
  }, [data.totals]);

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
        title="Sales Targets & Budget Variance"
        subtitle="Branch, Department & Product Category Sales Targets vs Live Realized Invoices"
        icon={<Target className="w-5 h-5" />}
        items={[
          { label: "Financials", href: "/accounting" },
          { label: "Targets & Budgets" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <CustomButton
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
              onClick={() => loadVarianceData(true)}
              disabled={refreshing}
            >
              Refresh
            </CustomButton>

            <CustomButton variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              Set New Target
            </CustomButton>
          </div>
        }
      />

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CustomStatCard
          label="Total Budgeted Target"
          value={money(data.totals.totalBudget)}
          icon={Target}
          tone="primary"
        />

        <CustomStatCard
          label="Live Realized Sales"
          value={money(data.totals.totalActual)}
          icon={TrendingUp}
          tone="blue"
        />

        <CustomStatCard
          label="Net Sales Variance"
          value={
            (data.totals.totalVariance >= 0 ? "+" : "") +
            money(data.totals.totalVariance)
          }
          icon={Scale}
          tone={data.totals.totalVariance >= 0 ? "green" : "amber"}
        />

        <CustomStatCard
          label="Overall Target Attainment"
          value={`${overallAchievement}%`}
          icon={Percent}
          tone={overallAchievement >= 100 ? "green" : "violet"}
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search target name, branch, category or note..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={scopeTypeFilter}
              onChange={(e) => setScopeTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="ALL">All Scopes</option>
              <option value="BRANCH">🏢 Branch Targets</option>
              <option value="DEPARTMENT">👥 Department Targets</option>
              <option value="CATEGORY">📁 Category Targets</option>
            </select>

            <select
              value={periodTypeFilter}
              onChange={(e) => setPeriodTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="ALL">All Periods</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom Range</option>
            </select>

            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value as any)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            >
              <option value="ALL">All Attainment</option>
              <option value="ON_TRACK">✅ On Track (≥100%)</option>
              <option value="BEHIND">⚠️ Behind Target (&lt;100%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MAIN TARGETS & VARIANCE TABLE ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Budget Targets & Live Realization Analysis</h4>
            <p className="text-xs text-slate-500">
              Actual sales figures are computed in real time from confirmed invoices during each target window.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {filteredBudgets.length} Quotas Monitored
          </span>
        </div>

        <CustomTable<BudgetRow>
          columns={[
            {
              key: "name",
              header: "Target Name",
              render: (row) => (
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-slate-900">{row.name}</p>
                  {row.note && <p className="text-[10px] text-slate-400 truncate max-w-xs">{row.note}</p>}
                </div>
              ),
            },
            {
              key: "scopeType",
              header: "Scope & Target Entity",
              render: (row) => {
                const Icon =
                  row.scopeType === "BRANCH"
                    ? Building2
                    : row.scopeType === "DEPARTMENT"
                    ? GitBranch
                    : FolderTree;
                return (
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      <Icon className="w-3 h-3 text-teal-600" />
                      {row.scopeType}
                    </span>
                    <p className="font-medium text-xs text-slate-800 mt-1">{row.scopeName || row.scopeId}</p>
                  </div>
                );
              },
            },
            {
              key: "periodStart",
              header: "Target Period",
              render: (row) => (
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p className="font-mono text-[11px] font-medium text-slate-800">
                    {dateOnly(row.periodStart)} → {dateOnly(row.periodEnd)}
                  </p>
                  <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-500 uppercase">
                    {row.periodType}
                  </span>
                </div>
              ),
            },
            {
              key: "amount",
              header: "Target Quota",
              render: (row) => (
                <span className="font-mono text-xs font-bold text-slate-800">{money(row.amount)}</span>
              ),
            },
            {
              key: "actual",
              header: "Realized Sales",
              render: (row) => (
                <span className="font-mono text-xs font-bold text-teal-700">{money(row.actual ?? 0)}</span>
              ),
            },
            {
              key: "variance",
              header: "Net Variance",
              render: (row) => {
                const v = Number(row.variance || 0);
                const isPositive = v >= 0;
                return (
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${
                      isPositive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? "+" : ""}
                    {money(v)}
                    <span className="text-[10px] opacity-80">({row.variancePct}%)</span>
                  </span>
                );
              },
            },
            {
              key: "achievementPct",
              header: "Attainment",
              render: (row) => {
                const pct = Number(row.achievementPct || 0);
                const isComplete = pct >= 100;
                return (
                  <div className="w-36 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold font-mono text-slate-800">{pct}%</span>
                      <span
                        className={`text-[10px] font-bold ${
                          isComplete ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {isComplete ? "MET" : "IN PROGRESS"}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isComplete ? "bg-emerald-500" : "bg-teal-600"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              },
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(row)}
                    className="inline-flex items-center rounded-md p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                    title="Edit Target"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteModalBudget(row)}
                    className="inline-flex items-center rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Target"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredBudgets}
          pageSize={10}
          emptyMessage="No sales targets or budget quotas found."
        />
      </div>

      {/* ─── MODAL: CREATE / EDIT BUDGET TARGET ─── */}
      <CustomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={editingBudget ? `Edit Target: ${editingBudget.name}` : "Set New Sales Target & Budget"}
        size="md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target / Budget Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dhanmondi Flagship Branch Q4 Target"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Scope Type
              </label>
              <select
                value={form.scopeType}
                onChange={(e) => {
                  const st = e.target.value;
                  const firstId =
                    st === "BRANCH"
                      ? branches[0]?.id
                      : st === "DEPARTMENT"
                      ? depts[0]?.id
                      : cats[0]?.id;
                  setForm({ ...form, scopeType: st, scopeId: firstId || "" });
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="BRANCH">🏢 Branch</option>
                <option value="DEPARTMENT">👥 Department</option>
                <option value="CATEGORY">📁 Product Category</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select {scopeLabel} *
              </label>
              <select
                value={form.scopeId}
                onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                required
              >
                <option value="">-- Choose {scopeLabel} --</option>
                {scopeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Revenue Quota (Tk) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="500000"
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-base font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[100000, 250000, 500000, 1000000, 2500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setForm({ ...form, amount: String(amt) })}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition"
                >
                  {money(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Period Type
              </label>
              <select
                value={form.periodType}
                onChange={(e) => setForm({ ...form, periodType: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="CUSTOM">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Strategy / Strategic Notes (Optional)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="e.g. Seasonal campaign uplift, promotional drive planned..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setShowCreate(false)} type="button">
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              icon={<Check className="w-4 h-4" />}
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : editingBudget ? "Update Target" : "Register Target"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ─── MODAL: DELETE CONFIRMATION ─── */}
      <ConfirmModal
        open={deleteModalBudget !== null}
        onClose={() => setDeleteModalBudget(null)}
        onConfirm={handleDeleteBudget}
        title="Delete Sales Target & Budget"
        message={`Are you sure you want to delete budget target "${deleteModalBudget?.name}"? Live variance tracking for this window will be cancelled.`}
        confirmText="Delete Target"
        variant="danger"
      />
    </div>
  );
}
