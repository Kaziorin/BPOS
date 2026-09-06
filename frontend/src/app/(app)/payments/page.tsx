"use client";

import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface Payment {
  id: string;
  method: string;
  amount: number;
  reference?: string | null;
  paidAt: string;
  status: string;
  customer?: { id: string; name: string } | null;
  invoice?: { id: string; invoiceNo: string } | null;
}

const METHOD_COLOR: Record<string, string> = {
  CASH: "bg-green-50 text-green-700",
  CARD: "bg-blue-50 text-blue-700",
  BANK: "bg-indigo-50 text-indigo-700",
  BKASH: "bg-pink-50 text-pink-700",
  NAGAD: "bg-orange-50 text-orange-700",
  ROCKET: "bg-purple-50 text-purple-700",
  CREDIT: "bg-red-50 text-red-600",
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  PENDING: "bg-yellow-50 text-yellow-700",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-gray-100 text-gray-500",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      // Load from POS sales payments
      const r: any = await api.get("/v1/pos/sales?limit=200");
      const sales = r.data.data ?? [];
      // Flatten payments from sales
      const allPayments: Payment[] = [];
      for (const sale of sales) {
        for (const p of sale.payments ?? []) {
          allPayments.push({ ...p, customer: sale.customer });
        }
      }
      setPayments(allPayments);
    } finally { setLoading(false); }
  }

  async function viewAllocations(paymentId: string) {
    try {
      const r: any = await api.get(`/v1/invoices/payments/${paymentId}/allocations`);
      setAllocations(r.data.data ?? []);
      setSelectedPayment(paymentId);
    } catch {
      setAllocations([]);
      setSelectedPayment(paymentId);
    }
  }

  const totalAmount = payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + Number(p.amount), 0);
  const byMethod = payments.reduce((acc, p) => {
    if (p.status === "COMPLETED") acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payment & Collection</h1>
          <p className="text-sm text-gray-500">All payment records · Allocation across invoices</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp size={15} className="text-green-600" />Total Collected</div>
          <p className="mt-1 text-2xl font-bold text-gray-900">৳{totalAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm text-gray-500">By Method</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byMethod).map(([method, amount]) => (
              <span key={method} className={`rounded-full px-2 py-0.5 text-xs font-medium ${METHOD_COLOR[method] ?? "bg-gray-100 text-gray-600"}`}>
                {method}: ৳{Number(amount).toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Allocation detail modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Payment Allocations</h2>
            {allocations.length === 0 ? (
              <p className="text-sm text-gray-400">No allocations found for this payment</p>
            ) : (
              <div className="space-y-2">
                {allocations.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-gray-700">{a.invoice?.invoiceNo}</span>
                    <span className="font-medium text-gray-900">৳{Number(a.amount).toLocaleString()}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[a.invoice?.status] ?? "bg-gray-100 text-gray-600"}`}>{a.invoice?.status}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSelectedPayment(null)} className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">Close</button>
          </div>
        </div>
      )}

      {/* Payments table */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">No payments yet</div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
              <th className="px-5 py-3">Customer</th><th className="px-5 py-3">Method</th>
              <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th><th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-600">{p.customer?.name ?? "Walk-in"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${METHOD_COLOR[p.method] ?? "bg-gray-100 text-gray-600"}`}>{p.method}</span>
                  </td>
                  <td className={`px-5 py-3 text-right font-medium ${Number(p.amount) < 0 ? "text-red-500" : "text-gray-800"}`}>
                    ৳{Number(p.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{p.reference ?? "—"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => viewAllocations(p.id)} className="text-xs text-primary-600 hover:underline">Allocations</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
