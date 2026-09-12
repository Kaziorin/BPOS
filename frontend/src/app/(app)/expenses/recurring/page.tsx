"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Repeat,
  Plus,
  Power,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  Receipt,
  Calendar,
  Layers,
  Sparkles,
  DollarSign,
  Zap,
  Edit3,
  Trash2,
  Clock,
  Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  ConfirmModal,
} from "@/components/custom";
import { money, dateOnly } from "@/lib/format";

interface Recurring {
  id: string;
  name: string;
  amount: string | number;
  frequency: string;
  nextRunDate: string;
  endDate: string | null;
  isActive: boolean;
  lastGeneratedAt: string | null;
  category?: { id: string; name: string } | null;
  branchId?: string | null;
  _count?: { expenses: number };
}

const FREQUENCIES = [
  { value: "DAILY", label: "Daily (Every Day)" },
  { value: "WEEKLY", label: "Weekly (Every 7 Days)" },
  { value: "MONTHLY", label: "Monthly (Every 30 Days)" },
  { value: "QUARTERLY", label: "Quarterly (Every 3 Months)" },
  { value: "YEARLY", label: "Yearly (Annual)" },
];

export default function RecurringExpensesPage() {
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Recurring | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, catRes, brRes] = await Promise.all([
        api.get<{ data: Recurring[] }>("/expenses/recurring"),
        api.get<{ data: { id: string; name: string }[] }>("/expenses/categories"),
        api.get<{ data: any }>("/branches").catch(() => null),
      ]);
      setRecurring(recRes.data || []);
      setCategories(catRes.data || []);
      const brs = (brRes?.data as any)?.data ?? brRes?.data ?? [];
      setBranches(Array.isArray(brs) ? brs.map((b: any) => ({ id: b.id, name: b.name })) : []);
    } catch (err: any) {
      showToast(err.message || "Failed to load recurring expenses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle active status
  const handleToggle = async (r: Recurring) => {
    try {
      await api.post(`/expenses/recurring/${r.id}/toggle`, { isActive: !r.isActive });
      showToast(`Schedule "${r.name}" is now ${!r.isActive ? "Active" : "Paused"}`);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || "Failed to toggle schedule", "error");
    }
  };

  // Run scheduler manual pass
  const handleRunScheduler = async () => {
    setRunning(true);
    try {
      const res = await api.post<{ data: { generated: number } }>("/expenses/recurring/run", {});
      const count = res.data?.generated ?? 0;
      showToast(`Scheduler completed: ${count} expense voucher(s) generated! 🎉`);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || "Failed to trigger recurring run", "error");
    } finally {
      setRunning(false);
    }
  };

  // Delete recurring
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.del(`/expenses/recurring/${deleteConfirm.id}`);
      showToast(`Recurring schedule "${deleteConfirm.name}" deleted`);
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || "Failed to delete schedule", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return recurring.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchesFreq = freqFilter === "ALL" || r.frequency === freqFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && r.isActive) ||
        (statusFilter === "PAUSED" && !r.isActive);

      return matchesSearch && matchesFreq && matchesStatus;
    });
  }, [recurring, search, freqFilter, statusFilter]);

  const activeCount = recurring.filter((r) => r.isActive).length;
  const totalMonthlyCommitment = recurring
    .filter((r) => r.isActive)
    .reduce((acc, r) => {
      const val = Number(r.amount) || 0;
      if (r.frequency === "DAILY") return acc + val * 30;
      if (r.frequency === "WEEKLY") return acc + val * 4.3;
      if (r.frequency === "QUARTERLY") return acc + val / 3;
      if (r.frequency === "YEARLY") return acc + val / 12;
      return acc + val; // Monthly
    }, 0);

  const totalGeneratedCount = recurring.reduce((acc, r) => acc + (r._count?.expenses || 0), 0);

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border border-slate-700"
              : "bg-red-600 text-white border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-white" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Application Breadcrumb Header */}
      <CustomBreadcrumb
        title="Recurring Expenses & Schedules"
        icon={<Repeat size={20} />}
        items={[
          { label: "Expenses", href: "/expenses" },
          { label: "Recurring" },
        ]}
        description="Automate recurring expenditures (Rent, Internet, Salaries, Software) on automated cron schedules."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/expenses">
              <CustomButton
                size="sm"
                variant="outline"
                leftIcon={<Receipt size={14} />}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                All Expenses
              </CustomButton>
            </Link>
            <CustomButton
              size="sm"
              variant="outline"
              leftIcon={<PlayCircle size={14} />}
              loading={running}
              onClick={handleRunScheduler}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Run Due Schedules
            </CustomButton>
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setEditItem(null);
                setShowModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              New Recurring Schedule
            </CustomButton>
            <button
              onClick={() => loadData()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh Schedules"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CustomStatCard
          label="Active Schedules"
          value={`${activeCount} / ${recurring.length}`}
          icon={Repeat}
          tone="primary"
        />
        <CustomStatCard
          label="Est. Monthly Commitment"
          value={money(totalMonthlyCommitment)}
          icon={DollarSign}
          tone="amber"
        />
        <CustomStatCard
          label="Vouchers Auto-Generated"
          value={String(totalGeneratedCount)}
          icon={Receipt}
          tone="blue"
        />
        <CustomStatCard
          label="Cron Automation Engine"
          value="Online (Worker)"
          icon={Zap}
          tone="green"
        />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search schedules by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Schedules</option>
              <option value="PAUSED">Paused Schedules</option>
            </select>

            <select
              value={freqFilter}
              onChange={(e) => setFreqFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Frequencies</option>
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Table */}
        <CustomTable
          columns={[
            {
              key: "name",
              header: "Schedule Name",
              render: (r: Recurring) => (
                <div>
                  <p className="font-bold text-slate-800 text-xs">{r.name}</p>
                  <p className="text-[11px] text-teal-700 mt-0.5">
                    {r.category?.name || "Uncategorized"}
                  </p>
                </div>
              ),
            },
            {
              key: "frequency",
              header: "Frequency",
              align: "center",
              render: (r: Recurring) => (
                <span className="inline-flex rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 border border-teal-200">
                  {r.frequency}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Recurring Amount",
              align: "right",
              render: (r: Recurring) => (
                <span className="font-bold text-slate-900 text-xs tabular-nums">
                  {money(Number(r.amount) || 0)}
                </span>
              ),
            },
            {
              key: "nextRun",
              header: "Next Run Date",
              align: "center",
              render: (r: Recurring) => (
                <div className="text-xs">
                  <p className="font-semibold text-slate-800">{dateOnly(r.nextRunDate)}</p>
                  {r.lastGeneratedAt && (
                    <p className="text-[10px] text-slate-400">Last: {dateOnly(r.lastGeneratedAt)}</p>
                  )}
                </div>
              ),
            },
            {
              key: "count",
              header: "Generated",
              align: "center",
              render: (r: Recurring) => (
                <span className="text-xs font-semibold text-slate-700 tabular-nums">
                  {r._count?.expenses || 0} times
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              align: "center",
              render: (r: Recurring) => (
                <button
                  onClick={() => handleToggle(r)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition hover:opacity-80 ${
                    r.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {r.isActive ? "Active" : "Paused"}
                </button>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              align: "center",
              render: (r: Recurring) => (
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => {
                      setEditItem(r);
                      setShowModal(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
                    title="Edit Schedule"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: r.id, name: r.name })}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Delete Schedule"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ),
            },
          ]}
          data={filteredList}
          rowKey={(r: Recurring) => r.id}
          loading={loading}
          emptyIcon={Repeat}
          emptyMessage="No recurring expense schedules configured."
        />
      </div>

      {/* ──────────────── MODAL: CREATE / EDIT ──────────────── */}
      {showModal && (
        <RecurringFormModal
          item={editItem}
          categories={categories}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            showToast(editItem ? "Schedule updated successfully" : "Schedule created successfully");
            loadData();
          }}
        />
      )}

      {/* ──────────────── CONFIRM DELETE ──────────────── */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Recurring Schedule"
        message={`Are you sure you want to delete recurring schedule "${deleteConfirm?.name}"? Automatic vouchers will no longer be generated for it.`}
        type="DANGER"
        confirmText="Delete Schedule"
        loading={deleting}
      />
    </div>
  );
}

function RecurringFormModal({
  item,
  categories,
  branches,
  onClose,
  onSaved,
}: {
  item: Recurring | null;
  categories: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    amount: item?.amount?.toString() || "",
    categoryId: item?.category?.id || "",
    branchId: item?.branchId || (branches[0]?.id || ""),
    frequency: item?.frequency || "MONTHLY",
    nextRunDate: item?.nextRunDate ? item.nextRunDate.split("T")[0] : new Date().toISOString().split("T")[0],
    endDate: item?.endDate ? item.endDate.split("T")[0] : "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || Number(form.amount) <= 0) {
      setError("Please provide a valid schedule name and positive amount.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        amount: Number(form.amount),
        categoryId: form.categoryId || undefined,
        branchId: form.branchId || undefined,
        frequency: form.frequency,
        nextRunDate: form.nextRunDate || undefined,
        endDate: form.endDate || null,
      };

      if (item) {
        await api.put(`/expenses/recurring/${item.id}`, payload);
      } else {
        await api.post("/expenses/recurring", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save recurring schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-700">
              {item ? "Edit Recurring Schedule" : "New Recurring Schedule"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automate repeated vendor invoices or utility bill postings.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XCircle size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Schedule Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="e.g. Monthly Fiber Internet Billing"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Amount (৳) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition tabular-nums"
                placeholder="3000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Frequency *
              </label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {branches.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Branch Outlet
                </label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
                >
                  <option value="">All / Headquarters</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Next Run Date *
              </label>
              <input
                type="date"
                required
                value={form.nextRunDate}
                onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              loading={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              {item ? "Update Schedule" : "Create Schedule"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
