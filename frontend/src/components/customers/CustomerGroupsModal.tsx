"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Users, Plus, Trash2, Percent, Tag, Info } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { ConfirmModal } from "@/components/custom/ConfirmModal";
import { toast } from "react-toastify";

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
  
  const [groupToDelete, setGroupToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      toast.error(err.message || "Failed to load customer groups");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/v1/customer-groups", {
        name: name.trim(),
        discountPercent: Number(discountPercent) || 0,
        description: description.trim() || null,
      });
      setName("");
      setDiscountPercent("");
      setDescription("");
      toast.success(`Group "${name.trim()}" created successfully!`);
      await loadGroups();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!groupToDelete) return;
    setDeleting(true);
    try {
      await api.del(`/v1/customer-groups/${groupToDelete.id}`);
      toast.success(`Group "${groupToDelete.name}" removed.`);
      setGroupToDelete(null);
      await loadGroups();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete group");
    } finally {
      setDeleting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100 select-none">
        <div className="relative w-full max-w-2xl rounded-sm bg-white shadow-2xl border border-brand-border overflow-hidden my-6">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-brand-50/60 via-white to-brand-50/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-indigo-50 text-indigo-600 font-bold border border-indigo-200/80 shadow-2xs">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-brand-dark">Customer Groups & Discount Tiers</h2>
                <p className="text-xs text-brand-primary font-medium">Segment customers into groups with dedicated discount rules and pricing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Add New Group Form */}
            <form onSubmit={handleCreateGroup} className="rounded-sm border border-slate-200 bg-brand-50/25 p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <Plus size={14} className="text-brand-primary" />
                <h3 className="text-sm font-bold text-brand-dark">Add New Customer Group</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-dark mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Club, Wholesale Tier 1, Loyal Retail"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-gray-600 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark mb-1">
                    Default Discount (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full rounded-sm border border-brand-border bg-white pl-3 pr-7 py-2 text-xs font-semibold text-gray-600 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border/20 shadow-2xs"
                    />
                    <Percent size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-brand-dark mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Minimum monthly spend Tk 50,000, 10% instant discount on checkout"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-gray-600 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border/20 shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <CustomButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submitting || !name.trim()}
                  leftIcon={submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                >
                  Create Group
                </CustomButton>
              </div>
            </form>

            {/* Existing Groups List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-brand-primary" />
                  <h3 className="text-sm font-bold text-brand-dark">
                    Existing Groups ({groups.length})
                  </h3>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">Automatic discounts applied at POS</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-brand-primary" />
                  <span className="ml-2 text-xs font-medium text-gray-500">Loading groups...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs rounded-sm border border-dashed border-brand-border bg-brand-50/20">
                  <Info size={20} className="mx-auto text-brand-primary/40 mb-1.5" />
                  No customer groups created yet. Add one above!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-3 rounded-sm border border-slate-200 bg-white p-3 hover:border-brand-border hover:bg-brand-50/50/30 transition shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-600 text-xs sm:text-sm">{g.name}</span>
                          {g.discountPercent > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 text-[10.5px] font-bold">
                              <Percent size={11} /> {g.discountPercent}% Discount
                            </span>
                          ) : (
                            <span className="rounded-sm bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10.5px] font-semibold">
                              0% Discount
                            </span>
                          )}
                          <span className="rounded-sm bg-brand-50 text-brand-primary border border-brand-border px-2 py-0.5 text-[10.5px] font-semibold">
                            {g._count?.customers || 0} customers
                          </span>
                        </div>
                        {g.description && (
                          <p className="text-[11px] text-gray-500 mt-1 truncate font-medium">{g.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => setGroupToDelete(g)}
                        className="rounded-sm p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer shrink-0"
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

          {/* Modal Footer */}
          <div className="border-t border-slate-200 bg-brand-50/30 px-6 py-3.5 flex justify-end">
            <CustomButton
              variant="danger"
              size="sm"
              onClick={onClose}
            >
              Close
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Delete Group Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(groupToDelete)}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Group"
        message={`Are you sure you want to delete the group "${groupToDelete?.name}"? Customers assigned to this group will lose group-specific discount rates.`}
        type="DANGER"
        confirmText="Delete Group"
        loading={deleting}
      />
    </>
  );
}
