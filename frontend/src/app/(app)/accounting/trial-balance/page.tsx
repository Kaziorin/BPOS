"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Scale, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable } from "@/components/custom";
import { money } from "@/lib/format";

interface TBRow { id: string; code: string; name: string; accountType: string; debit: number | string; credit: number | string }
interface TBData { accounts: TBRow[]; totalDebit: number; totalCredit: number; balanced: boolean }

export default function TrialBalancePage() {
  const [data, setData] = useState<TBData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: TBData }>("/accounting/trial-balance");
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load trial balance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Scale size={19} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Trial Balance</h1>
            <p className="text-sm text-gray-500">Debit vs credit footing for every account (§10.20)</p>
          </div>
        </div>
        {data && (
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${data.balanced ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {data.balanced ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {data.balanced ? "Balanced" : "Unbalanced"}
          </div>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Debit</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{money(data.totalDebit)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Credit</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{money(data.totalCredit)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Accounts</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{data.accounts.length}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-primary-700">{r.code}</span> },
            { key: "name", header: "Account", render: (r) => <span className="text-sm font-medium text-gray-800">{r.name}</span> },
            { key: "type", header: "Type", render: (r) => <span className="text-xs uppercase text-gray-400">{r.accountType}</span> },
            { key: "debit", header: "Debit", align: "right", render: (r) => <span className="font-semibold tabular-nums text-gray-900">{Number(r.debit) > 0 ? money(Number(r.debit)) : "—"}</span> },
            { key: "credit", header: "Credit", align: "right", render: (r) => <span className="font-semibold tabular-nums text-gray-900">{Number(r.credit) > 0 ? money(Number(r.credit)) : "—"}</span> },
          ]}
          data={data?.accounts ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          emptyIcon={Scale}
          emptyMessage="No accounts have activity yet — post a journal first."
        />
      </div>
    </div>
  );
}
