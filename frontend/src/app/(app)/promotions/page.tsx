"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Tag, Trash2, Percent, DollarSign, Clock, Gift } from "lucide-react";
import { api } from "@/lib/api";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: string;
  priority: number;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  usageLimit: number | null;
  usageCount: number;
  _count: { products: number; coupons: number };
}

const typeIcons: Record<string, any> = {
  PERCENTAGE: Percent, FIXED: DollarSign, BUY_X_GET_Y: Gift, BUNDLE: Tag, COMBO: Tag,
  CATEGORY_DISCOUNT: Tag, PRODUCT_DISCOUNT: Tag, BRANCH_DISCOUNT: Tag,
  CUSTOMER_GROUP_DISCOUNT: Tag, HAPPY_HOUR: Clock, COUPON: Tag,
};

const typeColors: Record<string, string> = {
  PERCENTAGE: "bg-green-100 text-green-700", FIXED: "bg-blue-100 text-blue-700",
  BUY_X_GET_Y: "bg-purple-100 text-purple-700", BUNDLE: "bg-orange-100 text-orange-700",
  COMBO: "bg-yellow-100 text-yellow-700", HAPPY_HOUR: "bg-pink-100 text-pink-700",
  COUPON: "bg-indigo-100 text-indigo-700",
};

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "PERCENTAGE", value: "", description: "", priority: "0", usageLimit: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPromos(); }, []);

  async function loadPromos() {
    try {
      const result = await api.get<{ data: Promotion[] }>("/v1/promotions");
      setPromos(result.data);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createPromo() {
    if (!form.name || !form.value) return;
    setSaving(true);
    try {
      await api.post("/v1/promotions", {
        name: form.name,
        type: form.type,
        value: parseFloat(form.value),
        description: form.description || undefined,
        priority: parseInt(form.priority) || 0,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
      });
      setShowCreate(false);
      setForm({ name: "", type: "PERCENTAGE", value: "", description: "", priority: "0", usageLimit: "" });
      await loadPromos();
    } catch (err: any) {
      alert(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function deletePromo(id: string) {
    if (!confirm("Delete this promotion?")) return;
    try { await api.del(`/v1/promotions/${id}`); await loadPromos(); } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage discounts, combos, happy hours, and promotional pricing</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus size={16} /> Create Promotion
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : promos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Tag size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No promotions yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => {
            const Icon = typeIcons[p.type] || Tag;
            return (
              <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Icon size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[p.type] || "bg-gray-100 text-gray-700"}`}>{p.type.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <button onClick={() => deletePromo(p.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>Value: {p.type.includes("PERCENTAGE") || p.type === "HAPPY_HOUR" ? `${p.value}%` : `৳${p.value}`}</p>
                  {p.usageLimit && <p>Usage: {p.usageCount}/{p.usageLimit}</p>}
                  {p.validFrom && <p>From: {new Date(p.validFrom).toLocaleDateString()}</p>}
                  {p.validTo && <p>To: {new Date(p.validTo).toLocaleDateString()}</p>}
                  <p>{p._count.products} products · {p._count.coupons} coupons</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${p.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xs text-gray-500">{p.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Create Promotion</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale 20%" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="BUY_X_GET_Y">Buy X Get Y</option>
                    <option value="BUNDLE">Bundle</option>
                    <option value="COMBO">Combo</option>
                    <option value="HAPPY_HOUR">Happy Hour</option>
                    <option value="PRODUCT_DISCOUNT">Product Discount</option>
                    <option value="CATEGORY_DISCOUNT">Category Discount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value *</label>
                  <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. 20" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
                  <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={createPromo} disabled={saving || !form.name || !form.value} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
