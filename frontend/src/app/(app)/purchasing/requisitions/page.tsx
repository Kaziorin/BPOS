"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, ClipboardList, Plus, Send, CheckCircle, XCircle, ShoppingCart, X } from "lucide-react";
import { api } from "@/lib/api";

interface ReqItem {
  id: string;
  productId: string;
  qty: string;
  estUnitPrice: string;
  product: { id: string; name: string; sku: string };
}

interface Requisition {
  id: string;
  prNo: string;
  requestDate: string;
  expectedDate: string | null;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  rejectionReason: string | null;
  note: string | null;
  items: ReqItem[];
  purchaseOrders: { id: string; poNo: string; total: string }[];
}

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-50 text-blue-700" },
  APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Rejected", cls: "bg-rose-50 text-rose-700" },
  CONVERTED: { label: "Converted → PO", cls: "bg-violet-50 text-violet-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-100 text-gray-500" },
};

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; costPrice: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const [form, setForm] = useState({ warehouseId: "", expectedDate: "", note: "" });
  const [lines, setLines] = useState([{ productId: "", qty: "", estUnitPrice: "" }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, prodRes, whRes] = await Promise.all([
        api.get<{ data: Requisition[] }>("/purchasing/requisitions?limit=50"),
        api.get<{ data: any[] }>("/products?limit=100").catch(() => ({ data: [] as any[] })),
        api.get<{ data: any }>("/branches").catch(() => ({ data: { data: [] } })),
      ]);
      setRequisitions(reqRes.data);
      const prods = (prodRes.data as any)?.data ?? prodRes.data ?? [];
      setProducts(Array.isArray(prods) ? prods : []);
      const whs = (whRes.data as any)?.data?.flatMap((b: any) => b.warehouses ?? []) ?? [];
      setWarehouses(whs);
    } catch (err: any) {
      setError(err.message || "Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "submit" | "approve", label: string) {
    setBusy(id + action);
    try {
      await api.post(`/purchasing/requisitions/${id}/${action}`, {});
      setToast({ ok: true, text: label });
      await load();
    } catch (err: any) {
      setToast({ ok: false, text: err.response?.data?.error || err.message });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      await api.post("/purchasing/requisitions", {
        warehouseId: form.warehouseId || undefined,
        expectedDate: form.expectedDate || undefined,
        note: form.note || undefined,
        items: lines
          .filter((l) => l.productId && Number(l.qty) > 0)
          .map((l) => ({ productId: l.productId, qty: Number(l.qty), estUnitPrice: Number(l.estUnitPrice) || 0 })),
      });
      setShowModal(false);
      setForm({ warehouseId: "", expectedDate: "", note: "" });
      setLines([{ productId: "", qty: "", estUnitPrice: "" }]);
      await load();
    } catch (err: any) {
      setModalError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const inputCls = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/purchasing" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Requisitions</h1>
            <p className="mt-0.5 text-sm text-gray-500">Internal requests → approval → purchase order (§10.17)</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
          <Plus size={16} /> New Requisition
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
      ) : requisitions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <ClipboardList size={44} className="mx-auto text-gray-300" />
          <p className="mt-4 font-medium text-gray-500">No requisitions yet</p>
          <p className="mt-1 text-sm text-gray-400">Create an internal purchase request, get it approved, then convert to a PO.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requisitions.map((req) => {
            const meta = STATUS[req.status] ?? STATUS.DRAFT;
            const items = Array.isArray(req.items) ? req.items : [];
            const purchaseOrders = Array.isArray(req.purchaseOrders) ? req.purchaseOrders : [];
            const total = items.reduce((s, i) => s + Number(i.qty) * Number(i.estUnitPrice), 0);
            return (
              <div key={req.id} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <ClipboardList size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{req.prNo}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(req.requestDate).toLocaleDateString()} · {items.length} item{items.length > 1 ? "s" : ""} · est. {fmt(total)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === "DRAFT" && (
                      <button onClick={() => act(req.id, "submit", "Requisition submitted")} disabled={busy === req.id + "submit"}
                        className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                        {busy === req.id + "submit" ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
                      </button>
                    )}
                    {req.status === "SUBMITTED" && (
                      <button onClick={() => act(req.id, "approve", "Requisition approved")} disabled={busy === req.id + "approve"}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                        {busy === req.id + "approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Approve
                      </button>
                    )}
                    {req.status === "APPROVED" && (
                      <Link href="/purchasing/orders"
                        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700">
                        <ShoppingCart size={12} /> Create PO
                      </Link>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span key={item.id} className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                      {item.product?.name ?? "Product"} × <strong>{Number(item.qty)}</strong>
                    </span>
                  ))}
                </div>

                {/* Linked POs / rejection */}
                {purchaseOrders.length > 0 && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-violet-600">
                    <ShoppingCart size={12} /> Converted: {purchaseOrders.map((p) => p.poNo).join(", ")}
                  </p>
                )}
                {req.rejectionReason && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-600">
                    <XCircle size={12} /> {req.rejectionReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Purchase Requisition</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {modalError && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{modalError}</div>}

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Warehouse</label>
                  <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className={inputCls}>
                    <option value="">Default</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expected Date</label>
                  <input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Items</label>
                  <button type="button" onClick={() => setLines([...lines, { productId: "", qty: "", estUnitPrice: "" }])}
                    className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={line.productId} onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value);
                        setLines(lines.map((l, j) => j === i ? { ...l, productId: e.target.value, estUnitPrice: prod ? String(Number(prod.costPrice)) : l.estUnitPrice } : l));
                      }} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select product…</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                      <input type="number" min="1" value={line.qty} onChange={(e) => setLines(lines.map((l, j) => j === i ? { ...l, qty: e.target.value } : l))}
                        className="w-24 rounded-lg border border-gray-300 px-2.5 py-2 text-sm tabular-nums" placeholder="Qty" />
                      <input type="number" min="0" value={line.estUnitPrice} onChange={(e) => setLines(lines.map((l, j) => j === i ? { ...l, estUnitPrice: e.target.value } : l))}
                        className="w-28 rounded-lg border border-gray-300 px-2.5 py-2 text-sm tabular-nums" placeholder="৳/unit" />
                      {lines.length > 1 && (
                        <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))}
                          className="rounded p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-500"><X size={13} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} placeholder="Why is this purchase needed?" />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving && <Loader2 size={15} className="animate-spin" />} Create Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
