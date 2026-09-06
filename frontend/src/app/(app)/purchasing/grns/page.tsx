"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, PackageCheck, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface GrnItem {
  id: string;
  qty: string;
  qtyRejected: string;
  costPrice: string;
  batchNo: string | null;
  product: { id: string; name: string; sku: string };
}

interface GRN {
  id: string;
  grnNo: string;
  receivedDate: string;
  status: string;
  note: string | null;
  supplier: { id: string; name: string };
  warehouse: { id: string; name: string; code: string };
  purchaseOrder: { id: string; poNo: string } | null;
  items: GrnItem[];
}

export default function GrnsPage() {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: GRN[] }>("/purchasing/grns?limit=50");
      setGrns(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/purchasing" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Goods Received Notes</h1>
          <p className="mt-0.5 text-sm text-gray-500">Every receipt increases stock through the Inventory Engine (§10.17)</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error} <button onClick={load} className="ml-2 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : grns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <PackageCheck size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No goods received yet</p>
          <p className="mt-1 text-sm text-gray-400">Receive goods from an approved purchase order.</p>
          <Link href="/purchasing/orders" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">Go to Purchase Orders →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {grns.map((grn) => {
            const total = grn.items.reduce((s, i) => s + Number(i.qty) * Number(i.costPrice), 0);
            const rejected = grn.items.reduce((s, i) => s + Number(i.qtyRejected), 0);
            return (
              <div key={grn.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                      <PackageCheck size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{grn.grnNo}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${grn.status === "RECEIVED" ? "bg-emerald-50 text-emerald-700" : grn.status === "CANCELLED" ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-600"}`}>
                          {grn.status}
                        </span>
                        {grn.purchaseOrder && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">PO {grn.purchaseOrder.poNo}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {grn.supplier?.name} → {grn.warehouse?.name} · {new Date(grn.receivedDate).toLocaleDateString()}
                        {rejected > 0 && <span className="text-rose-500"> · {rejected} rejected</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-gray-900">{fmt(total)}</p>
                    <p className="text-[10px] text-gray-400">{grn.items.length} line{grn.items.length > 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {grn.items.map((item) => (
                    <span key={item.id} className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                      <CheckCircle size={10} className="mr-1 inline text-emerald-500" />
                      {item.product?.name} × {Number(item.qty)} @ {fmt(Number(item.costPrice))}
                      {item.batchNo && <span className="ml-1 text-gray-400">(batch {item.batchNo})</span>}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
