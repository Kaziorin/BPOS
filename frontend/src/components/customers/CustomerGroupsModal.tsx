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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100 select-none">
      <div className="relative w-full max-w-lg rounded-sm bg-white shadow-xl border border-sky-200/90 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 px-5 py-3.5 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] font-bold border border-sky-200/80 shadow-2xs">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0369A1]">Customer Groups</h2>
              <p className="text-[11px] text-[#0284C7] font-medium">Group customers for special discount rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add New Group Form */}
          <form onSubmit={handleCreateGroup} className="rounded-sm border border-sky-100 bg-sky-50/20 p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Add New Group</h3>
            
            {error && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-2 text-xs text-red-700 shadow-2xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#0369A1] mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Club 10%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-sm border border-sky-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#0369A1] mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full rounded-sm border border-sky-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase text-[#0369A1] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-sm border border-sky-200/90 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Add Group
              </button>
            </div>
          </form>

          {/* Existing Groups List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Existing Groups ({groups.length})</h3>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-[#0284C7]" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs rounded-sm border border-dashed border-sky-200">
                No custom groups created yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-sm border border-sky-100 bg-white p-2.5 hover:border-sky-300 transition shadow-2xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0369A1]">{g.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {g.discountPercent > 0 ? `${g.discountPercent}% default discount` : "0% discount"} &bull; {g._count?.customers || 0} customers
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      className="rounded-sm p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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

        <div className="border-t border-sky-100 bg-sky-50/20 p-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-sm border border-sky-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
