"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Tags,
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Building2,
  Receipt,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomTable,
  CustomStatCard,
  ConfirmModal,
} from "@/components/custom";

interface Category {
  id: string;
  name: string;
  group: string;
  description: string | null;
  _count?: { expenses: number };
}

const GROUPS: Record<string, { label: string; tone: string }> = {
  OPERATING: { label: "Operating & Overhead", tone: "bg-teal-50 text-teal-700 border-teal-200" },
  PAYROLL: { label: "Payroll & Staff", tone: "bg-blue-50 text-blue-700 border-blue-200" },
  FACILITY: { label: "Facility & Utilities", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  MARKETING: { label: "Marketing & Ads", tone: "bg-purple-50 text-purple-700 border-purple-200" },
  LOGISTICS: { label: "Logistics & Transport", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  TAX_FEES: { label: "Taxes & Statutory Fees", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  MISC: { label: "Miscellaneous", tone: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Category[] }>("/expenses/categories");
      setCategories(res.data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Delete Category
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.del(`/expenses/categories/${deleteConfirm.id}`);
      showToast(`Category "${deleteConfirm.name}" deleted successfully`);
      setDeleteConfirm(null);
      await loadCategories();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || "Failed to delete category", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase()) ||
        c.group.toLowerCase().includes(search.toLowerCase());

      const matchesGroup = groupFilter === "ALL" || c.group === groupFilter;
      return matchesSearch && matchesGroup;
    });
  }, [categories, search, groupFilter]);

  const operatingCount = categories.filter((c) => c.group === "OPERATING").length;
  const facilityCount = categories.filter((c) => c.group === "FACILITY" || c.group === "PAYROLL").length;
  const totalExpensesLinked = categories.reduce((acc, c) => acc + (c._count?.expenses || 0), 0);

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
        title="Expense Categories"
        icon={<Tags size={20} />}
        items={[
          { label: "Expenses", href: "/expenses" },
          { label: "Categories" },
        ]}
        description="Organize store spending into statutory account groups for double-entry P&L allocation."
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
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setEditCategory(null);
                setShowModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              New Category
            </CustomButton>
            <button
              onClick={() => loadCategories()}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition shadow-2xs"
              title="Refresh Categories"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CustomStatCard
          label="Total Categories"
          value={String(categories.length)}
          icon={Tags}
          tone="primary"
        />
        <CustomStatCard
          label="Operating Groups"
          value={String(operatingCount)}
          icon={Building2}
          tone="blue"
        />
        <CustomStatCard
          label="Facility & Payroll"
          value={String(facilityCount)}
          icon={Layers}
          tone="amber"
        />
        <CustomStatCard
          label="Linked Expenses"
          value={String(totalExpensesLinked)}
          icon={Receipt}
          tone="green"
        />
      </div>

      {/* Main Categories Card */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories by name or group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Groups</option>
              {Object.entries(GROUPS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded p-1 text-slate-600 transition ${
                  viewMode === "table" ? "bg-white text-teal-700 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
                title="Table View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded p-1 text-slate-600 transition ${
                  viewMode === "grid" ? "bg-white text-teal-700 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
                title="Grid Cards"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === "table" ? (
          <CustomTable
            columns={[
              {
                key: "name",
                header: "Category Name",
                render: (c: Category) => (
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{c.name}</p>
                    {c.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "group",
                header: "Group Classification",
                align: "center",
                render: (c: Category) => {
                  const g = GROUPS[c.group] || GROUPS.MISC;
                  return (
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold border ${g.tone}`}
                    >
                      {g.label}
                    </span>
                  );
                },
              },
              {
                key: "count",
                header: "Linked Expenses",
                align: "center",
                render: (c: Category) => (
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                    {c._count?.expenses || 0} entries
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                align: "center",
                render: (c: Category) => (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => {
                        setEditCategory(c);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
                      title="Edit Category"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: c.id, name: c.name })}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredCategories}
            rowKey={(c: Category) => c.id}
            loading={loading}
            emptyIcon={Tags}
            emptyMessage="No expense categories found."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {filteredCategories.map((c) => {
              const g = GROUPS[c.group] || GROUPS.MISC;
              return (
                <div
                  key={c.id}
                  className="rounded-md border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-teal-300 transition space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-50 text-teal-600">
                          <Tags size={14} />
                        </div>
                        <h3 className="font-bold text-xs text-slate-800">{c.name}</h3>
                      </div>
                      <span className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${g.tone}`}>
                        {g.label.split(" ")[0]}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">{c.description}</p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {c._count?.expenses || 0} expenses recorded
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditCategory(c); setShowModal(true); }}
                        className="p-1 text-slate-400 hover:text-teal-600 rounded"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: c.id, name: c.name })}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ──────────────── CREATE / EDIT MODAL ──────────────── */}
      {showModal && (
        <CategoryFormModal
          category={editCategory}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            showToast(editCategory ? "Category updated successfully" : "Category created successfully");
            loadCategories();
          }}
        />
      )}

      {/* ──────────────── DELETE CONFIRM MODAL ──────────────── */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Expense Category"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? Make sure no active expenses are linked to this category.`}
        type="DANGER"
        confirmText="Delete Category"
        loading={deleting}
      />
    </div>
  );
}

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: category?.name || "",
    group: category?.group || "OPERATING",
    description: category?.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        group: form.group,
        description: form.description.trim() || null,
      };
      if (category) {
        await api.put(`/expenses/categories/${category.id}`, payload);
      } else {
        await api.post("/expenses/categories", payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200 transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-700">
              {category ? "Edit Category" : "New Expense Category"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify category name and group for financial ledger reporting.
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
              Category Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="e.g. Store Utilities & Power"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Account Group Classification
            </label>
            <select
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              {Object.entries(GROUPS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              placeholder="e.g. Monthly DESCO/DPDC electrical billing"
            />
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
              {category ? "Update Category" : "Create Category"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
