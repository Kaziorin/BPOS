"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader2, ArrowLeft, Edit3, Save, MessageSquare, AlertTriangle, 
  Phone, Mail, MapPin, DollarSign, ShoppingBag, Award, Clock, 
  CheckCircle2, Plus, Calendar, ShieldCheck, ChevronRight, X 
} from "lucide-react";
import { api } from "@/lib/api";
import { CollectDueModal } from "@/components/customers/CollectDueModal";

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
  const [addingNote, setAddingNote] = useState(false);

  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("MEDIUM");
  const [addingComplaint, setAddingComplaint] = useState(false);

  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);

  const loadCustomer = useCallback(async () => {
    try {
      const result = await api.get<{ data: any }>(`/v1/customers/${id}`);
      setCustomer(result.data);
      setForm(result.data);
    } catch (err) {
      console.error("Failed to load customer:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
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

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/v1/customers/${id}/notes`, { note: noteText.trim() });
      setNoteText("");
      await loadCustomer();
    } catch (err: any) {
      alert(err.message || "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  }

  async function addComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!complaintSubject.trim()) return;
    setAddingComplaint(true);
    try {
      await api.post(`/v1/customers/${id}/complaints`, { 
        subject: complaintSubject.trim(), 
        description: complaintDesc.trim(),
        priority: complaintPriority,
      });
      setComplaintSubject("");
      setComplaintDesc("");
      await loadCustomer();
    } catch (err: any) {
      alert(err.message || "Failed to add complaint");
    } finally {
      setAddingComplaint(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary-600 mb-2" />
        <p className="text-xs font-medium text-gray-500">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-xs">
        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2" />
        <h2 className="text-sm font-bold text-gray-900">Customer Not Found</h2>
        <p className="text-xs text-gray-500 mt-1">This customer record does not exist or has been removed.</p>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          <ArrowLeft size={13} /> Return to Customers
        </Link>
      </div>
    );
  }

  const segBadgeMap: Record<string, { bg: string; text: string; label: string }> = {
    VIP: { bg: "bg-amber-50 text-amber-700 border-amber-200/60", text: "text-amber-700", label: "VIP" },
    HIGH_VALUE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", text: "text-emerald-700", label: "High Value" },
    WHOLESALE: { bg: "bg-primary-50 text-primary-700 border-primary-200/60", text: "text-primary-700", label: "Wholesale" },
    CORPORATE: { bg: "bg-purple-50 text-purple-700 border-purple-200/60", text: "text-purple-700", label: "Corporate" },
    NEW: { bg: "bg-sky-50 text-sky-700 border-sky-200/60", text: "text-sky-700", label: "New" },
    REGULAR: { bg: "bg-gray-50 text-gray-700 border-gray-200", text: "text-gray-700", label: "Regular" },
    AT_RISK: { bg: "bg-rose-50 text-rose-700 border-rose-200/60", text: "text-rose-700", label: "At Risk" },
    INACTIVE: { bg: "bg-gray-100 text-gray-500 border-gray-200", text: "text-gray-500", label: "Inactive" },
  };

  const seg = segBadgeMap[customer.segmentation || "REGULAR"] || segBadgeMap.REGULAR;
  const currDue = Number(customer.currentDue || 0);

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none";
  const labelClass = "block text-[11px] font-semibold text-gray-600 mb-1";

  const tabs = [
    { key: "details", label: "Profile & Settings" },
    { key: "purchases", label: `Purchase History (${customer.purchaseHistory?.totalOrders || 0})` },
    { key: "notes", label: `Activity Notes (${customer.customerNotes?.length || 0})` },
    { key: "complaints", label: `Complaints (${customer.complaints?.length || 0})` },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={13} /> Back to Customers
        </Link>

        <div className="flex items-center gap-2">
          {currDue > 0 && (
            <button
              onClick={() => setIsCollectDueOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <DollarSign size={13} /> Collect Due (৳{currDue.toLocaleString()})
            </button>
          )}

          {editing ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit3 size={13} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Header Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-200/60 text-lg font-bold">
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">{customer.name}</h1>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-semibold ${seg.bg}`}>
                  {seg.label}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                  customer.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${customer.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {customer.status || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Group: {customer.group?.name || "General"} &bull; Customer since {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          {/* Contact Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Phone size={12} /> {customer.phone}
              </a>
            )}
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium hover:bg-emerald-100"
              >
                WhatsApp
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Mail size={12} /> Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Total Spent</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">
            ৳{Number(customer.purchaseHistory?.totalSpent || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Total Orders</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">
            {customer.purchaseHistory?.totalOrders || 0}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Current Due</p>
          <p className={`text-base font-bold mt-0.5 ${currDue > 0 ? "text-rose-600" : "text-gray-900"}`}>
            ৳{currDue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Loyalty Points</p>
          <p className="text-base font-bold text-amber-600 mt-0.5 flex items-center gap-1">
            <Award size={15} /> {customer.loyaltyPoints || 0}
          </p>
        </div>
      </div>

      {/* ── Tabs Bar ── */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl px-3 shadow-xs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`border-b-2 py-2.5 px-3 text-xs font-medium transition ${
              activeTab === t.key
                ? "border-primary-600 text-primary-700 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="space-y-4">
        {/* Tab 1: Profile & Settings */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Contact & Personal</h3>
              <div className="space-y-2.5">
                <div>
                  <label className={labelClass}>Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.name || ""}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-xs font-medium text-gray-900">{customer.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Phone</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.phone || ""}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900">{customer.phone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    {editing ? (
                      <input
                        type="email"
                        value={form.email || ""}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900 truncate">{customer.email || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>City</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.city || ""}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900">{customer.city || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Tax Reg No / BIN</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.taxRegNo || ""}
                        onChange={(e) => setForm({ ...form, taxRegNo: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900">{customer.taxRegNo || "—"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Street Address</label>
                  {editing ? (
                    <textarea
                      rows={2}
                      value={form.address || ""}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-xs font-medium text-gray-900">{customer.address || "—"}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Classification & Credit</h3>
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Segment</label>
                    {editing ? (
                      <select
                        value={form.segmentation || "REGULAR"}
                        onChange={(e) => setForm({ ...form, segmentation: e.target.value })}
                        className={inputClass}
                      >
                        <option value="NEW">New</option>
                        <option value="REGULAR">Regular</option>
                        <option value="VIP">VIP</option>
                        <option value="HIGH_VALUE">High Value</option>
                        <option value="WHOLESALE">Wholesale</option>
                        <option value="CORPORATE">Corporate</option>
                        <option value="AT_RISK">At Risk</option>
                      </select>
                    ) : (
                      <p className="text-xs font-medium text-gray-900">{customer.segmentation || "REGULAR"}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Status</label>
                    {editing ? (
                      <select
                        value={form.status || "ACTIVE"}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className={inputClass}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    ) : (
                      <p className="text-xs font-medium text-gray-900">{customer.status || "ACTIVE"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Credit Limit (৳)</label>
                    {editing ? (
                      <input
                        type="number"
                        value={form.creditLimit || 0}
                        onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900">৳{Number(customer.creditLimit || 0).toLocaleString()}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Credit Period (Days)</label>
                    {editing ? (
                      <input
                        type="number"
                        value={form.creditPeriodDays || ""}
                        onChange={(e) => setForm({ ...form, creditPeriodDays: Number(e.target.value) })}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900">{customer.creditPeriodDays ? `${customer.creditPeriodDays} Days` : "—"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Internal Notes</label>
                  {editing ? (
                    <textarea
                      rows={3}
                      value={form.notes || ""}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg">{customer.notes || "No notes on record."}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Purchase History */}
        {activeTab === "purchases" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Recent Invoices & Orders</h3>
            {customer.recentSales && customer.recentSales.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {customer.recentSales.map((sale: any) => (
                  <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                        <ShoppingBag size={14} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{sale.invoiceNo}</p>
                        <p className="text-[11px] text-gray-400">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">৳{Number(sale.total).toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-xs text-gray-400">No orders recorded for this customer yet.</p>
            )}
          </div>
        )}

        {/* Tab 3: Notes & CRM Activity */}
        {activeTab === "notes" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Activity Notes & Logs</h3>
            
            <form onSubmit={addNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Log customer contact or reminder..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {addingNote ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Add Activity Note
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-1">
              {customer.customerNotes && customer.customerNotes.length > 0 ? (
                customer.customerNotes.map((note: any) => (
                  <div key={note.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-xs space-y-1">
                    <p className="text-gray-800 leading-relaxed">{note.note}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 pt-0.5">
                      <Clock size={10} /> {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Just now"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">No customer logs recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Complaints */}
        {activeTab === "complaints" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Customer Complaints & Feedback</h3>
            
            <form onSubmit={addComplaint} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3.5 space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Issue description"
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    value={complaintPriority}
                    onChange={(e) => setComplaintPriority(e.target.value)}
                    className={inputClass}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Details..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingComplaint || !complaintSubject.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {addingComplaint ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  File Complaint
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-1">
              {customer.complaints && customer.complaints.length > 0 ? (
                customer.complaints.map((c: any) => (
                  <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{c.subject}</h4>
                      <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.2 text-[10px] font-bold">
                        {c.priority}
                      </span>
                    </div>
                    {c.description && <p className="text-gray-600">{c.description}</p>}
                    <p className="text-[10px] text-gray-400">
                      Filed on {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">No complaints filed for this customer.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collect Due Modal */}
      <CollectDueModal
        isOpen={isCollectDueOpen}
        onClose={() => setIsCollectDueOpen(false)}
        onSuccess={loadCustomer}
        customer={customer}
      />
    </div>
  );
}
