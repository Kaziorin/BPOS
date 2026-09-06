"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable } from "@/components/custom";
import { money } from "@/lib/format";

interface BsRow { id: string; code: string; name: string; balance: number }
interface BsData {
  assets: BsRow[]; liabilities: BsRow[]; equity: BsRow[];
  retainedEarnings: { code: string; name: string; balance: number };
  totalAssets: number; totalLiabilities: number; totalEquity: number; balanced: boolean;
}

function StatementSection({ title, rows, tone, emptyIcon }: { title: string; rows: BsRow[]; tone: string; emptyIcon: typeof FileText }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-50 px-5 py-4"><h2 className={`font-semibold ${tone}`}>{title}</h2></div>
      <CustomTable
        columns={[
          { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
          { key: "name", header: "Account", render: (r) => <span className="text-sm text-gray-800">{r.name}</span> },
          { key: "balance", header: "Balance", align: "right", render: (r) => <span className="font-semibold tabular-nums text-gray-900">{money(r.balance)}</span> },
        ]}
        data={rows}
        rowKey={(r) => r.id}
        emptyIcon={emptyIcon}
        emptyMessage={`No ${title.toLowerCase()} entries.`}
      />
    </div>
  );
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: BsData }>("/accounting/balance-sheet");
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load balance sheet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const eqRows: BsRow[] = [...(data?.equity ?? []), ...(data?.retainedEarnings ? [{ id: "np", code: "NP", name: data.retainedEarnings.name, balance: data.retainedEarnings.balance }] : [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><FileText size={19} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Balance Sheet</h1>
            <p className="text-sm text-gray-500">Assets = Liabilities + Equity</p>
          </div>
        </div>
        {data && (
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${data.balanced ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {data.balanced ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {data.balanced ? "Balanced" : "Out of balance"}
          </div>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Assets</p><p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{money(data.totalAssets)}</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Liabilities</p><p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{money(data.totalLiabilities)}</p></div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Equity</p><p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{money(data.totalEquity)}</p></div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <StatementSection title="Assets" rows={data?.assets ?? []} tone="text-primary-700" emptyIcon={FileText} />
        <StatementSection title="Liabilities" rows={data?.liabilities ?? []} tone="text-amber-700" emptyIcon={FileText} />
        <StatementSection title="Equity" rows={eqRows} tone="text-emerald-700" emptyIcon={FileText} />
      </div>
    </div>
  );
}
