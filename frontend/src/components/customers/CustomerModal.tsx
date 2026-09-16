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
    "w-full rounded-sm border border-sky-200/90 bg-white px-3 py-2 text-xs text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs";
  const labelClass = "block text-xs font-semibold text-[#0369A1] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100 select-none">
      <div className="relative w-full max-w-xl rounded-sm bg-white shadow-xl border border-sky-200/90 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-sky-100 px-5 py-3.5 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] font-semibold border border-sky-200/80 shadow-2xs">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0369A1]">
                {isEdit ? "Edit Customer" : "New Customer"}
              </h2>
              <p className="text-[11px] text-[#0284C7] font-medium">
                {isEdit ? `Updating profile for ${customer?.name}` : "Create a new customer profile"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-sky-100 bg-white px-5 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === "basic"
                ? "border-[#0284C7] text-[#0284C7] font-bold"
                : "border-transparent text-gray-500 hover:text-[#0284C7]"
            }`}
          >
            <User size={13} /> Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("credit")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition cursor-pointer ${
              activeTab === "credit"
                ? "border-[#0284C7] text-[#0284C7] font-bold"
                : "border-transparent text-gray-500 hover:text-[#0284C7]"
            }`}
          >
            <CreditCard size={13} /> Credit & Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition cursor-pointer ${
              activeTab === "notes"
                ? "border-[#0284C7] text-[#0284C7] font-bold"
                : "border-transparent text-gray-500 hover:text-[#0284C7]"
            }`}
          >
            <FileText size={13} /> Additional Details
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-5 mt-3.5 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {activeTab === "basic" && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="017xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Account Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className={inputClass}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Full Street Address</label>
                  <textarea
                    rows={2}
                    placeholder="Street, area, landmark details..."
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "credit" && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Customer Segment</label>
                  <select
                    value={form.segmentation}
                    onChange={(e) => updateField("segmentation", e.target.value)}
                    className={inputClass}
                  >
                    <option value="NEW">New Customer</option>
                    <option value="REGULAR">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="HIGH_VALUE">High Value</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="AT_RISK">At Risk</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Customer Group</label>
                  <select
                    value={form.groupId}
                    onChange={(e) => updateField("groupId", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— None —</option>
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
                    placeholder="0.00"
                    value={form.creditLimit}
                    onChange={(e) => updateField("creditLimit", e.target.value)}
                    className={inputClass}
                  />
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
                </div>

                {!isEdit ? (
                  <div>
                    <label className={labelClass}>Opening Due Balance (৳)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={form.openingDue}
                      onChange={(e) => updateField("openingDue", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Current Due Balance (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.currentDue}
                      onChange={(e) => updateField("currentDue", e.target.value)}
                      className={`${inputClass} font-semibold text-rose-600 bg-rose-50/40`}
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
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Tax Reg No / BIN / NID</label>
                  <input
                    type="text"
                    placeholder="Tax registration number"
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
                    <option value="">— Select —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Internal CRM Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Notes or special preferences..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-sky-100 pt-3.5">
            <div className="flex gap-1.5">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "notes" ? "credit" : "basic")}
                  className="rounded-sm border border-sky-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-sky-50 transition cursor-pointer shadow-2xs"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                {saving ? "Saving..." : isEdit ? "Update Customer" : "Save Customer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
