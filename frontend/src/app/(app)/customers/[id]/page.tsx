"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Edit, Save, MessageSquare, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "complaints" | "purchases">("details");
  const [noteText, setNoteText] = useState("");
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");

  useEffect(() => { loadCustomer(); }, [id]);

  async function loadCustomer() {
    try {
      const result = await api.get<{ data: any }>(`/v1/customers/${id}`);
      setCustomer(result.data);
      setForm(result.data);
    } catch (err) {
      console.error("Failed to load customer:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/v1/customers/${id}`, form);
      setEditing(false);
      await loadCustomer();
    } catch (err: any) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    try {
      await api.post(`/v1/customers/${id}/notes`, { note: noteText });
      setNoteText("");
      await loadCustomer();
    } catch (err: any) {
      alert(err.message || "Failed to add note");
    }
  }

  async function addComplaint() {
    if (!complaintSubject.trim()) return;
    try {
      await api.post(`/v1/customers/${id}/complaints`, { subject: complaintSubject, description: complaintDesc });
      setComplaintSubject("");
      setComplaintDesc("");
      await loadCustomer();
    } catch (err: any) {
      alert(err.message || "Failed to add complaint");
    }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  if (!customer) return <div className="p-6 text-center text-gray-500">Customer not found</div>;

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700";

  const segColors: Record<string, string> = {
    VIP: "bg-yellow-100 text-yellow-700",
    REGULAR: "bg-gray-100 text-gray-700",
    WHOLESALE: "bg-blue-100 text-blue-700",
    CORPORATE: "bg-purple-100 text-purple-700",
    NEW: "bg-green-100 text-green-700",
    INACTIVE: "bg-red-100 text-red-700",
    HIGH_VALUE: "bg-orange-100 text-orange-700",
    AT_RISK: "bg-amber-100 text-amber-700",
  };

  const tabs = [
    { key: "details", label: "Details" },
    { key: "purchases", label: `Purchases (${customer.purchaseHistory?.totalOrders || 0})` },
    { key: "notes", label: `Notes (${customer.customerNotes?.length || 0})` },
    { key: "complaints", label: `Complaints (${customer.complaints?.length || 0})` },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/customers")} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">{customer.phone || "No phone"} · {customer.group?.name || "No group"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${segColors[customer.segmentation || "REGULAR"] || "bg-gray-100 text-gray-700"}`}>
            {customer.segmentation || "N/A"}
          </span>
          {editing ? (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
          ) : (
            <button onClick={() => { setForm(customer); setEditing(true); }} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Edit size={16} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Spent", value: `৳${Number(customer.purchaseHistory?.totalSpent || 0).toFixed(0)}` },
          { label: "Total Orders", value: String(customer.purchaseHistory?.totalOrders || 0) },
          { label: "Current Due", value: `৳${Number(customer.currentDue).toFixed(0)}` },
          { label: "Loyalty Points", value: String(customer.loyaltyPoints || 0) },
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
              {editing ? <input type="text" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{customer.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              {editing ? <input type="text" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{customer.phone || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>Email</label>
              {editing ? <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{customer.email || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>City</label>
              {editing ? <input type="text" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{customer.city || "—"}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              {editing ? <input type="text" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">{customer.address || "—"}</p>}
            </div>
            <div>
              <label className={labelClass}>Credit Limit</label>
              {editing ? <input type="number" value={form.creditLimit || ""} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} className={inputClass} /> : <p className="mt-1 text-sm text-gray-900">৳{Number(customer.creditLimit).toFixed(0)}</p>}
            </div>
            <div>
              <label className={labelClass}>Current Due</label>
              <p className="mt-1 text-sm text-gray-900">৳{Number(customer.currentDue).toFixed(0)}</p>
            </div>
            <div>
              <label className={labelClass}>Wallet Balance</label>
              <p className="mt-1 text-sm text-gray-900">৳{Number(customer.walletBalance).toFixed(0)}</p>
            </div>
            <div>
              <label className={labelClass}>Store Credit</label>
              <p className="mt-1 text-sm text-gray-900">৳{Number(customer.storeCredit).toFixed(0)}</p>
            </div>
          </div>
          {customer.notes && (
            <div>
              <label className={labelClass}>Notes</label>
              <p className="mt-1 text-sm text-gray-600">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "purchases" && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          {customer.recentSales?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.recentSales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.invoiceNo}</td>
                    <td className="px-4 py-3 text-right text-gray-900">৳{Number(s.total).toFixed(0)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "PAID" ? "bg-green-100 text-green-700" : s.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{s.status}</span></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">No purchase history</div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
              <button onClick={addNote} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                <MessageSquare size={14} /> Add
              </button>
            </div>
          </div>
          {customer.customerNotes?.map((n: any) => (
            <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-900">{n.note}</p>
              <p className="mt-2 text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "complaints" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <input type="text" placeholder="Complaint subject" value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
            <textarea placeholder="Description (optional)" value={complaintDesc} onChange={(e) => setComplaintDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
            <button onClick={addComplaint} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              <AlertTriangle size={14} /> Log Complaint
            </button>
          </div>
          {customer.complaints?.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{c.subject}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.priority === "URGENT" ? "bg-red-100 text-red-700" : c.priority === "HIGH" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>{c.priority}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "RESOLVED" ? "bg-green-100 text-green-700" : c.status === "CLOSED" ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-700"}`}>{c.status}</span>
                </div>
              </div>
              {c.description && <p className="mt-2 text-sm text-gray-600">{c.description}</p>}
              <p className="mt-2 text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
