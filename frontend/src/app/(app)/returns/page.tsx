"use client";

import { useEffect, useState, useCallback } from "react";
import { RotateCcw, Plus, CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { api } from "@/lib/api";
import { CustomTable, CustomBadge } from "@/components/custom";
import { money, dateTime } from "@/lib/format";

interface ReturnItem { id: string; productName: string; qty: number; unitPrice: number; lineTotal: number; itemCondition: string }
interface Return {
  id: string; returnNo: string; returnType: string; returnReason: string | null;
  refundAmount: number; restocked: boolean; status: string; reason: string | null;
  createdAt: string; items: ReturnItem[];
  sale?: { id: string; invoiceNo: string } | null;
  customer?: { name: string } | null;
}

const STATUS_TONE: Record<string, "green" | "amber" | "gray" | "red" | "primary"> = {
  COMPLETED: "green", APPROVED: "primary", REQUESTED: "amber", REJECTED: "red",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Return[] }>("/returns?limit=100");
      setReturns(res.data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-rose-600 p-6 text-white shadow-md">
        <div>
          <p className="flex items-center gap-2 text-sm text-red-100"><RotateCcw size={15} /> Returns & Refunds</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Return Management</h1>
          <p className="mt-1 text-sm text-red-200">§10.22 — Full return flow with stock, accounting, commission, loyalty reversal</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium ring-1 ring-white/20 transition hover:bg-white/20 sm:inline-flex">
          <Plus size={15} /> New Return
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Returns" value={returns.length} icon={RotateCcw} />
        <StatCard label="Completed" value={returns.filter((r) => r.status === "COMPLETED").length} icon={CheckCircle2} tone="green" />
        <StatCard label="Pending" value={returns.filter((r) => r.status === "REQUESTED").length} icon={Clock} tone="amber" />
        <StatCard label="Total Refunded" value={money(returns.reduce((s, r) => s + (r.refundAmount || 0), 0))} icon={Package} tone="red" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <CustomTable
          columns={[
            { key: "no", header: "Return #", render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.returnNo}</span> },
            { key: "sale", header: "Sale", render: (r) => <span className="text-sm text-gray-600">{r.sale?.invoiceNo || "—"}</span> },
            { key: "customer", header: "Customer", render: (r) => <span className="text-sm text-gray-600">{r.customer?.name || "—"}</span> },
            { key: "type", header: "Type", render: (r) => <span className="text-xs uppercase text-gray-400">{r.returnType}</span> },
            { key: "reason", header: "Reason", render: (r) => <span className="text-sm text-gray-500">{r.returnReason || r.reason || "—"}</span> },
            { key: "items", header: "Items", align: "center", render: (r) => <span className="text-sm font-medium">{r.items?.length || 0}</span> },
            { key: "amount", header: "Refund", align: "right", render: (r) => <span className="font-semibold tabular-nums text-red-600">{money(r.refundAmount)}</span> },
            { key: "status", header: "Status", render: (r) => <CustomBadge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</CustomBadge> },
            { key: "date", header: "Date", render: (r) => <span className="text-xs text-gray-500">{dateTime(r.createdAt)}</span> },
          ]}
          data={returns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyIcon={RotateCcw}
          emptyMessage="No returns yet."
        />
      </div>

      {showForm && <ReturnForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = "primary" }: { label: string; value: string | number; icon: any; tone?: string }) {
  const tones: Record<string, string> = {
    primary: "bg-primary-50 text-primary-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`mb-2 inline-flex rounded-xl p-2 ${tones[tone]}`}><Icon size={16} /></div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

function ReturnForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saleId, setSaleId] = useState("");
  const [refundMethod, setRefundMethod] = useState("CASH");
  const [returnReason, setReturnReason] = useState("DEFECTIVE");
  const [reason, setReason] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: any[] }>("/pos/sales?limit=50").then((r) => setSales(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!saleId) { setError("Select a sale"); return; }
    setSaving(true); setError("");
    try {
      await api.post("/returns", { saleId, refundMethod, returnReason, reason });
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">Process Return</h3>
        <p className="text-sm text-gray-500 mt-1">Full return flow: stock + accounting + commission + loyalty reversal</p>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale *</label>
            <select value={saleId} onChange={(e) => setSaleId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select sale to return</option>
              {sales.map((s) => <option key={s.id} value={s.id}>{s.invoiceNo} — {money(s.total)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="DEFECTIVE">Defective</option>
                <option value="WRONG_ITEM">Wrong Item</option>
                <option value="NOT_AS_DESCRIBED">Not as Described</option>
                <option value="CHANGE_OF_MIND">Change of Mind</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
              <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank Transfer</option>
                <option value="STORE_CREDIT">Store Credit</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2} placeholder="Additional notes..." />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {saving ? "Processing..." : "Process Return"}
          </button>
        </div>
      </div>
    </div>
  );
}
