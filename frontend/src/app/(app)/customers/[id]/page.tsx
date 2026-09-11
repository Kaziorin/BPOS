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
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <AlertTriangle size={36} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Customer Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested customer record does not exist or has been removed.</p>
        <Link
          href="/customers"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          <ArrowLeft size={14} /> Back to Customer Directory
        </Link>
      </div>
    );
  }

  const segColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    VIP: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: "👑" },
    HIGH_VALUE: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", icon: "💎" },
    WHOLESALE: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", icon: "🏢" },
    CORPORATE: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", icon: "🏛️" },
    NEW: { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200", icon: "✨" },
    REGULAR: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "👤" },
    AT_RISK: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", icon: "⚠️" },
    INACTIVE: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", icon: "💤" },
  };

  const seg = segColors[customer.segmentation || "REGULAR"] || segColors.REGULAR;
  const currDue = Number(customer.currentDue || 0);

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1";

  const tabs = [
    { key: "details", label: "Profile & Settings" },
    { key: "purchases", label: `Purchase History (${customer.purchaseHistory?.totalOrders || 0})` },
    { key: "notes", label: `Notes & Logs (${customer.customerNotes?.length || 0})` },
    { key: "complaints", label: `Complaints (${customer.complaints?.length || 0})` },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft size={15} /> Back to Customers
        </Link>

        <div className="flex items-center gap-2">
          {currDue > 0 && (
            <button
              onClick={() => setIsCollectDueOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <DollarSign size={14} /> Collect Due (৳{currDue.toLocaleString()})
            </button>
          )}

          {editing ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Profile Header Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-2xl sm:text-3xl font-black text-white shadow-xl shadow-blue-500/30">
              {getInitials(customer.name)}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{customer.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${seg.bg} ${seg.text} ${seg.border}`}>
                  <span>{seg.icon}</span> {customer.segmentation || "REGULAR"}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                <span>{customer.group?.name || "General Group"}</span>
                <span>•</span>
                <span>Member since {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}</span>
                <span>•</span>
                <span className={customer.status === "ACTIVE" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {customer.status || "ACTIVE"}
                </span>
              </p>
            </div>
          </div>

          {/* Contact Action Chips */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-3.5 py-2 text-xs font-bold text-white transition"
              >
                <Phone size={14} /> {customer.phone}
              </a>
            )}
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40 px-3.5 py-2 text-xs font-bold transition"
              >
                💬 WhatsApp
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-3.5 py-2 text-xs font-bold text-white transition"
              >
                <Mail size={14} /> Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 Stats Highlights Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            ৳{Number(customer.purchaseHistory?.totalSpent || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Lifetime POS Revenue</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {customer.purchaseHistory?.totalOrders || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed Invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Due</p>
          <p className={`text-xl font-black mt-1 ${currDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
            ৳{currDue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Limit: ৳{Number(customer.creditLimit || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Loyalty Points</p>
          <p className="text-xl font-black text-amber-600 mt-1 flex items-center gap-1">
            <Award size={20} /> {customer.loyaltyPoints || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Redeemable Rewards</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl px-4 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`border-b-2 py-3 px-4 text-xs font-bold transition ${
              activeTab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="space-y-6">
        {/* Tab 1: Profile Details & Edit */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Customer Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.name || ""}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-xs font-semibold text-slate-900">{customer.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      <p className="text-xs font-semibold text-slate-900">{customer.phone || "—"}</p>
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
                      <p className="text-xs font-semibold text-slate-900 truncate">{customer.email || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>City / Area</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.city || ""}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-900">{customer.city || "—"}</p>
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
                      <p className="text-xs font-semibold text-slate-900">{customer.taxRegNo || "—"}</p>
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
                    <p className="text-xs font-semibold text-slate-900">{customer.address || "—"}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Classification & Terms</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                      <p className="text-xs font-semibold text-slate-900">{customer.segmentation || "REGULAR"}</p>
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
                      <p className="text-xs font-semibold text-slate-900">{customer.status || "ACTIVE"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      <p className="text-xs font-semibold text-slate-900">৳{Number(customer.creditLimit || 0).toLocaleString()}</p>
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
                      <p className="text-xs font-semibold text-slate-900">{customer.creditPeriodDays ? `${customer.creditPeriodDays} Days` : "—"}</p>
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
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">{customer.notes || "No notes on record."}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Recent Purchases */}
        {activeTab === "purchases" && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recent Sales & Invoices</h3>
            {customer.recentSales && customer.recentSales.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {customer.recentSales.map((sale: any) => (
                  <div key={sale.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{sale.invoiceNo}</p>
                        <p className="text-[11px] text-slate-400">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">৳{Number(sale.total).toLocaleString()}</p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sale.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {sale.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No orders recorded for this customer yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Notes & CRM Activity */}
        {activeTab === "notes" && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Activity Logs & Notes</h3>
            
            <form onSubmit={addNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Log phone calls, commitments, or reminders..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add Activity Note
                </button>
              </div>
            </form>

            <div className="space-y-3 pt-2">
              {customer.customerNotes && customer.customerNotes.length > 0 ? (
                customer.customerNotes.map((note: any) => (
                  <div key={note.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1">
                    <p className="text-xs text-slate-800 leading-relaxed">{note.note}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                      <Clock size={11} /> {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Just now"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No customer logs recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Complaints */}
        {activeTab === "complaints" && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Customer Support & Complaints</h3>
            
            <form onSubmit={addComplaint} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delayed Delivery, Item Exchange"
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
                  placeholder="Details of customer issue..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingComplaint || !complaintSubject.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {addingComplaint ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  File Complaint
                </button>
              </div>
            </form>

            <div className="space-y-3 pt-2">
              {customer.complaints && customer.complaints.length > 0 ? (
                customer.complaints.map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{c.subject}</h4>
                      <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-bold">
                        {c.priority}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-slate-600">{c.description}</p>}
                    <p className="text-[10px] text-slate-400">
                      Filed on {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No complaints filed for this customer.</p>
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
