"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  CheckCircle2,
  XCircle,
  DollarSign,
  Repeat,
  Wallet,
  BarChart3,
  ChevronRight,
  Clock,
  CreditCard,
  Search,
  RefreshCw,
  Tags,
  SlidersHorizontal,
  Edit3,
  Trash2,
  Check,
  Building2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  Layers,
  Sparkles,
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

interface Category {
  id: string;
  name: string;
  group: string;
  _count?: { expenses: number };
}

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: string | number;
  expenseDate: string;
  paymentMethod: string;
  status: string;
  branchId: string | null;
  category?: { id: string; name: string } | null;
  recurring?: { name: string } | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; badgeCls: string }> = {
  PENDING: { label: "Pending Approval", badgeCls: "bg-amber-50 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approved (Unpaid)", badgeCls: "bg-blue-50 text-blue-700 border-blue-200" },
  PAID: { label: "Paid & Settled", badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejected", badgeCls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash on Hand", icon: "💵" },
  { value: "BANK", label: "Bank Wire / Transfer", icon: "🏦" },
  { value: "MOBILE_BANKING", label: "bKash / Nagad / Rocket", icon: "📱" },
  { value: "PETTY_CASH", label: "Branch Petty Cash", icon: "🪙" },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<{
    total: number;
    count: number;
    byCategory: { categoryName: string; total: number; count: number }[];
  } | null>(null);
  const [pettyBalance, setPettyBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  // Modals & Actions
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{
    type: "approve" | "pay" | "delete";
    id: string;
    title: string;
    amount: number;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, catRes, repRes, pettyRes, brRes] = await Promise.all([
        api.get<{ data: Expense[] }>("/expenses?limit=100"),
        api.get<{ data: Category[] }>("/expenses/categories"),
        api.get<{ data: any }>("/expenses/report"),
        api.get<{ data: { funds: { balance: string }[] } }>("/expenses/petty-cash").catch(() => null),
        api.get<{ data: any }>("/branches").catch(() => null),
      ]);
      setExpenses(expRes.data || []);
      setCategories(catRes.data || []);
      setReport(repRes.data || null);
      setPettyBalance(pettyRes ? Number(pettyRes.data?.funds?.[0]?.balance ?? 0) : null);
      const brs = (brRes?.data as any)?.data ?? brRes?.data ?? [];
      setBranches(Array.isArray(brs) ? brs.map((b: any) => ({ id: b.id, name: b.name })) : []);
    } catch (err: any) {
      showToast(err.message || "Failed to load expenses data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute confirmation action (Approve / Pay / Delete)
  const handleConfirmAction = async () => {
    if (!actionConfirm) return;
    setActionLoading(true);
    try {
      if (actionConfirm.type === "approve") {
        await api.post(`/expenses/${actionConfirm.id}/approve`, {});
        showToast(`Expense "${actionConfirm.title}" approved successfully`);
      } else if (actionConfirm.type === "pay") {
        await api.post(`/expenses/${actionConfirm.id}/pay`, {});
        showToast(`Expense "${actionConfirm.title}" marked as PAID`);
      } else if (actionConfirm.type === "delete") {
        await api.del(`/expenses/${actionConfirm.id}`);
        showToast(`Expense "${actionConfirm.title}" deleted`);
      }
      setActionConfirm(null);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.category?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || e.category?.id === categoryFilter;
      const matchesMethod = methodFilter === "ALL" || e.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesMethod;
    });
  }, [expenses, search, statusFilter, categoryFilter, methodFilter]);

  // Stats
  const pendingCount = expenses.filter((e) => e.status === "PENDING").length;
  const approvedUnpaidCount = expenses.filter((e) => e.status === "APPROVED").length;
  const totalSpend30d = report?.total || expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

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

      {/* Reusable Application Breadcrumb Header */}
      <CustomBreadcrumb
        title="Expense Management"
        icon={<Receipt size={20} />}
        items={[{ label: "Expenses", href: "/expenses" }, { label: "Overview" }]}
        description="Track operating expenditures, petty cash disbursements, recurring schedules, and double-entry accounting journals."
        actions={
          <div className="flex items-center gap-2">
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setEditExpense(null);
                setShowCreateModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Record Expense
            </CustomButton>
            <button
              onClick={() => loadData()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh Expenses"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Quick Navigation Sub-Modules Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Link
            href="/expenses"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200"
          >
            <Receipt size={14} className="text-teal-600" />
            <span>All Expenses ({expenses.length})</span>
          </Link>
          <Link
            href="/expenses/categories"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition border border-transparent"
          >
            <Tags size={14} className="text-slate-400" />
            <span>Categories ({categories.length})</span>
          </Link>
          <Link
            href="/expenses/recurring"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition border border-transparent"
          >
            <Repeat size={14} className="text-slate-400" />
            <span>Recurring Schedules</span>
          </Link>
          <Link
            href="/expenses/petty-cash"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition border border-transparent"
          >
            <Wallet size={14} className="text-slate-400" />
            <span>Petty Cash Ledger</span>
          </Link>
          <Link
            href="/expenses/report"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition border border-transparent"
          >
            <BarChart3 size={14} className="text-slate-400" />
            <span>Analytics & Reports</span>
          </Link>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CustomStatCard
          label="Total Spent (30 Days)"
          value={money(totalSpend30d)}
          icon={DollarSign}
          tone="primary"
        />
        <CustomStatCard
          label="Total Entries"
          value={String(expenses.length)}
          icon={Receipt}
          tone="blue"
        />
        <CustomStatCard
          label="Pending Approvals"
          value={String(pendingCount)}
          icon={Clock}
          tone={pendingCount > 0 ? "amber" : "green"}
        />
        <CustomStatCard
          label="Petty Cash Fund"
          value={pettyBalance != null ? money(pettyBalance) : "—"}
          icon={Wallet}
          tone="green"
        />
      </div>

      {/* Category Spending Breakdown Progress Bar (if available) */}
      {report && report.byCategory.length > 0 && (
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-teal-600" />
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Category Spending Breakdown (Last 30 Days)
              </h2>
            </div>
            <Link
              href="/expenses/report"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
            >
              Full Report <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.byCategory
              .sort((a, b) => b.total - a.total)
              .slice(0, 6)
              .map((c) => {
                const pct = report.total > 0 ? Math.round((c.total / report.total) * 100) : 0;
                return (
                  <div key={c.categoryName} className="p-2.5 rounded-md bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                        {c.categoryName} <span className="text-slate-400 font-normal">({c.count})</span>
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {money(c.total)} <span className="text-[10px] text-teal-600 font-semibold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Main Expenses Table Container */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Multi-Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, description, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved (Unpaid)</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Payment Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Table */}
        <CustomTable
          columns={[
            {
              key: "title",
              header: "Expense Details",
              render: (e: Expense) => (
                <div>
                  <p className="font-bold text-slate-800 text-xs">{e.title}</p>
                  {e.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">{e.description}</p>
                  )}
                  {e.recurring && (
                    <p className="flex items-center gap-1 text-[10px] text-teal-700 mt-0.5 font-medium">
                      <Repeat size={10} /> Auto: {e.recurring.name}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "category",
              header: "Category",
              align: "center",
              render: (e: Expense) => (
                <span className="inline-flex rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 border border-teal-200">
                  {e.category?.name || "Uncategorized"}
                </span>
              ),
            },
            {
              key: "expenseDate",
              header: "Expense Date",
              align: "center",
              render: (e: Expense) => (
                <span className="text-xs text-slate-600 font-medium">
                  {dateOnly(e.expenseDate)}
                </span>
              ),
            },
            {
              key: "paymentMethod",
              header: "Payment Method",
              align: "center",
              render: (e: Expense) => {
                const methodObj = PAYMENT_METHODS.find((m) => m.value === e.paymentMethod);
                return (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
                    <span>{methodObj?.icon || "💳"}</span>
                    <span>{methodObj?.label.split(" ")[0] || e.paymentMethod}</span>
                  </span>
                );
              },
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              render: (e: Expense) => (
                <span className="font-bold text-slate-900 text-xs tabular-nums">
                  {money(Number(e.amount) || 0)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              align: "center",
              render: (e: Expense) => {
                const conf = STATUS_CONFIG[e.status] || STATUS_CONFIG.PENDING;
                return (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${conf.badgeCls}`}
                  >
                    {conf.label}
                  </span>
                );
              },
            },
            {
              key: "actions",
              header: "Actions",
              align: "center",
              render: (e: Expense) => (
                <div className="flex items-center justify-center gap-1">
                  {e.status === "PENDING" && (
                    <button
                      onClick={() =>
                        setActionConfirm({
                          type: "approve",
                          id: e.id,
                          title: e.title,
                          amount: Number(e.amount),
                        })
                      }
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                      title="Approve Expense"
                    >
                      Approve
                    </button>
                  )}
                  {e.status === "APPROVED" && (
                    <button
                      onClick={() =>
                        setActionConfirm({
                          type: "pay",
                          id: e.id,
                          title: e.title,
                          amount: Number(e.amount),
                        })
                      }
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition"
                      title="Mark as Paid"
                    >
                      Mark Paid
                    </button>
                  )}
                  {e.status !== "PAID" && (
                    <button
                      onClick={() => {
                        setEditExpense(e);
                        setShowCreateModal(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
                      title="Edit Expense"
                    >
                      <Edit3 size={13} />
                    </button>
                  )}
                  {e.status !== "PAID" && (
                    <button
                      onClick={() =>
                        setActionConfirm({
                          type: "delete",
                          id: e.id,
                          title: e.title,
                          amount: Number(e.amount),
                        })
                      }
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      title="Delete Expense"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredExpenses}
          rowKey={(e: Expense) => e.id}
          loading={loading}
          emptyIcon={Receipt}
          emptyMessage="No expenses found matching the selected filters."
        />
      </div>

      {/* ──────────────── MODAL: CREATE / EDIT EXPENSE ──────────────── */}
      {showCreateModal && (
        <ExpenseFormModal
          expense={editExpense}
          categories={categories}
          branches={branches}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            showToast(editExpense ? "Expense updated successfully" : "Expense recorded successfully");
            loadData();
          }}
        />
      )}

      {/* ──────────────── ACTION CONFIRM MODAL ──────────────── */}
      <ConfirmModal
        isOpen={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        onConfirm={handleConfirmAction}
        title={
          actionConfirm?.type === "approve"
            ? "Approve Expense"
            : actionConfirm?.type === "pay"
            ? "Confirm Payment & Post Journal"
            : "Delete Expense Record"
        }
        message={
          actionConfirm?.type === "approve"
            ? `Are you sure you want to approve "${actionConfirm?.title}" for ${money(actionConfirm?.amount || 0)}?`
            : actionConfirm?.type === "pay"
            ? `Marking "${actionConfirm?.title}" (${money(actionConfirm?.amount || 0)}) as PAID will post the double-entry accounting journal (Debit Expense / Credit Cash or Bank). Continue?`
            : `Are you sure you want to permanently delete expense "${actionConfirm?.title}"?`
        }
        type={actionConfirm?.type === "delete" ? "DANGER" : "INFO"}
        confirmText={
          actionConfirm?.type === "approve"
            ? "Approve"
            : actionConfirm?.type === "pay"
            ? "Confirm Payment"
            : "Delete Expense"
        }
        loading={actionLoading}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// EXPENSE FORM MODAL
// ────────────────────────────────────────────────────────────

function ExpenseFormModal({
  expense,
  categories,
  branches,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  categories: Category[];
  branches: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: expense?.title || "",
    amount: expense?.amount?.toString() || "",
    categoryId: expense?.category?.id || "",
    branchId: expense?.branchId || (branches[0]?.id || ""),
    paymentMethod: expense?.paymentMethod || "CASH",
    expenseDate: expense?.expenseDate ? expense.expenseDate.split("T")[0] : new Date().toISOString().split("T")[0],
    description: expense?.description || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      setError("Please provide an expense title and a valid positive amount.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        categoryId: form.categoryId || null,
        branchId: form.branchId || null,
        paymentMethod: form.paymentMethod,
        expenseDate: form.expenseDate || undefined,
        description: form.description.trim() || null,
      };

      if (expense) {
        await api.put(`/expenses/${expense.id}`, payload);
      } else {
        await api.post("/expenses", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save expense");
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
              {expense ? "Edit Expense" : "Record New Expense"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter expense details, category classification, and payment method.
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
              Expense Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="e.g. Office Electricity Bill - September"
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
                placeholder="2500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expense Date
              </label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
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
                  <option key={c.id} value={c.id}>{c.name} ({c.group})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {branches.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Branch / Outlet
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="e.g. Paid cash from register during morning shift"
            />
          </div>

          <div className="rounded-md bg-teal-50/60 p-2.5 border border-teal-200/60 text-[11px] text-teal-800 font-medium">
            💡 Cash expenses recorded in an active shift are automatically posted as a <code>CASH_EXPENSE</code> movement in the cashier ledger.
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
              {expense ? "Update Expense" : "Record Expense"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
