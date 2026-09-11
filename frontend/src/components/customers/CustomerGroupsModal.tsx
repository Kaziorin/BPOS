"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Users, Plus, Trash2, Percent, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface CustomerGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomerGroupsModal({ isOpen, onClose, onSuccess }: CustomerGroupsModalProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  async function loadGroups() {
    setLoading(true);
    try {
      const res = await api.get<{ data: any[] }>("/v1/customer-groups");
      setGroups(res.data || []);
    } catch (err: any) {
      console.error("Load groups error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/v1/customer-groups", {
        name: name.trim(),
        discountPercent: Number(discountPercent) || 0,
        description: description.trim() || null,
      });
      setName("");
      setDiscountPercent("");
      setDescription("");
      await loadGroups();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Are you sure you want to remove this group?")) return;
    try {
      await api.del(`/v1/customer-groups/${id}`);
      await loadGroups();
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to delete group");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Customer Groups</h2>
              <p className="text-xs text-slate-500">Categorize customers with custom discount rules</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Group Form */}
          <form onSubmit={handleCreateGroup} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Create New Group</h3>
            
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Club 10%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Default Discount %</label>
                <div className="relative">
                  <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="0"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Special pricing for corporate partners..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm shadow-purple-500/20 transition disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Add Group
              </button>
            </div>
          </form>

          {/* Existing Groups List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Existing Groups ({groups.length})</h3>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-purple-600" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs rounded-xl border border-dashed border-slate-200">
                No custom customer groups yet. Create one above!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-purple-200 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{g.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {g.discountPercent > 0 ? `${g.discountPercent}% default discount` : "Standard pricing"} • {g._count?.customers || 0} customers
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete Group"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
