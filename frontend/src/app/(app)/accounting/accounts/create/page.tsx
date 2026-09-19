"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput, CustomSelect, CustomButton, CustomBreadcrumb, CustomCard } from "@/components/custom";

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
    <div className="w-full max-w-full space-y-4">
      <CustomBreadcrumb
        title="Add Account"
        subtitle="Create a new account in the chart of accounts (§10.20)"
        icon={<BookOpen size={18} />}
        breadcrumbs={[
          { label: "Accounting", href: "/accounting/accounts" },
          { label: "Chart of Accounts", href: "/accounting/accounts" },
          { label: "Add Account" },
        ]}
      />

      {error && <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <CustomCard title="Account Details" subtitle="Enter General Ledger code, title, and initial balance" icon={BookOpen}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomInput label="Account Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 6000" />
            <CustomSelect label="Account Type" value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} options={TYPES} />
          </div>
          <CustomInput label="Account Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bank Account" />
          <CustomInput label="Opening Balance" type="number" step="0.01" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.isGroup} onChange={(e) => setForm({ ...form, isGroup: e.target.checked })} className="h-4 w-4 rounded-sm border-gray-300 text-sky-600" />
            This is a group (parent) account
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-light">
            <Link href="/accounting/accounts"><CustomButton type="button" variant="outline">Cancel</CustomButton></Link>
            <CustomButton type="submit" loading={saving} variant="primary">Create Account</CustomButton>
          </div>
        </form>
      </CustomCard>
    </div>
  );
}
