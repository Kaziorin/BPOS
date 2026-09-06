"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookMarked, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput, CustomButton } from "@/components/custom";

interface Line { accountCode: string; debit: string; credit: string; memo: string }
interface Account { id: string; code: string; name: string; accountType: string }

export default function CreateJournalPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({ narration: "", refType: "MANUAL", journalDate: "" });
  const [lines, setLines] = useState<Line[]>([
    { accountCode: "", debit: "", credit: "", memo: "" },
    { accountCode: "", debit: "", credit: "", memo: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get<{ data: Account[] }>("/accounting/accounts");
      setAccounts(res.data);
    } catch { /* non-fatal */ }
  }, []);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const totDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totDebit - totCredit) < 0.01 && totDebit > 0;

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/accounting/journals", {
        narration: form.narration || "Manual journal",
        refType: form.refType,
        journalDate: form.journalDate || undefined,
        lines: lines.map((l) => ({
          accountCode: l.accountCode, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, memo: l.memo || undefined,
        })),
      });
      router.push("/accounting/journals");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to post journal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/accounting/journals" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><BookMarked size={19} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Create Journal</h1>
            <p className="text-sm text-gray-500">Post a balanced double-entry journal</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomInput label="Narration" value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} placeholder="e.g. Opening balance entry" />
          <CustomInput label="Journal Date" type="date" value={form.journalDate} onChange={(e) => setForm({ ...form, journalDate: e.target.value })} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Journal Lines</h3>
            <CustomButton type="button" size="sm" variant="outline" leftIcon={<Plus size={13} />} onClick={() => setLines((ls) => [...ls, { accountCode: "", debit: "", credit: "", memo: "" }])}>Add Line</CustomButton>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl border border-gray-100 p-2">
                <div className="col-span-12 sm:col-span-4">
                  <select value={l.accountCode} onChange={(e) => setLine(i, { accountCode: e.target.value })} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm">
                    <option value="">Select account…</option>
                    {accounts.map((a) => <option key={a.id} value={a.code}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <input type="number" step="0.01" min="0" placeholder="Debit" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value })} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <input type="number" step="0.01" min="0" placeholder="Credit" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value })} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <input placeholder="Memo (optional)" value={l.memo} onChange={(e) => setLine(i, { memo: e.target.value })} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} disabled={lines.length <= 2} className="rounded-lg p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${balanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          <span>{balanced ? "✓ Balanced" : "Not yet balanced"}</span>
          <span className="tabular-nums">Debit ৳{totDebit.toFixed(2)} · Credit ৳{totCredit.toFixed(2)}</span>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/accounting/journals"><CustomButton type="button" variant="outline">Cancel</CustomButton></Link>
          <CustomButton type="submit" loading={saving} disabled={!balanced}>Post Journal</CustomButton>
        </div>
      </form>
    </div>
  );
}
