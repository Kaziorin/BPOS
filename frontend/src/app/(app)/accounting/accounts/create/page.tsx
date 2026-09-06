"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput, CustomSelect, CustomButton } from "@/components/custom";

const TYPES = [
  { label: "Asset", value: "ASSET" },
  { label: "Liability", value: "LIABILITY" },
  { label: "Equity", value: "EQUITY" },
  { label: "Revenue", value: "REVENUE" },
  { label: "Expense", value: "EXPENSE" },
];

export default function CreateAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", name: "", accountType: "ASSET", openingBalance: "0", isGroup: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/accounting/accounts", {
        code: form.code, name: form.name, accountType: form.accountType,
        openingBalance: Number(form.openingBalance || 0),
        isGroup: form.isGroup,
      });
      router.push("/accounting/accounts");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/accounting/accounts" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><BookOpen size={19} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Add Account</h1>
            <p className="text-sm text-gray-500">Create a new account in the chart of accounts</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomInput label="Account Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 6000" />
          <CustomSelect label="Account Type" value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} options={TYPES} />
        </div>
        <CustomInput label="Account Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bank Account" />
        <CustomInput label="Opening Balance" type="number" step="0.01" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isGroup} onChange={(e) => setForm({ ...form, isGroup: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          This is a group (parent) account
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/accounting/accounts"><CustomButton type="button" variant="outline">Cancel</CustomButton></Link>
          <CustomButton type="submit" loading={saving}>Create Account</CustomButton>
        </div>
      </form>
    </div>
  );
}
