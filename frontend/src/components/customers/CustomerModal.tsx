"use client";

import { useEffect, useState } from "react";
import { X, Loader2, User, Phone, Mail, MapPin, CreditCard, FileText, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: any | null;
  groups?: Array<{ id: string; name: string }>;
}

export function CustomerModal({ isOpen, onClose, onSuccess, customer, groups = [] }: CustomerModalProps) {
  const isEdit = Boolean(customer?.id);
  const [activeTab, setActiveTab] = useState<"basic" | "credit" | "notes">("basic");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    dateOfBirth: "",
    gender: "",
    taxRegNo: "",
    groupId: "",
    segmentation: "NEW",
    creditLimit: "",
    creditPeriodDays: "",
    openingDue: "",
    currentDue: "",
    loyaltyPoints: "",
    walletBalance: "",
    status: "ACTIVE",
    notes: "",
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "",
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : "",
        gender: customer.gender || "",
        taxRegNo: customer.taxRegNo || "",
        groupId: customer.groupId || customer.group?.id || "",
        segmentation: customer.segmentation || "REGULAR",
        creditLimit: customer.creditLimit !== undefined && customer.creditLimit !== null ? String(customer.creditLimit) : "0",
        creditPeriodDays: customer.creditPeriodDays ? String(customer.creditPeriodDays) : "",
        openingDue: customer.openingDue !== undefined && customer.openingDue !== null ? String(customer.openingDue) : "0",
        currentDue: customer.currentDue !== undefined && customer.currentDue !== null ? String(customer.currentDue) : "0",
        loyaltyPoints: customer.loyaltyPoints !== undefined && customer.loyaltyPoints !== null ? String(customer.loyaltyPoints) : "0",
        walletBalance: customer.walletBalance !== undefined && customer.walletBalance !== null ? String(customer.walletBalance) : "0",
        status: customer.status || "ACTIVE",
        notes: customer.notes || "",
      });
    } else {
      setForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        dateOfBirth: "",
        gender: "",
        taxRegNo: "",
        groupId: "",
        segmentation: "NEW",
        creditLimit: "0",
        creditPeriodDays: "",
        openingDue: "0",
        currentDue: "0",
        loyaltyPoints: "0",
        walletBalance: "0",
        status: "ACTIVE",
        notes: "",
      });
    }
    setError(null);
    setActiveTab("basic");
  }, [customer, isOpen]);

  if (!isOpen) return null;

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Customer name is required.");
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        taxRegNo: form.taxRegNo.trim() || null,
        groupId: form.groupId || null,
        segmentation: form.segmentation || "REGULAR",
        creditLimit: Number(form.creditLimit) || 0,
        creditPeriodDays: form.creditPeriodDays ? Number(form.creditPeriodDays) : null,
        status: form.status || "ACTIVE",
        notes: form.notes.trim() || null,
      };

      if (!isEdit) {
        payload.openingDue = Number(form.openingDue) || 0;
        await api.post("/v1/customers", payload);
      } else {
        if (form.currentDue !== undefined) payload.currentDue = Number(form.currentDue) || 0;
        if (form.loyaltyPoints !== undefined) payload.loyaltyPoints = Number(form.loyaltyPoints) || 0;
        if (form.walletBalance !== undefined) payload.walletBalance = Number(form.walletBalance) || 0;
        await api.put(`/v1/customers/${customer.id}`, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save customer error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-semibold">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? "Edit Customer Profile" : "Register New Customer"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? `Updating details for ${customer?.name}` : "Create a customer record with CRM & credit options"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "basic"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User size={14} /> Basic Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("credit")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "credit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard size={14} /> Classification & Credit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "notes"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText size={14} /> Notes & Tax
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {activeTab === "basic" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Md. Mamun Hossain"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`${inputClass} pl-10 font-medium`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g. 01700000000"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="customer@domain.com"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>City / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka, Mirpur"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className={inputClass}
                  >
                    <option value="ACTIVE">Active Customer</option>
                    <option value="INACTIVE">Inactive / Blocked</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Street Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      placeholder="House, Road, Area address details..."
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "credit" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Customer Segment</label>
                  <select
                    value={form.segmentation}
                    onChange={(e) => updateField("segmentation", e.target.value)}
                    className={inputClass}
                  >
                    <option value="NEW">✨ New Customer</option>
                    <option value="REGULAR">👤 Regular</option>
                    <option value="VIP">👑 VIP Customer</option>
                    <option value="HIGH_VALUE">💎 High Value</option>
                    <option value="WHOLESALE">🏢 Wholesale / Trade</option>
                    <option value="CORPORATE">🏛️ Corporate</option>
                    <option value="AT_RISK">⚠️ At Risk</option>
                    <option value="INACTIVE">💤 Inactive</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Customer Group</label>
                  <select
                    value={form.groupId}
                    onChange={(e) => updateField("groupId", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— No Group Assigned —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Credit Limit (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0.00"
                    value={form.creditLimit}
                    onChange={(e) => updateField("creditLimit", e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Maximum allowed credit balance before warning</p>
                </div>

                <div>
                  <label className={labelClass}>Credit Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 30"
                    value={form.creditPeriodDays}
                    onChange={(e) => updateField("creditPeriodDays", e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Payment term in days (for invoicing)</p>
                </div>

                {!isEdit ? (
                  <div>
                    <label className={labelClass}>Opening Balance / Due (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0.00"
                      value={form.openingDue}
                      onChange={(e) => updateField("openingDue", e.target.value)}
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-amber-600">Initial outstanding due when adding customer</p>
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Current Due Balance (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.currentDue}
                      onChange={(e) => updateField("currentDue", e.target.value)}
                      className={`${inputClass} font-semibold text-red-600 bg-red-50/30 border-red-200`}
                    />
                  </div>
                )}

                {isEdit && (
                  <div>
                    <label className={labelClass}>Loyalty Points</label>
                    <input
                      type="number"
                      min="0"
                      value={form.loyaltyPoints}
                      onChange={(e) => updateField("loyaltyPoints", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tax / BIN / NID Registration</label>
                  <input
                    type="text"
                    placeholder="e.g. BIN-001293810"
                    value={form.taxRegNo}
                    onChange={(e) => updateField("taxRegNo", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— Select Gender —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Internal CRM Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Add special instructions, preferences, VIP discount notes..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "notes" ? "credit" : "basic")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
              )}
              {activeTab !== "notes" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "basic" ? "credit" : "notes")}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Next Step &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {saving ? "Saving Customer..." : isEdit ? "Update Profile" : "Create Customer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
