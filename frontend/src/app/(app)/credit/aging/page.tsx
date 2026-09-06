"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface AgingBucket {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90plus: number;
  total: number;
}

interface AgingRow {
  customerId: string;
  customerName: string;
  phone: string | null;
  creditLimit: number;
  currentDue: number;
  availableCredit: number;
  isOnCreditHold: boolean;
  aging: AgingBucket;
}

export default function AgingReportPage() {
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<AgingBucket>({ current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 0 });

  useEffect(() => {
    api.get<{ data: AgingRow[] }>("/api/v1/credit/aging").then((res) => {
      const data: AgingRow[] = (res as any).data ?? [];
      setRows(data);
      const t = data.reduce((acc, r) => ({
        current: acc.current + r.aging.current,
        days1_30: acc.days1_30 + r.aging.days1_30,
        days31_60: acc.days31_60 + r.aging.days31_60,
        days61_90: acc.days61_90 + r.aging.days61_90,
        days90plus: acc.days90plus + r.aging.days90plus,
        total: acc.total + r.aging.total,
      }), { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 0 });
      setTotals(t);
      setLoading(false);
    });
  }, []);

  const fmt = (n: number) => `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
  const pct = (n: number) => totals.total > 0 ? `${((n / totals.total) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AR Aging Report</h1>
        <Link href="/credit" className="text-sm text-blue-600 hover:underline">← Back to Credit</Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Current", value: totals.current, color: "bg-green-50 text-green-700" },
          { label: "1–30 Days", value: totals.days1_30, color: "bg-yellow-50 text-yellow-700" },
          { label: "31–60 Days", value: totals.days31_60, color: "bg-orange-50 text-orange-700" },
          { label: "61–90 Days", value: totals.days61_90, color: "bg-red-50 text-red-600" },
          { label: "90+ Days", value: totals.days90plus, color: "bg-red-100 text-red-800" },
        ].map((b) => (
          <div key={b.label} className={`rounded-xl p-4 ${b.color}`}>
            <div className="text-xs font-medium opacity-70">{b.label}</div>
            <div className="text-xl font-bold mt-1">{fmt(b.value)}</div>
            <div className="text-xs mt-1 opacity-60">{pct(b.value)}</div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-gray-800 text-white rounded-xl p-4 flex justify-between items-center">
        <span className="font-semibold">Total Outstanding AR</span>
        <span className="text-2xl font-bold">{fmt(totals.total)}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-right">Current</th>
              <th className="px-4 py-3 text-right">1–30</th>
              <th className="px-4 py-3 text-right">31–60</th>
              <th className="px-4 py-3 text-right">61–90</th>
              <th className="px-4 py-3 text-right">90+</th>
              <th className="px-4 py-3 text-right font-bold">Total</th>
              <th className="px-4 py-3 text-center">Hold</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No outstanding invoices</td></tr>
            ) : rows.map((r) => (
              <tr key={r.customerId} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.customerName}</div>
                  <div className="text-xs text-gray-400">{r.phone}</div>
                </td>
                <td className="px-4 py-3 text-right text-green-700">{r.aging.current > 0 ? fmt(r.aging.current) : "—"}</td>
                <td className="px-4 py-3 text-right text-yellow-700">{r.aging.days1_30 > 0 ? fmt(r.aging.days1_30) : "—"}</td>
                <td className="px-4 py-3 text-right text-orange-700">{r.aging.days31_60 > 0 ? fmt(r.aging.days31_60) : "—"}</td>
                <td className="px-4 py-3 text-right text-red-600">{r.aging.days61_90 > 0 ? fmt(r.aging.days61_90) : "—"}</td>
                <td className="px-4 py-3 text-right text-red-800 font-medium">{r.aging.days90plus > 0 ? fmt(r.aging.days90plus) : "—"}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(r.aging.total)}</td>
                <td className="px-4 py-3 text-center">
                  {r.isOnCreditHold && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Hold</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-50 font-bold text-sm">
              <tr>
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right text-green-700">{fmt(totals.current)}</td>
                <td className="px-4 py-3 text-right text-yellow-700">{fmt(totals.days1_30)}</td>
                <td className="px-4 py-3 text-right text-orange-700">{fmt(totals.days31_60)}</td>
                <td className="px-4 py-3 text-right text-red-600">{fmt(totals.days61_90)}</td>
                <td className="px-4 py-3 text-right text-red-800">{fmt(totals.days90plus)}</td>
                <td className="px-4 py-3 text-right">{fmt(totals.total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
