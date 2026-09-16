"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Edit3, Save, Phone, Mail, MapPin, 
  DollarSign, Award, Clock, ShoppingBag, Plus, 
  AlertTriangle, Loader2, User, CheckCircle2, ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb, CustomButton } from "@/components/custom";
import { CollectDueModal } from "@/components/customers/CollectDueModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

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
      setCustomer(null);
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
      await api.post(`/v1/customers/${id}/notes`, { note: noteText });
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
        subject: complaintSubject,
        description: complaintDesc,
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <Loader2 size={28} className="animate-spin text-[#0284C7] mb-2" />
        <p className="text-xs font-semibold text-gray-500">Loading customer profile...</p>
      </div>
    );
  }

  // Centered Theme "Customer Not Found" State (Matches Design Standards)
  if (!customer) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-sm border border-sky-100/90 bg-white p-8 text-center shadow-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm bg-amber-50 text-amber-600 border border-amber-200/80 mb-3.5 shadow-2xs">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-base font-bold text-gray-600">Customer Not Found</h2>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            This customer record does not exist or has been removed from the database.
          </p>
          <div className="mt-5 flex justify-center">
            <CustomButton
              variant="primary"
              size="sm"
              onClick={() => router.push("/customers")}
              leftIcon={<ArrowLeft size={14} />}
            >
              Return to Customers
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  const segBadgeMap: Record<string, { bg: string; text: string; label: string }> = {
    VIP: { bg: "bg-amber-50 text-amber-700 border-amber-200/60", text: "text-amber-700", label: "VIP" },
    HIGH_VALUE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", text: "text-emerald-700", label: "High Value" },
    WHOLESALE: { bg: "bg-sky-50 text-[#0284C7] border-sky-200/60", text: "text-[#0284C7]", label: "Wholesale" },
    CORPORATE: { bg: "bg-purple-50 text-purple-700 border-purple-200/60", text: "text-purple-700", label: "Corporate" },
    NEW: { bg: "bg-sky-50 text-[#0369A1] border-sky-200/60", text: "text-[#0369A1]", label: "New" },
    REGULAR: { bg: "bg-slate-50 text-gray-600 border-slate-200/80", text: "text-gray-600", label: "Regular" },
    AT_RISK: { bg: "bg-rose-50 text-rose-700 border-rose-200/60", text: "text-rose-700", label: "At Risk" },
    INACTIVE: { bg: "bg-rose-50/60 text-rose-600 border-rose-200/50", text: "text-rose-600", label: "Inactive" },
  };

  const seg = segBadgeMap[customer.segmentation || "REGULAR"] || segBadgeMap.REGULAR;
  const currDue = Number(customer.currentDue || 0);

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const inputClass =
    "w-full rounded-sm border border-sky-200/90 bg-white px-3 py-1.5 text-xs text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs";
  const labelClass = "block text-[11px] font-semibold text-[#0369A1] mb-1";

  const tabs = [
    { key: "details", label: "Profile & Settings" },
    { key: "purchases", label: `Purchase History (${customer.purchaseHistory?.totalOrders || 0})` },
    { key: "notes", label: `Activity Notes (${customer.customerNotes?.length || 0})` },
    { key: "complaints", label: `Complaints (${customer.complaints?.length || 0})` },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      {/* ── Top Breadcrumb Header ── */}
      <CustomBreadcrumb
        title={customer.name}
        icon={<User size={20} />}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: customer.name },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => router.push("/customers")}
              className="border-sky-200/90 bg-white text-gray-600 hover:bg-sky-50 hover:text-[#0284C7] font-semibold shadow-2xs"
            >
              <ArrowLeft size={14} className="text-[#0284C7]" />
              Back to List
            </CustomButton>

            {currDue > 0 && (
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setIsCollectDueOpen(true)}
                className="border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100 font-semibold shadow-2xs"
              >
                <DollarSign size={14} className="text-rose-600" />
                Collect Due (৳{currDue.toLocaleString()})
              </CustomButton>
            )}

            {editing ? (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save Changes
              </CustomButton>
            ) : (
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="border-sky-200/90 bg-white text-[#0284C7] hover:bg-sky-50 font-semibold shadow-2xs"
              >
                <Edit3 size={14} />
                Edit Profile
              </CustomButton>
            )}
          </div>
        }
      />

      {/* ── Profile Header Card ── */}
      <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 text-base font-bold shadow-2xs">
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-600">{customer.name}</h1>
                <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold ${seg.bg}`}>
                  {seg.label}
                </span>
                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                  customer.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80" : "bg-rose-50 text-rose-700 border border-rose-200/80"
                }`}>
                  {customer.status || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Group: <span className="font-semibold text-gray-600">{customer.group?.name || "General"}</span> &bull; Customer since {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          {/* Contact Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1 rounded-sm border border-sky-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-sky-50 hover:text-[#0284C7] transition shadow-2xs"
              >
                <Phone size={12} className="text-[#0284C7]" /> {customer.phone}
              </a>
            )}
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
              >
                WhatsApp
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1 rounded-sm border border-sky-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-sky-50 hover:text-[#0284C7] transition shadow-2xs"
              >
                <Mail size={12} className="text-[#0284C7]" /> Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Key Metrics Cards (Single-line clean stats) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-sm border border-sky-100/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Total Spent</p>
          <p className="text-base font-bold text-gray-600 mt-0.5 tabular-nums">
            ৳{Number(customer.purchaseHistory?.totalSpent || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-sm border border-sky-100/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Total Orders</p>
          <p className="text-base font-bold text-[#0284C7] mt-0.5 tabular-nums">
            {customer.purchaseHistory?.totalOrders || 0}
          </p>
        </div>

        <div className="rounded-sm border border-sky-100/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Current Due</p>
          <p className={`text-base font-bold mt-0.5 tabular-nums ${currDue > 0 ? "text-rose-600" : "text-gray-600"}`}>
            ৳{currDue.toLocaleString()}
          </p>
        </div>

        <div className="rounded-sm border border-sky-100/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px] font-semibold uppercase text-gray-400">Loyalty Points</p>
          <p className="text-base font-bold text-amber-700 mt-0.5 flex items-center gap-1 tabular-nums">
            <Award size={15} /> {customer.loyaltyPoints || 0}
          </p>
        </div>
      </div>

      {/* ── Tabs Bar ── */}
      <div className="flex border-b border-sky-100/90 bg-white rounded-sm px-3 shadow-2xs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`border-b-2 py-2.5 px-3 text-xs font-semibold transition cursor-pointer ${
              activeTab === t.key
                ? "border-[#0284C7] text-[#0284C7] font-bold"
                : "border-transparent text-gray-500 hover:text-[#0284C7]"
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
            <div className="rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Contact & Personal</h3>
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
                    <p className="text-xs font-medium text-gray-600">{customer.name}</p>
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
                      <p className="text-xs font-medium text-gray-600">{customer.phone || "—"}</p>
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
                      <p className="text-xs font-medium text-gray-600 truncate">{customer.email || "—"}</p>
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
                      <p className="text-xs font-medium text-gray-600">{customer.city || "—"}</p>
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
                      <p className="text-xs font-medium text-gray-600">{customer.taxRegNo || "—"}</p>
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
                    <p className="text-xs font-medium text-gray-600">{customer.address || "—"}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Classification & Credit</h3>
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
                      <p className="text-xs font-medium text-gray-600">{customer.segmentation || "REGULAR"}</p>
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
                      <p className="text-xs font-medium text-gray-600">{customer.status || "ACTIVE"}</p>
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
                      <p className="text-xs font-medium text-gray-600">৳{Number(customer.creditLimit || 0).toLocaleString()}</p>
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
                      <p className="text-xs font-medium text-gray-600">{customer.creditPeriodDays ? `${customer.creditPeriodDays} Days` : "—"}</p>
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
                    <p className="text-xs text-gray-600 bg-sky-50/40 p-2.5 rounded-sm border border-sky-100">{customer.notes || "No notes on record."}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Purchase History */}
        {activeTab === "purchases" && (
          <div className="rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Recent Invoices & Orders</h3>
            {customer.recentSales && customer.recentSales.length > 0 ? (
              <div className="divide-y divide-sky-100/60">
                {customer.recentSales.map((sale: any) => (
                  <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80">
                        <ShoppingBag size={14} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-600">{sale.invoiceNo}</p>
                        <p className="text-[11px] text-gray-400">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-600">৳{Number(sale.total).toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200/60">
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
          <div className="rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Activity Notes & Logs</h3>
            
            <form onSubmit={addNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Log customer contact or reminder..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full rounded-sm border border-sky-200/90 p-2.5 text-xs text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none shadow-2xs"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {addingNote ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Add Activity Note
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-1">
              {customer.customerNotes && customer.customerNotes.length > 0 ? (
                customer.customerNotes.map((note: any) => (
                  <div key={note.id} className="rounded-sm border border-sky-100 bg-sky-50/30 p-3 text-xs space-y-1">
                    <p className="text-gray-600 leading-relaxed">{note.note}</p>
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
          <div className="rounded-sm border border-sky-100/90 bg-white p-4 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Customer Complaints & Feedback</h3>
            
            <form onSubmit={addComplaint} className="rounded-sm border border-sky-100 bg-sky-50/20 p-3.5 space-y-2.5">
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
                  className="inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {addingComplaint ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  File Complaint
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-1">
              {customer.complaints && customer.complaints.length > 0 ? (
                customer.complaints.map((c: any) => (
                  <div key={c.id} className="rounded-sm border border-sky-100 bg-white p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-600">{c.subject}</h4>
                      <span className="rounded-sm bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">
                        {c.priority}
                      </span>
                    </div>
                    {c.description && <p className="text-gray-500">{c.description}</p>}
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
