"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, FileText, ClipboardList, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface SaleSummary {
  id: string;
  invoiceNo: string;
  saleDate: string;
  total: number;
  paidTotal: number;
  dueTotal: number;
  paymentStatus: string;
  status: string;
  customer?: { name: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
  RETURNED: "bg-orange-50 text-orange-700",
  DRAFT: "bg-gray-50 text-gray-600",
};

const PAY_COLOR: Record<string, string> = {
  PAID: "bg-green-50 text-green-700",
  PARTIAL: "bg-yellow-50 text-yellow-700",
  UNPAID: "bg-red-50 text-red-700",
};

export default function SalesPage() {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/v1/pos/sales").then((r: any) => setSales(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);
  const totalPaid = sales.reduce((s, x) => s + Number(x.paidTotal), 0);
  const totalDue = sales.reduce((s, x) => s + Number(x.dueTotal), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-sm text-gray-500">POS sales, quotations & sales orders</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sales/quotations" className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <FileText size={15} /> Quotations
          </Link>
          <Link href="/sales/orders" className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ClipboardList size={15} /> Sales Orders
          </Link>
          <Link href="/pos" className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <ShoppingCart size={15} /> POS Terminal
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: totalRevenue, icon: TrendingUp, color: "text-blue-600" },
          { label: "Total Collected", value: totalPaid, icon: ShoppingCart, color: "text-green-600" },
          { label: "Total Due", value: totalDue, icon: FileText, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <s.icon size={15} className={s.color} />
              {s.label}
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              ৳{s.value.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Sales table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Recent Sales ({sales.length})</h2>
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
        ) : sales.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No sales yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Due</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-gray-700">{s.invoiceNo}</td>
                  <td className="px-5 py-3 text-gray-600">{s.customer?.name ?? "Walk-in"}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(s.saleDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-800">
                    ৳{Number(s.total).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-red-500">
                    {Number(s.dueTotal) > 0 ? `৳${Number(s.dueTotal).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAY_COLOR[s.paymentStatus] ?? "bg-gray-50 text-gray-600"}`}>
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? "bg-gray-50 text-gray-600"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/pos?sale=${s.id}`} className="text-gray-400 hover:text-gray-700">
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
