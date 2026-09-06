"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, ArrowLeft, ShoppingCart, Plus, CheckCircle, XCircle, PackageCheck,
  X, Truck, FileText,
} from "lucide-react";
import { api } from "@/lib/api";

interface PoItem {
  id: string;
  productId: string;
  qty: string;
  qtyReceived: string;
  qtyReturned: string;
  unitPrice: string;
  lineTotal: string;
  product: { id: string; name: string; sku: string };
}

interface PO {
  id: string;
  poNo: string;
  orderDate: string;
  expectedDate: string | null;
  status: string;
  subtotal: string;
  total: string;
  rebatePercent: string | null;
  supplier: { id: string; name: string };
  items: PoItem[];
  goodsReceipts: { id: string; grnNo: string }[];
  purchaseInvoices: { id: string; piNo: string; total: string; paidTotal: string; status: string }[];
}

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-50 text-blue-700" },
  APPROVED: { label: "Approved", cls: "bg-indigo-50 text-indigo-700" },
  PARTIALLY_RECEIVED: { label: "Partial", cls: "bg-amber-50 text-amber-700" },
  RECEIVED: { label: "Received", cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-700" },
};

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; costPrice: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // Create PO modal
  const [showPoModal, setShowPoModal] = useState(false);
  const [poSaving, setPoSaving] = useState(false);
  const [poError, setPoError] = useState<string | null>(null);
  const [poForm, setPoForm] = useState({ supplierId: "", warehouseId: "", expectedDate: "", rebatePercent: "" });
  const [poLines, setPoLines] = useState([{ productId: "", qty: "", unitPrice: "" }]);

  // Receive (GRN) modal
  const [receivePo, setReceivePo] = useState<PO | null>(null);
  const [grnSaving, setGrnSaving] = useState(false);
  const [grnError, setGrnError] = useState<string | null>(null);
  const [grnLines, setGrnLines] = useState<{ productId: string; qty: string; costPrice: string }[]>([]);

  const notify = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [poRes, supRes, prodRes, whRes] = await Promise.all([
        api.get<{ data: PO[] }>("/purchasing/orders?limit=50"),
        api.get<{ data: any[] }>("/suppliers?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any[] }>("/products?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any }>("/branches").catch(() => ({ data: { data: [] } })),
      ]);
      setPos(poRes.data);
      const sups = (supRes.data as any)?.data ?? supRes.data ?? [];
      setSuppliers(Array.isArray(sups) ? sups.map((s: any) => ({ id: s.id, name: s.name })) : []);
      const prods = (prodRes.data as any)?.data ?? prodRes.data ?? [];
      setProducts(Array.isArray(prods) ? prods : []);
      const whs = (whRes.data as any)?.data?.flatMap((b: any) => b.warehouses ?? []) ?? [];
      setWarehouses(whs);
    } catch (err: any) {
      setError(err.message || "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approvePo(id: string) {
    setBusy(id + "approve");
    try {
      await api.post(`/purchasing/orders/${id}/approve`, {});
      notify(true, "PO approved");
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally { setBusy(null); }
  }

  async function cancelPo(id: string) {
    if (!confirm("Cancel this purchase order?")) return;
    setBusy(id + "cancel");
    try {
      await api.post(`/purchasing/orders/${id}/cancel`, {});
      notify(true, "PO cancelled");
      await load();
    } catch (err: any) {
      notify(false, err.response?.data?.error || err.message);
    } finally { setBusy(null); }
  }

  function openReceive(po: PO) {
    setReceivePo(po);
    setGrnError(null);
    setGrnLines(po.items.map((i) => ({
      productId: i.productId,
      qty: String(Math.max(Number(i.qty) - Number(i.qtyReceived), 0)),
      costPrice: String(Number(i.unitPrice)),
    })));
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!receivePo) return;
    setGrnSaving(true);
    setGrnError(null);
    try {
      const items = grnLines
        .filter((l) => Number(l.qty) > 0)
        .map((l) => ({ productId: l.productId, qty: Number(l.qty), costPrice: Number(l.costPrice) }));
      if (items.length === 0) throw new Error("Enter at least one qty to receive");

      // Find branch warehouse
      const whId = warehouses[0]?.id;
      const grn = await api.post<{ data: { grnNo: string; id: string } }>("/purchasing/grns", {
        warehouseId: whId,
        supplierId: receivePo.supplier.id,
        purchaseOrderId: receivePo.id,
        items,
      });

      // Auto-create purchase invoice from the GRN
      await api.post("/purchasing/invoices", {
        branchId: undefined,
        supplierId: receivePo.supplier.id,
        purchaseOrderId: receivePo.id,
        goodsReceiptId: (grn.data as any).id,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, costPrice: i.costPrice })),
      });

      setReceivePo(null);
      notify(true, `GRN ${(grn.data as any).grnNo} received + invoice created`);
      await load();
    } catch (err: any) {
      setGrnError(err.response?.data?.error || err.message);
    } finally { setGrnSaving(false); }
  }

  async function handleCreatePo(e: React.FormEvent) {
    e.preventDefault();
    setPoSaving(true);
    setPoError(null);
    try {
      const items = poLines
        .filter((l) => l.productId && Number(l.qty) > 0)
        .map((l) => ({ productId: l.productId, qty: Number(l.qty), unitPrice: Number(l.unitPrice) }));
      if (items.length === 0) throw new Error("Add at least one item");

      await api.post("/purchasing/orders", {
        supplierId: poForm.supplierId,
        warehouseId: poForm.warehouseId || undefined,
        expectedDate: poForm.expectedDate || undefined,
        rebatePercent: poForm.rebatePercent ? Number(poForm.rebatePercent) : undefined,
        items,
      });
      setShowPoModal(false);
      setPoForm({ supplierId: "", warehouseId: "", expectedDate: "", rebatePercent: "" });
      setPoLines([{ productId: "", qty: "", unitPrice: "" }]);
      notify(true, "Purchase order created");
      await load();
    } catch (err: any) {
      setPoError(err.response?.data?.error || err.message);
    } finally { setPoSaving(false); }
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const inputCls = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/purchasing" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Orders</h1>
            <p className="mt-0.5 text-sm text-gray-500">Order → approve → partial receive → invoice (§10.17)</p>
          </div>
        </div>
        <button onClick={() => setShowPoModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
          <Plus size={16} /> New PO
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.ok ? <CheckCircle size={16} /> : <XCircle size={16} />} {toast.text}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error} <button onClick={load} className="ml-2 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gray-300" /></div>
      ) : pos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <ShoppingCart size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No purchase orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pos.map((po) => {
            const meta = STATUS[po.status] ?? STATUS.DRAFT;
            const ordered = po.items.reduce((s, i) => s + Number(i.qty), 0);
            const received = po.items.reduce((s, i) => s + Number(i.qtyReceived), 0);
            const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
            const canApprove = po.status === "SUBMITTED";
            const canReceive = ["APPROVED", "PARTIALLY_RECEIVED"].includes(po.status);
            const canCancel = ["DRAFT", "SUBMITTED", "APPROVED"].includes(po.status);
            return (
              <div key={po.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                      <Truck size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{po.poNo}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>
                        {po.rebatePercent && Number(po.rebatePercent) > 0 && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{Number(po.rebatePercent)}% rebate</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {po.supplier?.name} · {new Date(po.orderDate).toLocaleDateString()}
                        {po.expectedDate ? ` · expected ${new Date(po.expectedDate).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums text-gray-900">{fmt(Number(po.total))}</p>
                      {po.purchaseInvoices.length > 0 && (
                        <p className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
                          <FileText size={10} /> {po.purchaseInvoices.map((i) => i.piNo).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Received {received} of {ordered} units</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-gray-200"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {po.items.map((item) => {
                    const itemPct = Number(item.qty) > 0 ? Math.round((Number(item.qtyReceived) / Number(item.qty)) * 100) : 0;
                    return (
                      <span key={item.id} className={`rounded-lg px-3 py-1.5 text-xs ${itemPct === 100 ? "bg-emerald-50 text-emerald-700" : itemPct > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-600"}`}>
                        {item.product?.name ?? "Product"} · {Number(item.qtyReceived)}/{Number(item.qty)} @ {fmt(Number(item.unitPrice))}
                      </span>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
                  {canApprove && (
                    <button onClick={() => approvePo(po.id)} disabled={busy === po.id + "approve"}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                      {busy === po.id + "approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                    </button>
                  )}
                  {canReceive && (
                    <button onClick={() => openReceive(po)}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700">
                      <PackageCheck size={12} /> {po.status === "PARTIALLY_RECEIVED" ? "Receive More" : " Receive Goods"}
                    </button>
                  )}
                  {canCancel && (
                    <button onClick={() => cancelPo(po.id)} disabled={busy === po.id + "cancel"}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                      Cancel
                    </button>
                  )}
                  {po.goodsReceipts.length > 0 && (
                    <span className="text-xs text-gray-400">GRNs: {po.goodsReceipts.map((g) => g.grnNo).join(", ")}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create PO modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setShowPoModal(false)}>
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Purchase Order</h2>
              <button onClick={() => setShowPoModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {poError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{poError}</div>}

            <form onSubmit={handleCreatePo} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Supplier *</label>
                  <select value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })} className={inputCls} required>
                    <option value="">Select supplier…</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Warehouse</label>
                  <select value={poForm.warehouseId} onChange={(e) => setPoForm({ ...poForm, warehouseId: e.target.value })} className={inputCls}>
                    <option value="">Default</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expected Date</label>
                  <input type="date" value={poForm.expectedDate} onChange={(e) => setPoForm({ ...poForm, expectedDate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Supplier Rebate %</label>
                  <input type="number" step="0.5" min="0" max="100" value={poForm.rebatePercent} onChange={(e) => setPoForm({ ...poForm, rebatePercent: e.target.value })} className={inputCls} placeholder="2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</label>
                  <button type="button" onClick={() => setPoLines([...poLines, { productId: "", qty: "", unitPrice: "" }])}
                    className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"><Plus size={12} /> Add item</button>
                </div>
                <div className="mt-2 space-y-2">
                  {poLines.map((line, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={line.productId} onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value);
                        setPoLines(poLines.map((l, j) => j === i ? { ...l, productId: e.target.value, unitPrice: prod ? String(Number(prod.costPrice)) : l.unitPrice } : l));
                      }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select product…</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                      <input type="number" min="1" value={line.qty} onChange={(e) => setPoLines(poLines.map((l, j) => j === i ? { ...l, qty: e.target.value } : l))}
                        className="w-24 rounded-lg border border-gray-300 px-2.5 py-2 text-sm tabular-nums" placeholder="Qty" />
                      <input type="number" min="0" value={line.unitPrice} onChange={(e) => setPoLines(poLines.map((l, j) => j === i ? { ...l, unitPrice: e.target.value } : l))}
                        className="w-28 rounded-lg border border-gray-300 px-2.5 py-2 text-sm tabular-nums" placeholder="৳/unit" />
                      {poLines.length > 1 && (
                        <button type="button" onClick={() => setPoLines(poLines.filter((_, j) => j !== i))}
                          className="rounded p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-500"><X size={13} /></button>
                      )}
                    </div>
                  ))}
                </div>
                {poLines.filter((l) => l.productId && l.qty && l.unitPrice).length > 0 && (
                  <p className="mt-2 text-right text-sm font-semibold text-gray-700">
                    Total: {fmt(poLines.filter((l) => l.productId && l.qty && l.unitPrice).reduce((s, l) => s + Number(l.qty) * Number(l.unitPrice) * (1 - (Number(poForm.rebatePercent) || 0) / 100), 0))}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowPoModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={poSaving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {poSaving && <Loader2 size={15} className="animate-spin" />} Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive (GRN) modal */}
      {receivePo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setReceivePo(null)}>
          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Receive Goods — {receivePo.poNo}</h2>
                <p className="text-xs text-gray-500">{receivePo.supplier.name} · partial receiving supported</p>
              </div>
              <button onClick={() => setReceivePo(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {grnError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{grnError}</div>}

            <form onSubmit={handleReceive} className="mt-5 space-y-4">
              <div className="space-y-2">
                {grnLines.map((line, i) => {
                  const poItem = receivePo.items.find((it) => it.productId === line.productId);
                  const outstanding = poItem ? Number(poItem.qty) - Number(poItem.qtyReceived) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{poItem?.product?.name ?? "Item"}</p>
                        <p className="text-[11px] text-gray-400">Ordered {Number(poItem?.qty ?? 0)} · already received {Number(poItem?.qtyReceived ?? 0)} · outstanding {outstanding}</p>
                      </div>
                      <input type="number" min="0" max={outstanding} value={line.qty}
                        onChange={(e) => setGrnLines(grnLines.map((l, j) => j === i ? { ...l, qty: e.target.value } : l))}
                        className="w-24 rounded-lg border border-gray-300 px-2.5 py-2 text-sm tabular-nums" />
                      <input type="number" min="0" value={line.costPrice}
                        onChange={(e) => setGrnLines(grnLines.map((l, j) => j === i ? { ...l, costPrice: e.target.value } : l))}
                        className="w-28 rounded-lg border border-gray-300 px-2.5 py-2 text-sm tabular-nums" />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">Stock increases via the Inventory Engine; a purchase invoice is auto-created from this GRN.</p>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setReceivePo(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={grnSaving} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                  {grnSaving && <Loader2 size={15} className="animate-spin" />} <PackageCheck size={15} /> Receive + Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
