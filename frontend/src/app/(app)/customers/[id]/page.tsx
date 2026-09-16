"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Edit3, Save, Phone, Mail, MapPin, 
  DollarSign, Award, Clock, ShoppingBag, Plus, 
  AlertTriangle, Loader2, User, CheckCircle2, ChevronRight,
  Building, FileText, Package, CreditCard, ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb, CustomButton, CustomStatCard } from "@/components/custom";
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
    VIP: { bg: "bg-amber-50 text-amber-700 border-amber-300", text: "text-amber-700", label: "VIP Customer" },
    HIGH_VALUE: { bg: "bg-purple-50 text-purple-700 border-purple-300", text: "text-purple-700", label: "High Value" },
    REGULAR: { bg: "bg-sky-50 text-[#0284C7] border-sky-300", text: "text-[#0284C7]", label: "Regular" },
    NEW: { bg: "bg-sky-50 text-[#0369A1] border-sky-300", text: "text-[#0369A1]", label: "New Customer" },
    WHOLESALE: { bg: "bg-indigo-50 text-indigo-700 border-indigo-300", text: "text-indigo-700", label: "Wholesale" },
    CORPORATE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-300", text: "text-emerald-700", label: "Corporate" },
    AT_RISK: { bg: "bg-rose-50 text-rose-700 border-rose-300", text: "text-rose-700", label: "At Risk" },
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
    "w-full rounded-sm border border-sky-200/90 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs";
  const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-[#0369A1] mb-1.5";

  const tabs = [
    { key: "details", label: "Profile & Settings" },
    { key: "purchases", label: `Purchase History (${customer.purchaseHistory?.totalOrders || 0})` },
    { key: "notes", label: `Activity Notes (${customer.customerNotes?.length || 0})` },
    { key: "complaints", label: `Complaints (${customer.complaints?.length || 0})` },
  ];

  return (
    <div className="w-full space-y-5 pb-12">
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
              className="border-sky-200/90 bg-white text-[#0369A1] hover:bg-sky-50 font-bold shadow-2xs"
            >
              <ArrowLeft size={14} className="text-[#0284C7]" />
              Back to List
            </CustomButton>

            {currDue > 0 && (
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => setIsCollectDueOpen(true)}
                className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold shadow-2xs"
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
                variant="primary"
                size="sm"
                onClick={() => setEditing(true)}
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
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-sky-100 to-sky-50 text-[#0284C7] border border-sky-300 font-black text-lg shadow-2xs">
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-gray-700 tracking-tight">{customer.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-xs font-bold ${seg.bg}`}>
                  <Award size={12} />
                  {seg.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-bold ${
                  customer.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-300" : "bg-rose-50 text-rose-700 border border-rose-300"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${customer.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  {customer.status || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Group: <span className="font-bold text-gray-700">{customer.group?.name || "General"}</span> &bull; Customer since <span className="font-bold text-gray-700">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}</span>
              </p>
            </div>
          </div>

          {/* Contact Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-sky-200 bg-sky-50 text-[#0284C7] px-3.5 py-2 text-xs font-bold hover:bg-sky-100 hover:text-[#0369A1] transition shadow-2xs"
              >
                <Phone size={13} className="text-[#0284C7]" /> {customer.phone}
              </a>
            )}
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-300 px-3.5 py-2 text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
              >
                WhatsApp
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-sky-200 bg-sky-50 text-[#0284C7] px-3.5 py-2 text-xs font-bold hover:bg-sky-100 hover:text-[#0369A1] transition shadow-2xs"
              >
                <Mail size={13} className="text-[#0284C7]" /> Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Prominent Key Metrics Cards (CustomStatCard Analytics) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <CustomStatCard
          label="Total Spent"
          value={`৳${Number(customer.purchaseHistory?.totalSpent || 0).toLocaleString()}`}
          subtitle="Lifetime customer volume"
          icon={ShoppingBag}
          tone="primary"
        />

        <CustomStatCard
          label="Total Orders"
          value={String(customer.purchaseHistory?.totalOrders || 0)}
          subtitle="Completed purchases"
          icon={Package}
          tone="blue"
        />

        <CustomStatCard
          label="Current Due"
          value={`৳${currDue.toLocaleString()}`}
          subtitle={currDue > 0 ? "Outstanding balance pending" : "All dues cleared"}
          icon={DollarSign}
          tone={currDue > 0 ? "red" : "green"}
        />

        <CustomStatCard
          label="Loyalty Points"
          value={(customer.loyaltyPoints || 0).toLocaleString()}
          subtitle="Redeemable balance"
          icon={Award}
          tone="amber"
        />
      </div>

      {/* ── Tabs Bar ── */}
      <div className="flex border-b border-sky-200/90 bg-white rounded-sm px-3 shadow-2xs overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`border-b-2 py-2.5 px-4 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === t.key
                ? "border-[#0284C7] text-[#0284C7]"
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
            {/* Contact & Personal */}
            <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-sky-100/80 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-sky-100 text-[#0284C7]">
                  <User size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Contact & Personal Information</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Customer contact details and primary address</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={labelClass}>Customer Full Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.name || ""}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder="Enter customer name"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs min-h-[38px]">
                      <User size={14} className="text-[#0284C7] shrink-0" />
                      <span className="text-sm font-black text-gray-700">{customer.name}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.phone || ""}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className={inputClass}
                        placeholder="e.g. 017xxxxxxxx"
                      />
                    ) : (
                      <div className="flex items-center justify-between gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone size={14} className="text-[#0284C7] shrink-0" />
                          {customer.phone ? (
                            <span className="font-bold text-gray-700 tabular-nums">{customer.phone}</span>
                          ) : (
                            <span className="text-gray-400 font-normal italic">Not provided</span>
                          )}
                        </div>
                        {customer.phone && (
                          <a
                            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-sm bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10.5px] font-bold hover:bg-emerald-200 transition"
                          >
                            WA
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    {editing ? (
                      <input
                        type="email"
                        value={form.email || ""}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputClass}
                        placeholder="e.g. customer@example.com"
                      />
                    ) : (
                      <div className="flex items-center gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <Mail size={14} className="text-[#0284C7] shrink-0" />
                        {customer.email ? (
                          <span className="font-bold text-gray-700 truncate">{customer.email}</span>
                        ) : (
                          <span className="text-gray-400 font-normal italic">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>City / Region</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.city || ""}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className={inputClass}
                        placeholder="e.g. Dhaka"
                      />
                    ) : (
                      <div className="flex items-center gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <Building size={14} className="text-[#0284C7] shrink-0" />
                        {customer.city ? (
                          <span className="font-bold text-gray-700">{customer.city}</span>
                        ) : (
                          <span className="text-gray-400 font-normal italic">Not specified</span>
                        )}
                      </div>
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
                        placeholder="e.g. 1234567890"
                      />
                    ) : (
                      <div className="flex items-center gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <FileText size={14} className="text-[#0284C7] shrink-0" />
                        {customer.taxRegNo ? (
                          <span className="font-bold text-gray-700 font-mono">{customer.taxRegNo}</span>
                        ) : (
                          <span className="text-gray-400 font-normal italic">None</span>
                        )}
                      </div>
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
                      placeholder="Full delivery / billing address"
                    />
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2.5 text-xs shadow-2xs min-h-[50px]">
                      <MapPin size={14} className="text-[#0284C7] shrink-0 mt-0.5" />
                      {customer.address ? (
                        <span className="font-bold text-gray-700 leading-relaxed">{customer.address}</span>
                      ) : (
                        <span className="text-gray-400 font-normal italic">No street address on file</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Classification & Credit */}
            <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-sky-100/80 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-sky-100 text-[#0284C7]">
                  <Award size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Classification & Credit Terms</h3>
                  <p className="text-[11px] text-gray-400 font-medium">CRM tiering, account status, credit limit & grace period</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Customer Segment</label>
                    {editing ? (
                      <select
                        value={form.segmentation || "REGULAR"}
                        onChange={(e) => setForm({ ...form, segmentation: e.target.value })}
                        className={inputClass}
                      >
                        <option value="NEW">New Customer</option>
                        <option value="REGULAR">Regular Customer</option>
                        <option value="VIP">VIP Customer</option>
                        <option value="HIGH_VALUE">High Value</option>
                        <option value="WHOLESALE">Wholesale</option>
                        <option value="CORPORATE">Corporate</option>
                        <option value="AT_RISK">At Risk</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-bold border ${seg.bg}`}>
                          <Award size={13} />
                          {seg.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Account Status</label>
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
                      <div className="flex items-center gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-bold border ${
                          customer.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-rose-50 text-rose-700 border-rose-300"
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${customer.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                          {customer.status || "ACTIVE"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <div className="flex items-center gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <CreditCard size={14} className="text-[#0284C7] shrink-0" />
                        <span className="font-black text-gray-700 tabular-nums">৳{Number(customer.creditLimit || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Credit Period (Grace Days)</label>
                    {editing ? (
                      <input
                        type="number"
                        value={form.creditPeriodDays || ""}
                        onChange={(e) => setForm({ ...form, creditPeriodDays: Number(e.target.value) })}
                        className={inputClass}
                        placeholder="e.g. 30"
                      />
                    ) : (
                      <div className="flex items-center gap-2 rounded-sm border border-sky-200/80 bg-sky-50/50 px-3.5 py-2 text-xs shadow-2xs min-h-[38px]">
                        <Clock size={14} className="text-[#0284C7] shrink-0" />
                        {customer.creditPeriodDays ? (
                          <span className="font-bold text-gray-700 tabular-nums">{customer.creditPeriodDays} Days</span>
                        ) : (
                          <span className="text-gray-400 font-normal italic">No grace period set</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Internal Notes & Remarks</label>
                  {editing ? (
                    <textarea
                      rows={3}
                      value={form.notes || ""}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className={inputClass}
                      placeholder="Special instructions, preferences, customer history..."
                    />
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-sm border border-sky-200/80 bg-sky-50/50 p-3.5 text-xs shadow-2xs min-h-[70px]">
                      <FileText size={15} className="text-[#0284C7] shrink-0 mt-0.5" />
                      {customer.notes ? (
                        <p className="font-semibold text-gray-700 leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
                      ) : (
                        <span className="text-gray-400 font-normal italic">No internal notes on record.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Purchase History */}
        {activeTab === "purchases" && (
          <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-sky-100 text-[#0284C7]">
                  <ShoppingBag size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Recent Invoices & Orders</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Detailed log of transactions and purchases</p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-sky-50 px-2.5 py-1 rounded-sm border border-sky-200/80">
                {customer.recentSales?.length || 0} Records
              </span>
            </div>

            {customer.recentSales && customer.recentSales.length > 0 ? (
              <div className="divide-y divide-sky-100/80">
                {customer.recentSales.map((sale: any) => (
                  <div key={sale.id} className="py-3 flex items-center justify-between text-xs hover:bg-sky-50/40 px-2 rounded-sm transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 shadow-2xs">
                        <ShoppingBag size={15} />
                      </div>
                      <div>
                        <p className="font-bold text-[#0369A1]">{sale.invoiceNo}</p>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-gray-700 text-sm tabular-nums">৳{Number(sale.total).toLocaleString()}</p>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-300">
                          {sale.status}
                        </span>
                      </div>
                      <Link
                        href={`/invoices`}
                        className="rounded-sm border border-sky-200 bg-white p-1.5 text-gray-500 hover:bg-sky-50 hover:text-[#0284C7] transition shadow-2xs"
                        title="View Invoices"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <ShoppingBag size={32} className="mx-auto text-sky-200 mb-2" />
                <p className="text-xs font-semibold text-gray-500">No orders recorded for this customer yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Notes & CRM Activity */}
        {activeTab === "notes" && (
          <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-sky-100/80 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-sky-100 text-[#0284C7]">
                <FileText size={15} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Activity Notes & Logs</h3>
                <p className="text-[11px] text-gray-400 font-medium">Log follow-ups, calls, payment commitments, or reminders</p>
              </div>
            </div>
            
            <form onSubmit={addNote} className="space-y-2.5">
              <textarea
                rows={2}
                placeholder="Log customer contact or reminder..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full rounded-sm border border-sky-200/90 p-3 text-xs font-medium text-gray-700 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs"
              />
              <div className="flex justify-end">
                <CustomButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={addingNote || !noteText.trim()}
                >
                  {addingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add Activity Note
                </CustomButton>
              </div>
            </form>

            <div className="space-y-2.5 pt-2">
              {customer.customerNotes && customer.customerNotes.length > 0 ? (
                customer.customerNotes.map((note: any) => (
                  <div key={note.id} className="rounded-sm border border-sky-200/80 bg-sky-50/40 p-3.5 text-xs space-y-1.5 shadow-2xs">
                    <p className="text-gray-700 font-bold leading-relaxed">{note.note}</p>
                    <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 pt-0.5">
                      <Clock size={11} className="text-[#0284C7]" /> {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Just now"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-semibold text-gray-400">
                  No customer notes or follow-up logs recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Complaints */}
        {activeTab === "complaints" && (
          <div className="rounded-sm border border-sky-100/90 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-sky-100/80 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-rose-100 text-rose-600">
                <AlertTriangle size={15} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Customer Complaints & Feedback</h3>
                <p className="text-[11px] text-gray-400 font-medium">Record issues, returns, delivery delays, or billing disputes</p>
              </div>
            </div>
            
            <form onSubmit={addComplaint} className="rounded-sm border border-sky-100 bg-sky-50/20 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delayed Delivery / Broken Item"
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
                  placeholder="Describe the complaint in detail..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end">
                <CustomButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={addingComplaint || !complaintSubject.trim()}
                >
                  {addingComplaint ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  File Complaint
                </CustomButton>
              </div>
            </form>

            <div className="space-y-2.5 pt-2">
              {customer.complaints && customer.complaints.length > 0 ? (
                customer.complaints.map((c: any) => (
                  <div key={c.id} className="rounded-sm border border-sky-100 bg-white p-3.5 space-y-2 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-700">{c.subject}</h4>
                      <span className={`rounded-sm px-2 py-0.5 text-[10px] font-bold border ${
                        c.priority === "URGENT"
                          ? "bg-rose-100 text-rose-700 border-rose-300"
                          : c.priority === "HIGH"
                          ? "bg-orange-100 text-orange-700 border-orange-300"
                          : c.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "bg-sky-100 text-[#0284C7] border-sky-300"
                      }`}>
                        {c.priority}
                      </span>
                    </div>
                    {c.description && <p className="text-gray-600 leading-relaxed font-medium">{c.description}</p>}
                    <p className="text-[10.5px] text-gray-400 font-medium">
                      Filed on {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-semibold text-gray-400">
                  No complaints filed for this customer.
                </div>
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
