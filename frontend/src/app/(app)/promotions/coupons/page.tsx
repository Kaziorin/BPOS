"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Ticket, Trash2, Copy } from "lucide-react";
import { api } from "@/lib/api";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: string;
  minAmount: string | null;
  maxDiscount: string | null;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  promotion?: { id: string; name: string } | null;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", discountType: "PERCENTAGE", discountValue: "", minAmount: "", maxDiscount: "", usageLimit: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCoupons(); }, []);

  async function loadCoupons() {
    try {
      const result = await api.get<{ data: Coupon[] }>("/v1/coupons");
      setCoupons(result.data);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createCoupon() {
    if (!form.code || !form.discountValue) return;
    setSaving(true);
    try {
      await api.post("/v1/coupons", {
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minAmount: form.minAmount ? parseFloat(form.minAmount) : undefined,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
      });
      setShowCreate(false);
      setForm({ code: "", description: "", discountType: "PERCENTAGE", discountValue: "", minAmount: "", maxDiscount: "", usageLimit: "" });
      await loadCoupons();
    } catch (err: any) {
      alert(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    try { await api.del(`/v1/coupons/${id}`); await loadCoupons(); } catch (err) { console.error(err); }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">Manage coupon/promo codes for customers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Ticket size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No coupons yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Min Amount</th>
                <th className="px-4 py-3 text-center">Usage</th>
                <th className="px-4 py-3">Valid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-gray-600" title="Copy"><Copy size={12} /></button>
                    </div>
                    {c.promotion && <p className="text-xs text-gray-500">Linked: {c.promotion.name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{c.discountType}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `৳${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.minAmount ? `৳${c.minAmount}` : "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {c.usageLimit ? `${c.usageCount}/${c.usageLimit}` : `${c.usageCount} ∞`}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.validFrom && <span>From {new Date(c.validFrom).toLocaleDateString()}</span>}
                    {c.validTo && <span> · To {new Date(c.validTo).toLocaleDateString()}</span>}
                    {!c.validFrom && !c.validTo && <span>No expiry</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteCoupon(c.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Create Coupon</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Type *</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value *</label>
                  <input type="number" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder="e.g. 20" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Amount</label>
                  <input type="number" step="0.01" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="Optional" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Discount</label>
                  <input type="number" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="Optional" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={createCoupon} disabled={saving || !form.code || !form.discountValue} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
