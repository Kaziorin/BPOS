"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";

export default function CreateCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", dateOfBirth: "", gender: "",
    taxRegNo: "", groupId: "", segmentation: "NEW", creditLimit: "", creditPeriodDays: "",
    openingDue: "", notes: "",
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
      if (form.phone) payload.phone = form.phone;
      if (form.email) payload.email = form.email;
      if (form.address) payload.address = form.address;
      if (form.city) payload.city = form.city;
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (form.gender) payload.gender = form.gender;
      if (form.taxRegNo) payload.taxRegNo = form.taxRegNo;
      if (form.groupId) payload.groupId = form.groupId;
      if (form.segmentation) payload.segmentation = form.segmentation;
      if (form.creditLimit) payload.creditLimit = Number(form.creditLimit);
      if (form.creditPeriodDays) payload.creditPeriodDays = Number(form.creditPeriodDays);
      if (form.openingDue) payload.openingDue = Number(form.openingDue);
      if (form.notes) payload.notes = form.notes;

      await api.post("/v1/customers", payload);
      router.push("/customers");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create customer");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-1 block w-full rounded-sm border border-sky-200/90 bg-white px-3 py-2 text-xs text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs";
  const labelClass = "block text-xs font-semibold text-[#0369A1]";

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      <CustomBreadcrumb
        title="Add Customer"
        subtitle="Create a new customer record with credit limits and contact profile."
        icon={<UserPlus size={20} />}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: "Create" },
        ]}
      />

      {error && (
        <div className="rounded-sm border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 shadow-2xs">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-sm border border-sky-100/90 bg-white p-5 space-y-3.5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Basic Information</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name *</label>
              <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={inputClass} required />
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
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select value={form.gender} onChange={(e) => updateForm("gender", e.target.value)} className={inputClass}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tax / VAT Registration No</label>
              <input type="text" value={form.taxRegNo} onChange={(e) => updateForm("taxRegNo", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-sky-100/90 bg-white p-5 space-y-3.5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Classification & Credit</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Customer Segment</label>
              <select value={form.segmentation} onChange={(e) => updateForm("segmentation", e.target.value)} className={inputClass}>
                <option value="NEW">New</option>
                <option value="REGULAR">Regular</option>
                <option value="VIP">VIP</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="CORPORATE">Corporate</option>
                <option value="HIGH_VALUE">High Value</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Customer Group ID</label>
              <input type="text" value={form.groupId} onChange={(e) => updateForm("groupId", e.target.value)} className={inputClass} placeholder="UUID (optional)" />
            </div>
            <div>
              <label className={labelClass}>Credit Limit (Tk)</label>
              <input type="number" value={form.creditLimit} onChange={(e) => updateForm("creditLimit", e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>Credit Period (days)</label>
              <input type="number" value={form.creditPeriodDays} onChange={(e) => updateForm("creditPeriodDays", e.target.value)} className={inputClass} min="0" />
            </div>
            <div>
              <label className={labelClass}>Opening Due (Tk)</label>
              <input type="number" value={form.openingDue} onChange={(e) => updateForm("openingDue", e.target.value)} className={inputClass} min="0" />
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-sky-100/90 bg-white p-5 space-y-3.5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Internal notes about this customer..."
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => router.push("/customers")}
            className="rounded-sm border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
