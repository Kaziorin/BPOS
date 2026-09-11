"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Truck, Phone, Mail, MapPin, DollarSign, Building2, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: any | null;
}

export function SupplierModal({ isOpen, onClose, onSuccess, supplier }: SupplierModalProps) {
  const isEdit = Boolean(supplier?.id);
  const [activeTab, setActiveTab] = useState<"basic" | "financial" | "notes">("basic");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    company: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    vatRegNo: "",
    paymentTermsDays: "",
    creditLimit: "0",
    openingDue: "0",
    currentDue: "0",
    rebatePercent: "0",
    status: "ACTIVE",
    notes: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        company: supplier.company || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        city: supplier.city || "",
        vatRegNo: supplier.vatRegNo || "",
        paymentTermsDays: supplier.paymentTermsDays !== undefined && supplier.paymentTermsDays !== null ? String(supplier.paymentTermsDays) : "",
        creditLimit: supplier.creditLimit !== undefined && supplier.creditLimit !== null ? String(supplier.creditLimit) : "0",
        openingDue: supplier.openingDue !== undefined && supplier.openingDue !== null ? String(supplier.openingDue) : "0",
        currentDue: supplier.currentDue !== undefined && supplier.currentDue !== null ? String(supplier.currentDue) : "0",
        rebatePercent: supplier.rebatePercent !== undefined && supplier.rebatePercent !== null ? String(supplier.rebatePercent) : "0",
        status: supplier.status || "ACTIVE",
        notes: supplier.notes || "",
      });
    } else {
      setForm({
        name: "",
        company: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        vatRegNo: "",
        paymentTermsDays: "30",
        creditLimit: "0",
        openingDue: "0",
        currentDue: "0",
        rebatePercent: "0",
        status: "ACTIVE",
        notes: "",
      });
    }
    setError(null);
    setActiveTab("basic");
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Supplier name is required.");
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        company: form.company.trim() || null,
        contactPerson: form.contactPerson.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        vatRegNo: form.vatRegNo.trim() || null,
        paymentTermsDays: form.paymentTermsDays ? Number(form.paymentTermsDays) : null,
        creditLimit: Number(form.creditLimit) || 0,
        rebatePercent: Number(form.rebatePercent) || 0,
        status: form.status || "ACTIVE",
        notes: form.notes.trim() || null,
      };

      if (!isEdit) {
        payload.openingDue = Number(form.openingDue) || 0;
        await api.post("/v1/suppliers", payload);
      } else {
        if (form.currentDue !== undefined) payload.currentDue = Number(form.currentDue) || 0;
        await api.put(`/v1/suppliers/${supplier.id}`, payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save supplier error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition";
  const labelClass = "block text-[11px] font-semibold text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-100">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-200/60 font-bold">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {isEdit ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <p className="text-[11px] text-gray-500">
                {isEdit ? "Update vendor details, credit terms, and contact information." : "Register a new procurement vendor / distributor in directory."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-2 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === "basic"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Building2 size={14} />
            Basic & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("financial")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === "financial"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <DollarSign size={14} />
            Credit & Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === "notes"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileText size={14} />
            Notes & Status
          </button>
        </div>

        {/* Form Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {activeTab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Supplier Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Pharmaceuticals / Square Corp"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={inputClass}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Company / Trade Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Square Distributors Ltd."
                      value={form.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Contact Person / Key Rep</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Rafiqul Islam (Manager)"
                      value={form.contactPerson}
                      onChange={(e) => updateField("contactPerson", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. +880 1711-000000"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        placeholder="e.g. vendor@supplier.com"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>City / District</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. Dhaka, Chittagong"
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>VAT / Trade License / BIN</label>
                    <input
                      type="text"
                      placeholder="e.g. BIN-987654321"
                      value={form.vatRegNo}
                      onChange={(e) => updateField("vatRegNo", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Warehouse / Factory Address</label>
                    <textarea
                      rows={2}
                      placeholder="Street, Area, Building number..."
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "financial" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Payment Terms (Days)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="30"
                      value={form.paymentTermsDays}
                      onChange={(e) => updateField("paymentTermsDays", e.target.value)}
                      className={inputClass}
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Credit period allowed by this supplier (e.g. Net 30 days)
                    </span>
                  </div>

                  <div>
                    <label className={labelClass}>Credit Limit (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      value={form.creditLimit}
                      onChange={(e) => updateField("creditLimit", e.target.value)}
                      className={inputClass}
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Maximum allowable purchasing credit limit
                    </span>
                  </div>

                  {!isEdit ? (
                    <div>
                      <label className={labelClass}>Opening Payable Due (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={form.openingDue}
                        onChange={(e) => updateField("openingDue", e.target.value)}
                        className={inputClass}
                      />
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Initial pending payable balance before system start
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className={labelClass}>Current Payable Due (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.currentDue}
                        onChange={(e) => updateField("currentDue", e.target.value)}
                        className={inputClass}
                      />
                      <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
                        Direct override of active payable due balance
                      </span>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Rebate / Trade Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={form.rebatePercent}
                      onChange={(e) => updateField("rebatePercent", e.target.value)}
                      className={inputClass}
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Standard negotiated supplier rebate % on invoice
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs text-gray-600 flex items-start gap-2">
                  <DollarSign size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-800">Automated Due Tracking</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      When goods are received (GRN) or purchase orders are completed, payable due balances update automatically. Payments can be settled anytime with receipt tracking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Account Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className={inputClass}
                  >
                    <option value="ACTIVE">Active (Eligible for Purchase Orders)</option>
                    <option value="INACTIVE">Inactive (Suspended / Blocked)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Internal Notes & Instructions</label>
                  <textarea
                    rows={4}
                    placeholder="Enter bank accounts, lead times, order schedules, return policies..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className={inputClass}
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Internal information visible to purchasing & inventory staff
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3.5 bg-gray-50/80">
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "notes" ? "financial" : "basic")}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
              )}
              {activeTab !== "notes" && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === "basic" ? "financial" : "notes")}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Next Tab &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {isEdit ? "Update Supplier" : "Create Supplier"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
