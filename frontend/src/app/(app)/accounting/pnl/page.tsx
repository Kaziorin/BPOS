"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomBreadcrumb } from "@/components/custom";
import { money } from "@/lib/format";

interface PnlRow { code: string; name: string; amount: number }
interface PnlData {
  revenue: PnlRow[]; expenses: PnlRow[];
  totalRevenue: number; totalExpenses: number; netProfit: number;
}

export default function PnlPage() {
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: PnlData }>("/accounting/pnl");
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
    <div className="w-full max-w-full space-y-4">
      <CustomBreadcrumb
        title="Profit & Loss"
        subtitle="Revenue minus expenses for the period (§10.20)"
        icon={<BarChart3 size={18} />}
        breadcrumbs={[
          { label: "Accounting", href: "/accounting/accounts" },
          { label: "Profit & Loss" },
        ]}
      />

      {error && <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className={`flex items-center justify-between rounded-sm p-6 text-white shadow-2xs ${net >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-red-600"}`}>
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
        <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-2xs">
          <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 px-5 py-4"><h2 className="font-semibold text-emerald-700">Revenue</h2></div>
          <CustomTable
            columns={[
              { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
              { key: "name", header: "Account", render: (r) => <span className="text-sm text-gray-600">{r.name}</span> },
              { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-semibold tabular-nums text-emerald-700">{money(r.amount)}</span> },
            ]}
            data={data?.revenue ?? []}
            rowKey={(r) => r.code}
            loading={loading}
            emptyIcon={BarChart3}
            emptyMessage="No revenue posted yet."
          />
        </div>
        <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-2xs">
          <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 via-white to-sky-50/50 px-5 py-4"><h2 className="font-semibold text-red-600">Expenses</h2></div>
          <CustomTable
            columns={[
              { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs text-gray-500">{r.code}</span> },
              { key: "name", header: "Account", render: (r) => <span className="text-sm text-gray-600">{r.name}</span> },
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
