"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Scale, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomBreadcrumb } from "@/components/custom";
import { money } from "@/lib/format";

interface TbRow { id?: string; code: string; name: string; accountType: string; debit: number | string; credit: number | string }
interface TbData { accounts: TbRow[]; totalDebit: number; totalCredit: number; balanced: boolean }

export default function TrialBalancePage() {
  const [data, setData] = useState<TbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: TbData }>("/accounting/trial-balance");
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load trial balance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="w-full max-w-full space-y-4">
      <CustomBreadcrumb
        title="Trial Balance"
        subtitle="Debit vs credit footing for every account (§10.20)"
        icon={<Scale size={18} />}
        breadcrumbs={[
          { label: "Accounting", href: "/accounting/accounts" },
          { label: "Trial Balance" },
        ]}
        actions={
          data && (
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${data.balanced ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {data.balanced ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {data.balanced ? "Balanced" : "Unbalanced"}
            </div>
          )
        }
      />

      {error && <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Debit</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gray-600">{money(data.totalDebit)}</p>
          </div>
          <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Credit</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gray-600">{money(data.totalCredit)}</p>
          </div>
          <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Accounts</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gray-600">{data.accounts.length}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-2xs">
        <CustomTable
          columns={[
            { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-sky-700">{r.code}</span> },
            { key: "name", header: "Account", render: (r) => <span className="text-sm font-medium text-gray-600">{r.name}</span> },
            { key: "type", header: "Type", render: (r) => <span className="text-xs uppercase text-gray-400">{r.accountType}</span> },
            { key: "debit", header: "Debit", align: "right", render: (r) => <span className="font-semibold tabular-nums text-gray-600">{Number(r.debit) > 0 ? money(Number(r.debit)) : "—"}</span> },
            { key: "credit", header: "Credit", align: "right", render: (r) => <span className="font-semibold tabular-nums text-gray-600">{Number(r.credit) > 0 ? money(Number(r.credit)) : "—"}</span> },
          ]}
          data={data?.accounts ?? []}
          rowKey={(r) => r.id || r.code}
          loading={loading}
          emptyIcon={Scale}
          emptyMessage="No accounts have activity yet — post a journal first."
        />
      </div>
    </div>
  );
}
