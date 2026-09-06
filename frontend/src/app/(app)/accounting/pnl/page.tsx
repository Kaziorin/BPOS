"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable } from "@/components/custom";
import { money } from "@/lib/format";

interface PnlRow { code: string; name: string; amount: number }
interface PnlData { revenue: PnlRow[]; expenses: PnlRow[]; totalRevenue: number; totalExpenses: number; netProfit: number }

export default function PnlPage() {
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: PnlData }>("/accounting/profit-loss");
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load profit & loss");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const net = data?.netProfit ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><BarChart3 size={19} /></div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Profit &amp; Loss</h1>
          <p className="text-sm text-gray-500">Revenue minus expenses for the period</p>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className={`flex items-center justify-between rounded-2xl p-6 text-white shadow-sm ${net >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-red-600"}`}>
        <div className="flex items-center gap-3">
          {net >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
          <div>
            <p className="text-sm text-white/80">Net Profit</p>
            <p className="text-3xl font-bold tabular-nums">{money(net)}</p>
          </div>
        </div>
        <div className="text-right text-sm text-white/90">
          <p>Revenue: <span className="font-semibold tabular-nums">{money(data?.totalRevenue ?? 0)}</span></p>
          <p>Expenses: <span className="font-semibold tabular-nums">{money(data?.totalExpenses ?? 0)}</span></p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-5 py-4"><h2 className="font-semibold text-emerald-700">Revenue</h2></div>
          <CustomTable
            columns={[
              { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
              { key: "name", header: "Account", render: (r) => <span className="text-sm text-gray-800">{r.name}</span> },
              { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-semibold tabular-nums text-emerald-700">{money(r.amount)}</span> },
            ]}
            data={data?.revenue ?? []}
            rowKey={(r) => r.code}
            loading={loading}
            emptyIcon={BarChart3}
            emptyMessage="No revenue posted yet."
          />
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-5 py-4"><h2 className="font-semibold text-red-600">Expenses</h2></div>
          <CustomTable
            columns={[
              { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
              { key: "name", header: "Account", render: (r) => <span className="text-sm text-gray-800">{r.name}</span> },
              { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-semibold tabular-nums text-red-600">{money(r.amount)}</span> },
            ]}
            data={data?.expenses ?? []}
            rowKey={(r) => r.code}
            loading={loading}
            emptyIcon={BarChart3}
            emptyMessage="No expenses posted yet."
          />
        </div>
      </div>
    </div>
  );
}
