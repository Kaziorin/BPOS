"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Edit, Save } from "lucide-react";
import { api } from "@/lib/api";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<"details" | "performance" | "ledger">("details");

  useEffect(() => { loadSupplier(); }, [id]);

  async function loadSupplier() {
    try {
      const result = await api.get<{ data: any }>(`/v1/suppliers/${id}`);
      setSupplier(result.data);
      setForm(result.data);
    } catch (err) {
      console.error("Failed to load supplier:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/v1/suppliers/${id}`, form);
      setEditing(false);
      await loadSupplier();
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  if (!supplier) return <div className="p-6 text-center text-gray-500">Supplier not found</div>;

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700";

  const tabs = [
    { key: "details", label: "Details" },
    { key: "performance", label: "Performance" },
    { key: "ledger", label: "Ledger" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/suppliers")} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="text-sm text-gray-500">{supplier.company || "No company"} · {supplier.city || "No city"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${supplier.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {supplier.status}
          </span>
          {editing ? (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
          ) : (
            <button onClick={() => { setForm(supplier); setEditing(true); }} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Edit size={16} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Purchased", value: `৳${Number(supplier.purchaseHistory?.totalPurchased || 0).toFixed(0)}` },
          { label: "Total POs", value: String(supplier.purchaseHistory?.totalOrders || 0) },
          { label: "Current Due", value: `৳${Number(supplier.currentDue).toFixed(0)}` },
          { label: "Products Supplied", value: String(supplier._count?.products || 0) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`border-b-2 pb-3 text-sm font-medium transition ${activeTab === tab.key ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              {editing ? <input type="text" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Company</label>
              {editing ? <input type="text" value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.company || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>Contact Person</label>
              {editing ? <input type="text" value={form.contactPerson || ""} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.contactPerson || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              {editing ? <input type="text" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.phone || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>Email</label>
              {editing ? <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.email || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>City</label>
              {editing ? <input type="text" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.city || "—"}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              {editing ? <input type="text" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.address || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>VAT Reg No</label>
              {editing ? <input type="text" value={form.vatRegNo || ""} onChange={(e) => setForm({ ...form, vatRegNo: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.vatRegNo || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>Payment Terms (days)</label>
              {editing ? <input type="number" value={form.paymentTermsDays || ""} onChange={(e) => setForm({ ...form, paymentTermsDays: Number(e.target.value) })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.paymentTermsDays ?? "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>Credit Limit</label>
              {editing ? <input type="number" value={form.creditLimit || ""} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">৳{Number(supplier.creditLimit).toFixed(0)}</p>}
            </div>
            <div>
              <label className={labelClass}>Current Due</label>
              <p className="mt-1 text-sm text-gray-900">৳{Number(supplier.currentDue).toFixed(0)}</p>
            </div>
            <div>
              <label className={labelClass}>Rebate %</label>
              {editing ? <input type="number" value={form.rebatePercent || ""} onChange={(e) => setForm({ ...form, rebatePercent: Number(e.target.value) })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{supplier.rebatePercent ?? "—"}%</p>}
            </div>
          </div>
          {supplier.notes && (
            <div>
              <label className={labelClass}>Notes</label>
              <p className="mt-1 text-sm text-gray-600">{supplier.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "performance" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "Delivery Score", value: supplier.deliveryPerformanceScore != null ? `${supplier.deliveryPerformanceScore}%` : "N/A", color: (supplier.deliveryPerformanceScore || 0) >= 90 ? "text-green-600" : (supplier.deliveryPerformanceScore || 0) >= 75 ? "text-yellow-600" : "text-red-600" },
              { label: "Quality Score", value: supplier.qualityScore != null ? `${supplier.qualityScore}%` : "N/A", color: (supplier.qualityScore || 0) >= 90 ? "text-green-600" : (supplier.qualityScore || 0) >= 75 ? "text-yellow-600" : "text-red-600" },
              { label: "Defect Rate", value: supplier.defectRate != null ? `${supplier.defectRate}%` : "N/A", color: (supplier.defectRate || 0) <= 2 ? "text-green-600" : (supplier.defectRate || 0) <= 5 ? "text-yellow-600" : "text-red-600" },
              { label: "Return Rate", value: supplier.returnRate != null ? `${supplier.returnRate}%` : "N/A", color: (supplier.returnRate || 0) <= 1 ? "text-green-600" : (supplier.returnRate || 0) <= 3 ? "text-yellow-600" : "text-red-600" },
              { label: "On-Time Rate", value: supplier.stats?.onTimeRate != null ? `${supplier.stats.onTimeRate}%` : "N/A", color: (supplier.stats?.onTimeRate || 0) >= 90 ? "text-green-600" : (supplier.stats?.onTimeRate || 0) >= 75 ? "text-yellow-600" : "text-red-600" },
              { label: "Total POs", value: String(supplier.stats?.totalPOs || 0), color: "text-gray-900" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          {supplier.lastDeliveryAt && (
            <p className="text-sm text-gray-500">Last delivery: {new Date(supplier.lastDeliveryAt).toLocaleDateString()}</p>
          )}
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Purchase invoices and goods receipts for this supplier will appear here.</p>
          {supplier.recentPOs?.length > 0 ? (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">PO No</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {supplier.recentPOs.map((po: any) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{po.poNo}</td>
                    <td className="px-4 py-3 text-right text-gray-900">৳{Number(po.total).toFixed(0)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${po.status === "COMPLETED" ? "bg-green-100 text-green-700" : po.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{po.status}</span></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="mt-4 text-center text-gray-500">No purchase orders yet</div>
          )}
        </div>
      )}
    </div>
  );
}
