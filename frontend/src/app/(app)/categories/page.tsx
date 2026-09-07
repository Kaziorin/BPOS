"use client";

import { useEffect, useState } from "react";
import {
  Plus, Tags, Loader2, CheckCircle2, FolderTree, Edit3, Trash2, X, Save, ToggleLeft, ToggleRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { SearchableSelect } from "@/components/custom/SearchableSelect";
import { ConfirmModal } from "@/components/custom/ConfirmModal";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  status?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get<any>("/v1/products/categories");
      setCategories(Array.isArray(res.data || res) ? res.data || res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const parentCats = categories.filter((c) => !c.parentId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/v1/products/categories", {
        name,
        parentId: parentId || undefined,
      });
      setName("");
      setParentId("");
      setMsg("Category created successfully!");
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditParentId(cat.parentId || "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditName("");
    setEditParentId("");
  }

  async function saveEdit() {
    if (!editId || !editName) return;
    setEditSaving(true);
    try {
      await api.put(`/v1/products/categories/${editId}`, {
        name: editName,
        parentId: editParentId || null,
      });
      setMsg("Category updated!");
      cancelEdit();
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res: any = await api.del(`/v1/products/categories/${deleteId}`);
      if (res?.deactivated) {
        setMsg(`Category deactivated (${res.reason})`);
      } else {
        setMsg("Category deleted!");
      }
      setDeleteId(null);
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(cat: Category) {
    setTogglingId(cat.id);
    const newStatus = cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/v1/products/categories/${cat.id}`, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-md border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
            <Tags className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Categories & Subcategories</h1>
            <p className="text-xs text-slate-500">Manage product categories and sub-classification hierarchy</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CREATE FORM */}
        <div className="lg:col-span-4 bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">
            Add New Category
          </h2>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beverages, Electronics"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <SearchableSelect
                label="Parent Category (Leave empty for Main Category)"
                options={parentCats.map((c) => ({ value: c.id, label: c.name }))}
                value={parentId}
                onChange={(val) => setParentId(val)}
                placeholder="Select Parent (Optional)..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Save Category
            </button>
          </form>
        </div>

        {/* LIST TABLE */}
        <div className="lg:col-span-8 bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2 mb-3">
            Category Hierarchy List ({categories.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center p-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No categories created yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="p-2.5">Category Name</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => {
                    const isParent = !cat.parentId;
                    const parentObj = categories.find((c) => c.id === cat.parentId);
                    const isEditing = editId === cat.id;

                    return (
                      <tr key={cat.id} className={`hover:bg-slate-50/80 transition ${isEditing ? "bg-indigo-50/40" : ""}`}>
                        <td className="p-2.5 font-medium text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded border border-indigo-300 bg-white px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {!isParent && <FolderTree className="h-3.5 w-3.5 text-slate-400 ml-3" />}
                              <span className={isParent ? "font-bold text-indigo-900" : "text-slate-700"}>
                                {cat.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5">
                          {isParent ? (
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              Main Category
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                              Sub of {parentObj?.name || "Parent"}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <button
                            onClick={() => toggleStatus(cat)}
                            disabled={togglingId === cat.id}
                            className="flex items-center gap-1 group cursor-pointer"
                            title="Toggle status"
                          >
                            {togglingId === cat.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                            ) : cat.status === "ACTIVE" ? (
                              <>
                                <ToggleRight className="h-4 w-4 text-emerald-600" />
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 group-hover:bg-emerald-100 transition">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 text-red-400" />
                                <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 group-hover:bg-red-100 transition">
                                  Inactive
                                </span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  disabled={editSaving}
                                  className="rounded p-1 text-emerald-600 hover:bg-emerald-50 transition"
                                  title="Save"
                                >
                                  {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 transition"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(cat)}
                                  className="rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                  title="Edit"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(cat.id)}
                                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="This action cannot be undone. If category is in use, it will be deactivated instead."
        type="DANGER"
        loading={deleting}
      />
    </div>
  );
}
