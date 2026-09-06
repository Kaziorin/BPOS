"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BookMarked, Plus, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomBadge, CustomButton } from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface LedgerLine { debit: string | number; credit: string | number; memo: string; accountCode: string; accountName: string; accountType: string }
interface Journal {
  id: string; journalNo: string; refType: string; refId: string; narration: string;
  status: string; createdAt: string; totalDebit: number; entries: LedgerLine[];
}

const STATUS_TONE: Record<string, "green" | "amber" | "gray" | "red"> = {
  POSTED: "green", REVERSED: "gray", DRAFT: "amber",
};

export default function JournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Journal[] }>("/accounting/journals?limit=100");
      setJournals(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load journals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function reverse(j: Journal) {
    setBusy(j.id);
    try {
      await api.post(`/accounting/journals/${j.id}/reverse`, { reason: "Reversed from UI" });
      setToast({ ok: true, text: `${j.journalNo} reversed` });
      await load();
    } catch (err: any) {
      setToast({ ok: false, text: err.response?.data?.error || err.message });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><BookMarked size={19} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Journals</h1>
            <p className="text-sm text-gray-500">{journals.length} posted journals · append-only, reversible (§10.20)</p>
          </div>
        </div>
        <Link href="/accounting/journals/create">
          <CustomButton leftIcon={<Plus size={15} />}>Create Journal</CustomButton>
        </Link>
      </div>

      {toast && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {toast.text}
        </div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "no", header: "Journal", render: (j) => (
              <button onClick={() => setExpanded(expanded === j.id ? null : j.id)} className="flex items-center gap-2 text-left">
                <span className="font-mono text-xs font-semibold text-primary-700">{j.journalNo}</span>
                {expanded === j.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
            )},
            { key: "ref", header: "Reference", render: (j) => <span className="text-xs text-gray-500">{j.refType}</span> },
            { key: "narration", header: "Narration", render: (j) => <span className="text-sm text-gray-600">{j.narration}</span> },
            { key: "status", header: "Status", render: (j) => <CustomBadge tone={STATUS_TONE[j.status] ?? "gray"}>{j.status}</CustomBadge> },
            { key: "date", header: "Date", render: (j) => <span className="text-xs text-gray-500">{dateTime(j.createdAt)}</span> },
            { key: "total", header: "Total", align: "right", render: (j) => <span className="font-semibold tabular-nums text-gray-900">{money(j.totalDebit)}</span> },
            { key: "actions", header: "", align: "right", render: (j) => (
              j.status === "POSTED" ? (
                <CustomButton size="sm" variant="outline" loading={busy === j.id} leftIcon={<RotateCcw size={13} />} onClick={() => reverse(j)}>Reverse</CustomButton>
              ) : <span className="text-xs text-gray-300">—</span>
            )},
          ]}
          data={journals}
          rowKey={(j) => j.id}
          loading={loading}
          emptyIcon={BookMarked}
          emptyMessage="No journals yet."
        />
      </div>

      {expanded && (() => {
        const j = journals.find((x) => x.id === expanded);
        if (!j) return null;
        return (
          <div key={j.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">{j.journalNo} — entries</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2 text-left">Account</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                  <th className="px-3 py-2 text-left">Memo</th>
                </tr></thead>
                <tbody>
                  {j.entries.map((e, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-2"><span className="font-mono text-xs text-gray-500">{e.accountCode}</span> <span className="ml-1 text-gray-700">{e.accountName}</span></td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900">{Number(e.debit) > 0 ? money(Number(e.debit)) : "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900">{Number(e.credit) > 0 ? money(Number(e.credit)) : "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{e.memo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
