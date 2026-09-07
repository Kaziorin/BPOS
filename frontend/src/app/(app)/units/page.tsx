"use client";

import { useEffect, useState } from "react";
import {
  Plus, Scale, Loader2, CheckCircle2, Edit3, Trash2, X, Save, ToggleLeft, ToggleRight,
} from "lucide-react";
import { api } from "@/lib/api";

interface Unit {
  id: string;
  name: string;
  code?: string;
  status?: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get<any>("/v1/units");
      setUnits(Array.isArray(res.data || res) ? res.data || res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/v1/units", { name, code: code || name.toLowerCase().slice(0, 8) });
      setName("");
      setCode("");
      setMsg("Unit created successfully!");
      loadData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to create unit");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(u: Unit) {
    setEditId(u.id);
    setEditName(u.name);
    setEditCode(u.code || "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditName("");
    setEditCode("");
  }

  async function saveEdit() {
    if (!editId || !editName) return;
    setEditSaving(true);
    try {
      await api.put(`/v1/units/${editId}`, { name: editName, code: editCode });
      setMsg("Unit updated!");
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
      const res: any = await api.del(`/v1/units/${deleteId}`);
      if (res?.deactivated) {
        setMsg(`Unit deactivated (${res.reason})`);
      } else {
        setMsg("Unit deleted!");
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

  async function toggleStatus(u: Unit) {
    setTogglingId(u.id);
    const newStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/v1/units/${u.id}`, { status: newStatus });
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
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Units of Measure</h1>
            <p className="text-xs text-slate-500">Manage product units (Piece, Kg, Box, Bottle, Liter)</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CREATE FORM */}
        <div className="lg:col-span-4 bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2">
            Add New Unit
          </h2>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kilogram, Box, Bottle"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Code / Abbreviation</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. kg, box, btl, pcs"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Save Unit
            </button>
          </form>
        </div>

        {/* LIST TABLE */}
        <div className="lg:col-span-8 bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-2 mb-3">
            Units List ({units.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center p-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : units.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No units created yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="p-2.5">Unit Name</th>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units.map((u) => {
                    const isEditing = editId === u.id;
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/80 transition ${isEditing ? "bg-indigo-50/40" : ""}`}>
                        <td className="p-2.5 font-bold text-slate-900">
                          {isEditing ? (
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded border border-indigo-300 bg-white px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none" autoFocus />
                          ) : (
                            u.name
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {isEditing ? (
                            <input type="text" value={editCode} onChange={(e) => setEditCode(e.target.value)}
                              className="w-full rounded border border-indigo-300 bg-white px-2 py-1 text-xs font-mono focus:border-indigo-500 focus:outline-none" />
                          ) : (
                            u.code || "—"
                          )}
                        </td>
                        <td className="p-2.5">
                          <button onClick={() => toggleStatus(u)} disabled={togglingId === u.id}
                            className="flex items-center gap-1 group cursor-pointer" title="Toggle status">
                            {togglingId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                            ) : u.status === "ACTIVE" ? (
                              <>
                                <ToggleRight className="h-4 w-4 text-emerald-600" />
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 group-hover:bg-emerald-100 transition">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 text-red-400" />
                                <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 group-hover:bg-red-100 transition">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button onClick={saveEdit} disabled={editSaving}
                                  className="rounded p-1 text-emerald-600 hover:bg-emerald-50 transition" title="Save">
                                  {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                </button>
                                <button onClick={cancelEdit}
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 transition" title="Cancel">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(u)}
                                  className="rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition" title="Edit">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setDeleteId(u.id)}
                                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Delete">
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
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Unit</h3>
                <p className="text-xs text-slate-500">If unit is used by products, it will be deactivated instead.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteId(null)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition">
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
