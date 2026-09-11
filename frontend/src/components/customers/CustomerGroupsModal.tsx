"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Users, Plus, Trash2, Percent } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 font-bold border border-primary-200/60">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Customer Groups</h2>
              <p className="text-[11px] text-gray-500">Group customers for special discount rules</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add New Group Form */}
          <form onSubmit={handleCreateGroup} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3.5 space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">Add New Group</h3>
            
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-600 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Club 10%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-600 mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold uppercase text-gray-600 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add Group
              </button>
            </div>
          </form>

          {/* Existing Groups List */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">Existing Groups ({groups.length})</h3>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-primary-600" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-xs rounded border border-dashed border-gray-200">
                No custom groups created yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2.5 hover:border-gray-300 transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{g.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {g.discountPercent > 0 ? `${g.discountPercent}% default discount` : "0% discount"} &bull; {g._count?.customers || 0} customers
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete Group"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50/50 p-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
