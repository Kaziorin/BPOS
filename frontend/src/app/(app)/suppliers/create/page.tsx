"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function CreateSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", company: "", contactPerson: "", phone: "", email: "", address: "", city: "",
    vatRegNo: "", paymentTermsDays: "", creditLimit: "", openingDue: "", rebatePercent: "", notes: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: any = { name: form.name };
      if (form.company) payload.company = form.company;
      if (form.contactPerson) payload.contactPerson = form.contactPerson;
      if (form.phone) payload.phone = form.phone;
      if (form.email) payload.email = form.email;
      if (form.address) payload.address = form.address;
      if (form.city) payload.city = form.city;
      if (form.vatRegNo) payload.vatRegNo = form.vatRegNo;
      if (form.paymentTermsDays) payload.paymentTermsDays = Number(form.paymentTermsDays);
      if (form.creditLimit) payload.creditLimit = Number(form.creditLimit);
      if (form.openingDue) payload.openingDue = Number(form.openingDue);
      if (form.rebatePercent) payload.rebatePercent = Number(form.rebatePercent);
      if (form.notes) payload.notes = form.notes;

      await api.post("/v1/suppliers", payload);
      router.push("/suppliers");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create supplier");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/suppliers")} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
          <p className="text-sm text-gray-500">Create a new supplier record</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name *</label>
              <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input type="text" value={form.company} onChange={(e) => updateForm("company", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact Person</label>
              <input type="text" value={form.contactPerson} onChange={(e) => updateForm("contactPerson", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input type="text" value={form.city} onChange={(e) => updateForm("city", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <input type="text" value={form.address} onChange={(e) => updateForm("address", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>VAT Reg No</label>
              <input type="text" value={form.vatRegNo} onChange={(e) => updateForm("vatRegNo", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment & Terms</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Payment Terms (days)</label>
              <input type="number" value={form.paymentTermsDays} onChange={(e) => updateForm("paymentTermsDays", e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>Credit Limit</label>
              <input type="number" value={form.creditLimit} onChange={(e) => updateForm("creditLimit", e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>Opening Due</label>
              <input type="number" value={form.openingDue} onChange={(e) => updateForm("openingDue", e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>Rebate %</label>
              <input type="number" value={form.rebatePercent} onChange={(e) => updateForm("rebatePercent", e.target.value)} className={inputClass} min="0" max="100" step="0.5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Internal notes about this supplier..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/suppliers")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Creating..." : "Create Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
