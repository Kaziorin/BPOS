"use client";

import { useEffect, useState } from "react";
import { X, Loader2, User, Phone, Mail, MapPin, CreditCard, FileText, CheckCircle2, Building, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton, CustomDropdownSelect } from "@/components/custom";
import { toast } from "react-toastify";

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
      toast.warning("Customer name is required.");
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
        toast.success(`Customer "${payload.name}" created successfully!`);
      } else {
        if (form.currentDue !== undefined) payload.currentDue = Number(form.currentDue) || 0;
        if (form.loyaltyPoints !== undefined) payload.loyaltyPoints = Number(form.loyaltyPoints) || 0;
        if (form.walletBalance !== undefined) payload.walletBalance = Number(form.walletBalance) || 0;
        await api.put(`/v1/customers/${customer.id}`, payload);
        toast.success(`Customer "${payload.name}" updated successfully!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save customer error:", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to save customer";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border border-brand-border bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-border/20 transition shadow-2xs";
  const labelClass = "block text-xs font-semibold text-brand-dark mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100 select-none">
      <div className="relative w-full max-w-3xl rounded-sm bg-white shadow-2xl border border-brand-border overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-brand-50/60 via-white to-brand-50/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-50 text-brand-primary font-bold border border-brand-border/80 shadow-2xs">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-brand-dark">
                {isEdit ? "Edit Customer Profile" : "Create New Customer"}
              </h2>
              <p className="text-xs text-brand-primary font-medium">
                {isEdit ? `Updating details for ${customer?.name}` : "Add customer contact details, credit terms, and classification"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-1 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "basic"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-500 hover:text-brand-primary"
            }`}
          >
            <User size={14} /> Basic Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("credit")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "credit"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-500 hover:text-brand-primary"
            }`}
          >
            <CreditCard size={14} /> Credit & Classification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === "notes"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-500 hover:text-brand-primary"
            }`}
          >
            <FileText size={14} /> Additional Details
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 rounded-sm border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 shadow-2xs">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Customer Full Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Enter customer name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 017xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka, Chittagong"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Account Status</label>
                  <CustomDropdownSelect
                    value={form.status}
                    onChange={(val) => updateField("status", val)}
                    options={[
                      { label: "Active", value: "ACTIVE" },
                      { label: "Inactive", value: "INACTIVE" },
                    ]}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Full Street Address</label>
                  <textarea
                    rows={2}
                    placeholder="House, road, landmark, delivery details..."
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "credit" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Customer Segment</label>
                  <CustomDropdownSelect
                    value={form.segmentation}
                    onChange={(val) => updateField("segmentation", val)}
                    options={[
                      { label: "New Customer", value: "NEW" },
                      { label: "Regular Customer", value: "REGULAR" },
                      { label: "VIP Customer", value: "VIP" },
                      { label: "High Value", value: "HIGH_VALUE" },
                      { label: "Wholesale", value: "WHOLESALE" },
                      { label: "Corporate", value: "CORPORATE" },
                      { label: "At Risk", value: "AT_RISK" },
                    ]}
                  />
                </div>

                <div>
                  <label className={labelClass}>Customer Group</label>
                  <CustomDropdownSelect
                    value={form.groupId}
                    onChange={(val) => updateField("groupId", val)}
                    placeholder="— None —"
                    options={[
                      { label: "— None —", value: "" },
                      ...groups.map((g) => ({ label: g.name, value: g.id })),
                    ]}
                  />
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
                      className={`${inputClass} font-bold text-rose-600 bg-rose-50/40 border-rose-200`}
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Tax Reg No / BIN / NID</label>
                  <input
                    type="text"
                    placeholder="Tax registration / BIN"
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
                  <CustomDropdownSelect
                    value={form.gender}
                    onChange={(val) => updateField("gender", val)}
                    placeholder="— Select Gender —"
                    options={[
                      { label: "— Select —", value: "" },
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                      { label: "Other", value: "Other" },
                    ]}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className={labelClass}>Internal CRM Notes & Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Customer preferences, delivery notes, remarks..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions (No Back Button, Clean Alignment) */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4">
            <CustomButton
              type="button"
              variant="danger"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </CustomButton>

            <CustomButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
              leftIcon={saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
            >
              {saving ? "Saving..." : isEdit ? "Update Customer" : "Save Customer"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
