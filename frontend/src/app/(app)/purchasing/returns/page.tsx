"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Undo2, PackageX } from "lucide-react";
import { api } from "@/lib/api";

interface ReturnItem {
  id: string;
  qty: string;
  unitPrice: string;
  lineTotal: string;
  product: { id: string; name: string; sku: string };
}

interface PurchaseReturn {
  id: string;
  returnNo: string;
  returnDate: string;
  status: string;
  returnType: string;
  total: string;
  reason: string | null;
  supplier: { id: string; name: string };
  purchaseOrder: { id: string; poNo: string } | null;
  goodsReceipt: { id: string; grnNo: string } | null;
  items: ReturnItem[];
}

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: PurchaseReturn[] }>("/purchasing/returns");
      setReturns(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load returns");
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Returns</h1>
          <p className="mt-0.5 text-sm text-gray-500">Each return reverses stock AND the supplier payable (§10.17)</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error} <button onClick={load} className="ml-2 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : returns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <PackageX size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No purchase returns yet</p>
          <p className="mt-1 text-sm text-gray-400">Returns are created against a PO/GRN — stock and supplier ledger reverse automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <div key={ret.id} className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/40 to-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                    <Undo2 size={18} className="text-rose-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-900">{ret.returnNo}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ret.status === "RETURNED" ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-600"}`}>{ret.status}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{ret.returnType.replace("_", " ")}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {ret.supplier?.name}
                      {ret.purchaseOrder ? ` · PO ${ret.purchaseOrder.poNo}` : ""}
                      {ret.goodsReceipt ? ` · GRN ${ret.goodsReceipt.grnNo}` : ""}
                      {" · "}{new Date(ret.returnDate).toLocaleDateString()}
                    </p>
                    {ret.reason && <p className="mt-1 text-xs italic text-gray-400">&quot;{ret.reason}&quot;</p>}
                  </div>
                </div>
                <p className="text-lg font-bold tabular-nums text-rose-700">−{fmt(Number(ret.total))}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {ret.items.map((item) => (
                  <span key={item.id} className="rounded-lg bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
                    {item.product?.name} × {Number(item.qty)} @ {fmt(Number(item.unitPrice))}
                  </span>
                ))}
              </div>

              <p className="mt-3 border-t border-rose-100/60 pt-2 text-[11px] text-gray-400">
                ✓ Stock reversed via movement record · ✓ Supplier payable reduced by {fmt(Number(ret.total))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
