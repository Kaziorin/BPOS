"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, BarChart3, Receipt } from "lucide-react";
import { api } from "@/lib/api";

interface Expense { id: string; title: string; amount: string; expenseDate: string; status: string; category?: { name: string } | null }
interface Report { total: number; count: number; byCategory: { categoryName: string; total: number; count: number }[]; expenses: Expense[] }

export default function ExpenseReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await api.get<{ data: Report }>(`/expenses/report?${params}`);
      setReport(res.data);
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const maxCat = report ? Math.max(...report.byCategory.map((c) => c.total), 1) : 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/expenses" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expense Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">Category breakdown over time (§10.18)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Apply</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : !report ? (
        <p className="text-center text-gray-400">No data</p>
      ) : (
        <>
          {/* Summary hero */}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white shadow-md">
            <div>
              <p className="text-sm text-primary-100">Total Expenses</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{fmt(report.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-100">Entries</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{report.count}</p>
            </div>
          </div>

          {/* Category bars */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><BarChart3 size={17} className="text-primary-600" /> By Category</h2>
            <div className="mt-4 space-y-3">
              {report.byCategory.sort((a, b) => b.total - a.total).map((c) => (
                <div key={c.categoryName}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{c.categoryName} <span className="text-gray-400">({c.count})</span></span>
                    <span className="font-semibold tabular-nums text-gray-900">{fmt(c.total)}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-4">
              <Receipt size={17} className="text-primary-600" />
              <h2 className="font-semibold text-gray-900">Line Items</h2>
            </div>
            <div className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
              {report.expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.title}</p>
                    <p className="text-[11px] text-gray-400">{new Date(e.expenseDate).toLocaleDateString()} · {e.category?.name ?? "—"}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-gray-900">{fmt(Number(e.amount))}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
